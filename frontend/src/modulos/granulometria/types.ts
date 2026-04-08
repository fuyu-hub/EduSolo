/**
 * Tipos — Classificação Granulométrica
 * modulos/granulometria/types.ts
 */

export interface GranulometriaFormData {
  pedregulho: string;
  areia_grossa: string;
  areia_media: string;
  areia_fina: string;
  silte: string;
  argila: string;
  // Parâmetros complementares
  pass_p10: string;
  pass_p40: string;
  pass_p200: string;
  d10: string;
  d30: string;
  d60: string;
  ll: string;
  lp: string;
}

export interface ClassificacaoInput {
  pedregulho: number;
  areia_grossa: number;
  areia_media: number;
  areia_fina: number;
  silte: number;
  argila: number;
  pass_peneira_10?: number;
  pass_peneira_40?: number;
  pass_peneira_200?: number;
  d10?: number;
  d30?: number;
  d60?: number;
  ll?: number;
  lp?: number;
}

export interface ClassificacaoOutput {
  classificacao_uscs?: string;
  descricao_uscs?: string;
  classificacao_hrb?: string;
  grupo_hrb?: string;
  subgrupo_hrb?: string;
  indice_grupo_hrb?: number;
  descricao_hrb?: string;
  avaliacao_subleito_hrb?: string;
  total_areia: number;
  total_finos: number;
  erro?: string;
}

export interface FracaoConfig {
  key: keyof Pick<GranulometriaFormData, 'pedregulho' | 'areia_grossa' | 'areia_media' | 'areia_fina' | 'silte' | 'argila'>;
  label: string;
  colorClass: string;
}

export const FRACOES: readonly FracaoConfig[] = [
  { key: "pedregulho", label: "Pedregulho", colorClass: "bg-red-500 dark:bg-red-400" },
  { key: "areia_grossa", label: "Areia Grossa", colorClass: "bg-orange-500 dark:bg-orange-400" },
  { key: "areia_media", label: "Areia Média", colorClass: "bg-yellow-500 dark:bg-yellow-400" },
  { key: "areia_fina", label: "Areia Fina", colorClass: "bg-sky-500 dark:bg-sky-400" },
  { key: "silte", label: "Silte", colorClass: "bg-blue-600 dark:bg-blue-500" },
  { key: "argila", label: "Argila", colorClass: "bg-indigo-800 dark:bg-indigo-400" },
] as const;
