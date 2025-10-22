import { useState } from "react";
import { Droplets, Info, Calculator as CalcIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

interface FormData {
  massaUmidaLL: string;
  massaSecaLL: string;
  massaUmidaLP: string;
  massaSecaLP: string;
  massaUmidaNatural: string;
  massaSecaNatural: string;
}

interface Results {
  limitePercent: number;
  limitePlasticidade: number;
  indicePlasticidade: number;
  umidadeNatural: number;
  indiceConsistencia: number;
  indiceLiquidez: number;
  classificacao: string;
  estado: string;
}

const tooltips = {
  massaUmidaLL: "Massa do solo úmido no limite de liquidez (NBR 6459) - quando o solo flui sob 25 golpes",
  massaSecaLL: "Massa do solo seco após estufa a 105-110°C para o ensaio de LL",
  massaUmidaLP: "Massa do solo úmido no limite de plasticidade (NBR 7180) - quando o cilindro de 3mm se rompe",
  massaSecaLP: "Massa do solo seco após estufa a 105-110°C para o ensaio de LP",
  massaUmidaNatural: "Massa do solo no estado natural (campo) - condição úmida",
  massaSecaNatural: "Massa do solo natural após secagem em estufa a 105-110°C",
  LL: "Limite de Liquidez - teor de umidade na transição líquido/plástico",
  LP: "Limite de Plasticidade - teor de umidade na transição plástico/semi-sólido",
  IP: "Índice de Plasticidade = LL - LP (faixa de comportamento plástico)",
  IC: "Índice de Consistência = (LL - w) / IP (estado de consistência do solo)",
  IL: "Índice de Liquidez = (w - LP) / IP (proximidade ao estado líquido)",
};

export default function LimitesConsistencia() {
  const [formData, setFormData] = useState<FormData>({
    massaUmidaLL: "",
    massaSecaLL: "",
    massaUmidaLP: "",
    massaSecaLP: "",
    massaUmidaNatural: "",
    massaSecaNatural: "",
  });

  const [results, setResults] = useState<Results | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleCalculate = () => {
    const { massaUmidaLL, massaSecaLL, massaUmidaLP, massaSecaLP, massaUmidaNatural, massaSecaNatural } = formData;

    if (!massaUmidaLL || !massaSecaLL || !massaUmidaLP || !massaSecaLP || !massaUmidaNatural || !massaSecaNatural) {
      toast.error("Preencha todos os campos");
      return;
    }

    setIsCalculating(true);

    setTimeout(() => {
      // Cálculo do Limite de Liquidez (LL)
      const mUmidaLL = parseFloat(massaUmidaLL);
      const mSecaLL = parseFloat(massaSecaLL);
      const LL = ((mUmidaLL - mSecaLL) / mSecaLL) * 100;

      // Cálculo do Limite de Plasticidade (LP)
      const mUmidaLP = parseFloat(massaUmidaLP);
      const mSecaLP = parseFloat(massaSecaLP);
      const LP = ((mUmidaLP - mSecaLP) / mSecaLP) * 100;

      // Índice de Plasticidade (IP)
      const IP = LL - LP;

      // Umidade Natural (w)
      const mUmidaNat = parseFloat(massaUmidaNatural);
      const mSecaNat = parseFloat(massaSecaNatural);
      const w = ((mUmidaNat - mSecaNat) / mSecaNat) * 100;

      // Índice de Consistência (IC)
      const IC = (LL - w) / IP;

      // Índice de Liquidez (IL)
      const IL = (w - LP) / IP;

      // Classificação da Plasticidade (Casagrande)
      let classificacao = "";
      if (IP <= 0) {
        classificacao = "Não Plástico (NP)";
      } else if (IP <= 7) {
        classificacao = "Fracamente Plástico";
      } else if (IP <= 15) {
        classificacao = "Medianamente Plástico";
      } else {
        classificacao = "Altamente Plástico";
      }

      // Estado do Solo
      let estado = "";
      if (IC < 0) {
        estado = "Líquido";
      } else if (IC <= 0.5) {
        estado = "Plástico Mole";
      } else if (IC <= 0.75) {
        estado = "Plástico Médio";
      } else if (IC <= 1.0) {
        estado = "Plástico Duro";
      } else {
        estado = "Semi-sólido";
      }

      setResults({
        limitePercent: LL,
        limitePlasticidade: LP,
        indicePlasticidade: IP,
        umidadeNatural: w,
        indiceConsistencia: IC,
        indiceLiquidez: IL,
        classificacao,
        estado,
      });

      setIsCalculating(false);
      toast.success("Cálculo realizado com sucesso!");
    }, 800);
  };

  const handleClear = () => {
    setFormData({
      massaUmidaLL: "",
      massaSecaLL: "",
      massaUmidaLP: "",
      massaSecaLP: "",
      massaUmidaNatural: "",
      massaSecaNatural: "",
    });
    setResults(null);
  };

  const isFormValid =
    formData.massaUmidaLL &&
    formData.massaSecaLL &&
    formData.massaUmidaLP &&
    formData.massaSecaLP &&
    formData.massaUmidaNatural &&
    formData.massaSecaNatural;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center shadow-lg">
          <Droplets className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Limites de Consistência</h1>
          <p className="text-muted-foreground">Determinação de LL, LP, IP e classificação de plasticidade</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Formulário */}
        <Card className="glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalcIcon className="w-5 h-5" />
              Dados dos Ensaios
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <TooltipProvider>
              {/* Limite de Liquidez */}
              <div className="space-y-4 p-4 rounded-lg bg-accent/5 border border-accent/20">
                <h3 className="font-semibold text-sm text-foreground flex items-center gap-2">
                  <Droplets className="w-4 h-4 text-indigo-500" />
                  Limite de Liquidez (LL)
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="massaUmidaLL" className="flex items-center gap-1.5 text-xs">
                      Massa Úmida (g)
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="w-3 h-3 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>{tooltips.massaUmidaLL}</TooltipContent>
                      </Tooltip>
                    </Label>
                    <Input
                      id="massaUmidaLL"
                      type="number"
                      step="0.01"
                      value={formData.massaUmidaLL}
                      onChange={(e) => handleInputChange("massaUmidaLL", e.target.value)}
                      placeholder="Ex: 125.50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="massaSecaLL" className="flex items-center gap-1.5 text-xs">
                      Massa Seca (g)
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="w-3 h-3 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>{tooltips.massaSecaLL}</TooltipContent>
                      </Tooltip>
                    </Label>
                    <Input
                      id="massaSecaLL"
                      type="number"
                      step="0.01"
                      value={formData.massaSecaLL}
                      onChange={(e) => handleInputChange("massaSecaLL", e.target.value)}
                      placeholder="Ex: 100.00"
                    />
                  </div>
                </div>
              </div>

              {/* Limite de Plasticidade */}
              <div className="space-y-4 p-4 rounded-lg bg-accent/5 border border-accent/20">
                <h3 className="font-semibold text-sm text-foreground flex items-center gap-2">
                  <Droplets className="w-4 h-4 text-blue-500" />
                  Limite de Plasticidade (LP)
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="massaUmidaLP" className="flex items-center gap-1.5 text-xs">
                      Massa Úmida (g)
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="w-3 h-3 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>{tooltips.massaUmidaLP}</TooltipContent>
                      </Tooltip>
                    </Label>
                    <Input
                      id="massaUmidaLP"
                      type="number"
                      step="0.01"
                      value={formData.massaUmidaLP}
                      onChange={(e) => handleInputChange("massaUmidaLP", e.target.value)}
                      placeholder="Ex: 115.30"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="massaSecaLP" className="flex items-center gap-1.5 text-xs">
                      Massa Seca (g)
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="w-3 h-3 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>{tooltips.massaSecaLP}</TooltipContent>
                      </Tooltip>
                    </Label>
                    <Input
                      id="massaSecaLP"
                      type="number"
                      step="0.01"
                      value={formData.massaSecaLP}
                      onChange={(e) => handleInputChange("massaSecaLP", e.target.value)}
                      placeholder="Ex: 100.00"
                    />
                  </div>
                </div>
              </div>

              {/* Umidade Natural */}
              <div className="space-y-4 p-4 rounded-lg bg-accent/5 border border-accent/20">
                <h3 className="font-semibold text-sm text-foreground flex items-center gap-2">
                  <Droplets className="w-4 h-4 text-cyan-500" />
                  Umidade Natural (w)
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="massaUmidaNatural" className="flex items-center gap-1.5 text-xs">
                      Massa Úmida (g)
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="w-3 h-3 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>{tooltips.massaUmidaNatural}</TooltipContent>
                      </Tooltip>
                    </Label>
                    <Input
                      id="massaUmidaNatural"
                      type="number"
                      step="0.01"
                      value={formData.massaUmidaNatural}
                      onChange={(e) => handleInputChange("massaUmidaNatural", e.target.value)}
                      placeholder="Ex: 118.00"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="massaSecaNatural" className="flex items-center gap-1.5 text-xs">
                      Massa Seca (g)
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="w-3 h-3 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>{tooltips.massaSecaNatural}</TooltipContent>
                      </Tooltip>
                    </Label>
                    <Input
                      id="massaSecaNatural"
                      type="number"
                      step="0.01"
                      value={formData.massaSecaNatural}
                      onChange={(e) => handleInputChange("massaSecaNatural", e.target.value)}
                      placeholder="Ex: 100.00"
                    />
                  </div>
                </div>
              </div>
            </TooltipProvider>

            <div className="flex gap-3 pt-2">
              <Button onClick={handleCalculate} disabled={!isFormValid || isCalculating} className="flex-1">
                <CalcIcon className="w-4 h-4 mr-2" />
                {isCalculating ? "Calculando..." : "Calcular"}
              </Button>
              <Button onClick={handleClear} variant="outline">
                Limpar
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Resultados */}
        <Card className="glass">
          <CardHeader>
            <CardTitle>Resultados</CardTitle>
          </CardHeader>
          <CardContent>
            {isCalculating ? (
              <div className="space-y-4">
                {[...Array(8)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : results ? (
              <div className="space-y-4">
                <ResultItem label="Limite de Liquidez (LL)" value={`${results.limitePercent.toFixed(2)}%`} tooltip={tooltips.LL} />
                <ResultItem label="Limite de Plasticidade (LP)" value={`${results.limitePlasticidade.toFixed(2)}%`} tooltip={tooltips.LP} />
                <ResultItem label="Índice de Plasticidade (IP)" value={`${results.indicePlasticidade.toFixed(2)}%`} tooltip={tooltips.IP} highlight />
                <ResultItem label="Umidade Natural (w)" value={`${results.umidadeNatural.toFixed(2)}%`} />
                <ResultItem label="Índice de Consistência (IC)" value={results.indiceConsistencia.toFixed(3)} tooltip={tooltips.IC} />
                <ResultItem label="Índice de Liquidez (IL)" value={results.indiceLiquidez.toFixed(3)} tooltip={tooltips.IL} />
                
                <div className="pt-4 border-t space-y-3">
                  <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                    <p className="text-sm font-medium text-muted-foreground mb-1">Classificação</p>
                    <p className="text-lg font-bold text-primary">{results.classificacao}</p>
                  </div>
                  <div className="p-4 rounded-lg bg-accent/10 border border-accent/20">
                    <p className="text-sm font-medium text-muted-foreground mb-1">Estado do Solo</p>
                    <p className="text-lg font-bold text-foreground">{results.estado}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-center">
                <Droplets className="w-16 h-16 text-indigo-500/30 mb-4" />
                <p className="text-muted-foreground">Preencha os dados dos ensaios para calcular</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ResultItem({ label, value, tooltip, highlight = false }: { label: string; value: string; tooltip?: string; highlight?: boolean }) {
  return (
    <div className={`flex justify-between items-center p-3 rounded-lg ${highlight ? "bg-primary/10 border border-primary/20" : "bg-accent/5"}`}>
      <TooltipProvider>
        <span className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
          {label}
          {tooltip && (
            <Tooltip>
              <TooltipTrigger>
                <Info className="w-3 h-3" />
              </TooltipTrigger>
              <TooltipContent>{tooltip}</TooltipContent>
            </Tooltip>
          )}
        </span>
      </TooltipProvider>
      <span className={`font-bold ${highlight ? "text-primary text-lg" : "text-foreground"}`}>{value}</span>
    </div>
  );
}
