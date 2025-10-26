# Guia de Responsividade - EduSolo

## 📱 Breakpoints do Tailwind CSS

O projeto usa os breakpoints padrão do Tailwind CSS:

```
sm:   640px  (Smartphones landscape, tablets portrait pequenos)
md:   768px  (Tablets portrait)
lg:   1024px (Tablets landscape, laptops pequenos)
xl:   1280px (Laptops, desktops)
2xl:  1536px (Desktops grandes, monitores wide)
```

### Hook Customizado

```tsx
// use-mobile.tsx
const MOBILE_BREAKPOINT = 768; // Considera mobile < 768px
```

## 🎯 Estratégia Mobile-First

Todas as classes devem ser escritas pensando primeiro em mobile:

```tsx
// ✅ BOM - Mobile-first
<div className="text-sm md:text-base lg:text-lg">

// ❌ EVITAR - Desktop-first
<div className="text-lg lg:text-base md:text-sm">
```

## 📐 Padrões de Layout Responsivo

### Grid Layouts

```tsx
// Padrão para formulários
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* Conteúdo */}
</div>

// Padrão para dashboard/cards
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
  {/* Cards */}
</div>
```

### Flex Layouts

```tsx
// Headers responsivos
<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
  <h1>Título</h1>
  <div className="flex gap-2">Botões</div>
</div>
```

### Espaçamentos

```tsx
// Padding responsivo para cards
<Card className="p-4 sm:p-6 lg:p-8">

// Gaps responsivos
<div className="space-y-4 md:space-y-6">
<div className="gap-3 sm:gap-4 lg:gap-6">
```

## 🔤 Tipografia Responsiva

```tsx
// Títulos principais
<h1 className="text-2xl sm:text-3xl md:text-4xl font-bold">

// Subtítulos
<h2 className="text-xl sm:text-2xl font-semibold">

// Parágrafos e descrições
<p className="text-sm sm:text-base md:text-lg">

// Labels de formulário
<Label className="text-xs sm:text-sm">
```

## 🖼️ Imagens e Gráficos

```tsx
// Containers de gráficos responsivos
<div className="w-full h-[300px] sm:h-[400px] lg:h-[500px]">
  {/* Gráfico */}
</div>

// Tabelas com scroll horizontal em mobile
<div className="overflow-x-auto">
  <table className="min-w-full">
    {/* Tabela */}
  </table>
</div>
```

## 🎛️ Componentes Específicos

### Botões

```tsx
// Botões de ação principais
<Button className="w-full sm:w-auto">
  Calcular
</Button>

// Grupo de botões
<div className="flex flex-col sm:flex-row gap-2">
  <Button>Ação 1</Button>
  <Button>Ação 2</Button>
</div>
```

### Inputs

```tsx
// Inputs com labels
<div className="space-y-2">
  <Label className="text-xs sm:text-sm">Campo</Label>
  <Input className="h-9 sm:h-10" />
</div>

// Grid de inputs
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
  {/* Inputs */}
</div>
```

### Modais/Dialogs

```tsx
// Dialog responsivo
<DialogContent className="max-w-[95vw] sm:max-w-[500px] md:max-w-[700px]">
  {/* Conteúdo */}
</DialogContent>
```

### Cards de Resultado

```tsx
// Cards de dados numéricos
<Card className="p-3 sm:p-4 lg:p-5">
  <div className="text-sm sm:text-base">
    {/* Conteúdo */}
  </div>
</Card>
```

## 🎨 Visibilidade Condicional

```tsx
// Mostrar apenas em mobile
<div className="block md:hidden">
  Mobile only
</div>

// Mostrar apenas em desktop
<div className="hidden md:block">
  Desktop only
</div>

// Texto abreviado em mobile
<p className="hidden sm:block">
  Descrição completa para desktop
</p>
<p className="block sm:hidden">
  Descrição curta
</p>
```

## 📊 Tabelas Responsivas

```tsx
// Padrão 1: Scroll horizontal
<div className="overflow-x-auto rounded-lg border">
  <table className="min-w-full divide-y">
    {/* Tabela */}
  </table>
</div>

// Padrão 2: Cards em mobile, tabela em desktop
<div className="block md:hidden">
  {/* Cards para mobile */}
</div>
<div className="hidden md:block">
  {/* Tabela para desktop */}
</div>
```

## 🔧 Utilitários Responsivos

### Containers

```tsx
// Container principal com max-width responsivo
<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
  {/* Conteúdo */}
</div>
```

### Alturas

```tsx
// Alturas mínimas responsivas
<div className="min-h-screen md:min-h-[600px]">
<div className="h-[200px] sm:h-[300px] lg:h-[400px]">
```

### Larguras

```tsx
// Larguras responsivas
<div className="w-full sm:w-auto">
<div className="w-full sm:w-1/2 lg:w-1/3">
```

## ⚠️ Problemas Comuns e Soluções

### 1. Texto cortado em mobile
```tsx
// ❌ Problema
<h1 className="text-3xl">Título Muito Longo</h1>

// ✅ Solução
<h1 className="text-xl sm:text-2xl md:text-3xl break-words">
  Título Muito Longo
</h1>
```

### 2. Botões muito pequenos para toque
```tsx
// ❌ Problema
<Button className="h-6 w-6">

// ✅ Solução (mínimo 44x44px para toque)
<Button className="h-10 w-10 sm:h-8 sm:w-8">
```

### 3. Inputs difíceis de preencher em mobile
```tsx
// ❌ Problema
<Input className="h-8 text-xs">

// ✅ Solução
<Input className="h-10 text-base sm:h-9 sm:text-sm">
```

### 4. Grids que quebram layout
```tsx
// ❌ Problema
<div className="grid grid-cols-4 gap-2">

// ✅ Solução
<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-4">
```

### 5. Modais que excedem viewport
```tsx
// ❌ Problema
<DialogContent className="w-[800px]">

// ✅ Solução
<DialogContent className="max-w-[95vw] sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
```

## 🧪 Checklist de Testes

Para cada módulo, testar:

### Mobile (< 768px)
- [ ] Layout não quebra horizontalmente
- [ ] Todos os botões são tocáveis (min 44x44px)
- [ ] Inputs são fáceis de preencher
- [ ] Texto é legível sem zoom
- [ ] Navegação funciona corretamente
- [ ] Modais/dialogs cabem na tela
- [ ] Gráficos são visíveis e interativos

### Tablet (768px - 1024px)
- [ ] Layout aproveita espaço disponível
- [ ] Grids se ajustam adequadamente
- [ ] Navegação é confortável
- [ ] Cards têm tamanho apropriado

### Desktop (> 1024px)
- [ ] Layout maximiza uso do espaço
- [ ] Múltiplas colunas quando apropriado
- [ ] Hover states funcionam
- [ ] Modais têm tamanho confortável

## 🛠️ Ferramentas de Teste

1. **Chrome DevTools**: Device Toolbar (Ctrl+Shift+M)
2. **Firefox**: Responsive Design Mode (Ctrl+Shift+M)
3. **Dispositivos reais**: Sempre que possível

### Dispositivos de Teste Recomendados

- iPhone SE (375px) - Mobile pequeno
- iPhone 12/13 (390px) - Mobile médio
- iPhone 14 Pro Max (430px) - Mobile grande
- iPad Mini (768px) - Tablet pequeno
- iPad Pro (1024px) - Tablet grande
- Desktop (1280px+) - Desktop padrão
- Wide (1920px+) - Monitores grandes

## 📚 Recursos

- [Tailwind CSS Responsive Design](https://tailwindcss.com/docs/responsive-design)
- [MDN: Responsive Design](https://developer.mozilla.org/en-US/docs/Learn/CSS/CSS_layout/Responsive_Design)
- [Google Web Fundamentals](https://developers.google.com/web/fundamentals/design-and-ux/responsive)

