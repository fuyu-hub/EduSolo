# 🔧 Guia de Integração das Otimizações

## Como Adicionar Otimizações a Uma Página Existente

### Passo 1: Imports Necessários

```typescript
// No topo do arquivo da página
import { useState, useCallback, useMemo } from "react";
import { useCalculationHistory } from "@/hooks/use-calculation-history";
import { useDebounce } from "@/hooks/use-debounce";
import { useCalculationStore } from "@/stores/calculationStore";
import { UndoRedoToolbar } from "@/components/UndoRedoToolbar";
import { RecentCalculations } from "@/components/RecentCalculations";
```

### Passo 2: Adicionar Stores e Hooks

```typescript
function MinhaPageina() {
  // Seu estado existente
  const [formData, setFormData] = useState({...});
  const [result, setResult] = useState(null);

  // NOVO: Adicionar debounce
  const debouncedFormData = useDebounce(formData, 500);

  // NOVO: Adicionar undo/redo
  const { undo, redo, canUndo, canRedo, clear } = useCalculationHistory(
    debouncedFormData,
    true
  );

  // NOVO: Store para salvar cálculos
  const { addCalculation } = useCalculationStore();

  // Resto do código...
}
```

### Passo 3: Otimizar Handlers com useCallback

```typescript
// ANTES:
const handleChange = (field, value) => {
  setFormData({ ...formData, [field]: value });
};

// DEPOIS:
const handleChange = useCallback((field, value) => {
  setFormData(prev => ({ ...prev, [field]: value }));
}, []);
```

### Passo 4: Salvar Cálculos no Store

```typescript
const handleCalculate = useCallback(async () => {
  // Seu cálculo existente
  const resultado = await fazerCalculo(formData);
  setResult(resultado);

  // NOVO: Salvar no histórico
  addCalculation({
    type: "indices-fisicos", // tipo único
    moduleName: "Índices Físicos", // nome amigável
    inputs: formData,
    outputs: resultado,
    title: `Cálculo: ${resultado.valor_principal}`,
  });
}, [formData, addCalculation]);
```

### Passo 5: Adicionar Componentes na UI

```typescript
return (
  <div className="container mx-auto py-6 space-y-6">
    {/* Cabeçalho com Undo/Redo */}
    <div className="flex items-center justify-between">
      <h1>Minha Página</h1>
      
      {/* NOVO: Toolbar Undo/Redo */}
      <UndoRedoToolbar
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={undo}
        onRedo={redo}
        onReset={() => {
          setFormData(initialState);
          clear();
        }}
      />
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Sua página existente */}
      <div className="lg:col-span-2">
        {/* Formulários e resultados */}
      </div>

      {/* NOVO: Cálculos Recentes */}
      <div className="lg:col-span-1">
        <RecentCalculations
          moduleName="Índices Físicos"
          maxItems={10}
        />
      </div>
    </div>
  </div>
);
```

## Exemplo Completo

Veja o arquivo `src/pages/PageTemplateOptimized.tsx` para um exemplo completo funcionando.

## Checklist de Otimização

### Performance
- [ ] Adicionar `useCallback` em funções passadas como props
- [ ] Adicionar `useMemo` em cálculos pesados
- [ ] Adicionar `React.memo` em componentes que renderizam listas
- [ ] Adicionar debounce em validações

### Funcionalidades
- [ ] Integrar `UndoRedoToolbar`
- [ ] Integrar `RecentCalculations`
- [ ] Salvar cálculos no store
- [ ] Adicionar atalhos de teclado (Ctrl+Z, Ctrl+Shift+Z)

### UX
- [ ] Feedback visual ao calcular (loading)
- [ ] Validação em tempo real
- [ ] Mensagens de erro claras
- [ ] Tooltips informativos

## Páginas Prioritárias para Otimizar

1. **IndicesFisicos** - Muitos campos, cálculos complexos
2. **Granulometria** - Tabelas grandes, muitos dados
3. **Compactacao** - Gráficos e cálculos iterativos
4. **TensoesGeostaticas** - Múltiplas camadas de entrada
5. **AcrescimoTensoes** - Cálculos pesados

## Dicas

### ✅ Faça:
- Comece com uma página simples
- Teste cada adição incrementalmente
- Use o template como referência
- Mantenha a lógica de negócio existente

### ❌ Evite:
- Reescrever tudo de uma vez
- Otimizar antes de medir
- Adicionar complexidade sem benefício
- Quebrar funcionalidades existentes

## Medindo o Impacto

### Antes de Otimizar:
```typescript
// Abra DevTools > Performance
// Grave uma sessão de uso
// Note: Scripting time, Rendering time
```

### Depois de Otimizar:
```typescript
// Grave outra sessão
// Compare os tempos
// Verifique re-renders no React DevTools Profiler
```

## Troubleshooting

### Problema: Undo/Redo não funciona
**Causa:** Histórico não está sendo atualizado
**Solução:** Verificar se `debouncedFormData` está sendo passado corretamente

### Problema: Cálculos não aparecem em "Recentes"
**Causa:** `addCalculation` não está sendo chamado
**Solução:** Adicionar chamada após cálculo bem-sucedido

### Problema: App ficou mais lento
**Causa:** Otimização prematura ou uso incorreto de memo
**Solução:** Remover otimizações e adicionar uma de cada vez

## Suporte

- Template completo: `src/pages/PageTemplateOptimized.tsx`
- Exemplo de formulário: `src/components/OptimizedFormExample.tsx`
- Documentação: `frontend/docs/OPTIMIZATION_GUIDE.md`

