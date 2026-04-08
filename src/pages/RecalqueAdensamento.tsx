// frontend/src/pages/RecalqueAdensamento.tsx
import { useState, useEffect, useMemo } from "react";
import { Helmet } from 'react-helmet-async';
import { useForm, useFieldArray } from "react-hook-form";
import { calcularRecalqueAdensamento } from "@/lib/calculations/recalque-adensamento";
import { calcularTensoesGeostaticas } from "@/modules/tensoes/calculations";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  MoveDown,
  AlertCircle,
  Info,
  BarChart3,
  Maximize2,
  Clock,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Carousel, CarouselContent, CarouselItem, type CarouselApi } from "@/components/ui/carousel";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "@/components/ui/sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { useSavedCalculations } from "@/hooks/use-saved-calculations";
import { useSettings } from "@/hooks/use-settings";
import CalculationActions from "@/componentes/compartilhados/BarraAcoes";
import SaveDialog from "@/componentes/dialogos/DialogoSalvar";
import SavedCalculations from "@/componentes/compartilhados/CalculosSalvos";
import PrintHeader from "@/componentes/base/CabecalhoImpressao";
import DialogConfiguracoes, { ConfigData } from "@/modules/tensoes/components/DialogConfiguracoes";
import DialogExemplos from "@/modules/recalque/components/DialogExemplos";
import { type ExemploRecalque } from "@/lib/exemplos/recalque-adensamento";
import DialogCamada, { CamadaData } from "@/modules/tensoes/components/DialogCamada";
import TabelaCamadas from "@/modules/tensoes/components/TabelaCamadas";
import DiagramaRecalque from "@/modules/recalque/components/DiagramaRecalque";
import { exportToPDF, exportToExcel, ExportData, ExcelExportData, formatNumberForExport, generateDefaultPDFFileName } from "@/lib/utils/export-utils";
import ExportPDFDialog from "@/componentes/dialogos/DialogoExportarPDF";
import { useRecentReports } from "@/hooks/useRecentReports";
import { prepareReportForStorage } from "@/lib/reportManager";
import { useNotification } from "@/hooks/use-notification";
import { useNavigate } from "react-router-dom";
import type {
  RecalqueAdensamentoInput,
  RecalqueAdensamentoOutput
} from "@/lib/schemas/outros-modulos";
import type { TensoesGeostaticasInput, CamadaSolo } from "@/modules/tensoes/schemas";

// Schema para Aba 1 - Perfil
const camadaSchema = z.object({
  id: z.string(),
  nome: z.string().min(1, { message: "Nome da camada é obrigatório" }),
  espessura: z.string().min(1, { message: "Campo obrigatório" }).refine(
    val => !isNaN(parseFloat(val)) && parseFloat(val) > 0,
    { message: "Espessura deve ser maior que 0" }
  ),
  profundidadeNA: z.string().optional(),
  capilaridade: z.string().optional(),
  gamaNat: z.string().optional(),
  gamaSat: z.string().optional(),
  Ko: z.string().optional(),
  impermeavel: z.boolean().optional(),
  compressivel: z.boolean().optional(),
});

const perfilSchema = z.object({
  profundidadeNA: z.string().optional(),
  alturaCapilar: z.string().refine(
    val => !isNaN(parseFloat(val)) && parseFloat(val) >= 0,
    { message: "Altura deve ser maior ou igual a 0" }
  ),
  pesoEspecificoAgua: z.string().refine(
    val => !isNaN(parseFloat(val)) && parseFloat(val) > 0,
    { message: "Peso específico da água deve ser maior que 0" }
  ),
  camadas: z.array(camadaSchema).min(1, { message: "É necessária pelo menos 1 camada de solo" }),
});

type PerfilFormValues = z.infer<typeof perfilSchema>;

const generateId = () => `${Date.now()}-${Math.floor(Math.random() * 1000000)}`;

export default function RecalqueAdensamento() {
  const { settings } = useSettings();
  const { addReport } = useRecentReports();
  const notify = useNotification();
  const navigate = useNavigate();
  const [config, setConfig] = useState<ConfigData>({ pesoEspecificoAgua: "10.0" });

  // Estados para exportação
  const [pdfFileName, setPdfFileName] = useState("");
  const [exportPDFDialogOpen, setExportPDFDialogOpen] = useState(false);
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [customReportTitle, setCustomReportTitle] = useState("");

  // Estados das abas
  const [camadaCompressivelIndex, setCamadaCompressivelIndex] = useState<number | null>(null);
  const [profundidadeCentro, setProfundidadeCentro] = useState<number | null>(null);
  const [sigmaV0Prime, setSigmaV0Prime] = useState<number | null>(0); // σv0′ do presente
  const [sigmaVmPrime, setSigmaVmPrime] = useState<number | null>(0); // σvm′ do passado (pré-adensamento)
  const [sigmaVfPrime, setSigmaVfPrime] = useState<number | null>(0); // σvf′ do futuro (tensão final)
  const [currentPerfilState, setCurrentPerfilState] = useState<"passado" | "presente" | "futuro">("presente");

  // Estados para nova estrutura de perfil
  // Argila padrão: 10m ao entrar no módulo
  const [camadaArgila, setCamadaArgila] = useState<{
    espessura: number;
    gamaNat?: number | null;
    gamaSat?: number | null;
    profundidadeNA?: number | null;
    Cc?: number | null;
    Cr?: number | null;
    Cv?: number | null;
    e0?: number | null;
  } | null>({
    espessura: 10,
    gamaNat: null,
    gamaSat: null,
    profundidadeNA: null,
    Cc: null,
    Cr: null,
    Cv: null,
    e0: null,
  });
  const [camadaBase, setCamadaBase] = useState<{ drenante: boolean }>({ drenante: false });
  const [camadasAterroPassado, setCamadasAterroPassado] = useState<Array<{
    nome: string;
    espessura: number;
    gamaNat?: number;
    gamaSat?: number;
  }>>([]);
  const [camadasAterroPresente, setCamadasAterroPresente] = useState<Array<{
    nome: string;
    espessura: number;
    gamaNat?: number;
    gamaSat?: number;
  }>>([]);
  const [camadasAterroFuturo, setCamadasAterroFuturo] = useState<Array<{
    nome: string;
    espessura: number;
    gamaNat?: number;
    gamaSat?: number;
  }>>([]);

  // Estado para Δσ′ calculado como σvf′ - σvm′
  const [deltaSigma, setDeltaSigma] = useState<number | null>(0);


  // Estados resultados
  const [results, setResults] = useState<RecalqueAdensamentoOutput | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const tempoAdensamento = results?.tempo_adensamento;
  const [indiceTempoSelecionado, setIndiceTempoSelecionado] = useState(0);
  const [carouselApi, setCarouselApi] = useState<CarouselApi | null>(null);
  const [carouselProgress, setCarouselProgress] = useState(0);
  const [carouselTotalSlides, setCarouselTotalSlides] = useState(0);
  const tabelaTempo = useMemo(() => tempoAdensamento?.tabela_por_tempo ?? [], [tempoAdensamento]);
  const maxIndiceTempo = tabelaTempo.length > 0 ? tabelaTempo.length - 1 : 0;
  const tempoSelecionado = tabelaTempo[indiceTempoSelecionado] ?? null;
  const tempoInicial = tabelaTempo[0] ?? null;
  const tempoFinal = tabelaTempo.length > 0 ? tabelaTempo[tabelaTempo.length - 1] : null;

  useEffect(() => {
    setIndiceTempoSelecionado(0);
  }, [tempoAdensamento]);

  useEffect(() => {
    if (indiceTempoSelecionado > maxIndiceTempo) {
      setIndiceTempoSelecionado(maxIndiceTempo);
    }
  }, [indiceTempoSelecionado, maxIndiceTempo]);

  useEffect(() => {
    if (!carouselApi) {
      return;
    }

    const updateCarouselProgress = () => {
      const total = carouselApi.scrollSnapList().length;
      setCarouselTotalSlides(total);
      setCarouselProgress(total > 0 ? (carouselApi.selectedScrollSnap() + 1) / total : 0);
    };

    updateCarouselProgress();
    carouselApi.on("select", updateCarouselProgress);
    carouselApi.on("reInit", updateCarouselProgress);

    return () => {
      carouselApi.off("select", updateCarouselProgress);
      carouselApi.off("reInit", updateCarouselProgress);
    };
  }, [carouselApi]);

  // Estados salvamento
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [saveName, setSaveName] = useState("");
  const [loadDialogOpen, setLoadDialogOpen] = useState(false);
  const { calculations, saveCalculation, deleteCalculation, renameCalculation } =
    useSavedCalculations("recalque-adensamento");


  // Forms
  const perfilForm = useForm<PerfilFormValues>({
    resolver: zodResolver(perfilSchema),
    defaultValues: {
      profundidadeNA: "",
      alturaCapilar: "0.0",
      pesoEspecificoAgua: "10.0",
      camadas: [
        {
          id: generateId(),
          nome: "Camada 1",
          espessura: "5.0",
          profundidadeNA: "",
          capilaridade: "",
          gamaNat: "18.0",
          gamaSat: "20.0",
          Ko: "",
          impermeavel: false,
          compressivel: false,
        },
      ],
    },
    mode: "onBlur",
  });


  const { fields, append, remove } = useFieldArray({
    control: perfilForm.control,
    name: "camadas",
    keyName: "fieldId",
  });

  // Estados para dialogs
  const [dialogCamadaOpen, setDialogCamadaOpen] = useState(false);
  const [currentCamadaIndex, setCurrentCamadaIndex] = useState(0);
  const [camadaEditando, setCamadaEditando] = useState<CamadaData | undefined>();

  // Calcular tensões: sempre calcular σv0′, σvm′ e σvf′ independente do período atual
  useEffect(() => {
    if (!camadaArgila) {
      setProfundidadeCentro(null);
      setSigmaV0Prime(0);
      setSigmaVmPrime(0);
      setSigmaVfPrime(0);
      setDeltaSigma(0);
      return;
    }

    try {
      const espessuraArgilaReal = camadaArgila.espessura;

      // NA é digitado relativo ao topo da argila (positivo = acima, negativo = abaixo)
      // Para cálculos, precisa converter para profundidade absoluta da superfície
      const profNAArgilaRelativo = camadaArgila.profundidadeNA ?? null;
      const profNAGlobalRelativo = profNAArgilaRelativo !== null
        ? profNAArgilaRelativo
        : (parseFloat(perfilForm.watch("profundidadeNA") || "0") || 0);

      // Converter para profundidade absoluta: profundidadeAterro + valorRelativo
      // Valor positivo significa acima da argila, então subtrai (ou seja, está mais próximo da superfície)
      // Valor negativo significa abaixo da argila, então soma
      const alturaAterroPassado = camadasAterroPassado.reduce((sum, c) => sum + c.espessura, 0);
      const alturaAterroPresente = camadasAterroPresente.reduce((sum, c) => sum + c.espessura, 0);

      // Para o período atual, usar a altura do aterro correspondente
      const alturaAterroAtual = currentPerfilState === "passado"
        ? alturaAterroPassado
        : currentPerfilState === "futuro"
          ? camadasAterroFuturo.length > 0
            ? [...camadasAterroPresente, ...camadasAterroFuturo].reduce((sum, c) => sum + c.espessura, 0)
            : alturaAterroPresente
          : alturaAterroPresente;

      const alturaCap = parseFloat(perfilForm.watch("alturaCapilar") || "0") || 0;
      const pesoAgua = parseFloat(config.pesoEspecificoAgua || "10.0");

      // Função auxiliar para calcular tensão em um período
      const calcularTensaoNoPeriodo = (aterros: typeof camadasAterroPassado): number => {
        const camadas: CamadaSolo[] = [];

        const alturaAterroNoPeriodo = aterros.reduce((sum, c) => sum + c.espessura, 0);

        // Converter NA relativo para absoluto para este período específico
        // Se NA = 1m (acima da argila): absoluta = alturaAterroNoPeriodo - 1
        // Se NA = -1m (abaixo da argila): absoluta = alturaAterroNoPeriodo - (-1) = alturaAterroNoPeriodo + 1
        const profNAAbsoluto = alturaAterroNoPeriodo - profNAGlobalRelativo;

        aterros.forEach(aterro => {
          camadas.push({
            espessura: aterro.espessura,
            gama_nat: aterro.gamaNat ?? undefined,
            gama_sat: aterro.gamaSat ?? undefined,
            impermeavel: false,
          });
        });

        camadas.push({
          espessura: camadaArgila.espessura,
          gama_nat: camadaArgila.gamaNat ?? undefined,
          gama_sat: camadaArgila.gamaSat ?? undefined,
          impermeavel: false,
        });

        const input: TensoesGeostaticasInput = {
          camadas,
          profundidade_na: profNAAbsoluto > 0 ? profNAAbsoluto : undefined,
          altura_capilar: alturaCap,
          peso_especifico_agua: pesoAgua,
        };

        const resultado = calcularTensoesGeostaticas(input);
        if (resultado.erro) return 0;

        const centro = alturaAterroNoPeriodo + (espessuraArgilaReal / 2);

        const pontos = resultado.pontos_calculo;
        for (let i = 0; i < pontos.length - 1; i++) {
          const p1 = pontos[i];
          const p2 = pontos[i + 1];

          if (centro >= p1.profundidade && centro <= p2.profundidade) {
            const t = (centro - p1.profundidade) / (p2.profundidade - p1.profundidade);
            const sigma1 = p1.tensao_efetiva_vertical ?? 0;
            const sigma2 = p2.tensao_efetiva_vertical ?? 0;
            return sigma1 + t * (sigma2 - sigma1);
          }
        }
        return 0;
      };

      // Calcular σvm′ (tensão do passado - pré-adensamento) - apenas aterro do passado
      const alturaAterroPassadoCalc = camadasAterroPassado.reduce((sum, c) => sum + c.espessura, 0);
      const centroPassado = alturaAterroPassadoCalc + (espessuraArgilaReal / 2);
      setProfundidadeCentro(centroPassado);

      const sigmaVm = calcularTensaoNoPeriodo(camadasAterroPassado);
      setSigmaVmPrime(sigmaVm);

      // Calcular σv0′ (tensão do presente) - apenas aterro do presente
      const sigmaV0 = calcularTensaoNoPeriodo(camadasAterroPresente);
      setSigmaV0Prime(sigmaV0);

      // Calcular σvf′ (tensão do futuro) - camadas do presente + modificações futuras
      // Constrói o perfil futuro completo (presente + edições/adições futuras)
      const camadasFuturoCompleto = [...camadasAterroPresente];

      // Para cada camada futura, verifica se é uma edição (mesmo nome) ou nova
      camadasAterroFuturo.forEach((camadaFuturo) => {
        const indexNoPresente = camadasAterroPresente.findIndex(c => c.nome === camadaFuturo.nome);
        if (indexNoPresente >= 0) {
          // Substitui a camada do presente pela versão editada do futuro
          camadasFuturoCompleto[indexNoPresente] = camadaFuturo;
        } else {
          // Adiciona nova camada do futuro
          camadasFuturoCompleto.push(camadaFuturo);
        }
      });

      const sigmaVf = calcularTensaoNoPeriodo(camadasFuturoCompleto);
      setSigmaVfPrime(sigmaVf);

      // Calcular Δσ′ = σvf′ - σv0′ (acréscimo sobre o presente)
      setDeltaSigma(sigmaVf - sigmaV0);

    } catch (error) {
      console.error("Erro ao calcular tensões:", error);
      setSigmaV0Prime(0);
      setSigmaVmPrime(0);
      setSigmaVfPrime(0);
      setDeltaSigma(0);
    }
  }, [camadaArgila, camadasAterroPassado, camadasAterroPresente, camadasAterroFuturo, perfilForm, config]);

  const handleEditCamadaArgila = (data: {
    espessura: string;
    gamaNat?: string;
    gamaSat?: string;
    profundidadeNA?: string;
    Cc?: string;
    Cr?: string;
    Cv?: string;
    e0?: string;
  }) => {
    setCamadaArgila({
      espessura: parseFloat(data.espessura),
      gamaNat: data.gamaNat && data.gamaNat !== "" ? parseFloat(data.gamaNat) : null,
      gamaSat: data.gamaSat && data.gamaSat !== "" ? parseFloat(data.gamaSat) : null,
      profundidadeNA: data.profundidadeNA && data.profundidadeNA !== "" ? parseFloat(data.profundidadeNA) : null,
      Cc: data.Cc && data.Cc !== "" ? parseFloat(data.Cc) : null,
      Cr: data.Cr && data.Cr !== "" ? parseFloat(data.Cr) : null,
      Cv: data.Cv && data.Cv !== "" ? parseFloat(data.Cv) : null,
      e0: data.e0 && data.e0 !== "" ? parseFloat(data.e0) : null,
    });
    // Camada de argila sempre é compressível
    setCamadaCompressivelIndex(0);
  };

  const handleConfigCamadaBase = (data: { drenante: boolean }) => {
    setCamadaBase(data);
  };

  const handleAddCamadaAterro = (camada: {
    nome?: string;
    espessura: number;
    gamaNat?: number | null;
    gamaSat?: number | null;
  }) => {
    let nomeFinal = camada.nome || "Aterro";

    if (currentPerfilState === "futuro") {
      // No futuro, garante que o nome é único (não conflita com presente ou outras futuras)
      const nomesPresente = camadasAterroPresente.map(c => c.nome);
      const nomesFuturo = camadasAterroFuturo.map(c => c.nome);
      const todosNomes = [...nomesPresente, ...nomesFuturo];

      let contador = 1;
      let nomeBase = nomeFinal;
      while (todosNomes.includes(nomeFinal)) {
        nomeFinal = `${nomeBase} ${contador}`;
        contador++;
      }
    }

    const novaCamada = {
      nome: nomeFinal,
      espessura: camada.espessura,
      gamaNat: camada.gamaNat || undefined,
      gamaSat: camada.gamaSat || undefined,
    };

    if (currentPerfilState === "passado") {
      setCamadasAterroPassado([...camadasAterroPassado, novaCamada]);
    } else if (currentPerfilState === "presente") {
      setCamadasAterroPresente([...camadasAterroPresente, novaCamada]);
    } else if (currentPerfilState === "futuro") {
      // No futuro, novas camadas vão ACIMA das do presente (início do array)
      setCamadasAterroFuturo([novaCamada, ...camadasAterroFuturo]);
    }
  };

  const handleEditCamadaAterro = (index: number, camada: {
    nome?: string;
    espessura: number;
    gamaNat?: number | null;
    gamaSat?: number | null;
  }) => {
    const novaCamada = {
      nome: camada.nome || "Aterro",
      espessura: camada.espessura,
      gamaNat: camada.gamaNat || undefined,
      gamaSat: camada.gamaSat || undefined,
    };

    if (currentPerfilState === "passado") {
      const novasCamadas = [...camadasAterroPassado];
      novasCamadas[index] = novaCamada;
      setCamadasAterroPassado(novasCamadas);
    } else if (currentPerfilState === "presente") {
      const novasCamadas = [...camadasAterroPresente];
      novasCamadas[index] = novaCamada;
      setCamadasAterroPresente(novasCamadas);
    } else if (currentPerfilState === "futuro") {
      // No futuro, sempre edita no futuro (não afeta o presente)
      // Usa camadasAterroAtual para identificar a camada que está sendo editada
      const camadaSendoEditada = camadasAterroAtual[index];

      if (!camadaSendoEditada) return;

      // Verifica se essa camada existe no presente (pelo nome)
      const existeNoPresente = camadasAterroPresente.some(c => c.nome === camadaSendoEditada.nome);

      if (existeNoPresente) {
        // É uma camada do presente que está sendo editada
        const camadaOriginal = camadasAterroPresente.find(c => c.nome === camadaSendoEditada.nome);
        if (!camadaOriginal) return;

        const indexFuturoExistente = camadasAterroFuturo.findIndex(c => c.nome === camadaOriginal.nome);

        if (indexFuturoExistente >= 0) {
          // Atualiza camada futura existente
          const novasCamadas = [...camadasAterroFuturo];
          novasCamadas[indexFuturoExistente] = { ...novaCamada, nome: camadaOriginal.nome };
          setCamadasAterroFuturo(novasCamadas);
        } else {
          // Cria nova entrada no futuro (substitui a do presente)
          const novasCamadas = [...camadasAterroFuturo];
          novasCamadas.push({ ...novaCamada, nome: camadaOriginal.nome });
          setCamadasAterroFuturo(novasCamadas);
        }
      } else {
        // É uma camada nova do futuro
        const indexFuturo = camadasAterroFuturo.findIndex(c => c.nome === camadaSendoEditada.nome);

        if (indexFuturo >= 0) {
          // Atualiza a camada futura existente
          const novasCamadas = [...camadasAterroFuturo];
          novasCamadas[indexFuturo] = { ...novaCamada, nome: camadaSendoEditada.nome };
          setCamadasAterroFuturo(novasCamadas);
        }
      }
    }
  };

  const handleRemoveCamadaAterro = (index: number) => {
    if (currentPerfilState === "passado") {
      setCamadasAterroPassado(camadasAterroPassado.filter((_, i) => i !== index));
    } else if (currentPerfilState === "presente") {
      setCamadasAterroPresente(camadasAterroPresente.filter((_, i) => i !== index));
    } else if (currentPerfilState === "futuro") {
      // No futuro, remove apenas do futuro (não afeta o presente)
      const camadaSendoRemovida = camadasAterroAtual[index];
      if (!camadaSendoRemovida) return;

      // Verifica se é uma camada do presente ou nova do futuro
      const existeNoPresente = camadasAterroPresente.some(c => c.nome === camadaSendoRemovida.nome);

      if (existeNoPresente) {
        // É uma camada do presente - remove a versão futura se existir
        const camadaOriginal = camadasAterroPresente.find(c => c.nome === camadaSendoRemovida.nome);
        if (camadaOriginal) {
          const indexFuturo = camadasAterroFuturo.findIndex(c => c.nome === camadaOriginal.nome);
          if (indexFuturo >= 0) {
            setCamadasAterroFuturo(camadasAterroFuturo.filter((_, i) => i !== indexFuturo));
          }
        }
      } else {
        // É uma camada nova do futuro - remove diretamente
        const indexFuturo = camadasAterroFuturo.findIndex(c => c.nome === camadaSendoRemovida.nome);
        if (indexFuturo >= 0) {
          setCamadasAterroFuturo(camadasAterroFuturo.filter((_, i) => i !== indexFuturo));
        }
      }
    }
  };

  // Obter camadas de aterro do período atual
  // No futuro, mostra uma cópia do presente (mas edições vão para futuro sem afetar presente)
  const camadasAterroAtual = useMemo(() => {
    if (currentPerfilState === "passado") {
      return camadasAterroPassado;
    } else if (currentPerfilState === "presente") {
      return camadasAterroPresente;
    } else if (currentPerfilState === "futuro") {
      // No futuro, começa com uma cópia das camadas do presente
      const resultado = camadasAterroPresente.map(c => ({ ...c }));

      // Processa as camadas futuras para aplicar edições e adições
      const novasCamadas: typeof camadasAterroFuturo = [];

      camadasAterroFuturo.forEach((camadaFuturo) => {
        // Verifica se é uma edição: procura pelo nome que corresponde a uma camada do presente
        const indexNoPresente = camadasAterroPresente.findIndex(c => c.nome === camadaFuturo.nome);

        if (indexNoPresente >= 0) {
          // É uma edição: substitui a camada do presente no índice correspondente
          resultado[indexNoPresente] = { ...camadaFuturo };
        } else {
          // É uma nova camada: vai para o início (acima das do presente)
          novasCamadas.push({ ...camadaFuturo });
        }
      });

      // Combina: novas camadas primeiro (acima), depois as camadas do presente (editadas ou não)
      const resultadoFinal = [
        ...novasCamadas,
        ...resultado
      ];

      return resultadoFinal;
    }
    return [];
  }, [currentPerfilState, camadasAterroPassado, camadasAterroPresente, camadasAterroFuturo]);

  const handleAddCamada = () => {
    append({
      id: generateId(),
      nome: `Camada ${fields.length + 1}`,
      espessura: "",
      profundidadeNA: "",
      capilaridade: "",
      gamaNat: "",
      gamaSat: "",
      Ko: "",
      impermeavel: false,
      compressivel: false,
    });
    setCurrentCamadaIndex(fields.length);
    setDialogCamadaOpen(true);
  };

  const handleEditCamada = (index: number) => {
    const camada = perfilForm.getValues(`camadas.${index}`);
    setCamadaEditando({
      nome: camada.nome,
      espessura: camada.espessura,
      profundidadeNA: camada.profundidadeNA || "",
      capilaridade: camada.capilaridade || "",
      gamaNat: camada.gamaNat || "",
      gamaSat: camada.gamaSat || "",
      Ko: camada.Ko || "",
      impermeavel: camada.impermeavel || false,
      compressivel: camada.compressivel || false,
    });
    setCurrentCamadaIndex(index);
    setDialogCamadaOpen(true);
  };

  const handleConfirmCamada = (data: CamadaData) => {
    if (camadaEditando !== undefined) {
      // Editar camada existente
      perfilForm.setValue(`camadas.${currentCamadaIndex}`, {
        ...perfilForm.getValues(`camadas.${currentCamadaIndex}`),
        ...data,
        id: perfilForm.getValues(`camadas.${currentCamadaIndex}`).id,
      });

      // Se esta camada foi marcada como compressível, atualizar índice
      if (data.compressivel) {
        setCamadaCompressivelIndex(currentCamadaIndex);
      } else if (camadaCompressivelIndex === currentCamadaIndex) {
        setCamadaCompressivelIndex(null);
      }
    } else {
      // Nova camada
      const novaCamada = {
        id: generateId(),
        ...data,
      };
      append(novaCamada);

      if (data.compressivel) {
        setCamadaCompressivelIndex(fields.length);
      }
    }

    setDialogCamadaOpen(false);
    setCamadaEditando(undefined);
  };

  const handleRemoveCamada = (index: number) => {
    if (camadaCompressivelIndex === index) {
      setCamadaCompressivelIndex(null);
    } else if (camadaCompressivelIndex !== null && camadaCompressivelIndex > index) {
      setCamadaCompressivelIndex(camadaCompressivelIndex - 1);
    }
    remove(index);
  };

  // Validar se pode calcular
  const podeCalcular = useMemo(() => {
    if (!camadaArgila) return false;
    if (sigmaV0Prime === null || sigmaV0Prime === 0) return false; // Precisa de σv0′ (presente)
    if (sigmaVmPrime === null || sigmaVmPrime === 0) return false; // Precisa de σvm′ (passado)
    if (currentPerfilState === "futuro" && (deltaSigma === null || deltaSigma === 0)) return false; // Precisa de Δσ′ (futuro)

    // Verificar se parâmetros da argila estão preenchidos
    if (!camadaArgila.e0 || !camadaArgila.Cc || !camadaArgila.Cr) return false;

    return true;
  }, [camadaArgila, sigmaV0Prime, sigmaVmPrime, deltaSigma, currentPerfilState]);

  const handleCarregarExemplo = (exemplo: ExemploRecalque) => {
    // Limpar primeiro
    perfilForm.reset();
    setDeltaSigma(0);
    setCamadasAterroPassado([]);
    setCamadasAterroPresente([]);
    setCamadasAterroFuturo([]);
    setCamadaArgila({
      espessura: 10,
      gamaNat: null,
      gamaSat: null,
      profundidadeNA: null,
      Cc: null,
      Cr: null,
      Cv: null,
      e0: null,
    });
    setCamadaBase({ drenante: false });
    setCamadaCompressivelIndex(null);
    setProfundidadeCentro(null);
    setSigmaV0Prime(0);
    setSigmaVmPrime(0);
    setSigmaVfPrime(0);
    setDeltaSigma(0);
    setCurrentPerfilState("presente");
    setResults(null);

    // Aguardar um pouco para garantir que o estado foi limpo
    setTimeout(() => {
      // Configurar perfil
      const camadasComIds = exemplo.dados.perfil.camadas.map(camada => ({
        ...camada,
        id: generateId(),
      }));
      perfilForm.setValue("camadas", camadasComIds);
      perfilForm.setValue("profundidadeNA", exemplo.dados.perfil.profundidadeNA);
      perfilForm.setValue("alturaCapilar", exemplo.dados.perfil.alturaCapilar);
      perfilForm.setValue("pesoEspecificoAgua", exemplo.dados.perfil.pesoEspecificoAgua);

      // Configurar argila
      setCamadaArgila(exemplo.dados.camadaArgila);
      setCamadaCompressivelIndex(0);

      // Configurar base
      setCamadaBase(exemplo.dados.camadaBase);

      // Configurar aterros
      setCamadasAterroPassado(exemplo.dados.camadasAterroPassado);
      setCamadasAterroPresente(exemplo.dados.camadasAterroPresente);
      setCamadasAterroFuturo(exemplo.dados.camadasAterroFuturo);

      // Mudar para período inicial
      setCurrentPerfilState(exemplo.dados.periodoInicial);

      toast.success(`Exemplo "${exemplo.nome}" carregado com sucesso!`);
    }, 100);
  };

  const handleCalcular = () => {
    if (!podeCalcular) {
      toast.error("Preencha todos os dados necessários nas três abas");
      return;
    }

    setIsCalculating(true);

    try {
      if (!camadaArgila || !camadaArgila.e0 || !camadaArgila.Cc || !camadaArgila.Cr) {
        toast.error("Configure os parâmetros da camada de argila (e0, Cc, Cr)");
        setIsCalculating(false);
        return;
      }

      const espessura = camadaArgila.espessura;
      const e0 = camadaArgila.e0;
      const Cc = camadaArgila.Cc;
      const Cr = camadaArgila.Cr;

      // σv0′ é do presente, σvm′ é do passado (pré-adensamento)
      const sigmaV0PrimeVal = sigmaV0Prime!;
      const sigmaVmPrimeVal = sigmaVmPrime!;
      const deltaSigmaPrime = deltaSigma!;
      const coeficienteAdensamento = camadaArgila.Cv ?? null;
      const drenagemDupla = camadaBase?.drenante ?? false;
      const alturaDrenagem = camadaArgila.espessura / (drenagemDupla ? 2 : 1);

      const input: RecalqueAdensamentoInput = {
        espessura_camada: espessura,
        indice_vazios_inicial: e0,
        Cc,
        Cr,
        tensao_efetiva_inicial: sigmaV0PrimeVal, // σv0′ do presente
        tensao_pre_adensamento: sigmaVmPrimeVal, // σvm′ do passado (pré-adensamento)
        acrescimo_tensao: deltaSigmaPrime,
      };

      if (coeficienteAdensamento && coeficienteAdensamento > 0) {
        input.coeficiente_adensamento = coeficienteAdensamento;
        input.altura_drenagem = alturaDrenagem;
        input.drenagem_dupla = drenagemDupla;
      }

      const resultado = calcularRecalqueAdensamento(input);
      setResults(resultado);

      if (resultado.erro) {
        toast.error("Erro no cálculo", { description: resultado.erro });
      } else {
        toast.success("Cálculo realizado com sucesso!");
      }
    } catch (error: any) {
      toast.error("Erro ao calcular", {
        description: error.message || "Erro desconhecido"
      });
      setResults(null);
    } finally {
      setIsCalculating(false);
    }
  };

  const handleExportPDF = () => {
    console.log('🔍 [DEBUG] handleExportPDF chamado');
    console.log('🔍 [DEBUG] results:', results);
    console.log('🔍 [DEBUG] results?.erro:', results?.erro);

    if (!results || results.erro) {
      console.log('🔍 [DEBUG] Retornando early - sem results ou com erro');
      return;
    }

    // Gerar nome padrão usando a função auxiliar
    const defaultName = generateDefaultPDFFileName("Recalque por Adensamento");
    console.log('🔍 [DEBUG] Nome padrão gerado:', defaultName);

    setPdfFileName(defaultName);
    console.log('🔍 [DEBUG] Abrindo diálogo de exportação...');
    setExportPDFDialogOpen(true);
  };

  const handleConfirmExportPDF = async () => {
    if (!results || results.erro) return;

    setIsExportingPDF(true);

    // Parâmetros de entrada
    const inputs: { label: string; value: string }[] = [];

    // Parâmetros da camada de argila
    if (camadaArgila?.espessura) inputs.push({ label: "Espessura da Camada (H0)", value: `${camadaArgila.espessura.toFixed(2)} m` });
    if (camadaArgila?.e0) inputs.push({ label: "Índice de Vazios Inicial (e0)", value: camadaArgila.e0.toFixed(3) });
    if (camadaArgila?.Cc) inputs.push({ label: "Índice de Compressão (Cc)", value: camadaArgila.Cc.toFixed(3) });
    if (camadaArgila?.Cr) inputs.push({ label: "Índice de Recompressão (Cr)", value: camadaArgila.Cr.toFixed(3) });
    if (camadaArgila?.Cv) inputs.push({ label: "Coeficiente de Adensamento (Cv)", value: `${camadaArgila.Cv.toFixed(2)} m²/ano` });

    // Tensões
    if (sigmaV0Prime) inputs.push({ label: "Tensão Efetiva Inicial - Presente", value: `${formatNumberForExport(sigmaV0Prime)} kPa` });
    if (sigmaVmPrime) inputs.push({ label: "Tensão de Pré-Adensamento - Passado", value: `${formatNumberForExport(sigmaVmPrime)} kPa` });
    if (deltaSigma) inputs.push({ label: "Acréscimo de Tensão", value: `${formatNumberForExport(deltaSigma)} kPa` });

    // Configurações do perfil
    if (config.pesoEspecificoAgua) inputs.push({ label: "Peso Específico da Água", value: `${config.pesoEspecificoAgua} kN/m³` });
    const profundidadeNA = perfilForm.watch("profundidadeNA");
    if (profundidadeNA) inputs.push({ label: "Nível d'Água (rel. ao topo da argila)", value: `${profundidadeNA} m` });

    // Resultados
    const resultsList: { label: string; value: string; highlight?: boolean }[] = [];
    if (results.recalque_total_primario != null) {
      resultsList.push({
        label: "Recalque Total Primário",
        value: `${formatNumberForExport(results.recalque_total_primario)} m (${(results.recalque_total_primario * 1000).toFixed(2)} mm)`,
        highlight: true
      });
    }
    if (camadaArgila && results.recalque_total_primario) {
      const porcentagem = ((results.recalque_total_primario / camadaArgila.espessura) * 100).toFixed(2);
      resultsList.push({
        label: "Porcentagem de Recalque",
        value: `${porcentagem}%`
      });
    }
    if (results.estado_adensamento) {
      resultsList.push({ label: "Estado de Adensamento", value: results.estado_adensamento });
    }
    if (results.RPA != null) {
      resultsList.push({ label: "RPA Calculado (sigma vm linha / sigma v0 linha)", value: formatNumberForExport(results.RPA, 2) });
    }
    if (results.deformacao_volumetrica != null) {
      resultsList.push({ label: "Deformação Volumétrica", value: formatNumberForExport(results.deformacao_volumetrica, 5) });
    }
    if (results.tensao_efetiva_final != null) {
      resultsList.push({ label: "Tensão Efetiva Final (sigma vf linha)", value: `${formatNumberForExport(results.tensao_efetiva_final)} kPa` });
    }

    // Fórmulas utilizadas
    const formulas = [
      {
        label: "Tensão Efetiva Final",
        formula: "sigma vf linha = sigma v0 linha + Delta sigma linha",
        latex: false,
        description: "Soma da tensão efetiva inicial com o acréscimo de tensão"
      },
      {
        label: "Razão de Pré-Adensamento (RPA)",
        formula: "RPA = sigma vm linha / sigma v0 linha",
        latex: false,
        description: "Relaciona a tensão de pré-adensamento com a tensão efetiva inicial"
      },
      {
        label: "Normalmente Adensado - Deformação",
        formula: "epsilon v = (Cc / (1 + e0)) × log10(sigma vf linha / sigma v0 linha)",
        latex: false,
        description: "Deformação para solo normalmente adensado (RPA ≈ 1)"
      },
      {
        label: "Pré-Adensado - Recompressão",
        formula: "epsilon v = (Cr / (1 + e0)) × log10(sigma vf linha / sigma v0 linha)",
        latex: false,
        description: "Deformação quando sigma vf linha menor ou igual a sigma vm linha (apenas recompressão)"
      },
      {
        label: "Pré-Adensado - Recompressão + Compressão Virgem",
        formula: "epsilon v = (Cr / (1 + e0)) × log10(sigma vm linha / sigma v0 linha) + (Cc / (1 + e0)) × log10(sigma vf linha / sigma vm linha)",
        latex: false,
        description: "Deformação quando sigma vf linha maior que sigma vm linha (recompressão até sigma vm linha, depois compressão virgem)"
      },
      {
        label: "Recalque Total",
        formula: "recalque = epsilon v × H0",
        latex: false,
        description: "Recalque calculado a partir da deformação volumétrica e espessura inicial"
      },
    ];

    // Não incluir tabelas de camadas
    const tabelas: { title: string; headers: string[]; rows: (string | number)[][] }[] = [];

    const exportData: ExportData = {
      moduleName: "recalque-adensamento",
      moduleTitle: "Recalque por Adensamento",
      inputs,
      results: resultsList,
      formulas,
      tables: tabelas,
      customFileName: pdfFileName,
      customTitle: settings.printSettings?.includeCustomTitle ? customReportTitle : undefined,
      theme: undefined, // Usar tema do sistema
      printSettings: {
        ...settings.printSettings,
        // Forçar quebra de página após inputs usando uma flag especial se necessário
      }
    };

    // Persistir último título personalizado para ser usado como padrão
    try {
      if (settings.printSettings?.includeCustomTitle) {
        localStorage.setItem('edusolo_last_custom_report_title', customReportTitle || '');
      }
    } catch { }

    console.log('🔍 [DEBUG] Iniciando exportação PDF...');
    console.log('🔍 [DEBUG] exportData:', {
      moduleName: exportData.moduleName,
      moduleTitle: exportData.moduleTitle,
      numInputs: exportData.inputs.length,
      numResults: exportData.results.length,
      numFormulas: exportData.formulas?.length || 0,
      numTables: exportData.tables?.length || 0,
      hasCustomFileName: !!exportData.customFileName,
      hasCustomTitle: !!exportData.customTitle,
      hasPrintSettings: !!exportData.printSettings
    });
    console.log('🔍 [DEBUG] pdfFileName:', pdfFileName);

    try {
      console.log('🔍 [DEBUG] Chamando exportToPDF...');
      const result = await exportToPDF(exportData, true);
      console.log('🔍 [DEBUG] exportToPDF retornou:', result);
      console.log('🔍 [DEBUG] É Blob?', result instanceof Blob);
      if (result instanceof Blob) {
        console.log('🔍 [DEBUG] Tamanho do Blob:', result.size, 'bytes');
      }

      setIsExportingPDF(false);

      if (result instanceof Blob) {
        console.log('🔍 [DEBUG] Blob válido, preparando para salvar...');
        try {
          const reportName = pdfFileName.replace('.pdf', '');
          console.log('🔍 [DEBUG] reportName:', reportName);
          console.log('🔍 [DEBUG] Chamando prepareReportForStorage...');

          const prepared = await prepareReportForStorage({
            name: reportName,
            moduleType: 'recalque-adensamento',
            moduleName: 'Recalque por Adensamento',
            pdfBlob: result,
            calculationData: {
              camadaArgila,
              camadasAterroPassado,
              camadasAterroPresente,
              camadasAterroFuturo,
              sigmaV0Prime,
              sigmaVmPrime,
              sigmaVfPrime,
              deltaSigma,
              results,
              exportDate: new Date().toISOString()
            }
          });

          console.log('🔍 [DEBUG] prepareReportForStorage concluído:', prepared);
          console.log('🔍 [DEBUG] Chamando addReport...');
          addReport(prepared);
          console.log('🔍 [DEBUG] addReport concluído');

          setExportPDFDialogOpen(false);
          console.log('🔍 [DEBUG] Fechando diálogo de exportação');

          notify.success({ title: "Relatório gerado", description: "PDF gerado com sucesso." });
          console.log('🔍 [DEBUG] Notificação de sucesso enviada');
          console.log('🔍 [DEBUG] ✅ Processo completo concluído com sucesso!');
        } catch (error) {
          console.error('❌ [DEBUG] Erro ao salvar relatório:', error);
          console.error('❌ [DEBUG] Stack trace:', error instanceof Error ? error.stack : 'N/A');
          console.error('❌ [DEBUG] Error name:', error instanceof Error ? error.name : 'N/A');
          console.error('❌ [DEBUG] Error message:', error instanceof Error ? error.message : String(error));
          notify.warning({ title: "PDF exportado", description: "Não foi possível salvar em Relatórios." });
        }
      } else {
        console.error('❌ [DEBUG] exportToPDF não retornou Blob. Tipo:', typeof result, 'Valor:', result);
        notify.error({ title: "Erro ao exportar", description: "Não foi possível gerar o PDF." });
      }
    } catch (error) {
      console.error('❌ [DEBUG] Erro durante exportToPDF:', error);
      console.error('❌ [DEBUG] Stack trace:', error instanceof Error ? error.stack : 'N/A');
      console.error('❌ [DEBUG] Error name:', error instanceof Error ? error.name : 'N/A');
      console.error('❌ [DEBUG] Error message:', error instanceof Error ? error.message : String(error));
      setIsExportingPDF(false);
      notify.error({ title: "Erro ao exportar", description: error instanceof Error ? error.message : "Erro desconhecido ao gerar o PDF." });
    }
  };

  const handleExportExcel = async () => {
    if (!results || results.erro) return;

    // Sheet de Dados de Entrada
    const entradaData: { label: string; value: string | number }[] = [
      { label: "=== DADOS DE ENTRADA ===", value: "" },
      { label: "", value: "" },
    ];

    // Parâmetros da camada de argila
    entradaData.push({ label: "-- Camada de Argila --", value: "" });
    if (camadaArgila?.espessura) entradaData.push({ label: "Espessura (m)", value: camadaArgila.espessura.toFixed(2) });
    if (camadaArgila?.e0) entradaData.push({ label: "Índice de Vazios Inicial (e₀)", value: camadaArgila.e0.toFixed(3) });
    if (camadaArgila?.Cc) entradaData.push({ label: "Índice de Compressão (Cc)", value: camadaArgila.Cc.toFixed(3) });
    if (camadaArgila?.Cr) entradaData.push({ label: "Índice de Recompressão (Cr)", value: camadaArgila.Cr.toFixed(3) });
    if (camadaArgila?.Cv) entradaData.push({ label: "Coeficiente de Adensamento - Cv (m²/ano)", value: camadaArgila.Cv.toFixed(2) });
    entradaData.push({ label: "", value: "" });

    // Tensões
    entradaData.push({ label: "-- Tensões Efetivas --", value: "" });
    if (sigmaV0Prime) entradaData.push({ label: "Tensão Efetiva Inicial - Presente (σ'v₀) (kPa)", value: sigmaV0Prime.toFixed(2) });
    if (sigmaVmPrime) entradaData.push({ label: "Tensão de Pré-Adensamento - Passado (σ'vm) (kPa)", value: sigmaVmPrime.toFixed(2) });
    if (deltaSigma) entradaData.push({ label: "Acréscimo de Tensão (Δσ') (kPa)", value: deltaSigma.toFixed(2) });
    entradaData.push({ label: "", value: "" });

    // Configurações
    entradaData.push({ label: "-- Configurações --", value: "" });
    if (config.pesoEspecificoAgua) entradaData.push({ label: "Peso Específico da Água (kN/m³)", value: config.pesoEspecificoAgua });
    const profundidadeNA = perfilForm.watch("profundidadeNA");
    if (profundidadeNA) entradaData.push({ label: "Nível d'Água (m)", value: profundidadeNA });

    // Sheet de Resultados
    const resultadosData: { label: string; value: string | number }[] = [
      { label: "=== RESULTADOS ===", value: "" },
      { label: "", value: "" },
    ];

    if (results.recalque_total_primario != null) {
      resultadosData.push({ label: "Recalque Total Primário (m)", value: results.recalque_total_primario.toFixed(4) });
      resultadosData.push({ label: "Recalque Total Primário (mm)", value: (results.recalque_total_primario * 1000).toFixed(2) });
    }
    if (camadaArgila && results.recalque_total_primario) {
      const porcentagem = ((results.recalque_total_primario / camadaArgila.espessura) * 100).toFixed(2);
      resultadosData.push({ label: "Porcentagem de Recalque (%)", value: porcentagem });
    }
    if (results.estado_adensamento) {
      resultadosData.push({ label: "Estado de Adensamento", value: results.estado_adensamento });
    }
    if (results.RPA != null) {
      resultadosData.push({ label: "RPA Calculado", value: results.RPA.toFixed(2) });
    }
    if (results.deformacao_volumetrica != null) {
      resultadosData.push({ label: "Deformação Volumétrica", value: results.deformacao_volumetrica.toFixed(5) });
    }
    if (results.tensao_efetiva_final != null) {
      resultadosData.push({ label: "Tensão Efetiva Final - σ'vf (kPa)", value: results.tensao_efetiva_final.toFixed(2) });
    }
    if (camadaArgila?.espessura) {
      resultadosData.push({ label: "Espessura da Camada (m)", value: camadaArgila.espessura.toFixed(2) });
    }

    const sheets: { name: string; data: { label: string; value: string | number }[] }[] = [
      { name: "Dados de Entrada", data: entradaData },
      { name: "Resultados", data: resultadosData }
    ];

    const excelData: ExcelExportData = {
      moduleName: "recalque-adensamento",
      moduleTitle: "Recalque por Adensamento",
      sheets,
    };

    const success = await exportToExcel(excelData);
    if (success) {
      notify.success({ description: "Excel exportado com sucesso!" });
    } else {
      notify.error({ description: "Erro ao exportar Excel." });
    }
  };

  const camadasParaTabela = useMemo(() => {
    return fields.map((_, idx) => {
      const camada = perfilForm.watch(`camadas.${idx}`);
      return {
        espessura: parseFloat(camada.espessura || "0"),
        gamaNat: camada.gamaNat && camada.gamaNat !== "" ? parseFloat(camada.gamaNat) : null,
        gamaSat: camada.gamaSat && camada.gamaSat !== "" ? parseFloat(camada.gamaSat) : null,
        Ko: camada.Ko && camada.Ko !== "" ? parseFloat(camada.Ko) : 0.5,
      };
    });
  }, [fields, perfilForm]);

  const camadaArgilaParaDiagrama = useMemo(() => {
    if (!camadaArgila) return null;
    return {
      espessura: camadaArgila.espessura,
      gamaNat: camadaArgila.gamaNat ?? null,
      gamaSat: camadaArgila.gamaSat ?? null,
      profundidadeNA: camadaArgila.profundidadeNA ?? null,
      Cc: camadaArgila.Cc ?? null,
      Cr: camadaArgila.Cr ?? null,
      Cv: camadaArgila.Cv ?? null,
      e0: camadaArgila.e0 ?? null,
      compressivel: true, // Sempre compressível
    };
  }, [camadaArgila]);

  const camadaBaseParaDiagrama = useMemo(() => {
    return camadaBase;
  }, [camadaBase]);

  const camadasAterroParaDiagrama = useMemo(() => {
    return camadasAterroAtual.map(camada => ({
      nome: camada.nome,
      espessura: camada.espessura,
      gamaNat: camada.gamaNat ?? null,
      gamaSat: camada.gamaSat ?? null,
    }));
  }, [camadasAterroAtual]);

  const profundidadeNA = parseFloat(perfilForm.watch("profundidadeNA") || "0") || 0;

  // Estado para diálogo de ampliar
  const [dialogAmpliarOpen, setDialogAmpliarOpen] = useState(false);

  // Preparar dados dos 3 períodos para o diálogo ampliado
  const camadasAterroPassadoDiagrama = useMemo(() => {
    return camadasAterroPassado.map(camada => ({
      nome: camada.nome,
      espessura: camada.espessura,
      gamaNat: camada.gamaNat ?? null,
      gamaSat: camada.gamaSat ?? null,
    }));
  }, [camadasAterroPassado]);

  const camadasAterroPresenteDiagrama = useMemo(() => {
    return camadasAterroPresente.map(camada => ({
      nome: camada.nome,
      espessura: camada.espessura,
      gamaNat: camada.gamaNat ?? null,
      gamaSat: camada.gamaSat ?? null,
    }));
  }, [camadasAterroPresente]);

  const camadasAterroFuturoDiagrama = useMemo(() => {
    // Combinar presente + futuras modificações
    const camadasFuturoCompleto = [...camadasAterroPresente];
    camadasAterroFuturo.forEach((camadaFuturo) => {
      const indexNoPresente = camadasAterroPresente.findIndex(c => c.nome === camadaFuturo.nome);
      if (indexNoPresente >= 0) {
        camadasFuturoCompleto[indexNoPresente] = camadaFuturo;
      } else {
        camadasFuturoCompleto.push(camadaFuturo);
      }
    });
    return camadasFuturoCompleto.map(camada => ({
      nome: camada.nome,
      espessura: camada.espessura,
      gamaNat: camada.gamaNat ?? null,
      gamaSat: camada.gamaSat ?? null,
    }));
  }, [camadasAterroPresente, camadasAterroFuturo]);

  return (
    <div className="space-y-4 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <Helmet>
        <title>Recalque por Adensamento | EduSolos</title>
        <meta name="description" content="Calcule o recalque final e a evolução do recalque com o tempo em camadas de argila. Ferramenta completa baseada na Teoria de Adensamento de Terzaghi." />
      </Helmet>
      <PrintHeader moduleTitle="Recalque por Adensamento" moduleName="recalque-adensamento" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 animate-in fade-in slide-in-from-left-4 duration-500" data-tour="module-header">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-gradient-to-br from-amber-500 via-orange-500 to-red-500 flex items-center justify-center shadow-lg transition-transform hover:scale-110 hover:rotate-3">
            <MoveDown className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Recalque por Adensamento</h1>
            <p className="text-muted-foreground text-xs sm:text-sm">Cálculo de recalque primário por adensamento em camadas compressíveis</p>
          </div>
        </div>

        <div className="flex items-center gap-2" data-tour="actions">
          <DialogExemplos onSelectExample={handleCarregarExemplo} disabled={isCalculating} />
          <DialogConfiguracoes
            configInicial={config}
            onConfirm={setConfig}
            disabled={isCalculating}
          />
          <CalculationActions
            onSave={() => setSaveDialogOpen(true)}
            onLoad={() => setLoadDialogOpen(true)}
            onExportPDF={handleExportPDF}
            onExportExcel={handleExportExcel}
            hasResults={results !== null && !results.erro}
            isCalculating={isCalculating}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {/* Formulário - Abas */}
        <Card className="glass flex flex-col p-4 sm:p-6 animate-in fade-in slide-in-from-left-4 duration-700" style={{ animationDelay: '100ms', animationFillMode: 'backwards' }}>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-xl">
              <Info className="w-5 h-5" />
              Análise de Recalque por Adensamento
              <Dialog open={dialogAmpliarOpen} onOpenChange={setDialogAmpliarOpen}>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Maximize2 className="w-4 h-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-5xl max-h-[90vh] w-full p-6 overflow-hidden flex flex-col">
                  <DialogHeader className="mb-4 flex-shrink-0">
                    <DialogTitle className="text-xl">Comparação dos 3 Perfis (Passado, Presente e Futuro)</DialogTitle>
                  </DialogHeader>
                  <div className="grid grid-cols-3 gap-6 overflow-y-auto overflow-x-hidden flex-1 min-h-0 items-end">
                    {/* Perfil Passado */}
                    <div className="space-y-3 flex flex-col">
                      <h3 className="text-lg font-semibold text-center">Passado</h3>
                      <div className="border-2 rounded-lg overflow-hidden">
                        <DiagramaRecalque
                          camadaArgila={camadaArgilaParaDiagrama}
                          camadaBase={camadaBaseParaDiagrama}
                          camadasAterro={camadasAterroPassadoDiagrama}
                          profundidadeNA={profundidadeNA}
                          alturaCapilar={parseFloat(perfilForm.watch("alturaCapilar") || "0") || 0}
                          onEditCamadaArgila={() => { }}
                          onConfigCamadaBase={() => { }}
                          onAddCamadaAterro={() => { }}
                          onEditCamadaAterro={() => { }}
                          onRemoveCamadaAterro={() => { }}
                          camadaCompressivelIndex={camadaArgilaParaDiagrama?.compressivel ? 0 : null}
                          currentPerfilState="passado"
                          onPerfilStateChange={() => { }}
                          interactive={false}
                          hideTabs={true}
                        />
                      </div>
                    </div>

                    {/* Perfil Presente */}
                    <div className="space-y-3 flex flex-col">
                      <h3 className="text-lg font-semibold text-center">Presente</h3>
                      <div className="border-2 rounded-lg overflow-hidden">
                        <DiagramaRecalque
                          camadaArgila={camadaArgilaParaDiagrama}
                          camadaBase={camadaBaseParaDiagrama}
                          camadasAterro={camadasAterroPresenteDiagrama}
                          profundidadeNA={profundidadeNA}
                          alturaCapilar={parseFloat(perfilForm.watch("alturaCapilar") || "0") || 0}
                          onEditCamadaArgila={() => { }}
                          onConfigCamadaBase={() => { }}
                          onAddCamadaAterro={() => { }}
                          onEditCamadaAterro={() => { }}
                          onRemoveCamadaAterro={() => { }}
                          camadaCompressivelIndex={camadaArgilaParaDiagrama?.compressivel ? 0 : null}
                          currentPerfilState="presente"
                          onPerfilStateChange={() => { }}
                          interactive={false}
                          hideTabs={true}
                        />
                      </div>
                    </div>

                    {/* Perfil Futuro */}
                    <div className="space-y-3 flex flex-col">
                      <h3 className="text-lg font-semibold text-center">Futuro</h3>
                      <div className="border-2 rounded-lg overflow-hidden">
                        <DiagramaRecalque
                          camadaArgila={camadaArgilaParaDiagrama}
                          camadaBase={camadaBaseParaDiagrama}
                          camadasAterro={camadasAterroFuturoDiagrama}
                          profundidadeNA={profundidadeNA}
                          alturaCapilar={parseFloat(perfilForm.watch("alturaCapilar") || "0") || 0}
                          onEditCamadaArgila={() => { }}
                          onConfigCamadaBase={() => { }}
                          onAddCamadaAterro={() => { }}
                          onEditCamadaAterro={() => { }}
                          onRemoveCamadaAterro={() => { }}
                          camadaCompressivelIndex={camadaArgilaParaDiagrama?.compressivel ? 0 : null}
                          currentPerfilState="futuro"
                          onPerfilStateChange={() => { }}
                          interactive={false}
                          hideTabs={true}
                        />
                      </div>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="w-4 h-4 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent side="right" className="max-w-xs">
                    <div className="space-y-1.5">
                      <p className="font-semibold">💡 Como usar:</p>
                      <ul className="space-y-1 text-xs">
                        <li>• Aba 1: Defina o perfil atual e marque a camada compressível</li>
                        <li>• Aba 2: Informe o acréscimo de tensão devido ao carregamento</li>
                        <li>• Aba 3: Insira os parâmetros da argila (e0, Cc, Cr, RPA/σvm′)</li>
                        <li>• Use o switch para visualizar Passado/Presente/Futuro</li>
                      </ul>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </CardTitle>
          </CardHeader>

          <CardContent className="flex-1 p-4 pt-0 min-h-[420px]">
            <div className="space-y-4">

              {/* Perfil e Parâmetros */}
              <div className="space-y-4 mt-4">
                <DiagramaRecalque
                  camadaArgila={camadaArgilaParaDiagrama}
                  camadaBase={camadaBaseParaDiagrama}
                  camadasAterro={camadasAterroParaDiagrama}
                  profundidadeNA={profundidadeNA}
                  alturaCapilar={parseFloat(perfilForm.watch("alturaCapilar") || "0") || 0}
                  onEditCamadaArgila={handleEditCamadaArgila}
                  onConfigCamadaBase={handleConfigCamadaBase}
                  onAddCamadaAterro={handleAddCamadaAterro}
                  onEditCamadaAterro={handleEditCamadaAterro}
                  onRemoveCamadaAterro={handleRemoveCamadaAterro}
                  camadaCompressivelIndex={camadaArgilaParaDiagrama?.compressivel ? 0 : null}
                  currentPerfilState={currentPerfilState}
                  onPerfilStateChange={setCurrentPerfilState}
                  interactive={true}
                />

              </div>
            </div>
          </CardContent>
        </Card>

        {/* Resultados */}
        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-700" style={{ animationDelay: '200ms', animationFillMode: 'backwards' }}>
          {/* Botões de ação */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <MoveDown className="w-4 h-4" />
                Ações
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-2">
                <Button
                  onClick={handleCalcular}
                  disabled={!podeCalcular || isCalculating}
                  className="w-full h-10"
                  data-tour="btn-calcular"
                >
                  <MoveDown className="w-4 h-4 mr-1.5" />
                  {isCalculating ? "Calculando..." : "Calcular Recalque"}
                </Button>
                <Button
                  type="button"
                  onClick={() => {
                    perfilForm.reset();
                    setDeltaSigma(0);
                    setCamadasAterroPassado([]);
                    setCamadasAterroPresente([]);
                    setCamadasAterroFuturo([]);
                    setCamadaArgila({
                      espessura: 10,
                      gamaNat: null,
                      gamaSat: null,
                      profundidadeNA: null,
                      Cc: null,
                      Cr: null,
                      Cv: null,
                      e0: null,
                    });
                    setCamadaBase({ drenante: false });
                    setCamadaCompressivelIndex(null);
                    setProfundidadeCentro(null);
                    setSigmaV0Prime(0);
                    setSigmaVmPrime(0);
                    setSigmaVfPrime(0);
                    setDeltaSigma(0);
                    setCurrentPerfilState("presente");
                    setResults(null);
                  }}
                  variant="outline"
                  disabled={isCalculating}
                  className="w-full h-10"
                >
                  Limpar
                </Button>
              </div>
            </CardContent>
          </Card>
          {/* Informações da Camada de Argila - mostra apenas quando NÃO há resultados */}
          {camadaArgilaParaDiagrama && !results && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Info className="w-4 h-4" />
                  Camada de Argila
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <Label className="text-muted-foreground text-xs">Espessura</Label>
                    <p className="font-medium">{camadaArgilaParaDiagrama.espessura.toFixed(2)} m</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-xs">Profundidade do Centro (z)</Label>
                    <p className="font-medium">{profundidadeCentro?.toFixed(2) || "-"} m</p>
                  </div>
                  {currentPerfilState === "passado" && (
                    <div>
                      <Label className="text-muted-foreground text-xs">Tensão de Pré-Adensamento (σ<sub>vm</sub>′)</Label>
                      <p className="font-medium">
                        {sigmaVmPrime !== null ? `${sigmaVmPrime.toFixed(2)} kPa` : "0.00 kPa"}
                      </p>
                    </div>
                  )}
                  {currentPerfilState === "presente" && (
                    <div>
                      <Label className="text-muted-foreground text-xs">Tensão Efetiva Inicial (σ<sub>v0</sub>′)</Label>
                      <p className="font-medium">
                        {sigmaV0Prime !== null ? `${sigmaV0Prime.toFixed(2)} kPa` : "0.00 kPa"}
                      </p>
                    </div>
                  )}
                  {currentPerfilState === "futuro" && (
                    <>
                      <div>
                        <Label className="text-muted-foreground text-xs">Tensão Efetiva Final (σ<sub>vf</sub>′)</Label>
                        <p className="font-medium">
                          {sigmaVfPrime !== null ? `${sigmaVfPrime.toFixed(2)} kPa` : "0.00 kPa"}
                        </p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground text-xs">Acréscimo de Tensão (Δσ′)</Label>
                        <p className="font-medium">
                          {deltaSigma !== null ? `${deltaSigma.toFixed(2)} kPa` : "0.00 kPa"}
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {results && !results.erro ? (
            <div className="space-y-4">
              <Card className="h-[140px]">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Info className="w-5 h-5" />
                    Resumo das Tensões
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label className="text-muted-foreground text-lg">σ<sub>vm′</sub> (Pré-Adens.)</Label>
                      <p className="text-lg font-semibold">
                        {sigmaVmPrime?.toFixed(2) || "0.00"} kPa
                      </p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground text-lg">σ<sub>v0′</sub> (Efetiva Inicial)</Label>
                      <p className="text-lg font-semibold">
                        {sigmaV0Prime?.toFixed(2) || "0.00"} kPa
                      </p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground text-lg">σ<sub>vf′</sub> (Efetiva Final)</Label>
                      <p className="text-lg font-semibold">
                        {sigmaVfPrime?.toFixed(2) || "0.00"} kPa
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Carousel className="relative w-full" setApi={setCarouselApi}>
                {carouselTotalSlides > 1 && (
                  <div className="absolute inset-x-0 top-0 z-20 h-1 rounded-full bg-muted/30">
                    <div
                      className="h-full rounded-full bg-primary transition-all duration-300"
                      style={{ width: `${Math.max(carouselProgress, 0) * 100}%` }}
                    />
                  </div>
                )}
                <CarouselContent className={cn(carouselTotalSlides > 1 ? "pt-4" : "")}>
                  <CarouselItem>
                    <div className="space-y-4">
                      <Card className="h-[340px]">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <BarChart3 className="w-5 h-5" />
                            Resultados do Cálculo
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label className="text-muted-foreground text-xs">Recalque Total Primário</Label>
                              <p className="text-2xl font-bold">
                                {results.recalque_total_primario?.toFixed(4)} m
                              </p>
                              <p className="text-sm text-muted-foreground">
                                ({(results.recalque_total_primario! * 1000).toFixed(2)} mm)
                              </p>
                            </div>
                            <div>
                              <Label className="text-muted-foreground text-xs">Porcentagem de Recalque</Label>
                              <p className="text-2xl font-bold">
                                {camadaArgila && results.recalque_total_primario
                                  ? `${((results.recalque_total_primario / camadaArgila.espessura) * 100).toFixed(2)}%`
                                  : "0.00%"}
                              </p>
                              <p className="text-sm text-muted-foreground">em relação à espessura</p>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label className="text-muted-foreground text-xs">Estado de Adensamento</Label>
                              <p className="text-lg font-semibold">{results.estado_adensamento}</p>
                            </div>
                            <div>
                              <Label className="text-muted-foreground text-xs">RPA Calculado</Label>
                              <p className="text-xl font-semibold">{results.RPA?.toFixed(2)}</p>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label className="text-muted-foreground text-xs">Deformação Volumétrica</Label>
                              <p className="text-xl font-semibold">
                                {results.deformacao_volumetrica?.toFixed(5) || "0.00000"}
                              </p>
                            </div>
                            <div>
                              <Label className="text-muted-foreground text-xs">Espessura da Camada</Label>
                              <p className="text-xl font-semibold">
                                {camadaArgila?.espessura?.toFixed(2) || "0.00"} m
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </CarouselItem>

                  <CarouselItem>
                    <div className="space-y-4">
                      <Card className="min-h-[340px]">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Clock className="w-5 h-5" />
                            Evolução do Adensamento
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                          {tempoAdensamento ? (
                            <div className="space-y-6">
                              <div className="grid grid-cols-3 gap-3 text-sm">
                                <div>
                                  <Label className="text-muted-foreground text-xs">Coeficiente Cv</Label>
                                  <p className="font-semibold">
                                    {tempoAdensamento.coeficiente_adensamento.toFixed(2)} m²/ano
                                  </p>
                                </div>
                                <div>
                                  <Label className="text-muted-foreground text-xs">Altura de Drenagem (Hd)</Label>
                                  <p className="font-semibold">{tempoAdensamento.altura_drenagem.toFixed(2)} m</p>
                                </div>
                                <div className="flex flex-col gap-1">
                                  <Label className="text-muted-foreground text-xs">Esquema de Drenagem</Label>
                                  <Badge variant={tempoAdensamento.drenagem_dupla ? "secondary" : "outline"}>
                                    {tempoAdensamento.drenagem_dupla ? "Dupla" : "Simples"}
                                  </Badge>
                                </div>
                              </div>

                              <div className="space-y-1">
                                <Label className="text-muted-foreground text-xs">Tempo de consolidação selecionado</Label>
                                <Slider
                                  value={[indiceTempoSelecionado]}
                                  max={maxIndiceTempo}
                                  min={0}
                                  step={1}
                                  onValueChange={(value) => setIndiceTempoSelecionado(value[0] ?? 0)}
                                  disabled={maxIndiceTempo === 0}
                                />
                                <div className="flex justify-between text-xs text-muted-foreground">
                                  <span>{tempoInicial ? `${tempoInicial.tempo_anos.toFixed(2)} anos` : "0.00 anos"}</span>
                                  <span>{tempoFinal ? `${tempoFinal.tempo_anos.toFixed(2)} anos` : "—"}</span>
                                </div>
                              </div>

                              {tempoSelecionado ? (
                                <div className="space-y-4">
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                      <Label className="text-muted-foreground text-xs">Tempo</Label>
                                      <p className="text-xl font-semibold">
                                        {tempoSelecionado.tempo_anos.toFixed(2)} anos
                                      </p>
                                      <p className="text-xs text-muted-foreground">
                                        ({tempoSelecionado.tempo_meses.toFixed(1)} meses)
                                      </p>
                                    </div>
                                    <div className="p-3 border rounded-lg bg-muted/40">
                                      <p className="text-xs text-muted-foreground uppercase tracking-wide">Solução Exata</p>
                                      <p className="text-lg font-semibold">{tempoSelecionado.grau_exato.toFixed(2)}%</p>
                                      <p className="text-xs text-muted-foreground">
                                        Recalque: {tempoSelecionado.recalque_exato.toFixed(4)} m
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <div className="text-sm text-muted-foreground">
                                  Ajuste o slider para visualizar grau de adensamento e recalque ao longo do tempo.
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="flex flex-col items-center justify-center text-center py-12 text-sm text-muted-foreground">
                              <Clock className="w-10 h-10 mb-3" />
                              <p>Informe o coeficiente de adensamento (Cv) e a altura de drenagem para visualizar a evolução temporal.</p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </div>
                  </CarouselItem>
                </CarouselContent>
              </Carousel>
            </div>
          ) : results?.erro ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{results.erro}</AlertDescription>
            </Alert>
          ) : (
            !isCalculating && (
              <Card>
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <MoveDown className="w-12 h-12 text-muted-foreground/50 mb-4" />
                    <p className="text-muted-foreground text-sm">
                      Preencha os dados nas três abas e clique em "Calcular Recalque" para ver os resultados.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )
          )}
        </div>
      </div>

      {/* Dialogs */}
      <DialogCamada
        open={dialogCamadaOpen}
        onOpenChange={setDialogCamadaOpen}
        onConfirm={handleConfirmCamada}
        camadaInicial={camadaEditando}
        title={camadaEditando ? "Editar Camada" : "Adicionar Camada"}
        showCompressivel={true}
      />

      <SaveDialog
        open={saveDialogOpen}
        onOpenChange={setSaveDialogOpen}
        saveName={saveName}
        onSaveNameChange={setSaveName}
        onConfirm={() => {
          // TODO: Implementar salvamento
          setSaveDialogOpen(false);
        }}
      />

      <SavedCalculations
        open={loadDialogOpen}
        onOpenChange={setLoadDialogOpen}
        calculations={calculations}
        onLoad={(calc) => {
          // TODO: Implementar carregamento
          setLoadDialogOpen(false);
        }}
        onDelete={deleteCalculation}
        onRename={renameCalculation}
        moduleName="Recalque por Adensamento"
      />

      {/* Dialog de Exportação PDF */}
      <ExportPDFDialog
        open={exportPDFDialogOpen}
        onOpenChange={setExportPDFDialogOpen}
        fileName={pdfFileName}
        onFileNameChange={setPdfFileName}
        onConfirm={handleConfirmExportPDF}
        isExporting={isExportingPDF}
        customTitle={customReportTitle}
        onCustomTitleChange={setCustomReportTitle}
        showCustomTitle={settings.printSettings?.includeCustomTitle ?? false}
      />

    </div>
  );
}

