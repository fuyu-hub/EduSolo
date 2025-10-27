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
    const ll = dados.ll;
    const ip = dados.ip;

    // Validações
    if (p200 < 0 || p200 > 100) {
      throw new Error('% passando na #200 deve estar entre 0 e 100.');
    }
    if (ll !== undefined && ll < 0) {
      throw new Error('LL não pode ser negativo.');
    }
    if (ip !== undefined && ip < 0) {
      throw new Error('IP não pode ser negativo.');
    }

    // Determina o grupo principal
    const [grupo, subgrupo] = determinarGrupoHRB(p200, p40, p10, ll, ip);

    // Calcula o Índice de Grupo (IG)
    const ig = calcularIndiceGrupo(p200, ll, ip);

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
  ll: number | undefined,
  ip: number | undefined
): [string, string | undefined] {
  // MATERIAIS GRANULARES (≤ 35% passando na #200)
  if (p200 <= 35) {
    // Grupo A-1
    if (p200 <= 15) {
      if (p40 !== undefined && p40 <= 50) {
        return ['A-1', 'a'];
      } else if (p40 !== undefined && p40 > 50) {
        return ['A-1', 'b'];
      } else {
        return ['A-1', undefined];
      }
    }

    // Grupo A-3 (areia fina)
    if (p200 <= 10) {
      if (ll !== undefined && ll <= 40) {
        if (ip === undefined || ip <= 10) {
          if (p40 !== undefined && p40 > 51) {
            return ['A-3', undefined];
          }
        }
      }
    }

    // Grupo A-2 (materiais granulares siltosos ou argilosos)
    if (ll !== undefined && ip !== undefined) {
      if (ll <= 40) {
        if (ip <= 10) {
          return ['A-2', '4'];
        } else {
          return ['A-2', '6'];
        }
      } else {
        // LL > 40
        if (ip <= 10) {
          return ['A-2', '5'];
        } else {
          return ['A-2', '7'];
        }
      }
    }

    // Se não tem LL e IP, assume A-2-4 como padrão para granulares com finos
    if (p200 > 15) {
      return ['A-2', '4'];
    }

    // Padrão para granulares
    return ['A-1', undefined];
  }

  // MATERIAIS SILTO-ARGILOSOS (> 35% passando na #200)
  else {
    if (ll === undefined || ip === undefined) {
      throw new Error('LL e IP são necessários para classificar solos com mais de 35% de finos.');
    }

    // Grupo A-7 (solos argilosos)
    if (ll > 40 && ip > 10) {
      // A-7-5 se IP ≤ LL - 30
      // A-7-6 se IP > LL - 30
      if (ip <= ll - 30) {
        return ['A-7', '5'];
      } else {
        return ['A-7', '6'];
      }
    }

    // Grupo A-6 (solos argilosos)
    if (ll <= 40 && ip > 10) {
      return ['A-6', undefined];
    }

    // Grupo A-5 (solos siltosos)
    if (ll > 40 && ip <= 10) {
      return ['A-5', undefined];
    }

    // Grupo A-4 (solos siltosos)
    if (ll <= 40 && ip <= 10) {
      return ['A-4', undefined];
    }

    // Fallback
    return ['A-4', undefined];
  }
}

function calcularIndiceGrupo(
  p200: number,
  ll: number | undefined,
  ip: number | undefined
): number {
  // IG só é calculado para solos com mais de 35% de finos
  if (p200 <= 35) {
    return 0;
  }

  // Se não temos LL ou IP, não podemos calcular IG
  if (ll === undefined || ip === undefined) {
    return 0;
  }

  // Primeira parcela: (F - 35)[0.2 + 0.005(LL - 40)]
  let parcela1 = 0.0;
  if (p200 > 35 && ll > 40) {
    parcela1 = (p200 - 35) * (0.2 + 0.005 * (ll - 40));
    parcela1 = Math.min(parcela1, 4.0); // Máximo de 4
  }

  // Segunda parcela: 0.01(F - 15)(IP - 10)
  let parcela2 = 0.0;
  if (p200 > 15 && ip > 10) {
    parcela2 = 0.01 * (p200 - 15) * (ip - 10);
    parcela2 = Math.min(parcela2, 4.0); // Máximo de 4
  }

  let ig_total = parcela1 + parcela2;

  // IG não pode ser negativo
  if (ig_total < 0) {
    ig_total = 0;
  }

  // Arredondar para o inteiro mais próximo
  return Math.round(ig_total);
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

