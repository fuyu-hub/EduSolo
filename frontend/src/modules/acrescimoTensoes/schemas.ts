// frontend/src/lib/schemas/acrescimo-tensoes.ts
import { z } from 'zod';

// Ponto de Interesse
export const PontoInteresseSchema = z.object({
  x: z.number(),
  y: z.number(),
  z: z.number().positive('Profundidade deve ser maior que zero'),
});

// Cargas
export const CargaPontualSchema = z.object({
  x: z.number().default(0),
  y: z.number().default(0),
  P: z.number().positive('Carga P deve ser maior que zero'),
});

export const CargaFaixaSchema = z.object({
  largura: z.number().positive('Largura deve ser maior que zero'),
  intensidade: z.number().positive('Intensidade deve ser maior que zero'),
  centro_x: z.number().default(0),
  centro_y: z.number().default(0),
});

export const CargaCircularSchema = z.object({
  raio: z.number().positive('Raio deve ser maior que zero'),
  intensidade: z.number().positive('Intensidade deve ser maior que zero'),
  centro_x: z.number().default(0),
  centro_y: z.number().default(0),
});

export const CargaRetangularSchema = z.object({
  largura: z.number().positive('Largura B deve ser maior que zero'),
  comprimento: z.number().positive('Comprimento L deve ser maior que zero'),
  intensidade: z.number().positive('Intensidade deve ser maior que zero'),
  centro_x: z.number().default(0),
  centro_y: z.number().default(0),
});

// Input
export const AcrescimoTensoesInputSchema = z.object({
  tipo_carga: z.enum(['pontual', 'faixa', 'circular', 'retangular']),
  ponto_interesse: PontoInteresseSchema,
  carga_pontual: CargaPontualSchema.optional(),
  carga_faixa: CargaFaixaSchema.optional(),
  carga_circular: CargaCircularSchema.optional(),
  carga_retangular: CargaRetangularSchema.optional(),
  usar_abaco_newmark: z.boolean().default(false),
});

// Output
export const AcrescimoTensoesOutputSchema = z.object({
  delta_sigma_v: z.number().optional(),
  metodo: z.string().optional(),
  erro: z.string().optional(),
  detalhes: z.any().optional(),
});

// Types
export type PontoInteresse = z.infer<typeof PontoInteresseSchema>;
export type CargaPontual = z.infer<typeof CargaPontualSchema>;
export type CargaFaixa = z.infer<typeof CargaFaixaSchema>;
export type CargaCircular = z.infer<typeof CargaCircularSchema>;
export type CargaRetangular = z.infer<typeof CargaRetangularSchema>;
export type AcrescimoTensoesInput = z.infer<typeof AcrescimoTensoesInputSchema>;
export type AcrescimoTensoesOutput = z.infer<typeof AcrescimoTensoesOutputSchema>;

