/**
 * Store — Classificação Granulométrica
 * modulos/granulometria/store.ts
 *
 * Zustand sem persistência (in-memory)
 */

import { create } from 'zustand';
import type { GranulometriaFormData } from './types';

const defaultFormData: GranulometriaFormData = {
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

interface GranulometriaState {
  formData: GranulometriaFormData;
  updateFormData: (data: Partial<GranulometriaFormData>) => void;
  clearFormData: () => void;
}

export const useGranulometriaStore = create<GranulometriaState>((set) => ({
  formData: { ...defaultFormData },
  updateFormData: (data) => set((state) => ({
    formData: { ...state.formData, ...data }
  })),
  clearFormData: () => set({ formData: { ...defaultFormData } }),
}));
