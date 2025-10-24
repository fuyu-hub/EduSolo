/**
 * Hook otimizado para callbacks que evita re-criações desnecessárias
 * Similar ao useCallback mas com melhor ergonomia
 */

import { useCallback, useRef, useLayoutEffect } from 'react';

/**
 * useEventCallback - Mantém referência estável mas sempre chama a versão mais recente
 * Útil para event handlers que precisam de closure sobre valores atuais
 */
export function useEventCallback<T extends (...args: any[]) => any>(
  callback: T
): T {
  const ref = useRef<T>(callback);

  // Atualizar ref com a versão mais recente
  useLayoutEffect(() => {
    ref.current = callback;
  });

  // Retornar função estável
  return useCallback(
    ((...args: Parameters<T>) => {
      const fn = ref.current;
      return fn(...args);
    }) as T,
    []
  );
}

/**
 * useThrottledCallback - Limita frequência de execução de um callback
 */
export function useThrottledCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number = 100
): T {
  const lastRan = useRef<number>(Date.now());
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  return useCallback(
    ((...args: Parameters<T>) => {
      const now = Date.now();

      if (now - lastRan.current >= delay) {
        callback(...args);
        lastRan.current = now;
      } else {
        // Agendar para executar após delay
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }

        timeoutRef.current = setTimeout(() => {
          callback(...args);
          lastRan.current = Date.now();
        }, delay - (now - lastRan.current));
      }
    }) as T,
    [callback, delay]
  );
}

