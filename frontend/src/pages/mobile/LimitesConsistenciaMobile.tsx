import { useState, useEffect } from "react";
import { Droplet, Calculator, Plus, Trash2, BarChart3, Info, Save, Download, FileText, FolderOpen, Lightbulb, AlertCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { calcularLimitesConsistencia } from "@/lib/calculations/limites-consistencia";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/components/ui/use-toast";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
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
import { useSavedCalculations } from "@/hooks/use-saved-calculations";
import { exportToPDF, exportToExcel, ExportData, ExcelExportData, formatNumberForExport, generateDefaultPDFFileName } from "@/lib/export-utils";
import { useRecentReports } from "@/hooks/useRecentReports";
import { prepareReportForStorage } from "@/lib/reportManager";
import { useNavigate } from "react-router-dom";
import ExportPDFDialog from "@/components/ExportPDFDialog";
import LimiteLiquidezChart from "@/components/limites/LimiteLiquidezChart";
import { ExemploLimites, exemplosLimites } from "@/lib/exemplos-limites";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface PontoLL {
  id: string;
  numGolpes: string;
  massaUmidaRecipiente: string;
  massaSecaRecipiente: string;
  massaRecipiente: string;
}

interface PontoLP {
  id: string;
  massaUmidaRecipiente: string;
  massaSecaRecipiente: string;
  massaRecipiente: string;
}

interface FormData {
  pontosLL: PontoLL[];
  pontosLP: PontoLP[];
  umidadeNatural: string;
  percentualArgila: string;
}

interface PontoCurva {
  x: number;
  y: number;
}

interface Results {
  ll: number | null;
  lp: number | null;
  ip: number | null;
  ic: number | null;
  classificacao_plasticidade: string | null;
  classificacao_consistencia: string | null;
  atividade_argila: number | null;
  classificacao_atividade: string | null;
  pontos_grafico_ll?: PontoCurva[] | null;
  erro?: string | null;
}

// Cálculos agora são feitos localmente no frontend

// Função para gerar IDs únicos
const generateId = () => `${Date.now()}-${Math.floor(Math.random() * 1000000)}`;

export default function LimitesConsistenciaMobile() {
  const { settings } = useSettings();
  const { toast } = useToast();
  const { addReport } = useRecentReports();
  const navigate = useNavigate();

  const [formData, setFormData] = useState<FormData>({
    pontosLL: [
      { id: generateId(), numGolpes: "", massaUmidaRecipiente: "", massaSecaRecipiente: "", massaRecipiente: "" },
      { id: generateId(), numGolpes: "", massaUmidaRecipiente: "", massaSecaRecipiente: "", massaRecipiente: "" },
    ],
    pontosLP: [
      { id: generateId(), massaUmidaRecipiente: "", massaSecaRecipiente: "", massaRecipiente: "" },
    ],
    umidadeNatural: "",
    percentualArgila: "",
  });

  const [results, setResults] = useState<Results | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Estados para navegação de pontos
  const [currentPointIndex, setCurrentPointIndex] = useState(0);
  const [currentLPIndex, setCurrentLPIndex] = useState(0);
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();
  const [carouselApiLP, setCarouselApiLP] = useState<CarouselApi>();

  // Estados para salvamento
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [saveName, setSaveName] = useState("");
  const [loadSheetOpen, setLoadSheetOpen] = useState(false);
  const { calculations, saveCalculation, deleteCalculation } = useSavedCalculations("limites-consistencia");

  // Estados para exportação
  const [exportPDFDialogOpen, setExportPDFDialogOpen] = useState(false);
  const [pdfFileName, setPdfFileName] = useState("");
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [pdfSavedDialogOpen, setPdfSavedDialogOpen] = useState(false);

  // Estados para exemplos
  const [examplesSheetOpen, setExamplesSheetOpen] = useState(false);

  // Sincronizar carousel LL com índice atual
  useEffect(() => {
    if (!carouselApi) return;

    carouselApi.on("select", () => {
      setCurrentPointIndex(carouselApi.selectedScrollSnap());
    });
  }, [carouselApi]);

  // Sincronizar carousel LP com índice atual
  useEffect(() => {
    if (!carouselApiLP) return;

    carouselApiLP.on("select", () => {
      setCurrentLPIndex(carouselApiLP.selectedScrollSnap());
    });
  }, [carouselApiLP]);

  const handleInputChangeLL = (index: number, field: keyof PontoLL, value: string) => {
    const newPontos = [...formData.pontosLL];
    newPontos[index] = { ...newPontos[index], [field]: value };
    setFormData({ ...formData, pontosLL: newPontos });
    setError(null);
  };

  const handleInputChangeLP = (index: number, field: keyof PontoLP, value: string) => {
    const newPontos = [...formData.pontosLP];
    newPontos[index] = { ...newPontos[index], [field]: value };
    setFormData({ ...formData, pontosLP: newPontos });
    setError(null);
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData({ ...formData, [field]: value });
    setError(null);
  };

  const addPonto = () => {
    setFormData({
      ...formData,
      pontosLL: [...formData.pontosLL, { id: generateId(), numGolpes: "", massaUmidaRecipiente: "", massaSecaRecipiente: "", massaRecipiente: "" }],
    });
    setCurrentPointIndex(formData.pontosLL.length);
  };

  const removePonto = () => {
    if (formData.pontosLL.length <= 2) {
      toast({
        title: "Mínimo de pontos",
        description: "São necessários pelo menos 2 pontos",
        variant: "destructive",
      });
      return;
    }
    const newPontos = formData.pontosLL.filter((_, i) => i !== currentPointIndex);
    setFormData({ ...formData, pontosLL: newPontos });
    if (currentPointIndex >= newPontos.length) {
      setCurrentPointIndex(Math.max(0, newPontos.length - 1));
    }
  };

  const goToNextPoint = () => {
    if (currentPointIndex < formData.pontosLL.length - 1) {
      setCurrentPointIndex(currentPointIndex + 1);
      carouselApi?.scrollTo(currentPointIndex + 1);
    }
  };

  const goToPreviousPoint = () => {
    if (currentPointIndex > 0) {
      setCurrentPointIndex(currentPointIndex - 1);
      carouselApi?.scrollTo(currentPointIndex - 1);
    }
  };

  const addPontoLP = () => {
    setFormData({
      ...formData,
      pontosLP: [...formData.pontosLP, { id: generateId(), massaUmidaRecipiente: "", massaSecaRecipiente: "", massaRecipiente: "" }],
    });
    setCurrentLPIndex(formData.pontosLP.length);
  };

  const removePontoLP = () => {
    if (formData.pontosLP.length <= 1) {
      toast({
        title: "Mínimo de ensaios",
        description: "É necessário pelo menos 1 ensaio de LP",
        variant: "destructive",
      });
      return;
    }
    const newPontos = formData.pontosLP.filter((_, i) => i !== currentLPIndex);
    setFormData({ ...formData, pontosLP: newPontos });
    if (currentLPIndex >= newPontos.length) {
      setCurrentLPIndex(Math.max(0, newPontos.length - 1));
    }
  };

  const goToNextLP = () => {
    if (currentLPIndex < formData.pontosLP.length - 1) {
      setCurrentLPIndex(currentLPIndex + 1);
      carouselApiLP?.scrollTo(currentLPIndex + 1);
    }
  };

  const goToPreviousLP = () => {
    if (currentLPIndex > 0) {
      setCurrentLPIndex(currentLPIndex - 1);
      carouselApiLP?.scrollTo(currentLPIndex - 1);
    }
  };

  const handleCalculate = async () => {
    // Validação
    const pontosValidosLL = formData.pontosLL.filter(p =>
      p.numGolpes && p.massaUmidaRecipiente && p.massaSecaRecipiente && p.massaRecipiente
    );

    if (pontosValidosLL.length < 2) {
      setError("São necessários pelo menos 2 pontos completos para LL");
      toast({
        title: "Dados incompletos",
        description: "Preencha pelo menos 2 pontos de LL",
        variant: "destructive",
      });
      return;
    }

    const pontosValidosLP = formData.pontosLP.filter(p =>
      p.massaUmidaRecipiente && p.massaSecaRecipiente && p.massaRecipiente
    );

    if (pontosValidosLP.length < 1) {
      setError("É necessário pelo menos 1 ensaio completo de LP");
      toast({
        title: "Dados incompletos",
        description: "Preencha pelo menos 1 ensaio de LP",
        variant: "destructive",
      });
      return;
    }

    setIsCalculating(true);
    setError(null);

    try {
      const payload = {
        pontos_ll: pontosValidosLL.map(p => ({
          num_golpes: parseFloat(p.numGolpes),
          massa_umida_recipiente: parseFloat(p.massaUmidaRecipiente),
          massa_seca_recipiente: parseFloat(p.massaSecaRecipiente),
          massa_recipiente: parseFloat(p.massaRecipiente),
        })),
        pontos_lp: pontosValidosLP.map(p => ({
          massa_umida_recipiente: parseFloat(p.massaUmidaRecipiente),
          massa_seca_recipiente: parseFloat(p.massaSecaRecipiente),
          massa_recipiente: parseFloat(p.massaRecipiente),
        })),
        umidade_natural: formData.umidadeNatural ? parseFloat(formData.umidadeNatural) : undefined,
        percentual_argila: formData.percentualArgila ? parseFloat(formData.percentualArgila) : undefined,
      };

      // Calcula localmente no frontend
      const resultado = calcularLimitesConsistencia(payload);
      setResults(resultado);

      if (resultado.erro) {
        setError(resultado.erro);
        toast({
          title: "❌ Erro",
          description: resultado.erro,
          variant: "destructive",
        });
      } else {
        toast({
          title: "✅ Sucesso!",
          description: "Limites calculados com sucesso",
        });
      }
    } catch (err: any) {
      const errorMsg = err.message || "Erro ao calcular";
      setError(errorMsg);

      toast({
        title: "❌ Erro",
        description: errorMsg,
        variant: "destructive",
      });
    } finally {
      setIsCalculating(false);
    }
  };

  const handleClear = () => {
    setFormData({
      pontosLL: [
        { id: generateId(), numGolpes: "", massaUmidaRecipiente: "", massaSecaRecipiente: "", massaRecipiente: "" },
        { id: generateId(), numGolpes: "", massaUmidaRecipiente: "", massaSecaRecipiente: "", massaRecipiente: "" },
      ],
      pontosLP: [
        { id: generateId(), massaUmidaRecipiente: "", massaSecaRecipiente: "", massaRecipiente: "" },
      ],
      umidadeNatural: "",
      percentualArgila: "",
    });
    setResults(null);
    setError(null);
    setCurrentPointIndex(0);
    setCurrentLPIndex(0);
  };

  const handleLoadExample = (example: ExemploLimites) => {
    setFormData({
      pontosLL: example.pontosLL.map(p => ({
        ...p,
        id: generateId()
      })),
      pontosLP: example.pontosLP.map(p => ({
        ...p,
        id: generateId()
      })),
      umidadeNatural: example.umidadeNatural || "",
      percentualArgila: example.percentualArgila || "",
    });
    setResults(null);
    setError(null);
    setCurrentPointIndex(0);
    setCurrentLPIndex(0);
    setExamplesSheetOpen(false);
    toast({
      title: `${example.icon} ${example.nome}`,
      description: example.descricao,
    });
  };

  // Salvamento
  const handleSaveClick = () => {
    if (!results) return;
    setSaveName(`Cálculo ${new Date().toLocaleDateString('pt-BR')}`);
    setSaveDialogOpen(true);
  };

  const handleConfirmSave = () => {
    if (!results || !saveName.trim()) return;

    const success = saveCalculation(saveName.trim(), formData, results);
    if (success) {
      toast({
        title: "💾 Salvo!",
        description: "Cálculo salvo com sucesso",
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
    setPdfFileName(generateDefaultPDFFileName("Limites de Consistência"));
    setExportPDFDialogOpen(true);
  };

  const handleConfirmExportPDF = async () => {
    if (!results) return;
    setIsExportingPDF(true);

    try {
      const inputs: { label: string; value: string }[] = [];
      if (formData.umidadeNatural) inputs.push({ label: "Umidade Natural", value: `${formData.umidadeNatural}%` });
      if (formData.percentualArgila) inputs.push({ label: "Percentual de Argila", value: `${formData.percentualArgila}%` });

      const resultsList: { label: string; value: string; highlight?: boolean }[] = [];
      if (results.ll !== null) resultsList.push({ label: "Limite de Liquidez (LL)", value: `${formatNumberForExport(results.ll, 1)}%` });
      if (results.lp !== null) resultsList.push({ label: "Limite de Plasticidade (LP)", value: `${formatNumberForExport(results.lp, 1)}%` });
      if (results.ip !== null) resultsList.push({ label: "Índice de Plasticidade (IP)", value: `${formatNumberForExport(results.ip, 1)}%` });
      if (results.ic !== null) resultsList.push({ label: "Índice de Consistência (IC)", value: formatNumberForExport(results.ic, 2) });
      if (results.classificacao_plasticidade) resultsList.push({ label: "Classificação Plasticidade", value: results.classificacao_plasticidade });
      if (results.classificacao_consistencia) resultsList.push({ label: "Classificação Consistência", value: results.classificacao_consistencia });
      if (results.atividade_argila !== null) resultsList.push({ label: "Atividade Argila (Ia)", value: formatNumberForExport(results.atividade_argila, 2) });
      if (results.classificacao_atividade) resultsList.push({ label: "Classificação Atividade", value: results.classificacao_atividade });

      // Preparar tabelas de dados de entrada
      const tables = [];

      // TABELA 1: Ensaio de Limite de Liquidez
      const llHeaders = ["Ponto", "Nº Golpes", "Massa Úmida+Rec (g)", "Massa Seca+Rec (g)", "Massa Recipiente (g)"];
      const llRows = formData.pontosLL.map((p, i) => [
        `${i + 1}`,
        p.numGolpes,
        p.massaUmidaRecipiente,
        p.massaSecaRecipiente,
        p.massaRecipiente
      ]);

      tables.push({
        title: "Ensaio de Limite de Liquidez (LL)",
        headers: llHeaders,
        rows: llRows
      });

      // TABELA 2: Ensaio de Limite de Plasticidade
      const lpHeaders = ["Ensaio", "Massa Úmida+Rec (g)", "Massa Seca+Rec (g)", "Massa Recipiente (g)"];
      const lpRows = formData.pontosLP.map((p, i) => [
        `${i + 1}`,
        p.massaUmidaRecipiente,
        p.massaSecaRecipiente,
        p.massaRecipiente
      ]);

      tables.push({
        title: "Ensaio de Limite de Plasticidade (LP)",
        headers: lpHeaders,
        rows: lpRows
      });

      const exportData: ExportData = {
        moduleName: "limites-consistencia",
        moduleTitle: "Limites de Consistência",
        inputs,
        results: resultsList,
        tables,
        customFileName: pdfFileName
      };

      // Gerar PDF como Blob para armazenar em Relatórios
      const pdfBlob = await exportToPDF(exportData, true) as Blob;

      // Preparar e salvar relatório
      const report = await prepareReportForStorage({
        name: pdfFileName || generateDefaultPDFFileName("Limites de Consistência"),
        moduleType: "limites",
        moduleName: "Limites de Consistência",
        pdfBlob,
        calculationData: { formData, results }
      });
      const saved = addReport(report);

      setIsExportingPDF(false);
      setExportPDFDialogOpen(false);

      if (saved) {
        toast({ title: "Relatório salvo", description: "PDF disponível em Relatórios" });
        // No mobile, mostrar diálogo com CTA para ir aos Relatórios
        setPdfSavedDialogOpen(true);
      } else {
        toast({ title: "Erro", description: "PDF gerado, mas não salvo em Relatórios", variant: "destructive" });
      }
    } catch (error) {
      console.error("Erro ao exportar PDF:", error);
      setIsExportingPDF(false);
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao gerar o PDF. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  // Exportação Excel
  const handleExportExcel = async () => {
    if (!results) return;

    // Sheet de Entrada - Pontos LL
    const entradaLLData: { label: string; value: string | number }[] = [];
    formData.pontosLL.forEach((p, i) => {
      entradaLLData.push({ label: `Ponto LL ${i + 1} - Golpes`, value: p.numGolpes });
      entradaLLData.push({ label: `Ponto LL ${i + 1} - Massa Úmida+Rec (g)`, value: p.massaUmidaRecipiente });
      entradaLLData.push({ label: `Ponto LL ${i + 1} - Massa Seca+Rec (g)`, value: p.massaSecaRecipiente });
      entradaLLData.push({ label: `Ponto LL ${i + 1} - Massa Recipiente (g)`, value: p.massaRecipiente });
    });

    // Sheet de Entrada - LP
    const entradaLPData: { label: string; value: string | number }[] = [];
    formData.pontosLP.forEach((p, i) => {
      entradaLPData.push({ label: `Ensaio LP ${i + 1} - Massa Úmida+Rec (g)`, value: p.massaUmidaRecipiente });
      entradaLPData.push({ label: `Ensaio LP ${i + 1} - Massa Seca+Rec (g)`, value: p.massaSecaRecipiente });
      entradaLPData.push({ label: `Ensaio LP ${i + 1} - Massa Recipiente (g)`, value: p.massaRecipiente });
    });

    // Sheet de Entrada - Adicionais
    const entradaAdicionaisData: { label: string; value: string | number }[] = [];
    if (formData.umidadeNatural) entradaAdicionaisData.push({ label: "Umidade Natural (%)", value: formData.umidadeNatural });
    if (formData.percentualArgila) entradaAdicionaisData.push({ label: "Percentual de Argila (%)", value: formData.percentualArgila });

    // Sheet de Resultados
    const resultadosData: { label: string; value: string | number }[] = [];
    if (results.ll !== null) resultadosData.push({ label: "Limite de Liquidez (LL) %", value: results.ll.toFixed(1) });
    if (results.lp !== null) resultadosData.push({ label: "Limite de Plasticidade (LP) %", value: results.lp.toFixed(1) });
    if (results.ip !== null) resultadosData.push({ label: "Índice de Plasticidade (IP) %", value: results.ip.toFixed(1) });
    if (results.ic !== null) resultadosData.push({ label: "Índice de Consistência (IC)", value: results.ic.toFixed(2) });
    if (results.classificacao_plasticidade) resultadosData.push({ label: "Classificação Plasticidade", value: results.classificacao_plasticidade });
    if (results.classificacao_consistencia) resultadosData.push({ label: "Classificação Consistência", value: results.classificacao_consistencia });
    if (results.atividade_argila !== null) resultadosData.push({ label: "Atividade Argila (Ia)", value: results.atividade_argila.toFixed(2) });
    if (results.classificacao_atividade) resultadosData.push({ label: "Classificação Atividade", value: results.classificacao_atividade });

    const sheets = [
      { name: "Dados LL", data: entradaLLData },
      { name: "Dados LP", data: entradaLPData },
      { name: "Resultados", data: resultadosData }
    ];

    if (entradaAdicionaisData.length > 0) {
      sheets.splice(2, 0, { name: "Dados Adicionais", data: entradaAdicionaisData });
    }

    const excelData: ExcelExportData = {
      moduleName: "limites-consistencia",
      moduleTitle: "Limites de Consistência",
      sheets,
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
    formData.pontosLL.filter(p => p.numGolpes && p.massaUmidaRecipiente && p.massaSecaRecipiente && p.massaRecipiente).length >= 2 &&
    formData.pontosLP.filter(p => p.massaUmidaRecipiente && p.massaSecaRecipiente && p.massaRecipiente).length >= 1;

  return (
    <div className="space-y-4 pb-4">
      {/* Header com Ações */}
      <div className="bg-gradient-to-r from-cyan-500/10 via-teal-500/5 to-transparent p-4 rounded-xl border border-cyan-500/20">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 via-teal-500 to-emerald-600 flex items-center justify-center">
              <Droplet className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-bold text-foreground">Limites de Consistência</h2>
              <p className="text-xs text-muted-foreground">LL, LP, IP, IC e classificação</p>
            </div>
          </div>

          <div className="flex gap-2 shrink-0">
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9 active:scale-90 [-webkit-tap-highlight-color:transparent] transition-transform"
              onClick={() => setExamplesSheetOpen(true)}
              aria-label="Ver exemplos"
            >
              <Lightbulb className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9 active:scale-90 [-webkit-tap-highlight-color:transparent] transition-transform"
              onClick={() => setLoadSheetOpen(true)}
              aria-label="Carregar cálculos salvos"
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

      {/* Pontos de Limite de Liquidez */}
      <MobileSection
        title="Ensaio de Limite de Liquidez (LL)"
        icon={<Droplet className="w-4 h-4" />}
        defaultOpen={true}
      >
        <div className="space-y-4">
          {/* Controles de Navegação */}
          <div className="flex items-center justify-between bg-muted/30 p-3 rounded-lg">
            <Button
              variant="outline"
              size="sm"
              onClick={goToPreviousPoint}
              disabled={currentPointIndex === 0}
              className="h-9 w-9 p-0"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <div className="text-center">
              <span className="text-sm font-semibold">Ponto {currentPointIndex + 1} de {formData.pontosLL.length}</span>
              <div className="flex gap-1 mt-1 justify-center">
                {formData.pontosLL.map((_, idx) => (
                  <div
                    key={idx}
                    className={cn(
                      "h-1.5 rounded-full transition-all",
                      idx === currentPointIndex ? "w-6 bg-primary" : "w-1.5 bg-muted-foreground/30"
                    )}
                  />
                ))}
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={goToNextPoint}
              disabled={currentPointIndex === formData.pontosLL.length - 1}
              className="h-9 w-9 p-0"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Carousel de Pontos */}
          <Carousel setApi={setCarouselApi} className="w-full">
            <CarouselContent>
              {formData.pontosLL.map((ponto, index) => (
                <CarouselItem key={ponto.id}>
                  <div className="p-3 rounded-lg bg-card/50 backdrop-blur-sm border border-border/50 space-y-3">
                    <MobileInputGroup
                      label="N° de Golpes"
                      value={ponto.numGolpes}
                      onChange={(v) => handleInputChangeLL(index, "numGolpes", v)}
                      placeholder="Ex: 25"
                      required
                      tooltip="Número de golpes para fechar a ranhura"
                    />

                    <MobileInputGroup
                      label="Massa Úmida + Recipiente"
                      value={ponto.massaUmidaRecipiente}
                      onChange={(v) => handleInputChangeLL(index, "massaUmidaRecipiente", v)}
                      placeholder="Ex: 45.2"
                      unit="g"
                      required
                      tooltip="Massa do recipiente + solo úmido"
                    />

                    <MobileInputGroup
                      label="Massa Seca + Recipiente"
                      value={ponto.massaSecaRecipiente}
                      onChange={(v) => handleInputChangeLL(index, "massaSecaRecipiente", v)}
                      placeholder="Ex: 38.5"
                      unit="g"
                      required
                      tooltip="Massa do recipiente + solo seco"
                    />

                    <MobileInputGroup
                      label="Massa do Recipiente"
                      value={ponto.massaRecipiente}
                      onChange={(v) => handleInputChangeLL(index, "massaRecipiente", v)}
                      placeholder="Ex: 15.0"
                      unit="g"
                      required
                      tooltip="Massa do recipiente vazio (tara)"
                    />
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>

          {/* Botões de Ação */}
          <div className="flex gap-2">
            <Button
              onClick={addPonto}
              variant="outline"
              className="flex-1 h-10 focus-visible:ring-0 focus-visible:ring-offset-0 [-webkit-tap-highlight-color:transparent] active:scale-95 transition-transform"
            >
              <Plus className="w-4 h-4 mr-2" />
              Adicionar
            </Button>
            {formData.pontosLL.length > 2 && (
              <Button
                onClick={removePonto}
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

      {/* Limite de Plasticidade */}
      <MobileSection
        title="Ensaio de Limite de Plasticidade (LP)"
        icon={<Info className="w-4 h-4" />}
        defaultOpen={true}
      >
        <div className="space-y-3">
          {/* Navegação e Indicadores */}
          <div className="flex items-center justify-between gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={goToPreviousLP}
              disabled={currentLPIndex === 0}
              className="h-9 w-9 p-0"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <div className="flex-1 text-center">
              <p className="text-sm font-semibold">
                Ensaio {currentLPIndex + 1} de {formData.pontosLP.length}
              </p>
              <div className="flex gap-1 mt-1 justify-center">
                {formData.pontosLP.map((_, idx) => (
                  <div
                    key={idx}
                    className={cn(
                      "h-1.5 rounded-full transition-all",
                      idx === currentLPIndex ? "w-6 bg-primary" : "w-1.5 bg-muted-foreground/30"
                    )}
                  />
                ))}
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={goToNextLP}
              disabled={currentLPIndex === formData.pontosLP.length - 1}
              className="h-9 w-9 p-0"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Carousel de Ensaios LP */}
          <Carousel setApi={setCarouselApiLP} className="w-full">
            <CarouselContent>
              {formData.pontosLP.map((ponto, index) => (
                <CarouselItem key={ponto.id}>
                  <div className="p-3 rounded-lg bg-card/50 backdrop-blur-sm border border-border/50 space-y-3">
                    <MobileInputGroup
                      label="Massa Úmida + Recipiente"
                      value={ponto.massaUmidaRecipiente}
                      onChange={(v) => handleInputChangeLP(index, "massaUmidaRecipiente", v)}
                      placeholder="Ex: 32.4"
                      unit="g"
                      required
                      tooltip="Massa do recipiente + solo úmido"
                    />

                    <MobileInputGroup
                      label="Massa Seca + Recipiente"
                      value={ponto.massaSecaRecipiente}
                      onChange={(v) => handleInputChangeLP(index, "massaSecaRecipiente", v)}
                      placeholder="Ex: 30.1"
                      unit="g"
                      required
                      tooltip="Massa do recipiente + solo seco"
                    />

                    <MobileInputGroup
                      label="Massa do Recipiente"
                      value={ponto.massaRecipiente}
                      onChange={(v) => handleInputChangeLP(index, "massaRecipiente", v)}
                      placeholder="Ex: 15.0"
                      unit="g"
                      required
                      tooltip="Massa do recipiente vazio (tara)"
                    />
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>

          {/* Botões de Ação */}
          <div className="flex gap-2">
            <Button
              onClick={addPontoLP}
              variant="outline"
              className="flex-1 h-10 focus-visible:ring-0 focus-visible:ring-offset-0 [-webkit-tap-highlight-color:transparent] active:scale-95 transition-transform"
            >
              <Plus className="w-4 h-4 mr-2" />
              Adicionar
            </Button>
            {formData.pontosLP.length > 1 && (
              <Button
                onClick={removePontoLP}
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
        title="Dados Opcionais"
        icon={<Info className="w-4 h-4" />}
        defaultOpen={false}
        collapsible
      >
        <MobileInputGroup
          label="Umidade Natural"
          value={formData.umidadeNatural}
          onChange={(v) => handleInputChange("umidadeNatural", v)}
          placeholder="Ex: 25.5"
          unit="%"
          tooltip="Umidade natural do solo (para calcular IC)"
        />

        <MobileInputGroup
          label="Percentual de Argila"
          value={formData.percentualArgila}
          onChange={(v) => handleInputChange("percentualArgila", v)}
          placeholder="Ex: 45"
          unit="%"
          tooltip="% de partículas < 0.002mm (para calcular Atividade)"
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
          {isCalculating ? "Calculando..." : "Calcular"}
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
      {results && !results.erro && (
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
      {results && !results.erro && (
        <MobileTabs
          tabs={[
            {
              id: "principais",
              label: "Principais",
              icon: <BarChart3 className="w-4 h-4" />,
              content: (
                <div className="space-y-3">
                  {/* Limites */}
                  <div className="bg-card/50 backdrop-blur-sm rounded-xl border border-border/50 p-4 space-y-3">
                    <h3 className="font-semibold text-sm flex items-center gap-2">
                      <Droplet className="w-4 h-4 text-cyan-500" />
                      Limites de Consistência
                    </h3>
                    <ResultItem label="LL" value={results.ll} unit="%" />
                    <ResultItem label="LP" value={results.lp} unit="%" />
                    <ResultItem label="IP" value={results.ip} unit="%" />
                    {results.ic !== null && <ResultItem label="IC" value={results.ic} unit="" />}
                  </div>

                  {/* Classificações */}
                  {results.classificacao_plasticidade && (
                    <div className="bg-card/50 backdrop-blur-sm rounded-xl border border-border/50 p-4 space-y-3">
                      <h3 className="font-semibold text-sm flex items-center gap-2">
                        <Info className="w-4 h-4 text-cyan-500" />
                        Classificações
                      </h3>
                      <div className="flex flex-col gap-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Plasticidade</span>
                          <Badge className="text-xs">{results.classificacao_plasticidade}</Badge>
                        </div>
                        {results.classificacao_consistencia && (
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">Consistência</span>
                            <Badge variant="secondary" className="text-xs">{results.classificacao_consistencia}</Badge>
                          </div>
                        )}
                        {results.classificacao_atividade && (
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">Atividade</span>
                            <Badge variant="outline" className="text-xs">{results.classificacao_atividade}</Badge>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Atividade */}
                  {results.atividade_argila !== null && (
                    <div className="bg-card/50 backdrop-blur-sm rounded-xl border border-border/50 p-4">
                      <ResultItem label="Atividade (Ia)" value={results.atividade_argila} unit="" />
                    </div>
                  )}
                </div>
              ),
            },
            {
              id: "grafico",
              label: "Gráfico",
              icon: <BarChart3 className="w-4 h-4" />,
              content: (
                <div className="bg-card/50 rounded-xl border border-border/50 p-4">
                  <h4 className="font-semibold mb-4 text-center">Curva de Limite de Liquidez</h4>
                  {results.pontos_grafico_ll && results.pontos_grafico_ll.length > 0 ? (
                    <div className="overflow-x-auto">
                      <LimiteLiquidezChart
                        pontos={results.pontos_grafico_ll}
                        ll={results.ll}
                        isMobile={true}
                      />
                    </div>
                  ) : (
                    <p className="text-center text-sm text-muted-foreground">
                      Dados insuficientes para gerar gráfico
                    </p>
                  )}
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
            <SheetTitle>Exemplos de Ensaios</SheetTitle>
          </SheetHeader>
          <div className="mt-6 space-y-3 overflow-y-auto max-h-[calc(70vh-100px)]">
            {exemplosLimites.map((example, idx) => (
              <button
                key={idx}
                onClick={() => handleLoadExample(example)}
                className="w-full p-4 rounded-xl bg-secondary/50 hover:bg-secondary border-2 border-transparent hover:border-primary/20 transition-all active:scale-95 text-left focus-visible:outline-none [-webkit-tap-highlight-color:transparent]"
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{example.icon}</span>
                  <div className="flex-1">
                    <h4 className="font-semibold text-foreground">{example.nome}</h4>
                    <p className="text-sm text-muted-foreground mt-1">{example.descricao}</p>
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
            <SheetTitle>Cálculos Salvos</SheetTitle>
          </SheetHeader>
          <div className="mt-6 space-y-3 overflow-y-auto max-h-[calc(70vh-100px)]">
            {calculations.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <FolderOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Nenhum cálculo salvo ainda</p>
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
                        toast({ title: "🗑️ Excluído", description: "Cálculo removido" });
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
            <DialogTitle>Salvar Cálculo</DialogTitle>
            <DialogDescription>
              Dê um nome para este cálculo
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
              placeholder="Ex: Ensaio Solo Argiloso"
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
        isExporting={isExportingPDF}
        onConfirm={handleConfirmExportPDF}
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
                navigate("/relatorios");
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

interface ResultItemProps {
  label: string;
  value: number | null;
  unit: string;
}

function ResultItem({ label, value, unit }: ResultItemProps) {
  const displayValue = value !== null && value !== undefined ? value.toFixed(2) : "—";
  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-background/50 border border-border/50">
      <span className="text-sm font-medium text-muted-foreground">{label}</span>
      <span className="text-sm font-bold text-primary">{displayValue} {unit}</span>
    </div>
  );
}
