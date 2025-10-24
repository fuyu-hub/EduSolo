/**
 * Store para implementar funcionalidade de Undo/Redo
 * Útil para formulários complexos onde o usuário pode desfazer/refazer alterações
 */

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

interface HistoryState<T> {
  past: T[];
  present: T | null;
  future: T[];
}

interface UndoRedoActions<T> {
  set: (newPresent: T) => void;
  undo: () => void;
  redo: () => void;
  clear: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
}

export type UndoRedoStore<T> = HistoryState<T> & UndoRedoActions<T>;

/**
 * Criar store de undo/redo para um tipo específico
 * Uso:
 * const useFormHistory = createUndoRedoStore<MyFormData>();
 */
export function createUndoRedoStore<T>(maxHistorySize: number = 50) {
  return create<UndoRedoStore<T>>()(
    immer((set, get) => ({
      past: [],
      present: null,
      future: [],

      // Definir novo estado
      set: (newPresent: T) => {
        set((state) => {
          if (state.present !== null) {
            // Adicionar estado atual ao histórico
            state.past.push(state.present);

            // Limitar tamanho do histórico
            if (state.past.length > maxHistorySize) {
              state.past.shift();
            }
          }

          state.present = newPresent;
          state.future = []; // Limpar futuro ao fazer nova ação
        });
      },

      // Desfazer
      undo: () => {
        set((state) => {
          if (state.past.length === 0) return;

          const previous = state.past[state.past.length - 1];
          const newPast = state.past.slice(0, state.past.length - 1);

          if (state.present !== null) {
            state.future.unshift(state.present);
          }

          state.past = newPast;
          state.present = previous;
        });
      },

      // Refazer
      redo: () => {
        set((state) => {
          if (state.future.length === 0) return;

          const next = state.future[0];
          const newFuture = state.future.slice(1);

          if (state.present !== null) {
            state.past.push(state.present);
          }

          state.future = newFuture;
          state.present = next;
        });
      },

      // Limpar histórico
      clear: () => {
        set((state) => {
          state.past = [];
          state.future = [];
        });
      },

      // Verificar se pode desfazer
      canUndo: () => {
        return get().past.length > 0;
      },

      // Verificar se pode refazer
      canRedo: () => {
        return get().future.length > 0;
      },
    }))
  );
}

// Exemplo de uso para formulários específicos
export interface FormData {
  [key: string]: any;
}

export const useFormHistoryStore = createUndoRedoStore<FormData>(30);

