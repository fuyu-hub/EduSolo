import { useState, useEffect } from "react";
import { Filter, Info, Calculator as CalcIcon, Plus, Trash2, Table as TableIcon, TrendingUp, GraduationCap, Activity, BarChart3 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { calcularGranulometria } from "@/lib/calculations/granulometria";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/sonner";
import { useSavedCalculations } from "@/hooks/use-saved-calculations";
import { useSettings } from "@/hooks/use-settings";
import { useTheme } from "@/hooks/use-theme";
import { useRecentReports } from "@/hooks/useRecentReports";
import { useTour, TourStep } from "@/contexts/TourContext";
import SavedCalculations from "@/components/SavedCalculations";
import { useToursEnabled } from "@/components/WelcomeDialog";
import SaveDialog from "@/components/SaveDialog";
import ExportPDFDialog from "@/components/ExportPDFDialog";
import PrintHeader from "@/components/PrintHeader";
import CalculationActions from "@/components/CalculationActions";
import { exportToPDF, exportToExcel, ExportData, ExcelExportData, formatNumberForExport, captureChartAsImage, generateDefaultPDFFileName } from "@/lib/export-utils";
import { prepareReportForStorage } from "@/lib/reportManager";
import TabelaDadosGranulometricos from "@/components/granulometria/TabelaDadosGranulometricos";
import CurvaGranulometrica from "@/components/granulometria/CurvaGranulometrica";
import DialogExemplos from "@/components/granulometria/DialogExemplos";
import PlasticityChart from "@/components/visualizations/PlasticityChart";
import { ExemploGranulometria } from "@/lib/exemplos-granulometria";
import { MobileModuleWrapper } from "@/components/mobile";
import GranulometriaMobile from "./mobile/GranulometriaMobile";
import type { GranulometriaOutput, PontoGranulometrico } from "@/modules/granulometria/schemas";

// Cálculos agora são feitos localmente no frontend

interface PeneiraDado {
  abertura: string;
  massaRetida: string;
  peneira?: string;
}

interface PeneiramentoGrossoData {
  massa_total_umida: string;
  massa_total_seca: string;
  teor_umidade: string;
  massa_graos: string;
  peneiras: PeneiraDado[];
}

interface PeneiramentoFinoData {
  massa_total_umida: string;
  massa_total_seca: string;
  teor_umidade: string;
  peneiras: PeneiraDado[];
}

interface FormData {
  peneiramento_grosso: PeneiramentoGrossoData;
  peneiramento_fino: PeneiramentoFinoData;
  limitePercent: string;
  limitePlasticidade: string;
}

// Interface alinhada com o backend (GranulometriaOutput)
// PontoGranulometrico e GranulometriaOutput importados de schemas.ts

const tooltips = {
  massaTotal: "Massa total da amostra seca utilizada no ensaio (NBR 7181)",
  abertura: "Abertura nominal da peneira em mm (série normal: 50, 38, 25, 19, 9.5, 4.8, 2.0, 1.2, 0.6, 0.42, 0.25, 0.15, 0.075)",
  massaRetida: "Massa de solo retida nesta peneira após peneiramento",
  d10: "Diâmetro efetivo - 10% do material passa por esta abertura",
  d30: "Diâmetro correspondente a 30% passante",
  d60: "Diâmetro correspondente a 60% passante",
  cu: "Coeficiente de Uniformidade: Cu = D60/D10 (bem graduado se Cu > 4 para areias, Cu > 6 para pedregulhos)",
  cc: "Coeficiente de Curvatura: Cc = (D30)²/(D10×D60) (bem graduado se 1 < Cc < 3)",
};

const peneirasComuns = [
  { nome: '2"', abertura: 50.8 },
  { nome: '1 1/2"', abertura: 38.1 },
  { nome: '1"', abertura: 25.4 },
  { nome: '3/4"', abertura: 19.1 },
  { nome: '3/8"', abertura: 9.52 },
  { nome: 'Nº 4', abertura: 4.76 },
  { nome: 'Nº 10', abertura: 2.0 },
  { nome: 'Nº 16', abertura: 1.19 },
  { nome: 'Nº 30', abertura: 0.59 },
  { nome: 'Nº 40', abertura: 0.42 },
  { nome: 'Nº 60', abertura: 0.25 },
  { nome: 'Nº 100', abertura: 0.149 },
  { nome: 'Nº 200', abertura: 0.075 },
];

function GranulometriaDesktop() {
  const { settings } = useSettings();
  const { theme } = useTheme();
  const { startTour, suggestTour } = useTour();
  const toursEnabled = useToursEnabled();
  const { addReport } = useRecentReports();
  const navigate = useNavigate();
  const [formData, setFormData] = useState<FormData>({
    peneiramento_grosso: {
      massa_total_umida: "",
      massa_total_seca: "",
      teor_umidade: "",
      massa_graos: "",
      peneiras: [
        { abertura: "50.8", massaRetida: "", peneira: '2"' },
        { abertura: "38.1", massaRetida: "", peneira: '1 1/2"' },
        { abertura: "25.4", massaRetida: "", peneira: '1"' },
        { abertura: "19.1", massaRetida: "", peneira: '3/4"' },
        { abertura: "9.52", massaRetida: "", peneira: '3/8"' },
        { abertura: "4.76", massaRetida: "", peneira: 'Nº 4' },
        { abertura: "2.0", massaRetida: "", peneira: 'Nº 10' },
      ],
    },
    peneiramento_fino: {
      massa_total_umida: "",
      massa_total_seca: "",
      teor_umidade: "",
      peneiras: [
        { abertura: "1.19", massaRetida: "", peneira: 'Nº 16' },
        { abertura: "0.59", massaRetida: "", peneira: 'Nº 30' },
        { abertura: "0.42", massaRetida: "", peneira: 'Nº 40' },
        { abertura: "0.25", massaRetida: "", peneira: 'Nº 60' },
        { abertura: "0.149", massaRetida: "", peneira: 'Nº 100' },
        { abertura: "0.075", massaRetida: "", peneira: 'Nº 200' },
      ],
    },
    limitePercent: "",
    limitePlasticidade: "",
  });

  const [results, setResults] = useState<GranulometriaOutput | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  // Estados para salvamento
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [saveName, setSaveName] = useState("");
  const [loadDialogOpen, setLoadDialogOpen] = useState(false);
  const { calculations, saveCalculation, deleteCalculation, renameCalculation } = useSavedCalculations("granulometria");

  // Estados para exportação PDF
  const [exportPDFDialogOpen, setExportPDFDialogOpen] = useState(false);
  const [pdfFileName, setPdfFileName] = useState("");
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("curva");
  const [pdfSavedDialogOpen, setPdfSavedDialogOpen] = useState(false);

  // Definição dos steps do tour
  const tourSteps: TourStep[] = [
    {
      target: "[data-tour='module-header']",
      title: "📊 Bem-vindo à Granulometria!",
      content: "Este módulo permite analisar a distribuição de tamanho de partículas do solo e obter classificações automáticas pelos sistemas USCS e AASHTO/HRB.",
      placement: "bottom",
      spotlightPadding: 16,
    },
    {
      target: "[data-tour='peneiras-grosso']",
      title: "1️⃣ Peneiramento Grosso",
      content: "Comece inserindo os dados da fração grossa. Preencha a Massa Total Úmida e Seca, e as massas retidas nas peneiras acima de 2.0mm.",
      placement: "right",
      spotlightPadding: 12,
    },
    {
      target: "[data-tour='massa-grosso-input']",
      title: "⚖️ Massas e Umidade",
      content: "O sistema calcula automaticamente a umidade se você fornecer as massas úmida e seca. Ou você pode inserir a umidade diretamente.",
      placement: "bottom",
      spotlightPadding: 12,
    },
    {
      target: "[data-tour='peneiras-fino']",
      title: "2️⃣ Peneiramento Fino",
      content: "Em seguida, insira os dados da fração fina (abaixo de 2.0mm). Especifique a massa utilizada para este ensaio específico.",
      placement: "left",
      spotlightPadding: 12,
    },
    {
      target: "#ll",
      title: "3️⃣ Limites (Opcional)",
      content: "Para obter a classificação completa (incluindo Carta de Plasticidade), insira o Limite de Liquidez (LL) e o Limite de Plasticidade (LP).",
      placement: "top",
      spotlightPadding: 12,
    },
    {
      target: "[data-tour='btn-analisar']",
      title: "🚀 Analisar",
      content: "Clique aqui para processar os dados. O sistema gerará a curva granulométrica, tabelas e classificações.",
      placement: "top",
      spotlightPadding: 12,
    },
    {
      target: "[data-tour='classificacoes']",
      title: "🏷️ Resultados",
      content: "Veja aqui as classificações USCS e HRB geradas automaticamente.",
      placement: "top",
      spotlightPadding: 12,
    },
    {
      target: "[data-tour='curva-tab']",
      title: "📈 Gráficos e Tabelas",
      content: "Explore a curva granulométrica interativa e os dados detalhados nas abas abaixo.",
      placement: "top",
      spotlightPadding: 12,
    },
  ];

  // Sugerir tour via toast na primeira visita
  useEffect(() => {
    // Verificar se tours estão globalmente desabilitados
    if (!toursEnabled) return;

    let toastId: string | number | undefined;

    const timer = setTimeout(() => {
      // Preparação: carregar exemplo e calcular
      const prepareForTour = async () => {
        const exemploParaTour = {
          nome: "Areia Siltosa",
          massaTotal: 500,
          peneiras: [
            { aberturaMM: 9.52, massaRetida: 0 },
            { aberturaMM: 4.76, massaRetida: 5 },
            { aberturaMM: 2.0, massaRetida: 45 },
            { aberturaMM: 1.19, massaRetida: 85 },
            { aberturaMM: 0.59, massaRetida: 120 },
            { aberturaMM: 0.42, massaRetida: 95 },
            { aberturaMM: 0.25, massaRetida: 65 },
            { aberturaMM: 0.149, massaRetida: 40 },
            { aberturaMM: 0.075, massaRetida: 30 },
          ],
          ll: 25,
          lp: 18,
        };
        handleCarregarExemplo(exemploParaTour as any);
        await new Promise(resolve => setTimeout(resolve, 500));
        await handleCalculate();
        await new Promise(resolve => setTimeout(resolve, 800));
      };

      // Sugerir tour com toast
      toastId = suggestTour(tourSteps, "granulometria", "Granulometria", prepareForTour);
    }, 1000);

    return () => {
      clearTimeout(timer);
      if (toastId) {
        toast.dismiss(toastId);
      }
    };
  }, [toursEnabled]);

  // Restaurar dados quando vier de "Gerar" em Relatórios
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem('granulometria_lastData');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.formData) setFormData(parsed.formData);
        if (parsed?.results) setResults(parsed.results);
        sessionStorage.removeItem('granulometria_lastData');
        toast.success("Dados do relatório carregados!");
      }
    } catch (error) {
      console.error('Erro ao restaurar dados do relatório:', error);
    }
  }, []);

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handlePeneiraChange = (index: number, field: keyof PeneiraDado, value: string, tipo: 'grosso' | 'fino') => {
    setFormData((prev) => {
      const newFormData = { ...prev };
      if (tipo === 'grosso') {
        const newPeneiras = [...newFormData.peneiramento_grosso.peneiras];
        newPeneiras[index][field] = value;
        newFormData.peneiramento_grosso.peneiras = newPeneiras;
      } else {
        const newPeneiras = [...newFormData.peneiramento_fino.peneiras];
        newPeneiras[index][field] = value;
        newFormData.peneiramento_fino.peneiras = newPeneiras;
      }
      return newFormData;
    });
  };

  // Funções auxiliares para cálculo de umidade
  const calcularUmidade = (umida: string, seca: string) => {
    const mUmida = parseFloat(umida);
    const mSeca = parseFloat(seca);
    if (!isNaN(mUmida) && !isNaN(mSeca) && mSeca > 0) {
      return ((mUmida - mSeca) / mSeca * 100).toFixed(2);
    }
    return "";
  };

  const calcularMassaSeca = (umida: string, teor: string) => {
    const mUmida = parseFloat(umida);
    const tUmidade = parseFloat(teor);
    if (!isNaN(mUmida) && !isNaN(tUmidade)) {
      return (mUmida / (1 + tUmidade / 100)).toFixed(2);
    }
    return "";
  };

  const handleMassaChange = (tipo: 'grosso' | 'fino', field: 'massa_total_umida' | 'massa_total_seca' | 'teor_umidade', value: string) => {
    setFormData(prev => {
      const newData = { ...prev };
      const target = tipo === 'grosso' ? newData.peneiramento_grosso : newData.peneiramento_fino;

      target[field] = value;

      // Auto-cálculo
      if (field === 'massa_total_umida' || field === 'massa_total_seca') {
        if (target.massa_total_umida && target.massa_total_seca) {
          target.teor_umidade = calcularUmidade(target.massa_total_umida, target.massa_total_seca);
        }
      } else if (field === 'teor_umidade' && target.massa_total_umida) {
        target.massa_total_seca = calcularMassaSeca(target.massa_total_umida, value);
      }

      return newData;
    });
  };

  const handleCalculate = async () => {
    if (!formData.peneiramento_grosso.massa_total_seca) {
      toast.error("Massa total seca não informada", {
        description: "Por favor, informe a massa total seca da amostra utilizada no ensaio."
      });
      return;
    }

    const peneirasValidas = formData.peneiramento_grosso.peneiras.filter((p) => p.abertura && p.massaRetida);
    if (peneirasValidas.length === 0) {
      toast.error("Peneiras não informadas", {
        description: "Adicione pelo menos uma peneira com abertura e massa retida."
      });
      return;
    }

    setIsCalculating(true);

    try {
      // Preparar payload para a API
      const payload = {
        peneiramento_grosso: {
          massa_total_umida: parseFloat(formData.peneiramento_grosso.massa_total_umida) || 0,
          massa_total_seca: parseFloat(formData.peneiramento_grosso.massa_total_seca),
          teor_umidade: formData.peneiramento_grosso.teor_umidade ? parseFloat(formData.peneiramento_grosso.teor_umidade) : undefined,
          massa_graos: parseFloat(formData.peneiramento_grosso.massa_graos),
          peneiras: peneirasValidas.map((p) => ({
            abertura: parseFloat(p.abertura),
            massa_retida: parseFloat(p.massaRetida),
            peneira: p.peneira,
          })),
        },
        peneiramento_fino: {
          massa_total_umida: parseFloat(formData.peneiramento_fino.massa_total_umida) || 0,
          massa_total_seca: parseFloat(formData.peneiramento_fino.massa_total_seca),
          teor_umidade: formData.peneiramento_fino.teor_umidade ? parseFloat(formData.peneiramento_fino.teor_umidade) : undefined,
          peneiras: formData.peneiramento_fino.peneiras
            .filter((p) => p.abertura && p.massaRetida)
            .map((p) => ({
              abertura: parseFloat(p.abertura),
              massa_retida: parseFloat(p.massaRetida),
              peneira: p.peneira,
            })),
        },
        ll: formData.limitePercent ? parseFloat(formData.limitePercent) : undefined,
        lp: formData.limitePlasticidade ? parseFloat(formData.limitePlasticidade) : undefined,
      };

      // Calcular localmente no frontend
      const resultado = calcularGranulometria(payload);

      if (resultado.erro) {
        toast.error("Erro no cálculo", { description: resultado.erro });
      } else {
        setResults(resultado);
        toast.success("Análise concluída com sucesso!", { description: "A granulometria foi calculada e as classificações estão disponíveis." });
      }
    } catch (error) {
      if (error instanceof Error) {
        toast.error("Erro no cálculo", { description: error.message });
      } else {
        toast.error("Erro ao calcular", { description: "Verifique se todos os dados estão corretos e tente novamente." });
      }
    } finally {
      setIsCalculating(false);
    }
  };

  const handleClear = () => {
    setFormData({
      peneiramento_grosso: {
        massa_total_umida: "",
        massa_total_seca: "",
        teor_umidade: "",
        massa_graos: "",
        peneiras: [
          { abertura: "50.8", massaRetida: "", peneira: '2"' },
          { abertura: "38.1", massaRetida: "", peneira: '1 1/2"' },
          { abertura: "25.4", massaRetida: "", peneira: '1"' },
          { abertura: "19.1", massaRetida: "", peneira: '3/4"' },
          { abertura: "9.52", massaRetida: "", peneira: '3/8"' },
          { abertura: "4.76", massaRetida: "", peneira: 'Nº 4' },
          { abertura: "2.0", massaRetida: "", peneira: 'Nº 10' },
        ],
      },
      peneiramento_fino: {
        massa_total_umida: "",
        massa_total_seca: "",
        teor_umidade: "",
        peneiras: [
          { abertura: "1.19", massaRetida: "", peneira: 'Nº 16' },
          { abertura: "0.59", massaRetida: "", peneira: 'Nº 30' },
          { abertura: "0.42", massaRetida: "", peneira: 'Nº 40' },
          { abertura: "0.25", massaRetida: "", peneira: 'Nº 60' },
          { abertura: "0.149", massaRetida: "", peneira: 'Nº 100' },
          { abertura: "0.075", massaRetida: "", peneira: 'Nº 200' },
        ],
      },
      limitePercent: "",
      limitePlasticidade: "",
    });
    setResults(null);
  };

  // Funções de salvamento e exportação
  const handleSaveClick = () => {
    if (!results) return;
    setSaveName(`Cálculo ${new Date().toLocaleDateString('pt-BR')}`);
    setSaveDialogOpen(true);
  };

  const handleConfirmSave = () => {
    if (!results || !saveName.trim()) return;
    const success = saveCalculation(saveName.trim(), formData, results);
    if (success) {
      toast.success("Cálculo salvo!", { description: "A análise foi salva e pode ser carregada posteriormente." });
      setSaveDialogOpen(false);
      setSaveName("");
    } else {
      toast.error("Erro ao salvar", { description: "Não foi possível salvar a análise granulométrica." });
    }
  };

  const handleLoadCalculation = (calculation: any) => {
    setFormData(calculation.formData);
    setResults(calculation.results);
    toast.success("Cálculo carregado!", { description: `"${calculation.name}" foi restaurado com sucesso.` });
  };

  const handleCarregarExemplo = (exemplo: ExemploGranulometria) => {
    // Converter peneiras do exemplo para o formato do formulário
    const peneirasFormatadas: PeneiraDado[] = exemplo.peneiras.map(p => ({
      abertura: p.aberturaMM.toString(),
      massaRetida: p.massaRetida.toString()
    }));

    // Separar peneiras grossas (até #10 = 2.0mm) e finas (abaixo de 2.0mm)
    const peneirasGrossas = peneirasFormatadas.filter(p => parseFloat(p.abertura) >= 2.0);
    const peneirasFinas = peneirasFormatadas.filter(p => parseFloat(p.abertura) < 2.0);

    // Calcular massa de grãos (retida até #10)
    const massaGraos = peneirasGrossas.reduce((sum, p) => sum + parseFloat(p.massaRetida), 0);

    // Calcular massa fina (passa na #10)
    const massaFina = exemplo.massaTotal - massaGraos;

    // Atualizar formulário com dados do exemplo
    // IMPORTANTE: Definir todos os campos de massa (úmida, seca, umidade) para evitar inconsistências
    setFormData({
      peneiramento_grosso: {
        massa_total_umida: exemplo.massaTotal.toString(),
        massa_total_seca: exemplo.massaTotal.toString(),
        teor_umidade: "0.00", // Assumindo seco para exemplo
        massa_graos: massaGraos.toString(),
        peneiras: peneirasGrossas.length > 0 ? peneirasGrossas : [{ abertura: "", massaRetida: "" }],
      },
      peneiramento_fino: {
        massa_total_umida: massaFina.toString(),
        massa_total_seca: massaFina.toString(),
        teor_umidade: "0.00", // Assumindo seco para exemplo
        peneiras: peneirasFinas.length > 0 ? peneirasFinas : [{ abertura: "", massaRetida: "" }],
      },
      limitePercent: exemplo.ll?.toString() || "",
      limitePlasticidade: exemplo.lp?.toString() || "",
    });

    // Limpar resultados anteriores
    setResults(null);

    toast.success("Exemplo carregado!", { description: `Dados de "${exemplo.nome}" foram preenchidos automaticamente.` });
  };

  const handleStartTour = async () => {
    // Carregar exemplo para o tour
    const exemploParaTour = {
      nome: "Areia Siltosa",
      massaTotal: 500,
      peneiras: [
        { aberturaMM: 9.52, massaRetida: 0 },
        { aberturaMM: 4.76, massaRetida: 5 },
        { aberturaMM: 2.0, massaRetida: 45 },
        { aberturaMM: 1.19, massaRetida: 85 },
        { aberturaMM: 0.59, massaRetida: 120 },
        { aberturaMM: 0.42, massaRetida: 95 },
        { aberturaMM: 0.25, massaRetida: 65 },
        { aberturaMM: 0.149, massaRetida: 40 },
        { aberturaMM: 0.075, massaRetida: 30 },
      ],
      ll: 25,
      lp: 18,
    };

    handleCarregarExemplo(exemploParaTour as any);

    // Pequeno delay para garantir renderização antes de iniciar o tour
    setTimeout(() => {
      startTour(tourSteps, "granulometria", true);
      toast.success("Tour iniciado!", { description: "Siga os passos para aprender a usar o módulo." });
    }, 500);
  };

  const handleExportPDF = () => {
    if (!results) return;

    // Gerar nome padrão usando a função auxiliar
    const defaultName = generateDefaultPDFFileName("Granulometria e Classificação");

    setPdfFileName(defaultName);
    setExportPDFDialogOpen(true);
  };

  const handleConfirmExportPDF = async () => {
    if (!results) return;

    setIsExportingPDF(true);

    // Capturar imagem do gráfico ampliado em alta qualidade
    toast.info("Capturando gráfico em alta qualidade...");
    const chartImage = await captureChartAsImage('curva-granulometrica-ampliada');

    if (!chartImage) {
      console.warn("Gráfico não foi capturado corretamente");
      toast.warning("Gráfico não incluído no PDF");
    } else {
      console.log("Gráfico capturado com sucesso");
    }

    // Dados de entrada como valores simples
    const inputs: { label: string; value: string }[] = [
      { label: "Massa Total Seca", value: `${formData.peneiramento_grosso.massa_total_seca} g` },
    ];
    if (formData.peneiramento_grosso.massa_total_umida) {
      inputs.push({ label: "Massa Total Úmida", value: `${formData.peneiramento_grosso.massa_total_umida} g` });
    }
    if (formData.peneiramento_grosso.teor_umidade) {
      inputs.push({ label: "Teor de Umidade", value: `${formData.peneiramento_grosso.teor_umidade}%` });
    }
    if (formData.peneiramento_grosso.massa_graos) {
      inputs.push({ label: "Massa dos Grãos", value: `${formData.peneiramento_grosso.massa_graos} g` });
    }
    if (formData.peneiramento_fino?.massa_total_seca) {
      inputs.push({ label: "Massa Fina Seca", value: `${formData.peneiramento_fino.massa_total_seca} g` });
    }
    if (formData.limitePercent) inputs.push({ label: "Limite de Liquidez (LL)", value: `${formData.limitePercent}%` });
    if (formData.limitePlasticidade) inputs.push({ label: "Limite de Plasticidade (LP)", value: `${formData.limitePlasticidade}%` });

    // Lista vazia de resultados (vamos usar tabelas ao invés)
    const resultsList: { label: string; value: string; highlight?: boolean }[] = [];

    // Preparar todas as tabelas
    const tables = [];

    // TABELA 1: Dados de Entrada - Peneiras Grossas
    const peneirasHeaders = ["Peneira", "Abertura (mm)", "Massa Retida (g)"];
    const peneirasRows = formData.peneiramento_grosso.peneiras
      .filter(p => p.abertura && p.massaRetida)
      .map((p, i) => [
        `#${i + 1}`,
        p.abertura,
        p.massaRetida
      ]);

    if (peneirasRows.length > 0) {
      tables.push({
        title: "Dados de Entrada - Peneiras Grossas",
        headers: peneirasHeaders,
        rows: peneirasRows
      });
    }

    // TABELA 2: Dados de Entrada - Peneiras Finas
    if (formData.peneiramento_fino && formData.peneiramento_fino.peneiras.length > 0) {
      const peneirasFinasRows = formData.peneiramento_fino.peneiras
        .filter(p => p.abertura && p.massaRetida)
        .map((p, i) => [
          `#${i + 1}`,
          p.abertura,
          p.massaRetida
        ]);

      if (peneirasFinasRows.length > 0) {
        tables.push({
          title: "Dados de Entrada - Peneiras Finas",
          headers: peneirasHeaders,
          rows: peneirasFinasRows
        });
      }
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
          (results.indice_grupo_hrb !== undefined && results.indice_grupo_hrb > 0 ? ` (IG: ${results.indice_grupo_hrb})` : '');
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
    if (results.percentagem_pedregulho !== undefined || results.percentagem_areia !== undefined || results.percentagem_finos !== undefined) {
      const composicaoHeaders = ["Fração", "Faixa de Tamanho", "Percentual (%)"];
      const composicaoRows = [];

      if (results.percentagem_pedregulho !== undefined) {
        composicaoRows.push(["Pedregulho", "> 2.0 mm", formatNumberForExport(results.percentagem_pedregulho, 1)]);
      }
      if (results.percentagem_areia !== undefined) {
        composicaoRows.push(["Areia", "0.075 - 2.0 mm", formatNumberForExport(results.percentagem_areia, 1)]);
      }
      if (results.percentagem_finos !== undefined) {
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

    // Fórmulas utilizadas
    const formulas = [
      {
        label: "Percentual Retido",
        formula: "% Retida = (Massa Retida / Massa Total) × 100",
        description: "Percentual da massa retida em cada peneira em relação à massa total"
      },
      {
        label: "Percentual Retido Acumulado",
        formula: "% Retida Acumulada = Σ (% Retida até a peneira)",
        description: "Soma acumulada dos percentuais retidos até cada peneira"
      },
      {
        label: "Percentual Passante",
        formula: "% Passante = 100 - % Retida Acumulada",
        description: "Percentual que passa por cada peneira"
      },
      {
        label: "Diâmetro Efetivo (D10, D30, D60)",
        formula: "Dn = diâmetro correspondente a n% passante na curva granulométrica",
        description: "Diâmetros característicos obtidos da curva granulométrica"
      },
      {
        label: "Coeficiente de Uniformidade (Cu)",
        formula: "Cu = D60 / D10",
        description: "Indica a uniformidade da distribuição granulométrica. Cu > 4 indica graduação bem distribuída"
      },
      {
        label: "Coeficiente de Curvatura (Cc)",
        formula: "Cc = (D30)² / (D10 × D60)",
        description: "Indica a forma da curva granulométrica. 1 < Cc < 3 indica boa graduação"
      },
    ];

    if (formData.limitePercent && formData.limitePlasticidade) {
      formulas.push({
        label: "Índice de Plasticidade (IP)",
        formula: "IP = LL - LP",
        description: "Diferença entre o Limite de Liquidez e o Limite de Plasticidade"
      });
    }

    const exportData: ExportData = {
      moduleName: "granulometria",
      moduleTitle: "Granulometria e Classificação",
      inputs,
      results: resultsList,
      formulas,
      tables,
      chartImage: chartImage || undefined,
      customFileName: pdfFileName,
      theme,
      printSettings: settings.printSettings
    };

    console.log("Dados para exportação:", {
      numInputs: inputs.length,
      numTables: tables.length,
      tablesTitles: tables.map(t => t.title),
      hasChart: !!chartImage,
      fileName: pdfFileName
    });

    toast.info("Gerando PDF...");
    const result = await exportToPDF(exportData, true); // returnBlob = true

    setIsExportingPDF(false);

    if (result instanceof Blob) {
      try {
        const reportName = pdfFileName.replace('.pdf', '');
        const prepared = await prepareReportForStorage({
          name: reportName,
          moduleType: 'granulometria',
          moduleName: 'Granulometria e Classificação',
          pdfBlob: result,
          calculationData: {
            formData,
            results,
            exportDate: new Date().toISOString()
          }
        });
        addReport(prepared);
        setExportPDFDialogOpen(false);
        toast.success("Relatório salvo. PDF disponível em Relatórios.");
        setPdfSavedDialogOpen(true);
      } catch (error) {
        console.error('Erro ao salvar relatório:', error);
        toast.error("PDF exportado mas não foi possível salvar nos relatórios.");
      }
    } else {
      toast.error("Erro ao exportar PDF.");
    }
  };

  const handleExportExcel = async () => {
    if (!results) return;

    // Sheet de Entrada
    const entradaData: { label: string; value: string | number }[] = [
      { label: "Massa Total Seca (g)", value: formData.peneiramento_grosso.massa_total_seca },
    ];
    if (formData.peneiramento_grosso.massa_total_umida) {
      entradaData.push({ label: "Massa Total Úmida (g)", value: formData.peneiramento_grosso.massa_total_umida });
    }
    if (formData.peneiramento_grosso.teor_umidade) {
      entradaData.push({ label: "Teor de Umidade (%)", value: formData.peneiramento_grosso.teor_umidade });
    }
    if (formData.peneiramento_grosso.massa_graos) {
      entradaData.push({ label: "Massa dos Grãos (g)", value: formData.peneiramento_grosso.massa_graos });
    }
    if (formData.peneiramento_fino?.massa_total_seca) {
      entradaData.push({ label: "Massa Fina Seca (g)", value: formData.peneiramento_fino.massa_total_seca });
    }
    if (formData.limitePercent) entradaData.push({ label: "Limite de Liquidez (%)", value: formData.limitePercent });
    if (formData.limitePlasticidade) entradaData.push({ label: "Limite de Plasticidade (%)", value: formData.limitePlasticidade });

    // Sheet de Resultados
    const resultadosData: { label: string; value: string | number }[] = [];
    if (results.classificacao_uscs) {
      resultadosData.push({ label: "Classificação USCS", value: results.classificacao_uscs });
      if (results.descricao_uscs) resultadosData.push({ label: "Descrição USCS", value: results.descricao_uscs });
    }
    if (results.classificacao_hrb) {
      resultadosData.push({ label: "Classificação HRB", value: results.classificacao_hrb });
      if (results.descricao_hrb) resultadosData.push({ label: "Descrição HRB", value: results.descricao_hrb });
      if (results.avaliacao_subleito_hrb) resultadosData.push({ label: "Avaliação Subleito", value: results.avaliacao_subleito_hrb });
    }
    if (results.percentagem_pedregulho !== undefined) resultadosData.push({ label: "% Pedregulho", value: results.percentagem_pedregulho.toFixed(1) });
    if (results.percentagem_areia !== undefined) resultadosData.push({ label: "% Areia", value: results.percentagem_areia.toFixed(1) });
    if (results.percentagem_finos !== undefined) resultadosData.push({ label: "% Finos", value: results.percentagem_finos.toFixed(1) });
    if (results.d10) resultadosData.push({ label: "D10 (mm)", value: results.d10.toFixed(4) });
    if (results.d30) resultadosData.push({ label: "D30 (mm)", value: results.d30.toFixed(4) });
    if (results.d60) resultadosData.push({ label: "D60 (mm)", value: results.d60.toFixed(4) });
    if (results.coef_uniformidade) resultadosData.push({ label: "Coeficiente de Uniformidade (Cu)", value: results.coef_uniformidade.toFixed(2) });
    if (results.coef_curvatura) resultadosData.push({ label: "Coeficiente de Curvatura (Cc)", value: results.coef_curvatura.toFixed(2) });

    // Tabela granulométrica
    const tableHeaders = ["Peneira", "Abertura (mm)", "Massa Retida (g)", "% Retida", "% Retida Ac.", "% Passante"];
    const tableRows = results.dados_granulometricos.map(d => [
      d.peneira || '-',
      d.abertura.toFixed(3),
      d.massa_retida.toFixed(2),
      d.porc_retida.toFixed(2),
      d.porc_retida_acum.toFixed(2),
      d.porc_passante.toFixed(2)
    ]);

    const excelData: ExcelExportData = {
      moduleName: "granulometria",
      moduleTitle: "Granulometria e Classificação",
      sheets: [
        { name: "Dados de Entrada", data: entradaData },
        { name: "Resultados", data: resultadosData }
      ],
      tables: [{
        title: "Dados Granulométricos",
        headers: tableHeaders,
        rows: tableRows
      }]
    };

    const success = await exportToExcel(excelData);
    if (success) {
      toast.success("Excel exportado com sucesso!");
    } else {
      toast.error("Erro ao exportar Excel.");
    }
  };

  return (
    <div className="space-y-3 sm:space-y-4 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <PrintHeader moduleTitle="Granulometria e Classificação" moduleName="granulometria" />

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 animate-in fade-in slide-in-from-left-4 duration-500" data-tour="module-header">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-gradient-to-br from-purple-500 via-purple-600 to-indigo-600 flex items-center justify-center shadow-lg transition-transform hover:scale-110 hover:rotate-3">
            <Filter className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Granulometria e Classificação</h1>
            <p className="text-xs sm:text-sm text-muted-foreground">Análise granulométrica e classificação USCS/HRB</p>
          </div>
        </div>

        <div className="flex items-center gap-2" data-tour="actions">
          <DialogExemplos onCarregarExemplo={handleCarregarExemplo} />

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

      {/* Formulário - Largura total */}
      <Card className="glass p-4 sm:p-6 animate-in fade-in slide-in-from-left-4 duration-700" style={{ animationDelay: '100ms', animationFillMode: 'backwards' }}>
        <CardHeader className="pb-3 px-0">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Info className="w-4 h-4 sm:w-5 sm:h-5" />
            Dados do Ensaio
          </CardTitle>
        </CardHeader>
        <CardContent className="px-0">
          <TooltipProvider>
            <div className="space-y-4">
              <div className="grid lg:grid-cols-2 gap-6">
                {/* Coluna 1 - Peneiras Grossas */}
                <div className="space-y-3 flex flex-col" data-tour="peneiras-grosso">
                  <div className="p-4 rounded-lg bg-card border shadow-sm flex-1">
                    <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-orange-500 shadow-sm shadow-orange-500/50"></span>
                      Peneiramento Grosso
                    </h3>

                    {/* Inputs de Massa Grosso */}
                    <div className="grid grid-cols-3 gap-3 mb-6 bg-muted/30 p-3 rounded-md border border-muted/50" data-tour="massa-grosso-input">
                      <div className="space-y-1.5">
                        <Label className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Massa Úmida (g)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={formData.peneiramento_grosso.massa_total_umida}
                          onChange={(e) => handleMassaChange('grosso', 'massa_total_umida', e.target.value)}
                          placeholder="Ex: 1000.0"
                          className="h-8 text-sm bg-background"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Massa Seca (g)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={formData.peneiramento_grosso.massa_total_seca}
                          onChange={(e) => handleMassaChange('grosso', 'massa_total_seca', e.target.value)}
                          placeholder="Ex: 950.0"
                          className="h-8 text-sm bg-background"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Umidade (%)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={formData.peneiramento_grosso.teor_umidade}
                          onChange={(e) => handleMassaChange('grosso', 'teor_umidade', e.target.value)}
                          placeholder="Ex: 5.2"
                          className="h-8 text-sm bg-background"
                        />
                      </div>
                    </div>

                    <div className="space-y-3">
                      {formData.peneiramento_grosso.peneiras.map((peneira, index) => (
                        <div key={index} className="flex items-center gap-3 group">
                          <div className="w-20 text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                            {peneira.peneira}
                          </div>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            value={peneira.massaRetida}
                            onChange={(e) => handlePeneiraChange(index, "massaRetida", e.target.value, 'grosso')}
                            className="h-9 text-sm"
                          />
                          <div className="w-16 text-[10px] text-muted-foreground text-right font-mono">
                            {peneira.abertura} mm
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Coluna 2 - Peneiras Finas + Limites */}
                <div className="space-y-3 flex flex-col" data-tour="peneiras-fino">
                  {/* Peneiramento Fino */}
                  <div className="p-4 rounded-lg bg-card border shadow-sm">
                    <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-sm shadow-blue-500/50"></span>
                      Peneiramento Fino
                    </h3>

                    {/* Inputs de Massa Fino */}
                    <div className="grid grid-cols-3 gap-3 mb-6 bg-muted/30 p-3 rounded-md border border-muted/50">
                      <div className="space-y-1.5">
                        <Label className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Massa Úmida (g)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={formData.peneiramento_fino.massa_total_umida}
                          onChange={(e) => handleMassaChange('fino', 'massa_total_umida', e.target.value)}
                          placeholder="Ex: 100.0"
                          className="h-8 text-sm bg-background"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Massa Seca (g)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={formData.peneiramento_fino.massa_total_seca}
                          onChange={(e) => handleMassaChange('fino', 'massa_total_seca', e.target.value)}
                          placeholder="Ex: 95.0"
                          className="h-8 text-sm bg-background"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Umidade (%)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={formData.peneiramento_fino.teor_umidade}
                          onChange={(e) => handleMassaChange('fino', 'teor_umidade', e.target.value)}
                          placeholder="Ex: 5.2"
                          className="h-8 text-sm bg-background"
                        />
                      </div>
                    </div>

                    <div className="space-y-3">
                      {formData.peneiramento_fino.peneiras.map((peneira, index) => (
                        <div key={index} className="flex items-center gap-3 group">
                          <div className="w-20 text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                            {peneira.peneira}
                          </div>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            value={peneira.massaRetida}
                            onChange={(e) => handlePeneiraChange(index, "massaRetida", e.target.value, 'fino')}
                            className="h-9 text-sm"
                          />
                          <div className="w-16 text-[10px] text-muted-foreground text-right font-mono">
                            {peneira.abertura} mm
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Limites (Opcional) - Aproveitando o espaço */}
                  <div className="p-4 rounded-lg bg-card border shadow-sm border-accent/30 flex-1">
                    <div className="flex items-center gap-2 mb-3">
                      <Label className="text-sm font-semibold">Limites (Opcional)</Label>
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="w-3.5 h-3.5 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Limites de Liquidez (LL) e Plasticidade (LP) para classificação USCS/HRB</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label htmlFor="ll" className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">LL (%)</Label>
                        <Input
                          id="ll"
                          type="number"
                          step="0.1"
                          value={formData.limitePercent}
                          onChange={(e) => handleInputChange("limitePercent", e.target.value)}
                          placeholder="Ex: 45"
                          className="h-9 text-sm bg-background"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="lp" className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">LP (%)</Label>
                        <Input
                          id="lp"
                          type="number"
                          step="0.1"
                          value={formData.limitePlasticidade}
                          onChange={(e) => handleInputChange("limitePlasticidade", e.target.value)}
                          placeholder="Ex: 25"
                          className="h-9 text-sm bg-background"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Botões de Ação - Abaixo do Grid */}
              <div className="flex gap-3 pt-2">
                <Button
                  onClick={handleCalculate}
                  disabled={!formData.peneiramento_grosso.massa_total_seca || isCalculating}
                  className="h-11 px-8 text-base font-semibold flex-[3]"
                  data-tour="btn-analisar"
                >
                  <CalcIcon className="w-5 h-5 mr-2" />
                  {isCalculating ? "Analisando..." : "Analisar"}
                </Button>
                <Button onClick={handleClear} variant="outline" className="h-11 px-6 flex-1">
                  Limpar
                </Button>
              </div>
            </div>
          </TooltipProvider>
        </CardContent>
      </Card>

      {/* Resultados - Abaixo do formulário */}
      {results && (
        <Card className="glass p-4 sm:p-6 animate-in fade-in slide-in-from-bottom-4 duration-700" style={{ animationDelay: '200ms', animationFillMode: 'backwards' }}>
          <CardHeader className="pb-3 px-0">
            <CardTitle className="text-base sm:text-lg">Resultados da Análise</CardTitle>
          </CardHeader>
          <CardContent className="px-0">
            {isCalculating ? (
              <div className="grid grid-cols-4 gap-2">
                {[...Array(8)].map((_, i) => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {/* Resultados Numéricos em Linha */}
                <div className="space-y-2">
                  {/* Classificações - Horizontal */}
                  {(results.classificacao_uscs || results.classificacao_hrb) && (
                    <div className="grid lg:grid-cols-2 gap-3" data-tour="classificacoes">
                      {/* Classificação USCS */}
                      {results.classificacao_uscs && (
                        <div className="p-3 rounded-lg bg-gradient-to-br from-fuchsia-500/10 to-purple-600/10 border-2 border-fuchsia-500/30 shadow-sm hover:shadow-md transition-shadow">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-1.5">
                              <div className="w-1.5 h-1.5 rounded-full bg-fuchsia-500"></div>
                              <p className="text-[10px] font-bold text-fuchsia-700 dark:text-fuchsia-400 uppercase tracking-wide">
                                Sistema USCS
                              </p>
                            </div>
                            <div className="flex items-center gap-1">
                              {(results.classificacao_uscs.includes('-') || results.classificacao_uscs.includes('/')) && (
                                <span className="text-[8px] text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/40 px-1.5 py-0.5 rounded-full font-bold animate-pulse">
                                  DUPLA
                                </span>
                              )}
                              <span className="text-[8px] text-fuchsia-600 dark:text-fuchsia-400 bg-fuchsia-100 dark:bg-fuchsia-900/30 px-1.5 py-0.5 rounded font-semibold">
                                Unified
                              </span>
                            </div>
                          </div>
                          {results.classificacao_uscs.includes('/') ? (
                            <div className="mb-1 space-y-0.5">
                              {results.classificacao_uscs.split('/').map((c, idx) => (
                                <div key={idx} className="text-xl font-bold bg-gradient-to-r from-fuchsia-600 to-purple-600 bg-clip-text text-transparent">
                                  {c}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-xl font-bold bg-gradient-to-r from-fuchsia-600 to-purple-600 bg-clip-text text-transparent mb-1">
                              {results.classificacao_uscs}
                            </p>
                          )}
                          <p className="text-[11px] text-foreground/80 leading-tight">{results.descricao_uscs}</p>

                          {/* Explicação da classificação dupla */}
                          {(results.classificacao_uscs.includes('-') || results.classificacao_uscs.includes('/')) && (
                            <div className="mt-2 pt-2 border-t border-fuchsia-500/20">
                              <p className="text-[10px] text-fuchsia-700 dark:text-fuchsia-300 font-semibold mb-1">
                                🔄 Classificação Dupla
                              </p>
                              <p className="text-[10px] text-foreground/70 leading-tight">
                                {results.classificacao_uscs.includes('CL-ML') || results.classificacao_uscs.includes('ML-CL')
                                  ? 'Solo na zona de transição entre argila e silte. O ponto está próximo à Linha A ou na zona CL-ML (IP 4-7).'
                                  : (results.classificacao_uscs.match(/[GS][WP]-[GS][MC]/) || results.classificacao_uscs.includes('/'))
                                    ? 'Solo com 5–12% de finos (borderline). Classificação baseada em graduação (W/P) + plasticidade dos finos (M/C).'
                                    : results.classificacao_uscs.includes('CL-CH') || results.classificacao_uscs.includes('CH-CL')
                                      ? 'Argila próxima à transição entre baixa e alta plasticidade (LL próximo a 50%).'
                                      : results.classificacao_uscs.includes('ML-MH') || results.classificacao_uscs.includes('MH-ML')
                                        ? 'Silte próximo à transição entre baixa e alta plasticidade (LL próximo a 50%).'
                                        : results.classificacao_uscs.includes('CH-MH') || results.classificacao_uscs.includes('MH-CH')
                                          ? 'Solo de alta plasticidade próximo à Linha A. Características mistas de argila e silte.'
                                          : 'Solo com características em zona de transição entre classificações.'}
                              </p>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Classificação HRB/AASHTO */}
                      {results.classificacao_hrb && (
                        <div className="p-3 rounded-lg bg-gradient-to-br from-blue-500/10 to-cyan-600/10 border-2 border-blue-500/30 shadow-sm hover:shadow-md transition-shadow">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-1.5">
                              <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                              <p className="text-[10px] font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wide">
                                Sistema HRB/AASHTO
                              </p>
                            </div>
                            <div className="flex items-center gap-1">
                              {results.subgrupo_hrb && (
                                <span className="text-[8px] text-cyan-700 dark:text-cyan-400 bg-cyan-100 dark:bg-cyan-900/40 px-1.5 py-0.5 rounded-full font-bold">
                                  {results.grupo_hrb}-{results.subgrupo_hrb}
                                </span>
                              )}
                              <span className="text-[8px] text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30 px-1.5 py-0.5 rounded font-semibold">
                                Highway
                              </span>
                            </div>
                          </div>
                          <div className="flex items-baseline gap-2 mb-1">
                            <p className="text-xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                              {results.classificacao_hrb}
                            </p>
                            {results.indice_grupo_hrb !== undefined && results.indice_grupo_hrb > 0 && (
                              <span className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30 px-1.5 py-0.5 rounded">
                                IG:{results.indice_grupo_hrb}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-foreground/80 leading-tight mb-1.5">{results.descricao_hrb}</p>

                          {/* Explicação do subgrupo quando existe */}
                          {results.subgrupo_hrb && (
                            <div className="mt-2 pt-2 border-t border-blue-500/20">
                              <p className="text-[10px] text-blue-700 dark:text-blue-300 font-semibold mb-1">
                                📋 Subgrupo {results.subgrupo_hrb}
                              </p>
                              <p className="text-[10px] text-foreground/70 leading-tight">
                                {results.subgrupo_hrb === 'a'
                                  ? 'Material predominantemente pedregulho (granular grosso).'
                                  : results.subgrupo_hrb === 'b'
                                    ? 'Material predominantemente areia (granular fino).'
                                    : results.subgrupo_hrb === '4'
                                      ? 'Características siltosas. Material granular com finos não plásticos.'
                                      : results.subgrupo_hrb === '5'
                                        ? 'Características siltosas de alta compressibilidade.'
                                        : results.subgrupo_hrb === '6'
                                          ? 'Características argilosas. Material plástico.'
                                          : results.subgrupo_hrb === '7'
                                            ? 'Características argilosas de alta plasticidade.'
                                            : 'Subclassificação detalhada do material.'}
                              </p>
                            </div>
                          )}

                          {results.avaliacao_subleito_hrb && (
                            <p className="text-[10px] font-semibold text-blue-700 dark:text-blue-300 mt-2 pt-2 border-t border-blue-500/20">
                              🛣️ Subleito: {results.avaliacao_subleito_hrb}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Composição Granulométrica */}
                  <div className="grid lg:grid-cols-3 gap-2" data-tour="composicao">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 border border-gray-300 dark:border-gray-700 text-center">
                      <p className="text-[9px] text-muted-foreground mb-0.5 font-medium">Pedregulho</p>
                      <p className="text-base font-bold text-gray-700 dark:text-gray-300">
                        {results.percentagem_pedregulho !== undefined ? results.percentagem_pedregulho.toFixed(1) : "N/A"}%
                      </p>
                    </div>
                    <div className="p-2 rounded-lg bg-gradient-to-br from-yellow-100 to-amber-200 dark:from-yellow-900/40 dark:to-amber-900/40 border border-yellow-400 dark:border-yellow-700 text-center">
                      <p className="text-[9px] text-yellow-900 dark:text-yellow-300 mb-0.5 font-medium">Areia</p>
                      <p className="text-base font-bold text-yellow-800 dark:text-yellow-200">
                        {results.percentagem_areia !== undefined ? results.percentagem_areia.toFixed(1) : "N/A"}%
                      </p>
                    </div>
                    <div className="p-2 rounded-lg bg-gradient-to-br from-orange-100 to-red-200 dark:from-orange-900/40 dark:to-red-900/40 border border-orange-400 dark:border-orange-700 text-center">
                      <p className="text-[9px] text-orange-900 dark:text-orange-300 mb-0.5 font-medium">Finos</p>
                      <p className="text-base font-bold text-orange-800 dark:text-orange-200">
                        {results.percentagem_finos !== undefined ? results.percentagem_finos.toFixed(1) : "N/A"}%
                      </p>
                    </div>
                  </div>

                  {/* Diâmetros e Coeficientes - Grid horizontal */}
                  <div className="grid lg:grid-cols-5 gap-3" data-tour="diametros">
                    <ResultItem label="D10" value={results.d10 ? `${results.d10.toFixed(4)} mm` : "N/A"} tooltip={tooltips.d10} color="red" showTooltips={settings.showEducationalTips} />
                    <ResultItem label="D30" value={results.d30 ? `${results.d30.toFixed(4)} mm` : "N/A"} tooltip={tooltips.d30} color="amber" showTooltips={settings.showEducationalTips} />
                    <ResultItem label="D60" value={results.d60 ? `${results.d60.toFixed(4)} mm` : "N/A"} tooltip={tooltips.d60} color="green" showTooltips={settings.showEducationalTips} />
                    <ResultItem
                      label="Cu"
                      value={results.coef_uniformidade ? results.coef_uniformidade.toFixed(2) : "N/A"}
                      tooltip={tooltips.cu}
                      highlight
                      showTooltips={settings.showEducationalTips}
                    />
                    <ResultItem
                      label="Cc"
                      value={results.coef_curvatura ? results.coef_curvatura.toFixed(2) : "N/A"}
                      tooltip={tooltips.cc}
                      highlight
                      showTooltips={settings.showEducationalTips}
                    />
                  </div>
                </div>

                {/* Curva e Tabelas - Com Tabs */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full" data-tour="curva-tab">
                  <Card className="glass">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">Análise Granulométrica Completa</CardTitle>
                        <TabsList className="grid w-full grid-cols-4">
                          <TabsTrigger value="curva" className="text-xs">
                            <TrendingUp className="w-3 h-3 mr-1.5" />
                            Curva
                          </TabsTrigger>
                          <TabsTrigger value="dados" className="text-xs">
                            <TableIcon className="w-3 h-3 mr-1.5" />
                            Dados Detalhados
                          </TabsTrigger>
                          <TabsTrigger value="composicao" className="text-xs">
                            <BarChart3 className="w-3 h-3 mr-1.5" />
                            Composição
                          </TabsTrigger>
                          <TabsTrigger value="carta" className="text-xs" data-tour="carta-tab">
                            <Activity className="w-3 h-3 mr-1.5" />
                            Carta Plasticidade
                          </TabsTrigger>
                        </TabsList>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <TabsContent value="curva" className="mt-0">
                        <CurvaGranulometrica
                          dados={results.dados_granulometricos}
                          d10={results.d10 ?? null}
                          d30={results.d30 ?? null}
                          d60={results.d60 ?? null}
                        />
                      </TabsContent>

                      <TabsContent value="dados" className="mt-0">
                        <TabelaDadosGranulometricos
                          dados={results.dados_granulometricos}
                          showComposicao={false}
                        />
                      </TabsContent>

                      <TabsContent value="composicao" className="mt-0">
                        <TabelaDadosGranulometricos
                          dados={results.dados_granulometricos}
                          showDadosDetalhados={false}
                        />
                      </TabsContent>

                      <TabsContent value="carta" className="mt-0">
                        <div className="space-y-3">
                          <PlasticityChart
                            ll={formData.limitePercent ? parseFloat(formData.limitePercent) : null}
                            ip={formData.limitePercent && formData.limitePlasticidade
                              ? parseFloat(formData.limitePercent) - parseFloat(formData.limitePlasticidade)
                              : null}
                          />

                          {formData.limitePercent && formData.limitePlasticidade && (
                            <div className="p-3 rounded-lg bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border border-amber-200 dark:border-amber-800">
                              <p className="font-semibold mb-2 text-amber-900 dark:text-amber-300 text-xs">
                                💡 Classificação Dupla - Zonas de Transição
                              </p>
                              <div className="space-y-1.5 text-xs text-amber-900/90 dark:text-amber-300/90">
                                <p>
                                  • <strong>CL-ML:</strong> Solo na zona de transição entre argila e silte de baixa plasticidade (IP entre 4 e 7, abaixo da Linha A)
                                </p>
                                <p>
                                  • <strong>Classificação dupla automática:</strong> Quando o solo está próximo das linhas divisórias (Linha A ou LL=50), pode haver características mistas
                                </p>
                                <p>
                                  • <strong>Solos orgânicos:</strong> Representados como "ou OL" e "ou OH" nas respectivas zonas
                                </p>
                                <p className="pt-1 mt-1 border-t border-amber-200 dark:border-amber-800">
                                  <strong>Clique nas zonas coloridas</strong> para ver informações detalhadas de cada classificação!
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      </TabsContent>
                    </CardContent>
                  </Card>
                </Tabs>
              </div>
            )}


            {/* Dialogs */}
            <SaveDialog
              open={saveDialogOpen}
              onOpenChange={setSaveDialogOpen}
              saveName={saveName}
              onSaveNameChange={setSaveName}
              onConfirm={handleConfirmSave}
            />

            <ExportPDFDialog
              open={exportPDFDialogOpen}
              onOpenChange={setExportPDFDialogOpen}
              fileName={pdfFileName}
              onFileNameChange={setPdfFileName}
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
                      navigate('/relatorios');
                    }}
                  >
                    Ir para Relatórios
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <SavedCalculations
              open={loadDialogOpen}
              onOpenChange={setLoadDialogOpen}
              calculations={calculations}
              onLoad={handleLoadCalculation}
              onDelete={deleteCalculation}
              onRename={renameCalculation}
              moduleName="Granulometria"
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function ResultItem({
  label,
  value,
  tooltip,
  highlight = false,
  color,
  compact = false,
  showTooltips = true
}: {
  label: string;
  value: string;
  tooltip?: string;
  highlight?: boolean;
  color?: 'red' | 'amber' | 'green';
  compact?: boolean;
  showTooltips?: boolean;
}) {
  const colorClasses = {
    red: 'border-l-2 border-red-500 bg-red-50 dark:bg-red-950/30',
    amber: 'border-l-2 border-amber-500 bg-amber-50 dark:bg-amber-950/30',
    green: 'border-l-2 border-green-500 bg-green-50 dark:bg-green-950/30',
  };

  const baseClass = color
    ? colorClasses[color]
    : highlight
      ? "bg-primary/10 border border-primary/20"
      : "bg-accent/5 border border-accent/10";

  const padding = compact ? "p-1.5" : "p-2";
  const fontSize = compact ? "text-[10px]" : "text-xs";
  const valueFontSize = compact ? "text-xs" : "text-sm";

  return (
    <div className={`flex justify-between items-center ${padding} rounded ${baseClass}`}>
      <TooltipProvider>
        <span className={`${fontSize} font-medium text-muted-foreground flex items-center gap-1`}>
          {label}
          {showTooltips && tooltip && (
            <Tooltip>
              <TooltipTrigger>
                <Info className="w-2.5 h-2.5" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs text-xs">{tooltip}</TooltipContent>
            </Tooltip>
          )}
        </span>
      </TooltipProvider>
      <span className={`font-bold ${valueFontSize} ${highlight ? "text-primary" : "text-foreground"}`}>{value}</span>
    </div>
  );
}

// --- Wrapper Principal ---
export default function Granulometria() {
  return (
    <MobileModuleWrapper mobileVersion={<GranulometriaMobile />}>
      <GranulometriaDesktop />
    </MobileModuleWrapper>
  );
}
