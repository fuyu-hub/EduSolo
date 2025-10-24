// Exemplos didáticos para Limites de Consistência

export interface ExemploLimites {
  id: string;
  nome: string;
  descricao: string;
  tipoSolo: string;
  icon: string;
  pontosLL: Array<{
    numGolpes: string;
    massaUmidaRecipiente: string;
    massaSecaRecipiente: string;
    massaRecipiente: string;
  }>;
  massaUmidaRecipienteLP: string;
  massaSecaRecipienteLP: string;
  massaRecipienteLP: string;
  umidadeNatural?: string;
  percentualArgila?: string;
}

export const exemplosLimites: ExemploLimites[] = [
  {
    id: "argila-alta-plasticidade",
    nome: "Argila de Alta Plasticidade",
    descricao: "Solo argiloso com LL > 50% e IP alto - Típico de solos CH",
    tipoSolo: "Argila",
    icon: "🏔️",
    pontosLL: [
      { numGolpes: "35", massaUmidaRecipiente: "45.80", massaSecaRecipiente: "38.20", massaRecipiente: "15.50" },
      { numGolpes: "28", massaUmidaRecipiente: "48.50", massaSecaRecipiente: "39.80", massaRecipiente: "15.20" },
      { numGolpes: "25", massaUmidaRecipiente: "50.20", massaSecaRecipiente: "40.50", massaRecipiente: "14.80" },
      { numGolpes: "20", massaUmidaRecipiente: "52.80", massaSecaRecipiente: "41.60", massaRecipiente: "15.00" },
      { numGolpes: "15", massaUmidaRecipiente: "55.40", massaSecaRecipiente: "42.30", massaRecipiente: "14.50" }
    ],
    massaUmidaRecipienteLP: "38.60",
    massaSecaRecipienteLP: "34.20",
    massaRecipienteLP: "16.80",
    umidadeNatural: "35.0",
    percentualArgila: "65.0"
  },
  {
    id: "argila-baixa-plasticidade",
    nome: "Argila de Baixa Plasticidade",
    descricao: "Solo argiloso com LL < 50% e IP moderado - Típico de solos CL",
    tipoSolo: "Argila",
    icon: "🏗️",
    pontosLL: [
      { numGolpes: "33", massaUmidaRecipiente: "42.10", massaSecaRecipiente: "36.50", massaRecipiente: "16.10" },
      { numGolpes: "28", massaUmidaRecipiente: "44.80", massaSecaRecipiente: "38.20", massaRecipiente: "15.70" },
      { numGolpes: "25", massaUmidaRecipiente: "45.50", massaSecaRecipiente: "38.00", massaRecipiente: "15.00" },
      { numGolpes: "20", massaUmidaRecipiente: "48.10", massaSecaRecipiente: "40.00", massaRecipiente: "16.40" },
      { numGolpes: "16", massaUmidaRecipiente: "50.20", massaSecaRecipiente: "41.10", massaRecipiente: "15.20" }
    ],
    massaUmidaRecipienteLP: "32.80",
    massaSecaRecipienteLP: "29.50",
    massaRecipienteLP: "14.20",
    umidadeNatural: "25.0",
    percentualArgila: "30.0"
  },
  {
    id: "silte-baixa-compressibilidade",
    nome: "Silte de Baixa Compressibilidade",
    descricao: "Solo siltoso com LL < 50% abaixo da linha A - Típico de solos ML",
    tipoSolo: "Silte",
    icon: "🌾",
    pontosLL: [
      { numGolpes: "32", massaUmidaRecipiente: "38.50", massaSecaRecipiente: "34.20", massaRecipiente: "16.80" },
      { numGolpes: "27", massaUmidaRecipiente: "40.20", massaSecaRecipiente: "35.10", massaRecipiente: "16.50" },
      { numGolpes: "25", massaUmidaRecipiente: "41.00", massaSecaRecipiente: "35.60", massaRecipiente: "16.20" },
      { numGolpes: "21", massaUmidaRecipiente: "43.80", massaSecaRecipiente: "37.50", massaRecipiente: "17.00" },
      { numGolpes: "17", massaUmidaRecipiente: "45.50", massaSecaRecipiente: "38.20", massaRecipiente: "16.00" }
    ],
    massaUmidaRecipienteLP: "30.40",
    massaSecaRecipienteLP: "28.60",
    massaRecipienteLP: "15.20",
    umidadeNatural: "22.0",
    percentualArgila: "15.0"
  },
  {
    id: "silte-alta-compressibilidade",
    nome: "Silte de Alta Compressibilidade",
    descricao: "Solo siltoso com LL > 50% abaixo da linha A - Típico de solos MH",
    tipoSolo: "Silte",
    icon: "🌊",
    pontosLL: [
      { numGolpes: "34", massaUmidaRecipiente: "52.30", massaSecaRecipiente: "42.80", massaRecipiente: "18.50" },
      { numGolpes: "29", massaUmidaRecipiente: "55.60", massaSecaRecipiente: "44.20", massaRecipiente: "18.00" },
      { numGolpes: "25", massaUmidaRecipiente: "57.20", massaSecaRecipiente: "45.00", massaRecipiente: "17.80" },
      { numGolpes: "22", massaUmidaRecipiente: "59.80", massaSecaRecipiente: "46.50", massaRecipiente: "18.30" },
      { numGolpes: "18", massaUmidaRecipiente: "62.40", massaSecaRecipiente: "47.80", massaRecipiente: "17.50" }
    ],
    massaUmidaRecipienteLP: "36.80",
    massaSecaRecipienteLP: "33.20",
    massaRecipienteLP: "16.50",
    umidadeNatural: "42.0",
    percentualArgila: "18.0"
  },
  {
    id: "argila-organica",
    nome: "Argila Orgânica",
    descricao: "Solo argiloso com matéria orgânica - Típico de solos OH ou OL",
    tipoSolo: "Orgânico",
    icon: "🍂",
    pontosLL: [
      { numGolpes: "31", massaUmidaRecipiente: "68.50", massaSecaRecipiente: "48.20", massaRecipiente: "20.50" },
      { numGolpes: "26", massaUmidaRecipiente: "72.80", massaSecaRecipiente: "50.10", massaRecipiente: "20.00" },
      { numGolpes: "25", massaUmidaRecipiente: "74.20", massaSecaRecipiente: "50.80", massaRecipiente: "19.80" },
      { numGolpes: "21", massaUmidaRecipiente: "78.50", massaSecaRecipiente: "53.20", massaRecipiente: "21.00" },
      { numGolpes: "17", massaUmidaRecipiente: "82.30", massaSecaRecipiente: "54.80", massaRecipiente: "20.20" }
    ],
    massaUmidaRecipienteLP: "44.60",
    massaSecaRecipienteLP: "38.50",
    massaRecipienteLP: "18.20",
    umidadeNatural: "58.0",
    percentualArgila: "42.0"
  },
  {
    id: "solo-residual",
    nome: "Solo Residual Laterítico",
    descricao: "Solo laterítico típico de regiões tropicais com IP moderado",
    tipoSolo: "Residual",
    icon: "🌴",
    pontosLL: [
      { numGolpes: "30", massaUmidaRecipiente: "46.20", massaSecaRecipiente: "40.50", massaRecipiente: "17.20" },
      { numGolpes: "26", massaUmidaRecipiente: "48.80", massaSecaRecipiente: "41.80", massaRecipiente: "17.00" },
      { numGolpes: "25", massaUmidaRecipiente: "49.50", massaSecaRecipiente: "42.20", massaRecipiente: "16.80" },
      { numGolpes: "22", massaUmidaRecipiente: "52.10", massaSecaRecipiente: "43.90", massaRecipiente: "17.50" },
      { numGolpes: "18", massaUmidaRecipiente: "54.80", massaSecaRecipiente: "45.20", massaRecipiente: "16.90" }
    ],
    massaUmidaRecipienteLP: "35.40",
    massaSecaRecipienteLP: "32.10",
    massaRecipienteLP: "15.80",
    umidadeNatural: "28.0",
    percentualArgila: "38.0"
  },
  {
    id: "argila-expansiva",
    nome: "Argila Expansiva (Montmorilonítica)",
    descricao: "Solo argiloso com alta atividade e expansividade - LL muito alto",
    tipoSolo: "Argila Expansiva",
    icon: "⚠️",
    pontosLL: [
      { numGolpes: "36", massaUmidaRecipiente: "62.40", massaSecaRecipiente: "48.50", massaRecipiente: "18.20" },
      { numGolpes: "30", massaUmidaRecipiente: "66.80", massaSecaRecipiente: "50.20", massaRecipiente: "18.00" },
      { numGolpes: "25", massaUmidaRecipiente: "69.50", massaSecaRecipiente: "51.40", massaRecipiente: "17.80" },
      { numGolpes: "21", massaUmidaRecipiente: "73.20", massaSecaRecipiente: "53.10", massaRecipiente: "18.50" },
      { numGolpes: "16", massaUmidaRecipiente: "77.80", massaSecaRecipiente: "55.20", massaRecipiente: "18.10" }
    ],
    massaUmidaRecipienteLP: "42.80",
    massaSecaRecipienteLP: "37.20",
    massaRecipienteLP: "17.50",
    umidadeNatural: "48.0",
    percentualArgila: "72.0"
  }
];

