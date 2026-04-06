import { create } from 'zustand';
import { CaracterizacaoSettings, CaracterizacaoOutput, LimitesInput, IndicesFisicosInput } from './types';
import { generateId } from '@/lib/shared';

interface CaracterizacaoState {
    // Configurações Globais
    settings: CaracterizacaoSettings;
    updateSettings: (settings: Partial<CaracterizacaoSettings>) => void;

    // Limites de Consistência
    limites: LimitesInput;
    updateLimites: (data: Partial<LimitesInput>) => void;

    // Dados de índices físicos (amostra única)
    indices: IndicesFisicosInput;
    updateIndices: (data: Partial<IndicesFisicosInput>) => void;

    // Resultados
    result: CaracterizacaoOutput | null;
    setResult: (result: CaracterizacaoOutput | null) => void;

    // Reset
    reset: () => void;
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

const createDefaultIndices = (): IndicesFisicosInput => ({
    massaUmida: "", massaSeca: "", tara: "", volume: ""
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

    indices: createDefaultIndices(),
    updateIndices: (data) => set((state) => ({
        indices: { ...state.indices, ...data }
    })),

    result: null,
    setResult: (result) => set({ result }),

    reset: () => set({
        indices: createDefaultIndices(),
        limites: createDefaultLimites(),
        settings: {
            Gs: "",
            pesoEspecificoAgua: "10.0",
            indice_vazios_max: "",
            indice_vazios_min: "",
        },
        result: null,
    }),
}));
