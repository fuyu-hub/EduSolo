/**
 * Esquemas e tipos comuns para o módulo de compactação
 */

import { z } from 'zod';

export const EPSILON = 1e-9;

export const PontoCurvaCompactacaoSchema = z.object({
    umidade: z.number(),
    peso_especifico_seco: z.number(),
});

export type PontoCurvaCompactacao = z.infer<typeof PontoCurvaCompactacaoSchema>;
