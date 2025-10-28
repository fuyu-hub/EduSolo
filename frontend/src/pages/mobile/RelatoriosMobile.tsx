import { useRecentReports } from '@/hooks/useRecentReports';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { FileText, Download, Trash2, Calendar, Package, Eye, RotateCw } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { openPdfFromBase64 } from '@/lib/reportManager';
import { downloadPdfFromBase64, downloadPdfFromUrl } from '@/lib/reportManager';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';

// Mapeamento de módulos para suas rotas
const moduleRoutes: { [key: string]: string } = {
  'granulometria': '/granulometria',
  'indices-fisicos': '/indices-fisicos',
  'limites': '/limites-consistencia',
  'compactacao': '/compactacao',
  'tensoes': '/tensoes',
  'acrescimo': '/acrescimo-tensoes',
};

const moduleLabels: { [key: string]: string } = {
  'granulometria': 'Granulometria',
  'indices-fisicos': 'Índices Físicos',
  'limites': 'Limites de Consistência',
  'compactacao': 'Compactação',
  'tensoes': 'Tensões Geostáticas',
  'acrescimo': 'Acréscimo de Tensões',
};

export default function RelatoriosMobile() {
  const { reports, removeReport, clearAll } = useRecentReports();
  const navigate = useNavigate();
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
      // Salvar dados na sessão para carregar no módulo
      sessionStorage.setItem(`${report.moduleType}_lastData`, JSON.stringify(report.calculationData));
      navigate(moduleRoute);
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

  const handleViewPDF = (report: any) => {
    // Tentar abrir o PDF em uma nova aba
    if (report.pdfData) {
      openPdfFromBase64(report.pdfData);
      return;
    }
    if (report.pdfUrl) {
      window.open(report.pdfUrl, '_blank');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/5 pb-24">
      {/* Filtros */}
      <div className="p-4 space-y-2">
        <Input
          placeholder="Buscar por nome ou módulo"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-9"
        />
        <div className="grid grid-cols-2 gap-2">
          <Select value={moduleFilter} onValueChange={(v) => setModuleFilter(v)}>
            <SelectTrigger className="h-9">
              <SelectValue placeholder="Módulo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {moduleOptions.map((m) => (
                <SelectItem key={m} value={m}>{moduleLabels[m] || m}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={sortOrder} onValueChange={(v: 'asc' | 'desc') => setSortOrder(v)}>
            <SelectTrigger className="h-9">
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
        <div className="flex flex-col items-center justify-center py-16 px-4">
          <FileText className="w-12 h-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground font-medium mb-1">Nenhum relatório encontrado</p>
          <p className="text-sm text-muted-foreground text-center">Ajuste os filtros ou gere um novo relatório</p>
        </div>
      ) : (
        <>
          {/* Lista de Relatórios */}
          <div className="p-4 space-y-3">
            {filteredReports.map((report) => (
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
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <Badge variant="secondary" className="text-[10px] py-0 px-1.5">
                        {moduleLabels[report.moduleType] || report.moduleName}
                      </Badge>
                    </div>
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
                    onClick={() => handleDownload(report)}
                  >
                    <Download className="w-3 h-3" />
                    Baixar
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