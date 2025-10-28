import { useRecentReports } from '@/hooks/useRecentReports';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { FileText, Download, Trash2, Calendar, Package, Eye, RotateCw } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';

// Mapeamento de módulos para suas rotas
const moduleRoutes: { [key: string]: string } = {
  'granulometria': '/granulometria',
  'indices-fisicos': '/indices-fisicos',
  'limites': '/limites-consistencia',
  'compactacao': '/compactacao',
  'tensoes': '/tensoes',
  'acrescimo': '/acrescimo-tensoes',
};

export default function RelatoriosMobile() {
  const { reports, removeReport, clearAll } = useRecentReports();
  const navigate = useNavigate();

  const handleRegenerate = (report: any) => {
    const moduleRoute = moduleRoutes[report.moduleType];
    if (moduleRoute && report.calculationData) {
      // Salvar dados na sessão para carregar no módulo
      sessionStorage.setItem(`${report.moduleType}_lastData`, JSON.stringify(report.calculationData));
      navigate(moduleRoute);
    }
  };

  const handleViewPDF = (report: any) => {
    // Tentar abrir o PDF em uma nova aba
    if (report.pdfUrl) {
      window.open(report.pdfUrl, '_blank');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/5 pb-24">
      {/* Header */}
      <div className="sticky top-0 bg-background/95 backdrop-blur-md border-b border-border/40 p-4 z-40">
        <div className="flex items-center gap-3">
          <FileText className="w-6 h-6 text-primary" />
          <div>
            <h1 className="text-lg font-bold">Relatórios</h1>
            <p className="text-xs text-muted-foreground">
              {reports.length} relatório{reports.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      </div>

      {reports.length === 0 ? (
        // Estado vazio
        <div className="flex flex-col items-center justify-center py-16 px-4">
          <FileText className="w-12 h-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground font-medium mb-1">
            Nenhum relatório gerado
          </p>
          <p className="text-sm text-muted-foreground text-center">
            Os relatórios que você gerar aparecerão aqui
          </p>
        </div>
      ) : (
        <>
          {/* Lista de Relatórios */}
          <div className="p-4 space-y-3">
            {reports.map((report) => (
              <Card
                key={report.id}
                className="flex flex-col p-3"
              >
                {/* Cabeçalho do Card */}
                <div className="flex items-start gap-3 mb-2">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Package className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm truncate">{report.name}</h3>
                    <p className="text-xs text-muted-foreground">
                      {report.moduleName}
                    </p>
                  </div>
                </div>

                {/* Data e hora */}
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3 ml-13">
                  <Calendar className="w-3 h-3" />
                  {format(new Date(report.createdAt), "dd 'de' MMM", {
                    locale: ptBR,
                  })}
                </div>

                {/* Botões de ação */}
                <div className="flex gap-2 ml-13">
                  <Button
                    variant="default"
                    size="sm"
                    className="flex-1 gap-2 text-xs h-8"
                    onClick={() => handleViewPDF(report)}
                  >
                    <Eye className="w-3 h-3" />
                    Ver
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 gap-2 text-xs h-8"
                    onClick={() => handleRegenerate(report)}
                  >
                    <RotateCw className="w-3 h-3" />
                    Gerar
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeReport(report.id)}
                    className="text-destructive hover:text-destructive h-8 px-2"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>

          {/* Botão limpar tudo */}
          <div className="p-4">
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => {
                if (window.confirm('Tem certeza que deseja limpar todos os relatórios?')) {
                  clearAll();
                }
              }}
            >
              Limpar Todos
            </Button>
          </div>
        </>
      )}
    </div>
  );
}