import { useState } from "react";
import { Layers, Info } from "lucide-react";
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
  massaUmida: string;
  massaSeca: string;
  volume: string;
  umidade: string;
  tipoProctor: string;
  numGolpes: string;
  numCamadas: string;
}

interface Results {
  densidadeSeca: number;
  densidadeUmida: number;
  energiaCompactacao: number;
  grauSaturacao: number;
  umidadeCalculada: number;
}

const tooltips = {
  massaUmida: "Massa total do solo úmido compactado (g). Inclui massa do solo + água",
  massaSeca: "Massa do solo após secagem em estufa a 105-110°C (g)",
  volume: "Volume do cilindro padrão de compactação (cm³). Cilindro pequeno: 1000 cm³, Cilindro grande: ~2100 cm³",
  umidade: "Teor de umidade do solo durante a compactação (%)",
  tipoProctor: "Energia de compactação: Normal (600 kJ/m³), Intermediário (1300 kJ/m³) ou Modificado (2700 kJ/m³)",
  numGolpes: "Número de golpes por camada. Normal: 26, Intermediário: 21, Modificado: 27",
  numCamadas: "Número de camadas compactadas. Geralmente 3 ou 5 camadas",
};

const energiasProctor = {
  normal: { energia: 600, golpes: 26, camadas: 3, descricao: "Proctor Normal (2,5 kg, 30,5 cm)" },
  intermediario: { energia: 1300, golpes: 21, camadas: 3, descricao: "Proctor Intermediário (4,5 kg, 45 cm)" },
  modificado: { energia: 2700, golpes: 27, camadas: 5, descricao: "Proctor Modificado (4,5 kg, 45 cm)" },
};

export default function Compactacao() {
  const [formData, setFormData] = useState<FormData>({
    massaUmida: "",
    massaSeca: "",
    volume: "1000",
    umidade: "",
    tipoProctor: "normal",
    numGolpes: "26",
    numCamadas: "3",
  });

  const [results, setResults] = useState<Results | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  const handleChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleProctorChange = (tipo: string) => {
    const config = energiasProctor[tipo as keyof typeof energiasProctor];
    setFormData((prev) => ({
      ...prev,
      tipoProctor: tipo,
      numGolpes: config.golpes.toString(),
      numCamadas: config.camadas.toString(),
    }));
  };

  const handleCalculate = () => {
    setIsCalculating(true);

    setTimeout(() => {
      const mu = parseFloat(formData.massaUmida);
      const ms = parseFloat(formData.massaSeca);
      const v = parseFloat(formData.volume);
      const config = energiasProctor[formData.tipoProctor as keyof typeof energiasProctor];

      // Cálculos conforme NBR 7182/2020
      const w = ((mu - ms) / ms) * 100; // Umidade (%)
      const gammaD = ms / v; // Densidade seca (g/cm³)
      const gammaN = mu / v; // Densidade úmida (g/cm³)
      
      // Assumindo γs = 2.7 g/cm³ (valor típico)
      const gammaS = 2.7;
      const e = (gammaS / gammaD) - 1; // Índice de vazios
      const Sr = (w * gammaS) / e; // Grau de saturação (decimal)
      
      setResults({
        densidadeSeca: gammaD,
        densidadeUmida: gammaN,
        energiaCompactacao: config.energia,
        grauSaturacao: Sr * 100,
        umidadeCalculada: w,
      });

      setIsCalculating(false);
    }, 800);
  };

  const handleClear = () => {
    setFormData({
      massaUmida: "",
      massaSeca: "",
      volume: "1000",
      umidade: "",
      tipoProctor: "normal",
      numGolpes: "26",
      numCamadas: "3",
    });
    setResults(null);
  };

  const isFormValid = formData.massaUmida && formData.massaSeca && formData.volume;

  return (
    <TooltipProvider>
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg">
            <Layers className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Compactação</h1>
            <p className="text-muted-foreground">Análise de curvas de compactação Proctor</p>
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
              {/* Tipo de Ensaio */}
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                  Tipo de Ensaio (NBR 7182/2020)
                </h3>

                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="tipoProctor">Energia de Compactação</Label>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="w-4 h-4 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p>{tooltips.tipoProctor}</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <Select value={formData.tipoProctor} onValueChange={handleProctorChange}>
                    <SelectTrigger className="bg-background/50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="normal">{energiasProctor.normal.descricao}</SelectItem>
                      <SelectItem value="intermediario">{energiasProctor.intermediario.descricao}</SelectItem>
                      <SelectItem value="modificado">{energiasProctor.modificado.descricao}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Dados do Ensaio */}
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                  Dados Medidos
                </h3>

                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="massaUmida">Massa Úmida (g)</Label>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="w-4 h-4 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p>{tooltips.massaUmida}</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <Input
                    id="massaUmida"
                    type="number"
                    step="0.01"
                    value={formData.massaUmida}
                    onChange={(e) => handleChange("massaUmida", e.target.value)}
                    className="bg-background/50"
                    placeholder="Ex: 1950.0"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="massaSeca">Massa Seca (g)</Label>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="w-4 h-4 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p>{tooltips.massaSeca}</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <Input
                    id="massaSeca"
                    type="number"
                    step="0.01"
                    value={formData.massaSeca}
                    onChange={(e) => handleChange("massaSeca", e.target.value)}
                    className="bg-background/50"
                    placeholder="Ex: 1750.0"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="volume">Volume do Cilindro (cm³)</Label>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="w-4 h-4 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p>{tooltips.volume}</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <Input
                    id="volume"
                    type="number"
                    step="0.01"
                    value={formData.volume}
                    onChange={(e) => handleChange("volume", e.target.value)}
                    className="bg-background/50"
                    placeholder="Ex: 1000.0"
                  />
                </div>
              </div>

              {/* Parâmetros de Compactação */}
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                  Parâmetros de Compactação
                </h3>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="numGolpes">Golpes/Camada</Label>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="w-4 h-4 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                          <p>{tooltips.numGolpes}</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <Input
                      id="numGolpes"
                      type="number"
                      value={formData.numGolpes}
                      onChange={(e) => handleChange("numGolpes", e.target.value)}
                      className="bg-background/50"
                      disabled
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="numCamadas">Nº Camadas</Label>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="w-4 h-4 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                          <p>{tooltips.numCamadas}</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <Input
                      id="numCamadas"
                      type="number"
                      value={formData.numCamadas}
                      onChange={(e) => handleChange("numCamadas", e.target.value)}
                      className="bg-background/50"
                      disabled
                    />
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <Button
                  onClick={handleCalculate}
                  disabled={!isFormValid}
                  className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  <Layers className="w-4 h-4 mr-2" />
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
                  label="Umidade (w)"
                  value={`${results.umidadeCalculada.toFixed(2)} %`}
                />
                <ResultItem
                  label="Densidade Seca (γd)"
                  value={`${results.densidadeSeca.toFixed(3)} g/cm³`}
                />
                <ResultItem
                  label="Densidade Úmida (γn)"
                  value={`${results.densidadeUmida.toFixed(3)} g/cm³`}
                />
                <ResultItem
                  label="Grau de Saturação (Sr)"
                  value={`${results.grauSaturacao.toFixed(1)} %`}
                />
                <ResultItem
                  label="Energia de Compactação"
                  value={`${results.energiaCompactacao} kJ/m³`}
                />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-center">
                <Layers className="w-16 h-16 text-muted-foreground/30 mb-4" />
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
