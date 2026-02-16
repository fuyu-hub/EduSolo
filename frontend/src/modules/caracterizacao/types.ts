
// Dados básicos de entrada (simplificado)
export interface IndicesFisicosInput {
    massaUmida: string;
    massaSeca: string;
    tara?: string; // Massa do recipiente
    volume?: string;
}

// Dados de entrada para Limites
export interface PontoLL {
    id: string;
    numGolpes: string;
    massaUmidaRecipiente: string;
    massaSecaRecipiente: string;
    massaRecipiente: string;
    umidade: string;
}

export interface PontoLP {
    id: string;
    massaUmidaRecipiente: string;
    massaSecaRecipiente: string;
    massaRecipiente: string;
    umidade: string;
}

export interface LimitesInput {
    pontosLL: PontoLL[];
    pontosLP: PontoLP[];
    umidadeNatural: string;
    percentualArgila: string;
}

// Estado unificado da Amostra
export interface AmostraUnificada {
    id: string;
    nome: string; // "Amostra 1", etc

    // Dados de Indices Fisicos
    indices: IndicesFisicosInput;
}

export interface CaracterizacaoSettings {
    Gs: string;
    pesoEspecificoAgua: string;
    indice_vazios_max: string;
    indice_vazios_min: string;
}

// Resultado unificado (pode ser null se não calculado)
export interface CaracterizacaoOutput {
    // Indices Fisicos
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
    atividade?: number | null;
    // Gráfico LL
    pontos_grafico_ll?: { x: number; y: number }[] | null;

    // Classificações
    classificacao_plasticidade?: string;
    classificacao_consistencia?: string;

    // Compacidade (solos não plásticos)
    compacidade_relativa?: number | null;
    classificacao_compacidade?: string;

    erro?: string;
}
