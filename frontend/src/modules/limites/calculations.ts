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
    // Processar LL se houver pontos suficientes
    let ll_calculado: number | undefined;
    let pontos_grafico_ll_log: PontoCurva[] | undefined;

    if (dados.pontos_ll.length >= 2) {
      const umidades_ll: number[] = [];
      const log_golpes_ll: number[] = [];
      pontos_grafico_ll_log = [];

      for (let i = 0; i < dados.pontos_ll.length; i++) {
        const ponto = dados.pontos_ll[i];

        // Validations for LL points...
        if (ponto.massa_umida_recipiente < ponto.massa_seca_recipiente) {
          throw new Error(`Erro: Ponto LL ${i + 1}: Massa úmida menor que massa seca.`);
        }
        if (ponto.massa_seca_recipiente < ponto.massa_recipiente) {
          throw new Error(`Erro: Ponto LL ${i + 1}: Massa seca menor que massa do recipiente.`);
        }
        if (ponto.num_golpes <= 0) {
          throw new Error(`Erro: Ponto LL ${i + 1}: Número de golpes inválido.`);
        }

        const massa_agua = ponto.massa_umida_recipiente - ponto.massa_seca_recipiente;
        const massa_seca = ponto.massa_seca_recipiente - ponto.massa_recipiente;

        if (massa_seca <= EPSILON) throw new Error(`Erro: Ponto LL ${i + 1}: Massa seca inválida.`);
        if (massa_agua < 0) throw new Error(`Erro: Ponto LL ${i + 1}: Massa de água negativa.`);

        const umidade_ponto = (massa_agua / massa_seca) * 100;
        const log_golpes = Math.log10(ponto.num_golpes);

        pontos_grafico_ll_log.push({ x: log_golpes, y: umidade_ponto });
        umidades_ll.push(umidade_ponto);
        log_golpes_ll.push(log_golpes);
      }

      const { slope, intercept } = linearRegression(log_golpes_ll, umidades_ll);
      ll_calculado = slope * LOG10_25 + intercept;
      if (ll_calculado < 0) ll_calculado = 0;
    }

    // Processar LP se houver pontos
    let lp_calculado: number | undefined;

    if (dados.pontos_lp && dados.pontos_lp.length > 0) {
      const lps_calculados: number[] = [];
      for (let i = 0; i < dados.pontos_lp.length; i++) {
        const ponto_lp = dados.pontos_lp[i];

        // Validations for LP points...
        if (ponto_lp.massa_umida_recipiente < ponto_lp.massa_seca_recipiente) {
          throw new Error(`Erro: Ensaio LP ${i + 1}: Massa úmida menor que massa seca.`);
        }
        if (ponto_lp.massa_seca_recipiente < ponto_lp.massa_recipiente) {
          throw new Error(`Erro: Ensaio LP ${i + 1}: Massa seca menor que massa do recipiente.`);
        }

        const massa_agua_lp = ponto_lp.massa_umida_recipiente - ponto_lp.massa_seca_recipiente;
        const massa_seca_lp = ponto_lp.massa_seca_recipiente - ponto_lp.massa_recipiente;

        if (massa_seca_lp <= EPSILON) throw new Error(`Erro: Ensaio LP ${i + 1}: Massa seca inválida.`);
        if (massa_agua_lp < 0) throw new Error(`Erro: Ensaio LP ${i + 1}: Massa de água negativa.`);

        const lp_ensaio = (massa_agua_lp / massa_seca_lp) * 100;
        lps_calculados.push(lp_ensaio);
      }
      lp_calculado = lps_calculados.reduce((a, b) => a + b, 0) / lps_calculados.length;
      if (lp_calculado < 0) lp_calculado = 0;
    }

    // Calcular IP e Classificações (somente se ambos LL e LP existirem)
    let ip_calculado: number | undefined;
    let classificacao_plasticidade: string | undefined;
    let ic_calculado: number | undefined;
    let classificacao_consistencia: string | undefined;

    if (ll_calculado !== undefined && lp_calculado !== undefined) {
      ip_calculado = ll_calculado - lp_calculado;
      if (ip_calculado < 0) ip_calculado = 0; // Solo NP

      // Classificação de plasticidade (Burmister, 1949)
      if (ip_calculado <= EPSILON) {
        classificacao_plasticidade = 'Não Plástico (NP)';
      } else if (ip_calculado <= 5) {
        classificacao_plasticidade = 'Plasticidade Leve';
      } else if (ip_calculado <= 10) {
        classificacao_plasticidade = 'Plasticidade Baixa';
      } else if (ip_calculado <= 20) {
        classificacao_plasticidade = 'Plasticidade Média';
      } else if (ip_calculado <= 40) {
        classificacao_plasticidade = 'Plasticidade Alta';
      } else {
        classificacao_plasticidade = 'Plasticidade Muito Alta';
      }

      // IC Calculation
      if (dados.umidade_natural !== undefined) {
        if (ip_calculado > EPSILON) {
          ic_calculado = (ll_calculado - dados.umidade_natural) / ip_calculado;
          if (ic_calculado < 0) classificacao_consistencia = 'Muito Mole (vasa)';
          else if (ic_calculado <= 0.5) classificacao_consistencia = 'Mole';
          else if (ic_calculado <= 0.75) classificacao_consistencia = 'Média';
          else if (ic_calculado <= 1.0) classificacao_consistencia = 'Rija';
          else classificacao_consistencia = 'Dura';
        } else {
          classificacao_consistencia = 'Não aplicável (solo NP)';
        }
      }
    }

    return {
      ll: ll_calculado !== undefined ? Number(ll_calculado.toFixed(2)) : undefined,
      lp: lp_calculado !== undefined ? Number(lp_calculado.toFixed(2)) : undefined,
      ip: ip_calculado !== undefined ? Number(ip_calculado.toFixed(2)) : undefined,
      ic: ic_calculado !== undefined ? Number(ic_calculado.toFixed(2)) : undefined,
      classificacao_plasticidade,
      classificacao_consistencia,
      pontos_grafico_ll: pontos_grafico_ll_log,
    };
  } catch (error) {
    return {
      erro: error instanceof Error ? error.message : 'Erro: Erro desconhecido',
    };
  }
}

