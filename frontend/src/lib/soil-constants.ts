// Constantes e valores típicos para solos

export interface AmostraIndicesFisicos {
  id: string;
  massaUmida: string;
  massaSeca: string;
  volume: string;
}

export interface SoilExample {
  name: string;
  description: string;
  icon: string;
  amostras: AmostraIndicesFisicos[];
  Gs: string;
  pesoEspecificoAgua: string;
  indice_vazios_max?: string;
  indice_vazios_min?: string;
}

// Helper para gerar ID único
const generateId = () => `${Date.now()}-${Math.floor(Math.random() * 1000000)}`;

export const soilExamples: SoilExample[] = [
  {
    name: "Areia Fofa",
    description: "Areia com grau de compacidade baixo - 3 amostras",
    icon: "🏖️",
    amostras: [
      { id: generateId(), massaUmida: "183.5", massaSeca: "164.6", volume: "100.0" },
      { id: generateId(), massaUmida: "184.2", massaSeca: "165.1", volume: "100.0" },
      { id: generateId(), massaUmida: "182.8", massaSeca: "164.0", volume: "100.0" },
    ],
    Gs: "2.65",
    pesoEspecificoAgua: "10.0",
    indice_vazios_max: "0.85",
    indice_vazios_min: "0.45",
  },
  {
    name: "Areia Compacta",
    description: "Areia bem compactada, alta densidade relativa - 3 amostras",
    icon: "🏗️",
    amostras: [
      { id: generateId(), massaUmida: "195.0", massaSeca: "180.0", volume: "100.0" },
      { id: generateId(), massaUmida: "196.5", massaSeca: "181.5", volume: "100.0" },
      { id: generateId(), massaUmida: "194.2", massaSeca: "179.2", volume: "100.0" },
    ],
    Gs: "2.66",
    pesoEspecificoAgua: "10.0",
    indice_vazios_max: "0.80",
    indice_vazios_min: "0.40",
  },
  {
    name: "Argila Mole",
    description: "Argila com alto índice de vazios - 4 amostras",
    icon: "🧱",
    amostras: [
      { id: generateId(), massaUmida: "168.0", massaSeca: "130.0", volume: "100.0" },
      { id: generateId(), massaUmida: "169.5", massaSeca: "131.2", volume: "100.0" },
      { id: generateId(), massaUmida: "167.2", massaSeca: "129.5", volume: "100.0" },
      { id: generateId(), massaUmida: "168.8", massaSeca: "130.6", volume: "100.0" },
    ],
    Gs: "2.72",
    pesoEspecificoAgua: "10.0",
    indice_vazios_max: "1.20",
    indice_vazios_min: "0.60",
  },
  {
    name: "Argila Rija",
    description: "Argila com baixo índice de vazios - 3 amostras",
    icon: "🔨",
    amostras: [
      { id: generateId(), massaUmida: "192.0", massaSeca: "165.0", volume: "100.0" },
      { id: generateId(), massaUmida: "191.5", massaSeca: "164.5", volume: "100.0" },
      { id: generateId(), massaUmida: "192.8", massaSeca: "165.8", volume: "100.0" },
    ],
    Gs: "2.70",
    pesoEspecificoAgua: "10.0",
    indice_vazios_max: "0.95",
    indice_vazios_min: "0.50",
  },
  {
    name: "Silte",
    description: "Solo com características intermediárias - 3 amostras",
    icon: "🌾",
    amostras: [
      { id: generateId(), massaUmida: "185.0", massaSeca: "160.0", volume: "100.0" },
      { id: generateId(), massaUmida: "186.2", massaSeca: "161.0", volume: "100.0" },
      { id: generateId(), massaUmida: "184.5", massaSeca: "159.5", volume: "100.0" },
    ],
    Gs: "2.68",
    pesoEspecificoAgua: "10.0",
    indice_vazios_max: "0.90",
    indice_vazios_min: "0.48",
  },
  {
    name: "Solo Saturado",
    description: "Solo com todos os vazios preenchidos por água - 3 amostras",
    icon: "💧",
    amostras: [
      { id: generateId(), massaUmida: "200.0", massaSeca: "160.0", volume: "100.0" },
      { id: generateId(), massaUmida: "199.5", massaSeca: "159.6", volume: "100.0" },
      { id: generateId(), massaUmida: "200.8", massaSeca: "160.5", volume: "100.0" },
    ],
    Gs: "2.65",
    pesoEspecificoAgua: "10.0",
    indice_vazios_max: "0.85",
    indice_vazios_min: "0.45",
  },
];

export interface GsValue {
  material: string;
  range: string;
  typical: number;
  description: string;
}

export const gsValues: GsValue[] = [
  {
    material: "Quartzo",
    range: "2.65 - 2.67",
    typical: 2.66,
    description: "Minerais de silicato, areias puras",
  },
  {
    material: "Feldspato",
    range: "2.55 - 2.75",
    typical: 2.65,
    description: "Minerais comuns em solos residuais",
  },
  {
    material: "Argilas (Caulinita)",
    range: "2.60 - 2.68",
    typical: 2.64,
    description: "Argila de baixa atividade",
  },
  {
    material: "Argilas (Ilita)",
    range: "2.65 - 2.75",
    typical: 2.70,
    description: "Argila de atividade média",
  },
  {
    material: "Argilas (Montmorilonita)",
    range: "2.70 - 2.90",
    typical: 2.78,
    description: "Argila expansiva, alta atividade",
  },
  {
    material: "Mica",
    range: "2.70 - 3.20",
    typical: 2.90,
    description: "Minerais lamelares",
  },
  {
    material: "Solo Orgânico",
    range: "1.40 - 2.50",
    typical: 2.00,
    description: "Solos com matéria orgânica",
  },
  {
    material: "Turfa",
    range: "1.30 - 1.80",
    typical: 1.50,
    description: "Alto teor de matéria orgânica",
  },
];

export interface ResultInterpretation {
  parameter: string;
  value: number | null;
  interpretation: string;
  alert?: "info" | "warning" | "success" | "error";
}

export function interpretResults(results: any): ResultInterpretation[] {
  const interpretations: ResultInterpretation[] = [];

  // Grau de Saturação
  if (results.grau_saturacao !== null) {
    const Sr = results.grau_saturacao;
    let interpretation = "";
    let alert: "info" | "warning" | "success" | undefined = "info";
    
    if (Sr < 20) {
      interpretation = "Solo muito seco. Baixíssima umidade, pode ter problemas de coesão.";
      alert = "warning";
    } else if (Sr < 50) {
      interpretation = "Solo parcialmente saturado. Vazios contêm água e ar.";
    } else if (Sr < 90) {
      interpretation = "Solo com boa saturação. Predominância de água nos vazios.";
      alert = "success";
    } else if (Sr < 100) {
      interpretation = "Solo quase saturado. Pouquíssimo ar nos vazios.";
      alert = "success";
    } else {
      interpretation = "Solo totalmente saturado. Todos os vazios preenchidos por água.";
      alert = "info";
    }
    
    interpretations.push({
      parameter: "Grau de Saturação",
      value: Sr,
      interpretation,
      alert,
    });
  }

  // Compacidade Relativa
  if (results.compacidade_relativa !== null) {
    const Dr = results.compacidade_relativa;
    let interpretation = "";
    let alert: "info" | "warning" | "success" | undefined = "info";
    
    if (Dr < 15) {
      interpretation = "Solo muito fofo. Baixa resistência e alta compressibilidade.";
      alert = "error";
    } else if (Dr < 35) {
      interpretation = "Solo fofo. Compressível, necessita tratamento para obras.";
      alert = "warning";
    } else if (Dr < 65) {
      interpretation = "Solo medianamente compacto. Propriedades intermediárias.";
      alert = "info";
    } else if (Dr < 85) {
      interpretation = "Solo compacto. Boa capacidade de carga, baixa compressibilidade.";
      alert = "success";
    } else {
      interpretation = "Solo muito compacto. Excelente capacidade de carga.";
      alert = "success";
    }
    
    interpretations.push({
      parameter: "Compacidade Relativa",
      value: Dr,
      interpretation,
      alert,
    });
  }

  // Índice de Vazios
  if (results.indice_vazios !== null) {
    const e = results.indice_vazios;
    let interpretation = "";
    let alert: "info" | "warning" | "success" | undefined = "info";
    
    if (e < 0.4) {
      interpretation = "Índice de vazios muito baixo. Solo denso, excelente para fundações.";
      alert = "success";
    } else if (e < 0.7) {
      interpretation = "Índice de vazios médio. Solo com densidade adequada.";
      alert = "info";
    } else if (e < 1.0) {
      interpretation = "Índice de vazios alto. Solo poroso, atenção à compressibilidade.";
      alert = "warning";
    } else {
      interpretation = "Índice de vazios muito alto. Solo muito poroso, baixa resistência.";
      alert = "error";
    }
    
    interpretations.push({
      parameter: "Índice de Vazios",
      value: e,
      interpretation,
      alert,
    });
  }

  // Umidade
  if (results.umidade !== null) {
    const w = results.umidade;
    let interpretation = "";
    let alert: "info" | "warning" | "success" | undefined = "info";
    
    if (w < 5) {
      interpretation = "Solo muito seco. Pode ter problemas de trabalhabilidade.";
      alert = "warning";
    } else if (w < 15) {
      interpretation = "Umidade baixa a média. Típico de solos arenosos.";
      alert = "info";
    } else if (w < 30) {
      interpretation = "Umidade moderada. Comum em solos argilosos.";
      alert = "info";
    } else if (w < 50) {
      interpretation = "Umidade alta. Típico de solos finos ou argilas moles.";
      alert = "warning";
    } else {
      interpretation = "Umidade muito alta. Solo pode estar próximo à saturação.";
      alert = "error";
    }
    
    interpretations.push({
      parameter: "Umidade",
      value: w,
      interpretation,
      alert,
    });
  }

  // Porosidade
  if (results.porosidade !== null) {
    const n = results.porosidade;
    let interpretation = "";
    
    if (n < 30) {
      interpretation = "Porosidade baixa. Solo denso com poucos vazios.";
    } else if (n < 45) {
      interpretation = "Porosidade média. Equilíbrio entre sólidos e vazios.";
    } else {
      interpretation = "Porosidade alta. Grande volume de vazios, solo poroso.";
    }
    
    interpretations.push({
      parameter: "Porosidade",
      value: n,
      interpretation,
      alert: "info",
    });
  }

  return interpretations;
}

