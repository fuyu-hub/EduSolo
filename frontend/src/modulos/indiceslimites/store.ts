import { create } from 'zustand';
import { AmostraUnificada, CaracterizacaoSettings, CaracterizacaoOutput, LimitesInput } from './types';
import { generateId } from '@/lib/shared';

interface CaracterizacaoState {
    // Configurações Globais
    settings: CaracterizacaoSettings;
    updateSettings: (settings: Partial<CaracterizacaoSettings>) => void;

    // Limites de Consistência
    limites: LimitesInput;
    updateLimites: (data: Partial<LimitesInput>) => void;

    // Gerenciamento de Amostras
    amostras: AmostraUnificada[];
    currentAmostraIndex: number;
    addAmostra: () => void;
    removeAmostra: (index: number) => void;
    setCurrentAmostra: (index: number) => void;
    updateAmostra: (index: number, data: Partial<AmostraUnificada>) => void;
    updateIndices: (index: number, data: Partial<AmostraUnificada['indices']>) => void;

    // Resultados
    results: Record<string, CaracterizacaoOutput>;
    setResult: (id: string, result: CaracterizacaoOutput) => void;
    clearResults: () => void;

    resetAmostras: () => void;
}

const createDefaultLimites = (): LimitesInput => ({
    pontosLL: Array.from({ length: 5 }, () => ({
        id: generateId(), numGolpes: "", massaUmidaRecipiente: "",
        massaSecaRecipiente: "", massaRecipiente: "", umidade: ""
    })),
    pontosLP: Array.from({ length: 3 }, () => ({
        id: generateId(), massaUmidaRecipiente: "",
        massaSecaRecipiente: "", massaRecipiente: "", umidade: ""
    })),
});

const createDefaultAmostra = (nome: string = "Amostra 1"): AmostraUnificada => ({
    id: generateId(),
    nome,
    indices: { massaUmida: "", massaSeca: "", tara: "", volume: "" },
});

export const useIndicesLimitesStore = create<CaracterizacaoState>((set) => ({
    settings: {
        Gs: "",
        pesoEspecificoAgua: "10.0",
        indice_vazios_max: "",
        indice_vazios_min: "",
    },
    updateSettings: (newSettings) => set((state) => ({
        settings: { ...state.settings, ...newSettings }
    })),

    limites: createDefaultLimites(),
    updateLimites: (data) => set((state) => ({
        limites: { ...state.limites, ...data }
    })),

    amostras: [createDefaultAmostra()],
    currentAmostraIndex: 0,

    addAmostra: () => set((state) => {
        if (state.amostras.length >= 3) return state;
        return {
            amostras: [...state.amostras, createDefaultAmostra(`Amostra ${state.amostras.length + 1}`)],
            currentAmostraIndex: state.amostras.length
        };
    }),

    removeAmostra: (index) => set((state) => {
        if (state.amostras.length <= 1) return state;
        const newAmostras = state.amostras
            .filter((_, i) => i !== index)
            .map((a, i) => ({ ...a, nome: `Amostra ${i + 1}` }));
        return {
            amostras: newAmostras,
            currentAmostraIndex: Math.min(index, newAmostras.length - 1)
        };
    }),

    setCurrentAmostra: (index) => set({ currentAmostraIndex: index }),

    updateAmostra: (index, data) => set((state) => {
        const newAmostras = [...state.amostras];
        newAmostras[index] = { ...newAmostras[index], ...data };
        return { amostras: newAmostras };
    }),

    updateIndices: (index, data) => set((state) => {
        const newAmostras = [...state.amostras];
        newAmostras[index] = {
            ...newAmostras[index],
            indices: { ...newAmostras[index].indices, ...data }
        };
        return { amostras: newAmostras };
    }),

    results: {},
    setResult: (id, result) => set((state) => ({
        results: { ...state.results, [id]: result }
    })),
    clearResults: () => set({ results: {} }),

    resetAmostras: () => set({
        amostras: [createDefaultAmostra()],
        currentAmostraIndex: 0
    }),
}));
