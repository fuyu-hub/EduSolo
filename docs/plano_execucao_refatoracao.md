# Plano de Execução — Refatoração UI dos Módulos Geotécnicos

> [!IMPORTANT]
> **Este documento é para ser usado na próxima sessão, com o workspace apontando para `EduSolos-teste/frontend`.**
> O usuário vai reverter as mudanças em `indiceslimites/pagina.tsx`, mas manterá os arquivos novos criados.

---

## Estrutura Relevante do Projeto

```
frontend/src/
├── componentes/
│   ├── base/                          # Layout global, impressão, erros
│   │   ├── CabecalhoImpressao.tsx
│   │   ├── LayoutPrincipal.tsx
│   │   └── ...
│   ├── compartilhados/                # Componentes reutilizáveis entre módulos
│   │   ├── BotaoLimpar.tsx            # (existente) Botão com confirmação
│   │   ├── LinhaResultado.tsx         # (existente) Linha de resultado formatada
│   │   ├── TooltipErro.tsx            # (existente) Tooltip de erro inline
│   │   ├── exportacao-grafico.ts      # (existente) Util de exportação html2canvas
│   │   ├── exemplos/
│   │   │   └── BaseDialogoExemplos.tsx # (existente) Base genérica de dialog de exemplos
│   │   │
│   │   ├── CabecalhoModulo.tsx        # ✅ CRIADO — Header padronizado
│   │   ├── AlertaErro.tsx             # ✅ CRIADO — Alerta de erro reutilizável
│   │   ├── LayoutDividido.tsx         # ✅ CRIADO — Split-screen com sticky
│   │   └── ContainerGrafico.tsx       # ✅ CRIADO — Wrapper de gráfico exportável
│   │
│   ├── dialogos/
│   └── icones/
│
├── hooks/
│   ├── useAutoCalculo.ts              # ✅ CRIADO — Debounce de cálculo automático
│   ├── use-debounce.ts                # (existente, genérico)
│   └── ...
│
├── lib/
│   ├── ui-standards.ts                # (existente) Padrões de UI centralizados
│   ├── navigation.ts                  # (existente) handleArrowNavigation
│   └── utils.ts
│
├── modulos/
│   ├── indiceslimites/
│   │   ├── pagina.tsx                 # 🔄 REVERTIDO — Precisa ser refatorado
│   │   ├── store.ts
│   │   ├── calculos.ts
│   │   ├── types.ts
│   │   ├── exemplos.ts
│   │   └── componentes/
│   │       ├── DialogExemplos.tsx      # Usa BaseDialogoExemplos ✅
│   │       ├── LimiteLiquidezChart.tsx
│   │       └── DiagramaFases.tsx
│   │
│   ├── compactacao/
│   │   ├── pagina.tsx                 # 🔲 Precisa ser refatorado
│   │   ├── store.ts
│   │   ├── calculos.ts
│   │   ├── types.ts
│   │   ├── exemplos.ts
│   │   └── componentes/
│   │       ├── DialogExemplos.tsx      # Usa BaseDialogoExemplos ✅
│   │       ├── CurvaCompactacao.tsx
│   │       └── TabelaResultados.tsx
│   │
│   └── granulometrialab/
│       ├── pagina.tsx                 # 🔲 Precisa ser refatorado
│       ├── store.ts
│       ├── calculos.ts
│       ├── types.ts
│       ├── exemplos.ts
│       └── componentes/
│           ├── DialogExemplos.tsx      # ⚠️ NÃO usa BaseDialogoExemplos (precisa migrar)
│           ├── CurvaGranulometrica.tsx
│           └── TabelaDadosGranulometricos.tsx
```

---

## Arquivos Já Criados (manter)

### 1. `src/componentes/compartilhados/CabecalhoModulo.tsx`
Header padronizado para todas as páginas de módulo.

**Props:**
```tsx
interface CabecalhoModuloProps {
  icone: ReactNode;        // <Beaker className={UI_STANDARDS.header.icon} />
  titulo: string;          // "Índices Físicos e Limites de Consistência"
  subtitulo: string;       // "Análise das propriedades físicas do solo"
  acoes?: ReactNode[];     // [<DialogExemplos />, <BotaoLimpar />] — separadores são auto-inseridos
  dataTour?: string;       // default "module-header"
}
```

**Uso esperado (substitui ~15 linhas de header em cada página):**
```tsx
<CabecalhoModulo
  icone={<Beaker className={UI_STANDARDS.header.icon} />}
  titulo="Índices Físicos e Limites de Consistência"
  subtitulo="Análise das propriedades físicas do solo"
  acoes={[
    <DialogExemplos key="exemplos" onSelectExample={handleLoadExample} />,
    <BotaoLimpar key="limpar" onLimpar={handleClear} />,
  ]}
/>
```

### 2. `src/componentes/compartilhados/AlertaErro.tsx`
Componente de alerta de erro. Renderiza condicionalmente (se `erro` é null/undefined, não mostra nada).

**Props:**
```tsx
interface AlertaErroProps {
  erro: string | null | undefined;
  titulo?: string;     // default "Erro"
  className?: string;
}
```

**Uso (substitui o bloco Alert+AlertCircle repetido):**
```tsx
// Antes (repetido em cada módulo):
{apiError && (
  <Alert variant="destructive" className="p-2">
    <AlertCircle className="h-4 w-4" />
    <AlertTitle className="text-sm">Erro</AlertTitle>
    <AlertDescription className="text-xs">{apiError}</AlertDescription>
  </Alert>
)}

// Depois:
<AlertaErro erro={apiError} />
```

### 3. `src/hooks/useAutoCalculo.ts`
Hook que encapsula o padrão debounce + cálculo automático.

**Assinatura:**
```tsx
function useAutoCalculo(
  calculoFn: () => void,
  dependencias: React.DependencyList,
  debounceMs: number = 250
): void
```

**Uso (substitui ~8 linhas de useEffect+setTimeout+clearTimeout+useRef):**
```tsx
// Antes:
const debounceRef = useRef<ReturnType<typeof setTimeout>>();
useEffect(() => {
  clearTimeout(debounceRef.current);
  debounceRef.current = setTimeout(handleCalculate, 250);
  return () => clearTimeout(debounceRef.current);
}, [indices, settings, globalLimites]);

// Depois:
useAutoCalculo(handleCalculate, [indices, settings, globalLimites], 250);
```

### 4. `src/componentes/compartilhados/LayoutDividido.tsx`
Layout split-screen com sticky no painel direito (comportamento da Granulometria).

**Props:**
```tsx
interface LayoutDivididoProps {
  painelEsquerdo: ReactNode;
  painelDireito: ReactNode;
  modo?: "default" | "side-by-side";  // default: "side-by-side"
  proporcao?: string;                  // CSS grid-template-columns, ex: "6fr 4fr"
  stickyDireito?: boolean;             // default: true quando side-by-side
  className?: string;
  classNameEsquerdo?: string;
  classNameDireito?: string;
}
```

### 5. `src/componentes/compartilhados/ContainerGrafico.tsx`
Wrapper universal para gráficos com botões Ampliar/Salvar JPG, dialog de ampliação, div oculta para exportação, e empty state.

**Props resumidas:**
```tsx
interface ContainerGraficoProps {
  exportId: string;           // ID para html2canvas
  exportFileName: string;     // nome do .jpg
  dialogTitle?: string;
  children: ReactNode;        // gráfico normal
  renderAmpliar?: ReactNode;  // gráfico versão dialog
  renderExportar?: ReactNode; // gráfico versão export (alta-res)
  vazio?: boolean;            // mostra empty state
  mensagemVazio?: string;
  descricaoVazio?: string;
  rodape?: ReactNode;         // legendas, equações
  semAcoes?: boolean;
  className?: string;
}

// Ref expõe:
export interface ContainerGraficoRef {
  exportAsJPG: () => Promise<void>;
  getImageForExport: () => Promise<string | null>;
}
```

---

## O Que Fazer em Cada Página (Plano de Refatoração)

### Módulo: `indiceslimites/pagina.tsx` (🔄 revertido, refazer)

| Item | O que fazer |
|------|------------|
| **Imports** | Remover: `Alert`, `AlertDescription`, `Separator`, `AlertCircle`, `Collapsible*`, `CheckCircle`, `ArrowRight`. Adicionar: `CabecalhoModulo`, `AlertaErro`, `LayoutDividido`, `useAutoCalculo`. Unificar os 2 imports de calculos em um só. |
| **sessionStorage restore** | Remover o `useEffect` que lê `caracterizacao_lastData` (linhas 66-81 no original). Funcionalidade removida. |
| **debounceRef + useEffect** | Remover `debounceRef` e o `useEffect` de debounce. Substituir por `useAutoCalculo(handleCalculate, [indices, settings, globalLimites], 250)`. |
| **Header** | Substituir o bloco `<div className={UI_STANDARDS.header.container}>...` (~15 linhas) por `<CabecalhoModulo>` com acoes array. |
| **Layout 60/40** | Substituir `<div className="grid grid-cols-1 lg:grid-cols-[6fr,4fr] gap-6">` por `<LayoutDividido proporcao="6fr 4fr" painelEsquerdo={...} painelDireito={...} />`. **ATENÇÃO**: o conteúdo de cada prop deve ser envolvido em uma `<div>` ou `<>` fragment, sem JSX comments dentro das prop expressions. |
| **Erro no Resultado** | Substituir `{resultadoCombinado?.erro && (<Alert variant="destructive">...)}` por `<AlertaErro erro={resultadoCombinado?.erro} />`. |

### Módulo: `compactacao/pagina.tsx` (🔲 a fazer)

| Item | O que fazer |
|------|------------|
| **Imports** | Remover: `Alert`, `AlertDescription`, `AlertTitle`, `AlertCircle`, `Separator` (do header). Adicionar: `CabecalhoModulo`, `AlertaErro`, `LayoutDividido`, `useAutoCalculo`. |
| **Toast import** | Mudar de `import { toast } from "@/components/ui/sonner"` para `import { toast } from "sonner"` (padronizar). |
| **Header** | Substituir bloco `<div className={UI_STANDARDS.header.container}>...` por `<CabecalhoModulo>`. **Nota**: o `TooltipProvider` que envolve as ações pode ser movido para dentro do array de ações ou removido se desnecessário. |
| **Layout** | Substituir `<div className={UI_STANDARDS.mainGrid}>` por `<LayoutDividido proporcao="1fr 1fr" painelEsquerdo={...} painelDireito={...} />`. |
| **Auto-cálculo** | A compactação usa `watch` do react-hook-form com `handleCalculate(data, true)`. Diferente do padrão dos outros — manter a subscription do `watch` mas substituir os `setTimeout` internos se houver. |
| **Alertas de erro** | Substituir os dois blocos `<Alert variant="destructive">` (linhas 607-612 e 628-631) por `<AlertaErro>`. |
| **Empty state** | Substituir o bloco hardcoded "Nenhum resultado ainda" (linhas 620-626) por usar ContainerGrafico ou um empty state padronizado. |

### Módulo: `granulometrialab/pagina.tsx` (🔲 a fazer)

| Item | O que fazer |
|------|------------|
| **Header** | ⚠️ Este módulo **NÃO usa UI_STANDARDS** para o header (tudo hardcoded, linhas 390-421). Substituir por `<CabecalhoModulo>`. Adicionar o botão de Layout toggle como ação extra. |
| **Layout side-by-side** | Substituir a lógica de `layoutMode` state + localStorage + condicional `cn(layoutMode === 'side-by-side' ? ...)` pelo `<LayoutDividido modo={layoutMode}>`. O toggle button muda o `modo` prop. |
| **sessionStorage restore** | Remover o `useEffect` que lê `granulometria_lastData` (linhas 85-98). |
| **Auto-cálculo** | Substituir `useEffect(() => { setTimeout(handleCalculate, 0) }, [formData])` por `useAutoCalculo(handleCalculate, [formData], 0)`. |
| **handleKeyNavigation** | A função local de ~40 linhas (243-282) pode permanecer por enquanto — é específica pois navega com `type="number"` inputs. Futuramente abstrair num hook. |
| **Empty states** | Substituir o bloco traçejado "Carta de Plasticidade indisponível" (linhas 787-791) pelo padrão do ContainerGrafico. |
| **DialogExemplos** | ⚠️ **Migrar** para usar `BaseDialogExemplos` (como os outros módulos fazem). Atualmente é o único com implementação própria do dialog. |
| **Toast import** | Mudar de `import { toast } from "@/components/ui/sonner"` para `import { toast } from "sonner"`. |

---

## Ordem de Execução Recomendada

```
1. ✅ Refatorar indiceslimites/pagina.tsx  (CabecalhoModulo, useAutoCalculo, AlertaErro, remover session restore, limpar imports)
2. ✅ Verificar com tsc --noEmit (0 erros)
3. ✅ Refatorar compactacao/pagina.tsx     (CabecalhoModulo, AlertaErro, toast import, limpar imports)
4. ✅ Verificar com tsc --noEmit (0 erros)
5. ✅ Refatorar granulometria/pagina.tsx   (CabecalhoModulo, useAutoCalculo, toast)
6. ⏭️ granulometrialab — IGNORADO por decisão do usuário
7. ⏭️ LayoutDividido — ADIADO para sessão futura
8. ✅ Verificação final
```

> [!TIP]
> Ao usar `LayoutDividido`, sempre envolver o conteúdo de `painelEsquerdo` e `painelDireito` em um elemento wrapper (`<div>` ou `<>`). Nunca colocar JSX comments `{/* */}` diretamente dentro de uma prop expression — isso quebra o parser TSX.
