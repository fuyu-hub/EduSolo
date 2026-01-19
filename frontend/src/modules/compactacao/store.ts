import { create } from 'zustand';

// Função auxiliar para gerar IDs
const generateId = () => `${Date.now()}-${Math.floor(Math.random() * 1000000)}`;

interface PontoCompactacao {
    id: string;
    pesoAmostaCilindro: string;
    pesoBrutoUmido: string;
    pesoBrutoSeco: string;
    tara: string;
}

interface CompactacaoFormData {
    volumeCilindro: string;
    pesoCilindro: string;
    Gs: string;
    pesoEspecificoAgua: string;
    pontos: PontoCompactacao[];
}

interface CompactacaoState {
    formData: CompactacaoFormData;
    updateFormData: (data: Partial<CompactacaoFormData>) => void;
    updatePonto: (index: number, data: Partial<PontoCompactacao>) => void;
    addPonto: () => void;
    removePonto: (index: number) => void;
    resetForm: () => void;
}

const defaultFormData: CompactacaoFormData = {
    volumeCilindro: "982",
    pesoCilindro: "4100",
    Gs: "",
    pesoEspecificoAgua: "10.0",
    pontos: [
        { id: generateId(), pesoAmostaCilindro: "", pesoBrutoUmido: "", pesoBrutoSeco: "", tara: "" },
        { id: generateId(), pesoAmostaCilindro: "", pesoBrutoUmido: "", pesoBrutoSeco: "", tara: "" },
        { id: generateId(), pesoAmostaCilindro: "", pesoBrutoUmido: "", pesoBrutoSeco: "", tara: "" },
    ],
};

export const useCompactacaoStore = create<CompactacaoState>((set) => ({
    formData: { ...defaultFormData },

    updateFormData: (data) => set((state) => ({
        formData: { ...state.formData, ...data }
    })),

    updatePonto: (index, data) => set((state) => {
        const newPontos = [...state.formData.pontos];
        newPontos[index] = { ...newPontos[index], ...data };
        return { formData: { ...state.formData, pontos: newPontos } };
    }),

    addPonto: () => set((state) => ({
        formData: {
            ...state.formData,
            pontos: [
                ...state.formData.pontos,
                { id: generateId(), pesoAmostaCilindro: "", pesoBrutoUmido: "", pesoBrutoSeco: "", tara: "" }
            ]
        }
    })),

    removePonto: (index) => set((state) => {
        if (state.formData.pontos.length <= 3) return state;
        const newPontos = state.formData.pontos.filter((_, i) => i !== index);
        return { formData: { ...state.formData, pontos: newPontos } };
    }),

    resetForm: () => set({
        formData: {
            ...defaultFormData,
            pontos: [
                { id: generateId(), pesoAmostaCilindro: "", pesoBrutoUmido: "", pesoBrutoSeco: "", tara: "" },
                { id: generateId(), pesoAmostaCilindro: "", pesoBrutoUmido: "", pesoBrutoSeco: "", tara: "" },
                { id: generateId(), pesoAmostaCilindro: "", pesoBrutoUmido: "", pesoBrutoSeco: "", tara: "" },
            ],
        }
    }),
}));
