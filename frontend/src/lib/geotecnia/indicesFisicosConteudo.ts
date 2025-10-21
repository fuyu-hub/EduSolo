// frontend/src/lib/geotecnia/indicesFisicosConteudo.ts

export interface ConteudoIndice {
  formula?: string; // String da fórmula principal (pode usar pseudo-LaTeX ou texto)
  descricao: string; // Breve explicação do índice
  valoresTipicos?: string; // Faixa de valores comuns
  paginaPDF?: number; // Página de referência no PDF 4. Indices_Fisicos_2022-Maro.pdf
}

export const conteudoIndicesFisicos: Record<string, ConteudoIndice> = {
  umidade: {
    formula: "w = (Mw / Ms) * 100%",
    descricao: "Relação entre a massa de água e a massa de sólidos (partículas secas) no solo.",
    valoresTipicos: "Geralmente entre 10% e 40%, mas pode variar muito.",
    paginaPDF: 10 // [cite: 132-138]
  },
  peso_especifico_natural: {
    formula: "γn = Pt / Vt",
    descricao: "Peso total da amostra de solo (incluindo sólidos, água e ar) por unidade de volume total.",
    valoresTipicos: "Comum: 16-21 kN/m³. Solos orgânicos moles: < 15 kN/m³.",
    paginaPDF: 14 // [cite: 157-160]
  },
  peso_especifico_seco: {
    formula: "γd = Ps / Vt = γn / (1 + w)",
    descricao: "Peso dos sólidos (partículas secas) por unidade de volume total. Indica o grau de compactação do solo.",
    valoresTipicos: "Varia muito com o tipo de solo e compactação.",
    paginaPDF: 18 // [cite: 184-188]
  },
  peso_especifico_solidos: {
    formula: "γs = Ps / Vs",
    descricao: "Peso dos sólidos (partículas secas) por unidade de volume apenas dos sólidos. Depende da mineralogia.",
    valoresTipicos: "Comum: 25-28 kN/m³.",
    paginaPDF: 21 // [cite: 203-206]
  },
  Gs: {
    formula: "Gs = γs / γw",
    descricao: "Densidade relativa dos grãos. Relação entre o peso específico dos sólidos e o peso específico da água.",
    valoresTipicos: "Solos orgânicos: < 2.5; Inorgânicos: 2.6 - 2.8; Ricos em ferro: > 2.9.",
    paginaPDF: 23 // [cite: 219-230]
  },
  indice_vazios: {
    formula: "e = Vv / Vs",
    descricao: "Relação entre o volume de vazios (espaços com água e/ou ar) e o volume de sólidos.",
    valoresTipicos: "Areias: 0.4 - 1.0; Argilas: 0.3 - 1.5+.",
    paginaPDF: 24 // [cite: 233-238]
  },
  porosidade: {
    formula: "n = (Vv / Vt) * 100% = (e / (1 + e)) * 100%",
    descricao: "Relação percentual entre o volume de vazios e o volume total da amostra.",
    valoresTipicos: "Geralmente entre 20% e 70%.",
    paginaPDF: 24 // [cite: 242-249]
  },
  grau_saturacao: {
    formula: "Sr = (Vw / Vv) * 100%",
    descricao: "Percentual do volume de vazios que está preenchido por água.",
    valoresTipicos: "0% (seco) a 100% (saturado).",
    paginaPDF: 24 // [cite: 250-259]
  },
  compacidade_relativa: {
    formula: "Dr = [(emax - e) / (emax - emin)] * 100%",
    descricao: "Indica o quão compactado um solo granular (areia/silte) está em relação aos seus estados mais fofo (emax) e mais denso (emin). Aplicável principalmente a areias.",
    valoresTipicos: "0% (muito fofo) a 100% (muito compacto).",
    paginaPDF: 31 // [cite: 347-360]
  },
  classificacao_compacidade: {
      descricao: "Classificação qualitativa da compacidade da areia com base no Dr.",
      valoresTipicos: "0-15%: Muito Fofa, 15-35%: Fofa, 35-65%: Média, 65-85%: Compacta, 85-100%: Muito Compacta.", // Ajustar faixas se necessário
      paginaPDF: 31 // [cite: 361]
  },
   peso_especifico_saturado: {
    formula: "γsat = (Gs + e) * γw / (1 + e)",
    descricao: "Peso específico do solo quando todos os vazios estão preenchidos com água (Sr = 100%).",
    paginaPDF: 19 // [cite: 191-195] e 29 [cite: 335-336]
  },
  peso_especifico_submerso: {
    formula: "γsub = γsat - γw = (Gs - 1) * γw / (1 + e)",
    descricao: "Peso específico efetivo do solo quando submerso em água (considera o empuxo).",
    paginaPDF: 19 // [cite: 196-197]
  },
  // Adicione γw se quiser explicar
   peso_especifico_agua: {
       descricao: "Peso da água por unidade de volume. Comumente adotado como 10 kN/m³ ou 9.81 kN/m³ (ou 1 g/cm³)."
   }
};