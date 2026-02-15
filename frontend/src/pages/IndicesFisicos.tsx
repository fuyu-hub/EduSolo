// frontend/src/pages/IndicesFisicos.tsx
import { useState, useMemo, useEffect } from "react";
import { Beaker, Calculator, Info, BarChart3, ArrowLeft, ArrowRight, Save, FolderOpen, Download, Printer, FileText, AlertCircle, GraduationCap, ChevronLeft, ChevronRight, Plus, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { calcularIndicesFisicosMultiplasAmostras, type IndicesFisicosOutputComEstatisticas } from "@/lib/calculations/indices-fisicos";
import { MobileModuleWrapper } from "@/components/mobile";
import IndicesFisicosMobile from "./mobile/IndicesFisicosMobile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button as PopoverButton } from "@/components/ui/button";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useNotification } from "@/hooks/use-notification";
import DiagramaFases from "@/components/visualizations/DiagramaFases";
import { conteudoIndicesFisicos } from "@/lib/geotecnia/indicesFisicosConteudo";
import { cn } from "@/lib/utils";
import { useSavedCalculations } from "@/hooks/use-saved-calculations";
import SavedCalculations from "@/components/SavedCalculations";
import ExportPDFDialog from "@/components/ExportPDFDialog";
import PrintHeader from "@/components/PrintHeader";
import CalculationActions from "@/components/CalculationActions";
import { exportToPDF, exportToExcel, ExportData, ExcelExportData, formatNumberForExport, generateDefaultPDFFileName } from "@/lib/export-utils";
import { useRecentReports } from "@/hooks/useRecentReports";
import { prepareReportForStorage } from "@/lib/reportManager";
import { useTheme } from "@/hooks/use-theme";
import SoilExamples from "@/components/soil/SoilExamples";
import GsSuggestions from "@/components/soil/GsSuggestions";

import ResultInterpretation from "@/components/soil/ResultInterpretation";
import InputWithValidation from "@/components/soil/InputWithValidation";
import { SoilExample, soilExamples, type AmostraIndicesFisicos } from "@/lib/soil-constants";
import { Switch } from "@/components/ui/switch";
import { useSettings } from "@/hooks/use-settings";
import { formatNumber } from "@/lib/format-number";
import { AppSettings } from "@/contexts/SettingsContext";

import { toast } from "@/components/ui/sonner";

// Interface para o estado do formulário
interface FormData {
  amostras: AmostraIndicesFisicos[];
  Gs: string;
  pesoEspecificoAgua: string;
  indice_vazios_max: string;
  indice_vazios_min: string;
}

// Type alias para results com todas as propriedades
type Results = IndicesFisicosOutputComEstatisticas & {
  peso_especifico_natural?: number;
  peso_especifico_seco?: number;
  peso_especifico_saturado?: number;
  peso_especifico_submerso?: number;
  peso_especifico_solidos?: number;
  Gs?: number;
  indice_vazios?: number;
  porosidade?: number;
  grau_saturacao?: number;
  umidade?: number;
  volume_solidos_norm?: number;
  volume_agua_norm?: number;
  volume_ar_norm?: number;
  peso_solidos_norm?: number;
  peso_agua_norm?: number;
  compacidade_relativa?: number;
  classificacao_compacidade?: string;
  volume_total_calc?: number;
  volume_solidos_calc?: number;
  volume_agua_calc?: number;
  volume_ar_calc?: number;
  massa_total_calc?: number;
  massa_solidos_calc?: number;
  massa_agua_calc?: number;
  aviso?: string;
  erro?: string;
};

// Tooltips para entradas
const tooltips = {
  massaUmida: "Massa total da amostra de solo incluindo a água (g)",
  massaSeca: "Massa da amostra após secagem em estufa (g)",
  volume: "Volume total da amostra incluindo vazios (cm³)",
  Gs: "Densidade dos grãos (adimensional, ex: 2.65). Necessário para calcular todos os índices físicos (e, n, Sr, γsat, γsub, Dr). Use as sugestões ao lado para valores típicos.",
  pesoEspecificoAgua: "Peso específico da água (kN/m³, padrão 10.0)",
  indice_vazios_max: "Índice de vazios máximo do solo (emax). Necessário para calcular Dr.",
  indice_vazios_min: "Índice de vazios mínimo do solo (emin). Necessário para calcular Dr.",
};

// Função para gerar IDs únicos
const generateId = () => `${Date.now()}-${Math.floor(Math.random() * 1000000)}`;

// Cálculos agora são feitos localmente no frontend

function IndicesFisicosDesktop() {
  // Configurações
  const { settings } = useSettings();
  const { theme } = useTheme();

  const { addReport } = useRecentReports();
  const navigate = useNavigate();

  // Estados
  const [formData, setFormData] = useState<FormData>({
    amostras: [{
      id: generateId(),
      massaUmida: "",
      massaSeca: "",
      volume: ""
    }],
    Gs: "",
    pesoEspecificoAgua: "10.0",
    indice_vazios_max: "",
    indice_vazios_min: "",
  });
  const [pdfSavedDialogOpen, setPdfSavedDialogOpen] = useState(false);
  const [currentAmostraIndex, setCurrentAmostraIndex] = useState(0);
  const [results, setResults] = useState<Results | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const notify = useNotification();



  // Restaurar dados ao abrir via "Gerar" em Relatórios
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem('indices-fisicos_lastData');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.formData) setFormData(parsed.formData);
        if (parsed?.results) setResults(parsed.results);
        sessionStorage.removeItem('indices-fisicos_lastData');
        notify.success({ description: "Dados do relatório carregados!" });
      }
    } catch (e) {
      console.error('Erro ao restaurar dados (indices-fisicos):', e);
    }
  }, []);


  // Estados para salvamento e exportação
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [saveName, setSaveName] = useState("");
  const [loadDialogOpen, setLoadDialogOpen] = useState(false);
  const { calculations, saveCalculation, deleteCalculation, renameCalculation } = useSavedCalculations("indices-fisicos");

  // Estados para exportação PDF
  const [exportPDFDialogOpen, setExportPDFDialogOpen] = useState(false);
  const [pdfFileName, setPdfFileName] = useState("");
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [customReportTitle, setCustomReportTitle] = useState<string>(() => {
    try {
      return localStorage.getItem('edusolo_last_custom_report_title') || '';
    } catch {
      return '';
    }
  });

  const handleChange = (field: keyof Omit<FormData, 'amostras'>, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError(null);
  };

  const handleAmostraChange = (field: keyof AmostraIndicesFisicos, value: string) => {
    setFormData(prev => ({
      ...prev,
      amostras: prev.amostras.map((amostra, idx) =>
        idx === currentAmostraIndex
          ? { ...amostra, [field]: value }
          : amostra
      )
    }));
    setError(null);
  };

  const addAmostra = () => {
    setFormData(prev => ({
      ...prev,
      amostras: [
        ...prev.amostras,
        {
          id: generateId(),
          massaUmida: "",
          massaSeca: "",
          volume: ""
        }
      ]
    }));
    setCurrentAmostraIndex(formData.amostras.length);
    notify.success({ title: "Amostra adicionada", description: `Amostra ${formData.amostras.length + 1} criada` });
  };

  const removeAmostra = () => {
    if (formData.amostras.length > 1) {
      setFormData(prev => ({
        ...prev,
        amostras: prev.amostras.filter((_, idx) => idx !== currentAmostraIndex)
      }));
      setCurrentAmostraIndex(prev => Math.max(0, prev - 1));
      notify.success({ title: "Amostra removida", description: "Amostra excluída com sucesso" });
    } else {
      notify.warning({ title: "Atenção", description: "É necessário pelo menos 1 amostra" });
    }
  };

  const goToNextAmostra = () => {
    setCurrentAmostraIndex(prev => Math.min(prev + 1, formData.amostras.length - 1));
  };

  const goToPreviousAmostra = () => {
    setCurrentAmostraIndex(prev => Math.max(prev - 1, 0));
  };

  const handleCalculate = async () => {
    setIsCalculating(true);
    setError(null);
    setResults(null);

    // Mapear amostras para formato da API
    const amostrasAPI = formData.amostras.map(amostra => ({
      peso_total: amostra.massaUmida ? parseFloat(amostra.massaUmida) : undefined,
      peso_solido: amostra.massaSeca ? parseFloat(amostra.massaSeca) : undefined,
      volume_total: amostra.volume ? parseFloat(amostra.volume) : undefined,
      Gs: formData.Gs ? parseFloat(formData.Gs) : undefined,
      peso_especifico_agua: formData.pesoEspecificoAgua ? parseFloat(formData.pesoEspecificoAgua) : 10.0,
      indice_vazios_max: formData.indice_vazios_max ? parseFloat(formData.indice_vazios_max) : undefined,
      indice_vazios_min: formData.indice_vazios_min ? parseFloat(formData.indice_vazios_min) : undefined,
    }));

    // Remove valores NaN/undefined
    const amostrasLimpas = amostrasAPI.map(amostra => {
      const limpa: any = {};
      Object.keys(amostra).forEach(key => {
        const valor = (amostra as any)[key];
        if (valor !== undefined && !isNaN(valor as number)) {
          limpa[key] = valor;
        }
      });
      return limpa;
    });

    // Validação emin < emax
    if (amostrasLimpas[0].indice_vazios_min !== undefined &&
      amostrasLimpas[0].indice_vazios_max !== undefined &&
      amostrasLimpas[0].indice_vazios_min >= amostrasLimpas[0].indice_vazios_max) {
      setError("Índice de vazios mínimo (emin) deve ser menor que o máximo (emax).");
      notify.error({ title: "Erro de Entrada", description: "emin deve ser < emax" });
      setIsCalculating(false);
      return;
    }

    try {
      // Usar função de múltiplas amostras
      const resultado = calcularIndicesFisicosMultiplasAmostras(amostrasLimpas) as Results;

      if (resultado.erro) {
        setError(resultado.erro);
        notify.error({ title: "Erro no Cálculo", description: resultado.erro });
      } else {
        setResults(resultado);

        // Toast especial se houver múltiplas amostras
        if (resultado.num_amostras && resultado.num_amostras > 1) {
          notify.success({ title: `✅ ${resultado.num_amostras} amostras calculadas!`, description: "Estatísticas calculadas com sucesso" });
        }
      }
    } catch (err) {
      let errorMessage = "Erro ao calcular os índices físicos.";
      if (err instanceof Error) {
        errorMessage = err.message;
      }
      setError(errorMessage);
      notify.error({ title: "Erro", description: errorMessage });
    } finally {
      setIsCalculating(false);
    }
  };

  const handleClear = () => {
    setFormData({
      amostras: [{
        id: generateId(),
        massaUmida: "",
        massaSeca: "",
        volume: ""
      }],
      Gs: "",
      pesoEspecificoAgua: "10.0",
      indice_vazios_max: "",
      indice_vazios_min: "",
    });
    setCurrentAmostraIndex(0);
    setResults(null);
    setError(null);
  };

  const handleLoadExample = (example: SoilExample) => {
    setFormData({
      amostras: example.amostras.map(a => ({ ...a, id: generateId() })),
      Gs: example.Gs,
      pesoEspecificoAgua: example.pesoEspecificoAgua,
      indice_vazios_max: example.indice_vazios_max || "",
      indice_vazios_min: example.indice_vazios_min || "",
    });
    setCurrentAmostraIndex(0);
    setResults(null);
    setError(null);
    notify.success({ title: `${example.icon} ${example.name} carregado!`, description: example.description });
  };

  const handleSelectGs = (gsValue: number) => {
    setFormData(prev => ({ ...prev, Gs: gsValue.toString() }));
    notify.success({ title: "Gs atualizado!", description: `Densidade dos grãos definida como ${gsValue}` });
  };

  // Funções de salvamento e carregamento
  const handleSaveClick = () => {
    if (!results) return;
    setSaveName(`Cálculo ${new Date().toLocaleDateString('pt-BR')}`);
    setSaveDialogOpen(true);
  };

  const handleConfirmSave = () => {
    if (!results || !saveName.trim()) return;

    const success = saveCalculation(saveName.trim(), formData, results);
    if (success) {
      notify.success({ title: "Cálculo salvo!", description: "O cálculo foi salvo com sucesso." });
      setSaveDialogOpen(false);
      setSaveName("");
    } else {
      notify.error({ title: "Erro ao salvar", description: "Não foi possível salvar o cálculo." });
    }
  };

  const handleLoadCalculation = (calculation: any) => {
    setFormData(calculation.formData);
    setResults(calculation.results);
    notify.success({ title: "Cálculo carregado!", description: `"${calculation.name}" foi carregado com sucesso.` });
  };



  const handleExportPDF = () => {
    if (!results) return;

    // Gerar nome padrão usando a função auxiliar
    const defaultName = generateDefaultPDFFileName("Índices Físicos");

    setPdfFileName(defaultName);
    setExportPDFDialogOpen(true);
  };

  const handleConfirmExportPDF = async () => {
    if (!results) return;

    setIsExportingPDF(true);

    // Criar tabela de amostras
    const tabelaAmostras = {
      title: `Dados de Entrada (${formData.amostras.length} amostra${formData.amostras.length > 1 ? 's' : ''})`,
      headers: ["Amostra", "Massa Úmida (g)", "Massa Seca (g)", "Volume (cm³)"],
      rows: formData.amostras.map((amostra, idx) => [
        `${idx + 1}`,
        amostra.massaUmida || "—",
        amostra.massaSeca || "—",
        amostra.volume || "—"
      ])
    };

    // Parâmetros comuns
    const inputs: { label: string; value: string }[] = [];
    if (formData.Gs) inputs.push({ label: "Densidade dos Grãos (Gs)", value: formData.Gs });
    if (formData.pesoEspecificoAgua) inputs.push({ label: "Peso Específico Água", value: `${formData.pesoEspecificoAgua} kN/m³` });
    if (formData.indice_vazios_max) inputs.push({ label: "Índice Vazios Máx (emax)", value: formData.indice_vazios_max });
    if (formData.indice_vazios_min) inputs.push({ label: "Índice Vazios Mín (emin)", value: formData.indice_vazios_min });

    const resultsList: { label: string; value: string; highlight?: boolean }[] = [];
    if (results.peso_especifico_natural != null) resultsList.push({ label: "Peso Específico Natural", value: `${formatNumberForExport(results.peso_especifico_natural!)} kN/m³`, highlight: true });
    if (results.peso_especifico_seco != null) resultsList.push({ label: "Peso Específico Seco", value: `${formatNumberForExport(results.peso_especifico_seco!)} kN/m³` });
    if (results.peso_especifico_saturado != null) resultsList.push({ label: "Peso Específico Saturado", value: `${formatNumberForExport(results.peso_especifico_saturado!)} kN/m³` });
    if (results.peso_especifico_submerso != null) resultsList.push({ label: "Peso Específico Submerso", value: `${formatNumberForExport(results.peso_especifico_submerso!)} kN/m³` });
    if (results.Gs != null) resultsList.push({ label: "Densidade dos Grãos (Gs)", value: formatNumberForExport(results.Gs!, 3) });
    if (results.indice_vazios != null) resultsList.push({ label: "Índice de Vazios", value: formatNumberForExport(results.indice_vazios!, 3) });
    if (results.porosidade != null) resultsList.push({ label: "Porosidade", value: `${formatNumberForExport(results.porosidade!)}%` });
    if (results.grau_saturacao != null) resultsList.push({ label: "Grau de Saturação", value: `${formatNumberForExport(results.grau_saturacao!)}%` });
    if (results.umidade != null) resultsList.push({ label: "Umidade", value: `${formatNumberForExport(results.umidade!)}%` });
    if (results.compacidade_relativa != null) resultsList.push({ label: "Compacidade Relativa", value: `${formatNumberForExport(results.compacidade_relativa!)}%` });
    if (results.classificacao_compacidade) resultsList.push({ label: "Classificação", value: results.classificacao_compacidade });

    // Fórmulas utilizadas com LaTeX
    const formulas = [
      {
        label: "Peso Específico Natural",
        formula: "\\gamma_{nat} = \\frac{M_{total}}{V_{total}} \\times 10",
        latex: true,
        description: "Relação entre a massa total do solo (úmido) e seu volume total em kN/m³"
      },
      {
        label: "Umidade",
        formula: "w = \\frac{M_{\\acute{u}mida} - M_{seca}}{M_{seca}} \\times 100\\%",
        latex: true,
        description: "Percentual de água em relação à massa seca dos sólidos"
      },
      {
        label: "Peso Específico Seco",
        formula: "\\gamma_d = \\frac{\\gamma_{nat}}{1 + \\frac{w}{100}}",
        latex: true,
        description: "Peso específico do solo sem considerar a massa de água"
      },
      {
        label: "Índice de Vazios",
        formula: "e = \\frac{G_s \\times \\gamma_w}{\\gamma_d} - 1",
        latex: true,
        description: "Relação entre o volume de vazios e o volume de sólidos (adimensional)"
      },
      {
        label: "Porosidade",
        formula: "n = \\frac{e}{1 + e} \\times 100\\%",
        latex: true,
        description: "Percentual de vazios em relação ao volume total"
      },
      {
        label: "Grau de Saturação",
        formula: "S_r = \\frac{w \\times G_s}{e} \\times 100\\%",
        latex: true,
        description: "Percentual dos vazios ocupados por água"
      },
      {
        label: "Peso Específico Saturado",
        formula: "\\gamma_{sat} = \\frac{G_s + e}{1 + e} \\times \\gamma_w",
        latex: true,
        description: "Peso específico quando todos os vazios estão preenchidos com água"
      },
      {
        label: "Peso Específico Submerso",
        formula: "\\gamma_{sub} = \\gamma_{sat} - \\gamma_w",
        latex: true,
        description: "Peso específico efetivo do solo quando submerso (Princípio de Arquimedes)"
      },
    ];

    if (results.compacidade_relativa != null) {
      formulas.push({
        label: "Compacidade Relativa",
        formula: "D_r = \\frac{e_{max} - e}{e_{max} - e_{min}} \\times 100\\%",
        latex: true,
        description: "Indica o estado de compactação de solos granulares (0% = fofo, 100% = denso)"
      });
    }

    // Criar tabela de estatísticas (se houver múltiplas amostras)
    const tabelas: { title: string; headers: string[]; rows: (string | number)[][] }[] = [tabelaAmostras];

    if (results.num_amostras && results.num_amostras > 1 && results.estatisticas) {
      const tabelaEstatisticas = {
        title: `Estatísticas (${results.num_amostras} amostras)`,
        headers: ["Parâmetro", "Média", "DP", "CV (%)", "Mín", "Máx"],
        rows: []
      };

      if (results.estatisticas.peso_especifico_natural) {
        const e = results.estatisticas.peso_especifico_natural;
        tabelaEstatisticas.rows.push([
          "Peso Específico Natural (kN/m³)",
          formatNumberForExport(e.media),
          formatNumberForExport(e.desvio_padrao, 3),
          formatNumberForExport(e.coeficiente_variacao, 1),
          formatNumberForExport(e.minimo),
          formatNumberForExport(e.maximo)
        ]);
      }

      if (results.estatisticas.peso_especifico_seco) {
        const e = results.estatisticas.peso_especifico_seco;
        tabelaEstatisticas.rows.push([
          "Peso Específico Seco (kN/m³)",
          formatNumberForExport(e.media),
          formatNumberForExport(e.desvio_padrao, 3),
          formatNumberForExport(e.coeficiente_variacao, 1),
          formatNumberForExport(e.minimo),
          formatNumberForExport(e.maximo)
        ]);
      }

      if (results.estatisticas.umidade) {
        const e = results.estatisticas.umidade;
        tabelaEstatisticas.rows.push([
          "Umidade (%)",
          formatNumberForExport(e.media),
          formatNumberForExport(e.desvio_padrao, 3),
          formatNumberForExport(e.coeficiente_variacao, 1),
          formatNumberForExport(e.minimo),
          formatNumberForExport(e.maximo)
        ]);
      }

      if (results.estatisticas.indice_vazios) {
        const e = results.estatisticas.indice_vazios;
        tabelaEstatisticas.rows.push([
          "Índice de Vazios",
          formatNumberForExport(e.media, 3),
          formatNumberForExport(e.desvio_padrao, 3),
          formatNumberForExport(e.coeficiente_variacao, 1),
          formatNumberForExport(e.minimo, 3),
          formatNumberForExport(e.maximo, 3)
        ]);
      }

      if (results.estatisticas.porosidade) {
        const e = results.estatisticas.porosidade;
        tabelaEstatisticas.rows.push([
          "Porosidade (%)",
          formatNumberForExport(e.media),
          formatNumberForExport(e.desvio_padrao, 3),
          formatNumberForExport(e.coeficiente_variacao, 1),
          formatNumberForExport(e.minimo),
          formatNumberForExport(e.maximo)
        ]);
      }

      if (results.estatisticas.grau_saturacao) {
        const e = results.estatisticas.grau_saturacao;
        tabelaEstatisticas.rows.push([
          "Grau de Saturação (%)",
          formatNumberForExport(e.media),
          formatNumberForExport(e.desvio_padrao, 3),
          formatNumberForExport(e.coeficiente_variacao, 1),
          formatNumberForExport(e.minimo),
          formatNumberForExport(e.maximo)
        ]);
      }

      tabelas.push(tabelaEstatisticas);
    }

    const exportData: ExportData = {
      moduleName: "indices-fisicos",
      moduleTitle: "Índices Físicos",
      inputs,
      results: resultsList,
      formulas,
      tables: tabelas,
      customFileName: pdfFileName,
      // Passar título personalizado se a configuração estiver ativa
      customTitle: settings.printSettings?.includeCustomTitle ? customReportTitle : undefined,
      theme: { mode: theme.mode, color: (theme as any).color || 'indigo' },
      printSettings: settings.printSettings
    };

    // Persistir último título personalizado para ser usado como padrão
    try {
      if (settings.printSettings?.includeCustomTitle) {
        localStorage.setItem('edusolo_last_custom_report_title', customReportTitle || '');
      }
    } catch { }

    const result = await exportToPDF(exportData, true);

    setIsExportingPDF(false);

    if (result instanceof Blob) {
      try {
        const reportName = pdfFileName.replace('.pdf', '');
        const prepared = await prepareReportForStorage({
          name: reportName,
          moduleType: 'indices-fisicos',
          moduleName: 'Índices Físicos',
          pdfBlob: result,
          calculationData: {
            formData,
            results,
            exportDate: new Date().toISOString()
          }
        });
        addReport(prepared);
        setExportPDFDialogOpen(false);
        // Padrão unificado: abrir diálogo pós-exportação com CTA
        notify.success({ title: "Relatório salvo", description: "PDF disponível em Relatórios" });
        setPdfSavedDialogOpen(true);
      } catch (error) {
        console.error('Erro ao salvar relatório:', error);
        notify.warning({ title: "PDF exportado", description: "Não foi possível salvar em Relatórios." });
      }
    } else {
      notify.error({ title: "Erro ao exportar", description: "Não foi possível gerar o PDF." });
    }
  };

  const handleExportExcel = async () => {
    if (!results) return;

    // Sheet de Amostras (tabela)
    const amostrasData: { label: string; value: string | number }[] = [
      { label: "=== AMOSTRAS ===", value: "" },
    ];
    formData.amostras.forEach((amostra, idx) => {
      amostrasData.push({ label: `-- Amostra ${idx + 1} --`, value: "" });
      amostrasData.push({ label: "Massa Úmida (g)", value: amostra.massaUmida || "—" });
      amostrasData.push({ label: "Massa Seca (g)", value: amostra.massaSeca || "—" });
      amostrasData.push({ label: "Volume (cm³)", value: amostra.volume || "—" });
    });

    // Parâmetros comuns
    amostrasData.push({ label: "", value: "" });
    amostrasData.push({ label: "=== PARÂMETROS COMUNS ===", value: "" });
    if (formData.Gs) amostrasData.push({ label: "Densidade dos Grãos (Gs)", value: formData.Gs });
    if (formData.pesoEspecificoAgua) amostrasData.push({ label: "Peso Específico Água (kN/m³)", value: formData.pesoEspecificoAgua });
    if (formData.indice_vazios_max) amostrasData.push({ label: "Índice Vazios Máx (emax)", value: formData.indice_vazios_max });
    if (formData.indice_vazios_min) amostrasData.push({ label: "Índice Vazios Mín (emin)", value: formData.indice_vazios_min });

    // Sheet de Resultados
    const resultadosData: { label: string; value: string | number }[] = [];
    if (results.peso_especifico_natural != null) resultadosData.push({ label: "Peso Específico Natural (kN/m³)", value: results.peso_especifico_natural!.toFixed(2) });
    if (results.peso_especifico_seco != null) resultadosData.push({ label: "Peso Específico Seco (kN/m³)", value: results.peso_especifico_seco!.toFixed(2) });
    if (results.peso_especifico_saturado != null) resultadosData.push({ label: "Peso Específico Saturado (kN/m³)", value: results.peso_especifico_saturado!.toFixed(2) });
    if (results.peso_especifico_submerso != null) resultadosData.push({ label: "Peso Específico Submerso (kN/m³)", value: results.peso_especifico_submerso!.toFixed(2) });
    if (results.peso_especifico_solidos != null) resultadosData.push({ label: "Peso Específico Sólidos (kN/m³)", value: results.peso_especifico_solidos!.toFixed(2) });
    if (results.Gs != null) resultadosData.push({ label: "Densidade dos Grãos (Gs)", value: results.Gs!.toFixed(3) });
    if (results.indice_vazios != null) resultadosData.push({ label: "Índice de Vazios", value: results.indice_vazios!.toFixed(3) });
    if (results.porosidade != null) resultadosData.push({ label: "Porosidade (%)", value: results.porosidade!.toFixed(2) });
    if (results.grau_saturacao != null) resultadosData.push({ label: "Grau de Saturação (%)", value: results.grau_saturacao!.toFixed(2) });
    if (results.umidade != null) resultadosData.push({ label: "Umidade (%)", value: results.umidade!.toFixed(2) });
    if (results.compacidade_relativa != null) resultadosData.push({ label: "Compacidade Relativa (%)", value: results.compacidade_relativa!.toFixed(2) });
    if (results.classificacao_compacidade) resultadosData.push({ label: "Classificação", value: results.classificacao_compacidade });

    // Sheet de Estatísticas (se houver múltiplas amostras)
    const sheets: { name: string; data: { label: string; value: string | number }[] }[] = [
      { name: "Amostras", data: amostrasData },
      { name: "Resultados", data: resultadosData }
    ];

    if (results.num_amostras && results.num_amostras > 1 && results.estatisticas) {
      const estatisticasData: { label: string; value: string | number }[] = [
        { label: `=== ESTATÍSTICAS (${results.num_amostras} amostras) ===`, value: "" },
        { label: "", value: "" },
      ];

      if (results.estatisticas.peso_especifico_natural) {
        const e = results.estatisticas.peso_especifico_natural;
        estatisticasData.push({ label: "-- γn (kN/m³) --", value: "" });
        estatisticasData.push({ label: "Média", value: e.media.toFixed(2) });
        estatisticasData.push({ label: "Desvio Padrão", value: e.desvio_padrao.toFixed(3) });
        estatisticasData.push({ label: "CV (%)", value: e.coeficiente_variacao.toFixed(1) });
        estatisticasData.push({ label: "Mínimo", value: e.minimo.toFixed(2) });
        estatisticasData.push({ label: "Máximo", value: e.maximo.toFixed(2) });
        estatisticasData.push({ label: "", value: "" });
      }

      if (results.estatisticas.peso_especifico_seco) {
        const e = results.estatisticas.peso_especifico_seco;
        estatisticasData.push({ label: "-- γd (kN/m³) --", value: "" });
        estatisticasData.push({ label: "Média", value: e.media.toFixed(2) });
        estatisticasData.push({ label: "Desvio Padrão", value: e.desvio_padrao.toFixed(3) });
        estatisticasData.push({ label: "CV (%)", value: e.coeficiente_variacao.toFixed(1) });
        estatisticasData.push({ label: "Mínimo", value: e.minimo.toFixed(2) });
        estatisticasData.push({ label: "Máximo", value: e.maximo.toFixed(2) });
        estatisticasData.push({ label: "", value: "" });
      }

      if (results.estatisticas.umidade) {
        const e = results.estatisticas.umidade;
        estatisticasData.push({ label: "-- Umidade (%) --", value: "" });
        estatisticasData.push({ label: "Média", value: e.media.toFixed(2) });
        estatisticasData.push({ label: "Desvio Padrão", value: e.desvio_padrao.toFixed(3) });
        estatisticasData.push({ label: "CV (%)", value: e.coeficiente_variacao.toFixed(1) });
        estatisticasData.push({ label: "Mínimo", value: e.minimo.toFixed(2) });
        estatisticasData.push({ label: "Máximo", value: e.maximo.toFixed(2) });
        estatisticasData.push({ label: "", value: "" });
      }

      sheets.push({ name: "Estatísticas", data: estatisticasData });
    }

    const excelData: ExcelExportData = {
      moduleName: "indices-fisicos",
      moduleTitle: "Índices Físicos",
      sheets,
    };

    const success = await exportToExcel(excelData);
    if (success) {
      notify.success({ description: "Excel exportado com sucesso!" });
    } else {
      notify.error({ description: "Erro ao exportar Excel." });
    }
  };

  // Validação: precisa dos dados da amostra atual E do Gs (OBRIGATÓRIO)
  const currentAmostra = formData.amostras[currentAmostraIndex];
  const isCurrentAmostraValid =
    currentAmostra?.massaUmida &&
    currentAmostra?.massaSeca &&
    currentAmostra?.volume &&
    !isNaN(parseFloat(currentAmostra.massaUmida)) &&
    !isNaN(parseFloat(currentAmostra.massaSeca)) &&
    !isNaN(parseFloat(currentAmostra.volume));

  const isFormValid =
    isCurrentAmostraValid &&
    formData.Gs &&
    !isNaN(parseFloat(formData.Gs)) &&
    formData.amostras.every(a =>
      a.massaUmida && a.massaSeca && a.volume &&
      !isNaN(parseFloat(a.massaUmida)) &&
      !isNaN(parseFloat(a.massaSeca)) &&
      !isNaN(parseFloat(a.volume))
    );

  // Agrupamento dos Resultados para o Carrossel
  const resultItems = useMemo(() => {
    if (!results || results.erro) return [];

    const items = [
      results.peso_especifico_natural !== null ? <ResultItem key="gama_nat" label="Natural (γn)" value={results.peso_especifico_natural} unit="kN/m³" infoKey="peso_especifico_natural" settings={settings} /> : null,
      results.peso_especifico_seco !== null ? <ResultItem key="gama_d" label="Seco (γd)" value={results.peso_especifico_seco} unit="kN/m³" infoKey="peso_especifico_seco" settings={settings} /> : null,
      results.peso_especifico_solidos !== null ? <ResultItem key="gama_s" label="Sólidos (γs)" value={results.peso_especifico_solidos} unit="kN/m³" infoKey="peso_especifico_solidos" settings={settings} /> : null,
      results.Gs !== null ? <ResultItem key="Gs" label="Densidade dos Grãos (Gs)" value={results.Gs} unit="" infoKey="Gs" settings={settings} /> : null,
      results.peso_especifico_saturado !== null ? <ResultItem key="gama_sat" label="Saturado (γsat)" value={results.peso_especifico_saturado} unit="kN/m³" infoKey="peso_especifico_saturado" settings={settings} /> : null,
      results.peso_especifico_submerso !== null ? <ResultItem key="gama_sub" label="Submerso (γsub)" value={results.peso_especifico_submerso} unit="kN/m³" infoKey="peso_especifico_submerso" settings={settings} /> : null,
      results.umidade !== null ? <ResultItem key="w" label="Umidade (w)" value={results.umidade} unit="%" infoKey="umidade" settings={settings} /> : null,
      results.indice_vazios !== null ? <ResultItem key="e" label="Índice de Vazios (e)" value={results.indice_vazios} unit="" infoKey="indice_vazios" settings={settings} /> : null,
      results.porosidade !== null ? <ResultItem key="n" label="Porosidade (n)" value={results.porosidade} unit="%" infoKey="porosidade" settings={settings} /> : null,
      results.grau_saturacao !== null ? <ResultItem key="Sr" label="Grau de Saturação (Sr)" value={results.grau_saturacao} unit="%" infoKey="grau_saturacao" settings={settings} /> : null,
      results.compacidade_relativa !== null ? <ResultItem key="Dr" label="Compacidade Relativa (Dr)" value={results.compacidade_relativa} unit="%" infoKey="compacidade_relativa" settings={settings} /> : null,
      results.classificacao_compacidade ? <ResultItem key="class_dr" label="Classificação (Dr)" value={results.classificacao_compacidade} unit="" infoKey="classificacao_compacidade" settings={settings} /> : null,
    ].filter(Boolean); // Remove os nulos

    // Agrupa em chunks de 4
    const chunkSize = 4;
    const chunks = [];
    for (let i = 0; i < items.length; i += chunkSize) {
      chunks.push(items.slice(i, i + chunkSize));
    }
    return chunks;
  }, [results, settings]);


  return (
    <TooltipProvider>
      <div className="space-y-6 max-w-7xl mx-auto">
        <PrintHeader moduleTitle="Índices Físicos" moduleName="indices-fisicos" />

        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-in fade-in slide-in-from-left-4 duration-500" data-tour="module-header">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 flex items-center justify-center shadow-lg transition-transform hover:scale-110 hover:rotate-3">
              <Beaker className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Índices Físicos</h1>
              <p className="text-sm sm:text-base text-muted-foreground">Análise das propriedades físicas do solo</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2" data-tour="actions">
            <SoilExamples onSelect={handleLoadExample} disabled={isCalculating} />

            <TooltipProvider>
              <CalculationActions
                onSave={handleSaveClick}
                onLoad={() => setLoadDialogOpen(true)}
                onExportPDF={handleExportPDF}
                onExportExcel={handleExportExcel}
                hasResults={!!results}
                isCalculating={isCalculating}
              />
            </TooltipProvider>
          </div>
        </div>

        {/* Layout Principal */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 items-start">
          {/* Input Panel - Ajustes de espaçamento aqui */}
          <Card className="glass p-4 sm:p-6 md:col-span-1 flex flex-col animate-in fade-in slide-in-from-left-4 duration-700" style={{ animationDelay: '100ms', animationFillMode: 'backwards' }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
                <Info className="w-5 h-5" />
                Amostra {currentAmostraIndex + 1} de {formData.amostras.length}
              </h2>

              {/* Navegação entre amostras */}
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={goToPreviousAmostra}
                  disabled={currentAmostraIndex === 0 || isCalculating}
                  className="h-8 w-8"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>

                <Button
                  variant="outline"
                  size="icon"
                  onClick={goToNextAmostra}
                  disabled={currentAmostraIndex === formData.amostras.length - 1 || isCalculating}
                  className="h-8 w-8"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>

                <Button
                  variant="outline"
                  size="icon"
                  onClick={addAmostra}
                  disabled={isCalculating}
                  className="h-8 w-8"
                  data-tour="add-amostra"
                >
                  <Plus className="h-4 w-4" />
                </Button>

                {formData.amostras.length > 1 && (
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={removeAmostra}
                    disabled={isCalculating}
                    className="h-8 w-8 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>

            {/* Inputs da amostra atual em 2 colunas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6" data-tour="input-basicos">
              <InputWithValidation
                id="massaUmida"
                label="Massa Úmida (g)"
                value={currentAmostra?.massaUmida || ""}
                onChange={(value) => handleAmostraChange("massaUmida", value)}
                tooltip={tooltips.massaUmida}
                placeholder="Ex: 150.5"
                validationRules={[
                  {
                    validate: (v) => parseFloat(v) > 0,
                    message: "Deve ser maior que 0",
                  },
                  {
                    validate: (v) => {
                      if (!currentAmostra?.massaSeca) return true;
                      return parseFloat(v) >= parseFloat(currentAmostra.massaSeca);
                    },
                    message: "Massa úmida deve ser ≥ massa seca",
                  },
                ]}
              />

              <InputWithValidation
                id="massaSeca"
                label="Massa Seca (g)"
                value={currentAmostra?.massaSeca || ""}
                onChange={(value) => handleAmostraChange("massaSeca", value)}
                tooltip={tooltips.massaSeca}
                placeholder="Ex: 130.2"
                validationRules={[
                  {
                    validate: (v) => parseFloat(v) > 0,
                    message: "Deve ser maior que 0",
                  },
                  {
                    validate: (v) => {
                      if (!currentAmostra?.massaUmida) return true;
                      return parseFloat(v) <= parseFloat(currentAmostra.massaUmida);
                    },
                    message: "Massa seca deve ser ≤ massa úmida",
                  },
                ]}
              />

              <InputWithValidation
                id="volume"
                label="Volume Total (cm³)"
                value={currentAmostra?.volume || ""}
                onChange={(value) => handleAmostraChange("volume", value)}
                tooltip={tooltips.volume}
                placeholder="Ex: 100.0"
                validationRules={[
                  {
                    validate: (v) => parseFloat(v) > 0,
                    message: "Deve ser maior que 0",
                  },
                ]}
              />
            </div>

            <Separator className="my-4" />

            {/* Parâmetros comuns (Gs, emax, emin) em 2 colunas */}
            <h3 className="text-md font-semibold mb-4">Parâmetros Comuns (Todas as Amostras)</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="Gs">Densidade dos Grãos (Gs) *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <PopoverButton variant="ghost" size="icon" className="h-5 w-5 p-0 hover:bg-muted">
                        <Info className="w-4 h-4 text-muted-foreground cursor-pointer" />
                      </PopoverButton>
                    </PopoverTrigger>
                    <PopoverContent className="max-w-xs" align="start">
                      <p className="text-sm">{tooltips.Gs}</p>
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    id="Gs"
                    type="number"
                    step="0.01"
                    value={formData.Gs}
                    onChange={(e) => handleChange("Gs", e.target.value)}
                    className="bg-background/50 flex-1"
                    placeholder="Ex: 2.65"
                    required
                  />
                  <GsSuggestions onSelect={handleSelectGs} />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="indice_vazios_max">Índice de Vazios Máximo (emax)</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <PopoverButton variant="ghost" size="icon" className="h-5 w-5 p-0 hover:bg-muted">
                        <Info className="w-4 h-4 text-muted-foreground cursor-pointer" />
                      </PopoverButton>
                    </PopoverTrigger>
                    <PopoverContent className="max-w-xs" align="start">
                      <p className="text-sm">{tooltips.indice_vazios_max}</p>
                    </PopoverContent>
                  </Popover>
                </div>
                <Input
                  id="indice_vazios_max"
                  type="number"
                  step="0.01"
                  value={formData.indice_vazios_max}
                  onChange={(e) => handleChange("indice_vazios_max", e.target.value)}
                  className="bg-background/50"
                  placeholder="Opcional (ex: 0.85)"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="indice_vazios_min">Índice de Vazios Mínimo (emin)</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <PopoverButton variant="ghost" size="icon" className="h-5 w-5 p-0 hover:bg-muted">
                        <Info className="w-4 h-4 text-muted-foreground cursor-pointer" />
                      </PopoverButton>
                    </PopoverTrigger>
                    <PopoverContent className="max-w-xs" align="start">
                      <p className="text-sm">{tooltips.indice_vazios_min}</p>
                    </PopoverContent>
                  </Popover>
                </div>
                <Input
                  id="indice_vazios_min"
                  type="number"
                  step="0.01"
                  value={formData.indice_vazios_min}
                  onChange={(e) => handleChange("indice_vazios_min", e.target.value)}
                  className="bg-background/50"
                  placeholder="Opcional (ex: 0.45)"
                />
              </div>
            </div>
            {/* Select - Peso Específico Água */}
            <div className="space-y-2 mb-8 md:col-span-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="pesoEspecificoAgua">Peso Específico Água (kN/m³)</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <PopoverButton variant="ghost" size="icon" className="h-5 w-5 p-0 hover:bg-muted">
                      <Info className="w-4 h-4 text-muted-foreground cursor-pointer" />
                    </PopoverButton>
                  </PopoverTrigger>
                  <PopoverContent className="max-w-xs" align="start">
                    <p className="text-sm">{tooltips.pesoEspecificoAgua}</p>
                  </PopoverContent>
                </Popover>
              </div>
              <Select value={formData.pesoEspecificoAgua} onValueChange={(value) => handleChange("pesoEspecificoAgua", value)}>
                <SelectTrigger className="bg-background/50">
                  <SelectValue placeholder="Selecione o peso específico" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="9.81">9.81 kN/m³ (exato)</SelectItem>
                  <SelectItem value="10.0">10.0 kN/m³ (aproximado)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 md:col-span-2 mt-auto pt-4" role="group" aria-label="Ações do formulário">
              <Button
                onClick={handleCalculate}
                disabled={!isFormValid || isCalculating}
                className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground h-10"
                aria-label={isCalculating ? "Calculando dados" : "Calcular índices físicos"}
                data-tour="btn-calcular"
              >
                <Calculator className="w-4 h-4 mr-2" />
                {isCalculating ? "Calculando..." : "Calcular"}
              </Button>
              <Button
                onClick={handleClear}
                variant="outline"
                disabled={isCalculating}
                aria-label="Limpar todos os campos"
                className="h-10 w-full sm:w-auto"
              >
                Limpar
              </Button>
            </div>
          </Card>

          {/* Card de Saída Unificado */}
          <Card className="glass p-4 sm:p-6 md:col-span-1 space-y-4 sm:space-y-6 animate-in fade-in slide-in-from-right-4 duration-700" style={{ animationDelay: '200ms', animationFillMode: 'backwards' }}>
            {/* Seção do Diagrama de Fases */}
            <div data-tour="diagrama-fases">
              <h2 className="text-xl font-semibold text-foreground mb-4">Visualização (Diagrama de Fases)</h2>
              <div className="flex justify-center items-center min-h-[180px]">
                {isCalculating ? (
                  <Skeleton className="w-full max-w-sm h-36 bg-muted/20" />
                ) : results && results.volume_solidos_norm !== null && results.volume_agua_norm !== null && results.volume_ar_norm !== null && !results.erro ? (
                  <DiagramaFases
                    volumeSolidosNorm={results.volume_solidos_norm}
                    volumeAguaNorm={results.volume_agua_norm}
                    volumeArNorm={results.volume_ar_norm}
                    pesoSolidosNorm={results.peso_solidos_norm}
                    pesoAguaNorm={results.peso_agua_norm}
                    volumeSolidosCalc={results.volume_solidos_calc}
                    volumeAguaCalc={results.volume_agua_calc}
                    volumeArCalc={results.volume_ar_calc}
                    massaSolidosCalc={results.massa_solidos_calc}
                    massaAguaCalc={results.massa_agua_calc}
                    volumeTotalCalc={results.volume_total_calc}
                    massaTotalCalc={results.massa_total_calc}
                    className="w-full max-w-sm"
                  />
                ) : !error ? (
                  <p className="text-muted-foreground text-center">
                    O diagrama de fases será exibido aqui após o cálculo.
                  </p>
                ) : null}
                {error && !isCalculating && (
                  <div className="flex flex-col items-center justify-center h-full text-center text-destructive">
                    <Info className="w-12 h-12 mb-4" />
                    <p className="font-semibold">Erro</p>
                    <p className="text-sm max-w-xs">{error}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Seção de Resultados Numéricos com Carrossel */}
            <div data-tour="resultados">
              <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-primary" />
                Resultados Numéricos
              </h2>
              {isCalculating ? (
                <div className="relative">
                  <div className="grid grid-cols-2 gap-4">
                    {[...Array(4)].map((_, i) => (
                      <Skeleton key={`sk-${i}`} className="h-[56px] w-full bg-muted/20" />
                    ))}
                  </div>
                </div>
              ) : results && !results.erro && resultItems.length > 0 ? (
                <Carousel opts={{ align: "start" }} className="w-full px-10">
                  <CarouselContent className="-ml-4">
                    {resultItems.map((chunk, index) => (
                      <CarouselItem key={index} className="pl-4 basis-full">
                        <div className="grid grid-cols-2 gap-4">
                          {chunk}
                        </div>
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                  {resultItems.length > 1 && (
                    <>
                      <CarouselPrevious className="absolute left-0 top-1/2 -translate-y-1/2" />
                      <CarouselNext className="absolute right-0 top-1/2 -translate-y-1/2" />
                    </>
                  )}
                </Carousel>
              ) : (
                <div className="flex flex-col items-center justify-center min-h-[150px] text-center">
                  <Beaker className="w-16 h-16 text-muted-foreground/30 mb-4" />
                  <p className="text-muted-foreground">
                    {error ? "Corrija o erro para ver os resultados" : "Os resultados serão exibidos aqui"}
                  </p>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Aviso de cálculo parcial */}
        {results && results.aviso && !isCalculating && (
          <Alert className="animate-in fade-in slide-in-from-bottom-4 duration-500 bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900" style={{ animationDelay: '250ms' }}>
            <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-500" />
            <AlertDescription className="text-amber-800 dark:text-amber-200 ml-2">
              {results.aviso}
            </AlertDescription>
          </Alert>
        )}

        {/* Card de Interpretação */}
        {results && !results.erro && !isCalculating && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: '300ms' }}>
            <ResultInterpretation results={results} />
          </div>
        )}

        {/* Card de Estatísticas (múltiplas amostras) */}
        {results && results.num_amostras && results.num_amostras > 1 && results.estatisticas && !isCalculating && (
          <Card className="glass p-4 sm:p-6 animate-in fade-in slide-in-from-bottom-4 duration-500"
            style={{ animationDelay: '350ms', animationFillMode: 'backwards' }}>
            <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary" />
              Estatísticas ({results.num_amostras} amostras)
            </h2>

            <div className="overflow-x-auto max-h-80 overflow-y-auto rounded-md border">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-background z-10">
                  <tr className="border-b">
                    <th className="text-left py-2 px-2">Parâmetro</th>
                    <th className="text-right py-2 px-2">Média</th>
                    <th className="text-right py-2 px-2">DP</th>
                    <th className="text-right py-2 px-2">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger className="cursor-help">CV (%)</TooltipTrigger>
                          <TooltipContent>
                            <p className="font-semibold">Coeficiente de Variação</p>
                            <p className="text-xs">CV {'<'} 5%: Excelente</p>
                            <p className="text-xs">CV {'<'} 10%: Bom</p>
                            <p className="text-xs">CV {'<'} 15%: Aceitável</p>
                            <p className="text-xs">CV ≥ 15%: Questionável</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </th>
                    <th className="text-right py-2 px-2">Min</th>
                    <th className="text-right py-2 px-2">Max</th>
                  </tr>
                </thead>
                <tbody>
                  {results.estatisticas.peso_especifico_natural && (
                    <tr className="border-b hover:bg-muted/50 odd:bg-muted/20">
                      <td className="py-2 px-2 font-medium">γn (kN/m³)</td>
                      <td className="text-right py-2 px-2">{formatNumber(results.estatisticas.peso_especifico_natural.media, settings)}</td>
                      <td className="text-right py-2 px-2">{results.estatisticas.peso_especifico_natural.desvio_padrao.toFixed(3)}</td>
                      <td className={cn(
                        "text-right py-2 px-2 font-semibold",
                        results.estatisticas.peso_especifico_natural.coeficiente_variacao < 5 ? "text-green-600" :
                          results.estatisticas.peso_especifico_natural.coeficiente_variacao < 10 ? "text-blue-600" :
                            results.estatisticas.peso_especifico_natural.coeficiente_variacao < 15 ? "text-yellow-600" :
                              "text-red-600"
                      )}>
                        {results.estatisticas.peso_especifico_natural.coeficiente_variacao.toFixed(1)}%
                      </td>
                      <td className="text-right py-2 px-2 text-muted-foreground">{results.estatisticas.peso_especifico_natural.minimo.toFixed(2)}</td>
                      <td className="text-right py-2 px-2 text-muted-foreground">{results.estatisticas.peso_especifico_natural.maximo.toFixed(2)}</td>
                    </tr>
                  )}

                  {results.estatisticas.peso_especifico_seco && (
                    <tr className="border-b hover:bg-muted/50">
                      <td className="py-2 px-2 font-medium">γd (kN/m³)</td>
                      <td className="text-right py-2 px-2">{formatNumber(results.estatisticas.peso_especifico_seco.media, settings)}</td>
                      <td className="text-right py-2 px-2">{results.estatisticas.peso_especifico_seco.desvio_padrao.toFixed(3)}</td>
                      <td className={cn(
                        "text-right py-2 px-2 font-semibold",
                        results.estatisticas.peso_especifico_seco.coeficiente_variacao < 5 ? "text-green-600" :
                          results.estatisticas.peso_especifico_seco.coeficiente_variacao < 10 ? "text-blue-600" :
                            results.estatisticas.peso_especifico_seco.coeficiente_variacao < 15 ? "text-yellow-600" :
                              "text-red-600"
                      )}>
                        {results.estatisticas.peso_especifico_seco.coeficiente_variacao.toFixed(1)}%
                      </td>
                      <td className="text-right py-2 px-2 text-muted-foreground">{results.estatisticas.peso_especifico_seco.minimo.toFixed(2)}</td>
                      <td className="text-right py-2 px-2 text-muted-foreground">{results.estatisticas.peso_especifico_seco.maximo.toFixed(2)}</td>
                    </tr>
                  )}

                  {results.estatisticas.umidade && (
                    <tr className="border-b hover:bg-muted/50">
                      <td className="py-2 px-2 font-medium">Umidade (%)</td>
                      <td className="text-right py-2 px-2">{formatNumber(results.estatisticas.umidade.media, settings)}</td>
                      <td className="text-right py-2 px-2">{results.estatisticas.umidade.desvio_padrao.toFixed(3)}</td>
                      <td className={cn(
                        "text-right py-2 px-2 font-semibold",
                        results.estatisticas.umidade.coeficiente_variacao < 5 ? "text-green-600" :
                          results.estatisticas.umidade.coeficiente_variacao < 10 ? "text-blue-600" :
                            results.estatisticas.umidade.coeficiente_variacao < 15 ? "text-yellow-600" :
                              "text-red-600"
                      )}>
                        {results.estatisticas.umidade.coeficiente_variacao.toFixed(1)}%
                      </td>
                      <td className="text-right py-2 px-2 text-muted-foreground">{results.estatisticas.umidade.minimo.toFixed(2)}</td>
                      <td className="text-right py-2 px-2 text-muted-foreground">{results.estatisticas.umidade.maximo.toFixed(2)}</td>
                    </tr>
                  )}

                  {results.estatisticas.indice_vazios && (
                    <tr className="border-b hover:bg-muted/50">
                      <td className="py-2 px-2 font-medium">Índice de Vazios</td>
                      <td className="text-right py-2 px-2">{formatNumber(results.estatisticas.indice_vazios.media, settings)}</td>
                      <td className="text-right py-2 px-2">{results.estatisticas.indice_vazios.desvio_padrao.toFixed(3)}</td>
                      <td className={cn(
                        "text-right py-2 px-2 font-semibold",
                        results.estatisticas.indice_vazios.coeficiente_variacao < 5 ? "text-green-600" :
                          results.estatisticas.indice_vazios.coeficiente_variacao < 10 ? "text-blue-600" :
                            results.estatisticas.indice_vazios.coeficiente_variacao < 15 ? "text-yellow-600" :
                              "text-red-600"
                      )}>
                        {results.estatisticas.indice_vazios.coeficiente_variacao.toFixed(1)}%
                      </td>
                      <td className="text-right py-2 px-2 text-muted-foreground">{results.estatisticas.indice_vazios.minimo.toFixed(3)}</td>
                      <td className="text-right py-2 px-2 text-muted-foreground">{results.estatisticas.indice_vazios.maximo.toFixed(3)}</td>
                    </tr>
                  )}

                  {results.estatisticas.porosidade && (
                    <tr className="border-b hover:bg-muted/50">
                      <td className="py-2 px-2 font-medium">Porosidade (%)</td>
                      <td className="text-right py-2 px-2">{formatNumber(results.estatisticas.porosidade.media, settings)}</td>
                      <td className="text-right py-2 px-2">{results.estatisticas.porosidade.desvio_padrao.toFixed(3)}</td>
                      <td className={cn(
                        "text-right py-2 px-2 font-semibold",
                        results.estatisticas.porosidade.coeficiente_variacao < 5 ? "text-green-600" :
                          results.estatisticas.porosidade.coeficiente_variacao < 10 ? "text-blue-600" :
                            results.estatisticas.porosidade.coeficiente_variacao < 15 ? "text-yellow-600" :
                              "text-red-600"
                      )}>
                        {results.estatisticas.porosidade.coeficiente_variacao.toFixed(1)}%
                      </td>
                      <td className="text-right py-2 px-2 text-muted-foreground">{results.estatisticas.porosidade.minimo.toFixed(2)}</td>
                      <td className="text-right py-2 px-2 text-muted-foreground">{results.estatisticas.porosidade.maximo.toFixed(2)}</td>
                    </tr>
                  )}

                  {results.estatisticas.grau_saturacao && (
                    <tr className="border-b hover:bg-muted/50">
                      <td className="py-2 px-2 font-medium">Saturação (%)</td>
                      <td className="text-right py-2 px-2">{formatNumber(results.estatisticas.grau_saturacao.media, settings)}</td>
                      <td className="text-right py-2 px-2">{results.estatisticas.grau_saturacao.desvio_padrao.toFixed(3)}</td>
                      <td className={cn(
                        "text-right py-2 px-2 font-semibold",
                        results.estatisticas.grau_saturacao.coeficiente_variacao < 5 ? "text-green-600" :
                          results.estatisticas.grau_saturacao.coeficiente_variacao < 10 ? "text-blue-600" :
                            results.estatisticas.grau_saturacao.coeficiente_variacao < 15 ? "text-yellow-600" :
                              "text-red-600"
                      )}>
                        {results.estatisticas.grau_saturacao.coeficiente_variacao.toFixed(1)}%
                      </td>
                      <td className="text-right py-2 px-2 text-muted-foreground">{results.estatisticas.grau_saturacao.minimo.toFixed(2)}</td>
                      <td className="text-right py-2 px-2 text-muted-foreground">{results.estatisticas.grau_saturacao.maximo.toFixed(2)}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Legenda CV */}
            <div className="mt-4 flex flex-wrap gap-3 text-xs">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-green-600"></div>
                <span>CV {'<'} 5% (Excelente)</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-blue-600"></div>
                <span>CV {'<'} 10% (Bom)</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-yellow-600"></div>
                <span>CV {'<'} 15% (Aceitável)</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-red-600"></div>
                <span>CV ≥ 15% (Questionável)</span>
              </div>
            </div>
          </Card>
        )}

        {/* Dialog para salvar cálculo */}
        <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Salvar Cálculo</DialogTitle>
              <DialogDescription>
                Dê um nome para este cálculo para encontrá-lo facilmente depois.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="save-name">Nome do Cálculo</Label>
                <Input
                  id="save-name"
                  value={saveName}
                  onChange={(e) => setSaveName(e.target.value)}
                  placeholder="Ex: Análise Solo Argiloso - Obra X"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleConfirmSave();
                  }}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setSaveDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleConfirmSave} disabled={!saveName.trim()}>
                Salvar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <ExportPDFDialog
          open={exportPDFDialogOpen}
          onOpenChange={setExportPDFDialogOpen}
          fileName={pdfFileName}
          onFileNameChange={setPdfFileName}
          onConfirm={handleConfirmExportPDF}
          isExporting={isExportingPDF}
        />

        {/* Diálogo pós-exportação: PDF salvo */}
        <Dialog open={pdfSavedDialogOpen} onOpenChange={setPdfSavedDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Relatório gerado</DialogTitle>
              <DialogDescription>
                O PDF foi salvo na seção Relatórios. Deseja ir para lá agora?
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2 sm:gap-2">
              <Button variant="outline" onClick={() => setPdfSavedDialogOpen(false)}>
                Ficar aqui
              </Button>
              <Button
                onClick={() => {
                  setPdfSavedDialogOpen(false);
                  navigate("/relatorios");
                }}
              >
                Ir para Relatórios
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog para carregar cálculos salvos */}
        <SavedCalculations
          open={loadDialogOpen}
          onOpenChange={setLoadDialogOpen}
          calculations={calculations}
          onLoad={handleLoadCalculation}
          onDelete={deleteCalculation}
          onRename={renameCalculation}
          moduleName="Índices Físicos"
        />
      </div>
    </TooltipProvider>
  );
}

// Wrapper principal que escolhe versão mobile ou desktop
export default function IndicesFisicos() {
  return (
    <MobileModuleWrapper mobileVersion={<IndicesFisicosMobile />}>
      <IndicesFisicosDesktop />
    </MobileModuleWrapper>
  );
}

// Componente ResultItem
interface ResultItemProps {
  label: string;
  value: number | string | null;
  unit: string;
  infoKey: keyof typeof conteudoIndicesFisicos;
  settings: AppSettings;
}
function ResultItem({ label, value, unit, infoKey, settings }: ResultItemProps) {
  const content = conteudoIndicesFisicos[infoKey];
  const displayValue = typeof value === 'number' ? formatNumber(value, settings) : value ?? "-";

  if ((value === null && typeof value !== 'string') || !content) return null;

  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-background/50 border border-border/50 min-h-[56px]">
      <div className="flex items-center gap-1.5">
        <span className="text-sm font-medium text-muted-foreground">{label}</span>
        {settings.showEducationalTips && (
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="h-5 w-5 text-muted-foreground hover:text-primary rounded-full">
                <Info className="h-3.5 w-3.5" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 z-50" side="top" align="start">
              <div className="space-y-2">
                <h4 className="font-semibold leading-none text-base">{label}</h4>
                {settings.showFormulas && content?.formula && (
                  <div className="text-sm font-mono bg-muted p-2 rounded border border-border/50">{content.formula}</div>
                )}
                <p className="text-sm text-muted-foreground">{content?.descricao}</p>
                {content?.valoresTipicos && <p className="text-xs text-muted-foreground italic pt-1"><strong>Valores Típicos:</strong> {content.valoresTipicos}</p>}
                {content?.paginaPDF && (
                  <p className="text-xs text-muted-foreground pt-1">
                    <a href="#" onClick={(e) => { e.preventDefault(); alert(`Consultar página ${content.paginaPDF} do PDF "4. Indices_Fisicos_2022-Maro.pdf" para mais detalhes.`); }} className="underline hover:text-primary">
                      Ref. PDF pág. {content.paginaPDF}
                    </a>
                  </p>
                )}
              </div>
            </PopoverContent>
          </Popover>
        )}
      </div>
      <span className="text-base font-semibold text-primary text-right pl-2">{displayValue} {unit}</span>
    </div>
  );
}