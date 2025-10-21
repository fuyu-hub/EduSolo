import { useState } from "react";
import { Calculator, Info } from "lucide-react";
import axios from 'axios'; // Importar axios
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
import { useToast } from "@/components/ui/use-toast"; // Importar useToast para notificações

// Definição da estrutura de dados que a API retorna
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
  volume_solidos_norm?: number | null; // Adicione outros campos se for usar
  volume_agua_norm?: number | null;
  volume_ar_norm?: number | null;
  peso_solidos_norm?: number | null;
  peso_agua_norm?: number | null;
  erro?: string | null; // Incluir campo de erro
}

interface FormData {
  massaUmida: string;
  massaSeca: string;
  volume: string;
  massaGraos: string; // Mantido, mas backend pode não usar diretamente se Gs for preferido
  volumeGraos: string; // Mantido, mas backend pode não usar diretamente se Gs for preferido
  Gs?: string; // Adicionar Gs como opcional
  pesoEspecificoAgua?: string; // Adicionar peso específico da água
}

// Interface ajustada para corresponder ao IndicesFisicosOutput do backend
interface Results {
  umidade: number | null;
  peso_especifico_natural: number | null; // Nome mudou de densidadeNatural
  peso_especifico_seco: number | null;    // Nome mudou de densidadeSeca
  peso_especifico_solidos: number | null; // Nome mudou de densidadeGraos
  indice_vazios: number | null;
  porosidade: number | null;
  grau_saturacao: number | null;
  Gs: number | null; // Adicionado Gs ao resultado
  // Adicionar outros campos se necessário, como peso_especifico_saturado, etc.
}

const tooltips = {
  massaUmida: "Massa total da amostra de solo incluindo a água (g)",
  massaSeca: "Massa da amostra após secagem em estufa (g)",
  volume: "Volume total da amostra incluindo vazios (cm³)",
  // massaGraos: "Massa das partículas sólidas (g)", // Pode ser menos comum que Gs
  // volumeGraos: "Volume ocupado apenas pelos sólidos (cm³)", // Pode ser menos comum que Gs
  Gs: "Densidade relativa dos grãos (adimensional, ex: 2.65)",
  pesoEspecificoAgua: "Peso específico da água (kN/m³, padrão 10.0)",
};

// URL base da sua API FastAPI (ajuste se necessário)
const API_URL = "http://127.0.0.1:8000"; // Ou a URL onde sua API está rodando

export default function IndicesFisicos() {
  const [formData, setFormData] = useState<FormData>({
    massaUmida: "",
    massaSeca: "",
    volume: "",
    massaGraos: "", // Inicializar
    volumeGraos: "", // Inicializar
    Gs: "", // Inicializar Gs
    pesoEspecificoAgua: "10.0", // Definir padrão
  });

  const [results, setResults] = useState<Results | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [error, setError] = useState<string | null>(null); // Estado para erros da API
  const { toast } = useToast(); // Hook para mostrar notificações

  const handleChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError(null); // Limpar erro ao mudar input
  };

const handleCalculate = async () => { // Tornar a função async
    setIsCalculating(true);
    setError(null); // Limpar erros anteriores
    setResults(null); // Limpar resultados anteriores

    // Mapear dados do formulário para o formato esperado pela API (IndicesFisicosInput)
    // Converte strings para números onde necessário e omite campos vazios/inválidos
    const apiInput: { [key: string]: number | undefined } = {
      // Backend espera peso, não massa, mas as fórmulas usam massa/volume e depois Gs/gama_w
      // Vamos enviar os dados mais básicos se disponíveis
      peso_total: formData.massaUmida ? parseFloat(formData.massaUmida) : undefined, // Assumindo g como unidade base que será tratada no backend
      peso_solido: formData.massaSeca ? parseFloat(formData.massaSeca) : undefined, // Assumindo g como unidade base
      volume_total: formData.volume ? parseFloat(formData.volume) : undefined,   // Assumindo cm³ como unidade base
      Gs: formData.Gs ? parseFloat(formData.Gs) : undefined,
      peso_especifico_agua: formData.pesoEspecificoAgua ? parseFloat(formData.pesoEspecificoAgua) : 10.0,
      // Passar outros campos se o backend os utilizar (umidade, indice_vazios, etc.)
      // Ex: umidade: formData.umidade ? parseFloat(formData.umidade) : undefined,
    };

    // Remover chaves com valor undefined
    Object.keys(apiInput).forEach(key => apiInput[key] === undefined && delete apiInput[key]);

    try {
      console.log("Enviando para API:", apiInput); // LOG 1: Antes de enviar
      const response = await axios.post<IndicesFisicosOutput>(`${API_URL}/calcular/indices-fisicos`, apiInput);

      console.log("Resposta da API:", response.data); // LOG 2: Resposta recebida

      if (response.data.erro) {
        console.error("Erro retornado pela API:", response.data.erro); // LOG 3: Erro da API
        // Se a API retornar um erro no corpo da resposta
        setError(response.data.erro);
        toast({
          title: "Erro no Cálculo",
          description: response.data.erro,
          variant: "destructive",
        });
      } else {
        // Mapear a resposta da API para o estado Results do frontend
        const apiResults = { // Crie um objeto temporário para logar
          umidade: response.data.umidade,
          peso_especifico_natural: response.data.peso_especifico_natural,
          peso_especifico_seco: response.data.peso_especifico_seco,
          peso_especifico_solidos: response.data.peso_especifico_solidos,
          indice_vazios: response.data.indice_vazios,
          porosidade: response.data.porosidade,
          grau_saturacao: response.data.grau_saturacao,
          Gs: response.data.Gs,
        };
        console.log("Definindo estado Results:", apiResults); // LOG 4: Antes de setResults
        setResults(apiResults);
      }
    } catch (err) {
      console.error("Erro ao chamar a API (catch):", err); // LOG 5: Erro na chamada
      let errorMessage = "Não foi possível conectar ao servidor de cálculo.";
      if (axios.isAxiosError(err) && err.response?.data?.detail) {
        errorMessage = err.response.data.detail; // Captura erro de validação do FastAPI
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }
      setError(errorMessage);
      toast({
        title: "Erro de Comunicação",
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
    });
    setResults(null);
    setError(null);
  };

  // Ajustar validação conforme os campos realmente necessários para o backend
  const isFormValid = (formData.massaUmida && formData.massaSeca && formData.volume) || formData.Gs; // Exemplo: requer massas/volume OU Gs

  return (
    <TooltipProvider>
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* Header (mantido) */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center shadow-lg">
            <Calculator className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Índices Físicos</h1>
            <p className="text-muted-foreground">Análise das propriedades físicas do solo</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input Panel */}
          <Card className="glass p-6">
            <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
              <Info className="w-5 h-5 text-primary" />
              Dados de Entrada (Exemplo: Massa/Volume)
            </h2>

            <div className="space-y-6">
              {/* Entradas */}
              <div className="space-y-3">
                {/* Massa Úmida */}
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="massaUmida">Massa Úmida (g)</Label>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="w-4 h-4 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
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

          {/* Results Panel */}
          <Card className="glass p-6">
            <h2 className="text-xl font-semibold text-foreground mb-4">Resultados</h2>

            {isCalculating ? (
              <div className="space-y-3">
                {[...Array(7)].map((_, i) => ( /* Ajustar número de skeletons se necessário */
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-4 w-32 bg-muted/20" />
                    <Skeleton className="h-8 w-full bg-muted/20" />
                  </div>
                ))}
              </div>
            ) : error ? (
                <div className="flex flex-col items-center justify-center h-64 text-center text-destructive">
                    <Info className="w-16 h-16 mb-4" />
                    <p className="font-semibold">Erro no Cálculo</p>
                    <p className="text-sm">{error}</p>
                </div>
            ) : results ? (
              <div className="space-y-4">
                 {/* Ajustar a exibição dos resultados para corresponder aos nomes da API */}
                <ResultItem label="Umidade (w)" value={results.umidade !== null ? `${results.umidade.toFixed(2)} %` : "-"} />
                <ResultItem label="Peso Específico Natural (γn)" value={results.peso_especifico_natural !== null ? `${results.peso_especifico_natural.toFixed(3)} kN/m³` : "-"} />
                <ResultItem label="Peso Específico Seco (γd)" value={results.peso_especifico_seco !== null ? `${results.peso_especifico_seco.toFixed(3)} kN/m³` : "-"} />
                <ResultItem label="Peso Específico dos Grãos (γs)" value={results.peso_especifico_solidos !== null ? `${results.peso_especifico_solidos.toFixed(3)} kN/m³` : "-"} />
                 <ResultItem label="Densidade Relativa Grãos (Gs)" value={results.Gs !== null ? `${results.Gs.toFixed(3)}` : "-"} />
                <ResultItem label="Índice de Vazios (e)" value={results.indice_vazios !== null ? results.indice_vazios.toFixed(3) : "-"} />
                <ResultItem label="Porosidade (n)" value={results.porosidade !== null ? `${results.porosidade.toFixed(2)} %` : "-"} />
                <ResultItem label="Grau de Saturação (Sr)" value={results.grau_saturacao !== null ? `${results.grau_saturacao.toFixed(2)} %` : "-"} />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-center">
                <Calculator className="w-16 h-16 text-muted-foreground/30 mb-4" />
                <p className="text-muted-foreground">Preencha os campos e clique em Calcular</p>
              </div>
            )}
          </Card>
        </div>
      </div>
    </TooltipProvider>
  );
}

// Componente ResultItem (mantido)
function ResultItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-background/50 border border-border/50">
      <span className="text-sm font-medium text-muted-foreground">{label}</span>
      <span className="text-lg font-semibold text-primary">{value}</span>
    </div>
  );
}