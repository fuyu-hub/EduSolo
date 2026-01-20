/**
 * Módulo para Classificação de Solos segundo o Sistema HRB/AASHTO
 * Utilizado para classificação de solos para pavimentação
 * 
 * Referências:
 * - AASHTO M 145
 */

import type { ClassificacaoHRBInput, ClassificacaoHRBOutput } from '../schemas';

const EPSILON = 1e-9;

export function classificarHRB(dados: ClassificacaoHRBInput): ClassificacaoHRBOutput {
  try {
    const p200 = dados.pass_peneira_200;
    const p40 = dados.pass_peneira_40;
    const p10 = dados.pass_peneira_10;
    // Tratar campos vazios de LL/LP como 0 automaticamente
    // para evitar classificação imprecisa (A-2 sem subgrupo) quando o usuário
    // esquece de digitar "0" em um solo não plástico
    const ll = dados.ll ?? 0;
    const ip = dados.ip ?? 0;

    // Validações
    if (p200 < 0 || p200 > 100) {
      throw new Error('% passando na #200 deve estar entre 0 e 100.');
    }
    if (ll < 0) {
      throw new Error('LL não pode ser negativo.');
    }
    if (ip < 0) {
      throw new Error('IP não pode ser negativo.');
    }

    // Determina o grupo principal
    const [grupo, subgrupo] = determinarGrupoHRB(p200, p40, p10, ll, ip);

    // Calcula o Índice de Grupo (IG) após determinar o grupo
    const ig = calcularIndiceGrupo(grupo, subgrupo, p200, ll, ip);

    // Monta a classificação completa
    let classificacao = subgrupo ? `${grupo}-${subgrupo}` : grupo;

    // Adiciona o índice de grupo se aplicável
    if (ig > 0) {
      classificacao += ` (${ig})`;
    }

    // Obtém a descrição do grupo
    const descricao = obterDescricaoHRB(grupo, subgrupo);

    // Obtém avaliação como subleito
    const avaliacao_subleito = obterAvaliacaoSubleito(grupo);

    return {
      classificacao,
      grupo_principal: grupo,
      subgrupo,
      indice_grupo: ig,
      descricao,
      avaliacao_subleito,
    };
  } catch (error) {
    return {
      erro: error instanceof Error ? error.message : 'Erro na classificação',
    };
  }
}

function determinarGrupoHRB(
  p200: number,
  p40: number | undefined,
  p10: number | undefined,
  ll: number,
  ip: number
): [string, string | undefined] {
  // MATERIAIS GRANULARES (≤ 35% passando na #200)
  if (p200 <= 35) {
    // A-1-a
    if (
      ip <= 6 &&
      p200 <= 15 &&
      p40 !== undefined && p40 <= 30 &&
      p10 !== undefined && p10 <= 50
    ) {
      return ['A-1', 'a'];
    }
    // A-1-b (sem requisito de P#10)
    else if (
      ip <= 6 &&
      p200 <= 25 &&
      p40 !== undefined && p40 <= 50
    ) {
      return ['A-1', 'b'];
    }
    // A-3 (sem requisito de P#10)
    else if (
      p40 !== undefined && p40 > 50 &&
      p200 <= 10 &&
      ip === 0
    ) {
      return ['A-3', undefined];
    }
    // A-2
    else {
      // LL e IP agora são sempre definidos (0 se vazios)
      if (ll <= 40) {
        return ip <= 10 ? ['A-2', '4'] : ['A-2', '6'];
      } else {
        return ip <= 10 ? ['A-2', '5'] : ['A-2', '7'];
      }
    }
  }

  // MATERIAIS SILTO-ARGILOSOS (> 35% passando na #200)
  // LL e IP agora são sempre definidos (0 se vazios)
  else {
    if (ll <= 40 && ip <= 10) {
      return ['A-4', undefined];
    } else if (ll > 40 && ip <= 10) {
      return ['A-5', undefined];
    } else if (ll <= 40 && ip > 10) {
      return ['A-6', undefined];
    } else {
      return ip <= ll - 30 ? ['A-7', '5'] : ['A-7', '6'];
    }
  }
}

function calcularIndiceGrupo(
  grupo: string,
  subgrupo: string | undefined,
  p200: number,
  ll: number,
  ip: number
): number {
  // IG é sempre 0 para A-1-a, A-1-b e A-3
  if (grupo === 'A-1' || grupo === 'A-3') {
    return 0;
  }

  // Fórmula geral
  let ig = (p200 - 35) * (0.2 + 0.005 * (ll - 40)) + 0.01 * (p200 - 15) * (ip - 10);

  // Para A-2-4 e A-2-5, somente a parcela do IP é usada
  if (grupo === 'A-2' && (subgrupo === '4' || subgrupo === '5')) {
    ig = 0.01 * (p200 - 15) * (ip - 10);
  }

  // IG não pode ser negativo
  if (ig < 0) {
    return 0;
  }

  // Arredondar para o inteiro mais próximo
  return Math.round(ig);
}

function obterDescricaoHRB(grupo: string, subgrupo: string | undefined): string {
  const descricoes: Record<string, string> = {
    'A-1': 'Misturas bem graduadas de fragmentos de pedra, pedregulho e areia',
    'A-2': 'Materiais granulares com teor de silte e argila',
    'A-3': 'Areia fina de praia ou dunas, sem finos plásticos',
    'A-4': 'Solos siltosos pouco ou nada plásticos',
    'A-5': 'Solos siltosos com alta compressibilidade',
    'A-6': 'Solos argilosos plásticos',
    'A-7': 'Solos argilosos altamente plásticos',
  };

  const subgrupo_desc: Record<string, string> = {
    a: ' (predominantemente pedregulho)',
    b: ' (predominantemente areia)',
    '4': ' (características siltosas)',
    '5': ' (características siltosas, alta compressibilidade)',
    '6': ' (características argilosas)',
    '7': ' (características argilosas, alta plasticidade)',
  };

  let desc = descricoes[grupo] || 'Material não classificado';

  if (subgrupo) {
    desc += subgrupo_desc[subgrupo] || '';
  }

  return desc;
}

function obterAvaliacaoSubleito(grupo: string): string {
  const avaliacoes: Record<string, string> = {
    'A-1': 'Excelente a Bom',
    'A-2': 'Bom a Regular',
    'A-3': 'Regular',
    'A-4': 'Regular a Pobre',
    'A-5': 'Pobre',
    'A-6': 'Regular a Pobre',
    'A-7': 'Pobre a Muito Pobre',
  };

  return avaliacoes[grupo] || 'Não avaliado';
}

