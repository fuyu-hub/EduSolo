export interface ExemploCaracterizacao {
    nome: string;
    descricao: string;
    numAmostras: number;
    indices: {
        massaUmida: string;
        massaSeca: string;
        volume: string;
    };
    settings: {
        Gs: string;
        pesoEspecificoAgua: string;
    };
    limites: {
        pontosLL: {
            numGolpes: string;
            massaUmidaRecipiente: string;
            massaSecaRecipiente: string;
            massaRecipiente: string;
        }[];
        pontosLP: {
            massaUmidaRecipiente: string;
            massaSecaRecipiente: string;
            massaRecipiente: string;
        }[];
        umidadeNatural: string;
        percentualArgila: string;
    };
}

export const exemplosCaracterizacao: ExemploCaracterizacao[] = [
    {
        nome: "Argila Mole Alta Plasticidade",
        descricao: "Solo argiloso típico de regiões litorâneas, com alta plasticidade (CH) e consistência muito mole.",
        numAmostras: 1,
        indices: { massaUmida: "180.5", massaSeca: "150.2", volume: "100" },
        settings: { Gs: "2.70", pesoEspecificoAgua: "10.0" },
        limites: {
            pontosLL: [
                { numGolpes: "38", massaUmidaRecipiente: "28.1", massaSecaRecipiente: "21.9", massaRecipiente: "10.0" },
                { numGolpes: "29", massaUmidaRecipiente: "30.5", massaSecaRecipiente: "23.2", massaRecipiente: "10.0" },
                { numGolpes: "22", massaUmidaRecipiente: "33.2", massaSecaRecipiente: "24.7", massaRecipiente: "10.0" },
                { numGolpes: "15", massaUmidaRecipiente: "36.8", massaSecaRecipiente: "26.4", massaRecipiente: "10.0" },
                { numGolpes: "10", massaUmidaRecipiente: "39.5", massaSecaRecipiente: "27.8", massaRecipiente: "10.0" },
            ],
            pontosLP: [
                { massaUmidaRecipiente: "15.2", massaSecaRecipiente: "13.8", massaRecipiente: "5.0" },
                { massaUmidaRecipiente: "16.0", massaSecaRecipiente: "14.5", massaRecipiente: "5.0" },
                { massaUmidaRecipiente: "14.8", massaSecaRecipiente: "13.5", massaRecipiente: "5.0" },
                { massaUmidaRecipiente: "15.5", massaSecaRecipiente: "14.1", massaRecipiente: "5.0" }
            ],
            umidadeNatural: "25.2",
            percentualArgila: "55",
        }
    },
    {
        nome: "Areia Argilosa Pouco Plástica",
        descricao: "Solo predominantemente arenoso com presença de finos argilosos (SC), baixa plasticidade.",
        numAmostras: 1,
        indices: { massaUmida: "195.0", massaSeca: "175.0", volume: "100" },
        settings: { Gs: "2.65", pesoEspecificoAgua: "10.0" },
        limites: {
            pontosLL: [
                { numGolpes: "35", massaUmidaRecipiente: "24.5", massaSecaRecipiente: "22.0", massaRecipiente: "10.0" },
                { numGolpes: "28", massaUmidaRecipiente: "25.2", massaSecaRecipiente: "22.3", massaRecipiente: "10.0" },
                { numGolpes: "23", massaUmidaRecipiente: "26.0", massaSecaRecipiente: "22.6", massaRecipiente: "10.0" },
                { numGolpes: "17", massaUmidaRecipiente: "27.1", massaSecaRecipiente: "23.0", massaRecipiente: "10.0" },
                { numGolpes: "12", massaUmidaRecipiente: "28.5", massaSecaRecipiente: "23.4", massaRecipiente: "10.0" },
            ],
            pontosLP: [
                { massaUmidaRecipiente: "14.8", massaSecaRecipiente: "13.9", massaRecipiente: "5.0" },
                { massaUmidaRecipiente: "15.2", massaSecaRecipiente: "14.2", massaRecipiente: "5.0" },
                { massaUmidaRecipiente: "14.5", massaSecaRecipiente: "13.6", massaRecipiente: "5.0" }
            ],
            umidadeNatural: "11.4",
            percentualArgila: "15",
        }
    },
    {
        nome: "Silte Argiloso Médio",
        descricao: "Solo siltoso com características intermediárias (ML/CL), plasticidade média.",
        numAmostras: 1,
        indices: { massaUmida: "185.0", massaSeca: "160.0", volume: "100" },
        settings: { Gs: "2.68", pesoEspecificoAgua: "10.0" },
        limites: {
            pontosLL: [
                { numGolpes: "33", massaUmidaRecipiente: "27.5", massaSecaRecipiente: "23.0", massaRecipiente: "10.0" },
                { numGolpes: "26", massaUmidaRecipiente: "28.8", massaSecaRecipiente: "23.8", massaRecipiente: "10.0" },
                { numGolpes: "21", massaUmidaRecipiente: "30.1", massaSecaRecipiente: "24.5", massaRecipiente: "10.0" },
                { numGolpes: "15", massaUmidaRecipiente: "32.2", massaSecaRecipiente: "25.4", massaRecipiente: "10.0" },
                { numGolpes: "9", massaUmidaRecipiente: "34.5", massaSecaRecipiente: "26.5", massaRecipiente: "10.0" },
            ],
            pontosLP: [
                { massaUmidaRecipiente: "16.5", massaSecaRecipiente: "15.0", massaRecipiente: "5.0" },
                { massaUmidaRecipiente: "17.0", massaSecaRecipiente: "15.4", massaRecipiente: "5.0" },
                { massaUmidaRecipiente: "15.8", massaSecaRecipiente: "14.4", massaRecipiente: "5.0" },
                { massaUmidaRecipiente: "16.2", massaSecaRecipiente: "14.8", massaRecipiente: "5.0" }
            ],
            umidadeNatural: "15.6",
            percentualArgila: "25",
        }
    },
    {
        nome: "Argila Rija Pré-Adensada",
        descricao: "Argila muito consistente e densa, com alto peso específico seco.",
        numAmostras: 1,
        indices: { massaUmida: "210.0", massaSeca: "185.0", volume: "100" },
        settings: { Gs: "2.75", pesoEspecificoAgua: "10.0" },
        limites: {
            pontosLL: [
                { numGolpes: "40", massaUmidaRecipiente: "38.5", massaSecaRecipiente: "30.2", massaRecipiente: "10.0" },
                { numGolpes: "32", massaUmidaRecipiente: "40.2", massaSecaRecipiente: "31.0", massaRecipiente: "10.0" },
                { numGolpes: "25", massaUmidaRecipiente: "42.0", massaSecaRecipiente: "31.8", massaRecipiente: "10.0" },
                { numGolpes: "18", massaUmidaRecipiente: "44.5", massaSecaRecipiente: "32.9", massaRecipiente: "10.0" },
                { numGolpes: "11", massaUmidaRecipiente: "47.8", massaSecaRecipiente: "34.1", massaRecipiente: "10.0" },
            ],
            pontosLP: [
                { massaUmidaRecipiente: "20.5", massaSecaRecipiente: "18.2", massaRecipiente: "5.0" },
                { massaUmidaRecipiente: "21.0", massaSecaRecipiente: "18.6", massaRecipiente: "5.0" },
                { massaUmidaRecipiente: "19.8", massaSecaRecipiente: "17.6", massaRecipiente: "5.0" }
            ],
            umidadeNatural: "13.5",
            percentualArgila: "60",
        }
    },
    {
        nome: "Solo Orgânico Mole",
        descricao: "Solo com presença de matéria orgânica, alta compressibilidade e baixa densidade.",
        numAmostras: 1,
        indices: { massaUmida: "155.0", massaSeca: "105.0", volume: "100" },
        settings: { Gs: "2.40", pesoEspecificoAgua: "10.0" },
        limites: {
            pontosLL: [
                { numGolpes: "34", massaUmidaRecipiente: "52.0", massaSecaRecipiente: "31.0", massaRecipiente: "10.0" },
                { numGolpes: "27", massaUmidaRecipiente: "55.0", massaSecaRecipiente: "32.0", massaRecipiente: "10.0" },
                { numGolpes: "22", massaUmidaRecipiente: "58.0", massaSecaRecipiente: "33.0", massaRecipiente: "10.0" },
                { numGolpes: "16", massaUmidaRecipiente: "62.0", massaSecaRecipiente: "34.5", massaRecipiente: "10.0" },
                { numGolpes: "10", massaUmidaRecipiente: "67.0", massaSecaRecipiente: "36.0", massaRecipiente: "10.0" },
            ],
            pontosLP: [
                { massaUmidaRecipiente: "15.2", massaSecaRecipiente: "13.8", massaRecipiente: "5.0" },
                { massaUmidaRecipiente: "15.0", massaSecaRecipiente: "13.7", massaRecipiente: "5.0" },
                { massaUmidaRecipiente: "15.5", massaSecaRecipiente: "14.1", massaRecipiente: "5.0" }
            ],
            umidadeNatural: "47.6",
            percentualArgila: "20",
        }
    }
];
