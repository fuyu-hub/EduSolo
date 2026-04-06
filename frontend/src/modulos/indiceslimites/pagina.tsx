/**
 * Página: Índices Físicos e Limites de Consistência
 * modulos/indiceslimites/pagina.tsx
 *
 * Contém toda a lógica de estado, cálculos, formulários de entrada
 * e visualização de resultados em um componente unificado.
 */
import { useState, useRef } from "react";
import { Helmet } from 'react-helmet-async';
import {
    Beaker, Trash2, Plus, Droplet,
    BarChart3, Pencil
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { DefinicaoTooltip } from "@/components/ui/DefinicaoTooltip";
import { cn } from "@/lib/utils";

import {
    parseOptional, parseOrZero, generateId,
    calcularUmidade, calcularMBSInverso, parseDecimal
} from "@/lib/shared";
import PrintHeader from "@/componentes/base/CabecalhoImpressao";
import { UI_STANDARDS } from "@/lib/ui-standards";
import { handleArrowNavigation } from "@/lib/navigation";

import { useIndicesLimitesStore } from "./store";
import { calcularIndicesFisicos, calcularLimitesConsistencia } from "./calculos";
import { CaracterizacaoOutput } from "./types";
import DialogExemplos from "./componentes/DialogExemplos";
import { ExemploCaracterizacao } from "./exemplos";
import { BotaoLimpar } from "@/componentes/compartilhados/BotaoLimpar";
import { CabecalhoModulo } from "@/componentes/compartilhados/CabecalhoModulo";
import { AlertaErro } from "@/componentes/compartilhados/AlertaErro";
import { useAutoCalculo } from "@/hooks/useAutoCalculo";

import { LinhaResultado } from "@/componentes/compartilhados/LinhaResultado";
import DiagramaFases from "./componentes/DiagramaFases";
import LimiteLiquidezChart from "./componentes/LimiteLiquidezChart";
import { LayoutDividido } from "@/componentes/compartilhados/LayoutDividido";
import { Input } from "@/components/ui/input";
import { TooltipErro } from "@/componentes/compartilhados/TooltipErro";

// ─── Steps ───
type Step = "dados" | "ll" | "lp" | "resultados";

export default function IndicesLimitesPage() {
    const {
        settings, updateSettings,
        limites: globalLimites, updateLimites: updateGlobalLimites,
        indices, updateIndices,
        setResult, reset
    } = useIndicesLimitesStore();

    const [resultadoCombinado, setResultadoCombinado] = useState<CaracterizacaoOutput | null>(null);
    const [currentStep, setCurrentStep] = useState<Step>("dados");
    const limiteLiquidezChartRef = useRef<HTMLDivElement>(null);



    // ─── Auto-cálculo com debounce (250ms) ───

    const handleCalculate = () => {
        try {
            const mu = parseOptional(indices.massaUmida);
            const ms = parseOptional(indices.massaSeca);
            const t = parseOrZero(indices.tara || "");
            const inputIndices = {
                peso_total: mu !== undefined ? mu - t : undefined,
                peso_solido: ms !== undefined ? ms - t : undefined,
                volume_total: parseOptional(indices.volume || ""),
                Gs: parseOptional(settings.Gs)!,
                peso_especifico_agua: parseOptional(settings.pesoEspecificoAgua) || 10.0,
            };

            const resIndices = calcularIndicesFisicos(inputIndices);

            let resLimites: any = {};
            const pontosLL = globalLimites.pontosLL
                .map(p => ({ num_golpes: parseInt(p.numGolpes), massa_umida_recipiente: parseOptional(p.massaUmidaRecipiente)!, massa_seca_recipiente: parseOptional(p.massaSecaRecipiente)!, massa_recipiente: parseOptional(p.massaRecipiente)! }))
                .filter(p => !isNaN(p.num_golpes) && !isNaN(p.massa_umida_recipiente) && !isNaN(p.massa_seca_recipiente) && !isNaN(p.massa_recipiente));

            const pontosLP = globalLimites.pontosLP
                .map(p => ({ massa_umida_recipiente: parseOptional(p.massaUmidaRecipiente)!, massa_seca_recipiente: parseOptional(p.massaSecaRecipiente)!, massa_recipiente: parseOptional(p.massaRecipiente)! }))
                .filter(p => !isNaN(p.massa_umida_recipiente) && !isNaN(p.massa_seca_recipiente) && !isNaN(p.massa_recipiente));

            if (pontosLL.length >= 2 || pontosLP.length >= 1) {
                resLimites = calcularLimitesConsistencia({ pontos_ll: pontosLL, pontos_lp: pontosLP, umidade_natural: resIndices.umidade });
            }

            // Compacidade relativa (solos não plásticos)
            let compacidade_relativa: number | null = null;
            let classificacao_compacidade: string | undefined;
            const emax = parseOptional(settings.indice_vazios_max);
            const emin = parseOptional(settings.indice_vazios_min);
            const e_atual = resIndices.indice_vazios;

            if (!resLimites.lp && emax && emin && e_atual !== undefined && emax > emin) {
                compacidade_relativa = ((emax - e_atual) / (emax - emin)) * 100;
                if (compacidade_relativa < 15) classificacao_compacidade = 'Muito Fofa';
                else if (compacidade_relativa < 35) classificacao_compacidade = 'Fofa';
                else if (compacidade_relativa < 65) classificacao_compacidade = 'Medianamente Compacta';
                else if (compacidade_relativa < 85) classificacao_compacidade = 'Compacta';
                else classificacao_compacidade = 'Muito Compacta';
            }

            const combinedResult: CaracterizacaoOutput = {
                w: resIndices.umidade, gamma_nat: resIndices.peso_especifico_natural,
                gamma_d: resIndices.peso_especifico_seco, e: resIndices.indice_vazios,
                n: resIndices.porosidade, Sr: resIndices.grau_saturacao, gamma_sat: resIndices.peso_especifico_saturado,
                volume_solidos_calc: resIndices.volume_solidos_calc, volume_agua_calc: resIndices.volume_agua_calc,
                volume_ar_calc: resIndices.volume_ar_calc, volume_total_calc: resIndices.volume_total_calc,
                massa_solidos_calc: resIndices.massa_solidos_calc, massa_agua_calc: resIndices.massa_agua_calc,
                massa_total_calc: resIndices.massa_total_calc,
                ll: resLimites.ll, lp: resLimites.lp, ip: resLimites.ip, ic: resLimites.ic,
                classificacao_plasticidade: resLimites.classificacao_plasticidade,
                classificacao_consistencia: resLimites.classificacao_consistencia,
                pontos_grafico_ll: resLimites.pontos_grafico_ll,
                compacidade_relativa, classificacao_compacidade,
                erro: resIndices.erro || resLimites.erro
            };

            setResultadoCombinado(combinedResult);
            setResult(combinedResult);
        } catch (err) {
            console.error(err);
            setResultadoCombinado(null);
        }
    };

    useAutoCalculo(handleCalculate, [indices, settings, globalLimites], 250);

    // ─── Handlers ───

    const handleClear = () => {
        reset();
        setResultadoCombinado(null);
        setCurrentStep("dados");
        toast.info("Campos limpos!");
    };

    const handleLoadExample = (exemplo: ExemploCaracterizacao) => {
        handleClear();
        updateSettings(exemplo.settings);
        updateGlobalLimites({
            pontosLL: exemplo.limites.pontosLL.map(p => ({ ...p, id: generateId(), umidade: calcularUmidade(p.massaUmidaRecipiente, p.massaSecaRecipiente, p.massaRecipiente) })),
            pontosLP: exemplo.limites.pontosLP.map(p => ({ ...p, id: generateId(), umidade: calcularUmidade(p.massaUmidaRecipiente, p.massaSecaRecipiente, p.massaRecipiente) })),
        });
        updateIndices({ massaUmida: exemplo.indices.massaUmida, massaSeca: exemplo.indices.massaSeca, volume: exemplo.indices.volume });
        toast.success(`${exemplo.nome} carregado!`);
    };

    // Step completeness checks
    const dadosCompletos = !!(indices.massaUmida && indices.massaSeca && settings.Gs);
    const pontosLLPreenchidos = globalLimites.pontosLL.filter(p =>
        p.numGolpes && p.massaUmidaRecipiente && p.massaSecaRecipiente && p.massaRecipiente
    ).length;
    const llCompleto = pontosLLPreenchidos >= 5;
    const pontosLPPreenchidos = globalLimites.pontosLP.filter(p =>
        p.massaUmidaRecipiente && p.massaSecaRecipiente && p.massaRecipiente
    ).length;
    const lpCompleto = pontosLPPreenchidos >= 3;

    const steps: { key: Step; label: string; num: string; complete?: boolean; count?: string }[] = [
        { key: "dados", label: "Índices Físicos", num: "1", complete: dadosCompletos },
        { key: "ll", label: "Limite de Liquidez (LL)", num: "2", complete: llCompleto, count: `${pontosLLPreenchidos}/5` },
        { key: "lp", label: "Limite de Plasticidade (LP)", num: "3", complete: lpCompleto, count: `${pontosLPPreenchidos}/3` },
        { key: "resultados", label: "Todos os Resultados", num: "4", complete: dadosCompletos && llCompleto && lpCompleto },
    ];

    // ─── Render ───
    const displayResult = resultadoCombinado || {} as CaracterizacaoOutput;

    return (
        <div className={UI_STANDARDS.pageContainer}>
            <Helmet>
                <title>Índices Físicos e Limites de Consistência | EduSolos</title>
                <meta name="description" content="Análise completa da caracterização física do solo: índices físicos, limites de liquidez (LL) e plasticidade (LP), e diagrama de fases interativo." />
            </Helmet>
            <PrintHeader moduleTitle="Índices Físicos e Limites de Consistência" moduleName="caracterizacao" />

            {/* Header */}
            <CabecalhoModulo
                icone={<Beaker className={UI_STANDARDS.header.icon} />}
                titulo="Índices Físicos e Limites de Consistência"
                subtitulo="Análise das propriedades físicas do solo"
                acoes={[
                    <DialogExemplos key="exemplos" onSelectExample={handleLoadExample} />,
                    <BotaoLimpar key="limpar" onLimpar={handleClear} />,
                ]}
            />

            {/* Step Selection (Alternador Estilo Segmented Control) */}
            <div className="bg-muted/20 p-1.5 rounded-xl grid grid-cols-4 w-full mb-8 border border-border/40 relative">
                {steps.map((step, i) => (
                    <div key={step.key} className="flex items-center justify-center">
                        <button
                            onClick={() => setCurrentStep(step.key)}
                            className={cn(
                                "relative flex items-center justify-center gap-1.5 py-2.5 text-sm transition-all rounded-lg overflow-hidden w-full",
                                currentStep === step.key
                                    ? "bg-background shadow-md text-primary font-bold ring-1 ring-border"
                                    : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                            )}
                        >
                            <span className={cn(
                                "font-bold transition-colors shrink-0",
                                currentStep === step.key ? "text-primary" : step.complete ? "text-blue-500" : "text-muted-foreground/60"
                            )}>{step.num}.</span>

                            <span className="truncate">{step.label}</span>

                            {step.count && (
                                <DefinicaoTooltip
                                    id={step.key === "ll" ? "step_ll" : step.key === "lp" ? "step_lp" : undefined}
                                    side="bottom"
                                >
                                    <span className={cn(
                                        "font-medium transition-colors ml-0.5 cursor-help",
                                        step.complete ? "text-blue-500" : "text-destructive/80"
                                    )}>
                                        ({step.count})
                                    </span>
                                </DefinicaoTooltip>
                            )}
                        </button>
                    </div>
                ))}
            </div>

            {/* Layout Principal — 60/40 */}
            {currentStep !== "resultados" ? (
                <LayoutDividido
                    sticky={currentStep !== "dados"}
                    proporcao="6fr 4fr"
                    classNameEsquerdo="h-full flex flex-col"
                    classNameDireito="flex flex-col gap-4 h-full"
                    painelEsquerdo={
                        <div className="h-full flex flex-col" onKeyDown={handleArrowNavigation}>
                        {currentStep === "dados" && (
                            <StepDadosBasicos
                                indices={indices} updateIndices={updateIndices}
                                settings={settings} updateSettings={updateSettings}
                                limites={globalLimites}
                            />
                        )}
                        {currentStep === "ll" && (
                            <StepLimiteLL
                                limites={globalLimites} updateLimites={updateGlobalLimites}
                                pontosLLPreenchidos={pontosLLPreenchidos}
                                resultadoCombinado={resultadoCombinado}
                            />
                        )}
                        {currentStep === "lp" && (
                            <StepLimiteLP
                                limites={globalLimites} updateLimites={updateGlobalLimites}
                                pontosLPPreenchidos={pontosLPPreenchidos}
                            />
                        )}
                    </div>
                    }
                    painelDireito={
                        <>
                        {currentStep === "dados" && (
                            <>
                                <Card className="glass">
                                    <CardHeader className="pb-2 pt-3 px-4 shrink-0">
                                        <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                            Diagrama de Fases
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="pt-0 pb-3 px-4">
                                        <DiagramaFases
                                            volumeSolidosNorm={1}
                                            volumeAguaNorm={displayResult.e && displayResult.Sr ? (displayResult.e * displayResult.Sr / 100) : 0}
                                            volumeArNorm={displayResult.e ? displayResult.e * (1 - (displayResult.Sr || 0) / 100) : 0}
                                            volumeSolidosCalc={displayResult.volume_solidos_calc}
                                            volumeAguaCalc={displayResult.volume_agua_calc}
                                            volumeArCalc={displayResult.volume_ar_calc}
                                            volumeTotalCalc={displayResult.volume_total_calc}
                                            massaSolidosCalc={displayResult.massa_solidos_calc}
                                            massaAguaCalc={displayResult.massa_agua_calc}
                                            massaTotalCalc={displayResult.massa_total_calc}
                                        />
                                    </CardContent>
                                </Card>

                                <Card className="glass flex-1 flex flex-col">
                                    <CardHeader className="pb-1 pt-3 px-4 shrink-0">
                                        <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                                            <Beaker className="w-3.5 h-3.5" /> Índices Físicos
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="pt-0 pb-2 px-4 flex-1 overflow-auto">
                                        <div className="grid grid-cols-1 gap-px items-start">
                                            <LinhaResultado id="w" simbolo="w" label="Umidade" value={displayResult.w} unit="%" precision={1} />
                                            <LinhaResultado id="e" simbolo="e" label="Índice de Vazios" value={displayResult.e} precision={2} />
                                            <LinhaResultado id="gamma_nat" simbolo={<>γ<sub>n</sub></>} label="Peso Esp. Natural" value={displayResult.gamma_nat} unit="kN/m³" precision={2} />
                                            <LinhaResultado id="n" simbolo="n" label="Porosidade" value={displayResult.n} unit="%" precision={1} />
                                            <LinhaResultado id="gamma_d" simbolo={<>γ<sub>d</sub></>} label="Peso Esp. Seco" value={displayResult.gamma_d} unit="kN/m³" precision={2} />
                                            <LinhaResultado id="Sr" simbolo="S" label="Grau de Saturação" value={displayResult.Sr} unit="%" precision={1} />
                                            <LinhaResultado id="Dr" simbolo={<>D<sub>r</sub></>} label="Compacidade Relativa" value={displayResult.compacidade_relativa} unit="%" precision={0} />
                                        </div>
                                    </CardContent>
                                </Card>
                            </>
                        )}

                        {currentStep !== "dados" && (
                            <Card className={cn("glass flex flex-col", currentStep === "ll" ? "flex-none" : "flex-1")}>
                                <CardHeader className="pb-1 pt-3 px-4">
                                    <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                                        <Droplet className="w-3.5 h-3.5" /> Limites de Consistência
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="pt-0 pb-3 px-4 space-y-2">
                                    <div className="grid grid-cols-2 gap-x-2">
                                        <LinhaResultado id="LL" simbolo="LL" label="Lim. Liquidez" value={displayResult.ll} unit="%" precision={0} />
                                        <LinhaResultado id="LP" simbolo="LP" label="Lim. Plasticidade" value={displayResult.lp} unit="%" precision={0} />
                                        <LinhaResultado id="IP" simbolo="IP" label="Índ. Plasticidade" value={displayResult.ip} unit="%" precision={0} />
                                        <LinhaResultado id="IC" simbolo="IC" label="Índ. Consistência" value={displayResult.ic} precision={2} />
                                    </div>
                                    {(displayResult.classificacao_plasticidade || displayResult.classificacao_consistencia) && (
                                        <div className="space-y-1.5 pt-1 border-t border-border/30">
                                            {displayResult.classificacao_plasticidade && (
                                                <div className="flex items-center justify-between text-[11px] px-3">
                                                    <span className="text-foreground">Plasticidade</span>
                                                    <Badge variant="secondary" className="font-semibold h-4 text-[10px] py-0">{displayResult.classificacao_plasticidade}</Badge>
                                                </div>
                                            )}
                                            {displayResult.classificacao_consistencia && (
                                                <div className="flex items-center justify-between text-[11px] px-3">
                                                    <span className="text-foreground">Consistência</span>
                                                    <Badge variant="secondary" className="font-semibold h-4 text-[10px] py-0">{displayResult.classificacao_consistencia}</Badge>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        )}

                        {currentStep === "ll" && (
                            <Card className="glass flex-1 flex flex-col min-h-[250px]">
                                <CardHeader className="pb-1 pt-3 px-4 shrink-0">
                                    <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                                        <BarChart3 className="w-3.5 h-3.5" /> Gráfico - Limite de liquidez (LL)
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="pt-0 pb-3 px-2 flex-1 flex flex-col justify-center overflow-hidden">
                                    <LimiteLiquidezChart
                                        pontos={resultadoCombinado?.pontos_grafico_ll || []}
                                        ll={resultadoCombinado?.ll ?? null}
                                        compact
                                    />
                                </CardContent>
                            </Card>
                        )}
                        </>
                    }
                />
            ) : (
                /* ═══ Aba "Ver resultados" — layout especial 50/50 ═══ */
                <LayoutDividido
                    sticky={true}
                    classNameEsquerdo="space-y-4"
                    classNameDireito="space-y-4 h-full flex flex-col"
                    painelEsquerdo={
                        <>
                        <AlertaErro erro={resultadoCombinado?.erro} />
                        <Card className="glass">
                            <CardHeader className="pb-2 pt-3 px-4">
                                <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                    Diagrama de Fases
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-0 pb-3 px-4">
                                <DiagramaFases
                                    volumeSolidosNorm={1}
                                    volumeAguaNorm={displayResult.e && displayResult.Sr ? (displayResult.e * displayResult.Sr / 100) : 0}
                                    volumeArNorm={displayResult.e ? displayResult.e * (1 - (displayResult.Sr || 0) / 100) : 0}
                                    volumeSolidosCalc={displayResult.volume_solidos_calc}
                                    volumeAguaCalc={displayResult.volume_agua_calc}
                                    volumeArCalc={displayResult.volume_ar_calc}
                                    volumeTotalCalc={displayResult.volume_total_calc}
                                    massaSolidosCalc={displayResult.massa_solidos_calc}
                                    massaAguaCalc={displayResult.massa_agua_calc}
                                    massaTotalCalc={displayResult.massa_total_calc}
                                />
                            </CardContent>
                        </Card>
                        {/* Card Único Unificado de Resultados */}
                        <Card className="glass border-border/40">
                            <CardContent className="p-0">
                                <div className="grid grid-cols-1 md:grid-cols-2 divide-x divide-border/10">
                                    {/* Coluna 1: Índices Físicos */}
                                    <div className="p-4 space-y-0.5">
                                        <div className="flex items-center gap-2 mb-3 px-1">
                                            <Beaker className="w-3.5 h-3.5 text-blue-500" />
                                            <h4 className="font-semibold text-blue-500 text-[13px]">Índices Físicos</h4>
                                        </div>
                                        <div className="space-y-0.5">
                                            <LinhaResultado id="w" simbolo="w" label={<span className="text-muted-foreground/70 text-[11px]">(Umidade)</span>} value={displayResult.w} unit="%" precision={1} />
                                            <LinhaResultado id="gamma_nat" simbolo={<>γ<sub>n</sub></>} label={<span className="text-muted-foreground/70 text-[11px]">(Peso Esp. Natural)</span>} value={displayResult.gamma_nat} unit="kN/m³" precision={2} />
                                            <LinhaResultado id="gamma_d" simbolo={<>γ<sub>d</sub></>} label={<span className="text-muted-foreground/70 text-[11px]">(Peso Esp. Seco)</span>} value={displayResult.gamma_d} unit="kN/m³" precision={2} />
                                            <LinhaResultado id="e" simbolo="e" label={<span className="text-muted-foreground/70 text-[11px]">(Índice de Vazios)</span>} value={displayResult.e} precision={2} />
                                            <LinhaResultado id="n" simbolo="n" label={<span className="text-muted-foreground/70 text-[11px]">(Porosidade)</span>} value={displayResult.n} unit="%" precision={0} />
                                            <LinhaResultado id="Sr" simbolo="S" label={<span className="text-muted-foreground/70 text-[11px]">(Grau de Saturação)</span>} value={displayResult.Sr} unit="%" precision={0} />
                                            <LinhaResultado id="gamma_sat" simbolo={<>γ<sub>sat</sub></>} label={<span className="text-muted-foreground/70 text-[11px]">(Peso Esp. Saturado)</span>} value={displayResult.gamma_sat} unit="kN/m³" precision={2} />
                                        </div>
                                    </div>

                                    {/* Coluna 2: Limites de Consistência */}
                                    <div className="p-4 space-y-0.5">
                                        <div className="flex items-center gap-2 mb-3 px-1">
                                            <Droplet className="w-3.5 h-3.5 text-blue-500" />
                                            <h4 className="font-semibold text-blue-500 text-[13px]">Limites de Consistência</h4>
                                        </div>
                                        <div className="space-y-0.5">
                                            <LinhaResultado id="LL" simbolo="LL" label={<span className="text-muted-foreground/70 text-[11px]">(Limite de Liquidez)</span>} value={displayResult.ll} unit="%" precision={0} />
                                            <LinhaResultado id="LP" simbolo="LP" label={<span className="text-muted-foreground/70 text-[11px]">(Limite de Plasticidade)</span>} value={displayResult.lp} unit="%" precision={0} />
                                            <LinhaResultado id="IP" simbolo="IP" label={<span className="text-muted-foreground/70 text-[11px]">(Índice de Plasticidade)</span>} value={displayResult.ip} unit="%" precision={0} />
                                            <LinhaResultado id="IC" simbolo="IC" label={<span className="text-muted-foreground/70 text-[11px]">(Índice de Consistência)</span>} value={displayResult.ic} precision={2} />
                                        </div>

                                        {/* Classificações */}
                                        {(displayResult.classificacao_plasticidade || displayResult.classificacao_consistencia) && (
                                            <div className="space-y-2 pt-3 mt-4 border-t border-border/10">
                                                {displayResult.classificacao_plasticidade && (
                                                    <div className="flex items-center gap-3 px-3">
                                                        <span className="bg-muted/60 border border-border/50 text-muted-foreground px-2 py-0.5 rounded text-[10px] font-medium tracking-wide">Plasticidade</span>
                                                        <span className="text-[13px] font-bold text-foreground">{displayResult.classificacao_plasticidade}</span>
                                                    </div>
                                                )}
                                                {displayResult.classificacao_consistencia && (
                                                    <div className="flex items-center gap-3 px-3">
                                                        <span className="bg-muted/60 border border-border/50 text-muted-foreground px-2 py-0.5 rounded text-[10px] font-medium tracking-wide">Consistência</span>
                                                        <span className="text-[13px] font-bold text-foreground">{displayResult.classificacao_consistencia}</span>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                        {!displayResult.lp && displayResult.compacidade_relativa !== null && displayResult.compacidade_relativa !== undefined && (
                                            <div className="pt-3 mt-4 border-t border-border/10 space-y-2">
                                                <LinhaResultado id="Dr" simbolo={<>D<sub>r</sub></>} label={<span className="text-muted-foreground/70 text-[11px]">(Compacidade Relativa)</span>} value={displayResult.compacidade_relativa} unit="%" precision={0} />
                                                {displayResult.classificacao_compacidade && (
                                                    <div className="flex items-center gap-3 px-3">
                                                        <span className="bg-muted/60 border border-border/50 text-muted-foreground px-2 py-0.5 rounded text-[10px] font-medium tracking-wide">Compacidade</span>
                                                        <span className="text-[13px] font-bold text-foreground">{displayResult.classificacao_compacidade}</span>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        </>
                    }
                    painelDireito={
                        <>
                        <Card className="glass">
                            <CardHeader className={UI_STANDARDS.card.header}>
                                <CardTitle className={UI_STANDARDS.card.title}>
                                    <BarChart3 className="w-5 h-5 text-primary" /> Gráfico — Limite de Liquidez
                                </CardTitle>
                                <CardDescription>Relação entre número de golpes e teor de umidade</CardDescription>
                            </CardHeader>
                            <CardContent className="pt-2 pb-3">
                                <LimiteLiquidezChart
                                    ref={limiteLiquidezChartRef}
                                    pontos={resultadoCombinado?.pontos_grafico_ll || []}
                                    ll={resultadoCombinado?.ll ?? null}
                                />
                            </CardContent>
                        </Card>
                        </>
                    }
                />
            )}


        </div>
    );
}

// ═══════════════════════════════════════════════════════════
// Step: Dados Básicos
// ═══════════════════════════════════════════════════════════

function StepDadosBasicos({ indices, updateIndices, settings, updateSettings, limites }: {
    indices: any; updateIndices: (d: any) => void;
    settings: any; updateSettings: (d: any) => void;
    limites: any;
}) {


    const conflitoCompacidade = (settings.indice_vazios_min || settings.indice_vazios_max) &&
        limites.pontosLP.some((p: any) => p.massaUmidaRecipiente || p.massaSecaRecipiente || p.massaRecipiente);

    return (
        <Card className={cn(UI_STANDARDS.card.root, "min-h-[350px] h-full flex flex-col")}>
            <CardHeader className={UI_STANDARDS.card.header}>
                <CardTitle className={UI_STANDARDS.card.title}>
                    <Beaker className="w-5 h-5 text-primary" /> Índices Físicos
                </CardTitle>
                <CardDescription>Propriedades físicas da amostra de solo</CardDescription>
            </CardHeader>
            <CardContent className="pt-4 pb-5 flex-1 flex flex-col justify-between">
                {/* Campos Principais */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <InputField id="Gs" label="Gs (Dens. Grãos)" placeholder="Ex: 2.65"
                        value={settings.Gs} onChange={(v) => updateSettings({ Gs: v })} />
                    <InputField id="massaUmida" label="MBU (g)" placeholder="0.00"
                        value={indices.massaUmida} onChange={(v) => updateIndices({ massaUmida: v })} />
                    <InputField id="massaSeca" label="MBS (g)" placeholder="0.00"
                        value={indices.massaSeca} onChange={(v) => updateIndices({ massaSeca: v })} />
                    <InputField id="tara" label="Tara (g)" placeholder="0.00"
                        value={indices.tara || ""} onChange={(v) => updateIndices({ tara: v })} />
                </div>

                {/* Volume Centralizado */}
                <div className="grid grid-cols-1">
                    <InputField id="volume" label="Volume (cm³)" placeholder="Ex: 100"
                        value={indices.volume || ""} onChange={(v) => updateIndices({ volume: v })} />
                </div>

                <div className="border-t border-white/40 w-full" />

                {/* Compacidade Relativa (Ancorada em baixo) */}
                <div className="space-y-3">
                    <div className="flex items-center gap-2 font-medium mb-1">
                        <span className="text-[13px] text-foreground">Compacidade Relativa</span>
                        <Badge variant="outline" className="text-[7px] leading-none pt-[3px] h-4 px-1.5 font-bold uppercase text-white/90 border-white/30 truncate">SOLOS NÃO PLÁSTICOS</Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <InputField id="emin" label={<>e<sub>mín</sub></>} placeholder="Ex: 0.4"
                            value={settings.indice_vazios_min} onChange={(v) => updateSettings({ indice_vazios_min: v })}
                            error={conflitoCompacidade ? "Solo com plasticidade. Compacidade Relativa não aplicável." : undefined} />
                        <InputField id="emax" label={<>e<sub>máx</sub></>} placeholder="Ex: 0.9"
                            value={settings.indice_vazios_max} onChange={(v) => updateSettings({ indice_vazios_max: v })}
                            error={conflitoCompacidade ? "Solo com plasticidade. Compacidade Relativa não aplicável." : undefined} />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

// ═══════════════════════════════════════════════════════════
// Step: Limite de Liquidez (LL)
// ═══════════════════════════════════════════════════════════

function StepLimiteLL({ limites, updateLimites, pontosLLPreenchidos, resultadoCombinado }: {
    limites: any; updateLimites: (d: any) => void;
    pontosLLPreenchidos: number;
    resultadoCombinado: CaracterizacaoOutput | null;
}) {
    const handleUpdateLL = (idx: number, field: string, value: string) => {
        const newPontos = [...limites.pontosLL];
        const ponto = { ...newPontos[idx], [field]: value };
        if (['massaUmidaRecipiente', 'massaSecaRecipiente', 'massaRecipiente'].includes(field)) {
            ponto.umidade = calcularUmidade(ponto.massaUmidaRecipiente, ponto.massaSecaRecipiente, ponto.massaRecipiente);
        }
        newPontos[idx] = ponto;
        updateLimites({ pontosLL: newPontos });
    };

    const handleUpdateUmidadeLL = (idx: number, value: string) => {
        const newPontos = [...limites.pontosLL];
        const ponto = { ...newPontos[idx], umidade: value };
        const newMBS = calcularMBSInverso(ponto.massaUmidaRecipiente, ponto.massaRecipiente, value);
        if (newMBS) ponto.massaSecaRecipiente = newMBS;
        newPontos[idx] = ponto;
        updateLimites({ pontosLL: newPontos });
    };

    const addPontoLL = () => {
        updateLimites({
            pontosLL: [...limites.pontosLL, { id: generateId(), numGolpes: "", massaUmidaRecipiente: "", massaSecaRecipiente: "", massaRecipiente: "", umidade: "" }]
        });
    };

    const removePontoLL = (index: number) => {
        const newPontos = [...limites.pontosLL];
        if (newPontos.length > 1) {
            newPontos.splice(index, 1);
        } else {
            newPontos[index] = { ...newPontos[index], numGolpes: "", massaUmidaRecipiente: "", massaSecaRecipiente: "", massaRecipiente: "", umidade: "" };
        }
        updateLimites({ pontosLL: newPontos });
    };

    // Validação de golpes
    const validarPontoLL = (index: number): { status: 'ok' | 'error', msg?: string } => {
        const ponto = limites.pontosLL[index];
        const golpes = parseInt(ponto.numGolpes);
        if (isNaN(golpes) || !ponto.numGolpes) return { status: 'ok' };
        if (golpes < 15 || golpes > 35) {
            return { status: 'error', msg: `${golpes} golpes — fora do intervalo 15–35 (NBR 6459/2025)` };
        }
        return { status: 'ok' };
    };

    return (
        <Card className={cn(UI_STANDARDS.card.root, "min-h-[350px] h-full flex flex-col")}>
            <CardHeader className={UI_STANDARDS.card.header}>
                <CardTitle className={UI_STANDARDS.card.title}>
                    <Droplet className="w-5 h-5 text-primary" /> Limite de Liquidez (LL)
                </CardTitle>
                <CardDescription>Ensaio de Casagrande — NBR 6459/2025</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 pt-3 h-full">
                {/* Header da tabela */}
                <div className="grid grid-cols-[55px,1fr,1fr,1fr,70px,32px] gap-1 px-1 text-[10px] text-muted-foreground font-medium text-center">
                    <div>Golpes</div><div>MBU (g)</div><div>MBS (g)</div><div>Tara (g)</div>
                    <div className="flex items-center justify-center gap-0.5">
                        w (%)
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Pencil className="w-2.5 h-2.5 text-muted-foreground/50 cursor-help" />
                                </TooltipTrigger>
                                <TooltipContent side="top" className="max-w-[200px]">
                                    <p className="text-xs">Insira w% diretamente para calcular MBS automaticamente</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </div>
                    <div></div>
                </div>

                {/* Linhas da tabela */}
                <div className="space-y-0.5">
                    {limites.pontosLL.map((ponto: any, i: number) => {
                        const validacao = validarPontoLL(i);
                        return (
                            <PontoRow key={ponto.id} validacao={validacao}
                                gridCols="grid-cols-[55px,1fr,1fr,1fr,70px,auto]"
                                inputs={[
                                    { placeholder: "N", value: ponto.numGolpes, onChange: (v: string) => handleUpdateLL(i, 'numGolpes', v), hasError: validacao.status === 'error' },
                                    { placeholder: "g", value: ponto.massaUmidaRecipiente, onChange: (v: string) => handleUpdateLL(i, 'massaUmidaRecipiente', v) },
                                    { placeholder: "g", value: ponto.massaSecaRecipiente, onChange: (v: string) => handleUpdateLL(i, 'massaSecaRecipiente', v) },
                                    { placeholder: "g", value: ponto.massaRecipiente, onChange: (v: string) => handleUpdateLL(i, 'massaRecipiente', v) },
                                    { placeholder: "calc.", value: ponto.umidade || "", onChange: (v: string) => handleUpdateUmidadeLL(i, v) },
                                ]}
                                onRemove={() => removePontoLL(i)}
                            />
                        );
                    })}
                </div>

                {/* Botão adicionar ponto (rodapé) */}
                <button
                    onClick={addPontoLL}
                    className={cn(
                        "w-full mt-1 py-1.5 text-xs text-muted-foreground",
                        "border border-dashed border-border rounded-md",
                        "hover:text-primary hover:border-primary/40 hover:bg-primary/5",
                        "flex items-center justify-center gap-1 transition-colors"
                    )}
                >
                    <Plus className="w-3 h-3" />
                    Adicionar ponto
                </button>


            </CardContent>
        </Card>
    );
}

// ═══════════════════════════════════════════════════════════
// Step: Limite de Plasticidade (LP)
// ═══════════════════════════════════════════════════════════

function StepLimiteLP({ limites, updateLimites, pontosLPPreenchidos }: {
    limites: any; updateLimites: (d: any) => void;
    pontosLPPreenchidos: number;
}) {
    const handleUpdateLP = (idx: number, field: string, value: string) => {
        const newPontos = [...limites.pontosLP];
        const ponto = { ...newPontos[idx], [field]: value };
        if (['massaUmidaRecipiente', 'massaSecaRecipiente', 'massaRecipiente'].includes(field)) {
            ponto.umidade = calcularUmidade(ponto.massaUmidaRecipiente, ponto.massaSecaRecipiente, ponto.massaRecipiente);
        }
        newPontos[idx] = ponto;
        updateLimites({ pontosLP: newPontos });
    };

    const handleUpdateUmidadeLP = (idx: number, value: string) => {
        const newPontos = [...limites.pontosLP];
        const ponto = { ...newPontos[idx], umidade: value };
        const newMBS = calcularMBSInverso(ponto.massaUmidaRecipiente, ponto.massaRecipiente, value);
        if (newMBS) ponto.massaSecaRecipiente = newMBS;
        newPontos[idx] = ponto;
        updateLimites({ pontosLP: newPontos });
    };

    const addPontoLP = () => {
        updateLimites({
            pontosLP: [...limites.pontosLP, { id: generateId(), massaUmidaRecipiente: "", massaSecaRecipiente: "", massaRecipiente: "", umidade: "" }]
        });
    };

    const removePontoLP = (index: number) => {
        const newPontos = [...limites.pontosLP];
        if (newPontos.length > 1) {
            newPontos.splice(index, 1);
        } else {
            newPontos[index] = { ...newPontos[index], massaUmidaRecipiente: "", massaSecaRecipiente: "", massaRecipiente: "", umidade: "" };
        }
        updateLimites({ pontosLP: newPontos });
    };

    const umidadesLP = limites.pontosLP.map((p: any) => {
        const w = parseDecimal(p.umidade?.toString() || "");
        return isNaN(w) ? null : w;
    });

    const calcularDesvioLP = (index: number): number | null => {
        const umidadeAtual = umidadesLP[index];
        if (umidadeAtual === null) return null;
        const validas = umidadesLP.filter((u: number | null): u is number => u !== null);
        if (validas.length < 2) return null;
        const media = validas.reduce((a: number, b: number) => a + b, 0) / validas.length;
        return Math.abs(umidadeAtual - media);
    };

    const validarVariacaoLP = (index: number): { status: 'ok' | 'error', msg?: string } => {
        const desvio = calcularDesvioLP(index);
        if (desvio === null) return { status: 'ok' };
        if (desvio > 5) {
            return { status: 'error', msg: `Desvio ${desvio.toFixed(1)}% > 5% máx. (NBR 7180/2025)` };
        }
        return { status: 'ok' };
    };

    return (
        <Card className={cn(UI_STANDARDS.card.root, "min-h-[350px] h-full flex flex-col")}>
            <CardHeader className={UI_STANDARDS.card.header}>
                <CardTitle className={UI_STANDARDS.card.title}>
                    <Droplet className="w-5 h-5 text-primary" /> Limite de Plasticidade (LP)
                </CardTitle>
                <CardDescription>Ensaio de cilindro — NBR 7180/2025</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 pt-3 h-full">
                <div className="grid grid-cols-[1fr,1fr,1fr,70px,60px,32px] gap-1 px-1 text-[10px] text-muted-foreground font-medium text-center">
                    <div>MBU (g)</div><div>MBS (g)</div><div>Tara (g)</div>
                    <div className="flex items-center justify-center gap-0.5">
                        w (%)
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Pencil className="w-2.5 h-2.5 text-muted-foreground/50 cursor-help" />
                                </TooltipTrigger>
                                <TooltipContent side="top" className="max-w-[200px]">
                                    <p className="text-xs">Insira w% diretamente para calcular MBS automaticamente</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </div>
                    <div>Desvio</div>
                    <div></div>
                </div>
                <div className="space-y-0.5">
                    {limites.pontosLP.map((ponto: any, i: number) => {
                        const validacao = validarVariacaoLP(i);
                        const desvio = calcularDesvioLP(i);
                        return (
                            <PontoRow key={ponto.id || i} validacao={validacao}
                                gridCols="grid-cols-[1fr,1fr,1fr,70px,60px,auto]"
                                inputs={[
                                    { placeholder: "g", value: ponto.massaUmidaRecipiente || "", onChange: (v: string) => handleUpdateLP(i, 'massaUmidaRecipiente', v) },
                                    { placeholder: "g", value: ponto.massaSecaRecipiente || "", onChange: (v: string) => handleUpdateLP(i, 'massaSecaRecipiente', v) },
                                    { placeholder: "g", value: ponto.massaRecipiente || "", onChange: (v: string) => handleUpdateLP(i, 'massaRecipiente', v) },
                                    { placeholder: "calc.", value: ponto.umidade || "", onChange: (v: string) => handleUpdateUmidadeLP(i, v) },
                                ]}
                                onRemove={() => removePontoLP(i)}
                                extra={
                                    <div className={cn(
                                        "h-7 text-[10px] px-1.5 flex items-center justify-center rounded font-mono relative",
                                        desvio !== null && desvio > 5 ? "text-red-400 bg-red-500/10 ring-1 ring-red-500/30" : "text-muted-foreground"
                                    )}>
                                        {desvio !== null ? `${desvio.toFixed(1)}%` : "—"}
                                        {validacao.status === 'error' && <TooltipErro mensagem={validacao.msg} className="-top-1 -right-1" />}
                                    </div>
                                }
                            />
                        );
                    })}
                </div>

                <button
                    onClick={addPontoLP}
                    className={cn(
                        "w-full mt-1 py-1.5 text-xs text-muted-foreground",
                        "border border-dashed border-border rounded-md",
                        "hover:text-primary hover:border-primary/40 hover:bg-primary/5",
                        "flex items-center justify-center gap-1 transition-colors"
                    )}
                >
                    <Plus className="w-3 h-3" />
                    Adicionar ponto
                </button>
            </CardContent>
        </Card>
    );
}

// ═══════════════════════════════════════════════════════════
// Sub-componentes internos
// ═══════════════════════════════════════════════════════════

function InputField({ id, label, placeholder, value, onChange, error }: {
    id: string; label: React.ReactNode; placeholder: string;
    value: string; onChange: (v: string) => void;
    error?: string;
}) {
    return (
        <div className="space-y-1.5 relative">
            <div className="flex items-center h-5">
                <Label htmlFor={id} className="text-[13px] font-medium flex items-center gap-1">
                    {label}
                    <DefinicaoTooltip id={id} side="top" iconClassName="w-3 h-3" />
                </Label>
            </div>
            <div className="relative">
                <Input
                    id={id}
                    placeholder={placeholder}
                    value={value || ""}
                    onChange={(e) => onChange(e.target.value)}
                    className={cn(
                        "h-9 text-[13px] px-3 transition-colors",
                        error && "border-red-500 bg-red-500/5 focus-visible:ring-red-500"
                    )}
                />
                {error && <TooltipErro mensagem={error} className="!top-1/2 !-translate-y-1/2 !right-3 !m-0" />}
            </div>
        </div>
    );
}

function PontoRow({ validacao, gridCols, inputs, onRemove, extra }: {
    validacao: { status: string; msg?: string };
    gridCols: string;
    inputs: { placeholder: string; value: string; onChange: (v: string) => void; hasError?: boolean }[];
    onRemove: () => void;
    extra?: React.ReactNode;
}) {
    const isError = validacao.status === 'error';

    return (
        <div className={cn(
            `grid ${gridCols} gap-1 items-start p-0.5 rounded transition-colors`,
            isError ? 'bg-red-500/5 ring-1 ring-red-500/20' : 'hover:bg-muted/30'
        )}>
            {inputs.map((input, i) => (
                <div key={i} className="relative">
                    <Input
                        className={cn(
                            "h-7 text-xs px-1.5 text-center transition-all",
                            input.hasError && "border-red-500 bg-red-500/10 text-red-500 font-bold"
                        )}
                        placeholder={input.placeholder}
                        value={input.value}
                        onChange={e => input.onChange(e.target.value)}
                    />
                    {input.hasError && <TooltipErro mensagem={validacao.msg} className="-top-1 -right-1 w-3 h-3 text-[8px]" />}
                </div>
            ))}
            {extra}
            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive shrink-0" onClick={onRemove}>
                <Trash2 className="w-3 h-3" />
            </Button>
        </div>
    );
}
