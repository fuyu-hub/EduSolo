/**
 * Schemas para outros módulos (recalque, tempo adensamento, etc)
 */

import { z } from 'zod';

// Recalque por Adensamento
export const RecalqueAdensamentoInputSchema = z.object({
  espessura_camada: z.number().positive(),
  indice_vazios_inicial: z.number().positive(),
  Cc: z.number().positive(),
  Cr: z.number().positive(),
  tensao_efetiva_inicial: z.number().positive(),
  tensao_pre_adensamento: z.number().positive(),
  acrescimo_tensao: z.number().nonnegative(),
});

export const RecalqueAdensamentoOutputSchema = z.object({
  recalque_total_primario: z.number().optional(),
  deformacao_volumetrica: z.number().optional(),
  tensao_efetiva_final: z.number().optional(),
  estado_adensamento: z.string().optional(),
  RPA: z.number().optional(),
  erro: z.string().optional(),
});

// Tempo de Adensamento
export const TempoAdensamentoInputSchema = z.object({
  recalque_total_primario: z.number().positive(),
  coeficiente_adensamento: z.number().positive(),
  altura_drenagem: z.number().positive(),
  tempo: z.number().nonnegative().optional(),
  grau_adensamento_medio: z.number().min(0).max(100).optional(),
});

export const TempoAdensamentoOutputSchema = z.object({
  tempo_calculado: z.number().optional(),
  recalque_no_tempo: z.number().optional(),
  grau_adensamento_medio_calculado: z.number().optional(),
  fator_tempo: z.number().optional(),
  erro: z.string().optional(),
});

// Exportar tipos
export type RecalqueAdensamentoInput = z.infer<typeof RecalqueAdensamentoInputSchema>;
export type RecalqueAdensamentoOutput = z.infer<typeof RecalqueAdensamentoOutputSchema>;
export type TempoAdensamentoInput = z.infer<typeof TempoAdensamentoInputSchema>;
export type TempoAdensamentoOutput = z.infer<typeof TempoAdensamentoOutputSchema>;

