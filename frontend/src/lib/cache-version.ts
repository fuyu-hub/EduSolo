/**
 * Cache Version Management
 * 
 * Sistema de versionamento para invalidar cache automaticamente
 * quando a versão do app muda, mantendo dados importantes do usuário.
 */

// Incrementar esta versão sempre que houver mudanças que exigem limpeza de cache
export const APP_CACHE_VERSION = "1.0.0";
const VERSION_KEY = "edusolo-cache-version";

interface CacheMigrationResult {
    wasUpdated: boolean;
    previousVersion: string | null;
    currentVersion: string;
    clearedKeys: string[];
}

/**
 * Verifica se a versão do app mudou e limpa caches voláteis se necessário.
 * Mantém dados importantes do usuário (relatórios, configurações, tema).
 * 
 * @returns Resultado da migração com informações sobre o que foi limpo
 */
export function checkAndMigrateCache(): CacheMigrationResult {
    const storedVersion = localStorage.getItem(VERSION_KEY);
    const result: CacheMigrationResult = {
        wasUpdated: false,
        previousVersion: storedVersion,
        currentVersion: APP_CACHE_VERSION,
        clearedKeys: [],
    };

    // Se a versão é diferente (ou não existe), limpar caches voláteis
    if (storedVersion !== APP_CACHE_VERSION) {
        result.wasUpdated = true;
        result.clearedKeys = clearVolatileCache();

        // Atualizar versão armazenada
        localStorage.setItem(VERSION_KEY, APP_CACHE_VERSION);
    }

    return result;
}

/**
 * Limpa apenas os caches voláteis que podem causar problemas com código novo.
 * 
 * MANTÉM (dados do usuário):
 * - edusolo-theme (preferência de tema)
 * - edusolo-settings (configurações)
 * - edusolo-calculations (cálculos salvos)
 * - edusolo-saved-calculations-* (cálculos por módulo)
 * - edusolorecentreports (relatórios recentes)
 * 
 * LIMPA (volátil/pode conflitar):
 * - tour-seen-* (status dos tutoriais)
 * - autosave-* (rascunhos de formulários)
 */
function clearVolatileCache(): string[] {
    const clearedKeys: string[] = [];
    const keysToRemove: string[] = [];

    // Identificar chaves voláteis para remover
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
            // Limpar flags de tutoriais (podem mudar entre versões)
            if (key.startsWith("tour-seen-")) {
                keysToRemove.push(key);
            }
            // Limpar autosaves de formulários (schemas podem mudar)
            if (key.startsWith("autosave-")) {
                keysToRemove.push(key);
            }
        }
    }

    // Remover as chaves identificadas
    keysToRemove.forEach(key => {
        localStorage.removeItem(key);
        clearedKeys.push(key);
    });

    return clearedKeys;
}

/**
 * Força limpeza completa do cache (usar apenas em debug/desenvolvimento)
 */
export function forceFullCacheClear(): void {
    localStorage.clear();
    localStorage.setItem(VERSION_KEY, APP_CACHE_VERSION);
}

/**
 * Obtém a versão atual do cache
 */
export function getCacheVersion(): string {
    return localStorage.getItem(VERSION_KEY) || "unknown";
}
