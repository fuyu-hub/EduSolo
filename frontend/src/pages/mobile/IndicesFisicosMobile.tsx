import { useState, useEffect } from "react";
import { Beaker, Calculator, BarChart3, Info, Save, Download, FolderOpen, FileText, AlertCircle, Lightbulb, ChevronLeft, ChevronRight, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { calcularIndicesFisicosMultiplasAmostras, type IndicesFisicosOutputComEstatisticas, type EstatisticaParametro } from "@/lib/calculations/indices-fisicos";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/components/ui/use-toast";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import {
  MobileSection,
  MobileInputGroup,
  MobileResultCard,
  MobileTabs,
} from "@/components/mobile";
import DiagramaFases from "@/components/visualizations/DiagramaFases";
import { formatNumber } from "@/lib/format-number";
import { useSettings } from "@/hooks/use-settings";
import { useSavedCalculations } from "@/hooks/use-saved-calculations";
import { SoilExample, soilExamples, type AmostraIndicesFisicos } from "@/lib/soil-constants";
import { exportToPDF, exportToExcel, ExportData, ExcelExportData, formatNumberForExport, generateDefaultPDFFileName } from "@/lib/export-utils";
import { useRecentReports } from "@/hooks/useRecentReports";
import { prepareReportForStorage } from "@/lib/reportManager";
import ExportPDFDialog from "@/components/ExportPDFDialog";
import { useNavigate } from "react-router-dom";
import { useTheme } from "@/hooks/use-theme";
import { conteudoIndicesFisicos } from "@/lib/geotecnia/indicesFisicosConteudo";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface FormData {
  amostras: AmostraIndicesFisicos[];
  Gs: string;
  pesoEspecificoAgua: string;
  indice_vazios_max: string;
  indice_vazios_min: string;
}

type Results = IndicesFisicosOutputComEstatisticas;

// Função para gerar IDs únicos
const generateId = () => `${Date.now()}-${Math.floor(Math.random() * 1000000)}`;

// Cálculos agora são feitos localmente no frontend

// Sugestões de Gs por tipo de solo
const gsSuggestions = [
  { type: "Areia (Quartzo)", value: 2.65, icon: "🏖️" },
  { type: "Argila", value: 2.70, icon: "🧱" },
  { type: "Silte", value: 2.68, icon: "🌾" },
  { type: "Solo Orgânico", value: 2.50, icon: "🌱" },
];

export default function IndicesFisicosMobile() {
  const { settings } = useSettings();
  const { theme } = useTheme();
  const { toast } = useToast();
  const navigate = useNavigate();
  
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
  const [currentAmostraIndex, setCurrentAmostraIndex] = useState(0);
  const [results, setResults] = useState<Results | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Estados para salvamento
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [saveName, setSaveName] = useState("");
  const [loadSheetOpen, setLoadSheetOpen] = useState(false);
  const { calculations, saveCalculation, deleteCalculation, renameCalculation } = useSavedCalculations("indices-fisicos");

  // Estados para exportação
  const [exportPDFDialogOpen, setExportPDFDialogOpen] = useState(false);
  const [pdfFileName, setPdfFileName] = useState("");
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const { addReport } = useRecentReports();
  const [pdfSavedDialogOpen, setPdfSavedDialogOpen] = useState(false);

  // Estados para exemplos e Gs
  const [examplesSheetOpen, setExamplesSheetOpen] = useState(false);
  const [gsSheetOpen, setGsSheetOpen] = useState(false);

  const currentAmostra = formData.amostras[currentAmostraIndex];

  const handleInputChange = (field: keyof Omit<FormData, 'amostras'>, value: string) => {
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
    toast({
      title: "Amostra adicionada",
      description: `Amostra ${formData.amostras.length + 1} criada`,
    });
  };

  const removeAmostra = () => {
    if (formData.amostras.length > 1) {
      setFormData(prev => ({
        ...prev,
        amostras: prev.amostras.filter((_, idx) => idx !== currentAmostraIndex)
      }));
      setCurrentAmostraIndex(prev => Math.max(0, prev - 1));
      toast({
        title: "Amostra removida",
        description: "Amostra excluída com sucesso",
      });
    } else {
      toast({
        title: "Atenção",
        description: "É necessário pelo menos 1 amostra",
      });
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
      toast({
        title: "Erro de Entrada",
        description: "emin deve ser < emax",
        variant: "destructive",
      });
      setIsCalculating(false);
      return;
    }

    try {
      // Usar função de múltiplas amostras
      const resultado = calcularIndicesFisicosMultiplasAmostras(amostrasLimpas);

      if (resultado.erro) {
        setError(resultado.erro);
        toast({
          title: "Erro no Cálculo",
          description: resultado.erro,
          variant: "destructive",
        });
      } else {
        setResults(resultado);
        
        // Toast especial se houver múltiplas amostras
        if (resultado.num_amostras && resultado.num_amostras > 1) {
          toast({
            title: `✅ ${resultado.num_amostras} amostras calculadas!`,
            description: "Estatísticas calculadas com sucesso",
          });
        } else {
          toast({
            title: "✅ Sucesso!",
            description: "Índices calculados com sucesso",
          });
        }
      }
    } catch (err) {
      let errorMessage = "Erro ao calcular os índices físicos.";
      if (err instanceof Error) {
        errorMessage = err.message;
      }
      setError(errorMessage);
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      });
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
    setExamplesSheetOpen(false);
    toast({
      title: `${example.icon} ${example.name}`,
      description: example.description,
    });
  };

  const handleSelectGs = (gsValue: number) => {
    setFormData(prev => ({ ...prev, Gs: gsValue.toString() }));
    setGsSheetOpen(false);
    toast({
      title: "Gs atualizado!",
      description: `Definido como ${gsValue}`,
    });
  };

  // Salvamento
  const handleSaveClick = () => {
    if (!results) return;
    setSaveName(`Cálculo ${new Date().toLocaleDateString('pt-BR')}`);
    setSaveDialogOpen(true);
  };

  const handleConfirmSave = () => {
    if (!results || !saveName.trim()) return;
    
    const success = saveCalculation(saveName.trim(), formData, results);
    if (success) {
      toast({
        title: "💾 Salvo!",
        description: "Cálculo salvo com sucesso",
      });
      setSaveDialogOpen(false);
      setSaveName("");
    } else {
      toast({
        title: "Erro",
        description: "Não foi possível salvar",
        variant: "destructive",
      });
    }
  };

  const handleLoadCalculation = (calculation: any) => {
    setFormData(calculation.formData);
    setResults(calculation.results);
    setLoadSheetOpen(false);
    toast({
      title: "📂 Carregado!",
      description: `"${calculation.name}" foi carregado`,
    });
  };

  // Exportação PDF
  const handleExportPDF = () => {
    if (!results) return;
    setPdfFileName(generateDefaultPDFFileName("Índices Físicos"));
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
    if (results.peso_especifico_natural !== null) resultsList.push({ label: "Peso Específico Natural", value: `${formatNumberForExport(results.peso_especifico_natural)} kN/m³`, highlight: true });
    if (results.peso_especifico_seco !== null) resultsList.push({ label: "Peso Específico Seco", value: `${formatNumberForExport(results.peso_especifico_seco)} kN/m³` });
    if (results.peso_especifico_saturado !== null) resultsList.push({ label: "Peso Específico Saturado", value: `${formatNumberForExport(results.peso_especifico_saturado)} kN/m³` });
    if (results.peso_especifico_submerso !== null) resultsList.push({ label: "Peso Específico Submerso", value: `${formatNumberForExport(results.peso_especifico_submerso)} kN/m³` });
    if (results.Gs !== null) resultsList.push({ label: "Densidade dos Grãos (Gs)", value: formatNumberForExport(results.Gs, 3) });
    if (results.indice_vazios !== null) resultsList.push({ label: "Índice de Vazios", value: formatNumberForExport(results.indice_vazios, 3) });
    if (results.porosidade !== null) resultsList.push({ label: "Porosidade", value: `${formatNumberForExport(results.porosidade)}%` });
    if (results.grau_saturacao !== null) resultsList.push({ label: "Grau de Saturação", value: `${formatNumberForExport(results.grau_saturacao)}%` });
    if (results.umidade !== null) resultsList.push({ label: "Umidade", value: `${formatNumberForExport(results.umidade)}%` });
    if (results.compacidade_relativa !== null) resultsList.push({ label: "Compacidade Relativa", value: `${formatNumberForExport(results.compacidade_relativa)}%` });
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

    if (results.compacidade_relativa !== null) {
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
      theme,
      printSettings: settings.printSettings
    };
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
        toast({ title: "Relatório salvo", description: "PDF disponível em Relatórios" });
        setExportPDFDialogOpen(false);
        setPdfSavedDialogOpen(true);
      } catch (error) {
        console.error('Erro ao salvar relatório:', error);
        toast({ title: "PDF gerado, mas não foi possível salvar em Relatórios.", variant: 'destructive' });
      }
    } else {
      toast({
        title: "Erro",
        description: "Não foi possível gerar o PDF",
        variant: "destructive",
      });
    }
  };

  // Restaurar dados ao abrir via "Gerar" em Relatórios
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem('indices-fisicos_lastData');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.formData) setFormData(parsed.formData);
        if (parsed?.results) setResults(parsed.results);
        sessionStorage.removeItem('indices-fisicos_lastData');
        toast({ title: "Dados do relatório carregados!" });
      }
    } catch (e) {
      console.error('Erro ao restaurar dados (indices-fisicos mobile):', e);
    }
  }, []);

  // Exportação Excel
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

    const resultadosData: { label: string; value: string | number }[] = [];
    if (results.peso_especifico_natural !== null) resultadosData.push({ label: "Peso Específico Natural (kN/m³)", value: results.peso_especifico_natural.toFixed(2) });
    if (results.peso_especifico_seco !== null) resultadosData.push({ label: "Peso Específico Seco (kN/m³)", value: results.peso_especifico_seco.toFixed(2) });
    if (results.peso_especifico_saturado !== null) resultadosData.push({ label: "Peso Específico Saturado (kN/m³)", value: results.peso_especifico_saturado.toFixed(2) });
    if (results.peso_especifico_submerso !== null) resultadosData.push({ label: "Peso Específico Submerso (kN/m³)", value: results.peso_especifico_submerso.toFixed(2) });
    if (results.peso_especifico_solidos !== null) resultadosData.push({ label: "Peso Específico dos Sólidos (kN/m³)", value: results.peso_especifico_solidos.toFixed(2) });
    if (results.Gs !== null) resultadosData.push({ label: "Gs", value: results.Gs.toFixed(3) });
    if (results.indice_vazios !== null) resultadosData.push({ label: "e", value: results.indice_vazios.toFixed(3) });
    if (results.porosidade !== null) resultadosData.push({ label: "n (%)", value: results.porosidade.toFixed(2) });
    if (results.grau_saturacao !== null) resultadosData.push({ label: "Sr (%)", value: results.grau_saturacao.toFixed(2) });
    if (results.umidade !== null) resultadosData.push({ label: "w (%)", value: results.umidade.toFixed(2) });
    if (results.compacidade_relativa !== null) resultadosData.push({ label: "Dr (%)", value: results.compacidade_relativa.toFixed(2) });
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
      toast({
        title: "📊 Excel exportado!",
        description: "Arquivo baixado com sucesso",
      });
    } else {
      toast({
        title: "Erro",
        description: "Não foi possível gerar o Excel",
        variant: "destructive",
      });
    }
  };

  const fmt = (value: number | null, decimals: number = 2) => {
    if (value === null || value === undefined) return "—";
    return formatNumber(value, settings);
  };

  // Validação simples no mobile
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

  return (
    <div className="space-y-4 pb-4">
      {/* Header com Ações */}
      <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-4 rounded-xl border border-primary/20">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
              <Beaker className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-bold text-foreground">Índices Físicos</h2>
              <p className="text-xs text-muted-foreground">Propriedades físicas do solo</p>
            </div>
          </div>
          
          {/* Botões de Ação */}
          <div className="flex gap-2 shrink-0">
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9 active:scale-90 [-webkit-tap-highlight-color:transparent] transition-transform"
              onClick={() => setExamplesSheetOpen(true)}
              aria-label="Ver exemplos de solos"
            >
              <Lightbulb className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9 active:scale-90 [-webkit-tap-highlight-color:transparent] transition-transform"
              onClick={() => setLoadSheetOpen(true)}
              aria-label="Carregar cálculos salvos"
            >
              <FolderOpen className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Erro */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Aviso */}
      {results && results.aviso && (
        <Alert className="bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900">
          <AlertCircle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800 dark:text-amber-200">
            {results.aviso}
          </AlertDescription>
        </Alert>
      )}

      {/* Navegação de Amostras */}
      <div className="bg-gradient-to-br from-primary/5 to-secondary/5 p-3 rounded-xl border">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-semibold">
            Amostra {currentAmostraIndex + 1} de {formData.amostras.length}
          </span>
          
          <div className="flex gap-2">
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
            >
              <Plus className="h-4 w-4" />
            </Button>
            
            {formData.amostras.length > 1 && (
              <Button
                variant="outline"
                size="icon"
                onClick={removeAmostra}
                disabled={isCalculating}
                className="h-8 w-8 text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Dados Básicos da Amostra Atual em 2 colunas */}
      <MobileSection
        title={`Dados da Amostra ${currentAmostraIndex + 1}`}
        icon={<Info className="w-4 h-4" />}
        defaultOpen={true}
      >
        <div className="grid grid-cols-2 gap-3">
          <MobileInputGroup
            label="Massa Úmida"
            value={currentAmostra?.massaUmida || ""}
            onChange={(v) => handleAmostraChange("massaUmida", v)}
            placeholder="Ex: 150.5"
            unit="g"
            required
            tooltip="Massa total da amostra incluindo água"
          />

          <MobileInputGroup
            label="Massa Seca"
            value={currentAmostra?.massaSeca || ""}
            onChange={(v) => handleAmostraChange("massaSeca", v)}
            placeholder="Ex: 130.2"
            unit="g"
            required
            tooltip="Massa após secagem em estufa"
          />
        </div>

        <MobileInputGroup
          label="Volume Total"
          value={currentAmostra?.volume || ""}
          onChange={(v) => handleAmostraChange("volume", v)}
          placeholder="Ex: 100.0"
          unit="cm³"
          required
          tooltip="Volume total incluindo vazios"
        />

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium flex items-center gap-2 after:content-['*'] after:text-destructive after:ml-0.5">
              Densidade dos Grãos (Gs)
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="w-6 h-6 rounded-full bg-muted/50 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none [-webkit-tap-highlight-color:transparent] active:scale-95"
                >
                  <Info className="w-3.5 h-3.5" />
                </button>
              </PopoverTrigger>
              <PopoverContent side="left" className="max-w-xs" align="end">
                <p className="text-xs">Densidade dos grãos sólidos. Use sugestões ao lado</p>
              </PopoverContent>
            </Popover>
          </div>
          <div className="relative">
            <Input
              type="number"
              value={formData.Gs}
              onChange={(e) => handleInputChange("Gs", e.target.value)}
              placeholder="Ex: 2.65"
              className="h-12 text-base pr-12"
              inputMode="decimal"
            />
            <button
              type="button"
              onClick={() => setGsSheetOpen(true)}
              className="absolute right-1 top-1/2 -translate-y-1/2 w-10 h-10 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors focus-visible:outline-none [-webkit-tap-highlight-color:transparent] active:scale-95"
            >
              <Info className="h-4 w-4" />
            </button>
          </div>
        </div>
      </MobileSection>

      {/* Parâmetros Adicionais */}
      <MobileSection
        title="Parâmetros Adicionais"
        icon={<BarChart3 className="w-4 h-4" />}
        defaultOpen={false}
        collapsible
      >
        <div className="space-y-4">

          <div className="space-y-2">
            <Label className="text-sm font-medium">γw (Peso Específico da Água)</Label>
            <Select value={formData.pesoEspecificoAgua} onValueChange={(value) => handleInputChange("pesoEspecificoAgua", value)}>
              <SelectTrigger className="bg-background/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="9.81">9.81 kN/m³ (exato)</SelectItem>
                <SelectItem value="10.0">10.0 kN/m³ (aproximado)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <MobileInputGroup
              label="emax (Vazios Máx.)"
              value={formData.indice_vazios_max}
              onChange={(v) => handleInputChange("indice_vazios_max", v)}
              placeholder="Ex: 0.85"
              tooltip="Opcional. Para calcular Dr em solos granulares"
            />

            <MobileInputGroup
              label="emin (Vazios Mín.)"
              value={formData.indice_vazios_min}
              onChange={(v) => handleInputChange("indice_vazios_min", v)}
              placeholder="Ex: 0.45"
              tooltip="Opcional. Para calcular Dr em solos granulares"
            />
          </div>
        </div>
      </MobileSection>

      {/* Botões de Cálculo */}
      <div className="flex gap-3">
        <Button
          onClick={handleCalculate}
          disabled={!isFormValid || isCalculating}
          className="h-12 font-semibold flex-[2] focus-visible:ring-0 focus-visible:ring-offset-0 [-webkit-tap-highlight-color:transparent] active:scale-95 transition-transform"
          size="lg"
          aria-label={isCalculating ? "Calculando índices físicos" : "Calcular índices físicos"}
        >
          <Calculator className="w-4 h-4 mr-2" />
          {isCalculating ? "Calculando..." : "Calcular"}
        </Button>
        
        <Button
          onClick={handleClear}
          variant="outline"
          className="h-12 flex-1 focus-visible:ring-0 focus-visible:ring-offset-0 [-webkit-tap-highlight-color:transparent] active:scale-95 transition-transform"
          size="lg"
          aria-label="Limpar todos os campos"
        >
          Limpar
        </Button>
      </div>

      {/* Ações de Exportação */}
      {results && !results.erro && (
        <div className="flex gap-2">
          <Button
            onClick={handleSaveClick}
            variant="outline"
            size="sm"
            className="flex-1 h-10 focus-visible:ring-0 focus-visible:ring-offset-0 [-webkit-tap-highlight-color:transparent] active:scale-95 transition-transform"
            aria-label="Salvar cálculo atual"
          >
            <Save className="w-4 h-4 mr-2" />
            Salvar
          </Button>
          <Button
            onClick={handleExportPDF}
            variant="outline"
            size="sm"
            className="flex-1 h-10 focus-visible:ring-0 focus-visible:ring-offset-0 [-webkit-tap-highlight-color:transparent] active:scale-95 transition-transform"
            aria-label="Exportar resultados em PDF"
          >
            <FileText className="w-4 h-4 mr-2" />
            PDF
          </Button>
          <Button
            onClick={handleExportExcel}
            variant="outline"
            size="sm"
            className="flex-1 h-10 focus-visible:ring-0 focus-visible:ring-offset-0 [-webkit-tap-highlight-color:transparent] active:scale-95 transition-transform"
            aria-label="Exportar resultados em Excel"
          >
            <Download className="w-4 h-4 mr-2" />
            Excel
          </Button>
        </div>
      )}

      {/* Resultados */}
      {results && !results.erro && (
        <MobileTabs
          tabs={[
            {
              id: "principais",
              label: "Principais",
              icon: <BarChart3 className="w-4 h-4" />,
              content: (
                <div className="space-y-3">
                  {/* Pesos Específicos */}
                  <div className="bg-card/50 backdrop-blur-sm rounded-xl border border-border/50 p-4 space-y-3">
                    <h3 className="font-semibold text-sm flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-primary" />
                      Pesos Específicos
                    </h3>
                    <ResultItem label="Natural (γn)" value={results.peso_especifico_natural} unit="kN/m³" infoKey="peso_especifico_natural" settings={settings} />
                    <ResultItem label="Seco (γd)" value={results.peso_especifico_seco} unit="kN/m³" infoKey="peso_especifico_seco" settings={settings} />
                    <ResultItem label="Saturado (γsat)" value={results.peso_especifico_saturado} unit="kN/m³" infoKey="peso_especifico_saturado" settings={settings} />
                    <ResultItem label="Submerso (γsub)" value={results.peso_especifico_submerso} unit="kN/m³" infoKey="peso_especifico_submerso" settings={settings} />
                    <ResultItem label="Sólidos (γs)" value={results.peso_especifico_solidos} unit="kN/m³" infoKey="peso_especifico_solidos" settings={settings} />
                  </div>

                  {/* Índices */}
                  <div className="bg-card/50 backdrop-blur-sm rounded-xl border border-border/50 p-4 space-y-3">
                    <h3 className="font-semibold text-sm flex items-center gap-2">
                      <Info className="w-4 h-4" />
                      Índices e Relações
                    </h3>
                    <ResultItem label="Densidade Gs" value={results.Gs} unit="" infoKey="Gs" settings={settings} />
                    <ResultItem label="Índice Vazios (e)" value={results.indice_vazios} unit="" infoKey="indice_vazios" settings={settings} />
                    <ResultItem label="Porosidade (n)" value={results.porosidade} unit="%" infoKey="porosidade" settings={settings} />
                    <ResultItem label="Saturação (Sr)" value={results.grau_saturacao} unit="%" infoKey="grau_saturacao" settings={settings} />
                    <ResultItem label="Umidade (w)" value={results.umidade} unit="%" infoKey="umidade" settings={settings} />
                  </div>

                  {/* Compacidade Relativa */}
                  {results.compacidade_relativa !== null && (
                    <div className="bg-card/50 backdrop-blur-sm rounded-xl border border-border/50 p-4 space-y-3">
                      <h3 className="font-semibold text-sm flex items-center gap-2">
                        <BarChart3 className="w-4 h-4 text-primary" />
                        Compacidade Relativa
                      </h3>
                      <ResultItem label="Dr" value={results.compacidade_relativa} unit="%" infoKey="compacidade_relativa" settings={settings} />
                      {results.classificacao_compacidade && (
                        <div className="flex items-center justify-between p-3 rounded-lg bg-primary/10 border border-primary/20">
                          <span className="text-sm font-medium">Classificação</span>
                          <span className="text-sm font-bold text-primary">{results.classificacao_compacidade}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ),
            },
            {
              id: "diagrama",
              label: "Diagrama",
              icon: <BarChart3 className="w-4 h-4" />,
              content: (
                <div className="bg-card/50 rounded-xl border border-border/50 p-4">
                  <h4 className="font-semibold mb-4 text-center">Diagrama de Fases</h4>
                  <div className="flex justify-center">
                    {results.volume_solidos_norm !== null && results.volume_agua_norm !== null && results.volume_ar_norm !== null ? (
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
                    ) : (
                      <p className="text-muted-foreground text-center text-sm">
                        Dados insuficientes para gerar diagrama
                      </p>
                    )}
                  </div>
                </div>
              ),
            },
          ]}
        />
      )}

      {/* Sheet de Exemplos */}
      <Sheet open={examplesSheetOpen} onOpenChange={setExamplesSheetOpen}>
        <SheetContent side="bottom" className="h-[70vh] rounded-t-2xl">
          <SheetHeader>
            <SheetTitle>Exemplos de Solos</SheetTitle>
          </SheetHeader>
          <div className="mt-6 space-y-3 overflow-y-auto max-h-[calc(70vh-100px)]">
            {soilExamples.map((example, idx) => (
              <button
                key={idx}
                onClick={() => handleLoadExample(example)}
                className="w-full p-4 rounded-xl bg-secondary/50 hover:bg-secondary border-2 border-transparent hover:border-primary/20 transition-all active:scale-95 text-left focus-visible:outline-none [-webkit-tap-highlight-color:transparent]"
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{example.icon}</span>
                  <div className="flex-1">
                    <h4 className="font-semibold text-foreground">{example.name}</h4>
                    <p className="text-sm text-muted-foreground mt-1">{example.description}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </SheetContent>
      </Sheet>

      {/* Sheet de Sugestões de Gs */}
      <Sheet open={gsSheetOpen} onOpenChange={setGsSheetOpen}>
        <SheetContent side="bottom" className="h-[50vh] rounded-t-2xl">
          <SheetHeader>
            <SheetTitle>Sugestões de Gs por Tipo de Solo</SheetTitle>
          </SheetHeader>
          <div className="mt-6 space-y-3">
            {gsSuggestions.map((item, idx) => (
              <button
                key={idx}
                onClick={() => handleSelectGs(item.value)}
                className="w-full p-4 rounded-xl bg-secondary/50 hover:bg-secondary border-2 border-transparent hover:border-primary/20 transition-all active:scale-95 flex items-center justify-between focus-visible:outline-none [-webkit-tap-highlight-color:transparent]"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{item.icon}</span>
                  <span className="font-medium">{item.type}</span>
                </div>
                <span className="text-lg font-bold text-primary">{item.value}</span>
              </button>
            ))}
          </div>
        </SheetContent>
      </Sheet>

      {/* Sheet de Cálculos Salvos */}
      <Sheet open={loadSheetOpen} onOpenChange={setLoadSheetOpen}>
        <SheetContent side="bottom" className="h-[70vh] rounded-t-2xl">
          <SheetHeader>
            <SheetTitle>Cálculos Salvos</SheetTitle>
          </SheetHeader>
          <div className="mt-6 space-y-3 overflow-y-auto max-h-[calc(70vh-100px)]">
            {calculations.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <FolderOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Nenhum cálculo salvo ainda</p>
              </div>
            ) : (
              calculations.map((calc) => (
                <div
                  key={calc.id}
                  className="p-4 rounded-xl bg-secondary/50 border border-border/50"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-sm">{calc.name}</h4>
                    <span className="text-xs text-muted-foreground">
                      {new Date(calc.timestamp).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 h-9 focus-visible:ring-0 focus-visible:ring-offset-0 [-webkit-tap-highlight-color:transparent] active:scale-95 transition-transform"
                      onClick={() => handleLoadCalculation(calc)}
                    >
                      Carregar
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      className="h-9 focus-visible:ring-0 focus-visible:ring-offset-0 [-webkit-tap-highlight-color:transparent] active:scale-95 transition-transform"
                      onClick={() => {
                        deleteCalculation(calc.id);
                        toast({ title: "🗑️ Excluído", description: "Cálculo removido" });
                      }}
                    >
                      Excluir
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Dialog de Salvar */}
      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Salvar Cálculo</DialogTitle>
            <DialogDescription>
              Dê um nome para este cálculo
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
              placeholder="Ex: Análise Solo - Obra X"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleConfirmSave();
              }}
            />
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

      {/* Dialog de Exportar PDF */}
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
    </div>
  );
}

// Componente de Item de Resultado
interface ResultItemProps {
  label: string;
  value: number | string | null;
  unit: string;
  infoKey: keyof typeof conteudoIndicesFisicos;
  settings: any;
}

function ResultItem({ label, value, unit, infoKey, settings }: ResultItemProps) {
  const content = conteudoIndicesFisicos[infoKey];
  const displayValue = typeof value === 'number' ? formatNumber(value, settings) : value ?? "—";

  if (value === null && typeof value !== 'string') return null;

  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-background/50 border border-border/50">
      <div className="flex items-center gap-1.5">
        <span className="text-sm font-medium text-muted-foreground">{label}</span>
        {settings.showEducationalTips && content && (
          <Popover>
            <PopoverTrigger asChild>
              <button className="h-5 w-5 rounded-full hover:bg-muted flex items-center justify-center focus-visible:outline-none [-webkit-tap-highlight-color:transparent]">
                <Info className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-80" side="top">
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">{label}</h4>
                {settings.showFormulas && content?.formula && (
                  <div className="text-xs font-mono bg-muted p-2 rounded border">{content.formula}</div>
                )}
                <p className="text-xs text-muted-foreground">{content?.descricao}</p>
                {content?.valoresTipicos && (
                  <p className="text-xs text-muted-foreground italic">
                    <strong>Típicos:</strong> {content.valoresTipicos}
                  </p>
                )}
              </div>
            </PopoverContent>
          </Popover>
        )}
      </div>
      <span className="text-sm font-bold text-primary">{displayValue} {unit}</span>
    </div>
  );
}
