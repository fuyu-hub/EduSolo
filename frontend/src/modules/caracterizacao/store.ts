import { create } from 'zustand';
import { AmostraUnificada, CaracterizacaoSettings, CaracterizacaoOutput, LimitesInput } from './types';

// Função auxiliar para gerar IDs
const generateId = () => `${Date.now()}-${Math.floor(Math.random() * 1000000)}`;

interface CaracterizacaoState {
    // Estado Global
    labMode: boolean;
    setLabMode: (enabled: boolean) => void;

    // Configurações Globais (Gs, etc, aplicáveis a todas as amostras nesta versão simples)
    settings: CaracterizacaoSettings;
    updateSettings: (settings: Partial<CaracterizacaoSettings>) => void;

    // Limites de Consistência (Global, desconectado de amostras individuais)
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
    results: Record<string, CaracterizacaoOutput>; // Mapa de ID da amostra -> Resultado
    setResult: (id: string, result: CaracterizacaoOutput) => void;
    clearResults: () => void;

    resetAmostras: () => void;
}

export const useCaracterizacaoStore = create<CaracterizacaoState>((set) => ({
    labMode: false,
    setLabMode: (enabled) => set({ labMode: enabled }),

    settings: {
        Gs: "",
        pesoEspecificoAgua: "10.0",
        indice_vazios_max: "",
        indice_vazios_min: "",
    },
    updateSettings: (newSettings) => set((state) => ({
        settings: { ...state.settings, ...newSettings }
    })),

    limites: {
        pontosLL: [
            { id: generateId(), numGolpes: "", massaUmidaRecipiente: "", massaSecaRecipiente: "", massaRecipiente: "" },
            { id: generateId(), numGolpes: "", massaUmidaRecipiente: "", massaSecaRecipiente: "", massaRecipiente: "" },
            { id: generateId(), numGolpes: "", massaUmidaRecipiente: "", massaSecaRecipiente: "", massaRecipiente: "" },
            { id: generateId(), numGolpes: "", massaUmidaRecipiente: "", massaSecaRecipiente: "", massaRecipiente: "" },
            { id: generateId(), numGolpes: "", massaUmidaRecipiente: "", massaSecaRecipiente: "", massaRecipiente: "" }
        ],
        pontosLP: [
            { id: generateId(), massaUmidaRecipiente: "", massaSecaRecipiente: "", massaRecipiente: "" },
            { id: generateId(), massaUmidaRecipiente: "", massaSecaRecipiente: "", massaRecipiente: "" },
            { id: generateId(), massaUmidaRecipiente: "", massaSecaRecipiente: "", massaRecipiente: "" }
        ],
    },
    updateLimites: (data) => set((state) => ({
        limites: { ...state.limites, ...data }
    })),

    amostras: [{
        id: generateId(),
        nome: "Amostra 1",
        indices: { massaUmida: "", massaSeca: "", volume: "" },
    }],
    currentAmostraIndex: 0,

    addAmostra: () => set((state) => {
        if (state.amostras.length >= 3) return state;
        const newAmostra: AmostraUnificada = {
            id: generateId(),
            nome: `Amostra ${state.amostras.length + 1}`,
            indices: { massaUmida: "", massaSeca: "", volume: "" },
        };
        return {
            amostras: [...state.amostras, newAmostra],
            currentAmostraIndex: state.amostras.length
        };
    }),

    removeAmostra: (index) => set((state) => {
        if (state.amostras.length <= 1) return state; // Não remover a última
        const filteredAmostras = state.amostras.filter((_, i) => i !== index);

        // Renomear sequencialmente
        const newAmostras = filteredAmostras.map((amostra, i) => ({
            ...amostra,
            nome: `Amostra ${i + 1}`
        }));

        const newIndex = index >= newAmostras.length ? newAmostras.length - 1 : index;
        return {
            amostras: newAmostras,
            currentAmostraIndex: newIndex
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

    resetAmostras: () => set((state) => ({
        amostras: [{
            id: generateId(),
            nome: "Amostra 1",
            indices: { massaUmida: "", massaSeca: "", volume: "" },
        }],
        currentAmostraIndex: 0
    }))
}));
