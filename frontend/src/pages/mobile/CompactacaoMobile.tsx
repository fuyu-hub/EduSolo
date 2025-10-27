import { useState, useRef } from "react";
import { calcularCompactacao } from "@/lib/calculations/compactacao";
import { Database, Calculator, Plus, Trash2, Info, Save, FolderOpen, Download, FileText, AlertCircle, ChevronLeft, ChevronRight, Lightbulb } from "lucide-react";
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
import { useSavedCalculations } from "@/hooks/use-saved-calculations";
import { exportToPDF, exportToExcel, ExportData, ExcelExportData, formatNumberForExport, generateDefaultPDFFileName } from "@/lib/export-utils";
import ExportPDFDialog from "@/components/ExportPDFDialog";
import { cn } from "@/lib/utils";
import CurvaCompactacao, { CurvaCompactacaoRef } from "@/components/compactacao/CurvaCompactacao";
import { exemplosCompactacao, ExemploCompactacao } from "@/lib/exemplos-compactacao";

interface PontoEnsaio {
  id: string;
  pesoAmostaCilindro: string;
  pesoBrutoUmido: string;
  pesoBrutoSeco: string;
  tara: string;
}

interface FormData {
  volumeCilindro: string;
  pesoCilindro: string;
  Gs: string;
  pesoEspecificoAgua: string;
  pontos: PontoEnsaio[];
}

interface PontoEnsaioAPI {
  massa_umida_total: number;
  massa_molde: number;
  volume_molde: number;
  massa_umida_recipiente_w: number;
  massa_seca_recipiente_w: number;
  massa_recipiente_w: number;
}

interface CompactacaoInputAPI {
  pontos_ensaio: PontoEnsaioAPI[];
  Gs?: number;
  peso_especifico_agua: number;
}

interface PontoCurva {
  umidade: number;
  peso_especifico_seco: number;
}

interface Results {
  umidade_otima: number | null;
  peso_especifico_seco_max: number | null;
  pontos_curva_compactacao: PontoCurva[] | null;
  pontos_curva_saturacao_100: PontoCurva[] | null;
  erro?: string | null;
}

// Cálculos agora são feitos localmente no frontend

const generateId = () => `${Date.now()}-${Math.floor(Math.random() * 1000000)}`;

export default function CompactacaoMobile() {
  const { toast } = useToast();
  
  const [formData, setFormData] = useState<FormData>({
    volumeCilindro: "982",
    pesoCilindro: "4100",
    Gs: "",
    pesoEspecificoAgua: "10.0",
    pontos: [
      { id: generateId(), pesoAmostaCilindro: "", pesoBrutoUmido: "", pesoBrutoSeco: "", tara: "" },
      { id: generateId(), pesoAmostaCilindro: "", pesoBrutoUmido: "", pesoBrutoSeco: "", tara: "" },
      { id: generateId(), pesoAmostaCilindro: "", pesoBrutoUmido: "", pesoBrutoSeco: "", tara: "" },
    ],
  });
  
  const [results, setResults] = useState<Results | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Estados para navegação de pontos
  const [currentPointIndex, setCurrentPointIndex] = useState(0);
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();

  // Estados para salvamento
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [saveName, setSaveName] = useState("");
  const [loadSheetOpen, setLoadSheetOpen] = useState(false);
  const { calculations, saveCalculation, deleteCalculation } = useSavedCalculations("compactacao");

  // Estados para exportação
  const [exportPDFDialogOpen, setExportPDFDialogOpen] = useState(false);
  const [pdfFileName, setPdfFileName] = useState("");
  const [isExportingPDF, setIsExportingPDF] = useState(false);

  // Estados para exemplos
  const [examplesSheetOpen, setExamplesSheetOpen] = useState(false);

  // Ref para o gráfico
  const curvaCompactacaoRef = useRef<CurvaCompactacaoRef>(null);

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData({ ...formData, [field]: value });
    setError(null);
  };

  const handleInputChangePonto = (index: number, field: keyof PontoEnsaio, value: string) => {
    const newPontos = [...formData.pontos];
    newPontos[index] = { ...newPontos[index], [field]: value };
    setFormData({ ...formData, pontos: newPontos });
    setError(null);
  };

  const addPonto = () => {
    setFormData({
      ...formData,
      pontos: [...formData.pontos, { id: generateId(), pesoAmostaCilindro: "", pesoBrutoUmido: "", pesoBrutoSeco: "", tara: "" }],
    });
    setCurrentPointIndex(formData.pontos.length);
  };

  const removePonto = () => {
    if (formData.pontos.length <= 3) {
      toast({
        title: "Mínimo de pontos",
        description: "São necessários pelo menos 3 pontos",
        variant: "destructive",
      });
      return;
    }
    const newPontos = formData.pontos.filter((_, i) => i !== currentPointIndex);
    setFormData({ ...formData, pontos: newPontos });
    if (currentPointIndex >= newPontos.length) {
      setCurrentPointIndex(Math.max(0, newPontos.length - 1));
    }
  };

  const goToNextPoint = () => {
    if (currentPointIndex < formData.pontos.length - 1) {
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

  const handleCalculate = async () => {
    // Validação básica
    if (!formData.volumeCilindro || !formData.pesoCilindro) {
      setError("Preencha volume e peso do cilindro");
      toast({
        title: "Dados incompletos",
        description: "Preencha os parâmetros gerais",
        variant: "destructive",
      });
      return;
    }

    const pontosValidos = formData.pontos.filter(p => 
      p.pesoAmostaCilindro && 
      p.pesoBrutoUmido && 
      p.pesoBrutoSeco && 
      p.tara &&
      !isNaN(parseFloat(p.pesoAmostaCilindro)) &&
      !isNaN(parseFloat(p.pesoBrutoUmido)) &&
      !isNaN(parseFloat(p.pesoBrutoSeco)) &&
      !isNaN(parseFloat(p.tara))
    );

    if (pontosValidos.length < 3) {
      setError("São necessários pelo menos 3 pontos completos");
      toast({
        title: "Dados incompletos",
        description: "Preencha pelo menos 3 pontos",
        variant: "destructive",
      });
      return;
    }

    setIsCalculating(true);
    setError(null);

    try {
      const volumeCil = parseFloat(formData.volumeCilindro);
      const pesoCil = parseFloat(formData.pesoCilindro);

      const apiInput: CompactacaoInputAPI = {
        pontos_ensaio: pontosValidos.map(p => ({
          massa_umida_total: parseFloat(p.pesoAmostaCilindro),
          massa_molde: pesoCil,
          volume_molde: volumeCil,
          massa_umida_recipiente_w: parseFloat(p.pesoBrutoUmido),
          massa_seca_recipiente_w: parseFloat(p.pesoBrutoSeco),
          massa_recipiente_w: parseFloat(p.tara),
        })),
        Gs: (formData.Gs && formData.Gs !== "") ? parseFloat(formData.Gs) : undefined,
        peso_especifico_agua: parseFloat(formData.pesoEspecificoAgua),
      };

      if (apiInput.Gs === undefined) delete apiInput.Gs;

      // Calcula localmente no frontend
      const resultado = calcularCompactacao(apiInput);
      
      if (resultado.erro) {
        setError(resultado.erro);
        toast({
          title: "❌ Erro no cálculo",
          description: resultado.erro,
          variant: "destructive",
        });
      } else {
        setResults(resultado);
        toast({
          title: "✅ Sucesso!",
          description: "Ensaio calculado com sucesso",
        });
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.detail || err.response?.data?.message || "Erro ao calcular";
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
      volumeCilindro: "982",
      pesoCilindro: "4100",
      Gs: "",
      pesoEspecificoAgua: "10.0",
      pontos: [
        { id: generateId(), pesoAmostaCilindro: "", pesoBrutoUmido: "", pesoBrutoSeco: "", tara: "" },
        { id: generateId(), pesoAmostaCilindro: "", pesoBrutoUmido: "", pesoBrutoSeco: "", tara: "" },
        { id: generateId(), pesoAmostaCilindro: "", pesoBrutoUmido: "", pesoBrutoSeco: "", tara: "" },
      ],
    });
    setResults(null);
    setError(null);
    setCurrentPointIndex(0);
  };

  const handleLoadExample = (example: ExemploCompactacao) => {
    setFormData({
      volumeCilindro: example.volumeCilindro,
      pesoCilindro: example.pesoCilindro,
      Gs: example.Gs || "",
      pesoEspecificoAgua: "10.0",
      pontos: example.pontos.map(p => ({
        id: generateId(),
        pesoAmostaCilindro: p.pesoAmostaCilindro,
        pesoBrutoUmido: p.pesoBrutoUmido,
        pesoBrutoSeco: p.pesoBrutoSeco,
        tara: p.tara,
      })),
    });
    setResults(null);
    setError(null);
    setCurrentPointIndex(0);
    setExamplesSheetOpen(false);
    toast({
      title: `${example.icon} ${example.nome}`,
      description: example.descricao,
    });
  };

  // Salvamento
  const handleSaveClick = () => {
    if (!results) return;
    setSaveName(`Ensaio ${new Date().toLocaleDateString('pt-BR')}`);
    setSaveDialogOpen(true);
  };

  const handleConfirmSave = () => {
    if (!results || !saveName.trim()) return;
    
    const success = saveCalculation(saveName.trim(), formData, results);
    if (success) {
      toast({
        title: "💾 Salvo!",
        description: "Ensaio salvo com sucesso",
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
    setPdfFileName(generateDefaultPDFFileName("Compactação"));
    setExportPDFDialogOpen(true);
  };

  const handleConfirmExportPDF = async () => {
    if (!results) return;
    setIsExportingPDF(true);

    // Capturar imagem do gráfico
    const chartImage = curvaCompactacaoRef.current 
      ? await curvaCompactacaoRef.current.getImageForExport()
      : null;

    const inputs: { label: string; value: string }[] = [
      { label: "Volume do Cilindro", value: `${formData.volumeCilindro} cm³` },
      { label: "Peso do Cilindro", value: `${formData.pesoCilindro} g` },
    ];
    if (formData.Gs) inputs.push({ label: "Gs", value: formData.Gs });

    const resultsList: { label: string; value: string; highlight?: boolean }[] = [];
    if (results.umidade_otima !== null) resultsList.push({ label: "Umidade Ótima", value: `${formatNumberForExport(results.umidade_otima, 2)}%`, highlight: true });
    if (results.peso_especifico_seco_max !== null) resultsList.push({ label: "γd,máx", value: `${formatNumberForExport(results.peso_especifico_seco_max / 10, 3)} g/cm³`, highlight: true });

    const tables = [];
    const ensaioHeaders = ["Ponto", "Peso Amostra+Cil (g)", "Peso Bruto Úmido (g)", "Peso Bruto Seco (g)", "Tara (g)"];
    const ensaioRows = formData.pontos.map((p, i) => [
      `${i + 1}`,
      p.pesoAmostaCilindro,
      p.pesoBrutoUmido,
      p.pesoBrutoSeco,
      p.tara
    ]);

    tables.push({
      title: "Dados do Ensaio",
      headers: ensaioHeaders,
      rows: ensaioRows
    });

    const exportData: ExportData = {
      moduleName: "compactacao",
      moduleTitle: "Ensaio de Compactação",
      inputs,
      results: resultsList,
      tables,
      chartImage: chartImage || undefined,
      customFileName: pdfFileName
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

    const configData: { label: string; value: string | number }[] = [
      { label: "Volume do Cilindro (cm³)", value: formData.volumeCilindro },
      { label: "Peso do Cilindro (g)", value: formData.pesoCilindro },
    ];
    if (formData.Gs) configData.push({ label: "Gs", value: formData.Gs });

    const resultadosData: { label: string; value: string | number }[] = [];
    if (results.umidade_otima !== null) resultadosData.push({ label: "Umidade Ótima (%)", value: results.umidade_otima.toFixed(2) });
    if (results.peso_especifico_seco_max !== null) resultadosData.push({ label: "γd,máx (g/cm³)", value: (results.peso_especifico_seco_max / 10).toFixed(3) });

    const excelData: ExcelExportData = {
      moduleName: "compactacao",
      moduleTitle: "Compactação",
      sheets: [
        { name: "Configuração", data: configData },
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

  const isFormValid = 
    formData.volumeCilindro &&
    formData.pesoCilindro &&
    formData.pontos.filter(p => p.pesoAmostaCilindro && p.pesoBrutoUmido && p.pesoBrutoSeco && p.tara).length >= 3;

  // Encontrar índice do ponto com γd máximo
  const indiceMaximo = results?.pontos_curva_compactacao?.reduce((maxIdx, ponto, idx, arr) => {
    return ponto.peso_especifico_seco > (arr[maxIdx]?.peso_especifico_seco || 0) ? idx : maxIdx;
  }, 0);

  return (
    <div className="space-y-4 pb-4">
      {/* Header com Ações */}
      <div className="bg-gradient-to-r from-violet-500/10 via-fuchsia-500/5 to-transparent p-4 rounded-xl border border-violet-500/20">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 via-fuchsia-500 to-pink-600 flex items-center justify-center shadow-md">
              <Database className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">Compactação</h2>
              <p className="text-xs text-muted-foreground">Ensaio Proctor</p>
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

      {/* Parâmetros Gerais */}
      <MobileSection
        title="Parâmetros Gerais"
        icon={<Info className="w-4 h-4" />}
        defaultOpen={true}
      >
        <MobileInputGroup
          label="Volume do Cilindro"
          value={formData.volumeCilindro}
          onChange={(v) => handleInputChange("volumeCilindro", v)}
          placeholder="Ex: 982"
          unit="cm³"
          required
          tooltip="Volume interno do cilindro de compactação"
        />

        <MobileInputGroup
          label="Peso do Cilindro"
          value={formData.pesoCilindro}
          onChange={(v) => handleInputChange("pesoCilindro", v)}
          placeholder="Ex: 4100"
          unit="g"
          required
          tooltip="Peso do cilindro vazio"
        />

        <MobileInputGroup
          label="Densidade dos Grãos (Gs)"
          value={formData.Gs}
          onChange={(v) => handleInputChange("Gs", v)}
          placeholder="Ex: 2.65"
          tooltip="Opcional. Necessário para curva S=100%"
        />
      </MobileSection>

      {/* Pontos do Ensaio */}
      <MobileSection
        title="Pontos do Ensaio"
        icon={<Database className="w-4 h-4" />}
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
              <span className="text-sm font-semibold">Ponto {currentPointIndex + 1} de {formData.pontos.length}</span>
              <div className="flex gap-1 mt-1 justify-center">
                {formData.pontos.map((_, idx) => (
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
              disabled={currentPointIndex === formData.pontos.length - 1}
              className="h-9 w-9 p-0"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Carousel de Pontos */}
          <Carousel setApi={setCarouselApi} className="w-full">
            <CarouselContent>
              {formData.pontos.map((ponto, index) => (
                <CarouselItem key={ponto.id}>
                  <div className="p-3 rounded-lg bg-card/50 backdrop-blur-sm border border-border/50 space-y-3">
                    <MobileInputGroup
                      label="Peso Amostra + Cilindro"
                      value={ponto.pesoAmostaCilindro}
                      onChange={(v) => handleInputChangePonto(index, "pesoAmostaCilindro", v)}
                      placeholder="Ex: 6012.5"
                      unit="g"
                      required
                      tooltip="Peso da amostra compactada + cilindro"
                    />

                    <MobileInputGroup
                      label="Peso Bruto Úmido"
                      value={ponto.pesoBrutoUmido}
                      onChange={(v) => handleInputChangePonto(index, "pesoBrutoUmido", v)}
                      placeholder="Ex: 106.56"
                      unit="g"
                      required
                      tooltip="Peso do recipiente + solo úmido"
                    />

                    <MobileInputGroup
                      label="Peso Bruto Seco"
                      value={ponto.pesoBrutoSeco}
                      onChange={(v) => handleInputChangePonto(index, "pesoBrutoSeco", v)}
                      placeholder="Ex: 93.69"
                      unit="g"
                      required
                      tooltip="Peso do recipiente + solo seco"
                    />

                    <MobileInputGroup
                      label="Tara (Peso do Recipiente)"
                      value={ponto.tara}
                      onChange={(v) => handleInputChangePonto(index, "tara", v)}
                      placeholder="Ex: 24.72"
                      unit="g"
                      required
                      tooltip="Peso do recipiente vazio"
                    />
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>

          {/* Botões de Ação dos Pontos */}
          <div className="flex gap-2">
            <Button
              onClick={addPonto}
              variant="outline"
              className="flex-1 h-10 focus-visible:ring-0 focus-visible:ring-offset-0 [-webkit-tap-highlight-color:transparent] active:scale-95 transition-transform"
            >
              <Plus className="w-4 h-4 mr-2" />
              Adicionar
            </Button>
            {formData.pontos.length > 3 && (
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
      {results && !results.erro && results.pontos_curva_compactacao && (
        <MobileTabs
          tabs={[
            {
              id: "resultados",
              label: "Resultados",
              icon: <Info className="w-4 h-4" />,
              content: (
                <div className="space-y-3">
                  {/* Parâmetros Ótimos */}
                  <div className="grid grid-cols-2 gap-3">
                    {results.umidade_otima !== null && (
                      <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                        <p className="text-xs text-muted-foreground mb-1">Umidade Ótima</p>
                        <p className="text-xl font-bold text-primary">{results.umidade_otima.toFixed(2)}%</p>
                      </div>
                    )}
                    {results.peso_especifico_seco_max !== null && (
                      <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                        <p className="text-xs text-muted-foreground mb-1">γd,máx</p>
                        <p className="text-xl font-bold text-primary">{(results.peso_especifico_seco_max / 10).toFixed(3)}</p>
                        <p className="text-xs text-muted-foreground">g/cm³</p>
                      </div>
                    )}
                  </div>

                  {/* Tabela de Pontos */}
                  <div className="bg-card/50 backdrop-blur-sm rounded-xl border border-border/50 p-4">
                    <h3 className="font-semibold text-sm mb-3">Dados dos Pontos</h3>
                    <div className="space-y-2 overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left p-2">Ponto</th>
                            <th className="text-right p-2">w (%)</th>
                            <th className="text-right p-2">γd (g/cm³)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {results.pontos_curva_compactacao.map((ponto, idx) => (
                            <tr key={idx} className={cn("border-b", idx === indiceMaximo && "bg-green-100 dark:bg-green-900/20")}>
                              <td className="p-2">{idx + 1}</td>
                              <td className="text-right p-2">{ponto.umidade.toFixed(2)}</td>
                              <td className="text-right p-2">{(ponto.peso_especifico_seco / 10).toFixed(3)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              ),
            },
            {
              id: "curva",
              label: "Curva",
              icon: <Database className="w-4 h-4" />,
              content: (
                <div className="bg-card/50 rounded-xl border border-border/50 p-4">
                  <h4 className="font-semibold mb-4 text-center">Curva de Compactação</h4>
                  <CurvaCompactacao
                    ref={curvaCompactacaoRef}
                    pontosEnsaio={results.pontos_curva_compactacao}
                    umidadeOtima={results.umidade_otima ?? undefined}
                    gamaSecoMax={results.peso_especifico_seco_max ?? undefined}
                    pontosSaturacao={results.pontos_curva_saturacao_100 ?? undefined}
                  />
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
            {exemplosCompactacao.map((example) => (
              <button
                key={example.icon + example.nome}
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
            <SheetTitle>Ensaios Salvos</SheetTitle>
          </SheetHeader>
          <div className="mt-6 space-y-3 overflow-y-auto max-h-[calc(70vh-100px)]">
            {calculations.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <FolderOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Nenhum ensaio salvo ainda</p>
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
                        toast({ title: "🗑️ Excluído", description: "Ensaio removido" });
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
            <DialogTitle>Salvar Ensaio</DialogTitle>
            <DialogDescription>
              Dê um nome para este ensaio
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
              placeholder="Ex: Ensaio Compactação - Solo X"
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

