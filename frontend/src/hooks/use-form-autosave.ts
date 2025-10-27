import { useEffect, useCallback, useState } from "react";
import { useDebounce } from "./use-debounce";

interface AutoSaveOptions<T> {
  key: string;
  data: T;
  enabled?: boolean;
  debounceMs?: number;
  excludeFields?: (keyof T)[];
}

/**
 * Hook para salvar automaticamente dados do formulário no localStorage
 * @param options - Opções de configuração
 * @returns Funções e estado para gerenciar auto-save
 */
export function useFormAutoSave<T extends Record<string, any>>({
  key,
  data,
  enabled = true,
  debounceMs = 1000,
  excludeFields = [],
}: AutoSaveOptions<T>) {
  // Estado reativo para saber se há dados salvos
  const [hasSavedData, setHasSavedData] = useState(() => {
    try {
      const saved = localStorage.getItem(`autosave-${key}`);
      return saved !== null && saved !== undefined && saved !== "null" && saved !== "{}";
    } catch {
      return false;
    }
  });

  // Debounce dos dados para não salvar a cada tecla
  const debouncedData = useDebounce(data, debounceMs);

  // Função auxiliar para verificar se há dados válidos
  const hasValidData = (obj: any): boolean => {
    if (obj === null || obj === undefined || obj === "") return false;
    
    if (Array.isArray(obj)) {
      return obj.some(item => hasValidData(item));
    }
    
    if (typeof obj === "object") {
      return Object.values(obj).some(value => hasValidData(value));
    }
    
    return true;
  };

  // Salvar no localStorage quando os dados mudarem
  useEffect(() => {
    if (!enabled || !debouncedData) return;

    try {
      // Filtrar campos excluídos
      const dataToSave = { ...debouncedData };
      excludeFields.forEach(field => {
        delete dataToSave[field];
      });

      // Verificar se há dados válidos para salvar (recursivo para arrays e objetos)
      if (hasValidData(dataToSave)) {
        // Salvar no localStorage
        localStorage.setItem(`autosave-${key}`, JSON.stringify(dataToSave));
        setHasSavedData(true);
        console.log(`[AutoSave] Dados salvos em autosave-${key}`); // Debug
        
        // Disparar evento customizado para notificar outros componentes
        window.dispatchEvent(new CustomEvent("local-storage-change", { 
          detail: { key: `autosave-${key}`, action: "set" } 
        }));
      } else {
        // Se não há dados válidos, limpar
        localStorage.removeItem(`autosave-${key}`);
        setHasSavedData(false);
        
        // Disparar evento customizado
        window.dispatchEvent(new CustomEvent("local-storage-change", { 
          detail: { key: `autosave-${key}`, action: "remove" } 
        }));
      }
    } catch (error) {
      console.error("Erro ao salvar formulário automaticamente:", error);
    }
  }, [debouncedData, enabled, key, excludeFields]);

  // Função para restaurar dados salvos
  const restoreData = useCallback((): T | null => {
    try {
      const saved = localStorage.getItem(`autosave-${key}`);
      if (saved) {
        const parsed = JSON.parse(saved) as T;
        console.log(`[AutoSave] Dados restaurados de autosave-${key}:`, parsed); // Debug
        return parsed;
      }
      console.log(`[AutoSave] Nenhum dado salvo encontrado em autosave-${key}`); // Debug
    } catch (error) {
      console.error("Erro ao restaurar dados do formulário:", error);
    }
    return null;
  }, [key]);

  // Função para limpar dados salvos
  const clearSavedData = useCallback(() => {
    try {
      localStorage.removeItem(`autosave-${key}`);
      setHasSavedData(false);
      console.log(`[AutoSave] Dados limpos de autosave-${key}`); // Debug
      
      // Disparar evento customizado
      window.dispatchEvent(new CustomEvent("local-storage-change", { 
        detail: { key: `autosave-${key}`, action: "remove" } 
      }));
    } catch (error) {
      console.error("Erro ao limpar dados salvos:", error);
    }
  }, [key]);

  return { restoreData, clearSavedData, hasSavedData };
}

/**
 * Hook simplificado para verificar se há dados salvos (REATIVO)
 */
export function useHasAutoSavedData(key: string): boolean {
  const [hasSaved, setHasSaved] = useState(() => {
    try {
      const saved = localStorage.getItem(`autosave-${key}`);
      return saved !== null && saved !== undefined && saved !== "null" && saved !== "{}";
    } catch {
      return false;
    }
  });

  // Verificar periodicamente se há dados salvos
  useEffect(() => {
    const checkSaved = () => {
      try {
        const saved = localStorage.getItem(`autosave-${key}`);
        const hasData = saved !== null && saved !== undefined && saved !== "null" && saved !== "{}";
        console.log(`[AutoSave] Verificação de dados salvos em autosave-${key}: ${hasData}`); // Debug
        setHasSaved(hasData);
      } catch {
        setHasSaved(false);
      }
    };

    // Verificar imediatamente
    checkSaved();

    // Verificar a cada 2 segundos
    const interval = setInterval(checkSaved, 2000);

    // Listener para mudanças no localStorage (em tempo real)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === `autosave-${key}`) {
        console.log(`[AutoSave] Storage event detectado para autosave-${key}`); // Debug
        checkSaved();
      }
    };

    // Listener customizado para mudanças na mesma aba
    const handleCustomStorageChange = (e: CustomEvent) => {
      if (e.detail.key === `autosave-${key}`) {
        console.log(`[AutoSave] Custom storage event detectado para autosave-${key}`); // Debug
        checkSaved();
      }
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("local-storage-change" as any, handleCustomStorageChange as any);

    return () => {
      clearInterval(interval);
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("local-storage-change" as any, handleCustomStorageChange as any);
    };
  }, [key]);

  return hasSaved;
}

