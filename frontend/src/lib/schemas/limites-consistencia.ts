/**
 * Schemas para Limites de Consistência (Atterberg)
 */

import { z } from 'zod';
import { PontoCurvaSchema } from './common';

export const PontoEnsaioLLSchema = z.object({
  num_golpes: z.number().int().positive(),
  massa_umida_recipiente: z.number(),
  massa_seca_recipiente: z.number(),
  massa_recipiente: z.number(),
});

export const LimitesConsistenciaInputSchema = z.object({
  pontos_ll: z.array(PontoEnsaioLLSchema).min(2),
  massa_umida_recipiente_lp: z.number(),
  massa_seca_recipiente_lp: z.number(),
  massa_recipiente_lp: z.number(),
  umidade_natural: z.number().optional(),
  percentual_argila: z.number().min(0).max(100).optional(),
});

export const LimitesConsistenciaOutputSchema = z.object({
  ll: z.number().optional(),
  lp: z.number().optional(),
  ip: z.number().optional(),
  ic: z.number().optional(),
  classificacao_plasticidade: z.string().optional(),
  classificacao_consistencia: z.string().optional(),
  atividade_argila: z.number().optional(),
  classificacao_atividade: z.string().optional(),
  pontos_grafico_ll: z.array(PontoCurvaSchema).optional(),
  erro: z.string().optional(),
});

export type PontoEnsaioLL = z.infer<typeof PontoEnsaioLLSchema>;
export type LimitesConsistenciaInput = z.infer<typeof LimitesConsistenciaInputSchema>;
export type LimitesConsistenciaOutput = z.infer<typeof LimitesConsistenciaOutputSchema>;

