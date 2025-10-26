# Padrão de Implementação de Hints (Tooltips)

## 📌 Objetivo
Padronizar a implementação de hints/tooltips em todos os módulos do EduSolo para garantir consistência visual e de usabilidade.

## ✅ Padrão Adotado

### Estrutura HTML/TSX
```tsx
<div className="flex items-center gap-2">
  <Label htmlFor="inputId" className="text-xs">Nome do Campo</Label>
  <Tooltip>
    <TooltipTrigger>
      <Info className="w-4 h-4 text-muted-foreground cursor-help" />
    </TooltipTrigger>
    <TooltipContent className="max-w-xs">
      <p>{tooltips.nomeCampo}</p>
    </TooltipContent>
  </Tooltip>
</div>
```

### Características do Padrão

1. **Estrutura externa**: `<div className="flex items-center gap-2">`
   - Alinhamento vertical centralizado
   - Espaçamento de `gap-2` (0.5rem/8px) entre label e ícone

2. **Label separado**: `<Label htmlFor="inputId" className="text-xs">`
   - Label mantido como elemento independente
   - Tamanho de fonte: `text-xs`
   - Vinculado ao input através do `htmlFor`

3. **Ícone Info**: `<Info className="w-4 h-4 text-muted-foreground cursor-help" />`
   - Tamanho: `w-4 h-4` (1rem/16px)
   - Cor: `text-muted-foreground`
   - Cursor: `cursor-help` (ponto de interrogação ao passar o mouse)

4. **TooltipContent**: `<TooltipContent className="max-w-xs">`
   - Largura máxima: `max-w-xs` (20rem/320px)
   - Conteúdo dentro de tag `<p>` para melhor formatação

5. **Definição de tooltips**: Objeto no início do arquivo
```tsx
const tooltips = {
  nomeCampo: "Descrição detalhada do campo...",
  // ...outros campos
};
```

## ❌ Anti-Padrões (Evitar)

### ⚠️ Tamanhos de ícone inconsistentes
```tsx
// NÃO USAR
<Info className="w-3 h-3" />  // Muito pequeno
<Info className="w-2.5 h-2.5" />  // Muito pequeno
```

### ⚠️ Gap inconsistente
```tsx
// NÃO USAR
<div className="flex items-center gap-1">  // Muito apertado
```

### ⚠️ Label e ícone misturados
```tsx
// EVITAR (dificulta manutenção)
<Label className="flex items-center gap-1">
  Nome do Campo
  <Tooltip>...</Tooltip>
</Label>
```

### ⚠️ Falta de `cursor-help`
```tsx
// NÃO USAR (não indica que é interativo)
<Info className="w-4 h-4 text-muted-foreground" />
```

## 📂 Módulos Padronizados

- ✅ IndicesFisicos.tsx
- ✅ Granulometria.tsx (em andamento)
- ⏳ LimitesConsistencia.tsx
- ⏳ Compactacao.tsx
- ⏳ TensoesGeostaticas.tsx

## 🎯 Benefícios

1. **Consistência Visual**: Todos os hints têm o mesmo tamanho e espaçamento
2. **Usabilidade**: `cursor-help` indica claramente elementos interativos
3. **Manutenibilidade**: Estrutura previsível facilita refatoração
4. **Acessibilidade**: Estrutura semântica correta com labels e tooltips
5. **Responsividade**: `max-w-xs` garante que tooltips não quebrem em telas pequenas

## 📝 Notas de Implementação

- Sempre envolver o formulário com `<TooltipProvider>` no nível superior
- Manter objeto `tooltips` no início do arquivo para fácil localização
- Usar descrições claras e concisas nos tooltips
- Referenciar normas técnicas quando aplicável (ex: NBR 7181)

