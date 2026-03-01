import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface GranulometriaTesteFormData {
    pedregulho: string;
    areia_grossa: string;
    areia_media: string;
    areia_fina: string;
    silte: string;
    argila: string;
    // Parâmetros de Caracterização
    pass_p10: string;
    pass_p40: string;
    pass_p200: string;
    d10: string;
    d30: string;
    d60: string;
    ll: string;
    lp: string;
}

const defaultFormData: GranulometriaTesteFormData = {
    pedregulho: "",
    areia_grossa: "",
    areia_media: "",
    areia_fina: "",
    silte: "",
    argila: "",
    pass_p10: "",
    pass_p40: "",
    pass_p200: "",
    d10: "",
    d30: "",
    d60: "",
    ll: "",
    lp: "",
};

interface GranulometriaTesteState {
    formData: GranulometriaTesteFormData;
    updateFormData: (data: Partial<GranulometriaTesteFormData>) => void;
    clearFormData: () => void;
}

export const useGranulometriaTesteStore = create<GranulometriaTesteState>()(
    persist(
        (set) => ({
            formData: { ...defaultFormData },
            updateFormData: (data) => set((state) => ({
                formData: { ...state.formData, ...data }
            })),
            clearFormData: () => set({ formData: { ...defaultFormData } })
        }),
        {
            name: 'granulometria-teste-storage',
        }
    )
);
