import { useState } from "react";
import axios from "axios";
import { BarChart3, Info, Calculator as CalcIcon, Plus, Trash2, Table as TableIcon, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { useSavedCalculations } from "@/hooks/use-saved-calculations";
import SavedCalculations from "@/components/SavedCalculations";
import SaveDialog from "@/components/SaveDialog";
import PrintHeader from "@/components/PrintHeader";
import CalculationActions from "@/components/CalculationActions";
import { exportToPDF, exportToExcel, ExportData, ExcelExportData, formatNumberForExport, captureChartAsImage } from "@/lib/export-utils";
import TabelaDadosGranulometricos from "@/components/granulometria/TabelaDadosGranulometricos";
import CurvaGranulometrica from "@/components/granulometria/CurvaGranulometrica";
import SeletorPeneiras from "@/components/granulometria/SeletorPeneiras";
import DialogExemplos from "@/components/granulometria/DialogExemplos";
import { ExemploGranulometria } from "@/lib/exemplos-granulometria";

// Configuração da API
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

interface PeneiraDado {
  abertura: string;
  massaRetida: string;
}

interface FormData {
  massaTotal: string;
  peneiras: PeneiraDado[];
  limitePercent: string;
  limitePlasticidade: string;
}

// Interface alinhada com o backend (GranulometriaOutput)
interface PontoGranulometrico {
  peneira?: string;
  abertura: number;
  massa_retida: number;
  porc_retida: number;
  porc_retida_acum: number;
  porc_passante: number;
}

interface Results {
  dados_granulometricos: PontoGranulometrico[];
  percentagem_pedregulho: number | null;
  percentagem_areia: number | null;
  percentagem_finos: number | null;
  d10: number | null;
  d30: number | null;
  d60: number | null;
  coef_uniformidade: number | null;
  coef_curvatura: number | null;
  classificacao_uscs: string | null;
  descricao_uscs: string | null;
  classificacao_hrb: string | null;
  grupo_hrb: string | null;
  subgrupo_hrb: string | null;
  indice_grupo_hrb: number | null;
  descricao_hrb: string | null;
  avaliacao_subleito_hrb: string | null;
}

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

const peneirasComuns = [
  { nome: '2"', abertura: 50.8 },
  { nome: '1 1/2"', abertura: 38.1 },
  { nome: '1"', abertura: 25.4 },
  { nome: '3/4"', abertura: 19.1 },
  { nome: '3/8"', abertura: 9.52 },
  { nome: 'Nº 4', abertura: 4.76 },
  { nome: 'Nº 10', abertura: 2.0 },
  { nome: 'Nº 16', abertura: 1.19 },
  { nome: 'Nº 30', abertura: 0.59 },
  { nome: 'Nº 40', abertura: 0.42 },
  { nome: 'Nº 60', abertura: 0.25 },
  { nome: 'Nº 100', abertura: 0.149 },
  { nome: 'Nº 200', abertura: 0.074 },
];

export default function Granulometria() {
  const [formData, setFormData] = useState<FormData>({
    massaTotal: "",
    peneiras: [],
    limitePercent: "",
    limitePlasticidade: "",
  });

  const [results, setResults] = useState<Results | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  // Estados para salvamento
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [saveName, setSaveName] = useState("");
  const [loadDialogOpen, setLoadDialogOpen] = useState(false);
  const { calculations, saveCalculation, deleteCalculation, renameCalculation } = useSavedCalculations("granulometria");

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handlePeneiraChange = (index: number, field: keyof PeneiraDado, value: string) => {
    const newPeneiras = [...formData.peneiras];
    newPeneiras[index][field] = value;
    setFormData((prev) => ({ ...prev, peneiras: newPeneiras }));
  };

  const addPeneira = () => {
    setFormData((prev) => ({
      ...prev,
      peneiras: [...prev.peneiras, { abertura: "", massaRetida: "" }],
    }));
  };

  const removePeneira = (index: number) => {
    if (formData.peneiras.length > 1) {
      const newPeneiras = formData.peneiras.filter((_, i) => i !== index);
      setFormData((prev) => ({ ...prev, peneiras: newPeneiras }));
    }
  };

  const handleCalculate = async () => {
    if (!formData.massaTotal) {
      toast.error("Preencha a massa total");
      return;
    }

    const peneirasValidas = formData.peneiras.filter((p) => p.abertura && p.massaRetida);
    if (peneirasValidas.length === 0) {
      toast.error("Adicione pelo menos uma peneira com dados");
      return;
    }

    setIsCalculating(true);

    try {
      // Preparar payload para a API
      const payload = {
        massa_total: parseFloat(formData.massaTotal),
        peneiras: peneirasValidas.map((p) => ({
          abertura: parseFloat(p.abertura),
          massa_retida: parseFloat(p.massaRetida),
        })),
        ll: formData.limitePercent ? parseFloat(formData.limitePercent) : null,
        lp: formData.limitePlasticidade ? parseFloat(formData.limitePlasticidade) : null,
      };

      // Fazer requisição para a API
      const response = await axios.post<Results>(
        `${API_BASE_URL}/analisar/granulometria`,
        payload
      );

      setResults(response.data);
      toast.success("Análise granulométrica concluída!");
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.data?.detail) {
        toast.error(`Erro: ${error.response.data.detail}`);
      } else if (error instanceof Error) {
        toast.error(`Erro: ${error.message}`);
      } else {
        toast.error("Erro ao calcular. Verifique os dados e tente novamente.");
      }
    } finally {
      setIsCalculating(false);
    }
  };

  const handleClear = () => {
    setFormData({
      massaTotal: "",
      peneiras: [
        { abertura: "", massaRetida: "" },
        { abertura: "", massaRetida: "" },
      ],
      limitePercent: "",
      limitePlasticidade: "",
    });
    setResults(null);
  };

  // Funções de salvamento e exportação
  const handleSaveClick = () => {
    if (!results) return;
    setSaveName(`Cálculo ${new Date().toLocaleDateString('pt-BR')}`);
    setSaveDialogOpen(true);
  };

  const handleConfirmSave = () => {
    if (!results || !saveName.trim()) return;
    const success = saveCalculation(saveName.trim(), formData, results);
    if (success) {
      toast.success("Cálculo salvo com sucesso!");
      setSaveDialogOpen(false);
      setSaveName("");
    } else {
      toast.error("Erro ao salvar o cálculo.");
    }
  };

  const handleLoadCalculation = (calculation: any) => {
    setFormData(calculation.formData);
    setResults(calculation.results);
    toast.success(`"${calculation.name}" carregado com sucesso!`);
  };

  const handleCarregarExemplo = (exemplo: ExemploGranulometria) => {
    // Converter peneiras do exemplo para o formato do formulário
    const peneirasFormatadas: PeneiraDado[] = exemplo.peneiras.map(p => ({
      abertura: p.aberturaMM.toString(),
      massaRetida: p.massaRetida.toString()
    }));

    // Atualizar formulário com dados do exemplo
    setFormData({
      massaTotal: exemplo.massaTotal.toString(),
      peneiras: peneirasFormatadas,
      limitePercent: exemplo.ll?.toString() || "",
      limitePlasticidade: exemplo.lp?.toString() || "",
    });

    // Limpar resultados anteriores
    setResults(null);

    toast.success(`Exemplo "${exemplo.nome}" carregado com sucesso!`);
  };

  const handleExportPDF = async () => {
    if (!results) return;
    
    // Capturar imagem do gráfico
    toast.info("Capturando gráfico...");
    const chartImage = await captureChartAsImage('curva-granulometrica-chart');
    
    const inputs: { label: string; value: string }[] = [
      { label: "Massa Total", value: `${formData.massaTotal} g` },
    ];
    formData.peneiras.forEach((p, i) => {
      if (p.abertura && p.massaRetida) {
        inputs.push({ label: `Peneira ${i + 1} - Abertura`, value: `${p.abertura} mm` });
        inputs.push({ label: `Peneira ${i + 1} - Massa Retida`, value: `${p.massaRetida} g` });
      }
    });
    if (formData.limitePercent) inputs.push({ label: "LL", value: `${formData.limitePercent}%` });
    if (formData.limitePlasticidade) inputs.push({ label: "LP", value: `${formData.limitePlasticidade}%` });

    const resultsList: { label: string; value: string; highlight?: boolean }[] = [];
    
    // Classificação USCS
    if (results.classificacao_uscs) {
      resultsList.push({ label: "Classificação USCS", value: results.classificacao_uscs, highlight: true });
      if (results.descricao_uscs) resultsList.push({ label: "Descrição USCS", value: results.descricao_uscs });
    }
    
    // Classificação HRB
    if (results.classificacao_hrb) {
      resultsList.push({ label: "Classificação HRB", value: results.classificacao_hrb, highlight: true });
      if (results.descricao_hrb) resultsList.push({ label: "Descrição HRB", value: results.descricao_hrb });
      if (results.avaliacao_subleito_hrb) resultsList.push({ label: "Avaliação Subleito", value: results.avaliacao_subleito_hrb });
    }
    
    // Composição
    if (results.percentagem_pedregulho !== null) resultsList.push({ label: "% Pedregulho", value: `${formatNumberForExport(results.percentagem_pedregulho, 1)}%` });
    if (results.percentagem_areia !== null) resultsList.push({ label: "% Areia", value: `${formatNumberForExport(results.percentagem_areia, 1)}%` });
    if (results.percentagem_finos !== null) resultsList.push({ label: "% Finos", value: `${formatNumberForExport(results.percentagem_finos, 1)}%` });
    
    // Diâmetros e coeficientes
    if (results.d10) resultsList.push({ label: "D10", value: `${formatNumberForExport(results.d10, 4)} mm` });
    if (results.d30) resultsList.push({ label: "D30", value: `${formatNumberForExport(results.d30, 4)} mm` });
    if (results.d60) resultsList.push({ label: "D60", value: `${formatNumberForExport(results.d60, 4)} mm` });
    if (results.coef_uniformidade) resultsList.push({ label: "Cu", value: formatNumberForExport(results.coef_uniformidade, 2) });
    if (results.coef_curvatura) resultsList.push({ label: "Cc", value: formatNumberForExport(results.coef_curvatura, 2) });

    // Tabela de dados granulométricos
    const tableHeaders = ["Peneira", "Abertura (mm)", "Massa Retida (g)", "% Retida", "% Retida Ac.", "% Passante"];
    const tableRows = results.dados_granulometricos.map(d => [
      d.peneira || '-',
      d.abertura.toFixed(3),
      d.massa_retida.toFixed(2),
      d.porc_retida.toFixed(2),
      d.porc_retida_acum.toFixed(2),
      d.porc_passante.toFixed(2)
    ]);

    const exportData: ExportData = {
      moduleName: "granulometria",
      moduleTitle: "Granulometria e Classificação",
      inputs,
      results: resultsList,
      tables: [{
        title: "Dados Granulométricos",
        headers: tableHeaders,
        rows: tableRows
      }],
      chartImage: chartImage || undefined
    };

    toast.info("Gerando PDF...");
    const success = await exportToPDF(exportData);
    if (success) {
      toast.success("PDF exportado com sucesso!");
    } else {
      toast.error("Erro ao exportar PDF.");
    }
  };

  const handleExportExcel = async () => {
    if (!results) return;
    
    // Sheet de Entrada
    const entradaData: { label: string; value: string | number }[] = [
      { label: "Massa Total (g)", value: formData.massaTotal },
    ];
    if (formData.limitePercent) entradaData.push({ label: "LL (%)", value: formData.limitePercent });
    if (formData.limitePlasticidade) entradaData.push({ label: "LP (%)", value: formData.limitePlasticidade });

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
    if (results.percentagem_pedregulho !== null) resultadosData.push({ label: "% Pedregulho", value: results.percentagem_pedregulho.toFixed(1) });
    if (results.percentagem_areia !== null) resultadosData.push({ label: "% Areia", value: results.percentagem_areia.toFixed(1) });
    if (results.percentagem_finos !== null) resultadosData.push({ label: "% Finos", value: results.percentagem_finos.toFixed(1) });
    if (results.d10) resultadosData.push({ label: "D10 (mm)", value: results.d10.toFixed(4) });
    if (results.d30) resultadosData.push({ label: "D30 (mm)", value: results.d30.toFixed(4) });
    if (results.d60) resultadosData.push({ label: "D60 (mm)", value: results.d60.toFixed(4) });
    if (results.coef_uniformidade) resultadosData.push({ label: "Cu", value: results.coef_uniformidade.toFixed(2) });
    if (results.coef_curvatura) resultadosData.push({ label: "Cc", value: results.coef_curvatura.toFixed(2) });

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
    <div className="space-y-3 max-w-7xl mx-auto">
      <PrintHeader moduleTitle="Granulometria e Classificação" moduleName="granulometria" />
      
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-fuchsia-500 to-purple-600 flex items-center justify-center shadow-md">
            <BarChart3 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Granulometria e Classificação</h1>
            <p className="text-xs text-muted-foreground">Análise granulométrica e classificação USCS/HRB</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <DialogExemplos onCarregarExemplo={handleCarregarExemplo} />
          
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

      {/* Formulário - Largura total */}
      <Card className="glass">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <CalcIcon className="w-4 h-4" />
            Dados do Ensaio
          </CardTitle>
        </CardHeader>
        <CardContent>
          <TooltipProvider>
            <div className="grid lg:grid-cols-3 gap-4">
              {/* Coluna 1 - Massa Total e Limites */}
              <div className="space-y-3">
                {/* Massa Total */}
                <div className="space-y-1">
                  <Label htmlFor="massaTotal" className="flex items-center gap-1 text-xs">
                    Massa Total (g)
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="w-3 h-3 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>{tooltips.massaTotal}</TooltipContent>
                    </Tooltip>
                  </Label>
                  <Input
                    id="massaTotal"
                    type="number"
                    step="0.01"
                    value={formData.massaTotal}
                    onChange={(e) => handleInputChange("massaTotal", e.target.value)}
                    placeholder="Ex: 1000.00"
                    className="h-8 text-sm"
                  />
                </div>

                {/* Limites (opcional) */}
                <div className="space-y-2 p-2 rounded-lg bg-accent/5 border border-accent/20">
                  <Label className="text-xs font-semibold">Limites (para classificação)</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-0.5">
                      <Label htmlFor="ll" className="text-[10px]">LL (%)</Label>
                      <Input
                        id="ll"
                        type="number"
                        step="0.1"
                        value={formData.limitePercent}
                        onChange={(e) => handleInputChange("limitePercent", e.target.value)}
                        placeholder="Ex: 45"
                        className="h-7 text-xs"
                      />
                    </div>
                    <div className="space-y-0.5">
                      <Label htmlFor="lp" className="text-[10px]">LP (%)</Label>
                      <Input
                        id="lp"
                        type="number"
                        step="0.1"
                        value={formData.limitePlasticidade}
                        onChange={(e) => handleInputChange("limitePlasticidade", e.target.value)}
                        placeholder="Ex: 25"
                        className="h-7 text-xs"
                      />
                    </div>
                  </div>
                </div>

                {/* Resumo Rápido */}
                {formData.peneiras.length > 0 && (
                  <div className="p-3 rounded-lg bg-gradient-to-br from-muted/50 to-muted/30 border border-muted">
                    <p className="text-xs font-semibold mb-2 text-muted-foreground uppercase">Resumo Rápido</p>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Peneiras:</span>
                        <span className="font-bold">{formData.peneiras.length}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Com massa:</span>
                        <span className="font-bold">
                          {formData.peneiras.filter(p => p.massaRetida && parseFloat(p.massaRetida) > 0).length}
                        </span>
                      </div>
                      {formData.massaTotal && formData.peneiras.some(p => p.massaRetida) && (
                        <>
                          <div className="flex justify-between items-center pt-2 border-t border-muted-foreground/20">
                            <span className="text-muted-foreground">Massa Total:</span>
                            <span className="font-bold">{parseFloat(formData.massaTotal).toFixed(2)} g</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">Massa Retida:</span>
                            <span className="font-bold">
                              {formData.peneiras
                                .reduce((sum, p) => sum + (parseFloat(p.massaRetida) || 0), 0)
                                .toFixed(2)} g
                            </span>
                          </div>
                          {(() => {
                            const massaTotal = parseFloat(formData.massaTotal);
                            const massaRetida = formData.peneiras.reduce((sum, p) => sum + (parseFloat(p.massaRetida) || 0), 0);
                            const perda = massaTotal - massaRetida;
                            const percPerda = (perda / massaTotal) * 100;
                            
                            return (
                              <div className="flex justify-between items-center">
                                <span className="text-muted-foreground">Diferença:</span>
                                <span className={`font-bold ${Math.abs(percPerda) > 1 ? 'text-amber-600 dark:text-amber-400' : 'text-green-600 dark:text-green-400'}`}>
                                  {perda.toFixed(2)} g ({percPerda.toFixed(2)}%)
                                </span>
                              </div>
                            );
                          })()}
                        </>
                      )}
                    </div>
                  </div>
                )}

                {/* Botões */}
                <div className="flex gap-2">
                  <Button onClick={handleCalculate} disabled={!formData.massaTotal || isCalculating} className="flex-1 h-8 text-xs">
                    <CalcIcon className="w-3 h-3 mr-1.5" />
                    {isCalculating ? "Analisando..." : "Analisar"}
                  </Button>
                  <Button onClick={handleClear} variant="outline" className="h-8 text-xs">
                    Limpar
                  </Button>
                </div>
              </div>

              {/* Coluna 2 e 3 - Peneiras (ocupa 2 colunas) */}
              <div className="lg:col-span-2">
                <SeletorPeneiras 
                  peneiras={formData.peneiras}
                  onChange={(novasPeneiras) => setFormData(prev => ({ ...prev, peneiras: novasPeneiras }))}
                />
              </div>
            </div>
          </TooltipProvider>
        </CardContent>
      </Card>

      {/* Resultados - Abaixo do formulário */}
      {results && (
        <Card className="glass">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Resultados da Análise</CardTitle>
          </CardHeader>
          <CardContent>
            {isCalculating ? (
              <div className="grid grid-cols-4 gap-2">
                {[...Array(8)].map((_, i) => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {/* Resultados Numéricos em Linha */}
                <div className="space-y-2">
                  {/* Classificações - Horizontal */}
                  {(results.classificacao_uscs || results.classificacao_hrb) && (
                    <div className="grid lg:grid-cols-2 gap-3">
                    {/* Classificação USCS */}
                    {results.classificacao_uscs && (
                      <div className="p-2 rounded-lg bg-gradient-to-br from-fuchsia-500/10 to-purple-600/10 border border-fuchsia-500/30">
                        <div className="flex items-center gap-1 mb-1">
                          <div className="w-1 h-1 rounded-full bg-fuchsia-500"></div>
                          <p className="text-[9px] font-bold text-fuchsia-700 dark:text-fuchsia-400 uppercase tracking-wide">
                            USCS
                          </p>
                        </div>
                        <p className="text-lg font-bold bg-gradient-to-r from-fuchsia-600 to-purple-600 bg-clip-text text-transparent mb-0.5">
                          {results.classificacao_uscs}
                        </p>
                        <p className="text-[10px] text-foreground/80 leading-tight">{results.descricao_uscs}</p>
                      </div>
                    )}
                    
                    {/* Classificação HRB/AASHTO */}
                    {results.classificacao_hrb && (
                      <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500/10 to-cyan-600/10 border border-blue-500/30">
                        <div className="flex items-center gap-1 mb-1">
                          <div className="w-1 h-1 rounded-full bg-blue-500"></div>
                          <p className="text-[9px] font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wide">
                            HRB/AASHTO
                          </p>
                        </div>
                        <div className="flex items-baseline gap-2 mb-0.5">
                          <p className="text-lg font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                            {results.classificacao_hrb}
                          </p>
                          {results.indice_grupo_hrb !== null && results.indice_grupo_hrb > 0 && (
                            <span className="text-[9px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30 px-1 py-0.5 rounded">
                              IG:{results.indice_grupo_hrb}
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-foreground/80 leading-tight mb-1">{results.descricao_hrb}</p>
                        {results.avaliacao_subleito_hrb && (
                          <p className="text-[9px] font-semibold text-blue-700 dark:text-blue-300 mt-1 pt-1 border-t border-blue-500/20">
                            Subleito: {results.avaliacao_subleito_hrb}
                          </p>
                        )}
                      </div>
                      )}
                    </div>
                  )}

                  {/* Composição Granulométrica */}
                  <div className="grid lg:grid-cols-3 gap-2">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 border border-gray-300 dark:border-gray-700 text-center">
                    <p className="text-[9px] text-muted-foreground mb-0.5 font-medium">Pedregulho</p>
                    <p className="text-base font-bold text-gray-700 dark:text-gray-300">
                      {results.percentagem_pedregulho !== null ? results.percentagem_pedregulho.toFixed(1) : "N/A"}%
                    </p>
                  </div>
                  <div className="p-2 rounded-lg bg-gradient-to-br from-yellow-100 to-amber-200 dark:from-yellow-900/40 dark:to-amber-900/40 border border-yellow-400 dark:border-yellow-700 text-center">
                    <p className="text-[9px] text-yellow-900 dark:text-yellow-300 mb-0.5 font-medium">Areia</p>
                    <p className="text-base font-bold text-yellow-800 dark:text-yellow-200">
                      {results.percentagem_areia !== null ? results.percentagem_areia.toFixed(1) : "N/A"}%
                    </p>
                  </div>
                  <div className="p-2 rounded-lg bg-gradient-to-br from-orange-100 to-red-200 dark:from-orange-900/40 dark:to-red-900/40 border border-orange-400 dark:border-orange-700 text-center">
                    <p className="text-[9px] text-orange-900 dark:text-orange-300 mb-0.5 font-medium">Finos</p>
                    <p className="text-base font-bold text-orange-800 dark:text-orange-200">
                      {results.percentagem_finos !== null ? results.percentagem_finos.toFixed(1) : "N/A"}%
                    </p>
                    </div>
                  </div>

                  {/* Diâmetros e Coeficientes - Grid horizontal */}
                  <div className="grid lg:grid-cols-5 gap-3">
                    <ResultItem label="D10" value={results.d10 ? `${results.d10.toFixed(4)} mm` : "N/A"} tooltip={tooltips.d10} color="red" />
                    <ResultItem label="D30" value={results.d30 ? `${results.d30.toFixed(4)} mm` : "N/A"} tooltip={tooltips.d30} color="amber" />
                    <ResultItem label="D60" value={results.d60 ? `${results.d60.toFixed(4)} mm` : "N/A"} tooltip={tooltips.d60} color="green" />
                    <ResultItem
                      label="Cu"
                      value={results.coef_uniformidade ? results.coef_uniformidade.toFixed(2) : "N/A"}
                      tooltip={tooltips.cu}
                      highlight
                    />
                    <ResultItem
                      label="Cc"
                      value={results.coef_curvatura ? results.coef_curvatura.toFixed(2) : "N/A"}
                      tooltip={tooltips.cc}
                      highlight
                    />
                  </div>
                </div>

                {/* Curva e Tabela - Unificadas */}
                <Card className="glass">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Análise Granulométrica Completa</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid lg:grid-cols-2 gap-4">
                      {/* Curva Granulométrica */}
                      <div>
                        <CurvaGranulometrica 
                          dados={results.dados_granulometricos}
                          d10={results.d10}
                          d30={results.d30}
                          d60={results.d60}
                        />
                      </div>
                      
                      {/* Tabela de Dados */}
                      <div>
                        <TabelaDadosGranulometricos 
                          dados={results.dados_granulometricos}
                          massaTotal={parseFloat(formData.massaTotal)}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Dialogs */}
      <SaveDialog
        open={saveDialogOpen}
        onOpenChange={setSaveDialogOpen}
        saveName={saveName}
        onSaveNameChange={setSaveName}
        onConfirm={handleConfirmSave}
      />

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
  );
}

function ResultItem({ 
  label, 
  value, 
  tooltip, 
  highlight = false, 
  color,
  compact = false
}: { 
  label: string; 
  value: string; 
  tooltip?: string; 
  highlight?: boolean;
  color?: 'red' | 'amber' | 'green';
  compact?: boolean;
}) {
  const colorClasses = {
    red: 'border-l-2 border-red-500 bg-red-50 dark:bg-red-950/30',
    amber: 'border-l-2 border-amber-500 bg-amber-50 dark:bg-amber-950/30',
    green: 'border-l-2 border-green-500 bg-green-50 dark:bg-green-950/30',
  };

  const baseClass = color 
    ? colorClasses[color]
    : highlight 
      ? "bg-primary/10 border border-primary/20" 
      : "bg-accent/5 border border-accent/10";

  const padding = compact ? "p-1.5" : "p-2";
  const fontSize = compact ? "text-[10px]" : "text-xs";
  const valueFontSize = compact ? "text-xs" : "text-sm";

  return (
    <div className={`flex justify-between items-center ${padding} rounded ${baseClass}`}>
      <TooltipProvider>
        <span className={`${fontSize} font-medium text-muted-foreground flex items-center gap-1`}>
          {label}
          {tooltip && (
            <Tooltip>
              <TooltipTrigger>
                <Info className="w-2.5 h-2.5" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs text-xs">{tooltip}</TooltipContent>
            </Tooltip>
          )}
        </span>
      </TooltipProvider>
      <span className={`font-bold ${valueFontSize} ${highlight ? "text-primary" : "text-foreground"}`}>{value}</span>
    </div>
  );
}
