import { useRecentReports } from '@/hooks/useRecentReports';
import { useIsMobile } from '@/hooks/use-mobile';
import RelatoriosMobile from './mobile/RelatoriosMobile';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { FileText, Download, Trash2, Calendar, Package, Eye, RotateCw } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { openPdfFromBase64 } from '@/lib/reportManager';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { downloadPdfFromBase64, downloadPdfFromUrl } from '@/lib/reportManager';

// Mapeamento de módulos para suas rotas
const moduleRoutes: { [key: string]: string } = {
  'granulometria': '/granulometria',
  'indices-fisicos': '/indices-fisicos',
  'limites': '/limites-consistencia',
  'compactacao': '/compactacao',
  'tensoes': '/tensoes',
  'acrescimo': '/acrescimo-tensoes',
  'caracterizacao': '/caracterizacao',
};

const moduleLabels: { [key: string]: string } = {
  'granulometria': 'Granulometria',
  'indices-fisicos': 'Índices Físicos',
  'limites': 'Limites de Consistência',
  'compactacao': 'Compactação',
  'tensoes': 'Tensões Geostáticas',
  'acrescimo': 'Acréscimo de Tensões',
  'caracterizacao': 'Índices Físicos e Consistência',
};

export default function Relatorios() {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const { reports, removeReport, clearAll } = useRecentReports();
  const [search, setSearch] = useState('');
  const [moduleFilter, setModuleFilter] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  const moduleOptions = useMemo(() => {
    const set = new Set<string>();
    reports.forEach(r => set.add(r.moduleType));
    return Array.from(set);
  }, [reports]);

  const filteredReports = useMemo(() => {
    let list = [...reports];
    if (search.trim()) {
      const term = search.toLowerCase();
      list = list.filter(r =>
        r.name.toLowerCase().includes(term) ||
        r.moduleName.toLowerCase().includes(term)
      );
    }
    if (moduleFilter !== 'all') {
      list = list.filter(r => r.moduleType === moduleFilter);
    }
    list.sort((a, b) =>
      sortOrder === 'desc'
        ? new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        : new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
    return list;
  }, [reports, search, moduleFilter, sortOrder]);

  const handleRegenerate = (report: any) => {
    const moduleRoute = moduleRoutes[report.moduleType];
    if (moduleRoute && report.calculationData) {
      sessionStorage.setItem(`${report.moduleType}_lastData`, JSON.stringify(report.calculationData));
      navigate(moduleRoute);
    }
  };

  const handleViewPDF = (report: any) => {
    if (report.pdfData) {
      openPdfFromBase64(report.pdfData);
      return;
    }
    if (report.pdfUrl) {
      window.open(report.pdfUrl, '_blank');
    }
  };

  const handleDownload = (report: any) => {
    const filename = `${report.name || 'relatorio'}.pdf`;
    if (report.pdfData) {
      downloadPdfFromBase64(report.pdfData, filename);
      return;
    }
    if (report.pdfUrl) {
      downloadPdfFromUrl(report.pdfUrl, filename);
    }
  };

  if (isMobile) {
    return <RelatoriosMobile />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/5 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header e Filtros */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-4">
            <FileText className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold">Relatórios</h1>
            <span className="text-sm text-muted-foreground">{filteredReports.length} item(s)</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Input
              placeholder="Buscar por nome ou módulo"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <Select value={moduleFilter} onValueChange={(v) => setModuleFilter(v)}>
              <SelectTrigger>
                <SelectValue placeholder="Módulo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os módulos</SelectItem>
                {moduleOptions.map((m) => (
                  <SelectItem key={m} value={m}>{moduleLabels[m] || m}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={sortOrder} onValueChange={(v: 'asc' | 'desc') => setSortOrder(v)}>
              <SelectTrigger>
                <SelectValue placeholder="Ordenar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="desc">Mais recentes</SelectItem>
                <SelectItem value="asc">Mais antigos</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {filteredReports.length === 0 ? (
          // Estado vazio
          <Card className="flex flex-col items-center justify-center py-16 border-dashed">
            <FileText className="w-12 h-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-2">Nenhum relatório encontrado</p>
            <p className="text-sm text-muted-foreground text-center max-w-xs">
              Ajuste os filtros ou gere um novo relatório
            </p>
          </Card>
        ) : (
          <>
            {/* Grid de Relatórios */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {filteredReports.map((report) => (
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
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">{moduleLabels[report.moduleType] || report.moduleName}</Badge>
                        </div>
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
                      onClick={() => handleDownload(report)}
                    >
                      <Download className="w-4 h-4" />
                      Baixar
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