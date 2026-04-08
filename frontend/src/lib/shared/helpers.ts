/**
 * Utilitários gerais reutilizáveis — IDs, formatação, etc.
 */

/**
 * Gera um ID único baseado em timestamp + random.
 * Usado para identificar pontos de ensaio, amostras, etc.
 */
export function generateId(): string {
    return `${Date.now()}-${Math.floor(Math.random() * 1000000)}`;
}

/**
 * Formata um número para exibição, tratando null/undefined/NaN.
 * Retorna "-" se o valor for inválido.
 */
export function formatValue(
    value: number | null | undefined,
    precision: number = 2,
    unit: string = ""
): string {
    if (value === undefined || value === null || isNaN(value) || !isFinite(value)) {
        return "-";
    }
    const formatted = value.toFixed(precision);
    return unit ? `${formatted} ${unit}` : formatted;
}

/**
 * Verifica se um valor numérico é válido (não null, undefined, NaN, Infinity).
 */
export function isValidNumber(value: number | null | undefined): value is number {
    return value !== undefined && value !== null && !isNaN(value) && isFinite(value);
}
