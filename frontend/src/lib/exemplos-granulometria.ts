/**
 * Exemplos de análises granulométricas de diferentes tipos de solos
 * Dados baseados em ensaios reais e normas técnicas
 * * ARQUIVO CORRIGIDO
 */

export interface ExemploGranulometria {
  id: string;
  nome: string;
  descricao: string;
  classificacaoEsperada: string; // Foco na classificação USCS
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
    /* * CORREÇÃO #1: Este solo era 'SW' mas os dados (Cu ~3.3 < 6) o classificam como 'SP'. 
     * Atualizei os campos para refletir a classificação correta dos dados.
     */
    id: 'areia-mal-graduada-sp',
    nome: 'Areia Mal Graduada (SP)',
    descricao: 'Areia com graduação uniforme (Cu<6), finos < 5%. (Falha Cu>=6)',
    classificacaoEsperada: 'SP',
    massaTotal: 1200,
    peneiras: [
      { numero: 'Nº 4', aberturaMM: 4.76, massaRetida: 80 },
      { numero: 'Nº 10', aberturaMM: 2.00, massaRetida: 160 },
      { numero: 'Nº 16', aberturaMM: 1.19, massaRetida: 210 },
      { numero: 'Nº 30', aberturaMM: 0.59, massaRetida: 260 },
      { numero: 'Nº 40', aberturaMM: 0.42, massaRetida: 220 },
      { numero: 'Nº 60', aberturaMM: 0.25, massaRetida: 200 },
      { numero: 'Nº 100', aberturaMM: 0.149, massaRetida: 40 },
      { numero: 'Nº 200', aberturaMM: 0.075, massaRetida: 30 },
    ],
    observacoes: 'O Cu calculado é ~3.3, que é menor que 6. Portanto, é SP.',
  },

  {
    /* * CORREÇÃO #2: Este é o exemplo que você pediu para "padronizar". 
     * A USCS (SP) estava correta. A HRB estava errada (era A-1-b, não A-2-4). 
     * Atualizei os campos para refletir ambas as classificações corretas.
     */
    id: 'areia-a1b-sp',
    nome: 'Areia Mal Graduada (SP)',
    descricao: 'Areia com finos desprezíveis e graduação uniforme (SP)',
    classificacaoEsperada: 'SP',
    massaTotal: 1000,
    peneiras: [
      { numero: 'Nº 4', aberturaMM: 4.76, massaRetida: 30.0 },
      { numero: 'Nº 10', aberturaMM: 2.00, massaRetida: 70.0 },
      { numero: 'Nº 16', aberturaMM: 1.19, massaRetida: 120.0 },
      { numero: 'Nº 30', aberturaMM: 0.59, massaRetida: 560.0 },
      { numero: 'Nº 40', aberturaMM: 0.42, massaRetida: 140.0 },
      { numero: 'Nº 60', aberturaMM: 0.25, massaRetida: 50.0 },
      { numero: 'Nº 100', aberturaMM: 0.149, massaRetida: 20.0 },
      { numero: 'Nº 200', aberturaMM: 0.075, massaRetida: 10.0 },
    ],
    ll: 23,
    lp: 17,
    observacoes: 'USCS: SP (Cu ~3.4 < 6). HRB: A-1-b (IP=6, %P#40=8%, %P#200=0%).',
  },
  {
    id: 'pedregulho-bem-graduado-gw',
    nome: 'Pedregulho Bem Graduado (GW)',
    descricao: 'Pedregulho com boa graduação (Cu>4, 1<Cc<3), finos < 5% ',
    classificacaoEsperada: 'GW',
    massaTotal: 2500,
    peneiras: [
      { numero: '1"', aberturaMM: 25.4, massaRetida: 350 },
      { numero: '¾"', aberturaMM: 19.1, massaRetida: 480 },
      { numero: '3/8"', aberturaMM: 9.52, massaRetida: 520 },
      { numero: 'Nº 4', aberturaMM: 4.76, massaRetida: 560 },
      { numero: 'Nº 10', aberturaMM: 2.00, massaRetida: 300 },
      { numero: 'Nº 40', aberturaMM: 0.42, massaRetida: 200 },
      { numero: 'Nº 100', aberturaMM: 0.149, massaRetida: 70 },
      { numero: 'Nº 200', aberturaMM: 0.075, massaRetida: 20 },
    ],
    observacoes: 'Mistura ampla desde pedregulho grosso até areia fina',
  },
  {
    id: 'pedregulho-uniforme-gp',
    nome: 'Pedregulho Mal Graduado (GP)',
    descricao: 'Pedregulho com distribuição restrita, finos < 5% ',
    classificacaoEsperada: 'GP',
    massaTotal: 2000,
    peneiras: [
      { numero: '1"', aberturaMM: 25.4, massaRetida: 200 },
      { numero: '¾"', aberturaMM: 19.1, massaRetida: 900 },
      { numero: '3/8"', aberturaMM: 9.52, massaRetida: 550 },
      { numero: 'Nº 4', aberturaMM: 4.76, massaRetida: 250 },
      { numero: 'Nº 10', aberturaMM: 2.00, massaRetida: 70 },
      { numero: 'Nº 40', aberturaMM: 0.42, massaRetida: 20 },
      { numero: 'Nº 200', aberturaMM: 0.075, massaRetida: 10 },
    ],
    observacoes: 'Curva com “gap” na fração areia',
  },
  {
    id: 'areia-siltosa-sm',
    nome: 'Areia Siltosa (SM)',
    descricao: 'Areia com finos siltosos (>12% finos)',
    classificacaoEsperada: 'SM',
    massaTotal: 1100,
    peneiras: [
      { numero: 'Nº 4', aberturaMM: 4.76, massaRetida: 60 },
      { numero: 'Nº 10', aberturaMM: 2.00, massaRetida: 140 },
      { numero: 'Nº 30', aberturaMM: 0.59, massaRetida: 260 },
      { numero: 'Nº 40', aberturaMM: 0.42, massaRetida: 190 },
      { numero: 'Nº 60', aberturaMM: 0.25, massaRetida: 90 },
      { numero: 'Nº 200', aberturaMM: 0.075, massaRetida: 140 },
    ],
    ll: 30,
    lp: 26,
    observacoes: 'IP=4. Abaixo da Linha A (IP_linha_A = 7.3)',
  },
  {
    id: 'areia-argilosa-sc',
    nome: 'Areia Argilosa (SC)',
    descricao: 'Areia com finos argilosos (>12% finos)',
    classificacaoEsperada: 'SC',
    massaTotal: 1200,
    peneiras: [
      { numero: 'Nº 4', aberturaMM: 4.76, massaRetida: 70 },
      { numero: 'Nº 10', aberturaMM: 2.00, massaRetida: 180 },
      { numero: 'Nº 30', aberturaMM: 0.59, massaRetida: 280 },
      { numero: 'Nº 40', aberturaMM: 0.42, massaRetida: 170 },
      { numero: 'Nº 60', aberturaMM: 0.25, massaRetida: 70 },
      { numero: 'Nº 200', aberturaMM: 0.075, massaRetida: 190 },
    ],
    ll: 28,
    lp: 16,
    observacoes: 'IP=12. Acima da Linha A (IP_linha_A = 5.84)',
  },
  {
    id: 'argila-baixa-cl',
    nome: 'Argila de Baixa Plasticidade (CL)',
    descricao: 'Solo fino argiloso com LL<50 e IP acima da Linha A',
    classificacaoEsperada: 'CL',
    massaTotal: 900,
    peneiras: [
      { numero: 'Nº 4', aberturaMM: 4.76, massaRetida: 0 },
      { numero: 'Nº 10', aberturaMM: 2.00, massaRetida: 40 },
      { numero: 'Nº 40', aberturaMM: 0.42, massaRetida: 120 },
      { numero: 'Nº 200', aberturaMM: 0.075, massaRetida: 200 },
    ],
    ll: 35,
    lp: 22,
    observacoes: 'IP=13. Acima da Linha A (IP_linha_A = 10.95)',
  },
  {
    id: 'argila-alta-ch',
    nome: 'Argila de Alta Plasticidade (CH)',
    descricao: 'LL≥50 com IP acima da Linha A',
    classificacaoEsperada: 'CH',
    massaTotal: 1000,
    peneiras: [
      { numero: 'Nº 4', aberturaMM: 4.76, massaRetida: 0 },
      { numero: 'Nº 10', aberturaMM: 2.00, massaRetida: 10 },
      { numero: 'Nº 40', aberturaMM: 0.42, massaRetida: 90 },
      { numero: 'Nº 200', aberturaMM: 0.075, massaRetida: 300 },
    ],
    ll: 65,
    lp: 28,
    observacoes: 'IP=37. Acima da Linha A (IP_linha_A = 32.85)',
  },
  {
    id: 'silte-baixa-ml',
    nome: 'Silte de Baixa Plasticidade (ML)',
    descricao: 'LL<50 com IP baixo (abaixo da Linha A)',
    classificacaoEsperada: 'ML',
    massaTotal: 1000,
    peneiras: [
      { numero: 'Nº 4', aberturaMM: 4.76, massaRetida: 5 },
      { numero: 'Nº 10', aberturaMM: 2.00, massaRetida: 35 },
      { numero: 'Nº 40', aberturaMM: 0.42, massaRetida: 160 },
      { numero: 'Nº 200', aberturaMM: 0.075, massaRetida: 200 },
    ],
    ll: 34,
    lp: 31,
    observacoes: 'IP=3. Abaixo da Linha A (IP_linha_A = 10.22) e IP < 4.',
  },
  {
    id: 'silte-alta-mh',
    nome: 'Silte de Alta Plasticidade (MH)',
    descricao: 'LL≥50 com IP abaixo da Linha A',
    classificacaoEsperada: 'MH',
    massaTotal: 950,
    peneiras: [
      { numero: 'Nº 4', aberturaMM: 4.76, massaRetida: 0 },
      { numero: 'Nº 10', aberturaMM: 2.00, massaRetida: 10 },
      { numero: 'Nº 40', aberturaMM: 0.42, massaRetida: 80 },
      { numero: 'Nº 200', aberturaMM: 0.075, massaRetida: 290 },
    ],
    ll: 70,
    lp: 35,
    observacoes: 'IP=35. Abaixo da Linha A (IP_linha_A = 36.5)',
  },
  {
    id: 'pedregulho-dupla-gw-gc-gw-gm',
    nome: 'Pedregulho (GW-GC/GW-GM)',
    descricao: '5–12% de finos; finos na zona C-M (CL-ML); bem graduado',
    classificacaoEsperada: 'GW-GC/GW-GM',
    massaTotal: 2200,
    peneiras: [
      { numero: '1"', aberturaMM: 25.4, massaRetida: 320 },
      { numero: '¾"', aberturaMM: 19.1, massaRetida: 460 },
      { numero: '3/8"', aberturaMM: 9.52, massaRetida: 520 },
      { numero: 'Nº 4', aberturaMM: 4.76, massaRetida: 520 },
      { numero: 'Nº 10', aberturaMM: 2.00, massaRetida: 210 },
      { numero: 'Nº 40', aberturaMM: 0.42, massaRetida: 110 },
      { numero: 'Nº 200', aberturaMM: 0.075, massaRetida: 60 },
    ],
    ll: 25,
    lp: 20,
    observacoes: 'Borderline (5–12% finos). IP=5 acima da Linha A para LL=25 → C-M. Como é bem graduado, dupla GW-GC/GW-GM.',
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