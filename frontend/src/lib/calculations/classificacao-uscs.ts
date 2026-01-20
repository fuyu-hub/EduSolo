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
  // Determinar se é pedregulho (G) ou areia (S) pela fração dominante na porção grossa
  const prefixo = pedregulho > areia ? 'G' : 'S';
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

      // Tratar campos vazios de LL/LP como 0 automaticamente
      const ll = dados.ll ?? 0;
      const ip = dados.ip ?? 0;

      // Para classificar o tipo de finos (M/C/C-M), usamos LL e IP (0 se vazios)
      const sufixo_finos = determinarSufixoFinos(ll, ip);

      if (bem_graduado) {
        const classificacao =
          sufixo_finos === 'C-M'
            ? `${prefixo}W-${prefixo}C/${prefixo}W-${prefixo}M`
            : `${prefixo}W-${prefixo}${sufixo_finos}`;
        return {
          classificacao,
          descricao: `${tipo_solo} bem graduado com finos`,
        };
      } else {
        const classificacao =
          sufixo_finos === 'C-M'
            ? `${prefixo}P-${prefixo}C/${prefixo}P-${prefixo}M`
            : `${prefixo}P-${prefixo}${sufixo_finos}`;
        return {
          classificacao,
          descricao: `${tipo_solo} mal graduado com finos`,
        };
      }
    } else {
      // Fallback: Sem Cu e Cc (provavelmente D10 < #200 e sem sedimentação)
      // Assumir Mal Graduado (P) por segurança e seguir com a classificação dupla

      const ll = dados.ll ?? 0;
      const ip = dados.ip ?? 0;

      // Para classificar o tipo de finos (M/C/C-M)
      const sufixo_finos = determinarSufixoFinos(ll, ip);

      // Assumir P (mal graduado) na parte grossa
      let classificacao: string;
      if (sufixo_finos === 'C-M') {
        classificacao = `${prefixo}P-${prefixo}C/${prefixo}P-${prefixo}M`;
      } else {
        classificacao = `${prefixo}P-${prefixo}${sufixo_finos}`;
      }

      return {
        classificacao,
        descricao: `${tipo_solo} mal graduado com finos (Assumido P por falta de D10)`,
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
      descricao = `${tipo_solo} siltoso`;
    } else if (sufixo_finos === 'C') {
      classificacao = `${prefixo}C`;
      descricao = `${tipo_solo} argiloso`;
    } else {
      // Caso 'C-M' (zona hachurada): classificação dupla
      classificacao = `${prefixo}C-${prefixo}M`;
      descricao = `${tipo_solo} silto-argiloso`;
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
      return { classificacao: 'OL', descricao: 'Silte/argila orgânico de baixa plasticidade' };
    } else {
      return { classificacao: 'OH', descricao: 'Silte/argila orgânico de alta plasticidade' };
    }
  }

  // LL < 50: ML, CL-ML, CL
  if (LL < 50.0) {
    if (!acima_linha_a || IP < 4.0) {
      return { classificacao: 'ML', descricao: 'Silte de baixa plasticidade' };
    }
    if (IP >= 7.0 && acima_linha_a) {
      return { classificacao: 'CL', descricao: 'Argila de baixa plasticidade' };
    }
    // 4 ≤ IP < 7 e acima da Linha A
    return { classificacao: 'CL-ML', descricao: 'Silte argiloso de baixa plasticidade' };
  }

  // LL ≥ 50: MH ou CH
  if (acima_linha_a) {
    return { classificacao: 'CH', descricao: 'Argila de alta plasticidade' };
  } else {
    return { classificacao: 'MH', descricao: 'Silte de alta plasticidade' };
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
