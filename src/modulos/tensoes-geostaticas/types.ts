/**
 * Tipos e Schemas — Tensões Geostáticas
 * modulos/tensoes-geostaticas/types.ts
 *
 * Schemas Zod para validação de entrada (camadas, configurações)
 * e tipagem de saída (pontos de tensão calculados).
 */
import { z } from "zod";

// --- Input (Camadas) ---
export const CamadaSoloSchema = z.object({
  nome: z.string().optional(),
  espessura: z.number().positive("A espessura deve ser maior que 0"),
  gamaNat: z.number().positive("O peso específico deve ser positivo").optional().nullable(),
  gamaSat: z.number().positive("O peso específico deve ser positivo").optional().nullable(),
  Ko: z.number().min(0, "Ko não pode ser negativo").optional().nullable(),
  impermeavel: z.boolean().default(false),
  profundidadeNA: z.number().nonnegative("A profundidade não pode ser negativa").optional().nullable(),
  capilaridade: z.number().nonnegative("A altura capilar não pode ser negativa").optional().nullable(),
  hachura: z.string().optional().nullable(),
});

export type CamadaSolo = z.infer<typeof CamadaSoloSchema>;

export const ConfiguracoesGeraisSchema = z.object({
  pesoEspecificoAgua: z.number().positive().default(10.0),
  sobrecargaSuperficial: z.number().nonnegative().default(0.0),
  intervaloDiscretizacao: z.number().positive().optional().nullable(),
});

export type ConfiguracoesGerais = z.infer<typeof ConfiguracoesGeraisSchema>;

export const TensoesGeostaticasInputSchema = z.object({
  camadas: z.array(CamadaSoloSchema).min(1, "É necessária pelo menos uma camada"),
  configuracoes: ConfiguracoesGeraisSchema,
});

export type TensoesGeostaticasInput = z.infer<typeof TensoesGeostaticasInputSchema>;


// --- Output (Resultados) ---

export const TensaoPontoSchema = z.object({
  profundidade: z.number(),
  tensaoTotalVertical: z.number(),
  pressaoNeutra: z.number(),
  tensaoEfetivaVertical: z.number(),
  tensaoTotalHorizontal: z.number().optional(),
  tensaoEfetivaHorizontal: z.number().optional(),
  // Extras úteis
  camadaIndex: z.number(),         // Índice da camada, útil para traçar gráficos coloridos ou rastreabilidade.
  pesoEspecificoUsado: z.number(), // γ local usado
  pesoEspecificoSubmerso: z.number().optional() // γ' usado (se estivesse submerso)
});

export type TensaoPonto = z.infer<typeof TensaoPontoSchema>;

export const TensoesGeostaticasOutputSchema = z.object({
  pontosCalculo: z.array(TensaoPontoSchema),
  avisos: z.array(z.string()).default([]),
  erro: z.string().optional(),
});

export type TensoesGeostaticasOutput = z.infer<typeof TensoesGeostaticasOutputSchema>;
