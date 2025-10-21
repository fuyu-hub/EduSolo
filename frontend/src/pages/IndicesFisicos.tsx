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
// --- Verifique esta linha ---
import DiagramaFases from "@/components/visualizations/DiagramaFases"; // <<< IMPORTAÇÃO CORRETA <<<

// Definição da estrutura de dados que a API retorna
// (Esta interface local é usada pelo estado 'results')
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
  // Adicionar campos de volume
  volume_solidos_norm: number | null;
  volume_agua_norm: number | null;
  volume_ar_norm: number | null;
  peso_solidos_norm?: number | null;
  peso_agua_norm?: number | null;
  erro?: string | null; // Incluir campo de erro
}

interface FormData {
  massaUmida: string;
  massaSeca: string;
  volume: string;
  massaGraos: string; // Não usado diretamente pela API atual, mas pode ser útil no futuro
  volumeGraos: string; // Não usado diretamente pela API atual, mas pode ser útil no futuro
  Gs?: string;
  pesoEspecificoAgua?: string;
}

// Interface Results é igual à IndicesFisicosOutput
type Results = IndicesFisicosOutput;

const tooltips = {
  massaUmida: "Massa total da amostra de solo incluindo a água (g)",
  massaSeca: "Massa da amostra após secagem em estufa (g)",
  volume: "Volume total da amostra incluindo vazios (cm³)",
  Gs: "Densidade relativa dos grãos (adimensional, ex: 2.65)",
  pesoEspecificoAgua: "Peso específico da água (kN/m³, padrão 10.0)",
};

const API_URL = "http://127.0.0.1:8000"; // URL do seu backend

export default function IndicesFisicos() {
  const [formData, setFormData] = useState<FormData>({
    massaUmida: "",
    massaSeca: "",
    volume: "",
    massaGraos: "",
    volumeGraos: "",
    Gs: "",
    pesoEspecificoAgua: "10.0",
  });

  const [results, setResults] = useState<Results | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError(null); // Limpa o erro ao digitar
  };

  const handleCalculate = async () => {
    setIsCalculating(true);
    setError(null);
    setResults(null);

    // Mapeia os dados do formulário para o formato esperado pela API
    const apiInput: { [key: string]: number | undefined } = {
      peso_total: formData.massaUmida ? parseFloat(formData.massaUmida) : undefined,
      peso_solido: formData.massaSeca ? parseFloat(formData.massaSeca) : undefined,
      volume_total: formData.volume ? parseFloat(formData.volume) : undefined,
      Gs: formData.Gs ? parseFloat(formData.Gs) : undefined,
      peso_especifico_agua: formData.pesoEspecificoAgua ? parseFloat(formData.pesoEspecificoAgua) : 10.0,
    };

    // Remove campos undefined ou NaN antes de enviar
    Object.keys(apiInput).forEach(key => (apiInput[key] === undefined || isNaN(apiInput[key] as number)) && delete apiInput[key]);

    try {
      // Faz a requisição para a API
      const response = await axios.post<IndicesFisicosOutput>(`${API_URL}/calcular/indices-fisicos`, apiInput);

      // Verifica se a API retornou um erro específico
      if (response.data.erro) {
        setError(response.data.erro);
        toast({
          title: "Erro no Cálculo",
          description: response.data.erro,
          variant: "destructive",
        });
      } else {
        // Atualiza o estado com os resultados da API (incluindo volumes)
        setResults(response.data);
      }
    } catch (err) {
      // Trata erros de comunicação ou validação da API
      console.error("Erro ao chamar a API (catch):", err);
      let errorMessage = "Não foi possível conectar ao servidor de cálculo.";
      if (axios.isAxiosError(err) && err.response?.data?.detail) {
        // Tenta pegar a mensagem de erro detalhada do FastAPI (Pydantic)
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
      setIsCalculating(false); // Finaliza o estado de carregamento
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

  // Ajuste a validação conforme necessário (ex: agora Gs também pode ser uma entrada válida)
  const isFormValid = (!!formData.massaUmida && !!formData.massaSeca && !!formData.volume) || !!formData.Gs;

  return (
    <TooltipProvider>
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3">
          {/* ... (código do header) ... */}
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center shadow-lg">
            <Calculator className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Índices Físicos</h1>
            <p className="text-muted-foreground">Análise das propriedades físicas do solo</p>
          </div>
        </div>

        {/* Layout Principal com 3 colunas */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Input Panel (Ocupa 1 coluna) */}
          <Card className="glass p-6 lg:col-span-1">
             {/* ... (código do painel de entrada como na resposta anterior) ... */}
              <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
                <Info className="w-5 h-5 text-primary" />
                Dados de Entrada
              </h2>

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

          {/* Div para agrupar Visualização e Resultados (Ocupa 2 colunas) */}
          <div className="lg:col-span-2 space-y-6">

            {/* Painel de Visualização */}
            <Card className="glass p-6">
              <h2 className="text-xl font-semibold text-foreground mb-4">Visualização</h2>
              <div className="flex justify-center items-center min-h-[200px]">
                {isCalculating ? (
                  <Skeleton className="w-32 h-48 bg-muted/20" />
                ) : // Verifica se results existe E se os volumes necessários não são nulos
                  results && results.volume_solidos_norm !== null && results.volume_agua_norm !== null && results.volume_ar_norm !== null ? (
                  <DiagramaFases
                    volumeSolidosNorm={results.volume_solidos_norm}
                    volumeAguaNorm={results.volume_agua_norm}
                    volumeArNorm={results.volume_ar_norm}
                  />
                ) : !error ? ( // Se não está calculando, tem resultados válidos e não há erro, mostra placeholder
                  <p className="text-muted-foreground text-center">
                    O diagrama de fases será exibido aqui após o cálculo.
                  </p>
                ): null /* Não mostra nada se houver erro e o diagrama não puder ser renderizado */}
                {/* Exibe erro se houver */}
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
                 <div className="space-y-3">
                  {[...Array(8)].map((_, i) => ( // Ajustado para 8 resultados
                    <div key={i} className="space-y-2">
                      <Skeleton className="h-4 w-32 bg-muted/20" />
                      <Skeleton className="h-8 w-full bg-muted/20" />
                    </div>
                  ))}
                </div>
              ) : results && !results.erro ? ( // Mostra resultados apenas se não houver erro na resposta
                <div className="space-y-4">
                   <ResultItem label="Umidade (w)" value={results.umidade !== null ? `${results.umidade.toFixed(2)} %` : "-"} />
                   <ResultItem label="Peso Específico Natural (γn)" value={results.peso_especifico_natural !== null ? `${results.peso_especifico_natural.toFixed(3)} kN/m³` : "-"} />
                   <ResultItem label="Peso Específico Seco (γd)" value={results.peso_especifico_seco !== null ? `${results.peso_especifico_seco.toFixed(3)} kN/m³` : "-"} />
                   <ResultItem label="Peso Específico dos Grãos (γs)" value={results.peso_especifico_solidos !== null ? `${results.peso_especifico_solidos.toFixed(3)} kN/m³` : "-"} />
                   <ResultItem label="Densidade Relativa Grãos (Gs)" value={results.Gs !== null ? `${results.Gs.toFixed(3)}` : "-"} />
                   <ResultItem label="Índice de Vazios (e)" value={results.indice_vazios !== null ? results.indice_vazios.toFixed(3) : "-"} />
                   <ResultItem label="Porosidade (n)" value={results.porosidade !== null ? `${results.porosidade.toFixed(2)} %` : "-"} />
                   <ResultItem label="Grau de Saturação (Sr)" value={results.grau_saturacao !== null ? `${results.grau_saturacao.toFixed(2)} %` : "-"} />
                   {/* Opcional: Mostrar pesos específicos saturado e submerso se forem relevantes */}
                   {/* <ResultItem label="Peso Específico Saturado (γsat)" value={results.peso_especifico_saturado !== null ? `${results.peso_especifico_saturado.toFixed(3)} kN/m³` : "-"} /> */}
                   {/* <ResultItem label="Peso Específico Submerso (γsub)" value={results.peso_especifico_submerso !== null ? `${results.peso_especifico_submerso.toFixed(3)} kN/m³` : "-"} /> */}
                 </div>
              ) : ( // Se não estiver calculando e não houver resultados (ou houver erro)
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

// Componente ResultItem (sem alterações)
function ResultItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-background/50 border border-border/50">
      <span className="text-sm font-medium text-muted-foreground">{label}</span>
      <span className="text-lg font-semibold text-primary">{value}</span>
    </div>
  );
}