import { useState } from "react";
import { Beaker, Calculator, BarChart3, Info, Save, Download, FolderOpen, FileText, AlertCircle, Lightbulb } from "lucide-react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/components/ui/use-toast";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  SheetTrigger,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import {
  MobileSection,
  MobileInputGroup,
  MobileResultCard,
  MobileTabs,
} from "@/components/mobile";
import DiagramaFases from "@/components/visualizations/DiagramaFases";
import { formatNumber } from "@/lib/format-number";
import { useSettings } from "@/hooks/use-settings";
import { useSavedCalculations } from "@/hooks/use-saved-calculations";
import { SoilExample, soilExamples } from "@/lib/soil-constants";
import { exportToPDF, exportToExcel, ExportData, ExcelExportData, formatNumberForExport, generateDefaultPDFFileName } from "@/lib/export-utils";
import ExportPDFDialog from "@/components/ExportPDFDialog";
import { useTheme } from "@/hooks/use-theme";
import { conteudoIndicesFisicos } from "@/lib/geotecnia/indicesFisicosConteudo";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface FormData {
  massaUmida: string;
  massaSeca: string;
  volume: string;
  Gs: string;
  pesoEspecificoAgua: string;
  indice_vazios_max: string;
  indice_vazios_min: string;
}

interface IndicesFisicosOutput {
  peso_especifico_natural: number | null;
  peso_especifico_seco: number | null;
  peso_especifico_saturado: number | null;
  peso_especifico_submerso: number | null;
  peso_especifico_solidos: number | null;
  Gs: number | null;
  indice_vazios: number | null;
  porosidade: number | null;
  grau_saturacao: number | null;
  umidade: number | null;
  volume_solidos_norm: number | null;
  volume_agua_norm: number | null;
  volume_ar_norm: number | null;
  peso_solidos_norm?: number | null;
  peso_agua_norm?: number | null;
  compacidade_relativa: number | null;
  classificacao_compacidade: string | null;
  volume_total_calc: number | null;
  volume_solidos_calc: number | null;
  volume_agua_calc: number | null;
  volume_ar_calc: number | null;
  massa_total_calc: number | null;
  massa_solidos_calc: number | null;
  massa_agua_calc: number | null;
  aviso?: string | null;
  erro?: string | null;
}

type Results = IndicesFisicosOutput;

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

// Sugestões de Gs por tipo de solo
const gsSuggestions = [
  { type: "Areia (Quartzo)", value: 2.65, icon: "🏖️" },
  { type: "Argila", value: 2.70, icon: "🧱" },
  { type: "Silte", value: 2.68, icon: "🌾" },
  { type: "Solo Orgânico", value: 2.50, icon: "🌱" },
];

export default function IndicesFisicosMobile() {
  const { settings } = useSettings();
  const { theme } = useTheme();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState<FormData>({
    massaUmida: "",
    massaSeca: "",
    volume: "",
    Gs: "",
    pesoEspecificoAgua: "10.0",
    indice_vazios_max: "",
    indice_vazios_min: "",
  });
  
  const [results, setResults] = useState<Results | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Estados para salvamento
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [saveName, setSaveName] = useState("");
  const [loadSheetOpen, setLoadSheetOpen] = useState(false);
  const { calculations, saveCalculation, deleteCalculation, renameCalculation } = useSavedCalculations("indices-fisicos");

  // Estados para exportação
  const [exportPDFDialogOpen, setExportPDFDialogOpen] = useState(false);
  const [pdfFileName, setPdfFileName] = useState("");
  const [isExportingPDF, setIsExportingPDF] = useState(false);

  // Estados para exemplos e Gs
  const [examplesSheetOpen, setExamplesSheetOpen] = useState(false);
  const [gsSheetOpen, setGsSheetOpen] = useState(false);

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError(null);
  };

  const handleCalculate = async () => {
    // Validação dos campos obrigatórios
    if (!formData.massaUmida || !formData.massaSeca || !formData.volume || !formData.Gs) {
      setError("Preencha todos os campos obrigatórios: Massa Úmida, Massa Seca, Volume e Gs");
      toast({
        title: "Campos obrigatórios",
        description: "Preencha massa úmida, massa seca, volume e Gs",
        variant: "destructive",
      });
      return;
    }

    setIsCalculating(true);
    setError(null);
    setResults(null);

    const apiInput: { [key: string]: number | undefined } = {
      peso_total: formData.massaUmida ? parseFloat(formData.massaUmida) : undefined,
      peso_solido: formData.massaSeca ? parseFloat(formData.massaSeca) : undefined,
      volume_total: formData.volume ? parseFloat(formData.volume) : undefined,
      Gs: formData.Gs ? parseFloat(formData.Gs) : undefined,
      peso_especifico_agua: formData.pesoEspecificoAgua ? parseFloat(formData.pesoEspecificoAgua) : 10.0,
      indice_vazios_max: formData.indice_vazios_max ? parseFloat(formData.indice_vazios_max) : undefined,
      indice_vazios_min: formData.indice_vazios_min ? parseFloat(formData.indice_vazios_min) : undefined,
    };

    Object.keys(apiInput).forEach(key => (apiInput[key] === undefined || isNaN(apiInput[key] as number)) && delete apiInput[key]);

    // Validação emin < emax
    if (apiInput.indice_vazios_min !== undefined && apiInput.indice_vazios_max !== undefined && apiInput.indice_vazios_min >= apiInput.indice_vazios_max) {
      setError("Índice de vazios mínimo (emin) deve ser menor que o máximo (emax).");
      toast({
        title: "Erro de Entrada",
        description: "emin deve ser < emax",
        variant: "destructive",
      });
      setIsCalculating(false);
      return;
    }

    try {
      const response = await axios.post<IndicesFisicosOutput>(`${API_URL}/calcular/indices-fisicos`, apiInput);

      if (response.data.erro) {
        setError(response.data.erro);
        toast({
          title: "Erro no Cálculo",
          description: response.data.erro,
          variant: "destructive",
        });
      } else {
        setResults(response.data);
        toast({
          title: "✅ Sucesso!",
          description: "Índices calculados com sucesso",
        });
      }
    } catch (err) {
      let errorMessage = "Erro ao conectar ao servidor";
      if (axios.isAxiosError(err) && err.response?.data?.detail) {
        errorMessage = Array.isArray(err.response.data.detail)
          ? err.response.data.detail.map((d: any) => `${d.loc.join('.')}: ${d.msg}`).join("; ")
          : err.response.data.detail;
      }
      setError(errorMessage);
      toast({
        title: "❌ Erro",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsCalculating(false);
    }
  };

  const handleClear = () => {
    setFormData({
      massaUmida: "",
      massaSeca: "",
      volume: "",
      Gs: "",
      pesoEspecificoAgua: "10.0",
      indice_vazios_max: "",
      indice_vazios_min: "",
    });
    setResults(null);
    setError(null);
  };

  const handleLoadExample = (example: SoilExample) => {
    setFormData(example.data as FormData);
    setResults(null);
    setError(null);
    setExamplesSheetOpen(false);
    toast({
      title: `${example.icon} ${example.name}`,
      description: example.description,
    });
  };

  const handleSelectGs = (gsValue: number) => {
    setFormData(prev => ({ ...prev, Gs: gsValue.toString() }));
    setGsSheetOpen(false);
    toast({
      title: "Gs atualizado!",
      description: `Definido como ${gsValue}`,
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
    setPdfFileName(generateDefaultPDFFileName("Índices Físicos"));
    setExportPDFDialogOpen(true);
  };

  const handleConfirmExportPDF = async () => {
    if (!results) return;
    setIsExportingPDF(true);

    const inputs: { label: string; value: string }[] = [
      { label: "Massa Úmida", value: `${formData.massaUmida} g` },
      { label: "Massa Seca", value: `${formData.massaSeca} g` },
      { label: "Volume Total", value: `${formData.volume} cm³` },
    ];
    
    if (formData.Gs) inputs.push({ label: "Densidade dos Grãos (Gs)", value: formData.Gs });
    if (formData.indice_vazios_max) inputs.push({ label: "Índice Vazios Máx", value: formData.indice_vazios_max });
    if (formData.indice_vazios_min) inputs.push({ label: "Índice Vazios Mín", value: formData.indice_vazios_min });

    const resultsList: { label: string; value: string; highlight?: boolean }[] = [];
    if (results.peso_especifico_natural !== null) resultsList.push({ label: "Peso Específico Natural", value: `${formatNumberForExport(results.peso_especifico_natural)} kN/m³`, highlight: true });
    if (results.peso_especifico_seco !== null) resultsList.push({ label: "Peso Específico Seco", value: `${formatNumberForExport(results.peso_especifico_seco)} kN/m³` });
    if (results.peso_especifico_saturado !== null) resultsList.push({ label: "Peso Específico Saturado", value: `${formatNumberForExport(results.peso_especifico_saturado)} kN/m³` });
    if (results.peso_especifico_submerso !== null) resultsList.push({ label: "Peso Específico Submerso", value: `${formatNumberForExport(results.peso_especifico_submerso)} kN/m³` });
    if (results.Gs !== null) resultsList.push({ label: "Densidade dos Grãos (Gs)", value: formatNumberForExport(results.Gs, 3) });
    if (results.indice_vazios !== null) resultsList.push({ label: "Índice de Vazios", value: formatNumberForExport(results.indice_vazios, 3) });
    if (results.porosidade !== null) resultsList.push({ label: "Porosidade", value: `${formatNumberForExport(results.porosidade)}%` });
    if (results.grau_saturacao !== null) resultsList.push({ label: "Grau de Saturação", value: `${formatNumberForExport(results.grau_saturacao)}%` });
    if (results.umidade !== null) resultsList.push({ label: "Umidade", value: `${formatNumberForExport(results.umidade)}%` });
    if (results.compacidade_relativa !== null) resultsList.push({ label: "Compacidade Relativa", value: `${formatNumberForExport(results.compacidade_relativa)}%` });
    if (results.classificacao_compacidade) resultsList.push({ label: "Classificação", value: results.classificacao_compacidade });

    const exportData: ExportData = {
      moduleName: "indices-fisicos",
      moduleTitle: "Índices Físicos",
      inputs,
      results: resultsList,
      customFileName: pdfFileName,
      theme
    };

    const success = await exportToPDF(exportData);
    setIsExportingPDF(false);
    
    if (success) {
      toast({
        title: "📄 PDF exportado!",
        description: "Arquivo baixado com sucesso",
      });
      setExportPDFDialogOpen(false);
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

    const entradaData: { label: string; value: string | number }[] = [
      { label: "Massa Úmida (g)", value: formData.massaUmida },
      { label: "Massa Seca (g)", value: formData.massaSeca },
      { label: "Volume Total (cm³)", value: formData.volume },
    ];
    if (formData.Gs) entradaData.push({ label: "Gs", value: formData.Gs });
    if (formData.pesoEspecificoAgua) entradaData.push({ label: "Peso Específico da Água (kN/m³)", value: formData.pesoEspecificoAgua });
    if (formData.indice_vazios_max) entradaData.push({ label: "Índice de Vazios Máximo", value: formData.indice_vazios_max });
    if (formData.indice_vazios_min) entradaData.push({ label: "Índice de Vazios Mínimo", value: formData.indice_vazios_min });

    const resultadosData: { label: string; value: string | number }[] = [];
    if (results.peso_especifico_natural !== null) resultadosData.push({ label: "Peso Específico Natural (kN/m³)", value: results.peso_especifico_natural.toFixed(2) });
    if (results.peso_especifico_seco !== null) resultadosData.push({ label: "Peso Específico Seco (kN/m³)", value: results.peso_especifico_seco.toFixed(2) });
    if (results.peso_especifico_saturado !== null) resultadosData.push({ label: "Peso Específico Saturado (kN/m³)", value: results.peso_especifico_saturado.toFixed(2) });
    if (results.peso_especifico_submerso !== null) resultadosData.push({ label: "Peso Específico Submerso (kN/m³)", value: results.peso_especifico_submerso.toFixed(2) });
    if (results.peso_especifico_solidos !== null) resultadosData.push({ label: "Peso Específico dos Sólidos (kN/m³)", value: results.peso_especifico_solidos.toFixed(2) });
    if (results.Gs !== null) resultadosData.push({ label: "Gs", value: results.Gs.toFixed(3) });
    if (results.indice_vazios !== null) resultadosData.push({ label: "e", value: results.indice_vazios.toFixed(3) });
    if (results.porosidade !== null) resultadosData.push({ label: "n (%)", value: results.porosidade.toFixed(2) });
    if (results.grau_saturacao !== null) resultadosData.push({ label: "Sr (%)", value: results.grau_saturacao.toFixed(2) });
    if (results.umidade !== null) resultadosData.push({ label: "w (%)", value: results.umidade.toFixed(2) });
    if (results.compacidade_relativa !== null) resultadosData.push({ label: "Dr (%)", value: results.compacidade_relativa.toFixed(2) });
    if (results.classificacao_compacidade) resultadosData.push({ label: "Classificação", value: results.classificacao_compacidade });

    const excelData: ExcelExportData = {
      moduleName: "indices-fisicos",
      moduleTitle: "Índices Físicos",
      sheets: [
        { name: "Entrada", data: entradaData },
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
    formData.massaUmida && 
    formData.massaSeca && 
    formData.volume && 
    formData.Gs && 
    !isNaN(parseFloat(formData.Gs));

  return (
    <div className="space-y-4 pb-4">
      {/* Header com Ações */}
      <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-4 rounded-xl border border-primary/20">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 flex items-center justify-center">
              <Beaker className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">Índices Físicos</h2>
              <p className="text-xs text-muted-foreground">Propriedades físicas do solo</p>
            </div>
          </div>
          
          {/* Botões de Ação */}
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

      {/* Aviso */}
      {results && results.aviso && (
        <Alert className="bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900">
          <AlertCircle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800 dark:text-amber-200">
            {results.aviso}
          </AlertDescription>
        </Alert>
      )}

      {/* Dados Básicos */}
      <MobileSection
        title="Dados Básicos da Amostra"
        icon={<Info className="w-4 h-4" />}
        defaultOpen={true}
      >
        <MobileInputGroup
          label="Massa Úmida"
          value={formData.massaUmida}
          onChange={(v) => handleInputChange("massaUmida", v)}
          placeholder="Ex: 150.5"
          unit="g"
          required
          tooltip="Massa total da amostra incluindo água"
        />

        <MobileInputGroup
          label="Massa Seca"
          value={formData.massaSeca}
          onChange={(v) => handleInputChange("massaSeca", v)}
          placeholder="Ex: 130.2"
          unit="g"
          required
          tooltip="Massa após secagem em estufa"
        />

        <MobileInputGroup
          label="Volume Total"
          value={formData.volume}
          onChange={(v) => handleInputChange("volume", v)}
          placeholder="Ex: 100.0"
          unit="cm³"
          required
          tooltip="Volume total incluindo vazios"
        />

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium flex items-center gap-2 after:content-['*'] after:text-destructive after:ml-0.5">
              Densidade dos Grãos (Gs)
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="w-6 h-6 rounded-full bg-muted/50 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none [-webkit-tap-highlight-color:transparent] active:scale-95"
                >
                  <Info className="w-3.5 h-3.5" />
                </button>
              </PopoverTrigger>
              <PopoverContent side="left" className="max-w-xs" align="end">
                <p className="text-xs">Densidade dos grãos sólidos. Use sugestões ao lado</p>
              </PopoverContent>
            </Popover>
          </div>
          <div className="relative">
            <Input
              type="number"
              value={formData.Gs}
              onChange={(e) => handleInputChange("Gs", e.target.value)}
              placeholder="Ex: 2.65"
              className="h-12 text-base pr-12"
              inputMode="decimal"
            />
            <button
              type="button"
              onClick={() => setGsSheetOpen(true)}
              className="absolute right-1 top-1/2 -translate-y-1/2 w-10 h-10 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors focus-visible:outline-none [-webkit-tap-highlight-color:transparent] active:scale-95"
            >
              <Info className="h-4 w-4" />
            </button>
          </div>
        </div>
      </MobileSection>

      {/* Parâmetros Adicionais */}
      <MobileSection
        title="Parâmetros Adicionais"
        icon={<BarChart3 className="w-4 h-4" />}
        defaultOpen={false}
        collapsible
      >
        <div className="space-y-4">

          <div className="space-y-2">
            <Label className="text-sm font-medium">γw (Peso Específico da Água)</Label>
            <Select value={formData.pesoEspecificoAgua} onValueChange={(value) => handleInputChange("pesoEspecificoAgua", value)}>
              <SelectTrigger className="bg-background/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="9.81">9.81 kN/m³ (exato)</SelectItem>
                <SelectItem value="10.0">10.0 kN/m³ (aproximado)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <MobileInputGroup
            label="emax (Índice de Vazios Máximo)"
            value={formData.indice_vazios_max}
            onChange={(v) => handleInputChange("indice_vazios_max", v)}
            placeholder="Ex: 0.85"
            tooltip="Opcional. Para calcular Dr em solos granulares"
          />

          <MobileInputGroup
            label="emin (Índice de Vazios Mínimo)"
            value={formData.indice_vazios_min}
            onChange={(v) => handleInputChange("indice_vazios_min", v)}
            placeholder="Ex: 0.45"
            tooltip="Opcional. Para calcular Dr em solos granulares"
          />
        </div>
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
            <FileText className="w-4 w-4 mr-2" />
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
                  {/* Pesos Específicos */}
                  <div className="bg-card/50 backdrop-blur-sm rounded-xl border border-border/50 p-4 space-y-3">
                    <h3 className="font-semibold text-sm flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-primary" />
                      Pesos Específicos
                    </h3>
                    <ResultItem label="Natural (γn)" value={results.peso_especifico_natural} unit="kN/m³" infoKey="peso_especifico_natural" settings={settings} />
                    <ResultItem label="Seco (γd)" value={results.peso_especifico_seco} unit="kN/m³" infoKey="peso_especifico_seco" settings={settings} />
                    <ResultItem label="Saturado (γsat)" value={results.peso_especifico_saturado} unit="kN/m³" infoKey="peso_especifico_saturado" settings={settings} />
                    <ResultItem label="Submerso (γsub)" value={results.peso_especifico_submerso} unit="kN/m³" infoKey="peso_especifico_submerso" settings={settings} />
                    <ResultItem label="Sólidos (γs)" value={results.peso_especifico_solidos} unit="kN/m³" infoKey="peso_especifico_solidos" settings={settings} />
                  </div>

                  {/* Índices */}
                  <div className="bg-card/50 backdrop-blur-sm rounded-xl border border-border/50 p-4 space-y-3">
                    <h3 className="font-semibold text-sm flex items-center gap-2">
                      <Info className="w-4 h-4" />
                      Índices e Relações
                    </h3>
                    <ResultItem label="Densidade Gs" value={results.Gs} unit="" infoKey="Gs" settings={settings} />
                    <ResultItem label="Índice Vazios (e)" value={results.indice_vazios} unit="" infoKey="indice_vazios" settings={settings} />
                    <ResultItem label="Porosidade (n)" value={results.porosidade} unit="%" infoKey="porosidade" settings={settings} />
                    <ResultItem label="Saturação (Sr)" value={results.grau_saturacao} unit="%" infoKey="grau_saturacao" settings={settings} />
                    <ResultItem label="Umidade (w)" value={results.umidade} unit="%" infoKey="umidade" settings={settings} />
                  </div>

                  {/* Compacidade Relativa */}
                  {results.compacidade_relativa !== null && (
                    <div className="bg-card/50 backdrop-blur-sm rounded-xl border border-border/50 p-4 space-y-3">
                      <h3 className="font-semibold text-sm flex items-center gap-2">
                        <BarChart3 className="w-4 h-4 text-primary" />
                        Compacidade Relativa
                      </h3>
                      <ResultItem label="Dr" value={results.compacidade_relativa} unit="%" infoKey="compacidade_relativa" settings={settings} />
                      {results.classificacao_compacidade && (
                        <div className="flex items-center justify-between p-3 rounded-lg bg-primary/10 border border-primary/20">
                          <span className="text-sm font-medium">Classificação</span>
                          <span className="text-sm font-bold text-primary">{results.classificacao_compacidade}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ),
            },
            {
              id: "diagrama",
              label: "Diagrama",
              icon: <BarChart3 className="w-4 h-4" />,
              content: (
                <div className="bg-card/50 rounded-xl border border-border/50 p-4">
                  <h4 className="font-semibold mb-4 text-center">Diagrama de Fases</h4>
                  <div className="flex justify-center">
                    {results.volume_solidos_norm !== null && results.volume_agua_norm !== null && results.volume_ar_norm !== null ? (
                      <DiagramaFases
                        volumeSolidosNorm={results.volume_solidos_norm}
                        volumeAguaNorm={results.volume_agua_norm}
                        volumeArNorm={results.volume_ar_norm}
                        pesoSolidosNorm={results.peso_solidos_norm}
                        pesoAguaNorm={results.peso_agua_norm}
                        volumeSolidosCalc={results.volume_solidos_calc}
                        volumeAguaCalc={results.volume_agua_calc}
                        volumeArCalc={results.volume_ar_calc}
                        massaSolidosCalc={results.massa_solidos_calc}
                        massaAguaCalc={results.massa_agua_calc}
                        volumeTotalCalc={results.volume_total_calc}
                        massaTotalCalc={results.massa_total_calc}
                        className="w-full max-w-sm"
                      />
                    ) : (
                      <p className="text-muted-foreground text-center text-sm">
                        Dados insuficientes para gerar diagrama
                      </p>
                    )}
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
            <SheetTitle>Exemplos de Solos</SheetTitle>
          </SheetHeader>
          <div className="mt-6 space-y-3 overflow-y-auto max-h-[calc(70vh-100px)]">
            {soilExamples.map((example, idx) => (
              <button
                key={idx}
                onClick={() => handleLoadExample(example)}
                className="w-full p-4 rounded-xl bg-secondary/50 hover:bg-secondary border-2 border-transparent hover:border-primary/20 transition-all active:scale-95 text-left focus-visible:outline-none [-webkit-tap-highlight-color:transparent]"
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{example.icon}</span>
                  <div className="flex-1">
                    <h4 className="font-semibold text-foreground">{example.name}</h4>
                    <p className="text-sm text-muted-foreground mt-1">{example.description}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </SheetContent>
      </Sheet>

      {/* Sheet de Sugestões de Gs */}
      <Sheet open={gsSheetOpen} onOpenChange={setGsSheetOpen}>
        <SheetContent side="bottom" className="h-[50vh] rounded-t-2xl">
          <SheetHeader>
            <SheetTitle>Sugestões de Gs por Tipo de Solo</SheetTitle>
          </SheetHeader>
          <div className="mt-6 space-y-3">
            {gsSuggestions.map((item, idx) => (
              <button
                key={idx}
                onClick={() => handleSelectGs(item.value)}
                className="w-full p-4 rounded-xl bg-secondary/50 hover:bg-secondary border-2 border-transparent hover:border-primary/20 transition-all active:scale-95 flex items-center justify-between focus-visible:outline-none [-webkit-tap-highlight-color:transparent]"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{item.icon}</span>
                  <span className="font-medium">{item.type}</span>
                </div>
                <span className="text-lg font-bold text-primary">{item.value}</span>
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
              placeholder="Ex: Análise Solo - Obra X"
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
    </div>
  );
}

// Componente de Item de Resultado
interface ResultItemProps {
  label: string;
  value: number | string | null;
  unit: string;
  infoKey: keyof typeof conteudoIndicesFisicos;
  settings: any;
}

function ResultItem({ label, value, unit, infoKey, settings }: ResultItemProps) {
  const content = conteudoIndicesFisicos[infoKey];
  const displayValue = typeof value === 'number' ? formatNumber(value, settings) : value ?? "—";

  if (value === null && typeof value !== 'string') return null;

  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-background/50 border border-border/50">
      <div className="flex items-center gap-1.5">
        <span className="text-sm font-medium text-muted-foreground">{label}</span>
        {settings.showEducationalTips && content && (
          <Popover>
            <PopoverTrigger asChild>
              <button className="h-5 w-5 rounded-full hover:bg-muted flex items-center justify-center focus-visible:outline-none [-webkit-tap-highlight-color:transparent]">
                <Info className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-80" side="top">
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">{label}</h4>
                {settings.showFormulas && content?.formula && (
                  <div className="text-xs font-mono bg-muted p-2 rounded border">{content.formula}</div>
                )}
                <p className="text-xs text-muted-foreground">{content?.descricao}</p>
                {content?.valoresTipicos && (
                  <p className="text-xs text-muted-foreground italic">
                    <strong>Típicos:</strong> {content.valoresTipicos}
                  </p>
                )}
              </div>
            </PopoverContent>
          </Popover>
        )}
      </div>
      <span className="text-sm font-bold text-primary">{displayValue} {unit}</span>
    </div>
  );
}
