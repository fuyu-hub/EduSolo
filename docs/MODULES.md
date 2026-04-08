# Módulos e Fundamentos Geotécnicos

Este documento detalha os módulos de cálculo do **EduSolos**, suas fundamentações teóricas e as referências normativas brasileiras (ABNT) seguidas pelo sistema.

## 1. Índices Físicos e Limites de Consistência

Este módulo permite a caracterização preliminar do solo através das relações de fase e do comportamento sob diferentes estados de umidade.

### Fundamentação Teórica
- **Relacionamentos de Fase**: Cálculos de Índice de Vazios ($e$), Porosidade ($n$), Teor de Umidade ($w$), Grau de Saturação ($S$) e Pesos Específicos.
- **Limites de Atterberg**: 
  - **Limite de Liquidez (LL)**: Determinado via Método de Casagrande ou Penetração de Cone.
  - **Limite de Plasticidade (LP)**: Determinado pela umidade na qual o solo começa a se desagregar ao ser moldado em cilindros de 3mm.
  - **Índice de Plasticidade (IP)**: $IP = LL - LP$.

### Normas de Referência
- **ABNT NBR 6457**: Solo - Preparação para ensaios de compactação e ensaios de caracterização.
- **ABNT NBR 6459**: Solo - Determinação do limite de liquidez.
- **ABNT NBR 7180**: Solo - Determinação do limite de plasticidade.
- **ABNT NBR 6502**: Rochas e solos - Terminologia.

---

## 2. Granulometria

O módulo de granulometria processa dados de peneiramento (partículas grossas) e sedimentação (partículas finas) para determinar a distribuição do tamanho dos grãos de uma amostra de solo.

### Funcionalidades
- Plotagem automática da **Curva Granulométrica**.
- Cálculo dos diâmetros característicos: $D_{10}$, $D_{30}$, $D_{60}$.
- **Coeficiente de Uniformidade ($C_u$):** $C_u = \frac{D_{60}}{D_{10}}$.
- **Coeficiente de Curvatura ($C_c$):** $C_c = \frac{(D_{30})^2}{D_{10} \cdot D_{60}}$.

### Normas de Referência
- **ABNT NBR 7181**: Solo - Análise granulométrica.

---

## 3. Compactação

Este módulo analisa a relação entre a umidade do solo e seu peso específico seco quando submetido a uma energia de compactação padronizada.

### Parâmetros de Saída
- **Peso Específico Aparente Seco Máximo ($\gamma_{d,max}$)**.
- **Umidade Ótima ($w_{ot}$)**.
- Plotagem da **Curva de Compactação** e das curvas de saturação (para diferentes graus de saturação).

### Normas de Referência
- **ABNT NBR 7182**: Solo - Ensaio de compactação (Normal, Intermediária e Modificada).

---

## Expansões Planejadas

Em versões futuras, o EduSolos incluirá módulos baseados nas seguintes normas e conceitos:
- **Acrescimo de Tensões**: Teoria de Boussinesq e Westergaard.
- **Adensamento**: ABNT NBR 12007 (Adensamento unidimensional).
- **Resistência ao Cisalhamento**: ABNT NBR 14545 (Ensaio Triaxial) e NBR 12770 (Compressão Simples).

---
**Observação:** Todos os cálculos implementados visam a precisão acadêmica e profissional, porém os resultados devem ser validados por responsáveis técnicos competentes antes de sua aplicação em projetos de engenharia.
