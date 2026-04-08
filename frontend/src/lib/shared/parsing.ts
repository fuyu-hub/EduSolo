/**
 * Parsing utilities — funções para converter inputs do usuário em números.
 * Usadas em todos os módulos de cálculo do EduSolos.
 */

/**
 * Parse de string numérica que aceita vírgula como separador decimal.
 * Retorna NaN se o valor for inválido.
 * 
 * @example parseDecimal("2,65") → 2.65
 * @example parseDecimal("10.5") → 10.5
 * @example parseDecimal("") → NaN
 */
export function parseDecimal(val: string): number {
    return parseFloat(val.replace(',', '.'));
}

/**
 * Parse seguro: retorna `undefined` se o valor for vazio ou inválido.
 * Útil para campos opcionais.
 * 
 * @example parseOptional("2.65") → 2.65
 * @example parseOptional("") → undefined
 * @example parseOptional(undefined) → undefined
 */
export function parseOptional(val: string | undefined): number | undefined {
    if (!val || val.trim() === '') return undefined;
    const n = parseFloat(val.replace(',', '.'));
    return isNaN(n) ? undefined : n;
}

/**
 * Parse que retorna 0 se o valor for vazio ou inválido.
 * Útil para campos onde "vazio" = zero (ex: tara).
 * 
 * @example parseOrZero("10.5") → 10.5
 * @example parseOrZero("") → 0
 */
export function parseOrZero(val: string | undefined): number {
    if (!val || val.trim() === '') return 0;
    const n = parseFloat(val.replace(',', '.'));
    return isNaN(n) ? 0 : n;
}
