// frontend/src/modules/caracterizacao/index.tsx
import { useState, useRef } from "react";
import { Beaker, Calculator, RefreshCw, Trash2, Plus, GraduationCap, Download, Droplet, AlertCircle, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

import { LabModeSwitch } from "./components/LabModeSwitch";
import { useCaracterizacaoStore } from "./store";
import { calcularIndicesFisicosMultiplasAmostras } from "@/lib/calculations/indices-fisicos";
import { calcularLimitesConsistencia } from "@/lib/calculations/limites-consistencia";
import { CaracterizacaoOutput } from "./types";
import DiagramaFases from "@/components/visualizations/DiagramaFases";
import LimiteLiquidezChart from "@/components/limites/LimiteLiquidezChart";
import { exportToPDF, ExportData, formatNumberForExport, generateDefaultPDFFileName } from "@/lib/export-utils";

// Tooltips
const tooltips = {
    massaUmida: "Massa total da amostra de solo incluindo a água (g)",
    massaSeca: "Massa da amostra após secagem em estufa (g)",
    volume: "Volume total da amostra incluindo vazios (cm³)",
    Gs: "Densidade dos grãos (adimensional, ex: 2.65). Necessário para calcular todos os índices físicos.",
};

// Dados de exemplo
const exemploArgilaMole = {
    nome: "Argila Mole (Exemplo)",
    indices: { massaUmida: "180.5", massaSeca: "150.2", volume: "100" },
    settings: { Gs: "2.70", pesoEspecificoAgua: "10.0" },
    limites: {
        pontosLL: [
            { numGolpes: "35", massaUmidaRecipiente: "28.5", massaSecaRecipiente: "22.1", massaRecipiente: "10.0" },
            { numGolpes: "25", massaUmidaRecipiente: "30.2", massaSecaRecipiente: "23.0", massaRecipiente: "10.0" },
            { numGolpes: "18", massaUmidaRecipiente: "32.8", massaSecaRecipiente: "24.5", massaRecipiente: "10.0" },
        ],
        pontosLP: [{ massaUmidaRecipiente: "15.2", massaSecaRecipiente: "13.8", massaRecipiente: "5.0" }],
        umidadeNatural: "20.2",
        percentualArgila: "45",
    },
};

const generateId = () => `${Date.now()}-${Math.random()}`;

export default function CaracterizacaoPage() {
    const {
        amostras, currentAmostraIndex, addAmostra, setCurrentAmostra, removeAmostra,
        settings, updateSettings, updateIndices, updateLimites,
        results, setResult, clearResults
    } = useCaracterizacaoStore();

    const currentAmostra = amostras[currentAmostraIndex];
    const resultado = results[currentAmostra.id];

    const [isCalculating, setIsCalculating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isExportingPDF, setIsExportingPDF] = useState(false);

    // Refs for charts
    const limiteLiquidezChartRef = useRef<HTMLDivElement>(null);

    // Handler para Calcular
    const handleCalculate = async () => {
        setIsCalculating(true);
        setError(null);

        try {
            // 1. Calcular Indices Físicos
            const inputIndices = {
                peso_total: parseFloat(currentAmostra.indices.massaUmida),
                peso_solido: parseFloat(currentAmostra.indices.massaSeca),
                volume_total: currentAmostra.indices.volume ? parseFloat(currentAmostra.indices.volume) : undefined,
                Gs: parseFloat(settings.Gs),
                peso_especifico_agua: parseFloat(settings.pesoEspecificoAgua),
            };

            const resIndices = calcularIndicesFisicosMultiplasAmostras([inputIndices]);

            // 2. Calcular Limites
            let resLimites: any = {};
            const pontosLL = currentAmostra.limites.pontosLL.map(p => ({
                num_golpes: parseInt(p.numGolpes),
                massa_umida_recipiente: parseFloat(p.massaUmidaRecipiente),
                massa_seca_recipiente: parseFloat(p.massaSecaRecipiente),
                massa_recipiente: parseFloat(p.massaRecipiente)
            })).filter(p => !isNaN(p.num_golpes) && !isNaN(p.massa_umida_recipiente));

            const pontosLP = currentAmostra.limites.pontosLP.map(p => ({
                massa_umida_recipiente: parseFloat(p.massaUmidaRecipiente),
                massa_seca_recipiente: parseFloat(p.massaSecaRecipiente),
                massa_recipiente: parseFloat(p.massaRecipiente)
            })).filter(p => !isNaN(p.massa_umida_recipiente));

            if (pontosLL.length >= 2 || pontosLP.length >= 1) {
                resLimites = calcularLimitesConsistencia({
                    pontos_ll: pontosLL,
                    pontos_lp: pontosLP,
                    umidade_natural: currentAmostra.limites.umidadeNatural ? parseFloat(currentAmostra.limites.umidadeNatural) : undefined,
                    percentual_argila: currentAmostra.limites.percentualArgila ? parseFloat(currentAmostra.limites.percentualArgila) : undefined
                });
            }

            // 3. Unificar Resultados
            const combinedResult: CaracterizacaoOutput = {
                w: resIndices.umidade,
                gamma_nat: resIndices.peso_especifico_natural,
                gamma_d: resIndices.peso_especifico_seco,
                e: resIndices.indice_vazios,
                n: resIndices.porosidade,
                Sr: resIndices.grau_saturacao,
                gamma_sat: resIndices.peso_especifico_saturado,
                // Volume data for Diagrama de Fases
                volume_solidos_calc: resIndices.volume_solidos_calc,
                volume_agua_calc: resIndices.volume_agua_calc,
                volume_ar_calc: resIndices.volume_ar_calc,
                volume_total_calc: resIndices.volume_total_calc,
                massa_solidos_calc: resIndices.massa_solidos_calc,
                massa_agua_calc: resIndices.massa_agua_calc,
                massa_total_calc: resIndices.massa_total_calc,
                // Limites
                ll: resLimites.ll,
                lp: resLimites.lp,
                ip: resLimites.ip,
                ic: resLimites.ic,
                atividade: resLimites.atividade_argila,
                classificacao_plasticidade: resLimites.classificacao_plasticidade,
                classificacao_consistencia: resLimites.classificacao_consistencia,
                classificacao_atividade: resLimites.classificacao_atividade,
                pontos_grafico_ll: resLimites.pontos_grafico_ll,
                erro: resIndices.erro || resLimites.erro
            };

            setResult(currentAmostra.id, combinedResult);
            if (!combinedResult.erro) {
                toast.success("Cálculos realizados com sucesso!");
            } else {
                toast.error(combinedResult.erro);
            }

        } catch (err) {
            console.error(err);
            const msg = err instanceof Error ? err.message : "Erro ao calcular.";
            setError(msg);
            toast.error(msg);
        } finally {
            setIsCalculating(false);
        }
    };

    // Limpar Campos
    const handleClear = () => {
        updateIndices(currentAmostraIndex, { massaUmida: "", massaSeca: "", volume: "" });
        updateSettings({ Gs: "", pesoEspecificoAgua: "10.0", indice_vazios_max: "", indice_vazios_min: "" });
        updateLimites(currentAmostraIndex, {
            pontosLL: [
                { id: generateId(), numGolpes: "", massaUmidaRecipiente: "", massaSecaRecipiente: "", massaRecipiente: "" },
                { id: generateId(), numGolpes: "", massaUmidaRecipiente: "", massaSecaRecipiente: "", massaRecipiente: "" }
            ],
            pontosLP: [{ id: generateId(), massaUmidaRecipiente: "", massaSecaRecipiente: "", massaRecipiente: "" }],
            umidadeNatural: "",
            percentualArgila: ""
        });
        clearResults();
        setError(null);
        toast.info("Campos limpos!");
    };

    // Carregar Exemplo
    const handleLoadExample = () => {
        updateIndices(currentAmostraIndex, exemploArgilaMole.indices);
        updateSettings(exemploArgilaMole.settings);
        updateLimites(currentAmostraIndex, {
            pontosLL: exemploArgilaMole.limites.pontosLL.map(p => ({ ...p, id: generateId() })),
            pontosLP: exemploArgilaMole.limites.pontosLP.map(p => ({ ...p, id: generateId() })),
            umidadeNatural: exemploArgilaMole.limites.umidadeNatural,
            percentualArgila: exemploArgilaMole.limites.percentualArgila,
        });
        toast.success(`🧱 ${exemploArgilaMole.nome} carregado!`);
    };

    // PDF Export
    const handleExportPDF = async () => {
        if (!resultado || resultado.erro) {
            toast.error("Calcule os resultados antes de exportar.");
            return;
        }

        setIsExportingPDF(true);
        try {
            const inputs: { label: string; value: string }[] = [
                { label: "Massa Úmida", value: `${currentAmostra.indices.massaUmida} g` },
                { label: "Massa Seca", value: `${currentAmostra.indices.massaSeca} g` },
                { label: "Volume", value: `${currentAmostra.indices.volume || '-'} cm³` },
                { label: "Gs", value: settings.Gs },
            ];

            const resultsList: { label: string; value: string; highlight?: boolean }[] = [];
            if (resultado.w != null) resultsList.push({ label: "Umidade (w)", value: `${formatNumberForExport(resultado.w)}%` });
            if (resultado.gamma_nat != null) resultsList.push({ label: "γ natural", value: `${formatNumberForExport(resultado.gamma_nat)} kN/m³` });
            if (resultado.gamma_d != null) resultsList.push({ label: "γ seco", value: `${formatNumberForExport(resultado.gamma_d)} kN/m³` });
            if (resultado.e != null) resultsList.push({ label: "Índice de Vazios (e)", value: formatNumberForExport(resultado.e, 3) });
            if (resultado.n != null) resultsList.push({ label: "Porosidade (n)", value: `${formatNumberForExport(resultado.n)}%` });
            if (resultado.Sr != null) resultsList.push({ label: "Saturação (Sr)", value: `${formatNumberForExport(resultado.Sr)}%` });
            if (resultado.ll != null) resultsList.push({ label: "Limite de Liquidez (LL)", value: `${formatNumberForExport(resultado.ll)}%` });
            if (resultado.lp != null) resultsList.push({ label: "Limite de Plasticidade (LP)", value: `${formatNumberForExport(resultado.lp)}%` });
            if (resultado.ip != null) resultsList.push({ label: "Índice de Plasticidade (IP)", value: `${formatNumberForExport(resultado.ip)}%`, highlight: true });
            if (resultado.classificacao_plasticidade) resultsList.push({ label: "Classificação Plasticidade", value: resultado.classificacao_plasticidade });
            if (resultado.classificacao_consistencia) resultsList.push({ label: "Classificação Consistência", value: resultado.classificacao_consistencia });

            const exportData: ExportData = {
                moduleName: "caracterizacao",
                moduleTitle: "Caracterização Física do Solo",
                inputs,
                results: resultsList,
            };

            const fileName = generateDefaultPDFFileName("Caracterização Física");
            await exportToPDF(exportData, false);
            toast.success("PDF salvo com sucesso!");

        } catch (err) {
            console.error(err);
            toast.error("Erro ao exportar PDF.");
        } finally {
            setIsExportingPDF(false);
        }
    };

    // Handlers para atualizar pontos LL
    const handleUpdateLL = (idx: number, field: string, value: string) => {
        const newPontos = [...currentAmostra.limites.pontosLL];
        newPontos[idx] = { ...newPontos[idx], [field]: value };
        updateLimites(currentAmostraIndex, { pontosLL: newPontos });
    };

    const addPontoLL = () => {
        updateLimites(currentAmostraIndex, {
            pontosLL: [...currentAmostra.limites.pontosLL, { id: generateId(), numGolpes: "", massaUmidaRecipiente: "", massaSecaRecipiente: "", massaRecipiente: "" }]
        });
    };

    const removePontoLL = (index: number) => {
        if (currentAmostra.limites.pontosLL.length <= 2) return;
        const newPontos = currentAmostra.limites.pontosLL.filter((_, i) => i !== index);
        updateLimites(currentAmostraIndex, { pontosLL: newPontos });
    };

    // Handlers para LP
    const handleUpdateLP = (idx: number, field: string, value: string) => {
        const newPontos = [...currentAmostra.limites.pontosLP];
        newPontos[idx] = { ...newPontos[idx], [field]: value };
        updateLimites(currentAmostraIndex, { pontosLP: newPontos });
    };

    return (
        <div className="container mx-auto p-4 md:p-6 space-y-5 max-w-7xl animate-in fade-in duration-500">

            {/* Header com Ações */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4" data-tour="module-header">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
                        <Beaker className="w-7 h-7 text-primary" />
                        Caracterização Física
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">Índices Físicos e Limites de Consistência</p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                    <LabModeSwitch />
                    <Button variant="outline" size="sm" onClick={handleLoadExample} className="gap-1.5">
                        <GraduationCap className="w-4 h-4" />
                        Exemplo
                    </Button>
                    <Button variant="ghost" size="sm" onClick={handleClear} className="gap-1.5 text-muted-foreground">
                        <Trash2 className="w-4 h-4" />
                        Limpar
                    </Button>
                    <Separator orientation="vertical" className="h-6 mx-1" />
                    <Button size="sm" onClick={handleCalculate} disabled={isCalculating} className="gap-1.5 shadow-md">
                        {isCalculating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Calculator className="w-4 h-4" />}
                        Calcular
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleExportPDF} disabled={!resultado || isExportingPDF} className="gap-1.5">
                        <Download className="w-4 h-4" />
                        Salvar Resultado
                    </Button>
                </div>
            </div>

            {/* Barra de Amostras */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b">
                {amostras.map((amostra, idx) => (
                    <Badge
                        key={amostra.id}
                        variant={idx === currentAmostraIndex ? "default" : "outline"}
                        className={cn("cursor-pointer px-3 py-1.5 text-xs transition-all shrink-0", idx === currentAmostraIndex && "shadow-md")}
                        onClick={() => setCurrentAmostra(idx)}
                    >
                        {amostra.nome}
                    </Badge>
                ))}
                <Button variant="ghost" size="icon" onClick={addAmostra} className="h-7 w-7 shrink-0 rounded-full border border-dashed"><Plus className="w-3.5 h-3.5" /></Button>
                {amostras.length > 1 && (
                    <Button variant="ghost" size="icon" onClick={() => removeAmostra(currentAmostraIndex)} className="h-7 w-7 shrink-0 text-destructive hover:text-destructive/80"><Trash2 className="w-3.5 h-3.5" /></Button>
                )}
            </div>

            {error && <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertDescription>{error}</AlertDescription></Alert>}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

                {/* Coluna de Inputs */}
                <div className="lg:col-span-5 space-y-4">

                    {/* Card: Índices Físicos */}
                    <Card className="glass">
                        <CardHeader className="pb-3"><CardTitle className="flex items-center gap-2 text-base"><Beaker className="w-5 h-5 text-primary" />Dados de Índices Físicos</CardTitle></CardHeader>
                        <CardContent className="space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1"><Label htmlFor="Gs" className="text-xs flex items-center gap-1">Gs (Dens. Grãos)<TooltipProvider><Tooltip><TooltipTrigger><Info className="w-3 h-3 text-muted-foreground" /></TooltipTrigger><TooltipContent><p className="max-w-xs text-xs">{tooltips.Gs}</p></TooltipContent></Tooltip></TooltipProvider></Label><Input id="Gs" placeholder="Ex: 2.65" value={settings.Gs} onChange={(e) => updateSettings({ Gs: e.target.value })} className="h-9" /></div>
                                <div className="space-y-1"><Label htmlFor="massaUmida" className="text-xs">Massa Úmida (g)</Label><Input id="massaUmida" placeholder="0.00" value={currentAmostra.indices.massaUmida} onChange={(e) => updateIndices(currentAmostraIndex, { massaUmida: e.target.value })} className="h-9" /></div>
                                <div className="space-y-1"><Label htmlFor="massaSeca" className="text-xs">Massa Seca (g)</Label><Input id="massaSeca" placeholder="0.00" value={currentAmostra.indices.massaSeca} onChange={(e) => updateIndices(currentAmostraIndex, { massaSeca: e.target.value })} className="h-9" /></div>
                                <div className="space-y-1"><Label htmlFor="volume" className="text-xs">Volume (cm³)</Label><Input id="volume" placeholder="Ex: 100" value={currentAmostra.indices.volume || ""} onChange={(e) => updateIndices(currentAmostraIndex, { volume: e.target.value })} className="h-9" /></div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Card: Limites de Consistência */}
                    <Card className="glass">
                        <CardHeader className="pb-3"><CardTitle className="flex items-center gap-2 text-base"><Droplet className="w-5 h-5 text-blue-500" />Limites (LL e LP)</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            {/* Pontos LL */}
                            <div>
                                <div className="flex items-center justify-between mb-2"><Label className="text-sm font-medium">Limite de Liquidez (LL)</Label><Button size="sm" variant="ghost" onClick={addPontoLL} className="h-7 px-2 text-xs gap-1"><Plus className="w-3 h-3" /> Ponto</Button></div>
                                <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1">
                                    {currentAmostra.limites.pontosLL.map((ponto, i) => (
                                        <div key={ponto.id} className="grid grid-cols-[50px,1fr,1fr,1fr,auto] gap-1.5 items-end p-1.5 rounded border bg-muted/10 text-xs">
                                            <div><Label className="text-[9px]">Golpes</Label><Input className="h-7 text-xs px-1.5" placeholder="N" value={ponto.numGolpes} onChange={e => handleUpdateLL(i, 'numGolpes', e.target.value)} /></div>
                                            <div><Label className="text-[9px]">M.Ú+T</Label><Input className="h-7 text-xs px-1.5" placeholder="g" value={ponto.massaUmidaRecipiente} onChange={e => handleUpdateLL(i, 'massaUmidaRecipiente', e.target.value)} /></div>
                                            <div><Label className="text-[9px]">M.S+T</Label><Input className="h-7 text-xs px-1.5" placeholder="g" value={ponto.massaSecaRecipiente} onChange={e => handleUpdateLL(i, 'massaSecaRecipiente', e.target.value)} /></div>
                                            <div><Label className="text-[9px]">Tara</Label><Input className="h-7 text-xs px-1.5" placeholder="g" value={ponto.massaRecipiente} onChange={e => handleUpdateLL(i, 'massaRecipiente', e.target.value)} /></div>
                                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removePontoLL(i)} disabled={currentAmostra.limites.pontosLL.length <= 2}><Trash2 className="w-3.5 h-3.5" /></Button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <Separator />
                            {/* LP */}
                            <div>
                                <Label className="text-sm font-medium mb-2 block">Limite de Plasticidade (LP)</Label>
                                <div className="grid grid-cols-3 gap-2">
                                    <div><Label className="text-[9px]">M.Ú+T</Label><Input className="h-8 text-xs" placeholder="g" value={currentAmostra.limites.pontosLP[0]?.massaUmidaRecipiente || ""} onChange={e => handleUpdateLP(0, 'massaUmidaRecipiente', e.target.value)} /></div>
                                    <div><Label className="text-[9px]">M.S+T</Label><Input className="h-8 text-xs" placeholder="g" value={currentAmostra.limites.pontosLP[0]?.massaSecaRecipiente || ""} onChange={e => handleUpdateLP(0, 'massaSecaRecipiente', e.target.value)} /></div>
                                    <div><Label className="text-[9px]">Tara</Label><Input className="h-8 text-xs" placeholder="g" value={currentAmostra.limites.pontosLP[0]?.massaRecipiente || ""} onChange={e => handleUpdateLP(0, 'massaRecipiente', e.target.value)} /></div>
                                </div>
                            </div>
                            <Separator />
                            {/* Dados Adicionais */}
                            <div className="grid grid-cols-2 gap-3">
                                <div><Label htmlFor="umidadeNatural" className="text-xs">Umidade Nat. (%)</Label><Input id="umidadeNatural" placeholder="Opcional" value={currentAmostra.limites.umidadeNatural || ""} onChange={e => updateLimites(currentAmostraIndex, { umidadeNatural: e.target.value })} className="h-8" /></div>
                                <div><Label htmlFor="argila" className="text-xs">Argila (%)</Label><Input id="argila" placeholder="Opcional" value={currentAmostra.limites.percentualArgila || ""} onChange={e => updateLimites(currentAmostraIndex, { percentualArgila: e.target.value })} className="h-8" /></div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Coluna de Resultados e Gráficos */}
                <div className="lg:col-span-7 space-y-4">
                    {!resultado ? (
                        <Card className="glass h-full flex items-center justify-center p-8 text-center text-muted-foreground border-dashed min-h-[400px]">
                            <div><Calculator className="w-14 h-14 mx-auto mb-4 opacity-20" /><p>Preencha os dados e clique em <strong>Calcular</strong>.</p></div>
                        </Card>
                    ) : resultado.erro ? (
                        <Alert variant="destructive" className="h-full flex items-center"><AlertCircle className="h-5 w-5" /><AlertDescription className="text-base">{resultado.erro}</AlertDescription></Alert>
                    ) : (
                        <Tabs defaultValue="resultados" className="w-full">
                            <TabsList className="grid w-full grid-cols-3">
                                <TabsTrigger value="resultados">Resultados</TabsTrigger>
                                <TabsTrigger value="diagrama">Diagrama Fases</TabsTrigger>
                                <TabsTrigger value="grafico-ll">Gráfico LL</TabsTrigger>
                            </TabsList>

                            {/* Tab Resultados */}
                            <TabsContent value="resultados" className="mt-4">
                                <Card className="glass">
                                    <CardContent className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {/* Índices */}
                                        <div className="space-y-2">
                                            <h4 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">Índices Físicos</h4>
                                            <ResultRow label="Umidade (w)" value={resultado.w} unit="%" />
                                            <ResultRow label="γ natural" value={resultado.gamma_nat} unit="kN/m³" />
                                            <ResultRow label="γ seco" value={resultado.gamma_d} unit="kN/m³" />
                                            <ResultRow label="Índice de Vazios (e)" value={resultado.e} unit="" precision={3} />
                                            <ResultRow label="Porosidade (n)" value={resultado.n} unit="%" />
                                            <ResultRow label="Saturação (Sr)" value={resultado.Sr} unit="%" />
                                            <ResultRow label="γ saturado" value={resultado.gamma_sat} unit="kN/m³" />
                                        </div>
                                        {/* Limites */}
                                        <div className="space-y-2">
                                            <h4 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">Limites de Consistência</h4>
                                            <ResultRow label="LL" value={resultado.ll} unit="%" />
                                            <ResultRow label="LP" value={resultado.lp} unit="%" />
                                            <ResultRow label="IP" value={resultado.ip} unit="%" highlight />
                                            <ResultRow label="IC" value={resultado.ic} unit="" precision={2} />
                                            <ResultRow label="Atividade (Ia)" value={resultado.atividade} unit="" precision={2} />
                                            <Separator className="my-2" />
                                            {resultado.classificacao_plasticidade && <p className="text-sm"><span className="font-medium">Plasticidade:</span> {resultado.classificacao_plasticidade}</p>}
                                            {resultado.classificacao_consistencia && <p className="text-sm"><span className="font-medium">Consistência:</span> {resultado.classificacao_consistencia}</p>}
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            {/* Tab Diagrama de Fases */}
                            <TabsContent value="diagrama" className="mt-4">
                                <Card className="glass">
                                    <CardHeader className="pb-2"><CardTitle className="text-sm">Diagrama de Fases</CardTitle><CardDescription>Representação visual das proporções de sólidos, água e ar.</CardDescription></CardHeader>
                                    <CardContent>
                                        <DiagramaFases
                                            volumeSolidosNorm={1}
                                            volumeAguaNorm={resultado.e && resultado.Sr ? (resultado.e * resultado.Sr / 100) : 0}
                                            volumeArNorm={resultado.e ? resultado.e * (1 - (resultado.Sr || 0) / 100) : 0}
                                            volumeSolidosCalc={resultado.volume_solidos_calc}
                                            volumeAguaCalc={resultado.volume_agua_calc}
                                            volumeArCalc={resultado.volume_ar_calc}
                                            volumeTotalCalc={resultado.volume_total_calc}
                                            massaSolidosCalc={resultado.massa_solidos_calc}
                                            massaAguaCalc={resultado.massa_agua_calc}
                                            massaTotalCalc={resultado.massa_total_calc}
                                        />
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            {/* Tab Gráfico LL */}
                            <TabsContent value="grafico-ll" className="mt-4">
                                <Card className="glass">
                                    <CardHeader className="pb-2"><CardTitle className="text-sm">Gráfico Limite de Liquidez</CardTitle><CardDescription>Curva de fluidez (Casagrande).</CardDescription></CardHeader>
                                    <CardContent>
                                        <LimiteLiquidezChart
                                            ref={limiteLiquidezChartRef}
                                            pontos={resultado.pontos_grafico_ll || []}
                                            ll={resultado.ll || null}
                                        />
                                    </CardContent>
                                </Card>
                            </TabsContent>
                        </Tabs>
                    )}
                </div>
            </div>
        </div>
    );
}

function ResultRow({ label, value, unit, precision = 2, highlight = false }: { label: string, value: number | null | undefined, unit: string, precision?: number, highlight?: boolean }) {
    if (value === undefined || value === null) return null;
    return (
        <div className={cn("flex justify-between items-center text-sm", highlight && "font-bold text-primary")}>
            <span className="text-muted-foreground">{label}</span>
            <span className="font-medium font-mono">{value.toFixed(precision)} {unit}</span>
        </div>
    );
}
