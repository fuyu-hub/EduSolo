/**
 * Tipos do módulo Índices Físicos e Limites de Consistência.
 */

/** Dados de entrada para índices físicos de uma amostra */
export interface IndicesFisicosInput {
    massaUmida: string;
    massaSeca: string;
    tara?: string;
    volume?: string;
}

/** Ponto de ensaio do Limite de Liquidez (Casagrande) */
export interface PontoLL {
    id: string;
    numGolpes: string;
    massaUmidaRecipiente: string;
    massaSecaRecipiente: string;
    massaRecipiente: string;
    umidade: string;
}

/** Ponto de ensaio do Limite de Plasticidade */
export interface PontoLP {
    id: string;
    massaUmidaRecipiente: string;
    massaSecaRecipiente: string;
    massaRecipiente: string;
    umidade: string;
}

/** Dados de entrada dos Limites de Consistência */
export interface LimitesInput {
    pontosLL: PontoLL[];
    pontosLP: PontoLP[];
}

/** Estado unificado de uma amostra */
export interface AmostraUnificada {
    id: string;
    nome: string;
    indices: IndicesFisicosInput;
}

/** Configurações globais do módulo */
export interface CaracterizacaoSettings {
    Gs: string;
    pesoEspecificoAgua: string;
    indice_vazios_max: string;
    indice_vazios_min: string;
}

/** Resultado combinado (índices + limites + compacidade) */
export interface CaracterizacaoOutput {
    // Índices Físicos
    w?: number;
    gamma_nat?: number;
    gamma_d?: number;
    e?: number;
    n?: number;
    Sr?: number;
    gamma_sat?: number;

    // Volumes e Massas para Diagrama de Fases
    volume_solidos_calc?: number;
    volume_agua_calc?: number;
    volume_ar_calc?: number;
    volume_total_calc?: number;
    massa_solidos_calc?: number;
    massa_agua_calc?: number;
    massa_total_calc?: number;

    // Limites
    ll?: number | null;
    lp?: number | null;
    ip?: number | null;
    ic?: number | null;
    pontos_grafico_ll?: { x: number; y: number }[] | null;

    // Classificações
    classificacao_plasticidade?: string;
    classificacao_consistencia?: string;

    // Compacidade (solos não plásticos)
    compacidade_relativa?: number | null;
    classificacao_compacidade?: string;

    erro?: string;
}
