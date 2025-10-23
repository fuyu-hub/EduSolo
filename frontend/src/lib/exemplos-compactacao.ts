// frontend/src/lib/exemplos-compactacao.ts
export interface PontoCompactacao {
  pesoAmostaCilindro: string;
  pesoBrutoUmido: string;
  pesoBrutoSeco: string;
  tara: string;
}

export interface ExemploCompactacao {
  nome: string;
  descricao: string;
  icon: string;
  volumeCilindro: string;
  pesoCilindro: string;
  Gs: string;
  pontos: PontoCompactacao[];
}

export const exemplosCompactacao: ExemploCompactacao[] = [
  {
    nome: "Proctor Normal - Areia Argilosa",
    descricao: "Ensaio típico de Proctor Normal (NBR 7182) para areia argilosa",
    icon: "🏗️",
    volumeCilindro: "982",
    pesoCilindro: "4100",
    Gs: "2.65",
    pontos: [
      {
        pesoAmostaCilindro: "6050.00",
        pesoBrutoUmido: "106.56",
        pesoBrutoSeco: "93.69",
        tara: "24.72"
      },
      {
        pesoAmostaCilindro: "6180.00",
        pesoBrutoUmido: "85.53",
        pesoBrutoSeco: "71.05",
        tara: "24.35"
      },
      {
        pesoAmostaCilindro: "6220.00",
        pesoBrutoUmido: "91.72",
        pesoBrutoSeco: "79.13",
        tara: "23.72"
      },
      {
        pesoAmostaCilindro: "6230.00",
        pesoBrutoUmido: "67.94",
        pesoBrutoSeco: "58.53",
        tara: "23.80"
      }
    ]
  },
  {
    nome: "Proctor Modificado - Argila",
    descricao: "Ensaio de Proctor Modificado para solo argiloso",
    icon: "🔨",
    volumeCilindro: "1000",
    pesoCilindro: "4250",
    Gs: "2.70",
    pontos: [
      {
        pesoAmostaCilindro: "6350.00",
        pesoBrutoUmido: "95.20",
        pesoBrutoSeco: "88.30",
        tara: "22.10"
      },
      {
        pesoAmostaCilindro: "6480.00",
        pesoBrutoUmido: "102.50",
        pesoBrutoSeco: "92.80",
        tara: "21.80"
      },
      {
        pesoAmostaCilindro: "6520.00",
        pesoBrutoUmido: "108.40",
        pesoBrutoSeco: "96.20",
        tara: "23.00"
      },
      {
        pesoAmostaCilindro: "6490.00",
        pesoBrutoUmido: "115.60",
        pesoBrutoSeco: "99.80",
        tara: "22.50"
      },
      {
        pesoAmostaCilindro: "6410.00",
        pesoBrutoUmido: "120.30",
        pesoBrutoSeco: "102.10",
        tara: "21.90"
      }
    ]
  },
  {
    nome: "Solo Arenoso - Proctor Normal",
    descricao: "Solo com predominância de areia fina e média",
    icon: "🏖️",
    volumeCilindro: "982",
    pesoCilindro: "4100",
    Gs: "2.67",
    pontos: [
      {
        pesoAmostaCilindro: "5980.00",
        pesoBrutoUmido: "88.40",
        pesoBrutoSeco: "82.20",
        tara: "20.50"
      },
      {
        pesoAmostaCilindro: "6120.00",
        pesoBrutoUmido: "92.30",
        pesoBrutoSeco: "84.10",
        tara: "21.30"
      },
      {
        pesoAmostaCilindro: "6180.00",
        pesoBrutoUmido: "98.50",
        pesoBrutoSeco: "87.40",
        tara: "22.10"
      },
      {
        pesoAmostaCilindro: "6140.00",
        pesoBrutoUmido: "105.20",
        pesoBrutoSeco: "91.80",
        tara: "21.80"
      }
    ]
  }
];

