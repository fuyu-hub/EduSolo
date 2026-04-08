/**
 * Módulo para Cálculo de Tempo de Adensamento
 * Baseado na Teoria de Terzaghi
 */

import type { TempoAdensamentoInput, TempoAdensamentoOutput } from '../schemas/outros-modulos';

const PI = Math.PI;
const EPSILON = 1e-9;

function calcularTvDeUz(Uz_percent: number): number | null {
  if (Uz_percent < 0 || Uz_percent > 100) {
    return null;
  }
  if (Math.abs(Uz_percent - 100.0) < EPSILON) {
    return Infinity;
  }

  const Uz = Uz_percent / 100.0;
  if (Uz <= 0.6) {
    return (PI / 4) * (Uz * Uz);
  } else {
    return -0.933 * Math.log10(1 - Uz) - 0.085;
  }
}

function calcularUzDeTv(Tv: number): number | null {
  if (Tv < 0) {
    return null;
  }
  if (Tv === 0) {
    return 0.0;
  }

  let Uz: number;
  if (Tv <= 0.283) {
    // Corresponde a U ~ 60%
    Uz = Math.sqrt((4 * Tv) / PI);
  } else {
    try {
      const exponent = -(Tv + 0.085) / 0.933;
      if (exponent < -30) {
        Uz = 1.0;
      } else {
        Uz = 1 - Math.pow(10, exponent);
      }
    } catch {
      Uz = 1.0;
    }
  }

  // Garante que Uz esteja entre 0 e 1
  Uz = Math.max(0, Math.min(1, Uz));
  return Uz * 100;
}

export function calcularTempoAdensamento(dados: TempoAdensamentoInput): TempoAdensamentoOutput {
  try {
    const delta_H_total = dados.recalque_total_primario;
    const Cv = dados.coeficiente_adensamento;
    const Hd = dados.altura_drenagem;

    if (delta_H_total <= 0 || Cv <= 0 || Hd <= 0) {
      throw new Error('Recalque total, Cv e Hd devem ser positivos.');
    }
    if (dados.tempo === undefined && dados.grau_adensamento_medio === undefined) {
      throw new Error("É necessário fornecer 'tempo' ou 'grau_adensamento_medio'.");
    }
    if (dados.tempo !== undefined && dados.grau_adensamento_medio !== undefined) {
      throw new Error("Forneça apenas 'tempo' OU 'grau_adensamento_medio', não ambos.");
    }

    let tempo_calculado: number | undefined;
    let recalque_no_tempo: number | undefined;
    let Uz_calculado: number | undefined;
    let Tv_calculado: number | undefined;

    // Caso 1: Calcular tempo para atingir Uz
    if (dados.grau_adensamento_medio !== undefined) {
      const Uz_desejado = dados.grau_adensamento_medio;
      Tv_calculado = calcularTvDeUz(Uz_desejado);
      
      if (Tv_calculado === null) {
        throw new Error('Grau de adensamento médio inválido (deve ser entre 0 e 100).');
      }
      
      if (!isFinite(Tv_calculado)) {
        tempo_calculado = Infinity;
        recalque_no_tempo = delta_H_total;
        Uz_calculado = 100.0;
      } else {
        tempo_calculado = (Tv_calculado * (Hd * Hd)) / Cv;
        recalque_no_tempo = (Uz_desejado / 100.0) * delta_H_total;
        Uz_calculado = Uz_desejado;
      }
    }
    // Caso 2: Calcular recalque e Uz num dado tempo
    else if (dados.tempo !== undefined) {
      const tempo = dados.tempo;
      if (tempo < 0) {
        throw new Error('Tempo deve ser não-negativo.');
      }
      
      if (tempo === 0) {
        Tv_calculado = 0.0;
        Uz_calculado = 0.0;
        recalque_no_tempo = 0.0;
      } else {
        Tv_calculado = (Cv * tempo) / (Hd * Hd);
        Uz_calculado = calcularUzDeTv(Tv_calculado);
        
        if (Uz_calculado === null) {
          throw new Error('Erro ao calcular Uz a partir de Tv.');
        }
        
        recalque_no_tempo = (Uz_calculado / 100.0) * delta_H_total;
      }
      tempo_calculado = tempo;
    }

    return {
      tempo_calculado:
        tempo_calculado !== undefined && isFinite(tempo_calculado)
          ? Number(tempo_calculado.toFixed(3))
          : tempo_calculado,
      recalque_no_tempo:
        recalque_no_tempo !== undefined ? Number(recalque_no_tempo.toFixed(4)) : undefined,
      grau_adensamento_medio_calculado:
        Uz_calculado !== undefined ? Number(Uz_calculado.toFixed(2)) : undefined,
      fator_tempo:
        Tv_calculado !== undefined && isFinite(Tv_calculado)
          ? Number(Tv_calculado.toFixed(4))
          : Tv_calculado,
    };
  } catch (error) {
    return {
      erro: error instanceof Error ? error.message : 'Erro no cálculo de tempo de adensamento',
    };
  }
}

