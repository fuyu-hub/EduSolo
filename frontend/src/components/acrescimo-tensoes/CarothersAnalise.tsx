import { useState, useRef } from "react";
import { ArrowLeft, Target, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import axios from "axios";
import PrintHeader from "@/components/PrintHeader";
import CanvasCarothers from "./CanvasCarothers";
import PainelResultados, { PontoAnalise } from "./PainelResultados";
import CargaFaixaPopup from "./CargaFaixaPopup";
import PontoAnalisePopup from "./PontoAnalisePopup";
import CalculationActions from "@/components/CalculationActions";
import SaveDialog from "@/components/SaveDialog";
import SavedCalculations from "@/components/SavedCalculations";
import { useSavedCalculations } from "@/hooks/use-saved-calculations";
import { exportToPDF, exportToExcel, ExportData, ExcelExportData, formatNumberForExport } from "@/lib/export-utils";
import { useSettings } from "@/hooks/use-settings";

interface CarothersAnaliseProps {
  onVoltar: () => void;
}


const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export default function CarothersAnalise({ onVoltar }: CarothersAnaliseProps) {
  // Configurações
  const { settings } = useSettings();
  
  // Estado principal
  const [pontos, setPontos] = useState<PontoAnalise[]>([]);
  const [cargaQ, setCargaQ] = useState<number | undefined>(50); // Valor padrão: 50 kPa
  const [largura, setLargura] = useState<number | undefined>(2); // Valor padrão: 2 m (largura da faixa)
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
  const { calculations, saveCalculation, deleteCalculation, renameCalculation } = useSavedCalculations("carothers");

  // Ref para evitar cálculos duplicados
  const isCalculatingRef = useRef(false);

  // Função para calcular tensões (chamada explicitamente)
  const calcularTensoes = async () => {
    // Só calcula se houver carga e largura definidos e pontos
    if (!cargaQ || cargaQ <= 0 || !largura || largura <= 0 || pontos.length === 0) {
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
          const response = await axios.post(`${API_URL}/calcular/acrescimo-tensoes`, {
            tipo_carga: "faixa",
            carga_faixa: {
              largura: largura,
              intensidade: cargaQ,
              centro_x: 0,
              centro_y: 0
            },
            ponto_interesse: {
              x: ponto.x,
              y: 0, // Carothers é 2D (apenas X-Z)
              z: ponto.z
            }
          });

          if (response.data.erro) {
            resultadosMap.set(ponto.id, undefined);
          } else {
            resultadosMap.set(ponto.id, response.data.delta_sigma_v);
          }
        } catch (error) {
          console.error(`Erro ao calcular ponto ${ponto.nome}:`, error);
          resultadosMap.set(ponto.id, undefined);
        }
      }

      // Atualiza apenas as tensões dos pontos que foram calculados
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
  const handleConfirmarCarga = (q: number, l: number) => {
    setCargaQ(q);
    setLargura(l);
    toast("Carga definida!", { description: `q = ${q.toFixed(2)} kPa, B = ${l.toFixed(2)} m` });
    // Limpa as tensões calculadas
    setPontos(prevPontos => prevPontos.map(p => ({ ...p, tensao: undefined })));
    setCalculoFeito(false);
  };

  const handleConfirmarPonto = (nome: string, x: number, y: number, z: number) => {
    // y é ignorado pois Carothers é 2D (apenas X-Z)
    if (pontoEditando) {
      setPontos(prevPontos => prevPontos.map(p => 
        p.id === pontoEditando.id ? { ...p, nome, x, z, tensao: undefined } : p
      ));
      toast("Ponto atualizado!", { description: `"${nome}" foi atualizado.` });
      setCalculoFeito(false);
    } else {
      const novoPonto: PontoAnalise = {
        id: crypto.randomUUID(),
        nome,
        x,
        z,
        tensao: undefined
      };
      setPontos(prevPontos => [...prevPontos, novoPonto]);
      toast("Ponto criado!", { description: `"${nome}" foi adicionado ao canvas.` });
    }
  };

  // Handler de movimentação de ponto
  const handleMovimentarPonto = (id: string, x: number, z: number) => {
    setPontos(prevPontos => prevPontos.map(p => 
      p.id === id ? { ...p, x, z, tensao: undefined } : p
    ));
    setCalculoFeito(false);
  };

  const handlePontoSolto = (id: string) => {
    setCalculoFeito(false);
  };

  // Handlers de exportação
  const handleExportarPDF = async () => {
    if (!cargaQ || !largura || pontos.length === 0) return;

    const inputs = [
      { label: "Carga Distribuída q", value: `${cargaQ.toFixed(2)} kPa` },
      { label: "Largura da Faixa B", value: `${largura.toFixed(2)} m` }
    ];

    const resultsList = pontos.map((p, i) => ({
      label: `${p.nome} (X=${p.x.toFixed(2)}m, Z=${p.z.toFixed(2)}m)`,
      value: p.tensao !== undefined ? `${formatNumberForExport(p.tensao, 4)} kPa` : "N/A",
      highlight: i === 0
    }));

    const exportData: ExportData = {
      moduleName: "carothers",
      moduleTitle: "Carothers - Acréscimo de Tensões (Carga em Faixa)",
      inputs,
      results: resultsList
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
    if (!cargaQ || !largura || pontos.length === 0) return;

    const configData = [
      { label: "Carga q (kPa)", value: cargaQ },
      { label: "Largura B (m)", value: largura }
    ];

    const resultadosData = pontos.map(p => ({
      Nome: p.nome,
      "X (m)": p.x.toFixed(2),
      "Z (m)": p.z.toFixed(2),
      "Δσz (kPa)": p.tensao !== undefined ? p.tensao.toFixed(settings.decimalPlaces) : "N/A"
    }));

    const excelData: ExcelExportData = {
      moduleName: "carothers",
      moduleTitle: "Carothers - Acréscimo de Tensões (Carga em Faixa)",
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
    if (!cargaQ || !largura || pontos.length === 0) {
      toast("Nada para salvar", { description: "Defina a carga e adicione pontos antes de salvar." });
      return;
    }
    setSaveName(`Carothers ${new Date().toLocaleDateString('pt-BR')}`);
    setSaveDialogOpen(true);
  };

  const handleConfirmSave = () => {
    if (!saveName.trim()) return;
    const dados = { cargaQ, largura, pontos };
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
    setCargaQ(dados.cargaQ);
    setLargura(dados.largura);
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

  const handleCarregarExemplos = () => {
    // Exemplo baseado em material didático:
    // Fundação corrida com B = 4 m, q = 100 kPa
    setCargaQ(100);
    setLargura(4);
    setPontos([
      { id: 'exemplo-a', nome: 'Ponto A (Centro)', x: 0, z: 2, tensao: undefined },
      { id: 'exemplo-b', nome: 'Ponto B (Borda)', x: 2, z: 2, tensao: undefined },
      { id: 'exemplo-c', nome: 'Ponto C (Externo)', x: 4, z: 2, tensao: undefined }
    ]);
    setCalculoFeito(false);
    toast("Exemplos carregados!", { description: "Baseado em B=4m, q=100kPa. Clique em 'Calcular'." });
  };

  const temResultados = pontos.some(p => p.tensao !== undefined);
  
  // Calcular a "carga equivalente" para exibir no canvas
  // Para Carothers, mostramos q*B (carga por unidade de comprimento) em kN/m
  const cargaEquivalente = (cargaQ && largura) ? (cargaQ * largura) : undefined;

  return (
    <div className="space-y-4 max-w-[1800px] mx-auto">
      <PrintHeader moduleTitle="Carothers - Carga em Faixa" moduleName="carothers" />

      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={onVoltar}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg">
            <Target className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Carothers - Carga em Faixa</h1>
            <p className="text-sm text-muted-foreground hidden sm:block">
              Análise interativa de acréscimo de tensões por carga em faixa
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleCarregarExemplos}>
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
        <CanvasCarothers
          pontos={pontos}
          cargaQ={cargaQ}
          largura={largura}
          onDuploCliqueCarga={handleDuploCliqueCarga}
          onDuploCliqueGrid={handleDuploCliqueGrid}
          onDuploCliquePonto={handleDuploCliquePonto}
          onMovimentarPonto={handleMovimentarPonto}
          onPontoSolto={handlePontoSolto}
          calculoFeito={calculoFeito}
          decimalPlaces={settings.decimalPlaces}
        />

        {/* Painel de Resultados - Adaptado para Carothers */}
        <PainelResultados
          pontos={pontos}
          cargaP={cargaEquivalente}
          cargaQ={cargaQ}
          largura={largura}
          tipoAnalise="carothers"
          isCalculating={isCalculating}
          onExcluirPonto={handleExcluirPonto}
          onCalcular={calcularTensoes}
          decimalPlaces={settings.decimalPlaces}
        />
      </div>

      {/* Popups */}
      <CargaFaixaPopup
        open={cargaPopupOpen}
        onOpenChange={setCargaPopupOpen}
        qInicial={cargaQ}
        larguraInicial={largura}
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
        moduleName="Carothers"
      />
    </div>
  );
}

