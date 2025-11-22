/**
 * Schemas para Análise Granulométrica
 */

import { z } from 'zod';

export const PeneiraDadoSchema = z.object({
  abertura: z.number().positive(),
  massa_retida: z.number().nonnegative(),
  peneira: z.string().optional(),
});

export const PeneiramentoGrossoSchema = z.object({
  massa_total_umida: z.number().positive(), // MTU - Massa Total Úmida
  massa_total_seca: z.number().positive(), // MTS - Massa Total Seca
  teor_umidade: z.number().nonnegative().optional(), // w - Teor de Umidade (%)
  massa_graos: z.number().positive(), // MG - Massa dos Grãos (retida até #10)
  peneiras: z.array(PeneiraDadoSchema).min(1), // Peneiras do grosso (até #10)
});

export const PeneiramentoFinoSchema = z.object({
  massa_total_umida: z.number().positive().optional(), // MTU Fino - opcional pois pode ser calculado
  massa_total_seca: z.number().positive(), // MTS Fino - Usado como denominador na fração fina
  teor_umidade: z.number().nonnegative().optional(),
  massa_fina_seca: z.number().positive().optional(), // Mantido para compatibilidade ou cálculo interno
  peneiras: z.array(PeneiraDadoSchema).min(1), // Peneiras do fino (#40, #80, #200, etc.)
  fator_n: z.number().positive().optional(), // N - Fração que a Massa Fina representa do total
});

export const GranulometriaInputSchema = z.object({
  peneiramento_grosso: PeneiramentoGrossoSchema,
  peneiramento_fino: PeneiramentoFinoSchema.optional(),
  ll: z.number().nonnegative().optional(),
  lp: z.number().nonnegative().optional(),
});

export const PontoGranulometricoSchema = z.object({
  peneira: z.string().optional(),
  abertura: z.number(),
  massa_retida: z.number(),
  porc_retida: z.number(),
  porc_retida_acum: z.number(),
  porc_passante: z.number(),
});

export const GranulometriaOutputSchema = z.object({
  dados_granulometricos: z.array(PontoGranulometricoSchema),
  percentagem_pedregulho: z.number().optional(),
  percentagem_areia: z.number().optional(),
  percentagem_finos: z.number().optional(),
  d10: z.number().optional(),
  d30: z.number().optional(),
  d60: z.number().optional(),
  coef_uniformidade: z.number().optional(),
  coef_curvatura: z.number().optional(),
  classificacao_uscs: z.string().optional(),
  descricao_uscs: z.string().optional(),
  classificacao_hrb: z.string().optional(),
  grupo_hrb: z.string().optional(),
  subgrupo_hrb: z.string().optional(),
  indice_grupo_hrb: z.number().optional(),
  descricao_hrb: z.string().optional(),
  avaliacao_subleito_hrb: z.string().optional(),
  erro: z.string().optional(),
});

export type PeneiraDado = z.infer<typeof PeneiraDadoSchema>;
export type PeneiramentoGrosso = z.infer<typeof PeneiramentoGrossoSchema>;
export type PeneiramentoFino = z.infer<typeof PeneiramentoFinoSchema>;
export type GranulometriaInput = z.infer<typeof GranulometriaInputSchema>;
export type PontoGranulometrico = z.infer<typeof PontoGranulometricoSchema>;
export type GranulometriaOutput = z.infer<typeof GranulometriaOutputSchema>;

