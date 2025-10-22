import { useState, useEffect } from "react";
import axios from 'axios';
import { useForm, useFieldArray, Controller } from "react-hook-form"; // Importa react-hook-form
import { zodResolver } from "@hookform/resolvers/zod"; // Importa resolver Zod
import { z } from "zod"; // Importa Zod
// Importa ícones e componentes UI
import { Droplets, Info, Calculator as CalcIcon, Plus, Trash2, LineChart, ChevronLeft, ChevronRight, AlertCircle } from "lucide-react"; // Adicionado AlertCircle
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"; // Adicionado CardFooter
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge"; // Importa Badge
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"; // Importa Alert
import { cn } from "@/lib/utils";
// Importa componentes do Recharts
import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Label as RechartsLabel, ReferenceLine, ReferenceArea, ZAxis
} from 'recharts'; // Adicionado ReferenceArea, ZAxis
// Importa o componente da Carta
import PlasticityChart from "@/components/visualizations/PlasticityChart"; // Importa o componente separado


// --- Esquema de Validação Zod (Revisado) ---
// Define o schema base para os campos numéricos como string primeiro
const pontoLLSchema = z.object({
  id: z.string(),
  numGolpes: z.string().min(1, { message: "Obrigatório" }).refine(val => !isNaN(parseInt(val)) && parseInt(val) > 0, { message: "Deve ser > 0" }),
  massaUmidaRecipiente: z.string().min(1, { message: "Obrigatório" }).refine(val => !isNaN(parseFloat(val)) && parseFloat(val) > 0, { message: "Deve ser > 0" }),
  massaSecaRecipiente: z.string().min(1, { message: "Obrigatório" }).refine(val => !isNaN(parseFloat(val)) && parseFloat(val) > 0, { message: "Deve ser > 0" }),
  massaRecipiente: z.string().min(1, { message: "Obrigatório" }).refine(val => !isNaN(parseFloat(val)) && parseFloat(val) >= 0, { message: "Deve ser >= 0" }),
}).refine(data => {
    const mu = parseFloat(data.massaUmidaRecipiente);
    const ms = parseFloat(data.massaSecaRecipiente);
    return isNaN(mu) || isNaN(ms) || mu >= ms; // Ajustado para permitir igualdade (caso raro, mas possível)
}, {
  message: "M. úmida >= M. seca",
  path: ["massaUmidaRecipiente"],
}).refine(data => {
    const msr = parseFloat(data.massaSecaRecipiente);
    const mr = parseFloat(data.massaRecipiente);
    return isNaN(msr) || isNaN(mr) || msr >= mr; // Ajustado para permitir igualdade
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
    return isNaN(mu) || isNaN(ms) || mu >= ms; // Ajustado
},{
  message: "LP: M. úmida >= M. seca",
  path: ["massaUmidaRecipienteLP"],
}).refine(data => {
     const msr = parseFloat(data.massaSecaRecipienteLP);
     const mr = parseFloat(data.massaRecipienteLP);
     return isNaN(msr) || isNaN(mr) || msr >= mr; // Ajustado
},{
  message: "LP: M. seca+rec >= M. rec",
  path: ["massaSecaRecipienteLP"],
});


// Tipagem do formulário (usa as strings como no input)
type FormInputValues = z.infer<typeof formSchema>;

// Tipagem para os dados processados para a API (com números)
type ApiInputData = {
    pontos_ll: {
        num_golpes: number;
        massa_umida_recipiente: number;
        massa_seca_recipiente: number;
        massa_recipiente: number;
    }[];
    massa_umida_recipiente_lp: number;
    massa_seca_recipiente_lp: number;
    massa_recipiente_lp: number;
    umidade_natural?: number;
    percentual_argila?: number;
};


// --- Interfaces (mantidas) ---
interface LimitesConsistenciaOutput {
  ll: number | null;
  lp: number | null;
  ip: number | null;
  ic: number | null;
  classificacao_plasticidade: string | null;
  classificacao_consistencia: string | null;
  atividade_argila: number | null;
  classificacao_atividade: string | null;
  erro?: string | null;
}
type Results = LimitesConsistenciaOutput;

// --- Tooltips (mantidos) ---
const tooltips = {
 // LL
  numGolpes: "Número de golpes necessários para fechar a ranhura no ensaio LL (NBR 6459)",
  massaUmidaRecipienteLL: "Massa do recipiente (tara) + solo úmido (g) - Ensaio LL",
  massaSecaRecipienteLL: "Massa do recipiente (tara) + solo seco após estufa (g) - Ensaio LL",
  massaRecipienteLL: "Massa do recipiente (tara) utilizado no ensaio LL (g)",
  // LP
  massaUmidaRecipienteLP: "Massa do recipiente (tara) + solo úmido (g) - Ensaio LP (NBR 7180)",
  massaSecaRecipienteLP: "Massa do recipiente (tara) + solo seco após estufa (g) - Ensaio LP",
  massaRecipienteLP: "Massa do recipiente (tara) utilizado no ensaio LP (g)",
  // Opcionais
  umidadeNatural: "Umidade atual do solo em campo (%) - Necessária para calcular IC",
  percentualArgila: "Percentual de partículas < 0.002mm (%) - Necessário para calcular Atividade (Ia)",
  // Resultados
  LL: "Limite de Liquidez - teor de umidade na transição líquido/plástico",
  LP: "Limite de Plasticidade - teor de umidade na transição plástico/semi-sólido",
  IP: "Índice de Plasticidade = LL - LP (faixa de comportamento plástico)",
  IC: "Índice de Consistência = (LL - w_nat) / IP (estado de consistência do solo)",
  Atividade: "Atividade da Argila (Ia) = IP / (% argila)",
  // Carta
  CartaPlasticidade: "Carta de Plasticidade de Casagrande mostrando a classificação do solo (LL vs IP)",
};

const API_URL = import.meta.env.VITE_API_URL;

// --- Interface ResultItemProps MOVIDA para fora ---
interface ResultItemProps {
    label: string;
    value: number | string | null;
    unit: string;
    tooltip?: string;
    highlight?: boolean;
    precision?: number;
}

// --- Dados de Exemplo ---
const exampleLLData = [
  { numGolpes: "33", massaUmidaRecipiente: "42.10", massaSecaRecipiente: "36.50", massaRecipiente: "16.10" },
  { numGolpes: "28", massaUmidaRecipiente: "44.80", massaSecaRecipiente: "38.20", massaRecipiente: "15.70" },
  { numGolpes: "25", massaUmidaRecipiente: "45.50", massaSecaRecipiente: "38.00", massaRecipiente: "15.00" },
  { numGolpes: "20", massaUmidaRecipiente: "48.10", massaSecaRecipiente: "40.00", massaRecipiente: "16.40" },
  { numGolpes: "16", massaUmidaRecipiente: "50.20", massaSecaRecipiente: "41.10", massaRecipiente: "15.20" },
];
const exampleLPData = {
  massaUmidaRecipienteLP: "32.80",
  massaSecaRecipienteLP: "29.50",
  massaRecipienteLP: "14.20",
};
const exampleOptionalData = {
    umidadeNatural: "25.0",
    percentualArgila: "30.0"
};


export default function LimitesConsistencia() {
  const { toast } = useToast();
  const [currentPointIndex, setCurrentPointIndex] = useState(0);

  const form = useForm<FormInputValues>({ // Continua usando FormInputValues
    resolver: zodResolver(formSchema),
    defaultValues: {
      pontosLL: [
        { id: crypto.randomUUID(), numGolpes: "", massaUmidaRecipiente: "", massaSecaRecipiente: "", massaRecipiente: "" },
        { id: crypto.randomUUID(), numGolpes: "", massaUmidaRecipiente: "", massaSecaRecipiente: "", massaRecipiente: "" }
      ],
      massaUmidaRecipienteLP: "",
      massaSecaRecipienteLP: "",
      massaRecipienteLP: "",
      umidadeNatural: "",
      percentualArgila: "",
    },
    mode: "onBlur",
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "pontosLL",
    keyName: "fieldId" // Garante que temos um ID estável para cada campo no array
  });

  const [results, setResults] = useState<Results | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

   useEffect(() => {
        if (fields.length > 0) {
            setCurrentPointIndex(prev => Math.min(prev, fields.length - 1));
        } else {
             // Se remover todos os campos, volta ao índice 0 (mas o array terá pelo menos 2)
             setCurrentPointIndex(0);
        }
   }, [fields.length]); // Observa apenas o tamanho do array


  const addPontoLL = () => {
    append({ id: crypto.randomUUID(), numGolpes: "", massaUmidaRecipiente: "", massaSecaRecipiente: "", massaRecipiente: "" });
    setCurrentPointIndex(fields.length); // Vai para o novo ponto adicionado (índice é o tamanho anterior)
  };

   const removePontoLL = () => {
     if (fields.length > 2) {
       const indexToRemove = currentPointIndex;
       remove(indexToRemove);
       // O useEffect acima cuidará do ajuste do índice se necessário
     } else {
        toast({ title: "Atenção", description: "São necessários pelo menos 2 pontos para o cálculo do LL.", variant: "default" });
    }
  };

  const goToNextPoint = () => {
      setCurrentPointIndex(prev => Math.min(prev + 1, fields.length - 1));
  }
  const goToPreviousPoint = () => {
       setCurrentPointIndex(prev => Math.max(prev - 1, 0));
  }

  const handleClear = () => {
      form.reset({
        pontosLL: [
            { id: crypto.randomUUID(), numGolpes: "", massaUmidaRecipiente: "", massaSecaRecipiente: "", massaRecipiente: "" },
            { id: crypto.randomUUID(), numGolpes: "", massaUmidaRecipiente: "", massaSecaRecipiente: "", massaRecipiente: "" }
        ],
        massaUmidaRecipienteLP: "",
        massaSecaRecipienteLP: "",
        massaRecipienteLP: "",
        umidadeNatural: "",
        percentualArgila: "",
    });
    setCurrentPointIndex(0);
    setResults(null);
    setApiError(null);
  };

  const handleFillExampleData = () => {
    // Garante que temos 5 campos antes de preencher
    const currentLength = fields.length;
    if (currentLength < 5) {
      for (let i = 0; i < 5 - currentLength; i++) {
        // Usa shouldFocus: false para não mover o foco ao adicionar
        append({ id: crypto.randomUUID(), numGolpes: "", massaUmidaRecipiente: "", massaSecaRecipiente: "", massaRecipiente: "" }, { shouldFocus: false });
      }
    } else if (currentLength > 5) {
       // Remove excesso se houver mais de 5
       for (let i = currentLength - 1; i >= 5; i--) {
           remove(i);
       }
    }

     // Use setTimeout para garantir que os campos extras foram adicionados/removidos antes do reset
     setTimeout(() => {
        form.reset({
            pontosLL: exampleLLData.map(p => ({ ...p, id: crypto.randomUUID() })), // Gera novos IDs
            massaUmidaRecipienteLP: exampleLPData.massaUmidaRecipienteLP,
            massaSecaRecipienteLP: exampleLPData.massaSecaRecipienteLP,
            massaRecipienteLP: exampleLPData.massaRecipienteLP,
            umidadeNatural: exampleOptionalData.umidadeNatural,
            percentualArgila: exampleOptionalData.percentualArgila,
        });
        setCurrentPointIndex(0); // Volta para o primeiro ponto
        setResults(null); // Limpa resultados anteriores
        setApiError(null);
        toast({ title: "Dados de Exemplo Carregados", description: "O formulário foi preenchido com os dados de teste." });
     }, 0); // Timeout 0 para executar após a renderização atual
  };

  // onSubmit agora recebe FormInputValues, mas faz a conversão ANTES de enviar
  const onSubmit = async (data: FormInputValues) => {
    setIsCalculating(true);
    setApiError(null);
    setResults(null);

    // Converte os dados para o formato numérico esperado pela API
    let apiInput: ApiInputData;
    try {
        apiInput = {
            pontos_ll: data.pontosLL.map(p => ({
                num_golpes: parseInt(p.numGolpes, 10), // Converte para int
                massa_umida_recipiente: parseFloat(p.massaUmidaRecipiente),
                massa_seca_recipiente: parseFloat(p.massaSecaRecipiente),
                massa_recipiente: parseFloat(p.massaRecipiente),
            })),
            massa_umida_recipiente_lp: parseFloat(data.massaUmidaRecipienteLP),
            massa_seca_recipiente_lp: parseFloat(data.massaSecaRecipienteLP),
            massa_recipiente_lp: parseFloat(data.massaRecipienteLP),
            umidade_natural: (data.umidadeNatural && data.umidadeNatural !== "") ? parseFloat(data.umidadeNatural) : undefined,
            percentual_argila: (data.percentualArgila && data.percentualArgila !== "") ? parseFloat(data.percentualArgila) : undefined,
        };

        // Remove chaves undefined explicitamente
        if (apiInput.umidade_natural === undefined) delete apiInput.umidade_natural;
        if (apiInput.percentual_argila === undefined) delete apiInput.percentual_argila;

    } catch (parseError) {
        console.error("Erro ao converter dados do formulário:", parseError);
        setApiError("Erro interno ao processar os dados do formulário. Verifique se os números são válidos.");
        toast({ title: "Erro de Formulário", description: "Verifique se todos os campos numéricos contêm valores válidos.", variant: "destructive" });
        setIsCalculating(false);
        return;
    }


    try {
      // console.log("Enviando para API:", JSON.stringify(apiInput, null, 2));
      const response = await axios.post<LimitesConsistenciaOutput>(`${API_URL}/calcular/limites-consistencia`, apiInput);
      // console.log("Resposta da API:", response.data);

      if (response.data.erro) {
        setApiError(response.data.erro);
        toast({ title: "Erro no Cálculo (API)", description: response.data.erro, variant: "destructive" });
      } else {
        setResults(response.data);
        toast({ title: "Sucesso", description: "Cálculo dos limites de consistência realizado." });
      }
    } catch (err) { // ... (tratamento de erro API mantido) ...
       console.error("Erro ao chamar a API:", err);
      let errorMessage = "Erro de comunicação com o servidor.";
       if (axios.isAxiosError(err) && err.response?.data?.detail) {
        if (Array.isArray(err.response.data.detail)) {
          // Extrai mensagens de erro de validação do FastAPI
          errorMessage = err.response.data.detail.map((d: any) => `Campo '${d.loc.slice(1).join('.') || 'Geral'}': ${d.msg}`).join("; ");
        } else if (typeof err.response.data.detail === 'string') {
          errorMessage = err.response.data.detail;
        }
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }
      setApiError(errorMessage);
      toast({ title: "Erro na Requisição", description: errorMessage, variant: "destructive" });
    } finally {
      setIsCalculating(false);
    }
  };

  const errors = form.formState.errors;
  const currentPointField = fields[currentPointIndex];

  // A condição isValid agora funciona corretamente com o schema Zod
  const canSubmit = !isCalculating && form.formState.isValid && !apiError;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
         <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center shadow-lg"> <Droplets className="w-6 h-6 text-white" /> </div>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Limites de Consistência</h1>
          <p className="text-muted-foreground">Determinação de LL, LP, IP, IC, Atividade e classificações</p>
        </div>
      </div>


      <div className="grid lg:grid-cols-2 gap-6">
        {/* --- Formulário com react-hook-form --- */}
        <Card className="glass">
           <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardHeader> <CardTitle className="flex items-center gap-2"> <CalcIcon className="w-5 h-5" /> Dados dos Ensaios </CardTitle> </CardHeader>
            <CardContent className="space-y-6">
              <TooltipProvider>
                {/* --- Limite de Liquidez (LL) - Stepper --- */}
                <div className="space-y-3 p-4 rounded-lg bg-accent/5 border border-accent/20">
                    <div className="flex items-center justify-between mb-2">
                        {/* Título e Navegação */}
                         <h3 className="font-semibold text-sm text-foreground flex items-center gap-2">
                            <Droplets className="w-4 h-4 text-indigo-500" />
                            Limite de Liquidez (LL) - Ponto {currentPointIndex + 1} / {fields.length}
                        </h3>
                        <div className="flex items-center gap-1">
                            {/* Botões usam type="button" */}
                            <Button type="button" onClick={goToPreviousPoint} size="icon" variant="outline" className="h-7 w-7" disabled={currentPointIndex === 0}> <ChevronLeft className="w-4 h-4" /> </Button>
                            <Button type="button" onClick={goToNextPoint} size="icon" variant="outline" className="h-7 w-7" disabled={currentPointIndex === fields.length - 1}> <ChevronRight className="w-4 h-4" /> </Button>
                            <Button type="button" onClick={addPontoLL} size="icon" variant="outline" className="h-7 w-7 ml-2"> <Plus className="w-4 h-4" /> </Button>
                            <Button type="button" onClick={removePontoLL} size="icon" variant="destructive" className="h-7 w-7" disabled={fields.length <= 2}> <Trash2 className="w-4 h-4" /> </Button>
                        </div>
                    </div>

                    {/* Inputs do Ponto LL Atual com Controller e Validação */}
                    {currentPointField && (
                        <div key={currentPointField.id} className="p-3 rounded-lg bg-background/30 border border-border/50 space-y-3">
                        <div className="grid grid-cols-2 gap-4">
                            {/* Coluna 1 */}
                            <div className="space-y-3">
                                <div className="space-y-1">
                                    <Label htmlFor={`pontosLL.${currentPointIndex}.numGolpes`} className={cn("flex items-center gap-1.5 text-xs", errors.pontosLL?.[currentPointIndex]?.numGolpes && "text-destructive")}> Nº Golpes <Tooltip><TooltipTrigger><Info className="w-3 h-3 text-muted-foreground" /></TooltipTrigger><TooltipContent>{tooltips.numGolpes}</TooltipContent></Tooltip> </Label>
                                    <Controller name={`pontosLL.${currentPointIndex}.numGolpes`} control={form.control} render={({ field }) => ( <Input id={`pontosLL.${currentPointIndex}.numGolpes`} type="number" placeholder="Ex: 25" {...field} className={cn("bg-background/50", errors.pontosLL?.[currentPointIndex]?.numGolpes && "border-destructive")}/> )} />
                                    {errors.pontosLL?.[currentPointIndex]?.numGolpes && <p className="text-xs text-destructive mt-1">{errors.pontosLL[currentPointIndex]?.numGolpes?.message}</p>}
                                </div>
                                <div className="space-y-1">
                                     <Label htmlFor={`pontosLL.${currentPointIndex}.massaUmidaRecipiente`} className={cn("flex items-center gap-1.5 text-xs", errors.pontosLL?.[currentPointIndex]?.massaUmidaRecipiente && "text-destructive")}> M. Úmida + Recip. (g) <Tooltip><TooltipTrigger><Info className="w-3 h-3 text-muted-foreground" /></TooltipTrigger><TooltipContent>{tooltips.massaUmidaRecipienteLL}</TooltipContent></Tooltip> </Label>
                                    <Controller name={`pontosLL.${currentPointIndex}.massaUmidaRecipiente`} control={form.control} render={({ field }) => ( <Input id={`pontosLL.${currentPointIndex}.massaUmidaRecipiente`} type="number" step="0.01" placeholder="Ex: 45.50" {...field} className={cn("bg-background/50", errors.pontosLL?.[currentPointIndex]?.massaUmidaRecipiente && "border-destructive")}/> )} />
                                    {errors.pontosLL?.[currentPointIndex]?.massaUmidaRecipiente && <p className="text-xs text-destructive mt-1">{errors.pontosLL[currentPointIndex]?.massaUmidaRecipiente?.message}</p>}
                                </div>
                            </div>
                            {/* Coluna 2 */}
                             <div className="space-y-3">
                                <div className="space-y-1">
                                    <Label htmlFor={`pontosLL.${currentPointIndex}.massaSecaRecipiente`} className={cn("flex items-center gap-1.5 text-xs", errors.pontosLL?.[currentPointIndex]?.massaSecaRecipiente && "text-destructive")}> M. Seca + Recip. (g) <Tooltip><TooltipTrigger><Info className="w-3 h-3 text-muted-foreground" /></TooltipTrigger><TooltipContent>{tooltips.massaSecaRecipienteLL}</TooltipContent></Tooltip> </Label>
                                    <Controller name={`pontosLL.${currentPointIndex}.massaSecaRecipiente`} control={form.control} render={({ field }) => ( <Input id={`pontosLL.${currentPointIndex}.massaSecaRecipiente`} type="number" step="0.01" placeholder="Ex: 38.00" {...field} className={cn("bg-background/50", errors.pontosLL?.[currentPointIndex]?.massaSecaRecipiente && "border-destructive")}/> )} />
                                    {errors.pontosLL?.[currentPointIndex]?.massaSecaRecipiente && <p className="text-xs text-destructive mt-1">{errors.pontosLL[currentPointIndex]?.massaSecaRecipiente?.message}</p>}
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor={`pontosLL.${currentPointIndex}.massaRecipiente`} className={cn("flex items-center gap-1.5 text-xs", errors.pontosLL?.[currentPointIndex]?.massaRecipiente && "text-destructive")}> M. Recipiente (g) <Tooltip><TooltipTrigger><Info className="w-3 h-3 text-muted-foreground" /></TooltipTrigger><TooltipContent>{tooltips.massaRecipienteLL}</TooltipContent></Tooltip> </Label>
                                    <Controller name={`pontosLL.${currentPointIndex}.massaRecipiente`} control={form.control} render={({ field }) => ( <Input id={`pontosLL.${currentPointIndex}.massaRecipiente`} type="number" step="0.01" placeholder="Ex: 15.00" {...field} className={cn("bg-background/50", errors.pontosLL?.[currentPointIndex]?.massaRecipiente && "border-destructive")}/> )} />
                                    {errors.pontosLL?.[currentPointIndex]?.massaRecipiente && <p className="text-xs text-destructive mt-1">{errors.pontosLL[currentPointIndex]?.massaRecipiente?.message}</p>}
                                </div>
                             </div>
                        </div>
                        {/* Erro refine do ponto */}
                         {errors.pontosLL?.[currentPointIndex]?.root && ( <p className="text-xs text-destructive mt-1">{errors.pontosLL[currentPointIndex]?.root?.message}</p> )}
                        </div>
                    )}
                     {/* Erro global do array pontosLL */}
                     {errors.pontosLL && typeof errors.pontosLL === 'object' && 'message' in errors.pontosLL && typeof errors.pontosLL.message === 'string' && ( <p className="text-xs text-destructive mt-1">{errors.pontosLL.message}</p> )}
                </div>

                {/* --- Limite de Plasticidade (LP) com Controller --- */}
                <div className="space-y-4 p-4 rounded-lg bg-accent/5 border border-accent/20">
                     <h3 className="font-semibold text-sm text-foreground flex items-center gap-2"> <Droplets className="w-4 h-4 text-blue-500" /> Limite de Plasticidade (LP) </h3>
                    <div className="grid grid-cols-3 gap-3">
                        <div className="space-y-1">
                            <Label htmlFor="massaUmidaRecipienteLP" className={cn("flex items-center gap-1.5 text-xs", errors.massaUmidaRecipienteLP && "text-destructive")}> M. Úmida + Recip. (g) <Tooltip><TooltipTrigger><Info className="w-3 h-3 text-muted-foreground" /></TooltipTrigger><TooltipContent>{tooltips.massaUmidaRecipienteLP}</TooltipContent></Tooltip> </Label>
                            <Controller name="massaUmidaRecipienteLP" control={form.control} render={({ field }) => <Input id="massaUmidaRecipienteLP" type="number" step="0.01" placeholder="Ex: 32.80" {...field} className={cn("bg-background/50", errors.massaUmidaRecipienteLP && "border-destructive")} />} />
                            {errors.massaUmidaRecipienteLP && <p className="text-xs text-destructive mt-1">{errors.massaUmidaRecipienteLP.message}</p>}
                        </div>
                         <div className="space-y-1">
                            <Label htmlFor="massaSecaRecipienteLP" className={cn("flex items-center gap-1.5 text-xs", errors.massaSecaRecipienteLP && "text-destructive")}> M. Seca + Recip. (g) <Tooltip><TooltipTrigger><Info className="w-3 h-3 text-muted-foreground" /></TooltipTrigger><TooltipContent>{tooltips.massaSecaRecipienteLP}</TooltipContent></Tooltip> </Label>
                            <Controller name="massaSecaRecipienteLP" control={form.control} render={({ field }) => <Input id="massaSecaRecipienteLP" type="number" step="0.01" placeholder="Ex: 29.50" {...field} className={cn("bg-background/50", errors.massaSecaRecipienteLP && "border-destructive")} />} />
                            {errors.massaSecaRecipienteLP && <p className="text-xs text-destructive mt-1">{errors.massaSecaRecipienteLP.message}</p>}
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor="massaRecipienteLP" className={cn("flex items-center gap-1.5 text-xs", errors.massaRecipienteLP && "text-destructive")}> M. Recipiente (g) <Tooltip><TooltipTrigger><Info className="w-3 h-3 text-muted-foreground" /></TooltipTrigger><TooltipContent>{tooltips.massaRecipienteLP}</TooltipContent></Tooltip> </Label>
                            <Controller name="massaRecipienteLP" control={form.control} render={({ field }) => <Input id="massaRecipienteLP" type="number" step="0.01" placeholder="Ex: 14.20" {...field} className={cn("bg-background/50", errors.massaRecipienteLP && "border-destructive")} />} />
                            {errors.massaRecipienteLP && <p className="text-xs text-destructive mt-1">{errors.massaRecipienteLP.message}</p>}
                        </div>
                    </div>
                     {/* Erros refine do LP */}
                     {errors.root?.message?.startsWith("LP:") && <p className="text-xs text-destructive mt-1">{errors.root.message}</p>}
                </div>

                {/* --- Campos Opcionais (Accordion com Controller) --- */}
                <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="item-1" className="border-b-0">
                    <AccordionTrigger className="text-sm font-semibold text-foreground bg-accent/5 hover:bg-accent/10 px-4 py-2 rounded-lg border border-accent/20 [&[data-state=open]]:rounded-b-none">
                        <div className="flex items-center gap-2"> <Info className="w-4 h-4 text-cyan-500" /> Dados Adicionais (Opcional) </div>
                    </AccordionTrigger>
                    <AccordionContent className="p-4 pt-3 bg-accent/5 rounded-b-lg border border-t-0 border-accent/20">
                        <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <Label htmlFor="umidadeNatural" className={cn("flex items-center gap-1.5 text-xs", errors.umidadeNatural && "text-destructive")}> Umidade Natural (%) <Tooltip><TooltipTrigger><Info className="w-3 h-3 text-muted-foreground" /></TooltipTrigger><TooltipContent>{tooltips.umidadeNatural}</TooltipContent></Tooltip> </Label>
                             <Controller name="umidadeNatural" control={form.control} render={({ field }) => <Input id="umidadeNatural" type="number" step="0.1" placeholder="Ex: 28.5" {...field} value={field.value ?? ""} className={cn("bg-background/50", errors.umidadeNatural && "border-destructive")} />} />
                            {errors.umidadeNatural && <p className="text-xs text-destructive mt-1">{errors.umidadeNatural.message}</p>}
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor="percentualArgila" className={cn("flex items-center gap-1.5 text-xs", errors.percentualArgila && "text-destructive")}> % Argila (&lt;0.002mm) <Tooltip><TooltipTrigger><Info className="w-3 h-3 text-muted-foreground" /></TooltipTrigger><TooltipContent>{tooltips.percentualArgila}</TooltipContent></Tooltip> </Label>
                            <Controller name="percentualArgila" control={form.control} render={({ field }) => <Input id="percentualArgila" type="number" step="0.1" placeholder="Ex: 35.0" {...field} value={field.value ?? ""} className={cn("bg-background/50", errors.percentualArgila && "border-destructive")} />} />
                            {errors.percentualArgila && <p className="text-xs text-destructive mt-1">{errors.percentualArgila.message}</p>}
                        </div>
                        </div>
                    </AccordionContent>
                    </AccordionItem>
                </Accordion>
              </TooltipProvider>
            </CardContent>
            {/* --- CardFooter com Botão Exemplo --- */}
            <CardFooter className="flex gap-3 pt-4 border-t border-border/50">
              <Button type="submit" disabled={isCalculating || !form.formState.isValid} className="flex-1">
                <CalcIcon className="w-4 h-4 mr-2" />
                {isCalculating ? "Calculando..." : "Calcular"}
              </Button>
              {/* --- Botão Exemplo Adicionado --- */}
              <Button type="button" onClick={handleFillExampleData} variant="secondary" disabled={isCalculating}>
                Exemplo
              </Button>
              <Button type="button" onClick={handleClear} variant="outline" disabled={isCalculating}>
                Limpar
              </Button>
            </CardFooter>
             {/* Exibe erro geral da API */}
             {apiError && !isCalculating && ( <div className="px-6 pb-4"> <Alert variant="destructive"> <AlertCircle className="h-4 w-4" /> <AlertTitle>Erro no Cálculo</AlertTitle> <AlertDescription>{apiError}</AlertDescription> </Alert> </div> )}
           </form>
        </Card>

        {/* --- Resultados (Com Badges e Feedback Opcional) --- */}
        <Card className="glass">
           <CardHeader> <CardTitle>Resultados</CardTitle> </CardHeader>
           <CardContent>
            {isCalculating ? ( /* ... Skeletons ... */
               <div className="space-y-4"> <Skeleton className="h-14 w-full" /> <Skeleton className="h-14 w-full" /> <Skeleton className="h-14 w-full" /> <Skeleton className="h-14 w-full" /> <Skeleton className="h-14 w-full" /> <Skeleton className="h-[350px] w-full mt-4" /> </div>
            ) : results && !results.erro ? (
              <div className="space-y-4">
                {/* Agrupamento 1: Limites */}
                <ResultItemGroup title="Limites de Atterberg">
                  <ResultItem label="Limite de Liquidez (LL)" value={results.ll} unit="%" tooltip={tooltips.LL} precision={2}/>
                  <ResultItem label="Limite de Plasticidade (LP)" value={results.lp} unit="%" tooltip={tooltips.LP} precision={2}/>
                  <ResultItem label="Índice de Plasticidade (IP)" value={results.ip} unit="%" tooltip={tooltips.IP} highlight precision={2}/>
                </ResultItemGroup>

                {/* Agrupamento 2: Consistência */}
                {(results.ic !== null || form.getValues("umidadeNatural")) && (
                    <ResultItemGroup title="Consistência">
                         {/* Usa form.getValues para mostrar o input, mesmo se o resultado for null */}
                         <ResultItem label="Umidade Natural (w)" value={form.getValues("umidadeNatural") || null} unit="%" precision={2}/>
                        {results.ic !== null ? (
                            <ResultItem label="Índice de Consistência (IC)" value={results.ic} unit="" tooltip={tooltips.IC} precision={3}/>
                         ) : (
                            <MissingInfoItem label="Índice de Consistência (IC)" reason={!form.getValues("umidadeNatural") ? "Umidade Natural não fornecida" : (results.ip !== null && results.ip < 1e-9 ? "IP ≈ 0" : "Dado ausente")} />
                         )}
                    </ResultItemGroup>
                )}

                 {/* Agrupamento 3: Atividade */}
                {(results.atividade_argila !== null || form.getValues("percentualArgila")) && (
                    <ResultItemGroup title="Atividade">
                        <ResultItem label="% Argila" value={form.getValues("percentualArgila") || null} unit="%" precision={1}/>
                        {results.atividade_argila !== null ? (
                            <ResultItem label="Atividade da Argila (Ia)" value={results.atividade_argila} unit="" tooltip={tooltips.Atividade} precision={3}/>
                        ) : (
                             <MissingInfoItem label="Atividade da Argila (Ia)" reason={!form.getValues("percentualArgila") ? "% Argila não fornecida" : (results.ip !== null && results.ip < 1e-9 ? "IP ≈ 0" : "% Argila ≈ 0 ou dado ausente")} />
                        )}
                    </ResultItemGroup>
                )}

                {/* Classificações com Badges */}
                <div className="pt-4 border-t border-border/50 space-y-3">
                  <h3 className="text-sm font-medium text-muted-foreground">Classificações</h3>
                  <div className="flex flex-wrap gap-2">
                     {results.classificacao_plasticidade && <ClassificationBadge label="Plasticidade" value={results.classificacao_plasticidade} />}
                     {results.classificacao_consistencia && <ClassificationBadge label="Consistência" value={results.classificacao_consistencia} />}
                     {results.classificacao_atividade && <ClassificationBadge label="Atividade" value={results.classificacao_atividade} />}
                  </div>
                </div>

                 {/* Carta de Plasticidade */}
                 {(results.ll !== null && results.ip !== null) && (
                    <div className="pt-4 border-t border-border/50">
                       <h3 className="font-semibold text-sm text-foreground mb-3 flex items-center gap-2">
                         <LineChart className="w-4 h-4 text-primary" /> Carta de Plasticidade
                         <TooltipProvider>
                            <Tooltip>
                               {/* CORRIGIDO: Removido asChild */}
                               <TooltipTrigger>
                                  <Button variant="ghost" size="icon" className="h-5 w-5 text-muted-foreground hover:text-primary rounded-full p-0">
                                     <Info className="w-3.5 h-3.5" />
                                  </Button>
                               </TooltipTrigger>
                               <TooltipContent>{tooltips.CartaPlasticidade}</TooltipContent>
                            </Tooltip>
                         </TooltipProvider>
                       </h3>
                       <PlasticityChart ll={results.ll} ip={results.ip} />
                    </div>
                 )}

              </div>
            ) : ( /* ... Placeholder ou Erro ... */
               <div className="flex flex-col items-center justify-center h-64 text-center">
                <Droplets className="w-16 h-16 text-indigo-500/30 mb-4" />
                <p className="text-muted-foreground"> {apiError ? "Corrija os erros para calcular" : "Preencha os dados dos ensaios para calcular"} </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// --- Componentes Auxiliares (ResultItemGroup, MissingInfoItem, ClassificationBadge, ResultItem) ---
const ResultItemGroup: React.FC<{ title?: string, children: React.ReactNode }> = ({ title, children }) => ( <div className="space-y-1"> {title && <h4 className="text-xs font-medium text-muted-foreground mb-2 pt-2 border-t border-border/30">{title}</h4>} <div className="space-y-2">{children}</div> </div> );

function ResultItem({ label, value, unit, tooltip, highlight = false, precision = 2 }: ResultItemProps) {
  const displayValue = typeof value === 'number' && !isNaN(value) ? value.toFixed(precision) : (value || "-");
  return (
    <div className={cn( "flex justify-between items-center p-3 rounded-lg min-h-[56px]", highlight ? "bg-primary/10 border border-primary/20" : "bg-background/50 border border-border/50" )}>
      <TooltipProvider>
        <span className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
          {label}
          {tooltip && (
            <Tooltip>
               {/* CORRIGIDO: Removido asChild */}
               <TooltipTrigger>
                 <Button variant="ghost" size="icon" className="h-5 w-5 text-muted-foreground hover:text-primary rounded-full p-0">
                   <Info className="w-3.5 h-3.5" />
                 </Button>
               </TooltipTrigger>
              <TooltipContent>{tooltip}</TooltipContent>
            </Tooltip>
          )}
        </span>
      </TooltipProvider>
      <span className={cn("font-semibold text-right pl-2", highlight ? "text-primary text-lg" : "text-foreground text-base")}>
        {displayValue} {unit}
      </span>
    </div>
  );
}
const MissingInfoItem = ({ label, reason }: { label: string, reason: string }) => ( <div className="flex justify-between items-center p-3 rounded-lg bg-muted/30 border border-border/30 border-dashed min-h-[56px]"> <span className="text-sm font-medium text-muted-foreground">{label}</span> <span className="text-xs text-muted-foreground italic text-right pl-2">{reason}</span> </div> );
const ClassificationBadge = ({ label, value }: { label: string; value: string }) => { let badgeVariant: "default" | "secondary" | "destructive" = "default"; if (value.includes("Não") || value.includes("Inativa")) { badgeVariant = "secondary"; } return ( <div className="flex flex-col items-start gap-1"> <span className="text-xs text-muted-foreground">{label}</span> <Badge variant={badgeVariant} className="text-sm px-3 py-1">{value}</Badge> </div> ); };