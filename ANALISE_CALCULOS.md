# Memorial de Cálculo e Análise Computacional - EduSolo

Este documento constitui o **Memorial de Cálculo** oficial da aplicação EduSolo. Ele detalha não apenas as bases matemáticas de engenharia geotécnica, mas também as **nuances computacionais**, estratégias de precisão numérica, tratamento de exceções e a lógica de inferência implementada no código fonte.

---

## 1. Visão Geral das Estratégias Computacionais

### 1.1 Precisão de Ponto Flutuante e `EPSILON`
Devido à natureza binária da representação de números em computadores (IEEE 754), comparações diretas de igualdade ($A == B$) são evitadas. A aplicação utiliza constantes de tolerância ($\epsilon$):

*   **Padrão Global:** `EPSILON = 1e-9` (Usado em índices físicos, granulometria, compactação).
*   **Geostática:** `EPSILON_GEO = 1e-4` (Usado em tensões, para facilitar alinhamento de profundidades em metros com 4 casas decimais).

**Uso Típico:**
```typescript
// Em vez de: if (x == 0)
if (Math.abs(x) <= EPSILON) { ... }

// Em vez de: if (x > y)
if (x > y + EPSILON) { ... }
```

### 1.2 Estratégia de Arredondamento
Os cálculos intermediários são realizados com a precisão máxima do tipo `number` (double-precision 64-bit). O arredondamento é aplicado **apenas na etapa final** de retorno dos dados para a interface, garantindo que erros de truncamento não se propaguem.

*   **Padrão de Visualização:**
    *   Índices (e, Gs): 3 a 4 casas decimais.
    *   Percentuais (w, n, S): 2 casas decimais.
    *   Tensões/Pesos: 2 ou 3 casas decimais.

---

## 2. Índices Físicos (`indicesFisicos`)

**Arquivo Ref:** `calculations.ts` (558 linhas)

### 2.1 Dedução Matemática
*(Mantida conforme versão anterior, referenciar fórmulas clássicas de mecânica dos solos)*

### 2.2 Detalhes Computacionais e Nuances

#### A. O "Motor de Inferência em Cascata"
O coração deste módulo é um algoritmo que tenta resolver o sistema de equações de fase iterativamente. Como o problema é superdeterminado (há mais equações que incógnitas básicas se considerarmos todas as entradas possíveis), a ordem de execução define a prioridade de confiança nos dados.

**Fluxo de Prioridade:**
1.  **Cálculos Diretos (Massa/Volume):** Se $M_{umida}$, $M_{seca}$ e $V_{total}$ existem, calculam-se $w$, $\gamma_{nat}$, $\gamma_d$ imediatamente. Isso é considerado a "verdade experimental".
2.  **Relações Básicas:** Se $n$ é dado, calcula $e$ (e vice-versa).
3.  **Inferência de $e$ via $\gamma$:** Se $e$ não foi dado, tenta-se deduzi-lo a partir de $\gamma_d$ e $G_s$.
    ```typescript
    e = (gs * gama_w) / gama_d - 1;
    ```
4.  **Inferência de $G_s$:** Se $G_s$ falta, tenta-se deduzir de $\gamma_d$, $e$ e $\gamma_w$.
5.  **Fechamento do Ciclo ($Se = wG_s$):** Esta é a etapa mais crítica. O código verifica qual das 4 variáveis ($S, e, w, G_s$) falta e a calcula.

#### B. Tratamento de Casos Limite (Edge Cases)
*   **Índice de Vazios Negativo:** Se o cálculo resulta em $e < 0$ (fisicamente impossível), o código verifica se o valor é apenas um "zero sujo" (ex: -1e-15) e corrige para 0.0. Se for significativamente negativo, lança erro explicativo sugerindo verificação de $\gamma_d$ ou $G_s$.
*   **Saturação > 100%:** O algoritmo permite matematicamente $S > 1$ durante passos intermediários, mas a validação física final alerta se os dados são inconsistentes (embora em solos não saturados, $S$ deva ser $\le 100\%$, erros de medição podem gerar valores > 100%).
*   **Divisão por Zero:** Todas as divisões por $M_s$, $V_t$, ou denominadores como $(1+e)$ são protegidas por verificações `if (val <= EPSILON)`.

#### C. Estatísticas de Múltiplas Amostras
O módulo suporta entrada em lote. Se recebe um array de amostras:
1.  Calcula individualmente.
2.  Calcula média, desvio padrão e CV (Coeficiente de Variação).
3.  **Alerta Automático de Qualidade:**
    *   Se $CV > 15\%$: Adiciona flag de "Alta Variabilidade".
    *   Se $10\% < CV \le 15\%$: Adiciona flag de "Variação Moderada".

---

## 3. Granulometria (`granulometria`)

**Arquivo Ref:** `calculations.ts` (431 linhas)

### 3.1 Dedução Matemática
Baseia-se na massa retida acumulada e passante.

### 3.2 Detalhes Computacionais e Nuances

#### A. Estratégia de Interpolação
Diferente da interpolação linear simples, a granulometria exige precisão na escala logarítmica para os diâmetros ($D$).

*   **Para encontrar porcentagem ($P$) dado diâmetro ($D$):** Interpolação Linear (eixo Y é aritmético).
    $$P = P_1 + \frac{(P_2 - P_1)(D - D_1)}{(D_2 - D_1)}$$
*   **Para encontrar diâmetro ($D$) dada porcentagem ($P$) (ex: $D_{10}$):** Interpolação Logarítmica (eixo X é log).
    *   O código converte os diâmetros para log: `log_d1 = Math.log10(p1.abertura)`
    *   Interpola linearmente nos logs.
    *   Reverte a potência: `diametro = Math.pow(10, log_diametro)`

#### B. Integração Peneiramento Grosso/Fino
O código detecta automaticamente a "fronteira" entre os ensaios (geralmente peneira #10 ou 2.0mm).
1.  Calcula todo o peneiramento grosso.
2.  Identifica a % passante na malha de corte ($N = PP_{\#10} / 100$).
3.  Processa o fino, multiplicando todas as porcentagens passantes por $N$.
4.  Une os vetores de pontos (`[...dados_grosso, ...dados_fino]`) para formar a curva completa.

#### C. Classificações (USCS/HRB)
A lógica de classificação não é "hardcoded" dentro do cálculo principal, mas delegada a funções especializadas (`classificarUSCS`, `classificarHRB`), permitindo reuso.
*   **USCS:** Lida com carta de plasticidade dupla (CL-ML) verificando a região sombreada da carta (IP entre 4 e 7).
*   **HRB:** Calcula o Índice de Grupo ($IG$) parciais e soma, garantindo que $IG \ge 0$.

---

## 4. Limites de Consistência (`limites`)

**Arquivo Ref:** `calculations.ts` (218 linhas)

### 4.1 Dedução Matemática
Regressão linear semi-logarítmica para LL.

### 4.2 Detalhes Computacionais e Nuances

#### A. Regressão Linear "Raw"
Não utilizamos bibliotecas de estatística para manter o bundle leve. A função `linearRegression` implementa o Método dos Mínimos Quadrados direto:
*   Variável X: $log_{10}(\text{golpes})$
*   Variável Y: $\text{Umidade} (\%)$
*   LL = Projeção da reta para $X = log_{10}(25) \approx 1.3979$.

#### B. Validação Hierárquica de Massas
Antes de qualquer cálculo, o código valida a integridade física da pesagem para **cada ponto**:
```typescript
if (massa_umida < massa_seca) throw Error(...)
if (massa_seca < tara) throw Error(...)
if (golpes <= 0) throw Error(...) // Log(0) ou Log(neg) é desastroso
```
Isso previne erros `NaN` silenciosos que ocorreriam ao calcular $log(golpes)$ ou umidades negativas.

#### C. Classificação de Plasticidade
O código trata explicitamente o caso **Não Plástico (NP)**:
*   Se $IP < 0$ (o que pode ocorrer matematicamente se $LP > LL$ por erro de ensaio), força $IP = 0$ e marca como "NP".
*   Tratamento de precisão: `if (Math.abs(ip) < EPSILON)` considera 0.

---

## 5. Compactação (`compactacao`)

**Arquivo Ref:** `calculations.ts` (253 linhas)

### 5.1 Dedução Matemática
Polinômio de grau 2 (parábola) ou 3 para curva de compactação.

### 5.2 Detalhes Computacionais e Nuances

#### A. Ajuste Polinomial Robusto
Para encontrar o pico exato ($\gamma_{d,max}, w_{ot}$), não confiamos apenas no maior valor medido. Ajustamos uma função contínua.
*   **Seleção de Grau:**
    *   Se pontos $\ge 4$: Tenta polinômio cúbico (grau 3) para melhor ajuste de caudas.
    *   Se pontos $< 4$: Usa parábola (grau 2), pois grau 3 com 3 pontos oscilaria demais (overfitting).
*   **Matriz de Vandermonde:** Montada manualmente para o sistema linear $Ax = b$.

#### B. Solvedor de Matrizes (Gaussian Elimination)
Implementação pura de *Gaussian Elimination with Partial Pivoting*. O "pivoting" (troca de linhas para colocar o maior valor na diagonal) é crucial para **estabilidade numérica**, evitando divisões por números muito pequenos que explodiriam o erro de ponto flutuante.

#### C. Otimização Numérica (Newton-Raphson)
Para achar o máximo do polinômio, zeramos a derivada.
*   Grau 2: Solução analítica trivial ($x = -b/2a$).
*   Grau 3: Derivada é uma quadrática. Poderia usar Bhaskara, mas o código implementa um `findPolynomialMaximum` genérico com Newton-Raphson. Isso dá flexibilidade para futuros graus maiores ou funções diferentes.
    *   **Fallback:** Se a raiz da derivada cair fora do intervalo de umidades testadas $[w_{min}, w_{max}]$, o algoritmo retorna o maior valor nas bordas, prevenindo extrapolações absurdas.

---

## 6. Tensões Geostáticas (`tensoes`)

**Arquivo Ref:** `calculations.ts` (249 linhas)

### 6.1 Dedução Matemática
Princípio de Terzaghi ($\sigma' = \sigma - u$).

### 6.2 Detalhes Computacionais e Nuances

#### A. Algoritmo de "Pontos de Interesse" (Discretização Adaptativa)
O solo não é contínuo computacionalmente. O cálculo identifica "Pontos de Interesse" (POIs):
1.  Superfície ($z=0$).
2.  Interfaces de camadas ($z_{topo}, z_{base}$).
3.  Nível D'água ($z_{NA}$).
4.  Topo da Franja Capilar ($z_{NA} - h_c$).

O algoritmo cria fatias (segmentos) entre estes pontos ordenados. Dentro de cada fatia, as propriedades ($\gamma$, saturação) são constantes.

#### B. Lógica de NAs Suspensos (Aquíferos)
A função `getHidrologiaCamada(index)` resolve a pressão de poros para uma camada específica.
*   **Isolamento:** Se uma camada `i` é impermeável, ela "blinda" as camadas abaixo da influência hidráulica de cima? O código assume que camadas impermeáveis **interrompem** a continuidade da coluna d'água se não houver um NA específico definido para a camada atual.
*   **Herança:** Se a camada é permeável, ela "herda" o NA da camada superior, a menos que tenha um próprio definido.

#### C. Prevenção de "Zero Negativo"
Ao calcular $\sigma' = \sigma - u$, flutuações de ponto flutuante podem gerar `-0.00000000001` quando deveriam ser `0`.
```typescript
if (sigma_eff_v < 0 && Math.abs(sigma_eff_v) < 1e-3) sigma_eff_v = 0.0;
```
Isso evita displays feios como "-0.00 kPa" na interface.

---

## 7. Acréscimo de Tensões (`acrescimoTensoes`)

**Arquivo Ref:** `calculations.ts` (1000+ linhas)

### 7.1 Dedução Matemática
Boussinesq e integrações (Love, Newmark).

### 7.2 Detalhes Computacionais e Nuances

#### A. Solução Híbrida para Newmark (Retangular)
Implementamos duas "engines" de cálculo:
1.  **Analítica (Steinbrenner):** Rápida e precisa para qualquer geometria. Usa `Math.atan`.
    *   *Nuance:* O termo `atan` varia entre $-\pi/2$ e $\pi/2$. O código ajusta quadrantes manualmente para garantir continuidade quando o denominador da fração do arco-tangente cruza zero ou fica negativo.
2.  **Numérica (Ábaco Digitalizado):** Baseado em objeto de lookup `ABACO_NEWMARK`.
    *   *Por que usar?* Para validação didática. Alunos aprendem usando ábacos. Se o cálculo analítico divergir do "olhômetro" do ábaco, o aluno desconfia. O modo ábaco simula essa leitura discreta.
    *   *Lógica:* Encontra os índices $m, n$ tabelados mais próximos ou interpola.

#### B. Superposição de Quadrantes
Para cargas retangulares, o ponto de cálculo ($x, y$) pode estar fora da área carregada. O algoritmo de superposição:
1.  Projeta 4 retângulos virtuais a partir do ponto até os cantos da área carregada.
2.  Calcula $I$ para cada retângulo (com $z$ constante).
3.  Atribui sinais: Áreas que "sobram" (vazias) recebem sinal negativo para subtrair sua influência. Áreas preenchidas recebem positivo.
    *   O código usa sinais baseados na direção: `sinal_x_dir`, `sinal_x_esq`, etc., automatizando a álgebra de "soma e subtrai áreas".

#### C. Interpolação Bilinear (Love - Circular)
Para o ábaco de Love (cargas circulares fora do eixo), a função `r/R` vs `z/R` é altamente não-linear.
*   O objeto `abaco_data` armazena curvas discretas (isóbaras).
*   Se $z/R$ do ponto cai entre duas curvas (ex: 1.2, curvas disp: 1.0 e 1.5), o código:
    1.  Calcula o valor na curva 1.0.
    2.  Calcula o valor na curva 1.5.
    3.  Faz média ponderada (linear) entre os dois resultados.

#### D. Tratamento de Singularidades
*   **Divisão por Zero ($z=0$):** Na superfície, as fórmulas de Boussinesq explodem (divisão por zero).
    *   O código detecta `z <= EPSILON` e retorna a pressão aplicada $p$ (se dentro da carga) ou $0$ (se fora), evitando `Infinity`.
*   **Raio Zero ($R=0$):** Retorna carga pontual ou zero.

---

## 8. Estruturas de Dados e Tipagem

Todos os módulos utilizam **Zod Schemas** para validação de entrada em tempo de execução ("runtime validation"). Isso garante que:
*   Strings vazias vindas de inputs HTML não quebrem a matemática (são convertidas ou rejeitadas).
*   Valores negativos onde não permitido (ex: Espessura < 0) lançam erros amigáveis antes da execução da matemática pesada.
*   Integração Type-Safe: As interfaces TypeScript (`Input/Output`) garantem que o frontend não esqueça de passar parâmetros obrigatórios.
