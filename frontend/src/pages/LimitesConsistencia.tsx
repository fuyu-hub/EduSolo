// frontend/src/pages/LimitesConsistencia.tsx
import { useState, useEffect, useRef } from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { calcularLimitesConsistencia } from "@/lib/calculations/limites-consistencia";
import { z } from "zod";
import { Droplet, Info, Calculator as CalcIcon, Plus, Trash2, LineChart, ChevronLeft, ChevronRight, AlertCircle, BarChart3, Save, FolderOpen, Download, Printer, FileText, GraduationCap } from "lucide-react";

import { toast } from "@/components/ui/sonner";
import type { CarouselApi } from "@/components/ui/carousel";
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useNotification } from "@/hooks/use-notification";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import LimiteLiquidezChart from "@/components/limites/LimiteLiquidezChart";
import { useSavedCalculations } from "@/hooks/use-saved-calculations";
import { useSettings } from "@/hooks/use-settings";
import { useTheme } from "@/hooks/use-theme";
import SavedCalculations from "@/components/SavedCalculations";
import SaveDialog from "@/components/SaveDialog";
import PrintHeader from "@/components/PrintHeader";
import CalculationActions from "@/components/CalculationActions";
import { exportToPDF, exportToExcel, ExportData, ExcelExportData, formatNumberForExport, generateDefaultPDFFileName } from "@/lib/export-utils";
import { useRecentReports } from "@/hooks/useRecentReports";
import { prepareReportForStorage } from "@/lib/reportManager";
import { useNavigate } from "react-router-dom";
import ExportPDFDialog from "@/components/ExportPDFDialog";
import DialogExemplos from "@/components/limites/DialogExemplos";
import { ExemploLimites, exemplosLimites } from "@/lib/exemplos-limites";
import { MobileModuleWrapper } from "@/components/mobile";
import LimitesConsistenciaMobile from "./mobile/LimitesConsistenciaMobile";

// --- Esquema Zod (Inalterado) ---
const pontoLLSchema = z.object({
  id: z.string(),
  numGolpes: z.string().min(1, { message: "Campo obrigatório" }).refine(val => !isNaN(parseInt(val)) && parseInt(val) > 0, { message: "Deve ser maior que 0" }),
  massaUmidaRecipiente: z.string().min(1, { message: "Campo obrigatório" }).refine(val => !isNaN(parseFloat(val)) && parseFloat(val) > 0, { message: "Deve ser maior que 0" }),
  massaSecaRecipiente: z.string().min(1, { message: "Campo obrigatório" }).refine(val => !isNaN(parseFloat(val)) && parseFloat(val) > 0, { message: "Deve ser maior que 0" }),
  massaRecipiente: z.string().min(1, { message: "Campo obrigatório" }).refine(val => !isNaN(parseFloat(val)) && parseFloat(val) >= 0, { message: "Deve ser maior ou igual a 0" }),
}).refine(data => {
  const mu = parseFloat(data.massaUmidaRecipiente);
  const ms = parseFloat(data.massaSecaRecipiente);
  return isNaN(mu) || isNaN(ms) || mu >= ms;
}, {
  message: "Massa úmida deve ser maior ou igual à massa seca",
  path: ["massaUmidaRecipiente"],
}).refine(data => {
  const msr = parseFloat(data.massaSecaRecipiente);
  const mr = parseFloat(data.massaRecipiente);
  return isNaN(msr) || isNaN(mr) || msr >= mr;
}, {
  message: "Massa seca+recipiente deve ser maior ou igual à massa do recipiente",
  path: ["massaSecaRecipiente"],
});

const pontoLPSchema = z.object({
  id: z.string(),
  massaUmidaRecipiente: z.string().min(1, { message: "Campo obrigatório" }).refine(val => !isNaN(parseFloat(val)) && parseFloat(val) > 0, { message: "Deve ser maior que 0" }),
  massaSecaRecipiente: z.string().min(1, { message: "Campo obrigatório" }).refine(val => !isNaN(parseFloat(val)) && parseFloat(val) > 0, { message: "Deve ser maior que 0" }),
  massaRecipiente: z.string().min(1, { message: "Campo obrigatório" }).refine(val => !isNaN(parseFloat(val)) && parseFloat(val) >= 0, { message: "Deve ser maior ou igual a 0" }),
}).refine(data => {
  const mu = parseFloat(data.massaUmidaRecipiente);
  const ms = parseFloat(data.massaSecaRecipiente);
  return isNaN(mu) || isNaN(ms) || mu >= ms;
}, {
  message: "Massa úmida deve ser maior ou igual à massa seca",
  path: ["massaUmidaRecipiente"],
}).refine(data => {
  const msr = parseFloat(data.massaSecaRecipiente);
  const mr = parseFloat(data.massaRecipiente);
  return isNaN(msr) || isNaN(mr) || msr >= mr;
}, {
  message: "Massa seca+recipiente deve ser maior ou igual à massa do recipiente",
  path: ["massaSecaRecipiente"],
});

const formSchema = z.object({
  pontosLL: z.array(pontoLLSchema).min(2, { message: "São necessários pelo menos 2 pontos de ensaio válidos" }),
  pontosLP: z.array(pontoLPSchema).min(1, { message: "É necessário pelo menos 1 ensaio de LP" }),
  umidadeNatural: z.string().optional().refine(val => val === undefined || val === "" || (!isNaN(parseFloat(val)) && parseFloat(val) >= 0), {
    message: "Deve ser maior ou igual a 0 (ou deixe vazio)",
  }),
  percentualArgila: z.string().optional().refine(val => val === undefined || val === "" || (!isNaN(parseFloat(val)) && parseFloat(val) >= 0 && parseFloat(val) <= 100), {
    message: "Deve estar entre 0 e 100% (ou deixe vazio)",
  }),
});

// Tipagem do formulário
type FormInputValues = z.infer<typeof formSchema>;

// Tipagem para a API
type ApiInputData = {
  pontos_ll: { num_golpes: number; massa_umida_recipiente: number; massa_seca_recipiente: number; massa_recipiente: number; }[];
  pontos_lp: { massa_umida_recipiente: number; massa_seca_recipiente: number; massa_recipiente: number; }[];
  umidade_natural?: number; percentual_argila?: number;
};

// --- Interfaces (mantidas) ---
interface PontoCurva {
  x: number; // log10(num_golpes)
  y: number; // umidade (%)
}

interface LimitesConsistenciaOutput { ll: number | null; lp: number | null; ip: number | null; ic: number | null; classificacao_plasticidade: string | null; classificacao_consistencia: string | null; atividade_argila: number | null; classificacao_atividade: string | null; pontos_grafico_ll?: PontoCurva[] | null; erro?: string | null; }
type Results = LimitesConsistenciaOutput;

// --- Tooltips (mantidos) ---
const tooltips = { numGolpes: "Número de golpes necessários para fechar a ranhura no ensaio LL (NBR 6459)", massaUmidaRecipienteLL: "Massa do recipiente (tara) + solo úmido (g) - Ensaio LL", massaSecaRecipienteLL: "Massa do recipiente (tara) + solo seco após estufa (g) - Ensaio LL", massaRecipienteLL: "Massa do recipiente (tara) utilizado no ensaio LL (g)", massaUmidaRecipienteLP: "Massa do recipiente (tara) + solo úmido (g) - Ensaio LP (NBR 7180)", massaSecaRecipienteLP: "Massa do recipiente (tara) + solo seco após estufa (g) - Ensaio LP", massaRecipienteLP: "Massa do recipiente (tara) utilizado no ensaio LP (g)", umidadeNatural: "Umidade natural do solo em campo (%) - Necessária para calcular IC", percentualArgila: "Percentual de partículas < 0.002mm (%) - Necessário para calcular Atividade (Ia)", LL: "Limite de Liquidez - teor de umidade na transição entre os estados líquido e plástico", LP: "Limite de Plasticidade - teor de umidade na transição entre os estados plástico e semissólido", IP: "Índice de Plasticidade = LL - LP (faixa de comportamento plástico)", IC: "Índice de Consistência = (LL - w_nat) / IP (estado de consistência do solo)", Atividade: "Atividade da Argila (Ia) = IP / (% argila)", CartaPlasticidade: "Carta de Plasticidade de Casagrande mostrando a classificação do solo (LL vs IP)" };

// Cálculos agora são feitos localmente no frontend

// Função para gerar IDs únicos
const generateId = () => `${Date.now()}-${Math.floor(Math.random() * 1000000)}`;

// --- Interface ResultItemProps (mantida) ---
interface ResultItemProps { label: string; value: number | string | null; unit: string; tooltip?: string; highlight?: boolean; precision?: number; }

function LimitesConsistenciaDesktop() {
  const notify = useNotification();
  const { settings } = useSettings();
  const { theme } = useTheme();
  const { addReport } = useRecentReports();
  const navigate = useNavigate();
  const [currentPointIndex, setCurrentPointIndex] = useState(0);
  const [currentLPIndex, setCurrentLPIndex] = useState(0);
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();
  const [pdfSavedDialogOpen, setPdfSavedDialogOpen] = useState(false);

  const form = useForm<FormInputValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      pontosLL: [
        { id: generateId(), numGolpes: "", massaUmidaRecipiente: "", massaSecaRecipiente: "", massaRecipiente: "" },
        { id: generateId(), numGolpes: "", massaUmidaRecipiente: "", massaSecaRecipiente: "", massaRecipiente: "" }
      ],
      pontosLP: [
        { id: generateId(), massaUmidaRecipiente: "", massaSecaRecipiente: "", massaRecipiente: "" }
      ],
      umidadeNatural: "",
      percentualArgila: ""
    },
    mode: "onBlur",
  });

  const { fields, append, remove } = useFieldArray({ control: form.control, name: "pontosLL", keyName: "fieldId" });
  const { fields: fieldsLP, append: appendLP, remove: removeLP } = useFieldArray({ control: form.control, name: "pontosLP", keyName: "fieldIdLP" });

  const [results, setResults] = useState<Results | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // Estados para salvamento e exportação
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [saveName, setSaveName] = useState("");
  const [loadDialogOpen, setLoadDialogOpen] = useState(false);
  const { calculations, saveCalculation, deleteCalculation, renameCalculation } = useSavedCalculations("limites-consistencia");

  // Estados para exportação PDF
  const [exportPDFDialogOpen, setExportPDFDialogOpen] = useState(false);
  const [pdfFileName, setPdfFileName] = useState("");
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const limiteLiquidezChartRef = useRef<HTMLDivElement>(null);



  useEffect(() => { if (fields.length > 0) { setCurrentPointIndex(prev => Math.min(prev, fields.length - 1)); } else { setCurrentPointIndex(0); } }, [fields.length]);



  const addPontoLL = () => { append({ id: generateId(), numGolpes: "", massaUmidaRecipiente: "", massaSecaRecipiente: "", massaRecipiente: "" }); setCurrentPointIndex(fields.length); };
  const removePontoLL = () => { if (fields.length > 2) { remove(currentPointIndex); } else { notify.warning({ title: "Atenção", description: "São necessários pelo menos 2 pontos para o cálculo do LL." }); } };
  const goToNextPoint = () => { setCurrentPointIndex(prev => Math.min(prev + 1, fields.length - 1)); };
  const goToPreviousPoint = () => { setCurrentPointIndex(prev => Math.max(prev - 1, 0)); };

  const addPontoLP = () => { appendLP({ id: generateId(), massaUmidaRecipiente: "", massaSecaRecipiente: "", massaRecipiente: "" }); setCurrentLPIndex(fieldsLP.length); };
  const removePontoLP = () => { if (fieldsLP.length > 1) { removeLP(currentLPIndex); setCurrentLPIndex(prev => Math.max(0, prev - 1)); } else { notify.warning({ title: "Atenção", description: "É necessário pelo menos 1 ensaio LP." }); } };
  const goToNextLP = () => { setCurrentLPIndex(prev => Math.min(prev + 1, fieldsLP.length - 1)); };
  const goToPreviousLP = () => { setCurrentLPIndex(prev => Math.max(prev - 1, 0)); };

  const handleClear = () => { form.reset({ pontosLL: [{ id: generateId(), numGolpes: "", massaUmidaRecipiente: "", massaSecaRecipiente: "", massaRecipiente: "" }, { id: generateId(), numGolpes: "", massaUmidaRecipiente: "", massaSecaRecipiente: "", massaRecipiente: "" }], pontosLP: [{ id: generateId(), massaUmidaRecipiente: "", massaSecaRecipiente: "", massaRecipiente: "" }], umidadeNatural: "", percentualArgila: "" }); setCurrentPointIndex(0); setCurrentLPIndex(0); setResults(null); setApiError(null); };

  const handleSelectExample = (exemplo: ExemploLimites) => {
    const currentLengthLL = fields.length;
    const targetLengthLL = exemplo.pontosLL.length;
    const currentLengthLP = fieldsLP.length;
    const targetLengthLP = exemplo.pontosLP.length;

    // Ajusta a quantidade de pontos LL
    if (currentLengthLL < targetLengthLL) {
      for (let i = 0; i < targetLengthLL - currentLengthLL; i++) {
        append({ id: generateId(), numGolpes: "", massaUmidaRecipiente: "", massaSecaRecipiente: "", massaRecipiente: "" }, { shouldFocus: false });
      }
    } else if (currentLengthLL > targetLengthLL) {
      for (let i = currentLengthLL - 1; i >= targetLengthLL; i--) {
        remove(i);
      }
    }

    // Ajusta a quantidade de pontos LP
    if (currentLengthLP < targetLengthLP) {
      for (let i = 0; i < targetLengthLP - currentLengthLP; i++) {
        appendLP({ id: generateId(), massaUmidaRecipiente: "", massaSecaRecipiente: "", massaRecipiente: "" }, { shouldFocus: false });
      }
    } else if (currentLengthLP > targetLengthLP) {
      for (let i = currentLengthLP - 1; i >= targetLengthLP; i--) {
        removeLP(i);
      }
    }

    setTimeout(() => {
      form.reset({
        pontosLL: exemplo.pontosLL.map(p => ({ ...p, id: generateId() })),
        pontosLP: exemplo.pontosLP.map(p => ({ ...p, id: generateId() })),
        umidadeNatural: exemplo.umidadeNatural || "",
        percentualArgila: exemplo.percentualArgila || ""
      });
      setCurrentPointIndex(0);
      setCurrentLPIndex(0);
      setResults(null);
      setApiError(null);
      notify.success({ title: "Exemplo Carregado", description: `Dados de ${exemplo.nome} preenchidos com sucesso.` });
    }, 0);
  };

  // Funções de salvamento e exportação
  const handleSaveClick = () => {
    if (!results) return;
    setSaveName(`Cálculo ${new Date().toLocaleDateString('pt-BR')}`);
    setSaveDialogOpen(true);
  };

  const handleConfirmSave = () => {
    if (!results || !saveName.trim()) return;
    const formData = form.getValues();
    const success = saveCalculation(saveName.trim(), formData, results);
    if (success) {
      notify.success({ title: "Cálculo salvo!", description: "O cálculo foi salvo com sucesso." });
      setSaveDialogOpen(false);
      setSaveName("");
    } else {
      notify.error({ title: "Erro ao salvar", description: "Não foi possível salvar o cálculo." });
    }
  };

  const handleLoadCalculation = (calculation: any) => {
    const data = calculation.formData;
    form.reset(data);
    setResults(calculation.results);
    setCurrentPointIndex(0);
    notify.success({ title: "Cálculo carregado!", description: `"${calculation.name}" foi carregado com sucesso.` });
  };



  const handleExportPDF = () => {
    if (!results) return;

    // Gerar nome padrão usando a função auxiliar
    const defaultName = generateDefaultPDFFileName("Limites de Consistência");

    setPdfFileName(defaultName);
    setExportPDFDialogOpen(true);
  };

  const handleConfirmExportPDF = async () => {
    if (!results) return;
    const formData = form.getValues();

    setIsExportingPDF(true);

    try {
      notify.info({ description: "Gerando PDF..." });

      const inputs: { label: string; value: string }[] = [];
      if (formData.umidadeNatural) inputs.push({ label: "Umidade Natural", value: `${formData.umidadeNatural}%` });
      if (formData.percentualArgila) inputs.push({ label: "Percentual de Argila", value: `${formData.percentualArgila}%` });

      const resultsList: { label: string; value: string }[] = [];
      if (results.ll !== null) resultsList.push({ label: "Limite de Liquidez (LL)", value: `${formatNumberForExport(results.ll, 0)}%` });
      if (results.lp !== null) resultsList.push({ label: "Limite de Plasticidade (LP)", value: `${formatNumberForExport(results.lp, 0)}%` });
      if (results.ip !== null) resultsList.push({ label: "Índice de Plasticidade (IP)", value: `${formatNumberForExport(results.ip, 0)}%` });
      if (results.ic !== null) resultsList.push({ label: "Índice de Consistência (IC)", value: formatNumberForExport(results.ic, 2) });
      if (results.classificacao_plasticidade) resultsList.push({ label: "Classificação Plasticidade", value: results.classificacao_plasticidade });
      if (results.classificacao_consistencia) resultsList.push({ label: "Classificação Consistência", value: results.classificacao_consistencia });
      if (results.atividade_argila !== null) resultsList.push({ label: "Atividade Argila (Ia)", value: formatNumberForExport(results.atividade_argila, 2) });
      if (results.classificacao_atividade) resultsList.push({ label: "Classificação Atividade", value: results.classificacao_atividade });

      const tables = [];

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

      // Fórmulas utilizadas
      const formulas = [
        {
          label: "Teor de Umidade em Cada Ponto",
          formula: "w = ((Massa Úmida - Massa Seca) / (Massa Seca - Massa Recipiente)) × 100",
          description: "Teor de umidade calculado para cada ponto do ensaio"
        },
        {
          label: "Limite de Liquidez (LL)",
          formula: "LL = umidade correspondente a 25 golpes (regressão log-linear)",
          description: "Obtido através do gráfico de umidade vs. log(N° golpes), interpolado para 25 golpes"
        },
        {
          label: "Limite de Plasticidade (LP)",
          formula: "LP = umidade do ensaio quando o cilindro atinge 3mm de diâmetro",
          description: "Teor de umidade na transição entre estado plástico e semi-sólido"
        },
        {
          label: "Índice de Plasticidade (IP)",
          formula: "IP = LL - LP",
          description: "Faixa de umidade em que o solo se comporta plasticamente"
        },
      ];

      if (results.ic !== null) {
        formulas.push({
          label: "Índice de Consistência (IC)",
          formula: "IC = (LL - w) / IP",
          description: "Indica o estado de consistência do solo in situ. IC < 0: líquido, 0-1: plástico, > 1: semi-sólido/sólido"
        });
      }

      if (results.atividade_argila !== null) {
        formulas.push({
          label: "Atividade da Argila (Ia)",
          formula: "Ia = IP / % Argila",
          description: "Relaciona a plasticidade com o teor de argila. Ia < 0.75: inativa, 0.75-1.25: normal, > 1.25: ativa"
        });
      }

      const exportData: ExportData = {
        moduleName: "limites-consistencia",
        moduleTitle: "Limites de Consistência",
        inputs,
        results: resultsList,
        formulas,
        tables,
        customFileName: pdfFileName,
        theme: { mode: theme.mode, color: (theme as any).color || 'indigo' },
        printSettings: settings.printSettings
      };

      // Gerar o PDF como Blob para salvar nos Relatórios
      const pdfBlob = await exportToPDF(exportData, true) as Blob;

      // Preparar e salvar nos Relatórios recentes
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
        notify.success({ title: "Relatório salvo", description: "PDF disponível em Relatórios" });
        // No desktop, exibir diálogo com CTA para navegar
        setPdfSavedDialogOpen(true);
      } else {
        notify.error({ title: "Erro ao salvar relatório", description: "O PDF foi gerado, mas não pôde ser salvo em Relatórios." });
      }
    } catch (error) {
      console.error("Erro ao exportar PDF:", error);
      setIsExportingPDF(false);
      notify.error({ title: "Erro ao exportar", description: "Ocorreu um erro ao gerar o PDF. Tente novamente." });
    }
  };

  const handleExportExcel = async () => {
    if (!results) return;
    const formData = form.getValues();

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
    if (results.ll !== null) resultadosData.push({ label: "Limite de Liquidez (LL) %", value: results.ll.toFixed(0) });
    if (results.lp !== null) resultadosData.push({ label: "Limite de Plasticidade (LP) %", value: results.lp.toFixed(0) });
    if (results.ip !== null) resultadosData.push({ label: "Índice de Plasticidade (IP) %", value: results.ip.toFixed(0) });
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
      notify.success({ title: "Excel exportado!", description: "O arquivo foi baixado com sucesso." });
    } else {
      notify.error({ title: "Erro ao exportar", description: "Não foi possível gerar o Excel." });
    }
  };

  const onSubmit = async (data: FormInputValues) => {
    setIsCalculating(true); setApiError(null); setResults(null);
    let apiInput: ApiInputData;
    try {
      apiInput = {
        pontos_ll: data.pontosLL.map(p => ({ num_golpes: parseInt(p.numGolpes, 10), massa_umida_recipiente: parseFloat(p.massaUmidaRecipiente), massa_seca_recipiente: parseFloat(p.massaSecaRecipiente), massa_recipiente: parseFloat(p.massaRecipiente) })),
        pontos_lp: data.pontosLP.map(p => ({ massa_umida_recipiente: parseFloat(p.massaUmidaRecipiente), massa_seca_recipiente: parseFloat(p.massaSecaRecipiente), massa_recipiente: parseFloat(p.massaRecipiente) })),
        umidade_natural: (data.umidadeNatural && data.umidadeNatural !== "") ? parseFloat(data.umidadeNatural) : undefined, percentual_argila: (data.percentualArgila && data.percentualArgila !== "") ? parseFloat(data.percentualArgila) : undefined,
      };
      if (apiInput.umidade_natural === undefined) delete apiInput.umidade_natural; if (apiInput.percentual_argila === undefined) delete apiInput.percentual_argila;
    } catch (parseError) { setApiError("Erro interno ao processar os dados do formulário. Verifique se os números são válidos."); notify.error({ title: "Erro de Formulário", description: "Verifique se todos os campos numéricos contêm valores válidos." }); setIsCalculating(false); return; }
    try {
      // Calcula localmente no frontend
      const resultado = calcularLimitesConsistencia(apiInput);
      if (resultado.erro) { setApiError(resultado.erro); notify.error({ title: "Erro no Cálculo", description: resultado.erro }); }
      else {
        setResults(resultado);
        notify.success({ title: "Sucesso", description: "Cálculo dos limites de consistência realizado." });
      }
    } catch (err) { let errorMessage = "Erro ao calcular limites de consistência."; if (err instanceof Error) { errorMessage = err.message; } setApiError(errorMessage); notify.error({ title: "Erro no Cálculo", description: errorMessage }); }
    finally { setIsCalculating(false); }
  };

  const errors = form.formState.errors;
  const currentPointField = fields[currentPointIndex];
  const canSubmit = !isCalculating && form.formState.isValid && !apiError;

  return (
    <div className="space-y-4 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <PrintHeader moduleTitle="Limites de Consistência" moduleName="limites-consistencia" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 animate-in fade-in slide-in-from-left-4 duration-500" data-tour="module-header">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-gradient-to-br from-cyan-500 via-teal-500 to-emerald-600 flex items-center justify-center shadow-lg transition-transform hover:scale-110 hover:rotate-3"> <Droplet className="w-5 h-5 sm:w-6 sm:h-6 text-white" /> </div>
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Limites de Consistência</h1>
            <p className="text-muted-foreground text-xs sm:text-sm">Determinação de LL, LP, IP, IC, Atividade e classificações</p>
          </div>
        </div>

        <div className="flex items-center gap-2" data-tour="actions">
          <DialogExemplos onSelectExample={handleSelectExample} disabled={isCalculating} />

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
        {/* Formulário com Accordion */}
        <Card className="glass flex flex-col p-4 sm:p-6 animate-in fade-in slide-in-from-left-4 duration-700" style={{ animationDelay: '100ms', animationFillMode: 'backwards' }}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col flex-1">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-xl"> <Info className="w-5 h-5" /> Dados dos Ensaios </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 p-4 pt-0 flex-1">
              <TooltipProvider>
                <Accordion type="multiple" defaultValue={["ll", "lp", "adicionais"]} className="w-full space-y-3">
                  {/* Item Accordion: LL */}
                  <AccordionItem value="ll" className="border-0">
                    <AccordionTrigger className="text-sm font-semibold text-foreground bg-accent/5 hover:bg-accent/10 px-3 py-2 rounded-lg border border-accent/20 [&[data-state=open]]:rounded-b-none">
                      <div className="flex items-center gap-1.5"> <Droplet className="w-4 h-4 text-indigo-500" /> Limite de Liquidez (LL) </div>
                    </AccordionTrigger>
                    <AccordionContent className="p-0 pt-2">
                      <div className="space-y-2 rounded-lg bg-background/30 border border-accent/20 border-t-0 rounded-t-none p-3" data-tour="pontos-ll">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-medium text-xs text-muted-foreground"> Ponto {currentPointIndex + 1} / {fields.length} </h4>
                          <div className="flex items-center gap-1">
                            <Button type="button" onClick={goToPreviousPoint} size="icon" variant="outline" className="h-6 w-6" disabled={currentPointIndex === 0}> <ChevronLeft className="w-3.5 h-3.5" /> </Button>
                            <Button type="button" onClick={goToNextPoint} size="icon" variant="outline" className="h-6 w-6" disabled={currentPointIndex === fields.length - 1}> <ChevronRight className="w-3.5 h-3.5" /> </Button>
                            <Button type="button" onClick={addPontoLL} size="icon" variant="outline" className="h-6 w-6 ml-1.5" data-tour="add-ponto"> <Plus className="w-3.5 h-3.5" /> </Button>
                            <Button type="button" onClick={removePontoLL} size="icon" variant="destructive" className="h-6 w-6" disabled={fields.length <= 2}> <Trash2 className="w-3.5 h-3.5" /> </Button>
                          </div>
                        </div>
                        {currentPointField && (
                          <div key={currentPointField.id} className="space-y-2">
                            <div className="grid grid-cols-2 gap-3">
                              <div className="space-y-2">
                                <div className="space-y-0.5">
                                  <div className="flex items-center gap-2">
                                    <Label htmlFor={`pontosLL.${currentPointIndex}.numGolpes`} className={cn("text-xs", errors.pontosLL?.[currentPointIndex]?.numGolpes && "text-destructive")}>Nº Golpes</Label>
                                    <Popover>
                                      <PopoverTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-5 w-5 p-0 hover:bg-muted">
                                          <Info className="w-4 h-4 text-muted-foreground cursor-pointer" />
                                        </Button>
                                      </PopoverTrigger>
                                      <PopoverContent className="max-w-xs" align="start">
                                        <p className="text-sm">{tooltips.numGolpes}</p>
                                      </PopoverContent>
                                    </Popover>
                                  </div>
                                  <Controller name={`pontosLL.${currentPointIndex}.numGolpes`} control={form.control} render={({ field }) => (<Input id={`pontosLL.${currentPointIndex}.numGolpes`} type="number" placeholder="Ex: 25" {...field} className={cn("bg-background/50 h-9", errors.pontosLL?.[currentPointIndex]?.numGolpes && "border-destructive")} />)} />
                                  {errors.pontosLL?.[currentPointIndex]?.numGolpes && <p className="text-xs text-destructive mt-0.5">{errors.pontosLL[currentPointIndex]?.numGolpes?.message}</p>}
                                </div>
                                <div className="space-y-0.5">
                                  <div className="flex items-center gap-2">
                                    <Label htmlFor={`pontosLL.${currentPointIndex}.massaUmidaRecipiente`} className={cn("text-xs", errors.pontosLL?.[currentPointIndex]?.massaUmidaRecipiente && "text-destructive")}>M. Úmida + Recip. (g)</Label>
                                    <Popover>
                                      <PopoverTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-5 w-5 p-0 hover:bg-muted">
                                          <Info className="w-4 h-4 text-muted-foreground cursor-pointer" />
                                        </Button>
                                      </PopoverTrigger>
                                      <PopoverContent className="max-w-xs" align="start">
                                        <p className="text-sm">{tooltips.massaUmidaRecipienteLL}</p>
                                      </PopoverContent>
                                    </Popover>
                                  </div>
                                  <Controller name={`pontosLL.${currentPointIndex}.massaUmidaRecipiente`} control={form.control} render={({ field }) => (<Input id={`pontosLL.${currentPointIndex}.massaUmidaRecipiente`} type="number" step="0.01" placeholder="Ex: 45.50" {...field} className={cn("bg-background/50 h-9", errors.pontosLL?.[currentPointIndex]?.massaUmidaRecipiente && "border-destructive")} />)} />
                                  {errors.pontosLL?.[currentPointIndex]?.massaUmidaRecipiente && <p className="text-xs text-destructive mt-0.5">{errors.pontosLL[currentPointIndex]?.massaUmidaRecipiente?.message}</p>}
                                </div>
                              </div>
                              <div className="space-y-2">
                                <div className="space-y-0.5">
                                  <div className="flex items-center gap-2">
                                    <Label htmlFor={`pontosLL.${currentPointIndex}.massaSecaRecipiente`} className={cn("text-xs", errors.pontosLL?.[currentPointIndex]?.massaSecaRecipiente && "text-destructive")}>M. Seca + Recip. (g)</Label>
                                    <Popover>
                                      <PopoverTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-5 w-5 p-0 hover:bg-muted">
                                          <Info className="w-4 h-4 text-muted-foreground cursor-pointer" />
                                        </Button>
                                      </PopoverTrigger>
                                      <PopoverContent className="max-w-xs" align="start">
                                        <p className="text-sm">{tooltips.massaSecaRecipienteLL}</p>
                                      </PopoverContent>
                                    </Popover>
                                  </div>
                                  <Controller name={`pontosLL.${currentPointIndex}.massaSecaRecipiente`} control={form.control} render={({ field }) => (<Input id={`pontosLL.${currentPointIndex}.massaSecaRecipiente`} type="number" step="0.01" placeholder="Ex: 38.00" {...field} className={cn("bg-background/50 h-9", errors.pontosLL?.[currentPointIndex]?.massaSecaRecipiente && "border-destructive")} />)} />
                                  {errors.pontosLL?.[currentPointIndex]?.massaSecaRecipiente && <p className="text-xs text-destructive mt-0.5">{errors.pontosLL[currentPointIndex]?.massaSecaRecipiente?.message}</p>}
                                </div>
                                <div className="space-y-0.5">
                                  <div className="flex items-center gap-2">
                                    <Label htmlFor={`pontosLL.${currentPointIndex}.massaRecipiente`} className={cn("text-xs", errors.pontosLL?.[currentPointIndex]?.massaRecipiente && "text-destructive")}>M. Recipiente (g)</Label>
                                    <Popover>
                                      <PopoverTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-5 w-5 p-0 hover:bg-muted">
                                          <Info className="w-4 h-4 text-muted-foreground cursor-pointer" />
                                        </Button>
                                      </PopoverTrigger>
                                      <PopoverContent className="max-w-xs" align="start">
                                        <p className="text-sm">{tooltips.massaRecipienteLL}</p>
                                      </PopoverContent>
                                    </Popover>
                                  </div>
                                  <Controller name={`pontosLL.${currentPointIndex}.massaRecipiente`} control={form.control} render={({ field }) => (<Input id={`pontosLL.${currentPointIndex}.massaRecipiente`} type="number" step="0.01" placeholder="Ex: 15.00" {...field} className={cn("bg-background/50 h-9", errors.pontosLL?.[currentPointIndex]?.massaRecipiente && "border-destructive")} />)} />
                                  {errors.pontosLL?.[currentPointIndex]?.massaRecipiente && <p className="text-xs text-destructive mt-0.5">{errors.pontosLL[currentPointIndex]?.massaRecipiente?.message}</p>}
                                </div>
                              </div>
                            </div>
                            {errors.pontosLL?.[currentPointIndex]?.root && (<p className="text-xs text-destructive mt-1">{errors.pontosLL[currentPointIndex]?.root?.message}</p>)}
                          </div>
                        )}
                        {errors.pontosLL && typeof errors.pontosLL === 'object' && 'message' in errors.pontosLL && typeof errors.pontosLL.message === 'string' && (<p className="text-xs text-destructive mt-1">{errors.pontosLL.message}</p>)}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                  {/* Item Accordion: LP */}
                  <AccordionItem value="lp" className="border-0">
                    <AccordionTrigger className="text-sm font-semibold text-foreground bg-accent/5 hover:bg-accent/10 px-3 py-2 rounded-lg border border-accent/20 [&[data-state=open]]:rounded-b-none">
                      <div className="flex items-center gap-1.5"> <Droplet className="w-4 h-4 text-blue-500" /> Limite de Plasticidade (LP) </div>
                    </AccordionTrigger>
                    <AccordionContent className="p-3 bg-accent/5 rounded-b-lg border border-t-0 border-accent/20">
                      <div className="space-y-2" data-tour="ensaio-lp">
                        {/* Navegação entre ensaios LP */}
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2">
                            <Button type="button" variant="outline" size="icon" className="h-7 w-7 rounded-full" onClick={goToPreviousLP} disabled={currentLPIndex === 0}>
                              <ChevronLeft className="w-4 h-4" />
                            </Button>
                            <span className="text-xs font-medium text-muted-foreground">Ensaio LP {currentLPIndex + 1} de {fieldsLP.length}</span>
                            <Button type="button" variant="outline" size="icon" className="h-7 w-7 rounded-full" onClick={goToNextLP} disabled={currentLPIndex === fieldsLP.length - 1}>
                              <ChevronRight className="w-4 h-4" />
                            </Button>
                          </div>
                          <div className="flex gap-1.5">
                            <Button type="button" variant="outline" size="sm" className="h-7 px-2 text-xs" onClick={addPontoLP}>
                              <Plus className="w-3 h-3" />
                            </Button>
                            {fieldsLP.length > 1 && (
                              <Button type="button" variant="outline" size="sm" className="h-7 px-2 text-xs text-destructive hover:text-destructive" onClick={removePontoLP}>
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            )}
                          </div>
                        </div>

                        {fieldsLP.map((field, index) => (
                          <div key={field.id} style={{ display: index === currentLPIndex ? 'block' : 'none' }}>
                            <div className="grid grid-cols-3 gap-2">
                              <div className="space-y-0.5">
                                <div className="flex items-center gap-2">
                                  <Label htmlFor={`pontosLP.${index}.massaUmidaRecipiente`} className={cn("text-xs", errors.pontosLP?.[index]?.massaUmidaRecipiente && "text-destructive")}>M. Úmida + Recip. (g)</Label>
                                  <Popover>
                                    <PopoverTrigger asChild>
                                      <Button variant="ghost" size="icon" className="h-5 w-5 p-0 hover:bg-muted">
                                        <Info className="w-4 h-4 text-muted-foreground cursor-pointer" />
                                      </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="max-w-xs" align="start">
                                      <p className="text-sm">{tooltips.massaUmidaRecipienteLP}</p>
                                    </PopoverContent>
                                  </Popover>
                                </div>
                                <Controller name={`pontosLP.${index}.massaUmidaRecipiente`} control={form.control} render={({ field }) => <Input {...field} type="number" step="0.01" placeholder="Ex: 32.80" className={cn("bg-background/50 h-9", errors.pontosLP?.[index]?.massaUmidaRecipiente && "border-destructive")} />} />
                                {errors.pontosLP?.[index]?.massaUmidaRecipiente && <p className="text-xs text-destructive mt-0.5">{errors.pontosLP[index].massaUmidaRecipiente.message}</p>}
                              </div>
                              <div className="space-y-0.5">
                                <div className="flex items-center gap-2">
                                  <Label htmlFor={`pontosLP.${index}.massaSecaRecipiente`} className={cn("text-xs", errors.pontosLP?.[index]?.massaSecaRecipiente && "text-destructive")}>M. Seca + Recip. (g)</Label>
                                  <Popover>
                                    <PopoverTrigger asChild>
                                      <Button variant="ghost" size="icon" className="h-5 w-5 p-0 hover:bg-muted">
                                        <Info className="w-4 h-4 text-muted-foreground cursor-pointer" />
                                      </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="max-w-xs" align="start">
                                      <p className="text-sm">{tooltips.massaSecaRecipienteLP}</p>
                                    </PopoverContent>
                                  </Popover>
                                </div>
                                <Controller name={`pontosLP.${index}.massaSecaRecipiente`} control={form.control} render={({ field }) => <Input {...field} type="number" step="0.01" placeholder="Ex: 29.50" className={cn("bg-background/50 h-9", errors.pontosLP?.[index]?.massaSecaRecipiente && "border-destructive")} />} />
                                {errors.pontosLP?.[index]?.massaSecaRecipiente && <p className="text-xs text-destructive mt-0.5">{errors.pontosLP[index].massaSecaRecipiente.message}</p>}
                              </div>
                              <div className="space-y-0.5">
                                <div className="flex items-center gap-2">
                                  <Label htmlFor={`pontosLP.${index}.massaRecipiente`} className={cn("text-xs", errors.pontosLP?.[index]?.massaRecipiente && "text-destructive")}>M. Recipiente (g)</Label>
                                  <Popover>
                                    <PopoverTrigger asChild>
                                      <Button variant="ghost" size="icon" className="h-5 w-5 p-0 hover:bg-muted">
                                        <Info className="w-4 h-4 text-muted-foreground cursor-pointer" />
                                      </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="max-w-xs" align="start">
                                      <p className="text-sm">{tooltips.massaRecipienteLP}</p>
                                    </PopoverContent>
                                  </Popover>
                                </div>
                                <Controller name={`pontosLP.${index}.massaRecipiente`} control={form.control} render={({ field }) => <Input {...field} type="number" step="0.01" placeholder="Ex: 14.20" className={cn("bg-background/50 h-9", errors.pontosLP?.[index]?.massaRecipiente && "border-destructive")} />} />
                                {errors.pontosLP?.[index]?.massaRecipiente && <p className="text-xs text-destructive mt-0.5">{errors.pontosLP[index].massaRecipiente.message}</p>}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                  {/* Item Accordion: Dados Adicionais */}
                  <AccordionItem value="adicionais" className="border-0">
                    <AccordionTrigger className="text-xs font-semibold text-foreground bg-accent/5 hover:bg-accent/10 px-3 py-1.5 rounded-lg border border-accent/20 [&[data-state=open]]:rounded-b-none">
                      <div className="flex items-center gap-1.5"> <Info className="w-3.5 h-3.5 text-cyan-500" /> Dados Adicionais (Opcional) </div>
                    </AccordionTrigger>
                    <AccordionContent className="p-3 bg-accent/5 rounded-b-lg border border-t-0 border-accent/20">
                      <div className="grid grid-cols-2 gap-3" data-tour="dados-opcionais">
                        {/* Inputs com Controller (compactados) */}
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <Label htmlFor="umidadeNatural" className={cn("text-xs", errors.umidadeNatural && "text-destructive")}>Umidade Natural (%)</Label>
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-5 w-5 p-0 hover:bg-muted">
                                  <Info className="w-4 h-4 text-muted-foreground cursor-pointer" />
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="max-w-xs" align="start">
                                <p className="text-sm">{tooltips.umidadeNatural}</p>
                              </PopoverContent>
                            </Popover>
                          </div>
                          <Controller name="umidadeNatural" control={form.control} render={({ field }) => <Input id="umidadeNatural" type="number" step="0.1" placeholder="Ex: 28.5" {...field} value={field.value ?? ""} className={cn("bg-background/50 h-9", errors.umidadeNatural && "border-destructive")} />} />
                          {errors.umidadeNatural && <p className="text-xs text-destructive mt-0.5">{errors.umidadeNatural.message}</p>}
                        </div>
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <Label htmlFor="percentualArgila" className={cn("text-xs", errors.percentualArgila && "text-destructive")}>% Argila (&lt;0.002mm)</Label>
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-5 w-5 p-0 hover:bg-muted">
                                  <Info className="w-4 h-4 text-muted-foreground cursor-pointer" />
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="max-w-xs" align="start">
                                <p className="text-sm">{tooltips.percentualArgila}</p>
                              </PopoverContent>
                            </Popover>
                          </div>
                          <Controller name="percentualArgila" control={form.control} render={({ field }) => <Input id="percentualArgila" type="number" step="0.1" placeholder="Ex: 35.0" {...field} value={field.value ?? ""} className={cn("bg-background/50 h-9", errors.percentualArgila && "border-destructive")} />} />
                          {errors.percentualArgila && <p className="text-xs text-destructive mt-0.5">{errors.percentualArgila.message}</p>}
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion> {/* Fim do Accordion principal */}
              </TooltipProvider>
            </CardContent>
            {/* Footer com botões */}
            <CardFooter className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-3 border-t border-border/50 mt-auto">
              <Button type="submit" disabled={!canSubmit} className="flex-1 h-10" data-tour="btn-calcular">
                <CalcIcon className="w-4 h-4 mr-1.5" />
                {isCalculating ? "Calculando..." : "Calcular"}
              </Button>
              <Button type="button" onClick={handleClear} variant="outline" disabled={isCalculating} className="h-10 w-full sm:w-auto">
                Limpar
              </Button>
            </CardFooter>
            {apiError && !isCalculating && (<div className="px-4 pb-3"> <Alert variant="destructive" className="p-2"> <AlertCircle className="h-4 w-4" /> <AlertTitle className="text-sm">Erro</AlertTitle> <AlertDescription className="text-xs">{apiError}</AlertDescription> </Alert> </div>)}
          </form>
        </Card>

        {/* --- Card de Resultados com Carrossel --- */}
        <Card className="glass p-4 sm:p-6 animate-in fade-in slide-in-from-right-4 duration-700" style={{ animationDelay: '200ms', animationFillMode: 'backwards' }} data-tour="resultados">
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-xl">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-primary" />
                Resultados
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 px-2 sm:px-4">
            {isCalculating ? (
              <div className="space-y-3">
                <Skeleton className="h-12 w-full" /> <Skeleton className="h-12 w-full" /> <Skeleton className="h-12 w-full" /> <Skeleton className="h-12 w-full" />
                <Skeleton className="h-[300px] w-full mt-3" />
              </div>
            ) : results && !results.erro ? (
              <div data-tour="resultados" data-tour-carta="carta-plasticidade">
                <Carousel className="w-full px-8 relative" setApi={setCarouselApi}>
                  <CarouselContent>
                    {/* Slide 1: Resultados Numéricos e Classificações Gerais */}
                    <CarouselItem>
                      <div className="space-y-2">
                        <ResultItemGroup title="Limites de Consistência">
                          <ResultItem label="Limite de Liquidez (LL)" value={results.ll} unit="%" tooltip={tooltips.LL} precision={0} />
                          <ResultItem label="Limite de Plasticidade (LP)" value={results.lp} unit="%" tooltip={tooltips.LP} precision={0} />
                          <ResultItem label="Índice de Plasticidade (IP)" value={results.ip} unit="%" tooltip={tooltips.IP} highlight precision={0} />
                        </ResultItemGroup>
                        {(results.ic !== null) && (
                          <ResultItemGroup title="Consistência">
                            {results.ic !== null ? (<ResultItem label="Índice de Consistência (IC)" value={results.ic} unit="" tooltip={tooltips.IC} precision={3} />) : (<MissingInfoItem label="Índice de Consistência (IC)" reason={!form.getValues("umidadeNatural") ? "w% não fornecida" : (results.ip !== null && results.ip < 1e-9 ? "IP ≈ 0" : "Dado ausente")} />)}
                          </ResultItemGroup>
                        )}
                        {(results.atividade_argila !== null) && (
                          <ResultItemGroup title="Atividade">
                            {results.atividade_argila !== null ? (<ResultItem label="Atividade da Argila (Ia)" value={results.atividade_argila} unit="" tooltip={tooltips.Atividade} precision={3} />) : (<MissingInfoItem label="Atividade da Argila (Ia)" reason={!form.getValues("percentualArgila") ? "% Argila não fornecida" : (results.ip !== null && results.ip < 1e-9 ? "IP ≈ 0" : "% Argila ≈ 0 ou dado ausente")} />)}
                          </ResultItemGroup>
                        )}
                        <div className="pt-2 space-y-1.5">
                          <h3 className="text-xs font-medium text-muted-foreground">Classificações Gerais</h3>
                          <div className="flex flex-wrap gap-1.5">
                            {results.classificacao_plasticidade && <ClassificationBadge label="Plasticidade" value={results.classificacao_plasticidade} />}
                            {results.classificacao_consistencia && <ClassificationBadge label="Consistência" value={results.classificacao_consistencia} />}
                            {results.classificacao_atividade && <ClassificationBadge label="Atividade" value={results.classificacao_atividade} />}
                          </div>
                        </div>
                      </div>
                    </CarouselItem>
                    {/* Slide 2: Gráfico do Limite de Liquidez */}
                    <CarouselItem>
                      <div className="space-y-2">
                        {(results.pontos_grafico_ll && results.pontos_grafico_ll.length > 0) && (
                          <div id="limite-liquidez-chart">
                            <LimiteLiquidezChart ref={limiteLiquidezChartRef} pontos={results.pontos_grafico_ll} ll={results.ll} />
                          </div>
                        )}
                      </div>
                    </CarouselItem>
                  </CarouselContent>
                  <CarouselPrevious className="absolute left-[-8px] top-1/2 -translate-y-1/2 h-8 w-8" />
                  <CarouselNext className="absolute right-[-8px] top-1/2 -translate-y-1/2 h-8 w-8" />
                </Carousel>
              </div>
            ) : ( /* Placeholder ou Erro */
              <div className="flex flex-col items-center justify-center h-56 text-center">
                <Droplet className="w-12 h-12 text-indigo-500/30 mb-3" />
                <p className="text-muted-foreground text-sm"> {apiError ? "Corrija os erros para calcular" : "Preencha os dados dos ensaios para calcular"} </p>
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

      <SavedCalculations
        open={loadDialogOpen}
        onOpenChange={setLoadDialogOpen}
        calculations={calculations}
        onLoad={handleLoadCalculation}
        onDelete={deleteCalculation}
        onRename={renameCalculation}
        moduleName="Limites de Consistência"
      />
    </div>
  );
}

// --- Wrapper Principal ---
export default function LimitesConsistencia() {
  return (
    <MobileModuleWrapper mobileVersion={<LimitesConsistenciaMobile />}>
      <LimitesConsistenciaDesktop />
    </MobileModuleWrapper>
  );
}

// --- Componentes Auxiliares (Compactados) ---
const ResultItemGroup: React.FC<{ title?: string, children: React.ReactNode }> = ({ title, children }) => (
  <div className="space-y-1">
    {title && <h4 className="text-xs font-medium text-muted-foreground mb-1 pt-1 border-t border-border/30">{title}</h4>}
    <div className="grid grid-cols-2 gap-2">{children}</div>
  </div>
);

function ResultItem({ label, value, unit, tooltip, highlight = false, precision = 2 }: ResultItemProps) {
  const displayValue = typeof value === 'number' && !isNaN(value) ? value.toFixed(precision) : (value || "-");

  return (
    <div className={cn(
      "flex flex-col gap-1 px-2 py-2 rounded-lg",
      highlight ? "bg-primary/10 border border-primary/20" : "bg-background/50 border border-border/50"
    )}>
      <div className="flex items-center gap-1">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        {tooltip && (
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="h-4 w-4 p-0 hover:bg-muted">
                <Info className="w-3 h-3 text-muted-foreground cursor-pointer" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="max-w-xs" align="start">
              <p className="text-sm">{tooltip}</p>
            </PopoverContent>
          </Popover>
        )}
      </div>
      <span className={cn("font-bold text-lg", highlight ? "text-primary" : "text-foreground")}>
        {displayValue} <span className="text-xs font-normal text-muted-foreground">{unit}</span>
      </span>
    </div>
  );
}
const MissingInfoItem = ({ label, reason }: { label: string, reason: string }) => (
  <div className="flex flex-col gap-1 px-2 py-2 rounded-lg bg-muted/30 border border-border/30 border-dashed">
    <span className="text-xs font-medium text-muted-foreground">{label}</span>
    <span className="text-xs text-muted-foreground italic">{reason}</span>
  </div>
);
const ClassificationBadge = ({ label, value }: { label: string; value: string }) => { let badgeVariant: "default" | "secondary" | "destructive" = "default"; if (value.includes("Não") || value.includes("Inativa")) { badgeVariant = "secondary"; } return (<div className="flex flex-col items-start gap-0.5"> <span className="text-xs text-muted-foreground">{label}</span> <Badge variant={badgeVariant} className="text-xs px-2 py-0.5">{value}</Badge> </div>); };