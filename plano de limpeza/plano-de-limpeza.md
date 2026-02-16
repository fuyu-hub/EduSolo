# Plano de Limpeza e Reorganização do EduSolo

Plano detalhado para remover código morto, eliminar redundâncias e reorganizar a estrutura do projeto em 3 fases progressivas.

## Situação Atual

O projeto acumulou dívida técnica significativa:
- **~315KB+ de código mobile** (9 páginas + 10 componentes) que será refeito do zero
- **15+ arquivos stub** de re-export por "backward compatibility" espalhados em `components/` e `lib/`
- **Diretórios vazios** (`pages/modules/`, `components/granulometria-teste/`, `components/dashboard/`)
- **Páginas sobrepostas** (`IndicesFisicos.tsx` + `LimitesConsistencia.tsx` vs módulo `Caracterizacao`)
- **Código comentado/bloqueado** (rota Settings duplicada, `WelcomeDialog` ativo)
- **57 componentes UI** do shadcn, muitos potencialmente não utilizados
- **Documentação .md na raíz** do projeto desatualizada e pesada (~130KB)

---

## Fase 1 — Limpeza Superficial *(Risco Baixo)*

Remoção de código claramente morto e não referenciado. Nenhuma alteração de lógica.

### 1.1 Remover Todo Código Mobile

> [!IMPORTANT]
> O mobile será refeito do zero, portanto tudo relacionado pode ser removido.

| Tipo | Arquivos | Tamanho |
|------|----------|---------|
| Páginas mobile | `pages/mobile/*.tsx` (9 arquivos) | ~315KB |
| Componentes mobile | `components/mobile/*.tsx` + `index.ts` (10 arquivos) | ~35KB |
| Bloqueador mobile | `components/MobileBlocker.tsx` | ~1.2KB |
| Hook mobile | `hooks/use-mobile.tsx` | ~1.4KB |

#### Mudanças necessárias:
- [MODIFY] [App.tsx](file:///c:/Users/fsix9/Desktop/projetos%20-%20versões/EduSolo/frontend/src/App.tsx): Remover import `MobileBlocker`, `useIsMobile`, bloco `if (isMobile)`
- [MODIFY] [index.ts](file:///c:/Users/fsix9/Desktop/projetos%20-%20versões/EduSolo/frontend/src/components/index.ts): Remover `export * from './mobile'`
- [DELETE] `pages/mobile/` (pasta inteira)
- [DELETE] `components/mobile/` (pasta inteira)
- [DELETE] `components/MobileBlocker.tsx`
- [DELETE] `hooks/use-mobile.tsx`

### 1.2 Remover Diretórios Vazios

- [DELETE] `pages/modules/` (6 subpastas vazias)
- [DELETE] `components/granulometria-teste/` (vazio)
- [DELETE] `components/dashboard/` (vazio)
- [DELETE] `assets/icons/` (vazio)

### 1.3 Remover Código Comentado e Bloqueado

- [MODIFY] [App.tsx](file:///c:/Users/fsix9/Desktop/projetos%20-%20versões/EduSolo/frontend/src/App.tsx): Remover bloco comentado da rota `/settings` duplicada (linhas 296-305)
- [MODIFY] [App.tsx](file:///c:/Users/fsix9/Desktop/projetos%20-%20versões/EduSolo/frontend/src/App.tsx): Remover `import("./pages/Settings")` comentado no preload (linha 70)

### 1.4 Verificar e Limpar WelcomeDialog

- Confirmar se `WelcomeDialog` deve permanecer ativo no `App.tsx` (está renderizando globalmente)
- Se não necessário, remover import e uso em `App.tsx`, e o arquivo `components/WelcomeDialog.tsx`

---

## Fase 2 — Limpeza Profunda *(Risco Médio)*

Remoção de redundâncias estruturais e stubs de compatibilidade.

### 2.1 Eliminar Stubs de Re-export em `components/`

10 arquivos no root de `components/` que apenas redirecionam para subpastas:

| Stub | Redireciona para |
|------|-----------------|
| `CalculationActions.tsx` | `./shared/CalculationActions` |
| `ErrorBoundary.tsx` | `./shared/ErrorBoundary` |
| `ExportPDFDialog.tsx` | `./dialogs/ExportPDFDialog` |
| `FeedbackMessage.tsx` | `./shared/FeedbackMessage` |
| `Layout.tsx` | `./layout/Layout` |
| `OptimizedCard.tsx` | `./shared/OptimizedCard` |
| `PrintHeader.tsx` | `./layout/PrintHeader` |
| `RecentCalculations.tsx` | `./shared/RecentCalculations` |
| `SaveDialog.tsx` | `./dialogs/SaveDialog` |
| `SavedCalculations.tsx` | `./shared/SavedCalculations` |
| `UndoRedoToolbar.tsx` | `./shared/UndoRedoToolbar` |
| `RoutePreloader.tsx` | `./shared/RoutePreloader` |

**Procedimento:** Para cada stub, buscar todos os imports que usam o path antigo (`@/components/ErrorBoundary`), atualizar para o path real (`@/components/shared/ErrorBoundary`), e então deletar o stub.

### 2.2 Eliminar Stubs de Re-export em `lib/`

5 arquivos no root de `lib/` que redirecionam para subpastas:

| Stub | Redireciona para |
|------|-----------------|
| `export-utils.ts` | `./utils/export-utils` |
| `format-number.ts` | `./utils/format-number` |
| `peneiras-padrao.ts` | `./constants/peneiras-padrao` |
| `soil-constants.ts` | `./constants/soil-constants` |
| `tensoes-utils.ts` | `./utils/tensoes-utils` |

### 2.3 Eliminar Stubs Deprecated em `lib/calculations/`

6 arquivos que redirecionam para `modules/`:

| Stub | Redireciona para |
|------|-----------------|
| `acrescimo-tensoes.ts` | `modules/acrescimoTensoes/calculations` |
| `compactacao.ts` | `modules/compactacao/calculations` |
| `granulometria.ts` | `modules/granulometria/calculations` |
| `indices-fisicos.ts` | `modules/indicesFisicos/calculations` |
| `limites-consistencia.ts` | `modules/limites/calculations` |
| `tensoes-geostaticas.ts` | `modules/tensoes/calculations` |

Atualizar `lib/calculations/index.ts` para exportar diretamente dos módulos.

### 2.4 Avaliar Páginas Sobrepostas

- `IndicesFisicos.tsx` (70KB) + `LimitesConsistencia.tsx` (62KB) existem como páginas standalone **E** dentro do módulo `Caracterizacao` (79KB) que combina ambos
- `Granulometria.tsx` (60KB — versão lab antiga) vs `GranulometriaTeste.tsx` (35KB — versão nova para uso)
- Ambas rotas `/granulometria` e `/granulometria-laboratorio` existem

> [!WARNING]
> Estas decisões dependem de quais funcionalidades devem ser mantidas. Precisamos confirmar:
> 1. **Caracterização** substitui `IndicesFisicos` + `LimitesConsistencia`? Ou os três coexistem?
> 2. **GranulometriaTeste** substitui `Granulometria`? A versão lab ainda é necessária?

### 2.5 Auditar Componentes UI Não Utilizados

Os 57 componentes em `components/ui/` vieram do shadcn. Verificar uso de cada um e remover os não utilizados. Candidatos prováveis:
- `aspect-ratio.tsx`, `avatar.tsx`, `breadcrumb.tsx`, `calendar.tsx`
- `carousel.tsx`, `collapsible.tsx`, `context-menu.tsx`
- `hover-card.tsx`, `input-otp` (importado no package.json)
- `menubar.tsx`, `navigation-menu.tsx`, `pagination.tsx`
- `resizable.tsx`, `textarea.tsx`
- `skeleton.tsx` vs `skeleton-loader.tsx` vs `enhanced-skeleton.tsx` (3 variantes!)
- `dialog.tsx` vs `dialog-enhanced.tsx` (2 variantes!)
- `input.tsx` vs `input-enhanced.tsx` (2 variantes!)
- `toast.tsx` + `toaster.tsx` vs `sonner.tsx` (sistema de toasts duplicado?)

### 2.6 Auditar Hooks Não Utilizados

Verificar se estes hooks ainda são referenciados:
- `use-calculation-history.ts`
- `use-form-autosave.ts`
- `use-optimized-callback.ts`
- `use-route-preload.ts`
- `use-saved-calculations.ts`
- `use-scroll-to-top.ts`
- `use-settings.ts`
- `use-theme.ts`
- `useRecentReports.ts`

### 2.7 Auditar Dependências do `package.json`

Verificar se estas dependências ainda são necessárias após limpeza:
- `date-fns`, `react-day-picker`, `embla-carousel-react` (se calendar/carousel removidos)
- `input-otp` (se não usado)
- `react-resizable-panels` (se resizable removido)
- `cmdk` (command palette)
- `next-themes` (se usando ThemeContext próprio)
- `lovable-tagger` (dev dependency, propósito?)
- `vaul` (drawer, se não usado)
- `katex` / `@types/katex` (para fórmulas, verificar uso)

### 2.8 Limpar Documentação Raíz

Avaliar necessidade dos markdowns na raiz do projeto (~130KB total):
- `ANALISE_PROJETO.md` (2.8KB)
- `ARQUITETURA_PROJETO.md` (44KB)
- `ARTIGO_EDUSOLO_DETALHES.md` (8KB)
- `CHANGELOG.md` (7.7KB)
- `CONTRIBUTING.md` (16KB)
- `MANUAL_GERAL_EDUSOLO.md` (29KB)
- `PADRÕES_DESIGN_MODULOS.md` (11KB)
- `lib/RELATORIOS_INTEGRACAO.md` (5.7KB)

---

## Fase 3 — Reorganização Estrutural *(Risco Alto)*

Reestruturação completa de pastas para uma arquitetura limpa baseada em módulos.

### 3.1 Estrutura Proposta

```
src/
├── app/                        # Setup da aplicação
│   ├── App.tsx
│   ├── main.tsx
│   ├── providers/              # ThemeContext, SettingsContext
│   └── routes.tsx              # Definição de rotas (extraído de App.tsx)
│
├── modules/                    # Cada módulo autocontido
│   ├── caracterizacao/         # Índices + Limites (combinado)
│   │   ├── components/
│   │   ├── calculations/
│   │   ├── hooks/
│   │   ├── store.ts
│   │   ├── types.ts
│   │   └── index.tsx           # Página principal
│   ├── granulometria/
│   ├── compactacao/
│   ├── tensoes-geostaticas/
│   ├── acrescimo-tensoes/
│   │   ├── boussinesq/
│   │   ├── love/
│   │   ├── carothers/
│   │   └── newmark/
│   └── recalque-adensamento/
│
├── shared/                     # Código compartilhado
│   ├── components/
│   │   ├── ui/                 # shadcn (somente os usados)
│   │   ├── layout/
│   │   ├── dialogs/
│   │   └── visualizations/
│   ├── hooks/
│   ├── lib/
│   │   ├── utils/
│   │   ├── constants/
│   │   └── schemas/
│   ├── stores/
│   └── types/
│
├── pages/                      # Apenas páginas auxiliares
│   ├── Dashboard.tsx
│   ├── About.tsx
│   ├── Educacional.tsx
│   ├── Settings.tsx
│   ├── Manual.tsx
│   ├── PlanosFuturos.tsx
│   ├── Salvos.tsx
│   ├── Relatorios.tsx
│   └── NotFound.tsx
│
└── styles/
    ├── index.css
    └── print.css
```

### 3.2 Migrar Páginas para Módulos

As páginas de cálculo monolíticas (ex: `IndicesFisicos.tsx` com 70KB) devem ter sua lógica migrada para dentro dos módulos correspondentes, tornando cada módulo autocontido.

### 3.3 Limpar Barrel Exports (index.ts)

Reescrever o `components/index.ts` para refletir a nova estrutura, ou eliminá-lo em favor de imports diretos.

### 3.4 Configurar Path Aliases

Atualizar `tsconfig.json` e `vite.config.ts` para incluir aliases da nova estrutura:
- `@/modules/*`
- `@/shared/*`
- `@/pages/*`
- `@/app/*`

---

## Verification Plan

### Build Test (Após cada fase)
```bash
cd frontend
npm run build
```
O build deve completar sem erros. Qualquer import quebrado será detectado pelo TypeScript.

### Teste Visual (Após cada fase)
```bash
cd frontend
npm run dev
```
Navegar por **todas as rotas ativas** no browser e confirmar que:
1. Dashboard carrega com todos os cards de módulo
2. Cada módulo abre corretamente (Índices, Granulometria, Compactação, Tensões, Acréscimo, Recalque)
3. Sidebar e navegação funcionam
4. Tema dark/light funciona
5. Exemplos carregam em cada módulo

> [!TIP]
> Recomendo fortemente fazer um **commit Git antes de cada fase** para permitir rollback fácil.
