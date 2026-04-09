# 🔍 Relatório Completo de Auditoria e Plano de Migração — EduSolos

---

## Sumário Executivo

Este relatório audita completamente **6 módulos** do EduSolos e propõe um plano de migração detalhado para padronizar a arquitetura da aplicação.

| Grupo | Módulos | Estado |
|-------|---------|--------|
| ✅ Referência (já refatorados) | `indiceslimites`, `granulometria`, `compactacao` | `src/modulos/` — Padrão-alvo |
| ❌ Rascunhos (a migrar) | `tensoes`, `acrescimoTensoes`, `recalque` | `src/modules/` — Arquitetura legada |

> [!IMPORTANT]
> Os módulos em `src/modules/` são classificados como **rascunhos**. Devem ser completamente refatorados e movidos para `src/modulos/`, seguindo o padrão estabelecido pelos módulos já migrados.

---

## 1. Arquitetura de Referência — Módulos Refatorados

### 1.1 Padrão Estrutural Adotado

Cada módulo refatorado em `src/modulos/` segue esta estrutura canônica:

```
src/modulos/<nome-modulo>/
├── calculos.ts          # Matemática pura, zero UI, zero side-effects
├── types.ts             # Tipos e interfaces do módulo (ou schemas Zod)
├── store.ts             # Zustand store (in-memory, sem persistência)
├── exemplos.ts          # Dados de exemplo para o DialogExemplos
├── pagina.tsx           # Página principal (export default)
├── common.ts            # Constantes e schemas compartilhados (se aplicável)
└── componentes/         # Subcomponentes do módulo
    ├── DialogExemplos.tsx
    ├── <Grafico>.tsx
    └── <OutrosComponentes>.tsx
```

### 1.2 Convenções Observadas

| Aspecto | Convenção |
|---------|-----------|
| **Idioma dos nomes** | Português (`.ts`/`.tsx` em português: `calculos.ts`, `pagina.tsx`, `componentes/`) |
| **Idioma do código** | Português para variáveis de domínio, inglês para infraestrutura |
| **State Management** | Zustand store local por módulo (sem persistência) |
| **Validação** | Zod schemas em `types.ts` ou `common.ts` |
| **Cálculos** | Funções puras em `calculos.ts`, sem dependência de UI ou store |
| **Componentes compartilhados** | Importados de `@/componentes/compartilhados/` |
| **Exports** | Páginas com `export default` para lazy loading via `React.lazy()` |
| **Layout** | `LayoutDividido` (split-screen dual-sticky) para input ↔ resultados |
| **Exemplos** | `BaseDialogExemplos` compartilhado + dados locais em `exemplos.ts` |
| **Gráficos** | `ContainerGrafico` compartilhado com export via `exportChartAsImage` |
| **Error handling** | `AlertaErro` + `TooltipErro` compartilhados |
| **Resultados** | `LinhaResultado` compartilhado para exibição padronizada |

### 1.3 Detalhamento por Módulo Refatorado

#### `indiceslimites` — Índices Físicos + Limites de Consistência

- **calculos.ts** (575 linhas): Motor de cálculo completo com `calcularIndicesFisicos()`, `calcularLimitesConsistencia()`, múltiplas amostras, estatísticas (CV, desvio padrão). Importa tipos de `@/lib/schemas/`.
- **store.ts** (77 linhas): Zustand com settings globais (Gs, γw, emax, emin), limites (LL/LP), índices (amostra única), result.
- **types.ts** (90 linhas): Tipos locais (`PontoLL`, `PontoLP`, `IndicesFisicosInput`, `CaracterizacaoOutput`).
- **pagina.tsx** (54KB): Página monolítica com tabs (Índices / Limites / Resultados).
- **componentes/**: `DiagramaFases.tsx`, `LimiteLiquidezChart.tsx`, `DialogExemplos.tsx`.
- **exemplos.ts**: 3 exemplos com dados completos de ensaio.

#### `granulometria` — Classificação Granulométrica

- **calculos.ts** (92 linhas): Leve, delega para `@/lib/calculations/classificacao-uscs` e `classificacao-hrb`.
- **store.ts** (41 linhas): Zustand mínimo.
- **types.ts** (69 linhas): Inclui `FRACOES` (configuração visual).
- **pagina.tsx** (21KB): Formulário + Carta de Plasticidade.
- **componentes/**: `CartaPlasticidade.tsx` (34KB — componente complexo!), `DialogExemplos.tsx`.

#### `compactacao` — Ensaio de Compactação

- **calculos.ts** (294 linhas): Polyfit, Newton-Raphson, curva S=100%.
- **store.ts** (99 linhas): ID generator local, pontos dinâmicos (add/remove).
- **types.ts** (40 linhas): Zod schemas com re-export de `common.ts`.
- **common.ts** (15 linhas): `PontoCurvaCompactacaoSchema`.
- **pagina.tsx** (34KB): Formulário dinâmico com tabs de modo de entrada.
- **componentes/**: `CurvaCompactacao.tsx`, `TabelaResultados.tsx`, `DialogExemplos.tsx`.

---

## 2. Auditoria dos Módulos a Migrar (`src/modules/`)

### 2.1 Problemas Globais dos Módulos Antigos

> [!WARNING]
> Todos os módulos em `src/modules/` sofrem dos mesmos problemas estruturais:

| Problema | Descrição |
|----------|-----------|
| **Nomenclatura em inglês** | Pastas (`components/`, `calculations.ts`), contrariando a convenção em português |
| **Sem Zustand store** | Estado gerenciado via `useForm` + `useState` diretamente na página |
| **Páginas em `src/pages/`** | As páginas estão fora do módulo, em `src/pages/*.tsx` |
| **Sem `export default` autônomo** | Precisam de wrappers em `src/pages/` |
| **Imports cruzados com caminhos antigos** | `@/modules/tensoes/`, `@/modules/schemas/`, `@/lib/calculations/` |
| **Sem componentes compartilhados** | Não usam `BarraAcoes`, `CabecalhoModulo`, `LayoutDividido`, etc. |
| **Sem layout split-screen** | Layout ad-hoc com `grid-cols-2` direto na página |
| **`types.ts` é stub vazio** | `export type { } from './schemas';` — sem propósito |
| **`index.ts` com barrel exports** | Não necessário no padrão novo |
| **Código massivo duplicado** | `DiagramaCamadas.tsx` (tensões) ≈ `DiagramaRecalque.tsx` (recalque) — ~80% identico |

---

### 2.2 Módulo `tensoes` (Tensões Geostáticas) — Auditoria Detalhada

#### Inventário de Arquivos

| Arquivo | Tamanho | Papel | Estado |
|---------|---------|-------|--------|
| `calculations.ts` | 9.6 KB (249 linhas) | Motor de cálculo principal | ✅ Funcional, bem estruturado |
| `schemas.ts` | 1.5 KB (42 linhas) | Tipos Zod | ⚠️ Mistura schema+types |
| `types.ts` | 35 bytes | Stub vazio | ❌ Remover |
| `index.ts` | 92 bytes | Barrel export | ❌ Remover |
| `exemplos-tensoes.ts` | 4.5 KB (184 linhas) | 5 exemplos | ✅ Bom conteúdo |
| **Componentes** | | | |
| `DiagramaCamadas.tsx` | 20 KB (438 linhas) | Diagrama interativo de perfil | ⚠️ Duplicado com recalque |
| `DialogCamada.tsx` | 15 KB | Form de edição de camada | ⚠️ Redundante com recalque |
| `DialogConfiguracoes.tsx` | 4 KB | Config global (γw) | ✅ Simples |
| `DialogExemplos.tsx` | 2.6 KB | Seletor de exemplos | ⚠️ Não usa `BaseDialogExemplos` |
| `PerfilTensoes.tsx` | 11.5 KB | Gráfico Recharts | ✅ Funcional |
| `TabelaResultados.tsx` | 5.5 KB | Tabela de resultados | ✅ Funcional |
| `TabelaCamadas.tsx` | 4 KB | Tabela de camadas | ⚠️ Pode ser simplificada |

**Página:** `src/pages/TensoesGeostaticas.tsx` — **36.4 KB (834 linhas!)** — Monolítica, com lógica de form, cálculo, export PDF/Excel, saves, tudo junto.

#### Análise do Motor de Cálculo (`calculations.ts`)

O motor é **tecnicamente correto** mas tem oportunidades de melhoria:

**Pontos Positivos:**
- Lógica de segmentação por profundidade é robusta
- Suporta múltiplos NAs, camadas impermeáveis, aquíferos suspensos
- Franja capilar com sucção negativa

**Problemas e Sugestões de Melhoria:**

1. **Função `getHidrologiaCamada` é excessivamente complexa** (linhas 30-83):
   - Mistura 4 regras de negócio em uma closure
   - A check `tem_impermeavel_acima` (linha 68) reescaneia todas as camadas acima, mas o loop de `j=index-1` descendo (linhas 51-64) já fazia isso → **redundância**
   - A validação "frouxa" `profundidade_total * 1.5` (linha 73) é um número mágico sem justificativa técnica
   - **Sugestão**: Extrair para uma função separada `resolverHidrologiaPontoMedio()` com interface clara

2. **Ausência de Ko por camada na saída**:
   - Ko é usado para calcular σ'h mas o output `TensaoPonto` não identifica a camada de origem
   - **Sugestão**: Adicionar `camada_index` ao TensaoPonto para rastreabilidade

3. **Sem cálculo de γ submerso (γ')**:
   - O cálculo mostra σ'v mas não calcula γ' = γsat - γw, que é útil didaticamente
   - **Sugestão**: Adicionar γ' à saída por segmento

4. **Sem suporte a sobrecarga superficial**:
   - O módulo ignora sobrecargas (q0). Em problemas reais, é comum ter carga na superfície
   - **Sugestão**: Adicionar campo opcional `sobrecarga_superficial` ao input

5. **Sem tensão horizontal total**:
   - Calcula σ'h = Ko × σ'v, mas não calcula σh = σ'h + u
   - **Sugestão**: Adicionar `tensao_total_horizontal` ao output

6. **Deduplicação de pontos é frágil** (linhas 218-237):
   - O código tem comentários extensos sobre edge cases não resolvidos
   - Usa `toFixed(4)` como chave — pode falhar com precision issues
   - **Sugestão**: Usar EPSILON comparison e merge com prioridade no último valor

7. **Sem validação de consistência física**:
   - Não valida se γnat < γsat (seria fisicamente inconsistente)
   - Não avisa se camada tem γnat E γsat mas a relação é impossível
   - **Sugestão**: Adicionar validações com `aviso` (não bloqueante)

8. **Sem cálculo de tensão em profundidades intermediárias**:
   - Calcula apenas nas transições de camada/NA
   - **Sugestão**: Adicionar opção de discretização por step para gráficos mais suaves

#### Análise da Página (`TensoesGeostaticas.tsx`)

A página de 834 linhas é o **maior anti-padrão** do módulo:

- **Mistura concerns**: form validation, cálculo, export PDF, export Excel, saved calculations, tour
- **useForm com zodResolver** inline (não no store)
- **Não usa `LayoutDividido`**: Layout manual com `grid-cols-2`
- **Não usa `CabecalhoModulo`**: Header manualmente recriado
- **Não usa `BarraAcoes`**: Ações recriadas manualmente... mas importa `CalculationActions`! (inconsistência)
- **Estado na página**: `results`, `isCalculating`, `apiError`, `saveDialogOpen`, etc — deveria estar no Zustand
- **Transfer NA logic** (`transferirNAParaCamadaCorreta`): Lógica de domínio na página, deveria estar em `calculos.ts`

---

### 2.3 Módulo `acrescimoTensoes` (Acréscimo de Tensões)

#### Inventário

| Arquivo | Tamanho | Papel | Estado |
|---------|---------|-------|--------|
| `calculations.ts` | 24.7 KB (1013 linhas!) | Motor completo: Boussinesq, Carothers, Love, Newmark | ⚠️ Arquivo muito grande |
| `schemas.ts` | 2.5 KB (68 linhas) | Tipos Zod para cargas e pontos | ✅ Bem definido |
| `types.ts` | 35 bytes | Stub vazio | ❌ Remover |
| `index.ts` | 121 bytes | Barrel export (quebrado — ref `./examples`) | ❌ Corrigir/Remover |
| `exemplos-newmark.ts` | 4.2 KB | 4 exemplos Newmark | ✅ Bom conteúdo |
| **Componentes (18!)** | | | |
| `CanvasNewmark.tsx` | 66.6 KB! | Canvas 2D interativo Newmark | ⚠️ Monólito gigante |
| `Canvas2DInterativo.tsx` | 36.9 KB | Canvas base | ⚠️ Duplicação massiva |
| `CanvasBoussinesq.tsx` | 33.9 KB | Canvas Boussinesq | ⚠️ Clone do base |
| `CanvasCarothers.tsx` | 37.4 KB | Canvas Carothers | ⚠️ Clone do base |
| `CanvasLove.tsx` | 37.5 KB | Canvas Love | ⚠️ Clone do base |
| `PainelResultados.tsx` | 27 KB | Painel de resultados complexo | ⚠️ Monolítico |
| `NewmarkAnalise.tsx` | 21.7 KB | Análise Newmark | ⚠️ Grande |
| `BoussinesqAnalise.tsx` | 16.4 KB | Análise Boussinesq | ⚠️ Repetitivo |
| `CarothersAnalise.tsx` | 17 KB | Análise Carothers | ⚠️ Repetitivo |
| `LoveAnalise.tsx` | 16.7 KB | Análise Love | ⚠️ Repetitivo |
| Outros (8 popups/dialogs) | ~40 KB total | | ⚠️ Fragmentação excessiva |

**Total de componentes: ~370 KB** — O maior módulo do projeto inteiro.

**Páginas:** 5 páginas em `src/pages/`:
- `AcrescimoTensoes.tsx` (9 KB) — Hub de seleção de método
- `acrescimo-tensoes/Boussinesq.tsx`
- `acrescimo-tensoes/Love.tsx`  
- `acrescimo-tensoes/Carothers.tsx`
- `acrescimo-tensoes/Newmark.tsx`

#### Problemas Críticos

1. **Duplicação massiva de Canvas**: 4 Canvas (~37KB cada) com ~85% de código idêntico
2. **Duplicação de Análise**: 4 componentes `*Analise.tsx` (~16KB cada) com ~70% idêntico
3. **Import quebrado**: `index.ts` referencia `./examples` que não existe (é `./exemplos-newmark`)
4. **Tabela de Newmark hardcoded**: 600+ linhas de dados tabelados inline
5. **Sem store**: Todo estado na página
6. **Rotas fragmentadas**: 5 rotas para o que poderia ser 1 com tabs/subtabs

---

### 2.4 Módulo `recalque` (Recalque por Adensamento)

#### Inventário

| Arquivo | Tamanho | Papel | Estado |
|---------|---------|-------|--------|
| *(sem calculos.ts ou types.ts locais!)* | | | ❌ Cálculos em `@/lib/calculations/` |
| **Componentes** | | | |
| `DiagramaRecalque.tsx` | 42.2 KB (895 linhas) | Diagrama interativo | ⚠️ Clone do DiagramaCamadas |
| `DialogCamadaRecalque.tsx` | 15.2 KB | Form camada argila | ⚠️ Redundante |
| `DialogCamadaBase.tsx` | 3.1 KB | Config camada base | ✅ Simples |
| `DialogCamadaAterro.tsx` | 8.7 KB | Config aterro | ✅ Funcional |
| `DialogExemplos.tsx` | 11.2 KB | Exemplos com cálculo inline | ⚠️ Não usa BaseDialogExemplos |

**Página:** `src/pages/RecalqueAdensamento.tsx` — **77 KB!** — É o maior arquivo do projeto inteiro. Monolítico.

**Motor de cálculo:** Está em `src/lib/calculations/`:
- `recalque-adensamento.ts` (10.1 KB)
- `tempo-adensamento.ts` (4.3 KB)

#### Problemas Críticos

1. **Sem `calculos.ts` local**: Os cálculos estão em `@/lib/calculations/` — quebra o encapsulamento
2. **Sem `types.ts` local**: Tipos em `@/lib/schemas/outros-modulos.ts`
3. **Página de 77KB**: Impossível de manter. Precisa ser dividida em ≥5 arquivos
4. **`DiagramaRecalque.tsx` é clone mutado do `DiagramaCamadas.tsx`**: ~80% duplicação com adição de:
   - Sistema de períodos (passado/presente/futuro)
   - Camada base fixa
   - Camadas de aterro
   - Parâmetros de adensamento (Cc, Cr, Cv, e0)

---

## 3. Análise Comparativa Detalhada

### 3.1 O que foi adicionado nos módulos novos (vs antigos)

| Feature | Módulos Novos | Módulos Antigos |
|---------|--------------|-----------------|
| Zustand store | ✅ `store.ts` por módulo | ❌ useState na página |
| LayoutDividido | ✅ Split-screen dual-sticky | ❌ Grid manual |
| CabecalhoModulo | ✅ Header padronizado | ❌ Header ad-hoc |
| BarraAcoes | ✅ Ações centralizadas | ⚠️ Parcial (importa mas recria) |
| BaseDialogExemplos | ✅ Exemplos padronizados | ❌ Dialogs custom |
| ContainerGrafico | ✅ Com export integrado | ❌ Export ad-hoc |
| LinhaResultado | ✅ Display padronizado | ❌ Display ad-hoc |
| AlertaErro | ✅ Error handling padrão | ❌ Alert custom |
| BotaoLimpar | ✅ Compartilhado | ❌ Inline |
| DefinicaoTooltip | ✅ Tooltips educacionais | ❌ Tooltips simples |
| Cálculos salvos | ❌ Removido dos novos? | ✅ Implementado (via `useSavedCalculations`) |
| Export PDF/Excel | ❌ Via BarraAcoes | ✅ Implementado inline |
| Print view | ❌ Via PrintHeader | ✅ Implementado |
| Keyboard navigation | ✅ `handleArrowNavigation` | ❌ Ausente |

### 3.2 O que foi descartado na migração dos primeiros módulos

1. **Barrel exports (`index.ts`)**: Removidos — cada módulo é auto-contido
2. **Types stub**: Removido — tipos ficam em `types.ts` diretamente
3. **Schemas separados**: Integrados em `types.ts` ou `common.ts`
4. **Páginas em `src/pages/`**: Movidas para `pagina.tsx` dentro do módulo
5. **Estado na página**: Movido para Zustand store

### 3.3 Padronização Visual e UI/UX — Padrões a Seguir

> [!IMPORTANT]
> Todos os módulos migrados **devem** replicar a linguagem visual e os padrões de UX estabelecidos pelos módulos refatorados. Os módulos antigos possuem estilos ad-hoc e inconsistentes que **não devem** ser mantidos na migração.

#### A. Sistema de Design (`UI_STANDARDS`)

O projeto define um objeto de constantes visuais em `src/lib/ui-standards.ts` que **todos os módulos devem usar**:

| Token | Valor/Uso |
|-------|-----------|
| `UI_STANDARDS.pageContainer` | Container da página: `container mx-auto py-0 space-y-5 max-w-7xl animate-in fade-in duration-500` |
| `UI_STANDARDS.header.*` | Header padronizado: ícone em box 12×12 com borda `primary/30`, título `text-3xl font-bold`, subtítulo `text-muted-foreground text-sm` |
| `UI_STANDARDS.card.root` | `"glass border-primary/20"` — Cards com glassmorphism e borda sutil |
| `UI_STANDARDS.card.header` | Gradiente sutil `from-primary/5 to-transparent`, padding uniforme |
| `UI_STANDARDS.card.title` | `text-base font-semibold` com ícone `gap-2` |
| `UI_STANDARDS.form.*` | Inputs e labels padronizados |
| `UI_STANDARDS.animations.*` | Animações de entrada consistentes |

**Problema nos módulos antigos**: Tensões Geostáticas usa `bg-gradient-to-br from-emerald-500 via-green-500 to-teal-600` hardcoded no header — diverge completamente do padrão. O `CabecalhoModulo` usa `border border-primary/30 bg-primary/5` com o ícone simples.

#### B. Componentes Visuais Compartilhados Obrigatórios

Cada módulo migrado deve usar estes componentes em vez de recriar equivalentes:

| Componente | Função | Arquivo |
|------------|--------|---------|
| `CabecalhoModulo` | Header com ícone + título + subtítulo + ações (separadores automáticos entre ações) | `compartilhados/CabecalhoModulo.tsx` |
| `LayoutDividido` | Split-screen dual-sticky (ambos os painéis sticky) com proporção configurável (`1fr 1fr`, `6fr 4fr`, etc.) | `compartilhados/LayoutDividido.tsx` |
| `LinhaResultado` | Display de resultado: símbolo serif italic + label + valor mono + unidade, com `DefinicaoTooltip` integrado | `compartilhados/LinhaResultado.tsx` |
| `AlertaErro` | Alerta de erro com ícone padronizado | `compartilhados/AlertaErro.tsx` |
| `TooltipErro` | Badge de erro inline para campos de formulário | `compartilhados/TooltipErro.tsx` |
| `BotaoLimpar` | Botão de limpar com confirmação | `compartilhados/BotaoLimpar.tsx` |
| `BarraAcoes` | Barra de ações (salvar, carregar, export PDF/Excel) | `compartilhados/BarraAcoes.tsx` |
| `ContainerGrafico` | Wrapper de gráfico com botão de expandir/exportar | `compartilhados/ContainerGrafico.tsx` |
| `DefinicaoTooltip` | Tooltip educacional com glossário integrado por ID | `components/ui/DefinicaoTooltip.tsx` |

**Problema nos módulos antigos**: Nenhum destes é usado. Headers são recriados manualmente, layouts são `grid-cols-2` ad-hoc, resultados são exibidos com markup custom, erros usam `Alert` genérico.

#### C. Estilo Visual — Diretrizes Específicas

**Cards e Containers:**
- **Classe base**: `glass border-primary/20` — efeito glassmorphism com borda sutil da cor primária
- **Header do card**: Sempre com gradiente `bg-gradient-to-r from-primary/5 to-transparent`
- **Título do card**: `text-xs font-semibold text-muted-foreground uppercase tracking-wider` para subtítulos internos (como "Diagrama de Fases")
- **Não usar**: Cores específicas como `emerald-500`, `green-500`, `teal-600` — manter tudo na paleta `primary`

**Tipografia de Resultados (`LinhaResultado`):**
- Símbolo: `font-serif italic font-bold text-lg` (ex: *γ*<sub>d</sub>)
- Label: `text-xs opacity-90` quando há símbolo, `text-sm` quando não há
- Valor: `font-mono font-semibold text-[15px]`
- Unidade: `text-[11px] font-medium`
- Integração obrigatória com `definicoes.ts` para tooltips educacionais

**Formulários e Inputs:**
- **Inputs compactos**: `h-7 text-center text-[13px]` para tabelas densas (como os pontos LL/LP)
- **Grids de entrada**: Usar `grid-cols-[tamanhos]` com `gap-1` para formulários tabulares
- **Navegação por setas**: `handleArrowNavigation` obrigatório em todos os containers de input
- **Validação inline**: `TooltipErro` nos inputs (sem alerts invasivos)

**Animações de Entrada:**
- Page container: `animate-in fade-in duration-500`
- Painel esquerdo: `animate-in slide-in-from-left-5 duration-300`
- Painel direito: `animate-in slide-in-from-right-5 duration-300`
- Seções internas: `animate-in fade-in slide-in-from-left-4 duration-500`

**Ícones no Header:**
- Usar box de ícone padronizado: `w-12 h-12 rounded-xl border border-primary/30 bg-primary/5`
- Ícone interno: `w-6 h-6 text-primary`
- **Não usar**: Gradientes coloridos no box do ícone (como o `from-emerald-500` das tensões)
- Efeito hover: `hover:border-primary/60 hover:bg-primary/10`

#### D. Layout Split-Screen — Padrão Obrigatório

O `LayoutDividido` impõe a seguinte ergonomia:

- **Esquerda (sticky)**: Formulário e inputs — scroll independente
- **Direita (sticky)**: Resultados e gráficos — acompanha o scroll
- **Proporções usadas**: `1fr 1fr` (padrão), `6fr 4fr` (indiceslimites no step dados)
- **Props obrigatórias**: `sticky={true}` para comportamento dual-sticky
- **Responsivo**: `flex-col` em mobile, `lg:grid` em desktop

**Nos módulos antigos**: Tensões usa `grid grid-cols-1 md:grid-cols-2 gap-4` direto na página, sem sticky, sem proporção configurável, sem animações de entrada. Recalque nem divide a tela — é um scroll vertical gigante.

#### E. Impacto Visual nos Módulos a Migrar

| Aspecto | Tensões (atual) | Tensões (pós-migração) |
|---------|----------------|----------------------|
| Header | Gradiente emerald hardcoded, título inline | `CabecalhoModulo` com ícone em box primary |
| Layout | `grid-cols-2` manual | `LayoutDividido` dual-sticky |
| Resultados | Tabela custom com CSS inline | `LinhaResultado` + `DefinicaoTooltip` |
| Cards | Sem `glass`, sem gradiente no header | `UI_STANDARDS.card.*` |
| Erros | `Alert` genérico na página | `AlertaErro` compartilhado |
| Gráficos | Container custom sem export | `ContainerGrafico` com export integrado |
| Exemplos | Dialog custom | `BaseDialogExemplos` |
| Limpar | `Button` inline | `BotaoLimpar` com confirmação |
| Inputs | Sem arrow navigation | `handleArrowNavigation` |
| Tooltips | Tooltip simples | `DefinicaoTooltip` com glossário |
| Animações | `animate-in` inconsistente | `UI_STANDARDS.animations.*` |

---

## 4. Tensões Geostáticas — Relatório Detalhado de Melhorias

> [!NOTE]  
> Este módulo é o mais didaticamente importante do projeto. O refatoramento deve melhorar não apenas a estrutura do código, mas a **experiência educacional**.

### 4.1 Melhorias Estruturais (Obrigatórias)

#### A. Migrar para `src/modulos/tensoes-geostaticas/`

```
src/modulos/tensoes-geostaticas/
├── calculos.ts              # Mantém cálculo atual + melhorias
├── types.ts                 # Tipos locais (migrar de schemas.ts)
├── store.ts                 # NOVO: Zustand store
├── exemplos.ts              # Migrar de exemplos-tensoes.ts
├── pagina.tsx               # Migrar de TensoesGeostaticas.tsx (reduzir de 834→~200 linhas)
├── common.ts                # Constantes compartilhadas (CORES_SOLO, etc)
└── componentes/
    ├── DiagramaPerfil.tsx    # REFATORADO: Extrair de DiagramaCamadas (componente universal)
    ├── PerfilTensoes.tsx     # Manter (gráfico Recharts)
    ├── TabelaResultados.tsx  # Manter
    ├── DialogCamada.tsx      # Manter (simplificado)
    ├── DialogExemplos.tsx    # REFATORAR: Usar BaseDialogExemplos
    └── FormularioEntrada.tsx # NOVO: Extrair formulário da página
```

#### B. Criar Zustand Store

```typescript
// store.ts
interface TensoesGeostaticasState {
  camadas: CamadaForm[];
  config: { pesoEspecificoAgua: string };
  resultado: TensoesGeostaticasOutput | null;
  isCalculating: boolean;
  erro: string | null;
  
  addCamada: () => void;
  removeCamada: (index: number) => void;
  updateCamada: (index: number, data: Partial<CamadaForm>) => void;
  updateConfig: (data: Partial<ConfigData>) => void;
  setResultado: (r: TensoesGeostaticasOutput | null) => void;
  reset: () => void;
}
```

#### C. Implementar `LayoutDividido`

- **Esquerda (sticky)**: `DiagramaPerfil` interativo + botão calcular
- **Direita (sticky)**: Tabs com Tabela / Perfil de Tensões

### 4.2 Melhorias Funcionais (Recomendadas)

#### D. Diagrama de Perfil Universal (`common.ts` → compartilhado)

O `DiagramaCamadas.tsx` e `DiagramaRecalque.tsx` são clones. Proposta:

```typescript
// src/componentes/compartilhados/DiagramaPerfil.tsx
interface DiagramaPerfilProps {
  camadas: CamadaVisual[];
  niveisAgua?: NivelAgua[];
  interactive?: boolean;
  mode?: 'tensoes' | 'recalque';  // Adapta visual
  showPeriodos?: boolean;          // Para recalque
  onAddCamada?: (data: CamadaData) => void;
  onEditCamada?: (index: number, data: CamadaData) => void;
}
```

Isso elimina **~60KB de duplicação** entre os dois módulos.

#### E. Motor de Cálculo — Melhorias Específicas

1. **Adicionar campo `sobrecarga_superficial`** ao input:
   ```typescript
   sobrecarga_superficial?: number; // kPa — σ0 na superfície
   ```
   → No ponto z=0: σv = q0 (ao invés de 0)

2. **Adicionar γ' (peso específico submerso)** à saída por ponto:
   ```typescript
   interface TensaoPonto {
     // ...existentes...
     peso_especifico_usado?: number;        // γ usado no segmento
     peso_especifico_submerso?: number;      // γ' = γsat - γw (se saturado)
   }
   ```

3. **Adicionar tensão horizontal total**:
   ```typescript
   tensao_total_horizontal?: number; // σh = σ'h + u
   ```

4. **Validações com avisos** (não bloqueantes):
   ```typescript
   interface TensoesGeostaticasOutput {
     pontos_calculo: TensaoPonto[];
     avisos?: string[];  // NOVO
     erro?: string;
   }
   ```
   - Avisar se γnat > γsat (fisicamente impossível)
   - Avisar se Ko > 1 (solo pré-adensado — não necessariamente erro, mas atípico)
   - Avisar se NA está acima da superfície (enchente — válido, mas raro)

5. **Discretização opcional** para gráficos mais suaves:
   ```typescript
   interface TensoesGeostaticasInput {
     // ...existentes...
     intervalo_discretizacao?: number; // Ex: 0.5m — adiciona pontos intermediários
   }
   ```

6. **Refatorar `getHidrologiaCamada`**:
   - Extrair para função top-level (`resolverHidrologia`)
   - Remover redundância na busca ascendente
   - Documentar regras de herança de NA com exemplos

### 4.3 Melhorias de UX (Sugeridas)

#### F. Indicadores Visuais no Diagrama

1. **Seta de resultado no diagrama**: Mostrar σ'v no ponto clicado
2. **Tooltip interativo**: Hover sobre camada mostra todos os parâmetros
3. **Gradiente de saturação**: Transição suave na zona capilar (não abrupta)
4. **Código de cores por estado**: Seco / Capilar / Saturado com legenda

#### G. Modo Tutorial Integrado

- Botão "Modo Didático" que mostra **passo a passo do cálculo**
- Para cada ponto: mostra quais γ foram usados, como u foi calculado, qual regra de NA se aplicou
- Mostra fórmulas ao lado dos resultados (σv = Σγi·hi, etc.)

#### H. Comparação de Cenários

- Permitir calcular 2 perfis lado a lado (ex: com e sem franja capilar)
- Destacar diferenças em amarelo na tabela de resultados

---

## 5. Plano de Migração — Fase a Fase

### Fase 0: Infraestrutura Compartilhada (Pré-requisito)

> [!TIP]
> Fazer ANTES de migrar qualquer módulo.

- [ ] Criar `DiagramaPerfil` universal em `src/componentes/compartilhados/`
  - Extrair lógica comum de `DiagramaCamadas.tsx` e `DiagramaRecalque.tsx`
  - Suportar modos `tensoes` e `recalque` via props
  - Reutilizar `CORES_SOLO`, `misturarCores()`, `getCorTexto()`, `seededRandom()`
- [ ] Criar `DialogCamadaGenerico` em `src/componentes/compartilhados/`
  - Props configuráveis para quais campos mostrar (Cc/Cr/Cv/e0 são específicos de recalque)
- [ ] Extrair `CORES_SOLO` e helpers visuais para `src/lib/constants/cores-solo.ts`

### Fase 1: Tensões Geostáticas → `src/modulos/tensoes-geostaticas/`

**Estado: ✅ CONCLUÍDO** | **Prioridade: Alta** | **Estimativa: 1-2 sessões** | **Dependências: Fase 0**

#### 1a. Estrutura de Arquivos (✅ Concluído)
- [x] Criar `src/modulos/tensoes-geostaticas/types.ts` (migrar de `schemas.ts`)
- [x] Criar `src/modulos/tensoes-geostaticas/calculos.ts` (migrar + melhorias §4.2)
- [x] Criar `src/modulos/tensoes-geostaticas/store.ts` (Zustand — puro state container)
- [x] Criar `src/modulos/tensoes-geostaticas/exemplos.ts` (migrar + renomear para pt-BR)
- [x] Migrar componentes:
  - `PerfilTensoes.tsx` → manter em `componentes/`
  - `TabelaResultados.tsx` → manter em `componentes/`
  - `DialogExemplos.tsx` → refatorar para `BaseDialogExemplos`
  - `DialogConfiguracoes.tsx` → layout compacto (grid-cols-2)
  - `DiagramaPerfil.tsx` → criado como componente **local** (Fase 0 do universal ainda pendente)
- [x] Criar `pagina.tsx` (~260 linhas):
  - Usar `LayoutDividido`
  - Usar `CabecalhoModulo`
  - Cálculo via `useAutoCalculo` (store = puro container, cálculo na página)
- [x] Atualizar `App.tsx`: Apontar rota `/tensoes` para novo módulo

#### 1b. Limpeza (✅ Concluído)
- [x] Remover `src/pages/TensoesGeostaticas.tsx`
- [x] Remover `src/modules/tensoes/`
- [x] Padronização: Remover funcionalidades depreciadas (Save/Export manual) conforme novo padrão corporativo.
- [x] Corrigir bug `DialogConfiguracoes.tsx` (`onOpenChange` → `setOpen`)

#### 1c. Conformidade com Padrões (✅ Concluído)
- [x] Adicionar `AlertaErro` para exibição de erros persistente
- [x] Adicionar `LinhaResultado` no painel de resultados
- [x] Adicionar `DefinicaoTooltip` nos campos de entrada
- [x] Implementar `useAutoCalculo` (cálculo automático)
- [x] Adicionar `handleArrowNavigation`
- [x] Padronizar Cards com `UI_STANDARDS` tokens
- [x] Adicionar animações de entrada
- [x] Adicionar docstrings de cabeçalho
- [x] Card placeholder quando sem resultado
- [x] Ícones nos tabs e remoção de camada na UI

### Fase 2: Acréscimo de Tensões → `src/modulos/acrescimo-tensoes/`

**Prioridade: Alta** | **Estimativa: 2-3 sessões** | **Dependências: Fase 0**

> [!CAUTION]
> Este é o módulo mais complexo (370KB de componentes). A refatoração deve ser **agressiva** na eliminação de duplicação.

- [ ] Criar `src/modulos/acrescimo-tensoes/types.ts` (migrar schemas)
- [ ] Criar `src/modulos/acrescimo-tensoes/calculos.ts` (migrar calculations)
  - Extrair tabela Newmark para `dados-newmark.ts` (arquivo de dados separado)
  - Manter `interpolacaoLinear` como utility (talvez `@/lib/utils/`)
- [ ] Criar `src/modulos/acrescimo-tensoes/store.ts`
- [ ] Criar `src/modulos/acrescimo-tensoes/exemplos.ts`
- [ ] **Refatorar Canvas**:
  - Criar `CanvasBase.tsx` com toda lógica de zoom, pan, grid, escala
  - 4 Canvas específicos herdam/compõem sobre o base (~80% redução)
- [ ] **Refatorar Análise**:
  - Criar `AnaliseBase.tsx` com layout de formulário + resultado
  - 4 análises específicas fornecem apenas os campos e lógica de submit
- [ ] **Consolidar rotas**:
  - De 5 rotas para 1 rota com tabs: `/acrescimo-tensoes?metodo=boussinesq`
  - `pagina.tsx` com tabs: Boussinesq / Carothers / Love / Newmark
- [ ] Atualizar `App.tsx`
- [ ] Remover `src/pages/AcrescimoTensoes.tsx` e `src/pages/acrescimo-tensoes/`
- [ ] Remover `src/modules/acrescimoTensoes/`

### Fase 3: Recalque → `src/modulos/recalque/`

**Prioridade: Média** | **Estimativa: 2-3 sessões** | **Dependências: Fase 0, Fase 1**

- [ ] Migrar cálculos de `@/lib/calculations/recalque-adensamento.ts` → `calculos.ts`
- [ ] Migrar cálculos de `@/lib/calculations/tempo-adensamento.ts` → `calculos.ts` ou `calculos-tempo.ts`
- [ ] Migrar tipos de `@/lib/schemas/outros-modulos.ts` → `types.ts`
- [ ] Criar `store.ts`
- [ ] Criar `exemplos.ts` (consolidar os exemplos inline do DialogExemplos)
- [ ] Substituir `DiagramaRecalque.tsx` pelo `DiagramaPerfil` universal
- [ ] Dividir `RecalqueAdensamento.tsx` (77KB) em:
  - `pagina.tsx` (~200 linhas — orquestração)
  - `componentes/FormularioPerfil.tsx`
  - `componentes/FormularioParametros.tsx`
  - `componentes/ResultadoRecalque.tsx`
  - `componentes/GraficoAdensamento.tsx`
  - `componentes/TabelaTempo.tsx`
- [ ] Atualizar `App.tsx`
- [ ] Remover `src/pages/RecalqueAdensamento.tsx`
- [ ] Remover `src/modules/recalque/`

### Fase 4: Limpeza Final

- [ ] Remover `src/modules/` (diretório inteiro)
- [ ] Remover `src/pages/` (se vazio)
- [ ] Remover schemas órfãos de `@/lib/schemas/`:
  - `acrescimo-tensoes.ts` (migrado)
  - `tensoes-geostaticas.ts` (migrado)
  - `outros-modulos.ts` (migrado)
- [ ] Remover cálculos órfãos de `@/lib/calculations/`:
  - `recalque-adensamento.ts` (migrado)
  - `tempo-adensamento.ts` (migrado)
- [ ] Atualizar `@/lib/schemas/index.ts` e `@/lib/calculations/index.ts`
- [ ] Verificar que nenhum import aponta para `@/modules/`
- [ ] Build & testes manuais de cada módulo
- [ ] Atualizar versão para `1.2.0`

---

## 6. Estimativas e Prioridades

| Fase | Complexidade | Risco | Prioridade | Dependências |
|------|-------------|-------|------------|--------------|
| Fase 0 | Média | Baixo | **Máxima** | — |
| Fase 1 (Tensões) | Média | Baixo | **Alta** | Fase 0 |
| Fase 2 (Acréscimo) | **Alta** | **Médio** | **Alta** | Fase 0 |
| Fase 3 (Recalque) | **Alta** | **Médio** | Média | Fase 0, 1 |
| Fase 4 (Limpeza) | Baixa | Baixo | Após todas | Todas |

### Redução de Código Estimada

| Módulo | Antes | Depois (estimado) | Redução |
|--------|-------|--------------------|---------|
| Tensões Geostáticas | ~110 KB (page + components) | ~50 KB | **~55%** |
| Acréscimo de Tensões | ~380 KB (pages + components) | ~150 KB | **~60%** |
| Recalque | ~155 KB (page + components) | ~70 KB | **~55%** |
| **Total** | **~645 KB** | **~270 KB** | **~58%** |

> [!IMPORTANT]
> A redução de 58% vem principalmente da eliminação de duplicação (Canvas, Diagrama, Análise) e do uso de componentes compartilhados existentes.

---

## 7. Checklist de Conformidade por Módulo

Para cada módulo migrado, verificar:

- [ ] Está em `src/modulos/<nome-em-portugues>/`
- [ ] Tem `calculos.ts` com funções puras (zero UI)
- [ ] Tem `types.ts` com tipos e/ou schemas Zod
- [ ] Tem `store.ts` Zustand (in-memory)
- [ ] Tem `exemplos.ts` com dados de exemplo
- [ ] Tem `pagina.tsx` com `export default`
- [ ] Usa `LayoutDividido` para split-screen
- [ ] Usa `CabecalhoModulo` para header
- [ ] Usa `BarraAcoes` para export/save/load
- [ ] Usa `BaseDialogExemplos` para exemplos
- [ ] Usa `ContainerGrafico` para gráficos
- [ ] Usa `AlertaErro` para erros
- [ ] Usa `LinhaResultado` para resultados individuais
- [ ] Tem keyboard navigation (`handleArrowNavigation`)
- [ ] Nenhum import de `@/modules/` ou `@/pages/`
- [ ] Lazy-loaded em `App.tsx`
- [ ] Nenhum arquivo >300 linhas no módulo (exceto `calculos.ts`)
