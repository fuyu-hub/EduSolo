/**
 * Constantes e helpers visuais para diagramas de perfil de solo.
 *
 * Centraliza a paleta de cores, funções de mistura e utilitários visuais
 * usados por DiagramaCamadas (tensões) e DiagramaRecalque (recalque).
 */

// ─── Paleta de cores de solo realistas ───────────────────────────────────────

export const CORES_SOLO = [
  { bg: "#d9bc8c", border: "#a67c52" }, // Areia amarelada
  { bg: "#c4a57b", border: "#8b7355" }, // Areia marrom-claro
  { bg: "#b8a99a", border: "#6b5d50" }, // Argila cinza-marrom
  { bg: "#d4c5b9", border: "#9c8b7e" }, // Silte bege claro
  { bg: "#b8956a", border: "#8b6f47" }, // Argila marrom
  { bg: "#9c7a5e", border: "#6b4423" }, // Argila marrom-escuro
  { bg: "#c9b89a", border: "#a08968" }, // Solo arenoso claro
  { bg: "#a89080", border: "#7d6b5c" }, // Solo argiloso médio
  { bg: "#8b7968", border: "#5d4e3f" }, // Solo compacto escuro
  { bg: "#d6c3a8", border: "#b39a7d" }, // Areia fina clara
] as const;

// ─── Cores específicas para tipos de camada (recalque) ───────────────────────

/** Cor para camada de argila (marrom argiloso) */
export const COR_ARGILA = { bg: "#a67c52", border: "#8b5a3c" } as const;

/** Cor para camada de areia drenante */
export const COR_AREIA = { bg: "#d9bc8c", border: "#a67c52" } as const;

/** Cor para camada de pedregulho não drenante (cinza) */
export const COR_PEDREGULHO = { bg: "#9ca3af", border: "#6b7280" } as const;

/** Cor para camada de aterro */
export const COR_ATERRO = { bg: "#8b7355", border: "#6b5d50" } as const;

// ─── Tipos ───────────────────────────────────────────────────────────────────

export interface CorSolo {
  bg: string;
  border: string;
}

export interface CorSoloComTexto extends CorSolo {
  texto: string;
}

// ─── Funções auxiliares ──────────────────────────────────────────────────────

/**
 * Retorna a cor de texto adequada para um fundo hex.
 * Atualmente retorna sempre texto escuro para garantir legibilidade
 * sobre todas as cores de solo da paleta.
 */
export function getCorTexto(_corHex: string): string {
  return '#1f2937'; // Sempre texto escuro
}

/**
 * Mistura duas cores hexadecimais por interpolação linear.
 *
 * @param cor1 - Primeira cor hex (ex: "#d9bc8c")
 * @param cor2 - Segunda cor hex (ex: "#a8c5d8")
 * @param percentualCor1 - Peso da primeira cor (0.0 a 1.0). Ex: 0.7 = 70% cor1 + 30% cor2
 * @returns Cor resultante em hex
 */
export function misturarCores(cor1: string, cor2: string, percentualCor1: number): string {
  const hex1 = cor1.replace('#', '');
  const hex2 = cor2.replace('#', '');

  const r1 = parseInt(hex1.substring(0, 2), 16);
  const g1 = parseInt(hex1.substring(2, 4), 16);
  const b1 = parseInt(hex1.substring(4, 6), 16);

  const r2 = parseInt(hex2.substring(0, 2), 16);
  const g2 = parseInt(hex2.substring(2, 4), 16);
  const b2 = parseInt(hex2.substring(4, 6), 16);

  const r = Math.round(r1 * percentualCor1 + r2 * (1 - percentualCor1));
  const g = Math.round(g1 * percentualCor1 + g2 * (1 - percentualCor1));
  const b = Math.round(b1 * percentualCor1 + b2 * (1 - percentualCor1));

  return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

/**
 * Gera um número pseudo-aleatório determinístico a partir de uma seed.
 * Usado para atribuir cores consistentes a camadas de solo por índice.
 *
 * @param seed - Valor inteiro usado como semente
 * @returns Número entre 0 e 1
 */
export function seededRandom(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

/**
 * Retorna a cor completa (bg, border, texto) para uma camada de solo
 * baseada no seu índice, evitando repetir a cor da camada anterior.
 *
 * @param index - Índice da camada
 * @param corAnterior - Índice da cor usada na camada anterior (undefined se primeira)
 * @returns Objeto com { corIndex, cores } onde cores inclui bg, border e texto
 */
export function obterCorCamada(
  index: number,
  corAnterior?: number
): { corIndex: number; cores: CorSoloComTexto } {
  let corIndex = Math.floor(seededRandom(index * 7919 + 12345) * CORES_SOLO.length);
  if (corAnterior !== undefined && corIndex === corAnterior) {
    corIndex = (corIndex + 1) % CORES_SOLO.length;
  }

  const coresSelecionadas = CORES_SOLO[corIndex];
  return {
    corIndex,
    cores: {
      bg: coresSelecionadas.bg,
      border: coresSelecionadas.border,
      texto: getCorTexto(coresSelecionadas.bg),
    },
  };
}

/**
 * Aplica efeito de saturação (azulado) a uma cor de solo,
 * simulando visualmente que a camada está abaixo do nível de água.
 *
 * @param cores - Cor base da camada (bg + border)
 * @returns Nova cor com tom azulado aplicado
 */
export function aplicarSaturacao(cores: CorSolo): CorSoloComTexto {
  const bgMisturada = misturarCores(cores.bg, '#a8c5d8', 0.7);
  const borderMisturada = misturarCores(cores.border, '#6a8fb8', 0.7);
  return {
    bg: bgMisturada,
    border: borderMisturada,
    texto: getCorTexto(bgMisturada),
  };
}
