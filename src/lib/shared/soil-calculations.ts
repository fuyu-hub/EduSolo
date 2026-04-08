/**
 * Soil calculation utilities — funções de laboratório reutilizáveis.
 * Cálculos comuns de umidade, MBS inverso, etc.
 */

/**
 * Calcula teor de umidade (w%) a partir de massas brutas + tara.
 * w = ((MBU - MBS) / (MBS - Tara)) × 100
 * 
 * Retorna string formatada com 1 casa decimal, ou "" se inválido.
 */
export function calcularUmidade(mbu: string, mbs: string, tara: string): string {
    const mu = parseFloat(mbu.replace(',', '.'));
    const ms = parseFloat(mbs.replace(',', '.'));
    const t = parseFloat(tara.replace(',', '.'));
    if (isNaN(mu) || isNaN(ms) || isNaN(t) || ms <= t) return "";
    const massaAgua = mu - ms;
    const massaSolidos = ms - t;
    if (massaSolidos <= 0) return "";
    return ((massaAgua / massaSolidos) * 100).toFixed(1);
}

/**
 * Cálculo inverso: dado MBU, Tara e umidade desejada, recalcula MBS.
 * MBS = (MBU + w/100 × Tara) / (1 + w/100)
 * 
 * Retorna string formatada com 1 casa decimal, ou "" se inválido.
 */
export function calcularMBSInverso(mbu: string, tara: string, umidade: string): string {
    const mu = parseFloat(mbu.replace(',', '.'));
    const t = parseFloat(tara.replace(',', '.'));
    const wVal = parseFloat(umidade.replace(',', '.'));
    if (isNaN(mu) || isNaN(t) || isNaN(wVal) || wVal <= 0) return "";
    const wDec = wVal / 100;
    return ((mu + wDec * t) / (1 + wDec)).toFixed(1);
}

/**
 * Calcula umidade (w%) diretamente a partir de valores numéricos.
 * Usado internamente por cálculos que já têm os números parseados.
 */
export function calcularUmidadeNum(mbu: number, mbs: number, tara: number): number | null {
    if (mbs <= tara || mbu < mbs) return null;
    const massaAgua = mbu - mbs;
    const massaSolidos = mbs - tara;
    if (massaSolidos <= 0) return null;
    return (massaAgua / massaSolidos) * 100;
}
