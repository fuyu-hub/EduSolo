# 📝 Changelog - EduSolo

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/),
e este projeto adere ao [Versionamento Semântico](https://semver.org/lang/pt-BR/).

## [Não Lançado]

### Planejado
- Sistema de autenticação de usuários
- Salvamento de cálculos na nuvem
- Geração de relatórios PDF aprimorada
- Aplicativo mobile (React Native)
- Módulo de Resistência ao Cisalhamento
- Módulo de Empuxo de Terra
- Módulo de Capacidade de Carga
- Módulo de Estabilidade de Taludes

---

## [0.4.0] - 2025-01-XX

### ✨ Adicionado

#### Backend
- **Módulo de Granulometria**
  - Análise granulométrica completa
  - Cálculo automático de percentuais (pedregulho, areia, finos)
  - Interpolação de diâmetros efetivos (D10, D30, D60)
  - Cálculo de coeficientes Cu e Cc
  - Integração com classificação USCS
  - Endpoint `/analisar/granulometria`

- **Módulo de Classificação USCS**
  - Classificação completa pelo Sistema Unificado
  - Suporte para solos grossos e finos
  - Classificação dupla para solos com 5-12% de finos
  - Carta de Plasticidade integrada
  - Endpoint `/classificar/uscs`

#### Frontend
- **Página de Granulometria** (`/granulometria`)
  - Seletor de peneiras padrão ASTM
  - Entrada de dados por peneira
  - Curva granulométrica interativa (Recharts)
  - Tabela de dados granulométricos
  - Marcadores de D10, D30, D60 no gráfico
  - Classificação USCS automática
  - Exemplos pré-configurados
  - Exportação para PDF

- **Componentes Novos**
  - `CurvaGranulometrica`: Gráfico de curva granulométrica
  - `SeletorPeneiras`: Interface para seleção de peneiras
  - `TabelaDadosGranulometricos`: Tabela de resultados
  - `DialogExemplos`: Diálogo com exemplos de ensaios

### 🔧 Melhorado
- Validação de dados de entrada aprimorada
- Mensagens de erro mais descritivas
- Performance de cálculos otimizada
- Interface responsiva melhorada

### 📚 Documentação
- Documentação completa de API no README do backend
- Documentação de módulos técnicos (MODULES.md)
- Guia de contribuição (CONTRIBUTING.md)
- Exemplos de uso de todos os endpoints

---

## [0.3.0] - 2025-01-XX

### ✨ Adicionado

#### Backend
- **Módulo de Fluxo Hidráulico**
  - Cálculo de permeabilidade equivalente (horizontal e vertical)
  - Velocidades de descarga e percolação
  - Gradiente hidráulico crítico
  - Fator de segurança contra liquefação
  - Análise de tensões sob fluxo (ascendente/descendente)
  - Endpoint `/analisar/fluxo-hidraulico`

#### Frontend
- Visualização de análise de fluxo
- Gráficos de tensões com fluxo
- Indicadores de segurança contra liquefação

### 🔧 Melhorado
- Validação de multicamadas
- Cálculo de tensões efetivas sob fluxo
- Interface de entrada de dados

---

## [0.2.0] - 2024-12-XX

### ✨ Adicionado

#### Backend
- **Módulo de Tensões Geostáticas**
  - Cálculo de tensões verticais totais
  - Pressões neutras (efeito do NA)
  - Tensões efetivas (princípio de Terzaghi)
  - Tensões horizontais (coeficiente K₀)
  - Suporte a múltiplas camadas
  - Efeito de capilaridade
  - Endpoint `/calcular/tensoes-geostaticas`

- **Módulo de Acréscimo de Tensões**
  - Solução de Boussinesq (carga pontual)
  - Carga em faixa infinita
  - Carga circular uniformemente distribuída
  - Endpoint `/calcular/acrescimo-tensoes`

- **Módulo de Adensamento**
  - Recalque por adensamento primário
  - Teoria de Terzaghi
  - Solos NC, SA e transição
  - Endpoint `/calcular/recalque-adensamento`
  - Endpoint `/calcular/tempo-adensamento`

- **Módulo de Compactação**
  - Curva de compactação (Proctor)
  - Determinação de w_ot e γd,max
  - Curva de saturação (S = 100%)
  - Endpoint `/calcular/compactacao`

#### Frontend
- **Página de Tensões** (`/tensoes`)
  - Editor de camadas de solo
  - Configuração de nível d'água
  - Gráficos de tensões vs profundidade
  - Tabela de resultados

- **Página de Acréscimo de Tensões** (`/acrescimo-tensoes`)
  - Seleção de tipo de carga
  - Entrada de parâmetros geométricos
  - Visualização 3D do problema
  - Cálculo de Δσᵥ

- **Página de Compactação** (`/compactacao`)
  - Entrada de dados de Proctor
  - Curva de compactação interativa
  - Identificação de ponto ótimo
  - Curva de saturação

### 🔧 Melhorado
- Sistema de salvamento local (localStorage)
- Exportação para PDF melhorada
- Tema escuro aprimorado
- Responsividade mobile

### 📚 Documentação
- README do backend atualizado
- README do frontend atualizado
- Documentação de endpoints da API

---

## [0.1.0] - 2024-11-XX

### ✨ Adicionado - Release Inicial

#### Backend (FastAPI)
- Estrutura base da API
- **Módulo de Índices Físicos**
  - Cálculo de pesos específicos (γₙₐₜ, γd, γsₐₜ, γ')
  - Índice de vazios e porosidade
  - Grau de saturação
  - Compacidade relativa
  - Endpoint `/calcular/indices-fisicos`

- **Módulo de Limites de Consistência**
  - Limite de Liquidez (método Casagrande)
  - Limite de Plasticidade
  - Índice de Plasticidade
  - Índice de Consistência
  - Atividade da argila
  - Carta de Plasticidade
  - Endpoint `/calcular/limites-consistencia`

- Validação com Pydantic
- Documentação automática (Swagger/ReDoc)
- CORS configurado
- Estrutura modular

#### Frontend (React + TypeScript)
- Estrutura base com Vite
- **Página Index** (landing page)
- **Dashboard** com cards de módulos
- **Página de Índices Físicos** (`/indices-fisicos`)
  - Formulário com validação
  - Diagrama de fases interativo
  - Resultados em tempo real
  - Exemplos pré-configurados
  
- **Página de Limites de Consistência** (`/limites-consistencia`)
  - Entrada de dados de ensaio LL
  - Entrada de dados de LP
  - Gráfico de LL (log golpes)
  - Carta de Plasticidade de Casagrande
  - Classificações automáticas

- **Sistema de Design**
  - Tema claro/escuro (ThemeContext)
  - Componentes shadcn/ui
  - Tailwind CSS
  - Ícones Lucide React

- **Funcionalidades**
  - Roteamento (React Router)
  - Estado global (TanStack Query)
  - Exportação para PDF (jsPDF + html2canvas)
  - Responsividade completa
  - Salvamento local (localStorage)

### 🏗️ Infraestrutura
- Estrutura de projeto organizada
- Scripts de build e desenvolvimento
- Configuração de ESLint e Prettier
- Configuração de Black e Flake8
- Git hooks (pre-commit)

### 📚 Documentação
- README principal
- Instruções de instalação
- Documentação básica de API
- Comentários no código

---

## Tipos de Mudanças

- ✨ **Adicionado**: para novas funcionalidades
- 🔧 **Melhorado**: para mudanças em funcionalidades existentes
- 🔒 **Segurança**: para vulnerabilidades corrigidas
- 🐛 **Corrigido**: para correções de bugs
- 🗑️ **Removido**: para funcionalidades removidas
- 📚 **Documentação**: para mudanças na documentação
- 🚀 **Performance**: para melhorias de performance
- ♻️ **Refatoração**: para mudanças que não afetam funcionalidade

---

[Não Lançado]: https://github.com/seu-usuario/edusolo/compare/v0.4.0...HEAD
[0.4.0]: https://github.com/seu-usuario/edusolo/compare/v0.3.0...v0.4.0
[0.3.0]: https://github.com/seu-usuario/edusolo/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/seu-usuario/edusolo/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/seu-usuario/edusolo/releases/tag/v0.1.0

