/**
 * Glossário Geotécnico Central — EduSolo
 * Baseado na ABNT NBR 6502:2022
 */

export interface DefinicaoGeotecnica {
    termo: string;
    descricao: string;
    unidade?: string;
    referencia?: string;
}

export const DEFINICOES_GERAIS: Record<string, DefinicaoGeotecnica> = {
    // Parâmetros Físicos Básicos
    Gs: {
        termo: "Densidade dos Grãos",
        descricao: "Relação entre a massa do sólido e a massa de igual volume de água destilada a 4°C.",
        referencia: "ABNT NBR 6502:2022 — Terminologia",
    },
    w: {
        termo: "Umidade",
        descricao: "Relação entre a massa de água e a massa das partículas sólidas.",
        unidade: "%",
        referencia: "ABNT NBR 6502:2022 — Terminologia",
    },
    gamma: {
        termo: "Peso Esp. Natural",
        descricao: "Peso total do solo, incluindo sólidos e água, por unidade de volume total.",
        unidade: "kN/m³",
        referencia: "ABNT NBR 6502:2022 — Terminologia",
    },
    gamma_d: {
        termo: "Peso Esp. Seco",
        descricao: "Peso das partículas sólidas por unidade de volume total do solo.",
        unidade: "kN/m³",
        referencia: "ABNT NBR 6502:2022 — Terminologia",
    },
    gamma_sat: {
        termo: "Peso Esp. Saturado",
        descricao: "Peso do solo quando todos os seus vazios estão preenchidos por água.",
        unidade: "kN/m³",
        referencia: "ABNT NBR 6502:2022 — Terminologia",
    },
    e: {
        termo: "Índice de Vazios",
        descricao: "Relação entre o volume de vazios e o volume ocupado pelas partículas sólidas.",
        referencia: "ABNT NBR 6502:2022 — Terminologia",
    },
    emin: {
        termo: "Índice de Vazios Mínimo",
        descricao: "Estado mais denso possível do solo (compactação máxima).",
        referencia: "C. Caputo (2015)",
    },
    emax: {
        termo: "Índice de Vazios Máximo",
        descricao: "Estado mais fofo possível do solo (deposição solta).",
        referencia: "C. Caputo (2015)",
    },
    n: {
        termo: "Porosidade",
        descricao: "Relação entre o volume de vazios e o volume total do solo.",
        unidade: "%",
        referencia: "ABNT NBR 6502:2022 — Terminologia",
    },
    Sr: {
        termo: "Grau de Saturação",
        descricao: "Relação entre o volume de água e o volume de vazios do solo.",
        unidade: "%",
        referencia: "ABNT NBR 6502:2022 — Terminologia",
    },
    Dr: {
        termo: "Compacidade Relativa",
        descricao: "Indica o quão compacto está o solo em relação aos seus estados extremos de índice de vazios.",
        unidade: "%",
        referencia: "ABNT NBR 6502:2022 — Terminologia",
    },

    // Limites de Consistência
    LL: {
        termo: "Limite de Liquidez",
        descricao: "Teor de umidade para o qual o solo apresenta uma resistência ao cisalhamento muito pequena.",
        unidade: "%",
        referencia: "ABNT NBR 6459:2016",
    },
    LP: {
        termo: "Limite de Plasticidade",
        descricao: "Teor de umidade abaixo do qual o solo deixa de ser plástico.",
        unidade: "%",
        referencia: "ABNT NBR 7180:2016",
    },
    IP: {
        termo: "Índice de Plasticidade",
        descricao: "Amplitude do estado plástico do solo (LL - LP).",
        unidade: "%",
        referencia: "C. Caputo (2015) | Burmister (1949)",
    },
    IC: {
        termo: "Índice de Consistência",
        descricao: "Indica a dureza do solo em relação aos limites (IC = [LL - w] / IP).",
        referencia: "C. Caputo (2015)",
    },

    // Passos do Módulo de Caracterização
    step_ll: {
        termo: "Limite de Liquidez (LL)",
        descricao: "Um mínimo de 5 determinações são necessárias para cálculo do limite de liquidez",
        referencia: "ABNT NBR 6459:2025",
    },
    step_lp: {
        termo: "Limite de Plasticidade (LP)",
        descricao: "Um mínimo de 3 determinações são necessárias para cálculo do limite de plasticidade",
        referencia: "ABNT NBR 7180:2025",
    },

    // Compactação (Proctor)
    volumeCilindro: {
        termo: "Volume do Cilindro",
        descricao: "Volume interno do molde de compactação.",
        unidade: "cm³",
        referencia: "ABNT NBR 7182:2016",
    },
    pesoCilindro: {
        termo: "Massa do Cilindro",
        descricao: "Massa do cilindro/molde vazio.",
        unidade: "g",
    },
    umidade_otima: {
        termo: "Umidade Ótima",
        descricao: "Teor de umidade que permite obter o máximo peso específico seco.",
        unidade: "%",
        referencia: "ABNT NBR 7182:2016",
    },

    areia: {
        termo: "Areia",
        descricao: "Fração de solo que passa na peneira de 2mm e fica retida na de 0,075mm.",
        referencia: "ABNT NBR 6502:2022 — Terminologia",
    },
    areia_grossa: {
        termo: "Areia",
        descricao: "Fração de solo que passa na peneira de 2mm e fica retida na de 0,075mm.",
        referencia: "ABNT NBR 6502:2022 — Terminologia",
    },
    areia_media: {
        termo: "Areia",
        descricao: "Fração de solo que passa na peneira de 2mm e fica retida na de 0,075mm.",
        referencia: "ABNT NBR 6502:2022 — Terminologia",
    },
    areia_fina: {
        termo: "Areia",
        descricao: "Fração de solo que passa na peneira de 2mm e fica retida na de 0,075mm.",
        referencia: "ABNT NBR 6502:2022 — Terminologia",
    },
    pedregulho: {
        termo: "Pedregulho",
        descricao: "Fração de solo que passa na peneira de 76mm e fica retida na de 2mm.",
        referencia: "ABNT NBR 6502:2022 — Terminologia",
    },
    silte: {
        termo: "Silte",
        descricao: "Solo que apresenta coesão apenas quando úmido e cujas partículas não são visíveis a olho nu.",
        referencia: "ABNT NBR 6502:2022 — Terminologia",
    },
    argila: {
        termo: "Argila",
        descricao: "Solo de granulação fina, constituído essencialmente de argilominerais, que apresenta plasticidade.",
        referencia: "ABNT NBR 6502:2022 — Terminologia",
    },
    pass_p10: {
        termo: "Passante #10",
        descricao: "Percentual acumulado que passa na peneira Nº 10 (2.0 mm).",
        unidade: "%",
        referencia: "ABNT NBR NM ISO 3310-1:2010",
    },
    pass_p40: {
        termo: "Passante #40",
        descricao: "Percentual acumulado que passa na peneira Nº 40 (0.42 mm).",
        unidade: "%",
        referencia: "ABNT NBR NM ISO 3310-1:2010",
    },
    pass_p200: {
        termo: "Passante #200",
        descricao: "Percentual acumulado que passa na peneira Nº 200 (0.075 mm).",
        unidade: "%",
        referencia: "ABNT NBR NM ISO 3310-1:2010",
    },
    d10: {
        termo: "D10",
        descricao: "Diâmetro correspondente a 10% de passante em peso (Diâmetro Efetivo).",
        unidade: "mm",
        referencia: "ABNT NBR 6502:2022",
    },
    d30: {
        termo: "D30",
        descricao: "Diâmetro correspondente a 30% de passante em peso.",
        unidade: "mm",
        referencia: "ABNT NBR 6502:2022",
    },
    d60: {
        termo: "D60",
        descricao: "Diâmetro correspondente a 60% de passante em peso.",
        unidade: "mm",
        referencia: "ABNT NBR 6502:2022",
    },
    subleito: {
        termo: "Subleito",
        descricao: "Camada de solo natural sobre a qual repousa o pavimento. A classificação HRB avalia o desempenho esperado do solo como fundação de estradas.",
        referencia: "ABNT NBR 6502:2022",
    },

    // Tensões Geostáticas
    gamaNat: {
        termo: "Peso Específico Natural",
        descricao: "Peso do solo no estado natural (acima do NA), incluindo sólidos e água intersticial.",
        unidade: "kN/m³",
        referencia: "ABNT NBR 6502:2022 — Terminologia",
    },
    gamaSat: {
        termo: "Peso Específico Saturado",
        descricao: "Peso do solo quando todos os vazios estão preenchidos por água (abaixo do NA ou na franja capilar).",
        unidade: "kN/m³",
        referencia: "ABNT NBR 6502:2022 — Terminologia",
    },
    Ko: {
        termo: "Coeficiente de Empuxo no Repouso",
        descricao: "Relação entre a tensão efetiva horizontal e a tensão efetiva vertical no estado de repouso (sem deformação lateral). Tipicamente 0.3–0.7 para solos normalmente adensados.",
        referencia: "Jaky (1944) — Ko ≈ 1 - sen(φ')",
    },
    profundidadeNA: {
        termo: "Nível d'Água (NA)",
        descricao: "Profundidade do nível freático medida a partir da superfície do terreno. Abaixo do NA, os poros do solo estão totalmente saturados.",
        unidade: "m",
        referencia: "ABNT NBR 6502:2022 — Terminologia",
    },
    capilaridade: {
        termo: "Altura de Ascensão Capilar",
        descricao: "Altura acima do NA onde o solo se encontra saturado por tensão superficial. A pressão neutra é negativa (sucção) nesta zona.",
        unidade: "m",
        referencia: "Das (2019) — Principles of Geotechnical Engineering",
    },
    espessuraCamada: {
        termo: "Espessura da Camada",
        descricao: "Espessura vertical da camada de solo no perfil estratigráfico.",
        unidade: "m",
    },
    pesoEspecificoAgua: {
        termo: "Peso Específico da Água",
        descricao: "Peso por unidade de volume da água. Valor convencional: 9.81 kN/m³ (arredondado para 10.0 em exercícios acadêmicos).",
        unidade: "kN/m³",
        referencia: "Valor convencional",
    },
    sobrecargaSuperficial: {
        termo: "Sobrecarga Superficial",
        descricao: "Carga uniformemente distribuída aplicada na superfície do terreno (ex: aterro, pavimento, fundação). Aumenta σv em todos os pontos do perfil.",
        unidade: "kPa",
        referencia: "Terzaghi (1943) — Theoretical Soil Mechanics",
    },
    intervaloDiscretizacao: {
        termo: "Intervalo de Discretização",
        descricao: "Espaçamento entre pontos de cálculo intermediários dentro de cada camada. Produz gráficos mais suaves. Deixe vazio para calcular apenas nos nós críticos (transições de camada e NA).",
        unidade: "m",
    },
    sigma_v: {
        termo: "Tensão Total Vertical",
        descricao: "Tensão vertical causada pelo peso próprio do solo acima do ponto considerado. σv = Σ(γᵢ · hᵢ) + q₀.",
        unidade: "kPa",
        referencia: "Terzaghi (1943)",
    },
    pressaoNeutra: {
        termo: "Pressão Neutra",
        descricao: "Pressão da água nos poros do solo. Positiva abaixo do NA (compressão), negativa na franja capilar (sucção). u = γw · (z - zNA).",
        unidade: "kPa",
        referencia: "Terzaghi (1943)",
    },
    sigma_v_ef: {
        termo: "Tensão Efetiva Vertical",
        descricao: "Tensão transmitida exclusivamente pelo esqueleto sólido do solo. σ'v = σv - u. Controla resistência, deformação e ruptura do solo.",
        unidade: "kPa",
        referencia: "Terzaghi (1943) — Princípio das Tensões Efetivas",
    },
};

/** Função auxiliar para obter uma definição de forma segura */
export const getDefinicao = (id: string): DefinicaoGeotecnica => {
    return DEFINICOES_GERAIS[id] || { termo: id, descricao: "" };
};
