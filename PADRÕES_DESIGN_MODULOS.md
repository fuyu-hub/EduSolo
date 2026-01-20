# Padrões de Design - Módulos EduSolo

Este documento detalha as escolhas de design padrão utilizadas nos módulos **Caracterização** e **Compactação**, servindo como referência para consistência e futuros desenvolvimentos.

---

## 📁 Estrutura de Arquivos

### Caracterização
```
frontend/src/modules/caracterizacao/
├── index.tsx          # Componente principal da página
├── store.ts           # Zustand store para estado global
├── types.ts           # Tipos TypeScript
├── components/
│   ├── DialogExemplos.tsx    # Dialog de exemplos
│   ├── LabModeSwitch.tsx     # Switch modo laboratório
│   └── IndicesInput.tsx      # Inputs de índices físicos
```

### Compactação
```
frontend/src/modules/compactacao/
├── store.ts           # Zustand store para persistência
├── schemas.ts         # Schemas Zod de validação
├── types.ts           # Tipos TypeScript
├── common.ts          # Tipos comuns
├── components/
│   ├── CurvaCompactacao.tsx  # Gráfico da curva
│   ├── TabelaResultados.tsx  # Tabela de pontos
│   └── DialogExemplos.tsx    # Dialog de exemplos

frontend/src/pages/Compactacao.tsx  # Componente principal
```

---

## 🎨 Header do Módulo

### Estrutura Visual
```
[Ícone Gradiente] [Título + Subtítulo]                    [Botões de Ação]
```

### Código de Referência
**Arquivo:** `modules/caracterizacao/index.tsx` (linhas 384-418) ou `pages/Compactacao.tsx` (linhas 660-720)

### Componentes do Header

| Elemento | Descrição | Classes CSS |
|----------|-----------|-------------|
| Container | Flex responsivo | `flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-2` |
| Ícone | Quadrado com gradiente | `w-12 h-12 rounded-xl bg-gradient-to-br from-[cor1] to-[cor2] flex items-center justify-center shadow-lg` |
| Título | H1 bold | `text-3xl font-bold text-foreground` |
| Subtítulo | Texto muted | `text-muted-foreground text-sm` |

### Cores de Ícone por Módulo
- **Caracterização:** `from-blue-500 to-cyan-600`
- **Compactação:** `from-violet-500 to-fuchsia-600`

### Botões de Ação (ordem padrão)
1. **Exemplos** - `DialogExemplos` component
2. **Separador** - `<Separator orientation="vertical" />`
3. **Salvar** - `variant="outline"` com ícone `<Save />`
4. **Separador**
5. **Limpar** - `variant="ghost"` com ícone `<Trash2 />`
6. **Calcular** - `variant="default"` (primary) com ícone `<Calculator />`

```tsx
// Exemplo de botão padrão
<Button variant="outline" size="sm" onClick={handleExportPDF} className="gap-2">
  <Save className="w-4 h-4" />
  Salvar
</Button>
```

---

## 📝 Entrada de Dados

### Layout Geral
- Grid de 2 colunas em desktop: `grid grid-cols-1 lg:grid-cols-2 gap-5`
- Cards com classe `glass` para efeito glassmorphism

### Cards de Input
**Arquivo:** `modules/caracterizacao/index.tsx` ou `pages/Compactacao.tsx`

```tsx
<Card className="glass">
  <CardHeader className="pb-2">
    <CardTitle className="text-sm font-semibold flex items-center gap-2 text-[cor-do-modulo]">
      <Icone className="w-4 h-4" />
      Título da Seção
    </CardTitle>
  </CardHeader>
  <CardContent className="space-y-4">
    {/* Inputs aqui */}
  </CardContent>
</Card>
```

### Labels e Inputs

```tsx
<div className="space-y-1.5">
  <Label htmlFor="campo" className="text-sm font-medium">
    Nome do Campo
  </Label>
  <Input
    id="campo"
    type="number"
    placeholder="Ex: 100"
    className="h-9"
    {...form.register("campo")}
  />
</div>
```

### Tooltips de Ajuda
```tsx
<TooltipProvider>
  <Tooltip>
    <TooltipTrigger asChild>
      <Info className="w-4 h-4 text-muted-foreground cursor-help" />
    </TooltipTrigger>
    <TooltipContent>Texto explicativo</TooltipContent>
  </Tooltip>
</TooltipProvider>
```

---

## 📊 Exibição de Resultados

### Layout em Abas
**Arquivo:** Buscar por `<Tabs` em ambos os módulos

```tsx
<Tabs defaultValue="resultados" className="w-full">
  <TabsList className="grid w-full grid-cols-2">
    <TabsTrigger value="resultados" className="gap-1.5">
      <BarChart3 className="w-4 h-4" />
      Resultados
    </TabsTrigger>
    <TabsTrigger value="graficos" className="gap-1.5">
      <LayoutGrid className="w-4 h-4" />
      Gráficos
    </TabsTrigger>
  </TabsList>
  
  <TabsContent value="resultados">...</TabsContent>
  <TabsContent value="graficos">...</TabsContent>
</Tabs>
```

### Componente ResultRow (Linha de Resultado)
**Arquivo:** Final de `modules/caracterizacao/index.tsx` e `pages/Compactacao.tsx`

```tsx
function ResultRow({ 
  label, 
  value, 
  unit, 
  precision = 2, 
  highlight = false 
}: { 
  label: string, 
  value: number | null | undefined, 
  unit: string, 
  precision?: number, 
  highlight?: boolean 
}) {
  if (value === undefined || value === null || isNaN(value)) return null;
  return (
    <div className={cn(
      "flex justify-between items-center text-sm py-2 px-3 rounded-md transition-colors",
      highlight 
        ? "font-semibold bg-primary/5 text-primary" 
        : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
    )}>
      <span className={cn(highlight && "text-foreground")}>{label}</span>
      <span className={cn(
        "font-mono font-medium", 
        highlight ? "text-primary dark:text-primary-foreground" : "text-foreground dark:text-white"
      )}>
        {value.toFixed(precision)} {unit}
      </span>
    </div>
  );
}
```

### Grid de Resultados (2 colunas)
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
  {/* Coluna 1: Parâmetros */}
  <Card className="glass overflow-hidden h-full">
    <CardHeader className="pb-2 pt-4 px-5">
      <CardTitle className="text-sm font-semibold flex items-center gap-2 text-violet-500">
        <Info className="w-4 h-4" />
        Parâmetros do Ensaio
      </CardTitle>
    </CardHeader>
    <CardContent className="px-5 pb-5">
      <div className="space-y-1.5">
        <ResultRow label="Campo" value={valor} unit="unidade" />
      </div>
    </CardContent>
  </Card>

  {/* Coluna 2: Resultados */}
  <Card className="glass overflow-hidden h-full">
    <CardHeader className="pb-2 pt-4 px-5">
      <CardTitle className="text-sm font-semibold flex items-center gap-2 text-emerald-500">
        <BarChart3 className="w-4 h-4" />
        Resultados
      </CardTitle>
    </CardHeader>
    <CardContent className="px-5 pb-5">
      <div className="space-y-1.5">
        <ResultRow label="Resultado" value={valor} unit="unidade" highlight />
      </div>
    </CardContent>
  </Card>
</div>
```

---

## 📈 Gráficos

### Estrutura Padrão
**Arquivo:** `modules/compactacao/components/CurvaCompactacao.tsx` ou `components/limites/LimiteLiquidezChart.tsx`

### Container do Gráfico
```tsx
<div className="bg-white p-4 rounded-xl border border-border shadow-sm w-full">
  <ResponsiveContainer width="100%" height={height}>
    <LineChart margin={{ top: 20, right: 30, left: 20, bottom: 40 }}>
      {/* Conteúdo */}
    </LineChart>
  </ResponsiveContainer>
</div>
```

### Eixos (Estilo Preto)
```tsx
<XAxis
  type="number"
  dataKey="umidade"
  domain={dominioX}
  stroke="#000000"
  tick={{ fontSize: 12, fill: '#000000' }}
  tickFormatter={(val) => val.toFixed(1)}
>
  <Label
    value="Teor de Umidade (%)"
    position="bottom"
    offset={10}
    style={{ fontSize: 14, fontWeight: 'bold', fill: '#000000' }}
  />
</XAxis>
```

### Cores Padrão de Linhas
- **Curva Principal:** `#2563eb` (blue-600)
- **Pontos do Ensaio:** `#dc2626` (red-600)
- **Saturação/Secundária:** `#f59e0b` (amber-500, tracejada)
- **Ponto Ótimo/Destaque:** `#10b981` (emerald-500)

### Seção "Sobre o Gráfico"
```tsx
<Card className="bg-muted/30 border-none shadow-inner">
  <CardContent className="p-4 space-y-2 text-xs text-muted-foreground">
    <p><strong>Título:</strong> Descrição...</p>
    <p><strong>Norma:</strong> NBR XXXX - Descrição.</p>
  </CardContent>
</Card>
```

### Botões do Gráfico
```tsx
<div className="flex justify-between items-center mb-2">
  <div>
    <h3 className="text-sm font-semibold text-foreground">Título do Gráfico</h3>
    <p className="text-xs text-muted-foreground">Subtítulo</p>
  </div>
  <div className="flex gap-2">
    <Button onClick={handleExportJPG} variant="outline" size="sm" className="gap-2">
      <Download className="w-4 h-4" />
      Salvar JPG
    </Button>
    <Button variant="outline" size="sm" className="gap-2">
      <Maximize2 className="w-4 h-4" />
      Ampliar
    </Button>
  </div>
</div>
```

---

## 💾 Persistência de Dados

### Zustand Store (Memória - Não persiste ao recarregar)
**Arquivo:** `modules/caracterizacao/store.ts` ou `modules/compactacao/store.ts`

```tsx
import { create } from 'zustand';

interface ModuloState {
  formData: FormData;
  updateFormData: (data: Partial<FormData>) => void;
  resetForm: () => void;
}

export const useModuloStore = create<ModuloState>((set) => ({
  formData: defaultValues,
  updateFormData: (data) => set((state) => ({
    formData: { ...state.formData, ...data }
  })),
  resetForm: () => set({ formData: defaultValues }),
}));
```

### Sincronização com react-hook-form
```tsx
const { formData, updateFormData } = useModuloStore();

const form = useForm({
  defaultValues: formData,
});

const { reset, watch } = form;

// Restaurar dados do store ao montar
useEffect(() => {
  reset(formData);
}, []);

// Sincronizar mudanças com store
useEffect(() => {
  const subscription = watch((value) => {
    if (value) updateFormData(value as any);
  });
  return () => subscription.unsubscribe();
}, [watch, updateFormData]);
```

---

## 🔍 Como Investigar no Código

### Buscar Padrões Específicos

| O que procurar | Comando grep/busca | Arquivos |
|----------------|-------------------|----------|
| Header do módulo | `data-tour="module-header"` | index.tsx, Compactacao.tsx |
| Botões de ação | `handleExportPDF`, `handleClear` | index.tsx, Compactacao.tsx |
| Cards de entrada | `<Card className="glass"` | *.tsx |
| Tabs de resultado | `<Tabs defaultValue=` | index.tsx, Compactacao.tsx |
| ResultRow | `function ResultRow` | Final dos arquivos principais |
| Gráfico | `<ResponsiveContainer`, `<LineChart` | Componentes de gráfico |
| Store | `create<` | store.ts |
| Validação | `zodResolver`, `z.object` | Arquivos com schemas |

### Padrões de Cor por Módulo

| Módulo | Cor Primária | Ícone Header | Títulos de Seção |
|--------|--------------|--------------|------------------|
| Caracterização | Blue/Cyan | `from-blue-500 to-cyan-600` | `text-blue-500` |
| Compactação | Violet/Fuchsia | `from-violet-500 to-fuchsia-600` | `text-violet-500`, `text-emerald-500` |

---

## ✅ Checklist para Novo Módulo

- [ ] Criar pasta em `modules/[nome]/`
- [ ] Criar `store.ts` com Zustand
- [ ] Criar `schemas.ts` com Zod
- [ ] Criar `types.ts`
- [ ] Criar página principal
- [ ] Implementar Header com gradiente e botões padrão
- [ ] Implementar Cards de entrada com classe `glass`
- [ ] Implementar Tabs (Resultados + Gráficos)
- [ ] Implementar `ResultRow` para exibição
- [ ] Implementar gráfico com fundo branco e eixos pretos
- [ ] Adicionar seção "Sobre o Gráfico"
- [ ] Sincronizar form com store para persistência
- [ ] Adicionar `DialogExemplos` para exemplos
