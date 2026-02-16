/**
 * Módulo para Classificação de Solos segundo o Sistema Unificado (USCS)
 * Baseado na ASTM D2487
 */

import type { ClassificacaoUSCSInput, ClassificacaoUSCSOutput } from '../schemas';

const DESCRICOES_USCS: Record<string, string> = {
  'GW': 'Pedregulhos e misturas de pedregulho e areia com ampla gama de diâmetros de partículas; limpos ou com poucos finos.',
  'GP': 'Pedregulhos e misturas de pedregulho e areia com predominância de um único tamanho ou falta de tamanhos intermediários; limpos ou com poucos finos.',
  'GM': 'Pedregulhos mal graduados contendo uma quantidade moderada de finos não plásticos (siltosos); misturas de pedregulho, areia e silte.',
  'GC': 'Pedregulhos mal graduados contendo uma quantidade moderada de finos plásticos (argilosos); misturas de pedregulho, areia e argila.',
  'SW': 'Areias e misturas de areias com pedregulho apresentando ampla variação de diâmetros de partículas; limpos ou com poucos finos.',
  'SP': 'Areias e misturas de areias com pedregulho apresentando predominância de um tamanho ou falta de diâmetros intermediários; limpos ou com poucos finos.',
  'SM': 'Areias siltosas e misturas de areias e siltes mal graduadas. Quantidade moderada de finos não plásticos (siltes).',
  'SC': 'Areias argilosas e misturas de areias e argilas mal graduadas. Quantidade moderada de finos plásticos (argilas).',
  'ML': 'Siltes inorgânicos, pó de pedra ou areias muito finas; solos siltosos ou argilosos com baixa plasticidade.',
  'CL': 'Argilas inorgânicas de baixa a média plasticidade; argilas com pedregulhos, arenosas ou siltosas.',
  'OL': 'Silte orgânico e argila siltosa orgânica de baixa plasticidade, geralmente apresentando coloração escura.',
  'MH': 'Siltes inorgânicos de alta plasticidade, solos micáceos ou diatomáceos; comportamento elástico ("borrachudo").',
  'CH': 'Argilas inorgânicas de alta plasticidade.',
  'OH': 'Argila orgânica de média a alta plasticidade ou silte orgânico altamente compressível e de cor escura.',
  'Pt': 'Turfa e outros solos altamente orgânicos. Caracterizados por cor muito escura, odor forte e restos vegetais.',
  'GW-GM': 'Pedregulho com boa distribuição granulométrica contendo pequena quantidade de finos siltosos (não plásticos).',
  'GW-GC': 'Pedregulho com boa distribuição granulométrica contendo pequena quantidade de finos argilosos (plásticos).',
  'GP-GM': 'Pedregulho de granulometria uniforme ou lacunar contendo pequena quantidade de finos siltosos (não plásticos).',
  'GP-GC': 'Pedregulho de granulometria uniforme ou lacunar contendo pequena quantidade de finos argilosos (plásticos).',
  'SW-SM': 'Areia com boa distribuição granulométrica contendo pequena quantidade de finos siltosos (não plásticos).',
  'SW-SC': 'Areia com boa distribuição granulométrica contendo pequena quantidade de finos argilosos (plásticos).',
  'SP-SM': 'Areia de granulometria uniforme ou lacunar contendo pequena quantidade de finos siltosos (não plásticos).',
  'SP-SC': 'Areia de granulometria uniforme ou lacunar contendo pequena quantidade de finos argilosos (plásticos).',
  'GC-GM': 'Pedregulho argilo-siltoso. Os finos apresentam características intermediárias de silte e argila na carta de plasticidade.',
  'SC-SM': 'Areia argilo-siltosa. Os finos apresentam características intermediárias de silte e argila na carta de plasticidade.',
  'CL-ML': 'Solo de transição apresentando características intermediárias entre argila e silte de baixa plasticidade.',
};

export function classificarUSCS(dados: ClassificacaoUSCSInput): ClassificacaoUSCSOutput {
  try {
    // Calcular porcentagens
    const finos = dados.pass_peneira_200; // % finos (silte + argila)
    const pedregulho = 100.0 - dados.pass_peneira_4; // % pedregulho
    const areia = dados.pass_peneira_4 - dados.pass_peneira_200; // % areia

    // Validação básica
    if (finos < 0 || pedregulho < 0 || areia < 0) {
      return {
        erro: 'Dados granulométricos inconsistentes',
      };
    }

    let result: ClassificacaoUSCSOutput;

    // Verificar solo altamente orgânico (Turfa)
    if (dados.is_altamente_organico) {
      result = {
        classificacao: 'Pt',
        descricao: DESCRICOES_USCS['Pt'],
      };
    } else if (finos < 50.0) {
      // SOLO GROSSO
      result = classificarSoloGrosso(pedregulho, areia, finos, dados);
    } else {
      // SOLO FINO
      result = classificarSoloFino(dados);
    }

    // Sobrescrever descrição se existir no mapa de descrições padronizadas
    if (result.classificacao && DESCRICOES_USCS[result.classificacao]) {
      result.descricao = DESCRICOES_USCS[result.classificacao];
    }

    return result;
  } catch (error) {
    return {
      erro: error instanceof Error ? error.message : 'Erro na classificação',
    };
  }
}

function classificarSoloGrosso(
  pedregulho: number,
  areia: number,
  finos: number,
  dados: ClassificacaoUSCSInput
): ClassificacaoUSCSOutput {
  // Determinar se é pedregulho (G) ou areia (S) pela fração dominante na porção grossa
  const prefixo = pedregulho > areia ? 'G' : 'S';
  // Genero para concordância: 'o' (Pedregulho) ou 'a' (Areia)
  const genero = prefixo === 'G' ? 'o' : 'a';
  const tipo_solo = prefixo === 'G' ? 'Pedregulho' : 'Areia';

  // Analisar os finos
  if (finos < 5.0) {
    // Menos de 5% finos - classificação baseada em graduação (Cu e Cc)
    if (dados.Cu === undefined || dados.Cc === undefined) {
      return {
        erro: 'Para solos grossos com menos de 5% de finos, Cu e Cc são obrigatórios',
      };
    }

    const Cu = dados.Cu;
    const Cc = dados.Cc;

    // Critérios de graduação
    const bem_graduado =
      prefixo === 'G'
        ? Cu >= 4.0 && Cc >= 1.0 && Cc <= 3.0
        : Cu >= 6.0 && Cc >= 1.0 && Cc <= 3.0;

    if (bem_graduado) {
      return {
        classificacao: `${prefixo}W`,
        descricao: `${tipo_solo} bem graduad${genero}`,
      };
    } else {
      return {
        classificacao: `${prefixo}P`,
        descricao: `${tipo_solo} mal graduad${genero}`,
      };
    }
  } else if (finos >= 5.0 && finos <= 12.0) {
    // Entre 5-12% finos - classificação dupla
    if (dados.Cu !== undefined && dados.Cc !== undefined) {
      const Cu = dados.Cu;
      const Cc = dados.Cc;

      const bem_graduado =
        prefixo === 'G'
          ? Cu >= 4.0 && Cc >= 1.0 && Cc <= 3.0
          : Cu >= 6.0 && Cc >= 1.0 && Cc <= 3.0;

      // Tratar campos vazios de LL/LP como 0 automaticamente
      const ll = dados.ll ?? 0;
      const ip = dados.ip ?? 0;

      // Para classificar o tipo de finos (M/C/C-M), usamos LL e IP (0 se vazios)
      const sufixo_finos = determinarSufixoFinos(ll, ip);

      let tipo_finos_desc = "finos";
      if (sufixo_finos === 'M') tipo_finos_desc = "silte";
      else if (sufixo_finos === 'C') tipo_finos_desc = "argila";
      else if (sufixo_finos === 'C-M') tipo_finos_desc = "silte e argila"; // Caso misto

      if (bem_graduado) {
        // GW-GM, GW-GC, SW-SM, SW-SC
        const classificacao =
          sufixo_finos === 'C-M'
            ? `${prefixo}W-${prefixo}C/${prefixo}W-${prefixo}M`
            : `${prefixo}W-${prefixo}${sufixo_finos}`;

        return {
          classificacao,
          descricao: `${tipo_solo} bem graduad${genero} com ${tipo_finos_desc}`,
        };
      } else {
        // GP-GM, GP-GC, SP-SM, SP-SC
        const classificacao =
          sufixo_finos === 'C-M'
            ? `${prefixo}P-${prefixo}C/${prefixo}P-${prefixo}M`
            : `${prefixo}P-${prefixo}${sufixo_finos}`;

        return {
          classificacao,
          descricao: `${tipo_solo} mal graduad${genero} com ${tipo_finos_desc}`,
        };
      }
    } else {
      // Fallback: Sem Cu e Cc (provavelmente D10 < #200 e sem sedimentação)
      // Assumir Mal Graduado (P) por segurança e seguir com a classificação dupla

      const ll = dados.ll ?? 0;
      const ip = dados.ip ?? 0;
      const sufixo_finos = determinarSufixoFinos(ll, ip);
      let tipo_finos_desc = "finos";
      if (sufixo_finos === 'M') tipo_finos_desc = "silte";
      else if (sufixo_finos === 'C') tipo_finos_desc = "argila";

      // Assumir P (mal graduado) na parte grossa
      let classificacao: string;
      if (sufixo_finos === 'C-M') {
        classificacao = `${prefixo}P-${prefixo}C/${prefixo}P-${prefixo}M`;
        tipo_finos_desc = "silte e argila";
      } else {
        classificacao = `${prefixo}P-${prefixo}${sufixo_finos}`;
      }

      return {
        classificacao,
        descricao: `${tipo_solo} mal graduad${genero} com ${tipo_finos_desc}`,
      };
    }
  } else {
    // finos > 12%
    // Tratar campos vazios de LL/LP como 0 automaticamente
    const ll = dados.ll ?? 0;
    const ip = dados.ip ?? 0;
    const sufixo_finos = determinarSufixoFinos(ll, ip);
    let classificacao: string;
    let descricao: string;

    if (sufixo_finos === 'M') {
      classificacao = `${prefixo}M`;
      descricao = `${tipo_solo} siltos${genero}`;
    } else if (sufixo_finos === 'C') {
      classificacao = `${prefixo}C`;
      descricao = `${tipo_solo} argilos${genero}`;
    } else {
      // Caso 'C-M' (zona hachurada): classificação dupla
      classificacao = `${prefixo}C-${prefixo}M`;
      descricao = `${tipo_solo} silto-argilos${genero}`;
    }

    return {
      classificacao,
      descricao,
    };
  }
}

function classificarSoloFino(dados: ClassificacaoUSCSInput): ClassificacaoUSCSOutput {
  // Tratar campos vazios de LL/LP como 0 automaticamente
  const LL = dados.ll ?? 0;
  const IP = dados.ip ?? 0;

  // Calcular IP na Linha A para o LL do solo
  const ip_linha_a = 0.73 * (LL - 20.0);
  const acima_linha_a = IP >= ip_linha_a;

  // Verificar solo orgânico
  if (dados.is_organico_fino) {
    if (LL < 50.0) {
      return { classificacao: 'OL', descricao: 'Solo orgânico de baixa compressibilidade' };
    } else {
      return { classificacao: 'OH', descricao: 'Solo orgânico de alta compressibilidade' };
    }
  }

  // LL < 50: ML, CL-ML, CL
  if (LL < 50.0) {
    if (!acima_linha_a || IP < 4.0) {
      return { classificacao: 'ML', descricao: 'Silte de baixa compressibilidade' };
    }
    if (IP >= 7.0 && acima_linha_a) {
      return { classificacao: 'CL', descricao: 'Argila de baixa compressibilidade' };
    }
    // 4 ≤ IP < 7 e acima da Linha A
    return { classificacao: 'CL-ML', descricao: 'Silte argiloso de baixa compressibilidade' };
  }

  // LL ≥ 50: MH ou CH
  if (acima_linha_a) {
    return { classificacao: 'CH', descricao: 'Argila de alta compressibilidade' };
  } else {
    return { classificacao: 'MH', descricao: 'Silte de alta compressibilidade' };
  }
}

function determinarSufixoFinos(LL: number, IP: number): string {
  const ip_linha_a = 0.73 * (LL - 20.0);
  const acima_linha_a = IP >= ip_linha_a;

  if (IP < 4.0 || !acima_linha_a) {
    return 'M';
  }
  if (IP >= 7.0 && acima_linha_a) {
    return 'C';
  }
  // 4 ≤ IP < 7 e acima da Linha A
  return 'C-M';
}
