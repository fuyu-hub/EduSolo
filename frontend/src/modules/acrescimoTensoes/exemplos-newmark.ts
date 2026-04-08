/**
 * Exemplos práticos para análise de Newmark (carga retangular)
 */

export interface ExemploNewmark {
  id: string;
  titulo: string;
  descricao: string;
  largura: number;      // B (m)
  comprimento: number;  // L (m)
  intensidade: number;  // p (kPa)
  pontos: Array<{
    nome: string;
    x: number;
    y: number;
    z: number;
  }>;
  fonte?: string;
  observacoes?: string;
}

export const exemplosNewmark: ExemploNewmark[] = [
  {
    id: "exemplo-classico-1",
    titulo: "Placa Retangular - Centro",
    descricao: "Calcular o acréscimo de carga na vertical do ponto A, a profundidade de 5,0 m. A placa superficial tem 4,0 m x 10,0 m e está submetida a uma pressão uniforme de 340 kPa.",
    largura: 4.0,
    comprimento: 10.0,
    intensidade: 340.0,
    pontos: [
      {
        nome: "Ponto A (Centro)",
        x: 0,
        y: 0,
        z: 5.0
      }
    ],
    fonte: "Material didático - Solução de Newmark",
    observacoes: "Exemplo clássico de carga retangular com ponto de análise no centro, abaixo da área carregada."
  },
  {
    id: "exemplo-multiplos-pontos",
    titulo: "Placa Retangular - Múltiplos Pontos",
    descricao: "Análise de diferentes posições sob uma fundação retangular de 6m x 8m com carga de 200 kPa.",
    largura: 6.0,
    comprimento: 8.0,
    intensidade: 200.0,
    pontos: [
      {
        nome: "Centro",
        x: 0,
        y: 0,
        z: 4.0
      },
      {
        nome: "Borda Lateral",
        x: 3.0,
        y: 0,
        z: 4.0
      },
      {
        nome: "Canto",
        x: 3.0,
        y: 4.0,
        z: 4.0
      },
      {
        nome: "Fora da Área",
        x: 5.0,
        y: 5.0,
        z: 4.0
      }
    ],
    fonte: "Exemplo didático",
    observacoes: "Demonstra como o acréscimo de tensão varia conforme a posição do ponto em relação à área carregada."
  },
  {
    id: "exemplo-profundidade-variavel",
    titulo: "Análise de Profundidade",
    descricao: "Verificar a variação do acréscimo de tensão com a profundidade sob o centro de uma sapata 3m x 5m com 150 kPa.",
    largura: 3.0,
    comprimento: 5.0,
    intensidade: 150.0,
    pontos: [
      {
        nome: "z = 1m",
        x: 0,
        y: 0,
        z: 1.0
      },
      {
        nome: "z = 2m",
        x: 0,
        y: 0,
        z: 2.0
      },
      {
        nome: "z = 3m",
        x: 0,
        y: 0,
        z: 3.0
      },
      {
        nome: "z = 5m",
        x: 0,
        y: 0,
        z: 5.0
      },
      {
        nome: "z = 10m",
        x: 0,
        y: 0,
        z: 10.0
      }
    ],
    fonte: "Exemplo didático",
    observacoes: "Observar como o acréscimo de tensão diminui com a profundidade. Quanto mais profundo, menor a influência da carga superficial."
  },
  {
    id: "exemplo-fundacao-edificio",
    titulo: "Fundação de Edifício",
    descricao: "Sapata corrida de um edifício residencial com dimensões 2m x 12m sob carga de 250 kPa.",
    largura: 2.0,
    comprimento: 12.0,
    intensidade: 250.0,
    pontos: [
      {
        nome: "Centro - 3m",
        x: 0,
        y: 0,
        z: 3.0
      },
      {
        nome: "Lateral - 3m",
        x: 1.0,
        y: 0,
        z: 3.0
      },
      {
        nome: "Centro - 6m",
        x: 0,
        y: 0,
        z: 6.0
      }
    ],
    fonte: "Exemplo prático de engenharia",
    observacoes: "Sapata alongada típica de fundações de edifícios. A relação L/B = 6 caracteriza comportamento quase unidimensional no centro."
  }
];

/**
 * Busca um exemplo por ID
 */
export function getExemploNewmarkById(id: string): ExemploNewmark | undefined {
  return exemplosNewmark.find(ex => ex.id === id);
}

/**
 * Formata os dados do exemplo para exibição
 */
export function formatarExemploNewmark(exemplo: ExemploNewmark): string {
  return `
📏 Dimensões: ${exemplo.largura}m × ${exemplo.comprimento}m
📊 Carga: ${exemplo.intensidade} kPa
📍 Pontos: ${exemplo.pontos.length}
  `.trim();
}

