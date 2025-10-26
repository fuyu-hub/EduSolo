import { useState, useEffect, useRef } from "react";
import { Layers, Plus, Trash2, Calculator, Settings, FileText, BarChart3, Save, Download, FolderOpen, Lightbulb, AlertCircle, ChevronLeft, ChevronRight, Droplet, Mountain, FileSpreadsheet } from "lucide-react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/components/ui/use-toast";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
  MobileResultCard,
} from "@/components/mobile";
import { formatNumber } from "@/lib/format-number";
import { useSettings } from "@/hooks/use-settings";
import { useSavedCalculations } from "@/hooks/use-saved-calculations";
import { exportToPDF, exportToExcel, ExportData, ExcelExportData, formatNumberForExport, captureChartAsImage, generateDefaultPDFFileName } from "@/lib/export-utils";
import ExportPDFDialog from "@/components/ExportPDFDialog";
import { cn } from "@/lib/utils";
import PerfilTensoes from "@/components/tensoes/PerfilTensoes";
import { exemplosTensoes, ExemploTensoes } from "@/lib/exemplos-tensoes";

interface CamadaData {
  id: string;
  nome: string;
  espessura: string;
  gamaNat: string;
  gamaSat: string;
  Ko: string;
  profundidadeNA: string;
  capilaridade: string;
  impermeavel: boolean;
}

interface FormData {
  profundidadeNA: string;
  alturaCapilar: string;
  pesoEspecificoAgua: string;
  camadas: CamadaData[];
}

interface TensaoPonto {
  profundidade: number;
  tensao_total_vertical?: number | null;
  pressao_neutra?: number | null;
  tensao_efetiva_vertical?: number | null;
  tensao_efetiva_horizontal?: number | null;
}

interface Results {
  pontos_calculo: TensaoPonto[];
  erro?: string | null;
}

interface CamadaSoloAPI {
  espessura: number;
  gama_nat?: number | null;
  gama_sat?: number | null;
  Ko: number;
  impermeavel?: boolean;
  profundidade_na_camada?: number | null;
  altura_capilar_camada?: number | null;
}

interface TensoesGeostaticasInputAPI {
  camadas: CamadaSoloAPI[];
  profundidade_na: number;
  altura_capilar: number;
  peso_especifico_agua: number;
}

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

export default function TensoesGeostaticasMobile() {
  const { settings } = useSettings();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState<FormData>({
    profundidadeNA: "",
    alturaCapilar: "0.0",
    pesoEspecificoAgua: "10.0",
    camadas: [
      {
        id: generateId(),
        nome: "Camada 1",
        espessura: "5.0",
        gamaNat: "18.0",
        gamaSat: "20.0",
        Ko: "0.5",
        profundidadeNA: "",
        capilaridade: "",
        impermeavel: false,
      },
    ],
  });
  
  const [results, setResults] = useState<Results | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Estados para navegação de camadas
  const [currentCamadaIndex, setCurrentCamadaIndex] = useState(0);
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();

  // Estados para sheets
  const [configSheetOpen, setConfigSheetOpen] = useState(false);
  const [examplesSheetOpen, setExamplesSheetOpen] = useState(false);
  const [loadSheetOpen, setLoadSheetOpen] = useState(false);

  // Estados para salvamento
  const [saveName, setSaveName] = useState("");
  const { calculations, saveCalculation, deleteCalculation } = useSavedCalculations("tensoes-geostaticas");

  // Estados para exportação
  const [exportPDFDialogOpen, setExportPDFDialogOpen] = useState(false);
  const [pdfFileName, setPdfFileName] = useState("");
  const [isExportingPDF, setIsExportingPDF] = useState(false);

  // Ref para captura de gráfico
  const chartRef = useRef<any>(null);

  // Sincronizar carousel com índice atual
  useEffect(() => {
    if (!carouselApi) return;
    
    carouselApi.on("select", () => {
      setCurrentCamadaIndex(carouselApi.selectedScrollSnap());
    });
  }, [carouselApi]);

  const handleInputChangeCamada = (index: number, field: keyof CamadaData, value: string | boolean) => {
    const newCamadas = [...formData.camadas];
    newCamadas[index] = { ...newCamadas[index], [field]: value };
    setFormData({ ...formData, camadas: newCamadas });
    setError(null);
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData({ ...formData, [field]: value });
    setError(null);
  };

  const handleAddCamada = () => {
    const newCamada: CamadaData = {
      id: generateId(),
      nome: `Camada ${formData.camadas.length + 1}`,
      espessura: "5.0",
      gamaNat: "18.0",
      gamaSat: "20.0",
      Ko: "0.5",
      profundidadeNA: "",
      capilaridade: "",
      impermeavel: false,
    };
    
    setFormData({
      ...formData,
      camadas: [...formData.camadas, newCamada],
    });
    
    // Navegar para a nova camada
    setTimeout(() => {
      if (carouselApi) {
        carouselApi.scrollTo(formData.camadas.length);
      }
      setCurrentCamadaIndex(formData.camadas.length);
    }, 100);
  };

  const handleRemoveCamada = (index: number) => {
    if (formData.camadas.length <= 1) {
      toast({
        title: "Atenção",
        description: "É necessária pelo menos uma camada",
        variant: "destructive",
      });
      return;
    }
    
    const newCamadas = formData.camadas.filter((_, i) => i !== index);
    setFormData({ ...formData, camadas: newCamadas });
    
    if (currentCamadaIndex >= newCamadas.length) {
      setCurrentCamadaIndex(Math.max(0, newCamadas.length - 1));
    }
  };

  const goToPreviousCamada = () => {
    if (carouselApi && currentCamadaIndex > 0) {
      carouselApi.scrollTo(currentCamadaIndex - 1);
    }
  };

  const goToNextCamada = () => {
    if (carouselApi && currentCamadaIndex < formData.camadas.length - 1) {
      carouselApi.scrollTo(currentCamadaIndex + 1);
    }
  };

  const validateForm = (): string | null => {
    if (!formData.pesoEspecificoAgua || parseFloat(formData.pesoEspecificoAgua) <= 0) {
      return "Peso específico da água deve ser maior que 0";
    }

    if (formData.alturaCapilar && parseFloat(formData.alturaCapilar) < 0) {
      return "Altura capilar não pode ser negativa";
    }

    if (formData.profundidadeNA && parseFloat(formData.profundidadeNA) < 0) {
      return "Profundidade do NA não pode ser negativa";
    }

    for (let i = 0; i < formData.camadas.length; i++) {
      const camada = formData.camadas[i];
      
      if (!camada.nome.trim()) {
        return `Camada ${i + 1}: Nome é obrigatório`;
      }
      
      if (!camada.espessura || parseFloat(camada.espessura) <= 0) {
        return `Camada ${i + 1}: Espessura deve ser maior que 0`;
      }
      
      if (camada.Ko && (parseFloat(camada.Ko) < 0 || parseFloat(camada.Ko) > 1)) {
        return `Camada ${i + 1}: Ko deve estar entre 0 e 1`;
      }
    }

    return null;
  };

  const handleCalculate = async () => {
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      toast({
        title: "Erro de Validação",
        description: validationError,
        variant: "destructive",
      });
      return;
    }

    setIsCalculating(true);
    setError(null);

    try {
      const camadas: CamadaSoloAPI[] = formData.camadas.map(c => {
        const profNA = c.profundidadeNA && c.profundidadeNA.trim() !== "" ? parseFloat(c.profundidadeNA) : null;
        const altCapilar = c.capilaridade && c.capilaridade.trim() !== "" ? parseFloat(c.capilaridade) : null;
        const gamaNat = c.gamaNat && c.gamaNat.trim() !== "" ? parseFloat(c.gamaNat) : null;
        const gamaSat = c.gamaSat && c.gamaSat.trim() !== "" ? parseFloat(c.gamaSat) : null;
        const Ko = c.Ko && c.Ko.trim() !== "" ? parseFloat(c.Ko) : 0.5;

        return {
          espessura: parseFloat(c.espessura),
          gama_nat: gamaNat,
          gama_sat: gamaSat,
          Ko,
          impermeavel: c.impermeavel || false,
          profundidade_na_camada: profNA,
          altura_capilar_camada: altCapilar,
        };
      });

      const globalNA = formData.profundidadeNA && formData.profundidadeNA.trim() !== "" 
        ? parseFloat(formData.profundidadeNA) 
        : 0;
      const alturaCapilarGlobal = parseFloat(formData.alturaCapilar);

      const apiInput: TensoesGeostaticasInputAPI = {
        camadas,
        profundidade_na: globalNA,
        altura_capilar: alturaCapilarGlobal,
        peso_especifico_agua: parseFloat(formData.pesoEspecificoAgua),
      };

      const response = await axios.post(`${API_URL}/api/tensoes-geostaticas`, apiInput);

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
          description: "Tensões calculadas com sucesso",
        });
      }
    } catch (err: any) {
      console.error("Erro ao calcular tensões:", err);
      const errorMsg = err.response?.data?.detail || err.message || "Erro desconhecido ao calcular tensões";
      setError(errorMsg);
      toast({
        title: "Erro no Cálculo",
        description: errorMsg,
        variant: "destructive",
      });
    } finally {
      setIsCalculating(false);
    }
  };

  const handleSave = () => {
    if (!saveName.trim()) {
      toast({
        title: "Atenção",
        description: "Digite um nome para o cálculo",
        variant: "destructive",
      });
      return;
    }

    const calculationData = {
      name: saveName,
      data: formData,
      results: results,
      timestamp: new Date().toISOString(),
    };

    saveCalculation(calculationData);
    toast({
      title: "💾 Salvo!",
      description: `Cálculo "${saveName}" salvo com sucesso`,
    });
    setSaveName("");
    setLoadSheetOpen(false);
  };

  const handleLoad = (calculation: any) => {
    setFormData(calculation.data);
    setResults(calculation.results);
    setCurrentCamadaIndex(0);
    setLoadSheetOpen(false);
    toast({
      title: "📂 Carregado!",
      description: `Cálculo "${calculation.name}" carregado`,
    });
  };

  const handleLoadExample = (example: ExemploTensoes) => {
    const camadas: CamadaData[] = example.camadas.map((c, idx) => ({
      id: generateId(),
      nome: c.nome || `Camada ${idx + 1}`,
      espessura: c.espessura,
      gamaNat: c.gamaNat || "",
      gamaSat: c.gamaSat || "",
      Ko: c.Ko || "0.5",
      profundidadeNA: c.profundidadeNA || "",
      capilaridade: c.capilaridade || "",
      impermeavel: c.impermeavel || false,
    }));

    setFormData({
      profundidadeNA: example.profundidadeNA || "",
      alturaCapilar: example.alturaCapilar || "0.0",
      pesoEspecificoAgua: example.pesoEspecificoAgua || "10.0",
      camadas: camadas,
    });

    setCurrentCamadaIndex(0);
    setResults(null);
    setExamplesSheetOpen(false);
    
    toast({
      title: "💡 Exemplo Carregado!",
      description: example.nome,
    });
  };

  const handleConfirmExportPDF = async () => {
    if (!results || !results.pontos_calculo || results.pontos_calculo.length === 0) {
      toast({
        title: "Atenção",
        description: "Não há resultados para exportar",
        variant: "destructive",
      });
      return;
    }

    setIsExportingPDF(true);

    try {
      // Capturar gráfico
      let perfilImage: string | undefined;
      if (chartRef.current) {
        perfilImage = await captureChartAsImage(chartRef.current);
      }

      // Preparar dados de entrada
      const inputs = [
        { label: "Nível d'Água (m)", value: formData.profundidadeNA || "Não definido" },
        { label: "Altura Capilar (m)", value: formData.alturaCapilar },
        { label: "γ_água (kN/m³)", value: formData.pesoEspecificoAgua },
        { label: "Número de Camadas", value: formData.camadas.length.toString() },
      ];

      // Adicionar informações das camadas
      formData.camadas.forEach((camada, idx) => {
        inputs.push({ label: `\n--- ${camada.nome} ---`, value: "" });
        inputs.push({ label: "Espessura (m)", value: camada.espessura });
        if (camada.gamaNat) inputs.push({ label: "γ_nat (kN/m³)", value: camada.gamaNat });
        if (camada.gamaSat) inputs.push({ label: "γ_sat (kN/m³)", value: camada.gamaSat });
        if (camada.Ko) inputs.push({ label: "Ko", value: camada.Ko });
      });

      // Preparar resultados
      const resultItems = results.pontos_calculo.map(ponto => ({
        label: `Prof. ${formatNumberForExport(ponto.profundidade)} m`,
        value: `σ_v: ${formatNumberForExport(ponto.tensao_total_vertical)} | u: ${formatNumberForExport(ponto.pressao_neutra)} | σ'_v: ${formatNumberForExport(ponto.tensao_efetiva_vertical)} | σ'_h: ${formatNumberForExport(ponto.tensao_efetiva_horizontal)} kPa`,
      }));

      const exportData: ExportData = {
        moduleName: "tensoes-geostaticas",
        moduleTitle: "Tensões Geostáticas",
        inputs,
        results: resultItems,
        charts: perfilImage ? [{ title: "Perfil de Tensões", image: perfilImage }] : [],
        summary: [
          { label: "Profundidade Máxima", value: `${formatNumberForExport(results.pontos_calculo[results.pontos_calculo.length - 1].profundidade)} m` },
          { label: "Pontos Calculados", value: results.pontos_calculo.length.toString() },
        ],
      };

      const success = await exportToPDF(exportData, pdfFileName);
      
      if (success) {
        toast({
          title: "📄 PDF Exportado!",
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
    } catch (error) {
      console.error("Erro ao exportar PDF:", error);
      toast({
        title: "Erro",
        description: "Erro ao exportar PDF",
        variant: "destructive",
      });
    } finally {
      setIsExportingPDF(false);
    }
  };

  const handleExportExcel = async () => {
    if (!results || !results.pontos_calculo || results.pontos_calculo.length === 0) {
      toast({
        title: "Atenção",
        description: "Não há resultados para exportar",
        variant: "destructive",
      });
      return;
    }

    const inputs: any[][] = [
      ["Parâmetro", "Valor"],
      ["Nível d'Água (m)", formData.profundidadeNA || "Não definido"],
      ["Altura Capilar (m)", formData.alturaCapilar],
      ["γ água (kN/m³)", formData.pesoEspecificoAgua],
      ["Número de Camadas", formData.camadas.length.toString()],
      [""],
    ];

    formData.camadas.forEach((camada, idx) => {
      inputs.push([`--- ${camada.nome} ---`, ""]);
      inputs.push(["Espessura (m)", camada.espessura]);
      if (camada.gamaNat) inputs.push(["γ_nat (kN/m³)", camada.gamaNat]);
      if (camada.gamaSat) inputs.push(["γ_sat (kN/m³)", camada.gamaSat]);
      if (camada.Ko) inputs.push(["Ko", camada.Ko]);
      inputs.push([""]);
    });

    const resultsTable = [
      ["Prof. (m)", "σ_v (kPa)", "u (kPa)", "σ'_v (kPa)", "σ'_h (kPa)"],
      ...results.pontos_calculo.map(ponto => [
        formatNumberForExport(ponto.profundidade),
        formatNumberForExport(ponto.tensao_total_vertical),
        formatNumberForExport(ponto.pressao_neutra),
        formatNumberForExport(ponto.tensao_efetiva_vertical),
        formatNumberForExport(ponto.tensao_efetiva_horizontal),
      ]),
    ];

    const exportData: ExcelExportData = {
      moduleName: "tensoes-geostaticas",
      moduleTitle: "Tensões Geostáticas",
      sheets: [
        { name: "Dados de Entrada", data: inputs },
        { name: "Resultados", data: resultsTable },
      ],
    };

    const success = await exportToExcel(exportData);
    if (success) {
      toast({
        title: "📊 Excel Exportado!",
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

  const fmt = (value: number | null | undefined) => {
    if (value === null || value === undefined) return "—";
    return formatNumber(value, settings);
  };

  const isFormValid = 
    formData.pesoEspecificoAgua &&
    formData.camadas.length > 0 &&
    formData.camadas.every(c => c.nome && c.espessura);

  return (
    <div className="space-y-4 pb-4">
      {/* Header com Ações */}
      <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-4 rounded-xl border border-primary/20">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
              <Layers className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">Tensões Geostáticas</h2>
              <p className="text-xs text-muted-foreground">Calcule tensões em perfis de solo</p>
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

      {/* Configurações Globais */}
      <MobileSection
        title="Nível d'Água"
        icon={<Droplet className="w-4 h-4" />}
        defaultOpen={true}
      >
        <MobileInputGroup
          label="Profundidade do NA"
          value={formData.profundidadeNA}
          onChange={(v) => handleInputChange("profundidadeNA", v)}
          placeholder="Ex: 2.5 (opcional)"
          unit="m"
          tooltip="Profundidade do nível d'água a partir da superfície"
        />
        <MobileInputGroup
          label="Altura Capilar"
          value={formData.alturaCapilar}
          onChange={(v) => handleInputChange("alturaCapilar", v)}
          placeholder="Ex: 0.5"
          unit="m"
          tooltip="Altura da franja capilar acima do NA"
        />
        <div className="pt-2">
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => setConfigSheetOpen(true)}
          >
            <Settings className="w-4 h-4 mr-2" />
            Configurações Avançadas
          </Button>
        </div>
      </MobileSection>

      {/* Camadas com Carousel */}
      <MobileSection
        title="Camadas de Solo"
        icon={<Mountain className="w-4 h-4" />}
        defaultOpen={true}
      >
        <div className="space-y-4">
          {/* Badge com contador */}
          <div className="flex items-center justify-between">
            <Badge variant="secondary" className="text-xs">
              {formData.camadas.length} {formData.camadas.length === 1 ? "camada" : "camadas"}
            </Badge>
            <Button
              size="sm"
              variant="outline"
              onClick={handleAddCamada}
              className="h-8 gap-1"
            >
              <Plus className="h-4 w-4" />
              Adicionar
            </Button>
          </div>

          {/* Controles de Navegação */}
          <div className="flex items-center justify-between bg-muted/30 p-3 rounded-lg">
            <Button
              variant="outline"
              size="sm"
              onClick={goToPreviousCamada}
              disabled={currentCamadaIndex === 0}
              className="h-9 w-9 p-0"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <div className="text-center">
              <span className="text-sm font-semibold">
                Camada {currentCamadaIndex + 1} de {formData.camadas.length}
              </span>
              <div className="flex gap-1 mt-1 justify-center">
                {formData.camadas.map((_, idx) => (
                  <div
                    key={idx}
                    className={cn(
                      "h-1.5 rounded-full transition-all",
                      idx === currentCamadaIndex ? "w-6 bg-primary" : "w-1.5 bg-muted-foreground/30"
                    )}
                  />
                ))}
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={goToNextCamada}
              disabled={currentCamadaIndex === formData.camadas.length - 1}
              className="h-9 w-9 p-0"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Carousel de Camadas */}
          <Carousel setApi={setCarouselApi} className="w-full">
            <CarouselContent>
              {formData.camadas.map((camada, index) => (
                <CarouselItem key={camada.id}>
                  <div className="p-3 rounded-lg bg-card/50 backdrop-blur-sm border border-border/50 space-y-3">
                    {/* Header da Camada */}
                    <div className="flex items-center justify-between bg-primary/10 border border-primary/20 rounded-lg p-3">
                      <div className="flex-1">
                        <h4 className="font-semibold text-sm text-foreground">{camada.nome}</h4>
                        <p className="text-xs text-muted-foreground">
                          Espessura: {camada.espessura || "0"} m
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveCamada(index)}
                        disabled={formData.camadas.length <= 1}
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* Inputs da Camada */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium flex items-center gap-2 after:content-['*'] after:text-destructive after:ml-0.5">
                        Nome da Camada
                      </Label>
                      <Input
                        value={camada.nome}
                        onChange={(e) => handleInputChangeCamada(index, "nome", e.target.value)}
                        placeholder="Ex: Areia Argilosa"
                        className="h-11"
                      />
                    </div>

                    <MobileInputGroup
                      label="Espessura"
                      value={camada.espessura}
                      onChange={(v) => handleInputChangeCamada(index, "espessura", v)}
                      placeholder="Ex: 5.0"
                      unit="m"
                      required
                      tooltip="Espessura da camada de solo"
                    />

                    <MobileInputGroup
                      label="γ Natural"
                      value={camada.gamaNat}
                      onChange={(v) => handleInputChangeCamada(index, "gamaNat", v)}
                      placeholder="Ex: 18.0"
                      unit="kN/m³"
                      tooltip="Peso específico natural (acima do NA)"
                    />

                    <MobileInputGroup
                      label="γ Saturado"
                      value={camada.gamaSat}
                      onChange={(v) => handleInputChangeCamada(index, "gamaSat", v)}
                      placeholder="Ex: 20.0"
                      unit="kN/m³"
                      tooltip="Peso específico saturado (abaixo do NA)"
                    />

                    <MobileInputGroup
                      label="Ko (Coef. Empuxo)"
                      value={camada.Ko}
                      onChange={(v) => handleInputChangeCamada(index, "Ko", v)}
                      placeholder="Ex: 0.5"
                      tooltip="Coeficiente de empuxo em repouso (típico: 0.4-0.6)"
                    />
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>
        </div>
      </MobileSection>

      {/* Botão Calcular */}
      <Button
        onClick={handleCalculate}
        disabled={isCalculating || !isFormValid}
        className="w-full h-12 text-base"
        size="lg"
      >
        {isCalculating ? (
          <>
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
            Calculando...
          </>
        ) : (
          <>
            <Calculator className="w-5 h-5 mr-2" />
            Calcular Tensões
          </>
        )}
      </Button>

      {/* Resultados */}
      {results && results.pontos_calculo && results.pontos_calculo.length > 0 && (
        <>
          {/* Ações de Exportação */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setPdfFileName(generateDefaultPDFFileName("tensoes-geostaticas"));
                setExportPDFDialogOpen(true);
              }}
              className="flex-1 gap-2"
            >
              <Download className="w-4 h-4" />
              PDF
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportExcel}
              className="flex-1 gap-2"
            >
              <FileSpreadsheet className="w-4 h-4" />
              Excel
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (results) {
                  setLoadSheetOpen(true);
                }
              }}
              className="flex-1 gap-2"
            >
              <Save className="w-4 h-4" />
              Salvar
            </Button>
          </div>

          <MobileTabs
            tabs={[
              {
                value: "resultados",
                label: "Resultados",
                icon: <BarChart3 className="w-4 w-4" />,
                content: (
                  <div className="space-y-3 mt-4">
                    <div className="bg-primary/10 border border-primary/20 rounded-lg p-3">
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-muted-foreground">Pontos:</span>
                          <span className="ml-2 font-medium text-foreground">
                            {results.pontos_calculo.length}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Prof. Máx:</span>
                          <span className="ml-2 font-medium text-foreground">
                            {fmt(results.pontos_calculo[results.pontos_calculo.length - 1].profundidade)} m
                          </span>
                        </div>
                      </div>
                    </div>

                    {results.pontos_calculo.map((ponto, idx) => (
                      <MobileResultCard 
                        key={idx} 
                        title={`Profundidade ${fmt(ponto.profundidade)} m`}
                      >
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <div className="text-xs text-muted-foreground mb-1">σ_v Total</div>
                            <div className="text-sm font-semibold text-foreground">
                              {fmt(ponto.tensao_total_vertical)} kPa
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-muted-foreground mb-1">Pressão Neutra</div>
                            <div className="text-sm font-semibold text-foreground">
                              {fmt(ponto.pressao_neutra)} kPa
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-muted-foreground mb-1">σ'_v Efetiva</div>
                            <div className="text-sm font-semibold text-primary">
                              {fmt(ponto.tensao_efetiva_vertical)} kPa
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-muted-foreground mb-1">σ'_h Horizontal</div>
                            <div className="text-sm font-semibold text-primary">
                              {fmt(ponto.tensao_efetiva_horizontal)} kPa
                            </div>
                          </div>
                        </div>
                      </MobileResultCard>
                    ))}
                  </div>
                ),
              },
              {
                value: "perfil",
                label: "Perfil",
                icon: <Layers className="w-4 h-4" />,
                content: (
                  <div className="mt-4">
                    <div ref={chartRef} className="bg-background rounded-lg p-2 -mx-2">
                      <PerfilTensoes pontos={results.pontos_calculo} />
                    </div>
                  </div>
                ),
              },
            ]}
            defaultValue="resultados"
          />
        </>
      )}

      {/* Sheet de Configurações */}
      <Sheet open={configSheetOpen} onOpenChange={setConfigSheetOpen}>
        <SheetContent side="bottom" className="h-[40vh] rounded-t-2xl">
          <SheetHeader>
            <SheetTitle>Configurações Avançadas</SheetTitle>
          </SheetHeader>
          <div className="mt-6 space-y-4">
            <MobileInputGroup
              label="Peso Específico da Água"
              value={formData.pesoEspecificoAgua}
              onChange={(v) => handleInputChange("pesoEspecificoAgua", v)}
              placeholder="Ex: 10.0"
              unit="kN/m³"
              required
              tooltip="Padrão: 10.0 kN/m³ (água doce)"
            />
          </div>
        </SheetContent>
      </Sheet>

      {/* Sheet de Exemplos */}
      <Sheet open={examplesSheetOpen} onOpenChange={setExamplesSheetOpen}>
        <SheetContent side="bottom" className="h-[70vh] rounded-t-2xl">
          <SheetHeader>
            <SheetTitle>Exemplos de Perfis</SheetTitle>
          </SheetHeader>
          <div className="mt-6 space-y-3 overflow-y-auto max-h-[calc(70vh-100px)]">
            {exemplosTensoes.map((example, idx) => (
              <button
                key={`${example.nome}-${idx}`}
                onClick={() => handleLoadExample(example)}
                className="w-full p-4 rounded-xl bg-secondary/50 hover:bg-secondary border-2 border-transparent hover:border-primary/20 transition-all active:scale-95 text-left focus-visible:outline-none [-webkit-tap-highlight-color:transparent]"
              >
                <div className="flex items-start gap-3">
                  <div className="text-2xl">{example.icon}</div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-foreground">{example.nome}</h4>
                    <p className="text-xs text-muted-foreground mt-1">{example.descricao}</p>
                    <div className="flex gap-3 mt-2 text-xs text-muted-foreground">
                      <span>📊 {example.camadas.length} camadas</span>
                      {example.profundidadeNA && <span>💧 NA: {example.profundidadeNA}m</span>}
                    </div>
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
          <div className="mt-6 space-y-4 overflow-y-auto max-h-[calc(70vh-180px)]">
            {calculations.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FolderOpen className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Nenhum cálculo salvo</p>
              </div>
            ) : (
              calculations.map((calc) => (
                <button
                  key={calc.id}
                  onClick={() => handleLoad(calc)}
                  className="w-full p-4 rounded-xl bg-secondary/50 hover:bg-secondary border-2 border-transparent hover:border-primary/20 transition-all active:scale-95 text-left"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold text-foreground">{calc.name}</h4>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(calc.timestamp).toLocaleDateString("pt-BR")}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {calc.data.camadas?.length || 0} camadas
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteCalculation(calc.id);
                        toast({
                          title: "🗑️ Excluído!",
                          description: "Cálculo removido",
                        });
                      }}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </button>
              ))
            )}
          </div>

          {/* Salvar Novo */}
          {results && (
            <div className="absolute bottom-0 left-0 right-0 p-6 bg-background border-t">
              <div className="space-y-2">
                <Label>Nome do Cálculo</Label>
                <div className="flex gap-2">
                  <Input
                    value={saveName}
                    onChange={(e) => setSaveName(e.target.value)}
                    placeholder="Digite um nome..."
                    className="h-12"
                  />
                  <Button onClick={handleSave} size="lg" disabled={!saveName.trim()}>
                    <Save className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Dialog de Exportação PDF */}
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

