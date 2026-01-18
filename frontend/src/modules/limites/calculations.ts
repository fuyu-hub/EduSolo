/**
 * Módulo para cálculo de Limites de Consistência (Limites de Atterberg)
 * Calcula LL, LP, IP, IC e Atividade da Argila
 * 
 * Referências:
 * - NBR 6459 - Limite de Liquidez
 * - NBR 7180 - Limite de Plasticidade
 */

import type {
  LimitesConsistenciaInput,
  LimitesConsistenciaOutput,
} from './schemas';

// Interface local para pontos do gráfico
interface PontoCurva {
  x: number;
  y: number;
}

const EPSILON = 1e-9;
const LOG10_25 = Math.log10(25);

/**
 * Regressão linear simples
 */
function linearRegression(x: number[], y: number[]): { slope: number; intercept: number } {
  const n = x.length;
  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((acc, xi, i) => acc + xi * y[i], 0);
  const sumX2 = x.reduce((acc, xi) => acc + xi * xi, 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  return { slope, intercept };
}

export function calcularLimitesConsistencia(
  dados: LimitesConsistenciaInput
): LimitesConsistenciaOutput {
  try {
    // Processar pontos LL
    const pontos_grafico_ll_log: PontoCurva[] = [];
    const umidades_ll: number[] = [];
    const log_golpes_ll: number[] = [];

    if (dados.pontos_ll.length < 2) {
      throw new Error('São necessários pelo menos 2 pontos para o cálculo do Limite de Liquidez.');
    }

    for (let i = 0; i < dados.pontos_ll.length; i++) {
      const ponto = dados.pontos_ll[i];

      if (ponto.massa_umida_recipiente < ponto.massa_seca_recipiente) {
        throw new Error(
          `Ponto LL ${i + 1}: Massa úmida (${ponto.massa_umida_recipiente}g) menor que massa seca (${ponto.massa_seca_recipiente}g).`
        );
      }
      if (ponto.massa_seca_recipiente < ponto.massa_recipiente) {
        throw new Error(
          `Ponto LL ${i + 1}: Massa seca (${ponto.massa_seca_recipiente}g) menor que massa do recipiente (${ponto.massa_recipiente}g).`
        );
      }
      if (ponto.num_golpes <= 0) {
        throw new Error(`Ponto LL ${i + 1}: Número de golpes (${ponto.num_golpes}) inválido.`);
      }

      const massa_agua = ponto.massa_umida_recipiente - ponto.massa_seca_recipiente;
      const massa_seca = ponto.massa_seca_recipiente - ponto.massa_recipiente;

      if (massa_seca <= EPSILON) {
        throw new Error(
          `Ponto LL ${i + 1}: Massa seca calculada é zero ou negativa (${massa_seca.toFixed(2)}g). Verifique os dados.`
        );
      }
      if (massa_agua < 0) {
        throw new Error(
          `Ponto LL ${i + 1}: Massa de água calculada é negativa (${massa_agua.toFixed(2)}g). Verifique os dados.`
        );
      }

      const umidade_ponto = (massa_agua / massa_seca) * 100;
      const log_golpes = Math.log10(ponto.num_golpes);

      pontos_grafico_ll_log.push({ x: log_golpes, y: umidade_ponto });
      umidades_ll.push(umidade_ponto);
      log_golpes_ll.push(log_golpes);
    }

    // Calcular LL via regressão linear
    const { slope, intercept } = linearRegression(log_golpes_ll, umidades_ll);
    let ll_calculado = slope * LOG10_25 + intercept;
    if (ll_calculado < 0) ll_calculado = 0;

    // Calcular LP (média de múltiplos ensaios)
    if (!dados.pontos_lp || dados.pontos_lp.length === 0) {
      throw new Error('É necessário pelo menos 1 ensaio de LP.');
    }

    const lps_calculados: number[] = [];

    for (let i = 0; i < dados.pontos_lp.length; i++) {
      const ponto_lp = dados.pontos_lp[i];

      if (ponto_lp.massa_umida_recipiente < ponto_lp.massa_seca_recipiente) {
        throw new Error(
          `Ensaio LP ${i + 1}: Massa úmida (${ponto_lp.massa_umida_recipiente}g) menor que massa seca (${ponto_lp.massa_seca_recipiente}g).`
        );
      }
      if (ponto_lp.massa_seca_recipiente < ponto_lp.massa_recipiente) {
        throw new Error(
          `Ensaio LP ${i + 1}: Massa seca (${ponto_lp.massa_seca_recipiente}g) menor que massa do recipiente (${ponto_lp.massa_recipiente}g).`
        );
      }

      const massa_agua_lp = ponto_lp.massa_umida_recipiente - ponto_lp.massa_seca_recipiente;
      const massa_seca_lp = ponto_lp.massa_seca_recipiente - ponto_lp.massa_recipiente;

      if (massa_seca_lp <= EPSILON) {
        throw new Error(
          `Ensaio LP ${i + 1}: Massa seca calculada é zero ou negativa (${massa_seca_lp.toFixed(2)}g).`
        );
      }
      if (massa_agua_lp < 0) {
        throw new Error(
          `Ensaio LP ${i + 1}: Massa de água calculada é negativa (${massa_agua_lp.toFixed(2)}g).`
        );
      }

      const lp_ensaio = (massa_agua_lp / massa_seca_lp) * 100;
      lps_calculados.push(lp_ensaio);
    }

    // Calcular média do LP
    let lp_calculado = lps_calculados.reduce((a, b) => a + b, 0) / lps_calculados.length;
    if (lp_calculado < 0) lp_calculado = 0;

    // Calcular IP
    let ip_calculado = ll_calculado - lp_calculado;
    const is_np = ip_calculado < 0;
    if (is_np) ip_calculado = 0;

    // Classificação da plasticidade
    let classificacao_plasticidade: string;
    if (is_np || Math.abs(ip_calculado) < EPSILON) {
      classificacao_plasticidade = 'Não Plástico (NP)';
    } else if (ip_calculado <= 7) {
      classificacao_plasticidade = 'Fracamente Plástico';
    } else if (ip_calculado <= 15) {
      classificacao_plasticidade = 'Medianamente Plástico';
    } else {
      classificacao_plasticidade = 'Altamente Plástico';
    }

    // Calcular IC
    let ic_calculado: number | undefined;
    let classificacao_consistencia: string | undefined;

    if (dados.umidade_natural !== undefined) {
      if (ip_calculado > EPSILON) {
        ic_calculado = (ll_calculado - dados.umidade_natural) / ip_calculado;

        if (ic_calculado < 0) {
          classificacao_consistencia = 'Muito Mole (líquida)';
        } else if (ic_calculado < 0.5) {
          classificacao_consistencia = 'Mole';
        } else if (ic_calculado < 0.75) {
          classificacao_consistencia = 'Média';
        } else if (ic_calculado < 1.0) {
          classificacao_consistencia = 'Rija';
        } else {
          classificacao_consistencia = 'Dura (semi-sólida/sólida)';
        }
      } else {
        classificacao_consistencia = 'Não aplicável (solo Não Plástico)';
      }
    }

    // Calcular Atividade
    let atividade_calculada: number | undefined;
    let classificacao_atividade: string | undefined;

    if (dados.percentual_argila !== undefined) {
      if (dados.percentual_argila < 0 || dados.percentual_argila > 100) {
        throw new Error('Percentual de argila deve estar entre 0 e 100%.');
      }
      if (dados.percentual_argila > EPSILON) {
        atividade_calculada = ip_calculado / dados.percentual_argila;

        if (atividade_calculada < 0.75) {
          classificacao_atividade = 'Inativa';
        } else if (atividade_calculada <= 1.25) {
          classificacao_atividade = 'Normal';
        } else {
          classificacao_atividade = 'Ativa';
        }
      } else if (ip_calculado <= EPSILON) {
        classificacao_atividade = 'Não aplicável (solo NP ou sem argila)';
      }
    }

    return {
      ll: Number(ll_calculado.toFixed(2)),
      lp: Number(lp_calculado.toFixed(2)),
      ip: Number(ip_calculado.toFixed(2)),
      ic: ic_calculado !== undefined ? Number(ic_calculado.toFixed(2)) : undefined,
      classificacao_plasticidade,
      classificacao_consistencia,
      atividade_argila:
        atividade_calculada !== undefined ? Number(atividade_calculada.toFixed(2)) : undefined,
      classificacao_atividade,
      pontos_grafico_ll: pontos_grafico_ll_log,
    };
  } catch (error) {
    return {
      erro: error instanceof Error ? error.message : 'Erro desconhecido',
    };
  }
}

