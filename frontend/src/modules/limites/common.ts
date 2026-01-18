/**
 * Esquemas e tipos comuns para o módulo de limites de consistência
 */

import { z } from 'zod';

export const EPSILON = 1e-9;

// Modelos gerais
export const PontoCurvaSchema = z.object({
    x: z.number(),
    y: z.number(),
});

export type PontoCurva = z.infer<typeof PontoCurvaSchema>;
