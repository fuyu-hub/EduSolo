/**
 * Exemplos de análises granulométricas de diferentes tipos de solos
 * Dados baseados em ensaios reais e normas técnicas
 */

export interface ExemploGranulometria {
  id: string;
  nome: string;
  descricao: string;
  classificacaoEsperada: string;
  massaTotal: number;
  peneiras: Array<{
    numero: string;
    aberturaMM: number;
    massaRetida: number;
  }>;
  ll?: number;
  lp?: number;
  observacoes?: string;
}

export const EXEMPLOS_GRANULOMETRIA: ExemploGranulometria[] = [
  {
    id: 'areia-bem-graduada',
    nome: 'Areia Bem Graduada (SW)',
    descricao: 'Areia com boa distribuição granulométrica, Cu > 6 e 1 < Cc < 3',
    classificacaoEsperada: 'SW',
    massaTotal: 1000,
    peneiras: [
      { numero: 'Nº 4', aberturaMM: 4.76, massaRetida: 50 },
      { numero: 'Nº 10', aberturaMM: 2.00, massaRetida: 100 },
      { numero: 'Nº 16', aberturaMM: 1.19, massaRetida: 150 },
      { numero: 'Nº 30', aberturaMM: 0.59, massaRetida: 200 },
      { numero: 'Nº 40', aberturaMM: 0.42, massaRetida: 250 },
      { numero: 'Nº 60', aberturaMM: 0.25, massaRetida: 200 },
      { numero: 'Nº 100', aberturaMM: 0.149, massaRetida: 30 },
      { numero: 'Nº 200', aberturaMM: 0.075, massaRetida: 20 },
    ],
    observacoes: 'Excelente para base de pavimentos e concreto',
  },
  {
    id: 'areia-mal-graduada',
    nome: 'Areia Mal Graduada (SP)',
    descricao: 'Areia uniforme, predominância de uma faixa granulométrica',
    classificacaoEsperada: 'SP',
    massaTotal: 1000,
    peneiras: [
      { numero: 'Nº 4', aberturaMM: 4.76, massaRetida: 20 },
      { numero: 'Nº 10', aberturaMM: 2.00, massaRetida: 50 },
      { numero: 'Nº 16', aberturaMM: 1.19, massaRetida: 80 },
      { numero: 'Nº 30', aberturaMM: 0.59, massaRetida: 600 },
      { numero: 'Nº 40', aberturaMM: 0.42, massaRetida: 200 },
      { numero: 'Nº 60', aberturaMM: 0.25, massaRetida: 30 },
      { numero: 'Nº 100', aberturaMM: 0.149, massaRetida: 15 },
      { numero: 'Nº 200', aberturaMM: 0.075, massaRetida: 5 },
    ],
    observacoes: 'Areia de praia ou duna, granulometria uniforme',
  },
  {
    id: 'pedregulho-bem-graduado',
    nome: 'Pedregulho Bem Graduado (GW)',
    descricao: 'Pedregulho com boa graduação, Cu > 4 e 1 < Cc < 3',
    classificacaoEsperada: 'GW',
    massaTotal: 2000,
    peneiras: [
      { numero: '1"', aberturaMM: 25.4, massaRetida: 200 },
      { numero: '¾"', aberturaMM: 19.1, massaRetida: 300 },
      { numero: '3/8"', aberturaMM: 9.52, massaRetida: 400 },
      { numero: 'Nº 4', aberturaMM: 4.76, massaRetida: 500 },
      { numero: 'Nº 10', aberturaMM: 2.00, massaRetida: 300 },
      { numero: 'Nº 40', aberturaMM: 0.42, massaRetida: 200 },
      { numero: 'Nº 100', aberturaMM: 0.149, massaRetida: 80 },
      { numero: 'Nº 200', aberturaMM: 0.075, massaRetida: 20 },
    ],
    observacoes: 'Excelente para bases de pavimentos e drenagem',
  },
  {
    id: 'areia-argilosa',
    nome: 'Areia Argilosa (SC)',
    descricao: 'Areia com fração argilosa significativa (> 12% finos)',
    classificacaoEsperada: 'SC',
    massaTotal: 1000,
    peneiras: [
      { numero: 'Nº 4', aberturaMM: 4.76, massaRetida: 50 },
      { numero: 'Nº 10', aberturaMM: 2.00, massaRetida: 150 },
      { numero: 'Nº 16', aberturaMM: 1.19, massaRetida: 200 },
      { numero: 'Nº 30', aberturaMM: 0.59, massaRetida: 250 },
      { numero: 'Nº 40', aberturaMM: 0.42, massaRetida: 150 },
      { numero: 'Nº 60', aberturaMM: 0.25, massaRetida: 50 },
      { numero: 'Nº 200', aberturaMM: 0.075, massaRetida: 150 },
    ],
    ll: 28,
    lp: 18,
    observacoes: 'Solo coesivo, usado em aterros compactados',
  },
  {
    id: 'argila-baixa-plasticidade',
    nome: 'Argila de Baixa Plasticidade (CL)',
    descricao: 'Solo fino argiloso com LL < 50% e IP > 7%',
    classificacaoEsperada: 'CL',
    massaTotal: 1000,
    peneiras: [
      { numero: 'Nº 4', aberturaMM: 4.76, massaRetida: 0 },
      { numero: 'Nº 10', aberturaMM: 2.00, massaRetida: 50 },
      { numero: 'Nº 40', aberturaMM: 0.42, massaRetida: 100 },
      { numero: 'Nº 200', aberturaMM: 0.075, massaRetida: 250 },
    ],
    ll: 35,
    lp: 20,
    observacoes: 'Solo típico de fundações rasas e aterros',
  },
  {
    id: 'argila-alta-plasticidade',
    nome: 'Argila de Alta Plasticidade (CH)',
    descricao: 'Solo fino argiloso com LL ≥ 50% e IP > 7%',
    classificacaoEsperada: 'CH',
    massaTotal: 1000,
    peneiras: [
      { numero: 'Nº 4', aberturaMM: 4.76, massaRetida: 0 },
      { numero: 'Nº 10', aberturaMM: 2.00, massaRetida: 20 },
      { numero: 'Nº 40', aberturaMM: 0.42, massaRetida: 80 },
      { numero: 'Nº 200', aberturaMM: 0.075, massaRetida: 300 },
    ],
    ll: 65,
    lp: 28,
    observacoes: 'Solo expansivo, requer cuidados especiais',
  },
  {
    id: 'silte-baixa-plasticidade',
    nome: 'Silte de Baixa Plasticidade (ML)',
    descricao: 'Solo fino siltoso com LL < 50% e IP < 4%',
    classificacaoEsperada: 'ML',
    massaTotal: 1000,
    peneiras: [
      { numero: 'Nº 4', aberturaMM: 4.76, massaRetida: 10 },
      { numero: 'Nº 10', aberturaMM: 2.00, massaRetida: 40 },
      { numero: 'Nº 40', aberturaMM: 0.42, massaRetida: 150 },
      { numero: 'Nº 200', aberturaMM: 0.075, massaRetida: 200 },
    ],
    ll: 32,
    lp: 28,
    observacoes: 'Solo de baixa coesão, sensível à água',
  },
  {
    id: 'solo-misto',
    nome: 'Solo Misto (Areia + Finos)',
    descricao: 'Solo com distribuição mista entre areia e finos',
    classificacaoEsperada: 'SM ou SC',
    massaTotal: 1500,
    peneiras: [
      { numero: '3/8"', aberturaMM: 9.52, massaRetida: 100 },
      { numero: 'Nº 4', aberturaMM: 4.76, massaRetida: 200 },
      { numero: 'Nº 10', aberturaMM: 2.00, massaRetida: 300 },
      { numero: 'Nº 16', aberturaMM: 1.19, massaRetida: 250 },
      { numero: 'Nº 30', aberturaMM: 0.59, massaRetida: 200 },
      { numero: 'Nº 40', aberturaMM: 0.42, massaRetida: 150 },
      { numero: 'Nº 60', aberturaMM: 0.25, massaRetida: 100 },
      { numero: 'Nº 200', aberturaMM: 0.075, massaRetida: 200 },
    ],
    ll: 22,
    lp: 15,
    observacoes: 'Solo típico de encostas e taludes naturais',
  },
];

/**
 * Busca um exemplo pelo ID
 */
export function getExemploPorId(id: string): ExemploGranulometria | undefined {
  return EXEMPLOS_GRANULOMETRIA.find(ex => ex.id === id);
}

/**
 * Retorna exemplos por tipo de classificação esperada
 */
export function getExemplosPorTipo(tipo: 'grosso' | 'fino'): ExemploGranulometria[] {
  const tiposGrossos = ['SW', 'SP', 'GW', 'GP', 'SC', 'SM'];
  const tiposFinos = ['CL', 'CH', 'ML', 'MH'];
  
  return EXEMPLOS_GRANULOMETRIA.filter(ex => {
    if (tipo === 'grosso') {
      return tiposGrossos.some(t => ex.classificacaoEsperada.includes(t));
    } else {
      return tiposFinos.some(t => ex.classificacaoEsperada.includes(t));
    }
  });
}

