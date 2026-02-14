// frontend/src/lib/exemplos-compactacao.ts
export interface PontoCompactacao {
  pesoAmostaCilindro: string;
  pesoBrutoUmido: string;
  pesoBrutoSeco: string;
  tara: string;
}

export interface ExemploCompactacao {
  id?: string;
  nome: string;
  descricao: string;
  icon: string;
  iconName?: string;
  colorName?: string;
  volumeCilindro: string;
  pesoCilindro: string;
  Gs: string;
  pontos: PontoCompactacao[];
}

const STORAGE_KEY = "edusolo_custom_compactacao_examples";

export function getCustomExamples(): ExemploCompactacao[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveCustomExample(example: ExemploCompactacao): void {
  const all = getCustomExamples();
  all.push({ ...example, id: crypto.randomUUID() });
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
}

export function updateCustomExample(id: string, example: ExemploCompactacao): void {
  const all = getCustomExamples();
  const idx = all.findIndex(e => e.id === id);
  if (idx >= 0) {
    all[idx] = { ...example, id };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  }
}

export function deleteCustomExample(id: string): void {
  const all = getCustomExamples().filter(e => e.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
}

export const exemplosCompactacao: ExemploCompactacao[] = [
  {
    nome: "Energia Normal - Solo Argiloso",
    descricao: "Aterro comum. Solo com umidade ótima mais alta e densidade menor. Cilindro pequeno (981 cm³).",
    icon: "🧱",
    volumeCilindro: "981",
    pesoCilindro: "2850",
    Gs: "2.65",
    pontos: [
      {
        pesoAmostaCilindro: "4685",
        pesoBrutoUmido: "118.50",
        pesoBrutoSeco: "104.30",
        tara: "18.20"
      },
      {
        pesoAmostaCilindro: "4760",
        pesoBrutoUmido: "126.80",
        pesoBrutoSeco: "109.50",
        tara: "19.10"
      },
      {
        pesoAmostaCilindro: "4805",
        pesoBrutoUmido: "135.20",
        pesoBrutoSeco: "114.20",
        tara: "17.80"
      },
      {
        pesoAmostaCilindro: "4780",
        pesoBrutoUmido: "148.60",
        pesoBrutoSeco: "122.90",
        tara: "18.50"
      },
      {
        pesoAmostaCilindro: "4735",
        pesoBrutoUmido: "155.10",
        pesoBrutoSeco: "125.10",
        tara: "19.00"
      }
    ]
  },
  {
    nome: "Energia Modificada - Base Granular",
    descricao: "Base de pavimentação (brita/cascalho). Cilindro grande (2123 cm³) e pesado.",
    icon: "🛣️",
    volumeCilindro: "2123",
    pesoCilindro: "5800",
    Gs: "2.72",
    pontos: [
      {
        pesoAmostaCilindro: "10450",
        pesoBrutoUmido: "165.20",
        pesoBrutoSeco: "158.80",
        tara: "30.50"
      },
      {
        pesoAmostaCilindro: "10620",
        pesoBrutoUmido: "178.50",
        pesoBrutoSeco: "169.80",
        tara: "29.80"
      },
      {
        pesoAmostaCilindro: "10710",
        pesoBrutoUmido: "185.60",
        pesoBrutoSeco: "173.90",
        tara: "31.00"
      },
      {
        pesoAmostaCilindro: "10650",
        pesoBrutoUmido: "195.40",
        pesoBrutoSeco: "180.20",
        tara: "30.20"
      },
      {
        pesoAmostaCilindro: "10540",
        pesoBrutoUmido: "210.10",
        pesoBrutoSeco: "191.00",
        tara: "29.50"
      }
    ]
  },
  {
    nome: "Energia Intermediária - Silte Arenoso",
    descricao: "Camada final de aterro ou sub-base. Densidade média. Cilindro arredondado (1000 cm³).",
    icon: "🏜️",
    volumeCilindro: "1000",
    pesoCilindro: "3100",
    Gs: "2.68",
    pontos: [
      {
        pesoAmostaCilindro: "4950",
        pesoBrutoUmido: "110.50",
        pesoBrutoSeco: "101.50",
        tara: "20.00"
      },
      {
        pesoAmostaCilindro: "5025",
        pesoBrutoUmido: "118.20",
        pesoBrutoSeco: "107.20",
        tara: "21.50"
      },
      {
        pesoAmostaCilindro: "5090",
        pesoBrutoUmido: "125.80",
        pesoBrutoSeco: "112.30",
        tara: "20.80"
      },
      {
        pesoAmostaCilindro: "5115",
        pesoBrutoUmido: "138.50",
        pesoBrutoSeco: "121.50",
        tara: "22.00"
      },
      {
        pesoAmostaCilindro: "5070",
        pesoBrutoUmido: "145.20",
        pesoBrutoSeco: "124.90",
        tara: "21.20"
      },
      {
        pesoAmostaCilindro: "5010",
        pesoBrutoUmido: "152.60",
        pesoBrutoSeco: "128.80",
        tara: "20.50"
      }
    ]
  }
];
