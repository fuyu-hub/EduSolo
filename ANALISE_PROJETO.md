# 📊 Análise do Projeto Original

**Data:** 2025-12-12

---

## Resumo da Complexidade

| Categoria | Quantidade |
|-----------|------------|
| Componentes UI (shadcn) | 56 |
| Hooks customizados | 13 |
| Contextos | 3 |
| Módulos de cálculo | 7 |
| Páginas de módulos | 7 |

---

## 1. Componentes UI (Prioridade Alta)

Já migrados ✅:
- button, card, collapsible, sheet

Essenciais para Índices Físicos:
1. **input** - campos de entrada
2. **label** - rótulos
3. **select** - dropdowns
4. **tooltip** - dicas
5. **dialog** - modais
6. **alert** - mensagens de alerta
7. **separator** - divisores
8. **skeleton** - loading states
9. **switch** - toggles
10. **popover** - popups
11. **carousel** - navegação de amostras

---

## 2. Hooks (Prioridade Alta)

Essenciais:
1. **use-notification** - toasts/notificações
2. **use-saved-calculations** - salvar/carregar cálculos
3. **use-settings** - configurações do app

Baixa prioridade:
- use-toast (coberto por notification)
- use-debounce
- use-form-autosave
- use-route-preload

---

## 3. Contextos

1. **SettingsContext** - configurações do usuário
2. **ThemeContext** - tema claro/escuro (já temos usarTema)
3. **TourContext** - tour guiado (removido por decisão)

---

## 4. Componentes Específicos de Módulo

### Índices Físicos
- DiagramaFases (visualização SVG)
- InputWithValidation
- SoilExamples
- GsSuggestions
- ResultInterpretation
- SavedCalculations
- ExportPDFDialog
- CalculationActions
- MobileModuleWrapper

---

## 5. Proposta de Modularização

### Fase 3.1: Infraestrutura Básica
1. Componentes UI essenciais (input, label, select, etc)
2. Hook de notificação
3. Separador de código comum

### Fase 3.2: Índices Físicos
1. DiagramaFases
2. Formulário de entrada
3. Painel de resultados
4. Página de composição

### Fase 3.3: Features Transversais
1. SavedCalculations (salvar/carregar)
2. Export PDF/Excel
3. SoilExamples (exemplos de solos)

---

## 6. Estimativa de Esforço

| Fase | Arquivos | Estimativa |
|------|----------|------------|
| 3.1 Infra UI | ~15 | 30 min |
| 3.2 Índices Físicos | ~10 | 45 min |
| 3.3 Features | ~8 | 30 min |
| 3.4 Limites | ~8 | 30 min |
| 3.5 Granulometria | ~10 | 45 min |
| 3.6 Compactação | ~8 | 30 min |
| 3.7 Tensões | ~10 | 40 min |
| 3.8 Acréscimo | ~15 | 50 min |
| 3.9 Recalque | ~8 | 30 min |

**Total estimado:** ~5 horas de trabalho

---

## 7. Recomendação

Dividir em **sessões menores** de 30-45 min cada, com pausas entre elas.

Ordem sugerida:
1. ✅ Setup inicial (concluído)
2. ✅ Layout + Painel (concluído)
3. ✅ Módulo cálculos Índices Físicos (concluído)
4. 🔄 Infra UI (próximo)
5. ⏳ Página Índices Físicos
6. ⏳ Features transversais
7. ⏳ Demais módulos
