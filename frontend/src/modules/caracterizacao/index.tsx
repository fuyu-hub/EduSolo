// frontend/src/modules/caracterizacao/index.tsx
import { useState, useRef, useEffect } from "react";
import {
    Beaker, Calculator, RefreshCw, Trash2, Plus, GraduationCap, Download,
    Droplet, AlertCircle, Info, BarChart3, LayoutGrid,
    ChevronDown, Users, Save
} from "lucide-react";
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
import { useNavigate } from "react-router-dom";
import { useRecentReports } from "@/hooks/useRecentReports";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CheckCircle } from "lucide-react";
import ExportPDFDialog from "@/components/ExportPDFDialog";

// Tooltips
const tooltips = {
    massaUmida: "Massa total da amostra de solo incluindo a água (g)",
    massaSeca: "Massa da amostra após secagem em estufa (g)",
    volume: "Volume total da amostra incluindo vazios (cm³)",
    Gs: "Densidade dos grãos (adimensional, ex: 2.65). Necessário para calcular todos os índices físicos.",
};



const generateId = () => `${Date.now()}-${Math.random()}`;



import DialogExemplos from "./components/DialogExemplos";
import { ExemploCaracterizacao } from "@/lib/exemplos-caracterizacao";

export default function CaracterizacaoPage() {
    const {
        amostras, currentAmostraIndex, addAmostra, setCurrentAmostra, removeAmostra,
        settings, updateSettings, updateIndices,
        limites: globalLimites, updateLimites: updateGlobalLimites, // Renaming for clarity
        results, setResult, clearResults, resetAmostras
    } = useCaracterizacaoStore();

    const currentAmostra = amostras[currentAmostraIndex];

    const [isCalculating, setIsCalculating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isExportingPDF, setIsExportingPDF] = useState(false);
    const [savedBlob, setSavedBlob] = useState<Blob | null>(null);
    const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);

    // PDF Export State
    const [isExportPDFDialogOpen, setIsExportPDFDialogOpen] = useState(false);
    const [pdfFileName, setPdfFileName] = useState("");
    const [customReportTitle, setCustomReportTitle] = useState("");

    const navigate = useNavigate();
    const { addReport } = useRecentReports();

    useEffect(() => {
        const storedData = sessionStorage.getItem('caracterizacao_lastData');
        if (storedData) {
            try {
                const data = JSON.parse(storedData);
                // Restore samples
                if (data.amostras && Array.isArray(data.amostras)) {
                    // Reset first to clear default
                    resetAmostras();
                    // Add remaining samples
                    for (let i = 0; i < data.amostras.length; i++) {
                        if (i > 0) addAmostra();
                        updateIndices(i, data.amostras[i].indices);
                    }
                }
                // Restore settings
                if (data.settings) {
                    updateSettings(data.settings);
                }
                // Restore limits
                if (data.limites) {
                    updateGlobalLimites(data.limites);
                }
                // Restore computed results if present
                if (data.resultadoCombinado) {
                    setResultadoCombinado(data.resultadoCombinado);
                }

                toast.info("Dados restaurados do relatório.");
            } catch (e) {
                console.error("Erro ao restaurar dados", e);
            } finally {
                sessionStorage.removeItem('caracterizacao_lastData');
            }
        }
    }, []);



    // Resultado combinado (média de todas as amostras)
    const [resultadoCombinado, setResultadoCombinado] = useState<CaracterizacaoOutput | null>(null);

    // Handler para Calcular - calcula média de todas as amostras
    const handleCalculate = async () => {
        setIsCalculating(true);
        setError(null);

        try {
            // Preparar inputs de todas as amostras
            const inputsIndices = amostras.map(amostra => ({
                peso_total: parseFloat(amostra.indices.massaUmida),
                peso_solido: parseFloat(amostra.indices.massaSeca),
                volume_total: amostra.indices.volume ? parseFloat(amostra.indices.volume) : undefined,
                Gs: parseFloat(settings.Gs),
                peso_especifico_agua: parseFloat(settings.pesoEspecificoAgua),
            }));

            // Calcular índices físicos (já retorna média se múltiplas amostras)
            const resIndices = calcularIndicesFisicosMultiplasAmostras(inputsIndices);

            // Calcular Limites (Global)
            let resLimites: any = {};
            const pontosLL = globalLimites.pontosLL.map(p => ({
                num_golpes: parseInt(p.numGolpes),
                massa_umida_recipiente: parseFloat(p.massaUmidaRecipiente),
                massa_seca_recipiente: parseFloat(p.massaSecaRecipiente),
                massa_recipiente: parseFloat(p.massaRecipiente)
            })).filter(p => !isNaN(p.num_golpes) && !isNaN(p.massa_umida_recipiente));

            const pontosLP = globalLimites.pontosLP.map(p => ({
                massa_umida_recipiente: parseFloat(p.massaUmidaRecipiente),
                massa_seca_recipiente: parseFloat(p.massaSecaRecipiente),
                massa_recipiente: parseFloat(p.massaRecipiente)
            })).filter(p => !isNaN(p.massa_umida_recipiente));

            if (pontosLL.length >= 2 && pontosLP.length >= 1) {
                resLimites = calcularLimitesConsistencia({
                    pontos_ll: pontosLL,
                    pontos_lp: pontosLP,
                    umidade_natural: globalLimites.umidadeNatural ? parseFloat(globalLimites.umidadeNatural) : undefined,
                    percentual_argila: globalLimites.percentualArgila ? parseFloat(globalLimites.percentualArgila) : undefined
                });
            }

            // Unificar Resultados
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

            setResultadoCombinado(combinedResult);

            // Também salva para cada amostra individual (para referência)
            amostras.forEach(amostra => {
                setResult(amostra.id, combinedResult);
            });

            if (!combinedResult.erro) {
                toast.success(`Cálculos realizados! ${amostras.length > 1 ? `(Média de ${amostras.length} amostras)` : ''}`);
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
        // Reset samples to a single default sample
        resetAmostras();

        updateSettings({ Gs: "", pesoEspecificoAgua: "10.0", indice_vazios_max: "", indice_vazios_min: "" });

        updateGlobalLimites({
            pontosLL: [
                { id: generateId(), numGolpes: "", massaUmidaRecipiente: "", massaSecaRecipiente: "", massaRecipiente: "" },
                { id: generateId(), numGolpes: "", massaUmidaRecipiente: "", massaSecaRecipiente: "", massaRecipiente: "" }
            ],
            pontosLP: [{ id: generateId(), massaUmidaRecipiente: "", massaSecaRecipiente: "", massaRecipiente: "" }],
            umidadeNatural: "",
            percentualArgila: ""
        });
        clearResults();
        setResultadoCombinado(null);
        setError(null);
        toast.info("Campos limpos!");
    };

    const handleLoadExample = (exemplo: ExemploCaracterizacao) => {
        // Clear everything first, which also resets samples to 1
        handleClear();

        // 1. Set Settings
        updateSettings(exemplo.settings);

        // 2. Set Limits (Global)
        updateGlobalLimites({
            pontosLL: exemplo.limites.pontosLL.map(p => ({ ...p, id: generateId() })),
            pontosLP: exemplo.limites.pontosLP.map(p => ({ ...p, id: generateId() })),
            umidadeNatural: exemplo.limites.umidadeNatural,
            percentualArgila: exemplo.limites.percentualArgila,
        });

        // 3. Set Samples (Indices)
        // Ensure we have the correct number of samples
        // The handleClear() above resets to 1 sample.
        // We need to add (exemplo.numAmostras - 1) more samples.
        for (let i = 0; i < exemplo.numAmostras; i++) {
            if (i > 0) {
                addAmostra(); // Add new sample if not the first one
            }

            // Apply slight variation for multiple samples
            const variation = () => (1 + (Math.random() * 0.04 - 0.02)); // +/- 2%

            updateIndices(i, {
                massaUmida: (parseFloat(exemplo.indices.massaUmida) * variation()).toFixed(2),
                massaSeca: (parseFloat(exemplo.indices.massaSeca) * variation()).toFixed(2),
                volume: exemplo.indices.volume // Volume usually constant or varies less
            });
        }

        toast.success(`${exemplo.nome} carregado!`);
    };

    // PDF Export Initialization
    const handleExportPDF = () => {
        if (!resultadoCombinado || resultadoCombinado.erro) {
            toast.error("Calcule os resultados antes de exportar.");
            return;
        }

        const defaultName = generateDefaultPDFFileName("Caracterização Física");
        setPdfFileName(defaultName);
        setIsExportPDFDialogOpen(true);
    };

    // Actual PDF Export Logic
    const handleConfirmExportPDF = async () => {
        if (!resultadoCombinado || resultadoCombinado.erro) return;

        setIsExportingPDF(true);
        setIsExportPDFDialogOpen(false); // Close first

        try {
            const inputs: { label: string; value: string }[] = [
                { label: "Número de Amostras", value: `${amostras.length}` },
                { label: "Gs", value: settings.Gs },
            ];

            const resultsList: { label: string; value: string; highlight?: boolean }[] = [];
            if (resultadoCombinado.w != null) resultsList.push({ label: "Umidade (w)", value: `${formatNumberForExport(resultadoCombinado.w)}%` });
            if (resultadoCombinado.gamma_nat != null) resultsList.push({ label: "γ natural", value: `${formatNumberForExport(resultadoCombinado.gamma_nat)} kN/m³` });
            if (resultadoCombinado.gamma_d != null) resultsList.push({ label: "γ seco", value: `${formatNumberForExport(resultadoCombinado.gamma_d)} kN/m³` });
            if (resultadoCombinado.e != null) resultsList.push({ label: "Índice de Vazios (e)", value: formatNumberForExport(resultadoCombinado.e, 3) });
            if (resultadoCombinado.n != null) resultsList.push({ label: "Porosidade (n)", value: `${formatNumberForExport(resultadoCombinado.n)}%` });
            if (resultadoCombinado.Sr != null) resultsList.push({ label: "Saturação (Sr)", value: `${formatNumberForExport(resultadoCombinado.Sr)}%` });
            if (resultadoCombinado.ll != null) resultsList.push({ label: "Limite de Liquidez (LL)", value: `${formatNumberForExport(resultadoCombinado.ll)}%` });
            if (resultadoCombinado.lp != null) resultsList.push({ label: "Limite de Plasticidade (LP)", value: `${formatNumberForExport(resultadoCombinado.lp)}%` });
            if (resultadoCombinado.ip != null) resultsList.push({ label: "Índice de Plasticidade (IP)", value: `${formatNumberForExport(resultadoCombinado.ip)}%`, highlight: true });
            if (resultadoCombinado.classificacao_plasticidade) resultsList.push({ label: "Classificação Plasticidade", value: resultadoCombinado.classificacao_plasticidade });
            if (resultadoCombinado.classificacao_consistencia) resultsList.push({ label: "Classificação Consistência", value: resultadoCombinado.classificacao_consistencia });

            const exportData: ExportData = {
                moduleName: "caracterizacao",
                moduleTitle: "Caracterização Física do Solo",
                inputs,
                results: resultsList,
                customFileName: pdfFileName,
                customTitle: customReportTitle
            };


            const pdfResult = await exportToPDF(exportData, true);

            if (pdfResult instanceof Blob) {
                setSavedBlob(pdfResult);

                // Convert Blob to Base64 for storage
                const reader = new FileReader();
                reader.readAsDataURL(pdfResult);
                reader.onloadend = () => {
                    const result = reader.result as string;
                    const base64data = result.split(',')[1] || ''; // Extract pure base64

                    // Use custom file name for report name, removing .pdf extension if present
                    const reportName = pdfFileName.replace(/\.pdf$/i, '');

                    addReport({
                        name: reportName,
                        moduleType: "caracterizacao",
                        moduleName: "Índices Físicos e Consistência",
                        pdfUrl: "", // Blob URL is temporary, we use pdfData
                        pdfData: base64data,
                        calculationData: {
                            amostras,
                            settings,
                            limites: globalLimites,
                            resultadoCombinado
                        }
                    });

                    setIsSaveDialogOpen(true);
                    toast.success("Relatório salvo com sucesso!");
                };
            }

        } catch (err) {
            console.error(err);
            toast.error("Erro ao exportar PDF.");
        } finally {
            setIsExportingPDF(false);
        }
    };

    const handleDownloadLocal = () => {
        if (savedBlob) {
            const url = URL.createObjectURL(savedBlob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `caracterizacao_${new Date().getTime()}.pdf`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }
    };







    return (
        <div className="container mx-auto p-4 md:p-6 space-y-5 max-w-7xl animate-in fade-in duration-500">

            {/* Top Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-2 animate-in fade-in slide-in-from-left-4 duration-500" data-tour="module-header">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center shadow-lg transition-transform hover:scale-110 hover:rotate-3">
                        <Beaker className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-foreground">Índices Físicos e Consistência</h1>
                        <p className="text-muted-foreground text-sm">Análise das propriedades físicas do solo</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <LabModeSwitch />
                    <Separator orientation="vertical" className="h-6 mx-1 bg-border" />

                    {/* Botão de Exemplos */}
                    <DialogExemplos onSelectExample={handleLoadExample} />

                    <Button variant="outline" size="sm" onClick={handleExportPDF} className="gap-2">
                        <Save className="w-4 h-4" />
                        Salvar
                    </Button>

                    <Separator orientation="vertical" className="h-6 mx-1 bg-border" />

                    <Button variant="ghost" size="sm" onClick={handleClear} className="text-muted-foreground hover:text-destructive gap-1.5">
                        <Trash2 className="w-4 h-4" />
                        Limpar
                    </Button>

                    <Button size="sm" onClick={handleCalculate} disabled={isCalculating} className="gap-1.5 shadow-md bg-primary hover:bg-primary/90">
                        {isCalculating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Calculator className="w-4 h-4" />}
                        Calcular
                    </Button>
                </div>
            </div>

            {error && <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertDescription>{error}</AlertDescription></Alert>}

            {/* Conteúdo Principal */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <EntradaDados />
                <ResultadosView resultadoCombinado={resultadoCombinado} />
            </div>
            {/* Save Success Dialog */}
            <Dialog open={isSaveDialogOpen} onOpenChange={setIsSaveDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <div className="flex items-center gap-2 text-green-600 mb-2">
                            <CheckCircle className="h-6 w-6" />
                            <DialogTitle>Sucesso!</DialogTitle>
                        </div>
                        <DialogDescription>
                            O relatório foi salvo corretamente na sua lista de relatórios. O que deseja fazer agora?
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:justify-end">
                        <Button variant="outline" onClick={() => setIsSaveDialogOpen(false)}>
                            Fechar
                        </Button>
                        <Button variant="secondary" onClick={handleDownloadLocal} className="gap-2">
                            <Download className="h-4 w-4" />
                            Salvar Localmente
                        </Button>
                        <Button onClick={() => navigate("/relatorios")} className="gap-2">
                            Ir para Relatórios
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Export PDF Dialog */}
            <ExportPDFDialog
                open={isExportPDFDialogOpen}
                onOpenChange={setIsExportPDFDialogOpen}
                fileName={pdfFileName}
                onFileNameChange={setPdfFileName}
                customTitle={customReportTitle}
                onCustomTitleChange={setCustomReportTitle}
                showCustomTitle={true}
                onConfirm={handleConfirmExportPDF}
                isExporting={isExportingPDF}
            />
        </div >
    );
}

const EntradaDados = () => {
    const {
        amostras, currentAmostraIndex, addAmostra, setCurrentAmostra, removeAmostra,
        settings, updateSettings, updateIndices,
        limites, updateLimites
    } = useCaracterizacaoStore();
    const currentAmostra = amostras[currentAmostraIndex];

    // Handlers para atualizar pontos LL
    const handleUpdateLL = (idx: number, field: string, value: string) => {
        const newPontos = [...limites.pontosLL];
        newPontos[idx] = { ...newPontos[idx], [field]: value };
        updateLimites({ pontosLL: newPontos });
    };

    const addPontoLL = () => {
        updateLimites({
            pontosLL: [...limites.pontosLL, { id: generateId(), numGolpes: "", massaUmidaRecipiente: "", massaSecaRecipiente: "", massaRecipiente: "" }]
        });
    };

    const removePontoLL = (index: number) => {
        const newPontos = [...limites.pontosLL];
        newPontos.splice(index, 1);
        updateLimites({ pontosLL: newPontos });
    };

    const addPontoLP = () => {
        updateLimites({
            pontosLP: [...limites.pontosLP, { id: generateId(), massaUmidaRecipiente: "", massaSecaRecipiente: "", massaRecipiente: "" }]
        });
    };

    const removePontoLP = (index: number) => {
        const newPontos = [...limites.pontosLP];
        newPontos.splice(index, 1);
        updateLimites({ pontosLP: newPontos });
    };

    // Handlers para LP
    const handleUpdateLP = (idx: number, field: string, value: string) => {
        const newPontos = [...limites.pontosLP];
        newPontos[idx] = { ...newPontos[idx], [field]: value };
        updateLimites({ pontosLP: newPontos });
    };

    // Navegação com setas do teclado
    const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
        if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) return;

        const target = e.target as HTMLInputElement;
        if (target.tagName !== 'INPUT') return;

        // Para setas laterais, apenas navega se o cursor estiver no início/fim ou se o input estiver vazio
        if (e.key === 'ArrowLeft' && target.value && target.selectionStart !== 0) return;
        if (e.key === 'ArrowRight' && target.value && target.selectionStart !== target.value.length) return;

        e.preventDefault();

        const container = e.currentTarget;
        const inputs = Array.from(container.querySelectorAll('input:not([disabled])')) as HTMLInputElement[];

        const rects = inputs.map(input => {
            const r = input.getBoundingClientRect();
            return { el: input, x: r.left + r.width / 2, y: r.top + r.height / 2, rect: r };
        });

        const currentRect = rects.find(r => r.el === target);
        if (!currentRect) return;

        let bestCandidate = null;
        let minDist = Infinity;

        rects.forEach(candidate => {
            if (candidate.el === target) return;

            let dx = candidate.x - currentRect.x;
            let dy = candidate.y - currentRect.y;
            let dist = Math.sqrt(dx * dx + dy * dy);

            // Filtros direcionais simples
            let isValid = false;
            if (e.key === 'ArrowUp') isValid = dy < -5 && Math.abs(dx) < Math.abs(dy) * 2; // Prioriza vertical
            if (e.key === 'ArrowDown') isValid = dy > 5 && Math.abs(dx) < Math.abs(dy) * 2;
            if (e.key === 'ArrowLeft') isValid = dx < -5 && Math.abs(dy) < Math.abs(dx); // Prioriza horizontal (linha)
            if (e.key === 'ArrowRight') isValid = dx > 5 && Math.abs(dy) < Math.abs(dx);

            if (isValid && dist < minDist) {
                minDist = dist;
                bestCandidate = candidate.el;
            }
        });

        if (bestCandidate) {
            (bestCandidate as HTMLInputElement).focus();
            // Opcional: selecionar todo o texto ao focar
            // (bestCandidate as HTMLInputElement).select(); 
        }
    };


    return (
        <div className="space-y-4 animate-in slide-in-from-left-5 duration-300" onKeyDown={handleKeyDown}>
            {/* Card: Índices Físicos */}
            <Card className="glass border-primary/20">
                <CardHeader className="pb-3 bg-gradient-to-r from-primary/5 to-transparent flex flex-row items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-base">
                        <Beaker className="w-5 h-5 text-primary" />
                        Dados de Índices Físicos
                    </CardTitle>

                    {/* Sample Management Inside Card Header */}
                    <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 rounded-md bg-background/50 border px-1 py-0.5 max-w-[250px] overflow-x-auto scrollbar-thin scrollbar-thumb-primary/20 scrollbar-track-transparent">
                            {amostras.map((amostra, idx) => (
                                <Badge
                                    key={amostra.id}
                                    variant={idx === currentAmostraIndex ? "default" : "outline"}
                                    className={cn(
                                        "cursor-pointer px-2 py-0.5 text-[10px] h-5 transition-all min-w-[70px] justify-center hover:bg-primary/20 shrink-0",
                                        idx === currentAmostraIndex && "shadow-sm ring-1 ring-primary/30"
                                    )}
                                    onClick={() => setCurrentAmostra(idx)}
                                >
                                    {amostra.nome}
                                </Badge>
                            ))}
                        </div>
                        {amostras.length > 1 && (
                            <Button size="icon" variant="ghost" onClick={() => removeAmostra(currentAmostraIndex)} className="h-6 w-6 text-muted-foreground hover:text-destructive shrink-0">
                                <Trash2 className="w-3 h-3" />
                            </Button>
                        )}
                        <Button size="icon" variant="ghost" onClick={addAmostra} disabled={amostras.length >= 3} className="h-6 w-6 text-muted-foreground hover:text-primary shrink-0">
                            <Plus className="w-3 h-3" />
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="space-y-3 pt-3">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="space-y-1.5">
                            <div className="flex items-center h-5">
                                <Label htmlFor="Gs" className="text-xs flex items-center gap-1">
                                    Gs (Dens. Grãos)
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger><Info className="w-3 h-3 text-muted-foreground" /></TooltipTrigger>
                                            <TooltipContent><p className="max-w-xs text-xs">{tooltips.Gs}</p></TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                </Label>
                            </div>
                            <Input id="Gs" placeholder="Ex: 2.65" value={settings.Gs} onChange={(e) => updateSettings({ Gs: e.target.value })} className="h-9" />
                        </div>
                        <div className="space-y-1.5">
                            <div className="flex items-center h-5">
                                <Label htmlFor="massaUmida" className="text-xs">Massa Úmida (g)</Label>
                            </div>
                            <Input id="massaUmida" placeholder="0.00" value={currentAmostra.indices.massaUmida} onChange={(e) => updateIndices(currentAmostraIndex, { massaUmida: e.target.value })} className="h-9" />
                        </div>
                        <div className="space-y-1.5">
                            <div className="flex items-center h-5">
                                <Label htmlFor="massaSeca" className="text-xs">Massa Seca (g)</Label>
                            </div>
                            <Input id="massaSeca" placeholder="0.00" value={currentAmostra.indices.massaSeca} onChange={(e) => updateIndices(currentAmostraIndex, { massaSeca: e.target.value })} className="h-9" />
                        </div>
                        <div className="space-y-1.5">
                            <div className="flex items-center h-5">
                                <Label htmlFor="volume" className="text-xs">Volume (cm³)</Label>
                            </div>
                            <Input id="volume" placeholder="Ex: 100" value={currentAmostra.indices.volume || ""} onChange={(e) => updateIndices(currentAmostraIndex, { volume: e.target.value })} className="h-9" />
                        </div>
                    </div>
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
                    {/* Pontos LL */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <Label className="text-sm font-medium">Limite de Liquidez (LL)</Label>
                            <Button size="sm" variant="ghost" onClick={addPontoLL} className="h-7 px-2 text-xs gap-1">
                                <Plus className="w-3 h-3" /> Ponto
                            </Button>
                        </div>

                        {/* Header Row */}
                        <div className="grid grid-cols-[50px,1fr,1fr,1fr,32px] gap-1.5 px-2 mb-1 text-[10px] text-muted-foreground font-medium text-center">
                            <div>Golpes</div>
                            <div>M.Ú+T (g)</div>
                            <div>M.S+T (g)</div>
                            <div>Tara (g)</div>
                            <div></div>
                        </div>

                        <div className="space-y-1 max-h-[220px] overflow-y-auto pr-1">
                            {limites.pontosLL.map((ponto, i) => (
                                <div key={ponto.id} className="grid grid-cols-[50px,1fr,1fr,1fr,auto] gap-1.5 items-center p-1.5 rounded-md border bg-muted/5 hover:bg-muted/10 transition-colors">
                                    <Input className="h-8 text-xs px-2 text-center" placeholder="N" value={ponto.numGolpes} onChange={e => handleUpdateLL(i, 'numGolpes', e.target.value)} />
                                    <Input className="h-8 text-xs px-2 text-center" placeholder="g" value={ponto.massaUmidaRecipiente} onChange={e => handleUpdateLL(i, 'massaUmidaRecipiente', e.target.value)} />
                                    <Input className="h-8 text-xs px-2 text-center" placeholder="g" value={ponto.massaSecaRecipiente} onChange={e => handleUpdateLL(i, 'massaSecaRecipiente', e.target.value)} />
                                    <Input className="h-8 text-xs px-2 text-center" placeholder="g" value={ponto.massaRecipiente} onChange={e => handleUpdateLL(i, 'massaRecipiente', e.target.value)} />
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive/70 hover:text-destructive shrink-0" onClick={() => removePontoLL(i)} disabled={limites.pontosLL.length <= 2}>
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </Button>
                                </div>
                            ))}
                        </div>
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

                        {/* Header Row */}
                        <div className="grid grid-cols-[1fr,1fr,1fr,32px] gap-1.5 px-2 mb-1 text-[10px] text-muted-foreground font-medium text-center">
                            <div>M.Ú+T (g)</div>
                            <div>M.S+T (g)</div>
                            <div>Tara (g)</div>
                            <div></div>
                        </div>

                        <div className="space-y-1 max-h-[220px] overflow-y-auto pr-1">
                            {limites.pontosLP.map((ponto, i) => (
                                <div key={ponto.id || i} className="grid grid-cols-[1fr,1fr,1fr,auto] gap-1.5 items-center p-1.5 rounded-md border bg-muted/5 hover:bg-muted/10 transition-colors">
                                    <Input className="h-8 text-xs px-2 text-center" placeholder="g" value={ponto.massaUmidaRecipiente || ""} onChange={e => handleUpdateLP(i, 'massaUmidaRecipiente', e.target.value)} />
                                    <Input className="h-8 text-xs px-2 text-center" placeholder="g" value={ponto.massaSecaRecipiente || ""} onChange={e => handleUpdateLP(i, 'massaSecaRecipiente', e.target.value)} />
                                    <Input className="h-8 text-xs px-2 text-center" placeholder="g" value={ponto.massaRecipiente || ""} onChange={e => handleUpdateLP(i, 'massaRecipiente', e.target.value)} />
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive/70 hover:text-destructive shrink-0" onClick={() => removePontoLP(i)} disabled={limites.pontosLP.length <= 1}>
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </div>

                    <Separator />

                    {/* Dados Adicionais */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <Label htmlFor="umidadeNatural" className="text-xs">Umidade Natural (%)</Label>
                            <Input id="umidadeNatural" placeholder="Opcional" value={limites.umidadeNatural || ""} onChange={e => updateLimites({ umidadeNatural: e.target.value })} className="h-9" />
                        </div>
                        <div>
                            <Label htmlFor="argila" className="text-xs">Fração Argila (%)</Label>
                            <Input id="argila" placeholder="Opcional" value={limites.percentualArgila || ""} onChange={e => updateLimites({ percentualArgila: e.target.value })} className="h-9" />
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

const ResultadosView = ({ resultadoCombinado }: { resultadoCombinado: CaracterizacaoOutput | null }) => {
    const { amostras } = useCaracterizacaoStore();
    const [resultTab, setResultTab] = useState("resultados");
    const limiteLiquidezChartRef = useRef<HTMLDivElement>(null);

    return (
        <div className="space-y-4 animate-in slide-in-from-right-5 duration-300">
            {!resultadoCombinado ? (
                <Card className="glass flex items-center justify-center p-12 text-center text-muted-foreground border-dashed min-h-[400px]">
                    <div>
                        <Calculator className="w-16 h-16 mx-auto mb-4 opacity-20" />
                        <p className="text-lg font-medium mb-2">Nenhum resultado ainda</p>
                        <p className="text-sm">Preencha os dados e clique em <strong>Calcular</strong>.</p>
                    </div>
                </Card>
            ) : resultadoCombinado.erro ? (
                <Alert variant="destructive" className="min-h-[200px] flex items-center">
                    <AlertCircle className="h-5 w-5" />
                    <AlertDescription className="text-base ml-2">{resultadoCombinado.erro}</AlertDescription>
                </Alert>
            ) : (
                <>
                    {/* Aviso de média removido conforme solicitado */}

                    <Tabs value={resultTab} onValueChange={setResultTab} className="w-full">
                        <TabsList className="grid w-full grid-cols-2 mb-4">
                            <TabsTrigger value="resultados" className="gap-1.5">
                                <BarChart3 className="w-4 h-4" />
                                Resultados
                            </TabsTrigger>
                            <TabsTrigger value="graficos" className="gap-1.5">
                                <LayoutGrid className="w-4 h-4" />
                                Gráficos
                            </TabsTrigger>
                        </TabsList>

                        {/* Tab Resultados */}
                        <TabsContent value="resultados" className="mt-0">
                            <Card className="glass overflow-hidden">
                                <CardContent className="p-0">
                                    <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-border">
                                        {/* Índices Físicos */}
                                        <div className="p-5 space-y-3">
                                            <h4 className="font-semibold text-sm flex items-center gap-2 text-primary">
                                                <Beaker className="w-4 h-4" />
                                                Índices Físicos
                                            </h4>
                                            <div className="space-y-2.5">
                                                <ResultRow label="Umidade (w)" value={resultadoCombinado.w} unit="%" />
                                                <ResultRow label="γ natural" value={resultadoCombinado.gamma_nat} unit="kN/m³" />
                                                <ResultRow label="γ seco" value={resultadoCombinado.gamma_d} unit="kN/m³" />
                                                <ResultRow label="Índice de Vazios (e)" value={resultadoCombinado.e} unit="" precision={3} />
                                                <ResultRow label="Porosidade (n)" value={resultadoCombinado.n} unit="%" />
                                                <ResultRow label="Saturação (Sr)" value={resultadoCombinado.Sr} unit="%" />
                                                <ResultRow label="γ saturado" value={resultadoCombinado.gamma_sat} unit="kN/m³" />
                                            </div>
                                        </div>

                                        {/* Limites */}
                                        <div className="p-5 space-y-3">
                                            <h4 className="font-semibold text-sm flex items-center gap-2 text-blue-500">
                                                <Droplet className="w-4 h-4" />
                                                Limites de Consistência
                                            </h4>
                                            <div className="space-y-2.5">
                                                <ResultRow label="Limite de Liquidez (LL)" value={resultadoCombinado.ll} unit="%" />
                                                <ResultRow label="Limite de Plasticidade (LP)" value={resultadoCombinado.lp} unit="%" />
                                                <ResultRow label="Índice de Plasticidade (IP)" value={resultadoCombinado.ip} unit="%" highlight />
                                                <ResultRow label="Índice de Consistência (IC)" value={resultadoCombinado.ic} unit="" precision={2} />
                                                <ResultRow label="Atividade (Ia)" value={resultadoCombinado.atividade} unit="" precision={2} />
                                            </div>
                                            <Separator className="my-3" />
                                            <div className="space-y-1.5 text-sm">
                                                {resultadoCombinado.classificacao_plasticidade && (
                                                    <div className="flex items-center gap-2">
                                                        <Badge variant="outline" className="text-xs">Plasticidade</Badge>
                                                        <span className="font-medium">{resultadoCombinado.classificacao_plasticidade}</span>
                                                    </div>
                                                )}
                                                {resultadoCombinado.classificacao_consistencia && (
                                                    <div className="flex items-center gap-2">
                                                        <Badge variant="outline" className="text-xs">Consistência</Badge>
                                                        <span className="font-medium">{resultadoCombinado.classificacao_consistencia}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* Tab Gráficos */}
                        <TabsContent value="graficos" className="mt-0 space-y-4">
                            <Card className="glass">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm">Diagrama de Fases</CardTitle>
                                    <CardDescription>Representação visual das proporções de sólidos, água e ar.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <DiagramaFases
                                        volumeSolidosNorm={1}
                                        volumeAguaNorm={resultadoCombinado.e && resultadoCombinado.Sr ? (resultadoCombinado.e * resultadoCombinado.Sr / 100) : 0}
                                        volumeArNorm={resultadoCombinado.e ? resultadoCombinado.e * (1 - (resultadoCombinado.Sr || 0) / 100) : 0}
                                        volumeSolidosCalc={resultadoCombinado.volume_solidos_calc}
                                        volumeAguaCalc={resultadoCombinado.volume_agua_calc}
                                        volumeArCalc={resultadoCombinado.volume_ar_calc}
                                        volumeTotalCalc={resultadoCombinado.volume_total_calc}
                                        massaSolidosCalc={resultadoCombinado.massa_solidos_calc}
                                        massaAguaCalc={resultadoCombinado.massa_agua_calc}
                                        massaTotalCalc={resultadoCombinado.massa_total_calc}
                                    />
                                </CardContent>
                            </Card>

                            <Card className="glass">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm">Gráfico Limite de Liquidez</CardTitle>
                                    <CardDescription>Curva de fluidez (Casagrande).</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <LimiteLiquidezChart
                                        ref={limiteLiquidezChartRef}
                                        pontos={resultadoCombinado.pontos_grafico_ll || []}
                                        ll={resultadoCombinado.ll || null}
                                    />
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </>
            )}
        </div>
    );
};

function ResultRow({ label, value, unit, precision = 2, highlight = false }: { label: string, value: number | null | undefined, unit: string, precision?: number, highlight?: boolean }) {
    if (value === undefined || value === null) return null;
    return (
        <div className={cn(
            "flex justify-between items-center text-sm py-1.5 px-2 rounded-md -mx-2 transition-colors",
            highlight ? "font-bold dark:text-white text-foreground dark:bg-white/10 bg-muted/20" : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
        )}>
            <span className={cn("text-muted-foreground", highlight && "dark:text-white/70 text-foreground")}>{label}</span>
            <span className="font-medium font-mono">{value.toFixed(precision)} {unit}</span>
        </div>
    );
}
