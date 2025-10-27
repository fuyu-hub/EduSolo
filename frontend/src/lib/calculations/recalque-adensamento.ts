/**
 * Módulo para Cálculo de Recalque por Adensamento Primário
 * Baseado na Teoria de Terzaghi
 */

import type { RecalqueAdensamentoInput, RecalqueAdensamentoOutput } from '../schemas/outros-modulos';

const EPSILON = 1e-9;

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

    return {
      recalque_total_primario: Number(recalque_total.toFixed(4)),
      deformacao_volumetrica: Number(epsilon_v.toFixed(5)),
      tensao_efetiva_final: Number(sigma_vf_prime.toFixed(2)),
      estado_adensamento,
      RPA: Number(RPA.toFixed(2)),
    };
  } catch (error) {
    return {
      erro: error instanceof Error ? error.message : 'Erro no cálculo de recalque',
    };
  }
}

