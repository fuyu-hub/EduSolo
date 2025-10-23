// frontend/src/pages/LimitesConsistencia.tsx
import { useState, useEffect } from "react";
import axios from 'axios';
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Droplets, Info, Calculator as CalcIcon, Plus, Trash2, LineChart, ChevronLeft, ChevronRight, AlertCircle, BarChart3, Save, FolderOpen, Download, Printer, FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";
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
import PlasticityChart from "@/components/visualizations/PlasticityChart";
import { useSavedCalculations } from "@/hooks/use-saved-calculations";
import SavedCalculations from "@/components/SavedCalculations";
import SaveDialog from "@/components/SaveDialog";
import PrintHeader from "@/components/PrintHeader";
import CalculationActions from "@/components/CalculationActions";
import { exportToPDF, exportToExcel, ExportData, ExcelExportData, formatNumberForExport, captureChartAsImage } from "@/lib/export-utils";

// --- Esquema Zod (Inalterado) ---
const pontoLLSchema = z.object({
  id: z.string(),
  numGolpes: z.string().min(1, { message: "Obrigatório" }).refine(val => !isNaN(parseInt(val)) && parseInt(val) > 0, { message: "Deve ser > 0" }),
  massaUmidaRecipiente: z.string().min(1, { message: "Obrigatório" }).refine(val => !isNaN(parseFloat(val)) && parseFloat(val) > 0, { message: "Deve ser > 0" }),
  massaSecaRecipiente: z.string().min(1, { message: "Obrigatório" }).refine(val => !isNaN(parseFloat(val)) && parseFloat(val) > 0, { message: "Deve ser > 0" }),
  massaRecipiente: z.string().min(1, { message: "Obrigatório" }).refine(val => !isNaN(parseFloat(val)) && parseFloat(val) >= 0, { message: "Deve ser >= 0" }),
}).refine(data => {
    const mu = parseFloat(data.massaUmidaRecipiente);
    const ms = parseFloat(data.massaSecaRecipiente);
    return isNaN(mu) || isNaN(ms) || mu >= ms;
}, {
  message: "M. úmida >= M. seca",
  path: ["massaUmidaRecipiente"],
}).refine(data => {
    const msr = parseFloat(data.massaSecaRecipiente);
    const mr = parseFloat(data.massaRecipiente);
    return isNaN(msr) || isNaN(mr) || msr >= mr;
}, {
  message: "M. seca+rec >= M. rec",
  path: ["massaSecaRecipiente"],
});

const formSchema = z.object({
  pontosLL: z.array(pontoLLSchema).min(2, { message: "São necessários pelo menos 2 pontos LL válidos" }),
  massaUmidaRecipienteLP: z.string().min(1, { message: "Obrigatório" }).refine(val => !isNaN(parseFloat(val)) && parseFloat(val) > 0, { message: "Deve ser > 0" }),
  massaSecaRecipienteLP: z.string().min(1, { message: "Obrigatório" }).refine(val => !isNaN(parseFloat(val)) && parseFloat(val) > 0, { message: "Deve ser > 0" }),
  massaRecipienteLP: z.string().min(1, { message: "Obrigatório" }).refine(val => !isNaN(parseFloat(val)) && parseFloat(val) >= 0, { message: "Deve ser >= 0" }),
  umidadeNatural: z.string().optional().refine(val => val === undefined || val === "" || (!isNaN(parseFloat(val)) && parseFloat(val) >= 0), {
      message: "Deve ser >= 0 ou vazio",
  }),
  percentualArgila: z.string().optional().refine(val => val === undefined || val === "" || (!isNaN(parseFloat(val)) && parseFloat(val) >= 0 && parseFloat(val) <= 100), {
      message: "Deve ser entre 0-100 ou vazio",
  }),
}).refine(data => {
    const mu = parseFloat(data.massaUmidaRecipienteLP);
    const ms = parseFloat(data.massaSecaRecipienteLP);
    return isNaN(mu) || isNaN(ms) || mu >= ms;
},{
  message: "LP: M. úmida >= M. seca",
  path: ["massaUmidaRecipienteLP"],
}).refine(data => {
     const msr = parseFloat(data.massaSecaRecipienteLP);
     const mr = parseFloat(data.massaRecipienteLP);
     return isNaN(msr) || isNaN(mr) || msr >= mr;
},{
  message: "LP: M. seca+rec >= M. rec",
  path: ["massaSecaRecipienteLP"],
});

// Tipagem do formulário
type FormInputValues = z.infer<typeof formSchema>;

// Tipagem para a API
type ApiInputData = {
    pontos_ll: { num_golpes: number; massa_umida_recipiente: number; massa_seca_recipiente: number; massa_recipiente: number; }[];
    massa_umida_recipiente_lp: number; massa_seca_recipiente_lp: number; massa_recipiente_lp: number;
    umidade_natural?: number; percentual_argila?: number;
};

// --- Interfaces (mantidas) ---
interface LimitesConsistenciaOutput { ll: number | null; lp: number | null; ip: number | null; ic: number | null; classificacao_plasticidade: string | null; classificacao_consistencia: string | null; atividade_argila: number | null; classificacao_atividade: string | null; erro?: string | null; }
type Results = LimitesConsistenciaOutput;

// --- Tooltips (mantidos) ---
const tooltips = { numGolpes: "Número de golpes necessários para fechar a ranhura no ensaio LL (NBR 6459)", massaUmidaRecipienteLL: "Massa do recipiente (tara) + solo úmido (g) - Ensaio LL", massaSecaRecipienteLL: "Massa do recipiente (tara) + solo seco após estufa (g) - Ensaio LL", massaRecipienteLL: "Massa do recipiente (tara) utilizado no ensaio LL (g)", massaUmidaRecipienteLP: "Massa do recipiente (tara) + solo úmido (g) - Ensaio LP (NBR 7180)", massaSecaRecipienteLP: "Massa do recipiente (tara) + solo seco após estufa (g) - Ensaio LP", massaRecipienteLP: "Massa do recipiente (tara) utilizado no ensaio LP (g)", umidadeNatural: "Umidade atual do solo em campo (%) - Necessária para calcular IC", percentualArgila: "Percentual de partículas < 0.002mm (%) - Necessário para calcular Atividade (Ia)", LL: "Limite de Liquidez - teor de umidade na transição líquido/plástico", LP: "Limite de Plasticidade - teor de umidade na transição plástico/semi-sólido", IP: "Índice de Plasticidade = LL - LP (faixa de comportamento plástico)", IC: "Índice de Consistência = (LL - w_nat) / IP (estado de consistência do solo)", Atividade: "Atividade da Argila (Ia) = IP / (% argila)", CartaPlasticidade: "Carta de Plasticidade de Casagrande mostrando a classificação do solo (LL vs IP)" };

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// --- Interface ResultItemProps (mantida) ---
interface ResultItemProps { label: string; value: number | string | null; unit: string; tooltip?: string; highlight?: boolean; precision?: number; }

// --- Dados de Exemplo (mantidos) ---
const exampleLLData = [ { numGolpes: "33", massaUmidaRecipiente: "42.10", massaSecaRecipiente: "36.50", massaRecipiente: "16.10" }, { numGolpes: "28", massaUmidaRecipiente: "44.80", massaSecaRecipiente: "38.20", massaRecipiente: "15.70" }, { numGolpes: "25", massaUmidaRecipiente: "45.50", massaSecaRecipiente: "38.00", massaRecipiente: "15.00" }, { numGolpes: "20", massaUmidaRecipiente: "48.10", massaSecaRecipiente: "40.00", massaRecipiente: "16.40" }, { numGolpes: "16", massaUmidaRecipiente: "50.20", massaSecaRecipiente: "41.10", massaRecipiente: "15.20" } ];
const exampleLPData = { massaUmidaRecipienteLP: "32.80", massaSecaRecipienteLP: "29.50", massaRecipienteLP: "14.20" };
const exampleOptionalData = { umidadeNatural: "25.0", percentualArgila: "30.0" };

export default function LimitesConsistencia() {
  const { toast } = useToast();
  const [currentPointIndex, setCurrentPointIndex] = useState(0);

  const form = useForm<FormInputValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { pontosLL: [{ id: crypto.randomUUID(), numGolpes: "", massaUmidaRecipiente: "", massaSecaRecipiente: "", massaRecipiente: "" },{ id: crypto.randomUUID(), numGolpes: "", massaUmidaRecipiente: "", massaSecaRecipiente: "", massaRecipiente: "" }], massaUmidaRecipienteLP: "", massaSecaRecipienteLP: "", massaRecipienteLP: "", umidadeNatural: "", percentualArgila: "" },
    mode: "onBlur",
  });

  const { fields, append, remove } = useFieldArray({ control: form.control, name: "pontosLL", keyName: "fieldId" });

  const [results, setResults] = useState<Results | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // Estados para salvamento e exportação
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [saveName, setSaveName] = useState("");
  const [loadDialogOpen, setLoadDialogOpen] = useState(false);
  const { calculations, saveCalculation, deleteCalculation, renameCalculation } = useSavedCalculations("limites-consistencia");

  useEffect(() => { if (fields.length > 0) { setCurrentPointIndex(prev => Math.min(prev, fields.length - 1)); } else { setCurrentPointIndex(0); } }, [fields.length]);

  const addPontoLL = () => { append({ id: crypto.randomUUID(), numGolpes: "", massaUmidaRecipiente: "", massaSecaRecipiente: "", massaRecipiente: "" }); setCurrentPointIndex(fields.length); };
  const removePontoLL = () => { if (fields.length > 2) { remove(currentPointIndex); } else { toast({ title: "Atenção", description: "São necessários pelo menos 2 pontos para o cálculo do LL.", variant: "default" }); } };
  const goToNextPoint = () => { setCurrentPointIndex(prev => Math.min(prev + 1, fields.length - 1)); };
  const goToPreviousPoint = () => { setCurrentPointIndex(prev => Math.max(prev - 1, 0)); };

  const handleClear = () => { form.reset({ pontosLL: [{ id: crypto.randomUUID(), numGolpes: "", massaUmidaRecipiente: "", massaSecaRecipiente: "", massaRecipiente: "" },{ id: crypto.randomUUID(), numGolpes: "", massaUmidaRecipiente: "", massaSecaRecipiente: "", massaRecipiente: "" }], massaUmidaRecipienteLP: "", massaSecaRecipienteLP: "", massaRecipienteLP: "", umidadeNatural: "", percentualArgila: "" }); setCurrentPointIndex(0); setResults(null); setApiError(null); };
  const handleFillExampleData = () => { const currentLength = fields.length; if (currentLength < 5) { for (let i = 0; i < 5 - currentLength; i++) { append({ id: crypto.randomUUID(), numGolpes: "", massaUmidaRecipiente: "", massaSecaRecipiente: "", massaRecipiente: "" }, { shouldFocus: false }); } } else if (currentLength > 5) { for (let i = currentLength - 1; i >= 5; i--) { remove(i); } } setTimeout(() => { form.reset({ pontosLL: exampleLLData.map(p => ({ ...p, id: crypto.randomUUID() })), massaUmidaRecipienteLP: exampleLPData.massaUmidaRecipienteLP, massaSecaRecipienteLP: exampleLPData.massaSecaRecipienteLP, massaRecipienteLP: exampleLPData.massaRecipienteLP, umidadeNatural: exampleOptionalData.umidadeNatural, percentualArgila: exampleOptionalData.percentualArgila }); setCurrentPointIndex(0); setResults(null); setApiError(null); toast({ title: "Dados de Exemplo Carregados", description: "O formulário foi preenchido com os dados de teste." }); }, 0); };

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
      toast({ title: "Cálculo salvo!", description: "O cálculo foi salvo com sucesso." });
      setSaveDialogOpen(false);
      setSaveName("");
    } else {
      toast({ title: "Erro ao salvar", description: "Não foi possível salvar o cálculo.", variant: "destructive" });
    }
  };

  const handleLoadCalculation = (calculation: any) => {
    const data = calculation.formData;
    form.reset(data);
    setResults(calculation.results);
    setCurrentPointIndex(0);
    toast({ title: "Cálculo carregado!", description: `"${calculation.name}" foi carregado com sucesso.` });
  };

  const handleExportPDF = async () => {
    if (!results) return;
    const formData = form.getValues();
    
    // Capturar imagem do gráfico de plasticidade
    toast({ title: "Capturando gráfico..." });
    const chartImage = await captureChartAsImage('plasticity-chart');
    
    const inputs: { label: string; value: string }[] = [];
    formData.pontosLL.forEach((p, i) => {
      inputs.push({ label: `Ponto LL ${i + 1} - Golpes`, value: p.numGolpes });
      inputs.push({ label: `Ponto LL ${i + 1} - Massa Úmida+Rec`, value: `${p.massaUmidaRecipiente} g` });
      inputs.push({ label: `Ponto LL ${i + 1} - Massa Seca+Rec`, value: `${p.massaSecaRecipiente} g` });
      inputs.push({ label: `Ponto LL ${i + 1} - Massa Recipiente`, value: `${p.massaRecipiente} g` });
    });
    inputs.push({ label: "LP - Massa Úmida+Rec", value: `${formData.massaUmidaRecipienteLP} g` });
    inputs.push({ label: "LP - Massa Seca+Rec", value: `${formData.massaSecaRecipienteLP} g` });
    inputs.push({ label: "LP - Massa Recipiente", value: `${formData.massaRecipienteLP} g` });
    if (formData.umidadeNatural) inputs.push({ label: "Umidade Natural", value: `${formData.umidadeNatural}%` });
    if (formData.percentualArgila) inputs.push({ label: "% Argila", value: `${formData.percentualArgila}%` });

    const resultsList: { label: string; value: string; highlight?: boolean }[] = [];
    if (results.ll !== null) resultsList.push({ label: "Limite de Liquidez (LL)", value: `${formatNumberForExport(results.ll, 1)}%`, highlight: true });
    if (results.lp !== null) resultsList.push({ label: "Limite de Plasticidade (LP)", value: `${formatNumberForExport(results.lp, 1)}%`, highlight: true });
    if (results.ip !== null) resultsList.push({ label: "Índice de Plasticidade (IP)", value: `${formatNumberForExport(results.ip, 1)}%`, highlight: true });
    if (results.ic !== null) resultsList.push({ label: "Índice de Consistência (IC)", value: formatNumberForExport(results.ic, 2) });
    if (results.classificacao_plasticidade) resultsList.push({ label: "Classificação Plasticidade", value: results.classificacao_plasticidade });
    if (results.classificacao_consistencia) resultsList.push({ label: "Classificação Consistência", value: results.classificacao_consistencia });
    if (results.atividade_argila !== null) resultsList.push({ label: "Atividade Argila (Ia)", value: formatNumberForExport(results.atividade_argila, 2) });
    if (results.classificacao_atividade) resultsList.push({ label: "Classificação Atividade", value: results.classificacao_atividade });

    const exportData: ExportData = {
      moduleName: "limites-consistencia",
      moduleTitle: "Limites de Consistência",
      inputs,
      results: resultsList,
      chartImage: chartImage || undefined
    };

    toast({ title: "Gerando PDF..." });
    const success = await exportToPDF(exportData);
    if (success) {
      toast({ title: "PDF exportado!", description: "O arquivo foi baixado com sucesso." });
    } else {
      toast({ title: "Erro ao exportar", description: "Não foi possível gerar o PDF.", variant: "destructive" });
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

    // Sheet de Entrada - LP e Adicionais
    const entradaLPData: { label: string; value: string | number }[] = [
      { label: "LP - Massa Úmida+Rec (g)", value: formData.massaUmidaRecipienteLP },
      { label: "LP - Massa Seca+Rec (g)", value: formData.massaSecaRecipienteLP },
      { label: "LP - Massa Recipiente (g)", value: formData.massaRecipienteLP },
    ];
    if (formData.umidadeNatural) entradaLPData.push({ label: "Umidade Natural (%)", value: formData.umidadeNatural });
    if (formData.percentualArgila) entradaLPData.push({ label: "% Argila", value: formData.percentualArgila });

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

    const excelData: ExcelExportData = {
      moduleName: "limites-consistencia",
      moduleTitle: "Limites de Consistência",
      sheets: [
        { name: "Dados LL", data: entradaLLData },
        { name: "Dados LP e Adicionais", data: entradaLPData },
        { name: "Resultados", data: resultadosData }
      ],
    };

    const success = await exportToExcel(excelData);
    if (success) {
      toast({ title: "Excel exportado!", description: "O arquivo foi baixado com sucesso." });
    } else {
      toast({ title: "Erro ao exportar", description: "Não foi possível gerar o Excel.", variant: "destructive" });
    }
  };

  const onSubmit = async (data: FormInputValues) => {
    setIsCalculating(true); setApiError(null); setResults(null);
    let apiInput: ApiInputData;
    try {
        apiInput = {
            pontos_ll: data.pontosLL.map(p => ({ num_golpes: parseInt(p.numGolpes, 10), massa_umida_recipiente: parseFloat(p.massaUmidaRecipiente), massa_seca_recipiente: parseFloat(p.massaSecaRecipiente), massa_recipiente: parseFloat(p.massaRecipiente) })),
            massa_umida_recipiente_lp: parseFloat(data.massaUmidaRecipienteLP), massa_seca_recipiente_lp: parseFloat(data.massaSecaRecipienteLP), massa_recipiente_lp: parseFloat(data.massaRecipienteLP),
            umidade_natural: (data.umidadeNatural && data.umidadeNatural !== "") ? parseFloat(data.umidadeNatural) : undefined, percentual_argila: (data.percentualArgila && data.percentualArgila !== "") ? parseFloat(data.percentualArgila) : undefined,
        };
        if (apiInput.umidade_natural === undefined) delete apiInput.umidade_natural; if (apiInput.percentual_argila === undefined) delete apiInput.percentual_argila;
    } catch (parseError) { setApiError("Erro interno ao processar os dados do formulário. Verifique se os números são válidos."); toast({ title: "Erro de Formulário", description: "Verifique se todos os campos numéricos contêm valores válidos.", variant: "destructive" }); setIsCalculating(false); return; }
    try {
      const response = await axios.post<LimitesConsistenciaOutput>(`${API_URL}/calcular/limites-consistencia`, apiInput);
      if (response.data.erro) { setApiError(response.data.erro); toast({ title: "Erro no Cálculo (API)", description: response.data.erro, variant: "destructive" }); }
      else { setResults(response.data); toast({ title: "Sucesso", description: "Cálculo dos limites de consistência realizado." }); }
    } catch (err) { let errorMessage = "Erro de comunicação com o servidor."; if (axios.isAxiosError(err) && err.response?.data?.detail) { if (Array.isArray(err.response.data.detail)) { errorMessage = err.response.data.detail.map((d: any) => `Campo '${d.loc.slice(1).join('.') || 'Geral'}': ${d.msg}`).join("; "); } else if (typeof err.response.data.detail === 'string') { errorMessage = err.response.data.detail; } } else if (err instanceof Error) { errorMessage = err.message; } setApiError(errorMessage); toast({ title: "Erro na Requisição", description: errorMessage, variant: "destructive" }); }
    finally { setIsCalculating(false); }
  };

  const errors = form.formState.errors;
  const currentPointField = fields[currentPointIndex];
  const canSubmit = !isCalculating && form.formState.isValid && !apiError;

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      <PrintHeader moduleTitle="Limites de Consistência" moduleName="limites-consistencia" />
      
      {/* Header */}
      <div className="flex items-center justify-between gap-3 animate-in fade-in slide-in-from-left-4 duration-500">
        <div className="flex items-center gap-3">
           <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center shadow-lg transition-transform hover:scale-110 hover:rotate-3"> <Droplets className="w-6 h-6 text-white" /> </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Limites de Consistência</h1>
            <p className="text-muted-foreground text-sm">Determinação de LL, LP, IP, IC, Atividade e classificações</p>
          </div>
        </div>
        
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

      <div className="grid lg:grid-cols-2 gap-4">
        {/* Formulário com Accordion */}
        <Card className="glass flex flex-col animate-in fade-in slide-in-from-left-4 duration-700" style={{ animationDelay: '100ms', animationFillMode: 'backwards' }}>
           <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col flex-1">
            <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-xl"> <CalcIcon className="w-5 h-5" /> Dados dos Ensaios </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 p-4 pt-0 flex-1">
              <TooltipProvider>
                 <Accordion type="multiple" defaultValue={["ll", "lp"]} className="w-full space-y-3">
                   {/* Item Accordion: LL */}
                   <AccordionItem value="ll" className="border-0">
                      <AccordionTrigger className="text-sm font-semibold text-foreground bg-accent/5 hover:bg-accent/10 px-3 py-2 rounded-lg border border-accent/20 [&[data-state=open]]:rounded-b-none">
                         <div className="flex items-center gap-1.5"> <Droplets className="w-4 h-4 text-indigo-500" /> Limite de Liquidez (LL) </div>
                      </AccordionTrigger>
                      <AccordionContent className="p-0 pt-2">
                        <div className="space-y-2 rounded-lg bg-background/30 border border-accent/20 border-t-0 rounded-t-none p-3">
                           <div className="flex items-center justify-between mb-1">
                               <h4 className="font-medium text-xs text-muted-foreground"> Ponto {currentPointIndex + 1} / {fields.length} </h4>
                               <div className="flex items-center gap-1">
                                  <Button type="button" onClick={goToPreviousPoint} size="icon" variant="outline" className="h-6 w-6" disabled={currentPointIndex === 0}> <ChevronLeft className="w-3.5 h-3.5" /> </Button>
                                  <Button type="button" onClick={goToNextPoint} size="icon" variant="outline" className="h-6 w-6" disabled={currentPointIndex === fields.length - 1}> <ChevronRight className="w-3.5 h-3.5" /> </Button>
                                  <Button type="button" onClick={addPontoLL} size="icon" variant="outline" className="h-6 w-6 ml-1.5"> <Plus className="w-3.5 h-3.5" /> </Button>
                                  <Button type="button" onClick={removePontoLL} size="icon" variant="destructive" className="h-6 w-6" disabled={fields.length <= 2}> <Trash2 className="w-3.5 h-3.5" /> </Button>
                               </div>
                           </div>
                           {currentPointField && (
                              <div key={currentPointField.id} className="space-y-2">
                                <div className="grid grid-cols-2 gap-3">
                                  <div className="space-y-2">
                                     <div className="space-y-0.5">
                                        <Label htmlFor={`pontosLL.${currentPointIndex}.numGolpes`} className={cn("flex items-center gap-1 text-xs", errors.pontosLL?.[currentPointIndex]?.numGolpes && "text-destructive")}> Nº Golpes <Tooltip><TooltipTrigger><Info className="w-2.5 h-2.5 text-muted-foreground" /></TooltipTrigger><TooltipContent>{tooltips.numGolpes}</TooltipContent></Tooltip> </Label>
                                        <Controller name={`pontosLL.${currentPointIndex}.numGolpes`} control={form.control} render={({ field }) => ( <Input id={`pontosLL.${currentPointIndex}.numGolpes`} type="number" placeholder="Ex: 25" {...field} className={cn("bg-background/50 h-9", errors.pontosLL?.[currentPointIndex]?.numGolpes && "border-destructive")}/> )} />
                                        {errors.pontosLL?.[currentPointIndex]?.numGolpes && <p className="text-xs text-destructive mt-0.5">{errors.pontosLL[currentPointIndex]?.numGolpes?.message}</p>}
                                     </div>
                                      <div className="space-y-0.5">
                                         <Label htmlFor={`pontosLL.${currentPointIndex}.massaUmidaRecipiente`} className={cn("flex items-center gap-1 text-xs", errors.pontosLL?.[currentPointIndex]?.massaUmidaRecipiente && "text-destructive")}> M. Úmida + Recip. (g) <Tooltip><TooltipTrigger><Info className="w-2.5 h-2.5 text-muted-foreground" /></TooltipTrigger><TooltipContent>{tooltips.massaUmidaRecipienteLL}</TooltipContent></Tooltip> </Label>
                                         <Controller name={`pontosLL.${currentPointIndex}.massaUmidaRecipiente`} control={form.control} render={({ field }) => ( <Input id={`pontosLL.${currentPointIndex}.massaUmidaRecipiente`} type="number" step="0.01" placeholder="Ex: 45.50" {...field} className={cn("bg-background/50 h-9", errors.pontosLL?.[currentPointIndex]?.massaUmidaRecipiente && "border-destructive")}/> )} />
                                         {errors.pontosLL?.[currentPointIndex]?.massaUmidaRecipiente && <p className="text-xs text-destructive mt-0.5">{errors.pontosLL[currentPointIndex]?.massaUmidaRecipiente?.message}</p>}
                                      </div>
                                  </div>
                                   <div className="space-y-2">
                                     <div className="space-y-0.5">
                                        <Label htmlFor={`pontosLL.${currentPointIndex}.massaSecaRecipiente`} className={cn("flex items-center gap-1 text-xs", errors.pontosLL?.[currentPointIndex]?.massaSecaRecipiente && "text-destructive")}> M. Seca + Recip. (g) <Tooltip><TooltipTrigger><Info className="w-2.5 h-2.5 text-muted-foreground" /></TooltipTrigger><TooltipContent>{tooltips.massaSecaRecipienteLL}</TooltipContent></Tooltip> </Label>
                                        <Controller name={`pontosLL.${currentPointIndex}.massaSecaRecipiente`} control={form.control} render={({ field }) => ( <Input id={`pontosLL.${currentPointIndex}.massaSecaRecipiente`} type="number" step="0.01" placeholder="Ex: 38.00" {...field} className={cn("bg-background/50 h-9", errors.pontosLL?.[currentPointIndex]?.massaSecaRecipiente && "border-destructive")}/> )} />
                                        {errors.pontosLL?.[currentPointIndex]?.massaSecaRecipiente && <p className="text-xs text-destructive mt-0.5">{errors.pontosLL[currentPointIndex]?.massaSecaRecipiente?.message}</p>}
                                     </div>
                                     <div className="space-y-0.5">
                                         <Label htmlFor={`pontosLL.${currentPointIndex}.massaRecipiente`} className={cn("flex items-center gap-1 text-xs", errors.pontosLL?.[currentPointIndex]?.massaRecipiente && "text-destructive")}> M. Recipiente (g) <Tooltip><TooltipTrigger><Info className="w-2.5 h-2.5 text-muted-foreground" /></TooltipTrigger><TooltipContent>{tooltips.massaRecipienteLL}</TooltipContent></Tooltip> </Label>
                                         <Controller name={`pontosLL.${currentPointIndex}.massaRecipiente`} control={form.control} render={({ field }) => ( <Input id={`pontosLL.${currentPointIndex}.massaRecipiente`} type="number" step="0.01" placeholder="Ex: 15.00" {...field} className={cn("bg-background/50 h-9", errors.pontosLL?.[currentPointIndex]?.massaRecipiente && "border-destructive")}/> )} />
                                         {errors.pontosLL?.[currentPointIndex]?.massaRecipiente && <p className="text-xs text-destructive mt-0.5">{errors.pontosLL[currentPointIndex]?.massaRecipiente?.message}</p>}
                                     </div>
                                   </div>
                                </div>
                                {errors.pontosLL?.[currentPointIndex]?.root && ( <p className="text-xs text-destructive mt-1">{errors.pontosLL[currentPointIndex]?.root?.message}</p> )}
                              </div>
                           )}
                           {errors.pontosLL && typeof errors.pontosLL === 'object' && 'message' in errors.pontosLL && typeof errors.pontosLL.message === 'string' && ( <p className="text-xs text-destructive mt-1">{errors.pontosLL.message}</p> )}
                        </div>
                      </AccordionContent>
                   </AccordionItem>
                    {/* Item Accordion: LP */}
                    <AccordionItem value="lp" className="border-0">
                       <AccordionTrigger className="text-sm font-semibold text-foreground bg-accent/5 hover:bg-accent/10 px-3 py-2 rounded-lg border border-accent/20 [&[data-state=open]]:rounded-b-none">
                          <div className="flex items-center gap-1.5"> <Droplets className="w-4 h-4 text-blue-500" /> Limite de Plasticidade (LP) </div>
                       </AccordionTrigger>
                       <AccordionContent className="p-3 bg-accent/5 rounded-b-lg border border-t-0 border-accent/20">
                          <div className="space-y-2">
                             <div className="grid grid-cols-3 gap-2">
                                {/* Inputs com Controller (compactados) */}
                                <div className="space-y-0.5">
                                   <Label htmlFor="massaUmidaRecipienteLP" className={cn("flex items-center gap-1 text-xs", errors.massaUmidaRecipienteLP && "text-destructive")}> M. Úmida + Recip. (g) <Tooltip><TooltipTrigger><Info className="w-2.5 h-2.5 text-muted-foreground" /></TooltipTrigger><TooltipContent>{tooltips.massaUmidaRecipienteLP}</TooltipContent></Tooltip> </Label>
                                   <Controller name="massaUmidaRecipienteLP" control={form.control} render={({ field }) => <Input id="massaUmidaRecipienteLP" type="number" step="0.01" placeholder="Ex: 32.80" {...field} className={cn("bg-background/50 h-9", errors.massaUmidaRecipienteLP && "border-destructive")} />} />
                                   {errors.massaUmidaRecipienteLP && <p className="text-xs text-destructive mt-0.5">{errors.massaUmidaRecipienteLP.message}</p>}
                               </div>
                                <div className="space-y-0.5">
                                   <Label htmlFor="massaSecaRecipienteLP" className={cn("flex items-center gap-1 text-xs", errors.massaSecaRecipienteLP && "text-destructive")}> M. Seca + Recip. (g) <Tooltip><TooltipTrigger><Info className="w-2.5 h-2.5 text-muted-foreground" /></TooltipTrigger><TooltipContent>{tooltips.massaSecaRecipienteLP}</TooltipContent></Tooltip> </Label>
                                   <Controller name="massaSecaRecipienteLP" control={form.control} render={({ field }) => <Input id="massaSecaRecipienteLP" type="number" step="0.01" placeholder="Ex: 29.50" {...field} className={cn("bg-background/50 h-9", errors.massaSecaRecipienteLP && "border-destructive")} />} />
                                   {errors.massaSecaRecipienteLP && <p className="text-xs text-destructive mt-0.5">{errors.massaSecaRecipienteLP.message}</p>}
                               </div>
                               <div className="space-y-0.5">
                                   <Label htmlFor="massaRecipienteLP" className={cn("flex items-center gap-1 text-xs", errors.massaRecipienteLP && "text-destructive")}> M. Recipiente (g) <Tooltip><TooltipTrigger><Info className="w-2.5 h-2.5 text-muted-foreground" /></TooltipTrigger><TooltipContent>{tooltips.massaRecipienteLP}</TooltipContent></Tooltip> </Label>
                                   <Controller name="massaRecipienteLP" control={form.control} render={({ field }) => <Input id="massaRecipienteLP" type="number" step="0.01" placeholder="Ex: 14.20" {...field} className={cn("bg-background/50 h-9", errors.massaRecipienteLP && "border-destructive")} />} />
                                   {errors.massaRecipienteLP && <p className="text-xs text-destructive mt-0.5">{errors.massaRecipienteLP.message}</p>}
                               </div>
                             </div>
                             {errors.root?.message?.startsWith("LP:") && <p className="text-xs text-destructive mt-1">{errors.root.message}</p>}
                          </div>
                       </AccordionContent>
                    </AccordionItem>
                    {/* Item Accordion: Dados Adicionais */}
                    <AccordionItem value="adicionais" className="border-0">
                       <AccordionTrigger className="text-xs font-semibold text-foreground bg-accent/5 hover:bg-accent/10 px-3 py-1.5 rounded-lg border border-accent/20 [&[data-state=open]]:rounded-b-none">
                          <div className="flex items-center gap-1.5"> <Info className="w-3.5 h-3.5 text-cyan-500" /> Dados Adicionais (Opcional) </div>
                       </AccordionTrigger>
                       <AccordionContent className="p-3 bg-accent/5 rounded-b-lg border border-t-0 border-accent/20">
                          <div className="grid grid-cols-2 gap-3">
                             {/* Inputs com Controller (compactados) */}
                             <div className="space-y-0.5">
                                <Label htmlFor="umidadeNatural" className={cn("flex items-center gap-1 text-xs", errors.umidadeNatural && "text-destructive")}> Umidade Natural (%) <Tooltip><TooltipTrigger><Info className="w-2.5 h-2.5 text-muted-foreground" /></TooltipTrigger><TooltipContent>{tooltips.umidadeNatural}</TooltipContent></Tooltip> </Label>
                                 <Controller name="umidadeNatural" control={form.control} render={({ field }) => <Input id="umidadeNatural" type="number" step="0.1" placeholder="Ex: 28.5" {...field} value={field.value ?? ""} className={cn("bg-background/50 h-9", errors.umidadeNatural && "border-destructive")} />} />
                                {errors.umidadeNatural && <p className="text-xs text-destructive mt-0.5">{errors.umidadeNatural.message}</p>}
                             </div>
                             <div className="space-y-0.5">
                                <Label htmlFor="percentualArgila" className={cn("flex items-center gap-1 text-xs", errors.percentualArgila && "text-destructive")}> % Argila (&lt;0.002mm) <Tooltip><TooltipTrigger><Info className="w-2.5 h-2.5 text-muted-foreground" /></TooltipTrigger><TooltipContent>{tooltips.percentualArgila}</TooltipContent></Tooltip> </Label>
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
            <CardFooter className="flex gap-3 pt-3 border-t border-border/50 mt-auto">
              <Button type="submit" disabled={!canSubmit} className="flex-1 h-9">
                <CalcIcon className="w-4 h-4 mr-1.5" />
                {isCalculating ? "Calculando..." : "Calcular"}
              </Button>
              <Button type="button" onClick={handleFillExampleData} variant="outline" disabled={isCalculating} className="h-9">
                <FileText className="w-4 h-4 mr-2" />
                Exemplo
              </Button>
              <Button type="button" onClick={handleClear} variant="outline" disabled={isCalculating} className="h-9">
                Limpar
              </Button>
            </CardFooter>
             {apiError && !isCalculating && ( <div className="px-4 pb-3"> <Alert variant="destructive" className="p-2"> <AlertCircle className="h-4 w-4" /> <AlertTitle className="text-sm">Erro</AlertTitle> <AlertDescription className="text-xs">{apiError}</AlertDescription> </Alert> </div> )}
           </form>
        </Card>

        {/* --- Card de Resultados com Carrossel (Inalterado) --- */}
        <Card className="glass animate-in fade-in slide-in-from-right-4 duration-700" style={{ animationDelay: '200ms', animationFillMode: 'backwards' }}>
           <CardHeader>
               <CardTitle className="flex items-center gap-2 text-xl">
                   <BarChart3 className="w-5 h-5 text-primary" />
                   Resultados
               </CardTitle>
           </CardHeader>
           <CardContent className="pt-0 px-2 sm:px-4">
            {isCalculating ? (
               <div className="space-y-3">
                 <Skeleton className="h-12 w-full" /> <Skeleton className="h-12 w-full" /> <Skeleton className="h-12 w-full" /> <Skeleton className="h-12 w-full" />
                 <Skeleton className="h-[300px] w-full mt-3" />
               </div>
            ) : results && !results.erro ? (
               <Carousel className="w-full px-8 relative">
                 <CarouselContent>
                   {/* Slide 1: Resultados Numéricos e Classificações Gerais */}
                  <CarouselItem>
                    <div className="space-y-2">
                      <ResultItemGroup title="Limites de Atterberg">
                        <ResultItem label="Limite de Liquidez (LL)" value={results.ll} unit="%" tooltip={tooltips.LL} precision={2}/>
                        <ResultItem label="Limite de Plasticidade (LP)" value={results.lp} unit="%" tooltip={tooltips.LP} precision={2}/>
                        <ResultItem label="Índice de Plasticidade (IP)" value={results.ip} unit="%" tooltip={tooltips.IP} highlight precision={2}/>
                      </ResultItemGroup>
                      {(results.ic !== null) && (
                        <ResultItemGroup title="Consistência">
                          {results.ic !== null ? ( <ResultItem label="Índice de Consistência (IC)" value={results.ic} unit="" tooltip={tooltips.IC} precision={3}/> ) : ( <MissingInfoItem label="Índice de Consistência (IC)" reason={!form.getValues("umidadeNatural") ? "w% não fornecida" : (results.ip !== null && results.ip < 1e-9 ? "IP ≈ 0" : "Dado ausente")} /> )}
                        </ResultItemGroup>
                      )}
                      {(results.atividade_argila !== null) && (
                        <ResultItemGroup title="Atividade">
                          {results.atividade_argila !== null ? ( <ResultItem label="Atividade da Argila (Ia)" value={results.atividade_argila} unit="" tooltip={tooltips.Atividade} precision={3}/> ) : ( <MissingInfoItem label="Atividade da Argila (Ia)" reason={!form.getValues("percentualArgila") ? "% Argila não fornecida" : (results.ip !== null && results.ip < 1e-9 ? "IP ≈ 0" : "% Argila ≈ 0 ou dado ausente")} /> )}
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
                   {/* Slide 2: Carta de Plasticidade e Classificação Detalhada */}
                   <CarouselItem>
                     <div className="space-y-2">
                       {(results.ll !== null && results.ip !== null) && (
                         <div id="plasticity-chart">
                           <h3 className="font-semibold text-xs text-foreground mb-1.5 flex items-center gap-1.5">
                             <LineChart className="w-3.5 h-3.5 text-primary" /> Carta de Plasticidade
                             <TooltipProvider><Tooltip><TooltipTrigger><Button variant="ghost" size="icon" className="h-4 w-4 text-muted-foreground hover:text-primary rounded-full p-0"><Info className="w-3 h-3" /></Button></TooltipTrigger><TooltipContent>{tooltips.CartaPlasticidade}</TooltipContent></Tooltip></TooltipProvider>
                           </h3>
                           <PlasticityChart ll={results.ll} ip={results.ip} />
                         </div>
                       )}
                     </div>
                   </CarouselItem>
                 </CarouselContent>
                 <CarouselPrevious className="absolute left-[-8px] top-1/2 -translate-y-1/2 h-8 w-8" />
                 <CarouselNext className="absolute right-[-8px] top-1/2 -translate-y-1/2 h-8 w-8" />
               </Carousel>
            ) : ( /* Placeholder ou Erro */
               <div className="flex flex-col items-center justify-center h-56 text-center">
                 <Droplets className="w-12 h-12 text-indigo-500/30 mb-3" />
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

// --- Componentes Auxiliares (Compactados) ---
const ResultItemGroup: React.FC<{ title?: string, children: React.ReactNode }> = ({ title, children }) => ( <div className="space-y-1"> {title && <h4 className="text-xs font-medium text-muted-foreground mb-1 pt-1 border-t border-border/30">{title}</h4>} <div className="space-y-1">{children}</div> </div> );
function ResultItem({ label, value, unit, tooltip, highlight = false, precision = 2 }: ResultItemProps) { const displayValue = typeof value === 'number' && !isNaN(value) ? value.toFixed(precision) : (value || "-"); return ( <div className={cn( "flex justify-between items-center px-2 py-1.5 rounded-lg min-h-[36px]", highlight ? "bg-primary/10 border border-primary/20" : "bg-background/50 border border-border/50" )}> <TooltipProvider> <span className="text-xs font-medium text-muted-foreground flex items-center gap-1"> {label} {tooltip && ( <Tooltip> <TooltipTrigger> <Button variant="ghost" size="icon" className="h-4 w-4 text-muted-foreground hover:text-primary rounded-full p-0"> <Info className="w-2.5 h-2.5" /> </Button> </TooltipTrigger> <TooltipContent>{tooltip}</TooltipContent> </Tooltip> )} </span> </TooltipProvider> <span className={cn("font-semibold text-right pl-1.5", highlight ? "text-primary text-sm" : "text-foreground text-sm")}> {displayValue} {unit} </span> </div> ); }
const MissingInfoItem = ({ label, reason }: { label: string, reason: string }) => ( <div className="flex justify-between items-center px-2 py-1.5 rounded-lg bg-muted/30 border border-border/30 border-dashed min-h-[36px]"> <span className="text-xs font-medium text-muted-foreground">{label}</span> <span className="text-xs text-muted-foreground italic text-right pl-1.5">{reason}</span> </div> );
const ClassificationBadge = ({ label, value }: { label: string; value: string }) => { let badgeVariant: "default" | "secondary" | "destructive" = "default"; if (value.includes("Não") || value.includes("Inativa")) { badgeVariant = "secondary"; } return ( <div className="flex flex-col items-start gap-0.5"> <span className="text-xs text-muted-foreground">{label}</span> <Badge variant={badgeVariant} className="text-xs px-2 py-0.5">{value}</Badge> </div> ); };