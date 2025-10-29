import { useState, useEffect } from "react";
import { Filter, Calculator, Plus, Trash2, Info, Save, Download, FileText, FolderOpen, Lightbulb, AlertCircle, ChevronLeft, ChevronRight, Table as TableIcon, BarChart3 } from "lucide-react";
import { calcularGranulometria } from "@/lib/calculations/granulometria";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/components/ui/use-toast";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel";
import {
  MobileSection,
  MobileInputGroup,
  MobileTabs,
} from "@/components/mobile";
import { formatNumber } from "@/lib/format-number";
import { useSettings } from "@/hooks/use-settings";
import { useTheme } from "@/hooks/use-theme";
import { useSavedCalculations } from "@/hooks/use-saved-calculations";
import { exportToPDF, exportToExcel, ExportData, ExcelExportData, formatNumberForExport, captureChartAsImage, generateDefaultPDFFileName } from "@/lib/export-utils";
import ExportPDFDialog from "@/components/ExportPDFDialog";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import CurvaGranulometrica from "@/components/granulometria/CurvaGranulometrica";
import TabelaDadosGranulometricos from "@/components/granulometria/TabelaDadosGranulometricos";
import PlasticityChart from "@/components/visualizations/PlasticityChart";
import { EXEMPLOS_GRANULOMETRIA, ExemploGranulometria } from "@/lib/exemplos-granulometria";
import { useRecentReports } from "@/hooks/useRecentReports";
import { prepareReportForStorage } from "@/lib/reportManager";
import { useNavigate } from "react-router-dom";
import { PENEIRAS_PADRAO, getPeneiraInfo } from "@/lib/peneiras-padrao";

interface PeneiraDado {
  id: string;
  abertura: string;
  massaRetida: string;
}

interface FormData {
  massaTotal: string;
  peneiras: PeneiraDado[];
  limitePercent: string;
  limitePlasticidade: string;
}

interface PontoGranulometrico {
  peneira?: string;
  abertura: number;
  massa_retida: number;
  porc_retida: number;
  porc_retida_acum: number;
  porc_passante: number;
}

interface Results {
  dados_granulometricos: PontoGranulometrico[];
  percentagem_pedregulho: number | null;
  percentagem_areia: number | null;
  percentagem_finos: number | null;
  d10: number | null;
  d30: number | null;
  d60: number | null;
  coef_uniformidade: number | null;
  coef_curvatura: number | null;
  classificacao_uscs: string | null;
  descricao_uscs: string | null;
  classificacao_hrb: string | null;
  grupo_hrb: string | null;
  subgrupo_hrb: string | null;
  indice_grupo_hrb: number | null;
  descricao_hrb: string | null;
  avaliacao_subleito_hrb: string | null;
}

// Cálculos agora são feitos localmente no frontend

// Função para gerar IDs únicos
const generateId = () => `${Date.now()}-${Math.floor(Math.random() * 1000000)}`;

export default function GranulometriaMobile() {
  const { settings } = useSettings();
  const { toast } = useToast();
  const { theme } = useTheme();
  const { addReport } = useRecentReports();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState<FormData>({
    massaTotal: "",
    peneiras: [
      { id: generateId(), abertura: "4.76", massaRetida: "" },
      { id: generateId(), abertura: "0.075", massaRetida: "" },
    ],
    limitePercent: "",
    limitePlasticidade: "",
  });
  
  const [results, setResults] = useState<Results | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Estados para navegação de peneiras
  const [currentPeneiraIndex, setCurrentPeneiraIndex] = useState(0);
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();

  // Estados para salvamento
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [saveName, setSaveName] = useState("");
  const [loadSheetOpen, setLoadSheetOpen] = useState(false);
  const { calculations, saveCalculation, deleteCalculation } = useSavedCalculations("granulometria");

  // Estados para exportação
  const [exportPDFDialogOpen, setExportPDFDialogOpen] = useState(false);
  const [pdfFileName, setPdfFileName] = useState("");
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [pdfSavedDialogOpen, setPdfSavedDialogOpen] = useState(false);

  // Estados para exemplos
  const [examplesSheetOpen, setExamplesSheetOpen] = useState(false);

  // Sincronizar carousel com índice atual
  useEffect(() => {
    if (!carouselApi) return;
    
    carouselApi.on("select", () => {
      setCurrentPeneiraIndex(carouselApi.selectedScrollSnap());
    });
  }, [carouselApi]);

  const handleInputChangePeneira = (index: number, field: keyof PeneiraDado, value: string) => {
    const newPeneiras = [...formData.peneiras];
    newPeneiras[index] = { ...newPeneiras[index], [field]: value };
    setFormData({ ...formData, peneiras: newPeneiras });
    setError(null);
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData({ ...formData, [field]: value });
    setError(null);
  };

  const addPeneira = () => {
    setFormData({
      ...formData,
      peneiras: [...formData.peneiras, { id: generateId(), abertura: "", massaRetida: "" }],
    });
    setCurrentPeneiraIndex(formData.peneiras.length);
  };

  const removePeneira = () => {
    if (formData.peneiras.length <= 2) {
      toast({
        title: "Mínimo de peneiras",
        description: "São necessárias pelo menos 2 peneiras",
        variant: "destructive",
      });
      return;
    }
    const newPeneiras = formData.peneiras.filter((_, i) => i !== currentPeneiraIndex);
    setFormData({ ...formData, peneiras: newPeneiras });
    if (currentPeneiraIndex >= newPeneiras.length) {
      setCurrentPeneiraIndex(Math.max(0, newPeneiras.length - 1));
    }
  };

  const goToNextPeneira = () => {
    if (currentPeneiraIndex < formData.peneiras.length - 1) {
      setCurrentPeneiraIndex(currentPeneiraIndex + 1);
      carouselApi?.scrollTo(currentPeneiraIndex + 1);
    }
  };

  const goToPreviousPeneira = () => {
    if (currentPeneiraIndex > 0) {
      setCurrentPeneiraIndex(currentPeneiraIndex - 1);
      carouselApi?.scrollTo(currentPeneiraIndex - 1);
    }
  };

  const handleCalculate = async () => {
    // Validação
    if (!formData.massaTotal || parseFloat(formData.massaTotal) <= 0) {
      setError("Informe a massa total da amostra");
      toast({
        title: "Dados incompletos",
        description: "Informe a massa total",
        variant: "destructive",
      });
      return;
    }

    const peneirasValidas = formData.peneiras.filter(p => 
      p.abertura && 
      p.massaRetida && 
      !isNaN(parseFloat(p.abertura)) && 
      !isNaN(parseFloat(p.massaRetida)) && 
      parseFloat(p.abertura) > 0 && 
      parseFloat(p.massaRetida) >= 0
    );

    if (peneirasValidas.length < 2) {
      setError("São necessárias pelo menos 2 peneiras com dados válidos");
      toast({
        title: "Dados incompletos",
        description: "Preencha pelo menos 2 peneiras",
        variant: "destructive",
      });
      return;
    }

    setIsCalculating(true);
    setError(null);

    try {
      const payload = {
        massa_total: parseFloat(formData.massaTotal),
        peneiras: peneirasValidas.map(p => ({
          abertura: parseFloat(p.abertura),
          massa_retida: parseFloat(p.massaRetida),
        })),
        ll: formData.limitePercent ? parseFloat(formData.limitePercent) : null,
        lp: formData.limitePlasticidade ? parseFloat(formData.limitePlasticidade) : null,
      };

      // Calcular localmente no frontend
      const resultado = calcularGranulometria(payload);
      
      if (resultado.erro) {
        setError(resultado.erro);
        toast({
          title: "❌ Erro",
          description: resultado.erro,
          variant: "destructive",
        });
      } else {
        setResults(resultado);
        toast({
          title: "✅ Sucesso!",
          description: "Análise granulométrica calculada",
        });
      }
    } catch (err: any) {
      const errorMsg = err.message || "Erro ao calcular";
      setError(errorMsg);
      
      toast({
        title: "❌ Erro",
        description: typeof errorMsg === 'string' ? errorMsg : JSON.stringify(errorMsg),
        variant: "destructive",
      });
    } finally {
      setIsCalculating(false);
    }
  };

  const handleClear = () => {
    setFormData({
      massaTotal: "",
      peneiras: [
        { id: generateId(), abertura: "4.76", massaRetida: "" },
        { id: generateId(), abertura: "0.075", massaRetida: "" },
      ],
      limitePercent: "",
      limitePlasticidade: "",
    });
    setResults(null);
    setError(null);
    setCurrentPeneiraIndex(0);
  };

  const handleLoadExample = (example: ExemploGranulometria) => {
    setFormData({
      massaTotal: example.massaTotal.toString(),
      peneiras: example.peneiras.map(p => ({
        id: generateId(),
        abertura: p.aberturaMM.toString(),
        massaRetida: p.massaRetida.toString(),
      })),
      limitePercent: example.ll?.toString() || "",
      limitePlasticidade: example.lp?.toString() || "",
    });
    setResults(null);
    setError(null);
    setCurrentPeneiraIndex(0);
    setExamplesSheetOpen(false);
    toast({
      title: `📊 ${example.nome}`,
      description: example.descricao,
    });
  };

  // Salvamento
  const handleSaveClick = () => {
    if (!results) return;
    setSaveName(`Análise ${new Date().toLocaleDateString('pt-BR')}`);
    setSaveDialogOpen(true);
  };

  const handleConfirmSave = () => {
    if (!results || !saveName.trim()) return;
    
    const success = saveCalculation(saveName.trim(), formData, results);
    if (success) {
      toast({
        title: "💾 Salvo!",
        description: "Análise salva com sucesso",
      });
      setSaveDialogOpen(false);
      setSaveName("");
    } else {
      toast({
        title: "Erro",
        description: "Não foi possível salvar",
        variant: "destructive",
      });
    }
  };

  const handleLoadCalculation = (calculation: any) => {
    setFormData(calculation.formData);
    setResults(calculation.results);
    setLoadSheetOpen(false);
    toast({
      title: "📂 Carregado!",
      description: `"${calculation.name}" foi carregado`,
    });
  };

  // Exportação PDF
  const handleExportPDF = () => {
    if (!results) return;
    setPdfFileName(generateDefaultPDFFileName("Granulometria"));
    setExportPDFDialogOpen(true);
  };

  const handleConfirmExportPDF = async () => {
    if (!results) return;
    setIsExportingPDF(true);

    // Capturar imagem do gráfico em alta qualidade
    toast({
      title: "Capturando gráfico...",
      description: "Aguarde enquanto geramos a imagem em alta qualidade",
    });
    const chartImage = await captureChartAsImage('curva-mobile-export');
    
    if (!chartImage) {
      console.warn("Gráfico não foi capturado corretamente");
      toast({
        title: "Aviso",
        description: "Gráfico não incluído no PDF",
        variant: "default",
      });
    } else {
      console.log("Gráfico capturado com sucesso");
    }

    // Dados de entrada como valores simples
    const inputs: { label: string; value: string }[] = [
      { label: "Massa Total", value: `${formData.massaTotal} g` },
    ];
    if (formData.limitePercent) inputs.push({ label: "Limite de Liquidez (LL)", value: `${formData.limitePercent}%` });
    if (formData.limitePlasticidade) inputs.push({ label: "Limite de Plasticidade (LP)", value: `${formData.limitePlasticidade}%` });

    // Lista vazia de resultados (vamos usar tabelas ao invés)
    const resultsList: { label: string; value: string; highlight?: boolean }[] = [];

    // Preparar todas as tabelas
    const tables = [];

    // TABELA 1: Dados de Entrada - Peneiras
    const peneirasHeaders = ["Peneira", "Abertura (mm)", "Massa Retida (g)"];
    const peneirasRows = formData.peneiras
      .filter(p => p.abertura && p.massaRetida)
      .map((p, i) => [
        `#${i + 1}`,
        p.abertura,
        p.massaRetida
      ]);
    
    if (peneirasRows.length > 0) {
      tables.push({
        title: "Dados de Entrada - Peneiras",
        headers: peneirasHeaders,
        rows: peneirasRows
      });
    }

    // TABELA 2: Classificações
    if (results.classificacao_uscs || results.classificacao_hrb) {
      const classificacoesHeaders = ["Sistema", "Classificação", "Descrição"];
      const classificacoesRows = [];
      
      if (results.classificacao_uscs) {
        classificacoesRows.push([
          "USCS",
          results.classificacao_uscs,
          results.descricao_uscs || "-"
        ]);
      }
      
      if (results.classificacao_hrb) {
        const hrb = results.classificacao_hrb + 
          (results.indice_grupo_hrb !== null && results.indice_grupo_hrb > 0 ? ` (IG: ${results.indice_grupo_hrb})` : '');
        classificacoesRows.push([
          "HRB/AASHTO",
          hrb,
          results.descricao_hrb || "-"
        ]);
      }
      
      tables.push({
        title: "Classificação do Solo",
        headers: classificacoesHeaders,
        rows: classificacoesRows
      });
    }

    // TABELA 3: Composição Granulométrica
    if (results.percentagem_pedregulho !== null || results.percentagem_areia !== null || results.percentagem_finos !== null) {
      const composicaoHeaders = ["Fração", "Faixa de Tamanho", "Percentual (%)"];
      const composicaoRows = [];
      
      if (results.percentagem_pedregulho !== null) {
        composicaoRows.push(["Pedregulho", "> 2.0 mm", formatNumberForExport(results.percentagem_pedregulho, 1)]);
      }
      if (results.percentagem_areia !== null) {
        composicaoRows.push(["Areia", "0.075 - 2.0 mm", formatNumberForExport(results.percentagem_areia, 1)]);
      }
      if (results.percentagem_finos !== null) {
        composicaoRows.push(["Finos (Silte + Argila)", "< 0.075 mm", formatNumberForExport(results.percentagem_finos, 1)]);
      }
      
      tables.push({
        title: "Composição Granulométrica",
        headers: composicaoHeaders,
        rows: composicaoRows
      });
    }

    // TABELA 4: Diâmetros Característicos e Coeficientes
    if (results.d10 || results.d30 || results.d60 || results.coef_uniformidade || results.coef_curvatura) {
      const diametrosHeaders = ["Parâmetro", "Valor", "Unidade"];
      const diametrosRows = [];
      
      if (results.d10) diametrosRows.push(["D10 (Diâmetro Efetivo)", formatNumberForExport(results.d10, 4), "mm"]);
      if (results.d30) diametrosRows.push(["D30", formatNumberForExport(results.d30, 4), "mm"]);
      if (results.d60) diametrosRows.push(["D60", formatNumberForExport(results.d60, 4), "mm"]);
      if (results.coef_uniformidade) diametrosRows.push(["Cu (Coef. Uniformidade)", formatNumberForExport(results.coef_uniformidade, 2), "-"]);
      if (results.coef_curvatura) diametrosRows.push(["Cc (Coef. Curvatura)", formatNumberForExport(results.coef_curvatura, 2), "-"]);
      
      tables.push({
        title: "Diâmetros Característicos e Coeficientes",
        headers: diametrosHeaders,
        rows: diametrosRows
      });
    }

    // TABELA 5: Dados Granulométricos Completos
    const tableHeaders = ["Peneira", "Abertura (mm)", "Massa Retida (g)", "% Retida", "% Retida Ac.", "% Passante"];
    const tableRows = results.dados_granulometricos.map(d => [
      d.peneira || '-',
      d.abertura.toFixed(3),
      d.massa_retida.toFixed(2),
      d.porc_retida.toFixed(2),
      d.porc_retida_acum.toFixed(2),
      d.porc_passante.toFixed(2)
    ]);

    tables.push({
      title: "Dados Granulométricos Completos",
      headers: tableHeaders,
      rows: tableRows
    });

    const exportData: ExportData = {
      moduleName: "granulometria",
      moduleTitle: "Granulometria e Classificação",
      inputs,
      results: resultsList,
      tables,
      chartImage: chartImage || undefined,
      customFileName: pdfFileName,
      theme,
      printSettings: settings.printSettings
    };

    const result = await exportToPDF(exportData, true);
    setIsExportingPDF(false);
    if (result instanceof Blob) {
      try {
        const reportName = pdfFileName.replace('.pdf', '');
        const prepared = await prepareReportForStorage({
          name: reportName,
          moduleType: 'granulometria',
          moduleName: 'Granulometria e Classificação',
          pdfBlob: result,
          calculationData: { formData, results }
        });
        addReport(prepared);
        setExportPDFDialogOpen(false);
        toast({ title: "Relatório salvo", description: "PDF disponível em Relatórios" });
        setPdfSavedDialogOpen(true);
      } catch (error) {
        console.error('Erro ao salvar relatório:', error);
        toast({ title: "PDF exportado", description: "Não foi possível salvar em Relatórios." });
      }
    } else {
      toast({
        title: "Erro",
        description: "Não foi possível gerar o PDF",
        variant: "destructive",
      });
    }
  };

  // Exportação Excel
  const handleExportExcel = async () => {
    if (!results) return;

    const peneirasData: { label: string; value: string | number }[] = formData.peneiras.map((p, i) => ({
      label: `Peneira ${i + 1}`,
      value: `${p.abertura} mm - ${p.massaRetida} g`
    }));

    const resultadosData: { label: string; value: string | number }[] = [];
    if (results.percentagem_pedregulho !== null) resultadosData.push({ label: "Pedregulho (%)", value: results.percentagem_pedregulho.toFixed(2) });
    if (results.percentagem_areia !== null) resultadosData.push({ label: "Areia (%)", value: results.percentagem_areia.toFixed(2) });
    if (results.percentagem_finos !== null) resultadosData.push({ label: "Finos (%)", value: results.percentagem_finos.toFixed(2) });
    if (results.classificacao_uscs) resultadosData.push({ label: "USCS", value: results.classificacao_uscs });
    if (results.classificacao_hrb) resultadosData.push({ label: "HRB", value: results.classificacao_hrb });

    const excelData: ExcelExportData = {
      moduleName: "granulometria",
      moduleTitle: "Análise Granulométrica",
      sheets: [
        { name: "Peneiras", data: peneirasData },
        { name: "Resultados", data: resultadosData }
      ],
    };

    const success = await exportToExcel(excelData);
    if (success) {
      toast({
        title: "📊 Excel exportado!",
        description: "Arquivo baixado com sucesso",
      });
    } else {
      toast({
        title: "Erro",
        description: "Não foi possível gerar o Excel",
        variant: "destructive",
      });
    }
  };

  const fmt = (value: number | null, decimals: number = 2) => {
    if (value === null || value === undefined) return "—";
    return formatNumber(value, settings);
  };

  const isFormValid = 
    formData.massaTotal &&
    formData.peneiras.filter(p => p.abertura && p.massaRetida).length >= 2;

  return (
    <div className="space-y-4 pb-4">
      {/* Header com Ações */}
      <div className="bg-gradient-to-r from-purple-500/10 via-purple-600/5 to-transparent p-4 rounded-xl border border-purple-500/20">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 via-purple-600 to-indigo-600 flex items-center justify-center shadow-md">
              <Filter className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">Granulometria</h2>
              <p className="text-xs text-muted-foreground">Análise e classificação de solos</p>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9"
              onClick={() => setExamplesSheetOpen(true)}
            >
              <Lightbulb className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9"
              onClick={() => setLoadSheetOpen(true)}
            >
              <FolderOpen className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Erro */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Massa Total */}
      <MobileSection
        title="Dados da Amostra"
        icon={<Info className="w-4 h-4" />}
        defaultOpen={true}
      >
        <MobileInputGroup
          label="Massa Total da Amostra"
          value={formData.massaTotal}
          onChange={(v) => handleInputChange("massaTotal", v)}
          placeholder="Ex: 1000"
          unit="g"
          required
          tooltip="Massa total da amostra seca utilizada no ensaio (NBR 7181)"
        />
      </MobileSection>

      {/* Peneiras com Carousel */}
      <MobileSection
        title="Dados das Peneiras"
        icon={<TableIcon className="w-4 h-4" />}
        defaultOpen={true}
      >
        <div className="space-y-4">
          {/* Controles de Navegação */}
          <div className="flex items-center justify-between bg-muted/30 p-3 rounded-lg">
            <Button
              variant="outline"
              size="sm"
              onClick={goToPreviousPeneira}
              disabled={currentPeneiraIndex === 0}
              className="h-9 w-9 p-0"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <div className="text-center">
              <span className="text-sm font-semibold">Peneira {currentPeneiraIndex + 1} de {formData.peneiras.length}</span>
              <div className="flex gap-1 mt-1 justify-center">
                {formData.peneiras.map((_, idx) => (
                  <div
                    key={idx}
                    className={cn(
                      "h-1.5 rounded-full transition-all",
                      idx === currentPeneiraIndex ? "w-6 bg-primary" : "w-1.5 bg-muted-foreground/30"
                    )}
                  />
                ))}
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={goToNextPeneira}
              disabled={currentPeneiraIndex === formData.peneiras.length - 1}
              className="h-9 w-9 p-0"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Carousel de Peneiras */}
          <Carousel setApi={setCarouselApi} className="w-full">
            <CarouselContent>
              {formData.peneiras.map((peneira, index) => (
                <CarouselItem key={peneira.id}>
                  <div className="p-3 rounded-lg bg-card/50 backdrop-blur-sm border border-border/50 space-y-3">
                    {/* Seletor de Peneira */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium flex items-center gap-2 after:content-['*'] after:text-destructive after:ml-0.5">
                        Peneira / Abertura
                      </Label>
                      <Select
                        value={peneira.abertura}
                        onValueChange={(v) => handleInputChangePeneira(index, "abertura", v)}
                      >
                        <SelectTrigger className="h-12 text-base">
                          <SelectValue placeholder="Selecione uma peneira..." />
                        </SelectTrigger>
                        <SelectContent className="max-h-[300px]">
                          {/* Pedregulhos */}
                          <div className="p-2">
                            <div className="text-xs font-semibold text-muted-foreground mb-2 px-2">
                              PEDREGULHOS
                            </div>
                            {PENEIRAS_PADRAO
                              .filter(p => p.tipo === 'pedregulho')
                              .map(p => (
                                <SelectItem key={p.numero} value={p.aberturaMM.toString()}>
                                  <div className="flex items-center gap-2">
                                    <span className="font-bold">{p.numero}</span>
                                    <span className="text-muted-foreground text-sm">
                                      ({p.aberturaMM.toFixed(2)} mm)
                                    </span>
                                  </div>
                                </SelectItem>
                              ))}
                          </div>

                          {/* Areias */}
                          <div className="p-2 border-t">
                            <div className="text-xs font-semibold text-muted-foreground mb-2 px-2">
                              AREIAS
                            </div>
                            {PENEIRAS_PADRAO
                              .filter(p => p.tipo.includes('areia'))
                              .map(p => (
                                <SelectItem key={p.numero} value={p.aberturaMM.toString()}>
                                  <div className="flex items-center gap-2">
                                    <span className="font-bold">{p.numero}</span>
                                    <span className="text-muted-foreground text-sm">
                                      ({p.aberturaMM.toFixed(3)} mm)
                                    </span>
                                  </div>
                                </SelectItem>
                              ))}
                          </div>

                          {/* Finos */}
                          <div className="p-2 border-t">
                            <div className="text-xs font-semibold text-muted-foreground mb-2 px-2">
                              FINOS
                            </div>
                            {PENEIRAS_PADRAO
                              .filter(p => p.tipo === 'finos')
                              .map(p => (
                                <SelectItem key={p.numero} value={p.aberturaMM.toString()}>
                                  <div className="flex items-center gap-2">
                                    <span className="font-bold">{p.numero}</span>
                                    <span className="text-muted-foreground text-sm">
                                      ({p.aberturaMM.toFixed(3)} mm)
                                    </span>
                                  </div>
                                </SelectItem>
                              ))}
                          </div>
                        </SelectContent>
                      </Select>
                      
                      {/* Mostrar peneira selecionada */}
                      {peneira.abertura && (() => {
                        const peneiraInfo = PENEIRAS_PADRAO.find(p => 
                          Math.abs(p.aberturaMM - parseFloat(peneira.abertura)) < 0.01
                        );
                        return peneiraInfo ? (
                          <div className="text-xs text-muted-foreground">
                            Peneira: <span className="font-semibold">{peneiraInfo.numero}</span> - {peneiraInfo.aberturaMM.toFixed(3)} mm
                          </div>
                        ) : null;
                      })()}
                      
                      {/* Atalhos para peneiras mais comuns */}
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">Atalhos Rápidos:</Label>
                        <div className="grid grid-cols-4 gap-1.5">
                          {PENEIRAS_PADRAO
                            .filter(p => ['Nº 4', 'Nº 10', 'Nº 16', 'Nº 30', 'Nº 40', 'Nº 60', 'Nº 100', 'Nº 200'].includes(p.numero))
                            .map((p) => (
                              <Button
                                key={p.numero}
                                variant="outline"
                                size="sm"
                                className="h-9 text-xs font-semibold"
                                onClick={() => handleInputChangePeneira(index, "abertura", p.aberturaMM.toString())}
                              >
                                {p.numero}
                              </Button>
                            ))}
                        </div>
                      </div>
                    </div>

                    <MobileInputGroup
                      label="Massa Retida"
                      value={peneira.massaRetida}
                      onChange={(v) => handleInputChangePeneira(index, "massaRetida", v)}
                      placeholder="Ex: 150"
                      unit="g"
                      required
                      tooltip="Massa de solo retida nesta peneira após peneiramento"
                    />
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>

          {/* Botões de Ação */}
          <div className="flex gap-2">
            <Button
              onClick={addPeneira}
              variant="outline"
              className="flex-1 h-10 focus-visible:ring-0 focus-visible:ring-offset-0 [-webkit-tap-highlight-color:transparent] active:scale-95 transition-transform"
            >
              <Plus className="w-4 h-4 mr-2" />
              Adicionar
            </Button>
            {formData.peneiras.length > 2 && (
              <Button
                onClick={removePeneira}
                variant="outline"
                className="flex-1 h-10 text-destructive hover:text-destructive hover:bg-destructive/10 focus-visible:ring-0 focus-visible:ring-offset-0 [-webkit-tap-highlight-color:transparent] active:scale-95 transition-transform"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Remover
              </Button>
            )}
          </div>
        </div>
      </MobileSection>

      {/* Dados Opcionais */}
      <MobileSection
        title="Limites de Atterberg (Opcional)"
        icon={<Info className="w-4 h-4" />}
        defaultOpen={false}
        collapsible
      >
        <MobileInputGroup
          label="Limite de Liquidez (LL)"
          value={formData.limitePercent}
          onChange={(v) => handleInputChange("limitePercent", v)}
          placeholder="Ex: 45"
          unit="%"
          tooltip="Para classificação USCS e HRB de solos finos"
        />

        <MobileInputGroup
          label="Limite de Plasticidade (LP)"
          value={formData.limitePlasticidade}
          onChange={(v) => handleInputChange("limitePlasticidade", v)}
          placeholder="Ex: 25"
          unit="%"
          tooltip="Para classificação USCS e HRB de solos finos"
        />
      </MobileSection>

      {/* Botões de Cálculo */}
      <div className="grid grid-cols-2 gap-3">
        <Button
          onClick={handleCalculate}
          disabled={!isFormValid || isCalculating}
          className="h-12 font-semibold focus-visible:ring-0 focus-visible:ring-offset-0 [-webkit-tap-highlight-color:transparent] active:scale-95 transition-transform"
          size="lg"
        >
          <Calculator className="w-4 h-4 mr-2" />
          {isCalculating ? "Calculando..." : "Analisar"}
        </Button>
        
        <Button
          onClick={handleClear}
          variant="outline"
          className="h-12 focus-visible:ring-0 focus-visible:ring-offset-0 [-webkit-tap-highlight-color:transparent] active:scale-95 transition-transform"
          size="lg"
        >
          Limpar
        </Button>
      </div>

      {/* Ações de Exportação */}
      {results && (
        <div className="flex gap-2">
          <Button
            onClick={handleSaveClick}
            variant="outline"
            size="sm"
            className="flex-1 h-10 focus-visible:ring-0 focus-visible:ring-offset-0 [-webkit-tap-highlight-color:transparent] active:scale-95 transition-transform"
          >
            <Save className="w-4 h-4 mr-2" />
            Salvar
          </Button>
          <Button
            onClick={handleExportPDF}
            variant="outline"
            size="sm"
            className="flex-1 h-10 focus-visible:ring-0 focus-visible:ring-offset-0 [-webkit-tap-highlight-color:transparent] active:scale-95 transition-transform"
          >
            <FileText className="w-4 h-4 mr-2" />
            PDF
          </Button>
          <Button
            onClick={handleExportExcel}
            variant="outline"
            size="sm"
            className="flex-1 h-10 focus-visible:ring-0 focus-visible:ring-offset-0 [-webkit-tap-highlight-color:transparent] active:scale-95 transition-transform"
          >
            <Download className="w-4 h-4 mr-2" />
            Excel
          </Button>
        </div>
      )}

      {/* Resultados */}
      {results && (
        <MobileTabs
          tabs={[
            {
              id: "composicao",
              label: "Composição",
              icon: <BarChart3 className="w-4 h-4" />,
              content: (
                <div className="space-y-3">
                  {/* Composição Granulométrica */}
                  <div className="bg-card/50 backdrop-blur-sm rounded-xl border border-border/50 p-4 space-y-3">
                    <h3 className="font-semibold text-sm flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-purple-500" />
                      Composição Granulométrica
                    </h3>
                    <div className="grid grid-cols-3 gap-2">
                      <ResultCard label="Pedregulho" value={results.percentagem_pedregulho} unit="%" />
                      <ResultCard label="Areia" value={results.percentagem_areia} unit="%" />
                      <ResultCard label="Finos" value={results.percentagem_finos} unit="%" />
                    </div>
                  </div>

                  {/* Coeficientes */}
                  {(results.d10 !== null || results.d30 !== null || results.d60 !== null) && (
                    <div className="bg-card/50 backdrop-blur-sm rounded-xl border border-border/50 p-4 space-y-3">
                      <h3 className="font-semibold text-sm flex items-center gap-2">
                        <Info className="w-4 h-4 text-purple-500" />
                        Diâmetros Característicos
                      </h3>
                      <div className="grid grid-cols-3 gap-2">
                        <ResultCard label="D10" value={results.d10} unit="mm" />
                        <ResultCard label="D30" value={results.d30} unit="mm" />
                        <ResultCard label="D60" value={results.d60} unit="mm" />
                      </div>
                    </div>
                  )}

                  {/* Coeficientes de Graduação */}
                  {(results.coef_uniformidade !== null || results.coef_curvatura !== null) && (
                    <div className="bg-card/50 backdrop-blur-sm rounded-xl border border-border/50 p-4 space-y-3">
                      <h3 className="font-semibold text-sm flex items-center gap-2">
                        <Filter className="w-4 h-4 text-purple-500" />
                        Coeficientes de Graduação
                      </h3>
                      <div className="grid grid-cols-2 gap-2">
                        <ResultCard label="Cu" value={results.coef_uniformidade} unit="" />
                        <ResultCard label="Cc" value={results.coef_curvatura} unit="" />
                      </div>
                    </div>
                  )}
                </div>
              ),
            },
            {
              id: "classificacoes",
              label: "Classificações",
              icon: <Info className="w-4 h-4" />,
              content: (
                <div className="space-y-3">
                  {/* USCS */}
                  {results.classificacao_uscs && (
                    <div className="bg-card/50 backdrop-blur-sm rounded-xl border border-border/50 p-4 space-y-3">
                      <h3 className="font-semibold text-sm">Sistema USCS (Unificado)</h3>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Classificação</span>
                          <Badge className="text-sm font-bold">{results.classificacao_uscs}</Badge>
                        </div>
                        {results.descricao_uscs && (
                          <p className="text-xs text-muted-foreground">{results.descricao_uscs}</p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* HRB */}
                  {results.classificacao_hrb && (
                    <div className="bg-card/50 backdrop-blur-sm rounded-xl border border-border/50 p-4 space-y-3">
                      <h3 className="font-semibold text-sm">Sistema HRB (Rodoviário)</h3>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Classificação</span>
                          <Badge variant="secondary" className="text-sm font-bold">{results.classificacao_hrb}</Badge>
                        </div>
                        {results.grupo_hrb && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Grupo</span>
                            <span className="font-medium">{results.grupo_hrb}</span>
                          </div>
                        )}
                        {results.subgrupo_hrb && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Subgrupo</span>
                            <span className="font-medium">{results.subgrupo_hrb}</span>
                          </div>
                        )}
                        {results.indice_grupo_hrb !== null && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Índice de Grupo</span>
                            <span className="font-medium">{results.indice_grupo_hrb}</span>
                          </div>
                        )}
                        {results.descricao_hrb && (
                          <p className="text-xs text-muted-foreground pt-2 border-t">{results.descricao_hrb}</p>
                        )}
                        {results.avaliacao_subleito_hrb && (
                          <p className="text-xs text-primary font-medium">{results.avaliacao_subleito_hrb}</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ),
            },
            {
              id: "tabelas",
              label: "",
              icon: <TableIcon className="w-4 h-4" />,
              content: (
                <div className="space-y-6">
                  {/* Tabelas de Dados */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-sm flex items-center gap-2">
                      <TableIcon className="w-4 h-4 text-purple-500" />
                      Tabelas de Dados
                    </h3>
                    <TabelaDadosGranulometricos
                      dados={results.dados_granulometricos}
                      massaTotal={parseFloat(formData.massaTotal)}
                    />
                  </div>

                  {/* Botões de Download de Gráficos */}
                  <div className="space-y-3 pt-4 border-t">
                    <h3 className="font-semibold text-sm flex items-center gap-2">
                      <Download className="w-4 h-4 text-purple-500" />
                      Exportar Gráficos
                    </h3>
                    
                    {/* Hidden charts for download */}
                    <div className="fixed pointer-events-none" style={{ left: '-9999px', top: 0, zIndex: -9999 }}>
                      <div id="curva-mobile-export" className="bg-white p-4" style={{ width: '1240px' }}>
                        <CurvaGranulometrica
                          dados={results.dados_granulometricos}
                          d10={results.d10}
                          d30={results.d30}
                          d60={results.d60}
                          isMobile={false}
                        />
                      </div>
                      {formData.limitePercent && formData.limitePlasticidade && (
                        <div id="carta-mobile-export" className="bg-white p-4" style={{ width: '800px' }}>
                          <PlasticityChart
                            ll={parseFloat(formData.limitePercent)}
                            ip={parseFloat(formData.limitePercent) - parseFloat(formData.limitePlasticidade)}
                          />
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col gap-2">
                      <Button
                        onClick={async () => {
                          try {
                            const { default: html2canvas } = await import('html2canvas');
                            const chartElement = document.getElementById('curva-mobile-export');
                            if (!chartElement) return;

                            const canvas = await html2canvas(chartElement, {
                              scale: 2,
                              backgroundColor: '#ffffff',
                              logging: false,
                              useCORS: true,
                            });

                            canvas.toBlob((blob) => {
                              if (blob) {
                                const url = URL.createObjectURL(blob);
                                const link = document.createElement('a');
                                link.download = `curva_granulometrica_${new Date().toISOString().split('T')[0]}.jpg`;
                                link.href = url;
                                link.click();
                                URL.revokeObjectURL(url);
                                toast({ title: "✅ Curva exportada com sucesso!" });
                              }
                            }, 'image/jpeg', 0.95);
                          } catch (error) {
                            toast({ title: "❌ Erro ao exportar curva", variant: "destructive" });
                          }
                        }}
                        variant="outline"
                        className="w-full justify-start gap-2"
                      >
                        <BarChart3 className="w-4 h-4" />
                        Baixar Curva Granulométrica (JPG)
                      </Button>

                      {formData.limitePercent && formData.limitePlasticidade && (
                        <Button
                          onClick={async () => {
                            try {
                              const { default: html2canvas } = await import('html2canvas');
                              const chartElement = document.getElementById('carta-mobile-export');
                              if (!chartElement) return;

                              const canvas = await html2canvas(chartElement, {
                                scale: 2,
                                backgroundColor: '#ffffff',
                                logging: false,
                                useCORS: true,
                              });

                              canvas.toBlob((blob) => {
                                if (blob) {
                                  const url = URL.createObjectURL(blob);
                                  const link = document.createElement('a');
                                  link.download = `carta_plasticidade_${new Date().toISOString().split('T')[0]}.jpg`;
                                  link.href = url;
                                  link.click();
                                  URL.revokeObjectURL(url);
                                  toast({ title: "✅ Carta exportada com sucesso!" });
                                }
                              }, 'image/jpeg', 0.95);
                            } catch (error) {
                              toast({ title: "❌ Erro ao exportar carta", variant: "destructive" });
                            }
                          }}
                          variant="outline"
                          className="w-full justify-start gap-2"
                        >
                          <FileText className="w-4 h-4" />
                          Baixar Carta de Plasticidade (JPG)
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ),
            },
          ]}
        />
      )}

      {/* Sheet de Exemplos */}
      <Sheet open={examplesSheetOpen} onOpenChange={setExamplesSheetOpen}>
        <SheetContent side="bottom" className="h-[70vh] rounded-t-2xl">
          <SheetHeader>
            <SheetTitle>Exemplos de Análises</SheetTitle>
          </SheetHeader>
          <div className="mt-6 space-y-3 overflow-y-auto max-h-[calc(70vh-100px)]">
            {EXEMPLOS_GRANULOMETRIA.map((example) => (
              <button
                key={example.id}
                onClick={() => handleLoadExample(example)}
                className="w-full p-4 rounded-xl bg-secondary/50 hover:bg-secondary border-2 border-transparent hover:border-primary/20 transition-all active:scale-95 text-left focus-visible:outline-none [-webkit-tap-highlight-color:transparent]"
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl">📊</span>
                  <div className="flex-1">
                    <h4 className="font-semibold text-foreground">{example.nome}</h4>
                    <p className="text-sm text-muted-foreground mt-1">{example.descricao}</p>
                    <Badge variant="outline" className="mt-2 text-xs">{example.classificacaoEsperada}</Badge>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </SheetContent>
      </Sheet>

      {/* Sheet de Cálculos Salvos */}
      <Sheet open={loadSheetOpen} onOpenChange={setLoadSheetOpen}>
        <SheetContent side="bottom" className="h-[70vh] rounded-t-2xl">
          <SheetHeader>
            <SheetTitle>Análises Salvas</SheetTitle>
          </SheetHeader>
          <div className="mt-6 space-y-3 overflow-y-auto max-h-[calc(70vh-100px)]">
            {calculations.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <FolderOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Nenhuma análise salva ainda</p>
              </div>
            ) : (
              calculations.map((calc) => (
                <div
                  key={calc.id}
                  className="p-4 rounded-xl bg-secondary/50 border border-border/50"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-sm">{calc.name}</h4>
                    <span className="text-xs text-muted-foreground">
                      {new Date(calc.timestamp).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 h-9 focus-visible:ring-0 focus-visible:ring-offset-0 [-webkit-tap-highlight-color:transparent] active:scale-95 transition-transform"
                      onClick={() => handleLoadCalculation(calc)}
                    >
                      Carregar
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      className="h-9 focus-visible:ring-0 focus-visible:ring-offset-0 [-webkit-tap-highlight-color:transparent] active:scale-95 transition-transform"
                      onClick={() => {
                        deleteCalculation(calc.id);
                        toast({ title: "🗑️ Excluído", description: "Análise removida" });
                      }}
                    >
                      Excluir
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Dialog de Salvar */}
      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Salvar Análise</DialogTitle>
            <DialogDescription>
              Dê um nome para esta análise
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
              placeholder="Ex: Solo Arenoso - Obra X"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleConfirmSave();
              }}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSaveDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleConfirmSave} disabled={!saveName.trim()}>
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Exportar PDF */}
      <ExportPDFDialog
        open={exportPDFDialogOpen}
        onOpenChange={setExportPDFDialogOpen}
        fileName={pdfFileName}
        onFileNameChange={setPdfFileName}
        onConfirm={handleConfirmExportPDF}
        isExporting={isExportingPDF}
      />

      {/* Diálogo pós-exportação: PDF salvo */}
      <Dialog open={pdfSavedDialogOpen} onOpenChange={setPdfSavedDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Relatório gerado</DialogTitle>
            <DialogDescription>
              O PDF foi salvo na seção Relatórios. Deseja ir para lá agora?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button variant="outline" onClick={() => setPdfSavedDialogOpen(false)}>
              Ficar aqui
            </Button>
            <Button
              onClick={() => {
                setPdfSavedDialogOpen(false);
                navigate('/relatorios');
              }}
            >
              Ir para Relatórios
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Componente de Card de Resultado
interface ResultCardProps {
  label: string;
  value: number | null;
  unit: string;
}

function ResultCard({ label, value, unit }: ResultCardProps) {
  const displayValue = value !== null && value !== undefined ? value.toFixed(2) : "—";

  return (
    <div className="flex flex-col gap-1 p-3 rounded-lg bg-background/50 border border-border/50">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <span className="text-lg font-bold text-foreground">
        {displayValue} <span className="text-xs font-normal text-muted-foreground">{unit}</span>
      </span>
    </div>
  );
}

