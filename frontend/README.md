# 🎨 EduSolo Frontend - Interface do Usuário

## 📋 Visão Geral

Interface moderna e responsiva para a plataforma EduSolo, desenvolvida com **React 18**, **TypeScript** e **Tailwind CSS**.

## 🏗️ Arquitetura

```
frontend/
├── public/
│   ├── favicon.ico
│   ├── placeholder.svg
│   └── robots.txt
├── src/
│   ├── components/           # Componentes React
│   │   ├── ui/              # Componentes base (shadcn/ui)
│   │   ├── visualizations/  # Gráficos e diagramas
│   │   ├── granulometria/   # Componentes específicos de granulometria
│   │   ├── soil/            # Componentes de solo
│   │   ├── Layout.tsx       # Layout principal
│   │   ├── PrintHeader.tsx  # Cabeçalho para impressão
│   │   ├── SaveDialog.tsx   # Diálogo de salvamento
│   │   └── ...
│   ├── contexts/            # React Context
│   │   ├── ThemeContext.tsx
│   │   └── SettingsContext.tsx
│   ├── hooks/               # Custom Hooks
│   │   ├── use-mobile.tsx
│   │   ├── use-theme.ts
│   │   ├── use-settings.ts
│   │   └── use-saved-calculations.ts
│   ├── lib/                 # Utilitários e Helpers
│   │   ├── calculation-helpers.ts
│   │   ├── export-utils.ts
│   │   ├── unit-converter.ts
│   │   ├── soil-constants.ts
│   │   ├── peneiras-padrao.ts
│   │   └── utils.ts
│   ├── pages/               # Páginas da aplicação
│   │   ├── Index.tsx
│   │   ├── Dashboard.tsx
│   │   ├── IndicesFisicos.tsx
│   │   ├── LimitesConsistencia.tsx
│   │   ├── Granulometria.tsx
│   │   ├── Compactacao.tsx
│   │   ├── Tensoes.tsx
│   │   ├── AcrescimoTensoes.tsx
│   │   ├── Educacional.tsx
│   │   ├── Settings.tsx
│   │   └── NotFound.tsx
│   ├── styles/              # Estilos globais
│   │   └── print.css
│   ├── App.tsx              # Componente raiz
│   ├── main.tsx             # Entrada da aplicação
│   └── index.css            # Estilos globais
├── components.json          # Configuração shadcn/ui
├── tailwind.config.ts       # Configuração Tailwind
├── vite.config.ts           # Configuração Vite
├── tsconfig.json            # Configuração TypeScript
└── package.json
```

## 🚀 Instalação e Execução

### Instalação

```bash
# Navegar para o diretório do frontend
cd frontend

# Instalar dependências (npm)
npm install

# Ou usando bun (mais rápido)
bun install
```

### Executar em Desenvolvimento

```bash
# Com npm
npm run dev

# Com bun
bun dev
```

A aplicação estará disponível em: **http://localhost:5173**

### Build para Produção

```bash
# Build otimizado
npm run build
# ou
bun run build

# Preview do build
npm run preview
```

Os arquivos otimizados estarão em `dist/`.

### Linting

```bash
npm run lint
```

## 🛠️ Tecnologias e Bibliotecas

### Core

- **React 18.3** - Biblioteca UI
- **TypeScript 5.8** - Superset tipado do JavaScript
- **Vite 5.4** - Build tool e dev server ultrarrápido

### UI Framework

- **Tailwind CSS 3.4** - Framework CSS utility-first
- **shadcn/ui** - Coleção de componentes reutilizáveis
- **Radix UI** - Primitivos de UI acessíveis

### Gerenciamento de Estado

- **TanStack Query (React Query) 5.83** - Gerenciamento de estado assíncrono
- **React Context API** - Estado global (tema, configurações)

### Roteamento

- **React Router DOM 6.30** - Roteamento declarativo

### Gráficos e Visualizações

- **Recharts 2.15** - Biblioteca de gráficos para React
- **Custom D3-like visualizations** - Diagramas personalizados

### Formulários

- **React Hook Form 7.61** - Gerenciamento de formulários
- **Zod 3.25** - Validação de schemas TypeScript-first

### Utilitários

- **axios 1.12** - Cliente HTTP
- **clsx + tailwind-merge** - Utilitários de classes CSS
- **date-fns 3.6** - Manipulação de datas
- **lucide-react 0.462** - Ícones

### Exportação

- **jsPDF 3.0** - Geração de PDFs
- **html2canvas 1.4** - Captura de tela para exportação

### Notificações

- **Sonner 1.7** - Toast notifications elegantes

## 📄 Páginas Principais

### 🏠 Index (`/`)

Landing page com apresentação da plataforma.

### 📊 Dashboard (`/dashboard`)

Dashboard principal com cards de acesso rápido aos módulos.

### 📐 Módulos de Cálculo

#### Índices Físicos (`/indices-fisicos`)

- Formulário com validação em tempo real
- Diagrama de fases interativo
- Cálculo de múltiplos índices
- Exemplos pré-configurados
- Exportação para PDF

#### Limites de Consistência (`/limites-consistencia`)

- Entrada de dados de ensaio LL e LP
- Gráfico de LL (log golpes vs umidade)
- Carta de Plasticidade de Casagrande
- Classificação automática
- Cálculo de índices (IP, IC, Ia)

#### Granulometria (`/granulometria`)

- Seletor de peneiras padrão
- Entrada de massas retidas
- Curva granulométrica interativa
- Cálculo de D10, D30, D60, Cu, Cc
- Classificação USCS automática
- Tabela de dados granulométricos

#### Compactação (`/compactacao`)

- Entrada de dados de Proctor
- Curva de compactação
- Curva de saturação (S=100%)
- Determinação de wₒₜ e γd,max

#### Tensões Geostáticas (`/tensoes`)

- Editor de camadas de solo
- Configuração de NA e capilaridade
- Gráficos de tensões vs profundidade
- Tabela de resultados

#### Acréscimo de Tensões (`/acrescimo-tensoes`)

- Seleção de tipo de carga
- Visualização 3D do problema
- Cálculo de Δσᵥ
- Métodos: Boussinesq, Faixa, Circular

#### Material Educacional (`/educacional`)

- Conteúdo teórico
- Fórmulas e conceitos
- Exemplos resolvidos

#### Configurações (`/settings`)

- Preferências de tema
- Unidades de medida
- Configurações de precisão

## 🎨 Sistema de Design

### Temas

A aplicação suporta **modo claro** e **modo escuro**, gerenciado pelo `ThemeContext`:

```tsx
import { useTheme } from "@/hooks/use-theme";

function MyComponent() {
  const { theme, setTheme } = useTheme();
  
  return (
    <button onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
      Alternar Tema
    </button>
  );
}
```

### Cores (Tailwind)

```css
/* Cores principais */
--primary: 220 90% 56%;      /* Azul principal */
--secondary: 220 15% 25%;    /* Cinza escuro */
--accent: 38 92% 50%;        /* Laranja */
--success: 142 76% 36%;      /* Verde */
--warning: 38 92% 50%;       /* Amarelo */
--destructive: 0 84% 60%;    /* Vermelho */
```

### Componentes UI

Baseados em **shadcn/ui**:

- `Button`, `Input`, `Label`
- `Card`, `Dialog`, `Tabs`
- `Select`, `Checkbox`, `Switch`
- `Table`, `Alert`, `Toast`
- `Accordion`, `Popover`, `Tooltip`
- E muito mais...

### Tipografia

```css
/* Fontes */
font-family: 'Inter', system-ui, sans-serif;

/* Escalas */
text-xs   → 0.75rem
text-sm   → 0.875rem
text-base → 1rem
text-lg   → 1.125rem
text-xl   → 1.25rem
text-2xl  → 1.5rem
text-3xl  → 1.875rem
text-4xl  → 2.25rem
```

## 🔧 Componentes Customizados

### DiagramaFases

Visualização interativa do diagrama de fases dos solos.

```tsx
import { DiagramaFases } from "@/components/visualizations/DiagramaFases";

<DiagramaFases
  Vs={1}
  Vw={0.5}
  Va={0.3}
  Ws={2.65}
  Ww={0.5}
/>
```

### PlasticityChart

Carta de Plasticidade de Casagrande interativa.

```tsx
import { PlasticityChart } from "@/components/visualizations/PlasticityChart";

<PlasticityChart
  ll={45}
  ip={20}
  pontos={[{ll: 45, ip: 20, label: "Amostra 1"}]}
/>
```

### CurvaGranulometrica

Curva granulométrica com escala logarítmica.

```tsx
import { CurvaGranulometrica } from "@/components/granulometria/CurvaGranulometrica";

<CurvaGranulometrica
  dados={dadosGranulometricos}
  d10={0.08}
  d30={0.5}
  d60={2.0}
/>
```

## 🔌 Integração com API

### Configuração Axios

```tsx
// lib/api.ts
import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8000",
  headers: {
    "Content-Type": "application/json",
  },
});

export default api;
```

### Uso com TanStack Query

```tsx
import { useQuery, useMutation } from "@tanstack/react-query";
import api from "@/lib/api";

// Query
const { data, isLoading, error } = useQuery({
  queryKey: ["calcular", "indices-fisicos"],
  queryFn: async () => {
    const response = await api.post("/calcular/indices-fisicos", dados);
    return response.data;
  },
});

// Mutation
const mutation = useMutation({
  mutationFn: async (dados) => {
    const response = await api.post("/calcular/indices-fisicos", dados);
    return response.data;
  },
  onSuccess: (data) => {
    console.log("Sucesso:", data);
  },
});
```

## 📱 Responsividade

A aplicação é totalmente responsiva, com breakpoints:

```css
sm:  640px   /* Smartphones landscape */
md:  768px   /* Tablets */
lg:  1024px  /* Laptops */
xl:  1280px  /* Desktops */
2xl: 1536px  /* Large screens */
```

### Hook useIsMobile

```tsx
import { useIsMobile } from "@/hooks/use-mobile";

function MyComponent() {
  const isMobile = useIsMobile();
  
  return (
    <div className={isMobile ? "mobile-layout" : "desktop-layout"}>
      {/* Conteúdo */}
    </div>
  );
}
```

## 💾 Salvamento Local

Os cálculos podem ser salvos localmente usando `localStorage`:

```tsx
import { useSavedCalculations } from "@/hooks/use-saved-calculations";

const { saved, saveCalculation, deleteCalculation } = useSavedCalculations();

// Salvar
saveCalculation({
  id: Date.now().toString(),
  module: "indices-fisicos",
  name: "Cálculo 1",
  data: { /* dados */ },
  timestamp: new Date().toISOString(),
});

// Listar
console.log(saved);

// Deletar
deleteCalculation(id);
```

## 🖨️ Exportação e Impressão

### Exportar para PDF

```tsx
import { exportToPDF } from "@/lib/export-utils";

const handleExport = () => {
  exportToPDF("elemento-id", "nome-arquivo.pdf");
};
```

### Estilos de Impressão

Arquivo `styles/print.css` contém estilos específicos para impressão:

```css
@media print {
  .no-print {
    display: none;
  }
  
  .page-break {
    page-break-after: always;
  }
}
```

## 🧪 Boas Práticas

### Estrutura de Componentes

```tsx
// Imports
import { useState } from "react";
import { Button } from "@/components/ui/button";

// Types/Interfaces
interface MyComponentProps {
  title: string;
  onSubmit: () => void;
}

// Component
export function MyComponent({ title, onSubmit }: MyComponentProps) {
  const [value, setValue] = useState("");

  return (
    <div>
      <h1>{title}</h1>
      <Button onClick={onSubmit}>Enviar</Button>
    </div>
  );
}
```

### Convenções de Nomenclatura

- **Componentes**: PascalCase (`MyComponent.tsx`)
- **Hooks**: camelCase com prefixo `use` (`useMyHook.ts`)
- **Utilitários**: camelCase (`myUtil.ts`)
- **Constantes**: UPPER_SNAKE_CASE (`MY_CONSTANT`)

### Organização de Imports

```tsx
// 1. React/bibliotecas externas
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

// 2. Componentes UI
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

// 3. Componentes locais
import { MyComponent } from "@/components/MyComponent";

// 4. Hooks
import { useTheme } from "@/hooks/use-theme";

// 5. Utilitários
import { cn } from "@/lib/utils";

// 6. Types
import type { MyType } from "@/types";
```

## 🔧 Variáveis de Ambiente

Crie um arquivo `.env` na raiz do frontend:

```env
# API Backend
VITE_API_URL=http://localhost:8000

# Ambiente
VITE_ENV=development

# Analytics (opcional)
VITE_GA_ID=UA-XXXXXXXXX-X
```

Acesso nas variáveis:

```tsx
const apiUrl = import.meta.env.VITE_API_URL;
```

## 🚀 Deploy

### Build

```bash
npm run build
```

### Deploy Estático (Vercel, Netlify)

```bash
# Vercel
vercel deploy

# Netlify
netlify deploy --prod
```

### Configuração para SPA

Arquivo `public/_redirects` (Netlify):

```
/*    /index.html   200
```

Arquivo `vercel.json`:

```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

## 🎯 Performance

### Code Splitting

```tsx
import { lazy, Suspense } from "react";

const Dashboard = lazy(() => import("./pages/Dashboard"));

function App() {
  return (
    <Suspense fallback={<div>Carregando...</div>}>
      <Dashboard />
    </Suspense>
  );
}
```

### Otimizações Vite

```ts
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'ui-vendor': ['@radix-ui/react-dialog', '@radix-ui/react-select'],
        },
      },
    },
  },
});
```

## 🐛 Debug

### React DevTools

Instale a extensão [React Developer Tools](https://react.dev/learn/react-developer-tools)

### Vite Inspector

```tsx
// Pressione Shift + Alt + Click em qualquer elemento
// para abrir o arquivo no editor
```

## 📞 Suporte

- **Issues**: https://github.com/seu-usuario/edusolo/issues
- **Discussões**: https://github.com/seu-usuario/edusolo/discussions
- **Email**: frontend@edusolo.com

## 🔄 Scripts Disponíveis

```json
{
  "dev": "vite",                    // Servidor de desenvolvimento
  "build": "vite build",            // Build de produção
  "build:dev": "vite build --mode development",
  "lint": "eslint .",               // Linting
  "preview": "vite preview"         // Preview do build
}
```

---

<div align="center">

**Interface desenvolvida com React + TypeScript** ⚛️

[⬆ Voltar ao README Principal](../README.md)

</div>

