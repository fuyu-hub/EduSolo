import { useState, useEffect } from "react";
import { Filter, Info, Calculator as CalcIcon, Plus, Trash2, Table as TableIcon, TrendingUp, GraduationCap, Activity, BarChart3 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { calcularGranulometria } from "@/lib/calculations/granulometria";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
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
import SeletorPeneiras from "@/components/granulometria/SeletorPeneiras";
import DialogExemplos from "@/components/granulometria/DialogExemplos";
import PlasticityChart from "@/components/visualizations/PlasticityChart";
import { ExemploGranulometria } from "@/lib/exemplos-granulometria";
import { MobileModuleWrapper } from "@/components/mobile";
import GranulometriaMobile from "./mobile/GranulometriaMobile";

// Cálculos agora são feitos localmente no frontend

interface PeneiraDado {
  abertura: string;
  massaRetida: string;
  peneira?: string;
}

interface FormData {
  massaTotal: string;
  peneiras: PeneiraDado[];
  limitePercent: string;
  limitePlasticidade: string;
}

// Interface alinhada com o backend (GranulometriaOutput)
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
  const { startTour } = useTour();
  const toursEnabled = useToursEnabled();
  const { addReport } = useRecentReports();
  const navigate = useNavigate();
  const [formData, setFormData] = useState<FormData>({
    massaTotal: "",
    peneiras: [],
    limitePercent: "",
    limitePlasticidade: "",
  });

  const [results, setResults] = useState<Results | null>(null);
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
      target: "#massaTotal",
      title: "⚖️ Massa Total da Amostra",
      content: "Insira a massa total da amostra seca utilizada no ensaio de granulometria (NBR 7181). Este valor é fundamental para calcular as porcentagens.",
      placement: "right",
      spotlightPadding: 12,
    },
    {
      target: "[data-tour='peneiras-input']",
      title: "🔍 Dados das Peneiras",
      content: "Adicione as peneiras utilizadas no ensaio e as massas retidas em cada uma. Use o botão de sugestão para carregar conjuntos padrão de peneiras ou adicione manualmente.",
      placement: "left",
      spotlightPadding: 12,
    },
    {
      target: "#ll",
      title: "💧 Limites de Atterberg (Opcional)",
      content: "Para obter classificações mais precisas e visualizar a posição na Carta de Plasticidade, forneça os Limites de Liquidez (LL) e Plasticidade (LP). Com esses dados, o sistema plotará automaticamente o ponto na Carta de Casagrande!",
      placement: "left",
      spotlightPadding: 12,
    },
    {
      target: "[data-tour='btn-analisar']",
      title: "⚡ Analisar Granulometria",
      content: "Após preencher os dados, clique aqui para processar a análise. O sistema calculará a curva granulométrica, diâmetros característicos e fornecerá as classificações.",
      placement: "top",
      spotlightPadding: 12,
    },
    {
      target: "[data-tour='classificacoes']",
      title: "🏷️ Classificações Automáticas (USCS + HRB)",
      content: "O sistema fornece automaticamente ambas as classificações USCS e HRB/AASHTO. Quando o solo está em zonas de transição, a classificação dupla é indicada (ex: CL-ML, GW-GM). Com LL e LP, você também verá a posição na Carta de Plasticidade!",
      placement: "top",
      spotlightPadding: 12,
    },
    {
      target: "[data-tour='composicao']",
      title: "📐 Composição Granulométrica",
      content: "Veja a distribuição percentual entre pedregulho, areia e finos (silte + argila) do solo analisado.",
      placement: "top",
      spotlightPadding: 12,
    },
    {
      target: "[data-tour='diametros']",
      title: "🔬 Diâmetros Característicos",
      content: "D10 (diâmetro efetivo), D30 e D60 são fundamentais. Os coeficientes Cu e Cc indicam a uniformidade e curvatura da granulometria.",
      placement: "top",
      spotlightPadding: 12,
    },
    {
      target: "[data-tour='curva-tab']",
      title: "📈 Análise Granulométrica Completa",
      content: "Visualize a curva granulométrica, tabela de dados detalhados, composição e a Carta de Plasticidade de Casagrande em abas separadas.",
      placement: "top",
      spotlightPadding: 12,
    },
    {
      target: "[data-tour='carta-tab']",
      title: "🎯 Carta de Plasticidade (USCS)",
      content: "Veja a Carta de Casagrande! Esta carta plota graficamente a classificação de solos finos baseada nos Limites de Liquidez (LL) e Plasticidade (LP).",
      placement: "top",
      spotlightPadding: 12,
      action: () => setActiveTab("carta"), // Trocar para a aba da carta automaticamente
    },
    {
      target: "[data-tour='carta-interativa']",
      title: "🗺️ Zonas da Carta Interativas",
      content: "A carta mostra diferentes zonas coloridas (CL, ML, CH, MH, CL-ML). Clique em qualquer zona colorida para ver informações detalhadas sobre aquela classificação! O ponto vermelho marca a posição do seu solo com coordenadas (LL, IP).",
      placement: "bottom",
      spotlightPadding: 12,
    },
    {
      target: "[data-tour='actions']",
      title: "💾 Salvar e Exportar",
      content: "Salve suas análises para consulta posterior ou exporte em PDF/Excel. O botão de exemplos carrega ensaios pré-configurados para você explorar!",
      placement: "bottom",
      spotlightPadding: 12,
    },
  ];

  // Iniciar tour automaticamente na primeira visita
  useEffect(() => {
    // Verificar se tours estão globalmente desabilitados
    if (!toursEnabled) return;
    
    const hasSeenTour = localStorage.getItem('tour-seen-granulometria');
    if (hasSeenTour === 'true') return;
    
    // Usar timeout inicial para carregar exemplo
    const timerLoad = setTimeout(() => {
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
    }, 500);
    
    // Calcular após o estado ser atualizado
    const timerCalc = setTimeout(async () => {
      await handleCalculate();
    }, 1500);
    
    // Iniciar tour após cálculo completar
    const timerTour = setTimeout(() => {
      startTour(tourSteps, "granulometria");
    }, 3500);
    
    return () => {
      clearTimeout(timerLoad);
      clearTimeout(timerCalc);
      clearTimeout(timerTour);
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

  const handlePeneiraChange = (index: number, field: keyof PeneiraDado, value: string) => {
    const newPeneiras = [...formData.peneiras];
    newPeneiras[index][field] = value;
    setFormData((prev) => ({ ...prev, peneiras: newPeneiras }));
  };

  const addPeneira = () => {
    setFormData((prev) => ({
      ...prev,
      peneiras: [...prev.peneiras, { abertura: "", massaRetida: "" }],
    }));
  };

  const removePeneira = (index: number) => {
    if (formData.peneiras.length > 1) {
      const newPeneiras = formData.peneiras.filter((_, i) => i !== index);
      setFormData((prev) => ({ ...prev, peneiras: newPeneiras }));
    }
  };

  const handleCalculate = async () => {
    if (!formData.massaTotal) {
      toast.error("Massa total não informada", { description: "Por favor, informe a massa total da amostra seca utilizada no ensaio." });
      return;
    }

    const peneirasValidas = formData.peneiras.filter((p) => p.abertura && p.massaRetida);
    if (peneirasValidas.length === 0) {
      toast.error("Peneiras não informadas", { description: "Adicione pelo menos uma peneira com abertura e massa retida." });
      return;
    }

    setIsCalculating(true);

    try {
      // Preparar payload para a API
      const payload = {
        massa_total: parseFloat(formData.massaTotal),
        peneiras: peneirasValidas.map((p) => ({
          abertura: parseFloat(p.abertura),
          massa_retida: parseFloat(p.massaRetida),
          peneira: p.peneira,
        })),
        ll: formData.limitePercent ? parseFloat(formData.limitePercent) : null,
        lp: formData.limitePlasticidade ? parseFloat(formData.limitePlasticidade) : null,
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
      massaTotal: "",
      peneiras: [
        { abertura: "", massaRetida: "" },
        { abertura: "", massaRetida: "" },
      ],
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

    // Atualizar formulário com dados do exemplo
    setFormData({
      massaTotal: exemplo.massaTotal.toString(),
      peneiras: peneirasFormatadas,
      limitePercent: exemplo.ll?.toString() || "",
      limitePlasticidade: exemplo.lp?.toString() || "",
    });

    // Limpar resultados anteriores
    setResults(null);

    toast.success("Exemplo carregado!", { description: `Dados de "${exemplo.nome}" foram preenchidos automaticamente.` });
  };

  const handleStartTour = async () => {
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
        { aberturaMM: 0.074, massaRetida: 30 },
      ],
      ll: 25,
      lp: 18,
    };
    
    handleCarregarExemplo(exemploParaTour as any);
    
    await new Promise(resolve => setTimeout(resolve, 300));
    await handleCalculate();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    startTour(tourSteps, "granulometria", true);
    toast.success("Tour iniciado!", { description: "Exemplo carregado automaticamente para demonstração." });
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
      // Salvar relatório com metadados (inclui pdfData para mobile)
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
        
        toast.success("PDF exportado com sucesso e salvo nos relatórios!");
        setExportPDFDialogOpen(false);
        
        // Navegar para a aba de relatórios
        navigate('/relatorios');
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
      { label: "Massa Total (g)", value: formData.massaTotal },
    ];
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
    if (results.percentagem_pedregulho !== null) resultadosData.push({ label: "% Pedregulho", value: results.percentagem_pedregulho.toFixed(1) });
    if (results.percentagem_areia !== null) resultadosData.push({ label: "% Areia", value: results.percentagem_areia.toFixed(1) });
    if (results.percentagem_finos !== null) resultadosData.push({ label: "% Finos", value: results.percentagem_finos.toFixed(1) });
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
            <div className="grid lg:grid-cols-3 gap-4">
              {/* Coluna 1 - Massa Total e Limites */}
              <div className="space-y-3">
                {/* Massa Total */}
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="massaTotal" className="text-xs">Massa Total (g)</Label>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="w-4 h-4 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p>{tooltips.massaTotal}</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <Input
                    id="massaTotal"
                    type="number"
                    step="0.01"
                    value={formData.massaTotal}
                    onChange={(e) => handleInputChange("massaTotal", e.target.value)}
                    placeholder="Ex: 1000.00"
                    className="h-8 text-sm"
                  />
                </div>

                {/* Limites (opcional) */}
                <div className="space-y-2 p-2 rounded-lg bg-accent/5 border border-accent/20">
                  <Label className="text-xs font-semibold">Limites (para classificação)</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-0.5">
                      <Label htmlFor="ll" className="text-[10px]">LL (%)</Label>
                      <Input
                        id="ll"
                        type="number"
                        step="0.1"
                        value={formData.limitePercent}
                        onChange={(e) => handleInputChange("limitePercent", e.target.value)}
                        placeholder="Ex: 45"
                        className="h-7 text-xs"
                      />
                    </div>
                    <div className="space-y-0.5">
                      <Label htmlFor="lp" className="text-[10px]">LP (%)</Label>
                      <Input
                        id="lp"
                        type="number"
                        step="0.1"
                        value={formData.limitePlasticidade}
                        onChange={(e) => handleInputChange("limitePlasticidade", e.target.value)}
                        placeholder="Ex: 25"
                        className="h-7 text-xs"
                      />
                    </div>
                  </div>
                </div>

                {/* Resumo Rápido */}
                {formData.peneiras.length > 0 && (
                  <div className="p-3 rounded-lg bg-gradient-to-br from-muted/50 to-muted/30 border border-muted">
                    <p className="text-xs font-semibold mb-2 text-muted-foreground uppercase">Resumo Rápido</p>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Peneiras:</span>
                        <span className="font-bold">{formData.peneiras.length}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Com massa:</span>
                        <span className="font-bold">
                          {formData.peneiras.filter(p => p.massaRetida && parseFloat(p.massaRetida) > 0).length}
                        </span>
                      </div>
                      {formData.massaTotal && formData.peneiras.some(p => p.massaRetida) && (
                        <>
                          <div className="flex justify-between items-center pt-2 border-t border-muted-foreground/20">
                            <span className="text-muted-foreground">Massa Total:</span>
                            <span className="font-bold">{parseFloat(formData.massaTotal).toFixed(2)} g</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">Massa Retida:</span>
                            <span className="font-bold">
                              {formData.peneiras
                                .reduce((sum, p) => sum + (parseFloat(p.massaRetida) || 0), 0)
                                .toFixed(2)} g
                            </span>
                          </div>
                          {(() => {
                            const massaTotal = parseFloat(formData.massaTotal);
                            const massaRetida = formData.peneiras.reduce((sum, p) => sum + (parseFloat(p.massaRetida) || 0), 0);
                            const perda = massaTotal - massaRetida;
                            const percPerda = (perda / massaTotal) * 100;
                            
                            return (
                              <div className="flex justify-between items-center">
                                <span className="text-muted-foreground">Diferença:</span>
                                <span className={`font-bold ${Math.abs(percPerda) > 1 ? 'text-amber-600 dark:text-amber-400' : 'text-green-600 dark:text-green-400'}`}>
                                  {perda.toFixed(2)} g ({percPerda.toFixed(2)}%)
                                </span>
                              </div>
                            );
                          })()}
                        </>
                      )}
                    </div>
                  </div>
                )}

                {/* Botões */}
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button onClick={handleCalculate} disabled={!formData.massaTotal || isCalculating} className="flex-1 h-10 text-sm" data-tour="btn-analisar">
                    <CalcIcon className="w-4 h-4 mr-1.5" />
                    {isCalculating ? "Analisando..." : "Analisar"}
                  </Button>
                  <Button onClick={handleClear} variant="outline" className="h-10 text-sm w-full sm:w-auto">
                    Limpar
                  </Button>
                </div>
              </div>

              {/* Coluna 2 e 3 - Peneiras (ocupa 2 colunas) */}
              <div className="lg:col-span-2" data-tour="peneiras-input">
                <SeletorPeneiras 
                  peneiras={formData.peneiras}
                  onChange={(novasPeneiras) => setFormData(prev => ({ ...prev, peneiras: novasPeneiras }))}
                />
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
                                {results.classificacao_uscs.includes('-') && (
                                  <span className="text-[8px] text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/40 px-1.5 py-0.5 rounded-full font-bold animate-pulse">
                                    DUPLA
                                  </span>
                                )}
                                <span className="text-[8px] text-fuchsia-600 dark:text-fuchsia-400 bg-fuchsia-100 dark:bg-fuchsia-900/30 px-1.5 py-0.5 rounded font-semibold">
                                  Unified
                                </span>
                              </div>
                            </div>
                            <p className="text-xl font-bold bg-gradient-to-r from-fuchsia-600 to-purple-600 bg-clip-text text-transparent mb-1">
                              {results.classificacao_uscs}
                            </p>
                            <p className="text-[11px] text-foreground/80 leading-tight">{results.descricao_uscs}</p>
                            
                            {/* Explicação da classificação dupla */}
                            {results.classificacao_uscs.includes('-') && (
                              <div className="mt-2 pt-2 border-t border-fuchsia-500/20">
                                <p className="text-[10px] text-fuchsia-700 dark:text-fuchsia-300 font-semibold mb-1">
                                  🔄 Classificação Dupla
                                </p>
                                <p className="text-[10px] text-foreground/70 leading-tight">
                                  {results.classificacao_uscs.includes('CL-ML') || results.classificacao_uscs.includes('ML-CL') 
                                    ? 'Solo na zona de transição entre argila e silte. O ponto está próximo à Linha A ou na zona CL-ML (IP 4-7).'
                                    : results.classificacao_uscs.match(/[GS][WP]-[GS][MC]/)
                                    ? 'Solo com 5-12% de finos. Classificação baseada em graduação + plasticidade dos finos.'
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
                              {results.indice_grupo_hrb !== null && results.indice_grupo_hrb > 0 && (
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
                      {results.percentagem_pedregulho !== null ? results.percentagem_pedregulho.toFixed(1) : "N/A"}%
                    </p>
                  </div>
                  <div className="p-2 rounded-lg bg-gradient-to-br from-yellow-100 to-amber-200 dark:from-yellow-900/40 dark:to-amber-900/40 border border-yellow-400 dark:border-yellow-700 text-center">
                    <p className="text-[9px] text-yellow-900 dark:text-yellow-300 mb-0.5 font-medium">Areia</p>
                    <p className="text-base font-bold text-yellow-800 dark:text-yellow-200">
                      {results.percentagem_areia !== null ? results.percentagem_areia.toFixed(1) : "N/A"}%
                    </p>
                  </div>
                  <div className="p-2 rounded-lg bg-gradient-to-br from-orange-100 to-red-200 dark:from-orange-900/40 dark:to-red-900/40 border border-orange-400 dark:border-orange-700 text-center">
                    <p className="text-[9px] text-orange-900 dark:text-orange-300 mb-0.5 font-medium">Finos</p>
                    <p className="text-base font-bold text-orange-800 dark:text-orange-200">
                      {results.percentagem_finos !== null ? results.percentagem_finos.toFixed(1) : "N/A"}%
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
                        <TabsList className="grid w-[560px] grid-cols-4">
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
                          d10={results.d10}
                          d30={results.d30}
                          d60={results.d60}
                        />
                      </TabsContent>
                      
                      <TabsContent value="dados" className="mt-0">
                        <TabelaDadosGranulometricos 
                          dados={results.dados_granulometricos}
                          massaTotal={parseFloat(formData.massaTotal)}
                          showComposicao={false}
                        />
                      </TabsContent>

                      <TabsContent value="composicao" className="mt-0">
                        <TabelaDadosGranulometricos 
                          dados={results.dados_granulometricos}
                          massaTotal={parseFloat(formData.massaTotal)}
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
          </CardContent>
        </Card>
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
        isExporting={isExportingPDF}
      />

      <SavedCalculations
        open={loadDialogOpen}
        onOpenChange={setLoadDialogOpen}
        calculations={calculations}
        onLoad={handleLoadCalculation}
        onDelete={deleteCalculation}
        onRename={renameCalculation}
        moduleName="Granulometria"
      />
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
