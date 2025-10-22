import { useState, useEffect } from 'react';

export interface SavedCalculation {
  id: string;
  moduleName: string;
  name: string;
  timestamp: string;
  formData: any;
  results: any;
}

interface SavedCalculationsStore {
  [moduleName: string]: SavedCalculation[];
}

const STORAGE_KEY = 'edusolo_calculations';

export function useSavedCalculations(moduleName: string) {
  const [calculations, setCalculations] = useState<SavedCalculation[]>([]);

  // Carregar cálculos do localStorage ao montar
  useEffect(() => {
    loadCalculations();
  }, [moduleName]);

  const loadCalculations = () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const allCalculations: SavedCalculationsStore = JSON.parse(stored);
        setCalculations(allCalculations[moduleName] || []);
      }
    } catch (error) {
      console.error('Erro ao carregar cálculos salvos:', error);
      setCalculations([]);
    }
  };

  const saveCalculation = (name: string, formData: any, results: any): boolean => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const allCalculations: SavedCalculationsStore = stored ? JSON.parse(stored) : {};
      
      if (!allCalculations[moduleName]) {
        allCalculations[moduleName] = [];
      }

      const newCalculation: SavedCalculation = {
        id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        moduleName,
        name,
        timestamp: new Date().toISOString(),
        formData,
        results,
      };

      allCalculations[moduleName].push(newCalculation);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(allCalculations));
      loadCalculations();
      return true;
    } catch (error) {
      console.error('Erro ao salvar cálculo:', error);
      return false;
    }
  };

  const deleteCalculation = (id: string): boolean => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return false;

      const allCalculations: SavedCalculationsStore = JSON.parse(stored);
      
      if (allCalculations[moduleName]) {
        allCalculations[moduleName] = allCalculations[moduleName].filter(
          (calc) => calc.id !== id
        );
        localStorage.setItem(STORAGE_KEY, JSON.stringify(allCalculations));
        loadCalculations();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Erro ao excluir cálculo:', error);
      return false;
    }
  };

  const renameCalculation = (id: string, newName: string): boolean => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return false;

      const allCalculations: SavedCalculationsStore = JSON.parse(stored);
      
      if (allCalculations[moduleName]) {
        const calcIndex = allCalculations[moduleName].findIndex((calc) => calc.id === id);
        if (calcIndex !== -1) {
          allCalculations[moduleName][calcIndex].name = newName;
          localStorage.setItem(STORAGE_KEY, JSON.stringify(allCalculations));
          loadCalculations();
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error('Erro ao renomear cálculo:', error);
      return false;
    }
  };

  const getCalculation = (id: string): SavedCalculation | null => {
    return calculations.find((calc) => calc.id === id) || null;
  };

  const clearAllCalculations = (): boolean => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return true;

      const allCalculations: SavedCalculationsStore = JSON.parse(stored);
      delete allCalculations[moduleName];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(allCalculations));
      loadCalculations();
      return true;
    } catch (error) {
      console.error('Erro ao limpar cálculos:', error);
      return false;
    }
  };

  return {
    calculations,
    saveCalculation,
    deleteCalculation,
    renameCalculation,
    getCalculation,
    clearAllCalculations,
    refresh: loadCalculations,
  };
}

