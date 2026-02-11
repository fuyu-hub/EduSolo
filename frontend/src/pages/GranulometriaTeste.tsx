import { useState, useEffect } from "react";
import { Database, Info, Activity, BarChart3 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "@/components/ui/sonner";
import { Separator } from "@/components/ui/separator";
import { Trash2 } from "lucide-react";
import PrintHeader from "@/components/PrintHeader";
import PlasticityChart from "@/components/visualizations/PlasticityChart";
import { cn } from "@/lib/utils";
import {
    calcularClassificacaoPorPorcentagem,
    type ClassificacaoPorcentagemInput,
    type ClassificacaoPorcentagemOutput,
} from "@/modules/granulometria-teste/calculations-porcentagem";

// Campos de fração com labels e tooltips
const FRACOES = [
    { key: "pedregulho", label: "Pedregulho", tooltip: "Fração retida na peneira Nº 4 (> 4.8 mm)", color: "bg-amber-500" },
    { key: "areia_grossa", label: "Areia Grossa", tooltip: "Fração entre peneiras Nº 4 e Nº 10 (2.0 - 4.8 mm)", color: "bg-yellow-500" },
    { key: "areia_media", label: "Areia Média", tooltip: "Fração entre peneiras Nº 10 e Nº 40 (0.42 - 2.0 mm)", color: "bg-orange-400" },
    { key: "areia_fina", label: "Areia Fina", tooltip: "Fração entre peneiras Nº 40 e Nº 200 (0.075 - 0.42 mm)", color: "bg-orange-500" },
    { key: "silte", label: "Silte", tooltip: "Fração entre 0.002 e 0.075 mm", color: "bg-blue-400" },
    { key: "argila", label: "Argila", tooltip: "Fração menor que 0.002 mm", color: "bg-blue-600" },
] as const;

type FracaoKey = typeof FRACOES[number]["key"];

interface FormData {
    pedregulho: string;
    areia_grossa: string;
    areia_media: string;
    areia_fina: string;
    silte: string;
    argila: string;
    ll: string;
    lp: string;
}

const defaultFormData: FormData = {
    pedregulho: "",
    areia_grossa: "",
    areia_media: "",
    areia_fina: "",
    silte: "",
    argila: "",
    ll: "",
    lp: "",
};

export default function GranulometriaTeste() {
    const [formData, setFormData] = useState<FormData>(defaultFormData);
    const [results, setResults] = useState<ClassificacaoPorcentagemOutput | null>(null);

    const handleInputChange = (field: keyof FormData, value: string) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const handleClear = () => {
        setFormData(defaultFormData);
        setResults(null);
    };

    // Calcular soma das frações
    const somaFracoes = FRACOES.reduce((sum, f) => {
        const val = parseFloat(formData[f.key]);
        return sum + (isNaN(val) ? 0 : val);
    }, 0);

    const somaValida = Math.abs(somaFracoes - 100) <= 1.0;
    const temFracoes = FRACOES.some((f) => formData[f.key] !== "");

    // Auto-calculate
    useEffect(() => {
        // Precisa de pelo menos 2 frações preenchidas e soma válida
        const fracoesPreenchidas = FRACOES.filter((f) => formData[f.key] !== "" && !isNaN(parseFloat(formData[f.key])));
        if (fracoesPreenchidas.length < 2) {
            setResults(null);
            return;
        }

        if (!somaValida && temFracoes) {
            setResults(null);
            return;
        }

        const input: ClassificacaoPorcentagemInput = {
            pedregulho: parseFloat(formData.pedregulho) || 0,
            areia_grossa: parseFloat(formData.areia_grossa) || 0,
            areia_media: parseFloat(formData.areia_media) || 0,
            areia_fina: parseFloat(formData.areia_fina) || 0,
            silte: parseFloat(formData.silte) || 0,
            argila: parseFloat(formData.argila) || 0,
            ll: formData.ll ? parseFloat(formData.ll) : undefined,
            lp: formData.lp ? parseFloat(formData.lp) : undefined,
        };

        const resultado = calcularClassificacaoPorPorcentagem(input);

        if (resultado.erro) {
            setResults(null);
        } else {
            setResults(resultado);
        }
    }, [formData]);

    // Barra visual de composição
    const renderCompositionBar = () => {
        if (!temFracoes) return null;

        const valores = FRACOES.map((f) => ({
            ...f,
            valor: parseFloat(formData[f.key]) || 0,
        })).filter((f) => f.valor > 0);

        if (valores.length === 0) return null;

        return (
            <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Composição</span>
                    <span className={cn(
                        "font-mono font-semibold",
                        somaValida ? "text-green-500" : "text-destructive"
                    )}>
                        {somaFracoes.toFixed(1)}%
                    </span>
                </div>
                <div className="h-3 rounded-full overflow-hidden flex bg-muted/50 border border-border/40">
                    {valores.map((f) => (
                        <div
                            key={f.key}
                            className={cn("h-full transition-all duration-300", f.color)}
                            style={{ width: `${(f.valor / Math.max(somaFracoes, 100)) * 100}%` }}
                            title={`${f.label}: ${f.valor}%`}
                        />
                    ))}
                </div>
                <div className="flex flex-wrap gap-x-3 gap-y-1">
                    {valores.map((f) => (
                        <div key={f.key} className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                            <span className={cn("w-2 h-2 rounded-full", f.color)} />
                            <span>{f.label}: {f.valor}%</span>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-3 sm:space-y-4 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <PrintHeader moduleTitle="Classificação por Porcentagem" moduleName="granulometria-teste" />

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-2 animate-in fade-in slide-in-from-left-4 duration-500">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl border border-primary/30 bg-primary/5 flex items-center justify-center transition-colors hover:border-primary/60 hover:bg-primary/10">
                        <Database className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-foreground">Granulometria Teste</h1>
                        <p className="text-muted-foreground text-sm">Classificação de Solos por Porcentagem</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={handleClear} className="text-muted-foreground hover:text-destructive gap-1.5">
                        <Trash2 className="w-4 h-4" />
                        Limpar
                    </Button>
                </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-6 items-start">
                {/* Formulário */}
                <div className="space-y-4 md:space-y-6 animate-in fade-in slide-in-from-left-4 duration-700" style={{ animationDelay: '100ms', animationFillMode: 'backwards' }}>
                    {/* Frações Granulométricas */}
                    <Card className="glass">
                        <CardHeader className="pb-3 pt-4 px-4 md:px-6">
                            <CardTitle className="text-base md:text-lg font-semibold flex items-center gap-2">
                                <span className="w-3 h-3 rounded-full bg-orange-500 shadow-sm shadow-orange-500/50"></span>
                                Frações Granulométricas (%)
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="px-4 md:px-6 pb-6 space-y-4">
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                {FRACOES.map((fracao) => (
                                    <div key={fracao.key} className="space-y-1.5">
                                        <div className="flex items-center gap-1.5">
                                            <span className={cn("w-2 h-2 rounded-full", fracao.color)} />
                                            <Label className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
                                                {fracao.label}
                                            </Label>
                                            <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger>
                                                        <Info className="w-3 h-3 text-muted-foreground/50" />
                                                    </TooltipTrigger>
                                                    <TooltipContent className="max-w-xs">{fracao.tooltip}</TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                        </div>
                                        <div className="relative">
                                            <Input
                                                type="number"
                                                step="0.1"
                                                min="0"
                                                max="100"
                                                value={formData[fracao.key]}
                                                onChange={(e) => handleInputChange(fracao.key, e.target.value)}
                                                placeholder="0"
                                                className="h-9 text-sm bg-background/80 pr-7"
                                            />
                                            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">%</span>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Soma e barra */}
                            {renderCompositionBar()}

                            {temFracoes && !somaValida && (
                                <div className="text-xs text-destructive font-medium bg-destructive/10 px-3 py-2 rounded-lg border border-destructive/20">
                                    ⚠ A soma das frações deve ser igual a 100%. Atual: {somaFracoes.toFixed(1)}%
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Limites de Consistência */}
                    <Card className="glass">
                        <CardHeader className="pb-3 pt-4 px-4 md:px-6">
                            <CardTitle className="text-base font-semibold flex items-center gap-2 text-primary">
                                <Activity className="w-4 h-4" />
                                Limites de Consistência
                                <span className="text-xs font-normal text-muted-foreground ml-2">(Opcional)</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="px-4 md:px-6 pb-6">
                            <TooltipProvider>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <Label htmlFor="ll" className="text-xs font-semibold">Limite de Liquidez (LL)</Label>
                                            <Tooltip>
                                                <TooltipTrigger>
                                                    <Info className="w-3 h-3 text-muted-foreground" />
                                                </TooltipTrigger>
                                                <TooltipContent>Umidade onde o solo passa do estado plástico para líquido</TooltipContent>
                                            </Tooltip>
                                        </div>
                                        <div className="relative">
                                            <Input
                                                id="ll"
                                                type="number"
                                                step="0.1"
                                                value={formData.ll}
                                                onChange={(e) => handleInputChange("ll", e.target.value)}
                                                placeholder="Ex: 45"
                                                className="pl-3 pr-8"
                                            />
                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">%</span>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <Label htmlFor="lp" className="text-xs font-semibold">Limite de Plasticidade (LP)</Label>
                                            <Tooltip>
                                                <TooltipTrigger>
                                                    <Info className="w-3 h-3 text-muted-foreground" />
                                                </TooltipTrigger>
                                                <TooltipContent>Umidade onde o solo passa do estado semissólido para plástico</TooltipContent>
                                            </Tooltip>
                                        </div>
                                        <div className="relative">
                                            <Input
                                                id="lp"
                                                type="number"
                                                step="0.1"
                                                value={formData.lp}
                                                onChange={(e) => handleInputChange("lp", e.target.value)}
                                                placeholder="Ex: 25"
                                                className="pl-3 pr-8"
                                            />
                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">%</span>
                                        </div>
                                    </div>
                                </div>
                            </TooltipProvider>
                        </CardContent>
                    </Card>
                </div>

                {/* Resultados */}
                <div className="animate-in slide-in-from-bottom-4 duration-700 fade-in sticky top-4 self-start space-y-4" style={{ animationDelay: '200ms', animationFillMode: 'backwards' }}>
                    <Tabs defaultValue="classificacao" className="w-full">
                        <TabsList className="grid w-full grid-cols-2 mb-4">
                            <TabsTrigger value="classificacao" className="gap-2 text-xs md:text-sm">
                                <Info className="w-3.5 h-3.5 md:w-4 md:h-4" />
                                Classificação
                            </TabsTrigger>
                            <TabsTrigger value="carta" className="gap-2 text-xs md:text-sm">
                                <Activity className="w-3.5 h-3.5 md:w-4 md:h-4" />
                                Carta
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="classificacao" className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
                            <Card className="glass overflow-hidden">
                                <CardContent className="p-0 flex flex-col">
                                    {/* USCS */}
                                    <div className="flex-1 p-6 flex flex-col items-center justify-center text-center relative">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="w-3 h-3 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]"></span>
                                            <span className="text-xs font-bold tracking-widest uppercase text-muted-foreground/80">Sistema USCS</span>
                                        </div>

                                        {results?.classificacao_uscs ? (
                                            <>
                                                <h3 className="text-6xl font-black tracking-tighter text-blue-600 dark:text-blue-500 my-2 drop-shadow-sm leading-none tabular-nums">
                                                    {results.classificacao_uscs}
                                                </h3>
                                                <p className="text-base font-medium text-foreground/80 max-w-[85%] leading-relaxed">
                                                    {results.descricao_uscs}
                                                </p>
                                            </>
                                        ) : (
                                            <span className="text-muted-foreground italic text-sm my-4">—</span>
                                        )}
                                    </div>

                                    <Separator className="bg-border/30 w-[90%] mx-auto" />

                                    {/* HRB */}
                                    <div className="flex-1 p-6 flex flex-col items-center justify-center text-center relative">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="w-3 h-3 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.5)]"></span>
                                            <span className="text-xs font-bold tracking-widest uppercase text-muted-foreground/80">Sistema AASHTO (HRB)</span>
                                        </div>

                                        {results?.classificacao_hrb ? (
                                            <>
                                                <div className="flex items-center justify-center gap-4 my-2">
                                                    <h3 className="text-6xl font-black tracking-tighter text-foreground leading-none tabular-nums">
                                                        {results.subgrupo_hrb ? `${results.grupo_hrb}-${results.subgrupo_hrb}` : results.grupo_hrb}
                                                    </h3>
                                                    {results.indice_grupo_hrb !== undefined && (
                                                        <div className="flex flex-col items-center justify-center bg-muted/50 px-3 py-2 rounded-xl border border-border/40 backdrop-blur-sm">
                                                            <span className="text-[10px] uppercase font-bold text-muted-foreground leading-none mb-1 tracking-wider opacity-70">IG</span>
                                                            <span className="text-2xl font-bold leading-none tabular-nums">{results.indice_grupo_hrb}</span>
                                                        </div>
                                                    )}
                                                </div>
                                                <p className="text-base font-medium text-foreground/80 max-w-[90%] leading-relaxed mb-2">
                                                    {results.descricao_hrb}
                                                </p>
                                                {results.avaliacao_subleito_hrb && (
                                                    <Badge variant="outline" className="mt-2 font-normal text-xs text-muted-foreground border-border/30 py-0.5 px-3 bg-background/30">
                                                        Subleito: {results.avaliacao_subleito_hrb}
                                                    </Badge>
                                                )}
                                            </>
                                        ) : (
                                            <span className="text-muted-foreground italic text-sm my-4">—</span>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="carta" className="mt-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
                            <Card className="glass">
                                <CardContent className="pt-6">
                                    {(formData.ll && formData.lp) ? (
                                        <div className="space-y-4">
                                            <PlasticityChart
                                                ll={formData.ll ? parseFloat(formData.ll) : null}
                                                ip={(formData.ll && formData.lp)
                                                    ? parseFloat(formData.ll) - parseFloat(formData.lp)
                                                    : null}
                                            />
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground/60 bg-muted/10 rounded-lg border border-dashed border-border/50">
                                            <Activity className="w-12 h-12 mb-4 opacity-30" />
                                            <p className="text-base font-medium mb-1">Carta de Plasticidade indisponível</p>
                                            <p className="text-sm">Defina os Limites de Liquidez e Plasticidade para visualizar.</p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        </div>
    );
}
