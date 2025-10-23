// frontend/src/lib/exemplos-tensoes.ts
export interface CamadaSoloExemplo {
  nome: string;
  espessura: string;
  profundidadeNA: string;
  capilaridade: string;
  gamaNat: string;
  gamaSat: string;
  Ko: string;
  impermeavel?: boolean;
}

export interface ExemploTensoes {
  nome: string;
  descricao: string;
  icon: string;
  profundidadeNA: string;
  alturaCapilar: string; // Mantido para compatibilidade, mas não será mais usado
  pesoEspecificoAgua: string;
  camadas: CamadaSoloExemplo[];
}

export const exemplosTensoes: ExemploTensoes[] = [
  {
    nome: "Areia sobre Argila",
    descricao: "Perfil típico: areia (4m) sobre argila rija (6m), NA a 3m",
    icon: "🏖️",
    profundidadeNA: "3.0",
    alturaCapilar: "0.0",
    pesoEspecificoAgua: "10.0",
    camadas: [
      {
        nome: "Areia Média",
        espessura: "4.0",
        profundidadeNA: "3.0",
        capilaridade: "0.0",
        gamaNat: "17.5",
        gamaSat: "19.2",
        Ko: "0.4",
        impermeavel: false
      },
      {
        nome: "Argila Rija",
        espessura: "6.0",
        profundidadeNA: "",
        capilaridade: "",
        gamaNat: "",
        gamaSat: "18.8",
        Ko: "0.6",
        impermeavel: false
      }
    ]
  },
  {
    nome: "Solo com Capilaridade",
    descricao: "Perfil estratificado com franja capilar de 1m acima do NA",
    icon: "🌊",
    profundidadeNA: "4.0",
    alturaCapilar: "1.0",
    pesoEspecificoAgua: "10.0",
    camadas: [
      {
        nome: "Argila Média",
        espessura: "2.5",
        profundidadeNA: "4.0",
        capilaridade: "1.0",
        gamaNat: "18.5",
        gamaSat: "20.2",
        Ko: "0.55",
        impermeavel: false
      },
      {
        nome: "Silte Arenoso",
        espessura: "3.0",
        profundidadeNA: "",
        capilaridade: "",
        gamaNat: "17.8",
        gamaSat: "19.5",
        Ko: "0.5",
        impermeavel: false
      },
      {
        nome: "Areia Densa",
        espessura: "4.5",
        profundidadeNA: "",
        capilaridade: "",
        gamaNat: "",
        gamaSat: "19.8",
        Ko: "0.45",
        impermeavel: false
      }
    ]
  },
  {
    nome: "Argila sobre Areia",
    descricao: "Camada argilosa superficial (3m) sobre areia compacta (7m), NA na interface",
    icon: "🏗️",
    profundidadeNA: "3.0",
    alturaCapilar: "0.5",
    pesoEspecificoAgua: "10.0",
    camadas: [
      {
        nome: "Argila Mole",
        espessura: "3.0",
        profundidadeNA: "3.0",
        capilaridade: "0.5",
        gamaNat: "16.5",
        gamaSat: "18.5",
        Ko: "0.6",
        impermeavel: false
      },
      {
        nome: "Areia Compacta",
        espessura: "7.0",
        profundidadeNA: "",
        capilaridade: "",
        gamaNat: "",
        gamaSat: "20.2",
        Ko: "0.35",
        impermeavel: false
      }
    ]
  },
  {
    nome: "Aquíferos Separados",
    descricao: "Dois níveis de água separados por camada impermeável (aquitarde)",
    icon: "🌍",
    profundidadeNA: "2.0",
    alturaCapilar: "0.0",
    pesoEspecificoAgua: "10.0",
    camadas: [
      {
        nome: "Areia Fina (Aquífero Livre)",
        espessura: "3.0",
        profundidadeNA: "2.0",
        capilaridade: "0.5",
        gamaNat: "17.0",
        gamaSat: "19.0",
        Ko: "0.4",
        impermeavel: false
      },
      {
        nome: "Argila Impermeável",
        espessura: "2.0",
        profundidadeNA: "",
        capilaridade: "",
        gamaNat: "19.0",
        gamaSat: "20.5",
        Ko: "0.6",
        impermeavel: true
      },
      {
        nome: "Areia Grossa (Aquífero Confinado)",
        espessura: "5.0",
        profundidadeNA: "5.0",
        capilaridade: "0.0",
        gamaNat: "",
        gamaSat: "20.0",
        Ko: "0.35",
        impermeavel: false
      }
    ]
  },
  {
    nome: "NA Superficial",
    descricao: "Solo saturado desde a superfície (silte sobre argila)",
    icon: "💧",
    profundidadeNA: "0.0",
    alturaCapilar: "0.0",
    pesoEspecificoAgua: "10.0",
    camadas: [
      {
        nome: "Silte Saturado",
        espessura: "4.0",
        profundidadeNA: "0.0",
        capilaridade: "0.0",
        gamaNat: "",
        gamaSat: "18.5",
        Ko: "0.5",
        impermeavel: false
      },
      {
        nome: "Argila Mole Saturada",
        espessura: "6.0",
        profundidadeNA: "",
        capilaridade: "",
        gamaNat: "",
        gamaSat: "19.2",
        Ko: "0.55",
        impermeavel: false
      }
    ]
  }
];

