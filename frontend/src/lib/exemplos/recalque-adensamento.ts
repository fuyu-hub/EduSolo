/**
 * Exemplos para o módulo de Recalque por Adensamento
 */

export interface ExemploRecalque {
  nome: string;
  descricao: string;
  tipoAdensamento: "normalmenteAdensada" | "preAdensada"; // Tipo para o badge
  dados: {
    perfil: {
      profundidadeNA: string;
      alturaCapilar: string;
      pesoEspecificoAgua: string;
      camadas: Array<{
        nome: string;
        espessura: string;
        profundidadeNA: string;
        capilaridade: string;
        gamaNat: string;
        gamaSat: string;
        Ko: string;
        impermeavel: boolean;
        compressivel: boolean;
      }>;
    };
    camadaArgila: {
      espessura: number;
      gamaNat: number | null;
      gamaSat: number | null;
      profundidadeNA: number | null;
      Cc: number;
      Cr: number;
      Cv: number;
      e0: number;
    };
    camadaBase: {
      drenante: boolean;
    };
    camadasAterroPassado: Array<{
      nome: string;
      espessura: number;
      gamaNat?: number;
      gamaSat?: number;
    }>;
    camadasAterroPresente: Array<{
      nome: string;
      espessura: number;
      gamaNat?: number;
      gamaSat?: number;
    }>;
    camadasAterroFuturo: Array<{
      nome: string;
      espessura: number;
      gamaNat?: number;
      gamaSat?: number;
    }>;
    periodoInicial: "passado" | "presente" | "futuro";
  };
}

// ========== NORMALMENTE ADENSADAS (2 exemplos) ==========

export const exemploRecalque1: ExemploRecalque = {
  nome: "Argila Normalmente Adensada - Exemplo 1",
  descricao: "Argila normalmente adensada com aterro moderado no futuro. Passado e presente similares (RPA ≈ 1).",
  tipoAdensamento: "normalmenteAdensada",
  dados: {
    perfil: {
      profundidadeNA: "1.0", // NA está 1m acima da argila (valor relativo ao topo da argila)
      alturaCapilar: "0.0",
      pesoEspecificoAgua: "10.0",
      camadas: [
        {
          nome: "Areia Grossa Densa",
          espessura: "2.0",
          profundidadeNA: "",
          capilaridade: "",
          gamaNat: "18.0",
          gamaSat: "18.0", // Mesmo do natural
          Ko: "",
          impermeavel: false,
          compressivel: false,
        },
      ],
    },
    camadaArgila: {
      espessura: 8.0,
      gamaNat: 16.5,
      gamaSat: 16.5, // Mesmo do natural
      profundidadeNA: null,
      Cc: 0.45,
      Cr: 0.06,
      Cv: 2.5,
      e0: 1.2,
    },
    camadaBase: {
      drenante: true,
    },
    camadasAterroPassado: [
      {
        nome: "Areia Grossa Densa",
        espessura: 2.0, // Passado igual ao presente (normalmente adensada)
        gamaNat: 18.0,
        gamaSat: 18.0,
      },
    ],
    camadasAterroPresente: [
      {
        nome: "Areia Grossa Densa",
        espessura: 2.0,
        gamaNat: 18.0,
        gamaSat: 18.0,
      },
    ],
    camadasAterroFuturo: [
      {
        nome: "Aterro",
        espessura: 2.5,
        gamaNat: 19.0,
        gamaSat: 19.0,
      },
    ],
    periodoInicial: "futuro",
  },
};

export const exemploRecalque2: ExemploRecalque = {
  nome: "Argila Normalmente Adensada - Exemplo 2",
  descricao: "Argila normalmente adensada com aterro significativo no futuro. Perfil presente sem mudanças históricas.",
  tipoAdensamento: "normalmenteAdensada",
  dados: {
    perfil: {
      profundidadeNA: "0.5", // NA 0.5m acima da argila
      alturaCapilar: "0.0",
      pesoEspecificoAgua: "10.0",
      camadas: [
        {
          nome: "Areia Fina",
          espessura: "3.0",
          profundidadeNA: "",
          capilaridade: "",
          gamaNat: "17.0",
          gamaSat: "17.0",
          Ko: "",
          impermeavel: false,
          compressivel: false,
        },
      ],
    },
    camadaArgila: {
      espessura: 6.0,
      gamaNat: 17.0,
      gamaSat: 17.0,
      profundidadeNA: null,
      Cc: 0.35,
      Cr: 0.05,
      Cv: 3.0,
      e0: 1.0,
    },
    camadaBase: {
      drenante: true,
    },
    camadasAterroPassado: [
      {
        nome: "Areia Fina",
        espessura: 3.0,
        gamaNat: 17.0,
        gamaSat: 17.0,
      },
    ],
    camadasAterroPresente: [
      {
        nome: "Areia Fina",
        espessura: 3.0,
        gamaNat: 17.0,
        gamaSat: 17.0,
      },
    ],
    camadasAterroFuturo: [
      {
        nome: "Aterro Compactado",
        espessura: 2.0,
        gamaNat: 20.0,
        gamaSat: 20.0,
      },
    ],
    periodoInicial: "presente",
  },
};

// ========== PRÉ-ADENSADAS σ'vf ≤ σ'vm (2 exemplos) ==========

export const exemploRecalque3: ExemploRecalque = {
  nome: "Argila Pré-Adensada - σ'vf ≤ σ'vm - Exemplo 1",
  descricao: "Argila pré-adensada com remoção histórica. Aterro futuro não excede tensão de pré-adensamento (usa apenas Cr).",
  tipoAdensamento: "preAdensada",
  dados: {
    perfil: {
      profundidadeNA: "-1.0", // NA 1m abaixo da argila
      alturaCapilar: "0.0",
      pesoEspecificoAgua: "10.0",
      camadas: [
        {
          nome: "Areia Média",
          espessura: "1.5",
          profundidadeNA: "",
          capilaridade: "",
          gamaNat: "18.5",
          gamaSat: "18.5",
          Ko: "",
          impermeavel: false,
          compressivel: false,
        },
      ],
    },
    camadaArgila: {
      espessura: 12.0,
      gamaNat: 16.5,
      gamaSat: 16.5,
      profundidadeNA: null,
      Cc: 1.2,
      Cr: 0.12,
      Cv: 2.0,
      e0: 1.8,
    },
    camadaBase: {
      drenante: false,
    },
    camadasAterroPassado: [
      {
        nome: "Aterro Antigo Removido",
        espessura: 6.0, // Passado tinha mais sobrecarga
        gamaNat: 20.0,
        gamaSat: 20.0,
      },
    ],
    camadasAterroPresente: [
      {
        nome: "Areia Média",
        espessura: 1.5, // Presente com menos sobrecarga (remoção)
        gamaNat: 18.5,
        gamaSat: 18.5,
      },
    ],
    camadasAterroFuturo: [
      {
        nome: "Aterro Novo",
        espessura: 1.5, // Futuro pequeno, não excede σ'vm
        gamaNat: 19.0,
        gamaSat: 19.0,
      },
    ],
    periodoInicial: "presente",
  },
};

export const exemploRecalque4: ExemploRecalque = {
  nome: "Argila Pré-Adensada - σ'vf ≤ σ'vm - Exemplo 2",
  descricao: "Argila pré-adensada com remoção parcial. Aterro futuro ainda na zona de recompressão (σ'vf ≤ σ'vm).",
  tipoAdensamento: "preAdensada",
  dados: {
    perfil: {
      profundidadeNA: "1.5", // NA 1.5m acima da argila
      alturaCapilar: "0.0",
      pesoEspecificoAgua: "10.0",
      camadas: [
        {
          nome: "Areia Grossa",
          espessura: "1.0",
          profundidadeNA: "",
          capilaridade: "",
          gamaNat: "19.0",
          gamaSat: "19.0",
          Ko: "",
          impermeavel: false,
          compressivel: false,
        },
        {
          nome: "Silte Arenoso",
          espessura: "1.5",
          profundidadeNA: "",
          capilaridade: "",
          gamaNat: "18.0",
          gamaSat: "18.0",
          Ko: "",
          impermeavel: false,
          compressivel: false,
        },
      ],
    },
    camadaArgila: {
      espessura: 15.0,
      gamaNat: 17.0,
      gamaSat: 17.0,
      profundidadeNA: null,
      Cc: 0.85,
      Cr: 0.10,
      Cv: 1.2,
      e0: 1.2,
    },
    camadaBase: {
      drenante: true,
    },
    camadasAterroPassado: [
      {
        nome: "Aterro Antigo",
        espessura: 5.0, // Passado tinha muito mais sobrecarga
        gamaNat: 20.0,
        gamaSat: 20.0,
      },
    ],
    camadasAterroPresente: [
      {
        nome: "Areia Grossa",
        espessura: 1.0,
        gamaNat: 19.0,
        gamaSat: 19.0,
      },
      {
        nome: "Silte Arenoso",
        espessura: 1.5,
        gamaNat: 18.0,
        gamaSat: 18.0,
      },
    ],
    camadasAterroFuturo: [
      {
        nome: "Aterro Leve",
        espessura: 2.0, // Futuro pequeno, não excede σ'vm
        gamaNat: 19.5,
        gamaSat: 19.5,
      },
    ],
    periodoInicial: "futuro",
  },
};

// ========== PRÉ-ADENSADAS σ'vf > σ'vm (2 exemplos) ==========

export const exemploRecalque5: ExemploRecalque = {
  nome: "Argila Pré-Adensada - σ'vf > σ'vm - Exemplo 1",
  descricao: "Argila pré-adensada onde o aterro futuro excede a tensão de pré-adensamento. Usa recompressão + compressão (Cr + Cc).",
  tipoAdensamento: "preAdensada",
  dados: {
    perfil: {
      profundidadeNA: "-3.0", // NA 3m abaixo da argila
      alturaCapilar: "0.0",
      pesoEspecificoAgua: "10.0",
      camadas: [
        {
          nome: "Areia Fina Média",
          espessura: "4.0",
          profundidadeNA: "",
          capilaridade: "",
          gamaNat: "17.5",
          gamaSat: "17.5",
          Ko: "",
          impermeavel: false,
          compressivel: false,
        },
      ],
    },
    camadaArgila: {
      espessura: 6.0,
      gamaNat: 14.0,
      gamaSat: 14.0,
      profundidadeNA: null,
      Cc: 1.5,
      Cr: 0.18,
      Cv: 0.5,
      e0: 2.2,
    },
    camadaBase: {
      drenante: true,
    },
    camadasAterroPassado: [
      {
        nome: "Aterro Histórico",
        espessura: 7.0, // Passado com muita sobrecarga
        gamaNat: 19.5,
        gamaSat: 19.5,
      },
    ],
    camadasAterroPresente: [
      {
        nome: "Areia Fina Média",
        espessura: 4.0, // Presente com menos sobrecarga (remoção)
        gamaNat: 17.5,
        gamaSat: 17.5,
      },
    ],
    camadasAterroFuturo: [
      {
        nome: "Aterro Pesado",
        espessura: 6.0, // Futuro grande que excede σ'vm
        gamaNat: 20.5,
        gamaSat: 20.5,
      },
    ],
    periodoInicial: "presente",
  },
};

export const exemploRecalque6: ExemploRecalque = {
  nome: "Argila Pré-Adensada - σ'vf > σ'vm - Exemplo 2",
  descricao: "Argila pré-adensada com aterro pesado futuro que ultrapassa σ'vm. Recompressão até σ'vm, depois compressão virgem.",
  tipoAdensamento: "preAdensada",
  dados: {
    perfil: {
      profundidadeNA: "1.5", // NA 1.5m acima da argila
      alturaCapilar: "0.0",
      pesoEspecificoAgua: "10.0",
      camadas: [
        {
          nome: "Areia Compacta",
          espessura: "3.5",
          profundidadeNA: "",
          capilaridade: "",
          gamaNat: "19.5",
          gamaSat: "19.5",
          Ko: "",
          impermeavel: false,
          compressivel: false,
        },
      ],
    },
    camadaArgila: {
      espessura: 10.0,
      gamaNat: 18.5,
      gamaSat: 18.5,
      profundidadeNA: null,
      Cc: 0.35,
      Cr: 0.05,
      Cv: 3.5,
      e0: 0.65,
    },
    camadaBase: {
      drenante: true,
    },
    camadasAterroPassado: [
      {
        nome: "Aterro Antigo (Erodido)",
        espessura: 8.0, // Passado com grande sobrecarga (reduzido para facilitar σ'vf > σ'vm)
        gamaNat: 20.0,
        gamaSat: 20.0,
      },
    ],
    camadasAterroPresente: [
      {
        nome: "Areia Compacta",
        espessura: 3.0, // Presente com remoção (erosão)
        gamaNat: 19.5,
        gamaSat: 19.5,
      },
    ],
    camadasAterroFuturo: [
      {
        nome: "Aterro Rodoviário",
        espessura: 7.5, // Futuro grande que excede σ'vm (passado 8m, presente 3m, futuro 3+7.5=10.5m garante σ'vf > σ'vm)
        gamaNat: 21.5,
        gamaSat: 21.5,
      },
    ],
    periodoInicial: "presente",
  },
};

export const exemplosRecalque: ExemploRecalque[] = [
  exemploRecalque1,
  exemploRecalque2,
  exemploRecalque3,
  exemploRecalque4,
  exemploRecalque5,
  exemploRecalque6,
];

