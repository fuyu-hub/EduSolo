# 📐 Guia de Fórmulas LaTeX no EduSolo

## Visão Geral

O EduSolo agora suporta renderização profissional de fórmulas matemáticas usando LaTeX via KaTeX. Isso proporciona:

- ✅ Fórmulas matematicamente precisas e bonitas
- ✅ Frações, raízes, integrais e outros símbolos complexos
- ✅ Subscripts e superscripts perfeitos
- ✅ Renderização de alta qualidade nos PDFs exportados

## Como Usar

### 1. Estrutura Básica

```typescript
const formulas = [
  {
    label: "Nome da Fórmula",
    formula: "\\gamma = \\frac{M}{V}",  // LaTeX entre aspas
    latex: true,  // ⚠️ IMPORTANTE: Flag obrigatória!
    description: "Descrição opcional"
  }
];
```

### 2. Sintaxe LaTeX Comum

#### Letras Gregas
```latex
\\alpha, \\beta, \\gamma, \\delta, \\epsilon, \\theta, \\sigma, \\tau, \\phi, \\omega
\\Gamma, \\Delta, \\Sigma, \\Phi, \\Omega
```
**Resultado:** α, β, γ, δ, ε, θ, σ, τ, φ, ω, Γ, Δ, Σ, Φ, Ω

#### Subscritos e Superscritos
```latex
\\gamma_{nat}      // γₙₐₜ
\\gamma^{2}        // γ²
\\gamma_{d}^{'}    // γ'ₐ
```

#### Frações
```latex
\\frac{numerador}{denominador}
\\frac{M}{V}                    // M/V
\\frac{\\gamma_d}{\\gamma_w}    // γₐ/γw
```

#### Raízes
```latex
\\sqrt{x}          // √x
\\sqrt[3]{x}       // ³√x
```

#### Operadores Matemáticos
```latex
\\times            // ×
\\div              // ÷
\\pm               // ±
\\cdot             // ·
\\leq, \\geq       // ≤, ≥
\\approx           // ≈
\\neq              // ≠
```

#### Somatórios e Produtórios
```latex
\\sum_{i=1}^{n}    // Σ de i=1 até n
\\prod_{i=1}^{n}   // Π de i=1 até n
\\int_{0}^{\\infty} // Integral de 0 a infinito
```

### 3. Exemplos Práticos - Mecânica dos Solos

#### Peso Específico
```typescript
{
  label: "Peso Específico Natural",
  formula: "\\gamma_{nat} = \\frac{M_{total}}{V_{total}} \\times 10",
  latex: true
}
```

#### Índice de Vazios
```typescript
{
  label: "Índice de Vazios",
  formula: "e = \\frac{G_s \\times \\gamma_w}{\\gamma_d} - 1",
  latex: true
}
```

#### Porosidade
```typescript
{
  label: "Porosidade",
  formula: "n = \\frac{e}{1 + e} \\times 100\\%",
  latex: true
}
```

#### Grau de Saturação
```typescript
{
  label: "Grau de Saturação",
  formula: "S_r = \\frac{w \\times G_s}{e} \\times 100\\%",
  latex: true
}
```

#### Equação de Boussinesq
```typescript
{
  label: "Equação de Boussinesq",
  formula: "\\Delta\\sigma_z = \\frac{3P}{2\\pi} \\times \\frac{z^3}{R^5}",
  latex: true
}
```

#### Coeficiente de Uniformidade
```typescript
{
  label: "Coeficiente de Uniformidade",
  formula: "C_u = \\frac{D_{60}}{D_{10}}",
  latex: true
}
```

### 4. Caracteres Especiais

#### Porcentagem
```latex
100\\%             // 100%
```

#### Acentos
```latex
\\acute{u}         // ú
\\bar{x}           // x̄
\\hat{\\sigma}     // σ̂
\\tilde{n}         // ñ
```

#### Parênteses e Delimitadores
```latex
\\left( \\frac{x}{y} \\right)     // Parênteses que se ajustam ao tamanho
\\left[ x \\right]                // Colchetes
\\left\\{ x \\right\\}            // Chaves
```

### 5. Fórmulas Complexas

#### Compactação (Proctor)
```typescript
{
  label: "Curva de Saturação",
  formula: "\\gamma_{d_{sat}} = \\frac{G_s \\times \\gamma_w \\times 100}{G_s \\times w + 100}",
  latex: true
}
```

#### Tensões Efetivas (Terzaghi)
```typescript
{
  label: "Princípio das Tensões Efetivas",
  formula: "\\sigma' = \\sigma - u",
  latex: true,
  description: "Onde σ' é a tensão efetiva, σ é a tensão total e u é a pressão neutra"
}
```

#### Limite de Liquidez (Casagrande)
```typescript
{
  label: "Limite de Liquidez",
  formula: "LL = w_{25} = a \\times \\log(N) + b",
  latex: true,
  description: "Obtido por regressão log-linear dos pontos de ensaio"
}
```

## Dicas Importantes

### ✅ Fazer
- Sempre incluir `latex: true` na configuração
- Usar `\\` duplo para comandos LaTeX (escape)
- Testar fórmulas complexas primeiro
- Usar espaços para melhor legibilidade do código

### ❌ Evitar
- Esquecer a flag `latex: true`
- Usar apenas uma barra `\` (deve ser `\\`)
- Fórmulas muito longas (quebrar em várias linhas se necessário)
- Caracteres especiais sem escape

## Fallback Automático

Se houver erro na renderização LaTeX:
1. Sistema tenta renderizar como LaTeX
2. Se falhar, reverte automaticamente para texto simples
3. Erro é logado no console para debugging
4. PDF é gerado normalmente

## Recursos Adicionais

- [KaTeX Documentação](https://katex.org/docs/supported.html)
- [LaTeX Math Symbols](https://www.overleaf.com/learn/latex/List_of_Greek_letters_and_math_symbols)
- [Detexify](https://detexify.kirelabs.org/classify.html) - Desenhe um símbolo e encontre seu código LaTeX

## Exemplo Completo

```typescript
const formulas = [
  {
    label: "Peso Específico Saturado",
    formula: "\\gamma_{sat} = \\frac{(G_s + e) \\times \\gamma_w}{1 + e}",
    latex: true,
    description: "Onde Gₛ é a densidade relativa dos grãos, e é o índice de vazios e γw = 10 kN/m³"
  },
  {
    label: "Compacidade Relativa",
    formula: "D_r = \\frac{e_{max} - e}{e_{max} - e_{min}} \\times 100\\%",
    latex: true,
    description: "Estado de compactação: 0-15% (muito fofo), 15-35% (fofo), 35-65% (mediano), 65-85% (compacto), 85-100% (muito compacto)"
  }
];
```

---

**Nota**: O sistema renderiza LaTeX como imagem no PDF para garantir compatibilidade e qualidade perfeita em todos os dispositivos e visualizadores de PDF.

