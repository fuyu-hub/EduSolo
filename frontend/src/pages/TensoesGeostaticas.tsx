// frontend/src/pages/TensoesGeostaticas.tsx
import { useState, useEffect } from "react";
import axios from "axios";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Layers, Info, Calculator as CalcIcon, Plus, Trash2, ChevronLeft, ChevronRight, AlertCircle, BarChart3, Save, FolderOpen, Download, Printer } from "lucide-react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSavedCalculations } from "@/hooks/use-saved-calculations";
import SavedCalculations from "@/components/SavedCalculations";
import SaveDialog from "@/components/SaveDialog";
import PrintHeader from "@/components/PrintHeader";
import CalculationActions from "@/components/CalculationActions";
import { exportToPDF, exportToExcel, ExportData, ExcelExportData, formatNumberForExport, captureChartAsImage } from "@/lib/export-utils";
import PerfilTensoes from "@/components/tensoes/PerfilTensoes";
import TabelaResultados from "@/components/tensoes/TabelaResultados";
import DiagramaCamadas from "@/components/tensoes/DiagramaCamadas";
import DialogExemplos from "@/components/tensoes/DialogExemplos";
import { ExemploTensoes } from "@/lib/exemplos-tensoes";
import { CamadaData } from "@/components/tensoes/DialogCamada";
import DialogConfiguracoes, { ConfigData } from "@/components/tensoes/DialogConfiguracoes";
import { transferirNAParaCamadaCorreta, CamadaTensoes } from "@/lib/tensoes-utils";

// Schema de validação
const camadaSchema = z.object({
  id: z.string(),
  nome: z.string().min(1, { message: "Nome obrigatório" }),
  espessura: z.string().min(1, { message: "Obrigatório" }).refine(val => !isNaN(parseFloat(val)) && parseFloat(val) > 0, { message: "Deve ser > 0" }),
  profundidadeNA: z.string().optional().refine(val => val === undefined || val === "" || (!isNaN(parseFloat(val)) && parseFloat(val) >= 0), {
    message: "Profundidade >= 0 ou vazio",
  }),
  capilaridade: z.string().optional().refine(val => val === undefined || val === "" || (!isNaN(parseFloat(val)) && parseFloat(val) >= 0), {
    message: "Altura >= 0 ou vazio",
  }),
  gamaNat: z.string().optional().refine(val => val === undefined || val === "" || (!isNaN(parseFloat(val)) && parseFloat(val) > 0), {
    message: "Deve ser > 0 ou vazio",
  }),
  gamaSat: z.string().optional().refine(val => val === undefined || val === "" || (!isNaN(parseFloat(val)) && parseFloat(val) > 0), {
    message: "Deve ser > 0 ou vazio",
  }),
  Ko: z.string().optional().refine(val => val === undefined || val === "" || (!isNaN(parseFloat(val)) && parseFloat(val) >= 0 && parseFloat(val) <= 1), { 
    message: "Ko entre 0-1 ou vazio" 
  }),
  impermeavel: z.boolean().optional(),
});

const formSchema = z.object({
  profundidadeNA: z.string().optional().refine(val => val === undefined || val === "" || (!isNaN(parseFloat(val)) && parseFloat(val) >= 0), { message: "Profundidade >= 0 ou vazio" }),
  alturaCapilar: z.string().refine(val => !isNaN(parseFloat(val)) && parseFloat(val) >= 0, { message: "Altura >= 0" }),
  pesoEspecificoAgua: z.string().refine(val => !isNaN(parseFloat(val)) && parseFloat(val) > 0, { message: "γw > 0" }),
  camadas: z.array(camadaSchema).min(1, { message: "Pelo menos 1 camada necessária" }),
});

type FormInputValues = z.infer<typeof formSchema>;

// Interfaces para API
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

const tooltips = {
  profundidadeNA: "Profundidade do Nível d'Água (NA) a partir da superfície (m)",
  alturaCapilar: "Altura da franja capilar acima do NA (m)",
  espessura: "Espessura da camada de solo (m)",
  gamaNat: "Peso específico natural do solo (kN/m³) - usado acima do NA",
  gamaSat: "Peso específico saturado do solo (kN/m³) - usado abaixo do NA",
  Ko: "Coeficiente de empuxo em repouso (adimensional, típico: 0.4-0.6). Padrão: 0.5 se não informado",
};

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export default function TensoesGeostaticas() {
  const { toast: toastFn } = { toast };
  const [currentCamadaIndex, setCurrentCamadaIndex] = useState(0);
  const [config, setConfig] = useState<ConfigData>({
    pesoEspecificoAgua: "10.0",
  });

  const form = useForm<FormInputValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      profundidadeNA: "",
      alturaCapilar: "0.0",
      pesoEspecificoAgua: "10.0",
      camadas: [
        { id: crypto.randomUUID(), nome: "Camada 1", espessura: "5.0", profundidadeNA: "", capilaridade: "", gamaNat: "18.0", gamaSat: "20.0", Ko: "0.5", impermeavel: false },
      ],
    },
    mode: "onBlur",
  });

  const { fields, append, remove } = useFieldArray({ control: form.control, name: "camadas", keyName: "fieldId" });

  const [results, setResults] = useState<Results | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // Estados para salvamento
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [saveName, setSaveName] = useState("");
  const [loadDialogOpen, setLoadDialogOpen] = useState(false);
  const { calculations, saveCalculation, deleteCalculation, renameCalculation } = useSavedCalculations("tensoes-geostaticas");

  useEffect(() => {
    if (fields.length > 0) {
      setCurrentCamadaIndex(prev => Math.min(prev, fields.length - 1));
    } else {
      setCurrentCamadaIndex(0);
    }
  }, [fields.length]);

  const addCamada = () => {
    append({ id: crypto.randomUUID(), nome: `Camada ${fields.length + 1}`, espessura: "", profundidadeNA: "", capilaridade: "", gamaNat: "", gamaSat: "", Ko: "0.5", impermeavel: false });
    setCurrentCamadaIndex(fields.length);
  };

  // Handlers para o diagrama interativo
  const handleAddCamadaFromDiagram = (data: CamadaData) => {
    const novaCamada = { 
      id: crypto.randomUUID(),
      nome: data.nome,
      espessura: data.espessura,
      profundidadeNA: data.profundidadeNA,
      capilaridade: data.capilaridade,
      gamaNat: data.gamaNat, 
      gamaSat: data.gamaSat, 
      Ko: data.Ko || "0.5",
      impermeavel: data.impermeavel || false
    };
    
    append(novaCamada);
    
    // Se foi definido um NA, transferir para a camada correta
    if (data.profundidadeNA && data.profundidadeNA !== "") {
      const profNA = parseFloat(data.profundidadeNA);
      const cap = parseFloat(data.capilaridade || "0");
      
      if (!isNaN(profNA)) {
        setTimeout(() => {
          const camadasAtuais = form.getValues("camadas") as CamadaTensoes[];
          const resultado = transferirNAParaCamadaCorreta(profNA, cap, camadasAtuais.length - 1, camadasAtuais);
          
          if (resultado.erro) {
            toast("Aviso", { description: resultado.erro });
          } else {
            form.setValue("camadas", resultado.camadas);
            if (resultado.indexDestino !== camadasAtuais.length - 1) {
              toast("NA transferido", { 
                description: `O NA foi movido para a Camada ${resultado.indexDestino + 1} (profundidade correta)` 
              });
            }
          }
        }, 100);
      }
    }
    
    toast("Nova camada adicionada!", { description: "Camada inserida com sucesso no perfil." });
  };

  const handleEditCamadaFromDiagram = (index: number, data: CamadaData) => {
    // Atualiza os dados básicos da camada
    form.setValue(`camadas.${index}.nome`, data.nome);
    form.setValue(`camadas.${index}.espessura`, data.espessura);
    form.setValue(`camadas.${index}.gamaNat`, data.gamaNat);
    form.setValue(`camadas.${index}.gamaSat`, data.gamaSat);
    form.setValue(`camadas.${index}.Ko`, data.Ko || "0.5");
    form.setValue(`camadas.${index}.impermeavel`, data.impermeavel || false);
    
    // Se foi definido um NA, transferir para a camada correta
    const profNAStr = data.profundidadeNA;
    const capilaridadeStr = data.capilaridade;
    
    if (profNAStr && profNAStr !== "") {
      const profNA = parseFloat(profNAStr);
      const cap = parseFloat(capilaridadeStr || "0");
      
      if (!isNaN(profNA)) {
        const camadasAtuais = form.getValues("camadas") as CamadaTensoes[];
        const resultado = transferirNAParaCamadaCorreta(profNA, cap, index, camadasAtuais);
        
        if (resultado.erro) {
          toast("Erro", { description: resultado.erro });
          // Limpa o NA da camada atual se houver erro
          form.setValue(`camadas.${index}.profundidadeNA`, "");
          form.setValue(`camadas.${index}.capilaridade`, "");
        } else {
          form.setValue("camadas", resultado.camadas);
          if (resultado.indexDestino !== index) {
            toast("NA transferido", { 
              description: `O NA foi movido para a Camada ${resultado.indexDestino + 1} (profundidade correta)` 
            });
          }
        }
      }
    } else {
      // Limpa NA e capilaridade se não foram fornecidos
      form.setValue(`camadas.${index}.profundidadeNA`, "");
      form.setValue(`camadas.${index}.capilaridade`, "");
    }
    
    toast("Camada atualizada!", { description: `${data.nome} foi atualizada.` });
  };

  const handleConfigChange = (data: ConfigData) => {
    setConfig(data);
    toast("Configurações atualizadas!", { description: "Parâmetros globais aplicados." });
  };

  const removeCamada = () => {
    if (fields.length > 1) {
      remove(currentCamadaIndex);
    } else {
      toast("É necessária pelo menos 1 camada", { description: "Não é possível remover a última camada" });
    }
  };

  const goToNextCamada = () => setCurrentCamadaIndex(prev => Math.min(prev + 1, fields.length - 1));
  const goToPreviousCamada = () => setCurrentCamadaIndex(prev => Math.max(prev - 1, 0));

  const handleClear = () => {
      form.reset({
        profundidadeNA: "",
        alturaCapilar: "0.0",
        pesoEspecificoAgua: "10.0",
        camadas: [
          { id: crypto.randomUUID(), nome: "Camada 1", espessura: "5.0", profundidadeNA: "", capilaridade: "", gamaNat: "18.0", gamaSat: "20.0", Ko: "0.5", impermeavel: false },
        ],
      });
    setCurrentCamadaIndex(0);
    setResults(null);
    setApiError(null);
  };

  const handleSelectExample = (example: ExemploTensoes) => {
    const currentLength = fields.length;
    const targetLength = example.camadas.length;

    // Atualiza as configurações globais
    setConfig({
      pesoEspecificoAgua: example.pesoEspecificoAgua,
    });

    if (currentLength < targetLength) {
      for (let i = 0; i < targetLength - currentLength; i++) {
        append({ id: crypto.randomUUID(), nome: "", espessura: "", profundidadeNA: "", capilaridade: "", gamaNat: "", gamaSat: "", Ko: "0.5" }, { shouldFocus: false });
      }
    } else if (currentLength > targetLength) {
      for (let i = currentLength - 1; i >= targetLength; i--) {
        remove(i);
      }
    }

    setTimeout(() => {
      form.reset({
        profundidadeNA: example.profundidadeNA,
        alturaCapilar: example.alturaCapilar,
        pesoEspecificoAgua: example.pesoEspecificoAgua,
        camadas: example.camadas.map(c => ({ ...c, id: crypto.randomUUID() })),
      });
      setCurrentCamadaIndex(0);
      setResults(null);
      setApiError(null);
      toast(`${example.icon} ${example.nome} carregado!`, { description: example.descricao });
    }, 0);
  };

  const handleSaveClick = () => {
    if (!results) return;
    setSaveName(`Perfil ${new Date().toLocaleDateString('pt-BR')}`);
    setSaveDialogOpen(true);
  };

  const handleConfirmSave = () => {
    if (!results || !saveName.trim()) return;
    const formData = form.getValues();
    const success = saveCalculation(saveName.trim(), formData, results);
    if (success) {
      toast("Perfil salvo!", { description: "O perfil geotécnico foi salvo com sucesso." });
      setSaveDialogOpen(false);
      setSaveName("");
    } else {
      toast("Erro ao salvar", { description: "Não foi possível salvar o perfil." });
    }
  };

  const handleLoadCalculation = (calculation: any) => {
    const data = calculation.formData;
    form.reset(data);
    setResults(calculation.results);
    setCurrentCamadaIndex(0);
    toast("Perfil carregado!", { description: `"${calculation.name}" foi carregado com sucesso.` });
  };

  const handleExportPDF = async () => {
    if (!results) return;
    const formData = form.getValues();

    toast("Capturando gráficos...");
    const perfilImage = await captureChartAsImage('perfil-tensoes-chart');
    const diagramaImage = await captureChartAsImage('diagrama-camadas-chart');

    const inputs: { label: string; value: string }[] = [
      { label: "Profundidade do NA", value: `${formData.profundidadeNA} m` },
      { label: "Altura Franja Capilar", value: `${formData.alturaCapilar} m` },
    ];

    formData.camadas.forEach((c, i) => {
      inputs.push({ label: `Camada ${i + 1} - Espessura`, value: `${c.espessura} m` });
      if (c.gamaNat) inputs.push({ label: `Camada ${i + 1} - γ natural`, value: `${c.gamaNat} kN/m³` });
      if (c.gamaSat) inputs.push({ label: `Camada ${i + 1} - γ saturado`, value: `${c.gamaSat} kN/m³` });
      inputs.push({ label: `Camada ${i + 1} - Ko`, value: c.Ko });
    });

    const profundidadeMax = results.pontos_calculo[results.pontos_calculo.length - 1]?.profundidade || 0;
    const tensaoMaxV = Math.max(...results.pontos_calculo.map(p => p.tensao_total_vertical || 0));

    const resultsList: { label: string; value: string; highlight?: boolean }[] = [
      { label: "Profundidade Máxima", value: `${formatNumberForExport(profundidadeMax, 2)} m` },
      { label: "Tensão Total Máxima (σv)", value: `${formatNumberForExport(tensaoMaxV, 2)} kPa`, highlight: true },
    ];

    const exportData: ExportData = {
      moduleName: "tensoes-geostaticas",
      moduleTitle: "Tensões Geostáticas",
      inputs,
      results: resultsList,
      chartImage: perfilImage || diagramaImage || undefined
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
      { label: "Profundidade do NA (m)", value: formData.profundidadeNA },
      { label: "Altura Franja Capilar (m)", value: formData.alturaCapilar },
      { label: "γw (kN/m³)", value: formData.pesoEspecificoAgua },
    ];

    const camadasData: { label: string; value: string | number }[] = [];
    formData.camadas.forEach((c, i) => {
      camadasData.push({ label: `Camada ${i + 1} - Espessura (m)`, value: c.espessura });
      if (c.gamaNat) camadasData.push({ label: `Camada ${i + 1} - γ natural (kN/m³)`, value: c.gamaNat });
      if (c.gamaSat) camadasData.push({ label: `Camada ${i + 1} - γ saturado (kN/m³)`, value: c.gamaSat });
      camadasData.push({ label: `Camada ${i + 1} - Ko`, value: c.Ko });
    });

    const resultadosData: { label: string; value: string | number }[] = [];
    results.pontos_calculo.forEach((p, i) => {
      resultadosData.push({ label: `Ponto ${i + 1} - Prof (m)`, value: p.profundidade.toFixed(2) });
      if (p.tensao_total_vertical !== null && p.tensao_total_vertical !== undefined) {
        resultadosData.push({ label: `Ponto ${i + 1} - σv (kPa)`, value: p.tensao_total_vertical.toFixed(2) });
      }
      if (p.pressao_neutra !== null && p.pressao_neutra !== undefined) {
        resultadosData.push({ label: `Ponto ${i + 1} - u (kPa)`, value: p.pressao_neutra.toFixed(2) });
      }
      if (p.tensao_efetiva_vertical !== null && p.tensao_efetiva_vertical !== undefined) {
        resultadosData.push({ label: `Ponto ${i + 1} - σ'v (kPa)`, value: p.tensao_efetiva_vertical.toFixed(2) });
      }
      if (p.tensao_efetiva_horizontal !== null && p.tensao_efetiva_horizontal !== undefined) {
        resultadosData.push({ label: `Ponto ${i + 1} - σ'h (kPa)`, value: p.tensao_efetiva_horizontal.toFixed(2) });
      }
    });

    const excelData: ExcelExportData = {
      moduleName: "tensoes-geostaticas",
      moduleTitle: "Tensões Geostáticas",
      sheets: [
        { name: "Configuração", data: configData },
        { name: "Camadas", data: camadasData },
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

    let apiInput: TensoesGeostaticasInputAPI;
    try {
      const profNA = parseFloat(data.profundidadeNA);

      apiInput = {
        camadas: data.camadas.map((c, index) => {
          const espessura = parseFloat(c.espessura);
          const Ko = parseFloat(c.Ko);
          
          // Calcula profundidade da camada
          let profTopo = 0;
          for (let i = 0; i < index; i++) {
            profTopo += parseFloat(data.camadas[i].espessura);
          }
          const profBase = profTopo + espessura;

          // Determina quais γ são necessários
          const acimaDoNA = profBase <= profNA;
          const abaixoDoNA = profTopo >= profNA;
          const atravessaNA = !acimaDoNA && !abaixoDoNA;

          let gamaNat: number | null = null;
          let gamaSat: number | null = null;

          if (c.gamaNat && c.gamaNat !== "") gamaNat = parseFloat(c.gamaNat);
          if (c.gamaSat && c.gamaSat !== "") gamaSat = parseFloat(c.gamaSat);

          // Validação
          if (acimaDoNA && gamaNat === null) {
            throw new Error(`Camada ${index + 1} está acima do NA. γ natural é obrigatório.`);
          }
          if (abaixoDoNA && gamaSat === null) {
            throw new Error(`Camada ${index + 1} está abaixo do NA. γ saturado é obrigatório.`);
          }
          if (atravessaNA && (gamaNat === null || gamaSat === null)) {
            throw new Error(`Camada ${index + 1} atravessa o NA. Ambos γ natural e γ saturado são obrigatórios.`);
          }

          // Extrai NA e capilaridade da camada (se definidos)
          const profundidadeNACamada = c.profundidadeNA && c.profundidadeNA !== "" ? parseFloat(c.profundidadeNA) : null;
          const capilaridadeCamada = c.capilaridade && c.capilaridade !== "" ? parseFloat(c.capilaridade) : null;

          return {
            espessura,
            gama_nat: gamaNat !== null ? gamaNat : undefined,
            gama_sat: gamaSat !== null ? gamaSat : undefined,
            Ko: Ko || 0.5, // Usa 0.5 como padrão se Ko não for fornecido
            impermeavel: c.impermeavel || false,
            profundidade_na_camada: profundidadeNACamada !== null ? profundidadeNACamada : undefined,
            altura_capilar_camada: capilaridadeCamada !== null ? capilaridadeCamada : undefined,
          };
        }),
        profundidade_na: profNA,
        altura_capilar: parseFloat(data.alturaCapilar),
        peso_especifico_agua: parseFloat(data.pesoEspecificoAgua),
      };
    } catch (parseError) {
      if (parseError instanceof Error) {
        setApiError(parseError.message);
        toast("Erro de Validação", { description: parseError.message });
      } else {
        setApiError("Erro ao processar os dados do formulário.");
        toast("Erro de Formulário", { description: "Verifique se todos os campos numéricos contêm valores válidos." });
      }
      setIsCalculating(false);
      return;
    }

    try {
      const response = await axios.post<Results>(`${API_URL}/calcular/tensoes-geostaticas`, apiInput);
      if (response.data.erro) {
        setApiError(response.data.erro);
        toast("Erro no Cálculo (API)", { description: response.data.erro });
      } else {
        setResults(response.data);
        toast("Sucesso", { description: "Tensões geostáticas calculadas com sucesso." });
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
  const currentCamadaField = fields[currentCamadaIndex];
  const canSubmit = !isCalculating && form.formState.isValid && !apiError;

  // Prepara dados para componentes
  const camadasParaTabela = form.watch("camadas").map(c => ({
    nome: c.nome,
    espessura: parseFloat(c.espessura) || 0,
    profundidadeNA: c.profundidadeNA && c.profundidadeNA !== "" ? parseFloat(c.profundidadeNA) : null,
    capilaridade: c.capilaridade && c.capilaridade !== "" ? parseFloat(c.capilaridade) : null,
    gamaNat: c.gamaNat && c.gamaNat !== "" ? parseFloat(c.gamaNat) : null,
    gamaSat: c.gamaSat && c.gamaSat !== "" ? parseFloat(c.gamaSat) : null,
    Ko: c.Ko && c.Ko !== "" ? parseFloat(c.Ko) : 0.5,
    impermeavel: c.impermeavel || false,
  }));
  
  // Coleta TODOS os NAs definidos nas camadas
  const niveisAgua = camadasParaTabela
    .map((c, index) => c.profundidadeNA !== null && c.profundidadeNA !== undefined ? {
      profundidade: c.profundidadeNA,
      capilaridade: c.capilaridade || 0,
      index
    } : null)
    .filter((na): na is { profundidade: number; capilaridade: number; index: number } => na !== null);
  
  // Para compatibilidade, pega o primeiro NA (usado em alguns lugares)
  const profNA = niveisAgua.length > 0 ? niveisAgua[0].profundidade : 999;
  const alturaCapilar = niveisAgua.length > 0 ? niveisAgua[0].capilaridade : 0;

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      <PrintHeader moduleTitle="Tensões Geostáticas" moduleName="tensoes-geostaticas" />

      {/* Header */}
      <div className="flex items-center justify-between gap-3 animate-in fade-in slide-in-from-left-4 duration-500">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center shadow-lg transition-transform hover:scale-110 hover:rotate-3">
            <Layers className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Tensões Geostáticas</h1>
            <p className="text-muted-foreground text-sm">Cálculo de tensões totais, efetivas e pressão neutra</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <DialogExemplos onSelectExample={handleSelectExample} disabled={isCalculating} />
          <DialogConfiguracoes configInicial={config} onConfirm={handleConfigChange} disabled={isCalculating} />
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
                Configuração do Perfil
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="w-4 h-4 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent side="right" className="max-w-xs">
                      <div className="space-y-1.5">
                        <p className="font-semibold">💡 Como usar:</p>
                        <ul className="space-y-1 text-xs">
                          <li>• Clique nas camadas para editar os dados</li>
                          <li>• Use o botão "+" para adicionar novas camadas</li>
                          <li>• Defina o NA e capilaridade por camada</li>
                          <li>• Configure γw no botão "Configurações"</li>
                        </ul>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 p-4 pt-0 flex-1">
              <TooltipProvider>
                {/* Perfil de Solo Interativo */}
                <div className="space-y-2">
                  <DiagramaCamadas 
                    camadas={camadasParaTabela} 
                    profundidadeNA={profNA} 
                    alturaCapilar={alturaCapilar}
                    niveisAgua={niveisAgua}
                    interactive={true}
                    onAddCamada={handleAddCamadaFromDiagram}
                    onEditCamada={handleEditCamadaFromDiagram}
                  />
                </div>
              </TooltipProvider>
            </CardContent>

            <CardFooter className="flex gap-2 pt-3 border-t border-border/50 mt-auto">
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

        {/* Resultados e Visualizações */}
        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-700" style={{ animationDelay: '200ms', animationFillMode: 'backwards' }}>
          {/* Tabs com Tabela e Perfil de Tensões */}
          {!isCalculating && results && results.pontos_calculo && results.pontos_calculo.length > 0 && (
            <Tabs defaultValue="tabela" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="tabela">Tabela de Resultados</TabsTrigger>
                <TabsTrigger value="grafico">Perfil de Tensões</TabsTrigger>
              </TabsList>
              <TabsContent value="tabela" className="mt-4">
                <Card>
                  <CardContent className="pt-6">
                    <TabelaResultados pontos={results.pontos_calculo} profundidadeNA={profNA} alturaCapilar={alturaCapilar} niveisAgua={niveisAgua} />
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="grafico" className="mt-4">
                <div id="perfil-tensoes-chart">
                  <PerfilTensoes pontos={results.pontos_calculo} profundidadeNA={profNA} niveisAgua={niveisAgua} />
                </div>
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

      <SavedCalculations
        open={loadDialogOpen}
        onOpenChange={setLoadDialogOpen}
        calculations={calculations}
        onLoad={handleLoadCalculation}
        onDelete={deleteCalculation}
        onRename={renameCalculation}
        moduleName="Tensões Geostáticas"
      />
    </div>
  );
}

