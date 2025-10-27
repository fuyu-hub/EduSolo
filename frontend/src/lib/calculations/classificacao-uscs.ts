/**
 * Módulo para Classificação de Solos segundo o Sistema Unificado (USCS)
 * Baseado na ASTM D2487
 */

import type { ClassificacaoUSCSInput, ClassificacaoUSCSOutput } from '../schemas';

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

    // Verificar solo altamente orgânico (Turfa)
    if (dados.is_altamente_organico) {
      return {
        classificacao: 'Pt',
        descricao: 'Turfa e outros solos altamente orgânicos',
      };
    }

    // Decisão principal: Solo grosso (< 50% finos) ou fino (>= 50% finos)
    if (finos < 50.0) {
      // SOLO GROSSO
      return classificarSoloGrosso(pedregulho, areia, finos, dados);
    } else {
      // SOLO FINO
      return classificarSoloFino(dados);
    }
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
  // Determinar se é pedregulho (G) ou areia (S)
  const prefixo = pedregulho > areia ? 'G' : 'S';
  const tipo_solo = pedregulho > areia ? 'Pedregulho' : 'Areia';

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
        descricao: `${tipo_solo} bem graduado`,
      };
    } else {
      return {
        classificacao: `${prefixo}P`,
        descricao: `${tipo_solo} mal graduado`,
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

      const sufixo_finos = determinarSufixoFinos(dados);

      if (bem_graduado) {
        return {
          classificacao: `${prefixo}W-${prefixo}${sufixo_finos}`,
          descricao: `${tipo_solo} bem graduado com finos`,
        };
      } else {
        return {
          classificacao: `${prefixo}P-${prefixo}${sufixo_finos}`,
          descricao: `${tipo_solo} mal graduado com finos`,
        };
      }
    } else {
      // Sem Cu e Cc, usa apenas os finos
      const sufixo_finos = determinarSufixoFinos(dados);
      return {
        classificacao: `${prefixo}${sufixo_finos}`,
        descricao: `${tipo_solo} com finos`,
      };
    }
  } else {
    // finos > 12%
    const sufixo_finos = determinarSufixoFinos(dados);

    let descricao: string;
    if (sufixo_finos === 'M') {
      descricao = `${tipo_solo} siltoso`;
    } else if (sufixo_finos === 'C') {
      descricao = `${tipo_solo} argiloso`;
    } else {
      descricao = `${tipo_solo} com finos`;
    }

    return {
      classificacao: `${prefixo}${sufixo_finos}`,
      descricao,
    };
  }
}

function classificarSoloFino(dados: ClassificacaoUSCSInput): ClassificacaoUSCSOutput {
  // Requer limites de Atterberg
  if (dados.ll === undefined) {
    return {
      erro: 'Para solos finos (>=50% finos), o Limite de Liquidez (LL) é obrigatório',
    };
  }

  const LL = dados.ll;
  const IP = dados.ip !== undefined ? dados.ip : 0.0;

  // Calcular IP na Linha A para o LL do solo
  const ip_linha_a = 0.73 * (LL - 20.0);

  // Tolerâncias
  const tolerancia_linha_a = Math.max(Math.abs(ip_linha_a) * 0.08, 1.0);
  const tolerancia_ll_50 = 3.0;

  // Verificar se é solo orgânico
  if (dados.is_organico_fino) {
    if (LL < 50.0) {
      return {
        classificacao: 'OL',
        descricao: 'Silte/argila orgânico de baixa plasticidade',
      };
    } else {
      return {
        classificacao: 'OH',
        descricao: 'Silte/argila orgânico de alta plasticidade',
      };
    }
  }

  // Determinar se é solo de alta ou baixa plasticidade
  if (LL < 50.0) {
    // Baixa plasticidade (L)
    const distancia_linha_a = IP - ip_linha_a;

    if (IP >= 4.0 && IP <= 7.0) {
      return {
        classificacao: 'CL-ML',
        descricao: 'Silte argiloso de baixa plasticidade',
      };
    } else if (IP > 7.0 && distancia_linha_a >= tolerancia_linha_a) {
      return {
        classificacao: 'CL',
        descricao: 'Argila de baixa plasticidade',
      };
    } else if (IP < 4.0 && distancia_linha_a <= -tolerancia_linha_a) {
      return {
        classificacao: 'ML',
        descricao: 'Silte de baixa plasticidade',
      };
    } else if (Math.abs(distancia_linha_a) <= tolerancia_linha_a && IP > 7.0) {
      if (distancia_linha_a >= 0) {
        return {
          classificacao: 'CL-ML',
          descricao: 'Argila-silte de baixa plasticidade (próximo à Linha A)',
        };
      } else {
        return {
          classificacao: 'ML-CL',
          descricao: 'Silte-argila de baixa plasticidade (próximo à Linha A)',
        };
      }
    } else {
      return {
        classificacao: 'CL-ML',
        descricao: 'Silte argiloso de baixa plasticidade',
      };
    }
  } else {
    // Alta plasticidade (H)
    const distancia_linha_a = IP - ip_linha_a;
    const proxima_ll_50 = Math.abs(LL - 50.0) <= tolerancia_ll_50;

    if (distancia_linha_a >= tolerancia_linha_a) {
      if (proxima_ll_50) {
        return {
          classificacao: 'CL-CH',
          descricao: 'Argila na transição entre baixa e alta plasticidade',
        };
      } else {
        return {
          classificacao: 'CH',
          descricao: 'Argila de alta plasticidade',
        };
      }
    } else if (distancia_linha_a <= -tolerancia_linha_a) {
      if (proxima_ll_50) {
        return {
          classificacao: 'ML-MH',
          descricao: 'Silte na transição entre baixa e alta plasticidade',
        };
      } else {
        return {
          classificacao: 'MH',
          descricao: 'Silte de alta plasticidade',
        };
      }
    } else {
      if (distancia_linha_a >= 0) {
        return {
          classificacao: 'CH-MH',
          descricao: 'Argila-silte de alta plasticidade (próximo à Linha A)',
        };
      } else {
        return {
          classificacao: 'MH-CH',
          descricao: 'Silte-argila de alta plasticidade (próximo à Linha A)',
        };
      }
    }
  }
}

function determinarSufixoFinos(dados: ClassificacaoUSCSInput): string {
  if (dados.ll === undefined || dados.ip === undefined) {
    return 'M'; // Padrão: assume siltoso
  }

  const LL = dados.ll;
  const IP = dados.ip;

  // Critério da linha A
  if (IP >= 4.0 && IP >= 0.73 * (LL - 20.0)) {
    return 'C'; // Argiloso
  } else {
    return 'M'; // Siltoso
  }
}

