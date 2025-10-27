/**
 * Esquemas e tipos comuns para todos os módulos de cálculo
 */

import { z } from 'zod';

export const EPSILON = 1e-9;

// Modelos gerais
export const PontoCurvaSchema = z.object({
  x: z.number(),
  y: z.number(),
});

export const PontoCurvaCompactacaoSchema = z.object({
  umidade: z.number(),
  peso_especifico_seco: z.number(),
});

export type PontoCurva = z.infer<typeof PontoCurvaSchema>;
export type PontoCurvaCompactacao = z.infer<typeof PontoCurvaCompactacaoSchema>;

