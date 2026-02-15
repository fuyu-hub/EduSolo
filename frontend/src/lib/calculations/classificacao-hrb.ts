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
    const avaliacao_subleito = obterAvaliacaoSubleito(grupo, subgrupo);

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
    // 1. Tentar A-1-a
    if (
      (p10 === undefined || p10 <= 50) &&
      (p40 === undefined || p40 <= 30) &&
      p200 <= 15 &&
      ip <= 6
    ) {
      return ['A-1', 'a'];
    }

    // 2. Tentar A-1-b
    if (
      (p40 === undefined || p40 <= 50) &&
      p200 <= 25 &&
      ip <= 6
    ) {
      return ['A-1', 'b'];
    }

    // 3. Tentar A-3 (Conforme Nota 4, ele vem antes do A-2)
    if (
      (p40 !== undefined && p40 > 50) &&
      p200 <= 10 &&
      ip === 0
    ) {
      return ['A-3', undefined];
    }

    // 4. Se não for nenhum dos acima, DEVE ser A-2 (pois P200 <= 35)
    if (ll <= 40) {
      return ip <= 10 ? ['A-2', '4'] : ['A-2', '6'];
    } else {
      return ip <= 10 ? ['A-2', '5'] : ['A-2', '7'];
    }
  }

  // MATERIAIS SILTO-ARGILOSOS (> 35% passando na #200)
  // Leitura da esquerda para a direita
  else {
    // 1. Tentar A-4
    if (ll <= 40 && ip <= 10) {
      return ['A-4', undefined];
    }

    // 2. Tentar A-5
    if (ll > 40 && ip <= 10) {
      return ['A-5', undefined];
    }

    // 3. Tentar A-6
    if (ll <= 40 && ip > 10) {
      return ['A-6', undefined];
    }

    // 4. Deve ser A-7 (P200 > 35, LL > 40, IP > 10)
    // Nota 3: Subgrupos do A-7
    if (ip < ll - 30) {
      return ['A-7', '5'];
    } else {
      return ['A-7', '6'];
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
  // A-1
  if (grupo === 'A-1') {
    if (subgrupo === 'a') return 'Fragmentos de rocha ou pedregulho, com ou sem ligante fino bem graduado.';
    if (subgrupo === 'b') return 'Predominância de areia grossa, com ou sem ligante de solo bem graduado.';
    return 'Materiais granulares bem graduados.';
  }

  // A-3
  if (grupo === 'A-3') {
    return 'Areia fina sem finos siltosos/argilosos ou com uma quantidade muito pequena de finos.';
  }

  // A-2
  if (grupo === 'A-2') {
    if (subgrupo === '4') return 'Pedregulhos e areias com finos siltosos ou pouco plásticos (apresentam características dos grupos A-4 e A-5).';
    if (subgrupo === '5') return 'Pedregulhos e areias com finos siltosos ou pouco plásticos (apresentam características dos grupos A-4 e A-5).';
    if (subgrupo === '6') return 'Pedregulhos e areias com finos argilosos ou moderadamente plásticos (apresentam características dos grupos A-6 e A-7).';
    if (subgrupo === '7') return 'Pedregulhos e areias com finos argilosos ou moderadamente plásticos (apresentam características dos grupos A-6 e A-7).';
    return 'Pedregulhos e areias com conteúdo de siltes e argilas.';
  }

  // A-4
  if (grupo === 'A-4') {
    return 'Solo siltoso, moderadamente ou nada plástico. Geralmente com mais de 75% de finos.';
  }

  // A-5
  if (grupo === 'A-5') {
    return 'Solo siltoso, de caráter diatomáceo ou micáceo e pode ser altamente elástico ("borrachudo"), como indicado pelo alto LL.';
  }

  // A-6
  if (grupo === 'A-6') {
    return 'Solo argiloso plástico. Geralmente apresentam alta variação de volume entre os estados úmido e seco.';
  }

  // A-7
  if (grupo === 'A-7') {
    if (subgrupo === '5') return 'Solo argiloso elástico ("borrachudo"). Índice de plasticidade moderado, mas alta elasticidade.';
    if (subgrupo === '6') return 'Solo argiloso muito plástico. Sujeitos à altíssima variação de volume.';
    return 'Solo argiloso plástico ou elástico.';
  }

  return 'Material não classificado';
}

function obterAvaliacaoSubleito(grupo: string, subgrupo: string | undefined): string {
  // Materiais Granulares (Excelente a Bom)
  // A-1-a, A-1-b, A-3
  if (grupo === 'A-1' || grupo === 'A-3') {
    return 'Excelente a Bom';
  }

  // A-2
  if (grupo === 'A-2') {
    // A-2-4 e A-2-5 são Excelente a Bom
    if (subgrupo === '4' || subgrupo === '5') {
      return 'Excelente a Bom';
    }
    // A-2-6 e A-2-7 e qualquer outro caso são Regular a Mau
    return 'Regular a Mau';
  }

  // Materiais Silto-Argilosos (Regular a Mau)
  // A-4, A-5, A-6, A-7
  return 'Regular a Mau';
}

