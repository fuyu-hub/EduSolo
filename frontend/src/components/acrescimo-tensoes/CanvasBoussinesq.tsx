import { useRef, useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Layers, Info, GripVertical } from "lucide-react";
import { PontoAnalise } from "./PainelResultados";

interface CanvasBoussinesqProps {
  pontos: PontoAnalise[];
  cargaP?: number;
  onDuploCliqueCarga: () => void;
  onDuploCliqueGrid: (x: number, z: number) => void;
  onDuploCliquePonto: (ponto: PontoAnalise) => void;
  onMovimentarPonto: (id: string, x: number, z: number) => void;
  onPontoSolto?: (id: string) => void;
  calculoFeito?: boolean;
  decimalPlaces?: number;
}

export default function CanvasBoussinesq({
  pontos,
  cargaP,
  onDuploCliqueCarga,
  onDuploCliqueGrid,
  onDuploCliquePonto,
  onMovimentarPonto,
  onPontoSolto,
  calculoFeito = false,
  decimalPlaces = 3
}: CanvasBoussinesqProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [draggedPoint, setDraggedPoint] = useState<string | null>(null);
  const [offsetArraste, setOffsetArraste] = useState({ x: 0, y: 0 });
  const [hoveredPoint, setHoveredPoint] = useState<string | null>(null);
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
        setOrigem({ x: bbox.width / 2, y: 100 });
      }
    };
    
    atualizarOrigem();
    window.addEventListener('resize', atualizarOrigem);
    
    return () => window.removeEventListener('resize', atualizarOrigem);
  }, []);
  
  // Renderiza o grid
  const renderizarGrid = () => {
    const linhas = [];
    const largura = containerRef.current?.getBoundingClientRect().width || 800;
    const altura = containerRef.current?.getBoundingClientRect().height || 600;
    
    const metrosHorizontal = Math.ceil((largura / 2) / PIXELS_POR_METRO);
    const metrosVertical = Math.ceil((altura - origem.y) / PIXELS_POR_METRO);
    
      // Linhas Verticais (Eixo X) - 1m em 1m
      for (let x = -metrosHorizontal; x <= metrosHorizontal; x++) {
        linhas.push(
          <line
            key={`v-${x}`}
            x1={x * PIXELS_POR_METRO}
            y1={0}
            x2={x * PIXELS_POR_METRO}
            y2={metrosVertical * PIXELS_POR_METRO}
            stroke="rgba(255,255,255,0.15)"
            strokeWidth={0.8}
          />
        );
      }
      
      // Linhas Horizontais (Eixo Z) - 1m em 1m
      for (let z = 1; z <= metrosVertical; z++) {
        linhas.push(
          <line
            key={`h-${z}`}
            x1={-largura / 2}
            y1={z * PIXELS_POR_METRO}
            x2={largura / 2}
            y2={z * PIXELS_POR_METRO}
            stroke="rgba(255,255,255,0.2)"
            strokeWidth={1}
          />
        );
        
        // Etiqueta de profundidade
        if (true) {
          linhas.push(
            <g key={`label-group-${z}`}>
              <rect
                x={-origem.x + 5}
                y={z * PIXELS_POR_METRO - 8}
                width={35}
                height={16}
                fill="hsl(var(--popover))"
                stroke="hsl(var(--border))"
                strokeWidth="0.5"
                rx={3}
              />
              <text
                key={`label-${z}`}
                x={-origem.x + 12}
                y={z * PIXELS_POR_METRO + 4}
                fontSize="11"
                fontWeight="600"
                fill="hsl(var(--popover-foreground))"
                textAnchor="start"
              >
                {z}m
              </text>
            </g>
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
    
    const svgMundo = document.getElementById('svg-mundo-boussinesq') as any;
    if (!svgMundo) return { x: 0, y: 0 };
    
    const ctm = svgMundo.getScreenCTM();
    if (!ctm) return { x: 0, y: 0 };
    
    const transformedPt = pt.matrixTransform(ctm.inverse());
    return { x: transformedPt.x, y: transformedPt.y };
  };
  
  const converterSVGParaMetros = (svgX: number, svgY: number) => {
    return {
      x: svgX / PIXELS_POR_METRO,
      z: svgY / PIXELS_POR_METRO
    };
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
    setOffsetArraste({
      x: svgPt.x - (ponto.x * PIXELS_POR_METRO),
      y: svgPt.y - (ponto.z * PIXELS_POR_METRO)
    });
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
    
    // Snap ao grid
    const snapPixels = PIXELS_POR_METRO * GRID_SNAP_METROS;
    novoSvgX = Math.round(novoSvgX / snapPixels) * snapPixels;
    novoSvgY = Math.round(novoSvgY / snapPixels) * snapPixels;
    
    if (novoSvgY < 0) novoSvgY = 0;
    
    const { x, z } = converterSVGParaMetros(novoSvgX, novoSvgY);
    
    onMovimentarPonto(draggedPoint, x, z);
    
    if (!selectedPoints.includes(draggedPoint)) {
      const pontoAtualizado = { ...ponto, x, z };
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
  
  // Tooltip - Calcula posição
  const calcularPosicaoTooltip = useCallback((ponto: PontoAnalise) => {
    if (!containerRef.current) return { x: 0, y: 0 };
    
    const pontoX = origem.x + (ponto.x * PIXELS_POR_METRO);
    const pontoY = origem.y + (ponto.z * PIXELS_POR_METRO);
    
    return {
      x: pontoX + 15,
      y: pontoY + 15
    };
  }, [origem.x, origem.y]);
  
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
  
  // Limpa pontos fixados removidos
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
  
  // Handler de clique na carga
  const handleCliqueCanvas = (e: React.MouseEvent) => {
    const target = e.target as SVGElement;
    
    if (target.id === 'carga-p-hitbox' || target.closest('#carga-p')) {
      onDuploCliqueCarga();
      return;
    }
  };
  
  // Handler de duplo clique no canvas
  const handleDuploCliqueCanvas = (e: React.MouseEvent) => {
    const target = e.target as SVGElement;
    
    if (target.id === 'carga-p-hitbox' || target.closest('#carga-p')) {
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
    const { x, z } = converterSVGParaMetros(svgPt.x, svgPt.y);
    
    // Só permite adicionar pontos abaixo da superfície (z > 0)
    if (z > 0) {
      const xSnapped = Math.round(x / GRID_SNAP_METROS) * GRID_SNAP_METROS;
      // Z mínimo é 0.5m (força para grid mínimo se clicar muito perto da superfície)
      const zSnapped = z <= GRID_SNAP_METROS ? GRID_SNAP_METROS : Math.round(z / GRID_SNAP_METROS) * GRID_SNAP_METROS;
      onDuploCliqueGrid(xSnapped, zSnapped);
    }
  };
  
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center shadow-lg">
              <Layers className="w-5 h-5 text-white" />
            </div>
            Perfil do Solo - Boussinesq (Carga Pontual)
          </CardTitle>
        </div>
        <div className="mt-3 flex items-start gap-2 text-xs bg-muted/50 p-3 rounded-lg border">
          <Info className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
          <div className="space-y-1">
            <p className="text-muted-foreground">
              <strong className="text-foreground">Clique na carga P</strong> para configurar • 
              <strong className="text-foreground"> Duplo clique no solo</strong> para adicionar pontos • 
              <strong className="text-foreground"> Arraste pontos</strong> para reposicionar
            </p>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-0 h-full">
        <div ref={containerRef} className="relative w-full h-[600px] bg-muted/30 overflow-hidden">
          <svg
            ref={svgRef}
            width="100%"
            height="100%"
            preserveAspectRatio="xMidYMid meet"
            onClick={handleCliqueCanvas}
            onDoubleClick={handleDuploCliqueCanvas}
            onMouseMove={duranteArraste}
            onMouseUp={terminarArraste}
            onMouseLeave={terminarArraste}
            className="cursor-crosshair"
          >
            <defs>
              <linearGradient id="solo-gradiente" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="hsl(var(--muted))" />
                <stop offset="100%" stopColor="hsl(var(--muted))" stopOpacity="0.7" />
              </linearGradient>
              
              <pattern id="solo-textura" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                <circle cx="3" cy="3" r="0.8" fill="rgba(0,0,0,0.05)" />
                <circle cx="15" cy="8" r="0.6" fill="rgba(0,0,0,0.04)" />
                <circle cx="8" cy="15" r="0.7" fill="rgba(0,0,0,0.045)" />
                <circle cx="18" cy="18" r="0.5" fill="rgba(0,0,0,0.035)" />
              </pattern>
              
              <pattern id="superficie-pattern" x="0" y="0" width="40" height="4" patternUnits="userSpaceOnUse">
                <rect width="40" height="4" fill="hsl(var(--border))" />
              </pattern>
            </defs>
            
            <g id="svg-mundo-boussinesq" transform={`translate(${origem.x}, ${origem.y})`}>
              {/* Solo */}
              <rect
                x={-origem.x}
                y={0}
                width={origem.x * 2}
                height={1000}
                fill="url(#solo-gradiente)"
              />
              
              <rect
                x={-origem.x}
                y={0}
                width={origem.x * 2}
                height={1000}
                fill="url(#solo-textura)"
                opacity={0.6}
              />
              
              {/* Superfície */}
              <rect
                x={-origem.x}
                y={-4}
                width={origem.x * 2}
                height={4}
                fill="url(#superficie-pattern)"
              />
              
              {/* Grid */}
              <g id="svg-grid">{renderizarGrid()}</g>
              
              {/* Linha do terreno */}
              <line
                id="linha-nt"
                stroke="hsl(var(--border))"
                strokeWidth="2"
                x1="-10000"
                y1="0"
                x2="10000"
                y2="0"
              />
              
              {/* Carga P */}
              <g id="carga-p" transform="translate(0, 0)">
                <path
                  id="carga-p-seta"
                  d="M 0 -55 L 0 0 M -12 -12 L 0 0 L 12 -12"
                  stroke="hsl(var(--primary))"
                  strokeWidth="5"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                
                {cargaP !== undefined && (
                  <g transform="translate(20, -25)">
                    <rect
                      x="0"
                      y="-12"
                      width={cargaP.toFixed(1).length * 10 + 50}
                      height="24"
                      fill="hsl(var(--popover))"
                      stroke="hsl(var(--border))"
                      strokeWidth="1"
                      rx="4"
                    />
                    <text 
                      x="8" 
                      y="5" 
                      fontSize="16" 
                      fontWeight="bold" 
                      fill="hsl(var(--primary))"
                    >
                      P =
                    </text>
                    <text 
                      x="38" 
                      y="5" 
                      fontSize="15" 
                      fontWeight="600" 
                      fill="hsl(var(--popover-foreground))"
                    >
                      {cargaP.toFixed(1)} kN
                    </text>
                  </g>
                )}
                
                <rect
                  id="carga-p-hitbox"
                  x="-15"
                  y="-60"
                  width={cargaP !== undefined ? cargaP.toFixed(1).length * 10 + 70 : 30}
                  height="65"
                  fill="transparent"
                  className="cursor-pointer hover:fill-primary/10"
                />
              </g>
              
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
                  pontos.map(ponto => (
                    <g
                      key={ponto.id}
                      data-ponto-id={ponto.id}
                      transform={`translate(${ponto.x * PIXELS_POR_METRO}, ${ponto.z * PIXELS_POR_METRO})`}
                      onMouseEnter={() => !draggedPoint && mostrarTooltipHover(ponto)}
                      onMouseLeave={() => !draggedPoint && esconderTooltipHover()}
                      className="cursor-grab active:cursor-grabbing"
                    >
                      {/* Linha tracejada conectando à carga */}
                      <line
                        x1={0}
                        y1={0}
                        x2={-(ponto.x * PIXELS_POR_METRO)}
                        y2={-(ponto.z * PIXELS_POR_METRO)}
                        stroke="hsl(var(--primary))"
                        strokeWidth="2.5"
                        strokeDasharray="5 5"
                        opacity={0.5}
                        pointerEvents="none"
                      />
                      
                      {/* Círculo do ponto */}
                      <circle
                        cx={0}
                        cy={0}
                        r={TAMANHO_PONTO}
                        fill={ponto.tensao !== undefined ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))"}
                        stroke={ponto.tensao !== undefined ? "hsl(var(--primary))" : "hsl(var(--border))"}
                        strokeWidth="2.5"
                        className="transition-all hover:drop-shadow-[0_0_10px_rgba(0,0,0,0.4)]"
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
                      
                      {/* Nome do ponto */}
                      <rect
                        x={TAMANHO_PONTO + 2}
                        y={-8}
                        width={ponto.nome.length * 7 + 6}
                        height={16}
                        fill="hsl(var(--popover))"
                        stroke="hsl(var(--border))"
                        strokeWidth="0.5"
                        rx={3}
                        className="cursor-grab active:cursor-grabbing"
                        onMouseDown={(e) => iniciarArraste(e, ponto.id)}
                      />
                      
                      <text
                        x={TAMANHO_PONTO + 5}
                        y={3}
                        fontSize="11"
                        fontWeight="600"
                        fill="hsl(var(--popover-foreground))"
                        className="cursor-grab active:cursor-grabbing"
                        onMouseDown={(e) => iniciarArraste(e, ponto.id)}
                      >
                        {ponto.nome}
                      </text>
                    </g>
                  ))
                )}
              </g>
            </g>
          </svg>
          
          {/* Tooltips Fixos */}
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
                className="absolute z-50 bg-gradient-to-br from-card to-card/95 backdrop-blur-md text-card-foreground rounded-xl shadow-2xl border-2 border-primary scale-105"
                style={{
                  left: `${fixedPos.x + offset.x}px`,
                  top: `${fixedPos.y + offset.y}px`,
                  cursor: draggingTooltip === pontoId ? 'grabbing' : 'grab',
                  userSelect: 'none',
                  transition: draggingTooltip === pontoId ? 'none' : 'all 0.3s ease-out'
                }}
                onMouseDown={(e) => handleTooltipMouseDown(e, pontoId)}
              >
                <div 
                  className="absolute -top-2 -right-2 w-4 h-4 bg-primary rounded-full border-2 border-background shadow-lg animate-pulse"
                  title="Clique para desfixar"
                />
                
                <div className="absolute top-0 left-0 right-0 h-6 flex items-center justify-center rounded-t-xl hover:bg-primary/10 transition-colors cursor-grab active:cursor-grabbing">
                  <GripVertical className="w-4 h-4 text-muted-foreground/50" />
                </div>
                
                <div className="px-4 py-3 pt-6 min-w-[180px]">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-gradient-to-br from-primary to-primary/60 shadow-sm" />
                    <div className="font-bold text-base text-foreground">
                      {ponto.nome}
                    </div>
                  </div>
                  
                  <div className="space-y-1 text-xs mb-2">
                    <div className="flex items-center justify-between gap-3 bg-muted/30 px-2 py-1 rounded">
                      <span className="font-semibold text-muted-foreground">X:</span>
                      <span className="font-mono font-medium text-foreground">
                        {ponto.x >= 0 ? '+' : ''}{ponto.x.toFixed(2)} m
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-3 bg-muted/30 px-2 py-1 rounded">
                      <span className="font-semibold text-muted-foreground">Z:</span>
                      <span className="font-mono font-medium text-foreground">
                        {ponto.z.toFixed(2)} m
                      </span>
                    </div>
                  </div>
                  
                  {ponto.tensao !== undefined ? (
                    <div className="mt-2 pt-2 border-t border-border/50">
                      <div className="bg-gradient-to-r from-primary/10 to-primary/5 px-2 py-1.5 rounded">
                        <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-0.5">
                          Acréscimo de Tensão
                        </div>
                        <div className="flex items-baseline gap-1">
                          <span className="text-sm font-bold text-primary">Δσz =</span>
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
          
          {/* Tooltip Hover */}
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
                  <div className="w-2.5 h-2.5 rounded-full bg-gradient-to-br from-primary to-primary/60 shadow-sm" />
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
                    <span className="font-semibold text-muted-foreground">Z:</span>
                    <span className="font-mono font-medium text-foreground">
                      {hoverTooltip.ponto.z.toFixed(2)} m
                    </span>
                  </div>
                </div>
                
                {hoverTooltip.ponto.tensao !== undefined ? (
                  <div className="mt-2 pt-2 border-t border-border/50">
                    <div className="bg-gradient-to-r from-primary/10 to-primary/5 px-2 py-1.5 rounded">
                      <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-0.5">
                        Acréscimo de Tensão
                      </div>
                      <div className="flex items-baseline gap-1">
                        <span className="text-sm font-bold text-primary">Δσz =</span>
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
          
          {/* Legenda */}
          <div className="absolute bottom-4 right-4 bg-card/95 backdrop-blur-md border shadow-xl rounded-lg p-3 text-xs max-w-[200px]">
            <div className="font-semibold mb-2 flex items-center gap-2 text-foreground">
              <Info className="w-3.5 h-3.5 text-primary" />
              <span>Legenda</span>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2.5 text-muted-foreground hover:text-foreground transition-colors">
                <div className="w-2 h-2 rounded-full bg-primary shadow-sm"></div>
                <span className="text-[11px]">Ponto calculado</span>
              </div>
              <div className="flex items-center gap-2.5 text-muted-foreground hover:text-foreground transition-colors">
                <div className="w-2 h-2 rounded-full bg-muted-foreground/50 border border-border"></div>
                <span className="text-[11px]">Ponto não calculado</span>
              </div>
              <div className="flex items-center gap-2.5 text-muted-foreground hover:text-foreground transition-colors">
                <div className="w-5 h-[2px]" style={{ backgroundImage: 'repeating-linear-gradient(90deg, hsl(var(--primary)) 0, hsl(var(--primary)) 3px, transparent 3px, transparent 6px)' }}></div>
                <span className="text-[11px]">Linha de influência</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

