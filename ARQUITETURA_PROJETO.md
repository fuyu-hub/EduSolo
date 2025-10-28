# 🏗️ Arquitetura e Documentação - EduSolo

## 📌 Visão Geral do Projeto

**EduSolo** é uma plataforma educacional completa para análise e aprendizado em **Mecânica dos Solos**. É uma suíte de ferramentas interativas para cálculos geotécnicos desenvolvida com React + TypeScript, com **backend 100% integrado** (sem dependência de servidor externo).

### 🎯 Objetivo Principal
- 🎓 **Educação**: Facilitar o aprendizado de conceitos de mecânica dos solos
- 🧮 **Cálculos**: Fornecer ferramentas confiáveis para análises geotécnicas
- 📊 **Visualização**: Apresentar resultados de forma gráfica e intuitiva
- 🌐 **Acessibilidade**: 100% gratuito, open source e funciona offline

---

## 📁 Estrutura de Diretórios

```
EduSolo/
│
├── 📘 README.md                    # Documentação principal do projeto
├── 📘 ARQUITETURA_PROJETO.md       # Este arquivo
├── 📘 CONTRIBUTING.md              # Guia de contribuição
├── 📜 CHANGELOG.md                 # Histórico de mudanças
├── 📄 LICENSE                      # Licença MIT
├── 🔧 render.yaml                  # Configuração de deploy
│
└── 📁 frontend/                    # ⭐ APLICAÇÃO PRINCIPAL (React + TypeScript)
    │
    ├── 📄 package.json             # Dependências do projeto
    ├── 📄 vite.config.ts           # Configuração do Vite (build tool)
    ├── 📄 tsconfig.json            # Configuração do TypeScript
    ├── 📄 tailwind.config.ts       # Configuração do Tailwind CSS
    ├── 📄 components.json          # Configuração do shadcn/ui
    ├── 📄 postcss.config.js        # Configuração PostCSS
    ├── 📄 eslint.config.js         # Configuração ESLint
    ├── 📄 index.html               # HTML principal
    ├── 📘 README.md                # Documentação do frontend
    │
    ├── 📁 public/                  # Arquivos estáticos
    │   ├── favicon.ico
    │   ├── placeholder.svg
    │   ├── robots.txt
    │   ├── edusolo-logo*.svg       # Logos da aplicação
    │   ├── pwa-*.png               # Ícones PWA (Progressive Web App)
    │   ├── render.yaml/.json       # Config de deploy
    │   └── _redirects              # Redirecionamento de rotas
    │
    └── 📁 src/                     # ⭐ CÓDIGO-FONTE PRINCIPAL
        │
        ├── 📄 main.tsx             # Ponto de entrada da aplicação
        ├── 📄 App.tsx              # Componente raiz
        ├── 📄 index.css            # Estilos globais
        ├── 📄 App.css              # Estilos da App
        ├── 📄 vite-env.d.ts        # Tipos do Vite
        │
        ├── 📁 pages/               # 🔵 PÁGINAS (Rotas)
        │   ├── Index.tsx           # Landing page (/)
        │   ├── Dashboard.tsx       # Dashboard principal (/dashboard)
        │   ├── IndicesFisicos.tsx  # Módulo de Índices Físicos
        │   ├── LimitesConsistencia.tsx
        │   ├── Granulometria.tsx
        │   ├── Compactacao.tsx
        │   ├── Tensoes.tsx         # Tensões Geostáticas
        │   ├── AcrescimoTensoes.tsx
        │   ├── Educacional.tsx
        │   ├── Settings.tsx        # Página de configurações
        │   └── NotFound.tsx        # Página 404
        │
        ├── 📁 components/          # 🟢 COMPONENTES REUTILIZÁVEIS
        │   │
        │   ├── 📁 ui/              # 🎨 COMPONENTES BASE (shadcn/ui)
        │   │   ├── button.tsx
        │   │   ├── input.tsx
        │   │   ├── card.tsx
        │   │   ├── dialog.tsx
        │   │   ├── select.tsx
        │   │   ├── checkbox.tsx
        │   │   ├── tabs.tsx
        │   │   ├── table.tsx
        │   │   ├── toast.tsx
        │   │   ├── alert.tsx
        │   │   ├── badge.tsx
        │   │   ├── form.tsx
        │   │   ├── label.tsx
        │   │   ├── loading-spinner.tsx
        │   │   ├── skeleton.tsx
        │   │   ├── slider.tsx
        │   │   ├── switch.tsx
        │   │   ├── progress.tsx
        │   │   ├── accordion.tsx
        │   │   ├── popover.tsx
        │   │   ├── tooltip.tsx
        │   │   ├── separator.tsx
        │   │   ├── calendar.tsx
        │   │   ├── drawer.tsx
        │   │   └── ... (mais de 50 componentes!)
        │   │
        │   ├── 📁 visualizations/ # 📈 GRÁFICOS E DIAGRAMAS
        │   │   ├── DiagramaFases.tsx      # Diagrama de fases interativo
        │   │   └── PlasticityChart.tsx    # Carta de Plasticidade
        │   │
        │   ├── 📁 granulometria/         # 🔬 COMPONENTES DE GRANULOMETRIA
        │   │   ├── CurvaGranulometrica.tsx
        │   │   ├── SeletorPeneiras.tsx
        │   │   ├── TabelaDadosGranulometricos.tsx
        │   │   └── DialogExemplos.tsx
        │   │
        │   ├── 📁 compactacao/          # 🔨 COMPONENTES DE COMPACTAÇÃO
        │   │   ├── CurvaCompactacao.tsx
        │   │   ├── TabelaResultados.tsx
        │   │   └── DialogExemplos.tsx
        │   │
        │   ├── 📁 tensoes/              # 📐 COMPONENTES DE TENSÕES
        │   │   ├── DiagramaCamadas.tsx
        │   │   ├── PerfilTensoes.tsx
        │   │   ├── TabelaCamadas.tsx
        │   │   ├── TabelaResultados.tsx
        │   │   ├── DialogCamada.tsx
        │   │   ├── DialogConfiguracoes.tsx
        │   │   ├── DialogExemplos.tsx
        │   │   └── (mais componentes)
        │   │
        │   ├── 📁 acrescimo-tensoes/   # 📊 COMPONENTES DE ACRÉSCIMO
        │   │   ├── BoussinesqAnalise.tsx
        │   │   ├── LoveAnalise.tsx
        │   │   ├── NewmarkAnalise.tsx
        │   │   ├── CarothersAnalise.tsx
        │   │   ├── Canvas2DInterativo.tsx
        │   │   ├── CanvasBoussinesq.tsx
        │   │   ├── CanvasLove.tsx
        │   │   ├── CanvasNewmark.tsx
        │   │   ├── CanvasCarothers.tsx
        │   │   ├── CargaPopup.tsx
        │   │   ├── CargaFaixaPopup.tsx
        │   │   ├── CargaCircularPopup.tsx
        │   │   ├── CargaRetangularPopup.tsx
        │   │   ├── PainelResultados.tsx
        │   │   ├── DialogDetalhesCalculo.tsx
        │   │   ├── DialogConfiguracoesNewmark.tsx
        │   │   ├── DialogExemplosNewmark.tsx
        │   │   └── PontoAnalisePopup.tsx
        │   │
        │   ├── 📁 limites/              # 💧 COMPONENTES DE LIMITES
        │   │   ├── LimiteLiquidezChart.tsx
        │   │   └── DialogExemplos.tsx
        │   │
        │   ├── 📁 soil/                 # 🌍 COMPONENTES DE SOLO
        │   │   ├── GsSuggestions.tsx
        │   │   ├── InputWithValidation.tsx
        │   │   ├── ResultInterpretation.tsx
        │   │   └── SoilExamples.tsx
        │   │
        │   ├── 📁 mobile/               # 📱 COMPONENTES MOBILE
        │   │   ├── MobileLayout.tsx
        │   │   ├── MobileHeader.tsx
        │   │   ├── MobileInputGroup.tsx
        │   │   ├── MobileSection.tsx
        │   │   ├── MobileModuleWrapper.tsx
        │   │   ├── MobileResultCard.tsx
        │   │   ├── MobileFeatureCard.tsx
        │   │   ├── MobileTabs.tsx
        │   │   ├── BottomNav.tsx
        │   │   └── index.ts
        │   │
        │   ├── Layout.tsx               # Layout principal
        │   ├── ErrorBoundary.tsx        # Error boundary
        │   ├── PrintHeader.tsx          # Cabeçalho para impressão
        │   ├── SaveDialog.tsx           # Diálogo de salvamento
        │   ├── ExportPDFDialog.tsx      # Diálogo de exportação PDF
        │   ├── CalculationActions.tsx   # Ações de cálculo
        │   ├── UndoRedoToolbar.tsx      # Toolbar undo/redo
        │   ├── SavedCalculations.tsx    # Cálculos salvos
        │   ├── RecentCalculations.tsx   # Cálculos recentes
        │   ├── RoutePreloader.tsx       # Pré-carregamento de rotas
        │   ├── Tour.tsx                 # Tour guiado
        │   ├── TourContext.tsx          # Context do tour
        │   ├── WelcomeDialog.tsx        # Diálogo de boas-vindas
        │   ├── PWAUpdateNotification.tsx # Notificação de atualização PWA
        │   ├── FeedbackMessage.tsx      # Mensagens de feedback
        │   └── OptimizedCard.tsx        # Card otimizado
        │
        ├── 📁 contexts/                # 🔄 CONTEXTOS (Estado Global)
        │   ├── ThemeContext.tsx        # Contexto de tema (claro/escuro)
        │   ├── SettingsContext.tsx     # Contexto de configurações
        │   ├── TourContext.tsx         # Contexto do tour guiado
        │   └── (mais contextos...)
        │
        ├── 📁 hooks/                   # 🎣 CUSTOM HOOKS
        │   ├── use-mobile.tsx          # Detectar se é mobile
        │   ├── use-theme.ts            # Gerenciar tema
        │   ├── use-settings.ts         # Gerenciar configurações
        │   ├── use-saved-calculations.ts
        │   ├── use-scroll-to-top.ts
        │   ├── use-toast.ts            # Toast notifications
        │   └── (mais hooks...)
        │
        ├── 📁 lib/                     # 🛠️ UTILITÁRIOS E LÓGICA DE NEGÓCIO
        │   │
        │   ├── 📁 calculations/        # ⭐ MÓDULOS DE CÁLCULO GEOTÉCNICO
        │   │   ├── indices-fisicos.ts
        │   │   ├── limites-consistencia.ts
        │   │   ├── granulometria.ts
        │   │   ├── compactacao.ts
        │   │   ├── tensoes-geostaticas.ts
        │   │   ├── acrescimo-tensoes.ts
        │   │   ├── recalque-adensamento.ts
        │   │   ├── tempo-adensamento.ts
        │   │   ├── classificacao-uscs.ts
        │   │   ├── classificacao-hrb.ts
        │   │   └── index.ts
        │   │
        │   ├── 📁 schemas/             # 📋 VALIDAÇÃO (Zod)
        │   │   ├── indices-fisicos.ts
        │   │   ├── limites-consistencia.ts
        │   │   ├── granulometria.ts
        │   │   ├── compactacao.ts
        │   │   ├── tensoes-geostaticas.ts
        │   │   ├── acrescimo-tensoes.ts
        │   │   ├── classificacao.ts
        │   │   ├── common.ts
        │   │   ├── outros-modulos.ts
        │   │   └── index.ts
        │   │
        │   ├── 📁 geotecnia/          # 🌍 UTILIDADES GEOTÉCNICAS
        │   │   └── indicesFisicosConteudo.ts
        │   │
        │   ├── calculation-helpers.ts  # Funções auxiliares de cálculo
        │   ├── export-utils.ts         # Exportação para PDF/Excel
        │   ├── unit-converter.ts       # Conversor de unidades
        │   ├── soil-constants.ts       # Constantes geotécnicas
        │   ├── peneiras-padrao.ts      # Peneiras padrão (ABNT, ASTM)
        │   ├── tensoes-utils.ts        # Utilidades de tensões
        │   ├── exemplos-indices-fisicos.ts
        │   ├── exemplos-limites.ts
        │   ├── exemplos-granulometria.ts
        │   ├── exemplos-compactacao.ts
        │   ├── exemplos-tensoes.ts
        │   ├── exemplos-newmark.ts
        │   ├── format-number.ts        # Formatação de números
        │   └── utils.ts                # Funções utilitárias gerais
        │
        ├── 📁 stores/                  # 💾 GERENCIAMENTO DE ESTADO (Zustand)
        │   ├── calculation-store.ts
        │   ├── settings-store.ts
        │   ├── theme-store.ts
        │   └── (mais stores...)
        │
        ├── 📁 styles/                  # 🎨 ESTILOS GLOBAIS
        │   └── print.css               # Estilos para impressão
        │
        └── 📁 types/                   # 📦 TIPOS TypeScript
            ├── soil.ts
            ├── calculations.ts
            └── index.ts
```

---

## 🎨 Arquitetura de UI

### Tecnologias de UI

| Tecnologia | Versão | Propósito |
|-----------|--------|----------|
| **React** | 18.3+ | Biblioteca de UI |
| **TypeScript** | 5.8+ | Tipagem estática |
| **Tailwind CSS** | 3.4+ | Estilização utility-first |
| **shadcn/ui** | Latest | Componentes acessíveis |
| **Radix UI** | Latest | Primitivos de UI |
| **Lucide React** | 0.462+ | Ícones SVG |
| **Recharts** | 2.15+ | Gráficos interativos |

### Estrutura de Componentes

#### 1️⃣ **Componentes Base (shadcn/ui)**
Localizados em `frontend/src/components/ui/`

Mais de 50 componentes já prontos:
- **Inputs**: `Input`, `Textarea`, `Select`, `Checkbox`, `Radio`, `Slider`, `Switch`
- **Layout**: `Card`, `Dialog`, `Drawer`, `Tabs`, `Accordion`, `Separator`
- **Feedback**: `Alert`, `Toast`, `Badge`, `Progress`
- **Navegação**: `Button`, `Breadcrumb`, `Pagination`, `Menubar`
- **Data Display**: `Table`, `Calendar`, `Popover`, `Tooltip`
- E muitos mais!

**Como usar:**
```tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function MyComponent() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Título</CardTitle>
      </CardHeader>
      <CardContent>
        <Input placeholder="Digite algo..." />
        <Button>Clique aqui</Button>
      </CardContent>
    </Card>
  );
}
```

#### 2️⃣ **Componentes Customizados**
Localizados em `frontend/src/components/`

**Visualizações:**
- `DiagramaFases.tsx` - Diagrama de fases interativo
- `PlasticityChart.tsx` - Carta de Plasticidade de Casagrande

**Módulo-específicos:**
- `granulometria/` - CurvaGranulometrica, SeletorPeneiras, etc.
- `compactacao/` - CurvaCompactacao, TabelaResultados, etc.
- `tensoes/` - DiagramaCamadas, PerfilTensoes, etc.
- `acrescimo-tensoes/` - BoussinesqAnalise, NewmarkAnalise, Canvas interativo, etc.
- `limites/` - LimiteLiquidezChart, etc.

**Helpers:**
- `Layout.tsx` - Layout principal com header/footer
- `SaveDialog.tsx` - Salvar cálculos
- `ExportPDFDialog.tsx` - Exportar como PDF
- `UndoRedoToolbar.tsx` - Undo/Redo
- `Tour.tsx` - Tour guiado interativo
- `WelcomeDialog.tsx` - Diálogo de boas-vindas

**Mobile:**
- `mobile/MobileLayout.tsx` - Layout mobile
- `mobile/MobileHeader.tsx` - Header mobile
- `mobile/BottomNav.tsx` - Navegação inferior
- Etc.

#### 3️⃣ **Temas e Cores**

**Tema Claro/Escuro:**
Gerenciado pelo `ThemeContext` em `frontend/src/contexts/ThemeContext.tsx`

Aplicado via `next-themes` e Tailwind CSS.

**Cores Tailwind:**
```css
--primary: 220 90% 56%;      /* Azul */
--secondary: 220 15% 25%;    /* Cinza escuro */
--accent: 38 92% 50%;        /* Laranja */
--success: 142 76% 36%;      /* Verde */
--destructive: 0 84% 60%;    /* Vermelho */
--muted: 220 13% 91%;        /* Cinza claro */
```

### Responsividade

A aplicação usa **breakpoints do Tailwind**:
- `sm: 640px` - Smartphones landscape
- `md: 768px` - Tablets
- `lg: 1024px` - Laptops
- `xl: 1280px` - Desktops
- `2xl: 1536px` - Large screens

**Hook de detecção mobile:**
```tsx
import { useIsMobile } from "@/hooks/use-mobile";

function MyComponent() {
  const isMobile = useIsMobile();
  
  return isMobile ? <MobileView /> : <DesktopView />;
}
```

---

## 🧮 Módulos de Cálculo Geotécnico

Todos os cálculos estão em: `frontend/src/lib/calculations/`

### ✅ Módulos Implementados

#### 1. **Índices Físicos** 📐
**Arquivo:** `frontend/src/lib/calculations/indices-fisicos.ts`

**O que calcula:**
- Peso específico (natural, seco, saturado, submerso)
- Índice de vazios (e)
- Porosidade (n)
- Grau de saturação (S)
- Compacidade relativa (Dr)
- Densidade das partículas sólidas (Gs)
- Diagrama de fases interativo

**Entrada:**
```typescript
{
  Vt: number;      // Volume total
  Vv: number;      // Volume de vazios
  Vs: number;      // Volume de sólidos
  Vw: number;      // Volume de água
  Wt: number;      // Peso total
  Ws: number;      // Peso de sólidos
  Ww: number;      // Peso de água
  Gs?: number;     // Densidade das partículas
  na?: number;     // Nível de água
}
```

**Saída:**
```typescript
{
  gamma_n: number;     // Peso específico natural
  gamma_d: number;     // Peso específico seco
  gamma_sat: number;   // Peso específico saturado
  gamma_sub: number;   // Peso específico submerso
  void_index: number;  // Índice de vazios (e)
  porosity: number;    // Porosidade (n)
  saturation: number;  // Grau de saturação (S)
  dr: number;          // Compacidade relativa
  gs: number;          // Densidade das partículas
}
```

**Página:** `frontend/src/pages/IndicesFisicos.tsx`

---

#### 2. **Limites de Consistência** 💧
**Arquivo:** `frontend/src/lib/calculations/limites-consistencia.ts`

**O que calcula:**
- Limite de Liquidez (LL) - Método de Casagrande
- Limite de Plasticidade (LP)
- Índice de Plasticidade (IP)
- Índice de Consistência (IC)
- Atividade da argila (Ia)
- Classificação geotécnica

**Entrada:**
```typescript
{
  // Para Limite de Liquidez
  golpes_ll: { golpes: number; umidade: number }[];
  
  // Para Limite de Plasticidade
  mass_soil_lp: number;
  mass_water_lp: number;
  percentage_passing_40: number;
}
```

**Saída:**
```typescript
{
  ll: number;           // Limite de Liquidez
  lp: number;           // Limite de Plasticidade
  ip: number;           // Índice de Plasticidade
  ic: number;           // Índice de Consistência
  ia: number;           // Atividade
  classification: string; // Classificação (CH, CL, etc.)
}
```

**Página:** `frontend/src/pages/LimitesConsistencia.tsx`

---

#### 3. **Granulometria e Classificação** 🔬
**Arquivo:** `frontend/src/lib/calculations/granulometria.ts`

**O que calcula:**
- Análise granulométrica
- Curva granulométrica
- D10, D30, D60
- Coeficiente de uniformidade (Cu)
- Coeficiente de curvatura (Cc)
- Classificação USCS
- Classificação HRB (AASHTO)

**Entrada:**
```typescript
{
  sieve_size: number;
  mass_retained: number;
  // ...para múltiplas peneiras
}
```

**Saída:**
```typescript
{
  finer_percentage: number[];
  d10: number;
  d30: number;
  d60: number;
  cu: number;      // Coeficiente de uniformidade
  cc: number;      // Coeficiente de curvatura
  uscs_group: string;
  hrb_group: string;
}
```

**Página:** `frontend/src/pages/Granulometria.tsx`

---

#### 4. **Compactação** 🔨
**Arquivo:** `frontend/src/lib/calculations/compactacao.ts`

**O que calcula:**
- Curva de compactação
- Umidade ótima (wₒₜ)
- Peso específico máximo (γd,max)
- Curva de saturação (S=100%)
- Energia Proctor

**Entrada:**
```typescript
{
  mass_soil: number;
  water_mass: number;
  gamma_d: number;
  // ...para múltiplos pontos
}
```

**Saída:**
```typescript
{
  wopt: number;           // Umidade ótima
  gamma_d_max: number;    // Peso específico máximo
  compaction_energy: number;
}
```

**Página:** `frontend/src/pages/Compactacao.tsx`

---

#### 5. **Tensões Geostáticas** 📐
**Arquivo:** `frontend/src/lib/calculations/tensoes-geostaticas.ts`

**O que calcula:**
- Tensões verticais totais (σᵥ)
- Pressões neutras/poro-pressão (u)
- Tensões efetivas verticais (σᵥ')
- Tensões efetivas horizontais (σₕ')
- K₀ (coeficiente de repouso)
- Análise multicamadas
- Efeito de nível d'água
- Capilaridade

**Entrada:**
```typescript
{
  layers: {
    thickness: number;
    gamma: number;
    gs?: number;
    na?: number;
  }[];
  water_level?: number;
  capillary_height?: number;
}
```

**Saída:**
```typescript
{
  depth: number;
  sigma_v: number;        // Tensão vertical total
  u: number;              // Poro-pressão
  sigma_v_eff: number;    // Tensão efetiva vertical
  sigma_h_eff: number;    // Tensão efetiva horizontal
}[]
```

**Página:** `frontend/src/pages/Tensoes.tsx`

---

#### 6. **Acréscimo de Tensões** 📊
**Arquivo:** `frontend/src/lib/calculations/acrescimo-tensoes.ts`

**O que calcula:**
- **Boussinesq**: Carga pontual vertical
- **Love**: Carga retangular
- **Newmark**: Carga circular
- **Carothers**: Carga em faixa
- Influência de profundidade e distribuição

**Entrada:**
```typescript
// Boussinesq
{
  type: "boussinesq";
  load: number;           // Carga pontual (kN)
  depth: number;          // Profundidade (m)
  horizontal_distance: number;
}

// Carga Circular
{
  type: "circular";
  radius: number;
  depth: number;
  load: number;
  method: "newmark" | "carothers";
}
```

**Saída:**
```typescript
{
  delta_sigma_v: number;  // Acréscimo de tensão vertical
  influence_factor: number;
}
```

**Página:** `frontend/src/pages/AcrescimoTensoes.tsx`

**Visualizações:**
- Canvas 2D interativo (HTML5 Canvas)
- Diagrama de distribuição de carga
- Perfil de tensões

---

#### 7. **Adensamento** ⏱️
**Arquivo:** `frontend/src/lib/calculations/recalque-adensamento.ts`
**Arquivo:** `frontend/src/lib/calculations/tempo-adensamento.ts`

**O que calcula:**
- Recalque por adensamento primário (ΔH)
- Coeficiente de compressão (Cc)
- Índice de recompressão (Cr)
- Teorema de Terzaghi
- Tempo de adensamento (t)
- Fator de tempo (T)
- Grau de adensamento (U)

**Entrada:**
```typescript
{
  thickness: number;
  initial_void_ratio: number;
  final_effective_stress: number;
  initial_effective_stress: number;
  cc?: number;
  cr?: number;
  cv?: number;             // Coef. de adensamento
  mv?: number;             // Coef. de volume
}
```

**Saída:**
```typescript
{
  settlement: number;      // Recalque total
  time_50: number;         // Tempo para 50% adensamento
  time_90: number;         // Tempo para 90%
  u: number;               // Grau de adensamento
}
```

---

### 📋 Validação com Zod

Todos os módulos têm **schemas de validação** em `frontend/src/lib/schemas/`

**Exemplo:**
```typescript
// frontend/src/lib/schemas/indices-fisicos.ts
import { z } from "zod";

export const indicesFisicosSchema = z.object({
  Vt: z.number().positive("Volume total deve ser positivo"),
  Vv: z.number().nonnegative(),
  Vs: z.number().nonnegative(),
  // ...
}).refine((data) => data.Vt === data.Vv + data.Vs, {
  message: "Vt deve ser igual a Vv + Vs",
  path: ["Vt"],
});
```

### 📂 Onde Estão os Cálculos

```
frontend/src/lib/calculations/
├── indices-fisicos.ts          ✅ Índices Físicos
├── limites-consistencia.ts     ✅ Limites de Consistência
├── granulometria.ts            ✅ Granulometria
├── compactacao.ts              ✅ Compactação
├── tensoes-geostaticas.ts      ✅ Tensões Geostáticas
├── acrescimo-tensoes.ts        ✅ Acréscimo de Tensões
├── recalque-adensamento.ts     ✅ Recalque/Adensamento
├── tempo-adensamento.ts        ✅ Tempo de Adensamento
├── classificacao-uscs.ts       ✅ Classificação USCS
├── classificacao-hrb.ts        ✅ Classificação HRB
└── index.ts                    Central de exports
```

### 🔌 Como Usar um Módulo de Cálculo

**Exemplo - Índices Físicos:**

```tsx
import { calcularIndicesFisicos } from "@/lib/calculations/indices-fisicos";
import { indicesFisicosSchema } from "@/lib/schemas/indices-fisicos";

function MeuComponente() {
  const handleCalculate = (dados: unknown) => {
    // 1. Validar entrada
    const validacao = indicesFisicosSchema.safeParse(dados);
    
    if (!validacao.success) {
      console.error(validacao.error);
      return;
    }
    
    // 2. Executar cálculo
    const resultados = calcularIndicesFisicos(validacao.data);
    
    // 3. Usar resultados
    console.log(resultados);
  };
  
  return (
    <button onClick={() => handleCalculate(dadosDoFormulario)}>
      Calcular
    </button>
  );
}
```

---

## 🔄 Gerenciamento de Estado

### 1. **React Context API** 
Para estado global:
- `ThemeContext` - Tema claro/escuro
- `SettingsContext` - Configurações do usuário
- `TourContext` - Estado do tour guiado

**Uso:**
```tsx
import { useTheme } from "@/hooks/use-theme";

function MyComponent() {
  const { theme, setTheme } = useTheme();
  
  return (
    <button onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
      Alternar para {theme === "dark" ? "claro" : "escuro"}
    </button>
  );
}
```

### 2. **Zustand Stores**
Para estado de cálculos:
- Cache de cálculos recentes
- Histórico de operações
- Configurações de módulos

Localizados em: `frontend/src/stores/`

### 3. **React Hook Form + Zod**
Para gerenciamento de formulários com validação em tempo real

---

## 🎨 Importância da Arquitetura de UI

A arquitetura de UI é crucial porque:

1. **Reusabilidade**: Componentes shadcn/ui podem ser usados em qualquer página
2. **Consistência**: Design system unificado com Tailwind CSS
3. **Acessibilidade**: Radix UI garante WCAG compliance
4. **Responsividade**: Mobile-first com breakpoints
5. **Manutenibilidade**: Estrutura organizada e clara
6. **Performance**: Lazy loading de componentes

### Fluxo de Renderização

```
App.tsx (raiz)
├── Layout.tsx
│   ├── Header
│   ├── Sidebar (desktop)
│   ├── MobileNav (mobile)
│   └── Main Routes
│       ├── Dashboard
│       │   └── ModuleCards
│       │       └── Redirects para módulos
│       │
│       └── Módulos (IndicesFisicos, etc.)
│           ├── FormulárioEntrada
│           ├── Validação (Zod)
│           ├── Cálculo
│           └── Visualização de Resultados
│               ├── Gráficos (Recharts)
│               ├── Diagramas (Canvas)
│               └── Tabelas (shadcn/ui Table)
│
└── Footer
```

---

## 📦 Stack Tecnológico Completo

### Frontend (tudo em um lugar!)
```
React 18.3          - UI
TypeScript 5.8      - Tipagem
Vite 7.1            - Build tool
Tailwind CSS 3.4    - Estilização
shadcn/ui           - Componentes
Recharts 2.15       - Gráficos
React Hook Form 7.6 - Formulários
Zod 3.25            - Validação
Zustand 5.0         - Estado local
Next Themes 0.3     - Tema claro/escuro
Lucide React 0.462  - Ícones
jsPDF 3.0           - Exportação PDF
html2canvas 1.4     - Captura de tela
```

### ✨ Sem Backend Separado!
- ✅ Todos os cálculos em **TypeScript** (não em Python)
- ✅ Funciona **100% offline**
- ✅ Sem latência de rede
- ✅ Sem servidor externo
- ✅ Deploy simplificado (SPA estática)

---

## 🚀 Como Adicionar Novo Módulo de Cálculo

### 1. Criar arquivo de cálculo
```typescript
// frontend/src/lib/calculations/novo-modulo.ts

export interface NovoModuloInput {
  valor1: number;
  valor2: number;
}

export interface NovoModuloOutput {
  resultado: number;
}

export function calcularNovoModulo(
  input: NovoModuloInput
): NovoModuloOutput {
  // Lógica de cálculo
  return {
    resultado: input.valor1 + input.valor2,
  };
}
```

### 2. Criar schema de validação
```typescript
// frontend/src/lib/schemas/novo-modulo.ts

import { z } from "zod";

export const novoModuloSchema = z.object({
  valor1: z.number().positive("Deve ser positivo"),
  valor2: z.number().positive("Deve ser positivo"),
});
```

### 3. Criar página
```typescript
// frontend/src/pages/NovoModulo.tsx

import { calcularNovoModulo } from "@/lib/calculations/novo-modulo";
import { novoModuloSchema } from "@/lib/schemas/novo-modulo";

export default function NovoModulo() {
  // Implementar componente
  return <div>Novo Módulo</div>;
}
```

### 4. Adicionar rota
```typescript
// frontend/src/App.tsx

import NovoModulo from "@/pages/NovoModulo";

// Em Routes:
<Route path="/novo-modulo" element={<NovoModulo />} />
```

### 5. Adicionar ao Dashboard
```typescript
// frontend/src/pages/Dashboard.tsx

const modules = [
  // ... outros módulos
  {
    icon: IconName,
    title: "Novo Módulo",
    description: "Descrição...",
    path: "/novo-modulo",
    color: "from-color-500 via-color-600 to-color-600",
    preload: () => import("./NovoModulo"),
    tourId: "module-novo",
  },
];
```

---

## 📊 Estrutura de Dados Típica

### Input (Formulário)
```typescript
interface FormData {
  // Sempre validado com Zod antes
  campo1: number;
  campo2: string;
  campo3?: boolean;
}
```

### Cálculo
```typescript
function calcular(input: FormData): ResultData {
  // Lógica pura de cálculo
  // Sem side effects
  // Sem chamadas API
  return {
    resultado1: Math.sqrt(input.campo1),
    resultado2: input.campo2.toUpperCase(),
  };
}
```

### Output (Visualização)
```typescript
interface ResultData {
  resultado1: number;
  resultado2: string;
  // Pode ter gráficos, tabelas, diagramas
}
```

---

## 🎯 Convenções e Boas Práticas

### 📝 Nomes de Arquivos
- Componentes: `PascalCase` - `DiagramaFases.tsx`
- Funções: `camelCase` - `calcularIndicesFisicos.ts`
- Constantes: `UPPER_SNAKE_CASE` - `MAX_ITERATIONS`

### 📦 Imports
```typescript
// Imports do React/libs
import React, { useState } from "react";

// Imports de componentes UI
import { Button } from "@/components/ui/button";

// Imports de componentes customizados
import { DiagramaFases } from "@/components/visualizations/DiagramaFases";

// Imports de utils
import { calcularIndicesFisicos } from "@/lib/calculations/indices-fisicos";
```

### 🎨 Tipagem
```typescript
// Sempre tipado!
interface ComponentProps {
  titulo: string;
  valor: number;
  onClick: (valor: number) => void;
}

function MeuComponente({ titulo, valor, onClick }: ComponentProps) {
  // ...
}
```

---

## 🔗 Fluxo Completo de um Cálculo

```
Usuário acessa /indices-fisicos
    ↓
Página carrega (IndicesFisicos.tsx)
    ↓
Renderiza formulário com inputs
    ↓
Usuário preenche dados
    ↓
Submit do formulário
    ↓
Validação com Zod (indicesFisicosSchema.safeParse)
    ↓
Se inválido: mostrar erro
Se válido: prosseguir
    ↓
Chamar função: calcularIndicesFisicos(dadosValidados)
    ↓
Executar lógica de cálculo (TypeScript puro)
    ↓
Retornar resultados
    ↓
Renderizar componentes de visualização:
  - DiagramaFases (Canvas)
  - Tabelas (shadcn/ui Table)
  - Gráficos (Recharts)
    ↓
Opções de ação:
  - Salvar cálculo (localStorage)
  - Exportar PDF (jsPDF)
  - Compartilhar (URL)
  - Novo cálculo
```

---

## 🌐 Deployment

Aplicação deployada em: **Render** (configurado em `render.yaml`)

Características:
- ✅ Build automático
- ✅ SSL/HTTPS
- ✅ PWA (Progressive Web App)
- ✅ Service Workers (offline)
- ✅ Caching automático

---

## 📱 PWA (Progressive Web App)

A aplicação é uma PWA completa:
- 📥 Instalável em dispositivos
- 🔌 Funciona offline
- ⚡ Carregamento rápido
- 🔄 Atualizações automáticas

Configuração em:
- `frontend/vite.config.ts`
- `frontend/public/manifest.webmanifest`
- `frontend/src/components/PWAUpdateNotification.tsx`

---

## 🎓 Materiais Educacionais

Localizado em: `frontend/src/pages/Educacional.tsx`

Conteúdo teórico complementado nos cálculos:
- Fórmulas básicas
- Conceitos fundamentais
- Exemplos resolvidos
- Referências bibliográficas

---

## 📚 Referências Técnicas

### Normas Utilizadas
- **ABNT NBR 6502** - Rochas e Solos (Terminologia)
- **ASTM D2487** - Classificação de solos (USCS)
- **ASTM D1140** - Granulometria
- **AASHTO M145** - Classificação de solos (HRB)

### Métodos Utilizados
- **Casagrande** - Limites de Consistência
- **Boussinesq** - Acréscimo de Tensões
- **Terzaghi** - Teoria de Adensamento
- **Proctor** - Compactação
- **Newmark** - Carregamentos circulares

---

## 💡 Tips para Desenvolvimento

1. **Use o TypeScript** - Aproveite a tipagem estática
2. **Componentize** - Divida em componentes pequenos e reutilizáveis
3. **Valide com Zod** - Sempre valide inputs
4. **Teste no mobile** - Use `useIsMobile()` hook
5. **Use Tailwind** - Não escreva CSS customizado
6. **Importe com @** - Use alias `@/` para imports absolutos
7. **Lazy load rotas** - Use `React.lazy()` e `Suspense`

---

## 🤝 Contribuindo

Veja `CONTRIBUTING.md` para instruções detalhadas.

Passos rápidos:
1. Fork o repositório
2. Clone localmente
3. `cd frontend && npm install`
4. `npm run dev`
5. Faça suas mudanças
6. `npm run lint`
7. Commit e Push
8. Abra Pull Request

---

## ❓ FAQ

**P: Posso usar offline?**
R: Sim! 100% offline. Todos os cálculos rodam localmente.

**P: Posso salvar meus cálculos?**
R: Sim! localStorage salva localmente. PWA permite instalar como app.

**P: Tem API?**
R: Não precisa de API. Tudo em TypeScript puro.

**P: Posso contribuir com novos módulos?**
R: Sim! Siga o padrão em CONTRIBUTING.md

**P: Funciona em mobile?**
R: Sim! Interface responsiva e otimizada para mobile.

---

## 📞 Contato e Suporte

- **GitHub Issues** - Reporte bugs
- **Discussions** - Sugestões e feedback
- **Email** - contato@edusolo.com

---

**Desenvolvido com ❤️ para a comunidade de Engenharia Civil**

[⬆ Voltar ao topo](#-arquitetura-e-documentação---edusolo)