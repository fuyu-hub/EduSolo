import { AppSettings } from "@/contexts/SettingsContext";

/**
 * Formata um número de acordo com as configurações do usuário
 */
export function formatNumber(
  value: number | string | null | undefined,
  settings: AppSettings
): string {
  // Tratar valores nulos ou undefined
  if (value === null || value === undefined || value === "") {
    return "-";
  }

  // Converter para número se necessário
  const numValue = typeof value === "string" ? parseFloat(value) : value;

  // Verificar se é um número válido
  if (isNaN(numValue)) {
    return "-";
  }

  // Aplicar notação científica se necessário
  if (settings.scientificNotation) {
    const absValue = Math.abs(numValue);
    // Usar notação científica para valores muito grandes ou muito pequenos
    if (absValue !== 0 && (absValue < 0.001 || absValue >= 1000000)) {
      return numValue.toExponential(settings.decimalPlaces);
    }
  }

  // Formatar com casas decimais
  return numValue.toFixed(settings.decimalPlaces);
}

/**
 * Formata um array de números
 */
export function formatNumbers(
  values: (number | string | null | undefined)[],
  settings: AppSettings
): string[] {
  return values.map((value) => formatNumber(value, settings));
}

/**
 * Formata um número para exibição em tabelas com unidade
 */
export function formatNumberWithUnit(
  value: number | string | null | undefined,
  unit: string,
  settings: AppSettings
): string {
  const formatted = formatNumber(value, settings);
  if (formatted === "-") {
    return "-";
  }
  return `${formatted} ${unit}`;
}

/**
 * Formata percentual
 */
export function formatPercentage(
  value: number | string | null | undefined,
  settings: AppSettings
): string {
  const formatted = formatNumber(value, settings);
  if (formatted === "-") {
    return "-";
  }
  return `${formatted}%`;
}

/**
 * Hook para usar formatação de números
 */
export function useNumberFormatter(settings: AppSettings) {
  return {
    format: (value: number | string | null | undefined) => formatNumber(value, settings),
    formatWithUnit: (value: number | string | null | undefined, unit: string) =>
      formatNumberWithUnit(value, unit, settings),
    formatPercentage: (value: number | string | null | undefined) =>
      formatPercentage(value, settings),
    formatArray: (values: (number | string | null | undefined)[]) =>
      formatNumbers(values, settings),
  };
}

