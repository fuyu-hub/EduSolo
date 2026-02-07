/**
 * Módulo para Ensaio de Compactação (Proctor)
 * Calcula curva de compactação e determina umidade ótima e γd,max
 */

import type { CompactacaoInput, CompactacaoOutput, PontoCurvaCompactacao } from './schemas';

const EPSILON = 1e-9;

/**
 * Ajuste polinomial simples (grau 2 ou 3)
 * Usa o método dos mínimos quadrados
 */
function polyfit(x: number[], y: number[], degree: number): number[] {
  const n = x.length;
  const X: number[][] = [];

  // Construir matriz de Vandermonde
  for (let i = 0; i < n; i++) {
    const row: number[] = [];
    for (let j = 0; j <= degree; j++) {
      row.push(Math.pow(x[i], j));
    }
    X.push(row);
  }

  // Método dos mínimos quadrados: (X^T X)^-1 X^T y
  const XT = transpose(X);
  const XTX = matrixMultiply(XT, X);
  const XTy = matrixVectorMultiply(XT, y);

  const coeffs = gaussianElimination(XTX, XTy);
  return coeffs.reverse(); // Retorna em ordem decrescente de potência
}

function transpose(matrix: number[][]): number[][] {
  return matrix[0].map((_, colIndex) => matrix.map(row => row[colIndex]));
}

function matrixMultiply(a: number[][], b: number[][]): number[][] {
  const result: number[][] = [];
  for (let i = 0; i < a.length; i++) {
    result[i] = [];
    for (let j = 0; j < b[0].length; j++) {
      let sum = 0;
      for (let k = 0; k < a[0].length; k++) {
        sum += a[i][k] * b[k][j];
      }
      result[i][j] = sum;
    }
  }
  return result;
}

function matrixVectorMultiply(matrix: number[][], vector: number[]): number[] {
  return matrix.map(row =>
    row.reduce((sum, val, i) => sum + val * vector[i], 0)
  );
}

function gaussianElimination(A: number[][], b: number[]): number[] {
  const n = b.length;
  const Ab = A.map((row, i) => [...row, b[i]]);

  // Forward elimination
  for (let i = 0; i < n; i++) {
    // Pivoting
    let maxRow = i;
    for (let k = i + 1; k < n; k++) {
      if (Math.abs(Ab[k][i]) > Math.abs(Ab[maxRow][i])) {
        maxRow = k;
      }
    }
    [Ab[i], Ab[maxRow]] = [Ab[maxRow], Ab[i]];

    // Eliminate column
    for (let k = i + 1; k < n; k++) {
      const factor = Ab[k][i] / Ab[i][i];
      for (let j = i; j <= n; j++) {
        Ab[k][j] -= factor * Ab[i][j];
      }
    }
  }

  // Back substitution
  const x: number[] = new Array(n).fill(0);
  for (let i = n - 1; i >= 0; i--) {
    x[i] = Ab[i][n];
    for (let j = i + 1; j < n; j++) {
      x[i] -= Ab[i][j] * x[j];
    }
    x[i] /= Ab[i][i];
  }

  return x;
}

function evaluatePolynomial(coeffs: number[], x: number): number {
  let result = 0;
  for (let i = 0; i < coeffs.length; i++) {
    result += coeffs[i] * Math.pow(x, coeffs.length - 1 - i);
  }
  return result;
}

function findPolynomialMaximum(coeffs: number[], xMin: number, xMax: number): [number, number] {
  // Deriva o polinômio
  const derivCoeffs: number[] = [];
  for (let i = 0; i < coeffs.length - 1; i++) {
    derivCoeffs.push(coeffs[i] * (coeffs.length - 1 - i));
  }

  // Encontra raízes da derivada (Newton-Raphson simplificado)
  let x = (xMin + xMax) / 2;
  for (let iter = 0; iter < 100; iter++) {
    const fx = evaluatePolynomial(derivCoeffs, x);
    if (Math.abs(fx) < 1e-6) break;

    // Segunda derivada
    const secondDerivCoeffs: number[] = [];
    for (let i = 0; i < derivCoeffs.length - 1; i++) {
      secondDerivCoeffs.push(derivCoeffs[i] * (derivCoeffs.length - 1 - i));
    }
    const dfx = evaluatePolynomial(secondDerivCoeffs, x);

    if (Math.abs(dfx) < EPSILON) break;
    x = x - fx / dfx;
  }

  // Verifica se está no intervalo
  if (x < xMin || x > xMax) {
    // Se não estiver, retorna o máximo dos extremos
    const yMin = evaluatePolynomial(coeffs, xMin);
    const yMax = evaluatePolynomial(coeffs, xMax);
    return yMin > yMax ? [xMin, yMin] : [xMax, yMax];
  }

  return [x, evaluatePolynomial(coeffs, x)];
}

export function calcularCompactacao(dados: CompactacaoInput): CompactacaoOutput {
  try {
    const pontos_calculados: PontoCurvaCompactacao[] = [];
    const gama_w = dados.peso_especifico_agua;
    const gama_w_gcm3 = Math.abs(gama_w - 10.0) < 0.5 ? 1.0 : gama_w / 9.81;

    if (dados.Gs !== undefined && dados.Gs <= 0) {
      throw new Error('Gs (Densidade relativa dos grãos) deve ser maior que zero.');
    }
    if (gama_w <= 0) {
      throw new Error('Peso específico da água deve ser maior que zero.');
    }

    for (let i = 0; i < dados.pontos_ensaio.length; i++) {
      const ponto = dados.pontos_ensaio[i];

      if (ponto.volume_molde <= 0) {
        throw new Error(`Volume do molde inválido (${ponto.volume_molde}) no ponto ${i + 1}.`);
      }
      if (ponto.massa_umida_total < ponto.massa_molde) {
        throw new Error(
          `Massa úmida total (${ponto.massa_umida_total}) menor que a massa do molde (${ponto.massa_molde}) no ponto ${i + 1}.`
        );
      }

      // Cálculo da Umidade - usar direta se fornecida, senão calcular
      let umidade_percentual: number;

      if (ponto.umidade_direta !== undefined && ponto.umidade_direta !== null) {
        // Usar umidade fornecida diretamente
        umidade_percentual = ponto.umidade_direta;
      } else {
        // Calcular umidade via medições
        if (ponto.massa_umida_recipiente_w === undefined ||
          ponto.massa_seca_recipiente_w === undefined ||
          ponto.massa_recipiente_w === undefined) {
          throw new Error(
            `Ponto ${i + 1}: é necessário fornecer a umidade direta ou as medições de peso para cálculo.`
          );
        }

        const massa_agua_w = ponto.massa_umida_recipiente_w - ponto.massa_seca_recipiente_w;
        const massa_seca_w = ponto.massa_seca_recipiente_w - ponto.massa_recipiente_w;

        if (massa_seca_w <= 0) {
          throw new Error(
            `Massa seca inválida (${massa_seca_w}) no cálculo de umidade do ponto ${i + 1}.`
          );
        }
        if (massa_agua_w < 0) {
          throw new Error(
            `Massa de água negativa (${massa_agua_w}) no cálculo de umidade do ponto ${i + 1}.`
          );
        }

        const umidade_decimal = massa_agua_w / massa_seca_w;
        umidade_percentual = umidade_decimal * 100;
      }

      // Cálculo do Peso Específico Seco
      const massa_solo_umido = ponto.massa_umida_total - ponto.massa_molde;
      const gama_h_gcm3 = massa_solo_umido / ponto.volume_molde;
      const gama_h_knm3 = (gama_h_gcm3 * gama_w) / gama_w_gcm3;

      const umidade_decimal = umidade_percentual / 100;
      const gama_d = gama_h_knm3 / (1 + umidade_decimal);

      pontos_calculados.push({
        umidade: umidade_percentual,
        peso_especifico_seco: gama_d,
      });
    }

    if (pontos_calculados.length < 3) {
      return {
        pontos_curva_compactacao: pontos_calculados,
        erro: 'São necessários pelo menos 3 pontos para traçar a curva de compactação.',
      };
    }

    // Ordenar por umidade
    pontos_calculados.sort((a, b) => a.umidade - b.umidade);

    const umidades = pontos_calculados.map((p) => p.umidade);
    const gamas_d = pontos_calculados.map((p) => p.peso_especifico_seco);

    // Ajuste polinomial
    const grau_polinomio = pontos_calculados.length >= 4 ? 3 : 2;
    const coeffs = polyfit(umidades, gamas_d, grau_polinomio);

    // Encontrar máximo
    const [w_ot, gd_max] = findPolynomialMaximum(
      coeffs,
      Math.min(...umidades),
      Math.max(...umidades)
    );

    // Curva de saturação S=100%
    const pontos_saturacao_100: PontoCurvaCompactacao[] = [];
    if (dados.Gs !== undefined) {
      const w_min_plot = Math.max(0, Math.min(...umidades) - 5);
      const w_max_plot = Math.max(...umidades) + 10;

      for (let w_p = w_min_plot; w_p <= w_max_plot; w_p += (w_max_plot - w_min_plot) / 19) {
        const w_dec = w_p / 100.0;
        const denominador = 1 + dados.Gs * w_dec;
        if (Math.abs(denominador) > EPSILON) {
          const gd_sat = (dados.Gs * gama_w) / denominador;
          pontos_saturacao_100.push({
            umidade: w_p,
            peso_especifico_seco: gd_sat,
          });
        }
      }
    }

    return {
      umidade_otima: Number(w_ot.toFixed(2)),
      peso_especifico_seco_max: Number(gd_max.toFixed(3)),
      pontos_curva_compactacao: pontos_calculados,
      pontos_curva_saturacao_100: pontos_saturacao_100.length > 0 ? pontos_saturacao_100 : undefined,
    };
  } catch (error) {
    return {
      erro: error instanceof Error ? error.message : 'Erro no cálculo de compactação',
    };
  }
}

