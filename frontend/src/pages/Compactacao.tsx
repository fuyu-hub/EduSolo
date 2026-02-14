// frontend/src/pages/Compactacao.tsx
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { calcularCompactacao } from "@/lib/calculations/compactacao";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { RotateCcw, Database, Info, Calculator as CalcIcon, Plus, Trash2, AlertCircle, BarChart3, Save, FolderOpen, Download, Printer, GraduationCap, LayoutGrid, RefreshCw } from "lucide-react";
import { CompactacaoIcon } from "@/components/icons/CompactacaoIcon";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter as UIDialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

import { toast } from "@/components/ui/sonner";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";

import { useSavedCalculations } from "@/hooks/use-saved-calculations";
import { useRecentReports } from "@/hooks/useRecentReports";
import { useSettings } from "@/hooks/use-settings";
import { useTheme } from "@/hooks/use-theme";
import { useTour, TourStep } from "@/contexts/TourContext";
import SavedCalculations from "@/components/SavedCalculations";
import { useToursEnabled } from "@/components/WelcomeDialog";
import SaveDialog from "@/components/SaveDialog";
import PrintHeader from "@/components/PrintHeader";
import CalculationActions from "@/components/CalculationActions";
import { exportToPDF, exportToExcel, ExportData, ExcelExportData, formatNumberForExport, generateDefaultPDFFileName } from "@/lib/export-utils";
import ExportPDFDialog from "@/components/ExportPDFDialog";
import { prepareReportForStorage } from "@/lib/reportManager";
import CurvaCompactacao, { CurvaCompactacaoRef } from "@/components/compactacao/CurvaCompactacao";
import TabelaResultados from "@/components/compactacao/TabelaResultados";
import DialogExemplos from "@/components/compactacao/DialogExemplos";
import { ExemploCompactacao } from "@/lib/exemplos-compactacao";
import { MobileModuleWrapper } from "@/components/mobile";
import CompactacaoMobile from "./mobile/CompactacaoMobile";
import { useCompactacaoStore } from "@/modules/compactacao/store";
import { UI_STANDARDS } from "@/lib/ui-standards";

// Schema de validação
const pontoCompactacaoSchema = z.object({
  id: z.string(),
  pesoAmostaCilindro: z.string().min(1, { message: "Campo obrigatório" }).refine(val => !isNaN(parseFloat(val)) && parseFloat(val) > 0, { message: "Deve ser maior que 0" }),
  // Campos para medições (opcionais - dependem do modo)
  pesoBrutoUmido: z.string().optional(),
  pesoBrutoSeco: z.string().optional(),
  tara: z.string().optional(),
  // Campo para umidade direta
  umidadeDireta: z.string().optional(),
});

const formSchema = z.object({
  volumeCilindro: z.string().min(1, { message: "Campo obrigatório" }).refine(val => !isNaN(parseFloat(val)) && parseFloat(val) > 0, { message: "Volume deve ser maior que 0" }),
  pesoCilindro: z.string().min(1, { message: "Campo obrigatório" }).refine(val => !isNaN(parseFloat(val)) && parseFloat(val) >= 0, { message: "Peso deve ser maior ou igual a 0" }),
  Gs: z.string().optional().refine(val => val === undefined || val === "" || (!isNaN(parseFloat(val)) && parseFloat(val) > 0), {
    message: "Gs deve ser maior que 0 (ou deixe vazio)",
  }),
  pesoEspecificoAgua: z.string().refine(val => !isNaN(parseFloat(val)) && parseFloat(val) > 0, { message: "Peso específico da água deve ser maior que 0" }),
  modoEntradaUmidade: z.enum(["medicoes", "direta"]).default("direta"),
  pontos: z.array(pontoCompactacaoSchema).min(3, { message: "São necessários no mínimo 3 pontos de ensaio" }),
});

type FormInputValues = z.infer<typeof formSchema>;


import { CompactacaoOutput, PontoCurvaCompactacao } from '@/modules/compactacao/schemas';

// ... (schema formSchema e tudo mais)

// Interfaces para API
// Definição local de PontoEnsaioAPI para facilitar o map do form -> calculation
interface PontoEnsaioAPI {
  massa_umida_total: number;
  massa_molde: number;
  volume_molde: number;
  // Campos condicionais (opcionais na interface, mas validados na lógica)
  massa_umida_recipiente_w?: number;
  massa_seca_recipiente_w?: number;
  massa_recipiente_w?: number;
  umidade_direta?: number;
}

interface CompactacaoInputAPI {
  pontos_ensaio: PontoEnsaioAPI[];
  Gs?: number;
  peso_especifico_agua: number;
}

// Removemos PontoCurva e Results locais e usamos do módulo


const tooltips = {
  volumeCilindro: "Volume interno do cilindro/molde de compactação (cm³)",
  pesoCilindro: "Massa do cilindro vazio (g)",
  Gs: "Densidade dos grãos (opcional, necessário para curva S=100%)",
  pesoAmostaCilindro: "Massa da amostra compactada + cilindro (g)",
  pesoBrutoUmido: "MBU: Massa Bruta Úmida (Solo Úmido + Tara)",
  pesoBrutoSeco: "MBS: Massa Bruta Seca (Solo Seco + Tara)",
  tara: "Massa do recipiente vazio (g)",
};

// Cálculos agora são feitos localmente no frontend

// Função para gerar IDs únicos (alternativa ao crypto.randomUUID para compatibilidade)
const generateId = () => `${Date.now()}-${Math.floor(Math.random() * 1000000)}`;

function CompactacaoDesktop() {
  const { toast: toastFn } = { toast };
  const { settings } = useSettings();
  const { theme } = useTheme();
  const { startTour, suggestTour } = useTour();
  const toursEnabled = useToursEnabled();
  const { addReport } = useRecentReports();
  const navigate = useNavigate();
  const [currentPointIndex, setCurrentPointIndex] = useState(0);
  // Zustand store para persistir dados entre navegações
  const { formData, updateFormData } = useCompactacaoStore();

  const form = useForm<FormInputValues>({
    resolver: zodResolver(formSchema),
    defaultValues: formData, // Usar dados do store
    mode: "onBlur",
  });

  const { reset, watch, setValue } = form;

  // Sync form with store on mount (restore data from store)
  useEffect(() => {
    reset(formData);
  }, []); // Only on mount

  // Auto-sync form changes to store AND calculate
  useEffect(() => {
    const subscription = watch((value) => {
      if (value) {
        updateFormData(value as any);
        // Auto Calculate
        const currentData = form.getValues();
        handleCalculate(currentData, true);
      }
    });
    return () => subscription.unsubscribe();
  }, [watch, updateFormData]);

  const { fields, append, remove } = useFieldArray({ control: form.control, name: "pontos", keyName: "fieldId" });

  // Cálculo Automático de Umidade (Interativo) e Inverso
  const pesoBrutoUmido = watch(`pontos.${currentPointIndex}.pesoBrutoUmido`);
  const pesoBrutoSeco = watch(`pontos.${currentPointIndex}.pesoBrutoSeco`);
  const tara = watch(`pontos.${currentPointIndex}.tara`);
  const umidadeDireta = watch(`pontos.${currentPointIndex}.umidadeDireta`); // Monitorar umidadeDireta
  const modoEntrada = watch("modoEntradaUmidade");

  // Estado local para exibir a umidade calculada em tempo real (apenas feedback visual)
  const [umidadeCalculadaPreview, setUmidadeCalculadaPreview] = useState<number | null>(null);

  // Cálculo: Pesos -> Umidade (Modo 'medicoes')
  useEffect(() => {
    if (modoEntrada === "medicoes") {
      const pbu = parseFloat(pesoBrutoUmido || "0");
      const pbs = parseFloat(pesoBrutoSeco || "0");
      const t = parseFloat(tara || "0");

      if (pbu > 0 && pbs > 0 && t >= 0 && pbs > t && pbu >= pbs) {
        const massaAgua = pbu - pbs;
        const massaSoloSeco = pbs - t;
        const w = (massaAgua / massaSoloSeco) * 100;

        setUmidadeCalculadaPreview(w);
        setValue(`pontos.${currentPointIndex}.umidadeDireta`, w.toFixed(2), { shouldValidate: false, shouldDirty: true });
      } else {
        setUmidadeCalculadaPreview(null);
      }
    } else {
      setUmidadeCalculadaPreview(null);
    }
  }, [pesoBrutoUmido, pesoBrutoSeco, tara, modoEntrada, currentPointIndex, setValue]);

  // Cálculo Inverso: Umidade -> MBS (Modo 'direta')
  // Se o usuário altera a umidade diretamente, ajustamos o MBS mantendo MBU e Tara fixos
  useEffect(() => {
    if (modoEntrada === "direta") {
      const w = parseFloat(umidadeDireta || "0");
      const pbu = parseFloat(pesoBrutoUmido || "0"); // Mantém MBU fixo
      const t = parseFloat(tara || "0");

      if (w >= 0 && pbu > 0 && t >= 0 && pbu > t) {
        // Fórmula derivada: MBS = (MBU + W*Tara) / (1 + W), onde W = w/100
        const W = w / 100;
        const novoMBS = (pbu + (W * t)) / (1 + W);

        // Atualiza MBS silenciosamente
        setValue(`pontos.${currentPointIndex}.pesoBrutoSeco`, novoMBS.toFixed(2), { shouldValidate: false, shouldDirty: true });
      }
    }
  }, [umidadeDireta, pesoBrutoUmido, tara, modoEntrada, currentPointIndex, setValue]);

  const [results, setResults] = useState<CompactacaoOutput | null>(null);
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
  const [pdfSavedDialogOpen, setPdfSavedDialogOpen] = useState(false);

  const [resultTab, setResultTab] = useState("resultados");

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
      content: "Configure o volume e massa do cilindro de compactação. O Gs (densidade relativa dos grãos) é opcional, mas necessário para traçar a curva de saturação teórica (S=100%).",
      placement: "right",
      spotlightPadding: 12,
    },
    {
      target: "[data-tour='pontos-ensaio']",
      title: "📋 Pontos do Ensaio",
      content: "Adicione os pontos do ensaio (mínimo 3). Para cada ponto, registre: massa da amostra compactada + cilindro e as massas para determinação de umidade.",
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

  // Sugerir tour via toast na primeira visita
  useEffect(() => {
    // Verificar se tours estão globalmente desabilitados
    if (!toursEnabled) return;

    let toastId: string | number | undefined;

    const timer = setTimeout(() => {
      // Preparação: carregar exemplo e calcular
      const prepareForTour = async () => {
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
        // Force calculation for tour
        const values = form.getValues();
        handleCalculate(values, false); // false to show success toast if needed, or consistent with user action
        await new Promise(resolve => setTimeout(resolve, 800));
      };

      // Sugerir tour com toast
      toastId = suggestTour(tourSteps, "compactacao", "Compactação", prepareForTour);
    }, 1000);

    return () => {
      clearTimeout(timer);
      if (toastId) {
        toast.dismiss(toastId);
      }
    };
  }, [toursEnabled]);

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
      volumeCilindro: "",
      pesoCilindro: "",
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
    // Prepara os pontos calculando a umidade direta para cada um
    const pontosComUmidade = example.pontos.map(p => {
      let umidadeDireta = "";
      const pbu = parseFloat(p.pesoBrutoUmido || "0");
      const pbs = parseFloat(p.pesoBrutoSeco || "0");
      const t = parseFloat(p.tara || "0");

      if (pbu > 0 && pbs > 0 && t >= 0 && pbs > t) {
        const w = ((pbu - pbs) / (pbs - t)) * 100;
        umidadeDireta = w.toFixed(2);
      }

      return {
        ...p,
        id: generateId(),
        umidadeDireta
      };
    });

    const newData: FormInputValues = {
      volumeCilindro: example.volumeCilindro,
      pesoCilindro: example.pesoCilindro,
      Gs: example.Gs || "",
      pesoEspecificoAgua: "10.0",
      modoEntradaUmidade: "medicoes", // Exemplos usam medições por padrão
      pontos: pontosComUmidade
    };

    // Reset completo do formulário com os novos dados
    form.reset(newData);

    setCurrentPointIndex(0);
    setResults(null);
    setApiError(null);

    // Forçar cálculo após um breve delay para garantir que o estado do form atualizou
    setTimeout(() => {
      handleCalculate(newData, false);
    }, 100);

    toast(`${example.icon} ${example.nome} carregado!`, { description: example.descricao });
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
    const values = form.getValues();
    handleCalculate(values, false);
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
      { label: "Massa do Cilindro", value: `${formData.pesoCilindro} g` },
    ];
    if (formData.Gs) inputs.push({ label: "Densidade Relativa (Gs)", value: formData.Gs });

    const resultsList: { label: string; value: string; highlight?: boolean }[] = [];
    if (results.umidade_otima !== null) resultsList.push({ label: "Umidade Ótima", value: `${formatNumberForExport(results.umidade_otima, 2)}%`, highlight: true });
    if (results.peso_especifico_seco_max !== null) resultsList.push({ label: "Peso Específico Seco Máximo", value: `${formatNumberForExport(results.peso_especifico_seco_max / 10, 3)} g/cm³`, highlight: true });

    // Preparar tabelas de dados de entrada
    const tables = [];

    // TABELA 1: Dados do Ensaio de Compactação
    const ensaioHeaders = ["Ponto", "Massa Amostra+Cilindro (g)", "MBU (g)", "MBS (g)", "Tara (g)"];
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
        label: "Massa da Amostra Úmida",
        formula: "Massa Amostra = (Massa Amostra+Cilindro) - (Massa Cilindro)",
        description: "Massa da amostra compactada dentro do cilindro"
      },
      {
        label: "Peso Específico Natural (γnat)",
        formula: "γnat = (Massa Amostra / Volume Cilindro) × 10",
        description: "Peso específico da amostra úmida compactada em kN/m³"
      },
      {
        label: "Teor de Umidade (w)",
        formula: "w = ((MBU - MBS) / (MBS - Tara)) × 100",
        description: "Teor de umidade de moldagem do corpo de prova. MBU = Massa Bruta Úmida, MBS = Massa Bruta Seca."
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
      theme: { mode: theme.mode, color: (theme as any).color || 'indigo' },
      printSettings: settings.printSettings
    };

    toast("Gerando PDF...");
    const result = await exportToPDF(exportData, true);
    setIsExportingPDF(false);
    if (result instanceof Blob) {
      try {
        const reportName = pdfFileName.replace('.pdf', '');
        const prepared = await prepareReportForStorage({
          name: reportName,
          moduleType: 'compactacao',
          moduleName: 'Compactação (Proctor)',
          pdfBlob: result,
          calculationData: { formData, results }
        });
        addReport(prepared);
        setExportPDFDialogOpen(false);
        toast("Relatório salvo", { description: "PDF disponível em Relatórios" });
        setPdfSavedDialogOpen(true);
      } catch (error) {
        console.error('Erro ao salvar relatório:', error);
        toast("PDF exportado", { description: "Não foi possível salvar em Relatórios." });
      }
    } else {
      toast("Erro ao exportar", { description: "Não foi possível gerar o PDF." });
    }
  };

  const handleExportExcel = async () => {
    if (!results) return;
    const formData = form.getValues();

    const configData: { label: string; value: string | number }[] = [
      { label: "Volume do Cilindro (cm³)", value: formData.volumeCilindro },
      { label: "Massa do Cilindro (g)", value: formData.pesoCilindro },
    ];
    if (formData.Gs) configData.push({ label: "Densidade Relativa (Gs)", value: formData.Gs });

    const dadosData: { label: string; value: string | number }[] = [];
    formData.pontos.forEach((p, i) => {
      dadosData.push({ label: `Ponto ${i + 1} - Massa Amostra+Cil (g)`, value: p.pesoAmostaCilindro });
      dadosData.push({ label: `Ponto ${i + 1} - MBU (g)`, value: p.pesoBrutoUmido });
      dadosData.push({ label: `Ponto ${i + 1} - MBS (g)`, value: p.pesoBrutoSeco });
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

  const handleCalculate = async (data: FormInputValues, isAuto: boolean = false) => {
    if (!isAuto) setIsCalculating(true);
    setApiError(null);

    let apiInput: CompactacaoInputAPI;
    try {
      const volumeCil = parseFloat(data.volumeCilindro);
      const pesoCil = parseFloat(data.pesoCilindro);
      const pesoEspAgua = parseFloat(data.pesoEspecificoAgua);

      // Verificação básica de números válidos nos campos de configuração
      if (isNaN(volumeCil) || volumeCil <= 0 || isNaN(pesoCil) || pesoCil < 0 || isNaN(pesoEspAgua) || pesoEspAgua <= 0) {
        if (!isAuto) {
          setApiError("Verifique os parâmetros gerais (Volume, Massa Cilindro).");
          toast.error("Erro de Validação", { description: "Parâmetros gerais inválidos." });
          setIsCalculating(false);
        }
        return;
      }

      // Validar pontos baseado no modo
      const modo = data.modoEntradaUmidade;
      const pontosValidos = data.pontos.length >= 3 && data.pontos.every(p => {
        // Peso Amostra+Cilindro é sempre obrigatório
        const temPesoAmostra = p.pesoAmostaCilindro && !isNaN(parseFloat(p.pesoAmostaCilindro));

        if (modo === "direta") {
          // Modo direta: precisa de umidadeDireta
          return temPesoAmostra && p.umidadeDireta && !isNaN(parseFloat(p.umidadeDireta));
        } else {
          // Modo medições: precisa dos 3 pesos
          return temPesoAmostra &&
            p.pesoBrutoUmido && !isNaN(parseFloat(p.pesoBrutoUmido)) &&
            p.pesoBrutoSeco && !isNaN(parseFloat(p.pesoBrutoSeco)) &&
            p.tara && !isNaN(parseFloat(p.tara));
        }
      });

      if (!pontosValidos) {
        if (!isAuto) {
          const msg = modo === "direta"
            ? "Preencha peso da amostra e umidade para todos os pontos."
            : "Preencha todos os dados de medição para todos os pontos.";

          setApiError(msg);
          toast.error("Dados Incompletos", { description: msg });
          setIsCalculating(false);
        }
        return;
      }

      apiInput = {
        pontos_ensaio: data.pontos.map(p => {
          const base = {
            massa_umida_total: parseFloat(p.pesoAmostaCilindro),
            massa_molde: pesoCil,
            volume_molde: volumeCil,
          };

          if (modo === "direta") {
            return {
              ...base,
              umidade_direta: parseFloat(p.umidadeDireta!),
            };
          } else {
            return {
              ...base,
              massa_umida_recipiente_w: parseFloat(p.pesoBrutoUmido!),
              massa_seca_recipiente_w: parseFloat(p.pesoBrutoSeco!),
              massa_recipiente_w: parseFloat(p.tara!),
            };
          }
        }),
        Gs: (data.Gs && data.Gs !== "") ? parseFloat(data.Gs) : undefined,
        peso_especifico_agua: pesoEspAgua,
      };

      if (apiInput.Gs === undefined) delete apiInput.Gs;
    } catch (parseError) {
      if (!isAuto) {
        setApiError("Erro ao processar os dados.");
        setIsCalculating(false);
      }
      return;
    }

    try {
      // Calcula localmente no frontend
      const resultado = calcularCompactacao(apiInput);
      if (resultado.erro) {
        setApiError(resultado.erro);
        if (!isAuto) toast.error("Erro no Cálculo", { description: resultado.erro });
        // Se erro explícito de cálculo, talvez limpar resultados antigos seja bom
        // Mas se for só erro de "impossível calcular", mantemos o ultimo ou limpamos?
        // Vamos limpar para não mostrar dados errados.
        setResults(null);
      } else {
        setResults(resultado);
        if (!isAuto) toast.success("Sucesso", { description: "Ensaio calculado com sucesso." });
      }
    } catch (err) {
      let errorMessage = "Erro ao calcular compactação.";
      if (err instanceof Error) {
        errorMessage = err.message;
      }
      setApiError(errorMessage);
      if (!isAuto) toast.error("Erro na Requisição", { description: errorMessage });
    } finally {
      if (!isAuto) setIsCalculating(false);
    }
  };

  const errors = form.formState.errors;
  const currentPointField = fields[currentPointIndex];
  const canSubmit = !isCalculating && form.formState.isValid && !apiError;
  const modoEntradaUmidade = form.watch("modoEntradaUmidade") || "medicoes";

  return (
    <div className={UI_STANDARDS.pageContainer}>
      <PrintHeader moduleTitle="Compactação (Proctor)" moduleName="compactacao" />

      {/* Top Header Section */}
      <div className={UI_STANDARDS.header.container} data-tour="module-header">
        <div className="flex items-center gap-3">
          <div className={UI_STANDARDS.header.iconContainer}>
            <CompactacaoIcon className={UI_STANDARDS.header.icon} />
          </div>
          <div>
            <h1 className={UI_STANDARDS.header.title}>Ensaio de Compactação</h1>
            <p className={UI_STANDARDS.header.subtitle}>Determinação da curva de compactação (Proctor)</p>
          </div>
        </div>

        <div className={UI_STANDARDS.header.actionsContainer} data-tour="actions">
          <TooltipProvider>
            <Separator orientation="vertical" className="h-6 mx-1 bg-border" />

            {/* Exemplos */}
            <DialogExemplos onSelectExample={handleSelectExample} disabled={isCalculating} currentFormData={form.getValues()} />

            <Separator orientation="vertical" className="h-6 mx-1 bg-border" />

            <Button variant="ghost" size="sm" onClick={handleClear} className="text-muted-foreground hover:text-destructive gap-1.5">
              <Trash2 className="w-4 h-4" />
              Limpar
            </Button>
          </TooltipProvider>
        </div>
      </div>

      <div className={UI_STANDARDS.mainGrid}>
        {/* Formulário - Input */}
        <div className="space-y-4 animate-in slide-in-from-left-5 duration-300">
          {/* Card: Parâmetros Gerais */}
          <Card className="glass border-primary/20">
            <CardHeader className="pb-3 bg-gradient-to-r from-primary/5 to-transparent">
              <CardTitle className="flex items-center gap-2 text-base">
                <Info className="w-5 h-5 text-primary" />
                Dados do Ensaio
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-3">
              <TooltipProvider>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4" data-tour="config-gerais">
                  <div className="space-y-1.5">
                    <div className="flex items-center h-5">
                      <Label htmlFor="volumeCilindro" className="text-xs flex items-center gap-1">
                        Volume (cm³)
                        <Tooltip>
                          <TooltipTrigger><Info className="w-3 h-3 text-muted-foreground/50 hover:text-muted-foreground cursor-help" /></TooltipTrigger>
                          <TooltipContent><p className="max-w-xs text-xs">{tooltips.volumeCilindro}</p></TooltipContent>
                        </Tooltip>
                      </Label>
                    </div>
                    <Controller name="volumeCilindro" control={form.control} render={({ field }) => (
                      <Input id="volumeCilindro" type="number" step="0.01" placeholder="Ex: 982" {...field} className="h-9" />
                    )} />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center h-5">
                      <Label htmlFor="pesoCilindro" className="text-xs flex items-center gap-1">
                        Massa Cilindro (g)
                        <Tooltip>
                          <TooltipTrigger><Info className="w-3 h-3 text-muted-foreground/50 hover:text-muted-foreground cursor-help" /></TooltipTrigger>
                          <TooltipContent><p className="max-w-xs text-xs">{tooltips.pesoCilindro}</p></TooltipContent>
                        </Tooltip>
                      </Label>
                    </div>
                    <Controller name="pesoCilindro" control={form.control} render={({ field }) => (
                      <Input id="pesoCilindro" type="number" step="0.01" placeholder="Ex: 4100" {...field} className="h-9" />
                    )} />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center h-5">
                      <Label htmlFor="Gs" className="text-xs flex items-center gap-1">
                        Gs (opcional)
                        <Tooltip>
                          <TooltipTrigger><Info className="w-3 h-3 text-muted-foreground/50 hover:text-muted-foreground cursor-help" /></TooltipTrigger>
                          <TooltipContent><p className="max-w-xs text-xs">{tooltips.Gs}</p></TooltipContent>
                        </Tooltip>
                      </Label>
                    </div>
                    <Controller name="Gs" control={form.control} render={({ field }) => (
                      <Input id="Gs" type="number" step="0.01" placeholder="Ex: 2.65" {...field} value={field.value ?? ""} className="h-9" />
                    )} />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center h-5">
                      <Label htmlFor="pesoEspecificoAgua" className="text-xs">γ<sub>w</sub> (kN/m³)</Label>
                    </div>
                    <Controller name="pesoEspecificoAgua" control={form.control} render={({ field }) => (
                      <Input id="pesoEspecificoAgua" type="number" step="0.01" {...field} className="h-9" />
                    )} />
                  </div>
                </div>
              </TooltipProvider>
            </CardContent>
          </Card>

          {/* Card: Pontos de Compactação */}
          <Card className="glass border-blue-500/20" data-tour="pontos-ensaio">
            <CardHeader className="pb-3 bg-gradient-to-r from-blue-500/5 to-transparent">
              <CardTitle className="flex items-center gap-2 text-base">
                <Database className="w-5 h-5 text-blue-500" />
                Pontos de Compactação
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-3">
              <div className="flex items-center justify-between mb-1">
                <Label className="text-sm font-medium">Pontos do Ensaio</Label>
                <Button type="button" size="sm" variant="ghost" onClick={addPonto} className="h-7 px-2 text-xs gap-1" data-tour="navegacao-pontos">
                  <Plus className="w-3 h-3" /> Ponto
                </Button>
              </div>

              {/* Header Row */}
              <div className="grid grid-cols-[1fr,1fr,1fr,1fr,70px,32px] gap-1.5 px-2 mb-1 text-[10px] text-muted-foreground font-medium text-center">
                <div>Massa Amostra+Cil (g)</div>
                <div>MBU (g)</div>
                <div>MBS (g)</div>
                <div>Tara (g)</div>
                <div>w (%)</div>
                <div></div>
              </div>

              <div className="space-y-1">
                {fields.map((fieldItem, i) => {
                  // Calcular umidade automaticamente para esta linha
                  const pbu = parseFloat(form.watch(`pontos.${i}.pesoBrutoUmido`) || "0");
                  const pbs = parseFloat(form.watch(`pontos.${i}.pesoBrutoSeco`) || "0");
                  const t = parseFloat(form.watch(`pontos.${i}.tara`) || "0");
                  const umidadeCalc = (pbu > 0 && pbs > 0 && t >= 0 && pbs > t && pbu >= pbs)
                    ? ((pbu - pbs) / (pbs - t)) * 100
                    : null;

                  return (
                    <div key={fieldItem.fieldId} className="relative">
                      <div className="grid grid-cols-[1fr,1fr,1fr,1fr,70px,auto] gap-1.5 items-center p-1.5 rounded-md border bg-muted/5 transition-colors hover:bg-muted/10">
                        <Controller name={`pontos.${i}.pesoAmostaCilindro`} control={form.control} render={({ field }) => (
                          <Input className="h-8 text-xs px-2 text-center" placeholder="g" {...field} />
                        )} />
                        <Controller name={`pontos.${i}.pesoBrutoUmido`} control={form.control} render={({ field }) => (
                          <Input className="h-8 text-xs px-2 text-center" placeholder="g" {...field} value={field.value ?? ""} />
                        )} />
                        <Controller name={`pontos.${i}.pesoBrutoSeco`} control={form.control} render={({ field }) => (
                          <Input className="h-8 text-xs px-2 text-center" placeholder="g" {...field} value={field.value ?? ""} />
                        )} />
                        <Controller name={`pontos.${i}.tara`} control={form.control} render={({ field }) => (
                          <Input className="h-8 text-xs px-2 text-center" placeholder="g" {...field} value={field.value ?? ""} />
                        )} />
                        <Controller name={`pontos.${i}.umidadeDireta`} control={form.control} render={({ field }) => (
                          <Input
                            className="h-8 text-xs px-1 text-center font-mono"
                            placeholder="%"
                            {...field}
                            value={umidadeCalc !== null ? umidadeCalc.toFixed(2) : (field.value ?? "")}
                            onChange={(e) => field.onChange(e.target.value)}
                          />
                        )} />
                        <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-destructive/70 hover:text-destructive shrink-0" onClick={() => { remove(i); }} disabled={fields.length <= 3}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Error Alert */}
              {apiError && !isCalculating && (
                <Alert variant="destructive" className="p-2">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle className="text-sm">Erro</AlertTitle>
                  <AlertDescription className="text-xs">{apiError}</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Resultados */}
        <div className="space-y-4 animate-in slide-in-from-right-5 duration-300">
          {!results ? (
            <Card className="glass flex items-center justify-center p-12 text-center text-muted-foreground border-dashed min-h-[400px]">
              <div>
                <CalcIcon className="w-16 h-16 mx-auto mb-4 opacity-20" />
                <p className="text-lg font-medium mb-2">Nenhum resultado ainda</p>
                <p className="text-sm">Preencha os dados para calcular automaticamente.</p>
              </div>
            </Card>
          ) : results.erro ? (
            <Alert variant="destructive" className="min-h-[200px] flex items-center">
              <AlertCircle className="h-5 w-5" />
              <AlertDescription className="text-base ml-2">{results.erro}</AlertDescription>
            </Alert>
          ) : (
            <Tabs value={resultTab} onValueChange={setResultTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="resultados" className="gap-1.5">
                  <BarChart3 className="w-4 h-4" />
                  Resultados
                </TabsTrigger>
                <TabsTrigger value="graficos" className="gap-1.5">
                  <LayoutGrid className="w-4 h-4" />
                  Gráficos
                </TabsTrigger>
              </TabsList>

              {/* Tab Resultados */}
              <TabsContent value="resultados" className="mt-0 animate-in fade-in-50 slide-in-from-left-2 duration-300">
                <Card className="glass">
                  <CardContent className="p-0">
                    <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-border">
                      {/* Parâmetros do Ensaio */}
                      <div className="p-3 space-y-2">
                        <h4 className="font-semibold text-sm flex items-center gap-2 text-blue-500">
                          <Info className="w-4 h-4" />
                          Parâmetros do Ensaio
                        </h4>
                        <div className="space-y-[1px]">
                          <ResultRow label="Volume do Cilindro" value={parseFloat(form.getValues().volumeCilindro)} unit="cm³" />
                          <ResultRow label="Massa do Cilindro" value={parseFloat(form.getValues().pesoCilindro)} unit="g" />
                          <ResultRow label="Densidade dos Grãos (Gs)" value={form.getValues().Gs ? parseFloat(form.getValues().Gs!) : null} unit="" precision={3} />
                          <ResultRow label="Peso Esp. da Água" value={parseFloat(form.getValues().pesoEspecificoAgua)} unit="kN/m³" />
                        </div>
                      </div>

                      {/* Resultados da Compactação */}
                      <div className="p-3 space-y-2">
                        <h4 className="font-semibold text-sm flex items-center gap-2 text-blue-500">
                          <BarChart3 className="w-4 h-4" />
                          Resultados da Compactação
                        </h4>
                        <div className="space-y-[1px]">
                          <ResultRow
                            label={<span><span className="font-serif italic font-bold text-lg text-foreground">w</span><sub className="text-[10px] text-foreground">ót</sub> <span className="text-[10px] font-normal opacity-70">(Umidade Ótima)</span></span>}
                            value={results.umidade_otima}
                            unit="%"
                            precision={1}
                          />
                          <ResultRow
                            label={<span><span className="font-serif italic font-bold text-lg text-foreground">ρ<sub className="text-xs">d</sub></span> <span className="text-[10px] font-normal opacity-70">(Massa Esp. Seca Máx)</span></span>}
                            value={results.peso_especifico_seco_max !== null ? results.peso_especifico_seco_max / 10 : null}
                            unit="g/cm³"
                            precision={3}

                          />
                          <ResultRow
                            label={<span><span className="font-serif italic font-bold text-lg text-foreground">γ<sub className="text-xs">d</sub></span> <span className="text-[10px] font-normal opacity-70">(Peso Esp. Seco Máx)</span></span>}
                            value={results.peso_especifico_seco_max}
                            unit="kN/m³"
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Tabela de Pontos */}
                <Card className="glass mt-4">
                  <CardHeader className="pb-2 pt-4 px-5">
                    <CardTitle className="text-sm font-semibold text-muted-foreground">
                      Pontos Calculados
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-5 pb-5">
                    {results.pontos_curva_compactacao && (
                      <div className="rounded-md border">
                        <TabelaResultados pontos={results.pontos_curva_compactacao} />
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Tab Gráficos */}
              <TabsContent value="graficos" className="mt-0">
                <Card className="glass overflow-hidden" data-tour="resultados">
                  <CardContent className="p-4">
                    <div id="curva-compactacao-chart">
                      <CurvaCompactacao
                        ref={curvaCompactacaoRef}
                        pontosEnsaio={results.pontos_curva_compactacao || []}
                        umidadeOtima={results.umidade_otima ?? undefined}
                        gamaSecoMax={results.peso_especifico_seco_max ?? undefined}
                        pontosSaturacao={results.pontos_curva_saturacao_100 ?? undefined}
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          )}
        </div>
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

      {/* Diálogo pós-exportação: PDF salvo */}
      <Dialog open={pdfSavedDialogOpen} onOpenChange={setPdfSavedDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Relatório gerado</DialogTitle>
            <DialogDescription>
              O PDF foi salvo na seção Relatórios. Deseja ir para lá agora?
            </DialogDescription>
          </DialogHeader>
          <UIDialogFooter className="gap-2 sm:gap-2">
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
          </UIDialogFooter>
        </DialogContent>
      </Dialog>

      <SavedCalculations
        open={loadDialogOpen}
        onOpenChange={setLoadDialogOpen}
        calculations={calculations}
        onLoad={handleLoadCalculation}
        onDelete={deleteCalculation}
        onRename={renameCalculation}
        moduleName="Compactação"
      />
    </div >
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
// Função auxiliar para linhas de resultado
// Função auxiliar para linhas de resultado
function ResultRow({ label, value, unit, precision = 2, highlight = false }: { label: string | React.ReactNode, value: number | null | undefined, unit: string, precision?: number, highlight?: boolean }) {
  if (value === undefined || value === null || isNaN(value)) return null;
  return (
    <div className={cn(
      "flex justify-between items-center text-sm py-2 px-3 rounded-md transition-colors",
      highlight ? "font-semibold bg-primary/5 text-primary" : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
    )}>
      <span className={cn("flex-1", highlight && "text-foreground")}>{label}</span>
      <span className={cn("font-mono font-medium text-right whitespace-nowrap ml-2", highlight ? "text-primary dark:text-primary-foreground" : "text-foreground dark:text-white")}>
        {value.toFixed(precision)} {unit}
      </span>
    </div>
  );
}

