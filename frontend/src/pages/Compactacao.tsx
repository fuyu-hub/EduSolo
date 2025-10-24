// frontend/src/pages/Compactacao.tsx
import { useState, useEffect } from "react";
import axios from "axios";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Hammer, Info, Calculator as CalcIcon, Plus, Trash2, ChevronLeft, ChevronRight, AlertCircle, BarChart3, Save, FolderOpen, Download, Printer } from "lucide-react";
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
import SavedCalculations from "@/components/SavedCalculations";
import SaveDialog from "@/components/SaveDialog";
import PrintHeader from "@/components/PrintHeader";
import CalculationActions from "@/components/CalculationActions";
import { exportToPDF, exportToExcel, ExportData, ExcelExportData, formatNumberForExport, captureChartAsImage } from "@/lib/export-utils";
import CurvaCompactacao from "@/components/compactacao/CurvaCompactacao";
import TabelaResultados from "@/components/compactacao/TabelaResultados";
import DialogExemplos from "@/components/compactacao/DialogExemplos";
import { ExemploCompactacao } from "@/lib/exemplos-compactacao";

// Schema de validação
const pontoCompactacaoSchema = z.object({
  id: z.string(),
  pesoAmostaCilindro: z.string().min(1, { message: "Obrigatório" }).refine(val => !isNaN(parseFloat(val)) && parseFloat(val) > 0, { message: "Deve ser > 0" }),
  pesoBrutoUmido: z.string().min(1, { message: "Obrigatório" }).refine(val => !isNaN(parseFloat(val)) && parseFloat(val) > 0, { message: "Deve ser > 0" }),
  pesoBrutoSeco: z.string().min(1, { message: "Obrigatório" }).refine(val => !isNaN(parseFloat(val)) && parseFloat(val) > 0, { message: "Deve ser > 0" }),
  tara: z.string().min(1, { message: "Obrigatório" }).refine(val => !isNaN(parseFloat(val)) && parseFloat(val) >= 0, { message: "Deve ser >= 0" }),
}).refine(data => {
  const umido = parseFloat(data.pesoBrutoUmido);
  const seco = parseFloat(data.pesoBrutoSeco);
  return isNaN(umido) || isNaN(seco) || umido >= seco;
}, {
  message: "Peso úmido >= Peso seco",
  path: ["pesoBrutoUmido"],
}).refine(data => {
  const seco = parseFloat(data.pesoBrutoSeco);
  const tara = parseFloat(data.tara);
  return isNaN(seco) || isNaN(tara) || seco >= tara;
}, {
  message: "Peso seco >= Tara",
  path: ["pesoBrutoSeco"],
});

const formSchema = z.object({
  volumeCilindro: z.string().min(1, { message: "Obrigatório" }).refine(val => !isNaN(parseFloat(val)) && parseFloat(val) > 0, { message: "Volume > 0" }),
  pesoCilindro: z.string().min(1, { message: "Obrigatório" }).refine(val => !isNaN(parseFloat(val)) && parseFloat(val) >= 0, { message: "Peso >= 0" }),
  Gs: z.string().optional().refine(val => val === undefined || val === "" || (!isNaN(parseFloat(val)) && parseFloat(val) > 0), {
    message: "Gs deve ser > 0 ou vazio",
  }),
  pesoEspecificoAgua: z.string().refine(val => !isNaN(parseFloat(val)) && parseFloat(val) > 0, { message: "γw > 0" }),
  pontos: z.array(pontoCompactacaoSchema).min(3, { message: "Mínimo 3 pontos necessários" }),
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
  Gs: "Densidade relativa dos grãos (opcional, necessário para curva S=100%)",
  pesoAmostaCilindro: "Peso da amostra compactada + cilindro (g)",
  pesoBrutoUmido: "Peso do recipiente + solo úmido para determinação de umidade (g)",
  pesoBrutoSeco: "Peso do recipiente + solo seco após estufa (g)",
  tara: "Peso do recipiente vazio (g)",
};

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export default function Compactacao() {
  const { toast: toastFn } = { toast };
  const [currentPointIndex, setCurrentPointIndex] = useState(0);

  const form = useForm<FormInputValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      volumeCilindro: "982",
      pesoCilindro: "4100",
      Gs: "",
      pesoEspecificoAgua: "10.0",
      pontos: [
        { id: crypto.randomUUID(), pesoAmostaCilindro: "", pesoBrutoUmido: "", pesoBrutoSeco: "", tara: "" },
        { id: crypto.randomUUID(), pesoAmostaCilindro: "", pesoBrutoUmido: "", pesoBrutoSeco: "", tara: "" },
        { id: crypto.randomUUID(), pesoAmostaCilindro: "", pesoBrutoUmido: "", pesoBrutoSeco: "", tara: "" },
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

  useEffect(() => {
    if (fields.length > 0) {
      setCurrentPointIndex(prev => Math.min(prev, fields.length - 1));
    } else {
      setCurrentPointIndex(0);
    }
  }, [fields.length]);

  const addPonto = () => {
    append({ id: crypto.randomUUID(), pesoAmostaCilindro: "", pesoBrutoUmido: "", pesoBrutoSeco: "", tara: "" });
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
        { id: crypto.randomUUID(), pesoAmostaCilindro: "", pesoBrutoUmido: "", pesoBrutoSeco: "", tara: "" },
        { id: crypto.randomUUID(), pesoAmostaCilindro: "", pesoBrutoUmido: "", pesoBrutoSeco: "", tara: "" },
        { id: crypto.randomUUID(), pesoAmostaCilindro: "", pesoBrutoUmido: "", pesoBrutoSeco: "", tara: "" },
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
        append({ id: crypto.randomUUID(), pesoAmostaCilindro: "", pesoBrutoUmido: "", pesoBrutoSeco: "", tara: "" }, { shouldFocus: false });
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
        pontos: example.pontos.map(p => ({ ...p, id: crypto.randomUUID() })),
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

  const handleExportPDF = async () => {
    if (!results) return;
    const formData = form.getValues();

    toast("Capturando gráfico...");
    const chartImage = await captureChartAsImage('curva-compactacao-chart');

    const inputs: { label: string; value: string }[] = [
      { label: "Volume do Cilindro", value: `${formData.volumeCilindro} cm³` },
      { label: "Peso do Cilindro", value: `${formData.pesoCilindro} g` },
    ];
    if (formData.Gs) inputs.push({ label: "Densidade Relativa (Gs)", value: formData.Gs });

    formData.pontos.forEach((p, i) => {
      inputs.push({ label: `Ponto ${i + 1} - Peso Amostra+Cil`, value: `${p.pesoAmostaCilindro} g` });
      inputs.push({ label: `Ponto ${i + 1} - Peso Bruto Úmido`, value: `${p.pesoBrutoUmido} g` });
      inputs.push({ label: `Ponto ${i + 1} - Peso Bruto Seco`, value: `${p.pesoBrutoSeco} g` });
      inputs.push({ label: `Ponto ${i + 1} - Tara`, value: `${p.tara} g` });
    });

    const resultsList: { label: string; value: string; highlight?: boolean }[] = [];
    if (results.umidade_otima !== null) resultsList.push({ label: "Umidade Ótima (w_ot)", value: `${formatNumberForExport(results.umidade_otima, 2)}%`, highlight: true });
    if (results.peso_especifico_seco_max !== null) resultsList.push({ label: "γ seco máximo", value: `${formatNumberForExport(results.peso_especifico_seco_max / 10, 3)} g/cm³`, highlight: true });

    const exportData: ExportData = {
      moduleName: "compactacao",
      moduleTitle: "Compactação (Proctor)",
      inputs,
      results: resultsList,
      chartImage: chartImage || undefined
    };

    toast("Gerando PDF...");
    const success = await exportToPDF(exportData);
    if (success) {
      toast("PDF exportado!", { description: "O arquivo foi baixado com sucesso." });
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
    if (results.peso_especifico_seco_max !== null) resultadosData.push({ label: "γ seco máximo (g/cm³)", value: (results.peso_especifico_seco_max / 10).toFixed(3) });

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
    <div className="space-y-4 max-w-7xl mx-auto">
      <PrintHeader moduleTitle="Compactação (Proctor)" moduleName="compactacao" />

      {/* Header */}
      <div className="flex items-center justify-between gap-3 animate-in fade-in slide-in-from-left-4 duration-500">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center shadow-lg transition-transform hover:scale-110 hover:rotate-3">
            <Hammer className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Ensaio de Compactação</h1>
            <p className="text-muted-foreground text-sm">Determinação da curva de compactação (Proctor)</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
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

      <div className="grid lg:grid-cols-2 gap-4">
        {/* Formulário */}
        <Card className="glass flex flex-col animate-in fade-in slide-in-from-left-4 duration-700" style={{ animationDelay: '100ms', animationFillMode: 'backwards' }}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col flex-1">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-xl">
                <CalcIcon className="w-5 h-5" />
                Dados do Ensaio
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 p-4 pt-0 flex-1">
              <TooltipProvider>
                {/* Dados Fixos */}
                <div className="space-y-3 p-3 rounded-lg bg-accent/5 border border-accent/20">
                  <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                    <Info className="w-4 h-4 text-orange-500" />
                    Parâmetros Gerais
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-0.5">
                      <Label htmlFor="volumeCilindro" className={cn("flex items-center gap-1 text-xs", errors.volumeCilindro && "text-destructive")}>
                        Volume Cilindro (cm³)
                        <Tooltip>
                          <TooltipTrigger><Info className="w-2.5 h-2.5 text-muted-foreground" /></TooltipTrigger>
                          <TooltipContent>{tooltips.volumeCilindro}</TooltipContent>
                        </Tooltip>
                      </Label>
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
                      <Label htmlFor="pesoCilindro" className={cn("flex items-center gap-1 text-xs", errors.pesoCilindro && "text-destructive")}>
                        Peso Cilindro (g)
                        <Tooltip>
                          <TooltipTrigger><Info className="w-2.5 h-2.5 text-muted-foreground" /></TooltipTrigger>
                          <TooltipContent>{tooltips.pesoCilindro}</TooltipContent>
                        </Tooltip>
                      </Label>
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
                      <Label htmlFor="Gs" className={cn("flex items-center gap-1 text-xs", errors.Gs && "text-destructive")}>
                        Gs (opcional)
                        <Tooltip>
                          <TooltipTrigger><Info className="w-2.5 h-2.5 text-muted-foreground" /></TooltipTrigger>
                          <TooltipContent>{tooltips.Gs}</TooltipContent>
                        </Tooltip>
                      </Label>
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
                <Accordion type="single" collapsible defaultValue="pontos" className="w-full">
                  <AccordionItem value="pontos" className="border-0">
                    <AccordionTrigger className="text-sm font-semibold text-foreground bg-accent/5 hover:bg-accent/10 px-3 py-2 rounded-lg border border-accent/20 [&[data-state=open]]:rounded-b-none">
                      <div className="flex items-center gap-1.5">
                        <Hammer className="w-4 h-4 text-orange-500" />
                        Pontos de Compactação
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="p-0 pt-2">
                      <div className="space-y-2 rounded-lg bg-background/30 border border-accent/20 border-t-0 rounded-t-none p-3">
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
                                <Label htmlFor={`pontos.${currentPointIndex}.pesoAmostaCilindro`} className={cn("flex items-center gap-1 text-xs", errors.pontos?.[currentPointIndex]?.pesoAmostaCilindro && "text-destructive")}>
                                  Peso Amostra + Cilindro (g)
                                  <Tooltip>
                                    <TooltipTrigger><Info className="w-2.5 h-2.5 text-muted-foreground" /></TooltipTrigger>
                                    <TooltipContent>{tooltips.pesoAmostaCilindro}</TooltipContent>
                                  </Tooltip>
                                </Label>
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
                                <Label htmlFor={`pontos.${currentPointIndex}.pesoBrutoUmido`} className={cn("flex items-center gap-1 text-xs", errors.pontos?.[currentPointIndex]?.pesoBrutoUmido && "text-destructive")}>
                                  Peso Bruto Úmido (g)
                                  <Tooltip>
                                    <TooltipTrigger><Info className="w-2.5 h-2.5 text-muted-foreground" /></TooltipTrigger>
                                    <TooltipContent>{tooltips.pesoBrutoUmido}</TooltipContent>
                                  </Tooltip>
                                </Label>
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
                                <Label htmlFor={`pontos.${currentPointIndex}.pesoBrutoSeco`} className={cn("flex items-center gap-1 text-xs", errors.pontos?.[currentPointIndex]?.pesoBrutoSeco && "text-destructive")}>
                                  Peso Bruto Seco (g)
                                  <Tooltip>
                                    <TooltipTrigger><Info className="w-2.5 h-2.5 text-muted-foreground" /></TooltipTrigger>
                                    <TooltipContent>{tooltips.pesoBrutoSeco}</TooltipContent>
                                  </Tooltip>
                                </Label>
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
                                <Label htmlFor={`pontos.${currentPointIndex}.tara`} className={cn("flex items-center gap-1 text-xs", errors.pontos?.[currentPointIndex]?.tara && "text-destructive")}>
                                  Tara (g)
                                  <Tooltip>
                                    <TooltipTrigger><Info className="w-2.5 h-2.5 text-muted-foreground" /></TooltipTrigger>
                                    <TooltipContent>{tooltips.tara}</TooltipContent>
                                  </Tooltip>
                                </Label>
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

            <CardFooter className="flex gap-3 pt-3 border-t border-border/50 mt-auto">
              <Button type="submit" disabled={!canSubmit} className="flex-1 h-9">
                <CalcIcon className="w-4 h-4 mr-1.5" />
                {isCalculating ? "Calculando..." : "Calcular"}
              </Button>
              <Button type="button" onClick={handleClear} variant="outline" disabled={isCalculating} className="h-9">
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
        <Card className="glass animate-in fade-in slide-in-from-right-4 duration-700" style={{ animationDelay: '200ms', animationFillMode: 'backwards' }}>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <BarChart3 className="w-5 h-5 text-primary" />
              Resultados
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 px-2 sm:px-4">
            {isCalculating ? (
              <div className="space-y-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-[280px] w-full mt-2" />
              </div>
            ) : results && !results.erro && results.pontos_curva_compactacao ? (
              <Carousel className="w-full px-8 relative">
                <CarouselContent>
                  {/* Slide 1: Tabela de Resultados */}
                  <CarouselItem>
                    <div className="space-y-2">
                      <TabelaResultados pontos={results.pontos_curva_compactacao} indiceMaximo={indiceMaximo} />
                      {/* Cards com valores principais */}
                      <div className="grid grid-cols-2 gap-2 mt-3">
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
                <Hammer className="w-12 h-12 text-orange-500/30 mb-3" />
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
