// frontend/src/pages/IndicesFisicos.tsx
import { useState, useMemo } from "react";
import { Calculator, Info, BarChart3, ArrowLeft, ArrowRight, Save, FolderOpen, Download, Printer, FileText } from "lucide-react";
import axios from 'axios';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
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
import PrintHeader from "@/components/PrintHeader";
import CalculationActions from "@/components/CalculationActions";
import { exportToPDF, exportToExcel, ExportData, ExcelExportData, formatNumberForExport } from "@/lib/export-utils";
import SoilExamples from "@/components/soil/SoilExamples";
import GsSuggestions from "@/components/soil/GsSuggestions";
import ResultInterpretation from "@/components/soil/ResultInterpretation";
import InputWithValidation from "@/components/soil/InputWithValidation";
import { SoilExample } from "@/lib/soil-constants";
import { Switch } from "@/components/ui/switch";

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
  Gs: "Densidade relativa dos grãos (adimensional, ex: 2.65)",
  pesoEspecificoAgua: "Peso específico da água (kN/m³, padrão 10.0)",
  indice_vazios_max: "Índice de vazios máximo do solo (emax). Necessário para calcular Dr.",
  indice_vazios_min: "Índice de vazios mínimo do solo (emin). Necessário para calcular Dr.",
};

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'; // URL do backend

export default function IndicesFisicos() {
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

  // Estados para salvamento e exportação
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [saveName, setSaveName] = useState("");
  const [loadDialogOpen, setLoadDialogOpen] = useState(false);
  const { calculations, saveCalculation, deleteCalculation, renameCalculation, getCalculation } = useSavedCalculations("indices-fisicos");

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
      const response = await axios.post<IndicesFisicosOutput>(`${API_URL}/calcular/indices-fisicos`, apiInput);

      if (response.data.erro) {
        setError(response.data.erro);
        toast({
          title: "Erro no Cálculo",
          description: response.data.erro,
          variant: "destructive",
        });
      } else {
        setResults(response.data);
      }
    } catch (err) {
      console.error("Erro ao chamar a API (catch):", err);
      let errorMessage = "Não foi possível conectar ao servidor de cálculo.";
      if (axios.isAxiosError(err) && err.response?.data?.detail) {
        if (Array.isArray(err.response.data.detail)) {
          errorMessage = err.response.data.detail.map((d: any) => `${d.loc.join('.')} - ${d.msg}`).join("; ");
        } else {
          errorMessage = err.response.data.detail;
        }
      } else if (err instanceof Error) {
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
      description: `Densidade relativa dos grãos definida como ${gsValue}`,
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

  const handleExportPDF = async () => {
    if (!results) return;

    const inputs: { label: string; value: string }[] = [
      { label: "Massa Úmida", value: `${formData.massaUmida} g` },
      { label: "Massa Seca", value: `${formData.massaSeca} g` },
      { label: "Volume Total", value: `${formData.volume} cm³` },
    ];
    
    if (formData.Gs) inputs.push({ label: "Densidade Relativa (Gs)", value: formData.Gs });
    if (formData.indice_vazios_max) inputs.push({ label: "Índice Vazios Máx", value: formData.indice_vazios_max });
    if (formData.indice_vazios_min) inputs.push({ label: "Índice Vazios Mín", value: formData.indice_vazios_min });

    const resultsList: { label: string; value: string; highlight?: boolean }[] = [];
    if (results.peso_especifico_natural !== null) resultsList.push({ label: "Peso Específico Natural", value: `${formatNumberForExport(results.peso_especifico_natural)} kN/m³`, highlight: true });
    if (results.peso_especifico_seco !== null) resultsList.push({ label: "Peso Específico Seco", value: `${formatNumberForExport(results.peso_especifico_seco)} kN/m³` });
    if (results.peso_especifico_saturado !== null) resultsList.push({ label: "Peso Específico Saturado", value: `${formatNumberForExport(results.peso_especifico_saturado)} kN/m³` });
    if (results.peso_especifico_submerso !== null) resultsList.push({ label: "Peso Específico Submerso", value: `${formatNumberForExport(results.peso_especifico_submerso)} kN/m³` });
    if (results.Gs !== null) resultsList.push({ label: "Densidade Relativa (Gs)", value: formatNumberForExport(results.Gs, 3) });
    if (results.indice_vazios !== null) resultsList.push({ label: "Índice de Vazios", value: formatNumberForExport(results.indice_vazios, 3) });
    if (results.porosidade !== null) resultsList.push({ label: "Porosidade", value: `${formatNumberForExport(results.porosidade)}%` });
    if (results.grau_saturacao !== null) resultsList.push({ label: "Grau de Saturação", value: `${formatNumberForExport(results.grau_saturacao)}%` });
    if (results.umidade !== null) resultsList.push({ label: "Umidade", value: `${formatNumberForExport(results.umidade)}%` });
    if (results.compacidade_relativa !== null) resultsList.push({ label: "Compacidade Relativa", value: `${formatNumberForExport(results.compacidade_relativa)}%` });
    if (results.classificacao_compacidade) resultsList.push({ label: "Classificação", value: results.classificacao_compacidade });

    const exportData: ExportData = {
      moduleName: "indices-fisicos",
      moduleTitle: "Índices Físicos",
      inputs,
      results: resultsList,
    };

    const success = await exportToPDF(exportData);
    if (success) {
      toast({
        title: "PDF exportado!",
        description: "O arquivo foi baixado com sucesso.",
      });
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
    if (formData.Gs) entradaData.push({ label: "Densidade Relativa (Gs)", value: formData.Gs });
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
    if (results.Gs !== null) resultadosData.push({ label: "Densidade Relativa (Gs)", value: results.Gs.toFixed(3) });
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

  // Validação: precisa de pelo menos 3 dos 4 básicos OU Gs
  const isFormValid =
    (Object.values(formData).filter((v, i) => i < 3 && v && !isNaN(parseFloat(v))).length >= 3) ||
    (formData.Gs && !isNaN(parseFloat(formData.Gs)));

  // Agrupamento dos Resultados para o Carrossel
  const resultItems = useMemo(() => {
    if (!results || results.erro) return [];

    const items = [
      results.peso_especifico_natural !== null ? <ResultItem key="gama_nat" label="Natural (γn)" value={results.peso_especifico_natural} unit="kN/m³" infoKey="peso_especifico_natural" precision={2}/> : null,
      results.peso_especifico_seco !== null ? <ResultItem key="gama_d" label="Seco (γd)" value={results.peso_especifico_seco} unit="kN/m³" infoKey="peso_especifico_seco" precision={2}/> : null,
      results.peso_especifico_solidos !== null ? <ResultItem key="gama_s" label="Sólidos (γs)" value={results.peso_especifico_solidos} unit="kN/m³" infoKey="peso_especifico_solidos" precision={2}/> : null,
      results.Gs !== null ? <ResultItem key="Gs" label="Densidade Relativa (Gs)" value={results.Gs} unit="" infoKey="Gs" precision={3}/> : null,
      results.peso_especifico_saturado !== null ? <ResultItem key="gama_sat" label="Saturado (γsat)" value={results.peso_especifico_saturado} unit="kN/m³" infoKey="peso_especifico_saturado" precision={2} /> : null,
      results.peso_especifico_submerso !== null ? <ResultItem key="gama_sub" label="Submerso (γsub)" value={results.peso_especifico_submerso} unit="kN/m³" infoKey="peso_especifico_submerso" precision={2} /> : null,
      results.umidade !== null ? <ResultItem key="w" label="Umidade (w)" value={results.umidade} unit="%" infoKey="umidade" precision={2}/> : null,
      results.indice_vazios !== null ? <ResultItem key="e" label="Índice de Vazios (e)" value={results.indice_vazios} unit="" infoKey="indice_vazios" precision={3}/> : null,
      results.porosidade !== null ? <ResultItem key="n" label="Porosidade (n)" value={results.porosidade} unit="%" infoKey="porosidade" precision={2}/> : null,
      results.grau_saturacao !== null ? <ResultItem key="Sr" label="Grau de Saturação (Sr)" value={results.grau_saturacao} unit="%" infoKey="grau_saturacao" precision={2}/> : null,
      results.compacidade_relativa !== null ? <ResultItem key="Dr" label="Compacidade Relativa (Dr)" value={results.compacidade_relativa} unit="%" infoKey="compacidade_relativa" precision={2}/> : null,
      results.classificacao_compacidade ? <ResultItem key="class_dr" label="Classificação (Dr)" value={results.classificacao_compacidade} unit="" infoKey="classificacao_compacidade" /> : null,
    ].filter(Boolean); // Remove os nulos

    // Agrupa em chunks de 4
    const chunkSize = 4;
    const chunks = [];
    for (let i = 0; i < items.length; i += chunkSize) {
      chunks.push(items.slice(i, i + chunkSize));
    }
    return chunks;
  }, [results]);


  return (
    <TooltipProvider>
      <div className="space-y-6 max-w-7xl mx-auto">
        <PrintHeader moduleTitle="Índices Físicos" moduleName="indices-fisicos" />
        
        {/* Header */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center shadow-lg">
              <Calculator className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Índices Físicos</h1>
              <p className="text-muted-foreground">Análise das propriedades físicas do solo</p>
            </div>
          </div>
          
          {/* Action Buttons */}
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

        {/* Layout Principal */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          {/* Input Panel - Ajustes de espaçamento aqui */}
          <Card className="glass p-6 lg:col-span-1 flex flex-col"> {/* Adicionado flex flex-col */}
             <h2 className="text-xl font-semibold text-foreground mb-6 flex items-center gap-2"> {/* Aumentado mb-4 para mb-6 */}
              <Info className="w-5 h-5 text-primary" />
              Dados de Entrada
            </h2>
             {/* Aumentado gap e mb */}
             <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5 mb-8"> {/* Aumentado gap-4 para gap-x-6 gap-y-5, mb-6 para mb-8 */}
              {/* Coluna 1 Inputs */}
              <div className="space-y-5">
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
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Label htmlFor="Gs">Densidade Relativa Grãos (Gs)</Label>
                        <Tooltip><TooltipTrigger asChild><Info className="w-4 h-4 text-muted-foreground cursor-help" /></TooltipTrigger><TooltipContent className="max-w-xs"><p>{tooltips.Gs} (Opcional se massas/volume fornecidos)</p></TooltipContent></Tooltip>
                      </div>
                      <GsSuggestions onSelect={handleSelectGs} />
                    </div>
                    <Input id="Gs" type="number" step="0.01" value={formData.Gs} onChange={(e) => handleChange("Gs", e.target.value)} className="bg-background/50" placeholder="Ex: 2.65 (opcional)" />
                  </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="indice_vazios_max">Índice de Vazios Máximo (emax)</Label>
                    <Tooltip><TooltipTrigger asChild><Info className="w-4 h-4 text-muted-foreground cursor-help" /></TooltipTrigger><TooltipContent className="max-w-xs"><p>{tooltips.indice_vazios_max}</p></TooltipContent></Tooltip>
                  </div>
                  <Input id="indice_vazios_max" type="number" step="0.01" value={formData.indice_vazios_max} onChange={(e) => handleChange("indice_vazios_max", e.target.value)} className="bg-background/50" placeholder="Opcional (ex: 0.85)" />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="indice_vazios_min">Índice de Vazios Mínimo (emin)</Label>
                    <Tooltip><TooltipTrigger asChild><Info className="w-4 h-4 text-muted-foreground cursor-help" /></TooltipTrigger><TooltipContent className="max-w-xs"><p>{tooltips.indice_vazios_min}</p></TooltipContent></Tooltip>
                  </div>
                  <Input id="indice_vazios_min" type="number" step="0.01" value={formData.indice_vazios_min} onChange={(e) => handleChange("indice_vazios_min", e.target.value)} className="bg-background/50" placeholder="Opcional (ex: 0.45)" />
                </div>
              </div>
            </div>
              {/* Select - Peso Específico Água */}
              <div className="space-y-2 mb-8 md:col-span-2">
                 <div className="flex items-center gap-2">
                   <Label htmlFor="pesoEspecificoAgua">Peso Específico Água (kN/m³)</Label>
                   <Tooltip><TooltipTrigger asChild><Info className="w-4 h-4 text-muted-foreground cursor-help" /></TooltipTrigger><TooltipContent className="max-w-xs"><p>{tooltips.pesoEspecificoAgua}</p></TooltipContent></Tooltip>
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
              <div className="flex gap-3 md:col-span-2 mt-auto pt-4">
                <Button onClick={handleCalculate} disabled={!isFormValid || isCalculating} className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground">
                  <Calculator className="w-4 h-4 mr-2" />
                  {isCalculating ? "Calculando..." : "Calcular"}
                </Button>
                <SoilExamples onSelect={handleLoadExample} disabled={isCalculating} />
                <Button onClick={handleClear} variant="outline" disabled={isCalculating}>
                  Limpar
                </Button>
              </div>
          </Card>

          {/* Card de Saída Unificado */}
          <Card className="glass p-6 lg:col-span-1 space-y-6">
              {/* Seção do Diagrama de Fases */}
              <div>
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
              <div>
                <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
                   <BarChart3 className="w-5 h-10 text-primary" />
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
                  <Carousel opts={{ align: "start" }} className="w-full px-10"> {/* Adicionado padding horizontal */}
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
                        <CarouselPrevious className="absolute left-0 top-1/2 -translate-y-1/2" /> {/* Ajustado left */}
                        <CarouselNext className="absolute right-0 top-1/2 -translate-y-1/2" /> {/* Ajustado right */}
                      </>
                    )}
                  </Carousel>
                ) : (
                   <div className="flex flex-col items-center justify-center min-h-[150px] text-center">
                    <Calculator className="w-16 h-16 text-muted-foreground/30 mb-4" />
                    <p className="text-muted-foreground">
                      {error ? "Corrija o erro para ver os resultados" : "Os resultados serão exibidos aqui"}
                    </p>
                  </div>
                )}
             </div>
          </Card>
        </div>

        {/* Card de Interpretação */}
        {results && !results.erro && !isCalculating && (
          <ResultInterpretation results={results} />
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

// Componente ResultItem
interface ResultItemProps {
    label: string;
    value: number | string | null;
    unit: string;
    infoKey: keyof typeof conteudoIndicesFisicos;
    precision?: number;
}
function ResultItem({ label, value, unit, infoKey, precision }: ResultItemProps) {
  const content = conteudoIndicesFisicos[infoKey];
  const displayValue = typeof value === 'number' ? value.toFixed(precision ?? 2) : value ?? "-";

  if ((value === null && typeof value !== 'string') || !content) return null;

  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-background/50 border border-border/50 min-h-[56px]">
      <div className="flex items-center gap-1.5">
        <span className="text-sm font-medium text-muted-foreground">{label}</span>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="h-5 w-5 text-muted-foreground hover:text-primary rounded-full">
              <Info className="h-3.5 w-3.5" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 z-50" side="top" align="start">
            <div className="space-y-2">
              <h4 className="font-semibold leading-none text-base">{label}</h4>
              {content?.formula && <div className="text-sm font-mono bg-muted p-2 rounded border border-border/50">{content.formula}</div>}
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
      </div>
      <span className="text-base font-semibold text-primary text-right pl-2">{displayValue} {unit}</span>
    </div>
  );
}