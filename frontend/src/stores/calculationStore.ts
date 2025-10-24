/**
 * Store Zustand para gerenciar cálculos recentes e estado global
 * Implementa cache local, histórico e persistência
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

// Tipos
export interface CalculationResult {
  id: string;
  type: string;
  moduleName: string;
  timestamp: number;
  inputs: Record<string, any>;
  outputs: Record<string, any>;
  title?: string;
  favorite?: boolean;
}

interface CalculationState {
  // Estado
  recentCalculations: CalculationResult[];
  favoriteCalculations: CalculationResult[];
  maxRecentItems: number;
  
  // Ações
  addCalculation: (calculation: Omit<CalculationResult, 'id' | 'timestamp'>) => void;
  removeCalculation: (id: string) => void;
  toggleFavorite: (id: string) => void;
  clearRecent: () => void;
  clearFavorites: () => void;
  getCalculationById: (id: string) => CalculationResult | undefined;
  getCalculationsByModule: (moduleName: string) => CalculationResult[];
}

export const useCalculationStore = create<CalculationState>()(
  persist(
    immer((set, get) => ({
      // Estado inicial
      recentCalculations: [],
      favoriteCalculations: [],
      maxRecentItems: 50,

      // Adicionar novo cálculo
      addCalculation: (calculation) => {
        set((state) => {
          const newCalculation: CalculationResult = {
            ...calculation,
            id: `calc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            timestamp: Date.now(),
          };

          // Adicionar aos recentes (no início)
          state.recentCalculations.unshift(newCalculation);

          // Limitar número de itens recentes
          if (state.recentCalculations.length > state.maxRecentItems) {
            state.recentCalculations = state.recentCalculations.slice(
              0,
              state.maxRecentItems
            );
          }
        });
      },

      // Remover cálculo
      removeCalculation: (id) => {
        set((state) => {
          state.recentCalculations = state.recentCalculations.filter(
            (calc) => calc.id !== id
          );
          state.favoriteCalculations = state.favoriteCalculations.filter(
            (calc) => calc.id !== id
          );
        });
      },

      // Toggle favorito
      toggleFavorite: (id) => {
        set((state) => {
          // Buscar cálculo em recentes
          const calculation = state.recentCalculations.find((c) => c.id === id);
          
          if (calculation) {
            const isFavorited = state.favoriteCalculations.some((c) => c.id === id);
            
            if (isFavorited) {
              // Remover dos favoritos
              state.favoriteCalculations = state.favoriteCalculations.filter(
                (c) => c.id !== id
              );
              calculation.favorite = false;
            } else {
              // Adicionar aos favoritos
              state.favoriteCalculations.push({ ...calculation, favorite: true });
              calculation.favorite = true;
            }
          }
        });
      },

      // Limpar cálculos recentes
      clearRecent: () => {
        set((state) => {
          state.recentCalculations = [];
        });
      },

      // Limpar favoritos
      clearFavorites: () => {
        set((state) => {
          state.favoriteCalculations = [];
          // Atualizar flag favorite nos recentes
          state.recentCalculations.forEach((calc) => {
            calc.favorite = false;
          });
        });
      },

      // Buscar cálculo por ID
      getCalculationById: (id) => {
        const state = get();
        return (
          state.recentCalculations.find((c) => c.id === id) ||
          state.favoriteCalculations.find((c) => c.id === id)
        );
      },

      // Buscar cálculos por módulo
      getCalculationsByModule: (moduleName) => {
        const state = get();
        return state.recentCalculations.filter(
          (calc) => calc.moduleName === moduleName
        );
      },
    })),
    {
      name: 'edusolo-calculations',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        recentCalculations: state.recentCalculations.slice(0, 20), // Salvar apenas 20
        favoriteCalculations: state.favoriteCalculations,
      }),
    }
  )
);

