/**
 * Dados padronizados de peneiras segundo ABNT NBR 7181 e ASTM
 */

export interface PeneiraInfo {
  numero: string;        // Nº 4, 3/8", 2", etc
  aberturaMM: number;    // Abertura em milímetros
  tipo: 'pedregulho' | 'areia-grossa' | 'areia-media' | 'areia-fina' | 'finos';
  norma: 'ABNT' | 'ASTM' | 'Ambas';
}

export const PENEIRAS_PADRAO: PeneiraInfo[] = [
  // Pedregulhos
  { numero: '3"', aberturaMM: 76.2, tipo: 'pedregulho', norma: 'ASTM' },
  { numero: '2½"', aberturaMM: 63.5, tipo: 'pedregulho', norma: 'ASTM' },
  { numero: '2"', aberturaMM: 50.8, tipo: 'pedregulho', norma: 'Ambas' },
  { numero: '1½"', aberturaMM: 38.1, tipo: 'pedregulho', norma: 'Ambas' },
  { numero: '1"', aberturaMM: 25.4, tipo: 'pedregulho', norma: 'Ambas' },
  { numero: '¾"', aberturaMM: 19.1, tipo: 'pedregulho', norma: 'Ambas' },
  { numero: '½"', aberturaMM: 12.7, tipo: 'pedregulho', norma: 'ASTM' },
  { numero: '3/8"', aberturaMM: 9.52, tipo: 'pedregulho', norma: 'Ambas' },
  
  // Areias Grossas
  { numero: 'Nº 4', aberturaMM: 4.76, tipo: 'areia-grossa', norma: 'Ambas' },
  { numero: 'Nº 8', aberturaMM: 2.38, tipo: 'areia-grossa', norma: 'ASTM' },
  { numero: 'Nº 10', aberturaMM: 2.00, tipo: 'areia-grossa', norma: 'Ambas' },
  
  // Areias Médias
  { numero: 'Nº 16', aberturaMM: 1.19, tipo: 'areia-media', norma: 'Ambas' },
  { numero: 'Nº 20', aberturaMM: 0.84, tipo: 'areia-media', norma: 'ASTM' },
  { numero: 'Nº 30', aberturaMM: 0.59, tipo: 'areia-media', norma: 'Ambas' },
  { numero: 'Nº 40', aberturaMM: 0.42, tipo: 'areia-media', norma: 'Ambas' },
  { numero: 'Nº 50', aberturaMM: 0.30, tipo: 'areia-media', norma: 'ASTM' },
  
  // Areias Finas
  { numero: 'Nº 60', aberturaMM: 0.25, tipo: 'areia-fina', norma: 'Ambas' },
  { numero: 'Nº 80', aberturaMM: 0.177, tipo: 'areia-fina', norma: 'ASTM' },
  { numero: 'Nº 100', aberturaMM: 0.149, tipo: 'areia-fina', norma: 'Ambas' },
  { numero: 'Nº 140', aberturaMM: 0.105, tipo: 'areia-fina', norma: 'ASTM' },
  
  // Finos
  { numero: 'Nº 200', aberturaMM: 0.075, tipo: 'finos', norma: 'Ambas' },
  { numero: 'Nº 270', aberturaMM: 0.053, tipo: 'finos', norma: 'ASTM' },
];

// Conjuntos pré-definidos de peneiras para diferentes tipos de análise
export const TEMPLATES_PENEIRAS = {
  'areia-completa': {
    nome: 'Análise Completa de Areia',
    descricao: 'Conjunto padrão para análise granulométrica de areias',
    peneiras: ['Nº 4', 'Nº 10', 'Nº 16', 'Nº 30', 'Nº 40', 'Nº 60', 'Nº 100', 'Nº 200']
  },
  'pedregulho-completo': {
    nome: 'Análise Completa de Pedregulho',
    descricao: 'Conjunto padrão para análise de pedregulhos',
    peneiras: ['2"', '1½"', '1"', '¾"', '3/8"', 'Nº 4', 'Nº 10', 'Nº 40', 'Nº 200']
  },
  'solo-fino': {
    nome: 'Solo Fino com Areia',
    descricao: 'Para solos com predominância de finos',
    peneiras: ['Nº 10', 'Nº 40', 'Nº 60', 'Nº 100', 'Nº 200']
  },
  'abnt-basico': {
    nome: 'ABNT Básico',
    descricao: 'Peneiras mínimas segundo NBR 7181',
    peneiras: ['Nº 4', 'Nº 10', 'Nº 40', 'Nº 200']
  },
  'completo': {
    nome: 'Análise Completa',
    descricao: 'Todas as peneiras comuns (pedregulho + areia)',
    peneiras: ['2"', '1½"', '1"', '¾"', '3/8"', 'Nº 4', 'Nº 10', 'Nº 16', 'Nº 30', 'Nº 40', 'Nº 60', 'Nº 100', 'Nº 200']
  }
};

export type TemplateId = keyof typeof TEMPLATES_PENEIRAS;

/**
 * Busca informações de uma peneira pelo número
 */
export function getPeneiraInfo(numero: string): PeneiraInfo | undefined {
  return PENEIRAS_PADRAO.find(p => p.numero === numero);
}

/**
 * Busca informações de uma peneira pela abertura (com tolerância)
 */
export function getPeneiraByAbertura(aberturaMM: number, tolerancia: number = 0.01): PeneiraInfo | undefined {
  return PENEIRAS_PADRAO.find(p => Math.abs(p.aberturaMM - aberturaMM) < tolerancia);
}

/**
 * Retorna peneiras filtradas por tipo
 */
export function getPeneirasPorTipo(tipo: PeneiraInfo['tipo']): PeneiraInfo[] {
  return PENEIRAS_PADRAO.filter(p => p.tipo === tipo);
}

/**
 * Retorna cor para visualização de cada tipo
 */
export function getCorTipo(tipo: PeneiraInfo['tipo']): string {
  const cores = {
    'pedregulho': 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
    'areia-grossa': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    'areia-media': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
    'areia-fina': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    'finos': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  };
  return cores[tipo];
}

