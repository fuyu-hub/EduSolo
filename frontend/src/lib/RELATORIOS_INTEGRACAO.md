# Integração do Sistema de Relatórios

## Overview
O sistema de relatórios permite salvar automaticamente os PDFs gerados e exibi-los em uma página de acesso rápido.

## Arquivos Criados

### 1. `hooks/useRecentReports.ts`
Hook para gerenciar relatórios recentes salvos no localStorage.

**Interface:**
```typescript
interface RecentReport {
  id: string;              // ID único gerado automaticamente
  name: string;            // Nome do relatório (ex: "Ensaio de Granulometria - 28/10/2025")
  moduleType: string;      // Tipo do módulo (ex: "granulometria", "indices-fisicos")
  moduleName: string;      // Nome legível (ex: "Granulometria")
  createdAt: string;       // Data de criação (ISO format)
  pdfUrl: string;          // URL do blob do PDF
  calculationData: Record<string, any>; // Dados do cálculo
}
```

**Métodos:**
```typescript
const {
  reports,      // Array de RecentReport
  isLoading,    // boolean
  addReport,    // (report: Omit<RecentReport, 'id' | 'createdAt'>) => RecentReport | null
  removeReport, // (id: string) => void
  clearAll,     // () => void
} = useRecentReports();
```

### 2. `lib/reportManager.ts`
Utilitários para preparar e salvar relatórios.

**Função Principal:**
```typescript
const reportData = prepareReportForStorage({
  name: string;           // Nome do relatório
  moduleType: string;     // Tipo do módulo
  moduleName: string;     // Nome legível do módulo
  pdfBlob: Blob;          // Blob do PDF
  calculationData: any;   // Dados do cálculo
});
```

### 3. `pages/Relatorios.tsx` e `pages/mobile/RelatoriosMobile.tsx`
Páginas de visualização dos relatórios (desktop e mobile).

## Como Integrar em um Componente

### Passo 1: Importar o Hook
```typescript
import { useRecentReports } from '@/hooks/useRecentReports';
import { prepareReportForStorage } from '@/lib/reportManager';
```

### Passo 2: Usar no Componente
```typescript
export function MeuComponenteDeExportacao() {
  const { addReport } = useRecentReports();

  const handleExportarPDF = async () => {
    // 1. Gerar o PDF (seu código atual)
    const pdfBlob = await gerarPDF(); // jsPDF, html2pdf, etc
    
    // 2. Preparar os dados do relatório
    const reportData = prepareReportForStorage({
      name: 'Ensaio de Granulometria - 28/10/2025', // ou usar data dinâmica
      moduleType: 'granulometria',
      moduleName: 'Granulometria',
      pdfBlob: pdfBlob,
      calculationData: {
        // Copie aqui os dados que foram usados para gerar o PDF
        // Exemplo:
        diametroMax: 50,
        percentualPassante: [100, 98, 95, ...],
        // ... outros dados
      }
    });

    // 3. Salvar o relatório
    const saved = addReport(reportData);
    if (saved) {
      toast.success('Relatório salvo com sucesso!');
      // Opcional: redirecionar para a página de relatórios
      // navigate('/relatorios');
    }
  };

  return (
    <button onClick={handleExportarPDF}>
      Exportar PDF
    </button>
  );
}
```

### Exemplo Completo com ExportPDFDialog

Procure pelo arquivo `components/dialogs/ExportPDFDialog.tsx` ou `components/ExportPDFDialog.tsx` e adicione ao final do `handleExport`:

```typescript
// Após gerar o PDF
const { addReport } = useRecentReports();

const reportData = prepareReportForStorage({
  name: `Relatório - ${new Date().toLocaleDateString('pt-BR')}`,
  moduleType: 'seu-modulo',
  moduleName: 'Nome do Módulo',
  pdfBlob: pdfBlob,
  calculationData: formData, // seus dados
});

addReport(reportData);
```

## Localização dos Arquivos

```
frontend/src/
├── hooks/
│   └── useRecentReports.ts          [NOVO]
├── lib/
│   └── reportManager.ts             [NOVO]
│   └── RELATORIOS_INTEGRACAO.md    [NOVO - este arquivo]
├── pages/
│   ├── Relatorios.tsx               [NOVO]
│   └── mobile/
│       └── RelatoriosMobile.tsx     [NOVO]
├── App.tsx                          [ATUALIZADO]
└── components/
    └── mobile/
        └── BottomNav.tsx            [ATUALIZADO]
```

## Funcionalidades

### Para Usuário
- ✅ Visualizar últimos relatórios gerados
- ✅ Download dos PDFs salvos
- ✅ Remover relatórios individuais
- ✅ Limpar todos os relatórios de uma vez
- ✅ Interface responsiva (mobile + desktop)
- ✅ Dados persistem no localStorage

### Dados Armazenados
- localStorage key: `edusolorecentreports`
- Formato: JSON Array de RecentReport
- Ilimitado (conforme configuração)

## Acessibilidade

**Página de Relatórios:**
- Path: `/relatorios`
- Acesso: Clique em "Salvos" na navegação mobile
- Layout responsivo automaticamente

**Rota:**
Já adicionada em `App.tsx` com lazy loading.

## Próximos Passos (Opcional)

1. **Adicionar filtros** por tipo de módulo
2. **Adicionar busca** por nome de relatório
3. **Exportar como ZIP** múltiplos relatórios
4. **Sincronizar com Backend** (salvar no servidor)
5. **Compartilhamento** de relatórios
6. **Histórico completo** de cálculos (não só PDFs)

## Troubleshooting

### Os relatórios não estão sendo salvos
- Verifique se `addReport()` está sendo chamado
- Verifique se o localStorage está habilitado
- Verifique o console do navegador para erros

### Os PDFs não abrem ao clicar
- Certifique-se de que o `pdfBlob` está em formato correto
- Verifique se o blob URL está sendo gerado corretamente

### Página em branco
- Verifique se a rota `/relatorios` está adicionada em App.tsx
- Verifique se o componente Relatorios está sendo importado corretamente