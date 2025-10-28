import { useRef, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Target, Plus, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { PontoAnalise } from "./PainelResultados";

interface CanvasBoussinesqMobileProps {
  pontos: PontoAnalise[];
  cargaP?: number;
  onEditCarga: () => void;
  onToquePonto: (ponto: PontoAnalise) => void;
  onToqueGrid: (x: number, z: number) => void;
  calculoFeito?: boolean;
  decimalPlaces?: number;
}

export default function CanvasBoussinesqMobile({
  pontos,
  cargaP,
  onEditCarga,
  onToquePonto,
  onToqueGrid,
  calculoFeito = false,
  decimalPlaces = 3
}: CanvasBoussinesqMobileProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredPoint, setHoveredPoint] = useState<string | null>(null);
  
  // Constantes de renderização - ajustadas para mobile
  const PIXELS_POR_METRO = 30; // Menor que desktop para caber na tela
  const TAMANHO_PONTO = 12; // Maior para facilitar toque
  const GRID_SNAP_METROS = 0.5;
  
  // Dimensões do container
  const [origem, setOrigem] = useState({ x: 0, y: 60 });
  const [dimensoes, setDimensoes] = useState({ width: 0, height: 400 });
  
  useEffect(() => {
    const atualizarDimensoes = () => {
      if (containerRef.current) {
        const bbox = containerRef.current.getBoundingClientRect();
        setOrigem({ x: bbox.width / 2, y: 60 });
        setDimensoes({ width: bbox.width, height: 400 });
      }
    };
    
    atualizarDimensoes();
    window.addEventListener('resize', atualizarDimensoes);
    
    return () => window.removeEventListener('resize', atualizarDimensoes);
  }, []);
  
  // Renderiza o grid simplificado
  const renderizarGrid = () => {
    const linhas = [];
    const metrosHorizontal = Math.ceil((dimensoes.width / 2) / PIXELS_POR_METRO);
    const metrosVertical = Math.ceil((dimensoes.height - origem.y) / PIXELS_POR_METRO);
    
    // Linhas Verticais (Eixo X) - apenas linha central
    linhas.push(
      <line
        key="v-central"
        x1={0}
        y1={0}
        x2={0}
        y2={metrosVertical * PIXELS_POR_METRO}
        stroke="hsl(var(--primary))"
        strokeWidth={2}
        opacity={0.3}
      />
    );
    
    // Linhas verticais secundárias a cada metro
    for (let x = -metrosHorizontal; x <= metrosHorizontal; x++) {
      if (x !== 0) {
        linhas.push(
          <line
            key={`v-${x}`}
            x1={x * PIXELS_POR_METRO}
            y1={0}
            x2={x * PIXELS_POR_METRO}
            y2={metrosVertical * PIXELS_POR_METRO}
            stroke="hsl(var(--border))"
            strokeWidth={0.5}
            opacity={0.3}
          />
        );
      }
    }
    
    // Linhas Horizontais (Eixo Z)
    for (let z = 1; z <= metrosVertical; z++) {
      linhas.push(
        <line
          key={`h-${z}`}
          x1={-dimensoes.width / 2}
          y1={z * PIXELS_POR_METRO}
          x2={dimensoes.width / 2}
          y2={z * PIXELS_POR_METRO}
          stroke="hsl(var(--border))"
          strokeWidth={z % 2 === 0 ? 1 : 0.5}
          opacity={z % 2 === 0 ? 0.4 : 0.2}
        />
      );
      
      // Etiqueta de profundidade a cada 2m
      if (z % 2 === 0) {
        linhas.push(
          <g key={`label-group-${z}`}>
            <rect
              x={-origem.x + 5}
              y={z * PIXELS_POR_METRO - 9}
              width={32}
              height={18}
              fill="hsl(var(--card))"
              stroke="hsl(var(--border))"
              strokeWidth="1"
              rx={4}
            />
            <text
              key={`label-${z}`}
              x={-origem.x + 21}
              y={z * PIXELS_POR_METRO + 4}
              fontSize="12"
              fontWeight="700"
              fill="hsl(var(--primary))"
              textAnchor="middle"
            >
              {z}m
            </text>
          </g>
        );
      }
    }
    
    return linhas;
  };
  
  // Conversão de coordenadas para touch
  const converterToqueParaSVG = (touch: React.Touch) => {
    if (!svgRef.current) return { x: 0, y: 0 };
    
    const pt = svgRef.current.createSVGPoint();
    pt.x = touch.clientX;
    pt.y = touch.clientY;
    
    const svgMundo = document.getElementById('svg-mundo-boussinesq-mobile') as any;
    if (!svgMundo) return { x: 0, y: 0 };
    
    const ctm = svgMundo.getScreenCTM();
    if (!ctm) return { x: 0, y: 0 };
    
    const transformedPt = pt.matrixTransform(ctm.inverse());
    return { x: transformedPt.x, y: transformedPt.y };
  };
  
  const converterSVGParaMetros = (svgX: number, svgY: number) => {
    // Snap para grid
    const xMetros = Math.round(svgX / PIXELS_POR_METRO / GRID_SNAP_METROS) * GRID_SNAP_METROS;
    const zMetros = Math.round(svgY / PIXELS_POR_METRO / GRID_SNAP_METROS) * GRID_SNAP_METROS;
    
    // Limitar profundidade mínima
    return {
      x: xMetros,
      z: Math.max(0.5, zMetros)
    };
  };
  
  // Handler de toque no grid (para adicionar ponto)
  const handleToqueGrid = (e: React.TouchEvent) => {
    if (e.touches.length !== 1) return;
    
    const touch = e.touches[0];
    const svgPt = converterToqueParaSVG(touch);
    const metros = converterSVGParaMetros(svgPt.x, svgPt.y);
    
    // Verificar se não clicou em um ponto existente
    const distanciaMinima = 20; // pixels
    const clicouEmPonto = pontos.some(p => {
      const pontoX = p.x * PIXELS_POR_METRO;
      const pontoZ = p.z * PIXELS_POR_METRO;
      const dist = Math.sqrt(Math.pow(svgPt.x - pontoX, 2) + Math.pow(svgPt.y - pontoZ, 2));
      return dist < distanciaMinima;
    });
    
    if (!clicouEmPonto && metros.z > 0) {
      onToqueGrid(metros.x, metros.z);
    }
  };
  
  // Renderiza a carga pontual
  const renderizarCarga = () => {
    const cargaX = 0;
    const cargaY = -15;
    const setaAltura = 30;
    
    return (
      <g
        onClick={onEditCarga}
        style={{ cursor: 'pointer' }}
        className="touch-manipulation"
      >
        {/* Seta da carga */}
        <defs>
          <marker
            id="arrowhead-mobile"
            markerWidth="10"
            markerHeight="10"
            refX="5"
            refY="5"
            orient="auto"
          >
            <polygon
              points="0 0, 10 5, 0 10"
              fill="#3b82f6"
            />
          </marker>
        </defs>
        
        <line
          x1={cargaX}
          y1={cargaY - setaAltura}
          x2={cargaX}
          y2={cargaY}
          stroke="#3b82f6"
          strokeWidth={4}
          markerEnd="url(#arrowhead-mobile)"
        />
        
        {/* Label da carga */}
        <g>
          <rect
            x={cargaX - 35}
            y={cargaY - setaAltura - 30}
            width={70}
            height={24}
            fill="#3b82f6"
            rx={6}
            filter="drop-shadow(0 2px 4px rgba(0,0,0,0.2))"
          />
          <text
            x={cargaX}
            y={cargaY - setaAltura - 12}
            fontSize="13"
            fontWeight="bold"
            fill="white"
            textAnchor="middle"
          >
            P = {cargaP?.toFixed(0) || '?'} kN
          </text>
        </g>
        
        {/* Círculo no ponto de aplicação */}
        <circle
          cx={cargaX}
          cy={0}
          r={6}
          fill="#3b82f6"
          stroke="white"
          strokeWidth={2}
        />
      </g>
    );
  };
  
  // Renderiza os pontos de análise
  const renderizarPontos = () => {
    return pontos.map(ponto => {
      const pontoX = ponto.x * PIXELS_POR_METRO;
      const pontoZ = ponto.z * PIXELS_POR_METRO;
      const isHovered = hoveredPoint === ponto.id;
      const temTensao = ponto.tensao !== undefined;
      
      return (
        <g
          key={ponto.id}
          onClick={() => onToquePonto(ponto)}
          onTouchStart={() => setHoveredPoint(ponto.id)}
          onTouchEnd={() => setHoveredPoint(null)}
          style={{ cursor: 'pointer' }}
          className="touch-manipulation"
        >
          {/* Círculo do ponto */}
          <circle
            cx={pontoX}
            cy={pontoZ}
            r={isHovered ? TAMANHO_PONTO + 2 : TAMANHO_PONTO}
            fill={temTensao && calculoFeito ? "#10b981" : "#6366f1"}
            stroke="white"
            strokeWidth={isHovered ? 3 : 2}
            opacity={isHovered ? 1 : 0.9}
            filter={isHovered ? "drop-shadow(0 0 8px rgba(99, 102, 241, 0.6))" : ""}
          />
          
          {/* Label do ponto */}
          <g>
            <rect
              x={pontoX - 40}
              y={pontoZ - TAMANHO_PONTO - 28}
              width={80}
              height={20}
              fill={temTensao && calculoFeito ? "#10b981" : "#6366f1"}
              rx={4}
              opacity={0.95}
            />
            <text
              x={pontoX}
              y={pontoZ - TAMANHO_PONTO - 13}
              fontSize="11"
              fontWeight="600"
              fill="white"
              textAnchor="middle"
            >
              {ponto.nome}
            </text>
          </g>
          
          {/* Coordenadas */}
          <g>
            <rect
              x={pontoX + TAMANHO_PONTO + 4}
              y={pontoZ - 10}
              width={65}
              height={20}
              fill="hsl(var(--card))"
              stroke="hsl(var(--border))"
              strokeWidth={1}
              rx={3}
              opacity={0.95}
            />
            <text
              x={pontoX + TAMANHO_PONTO + 36}
              y={pontoZ + 4}
              fontSize="10"
              fontWeight="600"
              fill="hsl(var(--foreground))"
              textAnchor="middle"
            >
              ({ponto.x.toFixed(1)}, {ponto.z.toFixed(1)})
            </text>
          </g>
          
          {/* Tensão se calculada */}
          {temTensao && ponto.tensao !== undefined && (
            <g>
              <rect
                x={pontoX - 45}
                y={pontoZ + TAMANHO_PONTO + 8}
                width={90}
                height={22}
                fill="#10b981"
                rx={4}
                opacity={0.95}
              />
              <text
                x={pontoX}
                y={pontoZ + TAMANHO_PONTO + 23}
                fontSize="11"
                fontWeight="700"
                fill="white"
                textAnchor="middle"
              >
                Δσz = {ponto.tensao.toFixed(decimalPlaces)} kPa
              </text>
            </g>
          )}
        </g>
      );
    });
  };
  
  return (
    <Card className="border-2 shadow-lg" data-tour="canvas-2d-mobile">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-primary" />
            <CardTitle className="text-base">Canvas 2D Interativo</CardTitle>
          </div>
          <Badge variant="secondary" className="text-xs">
            {pontos.length} {pontos.length === 1 ? 'ponto' : 'pontos'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-2">
        {/* Instruções */}
        <div className="mb-2 p-2 bg-primary/5 rounded-lg border border-primary/20">
          <div className="flex items-start gap-2">
            <Info className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
            <div className="text-xs text-muted-foreground space-y-0.5">
              <p className="font-medium text-foreground">Como usar:</p>
              <p>• Toque na seta azul para editar a carga P</p>
              <p>• Toque em pontos (círculos) para editar</p>
              <p>• Toque no grid vazio para adicionar ponto</p>
            </div>
          </div>
        </div>
        
        {/* Canvas SVG */}
        <div
          ref={containerRef}
          className="w-full bg-gradient-to-b from-background via-muted/30 to-muted/50 rounded-lg border-2 border-border overflow-hidden touch-none"
          style={{ height: '400px' }}
        >
          <svg
            ref={svgRef}
            className="w-full h-full select-none"
            style={{ touchAction: 'none' }}
            onTouchStart={handleToqueGrid}
          >
            <g id="svg-mundo-boussinesq-mobile" transform={`translate(${origem.x}, ${origem.y})`}>
              {/* Grid de fundo */}
              {renderizarGrid()}
              
              {/* Superfície do solo */}
              <line
                x1={-dimensoes.width / 2}
                y1={0}
                x2={dimensoes.width / 2}
                y2={0}
                stroke="hsl(var(--primary))"
                strokeWidth={3}
                strokeDasharray="8,4"
              />
              
              {/* Label da superfície */}
              <g>
                <rect
                  x={-60}
                  y={-25}
                  width={120}
                  height={18}
                  fill="hsl(var(--primary))"
                  rx={4}
                  opacity={0.9}
                />
                <text
                  x={0}
                  y={-11}
                  fontSize="12"
                  fontWeight="700"
                  fill="white"
                  textAnchor="middle"
                >
                  SUPERFÍCIE (Z = 0)
                </text>
              </g>
              
              {/* Carga Pontual */}
              {renderizarCarga()}
              
              {/* Pontos de análise */}
              {renderizarPontos()}
              
              {/* Eixos e labels */}
              <g>
                {/* Label Eixo X */}
                <text
                  x={dimensoes.width / 2 - 30}
                  y={-5}
                  fontSize="11"
                  fontWeight="600"
                  fill="hsl(var(--muted-foreground))"
                  textAnchor="end"
                >
                  X (horizontal)
                </text>
                
                {/* Label Eixo Z */}
                <text
                  x={5}
                  y={(dimensoes.height - origem.y) - 10}
                  fontSize="11"
                  fontWeight="600"
                  fill="hsl(var(--muted-foreground))"
                  textAnchor="start"
                >
                  Z (profundidade)
                </text>
              </g>
            </g>
          </svg>
        </div>
        
        {/* Legenda */}
        <div className="mt-2 flex items-center justify-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            <span>Carga P</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-indigo-500"></div>
            <span>Ponto sem cálculo</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span>Calculado</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

