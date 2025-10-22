import { useState } from "react";
import { TrendingDown, Info } from "lucide-react";
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

interface FormData {
  carga: string;
  profundidade: string;
  distanciaHorizontal: string;
  tipoFundacao: string;
  dimensao1: string;
  dimensao2: string;
}

interface Results {
  acrescimoTensao: number;
  coeficienteInfluencia: number;
  profundidadeAnalise: number;
  metodo: string;
}

const tooltips = {
  carga: "Carga aplicada (kN para pontual/linear ou kN/m² para distribuída). Para sapata: carga total em kN",
  profundidade: "Profundidade z onde calcular o acréscimo de tensão (m). Medida verticalmente abaixo da superfície",
  distanciaHorizontal: "Distância radial r do ponto à carga (m). Use 0 para ponto diretamente abaixo da carga",
  tipoFundacao: "Método de cálculo baseado no tipo de carregamento. Boussinesq para carga pontual é o mais usado",
  dimensao1: "Largura B da sapata (m). Para sapata quadrada, B = L",
  dimensao2: "Comprimento L da sapata (m). Para sapata quadrada, use o mesmo valor da largura",
};

export default function AcrescimoTensoes() {
  const [formData, setFormData] = useState<FormData>({
    carga: "",
    profundidade: "",
    distanciaHorizontal: "",
    tipoFundacao: "pontual",
    dimensao1: "",
    dimensao2: "",
  });

  const [results, setResults] = useState<Results | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  const handleChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleCalculate = () => {
    setIsCalculating(true);

    // Cálculos de acréscimo de tensão por diferentes métodos
    setTimeout(() => {
      const Q = parseFloat(formData.carga);
      const z = parseFloat(formData.profundidade);
      const r = parseFloat(formData.distanciaHorizontal) || 0;
      const tipo = formData.tipoFundacao;

      let deltaSigma = 0;
      let I = 0;
      let metodo = "";

      if (tipo === "pontual") {
        // Equação de Boussinesq para Carga Pontual
        // Δσz = (3Q/2π) * (z³/R⁵)
        // onde R = √(r² + z²)
        const R = Math.sqrt(r * r + z * z);
        const R2 = R * R;
        const R5 = R2 * R2 * R;
        
        // Coeficiente de influência: I = (3/2π) * (z³/R⁵)
        I = (3 / (2 * Math.PI)) * Math.pow(z, 3) / R5;
        
        // Acréscimo de tensão: Δσz = Q * I
        deltaSigma = Q * I;
        metodo = "Boussinesq (Carga Pontual)";
        
      } else if (tipo === "linha") {
        // Carga Linear (carga por unidade de comprimento)
        // Δσz = (2q/π) * (z³/(r² + z²)²)
        const R2 = r * r + z * z;
        I = (2 / Math.PI) * (Math.pow(z, 3) / (R2 * R2));
        deltaSigma = Q * I;
        metodo = "Carga Linear Infinita";
        
      } else if (tipo === "retangular") {
        // Sapata Retangular - Método 2:1 (Simplificado)
        // Distribuição da carga em profundidade com ângulo 2:1 (26,5°)
        const B = parseFloat(formData.dimensao1) || 1;
        const L = parseFloat(formData.dimensao2) || B;
        const A0 = B * L; // Área na superfície
        const q0 = Q / A0; // Tensão na base da fundação
        
        // Área na profundidade z (distribuição 2:1)
        const Bz = B + z; // Largura na profundidade z
        const Lz = L + z; // Comprimento na profundidade z
        const Az = Bz * Lz;
        
        // Acréscimo de tensão: Δσz = q0 * (A0/Az)
        deltaSigma = q0 * (A0 / Az);
        I = A0 / Az;
        metodo = "Método 2:1 (Sapata Retangular)";
        
      } else {
        // Carga Uniformemente Distribuída (infinita)
        deltaSigma = Q;
        I = 1.0;
        metodo = "Carga Uniformemente Distribuída";
      }

      setResults({
        acrescimoTensao: deltaSigma,
        coeficienteInfluencia: I,
        profundidadeAnalise: z,
        metodo,
      });

      setIsCalculating(false);
    }, 800);
  };

  const handleClear = () => {
    setFormData({
      carga: "",
      profundidade: "",
      distanciaHorizontal: "",
      tipoFundacao: "pontual",
      dimensao1: "",
      dimensao2: "",
    });
    setResults(null);
  };

  const isFormValid = formData.carga && formData.profundidade;
  const showDimensoes = formData.tipoFundacao === "retangular";

  return (
    <TooltipProvider>
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center shadow-lg">
            <TrendingDown className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Acréscimo de Tensões</h1>
            <p className="text-muted-foreground">Teoria de Boussinesq e métodos de distribuição de cargas</p>
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
              {/* Tipo de Fundação */}
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                  Tipo de Carregamento
                </h3>

                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="tipoFundacao">Tipo</Label>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="w-4 h-4 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p>{tooltips.tipoFundacao}</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <Select
                    value={formData.tipoFundacao}
                    onValueChange={(value) => handleChange("tipoFundacao", value)}
                  >
                    <SelectTrigger className="bg-background/50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pontual">Carga Pontual (Boussinesq)</SelectItem>
                      <SelectItem value="linha">Carga Linear</SelectItem>
                      <SelectItem value="retangular">Sapata Retangular</SelectItem>
                      <SelectItem value="uniforme">Uniformemente Distribuída</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Parâmetros do Carregamento */}
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                  Parâmetros
                </h3>

                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="carga">
                      {formData.tipoFundacao === "uniforme" ? "Carga (kN/m²)" : "Carga Total (kN)"}
                    </Label>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="w-4 h-4 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p>{tooltips.carga}</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <Input
                    id="carga"
                    type="number"
                    step="0.1"
                    value={formData.carga}
                    onChange={(e) => handleChange("carga", e.target.value)}
                    className="bg-background/50"
                    placeholder="Ex: 500.0"
                  />
                </div>

                {showDimensoes && (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label htmlFor="dimensao1">Largura (m)</Label>
                        <Input
                          id="dimensao1"
                          type="number"
                          step="0.1"
                          value={formData.dimensao1}
                          onChange={(e) => handleChange("dimensao1", e.target.value)}
                          className="bg-background/50"
                          placeholder="Ex: 2.0"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="dimensao2">Comprimento (m)</Label>
                        <Input
                          id="dimensao2"
                          type="number"
                          step="0.1"
                          value={formData.dimensao2}
                          onChange={(e) => handleChange("dimensao2", e.target.value)}
                          className="bg-background/50"
                          placeholder="Ex: 3.0"
                        />
                      </div>
                    </div>
                  </>
                )}

                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="profundidade">Profundidade (m)</Label>
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
                    onChange={(e) => handleChange("profundidade", e.target.value)}
                    className="bg-background/50"
                    placeholder="Ex: 3.0"
                  />
                </div>

                {formData.tipoFundacao !== "uniforme" && (
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="distanciaHorizontal">Distância Horizontal (m)</Label>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="w-4 h-4 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                          <p>{tooltips.distanciaHorizontal} (Opcional - 0 para ponto abaixo da carga)</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <Input
                      id="distanciaHorizontal"
                      type="number"
                      step="0.1"
                      value={formData.distanciaHorizontal}
                      onChange={(e) => handleChange("distanciaHorizontal", e.target.value)}
                      className="bg-background/50"
                      placeholder="Ex: 0.0 (opcional)"
                    />
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <Button
                  onClick={handleCalculate}
                  disabled={!isFormValid}
                  className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  <TrendingDown className="w-4 h-4 mr-2" />
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
                <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
                  <span className="text-sm font-medium text-muted-foreground block mb-1">
                    Método Utilizado
                  </span>
                  <span className="text-sm font-semibold text-primary">{results.metodo}</span>
                </div>
                
                <ResultItem
                  label="Profundidade"
                  value={`${results.profundidadeAnalise.toFixed(2)} m`}
                />
                <ResultItem
                  label="Coeficiente de Influência (I)"
                  value={results.coeficienteInfluencia.toFixed(4)}
                />
                <ResultItem
                  label="Acréscimo de Tensão (Δσ)"
                  value={`${results.acrescimoTensao.toFixed(2)} kN/m²`}
                />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-center">
                <TrendingDown className="w-16 h-16 text-muted-foreground/30 mb-4" />
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
