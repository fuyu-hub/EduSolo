/**
 * Schemas para Classificação de Solos (USCS e HRB/AASHTO)
 */

import { z } from 'zod';
import { EPSILON } from './common';

// Classificação USCS
export const ClassificacaoUSCSInputSchema = z.object({
  pass_peneira_200: z.number().min(0).max(100),
  pass_peneira_4: z.number().min(0).max(100),
  ll: z.number().nonnegative().optional(),
  ip: z.number().nonnegative().optional(),
  Cu: z.number().nonnegative().optional(),
  Cc: z.number().nonnegative().optional(),
  is_organico_fino: z.boolean().default(false),
  is_altamente_organico: z.boolean().default(false),
}).refine(
  (data) => {
    if (data.ll !== undefined && data.ip !== undefined) {
      return data.ip <= data.ll + EPSILON;
    }
    return true;
  },
  {
    message: 'Índice de Plasticidade (IP) não pode ser maior que o Limite de Liquidez (LL).',
  }
).refine(
  (data) => {
    return data.pass_peneira_200 <= data.pass_peneira_4 + EPSILON;
  },
  {
    message: 'Percentagem passando na #200 não pode ser maior que a #4.',
  }
);

export const ClassificacaoUSCSOutputSchema = z.object({
  classificacao: z.string().optional(),
  descricao: z.string().optional(),
  erro: z.string().optional(),
});

// Classificação HRB/AASHTO
export const ClassificacaoHRBInputSchema = z.object({
  pass_peneira_200: z.number().min(0).max(100),
  pass_peneira_40: z.number().min(0).max(100).optional(),
  pass_peneira_10: z.number().min(0).max(100).optional(),
  ll: z.number().nonnegative().optional(),
  ip: z.number().nonnegative().optional(),
});

export const ClassificacaoHRBOutputSchema = z.object({
  classificacao: z.string().optional(),
  grupo_principal: z.string().optional(),
  subgrupo: z.string().optional(),
  indice_grupo: z.number().optional(),
  descricao: z.string().optional(),
  avaliacao_subleito: z.string().optional(),
  erro: z.string().optional(),
});

export type ClassificacaoUSCSInput = z.infer<typeof ClassificacaoUSCSInputSchema>;
export type ClassificacaoUSCSOutput = z.infer<typeof ClassificacaoUSCSOutputSchema>;
export type ClassificacaoHRBInput = z.infer<typeof ClassificacaoHRBInputSchema>;
export type ClassificacaoHRBOutput = z.infer<typeof ClassificacaoHRBOutputSchema>;

