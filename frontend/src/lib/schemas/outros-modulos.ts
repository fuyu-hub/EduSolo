/**
 * Schemas para outros módulos (recalque, tempo adensamento, etc)
 */

import { z } from 'zod';

// Recalque por Adensamento
const TempoAdensamentoPercentualSchema = z.object({
  grau: z.number(),
  fator_tempo_exato: z.number().nullable(),
  fator_tempo_aproximado: z.number().nullable(),
  tempo_anos_exato: z.number().nullable(),
  tempo_anos_aproximado: z.number().nullable(),
  tempo_meses_exato: z.number().nullable(),
  tempo_meses_aproximado: z.number().nullable(),
  recalque_exato: z.number().nullable(),
  recalque_aproximado: z.number().nullable(),
});

const TempoAdensamentoTempoSchema = z.object({
  tempo_anos: z.number(),
  tempo_meses: z.number(),
  grau_exato: z.number(),
  grau_aproximado: z.number(),
  recalque_exato: z.number(),
  recalque_aproximado: z.number(),
});

const TempoAdensamentoResumoSchema = z.object({
  grau: z.number(),
  tempo_anos_exato: z.number().nullable(),
  tempo_anos_aproximado: z.number().nullable(),
});

const TempoAdensamentoResultadoSchema = z.object({
  coeficiente_adensamento: z.number(),
  altura_drenagem: z.number(),
  drenagem_dupla: z.boolean(),
  tabela_por_percentual: z.array(TempoAdensamentoPercentualSchema),
  tabela_por_tempo: z.array(TempoAdensamentoTempoSchema),
  destaques: z
    .object({
      U50: TempoAdensamentoResumoSchema.optional(),
      U70: TempoAdensamentoResumoSchema.optional(),
      U90: TempoAdensamentoResumoSchema.optional(),
    })
    .optional(),
});

export const RecalqueAdensamentoInputSchema = z.object({
  espessura_camada: z.number().positive(),
  indice_vazios_inicial: z.number().positive(),
  Cc: z.number().positive(),
  Cr: z.number().positive(),
  tensao_efetiva_inicial: z.number().positive(),
  tensao_pre_adensamento: z.number().positive(),
  acrescimo_tensao: z.number().nonnegative(),
  coeficiente_adensamento: z.number().positive().optional(),
  altura_drenagem: z.number().positive().optional(),
  drenagem_dupla: z.boolean().optional(),
});

export const RecalqueAdensamentoOutputSchema = z.object({
  recalque_total_primario: z.number().optional(),
  deformacao_volumetrica: z.number().optional(),
  tensao_efetiva_final: z.number().optional(),
  estado_adensamento: z.string().optional(),
  RPA: z.number().optional(),
  tempo_adensamento: TempoAdensamentoResultadoSchema.optional(),
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

