/**
 * Página: Índices Físicos e Limites de Consistência
 * modulos/indiceslimites/pagina.tsx
 *
 * Contém toda a lógica de estado, cálculos, formulários de entrada
 * e visualização de resultados em um componente unificado.
 */
import { useState, useEffect, useRef } from "react";
import { Helmet } from 'react-helmet-async';
import { 
    Beaker, Trash2, AlertCircle, Plus, Droplet, Info, 
    BarChart3, LayoutGrid, CheckCircle 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TooltipProvider } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

import { 
    parseOptional, parseOrZero, generateId, 
    calcularUmidade, calcularMBSInverso, parseDecimal 
} from "@/lib/shared";
import PrintHeader from "@/componentes/base/CabecalhoImpressao";
import { UI_STANDARDS } from "@/lib/ui-standards";
import { handleArrowNavigation } from "@/lib/navigation";

import { useIndicesLimitesStore } from "./store";
import { calcularIndicesFisicosMultiplasAmostras, calcularLimitesConsistencia } from "./calculos";
import { CaracterizacaoOutput } from "./types";
import DialogExemplos from "./componentes/DialogExemplos";
import { ExemploCaracterizacao } from "./exemplos";
import { BotaoLimpar } from "@/componentes/compartilhados/BotaoLimpar";
import { DefinicaoTooltip } from "@/components/ui/DefinicaoTooltip";
import { LinhaResultado } from "@/componentes/compartilhados/LinhaResultado";
import DiagramaFases from "./componentes/DiagramaFases";
import LimiteLiquidezChart from "./componentes/LimiteLiquidezChart";
import { Input } from "@/components/ui/input";

export default function IndicesLimitesPage() {
    const {
        amostras, settings, updateSettings, updateIndices,
        limites: globalLimites, updateLimites: updateGlobalLimites,
        setResult, clearResults, resetAmostras
    } = useIndicesLimitesStore();

    const [error, setError] = useState<string | null>(null);
    const [resultadoCombinado, setResultadoCombinado] = useState<CaracterizacaoOutput | null>(null);

    const navigate = useNavigate();

    // ─── Restaurar dados de relatório (sessionStorage) ───

    useEffect(() => {
        const storedData = sessionStorage.getItem('caracterizacao_lastData');
        if (!storedData) return;
        try {
            const data = JSON.parse(storedData);
            if (data.amostras?.length > 0) { resetAmostras(); updateIndices(0, data.amostras[0].indices); }
            if (data.settings) updateSettings(data.settings);
            if (data.limites) updateGlobalLimites(data.limites);
            if (data.resultadoCombinado) setResultadoCombinado(data.resultadoCombinado);
            toast.info("Dados restaurados do relatório.");
        } catch (e) {
            console.error("Erro ao restaurar dados", e);
        } finally {
            sessionStorage.removeItem('caracterizacao_lastData');
        }
    }, []);

    // ─── Auto-cálculo ───

    const handleCalculate = () => {
        try {
            const inputsIndices = amostras.map(a => {
                const mu = parseOptional(a.indices.massaUmida);
                const ms = parseOptional(a.indices.massaSeca);
                const t = parseOrZero(a.indices.tara);
                return {
                    peso_total: mu !== undefined ? mu - t : undefined,
                    peso_solido: ms !== undefined ? ms - t : undefined,
                    volume_total: parseOptional(a.indices.volume),
                    Gs: parseOptional(settings.Gs)!,
                    peso_especifico_agua: parseOptional(settings.pesoEspecificoAgua) || 10.0,
                };
            });

            const resIndices = calcularIndicesFisicosMultiplasAmostras(inputsIndices);

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
            amostras.forEach(a => setResult(a.id, combinedResult));
        } catch (err) {
            console.error(err);
            setResultadoCombinado(null);
        }
    };

    useEffect(() => {
        const timer = setTimeout(handleCalculate, 0);
        return () => clearTimeout(timer);
    }, [amostras, settings, globalLimites]);

    // ─── Handlers ───

    const handleClear = () => {
        resetAmostras();
        updateSettings({ Gs: "", pesoEspecificoAgua: "10.0", indice_vazios_max: "", indice_vazios_min: "" });
        updateGlobalLimites({
            pontosLL: Array.from({ length: 5 }, () => ({ id: generateId(), numGolpes: "", massaUmidaRecipiente: "", massaSecaRecipiente: "", massaRecipiente: "", umidade: "" })),
            pontosLP: Array.from({ length: 3 }, () => ({ id: generateId(), massaUmidaRecipiente: "", massaSecaRecipiente: "", massaRecipiente: "", umidade: "" })),
        });
        clearResults();
        setResultadoCombinado(null);
        setError(null);
        toast.info("Campos limpos!");
    };

    const handleLoadExample = (exemplo: ExemploCaracterizacao) => {
        handleClear();
        updateSettings(exemplo.settings);
        updateGlobalLimites({
            pontosLL: exemplo.limites.pontosLL.map(p => ({ ...p, id: generateId(), umidade: calcularUmidade(p.massaUmidaRecipiente, p.massaSecaRecipiente, p.massaRecipiente) })),
            pontosLP: exemplo.limites.pontosLP.map(p => ({ ...p, id: generateId(), umidade: calcularUmidade(p.massaUmidaRecipiente, p.massaSecaRecipiente, p.massaRecipiente) })),
        });
        updateIndices(0, { massaUmida: exemplo.indices.massaUmida, massaSeca: exemplo.indices.massaSeca, volume: exemplo.indices.volume });
        toast.success(`${exemplo.nome} carregado!`);
    };



    // ─── Render ───

    return (
        <div className={UI_STANDARDS.pageContainer}>
            <Helmet>
                <title>Índices Físicos e Limites de Consistência | EduSolos</title>
                <meta name="description" content="Análise completa da caracterização física do solo: índices físicos, limites de liquidez (LL) e plasticidade (LP), e diagrama de fases interativo." />
            </Helmet>
            <PrintHeader moduleTitle="Índices Físicos e Limites de Consistência" moduleName="caracterizacao" />

            <div className={UI_STANDARDS.header.container} data-tour="module-header">
                <div className="flex items-center gap-3">
                    <div className={UI_STANDARDS.header.iconContainer}><Beaker className={UI_STANDARDS.header.icon} /></div>
                    <div>
                        <h1 className={UI_STANDARDS.header.title}>Índices Físicos e Limites de Consistência</h1>
                        <p className={UI_STANDARDS.header.subtitle}>Análise das propriedades físicas do solo</p>
                    </div>
                </div>
                <div className={UI_STANDARDS.header.actionsContainer}>
                    <Separator orientation="vertical" className="h-6 mx-1 bg-border" />
                    <DialogExemplos onSelectExample={handleLoadExample} />
                    <Separator orientation="vertical" className="h-6 mx-1 bg-border" />
                    <BotaoLimpar onLimpar={handleClear} />
                </div>
            </div>

            {error && <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertDescription>{error}</AlertDescription></Alert>}

            <div className={UI_STANDARDS.mainGrid}>
                <EntradaDados />
                <ResultadosView resultadoCombinado={resultadoCombinado} />
            </div>
        </div>
    );
}

// ─── Componente ResultadosView ───

const ResultadosView = ({ resultadoCombinado }: { resultadoCombinado: CaracterizacaoOutput | null }) => {
    const [resultTab, setResultTab] = useState("resultados");
    const limiteLiquidezChartRef = useRef<HTMLDivElement>(null);
    const displayResult = resultadoCombinado || {} as CaracterizacaoOutput;

    return (
        <div className="space-y-4 animate-in slide-in-from-right-5 duration-300">
            {resultadoCombinado?.erro ? (
                <Alert variant="destructive" className="min-h-[200px] flex items-center">
                    <AlertCircle className="h-5 w-5" />
                    <AlertDescription className="text-base ml-2">{resultadoCombinado.erro}</AlertDescription>
                </Alert>
            ) : (
                <Tabs value={resultTab} onValueChange={setResultTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-2 mb-4">
                        <TabsTrigger value="resultados" className="gap-1.5"><BarChart3 className="w-4 h-4" />Resultados</TabsTrigger>
                        <TabsTrigger value="graficos" className="gap-1.5"><LayoutGrid className="w-4 h-4" />Gráficos</TabsTrigger>
                    </TabsList>

                    <TabsContent value="resultados" className="mt-0 animate-in fade-in-50 slide-in-from-left-2 duration-300">
                        <Card className="glass">
                            <CardContent className="p-0">
                                <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-border">
                                    {/* Índices Físicos */}
                                    <div className="p-3 space-y-2">
                                        <h4 className="font-semibold text-sm flex items-center gap-2 text-primary">
                                            <Beaker className="w-4 h-4" />Índices Físicos
                                        </h4>
                                        <div className="space-y-[1px]">
                                            <LinhaResultado
                                                id="w"
                                                simbolo="w"
                                                label="Umidade"
                                                value={displayResult.w}
                                                precision={1}
                                            />
                                            <LinhaResultado
                                                id="gamma"
                                                simbolo={<span>γ<sub className="text-xs not-italic">n</sub></span>}
                                                label="Peso Esp. Natural"
                                                value={displayResult.gamma_nat}
                                                precision={2}
                                            />
                                            <LinhaResultado
                                                id="gamma_d"
                                                simbolo={<span>γ<sub className="text-xs not-italic">d</sub></span>}
                                                label="Peso Esp. Seco"
                                                value={displayResult.gamma_d}
                                                precision={2}
                                            />
                                            <LinhaResultado
                                                id="e"
                                                simbolo="e"
                                                label="Índice de Vazios"
                                                value={displayResult.e}
                                                precision={2}
                                            />
                                            <LinhaResultado
                                                id="n"
                                                simbolo="n"
                                                label="Porosidade"
                                                value={displayResult.n}
                                                precision={0}
                                            />
                                            <LinhaResultado
                                                id="Sr"
                                                simbolo="S"
                                                label="Grau de Saturação"
                                                value={displayResult.Sr}
                                                precision={0}
                                            />
                                            <LinhaResultado
                                                id="gamma_sat"
                                                simbolo={<span>γ<sub className="text-xs not-italic">sat</sub></span>}
                                                label="Peso Esp. Saturado"
                                                value={displayResult.gamma_sat}
                                                unit="kN/m³"
                                                precision={2}
                                            />
                                        </div>
                                    </div>

                                    {/* Limites */}
                                    <div className="p-3 space-y-2">
                                        <h4 className="font-semibold text-sm flex items-center gap-2 text-blue-500">
                                            <Droplet className="w-4 h-4" />Limites de Consistência
                                        </h4>
                                        <div className="space-y-[1px]">
                                            <LinhaResultado
                                                id="LL"
                                                simbolo="LL"
                                                label="Limite de Liquidez"
                                                value={displayResult.ll}
                                                precision={0}
                                            />
                                            <LinhaResultado
                                                id="LP"
                                                simbolo="LP"
                                                label="Limite de Plasticidade"
                                                value={displayResult.lp}
                                                precision={0}
                                            />
                                            <LinhaResultado
                                                id="IP"
                                                simbolo="IP"
                                                label="Índice de Plasticidade"
                                                value={displayResult.ip}
                                                precision={0}
                                            />
                                            <LinhaResultado
                                                id="IC"
                                                simbolo="IC"
                                                label="Índice de Consistência"
                                                value={displayResult.ic}
                                                precision={2}
                                            />
                                        </div>
                                        <Separator className="my-3" />
                                        <div className="space-y-1.5 text-sm">
                                            {displayResult.classificacao_plasticidade && (
                                                <div className="flex items-center gap-2">
                                                    <Badge variant="outline" className="text-xs">Plasticidade</Badge>
                                                    <span className="font-medium">{displayResult.classificacao_plasticidade}</span>
                                                </div>
                                            )}
                                            {displayResult.classificacao_consistencia && (
                                                <div className="flex items-center gap-2">
                                                    <Badge variant="outline" className="text-xs">Consistência</Badge>
                                                    <span className="font-medium">{displayResult.classificacao_consistencia}</span>
                                                </div>
                                            )}
                                            {!displayResult.lp && (
                                                <>
                                                    <Separator className="my-2" />
                                                    <LinhaResultado id="Dr" simbolo={<span>D<sub>r</sub></span>} label="Compacidade Relativa" value={displayResult.compacidade_relativa} precision={0} />
                                                    {displayResult.classificacao_compacidade && (
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <Badge variant="outline" className="text-xs">Compacidade</Badge>
                                                            <span className="font-medium">{displayResult.classificacao_compacidade}</span>
                                                        </div>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="graficos" className="mt-0 space-y-4 animate-in fade-in-50 slide-in-from-right-2 duration-300">
                        <Card className="glass">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm">Diagrama de Fases</CardTitle>
                                <CardDescription>Representação visual das proporções de sólidos, água e ar.</CardDescription>
                            </CardHeader>
                            <CardContent>
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
                        <Card className="glass">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm">Gráfico - Limite de Liquidez</CardTitle>
                                <CardDescription>Regressão linear: Umidade (%) vs. log(Golpes).</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <LimiteLiquidezChart
                                    ref={limiteLiquidezChartRef}
                                    pontos={displayResult.pontos_grafico_ll || []}
                                    ll={displayResult.ll || null}
                                />
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            )}
        </div>
    );
};

const EntradaDados = () => {
    const {
        amostras, currentAmostraIndex,
        settings, updateSettings, updateIndices,
        limites, updateLimites
    } = useIndicesLimitesStore();
    const currentAmostra = amostras[currentAmostraIndex];

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

    const parseUmidades = (pontos: { umidade: string }[]) =>
        pontos.map(p => {
            const w = parseDecimal(p.umidade.toString());
            return isNaN(w) ? null : w;
        });

    const umidadesLP = parseUmidades(limites.pontosLP);
    const umidadesLL = parseUmidades(limites.pontosLL);

    const pontosLLValidos = limites.pontosLL
        .map((p, i) => ({ index: i, golpes: parseInt(p.numGolpes), umidade: umidadesLL[i] }))
        .filter(p => !isNaN(p.golpes) && p.umidade !== null)
        .sort((a, b) => a.golpes - b.golpes);

    const validarPontoLL = (index: number): { status: 'ok' | 'warn' | 'error', msg?: string } => {
        const ponto = limites.pontosLL[index];
        const golpes = parseInt(ponto.numGolpes);
        const umidade = umidadesLL[index];

        if (isNaN(golpes) || !ponto.numGolpes) return { status: 'ok' };
        if (golpes < 15 || golpes > 35) {
            return { status: 'error', msg: `Erro: ${golpes} golpes. Fora do intervalo prescrito de 15 a 35 golpes (NBR 6459/2025).` };
        }

        if (umidade !== null && pontosLLValidos.length >= 2) {
            const pontoOrdenado = pontosLLValidos.find(p => p.index === index);
            if (pontoOrdenado) {
                const pos = pontosLLValidos.indexOf(pontoOrdenado);
                if (pos > 0) {
                    const prev = pontosLLValidos[pos - 1];
                    if (prev.umidade !== null && prev.umidade < umidade) {
                        return { status: 'error', msg: `Erro físico: ${golpes} golpes com ${umidade.toFixed(1)}% > ${prev.golpes} golpes com ${prev.umidade.toFixed(1)}%` };
                    }
                }
                if (pos < pontosLLValidos.length - 1) {
                    const next = pontosLLValidos[pos + 1];
                    if (next.umidade !== null && next.umidade > umidade) {
                        return { status: 'error', msg: `Erro físico: ${golpes} golpes com ${umidade.toFixed(1)}% < ${next.golpes} golpes com ${next.umidade.toFixed(1)}%` };
                    }
                }
            }
        }
        return { status: 'ok' };
    };

    const pontosLLPreenchidos = limites.pontosLL.filter(p =>
        p.numGolpes && p.massaUmidaRecipiente && p.massaSecaRecipiente && p.massaRecipiente
    ).length;

    const avisoQuantidadePontosLL = (): { status: 'ok' | 'error', msg?: string } => {
        if (pontosLLPreenchidos > 0 && pontosLLPreenchidos < 5) {
            return { status: 'error', msg: `Erro: Um mínimo de 5 determinações são necessárias para cálculo do limite de liquidez (NBR 6459/2025).` };
        }
        return { status: 'ok' };
    };

    const calcularDesvioLP = (index: number): number | null => {
        const umidadeAtual = umidadesLP[index];
        if (umidadeAtual === null) return null;
        const validas = umidadesLP.filter((u): u is number => u !== null);
        if (validas.length < 2) return null;
        const media = validas.reduce((a, b) => a + b, 0) / validas.length;
        return Math.abs(umidadeAtual - media);
    };

    const validarVariacaoLP = (index: number): { status: 'ok' | 'error', msg?: string } => {
        const desvio = calcularDesvioLP(index);
        if (desvio === null) return { status: 'ok' };
        if (desvio > 5) {
            return { status: 'error', msg: `Erro: Amostra com desvio de ${desvio.toFixed(1)}% em relação à média. Desvio máximo permitido 5% (NBR 7180/2025). Exclua esta amostra.` };
        }
        return { status: 'ok' };
    };

    const pontosLPPreenchidos = limites.pontosLP.filter(p =>
        p.massaUmidaRecipiente && p.massaSecaRecipiente && p.massaRecipiente
    ).length;

    const avisoQuantidadePontosLP = (): { status: 'ok' | 'error', msg?: string } => {
        if (pontosLPPreenchidos > 0 && pontosLPPreenchidos < 3) {
            return { status: 'error', msg: `Erro: Um mínimo de 3 determinações são necessárias para cálculo do limite de plasticidade (NBR 7180/2025).` };
        }
        return { status: 'ok' };
    };

    return (
        <div className="space-y-4 animate-in slide-in-from-left-5 duration-300" onKeyDown={handleArrowNavigation}>
            {/* Card: Índices Físicos */}
            <Card className="glass border-primary/20">
                <CardHeader className="pb-3 bg-gradient-to-r from-primary/5 to-transparent flex flex-row items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-base">
                        <Beaker className="w-5 h-5 text-primary" />
                        Dados de Índices Físicos
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 pt-3">
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <InputField id="Gs" label="Gs (Dens. Grãos)" placeholder="Ex: 2.65"
                                value={settings.Gs} onChange={(v) => updateSettings({ Gs: v })} />
                            <InputField id="massaUmida" label="MBU (g)" placeholder="0.00"
                                value={currentAmostra.indices.massaUmida} onChange={(v) => updateIndices(currentAmostraIndex, { massaUmida: v })} />
                            <InputField id="massaSeca" label="MBS (g)" placeholder="0.00"
                                value={currentAmostra.indices.massaSeca} onChange={(v) => updateIndices(currentAmostraIndex, { massaSeca: v })} />
                            <InputField id="tara" label="Tara (g)" placeholder="0.00"
                                value={currentAmostra.indices.tara || ""} onChange={(v) => updateIndices(currentAmostraIndex, { tara: v })} />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <InputField id="volume" label="Volume (cm³)" placeholder="Ex: 100"
                                value={currentAmostra.indices.volume || ""} onChange={(v) => updateIndices(currentAmostraIndex, { volume: v })} />
                            <InputField id="emin" label={<>e<sub>mín</sub></>} placeholder="Ex: 0.4"
                                value={settings.indice_vazios_min} onChange={(v) => updateSettings({ indice_vazios_min: v })} />
                            <InputField id="emax" label={<>e<sub>máx</sub></>} placeholder="Ex: 0.9"
                                value={settings.indice_vazios_max} onChange={(v) => updateSettings({ indice_vazios_max: v })} />
                        </div>
                    </div>
                    {(settings.indice_vazios_min || settings.indice_vazios_max) &&
                        limites.pontosLP.some(p => p.massaUmidaRecipiente || p.massaSecaRecipiente || p.massaRecipiente) && (
                            <p className="text-xs text-red-500/90 flex items-start gap-1.5 mt-2 font-medium">
                                <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                                Erro: Solo com plasticidade (LP). emin e emáx não são necessários, dado que o cálculo de CR (Compacidade Relativa) não é aplicável.
                            </p>
                        )}
                </CardContent>
            </Card>

            {/* Card: Limites de Consistência */}
            <Card className="glass border-blue-500/20">
                <CardHeader className="pb-3 bg-gradient-to-r from-blue-500/5 to-transparent">
                    <CardTitle className="flex items-center gap-2 text-base">
                        <Droplet className="w-5 h-5 text-blue-500" />
                        Limites de Consistência (LL e LP)
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* LL */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <Label className="text-sm font-medium">Limite de Liquidez (LL)</Label>
                            <Button size="sm" variant="ghost" onClick={addPontoLL} className="h-7 px-2 text-xs gap-1">
                                <Plus className="w-3 h-3" /> Ponto
                            </Button>
                        </div>
                        <div className="grid grid-cols-[50px,1fr,1fr,1fr,70px,32px] gap-1.5 px-2 mb-1 text-[10px] text-muted-foreground font-medium text-center">
                            <div>Golpes</div><div>MBU (g)</div><div>MBS (g)</div><div>Tara (g)</div><div>w (%)</div><div></div>
                        </div>
                        <div className="space-y-1">
                            {limites.pontosLL.map((ponto, i) => {
                                const validacao = validarPontoLL(i);
                                return (
                                    <PontoRow key={ponto.id} validacao={validacao}
                                        gridCols="grid-cols-[50px,1fr,1fr,1fr,70px,auto]"
                                        inputs={[
                                            { placeholder: "N", value: ponto.numGolpes, onChange: v => handleUpdateLL(i, 'numGolpes', v) },
                                            { placeholder: "g", value: ponto.massaUmidaRecipiente, onChange: v => handleUpdateLL(i, 'massaUmidaRecipiente', v) },
                                            { placeholder: "g", value: ponto.massaSecaRecipiente, onChange: v => handleUpdateLL(i, 'massaSecaRecipiente', v) },
                                            { placeholder: "g", value: ponto.massaRecipiente, onChange: v => handleUpdateLL(i, 'massaRecipiente', v) },
                                            { placeholder: "%", value: ponto.umidade || "", onChange: v => handleUpdateUmidadeLL(i, v) },
                                        ]}
                                        onRemove={() => removePontoLL(i)}
                                    />
                                );
                            })}
                        </div>
                        <ValidationMessage validation={avisoQuantidadePontosLL()} />
                    </div>

                    <Separator />

                    {/* LP */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <Label className="text-sm font-medium">Limite de Plasticidade (LP)</Label>
                            <Button size="sm" variant="ghost" onClick={addPontoLP} className="h-7 px-2 text-xs gap-1">
                                <Plus className="w-3 h-3" /> Ponto
                            </Button>
                        </div>
                        <div className="grid grid-cols-[1fr,1fr,1fr,70px,60px,32px] gap-1.5 px-2 mb-1 text-[10px] text-muted-foreground font-medium text-center">
                            <div>MBU (g)</div><div>MBS (g)</div><div>Tara (g)</div><div>w (%)</div><div>Desvio (%)</div><div></div>
                        </div>
                        <div className="space-y-1">
                            {limites.pontosLP.map((ponto, i) => {
                                const validacao = validarVariacaoLP(i);
                                const desvio = calcularDesvioLP(i);
                                return (
                                    <PontoRow key={ponto.id || i} validacao={validacao}
                                        gridCols="grid-cols-[1fr,1fr,1fr,70px,60px,auto]"
                                        inputs={[
                                            { placeholder: "g", value: ponto.massaUmidaRecipiente || "", onChange: v => handleUpdateLP(i, 'massaUmidaRecipiente', v) },
                                            { placeholder: "g", value: ponto.massaSecaRecipiente || "", onChange: v => handleUpdateLP(i, 'massaSecaRecipiente', v) },
                                            { placeholder: "g", value: ponto.massaRecipiente || "", onChange: v => handleUpdateLP(i, 'massaRecipiente', v) },
                                            { placeholder: "%", value: ponto.umidade || "", onChange: v => handleUpdateUmidadeLP(i, v) },
                                        ]}
                                        onRemove={() => removePontoLP(i)}
                                        extra={
                                            <div className={cn(
                                                "h-8 text-xs px-1 flex items-center justify-center rounded-md font-mono",
                                                desvio !== null && desvio > 5 ? "text-red-400 bg-red-500/10 border border-red-500/30" : "text-muted-foreground bg-muted/10"
                                            )}>
                                                {desvio !== null ? `${desvio.toFixed(1)}%` : "-"}
                                            </div>
                                        }
                                    />
                                );
                            })}
                        </div>
                        <ValidationMessage validation={avisoQuantidadePontosLP()} />
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

// ─── Sub-componentes internos EntradaDados ───

function InputField({ id, label, placeholder, value, onChange }: {
    id: string; label: React.ReactNode; placeholder: string;
    value: string; onChange: (v: string) => void;
}) {
    return (
        <div className="space-y-1.5">
            <div className="flex items-center h-5">
                <Label htmlFor={id} className="text-xs flex items-center gap-1">
                    {label}
                    <DefinicaoTooltip id={id} side="top" iconClassName="w-3 h-3" />
                </Label>
            </div>
            <Input id={id} placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} className="h-9" />
        </div>
    );
}

function PontoRow({ validacao, gridCols, inputs, onRemove, extra }: {
    validacao: { status: string; msg?: string };
    gridCols: string;
    inputs: { placeholder: string; value: string; onChange: (v: string) => void }[];
    onRemove: () => void;
    extra?: React.ReactNode;
}) {
    const borderClass = validacao.status === 'error'
        ? 'border-red-500/70 bg-red-500/5'
        : validacao.status === 'warn'
            ? 'border-amber-500/70 bg-amber-500/5'
            : 'border bg-muted/5';

    return (
        <div className="relative">
            <div className={cn(`grid ${gridCols} gap-1.5 items-center p-1.5 rounded-md transition-colors hover:bg-muted/10`, borderClass)}>
                {inputs.map((input, i) => (
                    <Input key={i} className="h-8 text-xs px-2 text-center" placeholder={input.placeholder}
                        value={input.value} onChange={e => input.onChange(e.target.value)} />
                ))}
                {extra}
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive/70 hover:text-destructive shrink-0" onClick={onRemove}>
                    <Trash2 className="w-3.5 h-3.5" />
                </Button>
            </div>
            {validacao.msg && (
                <p className={cn("text-[10px] mt-0.5 ml-1 flex items-center gap-1",
                    validacao.status === 'error' ? 'text-red-400' : 'text-amber-400')}>
                    <AlertCircle className="w-3 h-3" /> {validacao.msg}
                </p>
            )}
        </div>
    );
}

function ValidationMessage({ validation }: { validation: { status: string; msg?: string } }) {
    if (!validation.msg) return null;
    return (
        <p className={cn("text-[10px] mt-1 flex items-center gap-1 px-1",
            validation.status === 'error' ? 'text-red-400' : 'text-amber-400')}>
            <AlertCircle className="w-3 h-3" /> {validation.msg}
        </p>
    );
}

// ─── Componente ResultadosView ───
