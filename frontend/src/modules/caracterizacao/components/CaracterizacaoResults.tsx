
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, Activity } from "lucide-react";
import { useCaracterizacaoStore } from "../store";
import { formatNumber } from "@/lib/format-number";

export function CaracterizacaoResults() {
    const { results, amostras, currentAmostraIndex } = useCaracterizacaoStore();
    const currentAmostra = amostras[currentAmostraIndex];
    const resultado = results[currentAmostra.id];

    if (!resultado) {
        return (
            <Card className="glass h-full flex items-center justify-center p-6 text-center text-muted-foreground border-dashed">
                <div>
                    <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <p>Preencha os dados e clique em Calcular para ver os resultados unificados.</p>
                </div>
            </Card>
        );
    }

    if (resultado.erro) {
        return (
            <Card className="glass border-destructive/50 bg-destructive/5">
                <CardContent className="p-6 text-center text-destructive">
                    <p className="font-semibold">{resultado.erro}</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="glass h-full overflow-hidden">
            <CardHeader className="bg-primary/5 pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                    <Activity className="w-5 h-5 text-primary" />
                    Resultados da Caracterização
                </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
                <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-border">
                    {/* Coluna 1: Indices Fisicos */}
                    <div className="p-4 space-y-3">
                        <h3 className="font-semibold text-sm mb-3 text-muted-foreground uppercase tracking-wider">Índices Físicos</h3>
                        <ResultRow label="Umidade (w)" value={resultado.w} unit="%" />
                        <ResultRow label="Peso Esp. Nat. (γ)" value={resultado.gamma_nat} unit="kN/m³" />
                        <ResultRow label="Peso Esp. Seco (γd)" value={resultado.gamma_d} unit="kN/m³" />
                        <ResultRow label="Índice de Vazios (e)" value={resultado.e} unit="" precision={3} />
                        <ResultRow label="Porosidade (n)" value={resultado.n} unit="%" />
                        <ResultRow label="Grau de Saturação (Sr)" value={resultado.Sr} unit="%" />
                    </div>

                    {/* Coluna 2: Limites */}
                    <div className="p-4 space-y-3">
                        <h3 className="font-semibold text-sm mb-3 text-muted-foreground uppercase tracking-wider">Limites de Consistência</h3>
                        <ResultRow label="Limite de Liquidez (LL)" value={resultado.ll} unit="%" />
                        <ResultRow label="Limite de Plasticidade (LP)" value={resultado.lp} unit="%" />
                        <ResultRow label="Índice de Plasticidade (IP)" value={resultado.ip} unit="%" highlight />
                        <ResultRow label="Índice de Consistência (IC)" value={resultado.ic} unit="" precision={2} />
                        <ResultRow label="Atividade (Ia)" value={resultado.atividade} unit="" precision={2} />
                    </div>
                </div>

                {/* Classificações */}
                <div className="bg-muted/10 p-4 border-t border-border">
                    <h3 className="font-semibold text-sm mb-2 text-muted-foreground">CLASSIFICAÇÕES</h3>
                    <div className="space-y-1">
                        {resultado.classificacao_plasticidade && (
                            <p className="text-sm"><span className="font-medium text-foreground">Plasticidade:</span> {resultado.classificacao_plasticidade}</p>
                        )}
                        {resultado.classificacao_consistencia && (
                            <p className="text-sm"><span className="font-medium text-foreground">Consistência:</span> {resultado.classificacao_consistencia}</p>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

function ResultRow({ label, value, unit, precision = 2, highlight = false }: { label: string, value: number | null | undefined, unit: string, precision?: number, highlight?: boolean }) {
    if (value === undefined || value === null) return null;

    return (
        <div className={`flex justify-between items-center text-sm ${highlight ? 'font-bold text-primary' : ''}`}>
            <span className="text-muted-foreground">{label}</span>
            <span className="font-medium font-mono">{value.toFixed(precision)} {unit}</span>
        </div>
    );
}
