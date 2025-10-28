// frontend/src/lib/calculations/acrescimo-tensoes.ts
import type {
  PontoInteresse,
  CargaPontual,
  CargaFaixa,
  CargaCircular,
  CargaRetangular,
  AcrescimoTensoesInput,
  AcrescimoTensoesOutput,
} from '../schemas/acrescimo-tensoes';

const PI = Math.PI;
const EPSILON = 1e-9;

// ==================== BOUSSINESQ - CARGA PONTUAL ====================

/**
 * Calcula o acréscimo de tensão vertical usando Boussinesq (carga pontual).
 * 
 * Fórmula: Δσv = (3 * P * z³) / (2 * π * R⁵)
 * Onde: R = √(r² + z²) e r = √((x-x₀)² + (y-y₀)²)
 * 
 * Referências:
 * - PDF: 9. Tensões_devido_a_Sobrecarga-MAIO_2022.pdf (Pág. 10-11)
 */
export function calcularAcrescimoBoussinesqPontual(
  carga: CargaPontual,
  ponto: PontoInteresse
): number {
  const P = carga.P;
  const z = ponto.z;
  const r_quadrado = Math.pow(ponto.x - carga.x, 2) + Math.pow(ponto.y - carga.y, 2);
  const denominador_raiz = r_quadrado + z * z;

  if (denominador_raiz <= EPSILON) return NaN;

  const delta_sigma_v = (3 * P * Math.pow(z, 3)) / (2 * PI * Math.pow(denominador_raiz, 2.5));

  return delta_sigma_v;
}

// ==================== CAROTHERS - CARGA EM FAIXA ====================

/**
 * Calcula o acréscimo de tensão vertical usando Carothers (faixa infinita).
 * 
 * Fórmula: Δσv = (p / π) * [Δα + sin(Δα) * cos(Σα)]
 * Onde:
 *   - Δα = α₁ - α₂ (ângulo subentendido pela faixa)
 *   - Σα = α₁ + α₂ (soma dos ângulos)
 *   - α₁ = arctan((b/2 - x) / z)
 *   - α₂ = arctan((-b/2 - x) / z)
 * 
 * Referências:
 * - PDF: 9. Tensões_devido_a_Sobrecarga-MAIO_2022.pdf (Pág. 15)
 */
export function calcularAcrescimoCarothersFaixa(
  carga: CargaFaixa,
  ponto: PontoInteresse
): number {
  const p = carga.intensidade;
  const b = carga.largura;
  const x = ponto.x;
  const z = ponto.z;

  // Na superfície
  if (z <= EPSILON) {
    return Math.abs(x) < b / 2 ? p : 0.0;
  }

  // Ângulos com as bordas da faixa
  const alpha1 = Math.atan((b / 2 - x) / z);
  const alpha2 = Math.atan((-b / 2 - x) / z);

  // Ângulo subentendido (equivale a 2α do PDF)
  const delta_alpha = alpha1 - alpha2;
  // Soma dos ângulos (equivale a 2β do PDF)
  const sum_alpha = alpha1 + alpha2;

  // Fórmula de Carothers
  const delta_sigma_v = (p / PI) * (delta_alpha + Math.sin(delta_alpha) * Math.cos(sum_alpha));

  return delta_sigma_v;
}

// ==================== LOVE - CARGA CIRCULAR ====================

/**
 * Calcula Δσv no CENTRO de uma área circular (r = 0).
 * 
 * Fórmula: Δσv = p * [1 - (1 / (1 + (R/z)²))^(3/2)]
 * 
 * Referências:
 * - PDF: 9. Tensões_devido_a_Sobrecarga-MAIO_2022.pdf (Pág. 17)
 */
export function calcularAcrescimoLoveCircularCentro(
  carga: CargaCircular,
  ponto: PontoInteresse
): number {
  const p = carga.intensidade;
  const R = carga.raio;
  const z = ponto.z;

  if (z <= EPSILON) return p;
  if (R <= EPSILON) return 0.0;

  const rz_ratio_sq = Math.pow(R / z, 2);
  const termo_base = 1 / (1 + rz_ratio_sq);

  if (termo_base < EPSILON) {
    return p;
  }

  const delta_sigma_v = p * (1 - Math.pow(termo_base, 1.5));

  return delta_sigma_v;
}

/**
 * Estima Δσv usando ábaco de Love (interpolação bilinear).
 * 
 * Referências:
 * - PDF: 9. Tensões_devido_a_Sobrecarga-MAIO_2022.pdf (Pág. 18)
 */
export function calcularAcrescimoLoveCircularAbaco(
  carga: CargaCircular,
  ponto: PontoInteresse
): number {
  const p = carga.intensidade;
  const R = carga.raio;
  const z = ponto.z;
  const r = Math.sqrt(Math.pow(ponto.x, 2) + Math.pow(ponto.y, 2));

  if (z <= EPSILON) {
    return r < R ? p : 0.0;
  }
  if (R <= EPSILON) return 0.0;

  const z_R = z / R;
  const r_R = r / R;

  // Dados do ábaco de Love (σz/p vs r/R para diferentes z/R)
  const abaco_data: Record<number, Array<[number, number]>> = {
    0.5: [
      [0, 0.91],
      [0.5, 0.85],
      [0.75, 0.75],
      [1.0, 0.5],
      [1.25, 0.23],
      [1.5, 0.1],
    ],
    1.0: [
      [0, 0.6465],
      [0.5, 0.6],
      [0.75, 0.52],
      [1.0, 0.365],
      [1.25, 0.22],
      [1.5, 0.12],
    ],
    1.5: [
      [0, 0.42],
      [0.5, 0.4],
      [0.75, 0.36],
      [1.0, 0.29],
      [1.25, 0.2],
      [1.5, 0.13],
    ],
    2.0: [
      [0, 0.29],
      [0.5, 0.28],
      [0.75, 0.26],
      [1.0, 0.22],
      [1.25, 0.17],
      [1.5, 0.12],
    ],
    3.0: [
      [0, 0.14],
      [0.5, 0.14],
      [0.75, 0.13],
      [1.0, 0.12],
      [1.25, 0.1],
      [1.5, 0.08],
    ],
  };

  const z_R_keys = Object.keys(abaco_data)
    .map(Number)
    .sort((a, b) => a - b);

  // Encontra z/R inferior e superior
  const z_R_inf = z_R_keys.filter((k) => k <= z_R).pop() ?? z_R_keys[0];
  const z_R_sup = z_R_keys.find((k) => k >= z_R) ?? z_R_keys[z_R_keys.length - 1];

  let curva: Array<[number, number]>;

  if (Math.abs(z_R_inf - z_R_sup) < EPSILON) {
    // z/R exato no ábaco
    curva = abaco_data[z_R_inf];
  } else {
    // Interpola entre curvas
    const curva_inf = abaco_data[z_R_inf];
    const curva_sup = abaco_data[z_R_sup];
    const peso_sup = (z_R - z_R_inf) / (z_R_sup - z_R_inf);
    const peso_inf = 1.0 - peso_sup;

    curva = curva_inf.map(([r_R_val, sigma_p_inf], i) => {
      const sigma_p_sup = curva_sup[i]?.[1] ?? sigma_p_inf;
      const sigma_p_interp = peso_inf * sigma_p_inf + peso_sup * sigma_p_sup;
      return [r_R_val, sigma_p_interp];
    });
  }

  // Interpola na curva resultante para o r/R do ponto
  const r_R_vals = curva.map((p) => p[0]);
  const sigma_p_vals = curva.map((p) => p[1]);

  let fator_I: number;

  if (r_R >= r_R_vals[r_R_vals.length - 1]) {
    fator_I = sigma_p_vals[sigma_p_vals.length - 1];
  } else if (r_R <= r_R_vals[0]) {
    fator_I = sigma_p_vals[0];
  } else {
    // Interpolação linear
    fator_I = interpolacaoLinear(r_R, r_R_vals, sigma_p_vals);
  }

  if (fator_I < 0) fator_I = 0.0;

  const delta_sigma_v = p * fator_I;
  return delta_sigma_v;
}

// ==================== NEWMARK - CARGA RETANGULAR ====================

/**
 * Ábaco de Newmark (tabela completa)
 * Formato: {n: {m: valor}}
 * n = a/z, m = b/z
 */
const ABACO_NEWMARK: Record<number, Record<number, number>> = {
  0.1: {
    0.1: 0.005,
    0.2: 0.009,
    0.3: 0.013,
    0.4: 0.017,
    0.5: 0.02,
    0.6: 0.022,
    0.7: 0.024,
    0.8: 0.026,
    0.9: 0.027,
    1.0: 0.028,
    1.2: 0.029,
    1.5: 0.03,
    2.0: 0.031,
    2.5: 0.031,
    3.0: 0.032,
    5.0: 0.032,
    10.0: 0.032,
    Infinity: 0.032,
  },
  0.2: {
    0.1: 0.009,
    0.2: 0.018,
    0.3: 0.026,
    0.4: 0.033,
    0.5: 0.039,
    0.6: 0.043,
    0.7: 0.047,
    0.8: 0.05,
    0.9: 0.053,
    1.0: 0.055,
    1.2: 0.057,
    1.5: 0.059,
    2.0: 0.061,
    2.5: 0.062,
    3.0: 0.062,
    5.0: 0.062,
    10.0: 0.062,
    Infinity: 0.062,
  },
  0.3: {
    0.1: 0.013,
    0.2: 0.026,
    0.3: 0.037,
    0.4: 0.047,
    0.5: 0.056,
    0.6: 0.063,
    0.7: 0.069,
    0.8: 0.073,
    0.9: 0.077,
    1.0: 0.079,
    1.2: 0.083,
    1.5: 0.086,
    2.0: 0.089,
    2.5: 0.09,
    3.0: 0.09,
    5.0: 0.09,
    10.0: 0.09,
    Infinity: 0.09,
  },
  0.4: {
    0.1: 0.017,
    0.2: 0.033,
    0.3: 0.047,
    0.4: 0.06,
    0.5: 0.071,
    0.6: 0.08,
    0.7: 0.087,
    0.8: 0.093,
    0.9: 0.098,
    1.0: 0.101,
    1.2: 0.106,
    1.5: 0.11,
    2.0: 0.113,
    2.5: 0.115,
    3.0: 0.115,
    5.0: 0.115,
    10.0: 0.115,
    Infinity: 0.115,
  },
  0.5: {
    0.1: 0.02,
    0.2: 0.039,
    0.3: 0.056,
    0.4: 0.071,
    0.5: 0.084,
    0.6: 0.095,
    0.7: 0.103,
    0.8: 0.11,
    0.9: 0.116,
    1.0: 0.12,
    1.2: 0.126,
    1.5: 0.131,
    2.0: 0.135,
    2.5: 0.137,
    3.0: 0.137,
    5.0: 0.137,
    10.0: 0.137,
    Infinity: 0.137,
  },
  0.6: {
    0.1: 0.022,
    0.2: 0.043,
    0.3: 0.063,
    0.4: 0.08,
    0.5: 0.095,
    0.6: 0.107,
    0.7: 0.117,
    0.8: 0.125,
    0.9: 0.131,
    1.0: 0.136,
    1.2: 0.143,
    1.5: 0.149,
    2.0: 0.153,
    2.5: 0.155,
    3.0: 0.156,
    5.0: 0.156,
    10.0: 0.156,
    Infinity: 0.156,
  },
  0.7: {
    0.1: 0.024,
    0.2: 0.047,
    0.3: 0.069,
    0.4: 0.087,
    0.5: 0.103,
    0.6: 0.117,
    0.7: 0.128,
    0.8: 0.137,
    0.9: 0.144,
    1.0: 0.149,
    1.2: 0.157,
    1.5: 0.164,
    2.0: 0.169,
    2.5: 0.17,
    3.0: 0.171,
    5.0: 0.172,
    10.0: 0.172,
    Infinity: 0.172,
  },
  0.8: {
    0.1: 0.026,
    0.2: 0.05,
    0.3: 0.073,
    0.4: 0.093,
    0.5: 0.11,
    0.6: 0.125,
    0.7: 0.137,
    0.8: 0.146,
    0.9: 0.154,
    1.0: 0.16,
    1.2: 0.168,
    1.5: 0.176,
    2.0: 0.181,
    2.5: 0.183,
    3.0: 0.184,
    5.0: 0.185,
    10.0: 0.185,
    Infinity: 0.185,
  },
  0.9: {
    0.1: 0.027,
    0.2: 0.053,
    0.3: 0.077,
    0.4: 0.098,
    0.5: 0.116,
    0.6: 0.131,
    0.7: 0.144,
    0.8: 0.154,
    0.9: 0.162,
    1.0: 0.168,
    1.2: 0.178,
    1.5: 0.186,
    2.0: 0.192,
    2.5: 0.194,
    3.0: 0.195,
    5.0: 0.196,
    10.0: 0.196,
    Infinity: 0.196,
  },
  1.0: {
    0.1: 0.028,
    0.2: 0.055,
    0.3: 0.079,
    0.4: 0.101,
    0.5: 0.12,
    0.6: 0.136,
    0.7: 0.149,
    0.8: 0.16,
    0.9: 0.168,
    1.0: 0.175,
    1.2: 0.185,
    1.5: 0.193,
    2.0: 0.2,
    2.5: 0.202,
    3.0: 0.203,
    5.0: 0.204,
    10.0: 0.205,
    Infinity: 0.205,
  },
  1.2: {
    0.1: 0.029,
    0.2: 0.057,
    0.3: 0.083,
    0.4: 0.106,
    0.5: 0.126,
    0.6: 0.143,
    0.7: 0.157,
    0.8: 0.168,
    0.9: 0.178,
    1.0: 0.185,
    1.2: 0.196,
    1.5: 0.205,
    2.0: 0.212,
    2.5: 0.215,
    3.0: 0.216,
    5.0: 0.217,
    10.0: 0.218,
    Infinity: 0.218,
  },
  1.5: {
    0.1: 0.03,
    0.2: 0.059,
    0.3: 0.086,
    0.4: 0.11,
    0.5: 0.131,
    0.6: 0.149,
    0.7: 0.164,
    0.8: 0.176,
    0.9: 0.186,
    1.0: 0.193,
    1.2: 0.205,
    1.5: 0.215,
    2.0: 0.223,
    2.5: 0.226,
    3.0: 0.228,
    5.0: 0.229,
    10.0: 0.23,
    Infinity: 0.23,
  },
  2.0: {
    0.1: 0.031,
    0.2: 0.061,
    0.3: 0.089,
    0.4: 0.113,
    0.5: 0.135,
    0.6: 0.153,
    0.7: 0.169,
    0.8: 0.181,
    0.9: 0.192,
    1.0: 0.2,
    1.2: 0.212,
    1.5: 0.223,
    2.0: 0.232,
    2.5: 0.236,
    3.0: 0.238,
    5.0: 0.239,
    10.0: 0.24,
    Infinity: 0.24,
  },
  2.5: {
    0.1: 0.031,
    0.2: 0.062,
    0.3: 0.09,
    0.4: 0.115,
    0.5: 0.137,
    0.6: 0.155,
    0.7: 0.17,
    0.8: 0.183,
    0.9: 0.194,
    1.0: 0.202,
    1.2: 0.215,
    1.5: 0.226,
    2.0: 0.236,
    2.5: 0.24,
    3.0: 0.242,
    5.0: 0.244,
    10.0: 0.244,
    Infinity: 0.244,
  },
  3.0: {
    0.1: 0.032,
    0.2: 0.062,
    0.3: 0.09,
    0.4: 0.115,
    0.5: 0.137,
    0.6: 0.156,
    0.7: 0.171,
    0.8: 0.184,
    0.9: 0.195,
    1.0: 0.203,
    1.2: 0.216,
    1.5: 0.228,
    2.0: 0.238,
    2.5: 0.242,
    3.0: 0.244,
    5.0: 0.246,
    10.0: 0.247,
    Infinity: 0.247,
  },
  5.0: {
    0.1: 0.032,
    0.2: 0.062,
    0.3: 0.09,
    0.4: 0.115,
    0.5: 0.137,
    0.6: 0.156,
    0.7: 0.172,
    0.8: 0.185,
    0.9: 0.196,
    1.0: 0.204,
    1.2: 0.217,
    1.5: 0.229,
    2.0: 0.239,
    2.5: 0.244,
    3.0: 0.246,
    5.0: 0.249,
    10.0: 0.249,
    Infinity: 0.249,
  },
  10.0: {
    0.1: 0.032,
    0.2: 0.062,
    0.3: 0.09,
    0.4: 0.115,
    0.5: 0.137,
    0.6: 0.156,
    0.7: 0.172,
    0.8: 0.185,
    0.9: 0.196,
    1.0: 0.205,
    1.2: 0.218,
    1.5: 0.23,
    2.0: 0.24,
    2.5: 0.244,
    3.0: 0.247,
    5.0: 0.25,
    10.0: 0.25,
    Infinity: 0.25,
  },
  Infinity: {
    0.1: 0.032,
    0.2: 0.062,
    0.3: 0.09,
    0.4: 0.115,
    0.5: 0.137,
    0.6: 0.156,
    0.7: 0.172,
    0.8: 0.185,
    0.9: 0.196,
    1.0: 0.205,
    1.2: 0.218,
    1.5: 0.23,
    2.0: 0.24,
    2.5: 0.244,
    3.0: 0.247,
    5.0: 0.25,
    10.0: 0.25,
    Infinity: 0.25,
  },
};

/**
 * Pega valor mais próximo no ábaco (sem interpolação)
 */
function pegarValorMaisProximoAbaco(n: number, m: number): number {
  const n_vals = Object.keys(ABACO_NEWMARK)
    .map(Number)
    .filter((k) => k !== Infinity)
    .sort((a, b) => a - b);

  const m_vals = Object.keys(ABACO_NEWMARK[0.1])
    .map(Number)
    .filter((k) => k !== Infinity)
    .sort((a, b) => a - b);

  let n_mais_proximo: number;
  if (n > 10.0) {
    n_mais_proximo = Infinity;
  } else {
    n_mais_proximo = n_vals.reduce((prev, curr) =>
      Math.abs(curr - n) < Math.abs(prev - n) ? curr : prev
    );
  }

  let m_mais_proximo: number;
  if (m > 10.0) {
    m_mais_proximo = Infinity;
  } else {
    m_mais_proximo = m_vals.reduce((prev, curr) =>
      Math.abs(curr - m) < Math.abs(prev - m) ? curr : prev
    );
  }

  return ABACO_NEWMARK[n_mais_proximo][m_mais_proximo];
}

/**
 * Calcula Δσv usando ábaco de Newmark (tabelado)
 */
export function calcularAcrescimoNewmarkRetangularAbaco(
  carga: CargaRetangular,
  ponto: PontoInteresse
): number {
  const p = carga.intensidade;
  const B = carga.largura;
  const L = carga.comprimento;
  const z = ponto.z;

  const x_rel = ponto.x - carga.centro_x;
  const y_rel = ponto.y - carga.centro_y;

  // Na superfície
  if (z <= EPSILON) {
    if (Math.abs(x_rel) <= B / 2 && Math.abs(y_rel) <= L / 2) {
      return p;
    } else {
      return 0.0;
    }
  }

  // Superposição de 4 quadrantes
  const dist_direita = B / 2 - x_rel;
  const dist_esquerda = B / 2 + x_rel;
  const dist_frente = L / 2 - y_rel;
  const dist_tras = L / 2 + y_rel;

  let I_total = 0.0;

  const sinal_x_dir = dist_direita > EPSILON ? 1.0 : -1.0;
  const sinal_x_esq = dist_esquerda > EPSILON ? 1.0 : -1.0;
  const sinal_y_frente = dist_frente > EPSILON ? 1.0 : -1.0;
  const sinal_y_tras = dist_tras > EPSILON ? 1.0 : -1.0;

  // Quadrante 1
  const n1 = Math.abs(dist_direita) / z;
  const m1 = Math.abs(dist_frente) / z;
  const I_1 = sinal_x_dir * sinal_y_frente * pegarValorMaisProximoAbaco(n1, m1);
  I_total += I_1;

  // Quadrante 2
  const n2 = Math.abs(dist_direita) / z;
  const m2 = Math.abs(dist_tras) / z;
  const I_2 = sinal_x_dir * sinal_y_tras * pegarValorMaisProximoAbaco(n2, m2);
  I_total += I_2;

  // Quadrante 3
  const n3 = Math.abs(dist_esquerda) / z;
  const m3 = Math.abs(dist_frente) / z;
  const I_3 = sinal_x_esq * sinal_y_frente * pegarValorMaisProximoAbaco(n3, m3);
  I_total += I_3;

  // Quadrante 4
  const n4 = Math.abs(dist_esquerda) / z;
  const m4 = Math.abs(dist_tras) / z;
  const I_4 = sinal_x_esq * sinal_y_tras * pegarValorMaisProximoAbaco(n4, m4);
  I_total += I_4;

  const delta_sigma_v = p * I_total;
  return Math.max(0.0, delta_sigma_v);
}

/**
 * Calcula fator de influência usando fórmula analítica de Newmark
 */
function calcularFatorInfluencia(a: number, b: number, profundidade: number): number {
  if (a <= EPSILON || b <= EPSILON || profundidade <= EPSILON) {
    return 0.0;
  }

  const m = a / profundidade;
  const n = b / profundidade;

  const m2 = m * m;
  const n2 = n * n;
  const m2n2 = m2 * n2;
  const termo_base = m2 + n2 + 1.0;
  const raiz = Math.sqrt(termo_base);

  // Primeiro termo
  const numerador_1 = 2 * m * n * raiz * (m2 + n2 + 2.0);
  const denominador_1 = (termo_base + m2n2) * termo_base;

  let termo_1: number;
  if (Math.abs(denominador_1) < EPSILON) {
    termo_1 = 0.0;
  } else {
    termo_1 = numerador_1 / denominador_1;
  }

  // Segundo termo (arctan)
  const numerador_arctan = 2 * m * n * raiz;
  const denominador_arctan = termo_base - m2n2;

  let termo_2: number;
  if (Math.abs(denominador_arctan) < EPSILON) {
    if (numerador_arctan > EPSILON) {
      termo_2 = PI / 2.0;
    } else if (numerador_arctan < -EPSILON) {
      termo_2 = -PI / 2.0;
    } else {
      termo_2 = 0.0;
    }
  } else {
    termo_2 = Math.atan(numerador_arctan / denominador_arctan);
    // Ajusta quadrante
    if (denominador_arctan < 0) {
      if (numerador_arctan >= 0) {
        termo_2 += PI;
      } else {
        termo_2 -= PI;
      }
    }
  }

  const fator_I = (1.0 / (4.0 * PI)) * (termo_1 + termo_2);
  return fator_I;
}

/**
 * Calcula Δσv usando fórmula analítica de Newmark
 */
export function calcularAcrescimoNewmarkRetangularFormula(
  carga: CargaRetangular,
  ponto: PontoInteresse
): { delta_sigma_v: number; detalhes: any } {
  const p = carga.intensidade;
  const B = carga.largura;
  const L = carga.comprimento;
  const z = ponto.z;

  const x_rel = ponto.x - carga.centro_x;
  const y_rel = ponto.y - carga.centro_y;

  // Na superfície
  if (z <= EPSILON) {
    if (Math.abs(x_rel) <= B / 2 && Math.abs(y_rel) <= L / 2) {
      return { delta_sigma_v: p, detalhes: null };
    } else {
      return { delta_sigma_v: 0.0, detalhes: null };
    }
  }

  // Distâncias aos lados
  const dist_direita = B / 2 - x_rel;
  const dist_esquerda = B / 2 + x_rel;
  const dist_frente = L / 2 - y_rel;
  const dist_tras = L / 2 + y_rel;

  let I_total = 0.0;

  const sinal_x_dir = dist_direita > EPSILON ? 1.0 : -1.0;
  const sinal_x_esq = dist_esquerda > EPSILON ? 1.0 : -1.0;
  const sinal_y_frente = dist_frente > EPSILON ? 1.0 : -1.0;
  const sinal_y_tras = dist_tras > EPSILON ? 1.0 : -1.0;

  // Quadrante 1
  const I_1 =
    sinal_x_dir *
    sinal_y_frente *
    calcularFatorInfluencia(Math.abs(dist_direita), Math.abs(dist_frente), z);

  // Quadrante 2
  const I_2 =
    sinal_x_dir *
    sinal_y_tras *
    calcularFatorInfluencia(Math.abs(dist_direita), Math.abs(dist_tras), z);

  // Quadrante 3
  const I_3 =
    sinal_x_esq *
    sinal_y_frente *
    calcularFatorInfluencia(Math.abs(dist_esquerda), Math.abs(dist_frente), z);

  // Quadrante 4
  const I_4 =
    sinal_x_esq *
    sinal_y_tras *
    calcularFatorInfluencia(Math.abs(dist_esquerda), Math.abs(dist_tras), z);

  I_total = I_1 + I_2 + I_3 + I_4;

  const delta_sigma_v = p * I_total;

  // Detalhes do cálculo
  const detalhes = {
    x_rel: Number(x_rel.toFixed(3)),
    y_rel: Number(y_rel.toFixed(3)),
    z: Number(z.toFixed(3)),
    distancias: {
      dist_direita: Number(dist_direita.toFixed(3)),
      dist_esquerda: Number(dist_esquerda.toFixed(3)),
      dist_frente: Number(dist_frente.toFixed(3)),
      dist_tras: Number(dist_tras.toFixed(3)),
    },
    quadrantes: [
      {
        nome: 'Q1 (dir+frente)',
        a: Number(Math.abs(dist_direita).toFixed(3)),
        b: Number(Math.abs(dist_frente).toFixed(3)),
        m: Number((Math.abs(dist_direita) / z).toFixed(4)),
        n: Number((Math.abs(dist_frente) / z).toFixed(4)),
        I: Number(
          Math.abs(
            calcularFatorInfluencia(Math.abs(dist_direita), Math.abs(dist_frente), z)
          ).toFixed(6)
        ),
        I_com_sinal: Number(I_1.toFixed(6)),
        sinal: sinal_x_dir * sinal_y_frente > 0 ? '+' : '-',
      },
      {
        nome: 'Q2 (dir+trás)',
        a: Number(Math.abs(dist_direita).toFixed(3)),
        b: Number(Math.abs(dist_tras).toFixed(3)),
        m: Number((Math.abs(dist_direita) / z).toFixed(4)),
        n: Number((Math.abs(dist_tras) / z).toFixed(4)),
        I: Number(
          Math.abs(
            calcularFatorInfluencia(Math.abs(dist_direita), Math.abs(dist_tras), z)
          ).toFixed(6)
        ),
        I_com_sinal: Number(I_2.toFixed(6)),
        sinal: sinal_x_dir * sinal_y_tras > 0 ? '+' : '-',
      },
      {
        nome: 'Q3 (esq+frente)',
        a: Number(Math.abs(dist_esquerda).toFixed(3)),
        b: Number(Math.abs(dist_frente).toFixed(3)),
        m: Number((Math.abs(dist_esquerda) / z).toFixed(4)),
        n: Number((Math.abs(dist_frente) / z).toFixed(4)),
        I: Number(
          Math.abs(
            calcularFatorInfluencia(Math.abs(dist_esquerda), Math.abs(dist_frente), z)
          ).toFixed(6)
        ),
        I_com_sinal: Number(I_3.toFixed(6)),
        sinal: sinal_x_esq * sinal_y_frente > 0 ? '+' : '-',
      },
      {
        nome: 'Q4 (esq+trás)',
        a: Number(Math.abs(dist_esquerda).toFixed(3)),
        b: Number(Math.abs(dist_tras).toFixed(3)),
        m: Number((Math.abs(dist_esquerda) / z).toFixed(4)),
        n: Number((Math.abs(dist_tras) / z).toFixed(4)),
        I: Number(
          Math.abs(
            calcularFatorInfluencia(Math.abs(dist_esquerda), Math.abs(dist_tras), z)
          ).toFixed(6)
        ),
        I_com_sinal: Number(I_4.toFixed(6)),
        sinal: sinal_x_esq * sinal_y_tras > 0 ? '+' : '-',
      },
    ],
    I_total: Number(I_total.toFixed(6)),
    p: Number(p.toFixed(2)),
    delta_sigma_v: Number(Math.max(0.0, delta_sigma_v).toFixed(4)),
  };

  return {
    delta_sigma_v: Math.max(0.0, delta_sigma_v),
    detalhes,
  };
}

/**
 * Wrapper para Newmark (escolhe entre ábaco ou fórmula)
 */
export function calcularAcrescimoNewmarkRetangular(
  carga: CargaRetangular,
  ponto: PontoInteresse,
  usar_abaco: boolean = false
): { delta_sigma_v: number; detalhes?: any } {
  if (usar_abaco) {
    return {
      delta_sigma_v: calcularAcrescimoNewmarkRetangularAbaco(carga, ponto),
    };
  } else {
    return calcularAcrescimoNewmarkRetangularFormula(carga, ponto);
  }
}

// ==================== FUNÇÃO PRINCIPAL ====================

/**
 * Calcula acréscimo de tensão com base no tipo de carga
 */
export function calcularAcrescimoTensoes(dados: AcrescimoTensoesInput): AcrescimoTensoesOutput {
  try {
    const tipo = dados.tipo_carga.toLowerCase();
    const ponto = dados.ponto_interesse;

    if (ponto.z <= EPSILON) {
      throw new Error('Profundidade (z) do ponto de interesse deve ser maior que zero.');
    }

    let delta_sigma: number | undefined;
    let metodo: string | undefined;
    let detalhes_calculo: any = undefined;

    if (tipo === 'pontual') {
      if (!dados.carga_pontual) {
        throw new Error("Dados de 'carga_pontual' necessários.");
      }
      delta_sigma = calcularAcrescimoBoussinesqPontual(dados.carga_pontual, ponto);
      metodo = 'Boussinesq (Pontual)';
    } else if (tipo === 'faixa') {
      if (!dados.carga_faixa) {
        throw new Error("Dados de 'carga_faixa' necessários.");
      }
      delta_sigma = calcularAcrescimoCarothersFaixa(dados.carga_faixa, ponto);
      metodo = 'Carothers (Faixa)';
    } else if (tipo === 'circular') {
      if (!dados.carga_circular) {
        throw new Error("Dados de 'carga_circular' necessários.");
      }
      delta_sigma = calcularAcrescimoLoveCircularAbaco(dados.carga_circular, ponto);
      metodo = 'Love (Circular - Ábaco)';
    } else if (tipo === 'retangular') {
      if (!dados.carga_retangular) {
        throw new Error("Dados de 'carga_retangular' necessários.");
      }
      const usar_abaco = dados.usar_abaco_newmark ?? false;
      const resultado = calcularAcrescimoNewmarkRetangular(
        dados.carga_retangular,
        ponto,
        usar_abaco
      );
      delta_sigma = resultado.delta_sigma_v;
      detalhes_calculo = resultado.detalhes;
      const metodo_tipo = usar_abaco ? 'Ábaco' : 'Fórmula';
      metodo = `Newmark (Retangular - ${metodo_tipo})`;
    } else {
      return {
        erro: `Tipo de carga '${dados.tipo_carga}' não suportado.`,
      };
    }

    if (delta_sigma === undefined || isNaN(delta_sigma)) {
      return {
        metodo,
        erro: 'Cálculo resultou em valor indefinido (NaN). Verifique os dados.',
      };
    }

    return {
      delta_sigma_v: Number(delta_sigma.toFixed(4)),
      metodo,
      detalhes: detalhes_calculo,
    };
  } catch (error) {
    return {
      erro: error instanceof Error ? error.message : 'Erro interno no cálculo.',
    };
  }
}

// ==================== UTILITÁRIOS ====================

/**
 * Interpolação linear simples
 */
function interpolacaoLinear(x: number, xVals: number[], yVals: number[]): number {
  for (let i = 0; i < xVals.length - 1; i++) {
    if (x >= xVals[i] && x <= xVals[i + 1]) {
      const t = (x - xVals[i]) / (xVals[i + 1] - xVals[i]);
      return yVals[i] + t * (yVals[i + 1] - yVals[i]);
    }
  }
  return yVals[yVals.length - 1];
}

