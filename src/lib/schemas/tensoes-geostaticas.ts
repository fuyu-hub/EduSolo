/**
 * Schemas para Tensões Geostáticas
 */

import { z } from 'zod';

export const CamadaSoloSchema = z.object({
  espessura: z.number().positive(),
  gama_nat: z.number().optional(),
  gama_sat: z.number().optional(),
  Ko: z.number().min(0).max(1).optional(),
  impermeavel: z.boolean().default(false),
  profundidade_na_camada: z.number().nonnegative().optional(),
  altura_capilar_camada: z.number().nonnegative().optional(),
});

export const TensaoPontoSchema = z.object({
  profundidade: z.number(),
  tensao_total_vertical: z.number().optional(),
  pressao_neutra: z.number().optional(),
  tensao_efetiva_vertical: z.number().optional(),
  tensao_efetiva_horizontal: z.number().optional(),
});

export const TensoesGeostaticasInputSchema = z.object({
  camadas: z.array(CamadaSoloSchema).min(1),
  profundidade_na: z.number().nonnegative().optional(),
  altura_capilar: z.number().nonnegative().default(0.0),
  peso_especifico_agua: z.number().positive().default(10.0),
});

export const TensoesGeostaticasOutputSchema = z.object({
  pontos_calculo: z.array(TensaoPontoSchema),
  erro: z.string().optional(),
});

export type CamadaSolo = z.infer<typeof CamadaSoloSchema>;
export type TensaoPonto = z.infer<typeof TensaoPontoSchema>;
export type TensoesGeostaticasInput = z.infer<typeof TensoesGeostaticasInputSchema>;
export type TensoesGeostaticasOutput = z.infer<typeof TensoesGeostaticasOutputSchema>;

