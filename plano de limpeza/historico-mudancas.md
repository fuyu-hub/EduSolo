# Histórico de Mudanças — Limpeza EduSolo

Registro detalhado de cada alteração realizada durante o processo de limpeza do projeto.

---

## Fase 1 — Limpeza Superficial

### 1.1 Remoção do Código Mobile
- **Status:** ✅ Concluído
- **Data:** 2026-02-16
- **Arquivos removidos:**
  - `pages/mobile/` (pasta inteira — 9 arquivos, ~315KB)
  - `components/mobile/` (pasta inteira — 10 arquivos, ~35KB)
- **Arquivos modificados:**
  - `components/index.ts` — removido `export * from './mobile'` e export morto do `Tour`
  - `pages/IndicesFisicos.tsx` — removido import `MobileModuleWrapper` e `IndicesFisicosMobile`, export simplificado
  - `pages/LimitesConsistencia.tsx` — removido import `MobileModuleWrapper` e `LimitesConsistenciaMobile`, export simplificado
  - `pages/TensoesGeostaticas.tsx` — removido import `MobileModuleWrapper` e `TensoesGeostaticasMobile`, export simplificado
  - `pages/Compactacao.tsx` — removido import `MobileModuleWrapper` e `CompactacaoMobile`, export simplificado
  - `pages/Granulometria.tsx` — removido import `MobileModuleWrapper` e `GranulometriaMobile`, export simplificado
  - `pages/AcrescimoTensoes.tsx` — removido import `MobileModuleWrapper` e `AcrescimoTensoesMobile`, export simplificado
  - `pages/acrescimo-tensoes/Boussinesq.tsx` — removido import `MobileModuleWrapper` e `BoussinesqMobile`, export simplificado com `<>` fragment
  - `pages/Relatorios.tsx` — removido import `useIsMobile`, `RelatoriosMobile` e bloco condicional `if (isMobile)`
- **Observações:**
  - `MobileBlocker.tsx` e `hooks/use-mobile.tsx` foram **preservados** intencionalmente — o `MobileBlocker` é usado no `App.tsx` para avisar usuários mobile que a aplicação não é otimizada para dispositivos móveis
  - Cada página agora renderiza diretamente o componente Desktop no export default
  - TypeScript compila sem erros após as mudanças
  - **Rodada 2 (2026-02-16):** Limpeza adicional encontrada na auditoria completa:
    - `components/layout/Layout.tsx` — removido import quebrado `MobileLayout` e `useIsMobile`, agora renderiza `DesktopLayout` diretamente
    - `modules/limites/components/LimiteLiquidezChart.tsx` — removida prop `isMobile` e condicional do dialog Ampliar
    - `modules/granulometria/components/CurvaGranulometrica.tsx` — removida prop `isMobile` e ~25 condicionais mobile (tamanhos, ticks, labels, tooltips)
    - `modules/acrescimoTensoes/components/CanvasBoussinesqMobile.tsx` — **arquivo deletado** (componente mobile órfão, ~400 linhas)
    - `components/acrescimo-tensoes/CanvasBoussinesqMobile.tsx` — **arquivo deletado** (stub re-export órfão)

### 1.2 Remoção de Diretórios Vazios
- **Status:** ✅ Concluído
- **Data:** 2026-02-16
- **Arquivos removidos:**
  - `pages/modules/` (6 subpastas vazias)
  - `components/granulometria-teste/` (vazio)
  - `components/dashboard/` (vazio)
  - `assets/icons/` (vazio)
- **Observações:** Nenhum impacto em imports, eram todos diretórios sem conteúdo

### 1.3 Remoção de Código Comentado e Página Settings
- **Status:** ✅ Concluído
- **Data:** 2026-02-16
- **Arquivos modificados:**
  - `App.tsx` — removidos:
    - Lazy import comentado do `Settings`
    - Bloco de rota `/settings` comentado (~10 linhas)
    - Rota ativa `/settings` (que estava duplicada)
    - Preload comentado `import("./pages/Settings")`
  - `pages/Settings.tsx` — **arquivo deletado** (página inteira)
- **Observações:**
  - O `useSettings` hook e `SettingsContext` foram **preservados** — são usados por múltiplos módulos (ex: `printSettings` em TensoesGeostaticas, Compactação, etc.)
  - Apenas a página de UI de Settings foi removida, não a lógica de configurações

### 1.4 Limpeza do WelcomeDialog
- **Status:** ✅ Mantido (feature nova)
- **Data:** 2026-02-16
- **Observações:** O `WelcomeDialog` é um componente novo — exibe aviso sobre o app e termo de responsabilidade. Mantido no `App.tsx`.

---

## Fase 2 — Limpeza Profunda

### 2.1 Eliminação de Stubs em `components/`
- **Status:** ⏳ Pendente
- **Data:**
- **Arquivos removidos:**
- **Imports atualizados:**
- **Observações:**

### 2.2 Eliminação de Stubs em `lib/`
- **Status:** ⏳ Pendente
- **Data:**
- **Arquivos removidos:**
- **Imports atualizados:**
- **Observações:**

### 2.3 Eliminação de Stubs em `lib/calculations/`
- **Status:** ⏳ Pendente
- **Data:**
- **Arquivos removidos:**
- **Imports atualizados:**
- **Observações:**

### 2.4 Resolução de Páginas Sobrepostas
- **Status:** ✅ Concluído
- **Data:** 2026-02-16

#### 2.4.1 Remoção de IndicesFisicos e LimitesConsistencia
- **Arquivos removidos:**
  - `pages/IndicesFisicos.tsx` (~70KB) — página standalone de Índices Físicos
  - `pages/LimitesConsistencia.tsx` (~62KB) — página standalone de Limites de Consistência
- **Arquivos modificados:**
  - `App.tsx` — removidos lazy imports, preloads e rotas. Adicionados redirects `/indices-fisicos` → `/indices-limites` e `/limites-consistencia` → `/indices-limites`
  - `CommandPalette.tsx` — duas entradas unificadas em "Índices Físicos e Limites" → `/indices-limites`
  - `Salvos.tsx` — `moduleRoutes` atualizado
  - `Relatorios.tsx` — `moduleRoutes` atualizado
- **Observações:**
  - O módulo `Caracterização` (`modules/caracterizacao/`) na rota `/indices-limites` substitui completamente ambas as páginas
  - `modules/indicesFisicos/` e `modules/limites/` foram **preservados** — usados pelo Caracterização
  - Rotas antigas redirecionam automaticamente para não quebrar bookmarks

#### 2.4.2 Renomear Granulometria → GranulometriaLab
- **Arquivos renomeados:**
  - `pages/GranulometriaTeste.tsx` → `pages/Granulometria.tsx` (o novo módulo de classificação granulométrica)
  - `pages/Granulometria.tsx` → `pages/GranulometriaLab.tsx` (módulo laboratorial, mantido para uso futuro)
- **Arquivos modificados:**
  - `App.tsx` — lazy imports renomeados para corresponder aos novos nomes de arquivo
  - `Dashboard.tsx` — preload atualizado, bloco comentado removido
- **Observações:**
  - Rotas **não mudaram** (`/granulometria` continua servindo o módulo de classificação, `/granulometria-laboratorio` serve o módulo lab)
  - `modules/granulometria/` e `modules/granulometria-teste/` **não foram renomeados** — apenas os arquivos de página
  - TypeScript compila sem erros

### 2.5 Auditoria de Componentes UI
- **Status:** ⏳ Pendente
- **Data:**
- **Componentes removidos:**
- **Observações:**

### 2.6 Auditoria de Hooks
- **Status:** ⏳ Pendente
- **Data:**
- **Hooks removidos:**
- **Observações:**

### 2.7 Auditoria de Dependências
- **Status:** ⏳ Pendente
- **Data:**
- **Dependências removidas:**
- **Observações:**

### 2.8 Limpeza da Documentação Raíz
- **Status:** ⏳ Aguardando decisão
- **Data:**
- **Observações:**

---

## Fase 3 — Reorganização Estrutural

### 3.1 Nova Estrutura de Pastas
- **Status:** ⏳ Pendente
- **Data:**
- **Observações:**

### 3.2 Migração de Páginas para Módulos
- **Status:** ⏳ Pendente
- **Data:**
- **Observações:**

### 3.3 Limpeza de Barrel Exports
- **Status:** ⏳ Pendente
- **Data:**
- **Observações:**

### 3.4 Atualização de Path Aliases
- **Status:** ⏳ Pendente
- **Data:**
- **Observações:**
