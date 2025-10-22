import { useState } from "react";
import { BarChart3, Info, Calculator as CalcIcon, Plus, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

interface PeneiraDado {
  abertura: string;
  massaRetida: string;
}

interface FormData {
  massaTotal: string;
  peneiras: PeneiraDado[];
  limitePercent: string;
  limitePlasticidade: string;
}

interface Results {
  percentagemAreia: number;
  percentagemSilte: number;
  percentagemArgila: number;
  d10: number | null;
  d30: number | null;
  d60: number | null;
  coefUniformidade: number | null;
  coefCurvatura: number | null;
  classificacaoUSCS: string;
  descricaoUSCS: string;
}

const tooltips = {
  massaTotal: "Massa total da amostra seca utilizada no ensaio (NBR 7181)",
  abertura: "Abertura nominal da peneira em mm (série normal: 50, 38, 25, 19, 9.5, 4.8, 2.0, 1.2, 0.6, 0.42, 0.25, 0.15, 0.075)",
  massaRetida: "Massa de solo retida nesta peneira após peneiramento",
  d10: "Diâmetro efetivo - 10% do material passa por esta abertura",
  d30: "Diâmetro correspondente a 30% passante",
  d60: "Diâmetro correspondente a 60% passante",
  cu: "Coeficiente de Uniformidade: Cu = D60/D10 (bem graduado se Cu > 4 para areias, Cu > 6 para pedregulhos)",
  cc: "Coeficiente de Curvatura: Cc = (D30)²/(D10×D60) (bem graduado se 1 < Cc < 3)",
};

const peneirasComuns = [
  { nome: '2"', abertura: 50.8 },
  { nome: '1 1/2"', abertura: 38.1 },
  { nome: '1"', abertura: 25.4 },
  { nome: '3/4"', abertura: 19.1 },
  { nome: '3/8"', abertura: 9.52 },
  { nome: 'Nº 4', abertura: 4.76 },
  { nome: 'Nº 10', abertura: 2.0 },
  { nome: 'Nº 16', abertura: 1.19 },
  { nome: 'Nº 30', abertura: 0.59 },
  { nome: 'Nº 40', abertura: 0.42 },
  { nome: 'Nº 60', abertura: 0.25 },
  { nome: 'Nº 100', abertura: 0.149 },
  { nome: 'Nº 200', abertura: 0.074 },
];

export default function Granulometria() {
  const [formData, setFormData] = useState<FormData>({
    massaTotal: "",
    peneiras: [
      { abertura: "", massaRetida: "" },
      { abertura: "", massaRetida: "" },
    ],
    limitePercent: "",
    limitePlasticidade: "",
  });

  const [results, setResults] = useState<Results | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handlePeneiraChange = (index: number, field: keyof PeneiraDado, value: string) => {
    const newPeneiras = [...formData.peneiras];
    newPeneiras[index][field] = value;
    setFormData((prev) => ({ ...prev, peneiras: newPeneiras }));
  };

  const addPeneira = () => {
    setFormData((prev) => ({
      ...prev,
      peneiras: [...prev.peneiras, { abertura: "", massaRetida: "" }],
    }));
  };

  const removePeneira = (index: number) => {
    if (formData.peneiras.length > 1) {
      const newPeneiras = formData.peneiras.filter((_, i) => i !== index);
      setFormData((prev) => ({ ...prev, peneiras: newPeneiras }));
    }
  };

  const handleCalculate = () => {
    if (!formData.massaTotal) {
      toast.error("Preencha a massa total");
      return;
    }

    const peneirasValidas = formData.peneiras.filter((p) => p.abertura && p.massaRetida);
    if (peneirasValidas.length === 0) {
      toast.error("Adicione pelo menos uma peneira com dados");
      return;
    }

    setIsCalculating(true);

    setTimeout(() => {
      const massaTotal = parseFloat(formData.massaTotal);

      // Ordenar peneiras por abertura (decrescente)
      const peneirasOrdenadas = peneirasValidas
        .map((p) => ({
          abertura: parseFloat(p.abertura),
          massaRetida: parseFloat(p.massaRetida),
        }))
        .sort((a, b) => b.abertura - a.abertura);

      // Calcular porcentagens retidas e acumuladas
      let massaAcumulada = 0;
      const dadosGranulometricos = peneirasOrdenadas.map((p) => {
        massaAcumulada += p.massaRetida;
        const percRetida = (p.massaRetida / massaTotal) * 100;
        const percRetidaAcum = (massaAcumulada / massaTotal) * 100;
        const percPassante = 100 - percRetidaAcum;
        return {
          ...p,
          percRetida,
          percRetidaAcum,
          percPassante,
        };
      });

      // Calcular D10, D30, D60
      const calcularDiametro = (percentualPassante: number): number | null => {
        for (let i = 0; i < dadosGranulometricos.length - 1; i++) {
          const p1 = dadosGranulometricos[i];
          const p2 = dadosGranulometricos[i + 1];
          
          if (p1.percPassante >= percentualPassante && p2.percPassante <= percentualPassante) {
            // Interpolação linear
            const d = p2.abertura + ((p1.abertura - p2.abertura) * (percentualPassante - p2.percPassante)) / (p1.percPassante - p2.percPassante);
            return d;
          }
        }
        return null;
      };

      const d10 = calcularDiametro(10);
      const d30 = calcularDiametro(30);
      const d60 = calcularDiametro(60);

      // Coeficientes
      const cu = d10 && d60 ? d60 / d10 : null;
      const cc = d10 && d30 && d60 ? (d30 * d30) / (d10 * d60) : null;

      // Classificação por tamanho (ABNT)
      const passante475 = dadosGranulometricos.find((d) => Math.abs(d.abertura - 4.76) < 0.1)?.percPassante || 100;
      const passante0075 = dadosGranulometricos.find((d) => Math.abs(d.abertura - 0.075) < 0.01)?.percPassante || 0;

      const percPedregulho = 100 - passante475;
      const percAreia = passante475 - passante0075;
      const percFinos = passante0075;

      // Simplificação da classificação USCS
      let classificacaoUSCS = "";
      let descricaoUSCS = "";

      const LL = formData.limitePercent ? parseFloat(formData.limitePercent) : 0;
      const LP = formData.limitePlasticidade ? parseFloat(formData.limitePlasticidade) : 0;
      const IP = LL - LP;

      if (percFinos < 50) {
        // Solos grossos
        if (percPedregulho > percAreia) {
          // Pedregulho
          if (percFinos < 5) {
            if (cu && cu > 4 && cc && cc >= 1 && cc <= 3) {
              classificacaoUSCS = "GW";
              descricaoUSCS = "Pedregulho bem graduado";
            } else {
              classificacaoUSCS = "GP";
              descricaoUSCS = "Pedregulho mal graduado";
            }
          } else if (percFinos > 12) {
            if (IP > 7) {
              classificacaoUSCS = "GC";
              descricaoUSCS = "Pedregulho argiloso";
            } else {
              classificacaoUSCS = "GM";
              descricaoUSCS = "Pedregulho siltoso";
            }
          } else {
            classificacaoUSCS = "GW-GC/GM";
            descricaoUSCS = "Pedregulho com finos";
          }
        } else {
          // Areia
          if (percFinos < 5) {
            if (cu && cu > 6 && cc && cc >= 1 && cc <= 3) {
              classificacaoUSCS = "SW";
              descricaoUSCS = "Areia bem graduada";
            } else {
              classificacaoUSCS = "SP";
              descricaoUSCS = "Areia mal graduada";
            }
          } else if (percFinos > 12) {
            if (IP > 7) {
              classificacaoUSCS = "SC";
              descricaoUSCS = "Areia argilosa";
            } else {
              classificacaoUSCS = "SM";
              descricaoUSCS = "Areia siltosa";
            }
          } else {
            classificacaoUSCS = "SW-SC/SM";
            descricaoUSCS = "Areia com finos";
          }
        }
      } else {
        // Solos finos
        if (LL < 50) {
          // Baixa plasticidade
          if (IP > 7) {
            classificacaoUSCS = "CL";
            descricaoUSCS = "Argila de baixa plasticidade";
          } else if (IP < 4) {
            classificacaoUSCS = "ML";
            descricaoUSCS = "Silte de baixa plasticidade";
          } else {
            classificacaoUSCS = "CL-ML";
            descricaoUSCS = "Silte argiloso";
          }
        } else {
          // Alta plasticidade
          if (IP > 7) {
            classificacaoUSCS = "CH";
            descricaoUSCS = "Argila de alta plasticidade";
          } else {
            classificacaoUSCS = "MH";
            descricaoUSCS = "Silte de alta plasticidade";
          }
        }
      }

      setResults({
        percentagemAreia: percAreia,
        percentagemSilte: percFinos > 0 ? percFinos * 0.7 : 0, // Estimativa
        percentagemArgila: percFinos > 0 ? percFinos * 0.3 : 0, // Estimativa
        d10,
        d30,
        d60,
        coefUniformidade: cu,
        coefCurvatura: cc,
        classificacaoUSCS,
        descricaoUSCS,
      });

      setIsCalculating(false);
      toast.success("Análise granulométrica concluída!");
    }, 1000);
  };

  const handleClear = () => {
    setFormData({
      massaTotal: "",
      peneiras: [
        { abertura: "", massaRetida: "" },
        { abertura: "", massaRetida: "" },
      ],
      limitePercent: "",
      limitePlasticidade: "",
    });
    setResults(null);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-fuchsia-500 to-purple-600 flex items-center justify-center shadow-lg">
          <BarChart3 className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Granulometria e Classificação</h1>
          <p className="text-muted-foreground">Análise granulométrica e classificação USCS</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Formulário */}
        <Card className="glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalcIcon className="w-5 h-5" />
              Dados do Ensaio
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <TooltipProvider>
              {/* Massa Total */}
              <div className="space-y-2">
                <Label htmlFor="massaTotal" className="flex items-center gap-1.5">
                  Massa Total da Amostra (g)
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="w-3 h-3 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>{tooltips.massaTotal}</TooltipContent>
                  </Tooltip>
                </Label>
                <Input
                  id="massaTotal"
                  type="number"
                  step="0.01"
                  value={formData.massaTotal}
                  onChange={(e) => handleInputChange("massaTotal", e.target.value)}
                  placeholder="Ex: 1000.00"
                />
              </div>

              {/* Peneiras */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-semibold">Dados das Peneiras</Label>
                  <Button onClick={addPeneira} size="sm" variant="outline">
                    <Plus className="w-4 h-4 mr-1" />
                    Adicionar
                  </Button>
                </div>

                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                  {formData.peneiras.map((peneira, index) => (
                    <div key={index} className="p-3 rounded-lg bg-accent/5 border border-accent/20 space-y-2">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-muted-foreground">Peneira {index + 1}</span>
                        {formData.peneiras.length > 1 && (
                          <Button onClick={() => removePeneira(index)} size="sm" variant="ghost" className="h-6 w-6 p-0">
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <Label htmlFor={`abertura-${index}`} className="text-xs">
                            Abertura (mm)
                          </Label>
                          <Input
                            id={`abertura-${index}`}
                            type="number"
                            step="0.001"
                            value={peneira.abertura}
                            onChange={(e) => handlePeneiraChange(index, "abertura", e.target.value)}
                            placeholder="Ex: 4.76"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor={`massaRetida-${index}`} className="text-xs">
                            Massa Retida (g)
                          </Label>
                          <Input
                            id={`massaRetida-${index}`}
                            type="number"
                            step="0.01"
                            value={peneira.massaRetida}
                            onChange={(e) => handlePeneiraChange(index, "massaRetida", e.target.value)}
                            placeholder="Ex: 150.00"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Limites (opcional) */}
              <div className="space-y-3 p-3 rounded-lg bg-accent/5 border border-accent/20">
                <Label className="text-sm font-semibold">Limites de Consistência (opcional)</Label>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="ll" className="text-xs">LL (%)</Label>
                    <Input
                      id="ll"
                      type="number"
                      step="0.1"
                      value={formData.limitePercent}
                      onChange={(e) => handleInputChange("limitePercent", e.target.value)}
                      placeholder="Ex: 45"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="lp" className="text-xs">LP (%)</Label>
                    <Input
                      id="lp"
                      type="number"
                      step="0.1"
                      value={formData.limitePlasticidade}
                      onChange={(e) => handleInputChange("limitePlasticidade", e.target.value)}
                      placeholder="Ex: 25"
                    />
                  </div>
                </div>
              </div>
            </TooltipProvider>

            <div className="flex gap-3">
              <Button onClick={handleCalculate} disabled={!formData.massaTotal || isCalculating} className="flex-1">
                <CalcIcon className="w-4 h-4 mr-2" />
                {isCalculating ? "Analisando..." : "Analisar"}
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
            <CardTitle>Resultados da Análise</CardTitle>
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
                <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                  <p className="text-sm font-medium text-muted-foreground mb-2">Classificação USCS</p>
                  <p className="text-2xl font-bold text-primary mb-1">{results.classificacaoUSCS}</p>
                  <p className="text-sm text-foreground">{results.descricaoUSCS}</p>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 rounded-lg bg-accent/5 text-center">
                    <p className="text-xs text-muted-foreground mb-1">Areia</p>
                    <p className="text-lg font-bold text-foreground">{results.percentagemAreia.toFixed(1)}%</p>
                  </div>
                  <div className="p-3 rounded-lg bg-accent/5 text-center">
                    <p className="text-xs text-muted-foreground mb-1">Silte</p>
                    <p className="text-lg font-bold text-foreground">{results.percentagemSilte.toFixed(1)}%</p>
                  </div>
                  <div className="p-3 rounded-lg bg-accent/5 text-center">
                    <p className="text-xs text-muted-foreground mb-1">Argila</p>
                    <p className="text-lg font-bold text-foreground">{results.percentagemArgila.toFixed(1)}%</p>
                  </div>
                </div>

                <ResultItem label="D10" value={results.d10 ? `${results.d10.toFixed(3)} mm` : "N/A"} tooltip={tooltips.d10} />
                <ResultItem label="D30" value={results.d30 ? `${results.d30.toFixed(3)} mm` : "N/A"} tooltip={tooltips.d30} />
                <ResultItem label="D60" value={results.d60 ? `${results.d60.toFixed(3)} mm` : "N/A"} tooltip={tooltips.d60} />
                <ResultItem
                  label="Coef. Uniformidade (Cu)"
                  value={results.coefUniformidade ? results.coefUniformidade.toFixed(2) : "N/A"}
                  tooltip={tooltips.cu}
                  highlight
                />
                <ResultItem
                  label="Coef. Curvatura (Cc)"
                  value={results.coefCurvatura ? results.coefCurvatura.toFixed(2) : "N/A"}
                  tooltip={tooltips.cc}
                  highlight
                />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-center">
                <BarChart3 className="w-16 h-16 text-fuchsia-500/30 mb-4" />
                <p className="text-muted-foreground">Preencha os dados do ensaio para analisar</p>
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
