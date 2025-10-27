import { useState, useRef } from "react";
import { Target, Calculator, Save, Download, FolderOpen, Lightbulb, AlertCircle, FileSpreadsheet, Trash2, Plus, Edit2, BarChart3, TableIcon, Layers, ArrowLeft } from "lucide-react";
import { calcularAcrescimoTensoes } from "@/lib/calculations/acrescimo-tensoes";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/components/ui/use-toast";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
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
} from "@/components/ui/sheet";
import {
  MobileSection,
  MobileInputGroup,
  MobileTabs,
} from "@/components/mobile";
import { formatNumber } from "@/lib/format-number";
import { useSettings } from "@/hooks/use-settings";
import { useSavedCalculations } from "@/hooks/use-saved-calculations";
import { exportToPDF, exportToExcel, ExportData, ExcelExportData, formatNumberForExport, generateDefaultPDFFileName } from "@/lib/export-utils";
import ExportPDFDialog from "@/components/ExportPDFDialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import CanvasBoussinesqMobile from "@/components/acrescimo-tensoes/CanvasBoussinesqMobile";

interface PontoAnalise {
  id: string;
  nome: string;
  x: number;
  z: number;
  tensao?: number;
}

interface ExemploBoussinesq {
  nome: string;
  icon: string;
  descricao: string;
  cargaP: number;
  pontos: { nome: string; x: number; z: number }[];
}

// Cálculos agora são feitos localmente no frontend

const generateId = () => `${Date.now()}-${Math.floor(Math.random() * 1000000)}`;

const exemplos: ExemploBoussinesq[] = [
  {
    nome: "Exemplo 1: Fundação Profunda",
    icon: "🏗️",
    descricao: "Análise de carga pontual de estaca (1500 kN) em 3 pontos estratégicos",
    cargaP: 1500,
    pontos: [
      { nome: "Ponto A", x: -3, z: 2 },
      { nome: "Ponto B", x: 0, z: 4 },
      { nome: "Ponto C", x: 4, z: 5 },
    ],
  },
  {
    nome: "Exemplo 2: Torre de Transmissão",
    icon: "📡",
    descricao: "Carga concentrada de 800 kN em torre",
    cargaP: 800,
    pontos: [
      { nome: "Ponto 1", x: 0, z: 1 },
      { nome: "Ponto 2", x: 2, z: 3 },
      { nome: "Ponto 3", x: -2, z: 3 },
    ],
  },
  {
    nome: "Exemplo 3: Pilar Isolado",
    icon: "🏛️",
    descricao: "Pilar com carga de 2000 kN",
    cargaP: 2000,
    pontos: [
      { nome: "Eixo", x: 0, z: 2 },
      { nome: "Lateral 1m", x: 1, z: 2 },
      { nome: "Lateral 3m", x: 3, z: 4 },
    ],
  },
];

export default function BoussinesqMobile() {
  const { settings } = useSettings();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [cargaP, setCargaP] = useState<string>("100");
  const [pontos, setPontos] = useState<PontoAnalise[]>([]);
  const [isCalculating, setIsCalculating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [calculoFeito, setCalculoFeito] = useState(false);

  // Estados para sheets e dialogs
  const [examplesSheetOpen, setExamplesSheetOpen] = useState(false);
  const [loadSheetOpen, setLoadSheetOpen] = useState(false);
  const [pontoDialogOpen, setPontoDialogOpen] = useState(false);
  const [pontoEditando, setPontoEditando] = useState<PontoAnalise | null>(null);
  const [novoPontoNome, setNovoPontoNome] = useState("");
  const [novoPontoX, setNovoPontoX] = useState("");
  const [novoPontoZ, setNovoPontoZ] = useState("");
  
  // Estados para dialogs de carga
  const [cargaDialogOpen, setCargaDialogOpen] = useState(false);
  const [novaCarga, setNovaCarga] = useState("");

  // Estados para salvamento
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [saveName, setSaveName] = useState("");
  const { calculations, saveCalculation, deleteCalculation } = useSavedCalculations("boussinesq");

  // Estados para exportação
  const [exportPDFDialogOpen, setExportPDFDialogOpen] = useState(false);
  const [pdfFileName, setPdfFileName] = useState("");
  const [isExportingPDF, setIsExportingPDF] = useState(false);

  // Ref para evitar cálculos duplicados
  const isCalculatingRef = useRef(false);

  const handleCalculate = async () => {
    const carga = parseFloat(cargaP);
    if (isNaN(carga) || carga <= 0) {
      setError("Carga P deve ser maior que 0");
      toast({
        title: "Erro de Validação",
        description: "Carga P deve ser maior que 0",
        variant: "destructive",
      });
      return;
    }

    if (pontos.length === 0) {
      setError("Adicione pelo menos um ponto de análise");
      toast({
        title: "Erro de Validação",
        description: "Adicione pelo menos um ponto de análise",
        variant: "destructive",
      });
      return;
    }

    if (isCalculatingRef.current) {
      return;
    }

    isCalculatingRef.current = true;
    setIsCalculating(true);
    setError(null);

    try {
      const pontosParaCalcular = [...pontos];
      const resultadosMap = new Map<string, number | undefined>();

      for (const ponto of pontosParaCalcular) {
        try {
          // Calcula localmente no frontend
          const resultado = calcularAcrescimoTensoes({
            tipo_carga: "pontual",
            carga_pontual: {
              P: carga,
              x: 0,
              y: 0
            },
            ponto_interesse: {
              x: ponto.x,
              y: 0,
              z: ponto.z
            }
          });

          if (resultado.erro) {
            resultadosMap.set(ponto.id, undefined);
          } else {
            resultadosMap.set(ponto.id, resultado.delta_sigma_v);
          }
        } catch (error) {
          console.error(`Erro ao calcular ponto ${ponto.nome}:`, error);
          resultadosMap.set(ponto.id, undefined);
        }
      }

      setPontos(prevPontos => 
        prevPontos.map(p => {
          const tensao = resultadosMap.get(p.id);
          if (resultadosMap.has(p.id)) {
            return { ...p, tensao };
          }
          return p;
        })
      );
      
      setCalculoFeito(true);
      toast({
        title: "✅ Sucesso!",
        description: "Tensões calculadas com sucesso",
      });
    } catch (err: any) {
      console.error("Erro ao calcular tensões:", err);
      const errorMsg = err.message || err.response?.data?.detail || "Erro desconhecido ao calcular tensões";
      setError(errorMsg);
      toast({
        title: "Erro no Cálculo",
        description: errorMsg,
        variant: "destructive",
      });
    } finally {
      setIsCalculating(false);
      isCalculatingRef.current = false;
    }
  };

  const handleClear = () => {
    setCargaP("100");
    setPontos([]);
    setError(null);
    setCalculoFeito(false);
  };

  const handleEditCarga = () => {
    setNovaCarga(cargaP);
    setCargaDialogOpen(true);
  };

  const handleConfirmCarga = () => {
    const valor = parseFloat(novaCarga);
    if (isNaN(valor) || valor <= 0) {
      toast({
        title: "Erro",
        description: "Carga deve ser maior que 0",
        variant: "destructive",
      });
      return;
    }
    setCargaP(novaCarga);
    setCalculoFeito(false);
    setCargaDialogOpen(false);
    toast({
      title: "✅ Carga Definida!",
      description: `P = ${valor.toFixed(2)} kN`,
    });
  };

  const handleAddPonto = () => {
    setPontoEditando(null);
    setNovoPontoNome(`Ponto ${pontos.length + 1}`);
    setNovoPontoX("0");
    setNovoPontoZ("2");
    setPontoDialogOpen(true);
  };
  
  const handleToqueGrid = (x: number, z: number) => {
    setPontoEditando(null);
    setNovoPontoNome(`Ponto ${pontos.length + 1}`);
    setNovoPontoX(x.toFixed(1));
    setNovoPontoZ(z.toFixed(1));
    setPontoDialogOpen(true);
  };
  
  const handleToquePonto = (ponto: PontoAnalise) => {
    handleEditPonto(ponto);
  };

  const handleEditPonto = (ponto: PontoAnalise) => {
    setPontoEditando(ponto);
    setNovoPontoNome(ponto.nome);
    setNovoPontoX(ponto.x.toString());
    setNovoPontoZ(ponto.z.toString());
    setPontoDialogOpen(true);
  };

  const handleConfirmPonto = () => {
    const x = parseFloat(novoPontoX);
    const z = parseFloat(novoPontoZ);

    if (!novoPontoNome.trim()) {
      toast({
        title: "Erro",
        description: "Nome do ponto é obrigatório",
        variant: "destructive",
      });
      return;
    }

    if (isNaN(x) || isNaN(z)) {
      toast({
        title: "Erro",
        description: "Coordenadas X e Z devem ser números válidos",
        variant: "destructive",
      });
      return;
    }

    if (z <= 0) {
      toast({
        title: "Erro",
        description: "Profundidade Z deve ser maior que 0",
        variant: "destructive",
      });
      return;
    }

    if (pontoEditando) {
      // Editando ponto existente
      setPontos(prevPontos => prevPontos.map(p => 
        p.id === pontoEditando.id ? { ...p, nome: novoPontoNome, x, z, tensao: undefined } : p
      ));
      toast({
        title: "✅ Atualizado!",
        description: `"${novoPontoNome}" foi atualizado`,
      });
    } else {
      // Criando novo ponto
      const novoPonto: PontoAnalise = {
        id: generateId(),
        nome: novoPontoNome,
        x,
        z,
        tensao: undefined
      };
      setPontos(prevPontos => [...prevPontos, novoPonto]);
      toast({
        title: "✅ Ponto Adicionado!",
        description: `"${novoPontoNome}" foi adicionado`,
      });
    }

    setCalculoFeito(false);
    setPontoDialogOpen(false);
  };

  const handleDeletePonto = (id: string) => {
    const ponto = pontos.find(p => p.id === id);
    setPontos(prevPontos => prevPontos.filter(p => p.id !== id));
    setCalculoFeito(false);
    toast({
      title: "🗑️ Excluído!",
      description: `"${ponto?.nome}" foi removido`,
    });
  };

  const handleLoadExample = (example: ExemploBoussinesq) => {
    setCargaP(example.cargaP.toString());
    setPontos(example.pontos.map((p, idx) => ({
      id: generateId(),
      nome: p.nome,
      x: p.x,
      z: p.z,
      tensao: undefined,
    })));
    setCalculoFeito(false);
    setExamplesSheetOpen(false);
    toast({
      title: `${example.icon} ${example.nome}`,
      description: example.descricao,
    });
  };

  // Salvamento
  const handleSaveClick = () => {
    if (parseFloat(cargaP) <= 0 || pontos.length === 0) {
      toast({
        title: "Atenção",
        description: "Defina a carga e adicione pontos antes de salvar",
        variant: "destructive",
      });
      return;
    }
    setSaveName(`Boussinesq ${new Date().toLocaleDateString('pt-BR')}`);
    setSaveDialogOpen(true);
  };

  const handleConfirmSave = () => {
    if (!saveName.trim()) return;
    
    const dados = { cargaP: parseFloat(cargaP), pontos };
    const success = saveCalculation(saveName.trim(), dados, { pontos });
    if (success) {
      toast({
        title: "💾 Salvo!",
        description: "Análise salva com sucesso",
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
    const dados = calculation.formData;
    setCargaP(dados.cargaP.toString());
    setPontos(dados.pontos || []);
    setCalculoFeito(false);
    setLoadSheetOpen(false);
    toast({
      title: "📂 Carregado!",
      description: `"${calculation.name}" foi carregado`,
    });
  };

  // Exportação PDF
  const handleExportPDF = () => {
    if (parseFloat(cargaP) <= 0 || pontos.length === 0) {
      toast({
        title: "Atenção",
        description: "Não há dados para exportar",
        variant: "destructive",
      });
      return;
    }
    setPdfFileName(generateDefaultPDFFileName("Boussinesq"));
    setExportPDFDialogOpen(true);
  };

  const handleConfirmExportPDF = async () => {
    if (pontos.length === 0) {
      toast({
        title: "Atenção",
        description: "Não há resultados para exportar",
        variant: "destructive",
      });
      return;
    }

    setIsExportingPDF(true);

    try {
      const inputs: { label: string; value: string }[] = [
        { label: "Carga Pontual P", value: `${parseFloat(cargaP).toFixed(2)} kN` }
      ];

      const resultsList = pontos.map((p, i) => ({
        label: `${p.nome} (X=${p.x.toFixed(2)}m, Z=${p.z.toFixed(2)}m)`,
        value: p.tensao !== undefined ? `${formatNumberForExport(p.tensao, 4)} kPa` : "N/A",
        highlight: i === 0
      }));

      const exportData: ExportData = {
        moduleName: "boussinesq",
        moduleTitle: "Boussinesq - Acréscimo de Tensões",
        inputs,
        results: resultsList,
        customFileName: pdfFileName
      };

      toast({
        title: "Gerando PDF...",
        description: "Aguarde",
      });
      
      const success = await exportToPDF(exportData);
      
      if (success) {
        toast({
          title: "📄 PDF Exportado!",
          description: "Arquivo baixado com sucesso",
        });
        setExportPDFDialogOpen(false);
      } else {
        toast({
          title: "Erro",
          description: "Não foi possível gerar o PDF",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Erro ao exportar PDF:", error);
      toast({
        title: "Erro",
        description: "Erro ao exportar PDF",
        variant: "destructive",
      });
    } finally {
      setIsExportingPDF(false);
    }
  };

  const handleExportExcel = async () => {
    if (pontos.length === 0) {
      toast({
        title: "Atenção",
        description: "Não há resultados para exportar",
        variant: "destructive",
      });
      return;
    }

    const configData = [
      { label: "Carga P (kN)", value: parseFloat(cargaP) }
    ];

    const resultadosData = pontos.map(p => ({
      Nome: p.nome,
      "X (m)": p.x.toFixed(2),
      "Z (m)": p.z.toFixed(2),
      "Acréscimo de Tensão Vertical (kPa)": p.tensao !== undefined ? p.tensao.toFixed(settings.decimalPlaces) : "N/A"
    }));

    const excelData: ExcelExportData = {
      moduleName: "boussinesq",
      moduleTitle: "Boussinesq - Acréscimo de Tensões",
      sheets: [
        { name: "Configuração", data: configData },
        { name: "Resultados", data: resultadosData }
      ]
    };

    const success = await exportToExcel(excelData);
    if (success) {
      toast({
        title: "📊 Excel Exportado!",
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

  const fmt = (value: number | null | undefined) => {
    if (value === null || value === undefined) return "—";
    return formatNumber(value, settings);
  };

  const isFormValid = parseFloat(cargaP) > 0 && pontos.length > 0;
  const temResultados = pontos.some(p => p.tensao !== undefined);
  const pontosComTensao = pontos.filter(p => p.tensao !== undefined);
  const tensoes = pontosComTensao.map(p => p.tensao!);
  const tensaoMax = tensoes.length > 0 ? Math.max(...tensoes) : undefined;
  const tensaoMin = tensoes.length > 0 ? Math.min(...tensoes) : undefined;

  return (
    <div className="space-y-4 pb-4">
      {/* Header com Ações */}
      <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-4 rounded-xl border border-primary/20">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 shrink-0"
              onClick={() => navigate('/acrescimo-tensoes')}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center">
              <Target className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">Boussinesq</h2>
              <p className="text-xs text-muted-foreground">Carga Pontual</p>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9"
              onClick={() => setExamplesSheetOpen(true)}
            >
              <Lightbulb className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9"
              onClick={() => setLoadSheetOpen(true)}
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

      {/* Canvas Interativo */}
      <div className="-mx-4">
        <CanvasBoussinesqMobile
          pontos={pontos}
          cargaP={parseFloat(cargaP)}
          onEditCarga={handleEditCarga}
          onToquePonto={handleToquePonto}
          onToqueGrid={handleToqueGrid}
          calculoFeito={calculoFeito}
          decimalPlaces={settings.decimalPlaces}
        />
      </div>

      {/* Configuração da Carga */}
      <MobileSection
        title="Configuração da Carga"
        icon={<Target className="w-4 h-4" />}
        defaultOpen={false}
        collapsible
      >
        <MobileInputGroup
          label="Carga Pontual P"
          value={cargaP}
          onChange={(v) => {
            setCargaP(v);
            setCalculoFeito(false);
          }}
          placeholder="Ex: 100"
          unit="kN"
          required
          tooltip="Carga pontual aplicada na superfície (x=0, z=0)"
        />
      </MobileSection>

      {/* Pontos de Análise */}
      <MobileSection
        title="Gerenciar Pontos"
        icon={<Layers className="w-4 h-4" />}
        defaultOpen={false}
        collapsible
      >
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Badge variant="secondary" className="text-xs">
              {pontos.length} {pontos.length === 1 ? "ponto" : "pontos"}
            </Badge>
            <Button
              onClick={handleAddPonto}
              size="sm"
              className="h-8 gap-2"
            >
              <Plus className="w-4 h-4" />
              Adicionar Ponto
            </Button>
          </div>

          {pontos.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground border border-dashed rounded-lg">
              <BarChart3 className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Nenhum ponto adicionado</p>
              <p className="text-xs mt-1">Clique em "Adicionar Ponto"</p>
            </div>
          ) : (
            <div className="space-y-2">
              {pontos.map((ponto) => (
                <div
                  key={ponto.id}
                  className="border rounded-lg p-3 bg-card"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2 flex-1">
                      <div className={`w-2 h-2 rounded-full ${ponto.tensao !== undefined ? 'bg-primary animate-pulse' : 'bg-muted-foreground'}`}></div>
                      <h4 className="font-semibold text-sm">{ponto.nome}</h4>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => handleEditPonto(ponto)}
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-red-600"
                        onClick={() => handleDeletePonto(ponto.id)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-xs mb-2">
                    <div className="p-2 rounded bg-muted/30">
                      <span className="text-muted-foreground block mb-0.5 text-[10px]">X (horizontal)</span>
                      <span className="font-mono font-semibold text-foreground">{ponto.x.toFixed(2)} m</span>
                    </div>
                    <div className="p-2 rounded bg-muted/30">
                      <span className="text-muted-foreground block mb-0.5 text-[10px]">Z (profundidade)</span>
                      <span className="font-mono font-semibold text-foreground">{ponto.z.toFixed(2)} m</span>
                    </div>
                  </div>
                  
                  {ponto.tensao !== undefined && (
                    <div className="pt-2 border-t">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-muted-foreground font-medium">Δσz:</span>
                        <Badge variant="default" className="text-xs bg-gradient-to-r from-blue-600 to-cyan-600">
                          {fmt(ponto.tensao)} kPa
                        </Badge>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full transition-all"
                          style={{ 
                            width: tensaoMax ? `${(ponto.tensao / tensaoMax) * 100}%` : '0%' 
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </MobileSection>

      {/* Botões de Cálculo */}
      <div className="grid grid-cols-2 gap-3">
        <Button
          onClick={handleCalculate}
          disabled={isCalculating || !isFormValid}
          className="h-12 text-base"
          size="lg"
        >
          {isCalculating ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              Calculando...
            </>
          ) : (
            <>
              <Calculator className="w-5 h-5 mr-2" />
              Calcular
            </>
          )}
        </Button>

        <Button
          onClick={handleClear}
          variant="outline"
          className="h-12"
          size="lg"
        >
          Limpar
        </Button>
      </div>

      {/* Resultados */}
      {temResultados && (
        <>
          {/* Ações de Exportação */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSaveClick}
              className="flex-1 gap-2"
            >
              <Save className="w-4 h-4" />
              Salvar
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportPDF}
              className="flex-1 gap-2"
            >
              <Download className="w-4 h-4" />
              PDF
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportExcel}
              className="flex-1 gap-2"
            >
              <FileSpreadsheet className="w-4 h-4" />
              Excel
            </Button>
          </div>

          {/* Resumo dos Resultados */}
          <div className="p-4 rounded-lg bg-gradient-to-br from-muted/50 to-muted/30 border border-muted space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Resumo da Análise</p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Pontos analisados:</span>
                <span className="font-bold">{pontosComTensao.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Carga P:</span>
                <span className="font-bold">{parseFloat(cargaP).toFixed(1)} kN</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Δσz máx:</span>
                <span className="font-bold text-red-600 dark:text-red-400">{fmt(tensaoMax)} kPa</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Δσz mín:</span>
                <span className="font-bold text-green-600 dark:text-green-400">{fmt(tensaoMin)} kPa</span>
              </div>
            </div>
          </div>

          {/* Tabela de Resultados */}
          <MobileSection
            title="Resultados Detalhados"
            icon={<TableIcon className="w-4 h-4" />}
            defaultOpen={true}
          >
            <div className="rounded-lg border overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50 hover:bg-muted/50">
                      <TableHead className="text-center font-bold text-xs py-2">Ponto</TableHead>
                      <TableHead className="text-center font-bold text-xs py-2">X (m)</TableHead>
                      <TableHead className="text-center font-bold text-xs py-2">Z (m)</TableHead>
                      <TableHead className="text-center font-bold text-xs py-2 bg-primary/10">Δσz (kPa)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pontos.map((ponto) => (
                      <TableRow key={ponto.id} className="hover:bg-muted/20">
                        <TableCell className="text-center font-semibold text-xs py-2">
                          <div className="flex items-center justify-center gap-1.5">
                            <div className={`w-1.5 h-1.5 rounded-full ${ponto.tensao !== undefined ? 'bg-primary' : 'bg-muted-foreground'}`}></div>
                            {ponto.nome}
                          </div>
                        </TableCell>
                        <TableCell className="text-center text-xs py-2 font-mono">{ponto.x.toFixed(2)}</TableCell>
                        <TableCell className="text-center text-xs py-2 font-mono">{ponto.z.toFixed(2)}</TableCell>
                        <TableCell className="text-center font-bold text-xs py-2 bg-primary/5">
                          {ponto.tensao !== undefined ? (
                            <span className="text-primary">{fmt(ponto.tensao)}</span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </MobileSection>
        </>
      )}

      {/* Sheet de Exemplos */}
      <Sheet open={examplesSheetOpen} onOpenChange={setExamplesSheetOpen}>
        <SheetContent side="bottom" className="h-[70vh] rounded-t-2xl">
          <SheetHeader>
            <SheetTitle>Exemplos de Análises</SheetTitle>
          </SheetHeader>
          <div className="mt-6 space-y-3 overflow-y-auto max-h-[calc(70vh-100px)]">
            {exemplos.map((example, idx) => (
              <button
                key={`${example.nome}-${idx}`}
                onClick={() => handleLoadExample(example)}
                className="w-full p-4 rounded-xl bg-secondary/50 hover:bg-secondary border-2 border-transparent hover:border-primary/20 transition-all active:scale-95 text-left focus-visible:outline-none [-webkit-tap-highlight-color:transparent]"
              >
                <div className="flex items-start gap-3">
                  <div className="text-2xl">{example.icon}</div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-foreground">{example.nome}</h4>
                    <p className="text-xs text-muted-foreground mt-1">{example.descricao}</p>
                    <div className="flex gap-3 mt-2 text-xs text-muted-foreground">
                      <span>📊 {example.pontos.length} pontos</span>
                      <span>⚡ P = {example.cargaP} kN</span>
                    </div>
                  </div>
                </div>
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
              <div className="text-center py-8 text-muted-foreground">
                <FolderOpen className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Nenhum cálculo salvo</p>
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
                  <p className="text-xs text-muted-foreground mb-3">
                    P = {calc.formData?.cargaP || 0} kN | {calc.formData?.pontos?.length || 0} pontos
                  </p>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 h-9"
                      onClick={() => handleLoadCalculation(calc)}
                    >
                      Carregar
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      className="h-9"
                      onClick={() => {
                        deleteCalculation(calc.id);
                        toast({
                          title: "🗑️ Excluído!",
                          description: "Cálculo removido",
                        });
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Dialog de Adicionar/Editar Ponto */}
      <Dialog open={pontoDialogOpen} onOpenChange={setPontoDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{pontoEditando ? "Editar Ponto" : "Adicionar Ponto"}</DialogTitle>
            <DialogDescription>
              Defina as coordenadas do ponto de análise
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Nome do Ponto</label>
              <Input
                value={novoPontoNome}
                onChange={(e) => setNovoPontoNome(e.target.value)}
                placeholder="Ex: Ponto A"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium mb-1.5 block">X (horizontal) <span className="text-xs text-muted-foreground">[m]</span></label>
                <Input
                  type="number"
                  step="0.1"
                  value={novoPontoX}
                  onChange={(e) => setNovoPontoX(e.target.value)}
                  placeholder="0.0"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Z (profundidade) <span className="text-xs text-muted-foreground">[m]</span></label>
                <Input
                  type="number"
                  step="0.1"
                  value={novoPontoZ}
                  onChange={(e) => setNovoPontoZ(e.target.value)}
                  placeholder="2.0"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPontoDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleConfirmPonto}>
              {pontoEditando ? "Atualizar" : "Adicionar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Editar Carga */}
      <Dialog open={cargaDialogOpen} onOpenChange={setCargaDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Definir Carga Pontual</DialogTitle>
            <DialogDescription>
              Informe o valor da carga pontual P aplicada na superfície
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <label className="text-sm font-medium mb-1.5 block">Carga P <span className="text-xs text-muted-foreground">[kN]</span></label>
            <Input
              type="number"
              step="10"
              value={novaCarga}
              onChange={(e) => setNovaCarga(e.target.value)}
              placeholder="100"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleConfirmCarga();
              }}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCargaDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleConfirmCarga}>
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Salvar */}
      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Salvar Análise</DialogTitle>
            <DialogDescription>
              Dê um nome para esta análise Boussinesq
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
              placeholder="Ex: Boussinesq - Obra X"
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
    </div>
  );
}

