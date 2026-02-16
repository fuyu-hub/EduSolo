import { useState, useEffect } from "react";
import { Helmet } from 'react-helmet-async';
import { Database, Info, Activity, AlertCircle, Droplet } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "@/components/ui/sonner";
import { Separator } from "@/components/ui/separator";
import { Trash2 } from "lucide-react";
import PrintHeader from "@/components/PrintHeader";
import PlasticityChart from "@/components/visualizations/PlasticityChart";
import { UI_STANDARDS } from "@/lib/ui-standards";
import { cn } from "@/lib/utils";
import {
    calcularClassificacaoPorPorcentagem,
    type ClassificacaoPorcentagemInput,
    type ClassificacaoPorcentagemOutput,
} from "@/modules/granulometria-teste/calculations-porcentagem";
import DialogExemplos from "@/modules/granulometria-teste/components/DialogExemplos";
import type { ExemploGranulometriaTeste } from "@/lib/exemplos-granulometria-teste";

// Campos de fração com labels e tooltips
const FRACOES = [
    { key: "pedregulho", label: "Pedregulho", tooltip: "Fração retida na peneira Nº 4 (> 4.8 mm)", color: "#CC4F44" },
    { key: "areia_grossa", label: "Areia Grossa", tooltip: "Fração entre peneiras Nº 4 e Nº 10 (2.0 - 4.8 mm)", color: "#FF8C00" },
    { key: "areia_media", label: "Areia Média", tooltip: "Fração entre peneiras Nº 10 e Nº 40 (0.42 - 2.0 mm)", color: "#FFD700" },
    { key: "areia_fina", label: "Areia Fina", tooltip: "Fração entre peneiras Nº 40 e Nº 200 (0.075 - 0.42 mm)", color: "#4682B4" },
    { key: "silte", label: "Silte", tooltip: "Fração entre 0.002 e 0.075 mm", color: "#4169E1" },
    { key: "argila", label: "Argila", tooltip: "Fração menor que 0.002 mm", color: "#00008B" },
] as const;

type FracaoKey = typeof FRACOES[number]["key"];

// Tooltips para os parâmetros complementares
const tooltips = {
    pass_p10: "Percentual que passa na peneira Nº 10 (2.0 mm). Se não informado, será derivado das frações.",
    pass_p40: "Percentual que passa na peneira Nº 40 (0.42 mm). Se não informado, será derivado das frações.",
    pass_p200: "Percentual que passa na peneira Nº 200 (0.075 mm). Se não informado, será derivado das frações.",
    d10: "Diâmetro efetivo correspondente a 10% de passante na curva granulométrica (mm).",
    d30: "Diâmetro correspondente a 30% de passante na curva granulométrica (mm).",
    d60: "Diâmetro correspondente a 60% de passante na curva granulométrica (mm).",
    ll: "Limite de Liquidez: teor de umidade no qual o solo passa do estado plástico para o líquido (%).",
    lp: "Limite de Plasticidade: teor de umidade no qual o solo passa do estado semi-sólido para o plástico (%).",
};

interface FormData {
    pedregulho: string;
    areia_grossa: string;
    areia_media: string;
    areia_fina: string;
    silte: string;
    argila: string;
    // Parâmetros de Caracterização
    pass_p10: string;
    pass_p40: string;
    pass_p200: string;
    d10: string;
    d30: string;
    d60: string;
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
    pass_p10: "",
    pass_p40: "",
    pass_p200: "",
    d10: "",
    d30: "",
    d60: "",
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

    const handleSelectExample = (exemplo: ExemploGranulometriaTeste) => {
        setFormData({
            pedregulho: exemplo.fracoes.pedregulho,
            areia_grossa: exemplo.fracoes.areia_grossa,
            areia_media: exemplo.fracoes.areia_media,
            areia_fina: exemplo.fracoes.areia_fina,
            silte: exemplo.fracoes.silte,
            argila: exemplo.fracoes.argila,
            pass_p10: exemplo.parametros.pass_p10,
            pass_p40: exemplo.parametros.pass_p40,
            pass_p200: exemplo.parametros.pass_p200,
            d10: exemplo.parametros.d10,
            d30: exemplo.parametros.d30,
            d60: exemplo.parametros.d60,
            ll: exemplo.parametros.ll,
            lp: exemplo.parametros.lp,
        });
        toast.success(`Exemplo "${exemplo.nome}" carregado!`);
    };

    // Helper para converter string com virgula ou ponto
    const parseValue = (val: string): number => {
        return parseFloat(val.replace(',', '.'));
    };

    // Calcular soma das frações
    const somaFracoes = FRACOES.reduce((sum, f) => {
        const val = parseValue(formData[f.key]);
        return sum + (isNaN(val) ? 0 : val);
    }, 0);

    const somaValida = Math.abs(somaFracoes - 100) <= 1.0;
    const temFracoes = FRACOES.some((f) => formData[f.key] !== "");

    // Auto-calculate
    useEffect(() => {
        // Precisa de pelo menos 2 frações preenchidas e soma válida
        const fracoesPreenchidas = FRACOES.filter((f) => formData[f.key] !== "" && !isNaN(parseValue(formData[f.key])));
        if (fracoesPreenchidas.length < 2) {
            setResults(null);
            return;
        }

        if (!somaValida && temFracoes) {
            setResults(null);
            return;
        }

        const input: ClassificacaoPorcentagemInput = {
            pedregulho: parseValue(formData.pedregulho) || 0,
            areia_grossa: parseValue(formData.areia_grossa) || 0,
            areia_media: parseValue(formData.areia_media) || 0,
            areia_fina: parseValue(formData.areia_fina) || 0,
            silte: parseValue(formData.silte) || 0,
            argila: parseValue(formData.argila) || 0,
            pass_peneira_10: formData.pass_p10 ? parseValue(formData.pass_p10) : undefined,
            pass_peneira_40: formData.pass_p40 ? parseValue(formData.pass_p40) : undefined,
            pass_peneira_200: formData.pass_p200 ? parseValue(formData.pass_p200) : undefined,
            d10: formData.d10 ? parseValue(formData.d10) : undefined,
            d30: formData.d30 ? parseValue(formData.d30) : undefined,
            d60: formData.d60 ? parseValue(formData.d60) : undefined,
            ll: formData.ll ? parseValue(formData.ll) : undefined,
            lp: formData.lp ? parseValue(formData.lp) : undefined,
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
            valor: parseValue(formData[f.key]) || 0,
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
                            className="h-full transition-all duration-300"
                            style={{
                                width: `${(f.valor / Math.max(somaFracoes, 100)) * 100}%`,
                                backgroundColor: f.color
                            }}
                            title={`${f.label}: ${f.valor}%`}
                        />
                    ))}
                </div>
                <div className="flex flex-wrap gap-x-3 gap-y-1">
                    {valores.map((f) => (
                        <div key={f.key} className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: f.color }} />
                            <span>{f.label}: {f.valor}%</span>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <div className={UI_STANDARDS.pageContainer}>
            <Helmet>
                <title>Classificação Granulométrica | EduSolos</title>
                <meta name="description" content="Classifique solos pelos sistemas USCS e AASHTO (HRB) informando apenas as frações granulométricas e limites de consistência. Simples e rápido." />
            </Helmet>
            <PrintHeader moduleTitle="Classificação Granulométrica" moduleName="granulometria" />

            <div className={UI_STANDARDS.header.container}>
                <div className="flex items-center gap-3">
                    <div className={UI_STANDARDS.header.iconContainer}>
                        <Database className={UI_STANDARDS.header.icon} />
                    </div>
                    <div>
                        <h1 className={UI_STANDARDS.header.title}>Classificação Granulométrica</h1>
                        <p className={UI_STANDARDS.header.subtitle}>Classificação de Solos pelos Sistemas USCS e AASHTO</p>
                    </div>
                </div>

                <div className={UI_STANDARDS.header.actionsContainer}>
                    <Separator orientation="vertical" className="h-6 mx-1 bg-border" />
                    <DialogExemplos
                        onSelectExample={handleSelectExample}
                        currentFormData={formData}
                    />
                    <Separator orientation="vertical" className="h-6 mx-1 bg-border" />
                    <Button variant="ghost" size="sm" onClick={handleClear} className="text-muted-foreground hover:text-destructive gap-1.5">
                        <Trash2 className="w-4 h-4" />
                        Limpar
                    </Button>
                </div>
            </div>

            <div className={UI_STANDARDS.mainGrid}>
                {/* Formulário */}
                <div className="space-y-4 animate-in slide-in-from-left-5 duration-300">
                    {/* Card: Frações Granulométricas */}
                    <Card className="glass border-primary/20">
                        <CardHeader className="pb-3 bg-gradient-to-r from-primary/5 to-transparent">
                            <CardTitle className="flex items-center gap-2 text-base">
                                <Database className="w-5 h-5 text-primary" />
                                Frações Granulométricas (%)
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 pt-3">
                            <div className="space-y-4">
                                {/* Linha Superior: Pedregulho, Areia Grossa, Areia Média */}
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                    {FRACOES.slice(0, 3).map((fracao) => (
                                        <div key={fracao.key} className="space-y-1.5">
                                            <div className="flex items-center h-5">
                                                <Label htmlFor={fracao.key} className="text-xs flex items-center gap-1">
                                                    {fracao.label} (%)
                                                    <TooltipProvider>
                                                        <Tooltip>
                                                            <TooltipTrigger><Info className="w-3 h-3 text-muted-foreground/50 hover:text-muted-foreground cursor-help" /></TooltipTrigger>
                                                            <TooltipContent><p className="max-w-xs text-xs">{fracao.tooltip}</p></TooltipContent>
                                                        </Tooltip>
                                                    </TooltipProvider>
                                                </Label>
                                            </div>
                                            <Input
                                                id={fracao.key}
                                                placeholder="0.0"
                                                value={formData[fracao.key]}
                                                onChange={(e) => handleInputChange(fracao.key, e.target.value)}
                                                className="h-9"
                                            />
                                        </div>
                                    ))}
                                </div>

                                {/* Linha Inferior: Areia Fina, Silte, Argila */}
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                    {FRACOES.slice(3).map((fracao) => (
                                        <div key={fracao.key} className="space-y-1.5">
                                            <div className="flex items-center h-5">
                                                <Label htmlFor={fracao.key} className="text-xs flex items-center gap-1">
                                                    {fracao.label} (%)
                                                    <TooltipProvider>
                                                        <Tooltip>
                                                            <TooltipTrigger><Info className="w-3 h-3 text-muted-foreground/50 hover:text-muted-foreground cursor-help" /></TooltipTrigger>
                                                            <TooltipContent><p className="max-w-xs text-xs">{fracao.tooltip}</p></TooltipContent>
                                                        </Tooltip>
                                                    </TooltipProvider>
                                                </Label>
                                            </div>
                                            <Input
                                                id={fracao.key}
                                                placeholder="0.0"
                                                value={formData[fracao.key]}
                                                onChange={(e) => handleInputChange(fracao.key, e.target.value)}
                                                className="h-9"
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <Separator className="!my-3 opacity-50" />

                            {/* Soma e barra */}
                            {renderCompositionBar()}

                            {temFracoes && !somaValida && (
                                <p className="text-xs text-red-500/90 flex items-start gap-1.5 mt-2 font-medium">
                                    <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                                    Atenção: A soma das frações deve ser 100%. Soma atual: {somaFracoes.toFixed(1)}%
                                </p>
                            )}
                        </CardContent>
                    </Card>

                    {/* Card: Parâmetros Complementares */}
                    <Card className="glass border-blue-500/20">
                        <CardHeader className="pb-3 bg-gradient-to-r from-blue-500/5 to-transparent">
                            <CardTitle className="flex items-center gap-2 text-base">
                                <Droplet className="w-5 h-5 text-blue-500" />
                                Parâmetros Complementares
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 pt-3">
                            {/* Percentuais Passantes */}
                            <div>
                                <Label className="text-sm font-medium">Percentuais Passantes (%)</Label>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-2">
                                    <div className="space-y-1.5">
                                        <div className="flex items-center h-5">
                                            <Label htmlFor="pass_p10" className="text-xs flex items-center gap-1">
                                                Passante #10 (%)
                                                <TooltipProvider>
                                                    <Tooltip>
                                                        <TooltipTrigger><Info className="w-3 h-3 text-muted-foreground/50 hover:text-muted-foreground cursor-help" /></TooltipTrigger>
                                                        <TooltipContent><p className="max-w-xs text-xs">{tooltips.pass_p10}</p></TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>
                                            </Label>
                                        </div>
                                        <Input id="pass_p10" placeholder="—" value={formData.pass_p10} onChange={(e) => handleInputChange("pass_p10", e.target.value)} className="h-9" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <div className="flex items-center h-5">
                                            <Label htmlFor="pass_p40" className="text-xs flex items-center gap-1">
                                                Passante #40 (%)
                                                <TooltipProvider>
                                                    <Tooltip>
                                                        <TooltipTrigger><Info className="w-3 h-3 text-muted-foreground/50 hover:text-muted-foreground cursor-help" /></TooltipTrigger>
                                                        <TooltipContent><p className="max-w-xs text-xs">{tooltips.pass_p40}</p></TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>
                                            </Label>
                                        </div>
                                        <Input id="pass_p40" placeholder="—" value={formData.pass_p40} onChange={(e) => handleInputChange("pass_p40", e.target.value)} className="h-9" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <div className="flex items-center h-5">
                                            <Label htmlFor="pass_p200" className="text-xs flex items-center gap-1">
                                                Passante #200 (%)
                                                <TooltipProvider>
                                                    <Tooltip>
                                                        <TooltipTrigger><Info className="w-3 h-3 text-muted-foreground/50 hover:text-muted-foreground cursor-help" /></TooltipTrigger>
                                                        <TooltipContent><p className="max-w-xs text-xs">{tooltips.pass_p200}</p></TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>
                                            </Label>
                                        </div>
                                        <Input id="pass_p200" placeholder="—" value={formData.pass_p200} onChange={(e) => handleInputChange("pass_p200", e.target.value)} className="h-9" />
                                    </div>
                                </div>
                            </div>

                            <Separator />

                            {/* Diâmetros Característicos */}
                            <div>
                                <Label className="text-sm font-medium">Diâmetros Característicos (mm)</Label>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-2">
                                    <div className="space-y-1.5">
                                        <div className="flex items-center h-5">
                                            <Label htmlFor="d10" className="text-xs flex items-center gap-1">
                                                D10 (mm)
                                                <TooltipProvider>
                                                    <Tooltip>
                                                        <TooltipTrigger><Info className="w-3 h-3 text-muted-foreground/50 hover:text-muted-foreground cursor-help" /></TooltipTrigger>
                                                        <TooltipContent><p className="max-w-xs text-xs">{tooltips.d10}</p></TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>
                                            </Label>
                                        </div>
                                        <Input id="d10" placeholder="0.000" value={formData.d10} onChange={(e) => handleInputChange("d10", e.target.value)} className="h-9" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <div className="flex items-center h-5">
                                            <Label htmlFor="d30" className="text-xs flex items-center gap-1">
                                                D30 (mm)
                                                <TooltipProvider>
                                                    <Tooltip>
                                                        <TooltipTrigger><Info className="w-3 h-3 text-muted-foreground/50 hover:text-muted-foreground cursor-help" /></TooltipTrigger>
                                                        <TooltipContent><p className="max-w-xs text-xs">{tooltips.d30}</p></TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>
                                            </Label>
                                        </div>
                                        <Input id="d30" placeholder="0.000" value={formData.d30} onChange={(e) => handleInputChange("d30", e.target.value)} className="h-9" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <div className="flex items-center h-5">
                                            <Label htmlFor="d60" className="text-xs flex items-center gap-1">
                                                D60 (mm)
                                                <TooltipProvider>
                                                    <Tooltip>
                                                        <TooltipTrigger><Info className="w-3 h-3 text-muted-foreground/50 hover:text-muted-foreground cursor-help" /></TooltipTrigger>
                                                        <TooltipContent><p className="max-w-xs text-xs">{tooltips.d60}</p></TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>
                                            </Label>
                                        </div>
                                        <Input id="d60" placeholder="0.000" value={formData.d60} onChange={(e) => handleInputChange("d60", e.target.value)} className="h-9" />
                                    </div>
                                </div>
                            </div>

                            <Separator />

                            {/* Limites de Consistência */}
                            <div>
                                <Label className="text-sm font-medium">Limites de Consistência (%)</Label>
                                <div className="grid grid-cols-2 gap-4 mt-2">
                                    <div className="space-y-1.5">
                                        <div className="flex items-center h-5">
                                            <Label htmlFor="ll" className="text-xs flex items-center gap-1">
                                                Limite de Liquidez (LL)
                                                <TooltipProvider>
                                                    <Tooltip>
                                                        <TooltipTrigger><Info className="w-3 h-3 text-muted-foreground/50 hover:text-muted-foreground cursor-help" /></TooltipTrigger>
                                                        <TooltipContent><p className="max-w-xs text-xs">{tooltips.ll}</p></TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>
                                            </Label>
                                        </div>
                                        <Input id="ll" placeholder="Ex: 45" value={formData.ll} onChange={(e) => handleInputChange("ll", e.target.value)} className="h-9" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <div className="flex items-center h-5">
                                            <Label htmlFor="lp" className="text-xs flex items-center gap-1">
                                                Limite de Plasticidade (LP)
                                                <TooltipProvider>
                                                    <Tooltip>
                                                        <TooltipTrigger><Info className="w-3 h-3 text-muted-foreground/50 hover:text-muted-foreground cursor-help" /></TooltipTrigger>
                                                        <TooltipContent><p className="max-w-xs text-xs">{tooltips.lp}</p></TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>
                                            </Label>
                                        </div>
                                        <Input id="lp" placeholder="Ex: 25" value={formData.lp} onChange={(e) => handleInputChange("lp", e.target.value)} className="h-9" />
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Resultados */}
                <div className="space-y-4 animate-in slide-in-from-right-5 duration-300 sticky top-4 self-start">
                    {/* Card: Classificação */}
                    <Card className="glass">
                        <CardContent className="p-0">
                            <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-border">
                                {/* USCS */}
                                <div className="p-4 flex flex-col">
                                    <h4 className="font-semibold text-xs flex items-center gap-2 text-blue-500 mb-3 uppercase tracking-wider">
                                        <span className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_6px_rgba(59,130,246,0.4)]"></span>
                                        Classificação Unificada (USCS)
                                    </h4>
                                    {results?.classificacao_uscs ? (
                                        <div className="flex flex-col flex-1">
                                            <div className="flex items-center gap-3 h-10 mb-1">
                                                <span className="text-3xl font-black tracking-tight text-blue-600 dark:text-blue-500 tabular-nums leading-tight">
                                                    {results.classificacao_uscs}
                                                </span>
                                            </div>
                                            <p className="text-sm text-foreground/70 leading-relaxed">
                                                {results.descricao_uscs}
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="flex items-center h-10">
                                            <span className="text-muted-foreground text-lg">—</span>
                                        </div>
                                    )}
                                </div>

                                {/* HRB */}
                                <div className="p-4 flex flex-col">
                                    <h4 className="font-semibold text-xs flex items-center gap-2 text-orange-500 mb-3 uppercase tracking-wider">
                                        <span className="w-2 h-2 rounded-full bg-orange-500 shadow-[0_0_6px_rgba(249,115,22,0.4)]"></span>
                                        Classificação AASHTO (HRB)
                                    </h4>
                                    {results?.classificacao_hrb ? (
                                        <div className="flex flex-col flex-1">
                                            <div className="flex items-center gap-3 h-10 mb-1">
                                                <span className="text-3xl font-black tracking-tight text-foreground tabular-nums leading-tight">
                                                    {results.subgrupo_hrb ? `${results.grupo_hrb}-${results.subgrupo_hrb}` : results.grupo_hrb}
                                                </span>
                                                {results.indice_grupo_hrb !== undefined && (
                                                    <div className="flex items-center gap-1.5 bg-muted/50 px-2 py-0.5 rounded-md border border-border/40">
                                                        <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider opacity-70">IG</span>
                                                        <span className="text-base font-bold tabular-nums">{results.indice_grupo_hrb}</span>
                                                    </div>
                                                )}
                                            </div>
                                            <p className="text-sm text-foreground/70 leading-relaxed mb-3">
                                                {results.descricao_hrb}
                                            </p>
                                            <div className="mt-auto">
                                                {results.avaliacao_subleito_hrb && (
                                                    <Badge variant="outline" className="font-medium text-[10px] uppercase text-muted-foreground border-border/30 py-0 px-2 bg-background/30">
                                                        Subleito: {results.avaliacao_subleito_hrb}
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex items-center h-10">
                                            <span className="text-muted-foreground text-lg">—</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Card: Carta de Plasticidade */}
                    <Card className="glass">
                        <CardHeader className="pb-3">
                            <CardTitle className="flex items-center gap-2 text-base">
                                <Activity className="w-5 h-5 text-primary" />
                                Carta de Plasticidade
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0">
                            {(formData.ll && formData.lp) ? (
                                <PlasticityChart
                                    ll={formData.ll ? parseValue(formData.ll) : null}
                                    ip={(formData.ll && formData.lp)
                                        ? parseValue(formData.ll) - parseValue(formData.lp)
                                        : null}
                                />
                            ) : (
                                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground/60 bg-muted/10 rounded-lg border border-dashed border-border/50">
                                    <Activity className="w-12 h-12 mb-4 opacity-30" />
                                    <p className="text-base font-medium mb-1">Carta de Plasticidade indisponível</p>
                                    <p className="text-sm">Defina os Limites de Liquidez e Plasticidade para visualizar.</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                <PrintHeader moduleTitle="Classificação Granulométrica" moduleName="granulometria" />
            </div>
        </div>
    );
}
