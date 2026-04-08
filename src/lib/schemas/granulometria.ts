/**
 * Schemas para Análise Granulométrica
 */

import { z } from 'zod';

export const PeneiraDadoSchema = z.object({
  abertura: z.number().positive(),
  massa_retida: z.number().nonnegative(),
  peneira: z.string().optional(),
});

export const GranulometriaInputSchema = z.object({
  massa_total: z.number().positive(),
  peneiras: z.array(PeneiraDadoSchema).min(1),
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
export type GranulometriaInput = z.infer<typeof GranulometriaInputSchema>;
export type PontoGranulometrico = z.infer<typeof PontoGranulometricoSchema>;
export type GranulometriaOutput = z.infer<typeof GranulometriaOutputSchema>;

