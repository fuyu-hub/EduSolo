/**
 * Exemplos de análises granulométricas de diferentes tipos de solos
 * Dados baseados em ensaios reais e normas técnicas
 * Valores de abertura conforme ABNT NBR 7181
 * 
 * Mock Data para testes de classificação SUCS/AASHTO
 */

export interface PeneiraExemplo {
  numero: string;
  aberturaMM: number;
  massaRetida: number;
}

export interface PeneiramentoExemplo {
  massa_umida: number;
  massa_seca: number;
  peneiras: PeneiraExemplo[];
}

export interface ExemploGranulometria {
  id: string;
  nome: string;
  descricao: string;
  classificacaoEsperada: string;
  massaTotal: number; // Massa total seca do peneiramento grosso (compatibilidade)
  peneiramento_grosso?: PeneiramentoExemplo;
  peneiramento_fino?: PeneiramentoExemplo;
  peneiras: PeneiraExemplo[]; // Compatibilidade com estrutura antiga
  ll?: number;
  lp?: number;
  observacoes?: string;
}

/**
 * Exemplos de análises granulométricas cobrindo todos os cenários SUCS/AASHTO
 */
export const EXEMPLOS_GRANULOMETRIA: ExemploGranulometria[] = [
  // ============================================================
  // 1. Areia Mal Graduada (SP)
  // Cenário: Areia de praia ou duna, uniforme, quase sem finos.
  // ============================================================
  {
    id: "sp-areia-mal-graduada",
    nome: "Areia Mal Graduada (SP)",
    descricao: "Areia de praia ou duna, uniforme, quase sem finos.",
    classificacaoEsperada: "SP",
    massaTotal: 1200.0,
    peneiramento_grosso: {
      massa_umida: 1250.0,
      massa_seca: 1200.0,
      peneiras: [
        { numero: '2"', aberturaMM: 50.0, massaRetida: 0.00 },
        { numero: '1 1/2"', aberturaMM: 38.0, massaRetida: 0.00 },
        { numero: '1"', aberturaMM: 25.0, massaRetida: 0.00 },
        { numero: '3/4"', aberturaMM: 19.0, massaRetida: 0.00 },
        { numero: '3/8"', aberturaMM: 9.5, massaRetida: 0.00 },
        { numero: 'Nº 4', aberturaMM: 4.8, massaRetida: 12.50 },
        { numero: 'Nº 10', aberturaMM: 2.0, massaRetida: 25.30 },
      ]
    },
    peneiramento_fino: {
      massa_umida: 102.5,
      massa_seca: 100.0,
      peneiras: [
        { numero: 'Nº 16', aberturaMM: 1.2, massaRetida: 10.20 },
        { numero: 'Nº 30', aberturaMM: 0.6, massaRetida: 45.50 },
        { numero: 'Nº 40', aberturaMM: 0.42, massaRetida: 25.10 },
        { numero: 'Nº 60', aberturaMM: 0.25, massaRetida: 15.80 },
        { numero: 'Nº 100', aberturaMM: 0.15, massaRetida: 2.10 },
        { numero: 'Nº 200', aberturaMM: 0.075, massaRetida: 0.50 },
      ]
    },
    peneiras: [], // Será preenchido automaticamente
    ll: undefined,
    lp: undefined,
    observacoes: "Pico de retenção na peneira Nº30 (areia média). Finos < 5%."
  },

  // ============================================================
  // 2. Pedregulho Bem Graduado (GW)
  // Cenário: Material de base de estrada, ampla distribuição de tamanhos.
  // ============================================================
  {
    id: "gw-pedregulho-bem-graduado",
    nome: "Pedregulho Bem Graduado (GW)",
    descricao: "Material de base de estrada, ampla distribuição de tamanhos.",
    classificacaoEsperada: "GW",
    massaTotal: 5000.0,
    peneiramento_grosso: {
      massa_umida: 5150.0,
      massa_seca: 5000.0,
      peneiras: [
        { numero: '2"', aberturaMM: 50.0, massaRetida: 0.00 },
        { numero: '1 1/2"', aberturaMM: 38.0, massaRetida: 450.00 },
        { numero: '1"', aberturaMM: 25.0, massaRetida: 850.50 },
        { numero: '3/4"', aberturaMM: 19.0, massaRetida: 900.20 },
        { numero: '3/8"', aberturaMM: 9.5, massaRetida: 850.10 },
        { numero: 'Nº 4', aberturaMM: 4.8, massaRetida: 750.80 },
        { numero: 'Nº 10', aberturaMM: 2.0, massaRetida: 600.40 },
      ]
    },
    peneiramento_fino: {
      massa_umida: 123.0,
      massa_seca: 120.0,
      peneiras: [
        { numero: 'Nº 16', aberturaMM: 1.2, massaRetida: 30.50 },
        { numero: 'Nº 30', aberturaMM: 0.6, massaRetida: 25.20 },
        { numero: 'Nº 40', aberturaMM: 0.42, massaRetida: 20.10 },
        { numero: 'Nº 60', aberturaMM: 0.25, massaRetida: 15.50 },
        { numero: 'Nº 100', aberturaMM: 0.15, massaRetida: 15.20 },
        { numero: 'Nº 200', aberturaMM: 0.075, massaRetida: 10.50 },
      ]
    },
    peneiras: [],
    ll: undefined,
    lp: undefined,
    observacoes: "Distribuição bem graduada de tamanhos. Finos < 5%."
  },

  // ============================================================
  // 3. Pedregulho Mal Graduado (GP)
  // Cenário: "Gap-graded", tem muita pedra grande e areia, mas falta o tamanho intermediário.
  // ============================================================
  {
    id: "gp-pedregulho-mal-graduado",
    nome: "Pedregulho Mal Graduado (GP)",
    descricao: "Gap-graded: muita pedra grande e areia, falta tamanho intermediário (pedrisco).",
    classificacaoEsperada: "GP",
    massaTotal: 4000.0,
    peneiramento_grosso: {
      massa_umida: 4100.0,
      massa_seca: 4000.0,
      peneiras: [
        { numero: '2"', aberturaMM: 50.0, massaRetida: 0.00 },
        { numero: '1 1/2"', aberturaMM: 38.0, massaRetida: 0.00 },
        { numero: '1"', aberturaMM: 25.0, massaRetida: 1500.00 },
        { numero: '3/4"', aberturaMM: 19.0, massaRetida: 1200.00 },
        { numero: '3/8"', aberturaMM: 9.5, massaRetida: 50.00 },
        { numero: 'Nº 4', aberturaMM: 4.8, massaRetida: 50.00 },
        { numero: 'Nº 10', aberturaMM: 2.0, massaRetida: 100.00 },
      ]
    },
    peneiramento_fino: {
      massa_umida: 103.0,
      massa_seca: 100.0,
      peneiras: [
        { numero: 'Nº 16', aberturaMM: 1.2, massaRetida: 10.00 },
        { numero: 'Nº 30', aberturaMM: 0.6, massaRetida: 40.00 },
        { numero: 'Nº 40', aberturaMM: 0.42, massaRetida: 30.00 },
        { numero: 'Nº 60', aberturaMM: 0.25, massaRetida: 10.00 },
        { numero: 'Nº 100', aberturaMM: 0.15, massaRetida: 5.00 },
        { numero: 'Nº 200', aberturaMM: 0.075, massaRetida: 2.00 },
      ]
    },
    peneiras: [],
    ll: undefined,
    lp: undefined,
    observacoes: "O 'buraco' na graduação está nas peneiras 3/8\" e Nº4 (pedrisco)."
  },

  // ============================================================
  // 4. Areia Siltosa (SM)
  // Cenário: Areia suja, não plástica ou pouco plástica.
  // ============================================================
  {
    id: "sm-areia-siltosa",
    nome: "Areia Siltosa (SM)",
    descricao: "Areia suja, não plástica ou pouco plástica. IP abaixo da Linha A.",
    classificacaoEsperada: "SM",
    massaTotal: 1000.0,
    peneiramento_grosso: {
      massa_umida: 1050.0,
      massa_seca: 1000.0,
      peneiras: [
        { numero: '2"', aberturaMM: 50.0, massaRetida: 0.00 },
        { numero: '1 1/2"', aberturaMM: 38.0, massaRetida: 0.00 },
        { numero: '1"', aberturaMM: 25.0, massaRetida: 0.00 },
        { numero: '3/4"', aberturaMM: 19.0, massaRetida: 0.00 },
        { numero: '3/8"', aberturaMM: 9.5, massaRetida: 0.00 },
        { numero: 'Nº 4', aberturaMM: 4.8, massaRetida: 20.00 },
        { numero: 'Nº 10', aberturaMM: 2.0, massaRetida: 30.00 },
      ]
    },
    peneiramento_fino: {
      massa_umida: 155.0,
      massa_seca: 150.0,
      peneiras: [
        { numero: 'Nº 16', aberturaMM: 1.2, massaRetida: 10.00 },
        { numero: 'Nº 30', aberturaMM: 0.6, massaRetida: 20.00 },
        { numero: 'Nº 40', aberturaMM: 0.42, massaRetida: 25.00 },
        { numero: 'Nº 60', aberturaMM: 0.25, massaRetida: 30.00 },
        { numero: 'Nº 100', aberturaMM: 0.15, massaRetida: 20.00 },
        { numero: 'Nº 200', aberturaMM: 0.075, massaRetida: 10.00 },
      ]
    },
    peneiras: [],
    ll: 30,
    lp: 26,
    observacoes: "IP = 4 → Característica de Silte (abaixo da Linha A). ~23% de finos passante na #200."
  },

  // ============================================================
  // 5. Areia Argilosa (SC)
  // Cenário: Areia vermelha, barreiro, coesa.
  // ============================================================
  {
    id: "sc-areia-argilosa",
    nome: "Areia Argilosa (SC)",
    descricao: "Areia vermelha, barreiro, coesa. IP acima da Linha A.",
    classificacaoEsperada: "SC",
    massaTotal: 1180.0,
    peneiramento_grosso: {
      massa_umida: 1220.0,
      massa_seca: 1180.0,
      peneiras: [
        { numero: '2"', aberturaMM: 50.0, massaRetida: 0.00 },
        { numero: '1 1/2"', aberturaMM: 38.0, massaRetida: 0.00 },
        { numero: '1"', aberturaMM: 25.0, massaRetida: 0.00 },
        { numero: '3/4"', aberturaMM: 19.0, massaRetida: 0.00 },
        { numero: '3/8"', aberturaMM: 9.5, massaRetida: 0.00 },
        { numero: 'Nº 4', aberturaMM: 4.8, massaRetida: 50.00 },
        { numero: 'Nº 10', aberturaMM: 2.0, massaRetida: 80.00 },
      ]
    },
    peneiramento_fino: {
      massa_umida: 104.0,
      massa_seca: 100.0,
      peneiras: [
        { numero: 'Nº 16', aberturaMM: 1.2, massaRetida: 5.00 },
        { numero: 'Nº 30', aberturaMM: 0.6, massaRetida: 10.00 },
        { numero: 'Nº 40', aberturaMM: 0.42, massaRetida: 15.00 },
        { numero: 'Nº 60', aberturaMM: 0.25, massaRetida: 15.00 },
        { numero: 'Nº 100', aberturaMM: 0.15, massaRetida: 10.00 },
        { numero: 'Nº 200', aberturaMM: 0.075, massaRetida: 5.00 },
      ]
    },
    peneiras: [],
    ll: 45,
    lp: 25,
    observacoes: "IP = 20 → Acima da Linha A. 40% de finos passante na #200."
  },

  // ============================================================
  // 6. Argila de Baixa Plasticidade (CL)
  // Cenário: Solo fino comum, "barro" de plasticidade média.
  // ============================================================
  {
    id: "cl-argila-baixa-plasticidade",
    nome: "Argila de Baixa Plasticidade (CL)",
    descricao: "Solo fino comum, 'barro' de plasticidade média. LL < 50.",
    classificacaoEsperada: "CL",
    massaTotal: 900.0,
    peneiramento_grosso: {
      massa_umida: 1000.0,
      massa_seca: 900.0,
      peneiras: [
        { numero: '2"', aberturaMM: 50.0, massaRetida: 0.00 },
        { numero: '1 1/2"', aberturaMM: 38.0, massaRetida: 0.00 },
        { numero: '1"', aberturaMM: 25.0, massaRetida: 0.00 },
        { numero: '3/4"', aberturaMM: 19.0, massaRetida: 0.00 },
        { numero: '3/8"', aberturaMM: 9.5, massaRetida: 0.00 },
        { numero: 'Nº 4', aberturaMM: 4.8, massaRetida: 0.00 },
        { numero: 'Nº 10', aberturaMM: 2.0, massaRetida: 0.00 },
      ]
    },
    peneiramento_fino: {
      massa_umida: 105.0,
      massa_seca: 100.0,
      peneiras: [
        { numero: 'Nº 16', aberturaMM: 1.2, massaRetida: 0.00 },
        { numero: 'Nº 30', aberturaMM: 0.6, massaRetida: 0.00 },
        { numero: 'Nº 40', aberturaMM: 0.42, massaRetida: 0.00 },
        { numero: 'Nº 60', aberturaMM: 0.25, massaRetida: 0.00 },
        { numero: 'Nº 100', aberturaMM: 0.15, massaRetida: 0.00 },
        { numero: 'Nº 200', aberturaMM: 0.075, massaRetida: 15.00 },
      ]
    },
    peneiras: [],
    ll: 42,
    lp: 22,
    observacoes: "IP = 20, LL < 50, Acima da Linha A. 85% de finos."
  },

  // ============================================================
  // 7. Argila de Alta Plasticidade (CH)
  // Cenário: Argila expansiva, "massapé".
  // ============================================================
  {
    id: "ch-argila-alta-plasticidade",
    nome: "Argila de Alta Plasticidade (CH)",
    descricao: "Argila expansiva, 'massapé'. LL ≥ 50, acima da Linha A.",
    classificacaoEsperada: "CH",
    massaTotal: 950.0,
    peneiramento_grosso: {
      massa_umida: 1000.0,
      massa_seca: 950.0,
      peneiras: [
        { numero: '2"', aberturaMM: 50.0, massaRetida: 0.00 },
        { numero: '1 1/2"', aberturaMM: 38.0, massaRetida: 0.00 },
        { numero: '1"', aberturaMM: 25.0, massaRetida: 0.00 },
        { numero: '3/4"', aberturaMM: 19.0, massaRetida: 0.00 },
        { numero: '3/8"', aberturaMM: 9.5, massaRetida: 0.00 },
        { numero: 'Nº 4', aberturaMM: 4.8, massaRetida: 0.00 },
        { numero: 'Nº 10', aberturaMM: 2.0, massaRetida: 0.00 },
      ]
    },
    peneiramento_fino: {
      massa_umida: 105.0,
      massa_seca: 100.0,
      peneiras: [
        { numero: 'Nº 16', aberturaMM: 1.2, massaRetida: 0.00 },
        { numero: 'Nº 30', aberturaMM: 0.6, massaRetida: 0.00 },
        { numero: 'Nº 40', aberturaMM: 0.42, massaRetida: 0.00 },
        { numero: 'Nº 60', aberturaMM: 0.25, massaRetida: 0.00 },
        { numero: 'Nº 100', aberturaMM: 0.15, massaRetida: 2.00 },
        { numero: 'Nº 200', aberturaMM: 0.075, massaRetida: 3.00 },
      ]
    },
    peneiras: [],
    ll: 75,
    lp: 30,
    observacoes: "IP = 45, LL ≥ 50, Acima da Linha A. 95% de finos."
  },

  // ============================================================
  // 8. Silte de Baixa Plasticidade (ML)
  // Cenário: Solo "pó de pedra" muito fino ou silte orgânico leve.
  // ============================================================
  {
    id: "ml-silte-baixa-plasticidade",
    nome: "Silte de Baixa Plasticidade (ML)",
    descricao: "Solo 'pó de pedra' muito fino ou silte orgânico leve. LL < 50, abaixo da Linha A.",
    classificacaoEsperada: "ML",
    massaTotal: 980.0,
    peneiramento_grosso: {
      massa_umida: 1000.0,
      massa_seca: 980.0,
      peneiras: [
        { numero: '2"', aberturaMM: 50.0, massaRetida: 0.00 },
        { numero: '1 1/2"', aberturaMM: 38.0, massaRetida: 0.00 },
        { numero: '1"', aberturaMM: 25.0, massaRetida: 0.00 },
        { numero: '3/4"', aberturaMM: 19.0, massaRetida: 0.00 },
        { numero: '3/8"', aberturaMM: 9.5, massaRetida: 0.00 },
        { numero: 'Nº 4', aberturaMM: 4.8, massaRetida: 0.00 },
        { numero: 'Nº 10', aberturaMM: 2.0, massaRetida: 0.00 },
      ]
    },
    peneiramento_fino: {
      massa_umida: 102.0,
      massa_seca: 100.0,
      peneiras: [
        { numero: 'Nº 16', aberturaMM: 1.2, massaRetida: 1.00 },
        { numero: 'Nº 30', aberturaMM: 0.6, massaRetida: 1.00 },
        { numero: 'Nº 40', aberturaMM: 0.42, massaRetida: 1.00 },
        { numero: 'Nº 60', aberturaMM: 0.25, massaRetida: 1.00 },
        { numero: 'Nº 100', aberturaMM: 0.15, massaRetida: 1.00 },
        { numero: 'Nº 200', aberturaMM: 0.075, massaRetida: 5.00 },
      ]
    },
    peneiras: [],
    ll: 34,
    lp: 28,
    observacoes: "IP = 6 (entre 4-7). Pode classificar como CL-ML ou ML dependendo da zona hachurada. 90% de finos."
  },

  // ============================================================
  // 9. Silte de Alta Plasticidade (MH)
  // Cenário: Silte elástico, solo micáceo.
  // ============================================================
  {
    id: "mh-silte-alta-plasticidade",
    nome: "Silte de Alta Plasticidade (MH)",
    descricao: "Silte elástico, solo micáceo. LL ≥ 50, abaixo da Linha A.",
    classificacaoEsperada: "MH",
    massaTotal: 950.0,
    peneiramento_grosso: {
      massa_umida: 1000.0,
      massa_seca: 950.0,
      peneiras: [
        { numero: '2"', aberturaMM: 50.0, massaRetida: 0.00 },
        { numero: '1 1/2"', aberturaMM: 38.0, massaRetida: 0.00 },
        { numero: '1"', aberturaMM: 25.0, massaRetida: 0.00 },
        { numero: '3/4"', aberturaMM: 19.0, massaRetida: 0.00 },
        { numero: '3/8"', aberturaMM: 9.5, massaRetida: 0.00 },
        { numero: 'Nº 4', aberturaMM: 4.8, massaRetida: 0.00 },
        { numero: 'Nº 10', aberturaMM: 2.0, massaRetida: 0.00 },
      ]
    },
    peneiramento_fino: {
      massa_umida: 105.0,
      massa_seca: 100.0,
      peneiras: [
        { numero: 'Nº 16', aberturaMM: 1.2, massaRetida: 0.00 },
        { numero: 'Nº 30', aberturaMM: 0.6, massaRetida: 0.00 },
        { numero: 'Nº 40', aberturaMM: 0.42, massaRetida: 0.00 },
        { numero: 'Nº 60', aberturaMM: 0.25, massaRetida: 0.00 },
        { numero: 'Nº 100', aberturaMM: 0.15, massaRetida: 0.00 },
        { numero: 'Nº 200', aberturaMM: 0.075, massaRetida: 10.00 },
      ]
    },
    peneiras: [],
    ll: 70,
    lp: 45,
    observacoes: "IP = 25. Linha A em LL=70 é aprox 36. Como 25 < 36, é MH. 90% de finos."
  },

  // ============================================================
  // 10. Caso de Fronteira (GW-GC)
  // Cenário: Pedregulho bem graduado mas com 8% de argila (5-12% finos).
  // ============================================================
  {
    id: "gw-gc-fronteira",
    nome: "Pedregulho GW-GC (Fronteira)",
    descricao: "Pedregulho bem graduado com 8% de argila (regra dos 5-12% de finos).",
    classificacaoEsperada: "GW-GC",
    massaTotal: 3000.0,
    peneiramento_grosso: {
      massa_umida: 3100.0,
      massa_seca: 3000.0,
      peneiras: [
        { numero: '2"', aberturaMM: 50.0, massaRetida: 0.00 },
        { numero: '1 1/2"', aberturaMM: 38.0, massaRetida: 0.00 },
        { numero: '1"', aberturaMM: 25.0, massaRetida: 500.00 },
        { numero: '3/4"', aberturaMM: 19.0, massaRetida: 500.00 },
        { numero: '3/8"', aberturaMM: 9.5, massaRetida: 500.00 },
        { numero: 'Nº 4', aberturaMM: 4.8, massaRetida: 500.00 },
        { numero: 'Nº 10', aberturaMM: 2.0, massaRetida: 400.00 },
      ]
    },
    peneiramento_fino: {
      massa_umida: 102.0,
      massa_seca: 100.0,
      peneiras: [
        { numero: 'Nº 16', aberturaMM: 1.2, massaRetida: 10.00 },
        { numero: 'Nº 30', aberturaMM: 0.6, massaRetida: 10.00 },
        { numero: 'Nº 40', aberturaMM: 0.42, massaRetida: 10.00 },
        { numero: 'Nº 60', aberturaMM: 0.25, massaRetida: 10.00 },
        { numero: 'Nº 100', aberturaMM: 0.15, massaRetida: 10.00 },
        { numero: 'Nº 200', aberturaMM: 0.075, massaRetida: 10.00 },
      ]
    },
    peneiras: [],
    ll: 30,
    lp: 18,
    observacoes: "IP = 12 → GC. Passante #10 é ~20%. 40% do fino passa na #200 → 8% global. Classificação dupla."
  },

  // ============================================================
  // 11. Caso de Fronteira: A-2-4 / SP-SM (Correção de Bug)
  // Cenário: 12% finos, NP. Validação de IP=0 e D10 ausente.
  // ============================================================
  {
    id: "fronteira-12-finos-np",
    nome: "Fronteira 12% Finos NP (A-2-4 / SP-SM)",
    descricao: "Teste de validação: Solo com ~12% de finos e NP. Deve classificar como A-2-4 e SP-SM (com fallback P).",
    classificacaoEsperada: "A-2-4 / SP-SM",
    massaTotal: 1205.74,
    peneiramento_grosso: {
      massa_umida: 1208.6,
      massa_seca: 1205.74,
      peneiras: [
        { numero: '2"', aberturaMM: 50.0, massaRetida: 0.00 },
        { numero: '1 1/2"', aberturaMM: 38.0, massaRetida: 0.00 },
        { numero: '1"', aberturaMM: 25.0, massaRetida: 0.00 },
        { numero: '3/4"', aberturaMM: 19.0, massaRetida: 0.00 },
        { numero: '3/8"', aberturaMM: 9.5, massaRetida: 0.00 },
        { numero: 'Nº 4', aberturaMM: 4.8, massaRetida: 0.00 },
        { numero: 'Nº 10', aberturaMM: 2.0, massaRetida: 4.00 },
      ]
    },
    peneiramento_fino: {
      massa_umida: 120.07,
      massa_seca: 119.78,
      peneiras: [
        { numero: 'Nº 16', aberturaMM: 1.2, massaRetida: 0.55 },
        { numero: 'Nº 30', aberturaMM: 0.6, massaRetida: 6.02 },
        { numero: 'Nº 40', aberturaMM: 0.42, massaRetida: 13.24 },
        { numero: 'Nº 60', aberturaMM: 0.25, massaRetida: 42.87 },
        { numero: 'Nº 100', aberturaMM: 0.15, massaRetida: 29.94 },
        { numero: 'Nº 200', aberturaMM: 0.075, massaRetida: 13.05 },
      ]
    },
    peneiras: [],
    ll: 13,
    lp: 0,
    observacoes: "IP calculado deve ser 0 (devido a LP=0). 11.74% finos. D10 indefinido. Deve evitar crash em USCS e erro A-2-6 em AASHTO."
  },
];

// Preencher o array 'peneiras' para compatibilidade com estrutura antiga
EXEMPLOS_GRANULOMETRIA.forEach(exemplo => {
  const todasPeneiras: PeneiraExemplo[] = [];

  if (exemplo.peneiramento_grosso) {
    todasPeneiras.push(...exemplo.peneiramento_grosso.peneiras);
  }
  if (exemplo.peneiramento_fino) {
    todasPeneiras.push(...exemplo.peneiramento_fino.peneiras);
  }

  exemplo.peneiras = todasPeneiras;
});

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