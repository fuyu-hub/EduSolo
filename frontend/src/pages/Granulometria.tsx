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
import { exportToPDF, ExportData, formatNumberForExport } from "@/lib/export-utils";
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
    peneiras: [
      { abertura: "", massaRetida: "" },
      { abertura: "", massaRetida: "" },
    ],
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
    } catch (error: any) {
      console.error("Erro ao calcular granulometria:", error);
      
      if (error.response?.data?.detail) {
        toast.error(`Erro: ${error.response.data.detail}`);
      } else if (error.message) {
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
    
    if (results.classificacao_uscs) {
      resultsList.push({ label: "Classificação USCS", value: results.classificacao_uscs, highlight: true });
    }
    if (results.descricao_uscs) {
      resultsList.push({ label: "Descrição", value: results.descricao_uscs });
    }
    
    if (results.percentagem_pedregulho !== null) {
      resultsList.push({ label: "% Pedregulho", value: `${formatNumberForExport(results.percentagem_pedregulho, 1)}%` });
    }
    if (results.percentagem_areia !== null) {
      resultsList.push({ label: "% Areia", value: `${formatNumberForExport(results.percentagem_areia, 1)}%` });
    }
    if (results.percentagem_finos !== null) {
      resultsList.push({ label: "% Finos", value: `${formatNumberForExport(results.percentagem_finos, 1)}%` });
    }
    
    if (results.d10) resultsList.push({ label: "D10", value: `${formatNumberForExport(results.d10, 4)} mm` });
    if (results.d30) resultsList.push({ label: "D30", value: `${formatNumberForExport(results.d30, 4)} mm` });
    if (results.d60) resultsList.push({ label: "D60", value: `${formatNumberForExport(results.d60, 4)} mm` });
    if (results.coef_uniformidade) resultsList.push({ label: "Cu", value: formatNumberForExport(results.coef_uniformidade, 2) });
    if (results.coef_curvatura) resultsList.push({ label: "Cc", value: formatNumberForExport(results.coef_curvatura, 2) });

    const exportData: ExportData = {
      moduleName: "granulometria",
      moduleTitle: "Granulometria e Classificação",
      inputs,
      results: resultsList,
    };

    const success = await exportToPDF(exportData);
    if (success) {
      toast.success("PDF exportado com sucesso!");
    } else {
      toast.error("Erro ao exportar PDF.");
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <PrintHeader moduleTitle="Granulometria e Classificação" moduleName="granulometria" />
      
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-fuchsia-500 to-purple-600 flex items-center justify-center shadow-lg">
            <BarChart3 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Granulometria e Classificação</h1>
            <p className="text-muted-foreground">Análise granulométrica e classificação USCS</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <DialogExemplos onCarregarExemplo={handleCarregarExemplo} />
          
          <TooltipProvider>
            <CalculationActions
              onSave={handleSaveClick}
              onLoad={() => setLoadDialogOpen(true)}
              onExport={handleExportPDF}
              onPrint={handlePrint}
              hasResults={!!results}
              isCalculating={isCalculating}
            />
          </TooltipProvider>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Formulário */}
        <Card className="glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalcIcon className="w-5 h-5" />
              Dados do Ensaio
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <TooltipProvider>
              {/* Massa Total */}
              <div className="space-y-2">
                <Label htmlFor="massaTotal" className="flex items-center gap-1.5">
                  Massa Total da Amostra (g)
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
                />
              </div>

              {/* Peneiras - Novo Componente */}
              <SeletorPeneiras 
                peneiras={formData.peneiras}
                onChange={(novasPeneiras) => setFormData(prev => ({ ...prev, peneiras: novasPeneiras }))}
              />

              {/* Limites (opcional) */}
              <div className="space-y-3 p-3 rounded-lg bg-accent/5 border border-accent/20">
                <Label className="text-sm font-semibold">Limites de Consistência (opcional)</Label>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="ll" className="text-xs">LL (%)</Label>
                    <Input
                      id="ll"
                      type="number"
                      step="0.1"
                      value={formData.limitePercent}
                      onChange={(e) => handleInputChange("limitePercent", e.target.value)}
                      placeholder="Ex: 45"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="lp" className="text-xs">LP (%)</Label>
                    <Input
                      id="lp"
                      type="number"
                      step="0.1"
                      value={formData.limitePlasticidade}
                      onChange={(e) => handleInputChange("limitePlasticidade", e.target.value)}
                      placeholder="Ex: 25"
                    />
                  </div>
                </div>
              </div>
            </TooltipProvider>

            <div className="flex gap-3">
              <Button onClick={handleCalculate} disabled={!formData.massaTotal || isCalculating} className="flex-1">
                <CalcIcon className="w-4 h-4 mr-2" />
                {isCalculating ? "Analisando..." : "Analisar"}
              </Button>
              <Button onClick={handleClear} variant="outline">
                Limpar
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Resultados */}
        <Card className="glass">
          <CardHeader>
            <CardTitle>Resultados da Análise</CardTitle>
          </CardHeader>
          <CardContent>
            {isCalculating ? (
              <div className="space-y-4">
                {[...Array(8)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : results ? (
              <div className="space-y-4">
                {results.classificacao_uscs && (
                  <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                    <p className="text-sm font-medium text-muted-foreground mb-2">Classificação USCS</p>
                    <p className="text-2xl font-bold text-primary mb-1">{results.classificacao_uscs}</p>
                    <p className="text-sm text-foreground">{results.descricao_uscs}</p>
                  </div>
                )}

                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 rounded-lg bg-accent/5 text-center">
                    <p className="text-xs text-muted-foreground mb-1">Pedregulho</p>
                    <p className="text-lg font-bold text-foreground">
                      {results.percentagem_pedregulho !== null ? results.percentagem_pedregulho.toFixed(1) : "N/A"}%
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-accent/5 text-center">
                    <p className="text-xs text-muted-foreground mb-1">Areia</p>
                    <p className="text-lg font-bold text-foreground">
                      {results.percentagem_areia !== null ? results.percentagem_areia.toFixed(1) : "N/A"}%
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-accent/5 text-center">
                    <p className="text-xs text-muted-foreground mb-1">Finos</p>
                    <p className="text-lg font-bold text-foreground">
                      {results.percentagem_finos !== null ? results.percentagem_finos.toFixed(1) : "N/A"}%
                    </p>
                  </div>
                </div>

                <ResultItem label="D10" value={results.d10 ? `${results.d10.toFixed(4)} mm` : "N/A"} tooltip={tooltips.d10} />
                <ResultItem label="D30" value={results.d30 ? `${results.d30.toFixed(4)} mm` : "N/A"} tooltip={tooltips.d30} />
                <ResultItem label="D60" value={results.d60 ? `${results.d60.toFixed(4)} mm` : "N/A"} tooltip={tooltips.d60} />
                <ResultItem
                  label="Coef. Uniformidade (Cu)"
                  value={results.coef_uniformidade ? results.coef_uniformidade.toFixed(2) : "N/A"}
                  tooltip={tooltips.cu}
                  highlight
                />
                <ResultItem
                  label="Coef. Curvatura (Cc)"
                  value={results.coef_curvatura ? results.coef_curvatura.toFixed(2) : "N/A"}
                  tooltip={tooltips.cc}
                  highlight
                />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-center">
                <BarChart3 className="w-16 h-16 text-fuchsia-500/30 mb-4" />
                <p className="text-muted-foreground">Preencha os dados do ensaio para analisar</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Seção de Visualizações Detalhadas */}
      {results && (
        <Tabs defaultValue="tabela" className="w-full">
          <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto">
            <TabsTrigger value="tabela" className="flex items-center gap-2">
              <TableIcon className="w-4 h-4" />
              Tabela
            </TabsTrigger>
            <TabsTrigger value="grafico" className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Curva
            </TabsTrigger>
          </TabsList>

          <TabsContent value="tabela" className="mt-6">
            <TabelaDadosGranulometricos 
              dados={results.dados_granulometricos}
              massaTotal={parseFloat(formData.massaTotal)}
            />
          </TabsContent>

          <TabsContent value="grafico" className="mt-6">
            <CurvaGranulometrica 
              dados={results.dados_granulometricos}
              d10={results.d10}
              d30={results.d30}
              d60={results.d60}
            />
          </TabsContent>
        </Tabs>
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

function ResultItem({ label, value, tooltip, highlight = false }: { label: string; value: string; tooltip?: string; highlight?: boolean }) {
  return (
    <div className={`flex justify-between items-center p-3 rounded-lg ${highlight ? "bg-primary/10 border border-primary/20" : "bg-accent/5"}`}>
      <TooltipProvider>
        <span className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
          {label}
          {tooltip && (
            <Tooltip>
              <TooltipTrigger>
                <Info className="w-3 h-3" />
              </TooltipTrigger>
              <TooltipContent>{tooltip}</TooltipContent>
            </Tooltip>
          )}
        </span>
      </TooltipProvider>
      <span className={`font-bold ${highlight ? "text-primary text-lg" : "text-foreground"}`}>{value}</span>
    </div>
  );
}
