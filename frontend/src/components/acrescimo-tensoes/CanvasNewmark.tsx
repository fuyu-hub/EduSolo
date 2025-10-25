import { useRef, useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Layers, Info, GripVertical, Eye, ZoomIn, ZoomOut, Maximize2, Minimize2 } from "lucide-react";
import { PontoAnalise } from "./PainelResultados";
import { Button } from "@/components/ui/button";

interface CanvasNewmarkProps {
  pontos: PontoAnalise[];
  largura?: number;
  comprimento?: number;
  intensidade?: number;
  nomeSapata?: string;
  onDuploCliqueCarga: () => void;
  onDuploCliqueGrid: (x: number, y: number, z: number) => void;
  onDuploCliquePonto: (ponto: PontoAnalise) => void;
  onMovimentarPonto: (id: string, x: number, y: number, z: number) => void;
  onPontoSolto?: (id: string) => void;
  calculoFeito?: boolean;
  decimalPlaces?: number;
}

export default function CanvasNewmark({
  pontos,
  largura,
  comprimento,
  intensidade,
  nomeSapata = "Sapata 1",
  onDuploCliqueCarga,
  onDuploCliqueGrid,
  onDuploCliquePonto,
  onMovimentarPonto,
  onPontoSolto,
  calculoFeito = false,
  decimalPlaces = 3
}: CanvasNewmarkProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [draggedPoint, setDraggedPoint] = useState<string | null>(null);
  const [offsetArraste, setOffsetArraste] = useState({ x: 0, y: 0 });
  const [selectedPoints, setSelectedPoints] = useState<string[]>([]);
  const clickTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isDraggingRef = useRef(false);
  const mouseDownPosRef = useRef<{ x: number; y: number } | null>(null);
  const hasMovedRef = useRef(false);
  const [hoverTooltip, setHoverTooltip] = useState<{
    visible: boolean;
    x: number;
    y: number;
    ponto: PontoAnalise | null;
  }>({ visible: false, x: 0, y: 0, ponto: null });
  
  // Estado para controlar a vista (lateral ou superior)
  const [vistaAtual, setVistaAtual] = useState<"lateral" | "superior">("lateral");
  
  // Estado para controlar fullscreen
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // Estados para pan e zoom
  const [zoom, setZoom] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [sapataHover, setSapataHover] = useState(false);
  const panStartRef = useRef<{ x: number; y: number } | null>(null);
  
  // Estados para drag dos tooltips fixados
  const [tooltipOffsets, setTooltipOffsets] = useState<Record<string, { x: number; y: number }>>({});
  const [tooltipFixedPositions, setTooltipFixedPositions] = useState<Record<string, { x: number; y: number }>>({});
  const [draggingTooltip, setDraggingTooltip] = useState<string | null>(null);
  const tooltipDragStartRef = useRef<{ x: number; y: number } | null>(null);
  
  // Constantes de renderização
  const PIXELS_POR_METRO = 40;
  const TAMANHO_PONTO = 8;
  const GRID_SNAP_METROS = 0.5;
  
  // Dimensões do container
  const [origem, setOrigem] = useState({ x: 0, y: 100 });
  
  useEffect(() => {
    const atualizarOrigem = () => {
      if (containerRef.current) {
        const bbox = containerRef.current.getBoundingClientRect();
        if (vistaAtual === "superior") {
          // Vista superior: origem no centro do canvas
          setOrigem({ x: bbox.width / 2, y: bbox.height / 2 });
        } else {
          // Vista lateral: origem no centro horizontal
          // Em fullscreen, centraliza verticalmente; fora, mantém no topo
          const origemY = isFullscreen ? bbox.height / 3 : 100;
          setOrigem({ x: bbox.width / 2, y: origemY });
        }
      }
    };
    
    atualizarOrigem();
    window.addEventListener('resize', atualizarOrigem);
    
    return () => window.removeEventListener('resize', atualizarOrigem);
  }, [vistaAtual, isFullscreen]);
  
  // Reset pan e zoom ao mudar de vista
  useEffect(() => {
    setPanOffset({ x: 0, y: 0 });
    setZoom(1);
  }, [vistaAtual]);
  
  // Handlers para fullscreen
  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    
    if (!isFullscreen) {
      // Entrar em fullscreen
      if (containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen();
      }
    } else {
      // Sair de fullscreen
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };
  
  // Detecta mudanças de fullscreen (quando o usuário pressiona ESC, por exemplo)
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Renderiza o grid
  const renderizarGrid = (currentZoom = 1, currentPanOffset = { x: 0, y: 0 }) => {
    const linhas = [];
    const largura = containerRef.current?.getBoundingClientRect().width || 800;
    const altura = containerRef.current?.getBoundingClientRect().height || 600;
    
    const metrosHorizontal = Math.ceil((largura / 2) / PIXELS_POR_METRO);
    
    if (vistaAtual === "superior") {
      // Vista Superior: Grid infinito sem números internos
      const metrosVertical = Math.ceil((altura / 2) / PIXELS_POR_METRO) + 50; // Grid "infinito"
      const metrosHorizontalInfinito = metrosHorizontal + 50;
      
      // Linhas Verticais (eixo X) - sem labels
      for (let x = -metrosHorizontalInfinito; x <= metrosHorizontalInfinito; x++) {
        const isAxisLine = x === 0;
      linhas.push(
        <line
          key={`v-${x}`}
            x1={x * PIXELS_POR_METRO}
            y1={-metrosVertical * PIXELS_POR_METRO}
            x2={x * PIXELS_POR_METRO}
            y2={metrosVertical * PIXELS_POR_METRO}
            stroke={isAxisLine ? "rgba(255,255,255,0.4)" : "rgba(255,255,255,0.1)"}
            strokeWidth={isAxisLine ? 1.5 : 0.8}
          />
        );
      }
      
      // Linhas Horizontais (eixo Y) - sem labels
      for (let y = -metrosVertical; y <= metrosVertical; y++) {
        const isAxisLine = y === 0;
        linhas.push(
          <line
            key={`h-${y}`}
            x1={-metrosHorizontalInfinito * PIXELS_POR_METRO}
            y1={y * PIXELS_POR_METRO}
            x2={metrosHorizontalInfinito * PIXELS_POR_METRO}
            y2={y * PIXELS_POR_METRO}
            stroke={isAxisLine ? "rgba(255,255,255,0.4)" : "rgba(255,255,255,0.1)"}
            strokeWidth={isAxisLine ? 1.5 : 0.8}
          />
        );
      }
    
    } else {
      // Vista Lateral: Grid infinito uniforme (todas as linhas com mesma cor)
      const metrosVertical = Math.ceil((altura - origem.y) / PIXELS_POR_METRO) + 50; // Grid "infinito"
      const metrosHorizontalInfinito = metrosHorizontal + 50;
      
      // Linhas Verticais (1m em 1m) - sem labels
      for (let x = -metrosHorizontalInfinito; x <= metrosHorizontalInfinito; x++) {
      linhas.push(
        <line
            key={`v-${x}`}
            x1={x * PIXELS_POR_METRO}
            y1={0}
            x2={x * PIXELS_POR_METRO}
            y2={metrosVertical * PIXELS_POR_METRO}
            stroke="rgba(255,255,255,0.2)"
            strokeWidth={1}
          />
        );
      }
      
      // Linhas Horizontais (1m em 1m) - sem labels internos
      for (let z = 1; z <= metrosVertical; z++) {
        linhas.push(
          <line
            key={`h-${z}`}
            x1={-metrosHorizontalInfinito * PIXELS_POR_METRO}
            y1={z * PIXELS_POR_METRO}
            x2={metrosHorizontalInfinito * PIXELS_POR_METRO}
            y2={z * PIXELS_POR_METRO}
            stroke="rgba(255,255,255,0.2)"
            strokeWidth={1}
          />
        );
      }
    }
    
    return linhas;
  };

  // Conversão de coordenadas
  const converterTelaParaSVG = (e: React.MouseEvent) => {
    if (!svgRef.current) return { x: 0, y: 0 };
    
    const pt = svgRef.current.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    
    const svgMundo = document.getElementById('svg-mundo-newmark') as any;
    if (!svgMundo) return { x: 0, y: 0 };
    
    const ctm = svgMundo.getScreenCTM();
    if (!ctm) return { x: 0, y: 0 };
    
    const transformedPt = pt.matrixTransform(ctm.inverse());
    return { x: transformedPt.x, y: transformedPt.y };
  };
  
  const converterSVGParaMetros = (svgX: number, svgY: number, zAtual?: number) => {
    if (vistaAtual === "lateral") {
      return {
        x: svgX / PIXELS_POR_METRO,
        y: 0, // Vista lateral sempre y=0
        z: svgY / PIXELS_POR_METRO
      };
    } else {
      // Vista superior: svgY representa Y (transversal)
      return {
        x: svgX / PIXELS_POR_METRO,
        y: svgY / PIXELS_POR_METRO,
        z: zAtual ?? 0 // Mantém Z atual ou usa 0 para novos pontos
      };
    }
  };
  
  // Handlers de interação com pontos
  const iniciarArraste = (e: React.MouseEvent, pontoId: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    const ponto = pontos.find(p => p.id === pontoId);
    if (!ponto) return;
    
    mouseDownPosRef.current = { x: e.clientX, y: e.clientY };
    hasMovedRef.current = false;
    setDraggedPoint(pontoId);
    
    const svgPt = converterTelaParaSVG(e);
    if (vistaAtual === "lateral") {
      setOffsetArraste({
        x: svgPt.x - (ponto.x * PIXELS_POR_METRO),
        y: svgPt.y - (ponto.z * PIXELS_POR_METRO)
      });
    } else {
      // Vista superior: Y é o eixo vertical
      setOffsetArraste({
        x: svgPt.x - (ponto.x * PIXELS_POR_METRO),
        y: svgPt.y - (ponto.y * PIXELS_POR_METRO)
      });
    }
  };
  
  const duranteArraste = (e: React.MouseEvent) => {
    if (!draggedPoint) return;
    
    if (mouseDownPosRef.current && !hasMovedRef.current) {
      const deltaX = Math.abs(e.clientX - mouseDownPosRef.current.x);
      const deltaY = Math.abs(e.clientY - mouseDownPosRef.current.y);
      
      if (deltaX > 3 || deltaY > 3) {
        hasMovedRef.current = true;
        isDraggingRef.current = true;
      }
    }
    
    if (!hasMovedRef.current) return;
    
    const ponto = pontos.find(p => p.id === draggedPoint);
    if (!ponto) return;
    
    const svgPt = converterTelaParaSVG(e);
    let novoSvgX = svgPt.x - offsetArraste.x;
    let novoSvgY = svgPt.y - offsetArraste.y;
    
    const snapPixels = PIXELS_POR_METRO * GRID_SNAP_METROS;
    novoSvgX = Math.round(novoSvgX / snapPixels) * snapPixels;
    novoSvgY = Math.round(novoSvgY / snapPixels) * snapPixels;
    
    if (vistaAtual === "lateral" && novoSvgY < 0) novoSvgY = 0;
    
    const { x, y, z } = converterSVGParaMetros(novoSvgX, novoSvgY, ponto.z);
    
    onMovimentarPonto(draggedPoint, x, y, z);
    
    if (!selectedPoints.includes(draggedPoint)) {
      const pontoAtualizado = { ...ponto, x, y, z };
      mostrarTooltipHover(pontoAtualizado);
    }
  };
  
  const terminarArraste = () => {
    if (draggedPoint && hasMovedRef.current && onPontoSolto) {
      onPontoSolto(draggedPoint);
    }
    
    setDraggedPoint(null);
    mouseDownPosRef.current = null;
    
    if (hasMovedRef.current) {
      esconderTooltipHover();
    }
    
    setTimeout(() => {
      isDraggingRef.current = false;
      hasMovedRef.current = false;
    }, 50);
  };
  
  // Tooltip
  const calcularPosicaoTooltip = useCallback((ponto: PontoAnalise) => {
    if (!containerRef.current) return { x: 0, y: 0 };
    
    const pontoX = origem.x + (ponto.x * PIXELS_POR_METRO);
    const pontoY = vistaAtual === "lateral" 
      ? origem.y + (ponto.z * PIXELS_POR_METRO)
      : origem.y + (ponto.y * PIXELS_POR_METRO);
    
    return {
      x: pontoX + 15,
      y: pontoY + 15
    };
  }, [origem.x, origem.y, vistaAtual]);
  
  const mostrarTooltipHover = useCallback((ponto: PontoAnalise) => {
    if (selectedPoints.includes(ponto.id)) return;
    
    const pos = calcularPosicaoTooltip(ponto);
    setHoverTooltip({
      visible: true,
      x: pos.x,
      y: pos.y,
      ponto
    });
  }, [calcularPosicaoTooltip, selectedPoints]);
  
  const esconderTooltipHover = () => {
    setHoverTooltip({ visible: false, x: 0, y: 0, ponto: null });
  };
  
  const toggleTooltipFixo = (ponto: PontoAnalise) => {
    setSelectedPoints(prev => {
      if (prev.includes(ponto.id)) {
        // Desfixando: remove offsets e posição fixa
        setTooltipOffsets(offsets => {
          const newOffsets = { ...offsets };
          delete newOffsets[ponto.id];
          return newOffsets;
        });
        setTooltipFixedPositions(positions => {
          const newPositions = { ...positions };
          delete newPositions[ponto.id];
          return newPositions;
        });
        return prev.filter(id => id !== ponto.id);
      } else {
        // Fixando: salva a posição inicial
        const pos = calcularPosicaoTooltip(ponto);
        setTooltipFixedPositions(positions => ({
          ...positions,
          [ponto.id]: pos
        }));
        return [...prev, ponto.id];
      }
    });
  };
  
  useEffect(() => {
    const pontosIds = pontos.map(p => p.id);
    setSelectedPoints(prev => prev.filter(id => pontosIds.includes(id)));
    setTooltipOffsets(prev => {
      const newOffsets = { ...prev };
      Object.keys(newOffsets).forEach(id => {
        if (!pontosIds.includes(id)) {
          delete newOffsets[id];
        }
      });
      return newOffsets;
    });
    setTooltipFixedPositions(prev => {
      const newPositions = { ...prev };
      Object.keys(newPositions).forEach(id => {
        if (!pontosIds.includes(id)) {
          delete newPositions[id];
        }
      });
      return newPositions;
    });
  }, [pontos]);
  
  // Handlers de drag do tooltip
  const handleTooltipMouseDown = (e: React.MouseEvent, pontoId: string) => {
    e.stopPropagation();
    setDraggingTooltip(pontoId);
    tooltipDragStartRef.current = {
      x: e.clientX,
      y: e.clientY
    };
  };
  
  const handleTooltipMouseMove = useCallback((e: MouseEvent) => {
    if (!draggingTooltip || !tooltipDragStartRef.current) return;
    
    const deltaX = e.clientX - tooltipDragStartRef.current.x;
    const deltaY = e.clientY - tooltipDragStartRef.current.y;
    
    setTooltipOffsets(prev => ({
      ...prev,
      [draggingTooltip]: {
        x: (prev[draggingTooltip]?.x || 0) + deltaX,
        y: (prev[draggingTooltip]?.y || 0) + deltaY
      }
    }));
    
    tooltipDragStartRef.current = {
      x: e.clientX,
      y: e.clientY
    };
  }, [draggingTooltip]);
  
  const handleTooltipMouseUp = useCallback(() => {
    setDraggingTooltip(null);
    tooltipDragStartRef.current = null;
  }, []);
  
  useEffect(() => {
    if (draggingTooltip) {
      document.addEventListener('mousemove', handleTooltipMouseMove);
      document.addEventListener('mouseup', handleTooltipMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleTooltipMouseMove);
        document.removeEventListener('mouseup', handleTooltipMouseUp);
      };
    }
  }, [draggingTooltip, handleTooltipMouseMove, handleTooltipMouseUp]);
  
  // Handlers de Pan e Zoom
  const handleWheel = (e: React.WheelEvent) => {
    // Zoom apenas com Shift + Scroll (funciona em ambas as vistas)
    if (e.shiftKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      setZoom(prevZoom => Math.max(0.5, Math.min(3, prevZoom * delta)));
    }
  };
  
  const handleZoomIn = () => {
    setZoom(prevZoom => Math.min(3, prevZoom * 1.2));
  };
  
  const handleZoomOut = () => {
    setZoom(prevZoom => Math.max(0.5, prevZoom / 1.2));
  };
  
  const handleZoomReset = () => {
    setZoom(1);
    setPanOffset({ x: 0, y: 0 });
  };
  
  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    const target = e.target as SVGElement;
    
    // Não inicia pan se estiver em cima de um ponto ou área carregada
    const isPontoOrCarga = target.closest('[data-ponto-id]') || 
                           target.id === 'area-retangular-hitbox' || 
                           target.id === 'area-retangular-hitbox-superior' ||
                           target.closest('#area-retangular') ||
                           target.closest('#area-retangular-superior');
    
    // Pan com botão do meio OU botão esquerdo (se não for ponto/carga)
    if ((e.button === 1) || (e.button === 0 && !isPontoOrCarga)) {
      e.preventDefault();
      setIsPanning(true);
      panStartRef.current = { x: e.clientX - panOffset.x, y: e.clientY - panOffset.y };
    }
  };
  
  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    if (isPanning && panStartRef.current) {
      setPanOffset({
        x: e.clientX - panStartRef.current.x,
        y: e.clientY - panStartRef.current.y
      });
    }
  };
  
  const handleCanvasMouseUp = () => {
    setIsPanning(false);
    panStartRef.current = null;
  };
  
  const handleCliqueCanvas = (e: React.MouseEvent) => {
    const target = e.target as SVGElement;
    
    if (target.id === 'area-retangular-hitbox' || 
        target.id === 'area-retangular-hitbox-superior' ||
        target.closest('#area-retangular') ||
        target.closest('#area-retangular-superior')) {
      onDuploCliqueCarga();
      return;
    }
  };
  
  const handleDuploCliqueCanvas = (e: React.MouseEvent) => {
    const target = e.target as SVGElement;
    
    if (target.id === 'area-retangular-hitbox' || 
        target.id === 'area-retangular-hitbox-superior' ||
        target.closest('#area-retangular') ||
        target.closest('#area-retangular-superior')) {
      return;
    }
    
    const pontoId = target.closest('[data-ponto-id]')?.getAttribute('data-ponto-id');
    if (pontoId) {
      const ponto = pontos.find(p => p.id === pontoId);
      if (ponto) {
        onDuploCliquePonto(ponto);
        return;
      }
    }
    
    const svgPt = converterTelaParaSVG(e);
    const { x, y, z } = converterSVGParaMetros(svgPt.x, svgPt.y);
    
    // Na vista lateral, apenas permite pontos com Z > 0 (abaixo do solo)
    // Não permite em z <= 0 (no solo ou acima)
    // Na vista superior, permite qualquer Y mas Z será 3m por padrão
    if (vistaAtual === "lateral" && z <= 0) return;
    
    const xSnapped = Math.round(x / GRID_SNAP_METROS) * GRID_SNAP_METROS;
    const ySnapped = Math.round(y / GRID_SNAP_METROS) * GRID_SNAP_METROS;
    const zSnapped = vistaAtual === "lateral" ? Math.round(z / GRID_SNAP_METROS) * GRID_SNAP_METROS : 3;
    
    onDuploCliqueGrid(xSnapped, ySnapped, zSnapped);
  };

  // Renderiza área retangular com carga (Newmark - Vista Lateral)
  const renderizarCarga = () => {
    if (!largura || !comprimento || !intensidade) {
      return null;
    }
    
    const larguraPixels = largura * PIXELS_POR_METRO; // L
    const yInicio = -40;
    const alturaBase = 35;

    // Número de setas baseado na largura - SEM as bordas
    const numSetasTotal = Math.max(5, Math.floor(largura * 2.5));
    const setas = [];

    // Pula a primeira (i=0) e última (i=numSetasTotal-1) seta
    for (let i = 1; i < numSetasTotal - 1; i++) {
      const x = -larguraPixels / 2 + (larguraPixels / (numSetasTotal - 1)) * i;
        
        setas.push(
        <g key={`seta-${i}`}>
            <line
              x1={x}
            y1={yInicio + 5}
              x2={x}
            y2={yInicio + alturaBase - 3}
              stroke="rgb(234, 88, 12)"
            strokeWidth="2.5"
            />
            <path
            d={`M ${x} ${yInicio + alturaBase - 3} L ${x - 5} ${yInicio + alturaBase - 9} L ${x + 5} ${yInicio + alturaBase - 9} Z`}
              fill="rgb(234, 88, 12)"
            />
          </g>
        );
    }

    return (
      <g id="area-retangular">
        {/* Área retangular - vista lateral (2D) */}
        <rect
          x={-larguraPixels / 2}
          y={yInicio}
          width={larguraPixels}
          height={alturaBase}
          fill="rgba(234, 88, 12, 0.4)"
          stroke="rgb(234, 88, 12)"
          strokeWidth="3"
          rx="2"
        />

        {/* Padrão de hachura vertical para dar textura */}
        <defs>
          <pattern id="sapata-pattern-newmark" x="0" y="0" width="8" height="8" patternUnits="userSpaceOnUse">
            <line x1="4" y1="0" x2="4" y2="8" stroke="rgba(234, 88, 12, 0.15)" strokeWidth="1.5"/>
          </pattern>
        </defs>
        <rect
          x={-larguraPixels / 2}
          y={yInicio}
          width={larguraPixels}
          height={alturaBase}
          fill="url(#sapata-pattern-newmark)"
        />

        {/* Setas de carga uniformemente distribuídas - DENTRO */}
        {setas}

        {/* Nome da sapata no centro (sempre visível) */}
        <g transform={`translate(0, ${yInicio + alturaBase / 2})`}>
          <rect
            x="-50"
            y="-12"
            width="100"
            height="24"
            fill="hsl(var(--popover))"
            stroke="rgb(234, 88, 12)"
            strokeWidth="2"
            rx="4"
            fillOpacity="0.95"
            filter="drop-shadow(0 2px 4px rgba(0,0,0,0.3))"
          />
          <text
            x="0" 
            y="6" 
            fontSize="14"
            fontWeight="700"
            fill="rgb(234, 88, 12)"
            textAnchor="middle"
          >
            {nomeSapata}
          </text>
        </g>

        {/* Labels detalhados (apenas ao passar o mouse) */}
        {sapataHover && (
          <>
            {/* Label da Largura (L) - horizontal acima */}
            <g id="label-largura">
              <line
                x1={-larguraPixels / 2}
                y1={yInicio - 25}
                x2={larguraPixels / 2}
                y2={yInicio - 25}
                stroke="rgb(234, 88, 12)"
                strokeWidth="2.5"
                strokeDasharray="5 3"
              />
              <line 
                x1={-larguraPixels / 2} 
                y1={yInicio - 30} 
                x2={-larguraPixels / 2} 
                y2={yInicio - 20} 
                stroke="rgb(234, 88, 12)" 
                strokeWidth="2.5" 
              />
              <line 
                x1={larguraPixels / 2} 
                y1={yInicio - 30} 
                x2={larguraPixels / 2} 
                y2={yInicio - 20} 
                stroke="rgb(234, 88, 12)"
                strokeWidth="2.5" 
              />
              
              <g transform={`translate(0, ${yInicio - 42})`}>
                <rect
                  x="-38"
                  y="-12"
                  width="76"
                  height="24"
                  fill="hsl(var(--popover))"
                  stroke="rgb(234, 88, 12)"
                  strokeWidth="2.5"
                  rx="5"
                  filter="drop-shadow(0 3px 6px rgba(0,0,0,0.3))"
                />
                <text
                  x="0"
                  y="6"
                  fontSize="15"
                  fontWeight="800"
                  fill="rgb(234, 88, 12)"
                  textAnchor="middle"
                >
                  L = {largura.toFixed(1)} m
                </text>
              </g>
            </g>

            {/* Label da intensidade (p) - ao lado direito */}
            {intensidade !== undefined && (
              <g transform={`translate(${larguraPixels / 2 + 25}, ${yInicio + alturaBase / 2})`}>
                <rect
                  x="-5"
                  y="-10"
                  width={intensidade.toFixed(0).length * 8 + 55}
                  height="20"
                  fill="hsl(var(--popover))"
                  stroke="rgb(234, 88, 12)"
                  strokeWidth="1"
                  rx="3"
                />
                <text
                  x="2" 
                  y="5" 
                  fontSize="12"
                  fontWeight="600"
                  fill="rgb(234, 88, 12)"
                >
                  p = {intensidade.toFixed(0)} kPa
                </text>
              </g>
            )}
          </>
        )}

        {/* Hitbox para edição */}
        <rect
          id="area-retangular-hitbox"
          x={-larguraPixels / 2 - 15}
          y={yInicio - 50}
          width={larguraPixels + 30}
          height={alturaBase + 55}
          fill="transparent"
          className="cursor-pointer"
          onMouseEnter={() => setSapataHover(true)}
          onMouseLeave={() => setSapataHover(false)}
          onClick={(e) => {
            e.stopPropagation();
            onDuploCliqueCarga();
          }}
        />
      </g>
    );
  };

  // Renderiza área retangular com carga (Newmark - Vista Superior / Planta)
  const renderizarCargaSuperior = () => {
    if (!largura || !comprimento || !intensidade) {
      return null;
    }
    
    const larguraPixels = largura * PIXELS_POR_METRO; // L
    const comprimentoPixels = comprimento * PIXELS_POR_METRO; // C

    return (
      <g id="area-retangular-superior">
        {/* Retângulo da sapata - vista de cima */}
          <rect
          x={-larguraPixels / 2}
          y={-comprimentoPixels / 2}
          width={larguraPixels}
          height={comprimentoPixels}
          fill="rgba(234, 88, 12, 0.3)"
          stroke="rgb(234, 88, 12)"
          strokeWidth="3"
          rx="2"
        />

        {/* Padrão de hachura cruzada para dar textura */}
        <defs>
          <pattern id="sapata-pattern-superior" x="0" y="0" width="10" height="10" patternUnits="userSpaceOnUse">
            <line x1="0" y1="0" x2="10" y2="10" stroke="rgba(234, 88, 12, 0.2)" strokeWidth="1"/>
            <line x1="10" y1="0" x2="0" y2="10" stroke="rgba(234, 88, 12, 0.2)" strokeWidth="1"/>
          </pattern>
        </defs>
        <rect
          x={-larguraPixels / 2}
          y={-comprimentoPixels / 2}
          width={larguraPixels}
          height={comprimentoPixels}
          fill="url(#sapata-pattern-superior)"
        />

        {/* Linhas de centro (cruz) */}
        <line
          x1={-larguraPixels / 2}
          y1="0"
          x2={larguraPixels / 2}
          y2="0"
          stroke="rgba(234, 88, 12, 0.5)"
          strokeWidth="1"
          strokeDasharray="4 2"
        />
        <line
          x1="0"
          y1={-comprimentoPixels / 2}
          x2="0"
          y2={comprimentoPixels / 2}
          stroke="rgba(234, 88, 12, 0.5)"
          strokeWidth="1"
          strokeDasharray="4 2"
        />

        {/* Nome da sapata no centro (sempre visível) */}
        <g>
          <rect
            x="-50"
            y="-12"
            width="100"
            height="24"
            fill="hsl(var(--popover))"
            stroke="rgb(234, 88, 12)"
            strokeWidth="2"
            rx="4"
            fillOpacity="0.95"
            filter="drop-shadow(0 2px 4px rgba(0,0,0,0.3))"
          />
          <text
            x="0" 
            y="6" 
            fontSize="14"
            fontWeight="700"
            fill="rgb(234, 88, 12)"
            textAnchor="middle"
          >
            {nomeSapata}
          </text>
        </g>

        {/* Labels detalhados (apenas ao passar o mouse) */}
        {sapataHover && (
          <>
            {/* Label da Largura (L) - horizontal acima */}
            <g id="label-largura-superior">
              <line
                x1={-larguraPixels / 2}
                y1={-comprimentoPixels / 2 - 20}
                x2={larguraPixels / 2}
                y2={-comprimentoPixels / 2 - 20}
                stroke="rgb(234, 88, 12)"
                strokeWidth="2"
                strokeDasharray="4 2"
              />
              <line 
                x1={-larguraPixels / 2} 
                y1={-comprimentoPixels / 2 - 25} 
                x2={-larguraPixels / 2} 
                y2={-comprimentoPixels / 2 - 15} 
                stroke="rgb(234, 88, 12)" 
                strokeWidth="2" 
              />
              <line 
                x1={larguraPixels / 2} 
                y1={-comprimentoPixels / 2 - 25} 
                x2={larguraPixels / 2} 
                y2={-comprimentoPixels / 2 - 15} 
                stroke="rgb(234, 88, 12)" 
                strokeWidth="2" 
              />
              
              <g transform={`translate(0, ${-comprimentoPixels / 2 - 35})`}>
                <rect
                  x="-35"
                  y="-10"
                  width="70"
                  height="20"
                  fill="hsl(var(--popover))"
                  stroke="rgb(234, 88, 12)"
                  strokeWidth="2"
                  rx="4"
                  filter="drop-shadow(0 2px 4px rgba(0,0,0,0.2))"
                />
                <text
                  x="0"
                  y="5"
                  fontSize="13"
                  fontWeight="700"
                  fill="rgb(234, 88, 12)"
                  textAnchor="middle"
                >
                  L = {largura.toFixed(1)} m
                </text>
              </g>
            </g>

            {/* Label do Comprimento (C) - vertical à esquerda */}
            <g id="label-comprimento-superior">
              <line
                x1={-larguraPixels / 2 - 20}
                y1={-comprimentoPixels / 2}
                x2={-larguraPixels / 2 - 20}
                y2={comprimentoPixels / 2}
                stroke="rgb(234, 88, 12)"
                strokeWidth="2"
                strokeDasharray="4 2"
              />
              <line 
                x1={-larguraPixels / 2 - 25} 
                y1={-comprimentoPixels / 2} 
                x2={-larguraPixels / 2 - 15} 
                y2={-comprimentoPixels / 2} 
                stroke="rgb(234, 88, 12)" 
                strokeWidth="2"
              />
              <line 
                x1={-larguraPixels / 2 - 25} 
                y1={comprimentoPixels / 2} 
                x2={-larguraPixels / 2 - 15} 
                y2={comprimentoPixels / 2} 
                stroke="rgb(234, 88, 12)" 
                strokeWidth="2" 
              />
              
              <g transform={`translate(${-larguraPixels / 2 - 35}, 0)`}>
                <rect
                  x="-35"
                  y="-10"
                  width="70"
                  height="20"
                  fill="hsl(var(--popover))"
                  stroke="rgb(234, 88, 12)"
                  strokeWidth="2"
                  rx="4"
                  filter="drop-shadow(0 2px 4px rgba(0,0,0,0.2))"
                />
                <text
                  x="0"
                  y="5"
                  fontSize="13"
                  fontWeight="700"
                  fill="rgb(234, 88, 12)"
                  textAnchor="middle"
                >
                  C = {comprimento.toFixed(1)} m
                </text>
              </g>
            </g>

            {/* Label da intensidade (p) - abaixo do nome */}
            {intensidade !== undefined && (
              <g>
                <rect
                  x="-40"
                  y="20"
                  width="80"
                  height="20"
                  fill="hsl(var(--popover))"
                  stroke="rgb(234, 88, 12)"
                  strokeWidth="1.5"
                  rx="3"
                  fillOpacity="0.95"
                />
                <text
                  x="0" 
                  y="35" 
                  fontSize="11"
                  fontWeight="600"
                  fill="rgb(234, 88, 12)"
                  textAnchor="middle"
                >
                  p = {intensidade.toFixed(0)} kPa
                </text>
              </g>
            )}
          </>
        )}

        {/* Hitbox para edição */}
        <rect
          id="area-retangular-hitbox-superior"
          x={-larguraPixels / 2 - 10}
          y={-comprimentoPixels / 2 - 10}
          width={larguraPixels + 20}
          height={comprimentoPixels + 20}
          fill="transparent"
          className="cursor-pointer"
          onMouseEnter={() => setSapataHover(true)}
          onMouseLeave={() => setSapataHover(false)}
          onClick={(e) => {
            e.stopPropagation();
            onDuploCliqueCarga();
          }}
        />
        </g>
      );
  };

  return (
    <Card className="overflow-hidden" data-tour={vistaAtual === "lateral" ? "canvas-lateral" : "canvas-superior"}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center shadow-lg">
              <Layers className="w-5 h-5 text-white" />
            </div>
            Perfil do Solo - Newmark (Carga Retangular)
          </CardTitle>
          
          {/* Botões de controle */}
          <div className="flex items-center gap-2">
            {/* Botões de vista - apenas quando NÃO está em fullscreen */}
            {!isFullscreen && (
              <>
                <Button
                  variant={vistaAtual === "lateral" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setVistaAtual("lateral")}
                  className="h-8 text-xs"
                >
                  <Eye className="w-3.5 h-3.5 mr-1.5" />
                  Lateral
                </Button>
                <Button
                  variant={vistaAtual === "superior" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setVistaAtual("superior")}
                  className="h-8 text-xs"
                  data-tour="vista-superior-btn"
                >
                  <Eye className="w-3.5 h-3.5 mr-1.5" />
                  Superior
                </Button>
              </>
            )}
            
            {/* Botão de fullscreen */}
            <Button
              variant="outline"
              size="sm"
              onClick={toggleFullscreen}
              className="h-8 text-xs"
              title={isFullscreen ? "Sair da tela cheia" : "Tela cheia"}
            >
              {isFullscreen ? (
                <Minimize2 className="w-3.5 h-3.5" />
              ) : (
                <Maximize2 className="w-3.5 h-3.5" />
              )}
            </Button>
          </div>
        </div>
        <div className="mt-3 flex items-start gap-2 text-xs bg-muted/50 p-3 rounded-lg border">
          <Info className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
          <div className="space-y-1">
            <p className="text-muted-foreground">
              {vistaAtual === "lateral" ? (
                <>
                  <strong className="text-foreground">Vista Lateral (X-Z)</strong> • 
                  <strong className="text-foreground" data-tour="carga-config"> Clique na área retangular</strong> para configurar • 
                  <strong className="text-foreground"> Duplo clique no solo</strong> para adicionar pontos
                </>
              ) : (
                <>
                  <strong className="text-foreground">Vista Superior (X-Y)</strong> • Planta da sapata • 
                  <strong className="text-foreground"> Duplo clique</strong> para adicionar pontos com Y variável • 
                  <strong className="text-foreground"> Arraste o plano</strong> para reposicionar pontos distantes
                </>
              )}
            </p>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-0 h-full">
        <div ref={containerRef} className={`relative w-full bg-muted/30 overflow-hidden ${isFullscreen ? 'h-screen' : 'h-[600px]'}`}>
          <svg
            ref={svgRef}
            width="100%"
            height="100%"
            preserveAspectRatio="xMidYMid meet"
            onClick={handleCliqueCanvas}
            onDoubleClick={handleDuploCliqueCanvas}
            onMouseDown={handleCanvasMouseDown}
            onMouseMove={(e) => {
              if (isPanning) {
                handleCanvasMouseMove(e);
              } else {
                duranteArraste(e);
              }
            }}
            onMouseUp={() => {
              handleCanvasMouseUp();
              terminarArraste();
            }}
            onMouseLeave={() => {
              handleCanvasMouseUp();
              terminarArraste();
            }}
            onWheel={handleWheel}
            onContextMenu={(e) => e.preventDefault()}
            className={isPanning ? "cursor-grabbing" : "cursor-crosshair"}
          >
            <defs>
              <linearGradient id="solo-gradiente-newmark" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="hsl(var(--muted))" />
                <stop offset="100%" stopColor="hsl(var(--muted))" stopOpacity="0.7" />
              </linearGradient>
              
              <pattern id="solo-textura-newmark" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                <circle cx="3" cy="3" r="0.8" fill="rgba(0,0,0,0.05)" />
                <circle cx="15" cy="8" r="0.6" fill="rgba(0,0,0,0.04)" />
                <circle cx="8" cy="15" r="0.7" fill="rgba(0,0,0,0.045)" />
                <circle cx="18" cy="18" r="0.5" fill="rgba(0,0,0,0.035)" />
              </pattern>
              
              <pattern id="superficie-pattern-newmark" x="0" y="0" width="40" height="4" patternUnits="userSpaceOnUse">
                <rect width="40" height="4" fill="hsl(var(--border))" />
              </pattern>
            </defs>
            
            <g id="svg-mundo-newmark" transform={`translate(${origem.x + panOffset.x}, ${origem.y + panOffset.y}) scale(${zoom})`}>
              {/* Grid - agora se move com o conteúdo em ambas as vistas */}
              {vistaAtual === "superior" ? (
                <g id="svg-grid-superior">{renderizarGrid()}</g>
              ) : null}
              {/* Solo - apenas na vista lateral */}
              {vistaAtual === "lateral" && (
                <>
              <rect
                    x={-origem.x}
                y={0}
                    width={origem.x * 2}
                height={1000}
                fill="url(#solo-gradiente-newmark)"
              />
              
              <rect
                    x={-origem.x}
                y={0}
                    width={origem.x * 2}
                height={1000}
                fill="url(#solo-textura-newmark)"
                opacity={0.6}
              />
              
              {/* Superfície */}
              <rect
                    x={-origem.x}
                y={-4}
                    width={origem.x * 2}
                height={4}
                fill="url(#superficie-pattern-newmark)"
              />
              
              {/* Linha do terreno */}
              <line
                stroke="rgba(255,255,255,0.2)"
                strokeWidth="1"
                x1="-10000"
                y1="0"
                x2="10000"
                y2="0"
              />
                </>
              )}
              
              {/* Grid - apenas na vista lateral (acompanha zoom/pan) */}
              {vistaAtual === "lateral" && (
                <g id="svg-grid">{renderizarGrid(zoom, panOffset)}</g>
              )}
              
              {/* Carga retangular */}
              {vistaAtual === "lateral" ? renderizarCarga() : renderizarCargaSuperior()}
              
              {/* Pontos de Análise */}
              <g id="svg-pontos">
                {pontos.length === 0 ? (
                  <g>
                    <rect
                      x={-200}
                      y={135}
                      width={400}
                      height={30}
                      fill="hsl(var(--popover))"
                      stroke="hsl(var(--border))"
                      strokeWidth="1"
                      rx={6}
                    />
                    <text
                      x={0}
                      y={155}
                      fontSize="13"
                      fill="hsl(var(--muted-foreground))"
                      textAnchor="middle"
                      pointerEvents="none"
                      fontWeight="500"
                    >
                      Duplo clique no canvas para adicionar pontos de análise
                    </text>
                  </g>
                ) : (
                  pontos.map(ponto => {
                    const yPos = vistaAtual === "lateral" ? ponto.z * PIXELS_POR_METRO : ponto.y * PIXELS_POR_METRO;
                    // Fator de escala para manter tamanho constante dos pontos (zoom entre 0.5x e 2x)
                    const scaleFactor = Math.max(0.5, Math.min(zoom, 2));
                    return (
                    <g
                      key={ponto.id}
                      data-ponto-id={ponto.id}
                      transform={`translate(${ponto.x * PIXELS_POR_METRO}, ${yPos})`}
                      onMouseEnter={() => !draggedPoint && mostrarTooltipHover(ponto)}
                      onMouseLeave={() => !draggedPoint && esconderTooltipHover()}
                      className="cursor-grab active:cursor-grabbing"
                    >
                      {/* Linha tracejada do ponto até a superfície - apenas na vista lateral */}
                      {vistaAtual === "lateral" && (
                        <line
                          x1={0}
                          y1={0}
                          x2={0}
                          y2={-(ponto.z * PIXELS_POR_METRO)}
                          stroke="rgb(234, 88, 12)"
                          strokeWidth={2.5 / scaleFactor}
                          strokeDasharray={`${5 / scaleFactor} ${5 / scaleFactor}`}
                          opacity={0.5}
                          pointerEvents="none"
                        />
                      )}
                      
                      {/* Círculo do ponto - tamanho adapta ao zoom */}
                      <circle
                        cx={0}
                        cy={0}
                        r={TAMANHO_PONTO / scaleFactor}
                        fill={ponto.tensao !== undefined ? "rgb(234, 88, 12)" : "hsl(var(--muted-foreground))"}
                        stroke={ponto.tensao !== undefined ? "rgb(234, 88, 12)" : "hsl(var(--border))"}
                        strokeWidth={2.5 / scaleFactor}
                        className="transition-all hover:drop-shadow-[0_0_10px_rgba(234,88,12,0.5)]"
                        onMouseDown={(e) => iniciarArraste(e, ponto.id)}
                        onClick={(e) => {
                          if (isDraggingRef.current) {
                            return;
                          }
                          
                          e.stopPropagation();
                          
                          if (clickTimeoutRef.current) {
                            clearTimeout(clickTimeoutRef.current);
                            clickTimeoutRef.current = null;
                            return;
                          }
                          
                          clickTimeoutRef.current = setTimeout(() => {
                            toggleTooltipFixo(ponto);
                            clickTimeoutRef.current = null;
                          }, 250);
                        }}
                      />
                      
                      {/* Nome do ponto - tamanho adapta ao zoom */}
                      <rect
                        x={(TAMANHO_PONTO + 2) / scaleFactor}
                        y={-8 / scaleFactor}
                        width={(ponto.nome.length * 7 + 6) / scaleFactor}
                        height={16 / scaleFactor}
                        fill="hsl(var(--popover))"
                        stroke="hsl(var(--border))"
                        strokeWidth={0.5 / scaleFactor}
                        rx={3 / scaleFactor}
                        className="cursor-grab active:cursor-grabbing"
                        onMouseDown={(e) => iniciarArraste(e, ponto.id)}
                      />
                      
                      <text
                        x={(TAMANHO_PONTO + 5) / scaleFactor}
                        y={3 / scaleFactor}
                        fontSize={11 / scaleFactor}
                        fontWeight="600"
                        fill="hsl(var(--popover-foreground))"
                        className="cursor-grab active:cursor-grabbing"
                        onMouseDown={(e) => iniciarArraste(e, ponto.id)}
                      >
                        {ponto.nome}
                      </text>
                    </g>
                    );
                  })
                )}
              </g>
            </g>
          </svg>
          
          {/* Tooltips Fixos - Múltiplos */}
          {selectedPoints.map(pontoId => {
            const ponto = pontos.find(p => p.id === pontoId);
            if (!ponto) return null;
            
            // Usa a posição fixa salva quando o tooltip foi fixado
            const fixedPos = tooltipFixedPositions[pontoId];
            if (!fixedPos) return null;
            
            const offset = tooltipOffsets[pontoId] || { x: 0, y: 0 };
            
            return (
              <div
                key={`tooltip-${pontoId}`}
                className="absolute z-50 bg-gradient-to-br from-card to-card/95 backdrop-blur-md text-card-foreground rounded-xl shadow-2xl border-2 border-orange-500 scale-105"
                style={{
                  left: `${fixedPos.x + offset.x}px`,
                  top: `${fixedPos.y + offset.y}px`,
                  cursor: draggingTooltip === pontoId ? 'grabbing' : 'grab',
                  userSelect: 'none',
                  transition: draggingTooltip === pontoId ? 'none' : 'all 0.3s ease-out'
                }}
                onMouseDown={(e) => handleTooltipMouseDown(e, pontoId)}
              >
                {/* Indicador de fixação */}
                <div 
                  className="absolute -top-2 -right-2 w-4 h-4 bg-orange-500 rounded-full border-2 border-background shadow-lg animate-pulse"
                  title="Clique para desfixar"
                />
                
                {/* Handle de arraste */}
                <div className="absolute top-0 left-0 right-0 h-6 flex items-center justify-center rounded-t-xl hover:bg-orange-500/10 transition-colors cursor-grab active:cursor-grabbing">
                  <GripVertical className="w-4 h-4 text-muted-foreground/50" />
                </div>
                
                <div className="px-4 py-3 pt-6 min-w-[180px]">
                  {/* Header com nome do ponto */}
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-gradient-to-br from-orange-500 to-red-600 shadow-sm" />
                    <div className="font-bold text-base text-foreground">
                      {ponto.nome}
                    </div>
                  </div>
                  
                  {/* Coordenadas */}
                  <div className="space-y-1 text-xs mb-2">
                    <div className="flex items-center justify-between gap-3 bg-muted/30 px-2 py-1 rounded">
                      <span className="font-semibold text-muted-foreground">X:</span>
                      <span className="font-mono font-medium text-foreground">
                        {ponto.x >= 0 ? '+' : ''}{ponto.x.toFixed(2)} m
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-3 bg-muted/30 px-2 py-1 rounded">
                      <span className="font-semibold text-muted-foreground">Y:</span>
                      <span className="font-mono font-medium text-foreground">
                        {ponto.y >= 0 ? '+' : ''}{ponto.y.toFixed(2)} m
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-3 bg-muted/30 px-2 py-1 rounded">
                      <span className="font-semibold text-muted-foreground">Z:</span>
                      <span className="font-mono font-medium text-foreground">
                        {ponto.z.toFixed(2)} m
                      </span>
                    </div>
                  </div>
                  
                  {/* Tensão calculada */}
                  {ponto.tensao !== undefined ? (
                    <div className="mt-2 pt-2 border-t border-border/50">
                      <div className="bg-gradient-to-r from-orange-500/10 to-red-600/10 px-2 py-1.5 rounded">
                        <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-0.5">
                          Acréscimo de Tensão
                        </div>
                        <div className="flex items-baseline gap-1">
                          <span className="text-sm font-bold text-orange-600">Δσv =</span>
                          <span className="text-base font-bold text-foreground font-mono">
                            {ponto.tensao.toFixed(decimalPlaces)}
                          </span>
                          <span className="text-xs font-semibold text-muted-foreground">kPa</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-2 pt-2 border-t border-border/50">
                      <div className="text-xs text-muted-foreground italic text-center py-1">
                        Aguardando cálculo...
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          
          {/* Tooltip Hover - Temporário */}
          {hoverTooltip.visible && hoverTooltip.ponto && (
            <div
              className="absolute z-40 bg-gradient-to-br from-card to-card/95 backdrop-blur-md text-card-foreground rounded-xl shadow-2xl border-2 border-border/50 transition-all duration-300 ease-out"
              style={{
                left: `${hoverTooltip.x}px`,
                top: `${hoverTooltip.y}px`,
                pointerEvents: 'none',
                animation: 'fadeInScale 0.2s ease-out'
              }}
            >
              <div className="px-4 py-3 min-w-[180px]">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-gradient-to-br from-orange-500 to-red-600 shadow-sm" />
                  <div className="font-bold text-base text-foreground">
                    {hoverTooltip.ponto.nome}
                  </div>
                </div>
                
                <div className="space-y-1 text-xs mb-2">
                  <div className="flex items-center justify-between gap-3 bg-muted/30 px-2 py-1 rounded">
                    <span className="font-semibold text-muted-foreground">X:</span>
                    <span className="font-mono font-medium text-foreground">
                      {hoverTooltip.ponto.x >= 0 ? '+' : ''}{hoverTooltip.ponto.x.toFixed(2)} m
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-3 bg-muted/30 px-2 py-1 rounded">
                    <span className="font-semibold text-muted-foreground">Y:</span>
                    <span className="font-mono font-medium text-foreground">
                      {hoverTooltip.ponto.y >= 0 ? '+' : ''}{hoverTooltip.ponto.y.toFixed(2)} m
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-3 bg-muted/30 px-2 py-1 rounded">
                    <span className="font-semibold text-muted-foreground">Z:</span>
                    <span className="font-mono font-medium text-foreground">
                      {hoverTooltip.ponto.z.toFixed(2)} m
                    </span>
                  </div>
                </div>
                
                {hoverTooltip.ponto.tensao !== undefined ? (
                  <div className="mt-2 pt-2 border-t border-border/50">
                    <div className="bg-gradient-to-r from-orange-500/10 to-red-600/10 px-2 py-1.5 rounded">
                      <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-0.5">
                        Acréscimo de Tensão
                      </div>
                      <div className="flex items-baseline gap-1">
                        <span className="text-sm font-bold text-orange-600">Δσv =</span>
                        <span className="text-base font-bold text-foreground font-mono">
                          {hoverTooltip.ponto.tensao.toFixed(decimalPlaces)}
                        </span>
                        <span className="text-xs font-semibold text-muted-foreground">kPa</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="mt-2 pt-2 border-t border-border/50">
                    <div className="text-xs text-muted-foreground italic text-center py-1">
                      Aguardando cálculo...
                    </div>
                  </div>
                )}
                
                <div className="mt-2 pt-2 border-t border-border/30 text-[10px] text-muted-foreground text-center">
                  Clique para fixar
                </div>
              </div>
            </div>
          )}
          
          <style>{`
            @keyframes fadeInScale {
              from {
                opacity: 0;
                transform: scale(0.95) translateY(-5px);
              }
              to {
                opacity: 1;
                transform: scale(1) translateY(0);
              }
            }
          `}</style>
          
          {/* Controles de Vista - apenas em fullscreen */}
          {isFullscreen && (
            <div className="absolute top-4 left-4 flex gap-2 bg-card/95 backdrop-blur-md border shadow-xl rounded-lg p-2">
              <Button
                variant={vistaAtual === "lateral" ? "default" : "outline"}
                size="sm"
                onClick={() => setVistaAtual("lateral")}
                className="h-8 text-xs"
              >
                <Eye className="w-3.5 h-3.5 mr-1.5" />
                Lateral (X-Z)
              </Button>
              <Button
                variant={vistaAtual === "superior" ? "default" : "outline"}
                size="sm"
                onClick={() => setVistaAtual("superior")}
                className="h-8 text-xs"
              >
                <Eye className="w-3.5 h-3.5 mr-1.5" />
                Superior (X-Y)
              </Button>
            </div>
          )}
          
          {/* Botão de Sair da Tela Cheia - apenas em fullscreen */}
          {isFullscreen && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-card/95 backdrop-blur-md border shadow-xl rounded-lg p-2">
              <Button
                variant="default"
                size="sm"
                onClick={toggleFullscreen}
                className="h-8 text-xs bg-destructive hover:bg-destructive/90"
              >
                <Minimize2 className="w-3.5 h-3.5 mr-2" />
                Sair da Tela Cheia (ESC)
              </Button>
            </div>
          )}
          
          {/* Controles de Zoom - ambas as vistas */}
          <div className="absolute top-4 right-4 flex flex-col gap-2 bg-card/95 backdrop-blur-md border shadow-xl rounded-lg p-2">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={handleZoomIn}
              disabled={zoom >= 3}
              title="Zoom In (Shift + Scroll)"
            >
              <ZoomIn className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={handleZoomReset}
              title="Resetar Vista"
            >
              <Maximize2 className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={handleZoomOut}
              disabled={zoom <= 0.5}
              title="Zoom Out (Shift + Scroll)"
            >
              <ZoomOut className="w-4 h-4" />
            </Button>
            <div className="text-center text-[10px] font-semibold text-muted-foreground mt-1">
              {zoom.toFixed(1)}x
            </div>
          </div>
          
          {/* Labels de coordenadas fixos */}
          {(() => {
            if (vistaAtual === "lateral") {
              // Labels de profundidade Z para vista lateral
              const labels = [];
              const containerHeight = containerRef.current?.getBoundingClientRect().height || 600;
              
              // Calcular range visível em metros de profundidade
              const minZVisible = (-panOffset.y) / (PIXELS_POR_METRO * zoom);
              const maxZVisible = (containerHeight - panOffset.y) / (PIXELS_POR_METRO * zoom);
              
              const rangeZ = maxZVisible - minZVisible;
              const stepZ = Math.max(1, Math.ceil(rangeZ / 10)); // até 10 labels
              
              // Labels de profundidade (Z) na esquerda
              const startZ = Math.max(1, Math.ceil(minZVisible / stepZ) * stepZ); // Começa em 1m (não mostra 0)
              const endZ = Math.floor(maxZVisible / stepZ) * stepZ;
              
              for (let z = startZ; z <= endZ; z += stepZ) {
                // Converte coordenada Z (metro) para posição na tela
                const screenY = origem.y + panOffset.y + (z * PIXELS_POR_METRO * zoom);
                
                // Renderiza se estiver dentro do canvas
                if (screenY > origem.y + 10 && screenY < containerHeight - 10) {
                  labels.push(
                    <div
                      key={`z-label-${z}`}
                      className="absolute left-2 bg-popover border border-border rounded px-2 py-0.5 shadow-md"
                      style={{ top: `${screenY - 10}px` }}
                    >
                      <span className="text-[11px] font-semibold text-popover-foreground">
                        {z}m
                      </span>
                    </div>
                  );
                }
              }
              
              return labels;
            }
            
            // Vista Superior: Labels X e Y
            return (() => {
            const labels = [];
            const containerWidth = containerRef.current?.getBoundingClientRect().width || 800;
            const containerHeight = containerRef.current?.getBoundingClientRect().height || 600;
            const centerX = containerWidth / 2;
            const centerY = containerHeight / 2;
            
            // Calcular range visível em metros
            const minXVisible = (-centerX - panOffset.x) / (PIXELS_POR_METRO * zoom);
            const maxXVisible = (centerX - panOffset.x) / (PIXELS_POR_METRO * zoom);
            // Para Y, o topo (screenY=0) é positivo, fundo (screenY=height) é negativo
            const maxYVisible = -(0 - centerY - panOffset.y) / (PIXELS_POR_METRO * zoom);  // Topo
            const minYVisible = -(containerHeight - centerY - panOffset.y) / (PIXELS_POR_METRO * zoom); // Fundo
            
            // Calcular espaçamento inteligente (mesma lógica para ambos os eixos)
            const rangeX = maxXVisible - minXVisible;
            const rangeY = maxYVisible - minYVisible;
            const stepX = Math.max(2, Math.ceil(rangeX / 7)); // mais labels no topo
            const stepY = Math.max(2, Math.ceil(rangeY / 7)); // mesma lógica do eixo X
            
            // Labels do eixo Y (esquerda) - mesma lógica do eixo X
            const startY = Math.ceil(minYVisible / stepY) * stepY;
            const endY = Math.floor(maxYVisible / stepY) * stepY;
            for (let y = startY; y <= endY; y += stepY) {
              // Converte coordenada Y (metro) para posição na tela
              const screenY = centerY - (y * PIXELS_POR_METRO * zoom) + panOffset.y;
              
              // Renderiza se estiver dentro do canvas (margem mínima)
              if (screenY > 10 && screenY < containerHeight - 10) {
                labels.push(
                  <div
                    key={`y-label-${y}`}
                    className="absolute left-2 bg-popover border border-border rounded px-2 py-0.5 shadow-md"
                    style={{ top: `${screenY - 10}px` }}
                  >
                    <span className="text-[11px] font-semibold text-popover-foreground">
                      {y === 0 ? '0m' : (y > 0 ? '+' : '')}{y !== 0 ? y + 'm' : ''}
                    </span>
                  </div>
                );
              }
            }
            
            // Labels do eixo X (topo) - alinhados com valores inteiros
            const startX = Math.ceil(minXVisible / stepX) * stepX;
            const endX = Math.floor(maxXVisible / stepX) * stepX;
            for (let x = startX; x <= endX; x += stepX) {
              // Converte coordenada X (metro) para posição na tela
              const screenX = centerX + (x * PIXELS_POR_METRO * zoom) + panOffset.x;
              
              // Margem maior à direita para não sobrepor os botões de zoom (120px)
              if (screenX > 50 && screenX < containerWidth - 120) {
                labels.push(
                  <div
                    key={`x-label-${x}`}
                    className="absolute top-2 bg-popover border border-border rounded px-2 py-0.5 shadow-md"
                    style={{ left: `${screenX - 20}px` }} // centraliza horizontalmente
                  >
                    <span className="text-[11px] font-semibold text-popover-foreground">
                      {x === 0 ? '0m' : (x > 0 ? '+' : '')}{x !== 0 ? x + 'm' : ''}
                    </span>
                  </div>
                );
              }
            }
            
            return labels;
            })(); // Fecha a função da vista superior
          })()}
          
          {/* Legenda */}
          <div className="absolute bottom-4 right-4 bg-card/95 backdrop-blur-md border shadow-xl rounded-lg p-3 text-xs max-w-[220px]">
            <div className="font-semibold mb-2 flex items-center gap-2 text-foreground">
              <Info className="w-3.5 h-3.5 text-orange-500" />
              <span>Legenda - {vistaAtual === "lateral" ? "Vista Lateral" : "Vista Superior"}</span>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2.5 text-muted-foreground hover:text-foreground transition-colors">
                <div className="w-2 h-2 rounded-full bg-orange-500 shadow-sm"></div>
                <span className="text-[11px]">Ponto calculado</span>
              </div>
              <div className="flex items-center gap-2.5 text-muted-foreground hover:text-foreground transition-colors">
                <div className="w-2 h-2 rounded-full bg-muted-foreground/50 border border-border"></div>
                <span className="text-[11px]">Ponto não calculado</span>
              </div>
              <div className="flex items-center gap-2.5 text-muted-foreground hover:text-foreground transition-colors">
                <div className="w-4 h-4 rounded-sm border-2 border-orange-500"></div>
                <span className="text-[11px]">{vistaAtual === "lateral" ? "Carga (vista lateral)" : "Sapata (planta)"}</span>
              </div>
              <div className="flex items-center gap-2.5 text-muted-foreground hover:text-foreground transition-colors text-[10px] mt-1 pt-1 border-t">
                {vistaAtual === "lateral" ? "X (horizontal) × Z (profundidade)" : "X (horizontal) × Y (transversal)"}
              </div>
              <div className="text-[10px] mt-2 pt-2 border-t space-y-1">
                <p className="font-semibold text-foreground mb-1">🔍 Navegação:</p>
                <p className="text-muted-foreground">• <strong>Shift + Roda</strong> = Zoom</p>
                <p className="text-muted-foreground">• <strong>Arrastar</strong> = Mover</p>
                <p className="text-muted-foreground">• <strong>Botões</strong> no canto ↗</p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

