import { useState, useEffect } from "react";
import { Database, Filter, Info, Calculator as CalcIcon, Plus, Trash2, Table as TableIcon, TrendingUp, GraduationCap, Activity, BarChart3, Columns, PanelTop } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { calcularGranulometria } from "@/lib/calculations/granulometria";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/sonner";
import { useSavedCalculations } from "@/hooks/use-saved-calculations";
import { useSettings } from "@/hooks/use-settings";
import { useTheme } from "@/hooks/use-theme";
import { useRecentReports } from "@/hooks/useRecentReports";

import SavedCalculations from "@/components/SavedCalculations";

import SaveDialog from "@/components/SaveDialog";
import ExportPDFDialog from "@/components/ExportPDFDialog";
import PrintHeader from "@/components/PrintHeader";
import CalculationActions from "@/components/CalculationActions";
import { exportToPDF, exportToExcel, ExportData, ExcelExportData, formatNumberForExport, captureChartAsImage, generateDefaultPDFFileName } from "@/lib/export-utils";
import { prepareReportForStorage } from "@/lib/reportManager";
import TabelaDadosGranulometricos from "@/components/granulometria/TabelaDadosGranulometricos";
import CurvaGranulometrica from "@/components/granulometria/CurvaGranulometrica";
import DialogExemplos from "@/components/granulometria/DialogExemplos";
import PlasticityChart from "@/components/visualizations/PlasticityChart";
import { ExemploGranulometria } from "@/lib/exemplos-granulometria";
import { MobileModuleWrapper } from "@/components/mobile";
import GranulometriaMobile from "./mobile/GranulometriaMobile";
import type { GranulometriaOutput, PontoGranulometrico } from "@/modules/granulometria/schemas";
import { useGranulometriaStore, PeneiraDado, PeneiramentoGrossoData, PeneiramentoFinoData } from "@/modules/granulometria/store";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { RefreshCw, Save } from "lucide-react";

// Cálculos agora são feitos localmente no frontend

// Interfaces importadas de store.ts
// Cálculos agora são feitos localmente no frontend

// Interface alinhada com o backend (GranulometriaOutput)
// PontoGranulometrico e GranulometriaOutput importados de schemas.ts

const tooltips = {
  massaTotal: "Massa total da amostra seca utilizada no ensaio (NBR 7181)",
  abertura: "Abertura nominal da peneira em mm (série normal: 50, 38, 25, 19, 9.5, 4.8, 2.0, 1.2, 0.6, 0.42, 0.25, 0.15, 0.075)",
  massaRetida: "Massa de solo retida nesta peneira após peneiramento",
  d10: "Diâmetro efetivo - 10% do material passa por esta abertura",
  d30: "Diâmetro correspondente a 30% passante",
  d60: "Diâmetro correspondente a 60% passante",
  cu: "Coeficiente de Uniformidade: Cu = D60/D10 (bem graduado se Cu > 4 para areias, Cu > 6 para pedregulhos)",
  cc: "Coeficiente de Curvatura: Cc = (D30)²/(D10×D60) (bem graduado se 1 < Cc < 3)",
};

// Peneiras comuns (valores ABNT NBR 7181)
const peneirasComuns = [
  { nome: '2"', abertura: 50.0 },
  { nome: '1 1/2"', abertura: 38.0 },
  { nome: '1"', abertura: 25.0 },
  { nome: '3/4"', abertura: 19.0 },
  { nome: '3/8"', abertura: 9.5 },
  { nome: 'Nº 4', abertura: 4.8 },
  { nome: 'Nº 10', abertura: 2.0 },
  { nome: 'Nº 16', abertura: 1.2 },
  { nome: 'Nº 30', abertura: 0.6 },
  { nome: 'Nº 40', abertura: 0.42 },
  { nome: 'Nº 60', abertura: 0.25 },
  { nome: 'Nº 100', abertura: 0.15 },
  { nome: 'Nº 200', abertura: 0.075 },
];

function GranulometriaDesktop() {
  const { settings } = useSettings();
  const { theme } = useTheme();
  const { addReport } = useRecentReports();
  const navigate = useNavigate();

  // Zustand Store
  const {
    formData,
    updateFormData,
    updatePeneiraGrosso,
    updatePeneiraFino,
    updateGrossoData,
    updateFinoData,
    resetForm
  } = useGranulometriaStore();

  const [results, setResults] = useState<GranulometriaOutput | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [layoutMode, setLayoutMode] = useState<'default' | 'side-by-side'>(() => {
    const saved = localStorage.getItem('granulometriaLayoutMode');
    return (saved === 'side-by-side') ? 'side-by-side' : 'default';
  });

  useEffect(() => {
    localStorage.setItem('granulometriaLayoutMode', layoutMode);
  }, [layoutMode]);

  // Estados para salvamento
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [saveName, setSaveName] = useState("");
  const [loadDialogOpen, setLoadDialogOpen] = useState(false);
  const { calculations, saveCalculation, deleteCalculation, renameCalculation } = useSavedCalculations("granulometria");

  // Estados para exportação PDF
  const [exportPDFDialogOpen, setExportPDFDialogOpen] = useState(false);
  const [pdfFileName, setPdfFileName] = useState("");
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("resultados");
  const [pdfSavedDialogOpen, setPdfSavedDialogOpen] = useState(false);
  const [exemplosOpen, setExemplosOpen] = useState(false);
  const [printDialogOpen, setPrintDialogOpen] = useState(false);


  // Restaurar dados quando vier de "Gerar" em Relatórios
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem('granulometria_lastData');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.formData) updateFormData(parsed.formData);
        if (parsed?.results) setResults(parsed.results);
        sessionStorage.removeItem('granulometria_lastData');
        toast.success("Dados do relatório carregados!");
      }
    } catch (error) {
      console.error('Erro ao restaurar dados do relatório:', error);
    }
  }, []);

  // Funções de atualização do store (substituindo setState local)
  const handleInputChange = (field: keyof typeof formData, value: string) => {
    updateFormData({ [field]: value });
  };

  const handlePeneiraChange = (index: number, field: keyof PeneiraDado, value: string, tipo: 'grosso' | 'fino') => {
    if (tipo === 'grosso') {
      updatePeneiraGrosso(index, { [field]: value });
    } else {
      updatePeneiraFino(index, { [field]: value });
    }
  };

  const handleMassaChange = (tipo: 'grosso' | 'fino', field: 'massa_total_umida' | 'massa_total_seca' | 'teor_umidade', value: string) => {
    if (tipo === 'grosso') {
      const currentData = { ...formData.peneiramento_grosso, [field]: value };

      // Auto-cálculo
      if (field === 'massa_total_umida' || field === 'massa_total_seca') {
        if (currentData.massa_total_umida && currentData.massa_total_seca) {
          const umida = parseFloat(currentData.massa_total_umida);
          const seca = parseFloat(currentData.massa_total_seca);
          if (!isNaN(umida) && !isNaN(seca) && seca > 0) {
            currentData.teor_umidade = ((umida - seca) / seca * 100).toFixed(2);
          }
        }
      } else if (field === 'teor_umidade' && currentData.massa_total_umida) {
        const umida = parseFloat(currentData.massa_total_umida);
        const teor = parseFloat(value);
        if (!isNaN(umida) && !isNaN(teor)) {
          currentData.massa_total_seca = (umida / (1 + teor / 100)).toFixed(2);
        }
      }
      updateGrossoData(currentData);
    } else {
      const currentData = { ...formData.peneiramento_fino, [field]: value };

      // Auto-cálculo
      if (field === 'massa_total_umida' || field === 'massa_total_seca') {
        if (currentData.massa_total_umida && currentData.massa_total_seca) {
          const umida = parseFloat(currentData.massa_total_umida);
          const seca = parseFloat(currentData.massa_total_seca);
          if (!isNaN(umida) && !isNaN(seca) && seca > 0) {
            currentData.teor_umidade = ((umida - seca) / seca * 100).toFixed(2);
          }
        }
      } else if (field === 'teor_umidade' && currentData.massa_total_umida) {
        const umida = parseFloat(currentData.massa_total_umida);
        const teor = parseFloat(value);
        if (!isNaN(umida) && !isNaN(teor)) {
          currentData.massa_total_seca = (umida / (1 + teor / 100)).toFixed(2);
        }
      }
      updateFinoData(currentData);
    }
  };

  const handleCalculate = async () => {
    // Validação silenciosa para cálculo automático
    if (!formData.peneiramento_grosso.massa_total_seca) {
      return;
    }

    // Preencher peneiras vazias com "0" antes de calcular
    const peneirasGrossoAtualizadas = formData.peneiramento_grosso.peneiras.map(p => ({
      ...p,
      massaRetida: p.massaRetida || "0"
    }));

    const peneirasFinoAtualizadas = formData.peneiramento_fino.peneiras.map(p => ({
      ...p,
      massaRetida: p.massaRetida || "0"
    }));

    // Não atualizar UI durante cálculo automático para evitar loop infinito
    // updateGrossoData e updateFinoData removidos

    const peneirasValidas = peneirasGrossoAtualizadas.filter((p) => p.abertura && p.massaRetida);
    if (peneirasValidas.length === 0) {
      return;
    }

    setIsCalculating(true);

    try {
      // Preparar payload para a API
      const payload = {
        peneiramento_grosso: {
          massa_total_umida: parseFloat(formData.peneiramento_grosso.massa_total_umida) || 0,
          massa_total_seca: parseFloat(formData.peneiramento_grosso.massa_total_seca),
          teor_umidade: formData.peneiramento_grosso.teor_umidade ? parseFloat(formData.peneiramento_grosso.teor_umidade) : undefined,
          massa_graos: parseFloat(formData.peneiramento_grosso.massa_graos) || 0,
          peneiras: peneirasGrossoAtualizadas.map((p) => ({
            abertura: parseFloat(p.abertura),
            massa_retida: parseFloat(p.massaRetida),
            peneira: p.peneira,
          })),
        },
        peneiramento_fino: {
          massa_total_umida: parseFloat(formData.peneiramento_fino.massa_total_umida) || 0,
          massa_total_seca: parseFloat(formData.peneiramento_fino.massa_total_seca),
          teor_umidade: formData.peneiramento_fino.teor_umidade ? parseFloat(formData.peneiramento_fino.teor_umidade) : undefined,
          peneiras: peneirasFinoAtualizadas.map((p) => ({
            abertura: parseFloat(p.abertura),
            massa_retida: parseFloat(p.massaRetida),
            peneira: p.peneira,
          })),
        },
        ll: formData.limitePercent ? parseFloat(formData.limitePercent) : undefined,
        lp: formData.limitePlasticidade ? parseFloat(formData.limitePlasticidade) : undefined,
      };

      // Calcular localmente no frontend
      const resultado = calcularGranulometria(payload);

      if (resultado.erro) {
        // Silencioso para cálculo automático
      } else {
        setResults(resultado);
      }
    } catch (error) {
      // Silencioso para cálculo automático
      setResults(null);
    } finally {
      setIsCalculating(false);
    }
  };

  // Auto-calculate with instant update (0ms debounce)
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      handleCalculate();
    }, 0);

    return () => clearTimeout(debounceTimer);
  }, [formData]);

  const handleClear = () => {
    resetForm();
    setResults(null);
  };

  // Navegação por setas do teclado entre TODOS os inputs do formulário
  const handleKeyNavigation = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const arrowKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];
    if (!arrowKeys.includes(e.key)) return;

    const target = e.target as HTMLElement;
    if (target.tagName !== 'INPUT') return;

    e.preventDefault();

    // Buscar TODOS os inputs numéricos no formulário
    const container = e.currentTarget;
    const inputs = Array.from(container.querySelectorAll('input[type="number"]')) as HTMLInputElement[];
    const currentIndex = inputs.indexOf(target as HTMLInputElement);

    if (currentIndex === -1) return;

    let nextIndex = currentIndex;

    // Navegação simples: esquerda/direita = anterior/próximo, cima/baixo = pular 2
    switch (e.key) {
      case 'ArrowUp':
        nextIndex = currentIndex - 2;
        break;
      case 'ArrowDown':
        nextIndex = currentIndex + 2;
        break;
      case 'ArrowLeft':
        nextIndex = currentIndex - 1;
        break;
      case 'ArrowRight':
        nextIndex = currentIndex + 1;
        break;
    }

    // Verificar limites e navegar
    if (nextIndex >= 0 && nextIndex < inputs.length) {
      inputs[nextIndex].focus();
      inputs[nextIndex].select();
    }
  };

  // Funções de salvamento e exportação
  const handleSaveClick = () => {
    if (!results) return;
    setSaveName(`Cálculo ${new Date().toLocaleDateString('pt-BR')} `);
    setSaveDialogOpen(true);
  };

  const handleConfirmSave = () => {
    if (!results || !saveName.trim()) return;
    const success = saveCalculation(saveName.trim(), formData, results);
    if (success) {
      toast.success("Cálculo salvo!", { description: "A análise foi salva e pode ser carregada posteriormente." });
      setSaveDialogOpen(false);
      setSaveName("");
    } else {
      toast.error("Erro ao salvar", { description: "Não foi possível salvar a análise granulométrica." });
    }
  };

  const handleLoadCalculation = (calculation: any) => {
    updateFormData(calculation.formData);
    setResults(calculation.results);
    toast.success("Cálculo carregado!", { description: `"${calculation.name}" foi restaurado com sucesso.` });
  };

  const handleCarregarExemplo = (exemplo: ExemploGranulometria) => {
    // Verificar se o exemplo usa a nova estrutura (com peneiramento_grosso/fino separados)
    if (exemplo.peneiramento_grosso && exemplo.peneiramento_fino) {
      // NOVA ESTRUTURA: Usar dados diretamente

      // Formatar peneiras grossas
      const peneirasGrossas: PeneiraDado[] = exemplo.peneiramento_grosso.peneiras.map(p => ({
        abertura: p.aberturaMM.toString(),
        massaRetida: p.massaRetida.toString(),
        peneira: p.numero
      }));

      // Formatar peneiras finas
      const peneirasFinas: PeneiraDado[] = exemplo.peneiramento_fino.peneiras.map(p => ({
        abertura: p.aberturaMM.toString(),
        massaRetida: p.massaRetida.toString(),
        peneira: p.numero
      }));

      // Calcular massa de grãos (retida no grosso)
      const massaGraos = peneirasGrossas.reduce((sum, p) => sum + parseFloat(p.massaRetida || "0"), 0);

      // Calcular teor de umidade do grosso
      const teorUmidadeGrosso = exemplo.peneiramento_grosso.massa_seca > 0
        ? ((exemplo.peneiramento_grosso.massa_umida - exemplo.peneiramento_grosso.massa_seca) / exemplo.peneiramento_grosso.massa_seca * 100).toFixed(2)
        : "0.00";

      // Calcular teor de umidade do fino
      const teorUmidadeFino = exemplo.peneiramento_fino.massa_seca > 0
        ? ((exemplo.peneiramento_fino.massa_umida - exemplo.peneiramento_fino.massa_seca) / exemplo.peneiramento_fino.massa_seca * 100).toFixed(2)
        : "0.00";

      // Atualizar Grosso com dados completos
      updateGrossoData({
        massa_total_umida: exemplo.peneiramento_grosso.massa_umida.toString(),
        massa_total_seca: exemplo.peneiramento_grosso.massa_seca.toString(),
        teor_umidade: teorUmidadeGrosso,
        massa_graos: massaGraos.toString(),
        peneiras: peneirasGrossas.length > 0 ? peneirasGrossas : [{ abertura: "", massaRetida: "" }]
      });

      // Atualizar Fino com dados completos
      updateFinoData({
        massa_total_umida: exemplo.peneiramento_fino.massa_umida.toString(),
        massa_total_seca: exemplo.peneiramento_fino.massa_seca.toString(),
        teor_umidade: teorUmidadeFino,
        peneiras: peneirasFinas.length > 0 ? peneirasFinas : [{ abertura: "", massaRetida: "" }]
      });
    } else {
      // ESTRUTURA ANTIGA: Separar automaticamente
      const peneirasFormatadas: PeneiraDado[] = exemplo.peneiras.map(p => ({
        abertura: p.aberturaMM.toString(),
        massaRetida: p.massaRetida.toString()
      }));

      // Separar peneiras grossas (até #10 = 2.0mm) e finas (abaixo de 2.0mm)
      const peneirasGrossas = peneirasFormatadas.filter(p => parseFloat(p.abertura) >= 2.0);
      const peneirasFinas = peneirasFormatadas.filter(p => parseFloat(p.abertura) < 2.0);

      // Calcular massa de grãos (retida até #10)
      const massaGraos = peneirasGrossas.reduce((sum, p) => sum + parseFloat(p.massaRetida), 0);

      // Calcular massa fina (passa na #10)
      const massaFina = exemplo.massaTotal - massaGraos;

      // Atualizar Grosso
      updateGrossoData({
        massa_total_umida: exemplo.massaTotal.toString(),
        massa_total_seca: exemplo.massaTotal.toString(),
        teor_umidade: "0.00",
        massa_graos: massaGraos.toString(),
        peneiras: peneirasGrossas.length > 0 ? peneirasGrossas : [{ abertura: "", massaRetida: "" }]
      });

      // Atualizar Fino
      updateFinoData({
        massa_total_umida: massaFina.toString(),
        massa_total_seca: massaFina.toString(),
        teor_umidade: "0.00",
        peneiras: peneirasFinas.length > 0 ? peneirasFinas : [{ abertura: "", massaRetida: "" }]
      });
    }

    // Atualizar Limites
    updateFormData({
      limitePercent: exemplo.ll?.toString() || "",
      limitePlasticidade: exemplo.lp?.toString() || "",
    });

    // Limpar resultados anteriores
    setResults(null);

    toast.success("Exemplo carregado!", { description: `Dados de "${exemplo.nome}" foram preenchidos automaticamente.` });
  };


  const handleExportPDF = () => {
    if (!results) return;

    // Gerar nome padrão usando a função auxiliar
    const defaultName = generateDefaultPDFFileName("Granulometria e Classificação");

    setPdfFileName(defaultName);
    setExportPDFDialogOpen(true);
  };

  const handleConfirmExportPDF = async () => {
    if (!results) return;

    setIsExportingPDF(true);

    // Capturar imagem do gráfico ampliado em alta qualidade
    toast.info("Capturando gráfico em alta qualidade...");
    const chartImage = await captureChartAsImage('curva-granulometrica-ampliada');

    if (!chartImage) {
      console.warn("Gráfico não foi capturado corretamente");
      toast.warning("Gráfico não incluído no PDF");
    } else {
      console.log("Gráfico capturado com sucesso");
    }

    // Dados de entrada como valores simples
    const inputs: { label: string; value: string }[] = [
      { label: "Massa Total Seca", value: `${formData.peneiramento_grosso.massa_total_seca} g` },
    ];
    if (formData.peneiramento_grosso.massa_total_umida) {
      inputs.push({ label: "Massa Total Úmida", value: `${formData.peneiramento_grosso.massa_total_umida} g` });
    }
    if (formData.peneiramento_grosso.teor_umidade) {
      inputs.push({ label: "Teor de Umidade", value: `${formData.peneiramento_grosso.teor_umidade}% ` });
    }
    if (formData.peneiramento_grosso.massa_graos) {
      inputs.push({ label: "Massa dos Grãos", value: `${formData.peneiramento_grosso.massa_graos} g` });
    }
    if (formData.peneiramento_fino?.massa_total_seca) {
      inputs.push({ label: "Massa Fina Seca", value: `${formData.peneiramento_fino.massa_total_seca} g` });
    }
    if (formData.limitePercent) inputs.push({ label: "Limite de Liquidez (LL)", value: `${formData.limitePercent}% ` });
    if (formData.limitePlasticidade) inputs.push({ label: "Limite de Plasticidade (LP)", value: `${formData.limitePlasticidade}% ` });

    // Lista vazia de resultados (vamos usar tabelas ao invés)
    const resultsList: { label: string; value: string; highlight?: boolean }[] = [];

    // Preparar todas as tabelas
    const tables = [];

    // TABELA 1: Dados de Entrada - Peneiras Grossas
    const peneirasHeaders = ["Peneira", "Abertura (mm)", "Massa Retida (g)"];
    const peneirasRows = formData.peneiramento_grosso.peneiras
      .filter(p => p.abertura && p.massaRetida)
      .map((p, i) => [
        `#${i + 1} `,
        p.abertura,
        p.massaRetida
      ]);

    if (peneirasRows.length > 0) {
      tables.push({
        title: "Dados de Entrada - Peneiras Grossas",
        headers: peneirasHeaders,
        rows: peneirasRows
      });
    }

    // TABELA 2: Dados de Entrada - Peneiras Finas
    if (formData.peneiramento_fino && formData.peneiramento_fino.peneiras.length > 0) {
      const peneirasFinasRows = formData.peneiramento_fino.peneiras
        .filter(p => p.abertura && p.massaRetida)
        .map((p, i) => [
          `#${i + 1} `,
          p.abertura,
          p.massaRetida
        ]);

      if (peneirasFinasRows.length > 0) {
        tables.push({
          title: "Dados de Entrada - Peneiras Finas",
          headers: peneirasHeaders,
          rows: peneirasFinasRows
        });
      }
    }

    // TABELA 2: Classificações
    if (results.classificacao_uscs || results.classificacao_hrb) {
      const classificacoesHeaders = ["Sistema", "Classificação", "Descrição"];
      const classificacoesRows = [];

      if (results.classificacao_uscs) {
        classificacoesRows.push([
          "USCS",
          results.classificacao_uscs,
          results.descricao_uscs || "-"
        ]);
      }

      if (results.classificacao_hrb) {
        const hrb = results.classificacao_hrb +
          (results.indice_grupo_hrb !== undefined && results.indice_grupo_hrb > 0 ? ` (IG: ${results.indice_grupo_hrb})` : '');
        classificacoesRows.push([
          "HRB/AASHTO",
          hrb,
          results.descricao_hrb || "-"
        ]);
      }

      tables.push({
        title: "Classificação do Solo",
        headers: classificacoesHeaders,
        rows: classificacoesRows
      });
    }

    // TABELA 3: Composição Granulométrica
    if (results.percentagem_pedregulho !== undefined || results.percentagem_areia !== undefined || results.percentagem_finos !== undefined) {
      const composicaoHeaders = ["Fração", "Faixa de Tamanho", "Percentual (%)"];
      const composicaoRows = [];

      if (results.percentagem_pedregulho !== undefined) {
        composicaoRows.push(["Pedregulho", "> 2.0 mm", formatNumberForExport(results.percentagem_pedregulho, 1)]);
      }
      if (results.percentagem_areia !== undefined) {
        composicaoRows.push(["Areia", "0.075 - 2.0 mm", formatNumberForExport(results.percentagem_areia, 1)]);
      }
      if (results.percentagem_finos !== undefined) {
        composicaoRows.push(["Finos (Silte + Argila)", "< 0.075 mm", formatNumberForExport(results.percentagem_finos, 1)]);
      }

      tables.push({
        title: "Composição Granulométrica",
        headers: composicaoHeaders,
        rows: composicaoRows
      });
    }

    // TABELA 4: Diâmetros Característicos e Coeficientes
    if (results.d10 || results.d30 || results.d60 || results.coef_uniformidade || results.coef_curvatura) {
      const diametrosHeaders = ["Parâmetro", "Valor", "Unidade"];
      const diametrosRows = [];

      if (results.d10) diametrosRows.push(["D10 (Diâmetro Efetivo)", formatNumberForExport(results.d10, 4), "mm"]);
      if (results.d30) diametrosRows.push(["D30", formatNumberForExport(results.d30, 4), "mm"]);
      if (results.d60) diametrosRows.push(["D60", formatNumberForExport(results.d60, 4), "mm"]);
      if (results.coef_uniformidade) diametrosRows.push(["Cu (Coef. Uniformidade)", formatNumberForExport(results.coef_uniformidade, 2), "-"]);
      if (results.coef_curvatura) diametrosRows.push(["Cc (Coef. Curvatura)", formatNumberForExport(results.coef_curvatura, 2), "-"]);

      tables.push({
        title: "Diâmetros Característicos e Coeficientes",
        headers: diametrosHeaders,
        rows: diametrosRows
      });
    }

    // TABELA 5: Dados Granulométricos Completos
    const tableHeaders = ["Peneira", "Abertura (mm)", "Massa Retida (g)", "% Retida", "% Retida Ac.", "% Passante"];
    const tableRows = results.dados_granulometricos.map(d => [
      d.peneira || '-',
      d.abertura.toFixed(3),
      d.massa_retida.toFixed(2),
      d.porc_retida.toFixed(2),
      d.porc_retida_acum.toFixed(2),
      d.porc_passante.toFixed(2)
    ]);

    tables.push({
      title: "Dados Granulométricos Completos",
      headers: tableHeaders,
      rows: tableRows
    });

    // Fórmulas utilizadas
    const formulas = [
      {
        label: "Percentual Retido",
        formula: "% Retida = (Massa Retida / Massa Total) × 100",
        description: "Percentual da massa retida em cada peneira em relação à massa total"
      },
      {
        label: "Percentual Retido Acumulado",
        formula: "% Retida Acumulada = Σ (% Retida até a peneira)",
        description: "Soma acumulada dos percentuais retidos até cada peneira"
      },
      {
        label: "Percentual Passante",
        formula: "% Passante = 100 - % Retida Acumulada",
        description: "Percentual que passa por cada peneira"
      },
      {
        label: "Diâmetro Efetivo (D10, D30, D60)",
        formula: "Dn = diâmetro correspondente a n% passante na curva granulométrica",
        description: "Diâmetros característicos obtidos da curva granulométrica"
      },
      {
        label: "Coeficiente de Uniformidade (Cu)",
        formula: "Cu = D60 / D10",
        description: "Indica a uniformidade da distribuição granulométrica. Cu > 4 indica graduação bem distribuída"
      },
      {
        label: "Coeficiente de Curvatura (Cc)",
        formula: "Cc = (D30)² / (D10 × D60)",
        description: "Indica a forma da curva granulométrica. 1 < Cc < 3 indica boa graduação"
      },
    ];

    if (formData.limitePercent && formData.limitePlasticidade) {
      formulas.push({
        label: "Índice de Plasticidade (IP)",
        formula: "IP = LL - LP",
        description: "Diferença entre o Limite de Liquidez e o Limite de Plasticidade"
      });
    }

    const exportData: ExportData = {
      moduleName: "granulometria",
      moduleTitle: "Granulometria e Classificação",
      inputs,
      results: resultsList,
      formulas,
      tables,
      chartImage: chartImage || undefined,
      customFileName: pdfFileName,
      theme: { mode: 'light', color: 'orange' }, // TODO: Integrar com contexto de tema real
      printSettings: settings.printSettings
    };

    console.log("Dados para exportação:", {
      numInputs: inputs.length,
      numTables: tables.length,
      tablesTitles: tables.map(t => t.title),
      hasChart: !!chartImage,
      fileName: pdfFileName
    });

    toast.info("Gerando PDF...");
    const result = await exportToPDF(exportData, true); // returnBlob = true

    setIsExportingPDF(false);

    if (result instanceof Blob) {
      try {
        const reportName = pdfFileName.replace('.pdf', '');
        const prepared = await prepareReportForStorage({
          name: reportName,
          moduleType: 'granulometria',
          moduleName: 'Granulometria e Classificação',
          pdfBlob: result,
          calculationData: {
            formData,
            results,
            exportDate: new Date().toISOString()
          }
        });
        addReport(prepared);
        setExportPDFDialogOpen(false);
        toast.success("Relatório salvo. PDF disponível em Relatórios.");
        setPdfSavedDialogOpen(true);
      } catch (error) {
        console.error('Erro ao salvar relatório:', error);
        toast.error("PDF exportado mas não foi possível salvar nos relatórios.");
      }
    } else {
      toast.error("Erro ao exportar PDF.");
    }
  };

  const handleExportExcel = async () => {
    if (!results) return;

    // Sheet de Entrada
    const entradaData: { label: string; value: string | number }[] = [
      { label: "Massa Total Seca (g)", value: formData.peneiramento_grosso.massa_total_seca },
    ];
    if (formData.peneiramento_grosso.massa_total_umida) {
      entradaData.push({ label: "Massa Total Úmida (g)", value: formData.peneiramento_grosso.massa_total_umida });
    }
    if (formData.peneiramento_grosso.teor_umidade) {
      entradaData.push({ label: "Teor de Umidade (%)", value: formData.peneiramento_grosso.teor_umidade });
    }
    if (formData.peneiramento_grosso.massa_graos) {
      entradaData.push({ label: "Massa dos Grãos (g)", value: formData.peneiramento_grosso.massa_graos });
    }
    if (formData.peneiramento_fino?.massa_total_seca) {
      entradaData.push({ label: "Massa Fina Seca (g)", value: formData.peneiramento_fino.massa_total_seca });
    }
    if (formData.limitePercent) entradaData.push({ label: "Limite de Liquidez (%)", value: formData.limitePercent });
    if (formData.limitePlasticidade) entradaData.push({ label: "Limite de Plasticidade (%)", value: formData.limitePlasticidade });

    // Sheet de Resultados
    const resultadosData: { label: string; value: string | number }[] = [];
    if (results.classificacao_uscs) {
      resultadosData.push({ label: "Classificação USCS", value: results.classificacao_uscs });
      if (results.descricao_uscs) resultadosData.push({ label: "Descrição USCS", value: results.descricao_uscs });
    }
    if (results.classificacao_hrb) {
      resultadosData.push({ label: "Classificação HRB", value: results.classificacao_hrb });
      if (results.descricao_hrb) resultadosData.push({ label: "Descrição HRB", value: results.descricao_hrb });
      if (results.avaliacao_subleito_hrb) resultadosData.push({ label: "Avaliação Subleito", value: results.avaliacao_subleito_hrb });
    }
    if (results.percentagem_pedregulho !== undefined) resultadosData.push({ label: "% Pedregulho", value: results.percentagem_pedregulho.toFixed(1) });
    if (results.percentagem_areia !== undefined) resultadosData.push({ label: "% Areia", value: results.percentagem_areia.toFixed(1) });
    if (results.percentagem_finos !== undefined) resultadosData.push({ label: "% Finos", value: results.percentagem_finos.toFixed(1) });
    if (results.d10) resultadosData.push({ label: "D10 (mm)", value: results.d10.toFixed(4) });
    if (results.d30) resultadosData.push({ label: "D30 (mm)", value: results.d30.toFixed(4) });
    if (results.d60) resultadosData.push({ label: "D60 (mm)", value: results.d60.toFixed(4) });
    if (results.coef_uniformidade) resultadosData.push({ label: "Coeficiente de Uniformidade (Cu)", value: results.coef_uniformidade.toFixed(2) });
    if (results.coef_curvatura) resultadosData.push({ label: "Coeficiente de Curvatura (Cc)", value: results.coef_curvatura.toFixed(2) });

    // Tabela granulométrica
    const tableHeaders = ["Peneira", "Abertura (mm)", "Massa Retida (g)", "% Retida", "% Retida Ac.", "% Passante"];
    const tableRows = results.dados_granulometricos.map(d => [
      d.peneira || '-',
      d.abertura.toFixed(3),
      d.massa_retida.toFixed(2),
      d.porc_retida.toFixed(2),
      d.porc_retida_acum.toFixed(2),
      d.porc_passante.toFixed(2)
    ]);

    const excelData: ExcelExportData = {
      moduleName: "granulometria",
      moduleTitle: "Granulometria e Classificação",
      sheets: [
        { name: "Dados de Entrada", data: entradaData },
        { name: "Resultados", data: resultadosData }
      ],
      tables: [{
        title: "Dados Granulométricos",
        headers: tableHeaders,
        rows: tableRows
      }]
    };

    const success = await exportToExcel(excelData);
    if (success) {
      toast.success("Excel exportado com sucesso!");
    } else {
      toast.error("Erro ao exportar Excel.");
    }
  };

  return (
    <div className="space-y-3 sm:space-y-4 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <PrintHeader moduleTitle="Granulometria e Classificação" moduleName="granulometria" />

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-2 animate-in fade-in slide-in-from-left-4 duration-500" data-tour="module-header">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl border border-primary/30 bg-primary/5 flex items-center justify-center transition-colors hover:border-primary/60 hover:bg-primary/10">
            <Database className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Granulometria</h1>
            <p className="text-muted-foreground text-sm">Análise Granulométrica e Classificação de Solos</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setLayoutMode(prev => prev === 'default' ? 'side-by-side' : 'default')}
            title={layoutMode === 'default' ? "Mudar para layout lateral" : "Mudar para layout padrão"}
            className="gap-2"
          >
            {layoutMode === 'default' ? <Columns className="w-4 h-4" /> : <PanelTop className="w-4 h-4" />}
            Layout
          </Button>

          <Separator orientation="vertical" className="h-6 mx-1 bg-border" />

          <DialogExemplos onCarregarExemplo={handleCarregarExemplo} />

          <Separator orientation="vertical" className="h-6 mx-1 bg-border" />

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

      <div className={cn(
        layoutMode === 'side-by-side' ? "grid lg:grid-cols-2 gap-6 items-start" : "space-y-6"
      )}>
        {/* Formulário - Grid 2 Colunas */}
        <div className={cn(
          "grid gap-4 md:gap-6 animate-in fade-in slide-in-from-left-4 duration-700",
          layoutMode === 'side-by-side' ? "grid-cols-1" : "lg:grid-cols-2"
        )} style={{ animationDelay: '100ms', animationFillMode: 'backwards' }} onKeyDown={handleKeyNavigation}>

          {/* Coluna 1: Peneiramento Grosso */}
          <Card className="glass h-full">
            <CardHeader className="pb-3 pt-4 px-4 md:px-6">
              <CardTitle className="text-base md:text-lg font-semibold flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-orange-500 shadow-sm shadow-orange-500/50"></span>
                Peneiramento Grosso
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 md:px-6 pb-6 space-y-4">
              {/* Inputs de Massa Grosso */}
              <div className="grid grid-cols-3 gap-3 bg-muted/30 p-3 rounded-lg border border-border/40" data-tour="massa-grosso-input">
                <div className="space-y-1.5">
                  <Label className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Massa Úmida Total (g)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.peneiramento_grosso.massa_total_umida}
                    onChange={(e) => handleMassaChange('grosso', 'massa_total_umida', e.target.value)}
                    placeholder="Ex: 1000.0"
                    className="h-8 text-sm bg-background/80"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Massa Seca Total (g)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.peneiramento_grosso.massa_total_seca}
                    onChange={(e) => handleMassaChange('grosso', 'massa_total_seca', e.target.value)}
                    placeholder="Ex: 950.0"
                    className="h-8 text-sm bg-background/80"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Umidade (%)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.peneiramento_grosso.teor_umidade}
                    onChange={(e) => handleMassaChange('grosso', 'teor_umidade', e.target.value)}
                    placeholder="Ex: 5.2"
                    className="h-8 text-sm bg-background/80"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                  {formData.peneiramento_grosso.peneiras.map((peneira, index) => (
                    <div key={index} className="flex items-center gap-2 p-1.5 rounded-md hover:bg-muted/30 transition-colors">
                      <span className="text-xs font-medium text-foreground/80 w-16 shrink-0">{peneira.peneira}</span>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="g"
                        value={peneira.massaRetida}
                        onChange={(e) => handlePeneiraChange(index, "massaRetida", e.target.value, 'grosso')}
                        className="h-7 text-xs text-center flex-1"
                      />
                      <span className="text-[10px] font-mono text-muted-foreground w-14 text-right shrink-0">{peneira.abertura} mm</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Coluna 2: Fino e Limites */}
          <div className="space-y-4 md:space-y-6 flex flex-col h-full">
            <Card className="glass">
              <CardHeader className="pb-3 pt-4 px-4 md:px-6">
                <CardTitle className="text-base md:text-lg font-semibold flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-blue-500 shadow-sm shadow-blue-500/50"></span>
                  Peneiramento Fino
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 md:px-6 pb-6 space-y-4">
                {/* Inputs de Massa Fino */}
                <div className="grid grid-cols-3 gap-3 bg-muted/30 p-3 rounded-lg border border-border/40">
                  <div className="space-y-1.5">
                    <Label className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Massa Úmida Parcial (g)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.peneiramento_fino.massa_total_umida}
                      onChange={(e) => handleMassaChange('fino', 'massa_total_umida', e.target.value)}
                      placeholder="Ex: 100.0"
                      className="h-8 text-sm bg-background/80"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Massa Seca Parcial (g)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.peneiramento_fino.massa_total_seca}
                      onChange={(e) => handleMassaChange('fino', 'massa_total_seca', e.target.value)}
                      placeholder="Ex: 95.0"
                      className="h-8 text-sm bg-background/80"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Umidade (%)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.peneiramento_fino.teor_umidade}
                      onChange={(e) => handleMassaChange('fino', 'teor_umidade', e.target.value)}
                      placeholder="Ex: 5.2"
                      className="h-8 text-sm bg-background/80"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                    {formData.peneiramento_fino.peneiras.map((peneira, index) => (
                      <div key={index} className="flex items-center gap-2 p-1.5 rounded-md hover:bg-muted/30 transition-colors">
                        <span className="text-xs font-medium text-foreground/80 w-16 shrink-0">{peneira.peneira}</span>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="g"
                          value={peneira.massaRetida}
                          onChange={(e) => handlePeneiraChange(index, "massaRetida", e.target.value, 'fino')}
                          className="h-7 text-xs text-center flex-1"
                        />
                        <span className="text-[10px] font-mono text-muted-foreground w-14 text-right shrink-0">{peneira.abertura} mm</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass flex-1">
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
                          value={formData.limitePercent}
                          onChange={(e) => handleInputChange("limitePercent", e.target.value)}
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
                          value={formData.limitePlasticidade}
                          onChange={(e) => handleInputChange("limitePlasticidade", e.target.value)}
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
        </div>

        {/* Resultados - Abaixo do formulário / Sempre visível */}
        <div className={cn(
          "animate-in slide-in-from-bottom-4 duration-700 fade-in",
          layoutMode === 'side-by-side' ? "pt-0 sticky top-4 self-start max-h-[calc(100vh-2rem)] overflow-y-auto pr-2 space-y-4" : "pt-4 space-y-6"
        )} data-tour="classificacoes" style={{ animationDelay: '200ms', animationFillMode: 'backwards' }}>
          <Tabs defaultValue="classificacao" className="w-full" onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 mb-4">
              <TabsTrigger value="classificacao" className="gap-2 text-xs md:text-sm">
                <Info className="w-3.5 h-3.5 md:w-4 md:h-4" />
                Classificação
              </TabsTrigger>
              <TabsTrigger value="tabelas" className="gap-2 text-xs md:text-sm">
                <TableIcon className="w-3.5 h-3.5 md:w-4 md:h-4" />
                Tabelas
              </TabsTrigger>
              <TabsTrigger value="curva" className="gap-2 text-xs md:text-sm">
                <TrendingUp className="w-3.5 h-3.5 md:w-4 md:h-4" />
                Curva
              </TabsTrigger>
              <TabsTrigger value="carta" className="gap-2 text-xs md:text-sm">
                <Activity className="w-3.5 h-3.5 md:w-4 md:h-4" />
                Carta
              </TabsTrigger>
            </TabsList>

            <TabsContent value="classificacao" className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Coluna 1: Classificações - Redesign com Foco */}
                <Card className="glass overflow-hidden h-full">
                  <CardContent className="p-0 h-full flex flex-col">
                    {/* Section USCS - Top half */}
                    <div className="flex-1 p-4 flex flex-col items-center justify-center text-center relative">
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
                        <span className="text-muted-foreground italic text-sm my-4">-</span>
                      )}
                    </div>

                    <Separator className="bg-border/30 w-[90%] mx-auto" />

                    {/* Section HRB - Bottom half */}
                    <div className="flex-1 p-8 flex flex-col items-center justify-center text-center relative">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="w-3 h-3 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.5)]"></span>
                        <span className="text-xs font-bold tracking-widest uppercase text-muted-foreground/80">Sistema AASHTO (HRB)</span>
                      </div>

                      {results?.classificacao_hrb ? (
                        <>
                          <div className="flex items-center justify-center gap-4 my-2">
                            <h3 className="text-6xl font-black tracking-tighter text-foreground leading-none tabular-nums">
                              {results.classificacao_hrb}
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
                        <span className="text-muted-foreground italic text-sm my-4">-</span>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Coluna 2: Parâmetros e Índices */}
                <Card className="glass overflow-hidden h-full">
                  <CardHeader className="pb-2 pt-4 px-5">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2 text-orange-500">
                      <BarChart3 className="w-4 h-4" />
                      Parâmetros Granulométricos
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-5 pb-5">
                    <div className="space-y-1.5">
                      <ResultRow label="D10 (Diâmetro Efetivo)" value={results?.d10} unit="mm" precision={4} />
                      <ResultRow label="D30" value={results?.d30} unit="mm" precision={4} />
                      <ResultRow label="D60" value={results?.d60} unit="mm" precision={4} />
                      <Separator className="my-2" />
                      <ResultRow label="Coef. de Uniformidade (Cu)" value={results?.coef_uniformidade} unit="" tooltip={tooltips.cu} highlight />
                      <ResultRow label="Coef. de Curvatura (Cc)" value={results?.coef_curvatura} unit="" tooltip={tooltips.cc} highlight />
                      <Separator className="my-2" />
                      <ResultRow label="Pedregulho" value={results?.percentagem_pedregulho} unit="%" />
                      <ResultRow label="Areia" value={results?.percentagem_areia} unit="%" />
                      <ResultRow label="Finos" value={results?.percentagem_finos} unit="%" />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="tabelas" className="mt-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
              <Card className="glass">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <TableIcon className="w-4 h-4 text-primary" />
                    Dados Detalhados
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <TabelaDadosGranulometricos dados={results?.dados_granulometricos || []} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="curva" className="mt-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
              <Card className="glass">
                <CardContent className="pt-6">
                  <CurvaGranulometrica
                    dados={results?.dados_granulometricos || []}
                    d10={results?.d10}
                    d30={results?.d30}
                    d60={results?.d60}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="carta" className="mt-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
              <Card className="glass">
                <CardContent className="pt-6">
                  {(formData.limitePercent && formData.limitePlasticidade) ? (
                    <div className="space-y-4">
                      <PlasticityChart
                        ll={formData.limitePercent ? parseFloat(formData.limitePercent) : null}
                        ip={(formData.limitePercent && formData.limitePlasticidade)
                          ? parseFloat(formData.limitePercent) - parseFloat(formData.limitePlasticidade)
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

          {/* Dialogs */}
          <SaveDialog
            open={saveDialogOpen}
            onOpenChange={setSaveDialogOpen}
            saveName={saveName}
            onSaveNameChange={setSaveName}
            onConfirm={handleConfirmSave}
          />

          <ExportPDFDialog
            open={exportPDFDialogOpen}
            onOpenChange={setExportPDFDialogOpen}
            fileName={pdfFileName}
            onFileNameChange={setPdfFileName}
            onConfirm={handleConfirmExportPDF}
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
                    navigate('/relatorios');
                  }}
                >
                  Ir para Relatórios
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <SavedCalculations
            open={loadDialogOpen}
            onOpenChange={setLoadDialogOpen}
            calculations={calculations}
            onLoad={handleLoadCalculation}
            onDelete={deleteCalculation}
            onRename={renameCalculation}
            moduleName="Granulometria"
          />
        </div>
      </div>
    </div >
  );
}


function ResultRow({
  label,
  value,
  unit,
  precision = 2,
  highlight = false,
  tooltip
}: {
  label: string,
  value: number | null | undefined,
  unit: string,
  precision?: number,
  highlight?: boolean,
  tooltip?: string
}) {
  // Check if value is valid (not null, undefined, NaN, or Infinity)
  const isValidValue = value !== undefined && value !== null && !isNaN(value) && isFinite(value);

  // Format display value
  const displayValue = isValidValue ? `${value.toFixed(precision)} ${unit} ` : "-";

  return (
    <div className={cn(
      "flex justify-between items-center text-sm py-2 px-3 rounded-md transition-colors",
      highlight
        ? "font-semibold bg-primary/5 text-primary"
        : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
    )}>
      <div className="flex items-center gap-1.5">
        <span className={cn(highlight && "text-foreground")}>{label}</span>
        {tooltip && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Info className="w-3.5 h-3.5 text-muted-foreground/70" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs" side="left">{tooltip}</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
      <span className={cn(
        "font-mono font-medium",
        isValidValue
          ? (highlight ? "text-primary dark:text-primary-foreground" : "text-foreground dark:text-white")
          : "text-muted-foreground"
      )}>
        {displayValue}
      </span>
    </div>
  );
}

// --- Wrapper Principal ---
export default function Granulometria() {
  return (
    <MobileModuleWrapper mobileVersion={<GranulometriaMobile />}>
      <GranulometriaDesktop />
    </MobileModuleWrapper>
  );
}
