/**
 * Schemas para Índices Físicos do Solo
 */

import { z } from 'zod';
import { EPSILON } from './common';

export const IndicesFisicosInputSchema = z.object({
  peso_total: z.number().optional(),
  volume_total: z.number().optional(),
  peso_solido: z.number().optional(),
  peso_especifico_solidos: z.number().optional(),
  Gs: z.number().optional(),
  umidade: z.number().optional(),
  indice_vazios: z.number().optional(),
  porosidade: z.number().optional(),
  grau_saturacao: z.number().optional(),
  peso_especifico_natural: z.number().optional(),
  peso_especifico_seco: z.number().optional(),
  peso_especifico_agua: z.number().default(10.0),
  indice_vazios_max: z.number().positive().optional(),
  indice_vazios_min: z.number().nonnegative().optional(),
}).refine(
  (data) => {
    if (data.indice_vazios_max !== undefined && data.indice_vazios_min !== undefined) {
      return data.indice_vazios_min < data.indice_vazios_max - EPSILON;
    }
    return true;
  },
  {
    message: 'Índice de vazios mínimo (emin) deve ser estritamente menor que o máximo (emax).',
  }
);

export const IndicesFisicosOutputSchema = z.object({
  peso_especifico_natural: z.number().optional(),
  peso_especifico_seco: z.number().optional(),
  peso_especifico_saturado: z.number().optional(),
  peso_especifico_submerso: z.number().optional(),
  peso_especifico_solidos: z.number().optional(),
  Gs: z.number().optional(),
  indice_vazios: z.number().optional(),
  porosidade: z.number().optional(),
  grau_saturacao: z.number().optional(),
  umidade: z.number().optional(),
  volume_solidos_norm: z.number().optional(),
  volume_agua_norm: z.number().optional(),
  volume_ar_norm: z.number().optional(),
  peso_solidos_norm: z.number().optional(),
  peso_agua_norm: z.number().optional(),
  compacidade_relativa: z.number().optional(),
  classificacao_compacidade: z.string().optional(),
  volume_total_calc: z.number().optional(),
  volume_solidos_calc: z.number().optional(),
  volume_agua_calc: z.number().optional(),
  volume_ar_calc: z.number().optional(),
  massa_total_calc: z.number().optional(),
  massa_solidos_calc: z.number().optional(),
  massa_agua_calc: z.number().optional(),
  aviso: z.string().optional(),
  erro: z.string().optional(),
});

export type IndicesFisicosInput = z.infer<typeof IndicesFisicosInputSchema>;
export type IndicesFisicosOutput = z.infer<typeof IndicesFisicosOutputSchema>;

