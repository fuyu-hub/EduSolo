// frontend/src/pages/Compactacao.tsx
import { useState, useEffect, useRef } from "react";
import { Helmet } from 'react-helmet-async';
import { useNavigate } from "react-router-dom";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { calcularCompactacao } from "./calculos";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { RotateCcw, Database, Info, Calculator as CalcIcon, Plus, Trash2, BarChart3, Save, FolderOpen, GraduationCap, LayoutGrid, RefreshCw } from "lucide-react";
import { CompactacaoIcon } from "@/componentes/icones/IconeCompactacao";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter as UIDialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

import { toast } from "sonner";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";


import CurvaCompactacao, { type CurvaCompactacaoRef } from "./componentes/CurvaCompactacao";
import TabelaResultados from "./componentes/TabelaResultados";
import DialogExemplos from "./componentes/DialogExemplos";
import { type ExemploCompactacao } from "./exemplos";
import { getDefinicao } from "@/componentes/compartilhados/definicoes";
import { LinhaResultado } from "@/componentes/compartilhados/LinhaResultado";
import { DefinicaoTooltip } from "@/components/ui/DefinicaoTooltip";
import { LayoutDividido } from "@/componentes/compartilhados/LayoutDividido";
import { BotaoLimpar } from "@/componentes/compartilhados/BotaoLimpar";
import { CabecalhoModulo } from "@/componentes/compartilhados/CabecalhoModulo";
import { AlertaErro } from "@/componentes/compartilhados/AlertaErro";

import { useCompactacaoStore } from "./store";
import { UI_STANDARDS } from "@/lib/ui-standards";
import { handleArrowNavigation } from "@/lib/navigation";
// Schema de validação
const pontoCompactacaoSchema = z.object({
  id: z.string(),
  pesoAmostaCilindro: z.string().optional().default(""),
  // Campos para medições (opcionais - dependem do modo)
  pesoBrutoUmido: z.string().optional(),
  pesoBrutoSeco: z.string().optional(),
  tara: z.string().optional(),
  // Campo para umidade direta
  umidadeDireta: z.string().optional(),
});

const formSchema = z.object({
  volumeCilindro: z.string().min(1, { message: "Campo obrigatório" }).refine(val => !isNaN(parseFloat(val.replace(',', '.'))) && parseFloat(val.replace(',', '.')) > 0, { message: "Volume deve ser maior que 0" }),
  pesoCilindro: z.string().optional().default(""),
  Gs: z.string().optional().refine(val => val === undefined || val === "" || (!isNaN(parseFloat(val.replace(',', '.'))) && parseFloat(val.replace(',', '.')) > 0), {
    message: "Gs deve ser maior que 0 (ou deixe vazio)",
  }),
  pesoEspecificoAgua: z.string().refine(val => !isNaN(parseFloat(val.replace(',', '.'))) && parseFloat(val.replace(',', '.')) > 0, { message: "Peso específico da água deve ser maior que 0" }),
  modoEntradaUmidade: z.enum(["medicoes", "direta"]).default("direta"),
  pontos: z.array(pontoCompactacaoSchema).min(3, { message: "São necessários no mínimo 3 pontos de ensaio" }),
});

type FormInputValues = z.infer<typeof formSchema>;


import type { CompactacaoOutput, PontoCurvaCompactacao } from './types';
import PrintHeader from "@/componentes/base/CabecalhoImpressao";

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


// Cálculos agora são feitos localmente no frontend

// Função para gerar IDs únicos (alternativa ao crypto.randomUUID para compatibilidade)
const generateId = () => `${Date.now()}-${Math.floor(Math.random() * 1000000)}`;

function CompactacaoDesktop() {
  const { toast: toastFn } = { toast };
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

  // Cálculo Automático de Umidade (Interativo)
  const pesoBrutoUmido = watch(`pontos.${currentPointIndex}.pesoBrutoUmido`);
  const pesoBrutoSeco = watch(`pontos.${currentPointIndex}.pesoBrutoSeco`);
  const tara = watch(`pontos.${currentPointIndex}.tara`);
  const modoEntrada = watch("modoEntradaUmidade");

  // Estado local para exibir a umidade calculada em tempo real (apenas feedback visual)
  const [umidadeCalculadaPreview, setUmidadeCalculadaPreview] = useState<number | null>(null);
  // Controla qual campo w% está focado (para formatação condicional)
  const [focusedUmidadeIndex, setFocusedUmidadeIndex] = useState<number | null>(null);

  // Cálculo: Pesos -> Umidade (Modo 'medicoes')
  useEffect(() => {
    if (modoEntrada === "medicoes") {
      const pbu = parseFloat((pesoBrutoUmido || "0").replace(',', '.'));
      const pbs = parseFloat((pesoBrutoSeco || "0").replace(',', '.'));
      const t = parseFloat((tara || "0").replace(',', '.'));

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

  // Cálculo Inverso: Umidade -> MBS (para qualquer ponto)
  // Quando o usuário altera a umidade diretamente em qualquer linha,
  // ajustamos o MBS mantendo MBU e Tara fixos
  const calcularMBSInverso = (pontoIndex: number, umidadeStr: string) => {
    const w = parseFloat((umidadeStr || "0").replace(',', '.'));
    const pbuStr = form.getValues(`pontos.${pontoIndex}.pesoBrutoUmido`);
    const taraStr = form.getValues(`pontos.${pontoIndex}.tara`);
    const pbu = parseFloat((pbuStr || "0").replace(',', '.'));
    const t = parseFloat((taraStr || "0").replace(',', '.'));

    if (w >= 0 && pbu > 0 && t >= 0 && pbu > t) {
      const W = w / 100;
      const novoMBS = (pbu + (W * t)) / (1 + W);
      setValue(`pontos.${pontoIndex}.pesoBrutoSeco`, novoMBS.toFixed(2), { shouldValidate: false, shouldDirty: true });
    }
  };

  // Cálculo direto: MBU/MBS/Tara -> Umidade (para qualquer ponto)
  // Chamado no onBlur dos campos MBU, MBS e Tara
  const recalcularUmidadePonto = (pontoIndex: number) => {
    const pbuStr = form.getValues(`pontos.${pontoIndex}.pesoBrutoUmido`);
    const pbsStr = form.getValues(`pontos.${pontoIndex}.pesoBrutoSeco`);
    const taraStr = form.getValues(`pontos.${pontoIndex}.tara`);
    const pbu = parseFloat((pbuStr || "0").replace(',', '.'));
    const pbs = parseFloat((pbsStr || "0").replace(',', '.'));
    const t = parseFloat((taraStr || "0").replace(',', '.'));

    if (pbu > 0 && pbs > 0 && t >= 0 && pbs > t && pbu >= pbs) {
      const w = ((pbu - pbs) / (pbs - t)) * 100;
      setValue(`pontos.${pontoIndex}.umidadeDireta`, w.toFixed(2), { shouldValidate: false, shouldDirty: true });
    }
  };

  const [results, setResults] = useState<CompactacaoOutput | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);



  const [resultTab, setResultTab] = useState("resultados");

  // Ref para o gráfico de compactação
  const curvaCompactacaoRef = useRef<CurvaCompactacaoRef>(null);

  // Definição dos steps do tour


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
      const pbu = parseFloat((p.pesoBrutoUmido || "0").replace(',', '.'));
      const pbs = parseFloat((p.pesoBrutoSeco || "0").replace(',', '.'));
      const t = parseFloat((p.tara || "0").replace(',', '.'));

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



  const handleCalculate = async (data: FormInputValues, isAuto: boolean = false) => {
    if (!isAuto) setIsCalculating(true);
    setApiError(null);

    let apiInput: CompactacaoInputAPI;
    try {
      const volumeCil = parseFloat(data.volumeCilindro.replace(',', '.'));
      // Tratar pesoCilindro vazio como 0 (significa que pesoAmostaCilindro já é massa da amostra)
      const pesoCilRaw = data.pesoCilindro?.trim();
      const pesoCil = pesoCilRaw === '' || pesoCilRaw === undefined ? 0 : parseFloat(pesoCilRaw.replace(',', '.'));
      const pesoEspAgua = parseFloat(data.pesoEspecificoAgua.replace(',', '.'));

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
      const semCilindro = pesoCil === 0;
      const pontosValidos = data.pontos.length >= 3 && data.pontos.every(p => {
        const temPesoAmostra = p.pesoAmostaCilindro && !isNaN(parseFloat(p.pesoAmostaCilindro.replace(',', '.'))) && parseFloat(p.pesoAmostaCilindro.replace(',', '.')) > 0;
        const temMBS = p.pesoBrutoSeco && !isNaN(parseFloat(p.pesoBrutoSeco.replace(',', '.'))) && parseFloat(p.pesoBrutoSeco.replace(',', '.')) > 0;
        const temTara = p.tara !== undefined && p.tara !== '' && !isNaN(parseFloat(p.tara.replace(',', '.')));
        const temMBU = p.pesoBrutoUmido && !isNaN(parseFloat(p.pesoBrutoUmido.replace(',', '.'))) && parseFloat(p.pesoBrutoUmido.replace(',', '.')) > 0;

        // Precisa de massa para calcular γd: pesoAmostaCilindro OU (MBS + Tara quando sem cilindro)
        const temMassa = temPesoAmostra || (semCilindro && temMBS && temTara);

        if (modo === "direta") {
          // Modo direta: precisa de umidadeDireta + massa
          return temMassa && p.umidadeDireta && !isNaN(parseFloat(p.umidadeDireta.replace(',', '.')));
        } else {
          // Modo medições: precisa de MBU + MBS + Tara + massa
          return temMassa && temMBU && temMBS && temTara;
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
          const pesoAmostraVal = p.pesoAmostaCilindro && p.pesoAmostaCilindro.trim() !== ''
            ? parseFloat(p.pesoAmostaCilindro.replace(',', '.'))
            : 0;

          const base: PontoEnsaioAPI = {
            massa_umida_total: pesoAmostraVal,
            massa_molde: pesoCil,
            volume_molde: volumeCil,
          };

          // Sempre incluir MBS/Tara quando disponíveis (necessário para cálculo alternativo)
          if (p.pesoBrutoSeco && p.pesoBrutoSeco.trim() !== '') {
            base.massa_seca_recipiente_w = parseFloat(p.pesoBrutoSeco.replace(',', '.'));
          }
          if (p.tara !== undefined && p.tara.trim() !== '') {
            base.massa_recipiente_w = parseFloat(p.tara.replace(',', '.'));
          }
          if (p.pesoBrutoUmido && p.pesoBrutoUmido.trim() !== '') {
            base.massa_umida_recipiente_w = parseFloat(p.pesoBrutoUmido.replace(',', '.'));
          }

          if (modo === "direta") {
            return {
              ...base,
              umidade_direta: parseFloat(p.umidadeDireta!.replace(',', '.')),
            };
          } else {
            return base;
          }
        }),
        Gs: (data.Gs && data.Gs !== "") ? parseFloat(data.Gs.replace(',', '.')) : undefined,
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
    <div className={UI_STANDARDS.pageContainer} onKeyDown={handleArrowNavigation}>
      <Helmet>
        <title>Ensaio de Compactação (Proctor) | EduSolos</title>
        <meta name="description" content="Determine a curva de compactação, umidade ótima e peso específico seco máximo conforme a norma Proctor. Ferramenta interativa de geotecnia." />
      </Helmet>
      <PrintHeader moduleTitle="Ensaio de Compactação" moduleName="compactacao" />

      {/* Top Header Section */}
      <CabecalhoModulo
        icone={<CompactacaoIcon className={UI_STANDARDS.header.icon} />}
        titulo="Ensaio de Compactação"
        subtitulo="Determinação da curva de compactação (Proctor)"
        dataTour="module-header"
        acoes={[
          <DialogExemplos key="exemplos" onSelectExample={handleSelectExample} disabled={isCalculating} currentFormData={form.getValues()} />,
          <BotaoLimpar key="limpar" onLimpar={handleClear} />,
        ]}
      />

      <LayoutDividido
        classNameEsquerdo="space-y-4"
        classNameDireito="space-y-4 h-full flex flex-col"
        painelEsquerdo={
          <>
            {/* Formulário - Input */}
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
                        <DefinicaoTooltip id="volumeCilindro" side="right" iconClassName="w-3 h-3" />
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
                        <DefinicaoTooltip id="pesoCilindro" side="right" iconClassName="w-3 h-3" />
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
                        <DefinicaoTooltip id="Gs" side="right" iconClassName="w-3 h-3" />
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
                {fields.map((fieldItem, i) => (
                  <div key={fieldItem.fieldId} className="relative">
                    <div className="grid grid-cols-[1fr,1fr,1fr,1fr,70px,auto] gap-1.5 items-center p-1.5 rounded-md border bg-muted/5 transition-colors hover:bg-muted/10">
                      <Controller name={`pontos.${i}.pesoAmostaCilindro`} control={form.control} render={({ field }) => (
                        <Input className="h-8 text-xs px-2 text-center" placeholder="g" {...field} />
                      )} />
                      <Controller name={`pontos.${i}.pesoBrutoUmido`} control={form.control} render={({ field }) => (
                        <Input className="h-8 text-xs px-2 text-center" placeholder="g" {...field} value={field.value ?? ""}
                          onBlur={(e) => { field.onBlur(); recalcularUmidadePonto(i); }}
                        />
                      )} />
                      <Controller name={`pontos.${i}.pesoBrutoSeco`} control={form.control} render={({ field }) => (
                        <Input className="h-8 text-xs px-2 text-center" placeholder="g" {...field} value={field.value ?? ""}
                          onBlur={(e) => { field.onBlur(); recalcularUmidadePonto(i); }}
                        />
                      )} />
                      <Controller name={`pontos.${i}.tara`} control={form.control} render={({ field }) => (
                        <Input className="h-8 text-xs px-2 text-center" placeholder="g" {...field} value={field.value ?? ""}
                          onBlur={(e) => { field.onBlur(); recalcularUmidadePonto(i); }}
                        />
                      )} />
                      <Controller name={`pontos.${i}.umidadeDireta`} control={form.control} render={({ field }) => {
                        // Formatar: 1 casa decimal quando não focado, valor completo quando editando
                        const displayValue = (() => {
                          if (!field.value) return "";
                          if (focusedUmidadeIndex === i) return field.value; // Valor completo ao editar
                          const num = parseFloat(field.value.replace(',', '.'));
                          return isNaN(num) ? field.value : num.toFixed(1);
                        })();
                        return (
                          <Input
                            className="h-8 text-xs px-1 text-center font-mono"
                            placeholder="%"
                            {...field}
                            value={displayValue}
                            onFocus={() => setFocusedUmidadeIndex(i)}
                            onBlur={(e) => {
                              setFocusedUmidadeIndex(null);
                              field.onBlur();
                              if (e.target.value) { calcularMBSInverso(i, e.target.value); }
                            }}
                          />
                        );
                      }} />
                      <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-destructive/70 hover:text-destructive shrink-0" onClick={() => { remove(i); }} disabled={fields.length <= 3}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

            {/* Error Alert */}
            {!isCalculating && <AlertaErro erro={apiError} />}
          </CardContent>
        </Card>
        </>
        }
        painelDireito={
          <>
            {/* Resultados */}
          {!results ? (
            <Card className="glass flex items-center justify-center p-12 text-center text-muted-foreground border-dashed min-h-[400px]">
              <div>
                <CalcIcon className="w-16 h-16 mx-auto mb-4 opacity-20" />
                <p className="text-lg font-medium mb-2">Nenhum resultado ainda</p>
                <p className="text-sm">Preencha os dados para calcular automaticamente.</p>
              </div>
            </Card>
          ) : results.erro ? (
            <AlertaErro erro={results.erro} className="min-h-[200px] flex items-center" />
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
                          <LinhaResultado id="volumeCilindro" value={parseFloat(form.getValues().volumeCilindro)} />
                          {form.getValues().pesoCilindro && parseFloat(form.getValues().pesoCilindro!) > 0 && (
                            <LinhaResultado id="pesoCilindro" value={parseFloat(form.getValues().pesoCilindro!)} />
                          )}
                          <LinhaResultado
                            id="Gs"
                            simbolo="Gs"
                            label="Densidade dos Grãos"
                            value={form.getValues().Gs ? parseFloat(form.getValues().Gs!) : null}
                            precision={3}
                          />
                        </div>
                      </div>

                      {/* Resultados da Compactação */}
                      <div className="p-3 space-y-2">
                        <h4 className="font-semibold text-sm flex items-center gap-2 text-blue-500">
                          <BarChart3 className="w-4 h-4" />
                          Resultados da Compactação
                        </h4>
                        <div className="space-y-[1px]">
                          <LinhaResultado
                            id="umidade_otima"
                            simbolo={<span>w<sub className="text-[10px] not-italic">ót</sub></span>}
                            label="Umidade Ótima"
                            value={results.umidade_otima}
                            precision={1}
                          />
                          <LinhaResultado
                            simbolo={<span>ρ<sub className="text-xs">d</sub></span>}
                            label="Massa Esp. Seca Máx"
                            value={results.peso_especifico_seco_max !== null ? results.peso_especifico_seco_max / 10 : null}
                            unit="g/cm³"
                            precision={3}
                          />
                          <LinhaResultado
                            id="gamma_d"
                            simbolo={<span>γ<sub className="text-xs">d</sub></span>}
                            label="Peso Esp. Seco Máx"
                            value={results.peso_especifico_seco_max}
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
                        Gs={form.getValues().Gs ? parseFloat(form.getValues().Gs!) : undefined}
                        gammaW={parseFloat(form.getValues().pesoEspecificoAgua)}
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          )}
          </>
        }
      />
    </div >
  );
}

// Wrapper principal
export default function Compactacao() {
  return <CompactacaoDesktop />;
}
// Função auxiliar para linhas de resultado removida e substituída pelo componente compartilhado LinhaResultado

