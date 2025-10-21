import { useState } from "react";
import { Calculator, Info } from "lucide-react"; // Importar ícones
import axios from 'axios';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
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
import { useToast } from "@/components/ui/use-toast";
import DiagramaFases from "@/components/visualizations/DiagramaFases";
import { conteudoIndicesFisicos, ConteudoIndice } from "@/lib/geotecnia/indicesFisicosConteudo"; // Certifique-se que este ficheiro existe

// Interface local que reflete a API Output (com todos os campos novos)
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
  // Normalizados
  volume_solidos_norm: number | null;
  volume_agua_norm: number | null;
  volume_ar_norm: number | null;
  peso_solidos_norm?: number | null;
  peso_agua_norm?: number | null;
  // Compacidade
  compacidade_relativa: number | null;
  classificacao_compacidade: string | null;
  // Calculados (Reais) - ADICIONADOS
  volume_total_calc: number | null;
  volume_solidos_calc: number | null;
  volume_agua_calc: number | null;
  volume_ar_calc: number | null;
  massa_total_calc: number | null;
  massa_solidos_calc: number | null;
  massa_agua_calc: number | null;
  erro?: string | null;
}

// Interface para o estado do formulário (inalterada desde a Fase 2)
interface FormData {
  massaUmida: string;
  massaSeca: string;
  volume: string;
  massaGraos: string;
  volumeGraos: string;
  Gs?: string;
  pesoEspecificoAgua?: string;
  indice_vazios_max?: string;
  indice_vazios_min?: string;
}

type Results = IndicesFisicosOutput;

// Tooltips para entradas (inalterados)
const tooltips = {
  massaUmida: "Massa total da amostra de solo incluindo a água (g)",
  massaSeca: "Massa da amostra após secagem em estufa (g)",
  volume: "Volume total da amostra incluindo vazios (cm³)",
  Gs: "Densidade relativa dos grãos (adimensional, ex: 2.65)",
  pesoEspecificoAgua: "Peso específico da água (kN/m³, padrão 10.0)",
  indice_vazios_max: "Índice de vazios máximo do solo (emax). Necessário para calcular Dr.",
  indice_vazios_min: "Índice de vazios mínimo do solo (emin). Necessário para calcular Dr.",
};

const API_URL = "http://127.0.0.1:8000"; // URL do backend

export default function IndicesFisicos() {
  // Estados (inalterados)
  const [formData, setFormData] = useState<FormData>({
    massaUmida: "",
    massaSeca: "",
    volume: "",
    massaGraos: "",
    volumeGraos: "",
    Gs: "",
    pesoEspecificoAgua: "10.0",
    indice_vazios_max: "",
    indice_vazios_min: "",
  });
  const [results, setResults] = useState<Results | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError(null);
  };

  const handleCalculate = async () => {
    setIsCalculating(true);
    setError(null);
    setResults(null);

    const apiInput: { [key: string]: number | undefined } = {
      peso_total: formData.massaUmida ? parseFloat(formData.massaUmida) : undefined,
      peso_solido: formData.massaSeca ? parseFloat(formData.massaSeca) : undefined,
      volume_total: formData.volume ? parseFloat(formData.volume) : undefined,
      Gs: formData.Gs ? parseFloat(formData.Gs) : undefined,
      peso_especifico_agua: formData.pesoEspecificoAgua ? parseFloat(formData.pesoEspecificoAgua) : 10.0,
      indice_vazios_max: formData.indice_vazios_max ? parseFloat(formData.indice_vazios_max) : undefined,
      indice_vazios_min: formData.indice_vazios_min ? parseFloat(formData.indice_vazios_min) : undefined,
    };

    Object.keys(apiInput).forEach(key => (apiInput[key] === undefined || isNaN(apiInput[key] as number)) && delete apiInput[key]);

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
      // A chamada API agora espera o tipo IndicesFisicosOutput atualizado
      const response = await axios.post<IndicesFisicosOutput>(`${API_URL}/calcular/indices-fisicos`, apiInput);

      if (response.data.erro) {
        setError(response.data.erro);
        toast({
          title: "Erro no Cálculo",
          description: response.data.erro,
          variant: "destructive",
        });
      } else {
        setResults(response.data); // Armazena todos os dados retornados, incluindo os calculados
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
      massaGraos: "",
      volumeGraos: "",
      Gs: "",
      pesoEspecificoAgua: "10.0",
      indice_vazios_max: "",
      indice_vazios_min: "",
    });
    setResults(null);
    setError(null);
  };

  const isFormValid = (!!formData.massaUmida && !!formData.massaSeca && !!formData.volume) || !!formData.Gs;

  return (
    <TooltipProvider>
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center shadow-lg">
            <Calculator className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Índices Físicos</h1>
            <p className="text-muted-foreground">Análise das propriedades físicas do solo</p>
          </div>
        </div>

        {/* Layout Principal */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Input Panel */}
          <Card className="glass p-6 lg:col-span-1">
             <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
              <Info className="w-5 h-5 text-primary" />
              Dados de Entrada
            </h2>
             {/* ... Inputs ... */}
             <div className="space-y-6">
              <div className="space-y-3">
                 {/* Massa Úmida */}
                 <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="massaUmida">Massa Úmida (g)</Label>
                      <Tooltip>
                        <TooltipTrigger asChild><Info className="w-4 h-4 text-muted-foreground cursor-help" /></TooltipTrigger>
                        <TooltipContent className="max-w-xs"><p>{tooltips.massaUmida}</p></TooltipContent>
                      </Tooltip>
                    </div>
                    <Input id="massaUmida" type="number" step="0.01" value={formData.massaUmida} onChange={(e) => handleChange("massaUmida", e.target.value)} className="bg-background/50" placeholder="Ex: 150.5" />
                  </div>
                 {/* Massa Seca */}
                 <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="massaSeca">Massa Seca (g)</Label>
                      <Tooltip>
                        <TooltipTrigger asChild><Info className="w-4 h-4 text-muted-foreground cursor-help" /></TooltipTrigger>
                        <TooltipContent className="max-w-xs"><p>{tooltips.massaSeca}</p></TooltipContent>
                      </Tooltip>
                    </div>
                    <Input id="massaSeca" type="number" step="0.01" value={formData.massaSeca} onChange={(e) => handleChange("massaSeca", e.target.value)} className="bg-background/50" placeholder="Ex: 130.2" />
                  </div>
                 {/* Volume Total */}
                 <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="volume">Volume Total (cm³)</Label>
                        <Tooltip>
                          <TooltipTrigger asChild><Info className="w-4 h-4 text-muted-foreground cursor-help" /></TooltipTrigger>
                          <TooltipContent className="max-w-xs"><p>{tooltips.volume}</p></TooltipContent>
                        </Tooltip>
                    </div>
                    <Input id="volume" type="number" step="0.01" value={formData.volume} onChange={(e) => handleChange("volume", e.target.value)} className="bg-background/50" placeholder="Ex: 100.0" />
                  </div>
                 {/* Gs */}
                 <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="Gs">Densidade Relativa Grãos (Gs)</Label>
                        <Tooltip>
                          <TooltipTrigger asChild><Info className="w-4 h-4 text-muted-foreground cursor-help" /></TooltipTrigger>
                          <TooltipContent className="max-w-xs"><p>{tooltips.Gs} (Opcional se massas/volume fornecidos)</p></TooltipContent>
                        </Tooltip>
                    </div>
                    <Input id="Gs" type="number" step="0.01" value={formData.Gs} onChange={(e) => handleChange("Gs", e.target.value)} className="bg-background/50" placeholder="Ex: 2.65 (opcional)" />
                  </div>
                {/* emax */}
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="indice_vazios_max">Índice de Vazios Máximo (emax)</Label>
                    <Tooltip>
                      <TooltipTrigger asChild><Info className="w-4 h-4 text-muted-foreground cursor-help" /></TooltipTrigger>
                      <TooltipContent className="max-w-xs"><p>{tooltips.indice_vazios_max}</p></TooltipContent>
                    </Tooltip>
                  </div>
                  <Input id="indice_vazios_max" type="number" step="0.01" value={formData.indice_vazios_max} onChange={(e) => handleChange("indice_vazios_max", e.target.value)} className="bg-background/50" placeholder="Opcional (ex: 0.90)" />
                </div>
                {/* emin */}
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="indice_vazios_min">Índice de Vazios Mínimo (emin)</Label>
                    <Tooltip>
                      <TooltipTrigger asChild><Info className="w-4 h-4 text-muted-foreground cursor-help" /></TooltipTrigger>
                      <TooltipContent className="max-w-xs"><p>{tooltips.indice_vazios_min}</p></TooltipContent>
                    </Tooltip>
                  </div>
                  <Input id="indice_vazios_min" type="number" step="0.01" value={formData.indice_vazios_min} onChange={(e) => handleChange("indice_vazios_min", e.target.value)} className="bg-background/50" placeholder="Opcional (ex: 0.45)" />
                </div>
                {/* Peso Específico Água */}
                 <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="pesoEspecificoAgua">Peso Específico Água (kN/m³)</Label>
                        <Tooltip>
                          <TooltipTrigger asChild><Info className="w-4 h-4 text-muted-foreground cursor-help" /></TooltipTrigger>
                          <TooltipContent className="max-w-xs"><p>{tooltips.pesoEspecificoAgua}</p></TooltipContent>
                        </Tooltip>
                    </div>
                    <Input id="pesoEspecificoAgua" type="number" step="0.1" value={formData.pesoEspecificoAgua} onChange={(e) => handleChange("pesoEspecificoAgua", e.target.value)} className="bg-background/50" />
                  </div>
              </div>
              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <Button onClick={handleCalculate} disabled={!isFormValid || isCalculating} className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground">
                  <Calculator className="w-4 h-4 mr-2" />
                  {isCalculating ? "Calculando..." : "Calcular"}
                </Button>
                <Button onClick={handleClear} variant="outline" disabled={isCalculating}>
                  Limpar
                </Button>
              </div>
            </div>
          </Card>

          {/* Div para Visualização e Resultados */}
          <div className="lg:col-span-2 space-y-6">
            {/* Painel de Visualização */}
            <Card className="glass p-6">
              <h2 className="text-xl font-semibold text-foreground mb-4">Visualização (Diagrama de Fases)</h2>
              <div className="flex justify-center items-center min-h-[220px]"> {/* Altura mínima aumentada */}
                {isCalculating ? (
                  <Skeleton className="w-36 h-52 bg-muted/20" /> // Tamanho ajustado
                ) : results && results.volume_solidos_norm !== null && results.volume_agua_norm !== null && results.volume_ar_norm !== null && !results.erro ? (
                  <DiagramaFases
                    // Valores Normalizados para cálculo da altura e display principal
                    volumeSolidosNorm={results.volume_solidos_norm}
                    volumeAguaNorm={results.volume_agua_norm}
                    volumeArNorm={results.volume_ar_norm}
                    pesoSolidosNorm={results.peso_solidos_norm}
                    pesoAguaNorm={results.peso_agua_norm}
                    // Valores Calculados (Reais) para os Popovers
                    volumeSolidosCalc={results.volume_solidos_calc}
                    volumeAguaCalc={results.volume_agua_calc}
                    volumeArCalc={results.volume_ar_calc}
                    massaSolidosCalc={results.massa_solidos_calc}
                    massaAguaCalc={results.massa_agua_calc}
                    volumeTotalCalc={results.volume_total_calc}
                    massaTotalCalc={results.massa_total_calc}
                  />
                ) : !error ? (
                  <p className="text-muted-foreground text-center">
                    O diagrama de fases será exibido aqui após o cálculo.
                  </p>
                ) : null}
                {error && (
                  <div className="flex flex-col items-center justify-center h-full text-center text-destructive">
                    <Info className="w-12 h-12 mb-4" />
                    <p className="font-semibold">Erro</p>
                    <p className="text-sm max-w-xs">{error}</p>
                  </div>
                )}
              </div>
            </Card>

            {/* Painel de Resultados */}
            <Card className="glass p-6">
              <h2 className="text-xl font-semibold text-foreground mb-4">Resultados Numéricos</h2>
              {isCalculating ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[...Array(6)].map((_, i) => (<Skeleton key={`sk-col1-${i}`} className="h-[56px] w-full bg-muted/20" />))}
                    {[...Array(6)].map((_, i) => (<Skeleton key={`sk-col2-${i}`} className="h-[56px] w-full bg-muted/20" />))}
                </div>
              ) : results && !results.erro ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                  {/* Coluna 1 */}
                  <div className="space-y-2">
                    <h3 className="text-lg font-medium text-foreground mb-2 border-b border-border/50 pb-1">Pesos Específicos & Gs</h3>
                    <ResultItem label="Natural (γn)" value={results.peso_especifico_natural} unit="kN/m³" infoKey="peso_especifico_natural" precision={3}/>
                    <ResultItem label="Seco (γd)" value={results.peso_especifico_seco} unit="kN/m³" infoKey="peso_especifico_seco" precision={3}/>
                    <ResultItem label="Sólidos (γs)" value={results.peso_especifico_solidos} unit="kN/m³" infoKey="peso_especifico_solidos" precision={3}/>
                    <ResultItem label="Densidade Relativa (Gs)" value={results.Gs} unit="" infoKey="Gs" precision={3}/>
                    {results.peso_especifico_saturado !== null && <ResultItem label="Saturado (γsat)" value={results.peso_especifico_saturado} unit="kN/m³" infoKey="peso_especifico_saturado" precision={3} />}
                    {results.peso_especifico_submerso !== null && <ResultItem label="Submerso (γsub)" value={results.peso_especifico_submerso} unit="kN/m³" infoKey="peso_especifico_submerso" precision={3} />}
                  </div>
                  {/* Coluna 2 */}
                  <div className="space-y-2">
                     <h3 className="text-lg font-medium text-foreground mb-2 border-b border-border/50 pb-1">Vazios, Água & Compacidade</h3>
                     <ResultItem label="Umidade (w)" value={results.umidade} unit="%" infoKey="umidade" precision={2}/>
                     <ResultItem label="Índice de Vazios (e)" value={results.indice_vazios} unit="" infoKey="indice_vazios" precision={3}/>
                     <ResultItem label="Porosidade (n)" value={results.porosidade} unit="%" infoKey="porosidade" precision={2}/>
                     <ResultItem label="Grau de Saturação (Sr)" value={results.grau_saturacao} unit="%" infoKey="grau_saturacao" precision={2}/>
                     {results.compacidade_relativa !== null && (
                       <ResultItem label="Compacidade Relativa (Dr)" value={results.compacidade_relativa} unit="%" infoKey="compacidade_relativa" precision={2}/>
                     )}
                     {results.classificacao_compacidade && (
                       <ResultItem label="Classificação" value={results.classificacao_compacidade} unit="" infoKey="classificacao_compacidade" />
                     )}
                  </div>
                </div>
              ) : (
                 <div className="flex flex-col items-center justify-center min-h-[200px] text-center">
                  <Calculator className="w-16 h-16 text-muted-foreground/30 mb-4" />
                  <p className="text-muted-foreground">
                    {error ? "Corrija o erro para ver os resultados" : "Os resultados serão exibidos aqui"}
                  </p>
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}

// Componente ResultItem com Popover para Info (inalterado desde a última resposta)
interface ResultItemProps {
    label: string;
    value: number | string | null;
    unit: string;
    infoKey: keyof typeof conteudoIndicesFisicos; // Chave para buscar info
    precision?: number;
}

function ResultItem({ label, value, unit, infoKey, precision }: ResultItemProps) {
  const content = conteudoIndicesFisicos[infoKey];
  const displayValue = typeof value === 'number'
    ? value.toFixed(precision ?? 2)
    : value ?? "-";

  if ((value === null && typeof value !== 'string') || !content) {
      return null;
  }

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
              {content?.formula && (
                <div className="text-sm font-mono bg-muted p-2 rounded border border-border/50">
                  {content.formula}
                </div>
              )}
              <p className="text-sm text-muted-foreground">
                {content?.descricao}
              </p>
              {content?.valoresTipicos && (
                 <p className="text-xs text-muted-foreground italic pt-1">
                    <strong>Valores Típicos:</strong> {content.valoresTipicos}
                 </p>
              )}
               {content?.paginaPDF && (
                 <p className="text-xs text-muted-foreground pt-1">
                    <a
                      href="#"
                      onClick={(e) => {
                          e.preventDefault();
                          alert(`Consultar página ${content.paginaPDF} do PDF "4. Indices_Fisicos_2022-Maro.pdf" para mais detalhes.`);
                      }}
                      className="underline hover:text-primary"
                    >
                      Ref. PDF pág. {content.paginaPDF}
                    </a>
                 </p>
              )}
            </div>
          </PopoverContent>
        </Popover>
      </div>
      <span className="text-base font-semibold text-primary text-right pl-2">
        {displayValue} {unit}
      </span>
    </div>
  );
}