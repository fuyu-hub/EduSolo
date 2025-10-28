import { useRecentReports } from '@/hooks/useRecentReports';
import { useIsMobile } from '@/hooks/use-mobile';
import RelatoriosMobile from './mobile/RelatoriosMobile';
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

export default function Relatorios() {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const { reports, removeReport, clearAll } = useRecentReports();

  const handleRegenerate = (report: any) => {
    const moduleRoute = moduleRoutes[report.moduleType];
    if (moduleRoute && report.calculationData) {
      sessionStorage.setItem(`${report.moduleType}_lastData`, JSON.stringify(report.calculationData));
      navigate(moduleRoute);
    }
  };

  const handleViewPDF = (report: any) => {
    if (report.pdfUrl) {
      window.open(report.pdfUrl, '_blank');
    }
  };

  if (isMobile) {
    return <RelatoriosMobile />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/5 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <FileText className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold">Últimos Relatórios</h1>
          </div>
          <p className="text-muted-foreground">
            Acesso rápido aos seus últimos relatórios gerados
          </p>
        </div>

        {reports.length === 0 ? (
          // Estado vazio
          <Card className="flex flex-col items-center justify-center py-16 border-dashed">
            <FileText className="w-12 h-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-2">Nenhum relatório gerado ainda</p>
            <p className="text-sm text-muted-foreground text-center max-w-xs">
              Os relatórios gerados aparecerão aqui para acesso rápido
            </p>
          </Card>
        ) : (
          <>
            {/* Grid de Relatórios */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {reports.map((report) => (
                <Card
                  key={report.id}
                  className="flex flex-col p-4 hover:shadow-lg transition-shadow"
                >
                  {/* Cabeçalho do Card */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2 flex-1">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Package className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold truncate">{report.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {report.moduleName}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Data e hora */}
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                    <Calendar className="w-4 h-4" />
                    {format(new Date(report.createdAt), "dd 'de' MMMM 'às' HH:mm", {
                      locale: ptBR,
                    })}
                  </div>

                  {/* Botões de ação */}
                  <div className="flex gap-2 mt-auto">
                    <Button
                      variant="default"
                      size="sm"
                      className="flex-1 gap-2"
                      onClick={() => handleViewPDF(report)}
                    >
                      <Eye className="w-4 h-4" />
                      Ver
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 gap-2"
                      onClick={() => handleRegenerate(report)}
                    >
                      <RotateCw className="w-4 h-4" />
                      Gerar
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeReport(report.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>

            {/* Botão limpar tudo */}
            <div className="flex justify-end">
              <Button
                variant="outline"
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
    </div>
  );
}