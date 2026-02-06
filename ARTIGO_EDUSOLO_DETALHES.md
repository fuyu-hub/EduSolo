# Detalhes Técnicos e Funcionais do EduSolos
### *Subsídios para escrita de artigo (COBRAMSEG)*

Este documento detalha a arquitetura, funcionalidades, normas e validações do software **EduSolos**, focando nos aspectos técnicos exigidos para a metodologia e análise de resultados do seu artigo.

---

## 1. Tecnologias e Arquitetura (Metodologia)

O EduSolos foi desenvolvido com uma arquitetura **Single Page Application (SPA)** moderna, focada em performance e execução total no lado do cliente (*client-side*).

*   **Stack Principal:**
    *   **Framework:** [React.js](https://react.dev/) (v18) com TypeScript para tipagem estática e segurança de código.
    *   **Build Tool:** [Vite](https://vitejs.dev/) (garante carregamento instantâneo e otimização de *bundles*).
    *   **Estilização:** [Tailwind CSS](https://tailwindcss.com/) com design system customizado (Shadcn UI + Radix Primitives) para acessibilidade e responsividade.
*   **Bibliotecas de Destaque:**
    *   **Visualização de Dados:** `Recharts` para geração dos gráficos vetoriais interativos (curvas granulométricas, compactação e limites).
    *   **Matemática/Fórmulas:** `KaTeX` para renderização tipográfica de equações em tempo real.
    *   **Geração de Relatórios:** `jsPDF` e `jspdf-autotable` para conversão do DOM e dados brutos em relatórios PDF técnicos.
    *   **Validação:** `Zod` para validação robusta de esquemas de dados de entrada.
*   **Arquitetura de Execução:**
    *   **Client-Side Puro:** Todo o processamento matemático ocorre no navegador do usuário. Não há dependência de servidores (backend) para cálculos.
    *   **Benefício:** Latência zero na resposta dos cálculos e privacidade total dos dados (nada é enviado para nuvem).
*   **Responsividade (Mobile-First):**
    *   A interface adapta dinamicamente layouts complexos (como tabelas de granulometria) para telas verticais.
    *   Uso de *drawers* e *sheets* táteis para inserção de dados em celulares, separando a entrada de dados da visualização de resultados.

---

## 2. Módulos e Funcionalidades (Resultados)

### A. Módulo: Índices Físicos e Consistência (Caracterização)
Este módulo integra a análise básica com os limites de Atterberg.

*   **Entradas (Inputs):**
    *   Dados da Amostra: Massa Úmida, Massa Seca, Volume total.
    *   Parâmetros: Gs (Densidade dos grãos - opcional, padrão 2.65), Peso Específico da Água.
    *   Limites: Tabela dinâmica para inserção de múltiplos pontos de LL (Golpes vs Umidade) e LP (n repetições).
*   **Saídas (Outputs):**
    *   **Índices Calculados:** Teor de Umidade ($w$), Peso Específico Natural ($\gamma$), Seco ($\gamma_d$) e Saturado ($\gamma_{sat}$), Índice de Vazios ($e$), Porosidade ($n$) e Grau de Saturação ($S_r$).
    *   **Diagrama de Fases:** Gera automaticamente um diagrama visual proporcional das fases (Ar, Água, Sólidos) com volumes e massas calculados.
    *   **Limites de Atterberg:**
        *   Cálculo do LL via regressão linear semi-logarítmica (Ponto de 25 golpes).
        *   Cálculo do LP (média das determinações).
        *   Índice de Plasticidade (IP) e Índice de Consistência (IC).
    *   **Alertas de Erro:**
        *   *Físico:* Detecta se Massa Seca > Massa Úmida (impossível fisicamente).
        *   *Físico:* Detecta se Massa Sólidos <= 0.
        *   *Normativo:* Alerta se o número de golpes do LL foge do intervalo 15-35 (NBR 6459).
        *   *Normativo:* Alerta violação de monotonicidade no LL (mais golpes deve resultar em menos umidade).

### B. Módulo: Granulometria
Realiza a análise completa por peneiramento (grosso e fino) com classificações automáticas.

*   **Processamento Automático:**
    *   Interpola automaticamente os diâmetros característicos ($D_{10}, D_{30}, D_{60}$) usando interpolação log-linear.
    *   Calcula os coeficientes de Uniformidade ($C_u$) e Curvatura ($C_c$).
*   **Sistemas de Classificação:**
    *   **SUCS / USCS:** Classifica automaticamente o solo (ex: "SC - Areia Argilosa") considerando a carta de plasticidade e os critérios granulométricos. Lida com casos de dupla simbologia.
    *   **AASHTO / HRB:** Classifica conforme normas rodoviárias (ex: "A-2-4"), calculando inclusive o **Índice de Grupo (IG)** e fornecendo a avaliação do subleito.
*   **Recursos Gráficos:**
    *   Plota a Curva Granulométrica completa (escala semi-log).

### C. Módulo: Compactação
Focado no ensaio de Proctor (Normal, Intermediário ou Modificado).

*   **Entradas:**
    *   Dimensões do molde (Volume, Peso).
    *   Série de pontos do ensaio: (Peso Umido + Molde) e dados das cápsulas para umidade.
*   **Processamento Matemático:**
    *   Calcula a umidade e o peso específico seco ($\gamma_d$) para cada ponto.
    *   **Curva de Compactação:** Utiliza o método dos **Mínimos Quadrados** para ajustar um polinômio de 2º ou 3º grau aos pontos experimentais.
    *   **Ponto Ótimo:** Determina matematicamente (derivada zero) a Umidade Ótima ($w_{ot}$) e o Peso Específico Seco Máximo ($\gamma_{d,max}$).
    *   **Curva de Saturação:** Traça automaticamente a linha de saturação (S=100%) baseada no $G_s$ informado, permitindo verificação visual da consistência dos dados (pontos não podem cruzar essa linha).

---

## 3. Normas e Validação

O software implementa estritamente as diretrizes das principais normas brasileiras (ABNT):

*   **NBR 6459:** (Limite de Liquidez) - Implementa validação do intervalo de golpes (15 a 35) e consistência da reta de fluxo.
*   **NBR 7180:** (Limite de Plasticidade) - Verifica o desvio padrão das amostras. O sistema alerta se a variação entre determinações exceder 5% da média.
*   **NBR 7181:** (Análise Granulométrica) - Define as faixas de peneiras e lógica de cálculo dos percentuais de frações.
*   **Travas de Segurança (Sanitização de Dados):**
    *   Impede inserção de umidade negativa.
    *   Impede tara ("peso do recipiente") maior que o peso bruto.
    *   Valida consistência geométrica no ensaio de compactação (volume do molde deve ser positivo).
    *   No cálculo do IP, corrige automaticamente para 0 (Não Plástico) se $LP > LL$ ou se $LP = 0$.

---

## 4. Design e Usabilidade

*   **Design Inclusivo (Acessibilidade e Pedagogia):**
    *   **Modo Escuro (Dark Mode):** Implementado nativamente não apenas por estética, mas para reduzir a fadiga visual de estudantes/engenheiros que utilizam o software por longos períodos em ambientes com pouca luz (comum em laboratórios ou estudos noturnos).
    *   **Feedback Visual Imediato:** Os diagramas (como o de Fases) reagem em tempo real à digitação, reforçando o entendimento intuitivo da relação entre volume de vazios e sólidos.
*   **Persistência e Exportação:**
    *   **Salvamento Local:** O sistema utiliza `localStorage` e `sessionStorage` para evitar perda de dados acidental caso o navegador seja fechado.
    *   **Exportação Profissional:** Gera relatórios em **PDF** vetorial limpo, contendo cabeçalho, tabelas de resultados formatadas e gráficos em alta resolução, prontos para serem anexados a trabalhos acadêmicos ou laudos técnicos.

---

## 5. Futuro e Expansão

A arquitetura modular permite a fácil adição de novas ferramentas. O *roadmap* técnico, já visível no painel principal ("Em Breve"), inclui:

1.  **Tensões Geostáticas:** Cálculo de tensões verticais totais, neutras e efetivas em perfis estratificados.
2.  **Acréscimo de Tensões:** Implementação de soluções elásticas (Boussinesq, Westergaard) para cargas pontuais, lineares e retangulares.
3.  **Recalque por Adensamento:** Análise de recalques primários em argilas compressíveis.
4.  **Resistência ao Cisalhamento:** Processamento de dados de ensaios triaxiais e cisalhamento direto.
