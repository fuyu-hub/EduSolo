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
  // Descrições específicas para grupos/subgrupos combinados (A-2-4, A-2-5, etc.)
  // Quando houver subgrupo numérico (4, 5, 6, 7), a descrição é específica da combinação
  if (grupo === 'A-2' && subgrupo) {
    const descricoesA2: Record<string, string> = {
      '4': 'Materiais comuns constituintes: Pedregulho ou areia siltosa (Baixa plasticidade)',
      '5': 'Materiais comuns constituintes: Pedregulho ou areia siltosa elástica (Siltes micáceos ou diatomáceos)',
      '6': 'Materiais comuns constituintes: Pedregulho ou areia argilosa (Argila plástica)',
      '7': 'Materiais comuns constituintes: Pedregulho ou areia argilosa (Argila muito plástica/elástica)',
    };
    if (descricoesA2[subgrupo]) return descricoesA2[subgrupo];
  }

  if (grupo === 'A-7' && subgrupo) {
    const descricoesA7: Record<string, string> = {
      '5': 'Materiais comuns constituintes: Argilas elásticas (sujeitas a alta compressibilidade)',
      '6': 'Materiais comuns constituintes: Argilas muito plásticas (sujeitas a grande variação volumétrica)',
    };
    if (descricoesA7[subgrupo]) return descricoesA7[subgrupo];
  }

  // Descrições gerais para os grupos principais
  const descricoes: Record<string, string> = {
    'A-1': 'Materiais comuns constituintes: Misturas bem graduadas de fragmentos de pedra, pedregulho e areia',
    'A-3': 'Materiais comuns constituintes: Areia fina (limpa, de praia ou duna) ou mistura de areia fina com pequena quantidade de silte não plástico',
    'A-2': 'Materiais comuns constituintes: Solos granulares "sujos" (contendo silte ou argila)', // Fallback se não tiver subgrupo (raro)
    'A-4': 'Materiais comuns constituintes: Solos siltosos (Pouca ou nenhuma plasticidade)',
    'A-5': 'Materiais comuns constituintes: Solos siltosos elásticos (Alta compressibilidade, geralmente micáceos)',
    'A-6': 'Materiais comuns constituintes: Solos argilosos (Plasticidade média a alta, argilas plásticas)',
    'A-7': 'Materiais comuns constituintes: Solos argilosos (Alta plasticidade e/ou elasticidade)', // Fallback se não tiver subgrupo
  };

  // Sufixos descritivos para A-1 (a, b)
  const subgrupo_desc_A1: Record<string, string> = {
    'a': ': Predominância de fragmentos de pedra ou pedregulho',
    'b': ': Predominância de areia grossa',
  };

  let desc = descricoes[grupo] || 'Material não classificado';

  if (grupo === 'A-1' && subgrupo && subgrupo_desc_A1[subgrupo]) {
    desc += subgrupo_desc_A1[subgrupo];
  }

  return desc;
}

function obterAvaliacaoSubleito(grupo: string): string {
  const avaliacoes: Record<string, string> = {
    'A-1': 'Excelente a Bom',
    'A-2': 'Excelente a Bom', // A-2 também é considerado Excelente a Bom na maioria das tabelas resumidas de Mat. Granulares, mas o usuário pediu para seguir o texto dele? 
    // O usuário disse: "1. Materiais Granulares ... Comportamento geral como subleito: Excelente a Bom."
    // A-2 está dentro de Materiais Granulares.
    // Mas no texto detalhado do IG diz: "0: Subleito Bom (típico de ... A-2-4)"
    // Vamos manter "Excelente a Bom" para todo o grupo de Materiais Granulares (A-1, A-3, A-2) conforme o cabeçalho do item 1 do prompt.
    'A-3': 'Excelente a Bom',
    'A-4': 'Regular a Fraco', // Item 2 do prompt: "Regular a Fraco" para Materiais Silto-Argilosos
    'A-5': 'Regular a Fraco',
    'A-6': 'Regular a Fraco',
    'A-7': 'Regular a Fraco',
  };

  return avaliacoes[grupo] || 'Não avaliado';
}

