import { useState, useEffect, useRef } from "react";
import { ArrowLeft, Target, BookOpen, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/sonner";
import PrintHeader from "@/components/PrintHeader";
import CanvasBoussinesq from "./CanvasBoussinesq";
import PainelResultados, { PontoAnalise } from "./PainelResultados";
import CargaPopup from "./CargaPopup";
import PontoAnalisePopup from "./PontoAnalisePopup";
import CalculationActions from "@/components/CalculationActions";
import SaveDialog from "@/components/SaveDialog";
import SavedCalculations from "@/components/SavedCalculations";
import { useSavedCalculations } from "@/hooks/use-saved-calculations";
import { exportToPDF, exportToExcel, ExportData, ExcelExportData, formatNumberForExport } from "@/lib/export-utils";
import { useSettings } from "@/hooks/use-settings";
import { useTheme } from "@/hooks/use-theme";
import { calcularAcrescimoTensoes } from "@/lib/calculations/acrescimo-tensoes";

interface BoussinesqAnaliseProps {
  onVoltar: () => void;
  onLoadExampleRef?: React.MutableRefObject<(() => void) | null>;
}

// Função para gerar IDs únicos (alternativa ao crypto.randomUUID para compatibilidade)
const generateId = () => `${Date.now()}-${Math.floor(Math.random() * 1000000)}`;

export default function BoussinesqAnalise({ onVoltar, onLoadExampleRef }: BoussinesqAnaliseProps) {
  // Configurações
  const { settings } = useSettings();
  const { theme } = useTheme();

  // Estado principal
  const [pontos, setPontos] = useState<PontoAnalise[]>([]);
  const [cargaP, setCargaP] = useState<number | undefined>(100); // Valor padrão: 100 kN
  const [isCalculating, setIsCalculating] = useState(false);
  const [calculoFeito, setCalculoFeito] = useState(false);

  // Estado dos popups
  const [cargaPopupOpen, setCargaPopupOpen] = useState(false);
  const [pontoPopupOpen, setPontoPopupOpen] = useState(false);
  const [pontoPopupCoords, setPontoPopupCoords] = useState({ x: 0, z: 0.5 });
  const [pontoEditando, setPontoEditando] = useState<PontoAnalise | null>(null);
  const [nomePadraoNovoPonto, setNomePadraoNovoPonto] = useState("");

  // Save/Load
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [saveName, setSaveName] = useState("");
  const [loadDialogOpen, setLoadDialogOpen] = useState(false);
  const { calculations, saveCalculation, deleteCalculation, renameCalculation } = useSavedCalculations("boussinesq");

  // Ref para evitar cálculos duplicados
  const isCalculatingRef = useRef(false);

  // Função para calcular tensões (chamada explicitamente)
  const calcularTensoes = async () => {
    // Só calcula se houver carga definida e pontos
    if (!cargaP || cargaP <= 0 || pontos.length === 0) {
      return;
    }

    // Evita cálculos duplicados
    if (isCalculatingRef.current) {
      return;
    }

    isCalculatingRef.current = true;
    setIsCalculating(true);

    try {
      // Captura os pontos atuais no momento do cálculo
      const pontosParaCalcular = [...pontos];
      const resultadosMap = new Map<string, number | undefined>();

      for (const ponto of pontosParaCalcular) {
        try {
          const resultado = calcularAcrescimoTensoes({
            tipo_carga: "pontual",
            carga_pontual: {
              P: cargaP,
              x: 0,
              y: 0
            },
            ponto_interesse: {
              x: ponto.x,
              y: 0, // Boussinesq é 2D (apenas X-Z)
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

      // Atualiza apenas as tensões dos pontos que foram calculados,
      // sem sobrescrever o array completo
      setPontos(prevPontos =>
        prevPontos.map(p => {
          const tensao = resultadosMap.get(p.id);
          // Se o ponto foi calculado, atualiza a tensão
          if (resultadosMap.has(p.id)) {
            return { ...p, tensao };
          }
          // Se o ponto é novo (não estava no cálculo), mantém como está
          return p;
        })
      );
      setCalculoFeito(true);
    } catch (error) {
      console.error("Erro ao calcular tensões:", error);
    } finally {
      setIsCalculating(false);
      isCalculatingRef.current = false;
    }
  };

  // Handlers de duplo clique
  const handleDuploCliqueCarga = () => {
    setCargaPopupOpen(true);
  };

  const handleDuploCliqueGrid = (x: number, z: number) => {
    setPontoPopupCoords({ x, z });
    setPontoEditando(null);
    // Gera um nome padrão baseado no número de pontos
    const numeroPonto = pontos.length + 1;
    const nomePadrao = `Ponto ${numeroPonto}`;
    setNomePadraoNovoPonto(nomePadrao);
    setPontoPopupOpen(true);
  };

  const handleDuploCliquePonto = (ponto: PontoAnalise) => {
    setPontoEditando(ponto);
    setPontoPopupCoords({ x: ponto.x, z: ponto.z });
    setPontoPopupOpen(true);
  };

  // Handlers de confirmação de popups
  const handleConfirmarCarga = (valor: number) => {
    setCargaP(valor);
    toast("Carga definida!", { description: `P = ${valor.toFixed(2)} kN` });
    // Limpa as tensões calculadas (precisam ser recalculadas)
    setPontos(prevPontos => prevPontos.map(p => ({ ...p, tensao: undefined })));
    setCalculoFeito(false);
  };

  const handleConfirmarPonto = (nome: string, x: number, y: number, z: number) => {
    // y é ignorado pois Boussinesq é 2D (apenas X-Z)
    if (pontoEditando) {
      // Editando ponto existente
      setPontos(prevPontos => prevPontos.map(p =>
        p.id === pontoEditando.id ? { ...p, nome, x, z, tensao: undefined } : p
      ));
      toast("Ponto atualizado!", { description: `"${nome}" foi atualizado.` });
      setCalculoFeito(false);
    } else {
      // Criando novo ponto
      const novoPonto: PontoAnalise = {
        id: generateId(),
        nome,
        x,
        z,
        tensao: undefined
      };
      setPontos(prevPontos => [...prevPontos, novoPonto]);
      toast("Ponto criado!", { description: `"${nome}" foi adicionado ao canvas.` });
    }
  };

  // Handler de movimentação de ponto (enquanto arrasta)
  const handleMovimentarPonto = (id: string, x: number, z: number) => {
    setPontos(prevPontos => prevPontos.map(p =>
      p.id === id ? { ...p, x, z, tensao: undefined } : p
    ));
    setCalculoFeito(false);
  };

  // Handler quando solta o ponto (após arrastar)
  const handlePontoSolto = (id: string) => {
    // Marca que precisa recalcular
    setCalculoFeito(false);
  };


  // Handlers de exportação
  const handleExportarPDF = async () => {
    if (!cargaP || pontos.length === 0) return;

    const inputs = [
      { label: "Carga Pontual P", value: `${cargaP.toFixed(2)} kN` }
    ];

    const resultsList = pontos.map((p, i) => ({
      label: `${p.nome} (X=${p.x.toFixed(2)}m, Z=${p.z.toFixed(2)}m)`,
      value: p.tensao !== undefined ? `${formatNumberForExport(p.tensao, 4)} kPa` : "N/A",
      highlight: i === 0
    }));

    // Fórmulas utilizadas
    const formulas = [
      {
        label: "Equação de Boussinesq",
        formula: "Δσz = (3P / 2π) × (z³ / R⁵)",
        description: "Acréscimo de tensão vertical em um ponto devido a uma carga pontual vertical P"
      },
      {
        label: "Distância Radial (R)",
        formula: "R = √(x² + z²)",
        description: "Distância do ponto de aplicação da carga até o ponto de análise"
      },
      {
        label: "Aplicabilidade",
        formula: "Válida para meio semi-infinito, homogêneo, isotrópico e elástico linear",
        description: "Solução fundamental da elasticidade para carga pontual na superfície"
      },
    ];

    const exportData: ExportData = {
      moduleName: "boussinesq",
      moduleTitle: "Boussinesq - Acréscimo de Tensões",
      inputs,
      results: resultsList,
      formulas,
      theme: { mode: theme.mode, color: (theme as any).color || 'indigo' },
      printSettings: settings.printSettings
    };

    toast("Gerando PDF...");
    const success = await exportToPDF(exportData);
    if (success) {
      toast("PDF exportado!", { description: "O arquivo foi baixado com sucesso." });
    } else {
      toast("Erro ao exportar", { description: "Não foi possível gerar o PDF." });
    }
  };

  const handleExportarExcel = async () => {
    if (!cargaP || pontos.length === 0) return;

    const configData = [
      { label: "Carga P (kN)", value: cargaP }
    ];

    const resultadosData: { label: string; value: string | number }[] = [];
    pontos.forEach((p, idx) => {
      resultadosData.push({ label: `=== Ponto ${idx + 1}: ${p.nome} ===`, value: "" });
      resultadosData.push({ label: "X (m)", value: p.x.toFixed(2) });
      resultadosData.push({ label: "Z (m)", value: p.z.toFixed(2) });
      resultadosData.push({ label: "Δσv (kPa)", value: p.tensao !== undefined ? p.tensao.toFixed(settings.decimalPlaces) : "N/A" });
      resultadosData.push({ label: "", value: "" }); // Espaçamento
    });

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
      toast("Excel exportado!", { description: "O arquivo foi baixado com sucesso." });
    } else {
      toast("Erro ao exportar", { description: "Não foi possível gerar o Excel." });
    }
  };

  // Handlers de salvar/carregar
  const handleSaveClick = () => {
    if (!cargaP || pontos.length === 0) {
      toast("Nada para salvar", { description: "Defina a carga e adicione pontos antes de salvar." });
      return;
    }
    setSaveName(`Boussinesq ${new Date().toLocaleDateString('pt-BR')}`);
    setSaveDialogOpen(true);
  };

  const handleConfirmSave = () => {
    if (!saveName.trim()) return;
    const dados = { cargaP, pontos };
    const success = saveCalculation(saveName.trim(), dados, { pontos });
    if (success) {
      toast("Cálculo salvo!", { description: "O cálculo foi salvo com sucesso." });
      setSaveDialogOpen(false);
      setSaveName("");
    } else {
      toast("Erro ao salvar", { description: "Não foi possível salvar o cálculo." });
    }
  };

  const handleLoadCalculation = (calculation: any) => {
    const dados = calculation.formData;
    setCargaP(dados.cargaP);
    setPontos(dados.pontos || []);
    setCalculoFeito(false); // Precisa recalcular
    toast("Cálculo carregado!", { description: `"${calculation.name}" foi carregado com sucesso.` });
  };

  const handleExcluirPonto = (id?: string) => {
    // Se um ID for passado, exclui esse ponto específico
    if (id) {
      const ponto = pontos.find(p => p.id === id);
      setPontos(prevPontos => prevPontos.filter(p => p.id !== id));
      setCalculoFeito(false);
      toast("Ponto excluído!", { description: `"${ponto?.nome || 'Ponto'}" foi removido.` });
    }
    // Se não for passado ID, usa o pontoEditando (para quando clicar no botão Excluir do popup)
    else if (pontoEditando) {
      setPontos(prevPontos => prevPontos.filter(p => p.id !== pontoEditando.id));
      toast("Ponto excluído!", { description: `"${pontoEditando.nome}" foi removido.` });
    }
  };

  const handleCarregarExemplos = () => {
    setCargaP(1500);
    setPontos([
      { id: 'exemplo-a', nome: 'Ponto A', x: -3, z: 2, tensao: undefined },
      { id: 'exemplo-b', nome: 'Ponto B', x: 0, z: 4, tensao: undefined },
      { id: 'exemplo-c', nome: 'Ponto C', x: 4, z: 5, tensao: undefined }
    ]);
    setCalculoFeito(false);
    toast("Exemplo carregado!", { description: "3 pontos de análise prontos." });
  };

  // Expor função de carregar exemplo para o tour
  useEffect(() => {
    if (onLoadExampleRef) {
      onLoadExampleRef.current = handleCarregarExemplos;
    }
  }, [onLoadExampleRef]);

  const temResultados = pontos.some(p => p.tensao !== undefined);

  return (
    <div className="space-y-4 max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8">
      <PrintHeader moduleTitle="Boussinesq - Carga Pontual" moduleName="boussinesq" />

      {/* Header */}
      <div className="flex items-center justify-between gap-3" data-tour="header">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={onVoltar}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center shadow-lg">
            <Target className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Boussinesq - Carga Pontual</h1>
            <p className="text-sm text-muted-foreground hidden sm:block">
              Análise interativa de acréscimo de tensões por carga pontual
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">

          <Button variant="outline" size="sm" onClick={handleCarregarExemplos}>
            <BookOpen className="w-4 h-4 mr-2" />
            Exemplos
          </Button>
          <div data-tour="actions">
            <CalculationActions
              onSave={handleSaveClick}
              onLoad={() => setLoadDialogOpen(true)}
              onExportPDF={handleExportarPDF}
              onExportExcel={handleExportarExcel}
              hasResults={temResultados}
              isCalculating={isCalculating}
            />
          </div>
        </div>
      </div>

      {/* Layout Grid */}
      <div className="grid lg:grid-cols-[1fr_400px] gap-4">
        {/* Canvas */}
        <CanvasBoussinesq
          pontos={pontos}
          cargaP={cargaP}
          onDuploCliqueCarga={handleDuploCliqueCarga}
          onDuploCliqueGrid={handleDuploCliqueGrid}
          onDuploCliquePonto={handleDuploCliquePonto}
          onMovimentarPonto={handleMovimentarPonto}
          onPontoSolto={handlePontoSolto}
          calculoFeito={calculoFeito}
          decimalPlaces={settings.decimalPlaces}
        />

        {/* Painel de Resultados */}
        <PainelResultados
          pontos={pontos}
          cargaP={cargaP}
          isCalculating={isCalculating}
          onExcluirPonto={handleExcluirPonto}
          onCalcular={calcularTensoes}
          decimalPlaces={settings.decimalPlaces}
        />
      </div>

      {/* Popups */}
      <CargaPopup
        open={cargaPopupOpen}
        onOpenChange={setCargaPopupOpen}
        valorInicial={cargaP}
        onConfirm={handleConfirmarCarga}
      />

      <PontoAnalisePopup
        open={pontoPopupOpen}
        onOpenChange={setPontoPopupOpen}
        coordenadas={pontoPopupCoords}
        nomeInicial={pontoEditando?.nome || nomePadraoNovoPonto}
        isEdicao={pontoEditando !== null}
        mostrarY={false}
        onConfirm={handleConfirmarPonto}
        onExcluir={pontoEditando ? handleExcluirPonto : undefined}
      />

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
        moduleName="Boussinesq"
      />
    </div>
  );
}
