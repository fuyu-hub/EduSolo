import { useState, useRef } from "react";
import { ArrowLeft, Square, BookOpen, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import axios from "axios";
import PrintHeader from "@/components/PrintHeader";
import CanvasNewmark from "./CanvasNewmark";
import PainelResultados, { PontoAnalise } from "./PainelResultados";
import CargaRetangularPopup from "./CargaRetangularPopup";
import PontoAnalisePopup from "./PontoAnalisePopup";
import CalculationActions from "@/components/CalculationActions";
import SaveDialog from "@/components/SaveDialog";
import SavedCalculations from "@/components/SavedCalculations";
import { useSavedCalculations } from "@/hooks/use-saved-calculations";
import { exportToPDF, exportToExcel, ExportData, ExcelExportData, formatNumberForExport } from "@/lib/export-utils";
import { useSettings } from "@/hooks/use-settings";
import DialogExemplosNewmark from "./DialogExemplosNewmark";
import DialogConfiguracoesNewmark from "./DialogConfiguracoesNewmark";

interface NewmarkAnaliseProps {
  onVoltar: () => void;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export default function NewmarkAnalise({ onVoltar }: NewmarkAnaliseProps) {
  // Configurações
  const { settings } = useSettings();
  
  // Estado principal
  const [pontos, setPontos] = useState<PontoAnalise[]>([]);
  const [largura, setLargura] = useState<number | undefined>(3);
  const [comprimento, setComprimento] = useState<number | undefined>(2);
  const [intensidade, setIntensidade] = useState<number | undefined>(100);
  const [nomeSapata, setNomeSapata] = useState<string>("Sapata 1");
  const [usarAbaco, setUsarAbaco] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  const [calculoFeito, setCalculoFeito] = useState(false);
  
  // Estado dos popups
  const [cargaPopupOpen, setCargaPopupOpen] = useState(false);
  const [pontoPopupOpen, setPontoPopupOpen] = useState(false);
  const [pontoPopupCoords, setPontoPopupCoords] = useState({ x: 0, y: 0, z: 0 });
  const [pontoEditando, setPontoEditando] = useState<PontoAnalise | null>(null);
  const [nomePadraoNovoPonto, setNomePadraoNovoPonto] = useState("");
  const [exemplosDialogOpen, setExemplosDialogOpen] = useState(false);
  const [configuracoesDialogOpen, setConfiguracoesDialogOpen] = useState(false);
  
  // Save/Load
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [saveName, setSaveName] = useState("");
  const [loadDialogOpen, setLoadDialogOpen] = useState(false);
  const { calculations, saveCalculation, deleteCalculation, renameCalculation } = useSavedCalculations("newmark");

  // Ref para evitar cálculos duplicados
  const isCalculatingRef = useRef(false);

  // Função para calcular tensões (chamada explicitamente)
  const calcularTensoes = async () => {
    // Só calcula se houver carga definida e pontos
    if (!largura || largura <= 0 || !comprimento || comprimento <= 0 || !intensidade || intensidade <= 0 || pontos.length === 0) {
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
      const resultadosMap = new Map<string, { tensao?: number; detalhes?: any }>();

      for (const ponto of pontosParaCalcular) {
        try {
          const response = await axios.post(`${API_URL}/calcular/acrescimo-tensoes`, {
            tipo_carga: "retangular",
            carga_retangular: {
              largura: largura,
              comprimento: comprimento,
              intensidade: intensidade,
              centro_x: 0,
              centro_y: 0
            },
            ponto_interesse: {
              x: ponto.x,
              y: ponto.y,
              z: ponto.z
            },
            usar_abaco_newmark: usarAbaco
          });

          if (response.data.erro) {
            resultadosMap.set(ponto.id, { tensao: undefined });
          } else {
            resultadosMap.set(ponto.id, {
              tensao: response.data.delta_sigma_v,
              detalhes: response.data.detalhes
            });
          }
        } catch (error) {
          console.error(`Erro ao calcular ponto ${ponto.nome}:`, error);
          resultadosMap.set(ponto.id, { tensao: undefined });
        }
      }

      // Atualiza as tensões e detalhes dos pontos que foram calculados
      setPontos(prevPontos => 
        prevPontos.map(p => {
          const resultado = resultadosMap.get(p.id);
          if (resultado) {
            return { ...p, tensao: resultado.tensao, detalhes: resultado.detalhes };
          }
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

  const handleDuploCliqueGrid = (x: number, y: number, z: number) => {
    setPontoPopupCoords({ x, y, z });
    setPontoEditando(null);
    const numeroPonto = pontos.length + 1;
    const nomePadrao = `Ponto ${numeroPonto}`;
    setNomePadraoNovoPonto(nomePadrao);
    setPontoPopupOpen(true);
  };

  const handleDuploCliquePonto = (ponto: PontoAnalise) => {
    setPontoEditando(ponto);
    setPontoPopupCoords({ x: ponto.x, y: ponto.y, z: ponto.z });
    setPontoPopupOpen(true);
  };

  // Handlers de confirmação de popups
  const handleConfirmarCarga = (dados: { largura: number; comprimento: number; intensidade: number; nomeSapata: string }) => {
    setLargura(dados.largura);
    setComprimento(dados.comprimento);
    setIntensidade(dados.intensidade);
    setNomeSapata(dados.nomeSapata);
    toast("Carga definida!", { description: `${dados.nomeSapata}: L = ${dados.largura.toFixed(2)} m, C = ${dados.comprimento.toFixed(2)} m, p = ${dados.intensidade.toFixed(2)} kPa` });
    // Limpa as tensões calculadas
    setPontos(prevPontos => prevPontos.map(p => ({ ...p, tensao: undefined })));
    setCalculoFeito(false);
  };

  const handleConfirmarPonto = (nome: string, x: number, y: number, z: number) => {
    if (pontoEditando) {
      setPontos(prevPontos => prevPontos.map(p => 
        p.id === pontoEditando.id ? { ...p, nome, x, y, z, tensao: undefined } : p
      ));
      toast("Ponto atualizado!", { description: `"${nome}" foi atualizado.` });
      setCalculoFeito(false);
    } else {
      const novoPonto: PontoAnalise = {
        id: crypto.randomUUID(),
        nome,
        x,
        y,
        z,
        tensao: undefined
      };
      setPontos(prevPontos => [...prevPontos, novoPonto]);
      toast("Ponto criado!", { description: `"${nome}" foi adicionado ao canvas.` });
    }
  };

  // Handler de movimentação de ponto
  const handleMovimentarPonto = (id: string, x: number, y: number, z: number) => {
    setPontos(prevPontos => prevPontos.map(p => 
      p.id === id ? { ...p, x, y, z, tensao: undefined } : p
    ));
    setCalculoFeito(false);
  };

  const handlePontoSolto = (id: string) => {
    setCalculoFeito(false);
  };

  // Handlers de exportação
  const handleExportarPDF = async () => {
    if (!largura || !comprimento || !intensidade || pontos.length === 0) return;

    const metodo = usarAbaco ? "Ábaco" : "Fórmula";

    const inputs = [
      { label: "Largura (B)", value: `${largura.toFixed(2)} m` },
      { label: "Comprimento (L)", value: `${comprimento.toFixed(2)} m` },
      { label: "Intensidade (p)", value: `${intensidade.toFixed(2)} kPa` },
      { label: "Método de Cálculo", value: metodo }
    ];

    const resultsList = pontos.map((p, i) => ({
      label: `${p.nome} (X=${p.x.toFixed(2)}m, Y=${p.y !== undefined ? p.y.toFixed(2) : '0.00'}m, Z=${p.z.toFixed(2)}m)`,
      value: p.tensao !== undefined ? `${formatNumberForExport(p.tensao, 4)} kPa` : "N/A",
      highlight: i === 0
    }));

    // Calcular resumo
    const pontosComTensao = pontos.filter(p => p.tensao !== undefined);
    const tensoes = pontosComTensao.map(p => p.tensao!);
    const tensaoMax = tensoes.length > 0 ? Math.max(...tensoes) : undefined;
    const tensaoMin = tensoes.length > 0 ? Math.min(...tensoes) : undefined;
    const pontoMaxTensao = pontosComTensao.find(p => p.tensao === tensaoMax);
    const pontoMinTensao = pontosComTensao.find(p => p.tensao === tensaoMin);

    const summary = tensaoMax !== undefined && tensaoMin !== undefined ? [
      { label: "Pontos Analisados", value: pontosComTensao.length.toString() },
      { label: "Δσz Máximo", value: `${tensaoMax.toFixed(settings.decimalPlaces)} kPa` },
      { label: "Δσz Mínimo", value: `${tensaoMin.toFixed(settings.decimalPlaces)} kPa` },
      { 
        label: "Ponto de Máx", 
        value: pontoMaxTensao ? `${pontoMaxTensao.nome} (X=${pontoMaxTensao.x.toFixed(2)}m, Y=${pontoMaxTensao.y !== undefined ? pontoMaxTensao.y.toFixed(2) : '0.00'}m, Z=${pontoMaxTensao.z.toFixed(2)}m)` : "-"
      },
      { 
        label: "Ponto de Mín", 
        value: pontoMinTensao ? `${pontoMinTensao.nome} (X=${pontoMinTensao.x.toFixed(2)}m, Y=${pontoMinTensao.y !== undefined ? pontoMinTensao.y.toFixed(2) : '0.00'}m, Z=${pontoMinTensao.z.toFixed(2)}m)` : "-"
      }
    ] : undefined;

    const exportData: ExportData = {
      moduleName: "newmark",
      moduleTitle: `Newmark - Acréscimo de Tensões (Carga Retangular - ${metodo})`,
      inputs,
      results: resultsList,
      summary
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
    if (!largura || !comprimento || !intensidade || pontos.length === 0) return;

    const metodo = usarAbaco ? "Ábaco" : "Fórmula";

    const configData = [
      { label: "Largura B (m)", value: largura },
      { label: "Comprimento L (m)", value: comprimento },
      { label: "Intensidade p (kPa)", value: intensidade },
      { label: "Método", value: metodo }
    ];

    const resultadosData = pontos.map(p => ({
      Nome: p.nome,
      "X (m)": p.x.toFixed(2),
      "Y (m)": p.y !== undefined ? p.y.toFixed(2) : "0.00",
      "Z (m)": p.z.toFixed(2),
      "Δσv (kPa)": p.tensao !== undefined ? p.tensao.toFixed(settings.decimalPlaces) : "N/A"
    }));

    const excelData: ExcelExportData = {
      moduleName: "newmark",
      moduleTitle: `Newmark - Acréscimo de Tensões (Carga Retangular - ${metodo})`,
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
    if (!largura || !comprimento || !intensidade || pontos.length === 0) {
      toast("Nada para salvar", { description: "Defina a carga e adicione pontos antes de salvar." });
      return;
    }
    setSaveName(`Newmark ${new Date().toLocaleDateString('pt-BR')}`);
    setSaveDialogOpen(true);
  };

  const handleConfirmSave = () => {
    if (!saveName.trim()) return;
    const dados = { largura, comprimento, intensidade, usarAbaco, pontos };
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
    setLargura(dados.largura);
    setComprimento(dados.comprimento);
    setIntensidade(dados.intensidade);
    setUsarAbaco(dados.usarAbaco || false);
    setPontos(dados.pontos || []);
    setCalculoFeito(false);
    toast("Cálculo carregado!", { description: `"${calculation.name}" foi carregado com sucesso.` });
  };

  const handleExcluirPonto = (id?: string) => {
    if (id) {
      const ponto = pontos.find(p => p.id === id);
      setPontos(prevPontos => prevPontos.filter(p => p.id !== id));
      setCalculoFeito(false);
      toast("Ponto excluído!", { description: `"${ponto?.nome || 'Ponto'}" foi removido.` });
    } else if (pontoEditando) {
      setPontos(prevPontos => prevPontos.filter(p => p.id !== pontoEditando.id));
      toast("Ponto excluído!", { description: `"${pontoEditando.nome}" foi removido.` });
    }
  };

  const handleCarregarExemplo = (exemplo: any) => {
    setLargura(exemplo.largura);
    setComprimento(exemplo.comprimento);
    setIntensidade(exemplo.intensidade);
    
    const novosPontos = exemplo.pontos.map((p: any, idx: number) => ({
      id: `exemplo-${idx}`,
      nome: p.nome,
      x: p.x,
      y: p.y,
      z: p.z,
      tensao: undefined,
    }));
    
    setPontos(novosPontos);
    setCalculoFeito(false);
    setExemplosDialogOpen(false);
    toast("Exemplo carregado!", { description: exemplo.titulo });
  };

  const handleToggleMetodo = (usar: boolean) => {
    setUsarAbaco(usar);
    setPontos(prevPontos => prevPontos.map(p => ({ ...p, tensao: undefined })));
    setCalculoFeito(false);
    toast("Método alterado", { description: usar ? "Usando Ábaco" : "Usando Fórmula" });
  };

  const temResultados = pontos.some(p => p.tensao !== undefined);

  return (
    <div className="space-y-4 max-w-[1800px] mx-auto">
      <PrintHeader moduleTitle="Newmark - Carga Retangular" moduleName="newmark" />

      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={onVoltar}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center shadow-lg">
            <Square className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Newmark - Carga Retangular</h1>
            <p className="text-sm text-muted-foreground hidden sm:block">
              Análise interativa de acréscimo de tensões por carga retangular
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setConfiguracoesDialogOpen(true)}>
            <Settings className="w-4 h-4 mr-2" />
            Configurações
          </Button>
          <Button variant="outline" size="sm" onClick={() => setExemplosDialogOpen(true)}>
            <BookOpen className="w-4 h-4 mr-2" />
            Exemplos
          </Button>
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

      {/* Layout Grid */}
      <div className="grid lg:grid-cols-[1fr_400px] gap-4">
        {/* Canvas */}
        <CanvasNewmark
          pontos={pontos}
          largura={largura}
          comprimento={comprimento}
          intensidade={intensidade}
          nomeSapata={nomeSapata}
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
          largura={largura}
          comprimento={comprimento}
          intensidade={intensidade}
          tipoAnalise="newmark"
          isCalculating={isCalculating}
          onExcluirPonto={handleExcluirPonto}
          onCalcular={calcularTensoes}
          decimalPlaces={settings.decimalPlaces}
        />
      </div>

      {/* Popups */}
      <CargaRetangularPopup
        open={cargaPopupOpen}
        onOpenChange={setCargaPopupOpen}
        larguraInicial={largura}
        comprimentoInicial={comprimento}
        intensidadeInicial={intensidade}
        nomeSapataInicial={nomeSapata}
        onSalvar={handleConfirmarCarga}
      />

      <PontoAnalisePopup
        open={pontoPopupOpen}
        onOpenChange={setPontoPopupOpen}
        coordenadas={pontoPopupCoords}
        nomeInicial={pontoEditando?.nome || nomePadraoNovoPonto}
        isEdicao={pontoEditando !== null}
        onConfirm={handleConfirmarPonto}
        onExcluir={pontoEditando ? handleExcluirPonto : undefined}
      />

      <DialogConfiguracoesNewmark
        open={configuracoesDialogOpen}
        onOpenChange={setConfiguracoesDialogOpen}
        usarAbaco={usarAbaco}
        onToggleMetodo={handleToggleMetodo}
      />

      <DialogExemplosNewmark
        open={exemplosDialogOpen}
        onOpenChange={setExemplosDialogOpen}
        onCarregarExemplo={handleCarregarExemplo}
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
        moduleName="Newmark"
      />
    </div>
  );
}
