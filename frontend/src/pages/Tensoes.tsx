import { useState } from "react";
import { FileText, Info } from "lucide-react";
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

interface CamadaData {
  espessura: string;
  densidade: string;
  saturada: boolean;
}

interface FormData {
  camadas: CamadaData[];
  profundidade: string;
  nivelAgua: string;
}

interface Results {
  tensaoTotal: number;
  tensaoNeutra: number;
  tensaoEfetiva: number;
  profundidadeCalculo: number;
}

const tooltips = {
  espessura: "Espessura da camada de solo (m). Soma todas as camadas até a profundidade desejada",
  densidade: "Peso específico do solo (kN/m³). Use γnat acima do N.A. e γsat abaixo do N.A. Valores típicos: Areia 16-20, Argila 15-19",
  profundidade: "Profundidade z onde calcular as tensões geostáticas (m). Medida a partir da superfície do terreno",
  nivelAgua: "Profundidade do nível d'água (N.A.) a partir da superfície (m). Deixe vazio se não houver lençol freático",
};

export default function Tensoes() {
  const [formData, setFormData] = useState<FormData>({
    camadas: [
      { espessura: "", densidade: "", saturada: false },
    ],
    profundidade: "",
    nivelAgua: "",
  });

  const [results, setResults] = useState<Results | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  const handleCamadaChange = (index: number, field: keyof CamadaData, value: string | boolean) => {
    const newCamadas = [...formData.camadas];
    newCamadas[index] = { ...newCamadas[index], [field]: value };
    setFormData((prev) => ({ ...prev, camadas: newCamadas }));
  };

  const addCamada = () => {
    setFormData((prev) => ({
      ...prev,
      camadas: [...prev.camadas, { espessura: "", densidade: "", saturada: false }],
    }));
  };

  const removeCamada = (index: number) => {
    if (formData.camadas.length > 1) {
      const newCamadas = formData.camadas.filter((_, i) => i !== index);
      setFormData((prev) => ({ ...prev, camadas: newCamadas }));
    }
  };

  const handleCalculate = () => {
    setIsCalculating(true);

    // Cálculos conforme Princípio das Tensões Efetivas de Terzaghi
    setTimeout(() => {
      const z = parseFloat(formData.profundidade); // Profundidade de cálculo
      const zw = parseFloat(formData.nivelAgua); // Profundidade do N.A.
      const gammaW = 10; // kN/m³ - peso específico da água
      
      let sigmaTotal = 0; // Tensão Total (σ)
      let profAcumulada = 0;

      // Cálculo da Tensão Total: σ = Σ(γi * hi)
      // Somatório do peso das camadas acima do ponto
      for (const camada of formData.camadas) {
        const h = parseFloat(camada.espessura);
        const gamma = parseFloat(camada.densidade);
        
        if (profAcumulada + h <= z) {
          // Camada completamente acima do ponto
          sigmaTotal += gamma * h;
          profAcumulada += h;
        } else {
          // Camada contém o ponto de cálculo
          const hRestante = z - profAcumulada;
          sigmaTotal += gamma * hRestante;
          break;
        }
      }

      // Cálculo da Poropressão (u): u = γw * hw
      // onde hw é a altura da coluna d'água acima do ponto
      let poropressao = 0;
      if (!isNaN(zw) && z > zw) {
        // Se há N.A. e o ponto está abaixo dele
        const hw = z - zw; // Altura da coluna d'água
        poropressao = gammaW * hw;
      }

      // Princípio das Tensões Efetivas de Terzaghi: σ' = σ - u
      // A tensão efetiva é a tensão transmitida pelos contatos entre grãos
      const tensaoEfetiva = sigmaTotal - poropressao;

      setResults({
        tensaoTotal: sigmaTotal,
        tensaoNeutra: poropressao,
        tensaoEfetiva: tensaoEfetiva,
        profundidadeCalculo: z,
      });

      setIsCalculating(false);
    }, 800);
  };

  const handleClear = () => {
    setFormData({
      camadas: [{ espessura: "", densidade: "", saturada: false }],
      profundidade: "",
      nivelAgua: "",
    });
    setResults(null);
  };

  const isFormValid = 
    formData.profundidade && 
    formData.camadas.every(c => c.espessura && c.densidade);

  return (
    <TooltipProvider>
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-lg">
            <FileText className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Tensões Geostáticas</h1>
            <p className="text-muted-foreground">Princípio das Tensões Efetivas de Terzaghi (σ' = σ - u)</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input Panel */}
          <Card className="glass p-6">
            <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
              <Info className="w-5 h-5 text-primary" />
              Dados de Entrada
            </h2>

            <div className="space-y-6">
              {/* Camadas */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                    Camadas de Solo
                  </h3>
                  <Button
                    onClick={addCamada}
                    variant="outline"
                    size="sm"
                    className="text-xs"
                  >
                    + Adicionar Camada
                  </Button>
                </div>

                {formData.camadas.map((camada, index) => (
                  <Card key={index} className="p-4 bg-background/30 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-foreground">
                        Camada {index + 1}
                      </span>
                      {formData.camadas.length > 1 && (
                        <Button
                          onClick={() => removeCamada(index)}
                          variant="ghost"
                          size="sm"
                          className="h-6 text-xs text-destructive hover:text-destructive"
                        >
                          Remover
                        </Button>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label className="text-xs">Espessura (m)</Label>
                        <Input
                          type="number"
                          step="0.1"
                          value={camada.espessura}
                          onChange={(e) => handleCamadaChange(index, "espessura", e.target.value)}
                          className="bg-background/50 h-9 text-sm"
                          placeholder="Ex: 2.0"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Densidade (kN/m³)</Label>
                        <Input
                          type="number"
                          step="0.1"
                          value={camada.densidade}
                          onChange={(e) => handleCamadaChange(index, "densidade", e.target.value)}
                          className="bg-background/50 h-9 text-sm"
                          placeholder="Ex: 18.0"
                        />
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              {/* Parâmetros */}
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                  Parâmetros
                </h3>

                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="profundidade">Profundidade de Cálculo (m)</Label>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="w-4 h-4 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p>{tooltips.profundidade}</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <Input
                    id="profundidade"
                    type="number"
                    step="0.1"
                    value={formData.profundidade}
                    onChange={(e) => setFormData(prev => ({ ...prev, profundidade: e.target.value }))}
                    className="bg-background/50"
                    placeholder="Ex: 5.0"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="nivelAgua">Nível d'Água (m)</Label>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="w-4 h-4 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p>{tooltips.nivelAgua} (Opcional)</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <Input
                    id="nivelAgua"
                    type="number"
                    step="0.1"
                    value={formData.nivelAgua}
                    onChange={(e) => setFormData(prev => ({ ...prev, nivelAgua: e.target.value }))}
                    className="bg-background/50"
                    placeholder="Ex: 3.0 (opcional)"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <Button
                  onClick={handleCalculate}
                  disabled={!isFormValid}
                  className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Calcular
                </Button>
                <Button onClick={handleClear} variant="outline">
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
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-4 w-32 bg-muted/20" />
                    <Skeleton className="h-8 w-full bg-muted/20" />
                  </div>
                ))}
              </div>
            ) : results ? (
              <div className="space-y-4">
                <ResultItem
                  label="Profundidade"
                  value={`${results.profundidadeCalculo.toFixed(2)} m`}
                />
                <ResultItem
                  label="Tensão Total (σv)"
                  value={`${results.tensaoTotal.toFixed(2)} kN/m²`}
                />
                <ResultItem
                  label="Tensão Neutra (u)"
                  value={`${results.tensaoNeutra.toFixed(2)} kN/m²`}
                />
                <ResultItem
                  label="Tensão Efetiva (σ'v)"
                  value={`${results.tensaoEfetiva.toFixed(2)} kN/m²`}
                />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-center">
                <FileText className="w-16 h-16 text-muted-foreground/30 mb-4" />
                <p className="text-muted-foreground">
                  Preencha os campos e clique em Calcular para ver os resultados
                </p>
              </div>
            )}
          </Card>
        </div>
      </div>
    </TooltipProvider>
  );
}

function ResultItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-background/50 border border-border/50">
      <span className="text-sm font-medium text-muted-foreground">{label}</span>
      <span className="text-lg font-semibold text-primary">{value}</span>
    </div>
  );
}
