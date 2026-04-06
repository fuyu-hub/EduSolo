/**
 * useAutoCalculo — Hook que encapsula o padrão de cálculo automático
 * com debounce, eliminando a repetição de useEffect + setTimeout + clearTimeout + useRef.
 *
 * Uso:
 *   useAutoCalculo(handleCalculate, [indices, settings, limites], 250);
 */
import { useEffect, useRef } from "react";

/**
 * @param calculoFn Função de cálculo a ser executada.
 * @param dependencias Array de dependências que disparam o recálculo.
 * @param debounceMs Tempo de debounce em ms (default: 250). Use 0 para cálculo imediato.
 */
export function useAutoCalculo(
  calculoFn: () => void,
  dependencias: React.DependencyList,
  debounceMs: number = 250
): void {
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(calculoFn, debounceMs);
    return () => clearTimeout(timerRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dependencias);
}
