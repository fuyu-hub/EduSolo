/**
 * Módulo para Cálculo de Recalque por Adensamento Primário
 * Baseado na Teoria de Terzaghi
 */

import type { RecalqueAdensamentoInput, RecalqueAdensamentoOutput } from '../schemas/outros-modulos';

const EPSILON = 1e-9;
const SERIES_TERMS = 60;
const TOLERANCIA_GRAU = 1e-6;

const round = (valor: number | null | undefined, casas: number) =>
  valor === null || valor === undefined ? null : Number(valor.toFixed(casas));

function grauAdensamentoMedio(Tv: number): number {
  if (Tv <= 0) {
    return 0;
  }

  let soma = 0;
  for (let m = 0; m < SERIES_TERMS; m++) {
    const fator = 2 * m + 1;
    const expoente = -((fator ** 2) * Math.PI ** 2 * Tv) / 4;
    soma += (1 / (fator ** 2)) * Math.exp(expoente);
  }

  const resultado = 1 - ((8 / Math.PI ** 2) * soma);
  return resultado < 0 ? 0 : resultado > 1 ? 1 : resultado;
}

function calcularTvExato(grau: number): number | null {
  if (grau <= 0) return 0;
  if (grau >= 0.999999) return null;

  const alvo = Math.min(Math.max(grau, 1e-6), 0.999999);
  let inferior = 0;
  let superior = 1;
  let valorSuperior = grauAdensamentoMedio(superior);
  let iteracoes = 0;

  while (valorSuperior < alvo && superior < 1e6) {
    superior *= 2;
    valorSuperior = grauAdensamentoMedio(superior);
    iteracoes++;
    if (iteracoes > 60) break;
  }

  let resultadoAtual = superior;
  for (let i = 0; i < 80; i++) {
    resultadoAtual = (inferior + superior) / 2;
    const valor = grauAdensamentoMedio(resultadoAtual);
    if (Math.abs(valor - alvo) < TOLERANCIA_GRAU) {
      return resultadoAtual;
    }
    if (valor < alvo) {
      inferior = resultadoAtual;
    } else {
      superior = resultadoAtual;
    }
  }

  return resultadoAtual;
}

function calcularTvAproximado(grau: number): number | null {
  if (grau <= 0) return 0;
  if (grau >= 1) return null;

  if (grau < 0.6) {
    return (Math.PI / 4) * grau * grau;
  }

  const restante = 1 - grau;
  if (restante <= 0) {
    return null;
  }

  return -0.933 * (Math.log(restante) / Math.LN10) - 0.085;
}

function grauAproximadoAPartirDeTv(Tv: number): number {
  if (Tv <= 0) return 0;

  const tvCritico = (Math.PI / 4) * 0.6 * 0.6;
  if (Tv <= tvCritico) {
    const grau = Math.sqrt((4 * Tv) / Math.PI);
    return Math.min(Math.max(grau, 0), 0.6);
  }

  const expoente = -(Tv + 0.085) / 0.933;
  const grau = 1 - Math.pow(10, expoente);
  return grau > 1 ? 1 : grau;
}

export function calcularRecalqueAdensamento(
  dados: RecalqueAdensamentoInput
): RecalqueAdensamentoOutput {
  try {
    const H0 = dados.espessura_camada;
    const e0 = dados.indice_vazios_inicial;
    const Cc = dados.Cc;
    const Cr = dados.Cr;
    const sigma_v0_prime = dados.tensao_efetiva_inicial;
    const sigma_vm_prime = dados.tensao_pre_adensamento;
    const delta_sigma_prime = dados.acrescimo_tensao;

    // Validações
    if (H0 <= 0 || e0 <= 0 || Cc <= 0 || Cr <= 0 || sigma_v0_prime <= 0 || sigma_vm_prime <= 0 || delta_sigma_prime < 0) {
      throw new Error(
        'Valores de entrada inválidos (espessura, e0, Cc, Cr, tensões devem ser positivos, Δσ\' >= 0).'
      );
    }
    if (1 + e0 <= EPSILON) {
      throw new Error('Índice de vazios inicial (e0) inválido.');
    }

    // Calcula tensão efetiva final
    const sigma_vf_prime = sigma_v0_prime + delta_sigma_prime;

    // Calcula Razão de Pré-Adensamento (RPA ou OCR)
    const RPA = sigma_vm_prime / sigma_v0_prime;

    // Determina o estado de adensamento e calcula a deformação volumétrica
    let epsilon_v = 0.0;
    let estado_adensamento = '';

    // Caso 1: Solo Normalmente Adensado (NA)
    if (Math.abs(RPA - 1.0) < 0.1) {
      estado_adensamento = 'Normalmente Adensado (RPA ≈ 1)';
      if (sigma_v0_prime <= EPSILON) {
        throw new Error('Tensão efetiva inicial não pode ser zero para solo NA.');
      }
      epsilon_v = (Cc / (1 + e0)) * Math.log10(sigma_vf_prime / sigma_v0_prime);
    }
    // Caso 2: Solo Pré-Adensado (PA)
    else if (RPA > 1.0) {
      estado_adensamento = 'Pré-Adensado (RPA > 1)';
      // Caso 2a: Tensão final NÃO excede a tensão de pré-adensamento
      if (sigma_vf_prime <= sigma_vm_prime) {
        if (sigma_v0_prime <= EPSILON) {
          throw new Error('Tensão efetiva inicial não pode ser zero.');
        }
        epsilon_v = (Cr / (1 + e0)) * Math.log10(sigma_vf_prime / sigma_v0_prime);
      }
      // Caso 2b: Tensão final EXCEDE a tensão de pré-adensamento
      else {
        if (sigma_v0_prime <= EPSILON || sigma_vm_prime <= EPSILON) {
          throw new Error('Tensões inicial e de pré-adensamento devem ser maiores que zero.');
        }
        epsilon_v =
          (Cr / (1 + e0)) * Math.log10(sigma_vm_prime / sigma_v0_prime) +
          (Cc / (1 + e0)) * Math.log10(sigma_vf_prime / sigma_vm_prime);
      }
    }
    // Caso 3: Solo Sub-Adensado (RPA < 1)
    else {
      estado_adensamento = 'Sub-Adensado (RPA < 1) - Cálculo como Normalmente Adensado';
      if (sigma_v0_prime <= EPSILON) {
        throw new Error('Tensão efetiva inicial não pode ser zero.');
      }
      epsilon_v = (Cc / (1 + e0)) * Math.log10(sigma_vf_prime / sigma_v0_prime);
    }

    // Calcula o recalque total primário
    const recalque_total = epsilon_v * H0;

    let tempoAdensamento: RecalqueAdensamentoOutput['tempo_adensamento'];

    if (
      dados.coeficiente_adensamento &&
      dados.coeficiente_adensamento > 0 &&
      dados.altura_drenagem &&
      dados.altura_drenagem > 0
    ) {
      const Cv = dados.coeficiente_adensamento;
      const Hd = dados.altura_drenagem;
      const drenagemDupla = dados.drenagem_dupla ?? false;

      const percentuaisBase = [
        0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 95, 99,
      ];

      const tabelaPorPercentual = percentuaisBase.map((percentual) => {
        const grauDecimal = percentual / 100;
        const tvExato = percentual >= 100 ? null : calcularTvExato(grauDecimal);
        const tvAprox = percentual >= 100 ? null : calcularTvAproximado(grauDecimal);

        const tempoAnosExato = tvExato === null ? null : (tvExato * Hd * Hd) / Cv;
        const tempoAnosAprox = tvAprox === null ? null : (tvAprox * Hd * Hd) / Cv;

        return {
          grau: percentual,
          fator_tempo_exato: round(tvExato, 4),
          fator_tempo_aproximado: round(tvAprox, 4),
          tempo_anos_exato: round(tempoAnosExato, 3),
          tempo_anos_aproximado: round(tempoAnosAprox, 3),
          tempo_meses_exato: round(
            tempoAnosExato === null ? null : tempoAnosExato * 12,
            2,
          ),
          tempo_meses_aproximado: round(
            tempoAnosAprox === null ? null : tempoAnosAprox * 12,
            2,
          ),
          recalque_exato: round(
            tempoAnosExato === null ? null : recalque_total * grauDecimal,
            4,
          ),
          recalque_aproximado: round(
            tempoAnosAprox === null ? null : recalque_total * grauDecimal,
            4,
          ),
        };
      });

      const temposRelevantes = tabelaPorPercentual
        .flatMap((item) => [item.tempo_anos_exato, item.tempo_anos_aproximado])
        .filter((valor): valor is number => valor !== null && !Number.isNaN(valor));

      const tempoMaximo = temposRelevantes.length
        ? Math.max(...temposRelevantes)
        : 0;

      const tempoLimite = tempoMaximo > 0 ? tempoMaximo : 1;
      const stepBase = tempoLimite > 4 ? 0.5 : tempoLimite > 1 ? 0.25 : 0.1;
      const passo = Math.max(stepBase, 0.1);
      const tempoFinal = tempoLimite * 1.2;

      const tabelaPorTempo: {
        tempo_anos: number;
        tempo_meses: number;
        grau_exato: number;
        grau_aproximado: number;
        recalque_exato: number;
        recalque_aproximado: number;
      }[] = [];

      for (let tempo = 0; tempo <= tempoFinal + 1e-6; tempo += passo) {
        const tempoFormatado = Number(tempo.toFixed(3));
        const Tv = (Cv * tempoFormatado) / (Hd * Hd);
        const grauExato = grauAdensamentoMedio(Tv);
        const grauAprox = grauAproximadoAPartirDeTv(Tv);

        tabelaPorTempo.push({
          tempo_anos: round(tempoFormatado, 3) ?? 0,
          tempo_meses: Number((tempoFormatado * 12).toFixed(2)),
          grau_exato: Number((grauExato * 100).toFixed(2)),
          grau_aproximado: Number((grauAprox * 100).toFixed(2)),
          recalque_exato: Number((recalque_total * grauExato).toFixed(4)),
          recalque_aproximado: Number((recalque_total * grauAprox).toFixed(4)),
        });

        if (tabelaPorTempo.length >= 40) {
          break;
        }
      }

      const obterResumo = (percentual: number) => {
        const item = tabelaPorPercentual.find((linha) => linha.grau === percentual);
        if (!item) return undefined;
        return {
          grau: percentual,
          tempo_anos_exato: item.tempo_anos_exato,
          tempo_anos_aproximado: item.tempo_anos_aproximado,
        };
      };

      tempoAdensamento = {
        coeficiente_adensamento: Number(Cv.toFixed(2)),
        altura_drenagem: Number(Hd.toFixed(4)),
        drenagem_dupla: drenagemDupla,
        tabela_por_percentual: tabelaPorPercentual,
        tabela_por_tempo: tabelaPorTempo,
        destaques: {
          U50: obterResumo(50),
          U70: obterResumo(70),
          U90: obterResumo(90),
        },
      };
    }

    return {
      recalque_total_primario: Number(recalque_total.toFixed(4)),
      deformacao_volumetrica: Number(epsilon_v.toFixed(5)),
      tensao_efetiva_final: Number(sigma_vf_prime.toFixed(2)),
      estado_adensamento,
      RPA: Number(RPA.toFixed(2)),
      tempo_adensamento: tempoAdensamento,
    };
  } catch (error) {
    return {
      erro: error instanceof Error ? error.message : 'Erro no cálculo de recalque',
    };
  }
}

