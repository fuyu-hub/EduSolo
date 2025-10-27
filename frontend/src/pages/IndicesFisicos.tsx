// frontend/src/pages/IndicesFisicos.tsx
import { useState, useMemo, useEffect } from "react";
import { Beaker, Calculator, Info, BarChart3, ArrowLeft, ArrowRight, Save, FolderOpen, Download, Printer, FileText, AlertCircle, GraduationCap } from "lucide-react";
import { Card } from "@/components/ui/card";
import { calcularIndicesFisicos } from "@/lib/calculations/indices-fisicos";
import { MobileModuleWrapper } from "@/components/mobile";
import IndicesFisicosMobile from "./mobile/IndicesFisicosMobile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button as PopoverButton } from "@/components/ui/button";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import DiagramaFases from "@/components/visualizations/DiagramaFases";
import { conteudoIndicesFisicos, ConteudoIndice } from "@/lib/geotecnia/indicesFisicosConteudo";
import { cn } from "@/lib/utils";
import { useSavedCalculations } from "@/hooks/use-saved-calculations";
import SavedCalculations from "@/components/SavedCalculations";
import ExportPDFDialog from "@/components/ExportPDFDialog";
import PrintHeader from "@/components/PrintHeader";
import CalculationActions from "@/components/CalculationActions";
import { exportToPDF, exportToExcel, ExportData, ExcelExportData, formatNumberForExport, generateDefaultPDFFileName } from "@/lib/export-utils";
import { useTheme } from "@/hooks/use-theme";
import SoilExamples from "@/components/soil/SoilExamples";
import GsSuggestions from "@/components/soil/GsSuggestions";
import { useToursEnabled } from "@/components/WelcomeDialog";
import ResultInterpretation from "@/components/soil/ResultInterpretation";
import InputWithValidation from "@/components/soil/InputWithValidation";
import { SoilExample, soilExamples } from "@/lib/soil-constants";
import { Switch } from "@/components/ui/switch";
import { useSettings } from "@/hooks/use-settings";
import { formatNumber } from "@/lib/format-number";
import { AppSettings } from "@/contexts/SettingsContext";
import { useTour, TourStep } from "@/contexts/TourContext";

// Interface local que reflete a API Output
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

// Interface para o estado do formulário
interface FormData {
  massaUmida: string;
  massaSeca: string;
  volume: string;
  Gs?: string;
  pesoEspecificoAgua?: string;
  indice_vazios_max?: string;
  indice_vazios_min?: string;
}

type Results = IndicesFisicosOutput;

// Tooltips para entradas
const tooltips = {
  massaUmida: "Massa total da amostra de solo incluindo a água (g)",
  massaSeca: "Massa da amostra após secagem em estufa (g)",
  volume: "Volume total da amostra incluindo vazios (cm³)",
  Gs: "Densidade dos grãos (adimensional, ex: 2.65). Necessário para calcular todos os índices físicos (e, n, Sr, γsat, γsub, Dr). Use as sugestões ao lado para valores típicos.",
  pesoEspecificoAgua: "Peso específico da água (kN/m³, padrão 10.0)",
  indice_vazios_max: "Índice de vazios máximo do solo (emax). Necessário para calcular Dr.",
  indice_vazios_min: "Índice de vazios mínimo do solo (emin). Necessário para calcular Dr.",
};

// Cálculos agora são feitos localmente no frontend

function IndicesFisicosDesktop() {
  // Configurações
  const { settings } = useSettings();
  const { startTour } = useTour();
  const { theme } = useTheme();
  const toursEnabled = useToursEnabled();
  
  // Estados
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
  const { toast } = useToast();

  // Definição dos steps do tour
  const tourSteps: TourStep[] = [
    {
      target: "[data-tour='module-header']",
      title: "🧮 Bem-vindo aos Índices Físicos!",
      content: "Este módulo permite calcular as propriedades físicas fundamentais do solo, como peso específico, índice de vazios, porosidade e grau de saturação.",
      placement: "bottom",
      spotlightPadding: 16,
    },
    {
      target: "[data-tour='input-basicos']",
      title: "📊 Dados Básicos de Entrada",
      content: "Insira os valores fundamentais obtidos no ensaio: massa úmida, massa seca, volume total e densidade dos grãos (Gs). Esses dados são essenciais para calcular todos os índices físicos do solo.",
      placement: "right",
      spotlightPadding: 12,
    },
    {
      target: "#Gs",
      title: "🔬 Densidade dos Grãos (Gs)",
      content: "O Gs é essencial para calcular todos os índices físicos. Ele não pode ser calculado apenas com massa e volume - deve ser informado. Valores típicos: Areia (quartzo) = 2.65, Argila = 2.70, Silte = 2.68. Use as sugestões ao lado!",
      placement: "left",
      spotlightPadding: 12,
    },
    {
      target: "#indice_vazios_max",
      title: "📐 Índices de Vazios (Opcional)",
      content: "Para calcular a compacidade relativa (Dr) de solos granulares, forneça os valores de emax e emin do solo, obtidos em ensaios específicos.",
      placement: "left",
      spotlightPadding: 12,
    },
    {
      target: "[data-tour='btn-calcular']",
      title: "⚡ Calcular Resultados",
      content: "Após preencher os dados necessários, clique aqui para processar os cálculos. Os resultados aparecerão instantaneamente no painel ao lado.",
      placement: "top",
      spotlightPadding: 12,
    },
    {
      target: "[data-tour='diagrama-fases']",
      title: "🎨 Diagrama de Fases",
      content: "Esta visualização mostra a distribuição das três fases do solo (sólidos, água e ar). Neste exemplo de areia compacta, note os volumes relativos de cada fase.",
      placement: "left",
      spotlightPadding: 12,
    },
    {
      target: "[data-tour='resultados']",
      title: "📈 Resultados Numéricos",
      content: "Todos os índices calculados do exemplo estão aqui. Use as setas para navegar. Clique no ícone (i) para ver fórmulas e explicações, incluindo compacidade relativa (Dr).",
      placement: "left",
      spotlightPadding: 12,
    },
    {
      target: "[data-tour='actions']",
      title: "💾 Salvar e Exportar",
      content: "Salve seus cálculos para consulta posterior ou exporte os resultados em PDF ou Excel. Você também pode carregar exemplos práticos para aprender!",
      placement: "bottom",
      spotlightPadding: 12,
    },
  ];

  // Iniciar tour automaticamente na primeira visita
  useEffect(() => {
    // Verificar se tours estão globalmente desabilitados
    if (!toursEnabled) return;
    
    const initTour = async () => {
      // Verificar se já viu o tour
      const hasSeenTour = localStorage.getItem('tour-seen-indices-fisicos');
      if (hasSeenTour === 'true') return;
      
      // Carregar exemplo para demonstração (Areia Compacta)
      const exemploParaTour = soilExamples[1]; // Areia Compacta com todos os dados
      handleLoadExample(exemploParaTour);
      
      // Aguardar formulário ser preenchido
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Calcular automaticamente
      await handleCalculate();
      
      // Aguardar cálculo
      await new Promise(resolve => setTimeout(resolve, 1200));
      
      // Iniciar tour
      startTour(tourSteps, "indices-fisicos");
    };
    
    const timer = setTimeout(initTour, 800);
    return () => clearTimeout(timer);
  }, [toursEnabled]);


  // Estados para salvamento e exportação
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [saveName, setSaveName] = useState("");
  const [loadDialogOpen, setLoadDialogOpen] = useState(false);
  const { calculations, saveCalculation, deleteCalculation, renameCalculation, getCalculation } = useSavedCalculations("indices-fisicos");

  // Estados para exportação PDF
  const [exportPDFDialogOpen, setExportPDFDialogOpen] = useState(false);
  const [pdfFileName, setPdfFileName] = useState("");
  const [isExportingPDF, setIsExportingPDF] = useState(false);

  // Estados para modo comparação
  const [compareMode, setCompareMode] = useState(false);
  const [formDataB, setFormDataB] = useState<FormData>({
    massaUmida: "",
    massaSeca: "",
    volume: "",
    Gs: "",
    pesoEspecificoAgua: "10.0",
    indice_vazios_max: "",
    indice_vazios_min: "",
  });
  const [resultsB, setResultsB] = useState<Results | null>(null);

  const handleChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError(null); // Limpa erro ao digitar
  };

  const handleCalculate = async () => {
    setIsCalculating(true);
    setError(null);
    setResults(null);

    // Mapeamento e conversão para a API
    const apiInput: { [key: string]: number | undefined } = {
      peso_total: formData.massaUmida ? parseFloat(formData.massaUmida) : undefined,
      peso_solido: formData.massaSeca ? parseFloat(formData.massaSeca) : undefined,
      volume_total: formData.volume ? parseFloat(formData.volume) : undefined,
      Gs: formData.Gs ? parseFloat(formData.Gs) : undefined,
      peso_especifico_agua: formData.pesoEspecificoAgua ? parseFloat(formData.pesoEspecificoAgua) : 10.0,
      indice_vazios_max: formData.indice_vazios_max ? parseFloat(formData.indice_vazios_max) : undefined,
      indice_vazios_min: formData.indice_vazios_min ? parseFloat(formData.indice_vazios_min) : undefined,
    };

    // Remove chaves com valores NaN ou undefined
    Object.keys(apiInput).forEach(key => (apiInput[key] === undefined || isNaN(apiInput[key] as number)) && delete apiInput[key]);

    // Validação local emin < emax
    if (apiInput.indice_vazios_min !== undefined && apiInput.indice_vazios_max !== undefined && apiInput.indice_vazios_min >= apiInput.indice_vazios_max) {
        setError("Índice de vazios mínimo (emin) deve ser menor que o máximo (emax).");
        toast({
          title: "Erro de Entrada",
          description: "Índice de vazios mínimo (emin) deve ser menor que o máximo (emax).",
          variant: "destructive",
        });
        setIsCalculating(false);
        return;
    }

    try {
      // Calcula localmente no frontend
      const resultado = calcularIndicesFisicos(apiInput);

      if (resultado.erro) {
        setError(resultado.erro);
        toast({
          title: "Erro no Cálculo",
          description: resultado.erro,
          variant: "destructive",
        });
      } else {
        setResults(resultado);
      }
    } catch (err) {
      let errorMessage = "Erro ao calcular os índices físicos.";
      if (err instanceof Error) {
        errorMessage = err.message;
      }
      setError(errorMessage);
      toast({
        title: "Erro de Comunicação/Validação",
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
    setFormData(example.data);
    setResults(null);
    setError(null);
    toast({
      title: `${example.icon} ${example.name} carregado!`,
      description: example.description,
    });
  };

  const handleSelectGs = (gsValue: number) => {
    setFormData(prev => ({ ...prev, Gs: gsValue.toString() }));
    toast({
      title: "Gs atualizado!",
      description: `Densidade dos grãos definida como ${gsValue}`,
    });
  };

  // Funções de salvamento e carregamento
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
        title: "Cálculo salvo!",
        description: "O cálculo foi salvo com sucesso.",
      });
      setSaveDialogOpen(false);
      setSaveName("");
    } else {
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar o cálculo.",
        variant: "destructive",
      });
    }
  };

  const handleLoadCalculation = (calculation: any) => {
    setFormData(calculation.formData);
    setResults(calculation.results);
    toast({
      title: "Cálculo carregado!",
      description: `"${calculation.name}" foi carregado com sucesso.`,
    });
  };

  const handleStartTour = async () => {
    // Carregar exemplo automaticamente para demonstração
    const exemploParaTour = soilExamples[1]; // Areia Compacta
    handleLoadExample(exemploParaTour);
    
    // Aguardar formulário ser preenchido
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Calcular automaticamente
    await handleCalculate();
    
    // Aguardar cálculo completar
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Iniciar o tour
    startTour(tourSteps, "indices-fisicos", true); // Force = true para reiniciar
    toast({
      title: "Tour iniciado!",
      description: "Exemplo carregado automaticamente para demonstração.",
    });
  };

  const handleExportPDF = () => {
    if (!results) return;
    
    // Gerar nome padrão usando a função auxiliar
    const defaultName = generateDefaultPDFFileName("Índices Físicos");
    
    setPdfFileName(defaultName);
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

    // Fórmulas utilizadas com LaTeX
    const formulas = [
      { 
        label: "Peso Específico Natural", 
        formula: "\\gamma_{nat} = \\frac{M_{total}}{V_{total}} \\times 10",
        latex: true,
        description: "Relação entre a massa total do solo (úmido) e seu volume total em kN/m³"
      },
      { 
        label: "Umidade", 
        formula: "w = \\frac{M_{\\acute{u}mida} - M_{seca}}{M_{seca}} \\times 100\\%",
        latex: true,
        description: "Percentual de água em relação à massa seca dos sólidos"
      },
      { 
        label: "Peso Específico Seco", 
        formula: "\\gamma_d = \\frac{\\gamma_{nat}}{1 + \\frac{w}{100}}",
        latex: true,
        description: "Peso específico do solo sem considerar a massa de água"
      },
      { 
        label: "Índice de Vazios", 
        formula: "e = \\frac{G_s \\times \\gamma_w}{\\gamma_d} - 1",
        latex: true,
        description: "Relação entre o volume de vazios e o volume de sólidos (adimensional)"
      },
      { 
        label: "Porosidade", 
        formula: "n = \\frac{e}{1 + e} \\times 100\\%",
        latex: true,
        description: "Percentual de vazios em relação ao volume total"
      },
      { 
        label: "Grau de Saturação", 
        formula: "S_r = \\frac{w \\times G_s}{e} \\times 100\\%",
        latex: true,
        description: "Percentual dos vazios ocupados por água"
      },
      { 
        label: "Peso Específico Saturado", 
        formula: "\\gamma_{sat} = \\frac{G_s + e}{1 + e} \\times \\gamma_w",
        latex: true,
        description: "Peso específico quando todos os vazios estão preenchidos com água"
      },
      { 
        label: "Peso Específico Submerso", 
        formula: "\\gamma_{sub} = \\gamma_{sat} - \\gamma_w",
        latex: true,
        description: "Peso específico efetivo do solo quando submerso (Princípio de Arquimedes)"
      },
    ];

    if (results.compacidade_relativa !== null) {
      formulas.push({
        label: "Compacidade Relativa",
        formula: "D_r = \\frac{e_{max} - e}{e_{max} - e_{min}} \\times 100\\%",
        latex: true,
        description: "Indica o estado de compactação de solos granulares (0% = fofo, 100% = denso)"
      });
    }

    const exportData: ExportData = {
      moduleName: "indices-fisicos",
      moduleTitle: "Índices Físicos",
      inputs,
      results: resultsList,
      formulas,
      customFileName: pdfFileName,
      theme,
      printSettings: settings.printSettings
    };

    const success = await exportToPDF(exportData);
    
    setIsExportingPDF(false);
    
    if (success) {
      toast({
        title: "PDF exportado!",
        description: "O arquivo foi baixado com sucesso.",
      });
      setExportPDFDialogOpen(false);
    } else {
      toast({
        title: "Erro ao exportar",
        description: "Não foi possível gerar o PDF.",
        variant: "destructive",
      });
    }
  };

  const handleExportExcel = async () => {
    if (!results) return;

    // Sheet de Entrada
    const entradaData: { label: string; value: string | number }[] = [
      { label: "Massa Úmida (g)", value: formData.massaUmida },
      { label: "Massa Seca (g)", value: formData.massaSeca },
      { label: "Volume Total (cm³)", value: formData.volume },
    ];
    if (formData.Gs) entradaData.push({ label: "Densidade dos Grãos (Gs)", value: formData.Gs });
    if (formData.pesoEspecificoAgua) entradaData.push({ label: "Peso Específico Água (kN/m³)", value: formData.pesoEspecificoAgua });
    if (formData.indice_vazios_max) entradaData.push({ label: "Índice Vazios Máx", value: formData.indice_vazios_max });
    if (formData.indice_vazios_min) entradaData.push({ label: "Índice Vazios Mín", value: formData.indice_vazios_min });

    // Sheet de Resultados
    const resultadosData: { label: string; value: string | number }[] = [];
    if (results.peso_especifico_natural !== null) resultadosData.push({ label: "Peso Específico Natural (kN/m³)", value: results.peso_especifico_natural.toFixed(2) });
    if (results.peso_especifico_seco !== null) resultadosData.push({ label: "Peso Específico Seco (kN/m³)", value: results.peso_especifico_seco.toFixed(2) });
    if (results.peso_especifico_saturado !== null) resultadosData.push({ label: "Peso Específico Saturado (kN/m³)", value: results.peso_especifico_saturado.toFixed(2) });
    if (results.peso_especifico_submerso !== null) resultadosData.push({ label: "Peso Específico Submerso (kN/m³)", value: results.peso_especifico_submerso.toFixed(2) });
    if (results.peso_especifico_solidos !== null) resultadosData.push({ label: "Peso Específico Sólidos (kN/m³)", value: results.peso_especifico_solidos.toFixed(2) });
    if (results.Gs !== null) resultadosData.push({ label: "Densidade dos Grãos (Gs)", value: results.Gs.toFixed(3) });
    if (results.indice_vazios !== null) resultadosData.push({ label: "Índice de Vazios", value: results.indice_vazios.toFixed(3) });
    if (results.porosidade !== null) resultadosData.push({ label: "Porosidade (%)", value: results.porosidade.toFixed(2) });
    if (results.grau_saturacao !== null) resultadosData.push({ label: "Grau de Saturação (%)", value: results.grau_saturacao.toFixed(2) });
    if (results.umidade !== null) resultadosData.push({ label: "Umidade (%)", value: results.umidade.toFixed(2) });
    if (results.compacidade_relativa !== null) resultadosData.push({ label: "Compacidade Relativa (%)", value: results.compacidade_relativa.toFixed(2) });
    if (results.classificacao_compacidade) resultadosData.push({ label: "Classificação", value: results.classificacao_compacidade });

    const excelData: ExcelExportData = {
      moduleName: "indices-fisicos",
      moduleTitle: "Índices Físicos",
      sheets: [
        { name: "Dados de Entrada", data: entradaData },
        { name: "Resultados", data: resultadosData }
      ],
    };

    const success = await exportToExcel(excelData);
    if (success) {
      toast({
        title: "Excel exportado!",
        description: "O arquivo foi baixado com sucesso.",
      });
    } else {
      toast({
        title: "Erro ao exportar",
        description: "Não foi possível gerar o Excel.",
        variant: "destructive",
      });
    }
  };

  // Validação: precisa dos 3 dados básicos (massa úmida, massa seca, volume) E do Gs (OBRIGATÓRIO)
  const isFormValid =
    formData.massaUmida && 
    formData.massaSeca && 
    formData.volume && 
    formData.Gs &&
    !isNaN(parseFloat(formData.massaUmida)) &&
    !isNaN(parseFloat(formData.massaSeca)) &&
    !isNaN(parseFloat(formData.volume)) &&
    !isNaN(parseFloat(formData.Gs));

  // Agrupamento dos Resultados para o Carrossel
  const resultItems = useMemo(() => {
    if (!results || results.erro) return [];

    const items = [
      results.peso_especifico_natural !== null ? <ResultItem key="gama_nat" label="Natural (γn)" value={results.peso_especifico_natural} unit="kN/m³" infoKey="peso_especifico_natural" settings={settings} /> : null,
      results.peso_especifico_seco !== null ? <ResultItem key="gama_d" label="Seco (γd)" value={results.peso_especifico_seco} unit="kN/m³" infoKey="peso_especifico_seco" settings={settings} /> : null,
      results.peso_especifico_solidos !== null ? <ResultItem key="gama_s" label="Sólidos (γs)" value={results.peso_especifico_solidos} unit="kN/m³" infoKey="peso_especifico_solidos" settings={settings} /> : null,
      results.Gs !== null ? <ResultItem key="Gs" label="Densidade dos Grãos (Gs)" value={results.Gs} unit="" infoKey="Gs" settings={settings} /> : null,
      results.peso_especifico_saturado !== null ? <ResultItem key="gama_sat" label="Saturado (γsat)" value={results.peso_especifico_saturado} unit="kN/m³" infoKey="peso_especifico_saturado" settings={settings} /> : null,
      results.peso_especifico_submerso !== null ? <ResultItem key="gama_sub" label="Submerso (γsub)" value={results.peso_especifico_submerso} unit="kN/m³" infoKey="peso_especifico_submerso" settings={settings} /> : null,
      results.umidade !== null ? <ResultItem key="w" label="Umidade (w)" value={results.umidade} unit="%" infoKey="umidade" settings={settings} /> : null,
      results.indice_vazios !== null ? <ResultItem key="e" label="Índice de Vazios (e)" value={results.indice_vazios} unit="" infoKey="indice_vazios" settings={settings} /> : null,
      results.porosidade !== null ? <ResultItem key="n" label="Porosidade (n)" value={results.porosidade} unit="%" infoKey="porosidade" settings={settings} /> : null,
      results.grau_saturacao !== null ? <ResultItem key="Sr" label="Grau de Saturação (Sr)" value={results.grau_saturacao} unit="%" infoKey="grau_saturacao" settings={settings} /> : null,
      results.compacidade_relativa !== null ? <ResultItem key="Dr" label="Compacidade Relativa (Dr)" value={results.compacidade_relativa} unit="%" infoKey="compacidade_relativa" settings={settings} /> : null,
      results.classificacao_compacidade ? <ResultItem key="class_dr" label="Classificação (Dr)" value={results.classificacao_compacidade} unit="" infoKey="classificacao_compacidade" settings={settings} /> : null,
    ].filter(Boolean); // Remove os nulos

    // Agrupa em chunks de 4
    const chunkSize = 4;
    const chunks = [];
    for (let i = 0; i < items.length; i += chunkSize) {
      chunks.push(items.slice(i, i + chunkSize));
    }
    return chunks;
  }, [results, settings]);


  return (
    <TooltipProvider>
      <div className="space-y-6 max-w-7xl mx-auto">
        <PrintHeader moduleTitle="Índices Físicos" moduleName="indices-fisicos" />
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-in fade-in slide-in-from-left-4 duration-500" data-tour="module-header">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 flex items-center justify-center shadow-lg transition-transform hover:scale-110 hover:rotate-3">
              <Beaker className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Índices Físicos</h1>
              <p className="text-sm sm:text-base text-muted-foreground">Análise das propriedades físicas do solo</p>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex items-center gap-2" data-tour="actions">
            <SoilExamples onSelect={handleLoadExample} disabled={isCalculating} />
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleStartTour}
                  className="h-10 w-10"
                >
                  <GraduationCap className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Iniciar tour guiado</p>
              </TooltipContent>
            </Tooltip>
            <TooltipProvider>
              <CalculationActions
                onSave={handleSaveClick}
                onLoad={() => setLoadDialogOpen(true)}
                onExportPDF={handleExportPDF}
                onExportExcel={handleExportExcel}
                hasResults={!!results}
                isCalculating={isCalculating}
              />
            </TooltipProvider>
          </div>
        </div>

        {/* Layout Principal */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 items-start">
          {/* Input Panel - Ajustes de espaçamento aqui */}
          <Card className="glass p-4 sm:p-6 md:col-span-1 flex flex-col animate-in fade-in slide-in-from-left-4 duration-700" style={{ animationDelay: '100ms', animationFillMode: 'backwards' }}>
             <h2 className="text-xl font-semibold text-foreground mb-6 flex items-center gap-2"> {/* Aumentado mb-4 para mb-6 */}
              <Info className="w-5 h-5" />
              Dados de Entrada
            </h2>
             {/* Aumentado gap e mb */}
             <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5 mb-8" role="group" aria-labelledby="input-section-title">
              {/* Coluna 1 Inputs */}
              <div className="space-y-5" data-tour="input-basicos">
                <InputWithValidation
                  id="massaUmida"
                  label="Massa Úmida (g)"
                  value={formData.massaUmida}
                  onChange={(value) => handleChange("massaUmida", value)}
                  tooltip={tooltips.massaUmida}
                  placeholder="Ex: 150.5"
                  validationRules={[
                    {
                      validate: (v) => parseFloat(v) > 0,
                      message: "Deve ser maior que 0",
                    },
                    {
                      validate: (v) => {
                        if (!formData.massaSeca) return true;
                        return parseFloat(v) >= parseFloat(formData.massaSeca);
                      },
                      message: "Massa úmida deve ser ≥ massa seca",
                    },
                  ]}
                />
                
                <InputWithValidation
                  id="massaSeca"
                  label="Massa Seca (g)"
                  value={formData.massaSeca}
                  onChange={(value) => handleChange("massaSeca", value)}
                  tooltip={tooltips.massaSeca}
                  placeholder="Ex: 130.2"
                  validationRules={[
                    {
                      validate: (v) => parseFloat(v) > 0,
                      message: "Deve ser maior que 0",
                    },
                    {
                      validate: (v) => {
                        if (!formData.massaUmida) return true;
                        return parseFloat(v) <= parseFloat(formData.massaUmida);
                      },
                      message: "Massa seca deve ser ≤ massa úmida",
                    },
                  ]}
                />
                
                <InputWithValidation
                  id="volume"
                  label="Volume Total (cm³)"
                  value={formData.volume}
                  onChange={(value) => handleChange("volume", value)}
                  tooltip={tooltips.volume}
                  placeholder="Ex: 100.0"
                  validationRules={[
                    {
                      validate: (v) => parseFloat(v) > 0,
                      message: "Deve ser maior que 0",
                    },
                  ]}
                />
              </div>
              {/* Coluna 2 Inputs */}
              <div className="space-y-5"> {/* Aumentado space-y-4 para space-y-5 */}
                 <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="Gs">Densidade dos Grãos (Gs) *</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <PopoverButton variant="ghost" size="icon" className="h-5 w-5 p-0 hover:bg-muted">
                            <Info className="w-4 h-4 text-muted-foreground cursor-pointer" />
                          </PopoverButton>
                        </PopoverTrigger>
                        <PopoverContent className="max-w-xs" align="start">
                          <p className="text-sm">{tooltips.Gs}</p>
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div className="flex items-center gap-2">
                      <Input 
                        id="Gs" 
                        type="number" 
                        step="0.01" 
                        value={formData.Gs} 
                        onChange={(e) => handleChange("Gs", e.target.value)} 
                        className="bg-background/50 flex-1" 
                        placeholder="Ex: 2.65" 
                        required
                      />
                      <GsSuggestions onSelect={handleSelectGs} />
                    </div>
                  </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="indice_vazios_max">Índice de Vazios Máximo (emax)</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <PopoverButton variant="ghost" size="icon" className="h-5 w-5 p-0 hover:bg-muted">
                          <Info className="w-4 h-4 text-muted-foreground cursor-pointer" />
                        </PopoverButton>
                      </PopoverTrigger>
                      <PopoverContent className="max-w-xs" align="start">
                        <p className="text-sm">{tooltips.indice_vazios_max}</p>
                      </PopoverContent>
                    </Popover>
                  </div>
                  <Input id="indice_vazios_max" type="number" step="0.01" value={formData.indice_vazios_max} onChange={(e) => handleChange("indice_vazios_max", e.target.value)} className="bg-background/50" placeholder="Opcional (ex: 0.85)" />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="indice_vazios_min">Índice de Vazios Mínimo (emin)</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <PopoverButton variant="ghost" size="icon" className="h-5 w-5 p-0 hover:bg-muted">
                          <Info className="w-4 h-4 text-muted-foreground cursor-pointer" />
                        </PopoverButton>
                      </PopoverTrigger>
                      <PopoverContent className="max-w-xs" align="start">
                        <p className="text-sm">{tooltips.indice_vazios_min}</p>
                      </PopoverContent>
                    </Popover>
                  </div>
                  <Input id="indice_vazios_min" type="number" step="0.01" value={formData.indice_vazios_min} onChange={(e) => handleChange("indice_vazios_min", e.target.value)} className="bg-background/50" placeholder="Opcional (ex: 0.45)" />
                </div>
              </div>
            </div>
              {/* Select - Peso Específico Água */}
              <div className="space-y-2 mb-8 md:col-span-2">
                 <div className="flex items-center gap-2">
                   <Label htmlFor="pesoEspecificoAgua">Peso Específico Água (kN/m³)</Label>
                   <Popover>
                     <PopoverTrigger asChild>
                       <PopoverButton variant="ghost" size="icon" className="h-5 w-5 p-0 hover:bg-muted">
                         <Info className="w-4 h-4 text-muted-foreground cursor-pointer" />
                       </PopoverButton>
                     </PopoverTrigger>
                     <PopoverContent className="max-w-xs" align="start">
                       <p className="text-sm">{tooltips.pesoEspecificoAgua}</p>
                     </PopoverContent>
                   </Popover>
                 </div>
                 <Select value={formData.pesoEspecificoAgua} onValueChange={(value) => handleChange("pesoEspecificoAgua", value)}>
                   <SelectTrigger className="bg-background/50">
                     <SelectValue placeholder="Selecione o peso específico" />
                   </SelectTrigger>
                   <SelectContent>
                     <SelectItem value="9.81">9.81 kN/m³ (exato)</SelectItem>
                     <SelectItem value="10.0">10.0 kN/m³ (aproximado)</SelectItem>
                   </SelectContent>
                 </Select>
              </div>
              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 md:col-span-2 mt-auto pt-4" role="group" aria-label="Ações do formulário">
                <Button 
                  onClick={handleCalculate} 
                  disabled={!isFormValid || isCalculating} 
                  className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground h-10"
                  aria-label={isCalculating ? "Calculando dados" : "Calcular índices físicos"}
                  data-tour="btn-calcular"
                >
                  <Calculator className="w-4 h-4 mr-2" />
                  {isCalculating ? "Calculando..." : "Calcular"}
                </Button>
                <Button 
                  onClick={handleClear} 
                  variant="outline" 
                  disabled={isCalculating}
                  aria-label="Limpar todos os campos"
                  className="h-10 w-full sm:w-auto"
                >
                  Limpar
                </Button>
              </div>
          </Card>

          {/* Card de Saída Unificado */}
          <Card className="glass p-4 sm:p-6 md:col-span-1 space-y-4 sm:space-y-6 animate-in fade-in slide-in-from-right-4 duration-700" style={{ animationDelay: '200ms', animationFillMode: 'backwards' }}>
              {/* Seção do Diagrama de Fases */}
              <div data-tour="diagrama-fases">
                <h2 className="text-xl font-semibold text-foreground mb-4">Visualização (Diagrama de Fases)</h2>
                <div className="flex justify-center items-center min-h-[180px]">
                  {isCalculating ? (
                    <Skeleton className="w-full max-w-sm h-36 bg-muted/20" />
                  ) : results && results.volume_solidos_norm !== null && results.volume_agua_norm !== null && results.volume_ar_norm !== null && !results.erro ? (
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
                  ) : !error ? (
                    <p className="text-muted-foreground text-center">
                      O diagrama de fases será exibido aqui após o cálculo.
                    </p>
                  ) : null}
                  {error && !isCalculating && (
                    <div className="flex flex-col items-center justify-center h-full text-center text-destructive">
                      <Info className="w-12 h-12 mb-4" />
                      <p className="font-semibold">Erro</p>
                      <p className="text-sm max-w-xs">{error}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Seção de Resultados Numéricos com Carrossel */}
              <div data-tour="resultados">
                <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
                   <BarChart3 className="w-5 h-5 text-primary" />
                   Resultados Numéricos
                </h2>
                {isCalculating ? (
                  <div className="relative">
                    <div className="grid grid-cols-2 gap-4">
                      {[...Array(4)].map((_, i) => (
                        <Skeleton key={`sk-${i}`} className="h-[56px] w-full bg-muted/20" />
                      ))}
                    </div>
                  </div>
                ) : results && !results.erro && resultItems.length > 0 ? (
                  <Carousel opts={{ align: "start" }} className="w-full px-10">
                    <CarouselContent className="-ml-4">
                      {resultItems.map((chunk, index) => (
                        <CarouselItem key={index} className="pl-4 basis-full">
                          <div className="grid grid-cols-2 gap-4">
                            {chunk}
                          </div>
                        </CarouselItem>
                      ))}
                    </CarouselContent>
                    {resultItems.length > 1 && (
                      <>
                        <CarouselPrevious className="absolute left-0 top-1/2 -translate-y-1/2" />
                        <CarouselNext className="absolute right-0 top-1/2 -translate-y-1/2" />
                      </>
                    )}
                  </Carousel>
                ) : (
                   <div className="flex flex-col items-center justify-center min-h-[150px] text-center">
                    <Beaker className="w-16 h-16 text-muted-foreground/30 mb-4" />
                    <p className="text-muted-foreground">
                      {error ? "Corrija o erro para ver os resultados" : "Os resultados serão exibidos aqui"}
                    </p>
                  </div>
                )}
             </div>
          </Card>
        </div>

        {/* Aviso de cálculo parcial */}
        {results && results.aviso && !isCalculating && (
          <Alert className="animate-in fade-in slide-in-from-bottom-4 duration-500 bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900" style={{ animationDelay: '250ms' }}>
            <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-500" />
            <AlertDescription className="text-amber-800 dark:text-amber-200 ml-2">
              {results.aviso}
            </AlertDescription>
          </Alert>
        )}

        {/* Card de Interpretação */}
        {results && !results.erro && !isCalculating && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: '300ms' }}>
            <ResultInterpretation results={results} />
          </div>
        )}

        {/* Dialog para salvar cálculo */}
        <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Salvar Cálculo</DialogTitle>
              <DialogDescription>
                Dê um nome para este cálculo para encontrá-lo facilmente depois.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="save-name">Nome do Cálculo</Label>
                <Input
                  id="save-name"
                  value={saveName}
                  onChange={(e) => setSaveName(e.target.value)}
                  placeholder="Ex: Análise Solo Argiloso - Obra X"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleConfirmSave();
                  }}
                />
              </div>
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

        <ExportPDFDialog
          open={exportPDFDialogOpen}
          onOpenChange={setExportPDFDialogOpen}
          fileName={pdfFileName}
          onFileNameChange={setPdfFileName}
          onConfirm={handleConfirmExportPDF}
          isExporting={isExportingPDF}
        />

        {/* Dialog para carregar cálculos salvos */}
        <SavedCalculations
          open={loadDialogOpen}
          onOpenChange={setLoadDialogOpen}
          calculations={calculations}
          onLoad={handleLoadCalculation}
          onDelete={deleteCalculation}
          onRename={renameCalculation}
          moduleName="Índices Físicos"
        />
      </div>
    </TooltipProvider>
  );
}

// Wrapper principal que escolhe versão mobile ou desktop
export default function IndicesFisicos() {
  return (
    <MobileModuleWrapper mobileVersion={<IndicesFisicosMobile />}>
      <IndicesFisicosDesktop />
    </MobileModuleWrapper>
  );
}

// Componente ResultItem
interface ResultItemProps {
    label: string;
    value: number | string | null;
    unit: string;
    infoKey: keyof typeof conteudoIndicesFisicos;
    settings: AppSettings;
}
function ResultItem({ label, value, unit, infoKey, settings }: ResultItemProps) {
  const content = conteudoIndicesFisicos[infoKey];
  const displayValue = typeof value === 'number' ? formatNumber(value, settings) : value ?? "-";

  if ((value === null && typeof value !== 'string') || !content) return null;

  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-background/50 border border-border/50 min-h-[56px]">
      <div className="flex items-center gap-1.5">
        <span className="text-sm font-medium text-muted-foreground">{label}</span>
        {settings.showEducationalTips && (
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="h-5 w-5 text-muted-foreground hover:text-primary rounded-full">
                <Info className="h-3.5 w-3.5" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 z-50" side="top" align="start">
              <div className="space-y-2">
                <h4 className="font-semibold leading-none text-base">{label}</h4>
                {settings.showFormulas && content?.formula && (
                  <div className="text-sm font-mono bg-muted p-2 rounded border border-border/50">{content.formula}</div>
                )}
                <p className="text-sm text-muted-foreground">{content?.descricao}</p>
                {content?.valoresTipicos && <p className="text-xs text-muted-foreground italic pt-1"><strong>Valores Típicos:</strong> {content.valoresTipicos}</p>}
                {content?.paginaPDF && (
                   <p className="text-xs text-muted-foreground pt-1">
                      <a href="#" onClick={(e) => { e.preventDefault(); alert(`Consultar página ${content.paginaPDF} do PDF "4. Indices_Fisicos_2022-Maro.pdf" para mais detalhes.`); }} className="underline hover:text-primary">
                        Ref. PDF pág. {content.paginaPDF}
                      </a>
                   </p>
                )}
              </div>
            </PopoverContent>
          </Popover>
        )}
      </div>
      <span className="text-base font-semibold text-primary text-right pl-2">{displayValue} {unit}</span>
    </div>
  );
}