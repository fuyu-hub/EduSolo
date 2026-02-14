export interface ExemploGranulometriaTeste {
    nome: string;
    descricao: string;
    fracoes: {
        pedregulho: string;
        areia_grossa: string;
        areia_media: string;
        areia_fina: string;
        silte: string;
        argila: string;
    };
    parametros: {
        pass_p10: string;
        pass_p40: string;
        pass_p200: string;
        d10: string;
        d30: string;
        d60: string;
        ll: string;
        lp: string;
    };
    // Custom example metadata
    isCustom?: boolean;
    id?: string;
    iconName?: string;   // Lucide icon key
    colorName?: string;  // Color preset key
}

export const exemplosGranulometriaTeste: ExemploGranulometriaTeste[] = [
    {
        nome: "Areia Argilosa (SC)",
        descricao: "Areia vermelha com argila, alta plasticidade. IP acima da Linha A no diagrama de Casagrande.",
        fracoes: {
            pedregulho: "5",
            areia_grossa: "10",
            areia_media: "20",
            areia_fina: "25",
            silte: "15",
            argila: "25",
        },
        parametros: {
            pass_p10: "85",
            pass_p40: "65",
            pass_p200: "40",
            d10: "0.002",
            d30: "0.08",
            d60: "0.6",
            ll: "45",
            lp: "22",
        },
    },
    {
        nome: "Silte de Baixa Plasticidade (ML)",
        descricao: "Solo siltoso fino, não plástico. IP abaixo da Linha A com LL < 50.",
        fracoes: {
            pedregulho: "0",
            areia_grossa: "2",
            areia_media: "5",
            areia_fina: "8",
            silte: "60",
            argila: "25",
        },
        parametros: {
            pass_p10: "98",
            pass_p40: "93",
            pass_p200: "85",
            d10: "0.001",
            d30: "0.01",
            d60: "0.04",
            ll: "35",
            lp: "30",
        },
    },
    {
        nome: "Pedregulho Arenoso (GP)",
        descricao: "Material granular grosso, uniforme, sem plasticidade. Típico de cascalheira ou brita corrida.",
        fracoes: {
            pedregulho: "55",
            areia_grossa: "20",
            areia_media: "12",
            areia_fina: "8",
            silte: "3",
            argila: "2",
        },
        parametros: {
            pass_p10: "25",
            pass_p40: "13",
            pass_p200: "5",
            d10: "0.8",
            d30: "5.0",
            d60: "18.0",
            ll: "",
            lp: "",
        },
    },
];

// --- Custom Examples Management (localStorage) ---

const CUSTOM_EXAMPLES_KEY = "edusolo_custom_examples_granulometria_teste";

export function getCustomExamples(): ExemploGranulometriaTeste[] {
    try {
        const stored = localStorage.getItem(CUSTOM_EXAMPLES_KEY);
        if (!stored) return [];
        return JSON.parse(stored);
    } catch {
        return [];
    }
}

export function saveCustomExample(exemplo: ExemploGranulometriaTeste): void {
    const existing = getCustomExamples();
    const newExample: ExemploGranulometriaTeste = {
        ...exemplo,
        isCustom: true,
        id: `custom_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    };
    existing.push(newExample);
    localStorage.setItem(CUSTOM_EXAMPLES_KEY, JSON.stringify(existing));
}

export function updateCustomExample(id: string, updates: Partial<ExemploGranulometriaTeste>): void {
    const existing = getCustomExamples();
    const index = existing.findIndex(e => e.id === id);
    if (index === -1) return;
    existing[index] = { ...existing[index], ...updates };
    localStorage.setItem(CUSTOM_EXAMPLES_KEY, JSON.stringify(existing));
}

export function deleteCustomExample(id: string): void {
    const existing = getCustomExamples();
    const filtered = existing.filter(e => e.id !== id);
    localStorage.setItem(CUSTOM_EXAMPLES_KEY, JSON.stringify(filtered));
}
