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

// Tooltips para entradas
const tooltips = {
    massaUmida: "Massa total da amostra de solo incluindo a água, obtida por pesagem direta (g).",
    massaSeca: "Massa da amostra após secagem em estufa a 105-110°C até peso constante (g).",
    volume: "Volume total da amostra de solo, incluindo sólidos e vazios (cm³).",
    Gs: "Densidade relativa dos grãos sólidos (adimensional). Valores típicos: Areias 2.65, Argilas 2.60-2.80.",
    emin: "Índice de vazios mínimo do solo, obtido em ensaio de compactação máxima (estado mais denso possível).",
    emax: "Índice de vazios máximo do solo, obtido depositando o solo solto (estado mais fofo possível).",
};

// Tooltips para resultados com faixas típicas
const resultTooltips: Record<string, { desc: string; range?: string }> = {
    h: { desc: "Teor de umidade: relação entre massa de água e massa de sólidos.", range: "Típico: 5% a 50%" },
    gamma: { desc: "Peso específico natural: peso do solo por unidade de volume no estado natural.", range: "Típico: 14 a 22 kN/m³" },
    gamma_d: { desc: "Peso específico aparente seco: peso dos sólidos por unidade de volume total.", range: "Típico: 12 a 20 kN/m³" },
    e: { desc: "Índice de vazios: relação entre volume de vazios e volume de sólidos.", range: "Areias: 0.4-0.9 | Argilas: 0.5-1.5" },
    n: { desc: "Porosidade: relação entre volume de vazios e volume total (em %).", range: "Típico: 25% a 60%" },
    Sr: { desc: "Grau de saturação: porcentagem dos vazios preenchidos por água.", range: "0% (seco) a 100% (saturado)" },
    gamma_sat: { desc: "Peso específico saturado: peso do solo quando todos os vazios estão cheios de água.", range: "Típico: 18 a 23 kN/m³" },
    LL: { desc: "Limite de Liquidez: teor de umidade onde o solo passa de plástico para líquido.", range: "Argilas: 30% a 100%" },
    LP: { desc: "Limite de Plasticidade: teor de umidade onde o solo passa de semi-sólido para plástico.", range: "Argilas: 15% a 40%" },
    IP: { desc: "Índice de Plasticidade: amplitude do estado plástico (LL - LP).", range: "Baixo: <7 | Médio: 7-15 | Alto: >15" },
    IC: { desc: "Índice de Consistência: posição relativa da umidade natural entre LL e LP.", range: "<0: líquido | 0-1: plástico | >1: sólido" },
    Dr: { desc: "Compacidade Relativa: indica o quão compacto está o solo em relação aos estados extremos.", range: "<15%: muito fofa | >85%: muito compacta" },
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
                if (data.amostras && Array.isArray(data.amostras) && data.amostras.length > 0) {
                    // Reset first to ensure clean state
                    resetAmostras();
                    // Load only the first sample
                    updateIndices(0, data.amostras[0].indices);
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
            // Função auxiliar para parse seguro de números (aceita ponto e vírgula)
            const parseNum = (val: string | undefined) => {
                if (!val) return undefined;
                return parseFloat(val.replace(',', '.'));
            };

            // Preparar inputs de todas as amostras
            const inputsIndices = amostras.map(amostra => ({
                peso_total: parseNum(amostra.indices.massaUmida)!,
                peso_solido: parseNum(amostra.indices.massaSeca)!,
                volume_total: parseNum(amostra.indices.volume),
                Gs: parseNum(settings.Gs)!,
                peso_especifico_agua: parseNum(settings.pesoEspecificoAgua) || 10.0, // Fallback safe
            }));

            // Calcular índices físicos (já retorna média se múltiplas amostras)
            const resIndices = calcularIndicesFisicosMultiplasAmostras(inputsIndices);

            // Calcular Limites (Global)
            let resLimites: any = {};
            const pontosLL = globalLimites.pontosLL.map(p => ({
                num_golpes: parseInt(p.numGolpes),
                massa_umida_recipiente: parseNum(p.massaUmidaRecipiente)!,
                massa_seca_recipiente: parseNum(p.massaSecaRecipiente)!,
                massa_recipiente: parseNum(p.massaRecipiente)!
            })).filter(p => !isNaN(p.num_golpes) && !isNaN(p.massa_umida_recipiente));

            const pontosLP = globalLimites.pontosLP.map(p => ({
                massa_umida_recipiente: parseNum(p.massaUmidaRecipiente)!,
                massa_seca_recipiente: parseNum(p.massaSecaRecipiente)!,
                massa_recipiente: parseNum(p.massaRecipiente)!
            })).filter(p => !isNaN(p.massa_umida_recipiente));

            if (pontosLL.length >= 2 || pontosLP.length >= 1) {
                resLimites = calcularLimitesConsistencia({
                    pontos_ll: pontosLL,
                    pontos_lp: pontosLP,
                    umidade_natural: resIndices.umidade,
                });
            }

            // Calcular Compacidade Relativa (solos não plásticos)
            let compacidade_relativa: number | null = null;
            let classificacao_compacidade: string | undefined;

            const emax = parseNum(settings.indice_vazios_max);
            const emin = parseNum(settings.indice_vazios_min);
            const e_atual = resIndices.indice_vazios;

            // Só calcula se não há LP (solo não plástico) e tem dados de emin/emax
            if (!resLimites.lp && emax && emin && e_atual !== undefined && emax > emin) {
                compacidade_relativa = ((emax - e_atual) / (emax - emin)) * 100;

                // Classificação da compacidade
                if (compacidade_relativa < 15) {
                    classificacao_compacidade = 'Muito Fofa';
                } else if (compacidade_relativa < 35) {
                    classificacao_compacidade = 'Fofa';
                } else if (compacidade_relativa < 65) {
                    classificacao_compacidade = 'Medianamente Compacta';
                } else if (compacidade_relativa < 85) {
                    classificacao_compacidade = 'Compacta';
                } else {
                    classificacao_compacidade = 'Muito Compacta';
                }
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
                classificacao_plasticidade: resLimites.classificacao_plasticidade,
                classificacao_consistencia: resLimites.classificacao_consistencia,
                pontos_grafico_ll: resLimites.pontos_grafico_ll,
                // Compacidade
                compacidade_relativa,
                classificacao_compacidade,
                erro: resIndices.erro || resLimites.erro
            };

            setResultadoCombinado(combinedResult);

            // Também salva para cada amostra individual (para referência)
            amostras.forEach(amostra => {
                setResult(amostra.id, combinedResult);
            });

            // Silencioso - sem toast para cálculo automático

        } catch (err) {
            console.error(err);
            // Silencioso - sem toast para erro de cálculo automático
            setResultadoCombinado(null);
        } finally {
            setIsCalculating(false);
        }
    };

    // Auto-calculate with debounce (instant)
    useEffect(() => {
        const debounceTimer = setTimeout(() => {
            handleCalculate();
        }, 0);

        return () => clearTimeout(debounceTimer);
    }, [amostras, settings, globalLimites]);

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
            pontosLP: [{ id: generateId(), massaUmidaRecipiente: "", massaSecaRecipiente: "", massaRecipiente: "" }]
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
        });

        // 3. Set Sample (Indices)
        // Ensure we strictly use the first sample.
        // The handleClear() above resets to 1 sample.

        updateIndices(0, {
            massaUmida: exemplo.indices.massaUmida,
            massaSeca: exemplo.indices.massaSeca,
            volume: exemplo.indices.volume
        });

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
                    <div className="w-12 h-12 rounded-xl border border-primary/30 bg-primary/5 flex items-center justify-center transition-colors hover:border-primary/60 hover:bg-primary/10">
                        <Beaker className="w-6 h-6 text-primary" />
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
        if (newPontos.length > 2) {
            newPontos.splice(index, 1);
        } else {
            // Limpar apenas os dados se estiver no limite mínimo
            newPontos[index] = { ...newPontos[index], numGolpes: "", massaUmidaRecipiente: "", massaSecaRecipiente: "", massaRecipiente: "" };
        }
        updateLimites({ pontosLL: newPontos });
    };

    const addPontoLP = () => {
        updateLimites({
            pontosLP: [...limites.pontosLP, { id: generateId(), massaUmidaRecipiente: "", massaSecaRecipiente: "", massaRecipiente: "" }]
        });
    };

    const removePontoLP = (index: number) => {
        const newPontos = [...limites.pontosLP];
        if (newPontos.length > 1) {
            newPontos.splice(index, 1);
        } else {
            // Limpar apenas os dados se estiver no limite mínimo
            newPontos[index] = { ...newPontos[index], massaUmidaRecipiente: "", massaSecaRecipiente: "", massaRecipiente: "" };
        }
        updateLimites({ pontosLP: newPontos });
    };

    // Handlers para LP
    const handleUpdateLP = (idx: number, field: string, value: string) => {
        const newPontos = [...limites.pontosLP];
        newPontos[idx] = { ...newPontos[idx], [field]: value };
        updateLimites({ pontosLP: newPontos });
    };

    // Função para calcular umidade de um ponto
    const calcularUmidadePonto = (mbu: string, mbs: string, tara: string): number | null => {
        const massaUmida = parseFloat(mbu);
        const massaSeca = parseFloat(mbs);
        const massaTara = parseFloat(tara);

        if (isNaN(massaUmida) || isNaN(massaSeca) || isNaN(massaTara)) return null;
        if (massaSeca <= massaTara) return null;

        const massaAgua = massaUmida - massaSeca;
        const massaSolidos = massaSeca - massaTara;

        if (massaSolidos <= 0) return null;

        return (massaAgua / massaSolidos) * 100;
    };

    // Calcular umidades de todos os pontos LL
    const umidadesLL = limites.pontosLL.map(p =>
        calcularUmidadePonto(p.massaUmidaRecipiente, p.massaSecaRecipiente, p.massaRecipiente)
    );

    // Calcular umidades de todos os pontos LP
    const umidadesLP = limites.pontosLP.map(p =>
        calcularUmidadePonto(p.massaUmidaRecipiente, p.massaSecaRecipiente, p.massaRecipiente)
    );

    // Criar pares ordenados (golpes, umidade) para validação de monotonicidade
    const pontosLLValidos = limites.pontosLL
        .map((p, i) => ({
            index: i,
            golpes: parseInt(p.numGolpes),
            umidade: umidadesLL[i]
        }))
        .filter(p => !isNaN(p.golpes) && p.umidade !== null)
        .sort((a, b) => a.golpes - b.golpes);

    // Validar ponto de LL: intervalo de golpes + monotonicidade (NBR 6459)
    const validarPontoLL = (index: number): { status: 'ok' | 'warn' | 'error', msg?: string } => {
        const ponto = limites.pontosLL[index];
        const golpes = parseInt(ponto.numGolpes);
        const umidade = umidadesLL[index];

        if (isNaN(golpes) || !ponto.numGolpes) return { status: 'ok' };

        // A. Verificar intervalo de golpes (15-35)
        if (golpes < 15) {
            return { status: 'error', msg: `${golpes} golpes: abaixo do intervalo ideal (15-35)` };
        } else if (golpes > 35) {
            return { status: 'warn', msg: `${golpes} golpes: acima do intervalo ideal (15-35)` };
        }

        // C. Verificar monotonicidade (mais golpes = menor umidade)
        if (umidade !== null && pontosLLValidos.length >= 2) {
            const pontoAtualOrdenado = pontosLLValidos.find(p => p.index === index);
            if (pontoAtualOrdenado) {
                const posicaoAtual = pontosLLValidos.indexOf(pontoAtualOrdenado);

                // Verificar se umidade está invertida em relação aos vizinhos
                if (posicaoAtual > 0) {
                    const pontoAnterior = pontosLLValidos[posicaoAtual - 1];
                    // Ponto anterior tem menos golpes, deve ter MAIS umidade
                    if (pontoAnterior.umidade !== null && pontoAnterior.umidade < umidade) {
                        return {
                            status: 'error',
                            msg: `Erro físico: ${golpes} golpes com ${umidade.toFixed(1)}% > ${pontoAnterior.golpes} golpes com ${pontoAnterior.umidade.toFixed(1)}%`
                        };
                    }
                }
                if (posicaoAtual < pontosLLValidos.length - 1) {
                    const pontoProximo = pontosLLValidos[posicaoAtual + 1];
                    // Próximo ponto tem mais golpes, deve ter MENOS umidade
                    if (pontoProximo.umidade !== null && pontoProximo.umidade > umidade) {
                        return {
                            status: 'error',
                            msg: `Erro físico: ${golpes} golpes com ${umidade.toFixed(1)}% < ${pontoProximo.golpes} golpes com ${pontoProximo.umidade.toFixed(1)}%`
                        };
                    }
                }
            }
        }

        return { status: 'ok' };
    };

    // B. Validar quantidade de pontos LL (mínimo 3, recomendado 5)
    const pontosLLPreenchidos = limites.pontosLL.filter(p =>
        p.numGolpes && p.massaUmidaRecipiente && p.massaSecaRecipiente && p.massaRecipiente
    ).length;

    const avisoQuantidadePontosLL = (): { status: 'ok' | 'warn' | 'error', msg?: string } => {
        if (pontosLLPreenchidos > 0 && pontosLLPreenchidos < 3) {
            return { status: 'error', msg: `Mínimo de 3 pontos necessário (atual: ${pontosLLPreenchidos})` };
        } else if (pontosLLPreenchidos >= 3 && pontosLLPreenchidos < 5) {
            return { status: 'warn', msg: `Recomendado pela NBR 6459: 5 pontos (atual: ${pontosLLPreenchidos})` };
        }
        return { status: 'ok' };
    };

    // Validar variação de umidade para LP (NBR 7180: valores não devem desviar mais que 5% da média)
    const validarVariacaoLP = (index: number): { status: 'ok' | 'warn' | 'error', variacao?: number, msg?: string } => {
        const umidadeAtual = umidadesLP[index];
        if (umidadeAtual === null) return { status: 'ok' };

        // Para LP, comparar com média de todos os pontos válidos
        const umidadesValidas = umidadesLP.filter((u): u is number => u !== null);
        if (umidadesValidas.length < 2) return { status: 'ok' };

        const media = umidadesValidas.reduce((a, b) => a + b, 0) / umidadesValidas.length;
        const variacaoPercentual = Math.abs((umidadeAtual - media) / media) * 100;

        // Só mostrar erro se desviar mais de 5% (NBR 7180)
        if (variacaoPercentual > 5) {
            return { status: 'error', variacao: variacaoPercentual, msg: `Desvio de ${variacaoPercentual.toFixed(1)}% da média (max 5%, NBR 7180)` };
        }

        return { status: 'ok', variacao: variacaoPercentual };
    };

    // Validar quantidade de pontos LP (mínimo 3 recomendado pela NBR 7180)
    const pontosLPPreenchidos = limites.pontosLP.filter(p =>
        p.massaUmidaRecipiente && p.massaSecaRecipiente && p.massaRecipiente
    ).length;

    const avisoQuantidadePontosLP = (): { status: 'ok' | 'warn' | 'error', msg?: string } => {
        if (pontosLPPreenchidos > 0 && pontosLPPreenchidos < 3) {
            return { status: 'warn', msg: `Recomendado pela NBR 7180: mínimo 3 determinações (atual: ${pontosLPPreenchidos})` };
        }
        return { status: 'ok' };
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
                                            <TooltipContent side="left"><p className="max-w-xs text-xs">{tooltips.Gs}</p></TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                </Label>
                            </div>
                            <Input id="Gs" placeholder="Ex: 2.65" value={settings.Gs} onChange={(e) => updateSettings({ Gs: e.target.value })} className="h-9" />
                        </div>
                        <div className="space-y-1.5">
                            <div className="flex items-center h-5">
                                <Label htmlFor="massaUmida" className="text-xs flex items-center gap-1">
                                    Massa Úmida (g)
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger><Info className="w-3 h-3 text-muted-foreground/50 hover:text-muted-foreground cursor-help" /></TooltipTrigger>
                                            <TooltipContent side="left"><p className="max-w-xs text-xs">{tooltips.massaUmida}</p></TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                </Label>
                            </div>
                            <Input id="massaUmida" placeholder="0.00" value={currentAmostra.indices.massaUmida} onChange={(e) => updateIndices(currentAmostraIndex, { massaUmida: e.target.value })} className="h-9" />
                        </div>
                        <div className="space-y-1.5">
                            <div className="flex items-center h-5">
                                <Label htmlFor="massaSeca" className="text-xs flex items-center gap-1">
                                    Massa Seca (g)
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger><Info className="w-3 h-3 text-muted-foreground/50 hover:text-muted-foreground cursor-help" /></TooltipTrigger>
                                            <TooltipContent><p className="max-w-xs text-xs">{tooltips.massaSeca}</p></TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                </Label>
                            </div>
                            <Input id="massaSeca" placeholder="0.00" value={currentAmostra.indices.massaSeca} onChange={(e) => updateIndices(currentAmostraIndex, { massaSeca: e.target.value })} className="h-9" />
                        </div>
                        <div className="space-y-1.5">
                            <div className="flex items-center h-5">
                                <Label htmlFor="volume" className="text-xs flex items-center gap-1">
                                    Volume (cm³)
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger><Info className="w-3 h-3 text-muted-foreground/50 hover:text-muted-foreground cursor-help" /></TooltipTrigger>
                                            <TooltipContent><p className="max-w-xs text-xs">{tooltips.volume}</p></TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                </Label>
                            </div>
                            <Input id="volume" placeholder="Ex: 100" value={currentAmostra.indices.volume || ""} onChange={(e) => updateIndices(currentAmostraIndex, { volume: e.target.value })} className="h-9" />
                        </div>
                        <div className="space-y-1.5">
                            <div className="flex items-center h-5">
                                <Label htmlFor="emin" className="text-xs flex items-center gap-1">
                                    e<sub>mín</sub>
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger><Info className="w-3 h-3 text-muted-foreground/50 hover:text-muted-foreground cursor-help" /></TooltipTrigger>
                                            <TooltipContent><p className="max-w-xs text-xs">{tooltips.emin}</p></TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                </Label>
                            </div>
                            <Input id="emin" placeholder="Ex: 0.4" value={settings.indice_vazios_min} onChange={(e) => updateSettings({ indice_vazios_min: e.target.value })} className="h-9" />
                        </div>
                        <div className="space-y-1.5">
                            <div className="flex items-center h-5">
                                <Label htmlFor="emax" className="text-xs flex items-center gap-1">
                                    e<sub>máx</sub>
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger><Info className="w-3 h-3 text-muted-foreground/50 hover:text-muted-foreground cursor-help" /></TooltipTrigger>
                                            <TooltipContent><p className="max-w-xs text-xs">{tooltips.emax}</p></TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                </Label>
                            </div>
                            <Input id="emax" placeholder="Ex: 0.9" value={settings.indice_vazios_max} onChange={(e) => updateSettings({ indice_vazios_max: e.target.value })} className="h-9" />
                        </div>
                    </div>
                    {/* Aviso quando há dados de LP e emin/emax preenchidos */}
                    {(settings.indice_vazios_min || settings.indice_vazios_max) &&
                        limites.pontosLP.some(p => p.massaUmidaRecipiente || p.massaSecaRecipiente || p.massaRecipiente) && (
                            <p className="text-xs text-amber-500/80 flex items-center gap-1.5 mt-2">
                                <Info className="w-3 h-3" />
                                Compacidade Relativa só é calculada para solos não plásticos (sem LP).
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
                            <div>MBU (g)</div>
                            <div>MBS (g)</div>
                            <div>Tara (g)</div>
                            <div></div>
                        </div>

                        <div className="space-y-1">
                            {limites.pontosLL.map((ponto, i) => {
                                const validacao = validarPontoLL(i);
                                const borderClass = validacao.status === 'error'
                                    ? 'border-red-500/70 bg-red-500/5'
                                    : validacao.status === 'warn'
                                        ? 'border-amber-500/70 bg-amber-500/5'
                                        : 'border bg-muted/5';

                                return (
                                    <div key={ponto.id} className="relative">
                                        <div className={cn(
                                            "grid grid-cols-[50px,1fr,1fr,1fr,auto] gap-1.5 items-center p-1.5 rounded-md transition-colors hover:bg-muted/10",
                                            borderClass
                                        )}>
                                            <Input className="h-8 text-xs px-2 text-center" placeholder="N" value={ponto.numGolpes} onChange={e => handleUpdateLL(i, 'numGolpes', e.target.value)} />
                                            <Input className="h-8 text-xs px-2 text-center" placeholder="g" value={ponto.massaUmidaRecipiente} onChange={e => handleUpdateLL(i, 'massaUmidaRecipiente', e.target.value)} />
                                            <Input className="h-8 text-xs px-2 text-center" placeholder="g" value={ponto.massaSecaRecipiente} onChange={e => handleUpdateLL(i, 'massaSecaRecipiente', e.target.value)} />
                                            <Input className="h-8 text-xs px-2 text-center" placeholder="g" value={ponto.massaRecipiente} onChange={e => handleUpdateLL(i, 'massaRecipiente', e.target.value)} />
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive/70 hover:text-destructive shrink-0" onClick={() => removePontoLL(i)}>
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </Button>
                                        </div>
                                        {validacao.msg && (
                                            <p className={cn(
                                                "text-[10px] mt-0.5 ml-1 flex items-center gap-1",
                                                validacao.status === 'error' ? 'text-red-400' : 'text-amber-400'
                                            )}>
                                                <AlertCircle className="w-3 h-3" />
                                                {validacao.msg}
                                            </p>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                        {/* Aviso de quantidade de pontos */}
                        {avisoQuantidadePontosLL().msg && (
                            <p className={cn(
                                "text-[10px] mt-1 flex items-center gap-1 px-1",
                                avisoQuantidadePontosLL().status === 'error' ? 'text-red-400' : 'text-amber-400'
                            )}>
                                <AlertCircle className="w-3 h-3" />
                                {avisoQuantidadePontosLL().msg}
                            </p>
                        )}
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
                            <div>MBU (g)</div>
                            <div>MBS (g)</div>
                            <div>Tara (g)</div>
                            <div></div>
                        </div>

                        <div className="space-y-1 max-h-[220px] overflow-y-auto pr-1">
                            {limites.pontosLP.map((ponto, i) => {
                                const validacao = validarVariacaoLP(i);
                                const borderClass = validacao.status === 'error'
                                    ? 'border-red-500/70 bg-red-500/5'
                                    : validacao.status === 'warn'
                                        ? 'border-amber-500/70 bg-amber-500/5'
                                        : 'border bg-muted/5';

                                return (
                                    <div key={ponto.id || i} className="relative">
                                        <div className={cn(
                                            "grid grid-cols-[1fr,1fr,1fr,auto] gap-1.5 items-center p-1.5 rounded-md transition-colors hover:bg-muted/10",
                                            borderClass
                                        )}>
                                            <Input className="h-8 text-xs px-2 text-center" placeholder="g" value={ponto.massaUmidaRecipiente || ""} onChange={e => handleUpdateLP(i, 'massaUmidaRecipiente', e.target.value)} />
                                            <Input className="h-8 text-xs px-2 text-center" placeholder="g" value={ponto.massaSecaRecipiente || ""} onChange={e => handleUpdateLP(i, 'massaSecaRecipiente', e.target.value)} />
                                            <Input className="h-8 text-xs px-2 text-center" placeholder="g" value={ponto.massaRecipiente || ""} onChange={e => handleUpdateLP(i, 'massaRecipiente', e.target.value)} />
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive/70 hover:text-destructive shrink-0" onClick={() => removePontoLP(i)}>
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </Button>
                                        </div>
                                        {validacao.msg && (
                                            <p className={cn(
                                                "text-[10px] mt-0.5 ml-1 flex items-center gap-1",
                                                validacao.status === 'error' ? 'text-red-400' : 'text-amber-400'
                                            )}>
                                                <AlertCircle className="w-3 h-3" />
                                                {validacao.msg}
                                            </p>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                        {/* Aviso de quantidade de pontos LP */}
                        {avisoQuantidadePontosLP().msg && (
                            <p className={cn(
                                "text-[10px] mt-1 flex items-center gap-1 px-1",
                                avisoQuantidadePontosLP().status === 'error' ? 'text-red-400' : 'text-amber-400'
                            )}>
                                <AlertCircle className="w-3 h-3" />
                                {avisoQuantidadePontosLP().msg}
                            </p>
                        )}
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

    // Create an empty result object for display when no calculation yet
    const displayResult = resultadoCombinado || {} as CaracterizacaoOutput;

    return (
        <div className="space-y-4 animate-in slide-in-from-right-5 duration-300">
            {resultadoCombinado?.erro ? (
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
                        <TabsContent value="resultados" className="mt-0 animate-in fade-in-50 slide-in-from-left-2 duration-300">
                            <Card className="glass">
                                <CardContent className="p-0">
                                    <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-border">
                                        {/* Índices Físicos */}
                                        <div className="p-3 space-y-2">
                                            <h4 className="font-semibold text-sm flex items-center gap-2 text-primary">
                                                <Beaker className="w-4 h-4" />
                                                Índices Físicos
                                            </h4>
                                            <div className="space-y-[1px]">
                                                <ResultRow label={<span><span className="font-serif italic text-lg">h</span> <span className="text-[10px] font-normal opacity-70">(Umidade)</span></span>} value={displayResult.w} unit="%" precision={1} tooltipKey="h" statusRanges={{ ok: [5, 50], warn: [0, 80] }} />
                                                <ResultRow label={<span><span className="font-serif italic text-lg">γ</span> <span className="text-[10px] font-normal opacity-70">(Peso Esp. Natural)</span></span>} value={displayResult.gamma_nat} unit="kN/m³" precision={2} tooltipKey="gamma" statusRanges={{ ok: [14, 22], warn: [10, 25] }} />
                                                <ResultRow label={<span><span className="font-serif italic text-lg">γ<sub className="text-xs not-italic">s</sub></span> <span className="text-[10px] font-normal opacity-70">(Peso Esp. Seco)</span></span>} value={displayResult.gamma_d} unit="kN/m³" precision={2} tooltipKey="gamma_d" statusRanges={{ ok: [12, 20], warn: [8, 22] }} />
                                                <ResultRow label={<span><span className="font-serif italic text-lg">e</span> <span className="text-[10px] font-normal opacity-70">(Índice de Vazios)</span></span>} value={displayResult.e} unit="" precision={2} tooltipKey="e" statusRanges={{ ok: [0.3, 1.2], warn: [0.1, 2.0] }} />
                                                <ResultRow label={<span><span className="font-serif italic text-lg">n</span> <span className="text-[10px] font-normal opacity-70">(Porosidade)</span></span>} value={displayResult.n} unit="%" precision={0} tooltipKey="n" statusRanges={{ ok: [25, 60], warn: [15, 75] }} />
                                                <ResultRow label={<span><span className="font-serif italic text-lg">S</span> <span className="text-[10px] font-normal opacity-70">(Grau de Saturação)</span></span>} value={displayResult.Sr} unit="%" precision={0} tooltipKey="Sr" statusRanges={{ ok: [0, 100], warn: [0, 100] }} />
                                                <ResultRow label={<span><span className="font-serif italic text-lg">γ<sub className="text-xs not-italic">sat</sub></span> <span className="text-[10px] font-normal opacity-70">(Peso Esp. Saturado)</span></span>} value={displayResult.gamma_sat} unit="kN/m³" precision={2} tooltipKey="gamma_sat" statusRanges={{ ok: [18, 23], warn: [15, 25] }} />
                                            </div>
                                        </div>

                                        {/* Limites */}
                                        <div className="p-3 space-y-2">
                                            <h4 className="font-semibold text-sm flex items-center gap-2 text-blue-500">
                                                <Droplet className="w-4 h-4" />
                                                Limites de Consistência
                                            </h4>
                                            <div className="space-y-[1px]">
                                                <ResultRow label={<span>LL <span className="text-[10px] font-normal opacity-70">(Limite de Liquidez)</span></span>} value={displayResult.ll} unit="%" tooltipKey="LL" />
                                                <ResultRow label={<span>LP <span className="text-[10px] font-normal opacity-70">(Limite de Plasticidade)</span></span>} value={displayResult.lp} unit="%" tooltipKey="LP" />
                                                <ResultRow label={<span>IP <span className="text-[10px] font-normal opacity-70">(Índice de Plasticidade)</span></span>} value={displayResult.ip} unit="%" tooltipKey="IP" statusRanges={{ ok: [7, 15], warn: [0, 30] }} />
                                                <ResultRow label={<span>IC <span className="text-[10px] font-normal opacity-70">(Índice de Consistência)</span></span>} value={displayResult.ic} unit="" precision={2} tooltipKey="IC" statusRanges={{ ok: [0, 1], warn: [-0.5, 1.5] }} />
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
                                                {displayResult.compacidade_relativa !== null && displayResult.compacidade_relativa !== undefined && (
                                                    <>
                                                        <Separator className="my-2" />
                                                        <ResultRow label={<span><span className="font-serif italic text-lg">D<sub className="text-xs not-italic">r</sub></span> <span className="text-[10px] font-normal opacity-70">(Compacidade Relativa)</span></span>} value={displayResult.compacidade_relativa} unit="%" precision={0} tooltipKey="Dr" statusRanges={{ ok: [35, 85], warn: [15, 100] }} />
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

                        {/* Tab Gráficos */}
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
                                    <CardTitle className="text-sm">Gráfico Limite de Liquidez</CardTitle>
                                    <CardDescription>Curva de fluidez (Casagrande).</CardDescription>
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
                </>
            )
            }
        </div >
    );
};

function ResultRow({
    label,
    value,
    unit,
    precision = 2,
    tooltipKey,
    statusRanges
}: {
    label: React.ReactNode | string,
    value: number | null | undefined,
    unit: string,
    precision?: number,
    tooltipKey?: keyof typeof resultTooltips,
    statusRanges?: { ok: [number, number], warn: [number, number] }
}) {
    // Check if value is valid (not null, undefined, NaN, or Infinity)
    const isValidValue = value !== undefined && value !== null && !isNaN(value) && isFinite(value);

    // Determine status color based on value ranges
    let statusColor = "bg-muted-foreground/30"; // default: no status indicator
    let statusLabel = "";
    let showStatus = false;

    if (isValidValue && statusRanges) {
        showStatus = true;
        const [okMin, okMax] = statusRanges.ok;
        const [warnMin, warnMax] = statusRanges.warn;

        if (value >= okMin && value <= okMax) {
            statusColor = "bg-emerald-500";
            statusLabel = "Normal";
        } else if (value >= warnMin && value <= warnMax) {
            statusColor = "bg-amber-500";
            statusLabel = "Atenção";
        } else {
            statusColor = "bg-red-500";
            statusLabel = "Revisar";
        }
    }

    const tooltip = tooltipKey ? resultTooltips[tooltipKey] : null;

    // Format display value
    const displayValue = isValidValue ? `${value.toFixed(precision)} ${unit}` : "-";

    return (
        <div className="flex justify-between items-center text-sm py-1.5 px-3 rounded-md bg-muted/5 hover:bg-muted/15 transition-all duration-200 border border-transparent hover:border-border/50 -mx-1 group hover:scale-[1.01]">
            <span className="text-foreground font-semibold flex items-center gap-1.5">
                {label}
                {tooltip && (
                    <TooltipProvider delayDuration={200}>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Info className="w-3 h-3 text-muted-foreground/50 hover:text-muted-foreground cursor-help transition-colors" />
                            </TooltipTrigger>
                            <TooltipContent side="left" className="max-w-xs z-50">
                                <p className="text-xs font-normal">{tooltip.desc}</p>
                                {tooltip.range && (
                                    <p className="text-xs text-muted-foreground mt-1 border-t border-border/50 pt-1">{tooltip.range}</p>
                                )}
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                )}
            </span>
            <div className="flex items-center gap-2">
                {showStatus && (
                    <TooltipProvider delayDuration={200}>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <span className={cn("w-2 h-2 rounded-full opacity-80 group-hover:opacity-100 transition-opacity", statusColor)} />
                            </TooltipTrigger>
                            <TooltipContent side="top" className="text-xs z-50">
                                {statusLabel}
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                )}
                <span className={cn(
                    "font-bold font-mono text-right",
                    isValidValue ? "text-foreground" : "text-muted-foreground"
                )}>{displayValue}</span>
            </div>
        </div>
    );
}
