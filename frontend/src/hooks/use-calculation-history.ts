/**
 * Hook para gerenciar histórico de cálculos com undo/redo
 * Integra o store de undo/redo com formulários de cálculo
 */

import { useCallback, useEffect } from 'react';
import { useFormHistoryStore } from '@/stores/undoRedoStore';

export const useCalculationHistory = <T extends Record<string, any>>(
  currentData: T,
  enabled: boolean = true
) => {
  const { set, undo, redo, canUndo, canRedo, present, clear } =
    useFormHistoryStore();

  // Atualizar histórico quando dados mudarem
  useEffect(() => {
    if (enabled && currentData) {
      // Debounce para não adicionar ao histórico a cada tecla
      const timer = setTimeout(() => {
        set(currentData);
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [currentData, enabled, set]);

  // Função para aplicar estado do histórico
  const applyHistoryState = useCallback(() => {
    return present as T | null;
  }, [present]);

  // Atalhos de teclado
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+Z ou Cmd+Z para undo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        if (canUndo()) {
          undo();
        }
      }

      // Ctrl+Shift+Z ou Cmd+Shift+Z para redo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && e.shiftKey) {
        e.preventDefault();
        if (canRedo()) {
          redo();
        }
      }

      // Ctrl+Y ou Cmd+Y para redo (alternativo)
      if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        e.preventDefault();
        if (canRedo()) {
          redo();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enabled, undo, redo, canUndo, canRedo]);

  return {
    undo,
    redo,
    canUndo: canUndo(),
    canRedo: canRedo(),
    historyState: applyHistoryState(),
    clear,
  };
};

