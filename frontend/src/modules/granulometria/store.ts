import { create } from 'zustand';

export interface PeneiraDado {
    abertura: string;
    massaRetida: string;
    peneira?: string;
}

export interface PeneiramentoGrossoData {
    massa_total_umida: string;
    massa_total_seca: string;
    teor_umidade: string;
    massa_graos: string;
    peneiras: PeneiraDado[];
}

export interface PeneiramentoFinoData {
    massa_total_umida: string;
    massa_total_seca: string;
    teor_umidade: string;
    peneiras: PeneiraDado[];
}

export interface GranulometriaFormData {
    peneiramento_grosso: PeneiramentoGrossoData;
    peneiramento_fino: PeneiramentoFinoData;
    limitePercent: string;
    limitePlasticidade: string;
}

interface GranulometriaState {
    formData: GranulometriaFormData;
    updateFormData: (data: Partial<GranulometriaFormData>) => void;
    updatePeneiraGrosso: (index: number, data: Partial<PeneiraDado>) => void;
    updatePeneiraFino: (index: number, data: Partial<PeneiraDado>) => void;
    updateGrossoData: (data: Partial<PeneiramentoGrossoData>) => void;
    updateFinoData: (data: Partial<PeneiramentoFinoData>) => void;
    resetForm: () => void;
}

const defaultPeneirasGrosso: PeneiraDado[] = [
    { abertura: "50.0", massaRetida: "", peneira: '2"' },
    { abertura: "38.0", massaRetida: "", peneira: '1 1/2"' },
    { abertura: "25.0", massaRetida: "", peneira: '1"' },
    { abertura: "19.0", massaRetida: "", peneira: '3/4"' },
    { abertura: "9.5", massaRetida: "", peneira: '3/8"' },
    { abertura: "4.8", massaRetida: "", peneira: 'Nº 4' },
    { abertura: "2.0", massaRetida: "", peneira: 'Nº 10' },
];

const defaultPeneirasFino: PeneiraDado[] = [
    { abertura: "1.2", massaRetida: "", peneira: 'Nº 16' },
    { abertura: "0.6", massaRetida: "", peneira: 'Nº 30' },
    { abertura: "0.42", massaRetida: "", peneira: 'Nº 40' },
    { abertura: "0.25", massaRetida: "", peneira: 'Nº 60' },
    { abertura: "0.15", massaRetida: "", peneira: 'Nº 100' },
    { abertura: "0.075", massaRetida: "", peneira: 'Nº 200' },
];

const defaultFormData: GranulometriaFormData = {
    peneiramento_grosso: {
        massa_total_umida: "",
        massa_total_seca: "",
        teor_umidade: "",
        massa_graos: "",
        peneiras: JSON.parse(JSON.stringify(defaultPeneirasGrosso)),
    },
    peneiramento_fino: {
        massa_total_umida: "",
        massa_total_seca: "",
        teor_umidade: "",
        peneiras: JSON.parse(JSON.stringify(defaultPeneirasFino)),
    },
    limitePercent: "",
    limitePlasticidade: "",
};

export const useGranulometriaStore = create<GranulometriaState>((set) => ({
    formData: JSON.parse(JSON.stringify(defaultFormData)),

    updateFormData: (data) => set((state) => ({
        formData: { ...state.formData, ...data }
    })),

    updatePeneiraGrosso: (index, data) => set((state) => {
        const newPeneiras = [...state.formData.peneiramento_grosso.peneiras];
        newPeneiras[index] = { ...newPeneiras[index], ...data };
        return {
            formData: {
                ...state.formData,
                peneiramento_grosso: {
                    ...state.formData.peneiramento_grosso,
                    peneiras: newPeneiras
                }
            }
        };
    }),

    updatePeneiraFino: (index, data) => set((state) => {
        const newPeneiras = [...state.formData.peneiramento_fino.peneiras];
        newPeneiras[index] = { ...newPeneiras[index], ...data };
        return {
            formData: {
                ...state.formData,
                peneiramento_fino: {
                    ...state.formData.peneiramento_fino,
                    peneiras: newPeneiras
                }
            }
        };
    }),

    updateGrossoData: (data) => set((state) => ({
        formData: {
            ...state.formData,
            peneiramento_grosso: {
                ...state.formData.peneiramento_grosso,
                ...data
            }
        }
    })),

    updateFinoData: (data) => set((state) => ({
        formData: {
            ...state.formData,
            peneiramento_fino: {
                ...state.formData.peneiramento_fino,
                ...data
            }
        }
    })),

    resetForm: () => set({
        formData: JSON.parse(JSON.stringify(defaultFormData))
    }),
}));
