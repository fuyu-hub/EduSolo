/**
 * Schemas para Ensaio de Compactação
 */

import { z } from 'zod';
import { PontoCurvaCompactacaoSchema } from './common';

export const PontoEnsaioCompactacaoSchema = z.object({
  massa_umida_total: z.number(),
  massa_molde: z.number(),
  volume_molde: z.number().positive(),
  // Campos para cálculo de umidade via medições
  massa_umida_recipiente_w: z.number().optional(),
  massa_seca_recipiente_w: z.number().optional(),
  massa_recipiente_w: z.number().optional(),
  // Campo para umidade direta (quando fornecida diretamente)
  umidade_direta: z.number().optional(),
});

export const CompactacaoInputSchema = z.object({
  pontos_ensaio: z.array(PontoEnsaioCompactacaoSchema).min(3),
  Gs: z.number().positive().optional(),
  peso_especifico_agua: z.number().positive().default(10.0),
});

export const CompactacaoOutputSchema = z.object({
  umidade_otima: z.number().optional(),
  peso_especifico_seco_max: z.number().optional(),
  pontos_curva_compactacao: z.array(PontoCurvaCompactacaoSchema).optional(),
  pontos_curva_saturacao_100: z.array(PontoCurvaCompactacaoSchema).optional(),
  erro: z.string().optional(),
});

export type PontoEnsaioCompactacao = z.infer<typeof PontoEnsaioCompactacaoSchema>;
export type CompactacaoInput = z.infer<typeof CompactacaoInputSchema>;
export type CompactacaoOutput = z.infer<typeof CompactacaoOutputSchema>;

// Re-export do common
export type { PontoCurvaCompactacao } from './common';
