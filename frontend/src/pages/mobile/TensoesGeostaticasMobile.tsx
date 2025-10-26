import { useState, useRef } from "react";
import { Mountain, Calculator, Settings, Save, Download, FolderOpen, Lightbulb, AlertCircle, FileSpreadsheet, FileText, BarChart3, Trash2, Layers, Info } from "lucide-react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/components/ui/use-toast";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import { exportToPDF, exportToExcel, ExportData, ExcelExportData, formatNumberForExport, captureChartAsImage, generateDefaultPDFFileName } from "@/lib/export-utils";
import ExportPDFDialog from "@/components/ExportPDFDialog";
import PerfilTensoes from "@/components/tensoes/PerfilTensoes";
import TabelaResultados from "@/components/tensoes/TabelaResultados";
import DiagramaCamadas from "@/components/tensoes/DiagramaCamadas";
import { exemplosTensoes, ExemploTensoes } from "@/lib/exemplos-tensoes";
import { transferirNAParaCamadaCorreta, CamadaTensoes } from "@/lib/tensoes-utils";

interface CamadaData {
  id: string;
  nome: string;
  espessura: string;
  gamaNat: string;
  gamaSat: string;
  Ko: string;
  profundidadeNA: string;
  capilaridade: string;
  impermeavel: boolean;
}

interface FormData {
  pesoEspecificoAgua: string;
  camadas: CamadaData[];
}

interface TensaoPonto {
  profundidade: number;
  tensao_total_vertical?: number | null;
  pressao_neutra?: number | null;
  tensao_efetiva_vertical?: number | null;
  tensao_efetiva_horizontal?: number | null;
}

interface Results {
  pontos_calculo: TensaoPonto[];
  erro?: string | null;
}

interface CamadaSoloAPI {
  espessura: number;
  gama_nat?: number | null;
  gama_sat?: number | null;
  Ko?: number;
  impermeavel?: boolean;
  profundidade_na_camada?: number | null;
  altura_capilar_camada?: number | null;
}

interface TensoesGeostaticasInputAPI {
  camadas: CamadaSoloAPI[];
  profundidade_na: number;
  altura_capilar: number;
  peso_especifico_agua: number;
}

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

const generateId = () => `${Date.now()}-${Math.floor(Math.random() * 1000000)}`;

export default function TensoesGeostaticasMobile() {
  const { settings } = useSettings();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState<FormData>({
    pesoEspecificoAgua: "10.0",
    camadas: [
      {
        id: generateId(),
        nome: "Camada 1",
        espessura: "5.0",
        gamaNat: "18.0",
        gamaSat: "20.0",
        Ko: "",
        profundidadeNA: "",
        capilaridade: "",
        impermeavel: false,
      },
    ],
  });
  
  const [results, setResults] = useState<Results | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Estados para sheets
  const [examplesSheetOpen, setExamplesSheetOpen] = useState(false);
  const [loadSheetOpen, setLoadSheetOpen] = useState(false);

  // Estados para salvamento
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [saveName, setSaveName] = useState("");
  const { calculations, saveCalculation, deleteCalculation } = useSavedCalculations("tensoes-geostaticas");

  // Estados para exportação
  const [exportPDFDialogOpen, setExportPDFDialogOpen] = useState(false);
  const [pdfFileName, setPdfFileName] = useState("");
  const [isExportingPDF, setIsExportingPDF] = useState(false);

  // Ref para captura de gráfico
  const chartRef = useRef<HTMLDivElement>(null);

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData({ ...formData, [field]: value });
    setError(null);
  };

  // Handlers para o diagrama interativo
  const handleAddCamadaFromDiagram = (data: any) => {
    const novaCamada: CamadaData = { 
      id: generateId(),
      nome: data.nome,
      espessura: data.espessura,
      profundidadeNA: data.profundidadeNA,
      capilaridade: data.capilaridade,
      gamaNat: data.gamaNat, 
      gamaSat: data.gamaSat, 
      Ko: data.Ko || "",
      impermeavel: data.impermeavel || false
    };
    
    setFormData({
      ...formData,
      camadas: [...formData.camadas, novaCamada],
    });
    
    // Se foi definido um NA, transferir para a camada correta
    if (data.profundidadeNA && data.profundidadeNA !== "") {
      const profNA = parseFloat(data.profundidadeNA);
      const cap = parseFloat(data.capilaridade || "0");
      
      if (!isNaN(profNA)) {
        setTimeout(() => {
          const camadasAtuais = [...formData.camadas, novaCamada] as unknown as CamadaTensoes[];
          const resultado = transferirNAParaCamadaCorreta(profNA, cap, camadasAtuais.length - 1, camadasAtuais);
          
          if (resultado.erro) {
            toast({
              title: "Aviso",
              description: resultado.erro,
            });
          } else {
            setFormData({
              ...formData,
              camadas: resultado.camadas.map(c => ({
                id: c.id || generateId(),
                nome: c.nome,
                espessura: c.espessura,
                gamaNat: c.gamaNat || "",
                gamaSat: c.gamaSat || "",
                Ko: c.Ko || "",
                profundidadeNA: c.profundidadeNA || "",
                capilaridade: c.capilaridade || "",
                impermeavel: c.impermeavel || false,
              })),
            });
            if (resultado.indexDestino !== camadasAtuais.length - 1) {
              toast({
                title: "NA transferido",
                description: `O NA foi movido para a Camada ${resultado.indexDestino + 1} (profundidade correta)`,
              });
            }
          }
        }, 100);
      }
    }
    
    toast({
      title: "✅ Camada Adicionada!",
      description: "Camada inserida com sucesso no perfil",
    });
  };

  const handleEditCamadaFromDiagram = (index: number, data: any) => {
    // Atualiza os dados básicos da camada
    const newCamadas = [...formData.camadas];
    newCamadas[index] = {
      ...newCamadas[index],
      nome: data.nome,
      espessura: data.espessura,
      gamaNat: data.gamaNat,
      gamaSat: data.gamaSat,
      Ko: data.Ko || "",
      impermeavel: data.impermeavel || false,
    };
    
    setFormData({ ...formData, camadas: newCamadas });
    
    // Se foi definido um NA, transferir para a camada correta
    const profNAStr = data.profundidadeNA;
    const capilaridadeStr = data.capilaridade;
    
    if (profNAStr && profNAStr !== "") {
      const profNA = parseFloat(profNAStr);
      const cap = parseFloat(capilaridadeStr || "0");
      
      if (!isNaN(profNA)) {
        const camadasAtuais = newCamadas as unknown as CamadaTensoes[];
        const resultado = transferirNAParaCamadaCorreta(profNA, cap, index, camadasAtuais);
        
        if (resultado.erro) {
          toast({
            title: "Erro",
            description: resultado.erro,
            variant: "destructive",
          });
          // Limpa o NA da camada atual se houver erro
          newCamadas[index].profundidadeNA = "";
          newCamadas[index].capilaridade = "";
          setFormData({ ...formData, camadas: newCamadas });
        } else {
          setFormData({
            ...formData,
            camadas: resultado.camadas.map(c => ({
              id: c.id || generateId(),
              nome: c.nome,
              espessura: c.espessura,
              gamaNat: c.gamaNat || "",
              gamaSat: c.gamaSat || "",
              Ko: c.Ko || "",
              profundidadeNA: c.profundidadeNA || "",
              capilaridade: c.capilaridade || "",
              impermeavel: c.impermeavel || false,
            })),
          });
          if (resultado.indexDestino !== index) {
            toast({
              title: "NA transferido",
              description: `O NA foi movido para a Camada ${resultado.indexDestino + 1} (profundidade correta)`,
            });
          }
        }
      }
    } else {
      // Limpa NA e capilaridade se não foram fornecidos
      newCamadas[index].profundidadeNA = "";
      newCamadas[index].capilaridade = "";
      setFormData({ ...formData, camadas: newCamadas });
    }
    
    toast({
      title: "✅ Atualizado!",
      description: `${data.nome} foi atualizada`,
    });
  };

  const validateForm = (): string | null => {
    if (!formData.pesoEspecificoAgua || parseFloat(formData.pesoEspecificoAgua) <= 0) {
      return "Peso específico da água deve ser maior que 0";
    }

    for (let i = 0; i < formData.camadas.length; i++) {
      const camada = formData.camadas[i];
      
      if (!camada.nome.trim()) {
        return `Camada ${i + 1}: Nome é obrigatório`;
      }
      
      if (!camada.espessura || parseFloat(camada.espessura) <= 0) {
        return `Camada ${i + 1}: Espessura deve ser maior que 0`;
      }
      
      if (camada.Ko && camada.Ko !== "" && (parseFloat(camada.Ko) < 0 || parseFloat(camada.Ko) > 1)) {
        return `Camada ${i + 1}: Ko deve estar entre 0 e 1`;
      }
    }

    return null;
  };

  const handleCalculate = async () => {
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      toast({
        title: "Erro de Validação",
        description: validationError,
        variant: "destructive",
      });
      return;
    }

    setIsCalculating(true);
    setError(null);
    setResults(null);

    try {
      // Determinar o NA global (primeiro NA encontrado)
      let profNAGlobal = 0;
      let alturaCapilarGlobal = 0;
      
      for (const camada of formData.camadas) {
        if (camada.profundidadeNA && camada.profundidadeNA !== "") {
          profNAGlobal = parseFloat(camada.profundidadeNA);
          alturaCapilarGlobal = camada.capilaridade && camada.capilaridade !== "" 
            ? parseFloat(camada.capilaridade) 
            : 0;
          break;
        }
      }

      const camadas: CamadaSoloAPI[] = formData.camadas.map((c, index) => {
        const espessura = parseFloat(c.espessura);
        const Ko = c.Ko && c.Ko !== "" ? parseFloat(c.Ko) : null;
        
        // Calcula profundidade da camada
        let profTopo = 0;
        for (let i = 0; i < index; i++) {
          profTopo += parseFloat(formData.camadas[i].espessura);
        }
        const profBase = profTopo + espessura;

        // Determina quais γ são necessários
        const acimaDoNA = profBase <= profNAGlobal;
        const abaixoDoNA = profTopo >= profNAGlobal;
        const atravessaNA = !acimaDoNA && !abaixoDoNA;

        let gamaNat: number | null = null;
        let gamaSat: number | null = null;

        if (c.gamaNat && c.gamaNat !== "") gamaNat = parseFloat(c.gamaNat);
        if (c.gamaSat && c.gamaSat !== "") gamaSat = parseFloat(c.gamaSat);

        // Validação
        if (acimaDoNA && gamaNat === null) {
          throw new Error(`Camada ${index + 1} está acima do NA. γ natural é obrigatório.`);
        }
        if (abaixoDoNA && gamaSat === null) {
          throw new Error(`Camada ${index + 1} está abaixo do NA. γ saturado é obrigatório.`);
        }
        if (atravessaNA && (gamaNat === null || gamaSat === null)) {
          throw new Error(`Camada ${index + 1} atravessa o NA. Ambos γ natural e γ saturado são obrigatórios.`);
        }

        // Extrai NA e capilaridade da camada (se definidos)
        const profundidadeNACamada = c.profundidadeNA && c.profundidadeNA !== "" ? parseFloat(c.profundidadeNA) : null;
        const capilaridadeCamada = c.capilaridade && c.capilaridade !== "" ? parseFloat(c.capilaridade) : null;

        return {
          espessura,
          gama_nat: gamaNat !== null ? gamaNat : undefined,
          gama_sat: gamaSat !== null ? gamaSat : undefined,
          Ko: Ko !== null ? Ko : undefined,
          impermeavel: c.impermeavel || false,
          profundidade_na_camada: profundidadeNACamada !== null ? profundidadeNACamada : undefined,
          altura_capilar_camada: capilaridadeCamada !== null ? capilaridadeCamada : undefined,
        };
      });

      const apiInput: TensoesGeostaticasInputAPI = {
        camadas,
        profundidade_na: profNAGlobal,
        altura_capilar: alturaCapilarGlobal,
        peso_especifico_agua: parseFloat(formData.pesoEspecificoAgua),
      };

      const response = await axios.post(`${API_URL}/calcular/tensoes-geostaticas`, apiInput);

      if (response.data.erro) {
        setError(response.data.erro);
        toast({
          title: "Erro no Cálculo",
          description: response.data.erro,
          variant: "destructive",
        });
      } else {
        setResults(response.data);
        toast({
          title: "✅ Sucesso!",
          description: "Tensões calculadas com sucesso",
        });
      }
    } catch (err: any) {
      console.error("Erro ao calcular tensões:", err);
      let errorMsg = "Erro desconhecido ao calcular tensões";
      
      if (err.message) {
        errorMsg = err.message;
      } else if (err.response?.data?.detail) {
        errorMsg = err.response.data.detail;
      }
      
      setError(errorMsg);
      toast({
        title: "Erro no Cálculo",
        description: errorMsg,
        variant: "destructive",
      });
    } finally {
      setIsCalculating(false);
    }
  };

  const handleClear = () => {
    setFormData({
      pesoEspecificoAgua: "10.0",
      camadas: [
        {
          id: generateId(),
          nome: "Camada 1",
          espessura: "5.0",
          gamaNat: "18.0",
          gamaSat: "20.0",
          Ko: "",
          profundidadeNA: "",
          capilaridade: "",
          impermeavel: false,
        },
      ],
    });
    setResults(null);
    setError(null);
  };

  const handleLoadExample = (example: ExemploTensoes) => {
    const camadas: CamadaData[] = example.camadas.map((c, idx) => ({
      id: generateId(),
      nome: c.nome || `Camada ${idx + 1}`,
      espessura: c.espessura,
      gamaNat: c.gamaNat || "",
      gamaSat: c.gamaSat || "",
      Ko: c.Ko || "",
      profundidadeNA: c.profundidadeNA || "",
      capilaridade: c.capilaridade || "",
      impermeavel: c.impermeavel || false,
    }));

    setFormData({
      pesoEspecificoAgua: example.pesoEspecificoAgua || "10.0",
      camadas: camadas,
    });

    setResults(null);
    setExamplesSheetOpen(false);
    
    toast({
      title: `${example.icon} ${example.nome}`,
      description: example.descricao,
    });
  };

  // Salvamento
  const handleSaveClick = () => {
    if (!results) return;
    setSaveName(`Perfil ${new Date().toLocaleDateString('pt-BR')}`);
    setSaveDialogOpen(true);
  };

  const handleConfirmSave = () => {
    if (!results || !saveName.trim()) return;
    
    const success = saveCalculation(saveName.trim(), formData, results);
    if (success) {
      toast({
        title: "💾 Salvo!",
        description: "Perfil salvo com sucesso",
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
    setPdfFileName(generateDefaultPDFFileName("Tensões Geostáticas"));
    setExportPDFDialogOpen(true);
  };

  const handleConfirmExportPDF = async () => {
    if (!results || !results.pontos_calculo || results.pontos_calculo.length === 0) {
      toast({
        title: "Atenção",
        description: "Não há resultados para exportar",
        variant: "destructive",
      });
      return;
    }

    setIsExportingPDF(true);

    try {
      toast({
        title: "Capturando gráficos...",
        description: "Aguarde",
      });
      
      const perfilImage = await captureChartAsImage('perfil-tensoes-mobile-chart');
      const diagramaImage = await captureChartAsImage('diagrama-camadas-mobile-chart');

      // Dados de entrada vazios (serão tabelas)
      const inputs: { label: string; value: string }[] = [];

      const profundidadeMax = results.pontos_calculo[results.pontos_calculo.length - 1]?.profundidade || 0;
      const tensaoMaxV = Math.max(...results.pontos_calculo.map(p => p.tensao_total_vertical || 0));

      const resultsList: { label: string; value: string; highlight?: boolean }[] = [
        { label: "Profundidade Máxima", value: `${formatNumberForExport(profundidadeMax, 2)} m` },
        { label: "Tensão Total Vertical Máxima", value: `${formatNumberForExport(tensaoMaxV, 2)} kPa`, highlight: true },
      ];

      // Tabelas
      const tables = [];
      
      // Determinar o NA global (primeiro NA encontrado)
      let profNAGlobal = "";
      let alturaCapilarGlobal = "";
      
      for (const camada of formData.camadas) {
        if (camada.profundidadeNA && camada.profundidadeNA !== "") {
          profNAGlobal = camada.profundidadeNA;
          alturaCapilarGlobal = camada.capilaridade || "0";
          break;
        }
      }
      
      // TABELA 1: Configurações Gerais
      const configHeaders = ["Parâmetro", "Valor"];
      const configRows = [
        ["Profundidade do NA", `${profNAGlobal} m`],
        ["Altura Franja Capilar", `${alturaCapilarGlobal} m`],
      ];
      tables.push({
        title: "Configurações Gerais",
        headers: configHeaders,
        rows: configRows
      });

      // TABELA 2: Camadas
      const camadasHeaders = ["Camada", "Espessura (m)", "Peso Esp. Nat. (kN/m³)", "Peso Esp. Sat. (kN/m³)", "Ko"];
      const camadasRows = formData.camadas.map((c, i) => [
        c.nome || `Camada ${i + 1}`,
        c.espessura,
        c.gamaNat || "-",
        c.gamaSat || "-",
        c.Ko || "-"
      ]);
      tables.push({
        title: "Camadas do Perfil",
        headers: camadasHeaders,
        rows: camadasRows
      });

      // TABELA 3: Tensões nos Pontos de Cálculo
      // Verifica se há tensão horizontal nos resultados
      const temTensaoHorizontal = results.pontos_calculo.some(p => p.tensao_efetiva_horizontal !== null && p.tensao_efetiva_horizontal !== undefined);
      
      const tensoesHeaders = ["Prof. (m)", "Tensao Total (kPa)", "Pressao Neutra (kPa)", "Tensao Efet. V (kPa)"];
      if (temTensaoHorizontal) {
        tensoesHeaders.push("Tensao Efet. H (kPa)");
      }
      
      const tensoesRows = results.pontos_calculo.map(p => {
        const row = [
          formatNumberForExport(p.profundidade, 2),
          p.tensao_total_vertical !== null ? formatNumberForExport(p.tensao_total_vertical, 2) : "-",
          p.pressao_neutra !== null ? formatNumberForExport(p.pressao_neutra, 2) : "-",
          p.tensao_efetiva_vertical !== null ? formatNumberForExport(p.tensao_efetiva_vertical, 2) : "-",
        ];
        if (temTensaoHorizontal) {
          row.push(p.tensao_efetiva_horizontal !== null ? formatNumberForExport(p.tensao_efetiva_horizontal, 2) : "-");
        }
        return row;
      });

      tables.push({
        title: "Tensões nos Pontos de Cálculo",
        headers: tensoesHeaders,
        rows: tensoesRows
      });

      const exportData: ExportData = {
        moduleName: "tensoes-geostaticas",
        moduleTitle: "Tensões Geostáticas",
        inputs,
        results: resultsList,
        tables,
        chartImage: perfilImage || diagramaImage || undefined,
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
    if (!results || !results.pontos_calculo || results.pontos_calculo.length === 0) {
      toast({
        title: "Atenção",
        description: "Não há resultados para exportar",
        variant: "destructive",
      });
      return;
    }

    const configData: { label: string; value: string | number }[] = [
      { label: "Peso Específico da Água (kN/m³)", value: formData.pesoEspecificoAgua },
      { label: "Número de Camadas", value: formData.camadas.length },
    ];

    const camadasData: { label: string; value: string | number }[] = [];
    formData.camadas.forEach((c, i) => {
      camadasData.push({ label: `Camada ${i + 1} - Nome`, value: c.nome });
      camadasData.push({ label: `Camada ${i + 1} - Espessura (m)`, value: c.espessura });
      if (c.gamaNat) camadasData.push({ label: `Camada ${i + 1} - γ Natural (kN/m³)`, value: c.gamaNat });
      if (c.gamaSat) camadasData.push({ label: `Camada ${i + 1} - γ Saturado (kN/m³)`, value: c.gamaSat });
      if (c.Ko && c.Ko !== "") camadasData.push({ label: `Camada ${i + 1} - Ko`, value: c.Ko });
      if (c.profundidadeNA) camadasData.push({ label: `Camada ${i + 1} - NA (m)`, value: c.profundidadeNA });
      if (c.capilaridade) camadasData.push({ label: `Camada ${i + 1} - Capilaridade (m)`, value: c.capilaridade });
      camadasData.push({ label: "", value: "" });
    });

    const resultadosData: { label: string; value: string | number }[] = [];
    const temTensaoHorizontalExcel = results.pontos_calculo.some(p => p.tensao_efetiva_horizontal !== null && p.tensao_efetiva_horizontal !== undefined);
    
    results.pontos_calculo.forEach((p, i) => {
      resultadosData.push({ label: `Ponto ${i + 1} - Prof (m)`, value: p.profundidade.toFixed(2) });
      if (p.tensao_total_vertical !== null && p.tensao_total_vertical !== undefined) {
        resultadosData.push({ label: `Ponto ${i + 1} - σ_v (kPa)`, value: p.tensao_total_vertical.toFixed(2) });
      }
      if (p.pressao_neutra !== null && p.pressao_neutra !== undefined) {
        resultadosData.push({ label: `Ponto ${i + 1} - u (kPa)`, value: p.pressao_neutra.toFixed(2) });
      }
      if (p.tensao_efetiva_vertical !== null && p.tensao_efetiva_vertical !== undefined) {
        resultadosData.push({ label: `Ponto ${i + 1} - σ'_v (kPa)`, value: p.tensao_efetiva_vertical.toFixed(2) });
      }
      if (temTensaoHorizontalExcel && p.tensao_efetiva_horizontal !== null && p.tensao_efetiva_horizontal !== undefined) {
        resultadosData.push({ label: `Ponto ${i + 1} - σ'_h (kPa)`, value: p.tensao_efetiva_horizontal.toFixed(2) });
      }
    });

    const excelData: ExcelExportData = {
      moduleName: "tensoes-geostaticas",
      moduleTitle: "Tensões Geostáticas",
      sheets: [
        { name: "Configuração", data: configData },
        { name: "Camadas", data: camadasData },
        { name: "Resultados", data: resultadosData }
      ],
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

  const isFormValid = 
    formData.pesoEspecificoAgua &&
    formData.camadas.length > 0 &&
    formData.camadas.every(c => c.nome && c.espessura);

  // Prepara dados para DiagramaCamadas
  const camadasParaDiagrama = formData.camadas.map(c => ({
    nome: c.nome,
    espessura: parseFloat(c.espessura) || 0,
    profundidadeNA: c.profundidadeNA && c.profundidadeNA !== "" ? parseFloat(c.profundidadeNA) : null,
    capilaridade: c.capilaridade && c.capilaridade !== "" ? parseFloat(c.capilaridade) : null,
    gamaNat: c.gamaNat && c.gamaNat !== "" ? parseFloat(c.gamaNat) : null,
    gamaSat: c.gamaSat && c.gamaSat !== "" ? parseFloat(c.gamaSat) : null,
    Ko: c.Ko && c.Ko !== "" ? parseFloat(c.Ko) : null,
    impermeavel: c.impermeavel || false,
  }));

  // Coleta TODOS os NAs definidos nas camadas
  const niveisAgua = camadasParaDiagrama
    .map((c, index) => c.profundidadeNA !== null && c.profundidadeNA !== undefined ? {
      profundidade: c.profundidadeNA,
      capilaridade: c.capilaridade || 0,
      index
    } : null)
    .filter((na): na is { profundidade: number; capilaridade: number; index: number } => na !== null);

  // Para compatibilidade, pega o primeiro NA (usado em alguns lugares)
  const profNA = niveisAgua.length > 0 ? niveisAgua[0].profundidade : 999;
  const alturaCapilar = niveisAgua.length > 0 ? niveisAgua[0].capilaridade : 0;

  return (
    <div className="space-y-4 pb-4">
      {/* Header com Ações */}
      <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-4 rounded-xl border border-primary/20">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 via-green-500 to-teal-600 flex items-center justify-center">
              <Mountain className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">Tensões Geostáticas</h2>
              <p className="text-xs text-muted-foreground">Calcule tensões em perfis de solo</p>
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

      {/* Perfil de Solo Interativo - DESTAQUE PRINCIPAL */}
      <MobileSection
        title="Perfil de Solo Interativo"
        icon={<Info className="w-4 h-4" />}
        defaultOpen={true}
      >
        <div className="space-y-2 -mx-6">
          <div className="bg-gradient-to-br from-primary/5 to-secondary/5 rounded-lg border-2 border-dashed border-primary/30 mx-4">
            <div className="flex items-start gap-2 mb-3 px-3 pt-3">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                <Layers className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-foreground">Interaja com o Perfil</h4>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Toque nas camadas para editar ou no botão + para adicionar novas camadas
                </p>
              </div>
            </div>
            
            <div className="pb-0" id="diagrama-camadas-mobile-chart">
              <DiagramaCamadas 
                camadas={camadasParaDiagrama} 
                profundidadeNA={profNA} 
                alturaCapilar={alturaCapilar}
                niveisAgua={niveisAgua}
                interactive={true}
                onAddCamada={handleAddCamadaFromDiagram}
                onEditCamada={handleEditCamadaFromDiagram}
              />
            </div>
          </div>

          <div className="flex justify-end mx-4">
            <Badge variant="secondary" className="text-xs">
              {formData.camadas.length} {formData.camadas.length === 1 ? "camada" : "camadas"}
            </Badge>
          </div>
        </div>
      </MobileSection>

      {/* Configurações Avançadas */}
      <MobileSection
        title="Configurações Avançadas"
        icon={<Info className="w-4 h-4" />}
        defaultOpen={false}
        collapsible
      >
        <MobileInputGroup
          label="Peso Específico da Água"
          value={formData.pesoEspecificoAgua}
          onChange={(v) => handleInputChange("pesoEspecificoAgua", v)}
          placeholder="Ex: 10.0"
          unit="kN/m³"
          required
          tooltip="Padrão: 10.0 kN/m³"
        />
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
      {results && results.pontos_calculo && results.pontos_calculo.length > 0 && (
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

          <MobileTabs
            tabs={[
              {
                id: "tabela",
                label: "Tabela",
                icon: <FileText className="w-4 h-4" />,
                content: (
                  <div className="mt-4 -mx-2">
                    <TabelaResultados 
                      pontos={results.pontos_calculo} 
                      profundidadeNA={profNA} 
                      alturaCapilar={alturaCapilar} 
                      niveisAgua={niveisAgua} 
                    />
                  </div>
                ),
              },
              {
                id: "perfil",
                label: "Perfil Gráfico",
                icon: <BarChart3 className="w-4 h-4" />,
                content: (
                  <div className="mt-4 -mx-2">
                    <div ref={chartRef} id="perfil-tensoes-mobile-chart" className="bg-background rounded-lg p-2">
                      <PerfilTensoes 
                        pontos={results.pontos_calculo} 
                        profundidadeNA={profNA} 
                        niveisAgua={niveisAgua} 
                      />
                    </div>
                  </div>
                ),
              },
            ]}
          />
        </>
      )}

      {/* Sheet de Exemplos */}
      <Sheet open={examplesSheetOpen} onOpenChange={setExamplesSheetOpen}>
        <SheetContent side="bottom" className="h-[70vh] rounded-t-2xl">
          <SheetHeader>
            <SheetTitle>Exemplos de Perfis</SheetTitle>
          </SheetHeader>
          <div className="mt-6 space-y-3 overflow-y-auto max-h-[calc(70vh-100px)]">
            {exemplosTensoes.map((example, idx) => (
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
                      <span>📊 {example.camadas.length} camadas</span>
                      {example.profundidadeNA && <span>💧 NA: {example.profundidadeNA}m</span>}
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
                    {calc.formData?.camadas?.length || 0} camadas
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

      {/* Dialog de Salvar */}
      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Salvar Perfil</DialogTitle>
            <DialogDescription>
              Dê um nome para este perfil geotécnico
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
              placeholder="Ex: Perfil - Obra X"
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
