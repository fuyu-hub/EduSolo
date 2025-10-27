// frontend/src/pages/Compactacao.tsx
import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Database, Info, Calculator as CalcIcon, Plus, Trash2, ChevronLeft, ChevronRight, AlertCircle, BarChart3, Save, FolderOpen, Download, Printer, GraduationCap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { useSavedCalculations } from "@/hooks/use-saved-calculations";
import { useSettings } from "@/hooks/use-settings";
import { useTheme } from "@/hooks/use-theme";
import { useTour, TourStep } from "@/contexts/TourContext";
import SavedCalculations from "@/components/SavedCalculations";
import SaveDialog from "@/components/SaveDialog";
import PrintHeader from "@/components/PrintHeader";
import CalculationActions from "@/components/CalculationActions";
import { exportToPDF, exportToExcel, ExportData, ExcelExportData, formatNumberForExport, generateDefaultPDFFileName } from "@/lib/export-utils";
import ExportPDFDialog from "@/components/ExportPDFDialog";
import CurvaCompactacao, { CurvaCompactacaoRef } from "@/components/compactacao/CurvaCompactacao";
import TabelaResultados from "@/components/compactacao/TabelaResultados";
import DialogExemplos from "@/components/compactacao/DialogExemplos";
import { ExemploCompactacao } from "@/lib/exemplos-compactacao";
import { MobileModuleWrapper } from "@/components/mobile";
import CompactacaoMobile from "./mobile/CompactacaoMobile";

// Schema de validação
const pontoCompactacaoSchema = z.object({
  id: z.string(),
  pesoAmostaCilindro: z.string().min(1, { message: "Campo obrigatório" }).refine(val => !isNaN(parseFloat(val)) && parseFloat(val) > 0, { message: "Deve ser maior que 0" }),
  pesoBrutoUmido: z.string().min(1, { message: "Campo obrigatório" }).refine(val => !isNaN(parseFloat(val)) && parseFloat(val) > 0, { message: "Deve ser maior que 0" }),
  pesoBrutoSeco: z.string().min(1, { message: "Campo obrigatório" }).refine(val => !isNaN(parseFloat(val)) && parseFloat(val) > 0, { message: "Deve ser maior que 0" }),
  tara: z.string().min(1, { message: "Campo obrigatório" }).refine(val => !isNaN(parseFloat(val)) && parseFloat(val) >= 0, { message: "Deve ser maior ou igual a 0" }),
}).refine(data => {
  const umido = parseFloat(data.pesoBrutoUmido);
  const seco = parseFloat(data.pesoBrutoSeco);
  return isNaN(umido) || isNaN(seco) || umido >= seco;
}, {
  message: "Peso úmido deve ser maior ou igual ao peso seco",
  path: ["pesoBrutoUmido"],
}).refine(data => {
  const seco = parseFloat(data.pesoBrutoSeco);
  const tara = parseFloat(data.tara);
  return isNaN(seco) || isNaN(tara) || seco >= tara;
}, {
  message: "Peso seco deve ser maior ou igual à tara",
  path: ["pesoBrutoSeco"],
});

const formSchema = z.object({
  volumeCilindro: z.string().min(1, { message: "Campo obrigatório" }).refine(val => !isNaN(parseFloat(val)) && parseFloat(val) > 0, { message: "Volume deve ser maior que 0" }),
  pesoCilindro: z.string().min(1, { message: "Campo obrigatório" }).refine(val => !isNaN(parseFloat(val)) && parseFloat(val) >= 0, { message: "Peso deve ser maior ou igual a 0" }),
  Gs: z.string().optional().refine(val => val === undefined || val === "" || (!isNaN(parseFloat(val)) && parseFloat(val) > 0), {
    message: "Gs deve ser maior que 0 (ou deixe vazio)",
  }),
  pesoEspecificoAgua: z.string().refine(val => !isNaN(parseFloat(val)) && parseFloat(val) > 0, { message: "Peso específico da água deve ser maior que 0" }),
  pontos: z.array(pontoCompactacaoSchema).min(3, { message: "São necessários no mínimo 3 pontos de ensaio" }),
});

type FormInputValues = z.infer<typeof formSchema>;

// Interfaces para API
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

const tooltips = {
  volumeCilindro: "Volume interno do cilindro/molde de compactação (cm³)",
  pesoCilindro: "Peso do cilindro vazio (g)",
  Gs: "Densidade dos grãos (opcional, necessário para curva S=100%)",
  pesoAmostaCilindro: "Peso da amostra compactada + cilindro (g)",
  pesoBrutoUmido: "Peso do recipiente + solo úmido para determinação de umidade (g)",
  pesoBrutoSeco: "Peso do recipiente + solo seco após estufa (g)",
  tara: "Peso do recipiente vazio (g)",
};

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Função para gerar IDs únicos (alternativa ao crypto.randomUUID para compatibilidade)
const generateId = () => `${Date.now()}-${Math.floor(Math.random() * 1000000)}`;

function CompactacaoDesktop() {
  const { toast: toastFn } = { toast };
  const { settings } = useSettings();
  const { theme } = useTheme();
  const { startTour } = useTour();
  const [currentPointIndex, setCurrentPointIndex] = useState(0);

  const form = useForm<FormInputValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      volumeCilindro: "982",
      pesoCilindro: "4100",
      Gs: "",
      pesoEspecificoAgua: "10.0",
      pontos: [
        { id: generateId(), pesoAmostaCilindro: "", pesoBrutoUmido: "", pesoBrutoSeco: "", tara: "" },
        { id: generateId(), pesoAmostaCilindro: "", pesoBrutoUmido: "", pesoBrutoSeco: "", tara: "" },
        { id: generateId(), pesoAmostaCilindro: "", pesoBrutoUmido: "", pesoBrutoSeco: "", tara: "" },
      ],
    },
    mode: "onBlur",
  });

  const { fields, append, remove } = useFieldArray({ control: form.control, name: "pontos", keyName: "fieldId" });

  const [results, setResults] = useState<Results | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // Estados para salvamento
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [saveName, setSaveName] = useState("");
  const [loadDialogOpen, setLoadDialogOpen] = useState(false);
  const { calculations, saveCalculation, deleteCalculation, renameCalculation } = useSavedCalculations("compactacao");

  // Estados para exportação PDF
  const [exportPDFDialogOpen, setExportPDFDialogOpen] = useState(false);
  const [pdfFileName, setPdfFileName] = useState("");
  const [isExportingPDF, setIsExportingPDF] = useState(false);

  // Ref para o gráfico de compactação
  const curvaCompactacaoRef = useRef<CurvaCompactacaoRef>(null);

  // Definição dos steps do tour
  const tourSteps: TourStep[] = [
    {
      target: "[data-tour='module-header']",
      title: "🔨 Bem-vindo ao Ensaio de Compactação!",
      content: "Este módulo permite analisar curvas de compactação (Proctor Normal ou Modificado), determinando a umidade ótima e o peso específico seco máximo do solo.",
      placement: "bottom",
      spotlightPadding: 16,
    },
    {
      target: "[data-tour='config-gerais']",
      title: "⚙️ Parâmetros Gerais",
      content: "Configure o volume e peso do cilindro de compactação. O Gs (densidade relativa dos grãos) é opcional, mas necessário para traçar a curva de saturação teórica (S=100%).",
      placement: "right",
      spotlightPadding: 12,
    },
    {
      target: "[data-tour='pontos-ensaio']",
      title: "📋 Pontos do Ensaio",
      content: "Adicione os pontos do ensaio (mínimo 3). Para cada ponto, registre: peso da amostra compactada + cilindro e as massas para determinação de umidade.",
      placement: "right",
      spotlightPadding: 12,
    },
    {
      target: "[data-tour='navegacao-pontos']",
      title: "◀️▶️ Navegação entre Pontos",
      content: "Use as setas para navegar entre os pontos. Adicione (+) ou remova (🗑️) pontos conforme necessário. Mais pontos resultam em uma curva mais precisa!",
      placement: "left",
      spotlightPadding: 12,
    },
    {
      target: "[data-tour='btn-calcular']",
      title: "⚡ Processar Ensaio",
      content: "Após preencher todos os pontos, clique aqui para processar o ensaio. O sistema traçará a curva de compactação e determinará automaticamente os parâmetros ótimos.",
      placement: "top",
      spotlightPadding: 12,
    },
    {
      target: "[data-tour='resultados']",
      title: "📊 Tabela de Resultados",
      content: "Visualize os dados calculados para cada ponto: umidade (w%) e peso específico seco (γd). O ponto ótimo é destacado em verde. Use as setas para navegar entre slides.",
      placement: "left",
      spotlightPadding: 12,
    },
    {
      target: "[data-tour='parametros-otimos']",
      title: "🎯 Parâmetros Ótimos",
      content: "Aqui estão os valores ótimos determinados: umidade ótima (w_ot) e peso específico seco máximo (γd,máx). Estes são essenciais para especificação de compactação em campo!",
      placement: "left",
      spotlightPadding: 12,
    },
    {
      target: "[data-tour='resultados']",
      title: "📈 Curva de Compactação",
      content: "No segundo slide, visualize a curva completa traçando umidade × γd. Se forneceu Gs, a curva de saturação S=100% também é exibida, mostrando o limite teórico.",
      placement: "left",
      spotlightPadding: 12,
    },
    {
      target: "[data-tour='actions']",
      title: "💾 Salvar e Exportar",
      content: "Salve seus ensaios para consulta posterior ou exporte em PDF/Excel. Use o botão de exemplos para carregar ensaios pré-configurados e explorar o módulo!",
      placement: "bottom",
      spotlightPadding: 12,
    },
  ];

  // Iniciar tour automaticamente na primeira visita
  useEffect(() => {
    const initTour = async () => {
      const hasSeenTour = localStorage.getItem('tour-seen-compactacao');
      if (hasSeenTour === 'true') return;
      
      // Carregar exemplo para demonstração (Areia Argilosa)
      const exemploParaTour = {
        icon: "🏜️",
        nome: "Areia Argilosa",
        descricao: "Curva típica de areia argilosa",
        volumeCilindro: "982",
        pesoCilindro: "4100",
        Gs: "2.68",
        pontos: [
          { id: generateId(), pesoAmostaCilindro: "6012.5", pesoBrutoUmido: "106.56", pesoBrutoSeco: "93.69", tara: "24.72" },
          { id: generateId(), pesoAmostaCilindro: "6102.0", pesoBrutoUmido: "115.23", pesoBrutoSeco: "100.14", tara: "28.65" },
          { id: generateId(), pesoAmostaCilindro: "6150.0", pesoBrutoUmido: "122.78", pesoBrutoSeco: "104.82", tara: "26.13" },
          { id: generateId(), pesoAmostaCilindro: "6138.0", pesoBrutoUmido: "118.44", pesoBrutoSeco: "99.28", tara: "25.87" },
          { id: generateId(), pesoAmostaCilindro: "6095.0", pesoBrutoUmido: "114.92", pesoBrutoSeco: "94.63", tara: "27.41" },
        ],
      };
      
      handleSelectExample(exemploParaTour as any);
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Submeter automaticamente
      form.handleSubmit(onSubmit)();
      
      await new Promise(resolve => setTimeout(resolve, 1200));
      
      startTour(tourSteps, "compactacao");
    };
    
    const timer = setTimeout(initTour, 800);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (fields.length > 0) {
      setCurrentPointIndex(prev => Math.min(prev, fields.length - 1));
    } else {
      setCurrentPointIndex(0);
    }
  }, [fields.length]);

  const addPonto = () => {
    append({ id: generateId(), pesoAmostaCilindro: "", pesoBrutoUmido: "", pesoBrutoSeco: "", tara: "" });
    setCurrentPointIndex(fields.length);
  };

  const removePonto = () => {
    if (fields.length > 3) {
      remove(currentPointIndex);
    } else {
      toast("São necessários pelo menos 3 pontos para o ensaio", { description: "Não é possível remover mais pontos" });
    }
  };

  const goToNextPoint = () => setCurrentPointIndex(prev => Math.min(prev + 1, fields.length - 1));
  const goToPreviousPoint = () => setCurrentPointIndex(prev => Math.max(prev - 1, 0));

  const handleClear = () => {
    form.reset({
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
    setCurrentPointIndex(0);
    setResults(null);
    setApiError(null);
  };

  const handleSelectExample = (example: ExemploCompactacao) => {
    const currentLength = fields.length;
    const targetLength = example.pontos.length;

    if (currentLength < targetLength) {
      for (let i = 0; i < targetLength - currentLength; i++) {
        append({ id: generateId(), pesoAmostaCilindro: "", pesoBrutoUmido: "", pesoBrutoSeco: "", tara: "" }, { shouldFocus: false });
      }
    } else if (currentLength > targetLength) {
      for (let i = currentLength - 1; i >= targetLength; i--) {
        remove(i);
      }
    }

    setTimeout(() => {
      form.reset({
        volumeCilindro: example.volumeCilindro,
        pesoCilindro: example.pesoCilindro,
        Gs: example.Gs || "",
        pesoEspecificoAgua: "10.0",
        pontos: example.pontos.map(p => ({ ...p, id: generateId() })),
      });
      setCurrentPointIndex(0);
      setResults(null);
      setApiError(null);
      toast(`${example.icon} ${example.nome} carregado!`, { description: example.descricao });
    }, 0);
  };

  const handleSaveClick = () => {
    if (!results) return;
    setSaveName(`Ensaio ${new Date().toLocaleDateString('pt-BR')}`);
    setSaveDialogOpen(true);
  };

  const handleConfirmSave = () => {
    if (!results || !saveName.trim()) return;
    const formData = form.getValues();
    const success = saveCalculation(saveName.trim(), formData, results);
    if (success) {
      toast("Ensaio salvo!", { description: "O ensaio foi salvo com sucesso." });
      setSaveDialogOpen(false);
      setSaveName("");
    } else {
      toast("Erro ao salvar", { description: "Não foi possível salvar o ensaio." });
    }
  };

  const handleLoadCalculation = (calculation: any) => {
    const data = calculation.formData;
    form.reset(data);
    setResults(calculation.results);
    setCurrentPointIndex(0);
    toast("Ensaio carregado!", { description: `"${calculation.name}" foi carregado com sucesso.` });
  };

  const handleStartTour = async () => {
    const exemploParaTour = {
      icon: "🏜️",
      nome: "Areia Argilosa",
      descricao: "Curva típica de areia argilosa",
      volumeCilindro: "982",
      pesoCilindro: "4100",
      Gs: "2.68",
      pontos: [
        { id: generateId(), pesoAmostaCilindro: "6012.5", pesoBrutoUmido: "106.56", pesoBrutoSeco: "93.69", tara: "24.72" },
        { id: generateId(), pesoAmostaCilindro: "6102.0", pesoBrutoUmido: "115.23", pesoBrutoSeco: "100.14", tara: "28.65" },
        { id: generateId(), pesoAmostaCilindro: "6150.0", pesoBrutoUmido: "122.78", pesoBrutoSeco: "104.82", tara: "26.13" },
        { id: generateId(), pesoAmostaCilindro: "6138.0", pesoBrutoUmido: "118.44", pesoBrutoSeco: "99.28", tara: "25.87" },
        { id: generateId(), pesoAmostaCilindro: "6095.0", pesoBrutoUmido: "114.92", pesoBrutoSeco: "94.63", tara: "27.41" },
      ],
    };
    
    handleSelectExample(exemploParaTour as any);
    
    await new Promise(resolve => setTimeout(resolve, 300));
    form.handleSubmit(onSubmit)();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    startTour(tourSteps, "compactacao", true);
    toast("Tour iniciado!", { description: "Exemplo carregado automaticamente para demonstração." });
  };

  const handleExportPDF = () => {
    if (!results) return;
    
    // Gerar nome padrão usando a função auxiliar
    const defaultName = generateDefaultPDFFileName("Compactação");
    
    setPdfFileName(defaultName);
    setExportPDFDialogOpen(true);
  };

  const handleConfirmExportPDF = async () => {
    if (!results) return;
    const formData = form.getValues();

    setIsExportingPDF(true);

    // Capturar imagem do gráfico usando a função do componente
    toast("Capturando gráfico...");
    const chartImage = curvaCompactacaoRef.current 
      ? await curvaCompactacaoRef.current.getImageForExport()
      : null;

    const inputs: { label: string; value: string }[] = [
      { label: "Volume do Cilindro", value: `${formData.volumeCilindro} cm³` },
      { label: "Peso do Cilindro", value: `${formData.pesoCilindro} g` },
    ];
    if (formData.Gs) inputs.push({ label: "Densidade Relativa (Gs)", value: formData.Gs });

    const resultsList: { label: string; value: string; highlight?: boolean }[] = [];
    if (results.umidade_otima !== null) resultsList.push({ label: "Umidade Ótima", value: `${formatNumberForExport(results.umidade_otima, 2)}%`, highlight: true });
    if (results.peso_especifico_seco_max !== null) resultsList.push({ label: "Peso Específico Seco Máximo", value: `${formatNumberForExport(results.peso_especifico_seco_max / 10, 3)} g/cm³`, highlight: true });

    // Preparar tabelas de dados de entrada
    const tables = [];

    // TABELA 1: Dados do Ensaio de Compactação
    const ensaioHeaders = ["Ponto", "Peso Amostra+Cilindro (g)", "Peso Bruto Úmido (g)", "Peso Bruto Seco (g)", "Tara (g)"];
    const ensaioRows = formData.pontos.map((p, i) => [
      `${i + 1}`,
      p.pesoAmostaCilindro,
      p.pesoBrutoUmido,
      p.pesoBrutoSeco,
      p.tara
    ]);

    tables.push({
      title: "Dados do Ensaio de Compactação",
      headers: ensaioHeaders,
      rows: ensaioRows
    });

    // Fórmulas utilizadas
    const formulas = [
      {
        label: "Peso da Amostra Úmida",
        formula: "Peso Amostra = (Peso Amostra+Cilindro) - (Peso Cilindro)",
        description: "Peso da amostra compactada dentro do cilindro"
      },
      {
        label: "Peso Específico Natural (γnat)",
        formula: "γnat = (Peso Amostra / Volume Cilindro) × 10",
        description: "Peso específico da amostra úmida compactada em kN/m³"
      },
      {
        label: "Teor de Umidade (w)",
        formula: "w = ((Peso Bruto Úmido - Peso Bruto Seco) / (Peso Bruto Seco - Tara)) × 100",
        description: "Teor de umidade de moldagem do corpo de prova"
      },
      {
        label: "Peso Específico Seco (γd)",
        formula: "γd = γnat / (1 + w/100)",
        description: "Peso específico da amostra sem considerar a água"
      },
      {
        label: "Curva de Saturação Teórica",
        formula: "γd_sat = (Gs × γw × 100) / (Gs × w + 100)",
        description: "Representa o estado de saturação completa (Sr = 100%) para cada umidade"
      },
      {
        label: "Parâmetros Ótimos",
        formula: "Obtidos do ponto máximo da curva de compactação (parábola ajustada aos pontos experimentais)",
        description: "Umidade ótima (wot) e Peso específico seco máximo (γd_max) definem as condições ideais de compactação"
      },
    ];

    if (formData.Gs) {
      formulas.push({
        label: "Grau de Compactação (GC)",
        formula: "GC = (γd_campo / γd_max) × 100",
        description: "Compara a densidade obtida em campo com a densidade máxima de laboratório. Valores típicos de projeto: GC ≥ 95% (aterros), GC ≥ 100% (bases e sub-bases)"
      });
    }

    const exportData: ExportData = {
      moduleName: "compactacao",
      moduleTitle: "Compactação (Proctor)",
      inputs,
      results: resultsList,
      formulas,
      tables,
      chartImage: chartImage || undefined,
      customFileName: pdfFileName,
      theme,
      printSettings: settings.printSettings
    };

    toast("Gerando PDF...");
    const success = await exportToPDF(exportData);
    
    setIsExportingPDF(false);
    
    if (success) {
      toast("PDF exportado!", { description: "O arquivo foi baixado com sucesso." });
      setExportPDFDialogOpen(false);
    } else {
      toast("Erro ao exportar", { description: "Não foi possível gerar o PDF." });
    }
  };

  const handleExportExcel = async () => {
    if (!results) return;
    const formData = form.getValues();

    const configData: { label: string; value: string | number }[] = [
      { label: "Volume do Cilindro (cm³)", value: formData.volumeCilindro },
      { label: "Peso do Cilindro (g)", value: formData.pesoCilindro },
    ];
    if (formData.Gs) configData.push({ label: "Densidade Relativa (Gs)", value: formData.Gs });

    const dadosData: { label: string; value: string | number }[] = [];
    formData.pontos.forEach((p, i) => {
      dadosData.push({ label: `Ponto ${i + 1} - Peso Amostra+Cil (g)`, value: p.pesoAmostaCilindro });
      dadosData.push({ label: `Ponto ${i + 1} - Peso Bruto Úmido (g)`, value: p.pesoBrutoUmido });
      dadosData.push({ label: `Ponto ${i + 1} - Peso Bruto Seco (g)`, value: p.pesoBrutoSeco });
      dadosData.push({ label: `Ponto ${i + 1} - Tara (g)`, value: p.tara });
    });

    const resultadosData: { label: string; value: string | number }[] = [];
    if (results.umidade_otima !== null) resultadosData.push({ label: "Umidade Ótima (%)", value: results.umidade_otima.toFixed(2) });
    if (results.peso_especifico_seco_max !== null) resultadosData.push({ label: "Peso Específico Seco Máximo (g/cm³)", value: (results.peso_especifico_seco_max / 10).toFixed(3) });

    const excelData: ExcelExportData = {
      moduleName: "compactacao",
      moduleTitle: "Compactação (Proctor)",
      sheets: [
        { name: "Configuração", data: configData },
        { name: "Dados de Entrada", data: dadosData },
        { name: "Resultados", data: resultadosData }
      ],
    };

    const success = await exportToExcel(excelData);
    if (success) {
      toast("Excel exportado!", { description: "O arquivo foi baixado com sucesso." });
    } else {
      toast("Erro ao exportar", { description: "Não foi possível gerar o Excel." });
    }
  };

  const onSubmit = async (data: FormInputValues) => {
    setIsCalculating(true);
    setApiError(null);
    setResults(null);

    let apiInput: CompactacaoInputAPI;
    try {
      const volumeCil = parseFloat(data.volumeCilindro);
      const pesoCil = parseFloat(data.pesoCilindro);

      apiInput = {
        pontos_ensaio: data.pontos.map(p => ({
          massa_umida_total: parseFloat(p.pesoAmostaCilindro),
          massa_molde: pesoCil,
          volume_molde: volumeCil,
          massa_umida_recipiente_w: parseFloat(p.pesoBrutoUmido),
          massa_seca_recipiente_w: parseFloat(p.pesoBrutoSeco),
          massa_recipiente_w: parseFloat(p.tara),
        })),
        Gs: (data.Gs && data.Gs !== "") ? parseFloat(data.Gs) : undefined,
        peso_especifico_agua: parseFloat(data.pesoEspecificoAgua),
      };

      if (apiInput.Gs === undefined) delete apiInput.Gs;
    } catch (parseError) {
      setApiError("Erro ao processar os dados do formulário.");
      toast("Erro de Formulário", { description: "Verifique se todos os campos numéricos contêm valores válidos." });
      setIsCalculating(false);
      return;
    }

    try {
      const response = await axios.post<Results>(`${API_URL}/calcular/compactacao`, apiInput);
      if (response.data.erro) {
        setApiError(response.data.erro);
        toast("Erro no Cálculo (API)", { description: response.data.erro });
      } else {
        setResults(response.data);
        toast("Sucesso", { description: "Ensaio de compactação calculado com sucesso." });
      }
    } catch (err) {
      let errorMessage = "Erro de comunicação com o servidor.";
      if (axios.isAxiosError(err) && err.response?.data?.detail) {
        if (Array.isArray(err.response.data.detail)) {
          errorMessage = err.response.data.detail.map((d: any) => `Campo '${d.loc.slice(1).join('.') || 'Geral'}': ${d.msg}`).join("; ");
        } else if (typeof err.response.data.detail === 'string') {
          errorMessage = err.response.data.detail;
        }
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }
      setApiError(errorMessage);
      toast("Erro na Requisição", { description: errorMessage });
    } finally {
      setIsCalculating(false);
    }
  };

  const errors = form.formState.errors;
  const currentPointField = fields[currentPointIndex];
  const canSubmit = !isCalculating && form.formState.isValid && !apiError;

  // Encontrar índice do ponto com γd máximo
  const indiceMaximo = results?.pontos_curva_compactacao?.reduce((maxIdx, ponto, idx, arr) => {
    return ponto.peso_especifico_seco > (arr[maxIdx]?.peso_especifico_seco || 0) ? idx : maxIdx;
  }, 0);

  return (
    <div className="space-y-4 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <PrintHeader moduleTitle="Compactação (Proctor)" moduleName="compactacao" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 animate-in fade-in slide-in-from-left-4 duration-500" data-tour="module-header">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-gradient-to-br from-violet-500 via-fuchsia-500 to-pink-600 flex items-center justify-center shadow-lg transition-transform hover:scale-110 hover:rotate-3">
            <Database className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Ensaio de Compactação</h1>
            <p className="text-muted-foreground text-xs sm:text-sm">Determinação da curva de compactação (Proctor)</p>
          </div>
        </div>

        <div className="flex items-center gap-2" data-tour="actions">
          <DialogExemplos onSelectExample={handleSelectExample} disabled={isCalculating} />
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {/* Formulário */}
        <Card className="glass flex flex-col p-4 sm:p-6 animate-in fade-in slide-in-from-left-4 duration-700" style={{ animationDelay: '100ms', animationFillMode: 'backwards' }}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col flex-1">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-xl">
                <Info className="w-5 h-5" />
                Dados do Ensaio
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 p-4 pt-0 flex-1">
              <TooltipProvider>
                {/* Dados Fixos */}
                <div className="space-y-3 p-3 rounded-lg bg-accent/5 border border-accent/20" data-tour="config-gerais">
                  <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                    <Info className="w-4 h-4 text-orange-500" />
                    Parâmetros Gerais
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <Label htmlFor="volumeCilindro" className={cn("text-xs", errors.volumeCilindro && "text-destructive")}>
                          Volume Cilindro (cm³)
                        </Label>
                        <Tooltip>
                          <TooltipTrigger>
                            <Info className="w-4 h-4 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs">
                            <p>{tooltips.volumeCilindro}</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <Controller
                        name="volumeCilindro"
                        control={form.control}
                        render={({ field }) => (
                          <Input
                            id="volumeCilindro"
                            type="number"
                            step="0.01"
                            placeholder="Ex: 982"
                            {...field}
                            className={cn("bg-background/50 h-9", errors.volumeCilindro && "border-destructive")}
                          />
                        )}
                      />
                      {errors.volumeCilindro && <p className="text-xs text-destructive mt-0.5">{errors.volumeCilindro.message}</p>}
                    </div>

                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <Label htmlFor="pesoCilindro" className={cn("text-xs", errors.pesoCilindro && "text-destructive")}>
                          Peso Cilindro (g)
                        </Label>
                        <Tooltip>
                          <TooltipTrigger>
                            <Info className="w-4 h-4 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs">
                            <p>{tooltips.pesoCilindro}</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <Controller
                        name="pesoCilindro"
                        control={form.control}
                        render={({ field }) => (
                          <Input
                            id="pesoCilindro"
                            type="number"
                            step="0.01"
                            placeholder="Ex: 4100"
                            {...field}
                            className={cn("bg-background/50 h-9", errors.pesoCilindro && "border-destructive")}
                          />
                        )}
                      />
                      {errors.pesoCilindro && <p className="text-xs text-destructive mt-0.5">{errors.pesoCilindro.message}</p>}
                    </div>

                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <Label htmlFor="Gs" className={cn("text-xs", errors.Gs && "text-destructive")}>
                          Gs (opcional)
                        </Label>
                        <Tooltip>
                          <TooltipTrigger>
                            <Info className="w-4 h-4 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs">
                            <p>{tooltips.Gs}</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <Controller
                        name="Gs"
                        control={form.control}
                        render={({ field }) => (
                          <Input
                            id="Gs"
                            type="number"
                            step="0.01"
                            placeholder="Ex: 2.65"
                            {...field}
                            value={field.value ?? ""}
                            className={cn("bg-background/50 h-9", errors.Gs && "border-destructive")}
                          />
                        )}
                      />
                      {errors.Gs && <p className="text-xs text-destructive mt-0.5">{errors.Gs.message}</p>}
                    </div>

                    <div className="space-y-0.5">
                      <Label htmlFor="pesoEspecificoAgua" className="text-xs">γ<sub>w</sub> (kN/m³)</Label>
                      <Controller
                        name="pesoEspecificoAgua"
                        control={form.control}
                        render={({ field }) => (
                          <Input
                            id="pesoEspecificoAgua"
                            type="number"
                            step="0.01"
                            {...field}
                            className="bg-background/50 h-9"
                          />
                        )}
                      />
                    </div>
                  </div>
                </div>

                {/* Pontos do Ensaio */}
                <Accordion type="single" collapsible defaultValue="pontos" className="w-full" data-tour="pontos-ensaio">
                  <AccordionItem value="pontos" className="border-0">
                    <AccordionTrigger className="text-sm font-semibold text-foreground bg-accent/5 hover:bg-accent/10 px-3 py-2 rounded-lg border border-accent/20 [&[data-state=open]]:rounded-b-none">
                      <div className="flex items-center gap-1.5">
                        <Database className="w-4 h-4 text-violet-500" />
                        Pontos de Compactação
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="p-0 pt-2">
                      <div className="space-y-2 rounded-lg bg-background/30 border border-accent/20 border-t-0 rounded-t-none p-3" data-tour="navegacao-pontos">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-medium text-xs text-muted-foreground">
                            Ponto {currentPointIndex + 1} / {fields.length}
                          </h4>
                          <div className="flex items-center gap-1">
                            <Button type="button" onClick={goToPreviousPoint} size="icon" variant="outline" className="h-6 w-6" disabled={currentPointIndex === 0}>
                              <ChevronLeft className="w-3.5 h-3.5" />
                            </Button>
                            <Button type="button" onClick={goToNextPoint} size="icon" variant="outline" className="h-6 w-6" disabled={currentPointIndex === fields.length - 1}>
                              <ChevronRight className="w-3.5 h-3.5" />
                            </Button>
                            <Button type="button" onClick={addPonto} size="icon" variant="outline" className="h-6 w-6 ml-1.5">
                              <Plus className="w-3.5 h-3.5" />
                            </Button>
                            <Button type="button" onClick={removePonto} size="icon" variant="destructive" className="h-6 w-6" disabled={fields.length <= 3}>
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </div>

                        {currentPointField && (
                          <div key={currentPointField.id} className="space-y-2">
                            <div className="grid grid-cols-2 gap-3">
                              {/* Peso Amostra + Cilindro */}
                              <div className="space-y-0.5 col-span-2">
                                <div className="flex items-center gap-2">
                                  <Label htmlFor={`pontos.${currentPointIndex}.pesoAmostaCilindro`} className={cn("text-xs", errors.pontos?.[currentPointIndex]?.pesoAmostaCilindro && "text-destructive")}>
                                    Peso Amostra + Cilindro (g)
                                  </Label>
                                  <Tooltip>
                                    <TooltipTrigger>
                                      <Info className="w-4 h-4 text-muted-foreground cursor-help" />
                                    </TooltipTrigger>
                                    <TooltipContent className="max-w-xs">
                                      <p>{tooltips.pesoAmostaCilindro}</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </div>
                                <Controller
                                  name={`pontos.${currentPointIndex}.pesoAmostaCilindro`}
                                  control={form.control}
                                  render={({ field }) => (
                                    <Input
                                      id={`pontos.${currentPointIndex}.pesoAmostaCilindro`}
                                      type="number"
                                      step="0.01"
                                      placeholder="Ex: 6050.00"
                                      {...field}
                                      className={cn("bg-background/50 h-9", errors.pontos?.[currentPointIndex]?.pesoAmostaCilindro && "border-destructive")}
                                    />
                                  )}
                                />
                                {errors.pontos?.[currentPointIndex]?.pesoAmostaCilindro && (
                                  <p className="text-xs text-destructive mt-0.5">{errors.pontos[currentPointIndex]?.pesoAmostaCilindro?.message}</p>
                                )}
                              </div>

                              {/* Peso Bruto Úmido */}
                              <div className="space-y-0.5">
                                <div className="flex items-center gap-2">
                                  <Label htmlFor={`pontos.${currentPointIndex}.pesoBrutoUmido`} className={cn("text-xs", errors.pontos?.[currentPointIndex]?.pesoBrutoUmido && "text-destructive")}>
                                    Peso Bruto Úmido (g)
                                  </Label>
                                  <Tooltip>
                                    <TooltipTrigger>
                                      <Info className="w-4 h-4 text-muted-foreground cursor-help" />
                                    </TooltipTrigger>
                                    <TooltipContent className="max-w-xs">
                                      <p>{tooltips.pesoBrutoUmido}</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </div>
                                <Controller
                                  name={`pontos.${currentPointIndex}.pesoBrutoUmido`}
                                  control={form.control}
                                  render={({ field }) => (
                                    <Input
                                      id={`pontos.${currentPointIndex}.pesoBrutoUmido`}
                                      type="number"
                                      step="0.01"
                                      placeholder="Ex: 106.56"
                                      {...field}
                                      className={cn("bg-background/50 h-9", errors.pontos?.[currentPointIndex]?.pesoBrutoUmido && "border-destructive")}
                                    />
                                  )}
                                />
                                {errors.pontos?.[currentPointIndex]?.pesoBrutoUmido && (
                                  <p className="text-xs text-destructive mt-0.5">{errors.pontos[currentPointIndex]?.pesoBrutoUmido?.message}</p>
                                )}
                              </div>

                              {/* Peso Bruto Seco */}
                              <div className="space-y-0.5">
                                <div className="flex items-center gap-2">
                                  <Label htmlFor={`pontos.${currentPointIndex}.pesoBrutoSeco`} className={cn("text-xs", errors.pontos?.[currentPointIndex]?.pesoBrutoSeco && "text-destructive")}>
                                    Peso Bruto Seco (g)
                                  </Label>
                                  <Tooltip>
                                    <TooltipTrigger>
                                      <Info className="w-4 h-4 text-muted-foreground cursor-help" />
                                    </TooltipTrigger>
                                    <TooltipContent className="max-w-xs">
                                      <p>{tooltips.pesoBrutoSeco}</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </div>
                                <Controller
                                  name={`pontos.${currentPointIndex}.pesoBrutoSeco`}
                                  control={form.control}
                                  render={({ field }) => (
                                    <Input
                                      id={`pontos.${currentPointIndex}.pesoBrutoSeco`}
                                      type="number"
                                      step="0.01"
                                      placeholder="Ex: 93.69"
                                      {...field}
                                      className={cn("bg-background/50 h-9", errors.pontos?.[currentPointIndex]?.pesoBrutoSeco && "border-destructive")}
                                    />
                                  )}
                                />
                                {errors.pontos?.[currentPointIndex]?.pesoBrutoSeco && (
                                  <p className="text-xs text-destructive mt-0.5">{errors.pontos[currentPointIndex]?.pesoBrutoSeco?.message}</p>
                                )}
                              </div>

                              {/* Tara */}
                              <div className="space-y-0.5 col-span-2">
                                <div className="flex items-center gap-2">
                                  <Label htmlFor={`pontos.${currentPointIndex}.tara`} className={cn("text-xs", errors.pontos?.[currentPointIndex]?.tara && "text-destructive")}>
                                    Tara (g)
                                  </Label>
                                  <Tooltip>
                                    <TooltipTrigger>
                                      <Info className="w-4 h-4 text-muted-foreground cursor-help" />
                                    </TooltipTrigger>
                                    <TooltipContent className="max-w-xs">
                                      <p>{tooltips.tara}</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </div>
                                <Controller
                                  name={`pontos.${currentPointIndex}.tara`}
                                  control={form.control}
                                  render={({ field }) => (
                                    <Input
                                      id={`pontos.${currentPointIndex}.tara`}
                                      type="number"
                                      step="0.01"
                                      placeholder="Ex: 24.72"
                                      {...field}
                                      className={cn("bg-background/50 h-9", errors.pontos?.[currentPointIndex]?.tara && "border-destructive")}
                                    />
                                  )}
                                />
                                {errors.pontos?.[currentPointIndex]?.tara && (
                                  <p className="text-xs text-destructive mt-0.5">{errors.pontos[currentPointIndex]?.tara?.message}</p>
                                )}
                              </div>
                            </div>
                            {errors.pontos?.[currentPointIndex]?.root && (
                              <p className="text-xs text-destructive mt-1">{errors.pontos[currentPointIndex]?.root?.message}</p>
                            )}
                          </div>
                        )}
                        {errors.pontos && typeof errors.pontos === 'object' && 'message' in errors.pontos && typeof errors.pontos.message === 'string' && (
                          <p className="text-xs text-destructive mt-1">{errors.pontos.message}</p>
                        )}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </TooltipProvider>
            </CardContent>

            <CardFooter className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-3 border-t border-border/50 mt-auto">
              <Button type="submit" disabled={!canSubmit} className="flex-1 h-10" data-tour="btn-calcular">
                <CalcIcon className="w-4 h-4 mr-1.5" />
                {isCalculating ? "Calculando..." : "Calcular"}
              </Button>
              <Button type="button" onClick={handleClear} variant="outline" disabled={isCalculating} className="h-10 w-full sm:w-auto">
                Limpar
              </Button>
            </CardFooter>
            {apiError && !isCalculating && (
              <div className="px-4 pb-3">
                <Alert variant="destructive" className="p-2">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle className="text-sm">Erro</AlertTitle>
                  <AlertDescription className="text-xs">{apiError}</AlertDescription>
                </Alert>
              </div>
            )}
          </form>
        </Card>

        {/* Resultados */}
        <Card className="glass p-4 sm:p-6 animate-in fade-in slide-in-from-right-4 duration-700" style={{ animationDelay: '200ms', animationFillMode: 'backwards' }}>
          <CardHeader className="pb-3 px-0">
            <CardTitle className="flex items-center gap-2 text-lg">
              <BarChart3 className="w-5 h-5 text-primary" />
              Resultados
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 px-0">
            {isCalculating ? (
              <div className="space-y-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-[280px] w-full mt-2" />
              </div>
            ) : results && !results.erro && results.pontos_curva_compactacao ? (
              <Carousel className="w-full px-8 relative" data-tour="resultados">
                <CarouselContent>
                  {/* Slide 1: Tabela de Resultados */}
                  <CarouselItem>
                    <div className="space-y-2">
                      <TabelaResultados pontos={results.pontos_curva_compactacao} indiceMaximo={indiceMaximo} />
                      {/* Cards com valores principais */}
                      <div className="grid grid-cols-2 gap-2 mt-3" data-tour="parametros-otimos">
                        {results.umidade_otima !== null && (
                          <div className="p-2.5 rounded-lg bg-primary/10 border border-primary/20">
                            <p className="text-xs text-muted-foreground mb-0.5">Umidade Ótima</p>
                            <p className="text-base font-bold text-primary">{results.umidade_otima.toFixed(2)}%</p>
                          </div>
                        )}
                        {results.peso_especifico_seco_max !== null && (
                          <div className="p-2.5 rounded-lg bg-primary/10 border border-primary/20">
                            <p className="text-xs text-muted-foreground mb-0.5">γ<sub>d,máx</sub></p>
                            <p className="text-base font-bold text-primary">{(results.peso_especifico_seco_max / 10).toFixed(3)} g/cm³</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </CarouselItem>

                  {/* Slide 2: Curva de Compactação */}
                  <CarouselItem>
                    <div id="curva-compactacao-chart">
                      <CurvaCompactacao
                        ref={curvaCompactacaoRef}
                        pontosEnsaio={results.pontos_curva_compactacao}
                        umidadeOtima={results.umidade_otima ?? undefined}
                        gamaSecoMax={results.peso_especifico_seco_max ?? undefined}
                        pontosSaturacao={results.pontos_curva_saturacao_100 ?? undefined}
                      />
                    </div>
                  </CarouselItem>
                </CarouselContent>
                <CarouselPrevious className="absolute left-[-8px] top-1/2 -translate-y-1/2 h-8 w-8" />
                <CarouselNext className="absolute right-[-8px] top-1/2 -translate-y-1/2 h-8 w-8" />
              </Carousel>
            ) : (
              <div className="flex flex-col items-center justify-center h-56 text-center">
                <Database className="w-12 h-12 text-violet-500/30 mb-3" />
                <p className="text-muted-foreground text-sm">
                  {apiError ? "Corrija os erros para calcular" : "Preencha os dados do ensaio para calcular"}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

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
        moduleName="Compactação"
      />
    </div>
  );
}

// Wrapper principal que escolhe versão mobile ou desktop
export default function Compactacao() {
  return (
    <MobileModuleWrapper mobileVersion={<CompactacaoMobile />}>
      <CompactacaoDesktop />
    </MobileModuleWrapper>
  );
}
