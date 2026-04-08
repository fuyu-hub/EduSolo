// frontend/src/modules/recalque/components/DiagramaRecalque.tsx
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Info, Plus, History, Clock, Zap } from "lucide-react";
import DialogCamadaRecalque, { CamadaRecalqueData } from "./DialogCamadaRecalque";
import DialogCamadaBase from "./DialogCamadaBase";
import DialogCamadaAterro, { CamadaAterroEditData } from "./DialogCamadaAterro";
import { cn } from "@/lib/utils";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface CamadaInfo {
  nome?: string;
  espessura: number;
  profundidadeNA?: number | null;
  capilaridade?: number | null;
  gamaNat?: number | null;
  gamaSat?: number | null;
  Ko?: number;
  impermeavel?: boolean;
  compressivel?: boolean;
  // Campos específicos para recalque
  Cc?: number | null;
  Cr?: number | null;
  Cv?: number | null;
  e0?: number | null;
  drenante?: boolean; // Para camada base
  isBase?: boolean; // Indica se é a camada base fixa
}

interface CamadaArgilaEditData {
  espessura: string;
  gamaNat?: string;
  gamaSat?: string;
  profundidadeNA?: string;
  Cc?: string;
  Cr?: string;
  Cv?: string;
  e0?: string;
}

// Função para retornar cor de texto (sempre escura)
function getCorTexto(corHex: string): string {
  return '#1f2937';
}

// Função para misturar duas cores hex
function misturarCores(cor1: string, cor2: string, percentualCor1: number): string {
  const hex1 = cor1.replace('#', '');
  const hex2 = cor2.replace('#', '');
  
  const r1 = parseInt(hex1.substring(0, 2), 16);
  const g1 = parseInt(hex1.substring(2, 4), 16);
  const b1 = parseInt(hex1.substring(4, 6), 16);
  
  const r2 = parseInt(hex2.substring(0, 2), 16);
  const g2 = parseInt(hex2.substring(2, 4), 16);
  const b2 = parseInt(hex2.substring(4, 6), 16);
  
  const r = Math.round(r1 * percentualCor1 + r2 * (1 - percentualCor1));
  const g = Math.round(g1 * percentualCor1 + g2 * (1 - percentualCor1));
  const b = Math.round(b1 * percentualCor1 + b2 * (1 - percentualCor1));
  
  return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

// Paleta de cores de solo
const CORES_SOLO = [
  { bg: "#d9bc8c", border: "#a67c52" }, // Areia amarelada
  { bg: "#c4a57b", border: "#8b7355" }, // Areia marrom-claro
  { bg: "#b8a99a", border: "#6b5d50" }, // Argila cinza-marrom
  { bg: "#d4c5b9", border: "#9c8b7e" }, // Silte bege claro
  { bg: "#b8956a", border: "#8b6f47" }, // Argila marrom
  { bg: "#9c7a5e", border: "#6b4423" }, // Argila marrom-escuro
  { bg: "#c9b89a", border: "#a08968" }, // Solo arenoso claro
  { bg: "#a89080", border: "#7d6b5c" }, // Solo argiloso médio
  { bg: "#8b7968", border: "#5d4e3f" }, // Solo compacto escuro
  { bg: "#d6c3a8", border: "#b39a7d" }, // Areia fina clara
];

// Cor específica para argila (marrom argiloso)
const COR_ARGILA = { bg: "#a67c52", border: "#8b5a3c" };
const COR_AREIA = { bg: "#d9bc8c", border: "#a67c52" }; // Areia drenante
const COR_PEDREGULHO = { bg: "#9ca3af", border: "#6b7280" }; // Pedregulho não drenante (cinza)

// Cor para aterro/embankment
const COR_ATERRO = { bg: "#8b7355", border: "#6b5d50" };

// Função para gerar número pseudo-aleatório determinístico
function seededRandom(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

export type PerfilState = "passado" | "presente" | "futuro";

interface CamadaBaseInfo {
  drenante: boolean;
}

interface DiagramaRecalqueProps {
  camadaArgila?: CamadaInfo; // Camada de argila configurável
  camadaBase?: CamadaBaseInfo; // Camada base fixa (só configura se é drenante)
  camadasAterro?: CamadaInfo[]; // Camadas de aterro acima
  profundidadeNA: number;
  alturaCapilar?: number;
  onEditCamadaArgila?: (camada: CamadaArgilaEditData) => void;
  onConfigCamadaBase?: (data: CamadaBaseInfo) => void;
  onAddCamadaAterro?: (camada: CamadaInfo) => void;
  onEditCamadaAterro?: (index: number, camada: CamadaInfo) => void;
  onRemoveCamadaAterro?: (index: number) => void;
  camadaCompressivelIndex?: number | null; // 0 se argila é compressível
  currentPerfilState?: PerfilState;
  onPerfilStateChange?: (state: PerfilState) => void;
  interactive?: boolean;
  disablePeriodSwitch?: boolean; // Desabilita o switch de período
  hideTabs?: boolean; // Esconde as tabs completamente
}

export default function DiagramaRecalque({ 
  camadaArgila,
  camadaBase = { drenante: false },
  camadasAterro = [],
  profundidadeNA, 
  alturaCapilar = 0,
  onEditCamadaArgila,
  onConfigCamadaBase,
  onAddCamadaAterro,
  onEditCamadaAterro,
  onRemoveCamadaAterro,
  camadaCompressivelIndex = null,
  currentPerfilState = "presente",
  onPerfilStateChange,
  interactive = false,
  disablePeriodSwitch = false,
  hideTabs = false,
}: DiagramaRecalqueProps) {
  const [dialogArgilaOpen, setDialogArgilaOpen] = useState(false);
  const [dialogBaseOpen, setDialogBaseOpen] = useState(false);
  const [dialogAterroOpen, setDialogAterroOpen] = useState(false);
  const [editingAterroIndex, setEditingAterroIndex] = useState<number | null>(null);
  const [camadaArgilaInicial, setCamadaArgilaInicial] = useState<CamadaRecalqueData | undefined>(undefined);
  const [camadaAterroInicial, setCamadaAterroInicial] = useState<Partial<CamadaAterroEditData> | undefined>(undefined);
  const [periodoAtual, setPeriodoAtual] = useState<PerfilState>(currentPerfilState);

  // Sincronizar estado quando prop mudar
  React.useEffect(() => {
    setPeriodoAtual(currentPerfilState);
  }, [currentPerfilState]);

  const handlePeriodoChange = (value: string) => {
    const novoEstado = value as PerfilState;
    setPeriodoAtual(novoEstado);
    if (onPerfilStateChange) {
      onPerfilStateChange(novoEstado);
    }
  };

  const handleEditArgila = () => {
    // Sempre pode editar a argila, mesmo que não esteja completamente configurada
    setCamadaArgilaInicial(
      camadaArgila ? {
        espessura: camadaArgila.espessura.toString(),
        gamaNat: camadaArgila.gamaNat?.toString() || "",
        gamaSat: camadaArgila.gamaSat?.toString() || "",
        profundidadeNA: camadaArgila.profundidadeNA?.toString() || "",
        Cc: camadaArgila.Cc?.toString() || "",
        Cr: camadaArgila.Cr?.toString() || "",
        Cv: camadaArgila.Cv?.toString() || "",
        e0: camadaArgila.e0?.toString() || "",
      } : {
        espessura: "10",
        gamaNat: "",
        gamaSat: "",
        profundidadeNA: "",
        Cc: "",
        Cr: "",
        Cv: "",
        e0: "",
      }
    );
    setDialogArgilaOpen(true);
  };

  const handleConfigBase = () => {
    setDialogBaseOpen(true);
  };

  const handleAddAterro = () => {
    setEditingAterroIndex(null);
    setCamadaAterroInicial(undefined);
    setDialogAterroOpen(true);
  };

  const handleEditAterro = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!camadasAterro[index]) return;
    const aterro = camadasAterro[index];
    setEditingAterroIndex(index);
    setCamadaAterroInicial({
      nome: aterro.nome || "",
      espessura: aterro.espessura.toString(),
      gamaNat: aterro.gamaNat?.toString() || "",
      gamaSat: aterro.gamaSat?.toString() || "",
    });
    setDialogAterroOpen(true);
  };

  const handleConfirmAterro = (data: CamadaAterroEditData) => {
    const camadaAterroData: CamadaInfo = {
      nome: data.nome,
      espessura: parseFloat(data.espessura),
      gamaNat: data.gamaNat ? parseFloat(data.gamaNat) : undefined,
      gamaSat: data.gamaSat ? parseFloat(data.gamaSat) : undefined,
    };

    if (editingAterroIndex !== null && onEditCamadaAterro) {
      // Editar camada existente
      onEditCamadaAterro(editingAterroIndex, camadaAterroData);
    } else if (onAddCamadaAterro) {
      // Nova camada
      onAddCamadaAterro(camadaAterroData);
    }
    setDialogAterroOpen(false);
    setEditingAterroIndex(null);
    setCamadaAterroInicial(undefined);
  };

  const handleConfirmArgila = (data: CamadaRecalqueData) => {
    if (onEditCamadaArgila) {
      onEditCamadaArgila({
        espessura: data.espessura,
        gamaNat: data.gamaNat,
        gamaSat: data.gamaSat,
        profundidadeNA: data.profundidadeNA,
        Cc: data.Cc,
        Cr: data.Cr,
        Cv: data.Cv,
        e0: data.e0,
      });
    }
    setDialogArgilaOpen(false);
    setCamadaArgilaInicial(undefined);
  };

  const handleConfirmBase = (data: { drenante: boolean }) => {
    if (onConfigCamadaBase) {
      onConfigCamadaBase(data);
    }
    setDialogBaseOpen(false);
  };

  // Determina quais camadas mostrar baseado no período
  const getCamadasVisiveis = (): CamadaInfo[] => {
    const camadas: CamadaInfo[] = [];
    
    // Aterro (sempre no topo quando existir)
    if ((periodoAtual === "futuro" || periodoAtual === "presente" || periodoAtual === "passado") && camadasAterro.length > 0) {
      camadas.push(...camadasAterro);
    }
    
    // Argila configurável (sempre acima da base)
    // Se não houver argila configurada, criar uma padrão de 10m
    const argilaParaMostrar = camadaArgila ? {
      espessura: camadaArgila.espessura,
      gamaNat: camadaArgila.gamaNat ?? null,
      gamaSat: camadaArgila.gamaSat ?? null,
      profundidadeNA: camadaArgila.profundidadeNA ?? null,
      Cc: camadaArgila.Cc ?? null,
      Cr: camadaArgila.Cr ?? null,
      Cv: camadaArgila.Cv ?? null,
      e0: camadaArgila.e0 ?? null,
      compressivel: true,
    } : {
      espessura: 10,
      gamaNat: null,
      gamaSat: null,
      profundidadeNA: null,
      compressivel: true,
      Cc: null,
      Cr: null,
      Cv: null,
      e0: null,
    };
    camadas.push(argilaParaMostrar);
    
    // Camada base fixa (sempre embaixo)
    // A base tem sempre 1/5 da altura da argila
    if (camadaBase) {
      const espessuraArgila = argilaParaMostrar.espessura;
      camadas.push({
        espessura: espessuraArgila / 5, // Base sempre 1/5 da argila
        isBase: true,
        drenante: camadaBase.drenante,
      });
    }
    
    return camadas;
  };

  const camadas = getCamadasVisiveis();
  const temAterro = camadasAterro.length > 0;
  
  // Encontrar índice da argila para usar na identificação
  // A argila está sempre antes da base (ou é a última camada se não houver base)
  const baseIndex = camadas.findIndex(c => c.isBase);
  let argilaIndex = -1;
  if (baseIndex !== -1) {
    // Se há base, argila está imediatamente antes
    argilaIndex = baseIndex - 1;
  } else if (camadas.length > 0) {
    // Se não há base, argila é a última camada (depois do aterro se houver)
    argilaIndex = camadas.length - 1;
  }

  if (!camadas || camadas.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Info className="w-5 h-5 text-primary" />
            Configuração do Perfil
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            Adicione camadas para visualizar o perfil
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calcula profundidade total (incluindo aterro acima)
  const profundidadeAterro = camadasAterro.reduce((sum, c) => sum + c.espessura, 0);
  const profundidadeArgila = camadaArgila ? camadaArgila.espessura : 10; // Padrão 10m
  const profundidadeBase = camadaBase ? (profundidadeArgila / 5) : 0; // Base sempre 1/5 da argila
  const profundidadeTotal = profundidadeArgila + profundidadeBase;
  
  // Escala considera todo o perfil (aterro + solo)
  const alturaTotal = profundidadeAterro + profundidadeTotal;
  
  // No modo ampliado (hideTabs), usar escala fixa para mostrar alturas reais proporcionais
  // No modo normal, limitar a 400px para caber no card
  const escalaAmpliada = 25; // 30px por metro (mostra diferenças reais)
  const alturaMaximaPixels = hideTabs 
    ? alturaTotal * escalaAmpliada 
    : 400;
  const escala = hideTabs 
    ? escalaAmpliada 
    : (alturaMaximaPixels / (alturaTotal || 1));

  // NA: usa da camada de argila se disponível, caso contrário usa da prop (opcional)
  // O valor digitado é RELATIVO ao topo da argila: positivo = acima, negativo = abaixo
  // profundidadeNA vem como string do form, precisa converter
  let profundidadeNARelativo: number | null = null;
  if (camadaArgila?.profundidadeNA !== null && camadaArgila?.profundidadeNA !== undefined) {
    profundidadeNARelativo = camadaArgila.profundidadeNA;
  } else if (typeof profundidadeNA === "string" && profundidadeNA !== "") {
    profundidadeNARelativo = parseFloat(profundidadeNA) || null;
  } else if (typeof profundidadeNA === "number" && profundidadeNA !== 0) {
    profundidadeNARelativo = profundidadeNA;
  }
  
  // Converter para profundidade absoluta da superfície para cálculos de tensões
  // Se relativo = 1m (acima da argila): absoluto = profundidadeAterro - 1
  // Se relativo = -1m (abaixo da argila): absoluto = profundidadeAterro - (-1) = profundidadeAterro + 1
  const profundidadeNAAbsoluta = profundidadeNARelativo !== null 
    ? profundidadeAterro - profundidadeNARelativo 
    : null;

  // Coleta todas as cotas importantes - O 0 sempre está no TOPO da argila (visualmente)
  const cotasImportantes = new Set<number>();
  
  // Aterros: cota apenas no topo de cada camada (cotas negativas acima do 0)
  let profAcumAterros = 0;
  camadasAterro.forEach((aterro) => {
    const cotaTopo = -(profundidadeAterro - profAcumAterros);
    cotasImportantes.add(cotaTopo);
    profAcumAterros += aterro.espessura;
  });
  
  // Argila: cota no topo (0), centro e fim
  cotasImportantes.add(0); // Topo da argila = 0
  if (profundidadeArgila > 0) {
    const centroArgila = profundidadeArgila / 2;
    const fimArgila = profundidadeArgila;
    cotasImportantes.add(centroArgila);
    cotasImportantes.add(fimArgila);
  }
  
  // NA: o valor já está relativo ao topo da argila (profundidadeNARelativo)
  // Positivo = acima da argila, Negativo = abaixo da argila
  let naAjustado: number | null = null;
  let naPosicaoVisual: number | null = null; // Posição em pixels do topo do container
  if (profundidadeNARelativo !== null) {
    // O valor relativo JÁ é a cota relativa ao topo da argila
    naAjustado = profundidadeNARelativo;
    
    // Adiciona na lista de cotas da escala (aparece na escala lateral)
    if (naAjustado >= -profundidadeAterro && naAjustado <= alturaTotal) {
      cotasImportantes.add(naAjustado);
    }
    
    // Posição visual do NA a partir do topo do container (0 = topo do container)
    // O valor relativo já indica: positivo = acima da argila, negativo = abaixo
    const alturaZeroPixels = profundidadeAterro * escala;
    if (naAjustado >= 0) {
      // NA acima do topo da argila: aparece acima do 0 visual
      naPosicaoVisual = alturaZeroPixels - (naAjustado * escala);
    } else {
      // NA abaixo do topo da argila: aparece abaixo do 0 visual
      naPosicaoVisual = alturaZeroPixels + (Math.abs(naAjustado) * escala);
    }
  }
  
  const cotasOrdenadas = Array.from(cotasImportantes).sort((a, b) => a - b);

  let profundidadeAcumulada = 0;
  let indexCompressivelAjustado: number | null = null;

  // Ajusta índice da camada compressível baseado no período
  if (camadaCompressivelIndex !== null && periodoAtual === "presente") {
    // Só mostra compressível no modo presente
    indexCompressivelAjustado = camadaCompressivelIndex;
  }

  return (
    <Card className={cn(hideTabs && "border-0 shadow-none")}>
      {!hideTabs && (
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Info className="w-5 h-5 text-primary" />
              Configuração do Perfil
            </CardTitle>
            
            {/* Switch de Período */}
            <Tabs value={periodoAtual} onValueChange={disablePeriodSwitch ? undefined : handlePeriodoChange}>
              <TabsList className={cn("grid grid-cols-3 h-9", disablePeriodSwitch && "opacity-50 cursor-not-allowed")}>
                <TabsTrigger 
                  value="passado" 
                  className="flex items-center gap-1.5 text-xs"
                  disabled={disablePeriodSwitch}
                >
                  <History className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Passado</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="presente" 
                  className="flex items-center gap-1.5 text-xs"
                  disabled={disablePeriodSwitch}
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Presente</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="futuro" 
                  className="flex items-center gap-1.5 text-xs"
                  disabled={disablePeriodSwitch}
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Futuro</span>
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
      )}
      
      <CardContent className={cn(hideTabs ? "pt-6 pl-3" : "pt-6 pl-3")}>
        <div className="flex gap-2 justify-start">
          {/* Escala de profundidade com cotas */}
          <div className="relative text-xs font-mono" style={{ width: '60px', height: alturaMaximaPixels + 'px' }}>
            {cotasOrdenadas.map((cota, index) => {
              // Verifica se esta cota corresponde ao NA (usando cota relativa ao topo da argila)
              const isNA = naAjustado !== null && Math.abs(cota - naAjustado) < 0.01;
              const isZero = Math.abs(cota) < 0.01;
              
              let posY: number;
              
              // Se é a cota do NA, usar exatamente a posição visual do NA
              if (isNA && naPosicaoVisual !== null) {
                posY = naPosicaoVisual;
              } else {
                // O 0 sempre está no TOPO da argila (visualmente)
                // Se houver aterro, o 0 visual está em profundidadeAterro * escala
                const alturaZeroPixels = temAterro ? profundidadeAterro * escala : 0;
                
                if (temAterro) {
                  // Quando há aterro: usar sistema de cotas relativas ao topo da argila
                  // Cota negativa (aterro): acima do 0 (topo da argila)
                  // Cota positiva (argila/base): abaixo do 0 (topo da argila)
                  if (cota < 0) {
                    // Cota negativa (aterro): acima do 0
                    // Ex: cota -2m aparece a 2*escala acima do 0
                    posY = alturaZeroPixels - (Math.abs(cota) * escala);
                  } else {
                    // Cota positiva (argila/base): abaixo do 0
                    // Ex: cota 5m aparece a 5*escala abaixo do 0
                    posY = alturaZeroPixels + (cota * escala);
                  }
                } else {
                  // Sem aterro: cotas normais, 0 no topo da argila (início)
                  posY = cota * escala;
                }
              }
              
              return (
                <div
                  key={index}
                  className="absolute right-0 flex items-center gap-1"
                  style={{ top: `${posY}px`, transform: 'translateY(-50%)' }}
                >
                  <span className={cn(
                    "text-xs font-semibold",
                    isNA && "text-blue-600 dark:text-blue-400",
                    isZero && "text-primary font-bold",
                    !isNA && !isZero && "text-muted-foreground"
                  )}>
                    {Math.abs(cota).toFixed(2)} m
                  </span>
                  <div className={cn(
                    "w-2 h-0.5",
                    isNA && "bg-blue-600",
                    isZero && "bg-primary",
                    !isNA && !isZero && "bg-border"
                  )} />
                </div>
              );
            })}
          </div>

          {/* Diagrama */}
          <div className="flex-1 relative">
            <div style={{ height: alturaMaximaPixels + 'px' }}>
              <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 1 }}>
                <defs>
                  <pattern id="saturado" x="0" y="0" width="8" height="8" patternUnits="userSpaceOnUse">
                    <circle cx="4" cy="4" r="1" fill="#4a90e2" opacity="0.3" />
                  </pattern>
                  <pattern id="parcial" x="0" y="0" width="12" height="12" patternUnits="userSpaceOnUse">
                    <rect x="0" y="0" width="12" height="6" fill="#4a90e2" opacity="0.2" />
                  </pattern>
                </defs>
                {/* Linha do nível 0 - sempre no topo da argila */}
                <line
                  x1="0"
                  y1={temAterro ? profundidadeAterro * escala : 0}
                  x2="100%"
                  y2={temAterro ? profundidadeAterro * escala : 0}
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeDasharray="4 4"
                  className="text-primary opacity-60"
                />
              </svg>
              
              {(() => {
                let corAnterior: number | undefined = undefined;
                // Usa a mesma lógica do presente: sempre começa em 0 e acumula normalmente
                let profundidadeAcumuladaLocal = 0;
                
                return camadas.map((camada, index) => {
                  // Identificar se é argila usando o índice calculado
                  const isArgilaCamada = argilaIndex !== -1 && index === argilaIndex;
                  
                  // Verifica se é camada de aterro
                  const isAterro = camadasAterro.includes(camada);
                  
                  const profTopo = profundidadeAcumuladaLocal;
                  const profBase = profundidadeAcumuladaLocal + camada.espessura;
                  profundidadeAcumuladaLocal = profBase;

                  const altura = camada.espessura * escala;
                  
                  // Determina se está acima ou abaixo do NA
                  // NA é digitado relativo ao topo da argila, precisa converter para absoluto
                  // profTopo e profBase são profundidades acumuladas a partir do topo (0 = superfície)
                  const profundidadeNAAbsolutaParaComparacao = profundidadeNAAbsoluta !== null && profundidadeNAAbsoluta > 0 ? profundidadeNAAbsoluta : null;
                  const acimaDoNA = profundidadeNAAbsolutaParaComparacao !== null && profBase <= profundidadeNAAbsolutaParaComparacao;
                  const abaixoDoNA = profundidadeNAAbsolutaParaComparacao !== null && profTopo >= profundidadeNAAbsolutaParaComparacao;
                  
                  // Verifica se é camada base
                  const isBase = camada.isBase === true;
                  
                  // Verifica se é camada compressível (argila marcada como compressível)
                  const isCompressivel = isArgilaCamada && camadaArgila && (camadaArgila.compressivel === true);

                  let cores;
                  if (isAterro) {
                    // Aterro sempre com cor areia
                    cores = { bg: COR_AREIA.bg, border: COR_AREIA.border, texto: getCorTexto(COR_AREIA.bg) };
                  } else if (isArgilaCamada) {
                    // Argila sempre marrom argiloso
                    cores = { bg: COR_ARGILA.bg, border: COR_ARGILA.border, texto: getCorTexto(COR_ARGILA.bg) };
                  } else if (isBase) {
                    // Base: areia se drenante, pedregulho se não drenante
                    if (camada.drenante) {
                      cores = { bg: COR_AREIA.bg, border: COR_AREIA.border, texto: getCorTexto(COR_AREIA.bg) };
                    } else {
                      cores = { bg: COR_PEDREGULHO.bg, border: COR_PEDREGULHO.border, texto: getCorTexto(COR_PEDREGULHO.bg) };
                    }
                  } else {
                    // Outras camadas - usar cor padrão
                    let corIndex = Math.floor(seededRandom(index * 7919 + 12345) * CORES_SOLO.length);
                    if (corAnterior !== undefined && corIndex === corAnterior) {
                      corIndex = (corIndex + 1) % CORES_SOLO.length;
                    }
                    corAnterior = corIndex;
                    
                    const coresSelecionadas = CORES_SOLO[corIndex];
                    if (abaixoDoNA) {
                      const bgMisturada = misturarCores(coresSelecionadas.bg, '#a8c5d8', 0.7);
                      const borderMisturada = misturarCores(coresSelecionadas.border, '#6a8fb8', 0.7);
                      cores = { 
                        bg: bgMisturada,
                        border: borderMisturada,
                        texto: getCorTexto(bgMisturada)
                      };
                    } else {
                      cores = { 
                        bg: coresSelecionadas.bg, 
                        border: coresSelecionadas.border, 
                        texto: getCorTexto(coresSelecionadas.bg) 
                      };
                    }
                  }

                  const isImpermeavel = camada.impermeavel || false;
                  const alturaMuitoPequena = altura < 35;
                  const alturaPequena = altura < 55;
                  const alturaMedia = altura < 80;

                  // Posição Y: O 0 sempre fica no topo da argila
                  // Em qualquer período: se houver aterro, ele fica acima do 0 (cotas negativas)
                  // Argila e base ficam abaixo do 0 (cotas positivas)
                  let topPixels: number;
                  const alturaZeroVisual = temAterro ? profundidadeAterro * escala : 0;
                  
                  if (temAterro && isAterro) {
                    // Aterros: têm cota negativa, aparecem acima do 0 (topo da argila)
                    // profTopo vai de 0 até profundidadeAterro internamente
                    // Visualmente, o topo da argila (0) está em alturaZeroVisual
                    // Aterros ficam de alturaZeroVisual - profundidadeAterro até alturaZeroVisual
                    topPixels = alturaZeroVisual - (profundidadeAterro - profTopo) * escala;
                  } else if (temAterro && (isArgilaCamada || isBase)) {
                    // Argila e base quando há aterro: têm cota positiva (0 ou mais)
                    // O 0 está no topo da argila (profTopo = profundidadeAterro para argila)
                    // Visualmente queremos que a argila comece em alturaZeroVisual (0)
                    const cotaRelativa = profTopo - profundidadeAterro; // cota relativa ao topo da argila
                    topPixels = alturaZeroVisual + (cotaRelativa * escala);
                  } else {
                    // Sem aterro: posição normal (cota 0 no topo da argila = início)
                    topPixels = profTopo * escala;
                  }

                  return (
                    <div
                      key={`${periodoAtual}-${index}`}
                      className={cn(
                        "absolute left-0 right-0 border-b border-border",
                        "cursor-pointer hover:opacity-80 transition-opacity"
                      )}
                      style={{
                        top: `${topPixels}px`,
                        height: altura + 'px',
                        backgroundColor: cores.bg,
                        borderLeft: `4px solid ${cores.border}`,
                        backgroundImage: isImpermeavel ? 
                          'repeating-linear-gradient(45deg, transparent, transparent 8px, rgba(0, 0, 0, 0.1) 8px, rgba(0, 0, 0, 0.1) 16px)' : 
                          'none',
                      }}
                      onClick={(e) => {
                        if (!interactive) return;
                        e.stopPropagation();
                        const camada = camadas[index];
                        if (camada.isBase) {
                          handleConfigBase();
                        } else if (isArgilaCamada) {
                          handleEditArgila();
                        } else if (camadasAterro.includes(camada)) {
                          const aterroIndex = camadasAterro.indexOf(camada);
                          handleEditAterro(aterroIndex, e);
                        }
                      }}
                    >
                      <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
                        <div className="text-center px-1.5 w-full">
                          {alturaMuitoPequena ? (
                            <div className="font-semibold text-xs leading-tight flex items-center justify-center gap-1" style={{ color: cores.texto }}>
                              <span className="truncate max-w-[120px]">{isArgilaCamada ? "Argila" : (isBase ? (camada.drenante ? "Areia" : "Pedregulho") : (camada.nome || `C${index + 1}`))}</span>
                            </div>
                          ) : alturaPequena ? (
                            <>
                              <div className="font-bold text-xs flex items-center justify-center gap-1 leading-tight" style={{ color: cores.texto }}>
                                <span className="truncate max-w-[150px]">{isArgilaCamada ? "Argila" : (isBase ? (camada.drenante ? "Areia (Drenante)" : "Pedregulho (Não Drenante)") : (camada.nome || `Camada ${index + 1}`))}</span>
                              </div>
                              {!isBase && (
                                <div className="text-[11px] font-medium leading-tight" style={{ color: cores.texto, opacity: 0.9 }}>
                                  {camada.espessura.toFixed(2)} m
                                </div>
                              )}
                              {/* Não mostrar dados se espessura <= 2m */}
                              {!isBase && alturaPequena && camada.espessura > 2 && (camada.gamaNat || camada.gamaSat) && (
                                <div className="text-[10px] leading-tight mt-0.5" style={{ color: cores.texto, opacity: 0.8 }}>
                                  {camada.gamaNat ? `γnat: ${camada.gamaNat.toFixed(1)}` : ''} 
                                  {camada.gamaNat && camada.gamaSat ? ' | ' : ''}
                                  {camada.gamaSat ? `γsat: ${camada.gamaSat.toFixed(1)}` : ''}
                                </div>
                              )}
                              {isArgilaCamada && alturaPequena && camada.espessura > 2 && (camada.Cc || camada.Cr || camada.Cv || camada.e0) && (
                                <div className="text-[9px] leading-tight mt-0.5" style={{ color: cores.texto, opacity: 0.75 }}>
                                  {camada.Cc && `Cc:${camada.Cc.toFixed(2)}`}
                                  {camada.Cc && camada.Cr && ' '}
                                  {camada.Cr && `Cr:${camada.Cr.toFixed(2)}`}
                                  {camada.Cv && ` Cv:${camada.Cv.toFixed(2)}`}
                                  {camada.e0 && ` e0:${camada.e0.toFixed(2)}`}
                                </div>
                              )}
                            </>
                          ) : alturaMedia ? (
                            <>
                              <div className="font-bold text-sm flex items-center justify-center gap-1" style={{ color: cores.texto }}>
                                <span className="truncate max-w-[180px]">{isArgilaCamada ? "Argila" : (isBase ? (camada.drenante ? "Areia (Drenante)" : "Pedregulho (Não Drenante)") : (camada.nome || `Camada ${index + 1}`))}</span>
                              </div>
                              {!isBase && (
                                <div className="text-xs font-medium leading-tight" style={{ color: cores.texto, opacity: 0.9 }}>
                                  {camada.espessura.toFixed(2)} m
                                </div>
                              )}
                              {/* Não mostrar dados se espessura <= 2m */}
                              {camada.espessura > 2 && (camada.gamaNat || camada.gamaSat) && (
                                <div className="text-xs leading-tight" style={{ color: cores.texto, opacity: 0.85 }}>
                                  {camada.gamaNat ? `γnat: ${camada.gamaNat.toFixed(1)}` : ''} 
                                  {camada.gamaNat && camada.gamaSat ? ' | ' : ''}
                                  {camada.gamaSat ? `γsat: ${camada.gamaSat.toFixed(1)}` : ''} kN/m³
                                </div>
                              )}
                              {isArgilaCamada && camada.espessura > 2 && (camada.Cc || camada.Cr || camada.Cv || camada.e0) && (
                                <div className="text-[10px] leading-tight mt-0.5" style={{ color: cores.texto, opacity: 0.8 }}>
                                  {camada.Cc && `Cc: ${camada.Cc.toFixed(2)}`}
                                  {camada.Cc && camada.Cr && ' | '}
                                  {camada.Cr && `Cr: ${camada.Cr.toFixed(2)}`}
                                  {camada.Cv && ` | Cv: ${camada.Cv.toFixed(2)}`}
                                  {camada.e0 && ` | e0: ${camada.e0.toFixed(2)}`}
                                </div>
                              )}
                            </>
                          ) : (
                            <>
                              <div className="font-bold text-base flex items-center justify-center gap-1 mb-1" style={{ color: cores.texto }}>
                                <span>{isArgilaCamada ? "Argila" : (isBase ? (camada.drenante ? "Areia (Drenante)" : "Pedregulho (Não Drenante)") : (camada.nome || `Camada ${index + 1}`))}</span>
                                {isBase && <span className="text-xs bg-gray-700/70 text-white px-2 py-0.5 rounded">BASE {camada.drenante ? '(Drenante)' : '(Não Drenante)'}</span>}
                              </div>
                              {!isBase && (
                                <div className="text-sm font-semibold mb-0.5" style={{ color: cores.texto, opacity: 0.95 }}>
                                  {camada.espessura.toFixed(2)} m
                                </div>
                              )}
                              {/* Não mostrar dados se espessura <= 2m */}
                              {camada.espessura > 2 && (camada.gamaNat || camada.gamaSat) && (
                                <div className="text-sm" style={{ color: cores.texto, opacity: 0.9 }}>
                                  {camada.gamaNat ? `γnat: ${camada.gamaNat.toFixed(1)}` : ''} 
                                  {camada.gamaNat && camada.gamaSat ? ' | ' : ''}
                                  {camada.gamaSat ? `γsat: ${camada.gamaSat.toFixed(1)}` : ''} kN/m³
                                </div>
                              )}
                              {!isBase && camada.espessura > 2 && (camada.Cc || camada.Cr || camada.Cv || camada.e0) && (
                                <div className="text-xs mt-1" style={{ color: cores.texto, opacity: 0.85 }}>
                                  {camada.Cc && `Cc: ${camada.Cc.toFixed(2)}`}
                                  {camada.Cc && camada.Cr && ' | '}
                                  {camada.Cr && `Cr: ${camada.Cr.toFixed(2)}`}
                                  {camada.Cv && ` | Cv: ${camada.Cv.toFixed(2)} m²/ano`}
                                  {camada.e0 && ` | e0: ${camada.e0.toFixed(2)}`}
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                });
              })()}
            </div>

            {/* Linha do Nível de Água (NA) */}
            {naPosicaoVisual !== null && naPosicaoVisual >= 0 && naPosicaoVisual <= alturaMaximaPixels && naAjustado !== null && (() => {
              // NA é posicionado a partir da superfície real do terreno
              // naPosicaoVisual já está calculado corretamente considerando a profundidade do NA a partir da superfície
              return (
                <div
                  className="absolute left-0 right-0 z-10 pointer-events-none"
                  style={{ 
                    top: `${naPosicaoVisual}px`
                  }}
                >
                  <div className="absolute inset-x-0 border-t-2 border-blue-500 border-dashed" />
                  <div className="absolute right-1 -top-3.5 bg-blue-500 text-white text-xs font-bold px-2.5 py-1 rounded-md shadow-lg">
                    NA
                  </div>
                </div>
              );
            })()}

            {/* Botões de ação */}
            {interactive && (
              <>
                {/* Botão Adicionar Aterro (sempre no topo absoluto do diagrama) */}
                {/* No passado, o botão só aparece se não houver aterro ainda */}
                {/* No presente e futuro, o botão sempre aparece */}
                {periodoAtual === "futuro" && (
                  <div 
                    className="absolute left-0 right-0 z-10 border-2 border-primary/40 border-b-border cursor-pointer hover:bg-primary/10 hover:border-primary/60 transition-all flex items-center justify-center py-1.5 rounded-t-lg"
                    style={{ 
                      top: `-36px` 
                    }}
                    onClick={handleAddAterro}
                  >
                    <div className="flex items-center gap-2 text-primary font-medium">
                      <Plus className="w-4 h-4" />
                      <span className="text-sm">Adicionar Camada</span>
                    </div>
                  </div>
                )}
                {periodoAtual === "presente" && (
                  <div 
                    className="absolute left-0 right-0 z-10 border-2 border-primary/40 border-b-border cursor-pointer hover:bg-primary/10 hover:border-primary/60 transition-all flex items-center justify-center py-1.5 rounded-t-lg"
                    style={{ 
                      top: `-36px` 
                    }}
                    onClick={handleAddAterro}
                  >
                    <div className="flex items-center gap-2 text-primary font-medium">
                      <Plus className="w-4 h-4" />
                      <span className="text-sm">Adicionar Camada</span>
                    </div>
                  </div>
                )}
                {periodoAtual === "passado" && camadasAterro.length === 0 && (
                  <div 
                    className="absolute left-0 right-0 z-10 border-2 border-primary/40 border-b-border cursor-pointer hover:bg-primary/10 hover:border-primary/60 transition-all flex items-center justify-center py-1.5 rounded-t-lg"
                    style={{ 
                      top: `-36px` 
                    }}
                    onClick={handleAddAterro}
                  >
                    <div className="flex items-center gap-2 text-primary font-medium">
                      <Plus className="w-4 h-4" />
                      <span className="text-sm">Adicionar Camada</span>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </CardContent>

      {interactive && (
        <>
          <DialogCamadaRecalque
            open={dialogArgilaOpen}
            onOpenChange={setDialogArgilaOpen}
            onConfirm={handleConfirmArgila}
            camadaInicial={camadaArgilaInicial}
            title="Editar Camada de Argila"
            description="Configure os parâmetros da camada de argila compressível"
          />
          
          <DialogCamadaBase
            open={dialogBaseOpen}
            onOpenChange={setDialogBaseOpen}
            onConfirm={handleConfirmBase}
            camadaInicial={camadaBase}
            title="Configurar Camada Base"
            description="Configure se a camada base é drenante"
          />
          
          <DialogCamadaAterro
            open={dialogAterroOpen}
            onOpenChange={setDialogAterroOpen}
            onConfirm={handleConfirmAterro}
            camadaInicial={camadaAterroInicial}
            title={editingAterroIndex !== null ? `Editar Camada de Aterro` : "Adicionar Camada de Aterro"}
            description={editingAterroIndex !== null ? "Atualize os dados da camada de aterro" : "Insira os dados da nova camada de aterro"}
          />
        </>
      )}
    </Card>
  );
}

