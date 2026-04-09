/**
 * Store — Tensões Geostáticas
 * modulos/tensoes-geostaticas/store.ts
 *
 * Zustand store in-memory (sem persistência). Gerencia camadas do perfil,
 * configurações globais (γw, q₀, discretização) e resultado do cálculo.
 * O cálculo em si é delegado à pagina via `useAutoCalculo` —
 * o store é um puro state container.
 */
import { create } from "zustand";
import { CamadaSolo, ConfiguracoesGerais, TensoesGeostaticasOutput } from "./types";

interface TensoesStore {
  camadas: CamadaSolo[];
  configuracoes: ConfiguracoesGerais;
  resultado: TensoesGeostaticasOutput | null;
  isCalculating: boolean;

  // Actions — estado
  addCamada: (camada: Partial<CamadaSolo>) => void;
  removeCamada: (index: number) => void;
  updateCamada: (index: number, data: Partial<CamadaSolo>) => void;
  updateConfiguracoes: (data: Partial<ConfiguracoesGerais>) => void;
  setResultado: (resultado: TensoesGeostaticasOutput | null) => void;
  setCalculating: (v: boolean) => void;
  carregarExemplo: (camadas: CamadaSolo[], config: ConfiguracoesGerais) => void;
  reset: () => void;
}

const defaultCamada: CamadaSolo = {
  espessura: 2.0,
  gamaNat: 17.0,
  gamaSat: 18.0,
  Ko: 0.5,
  impermeavel: false,
  profundidadeNA: null,
  capilaridade: null,
};

const defaultConfig: ConfiguracoesGerais = {
  pesoEspecificoAgua: 10.0,
  sobrecargaSuperficial: 0.0,
  intervaloDiscretizacao: 0.0,
};

export const useTensoesStore = create<TensoesStore>((set) => ({
  camadas: [],
  configuracoes: { ...defaultConfig },
  resultado: null,
  isCalculating: false,

  addCamada: (camadaData) => {
    set((state) => {
      const novaId = state.camadas.length + 1;
      return {
        camadas: [...state.camadas, { ...defaultCamada, nome: `Camada ${novaId}`, ...camadaData }],
      };
    });
  },

  removeCamada: (index) => {
    set((state) => ({
      camadas: state.camadas.filter((_, i) => i !== index),
    }));
  },

  updateCamada: (index, data) => {
    set((state) => {
      const newCamadas = [...state.camadas];
      newCamadas[index] = { ...newCamadas[index], ...data };
      return { camadas: newCamadas };
    });
  },

  updateConfiguracoes: (data) => {
    set((state) => ({
      configuracoes: { ...state.configuracoes, ...data },
    }));
  },

  setResultado: (resultado) => set({ resultado }),

  setCalculating: (v) => set({ isCalculating: v }),

  carregarExemplo: (camadas, configuracoes) => {
    set({ camadas, configuracoes });
  },

  reset: () => {
    set({
      camadas: [],
      configuracoes: { ...defaultConfig },
      resultado: null,
    });
  },
}));
