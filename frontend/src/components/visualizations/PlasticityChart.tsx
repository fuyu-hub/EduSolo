// src/components/visualizations/PlasticityChart.tsx
import * as React from 'react';
import { useState, useRef, forwardRef, useImperativeHandle } from 'react';
import { createPortal } from 'react-dom';
import {
  ScatterChart,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Label as RechartsLabel,
  Customized
} from 'recharts';
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import html2canvas from 'html2canvas';

interface PlasticityChartProps {
  ll: number | null;
  ip: number | null;
}

export interface PlasticityChartRef {
  exportAsJPG: () => Promise<void>;
  getImageForExport: () => Promise<string | null>;
}

// Informações das zonas de classificação
const zoneInfo = {
  CL: {
    name: "Argila de Baixa Plasticidade",
    description: "Solo argiloso com baixa plasticidade. Características: coesão moderada, compressibilidade média.",
    color: "#00D9A3", // Verde turquesa
    properties: ["Coesão moderada", "Compressibilidade média", "Boa para fundações rasas"]
  },
  CH: {
    name: "Argila de Alta Plasticidade", 
    description: "Solo argiloso com alta plasticidade. Características: alta coesão, alta compressibilidade.",
    color: "#FFD700", // Amarelo dourado
    properties: ["Alta coesão", "Alta compressibilidade", "Requer cuidados especiais em fundações"]
  },
  ML: {
    name: "Silte de Baixa Plasticidade",
    description: "Solo siltoso com baixa plasticidade. Características: baixa coesão, comportamento intermediário.",
    color: "#FFB6C1", // Rosa claro
    properties: ["Baixa coesão", "Comportamento intermediário", "Sensível à água"]
  },
  MH: {
    name: "Silte de Alta Plasticidade",
    description: "Solo siltoso com alta plasticidade. Características: comportamento expansivo, alta sensibilidade à água.",
    color: "#87CEEB", // Azul claro
    properties: ["Comportamento expansivo", "Alta sensibilidade à água", "Requer drenagem adequada"]
  },
  "CL-ML": {
    name: "Zona de Transição CL-ML",
    description: "Zona de transição entre argila de baixa plasticidade e silte de baixa plasticidade.",
    color: "#8B7355", // Marrom claro
    properties: ["Características mistas", "Comportamento variável", "Análise detalhada necessária"]
  }
};

/**
 * CustomizedPolygonDrawer:
 * recebe acesso aos scales do gráfico via props (xAxis, yAxis) e desenha SVG poligonos
 * com base no domínio [0..xMax] e [0..yMax], seguindo a linha A (ip = 0.73*(ll-20)).
 */
const CustomizedPolygonDrawer = (props: any) => {
  const { width, height, xAxisMap, yAxisMap, xAxisProps, yAxisProps, xDomain, yDomain, onZoneClick, chartRef } = props;

  // se não tiver escala, não desenha
  if (!xAxisMap || !yAxisMap) return null;

  // helpers para converter coordenadas de dados (ll, ip) -> pixels dentro do gráfico
  const xScale = (val: number) => {
    const [dmin, dmax] = xDomain;
    const px = ((val - dmin) / (dmax - dmin)) * width;
    return px;
  };
  const yScale = (val: number) => {
    const [dmin, dmax] = yDomain;
    // note: área do gráfico tem origem no topo, então invert
    const py = height - ((val - dmin) / (dmax - dmin)) * height;
    return py;
  };

  // parâmetros e funções da Linha A
  const ipA = (llVal: number) => Math.max(0, 0.73 * (llVal - 20));

  const xMin = xDomain[0];
  const xMax = xDomain[1];
  const yMin = yDomain[0];
  const yMax = yDomain[1];

  // pontos para construir a curva (Linha A) discretizada
  const samples = 120;
  const aPoints: [number, number][] = [];
  for (let i = 0; i <= samples; i++) {
    const llVal = xMin + (i / samples) * (xMax - xMin);
    aPoints.push([llVal, ipA(llVal)]);
  }

  // Now build polygons for each region based on geometry in the reference image:
  // Regions:
  //  - CL (left-up): LL < 50 and IP >= Linha A
  //  - ML/OL (left-bottom): LL < 50 and IP < Linha A (and outside CL-ML band)
  //  - CL-ML (small band near IP 4..7 left side)
  //  - CH (right-up): LL >=50 and IP >= Linha A
  //  - MH/OH (right-bottom): LL >=50 and IP < Linha A

  // Calculate LL values where IP=4 and IP=7 intersect Line A
  const ll_ip4_onA = (4 / 0.73) + 20;
  const ll_ip7_onA = (7 / 0.73) + 20;

  // polygon for left-up (CL):
  // CL está ACIMA da Linha A, LL < 50, e ACIMA de IP=7
  const leftCL: { x: number; y: number }[] = [];
  // top-left corner
  leftCL.push({ x: xScale(xMin), y: yScale(yMax) });
  // top edge until LL=50
  leftCL.push({ x: xScale(Math.min(50, xMax)), y: yScale(yMax) });

  // Go back along Line A from LL=50 to ll_ip7_onA (onde IP=7 cruza a Linha A)
  const aPointsTo50 = aPoints.filter(p => p[0] <= 50 && p[0] >= ll_ip7_onA).reverse();
  aPointsTo50.forEach(([llv, ipv]) => {
    leftCL.push({ x: xScale(llv), y: yScale(Math.min(ipv, yMax)) });
  });

  // ao chegar em ll_ip7_onA, seguir horizontalmente até a borda esquerda em IP=7
  leftCL.push({ x: xScale(ll_ip7_onA), y: yScale(7) });
  leftCL.push({ x: xScale(xMin), y: yScale(7) });
  // fechar voltando ao topo
  leftCL.push({ x: xScale(xMin), y: yScale(yMax) });

  // polygon for left-bottom (ML/OL) - área abaixo da Linha A, LL < 50
  // Rosa é constante até IP=4, depois segue a Linha A
  const leftML: { x: number; y: number }[] = [];
  // bottom-left corner at IP=0
  leftML.push({ x: xScale(xMin), y: yScale(yMin) });
  // go right along bottom to LL=50
  leftML.push({ x: xScale(50), y: yScale(yMin) });
  // go up at LL=50 to Line A
  const ipA_50 = ipA(50);
  leftML.push({ x: xScale(50), y: yScale(Math.min(ipA_50, yMax)) });
  // go back along Line A from LL=50 to ll_ip4_onA (onde IP=4 cruza a Linha A)
  const aPointsFrom50To4 = aPoints.filter(p => p[0] >= ll_ip4_onA && p[0] <= 50).reverse();
  aPointsFrom50To4.forEach(([llv, ipv]) => {
    leftML.push({ x: xScale(llv), y: yScale(Math.min(ipv, yMax)) });
  });
  // ao chegar em ll_ip4_onA, seguir horizontalmente até a borda esquerda em IP=4
  leftML.push({ x: xScale(ll_ip4_onA), y: yScale(4) });
  leftML.push({ x: xScale(xMin), y: yScale(4) });
  // fechar voltando ao fundo
  leftML.push({ x: xScale(xMin), y: yScale(yMin) });

  // small CL-ML band between IP=4 and IP=7 under A (left side)
  // Build polygon that follows IP=7 line to intersection with A, then along A down to intersection with IP=4, then back along IP=4 to left edge.
  const clmlPoly: { x: number; y: number }[] = [];
  // leftmost edge at IP=7
  clmlPoly.push({ x: xScale(xMin), y: yScale(7) });
  // go right along IP=7 until min(ll_ip7_onA,50)
  clmlPoly.push({ x: xScale(Math.min(ll_ip7_onA, Math.min(50, xMax))), y: yScale(7) });
  // then along LineA backward from ll_ip7_onA down to ll_ip4_onA
  const aBetween = aPoints.filter(p => p[0] >= ll_ip4_onA && p[0] <= ll_ip7_onA).reverse();
  aBetween.forEach(([llv, ipv]) => clmlPoly.push({ x: xScale(llv), y: yScale(Math.min(ipv, yMax)) }));
  // then to IP=4 line back to left
  clmlPoly.push({ x: xScale(Math.min(ll_ip4_onA, Math.min(50, xMax))), y: yScale(4) });
  clmlPoly.push({ x: xScale(xMin), y: yScale(4) });

  // right-top (CH): area right of LL=50 above LineA
  const rightCH: { x: number; y: number }[] = [];
  // top-right
  rightCH.push({ x: xScale(Math.max(50, xMin)), y: yScale(yMax) });
  rightCH.push({ x: xScale(xMax), y: yScale(yMax) });
  // along right edge down to bottom of Chart
  rightCH.push({ x: xScale(xMax), y: yScale(Math.max(yMin, 0)) });
  // then along bottom to LL=50
  rightCH.push({ x: xScale(Math.max(50, xMin)), y: yScale(Math.max(yMin, 0)) });
  // then up along LineA from LL=50 to top (clamped)
  const aPointsFrom50 = aPoints.filter(p => p[0] >= 50);
  aPointsFrom50.forEach(([llv, ipv]) => {
    // we want area above line => polygon goes from LL=xMax at top down to line; easier: build polygon that goes from top-right then along top to LL=50, then along line A up to top, then close.
  });
  // Simpler for rightCH: draw rectangle LL=50..xMax and IP=ipA(LL) .. yMax
  // We'll construct polygon by sampling LineA between 50 and xMax, then closing at top.
  const rightCHpoly: { x: number; y: number }[] = [];
  // top from LL=50 to LL=xMax
  rightCHpoly.push({ x: xScale(50), y: yScale(yMax) });
  rightCHpoly.push({ x: xScale(xMax), y: yScale(yMax) });
  // down along right edge to ip at lineA at xMax
  rightCHpoly.push({ x: xScale(xMax), y: yScale(Math.min(ipA(xMax), yMax)) });
  // along line A from xMax back to 50
  const a50toMax = aPoints.filter(p => p[0] >= 50);
  // append reversed to go from xMax down to 50
  a50toMax.forEach(([llv, ipv]) => {
    rightCHpoly.push({ x: xScale(llv), y: yScale(Math.min(ipv, yMax)) });
  });
  // finally close at (50, ipA(50))
  rightCHpoly.push({ x: xScale(50), y: yScale(Math.min(ipA(50), yMax)) });

  // right-bottom (MH/OH): LL >=50 and IP < LineA
  // polygon covering LL=50..xMax and IP=0..ipA(LL)
  const rightBottomPoly: { x: number; y: number }[] = [];
  // bottom-right corner
  rightBottomPoly.push({ x: xScale(50), y: yScale(yMin) });
  rightBottomPoly.push({ x: xScale(xMax), y: yScale(yMin) });
  // up along right edge to ip at lineA
  rightBottomPoly.push({ x: xScale(xMax), y: yScale(Math.min(ipA(xMax), yMax)) });
  // along LineA from xMax back to 50
  a50toMax.forEach(([llv, ipv]) => {
    rightBottomPoly.push({ x: xScale(llv), y: yScale(Math.min(ipv, yMax)) });
  });
  // close at (50, ipA(50))
  rightBottomPoly.push({ x: xScale(50), y: yScale(Math.min(ipA(50), yMax)) });

  // build svg path from polygon points
  const polyToPath = (poly: { x: number; y: number }[]) => {
    if (!poly || poly.length === 0) return '';
    const d = poly.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(' ');
    return d + ' Z';
  };

  // cores conforme carta de plasticidade padrão
  const colors = {
    cl: '#00D9A3', // Verde turquesa (argila de baixa plasticidade)
    ch: '#FFD700', // Amarelo dourado (argila de alta plasticidade)
    ml_ol: '#FFB6C1', // Rosa claro (silte de baixa plasticidade)
    mh_oh: '#87CEEB', // Azul claro (silte de alta plasticidade)
    cl_ml: '#8B7355' // Marrom claro (zona de transição)
  };

  // Escala global para o gráfico (ajuste este valor para redimensionar tudo)
  const chartScale = 0.85; // Valor entre 0.5 e 2.0 (1.0 = tamanho normal)
  
  // Centralizar o grupo escalado e mover para a direita
  const translateX = width * (1 - chartScale) / 2 + 25; // +25px para a direita
  const translateY = height * (1 - chartScale) / 2 - 10; // +10px para cima

  return (
    <>
    <g transform={`translate(${translateX}, ${translateY}) scale(${chartScale})`}>
      {/* Renderizar zonas na ordem de prioridade: verde → marrom → rosa */}
      
      {/* 1. CL (verde turquesa - acima da Linha A, esquerda) - BASE */}
      <path 
        d={polyToPath(leftCL)} 
        fill={colors.cl} 
        fillOpacity={0.85} 
        stroke="none" 
        style={{ cursor: 'pointer' }}
        onClick={(e) => onZoneClick && onZoneClick('CL', e)}
        onMouseEnter={(e) => {
          e.currentTarget.style.fillOpacity = '0.7';
          e.currentTarget.style.stroke = '#000';
          e.currentTarget.style.strokeWidth = '2';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.fillOpacity = '0.85';
          e.currentTarget.style.stroke = 'none';
        }}
      />
      
      {/* 2. CL-ML (marrom - faixa pequena entre IP=4 e IP=7) - POR CIMA DO VERDE */}
      <path 
        d={polyToPath(clmlPoly)} 
        fill={colors.cl_ml} 
        fillOpacity={0.85} 
        stroke="none" 
        style={{ cursor: 'pointer' }}
        onClick={(e) => onZoneClick && onZoneClick('CL-ML', e)}
        onMouseEnter={(e) => {
          e.currentTarget.style.fillOpacity = '0.7';
          e.currentTarget.style.stroke = '#000';
          e.currentTarget.style.strokeWidth = '2';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.fillOpacity = '0.85';
          e.currentTarget.style.stroke = 'none';
        }}
      />
      
      {/* 3. ML/OL (rosa - toda área abaixo da Linha A, LL < 50) - POR CIMA DE TUDO */}
      <path 
        d={polyToPath(leftML)} 
        fill={colors.ml_ol} 
        fillOpacity={0.85} 
        stroke="none" 
        style={{ cursor: 'pointer' }}
        onClick={(e) => onZoneClick && onZoneClick('ML', e)}
        onMouseEnter={(e) => {
          e.currentTarget.style.fillOpacity = '0.7';
          e.currentTarget.style.stroke = '#000';
          e.currentTarget.style.strokeWidth = '2';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.fillOpacity = '0.85';
          e.currentTarget.style.stroke = 'none';
        }}
      />
      
      {/* 4. MH/OH (azul claro - abaixo da Linha A, direita) */}
      <path 
        d={polyToPath(rightBottomPoly)} 
        fill={colors.mh_oh} 
        fillOpacity={0.85} 
        stroke="none" 
        style={{ cursor: 'pointer' }}
        onClick={(e) => onZoneClick && onZoneClick('MH', e)}
        onMouseEnter={(e) => {
          e.currentTarget.style.fillOpacity = '0.7';
          e.currentTarget.style.stroke = '#000';
          e.currentTarget.style.strokeWidth = '2';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.fillOpacity = '0.85';
          e.currentTarget.style.stroke = 'none';
        }}
      />
      
      {/* 5. CH (amarelo - acima da Linha A, direita) */}
      <path 
        d={polyToPath(rightCHpoly)} 
        fill={colors.ch} 
        fillOpacity={0.85} 
        stroke="none" 
        style={{ cursor: 'pointer' }}
        onClick={(e) => onZoneClick && onZoneClick('CH', e)}
        onMouseEnter={(e) => {
          e.currentTarget.style.fillOpacity = '0.7';
          e.currentTarget.style.stroke = '#000';
          e.currentTarget.style.strokeWidth = '2';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.fillOpacity = '0.85';
          e.currentTarget.style.stroke = 'none';
        }}
      />
      
      {/* Grid - linhas por cima dos polígonos */}
      <g opacity={0.6}>
        {/* Linhas verticais a cada 10 unidades de LL */}
        {Array.from({ length: Math.floor(xMax / 10) + 1 }, (_, i) => i * 10).map(llVal => (
          <line
            key={`v-${llVal}`}
            x1={xScale(llVal)}
            y1={yScale(yMin)}
            x2={xScale(llVal)}
            y2={yScale(yMax)}
            stroke="#000"
            strokeWidth={0.8}
          />
        ))}
        
        {/* Linhas horizontais a cada 10 unidades de IP */}
        {Array.from({ length: Math.floor(yMax / 10) + 1 }, (_, i) => i * 10).map(ipVal => (
          <line
            key={`h-${ipVal}`}
            x1={xScale(xMin)}
            y1={yScale(ipVal)}
            x2={xScale(xMax)}
            y2={yScale(ipVal)}
            stroke="#000"
            strokeWidth={0.8}
          />
        ))}
      </g>
      
      {/* Números do grid */}
      <g opacity={1.0}>
        {/* Números no lado esquerdo (eixo Y/IP) - de 10 em 10 */}
        {Array.from({ length: 7 }, (_, i) => i * 10).map(ipVal => (
          <text
            key={`grid-y-${ipVal}`}
            x={xScale(xMin) - 8}
            y={yScale(ipVal)}
            fill="#000"
            fontSize={10}
            fontWeight="700"
            textAnchor="end"
            dominantBaseline="central"
          >
            {ipVal}
          </text>
        ))}
        
        {/* Label do eixo Y - texto vertical */}
        <text
          x={xScale(xMin) - 30}
          y={yScale(yMax / 2 + 5)}
          fill="#000"
          fontSize={16}
          fontWeight="600"
          textAnchor="middle"
          dominantBaseline="central"
          transform={`rotate(-90, ${xScale(xMin) - 30}, ${yScale(yMax / 2)})`}
        >
          Índice de Plasticidade (IP)
        </text>
        
        {/* Números embaixo (eixo X/LL) - de 20 em 20 */}
        {Array.from({ length: Math.floor(xMax / 20) + 1 }, (_, i) => i * 20).map(llVal => (
          <text
            key={`grid-x-${llVal}`}
            x={xScale(llVal)}
            y={yScale(yMin) + 8}
            fill="#000"
            fontSize={10}
            fontWeight="700"
            textAnchor="middle"
            dominantBaseline="hanging"
          >
            {llVal}
          </text>
        ))}
        
        {/* Label do eixo X - texto horizontal */}
        <text
          x={xScale(xMax / 2)}
          y={yScale(yMin) + 25}
          fill="#000"
          fontSize={16}
          fontWeight="600"
          textAnchor="middle"
          dominantBaseline="hanging"
        >
          Limite de Liquidez (LL)
        </text>
      </g>
      
      {/* Zone Labels */}
      {/* CL label - left top area */}
      <text
        x={xScale(25)}
        y={yScale(35)}
        fill="#000"
        fontSize={16}
        fontWeight="700"
        textAnchor="middle"
        dominantBaseline="central"
      >
        CL
      </text>
      
      {/* CH label - right top area */}
      <text
        x={xScale(70)}
        y={yScale(40)}
        fill="#000"
        fontSize={16}
        fontWeight="700"
        textAnchor="middle"
        dominantBaseline="central"
      >
        CH
      </text>
      
      {/* ML ou OL label - left bottom area (pink zone) */}
      <text
        x={xScale(43)}
        y={yScale(13)}
        fill="#000"
        fontSize={12}
        fontWeight="600"
        textAnchor="middle"
        dominantBaseline="central"
      >
        ML
      </text>
      <text
        x={xScale(43)}
        y={yScale(9.5)}
        fill="#000"
        fontSize={12}
        fontWeight="600"
        textAnchor="middle"
        dominantBaseline="central"
      >
        ou OL
      </text>
      
      {/* MH ou OH label - right bottom area */}
      <text
        x={xScale(70)}
        y={yScale(22)}
        fill="#000"
        fontSize={13}
        fontWeight="600"
        textAnchor="middle"
        dominantBaseline="central"
      >
        MH
      </text>
      <text
        x={xScale(70)}
        y={yScale(17)}
        fill="#000"
        fontSize={13}
        fontWeight="600"
        textAnchor="middle"
        dominantBaseline="central"
      >
        ou OH
      </text>
      
      {/* CL-ML label - small brown stripe */}
      <text
        x={xScale(10)}
        y={yScale(5.5)}
        fill="#FFF"
        fontSize={9}
        fontWeight="700"
        textAnchor="middle"
        dominantBaseline="central"
      >
        CL-ML
      </text>
      
      {/* Line Labels */}
      {/* Linha A label */}
      <text
        x={xScale(55)}
        y={yScale(Math.max(ipA(55) + 3, ipA(55) + 3))}
        fill="#222"
        fontSize={10}
        fontWeight="600"
        textAnchor="middle"
        dominantBaseline="central"
        transform={`rotate(-35, ${xScale(55)}, ${yScale(ipA(55) + 3)})`}
      >
        Linha A
      </text>
      
      {/* Linha B label (vertical) */}
      <text
        x={xScale(50)}
        y={yScale(yMax - 5)}
        fill="#222"
        fontSize={10}
        fontWeight="600"
        textAnchor="middle"
        dominantBaseline="central"
      >
        Linha B
      </text>
      
      {/* Draw reference lines on top of everything */}
      {/* Linha A - solid thick line going down to IP=4 (bottom of CL-ML) */}
      <line
        x1={xScale((4 / 0.73) + 20)}
        y1={yScale(4)}
        x2={xScale(xMax)}
        y2={yScale(ipA(xMax))}
        stroke="#000"
        strokeWidth={2.5}
      />
      
      {/* CL-ML border - black outline */}
      <path 
        d={polyToPath(clmlPoly)} 
        fill="none"
        stroke="#000" 
        strokeWidth={2}
      />
      
      {/* Linha B - vertical line at LL=50 */}
      <line
        x1={xScale(50)}
        y1={yScale(yMin)}
        x2={xScale(50)}
        y2={yScale(yMax)}
        stroke="#000"
        strokeWidth={2.5}
      />
    </g>
    </>
    
  );
};

const PlasticityChart = forwardRef<PlasticityChartRef, PlasticityChartProps>(({ ll, ip }, ref) => {
  const [selectedZone, setSelectedZone] = useState<string | null>(null);
  const [showZoneInfo, setShowZoneInfo] = useState<boolean>(false);
  const [popupPosition, setPopupPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const popupRef = React.useRef<HTMLDivElement>(null);
  const chartRef = useRef<HTMLDivElement>(null);

  // Função para exportar como JPG
  const handleExportJPG = async () => {
    if (!chartRef.current) return;
    
    try {
      const canvas = await html2canvas(chartRef.current, {
        backgroundColor: '#ffffff',
        scale: 2, // Maior qualidade
        logging: false,
      });
      
      // Converter para JPG
      const image = canvas.toDataURL('image/jpeg', 0.95);
      
      // Criar link de download
      const link = document.createElement('a');
      link.href = image;
      link.download = `carta-plasticidade-${Date.now()}.jpg`;
      link.click();
    } catch (error) {
      console.error('Erro ao exportar imagem:', error);
    }
  };

  // Função para obter imagem para exportação (sem download)
  const getImageForExport = async (): Promise<string | null> => {
    if (!chartRef.current) return null;
    
    try {
      const canvas = await html2canvas(chartRef.current, {
        backgroundColor: '#ffffff',
        scale: 2, // Maior qualidade
        logging: false,
      });
      
      // Converter para PNG para melhor qualidade no PDF
      return canvas.toDataURL('image/png');
    } catch (error) {
      console.error('Erro ao capturar imagem:', error);
      return null;
    }
  };

  // Expor as funções via ref
  useImperativeHandle(ref, () => ({
    exportAsJPG: handleExportJPG,
    getImageForExport: getImageForExport
  }));

  // Fecha o popup ao clicar fora
  React.useEffect(() => {
    if (!showZoneInfo) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      
      // Verifica se o clique foi em uma zona (path element)
      const isZoneClick = target.tagName === 'path' && target.style.cursor === 'pointer';
      
      // Não fecha se clicar no popup ou em uma zona
      if (popupRef.current && !popupRef.current.contains(target) && !isZoneClick) {
        setShowZoneInfo(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showZoneInfo]);

  if (ll === null || ip === null || isNaN(ll) || isNaN(ip)) {
    return (
      <div className="flex items-center justify-center h-[340px] bg-card p-2 rounded-md border border-border/50 shadow-inner text-muted-foreground text-sm">
        Dados insuficientes para gerar a carta.
      </div>
    );
  }

  // --- domains ---
  const xMax = Math.max(100, Math.ceil((ll + 10) / 10) * 10);
  const yMax = Math.max(60, Math.ceil((ip + 5) / 5) * 5);
  const xDomain: [number, number] = [0, xMax];
  const yDomain: [number, number] = [0, yMax];

  const ipA = (llVal: number) => Math.max(0, 0.73 * (llVal - 20));
  const ipA_at_50 = ipA(50);

  // Função para determinar a classificação do solo
  const getSoilClassification = () => {
    if (ll < 50) {
      if (ip >= ipA(ll)) {
        return 'CL';
      } else if (ip >= 4 && ip <= 7) {
        // CL-ML é a zona entre IP=4 e IP=7, abaixo da Linha A
        // A zona se estende até onde IP=7 cruza a Linha A (aproximadamente LL=29.6)
        const ll_ip7_onA = (7 / 0.73) + 20; // ≈ 29.59
        if (ll <= ll_ip7_onA) {
          return 'CL-ML';
        } else {
          return 'ML';
        }
      } else {
        return 'ML';
      }
    } else {
      if (ip >= ipA(ll)) {
        return 'CH';
      } else {
        return 'MH';
      }
    }
  };

  const soilClassification = getSoilClassification();

  return (
    <div className="space-y-2 relative">
      {/* Gráfico principal - compacto com fundo branco */}
      <div ref={chartRef} className="bg-white p-3 rounded-xl border border-border shadow-sm" style={{ width: '100%' }}>
        <div style={{ width: '100%', height: 340 }}>
          <ResponsiveContainer>
            <ScatterChart margin={{ top: 5, right: 5, bottom: 45, left: 50 }}>
              <XAxis
                type="number"
                dataKey="ll"
                name="LL"
                domain={xDomain}
                hide={true}
              />

              <YAxis
                type="number"
                dataKey="ip"
                name="IP"
                domain={yDomain}
                hide={true}
              />

            {/* Customized: draw polygons that respect the Line A shape */}
            <Customized
              component={
                // Recharts pass chart width/height etc. via props to this function. We'll wrap it so it receives the domains.
                (chartProps: any) => (
                  <CustomizedPolygonDrawer
                    {...chartProps}
                    xDomain={xDomain}
                    yDomain={yDomain}
                    onZoneClick={(zone: string, event: any) => {
                      // Posição relativa à viewport (janela inteira)
                      setPopupPosition({ 
                        x: event.clientX, 
                        y: event.clientY 
                      });
                      setSelectedZone(zone);
                      setShowZoneInfo(true);
                    }}
                  />
                )
              }
            />

            {/* Zone labels will be shown only when clicking on zones */}

            {/* Ponto do solo e suas anotações - renderizado por último para ficar em cima */}
            <Customized
              component={(chartProps: any) => {
                const { width, height, xAxisMap, yAxisMap } = chartProps;
                if (!xAxisMap || !yAxisMap) return null;

                // Converter coordenadas do domínio para pixels
                const xScale = (val: number) => {
                  const [dmin, dmax] = xDomain;
                  return ((val - dmin) / (dmax - dmin)) * width;
                };
                const yScale = (val: number) => {
                  const [dmin, dmax] = yDomain;
                  return height - ((val - dmin) / (dmax - dmin)) * height;
                };

                const px = xScale(ll);
                const py = yScale(ip);

                // Posição do label - ajustada para não sobrepor o ponto
                const labelOffsetX = 10;
                const labelOffsetY = -18;

                // Usar a mesma escala do gráfico principal
                const chartScale = 0.85; // Deve ser o mesmo valor do CustomizedPolygonDrawer
                const translateX = width * (1 - chartScale) / 2 + 25; // +25px para a direita
                const translateY = height * (1 - chartScale) / 2 - 10; // +10px para cima

                return (
                  <g transform={`translate(${translateX}, ${translateY}) scale(${chartScale})`}>
                    {/* Linhas guia do ponto aos eixos (tracejadas finas) */}
                    <line
                      x1={px}
                      y1={py}
                      x2={px}
                      y2={height}
                      stroke="#dc2626"
                      strokeWidth={1}
                      strokeDasharray="2 3"
                      opacity={0.3}
                    />
                    <line
                      x1={0}
                      y1={py}
                      x2={px}
                      y2={py}
                      stroke="#dc2626"
                      strokeWidth={1}
                      strokeDasharray="2 3"
                      opacity={0.3}
                    />
                    
                    {/* Círculo de referência ao redor do ponto */}
                    <circle
                      cx={px}
                      cy={py}
                      r={10}
                      fill="none"
                      stroke="#dc2626"
                      strokeWidth={1.5}
                      strokeDasharray="3 2"
                      opacity={0.6}
                    />
                    
                    {/* Ponto principal do solo */}
                    <circle
                      cx={px}
                      cy={py}
                      r={6}
                      fill="#dc2626"
                      stroke="#ffffff"
                      strokeWidth={2.5}
                    />
                    
                    {/* Label com coordenadas */}
                    <g transform={`translate(${px + labelOffsetX}, ${py + labelOffsetY})`}>
                      <rect
                        x={-28}
                        y={-10}
                        width={56}
                        height={18}
                        fill="#dc2626"
                        rx={3}
                        opacity={0.95}
                        stroke="#ffffff"
                        strokeWidth={1}
                      />
                      <text
                        x={0}
                        y={2}
                        textAnchor="middle"
                        fill="#ffffff"
                        fontSize={10}
                        fontWeight="700"
                      >
                        ({ll.toFixed(1)}, {ip.toFixed(1)})
                      </text>
                    </g>
                  </g>
                );
              }}
            />

          </ScatterChart>
        </ResponsiveContainer>
        </div>
      </div>

      {/* Popover da zona selecionada - renderizado via Portal no body */}
      {showZoneInfo && selectedZone && createPortal(
        <div 
          ref={popupRef}
          className="fixed animate-in fade-in slide-in-from-bottom-2 duration-200"
          style={{
            left: `${popupPosition.x}px`,
            top: `${popupPosition.y - 10}px`,
            transform: 'translate(-50%, -100%)',
            zIndex: 9999,
            pointerEvents: 'auto'
          }}
        >
          <div className="bg-popover text-popover-foreground rounded-md border border-border shadow-2xl max-w-[280px] p-2.5">
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 pb-1 border-b border-border/30">
                <div 
                  className="w-3 h-3 rounded flex-shrink-0" 
                  style={{ backgroundColor: zoneInfo[selectedZone as keyof typeof zoneInfo]?.color }}
                />
                <span className="font-semibold text-xs">Zona {selectedZone}</span>
                <Badge variant="outline" className="text-[10px] h-4 px-1" style={{ backgroundColor: zoneInfo[selectedZone as keyof typeof zoneInfo]?.color + '20' }}>
                  {zoneInfo[selectedZone as keyof typeof zoneInfo]?.name}
                </Badge>
              </div>
              <p className="text-[11px] text-muted-foreground leading-snug">
                {zoneInfo[selectedZone as keyof typeof zoneInfo]?.description}
              </p>
              <div className="space-y-1 pt-0.5">
                <div className="font-medium text-[11px] text-foreground">Características:</div>
                <div className="flex flex-col gap-0.5">
                  {zoneInfo[selectedZone as keyof typeof zoneInfo]?.properties.map((prop, index) => (
                    <div key={index} className="flex items-center gap-1 text-[11px]">
                      <div 
                        className="w-1 h-1 rounded-full flex-shrink-0" 
                        style={{ backgroundColor: zoneInfo[selectedZone as keyof typeof zoneInfo]?.color }}
                      />
                      <span className="text-[11px] leading-tight">{prop}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Informações da classificação do solo */}
      <Card>
        <CardHeader className="pb-2 pt-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            Classificação do Solo
            <Badge variant="outline" className="text-xs" style={{ backgroundColor: zoneInfo[soilClassification as keyof typeof zoneInfo]?.color + '20' }}>
              {soilClassification}
            </Badge>
          </CardTitle>
          <CardDescription className="text-xs">
            {zoneInfo[soilClassification as keyof typeof zoneInfo]?.name}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0 pb-3">
          <p className="text-xs text-muted-foreground mb-1.5 leading-tight">
            {zoneInfo[soilClassification as keyof typeof zoneInfo]?.description}
          </p>
          <div className="flex flex-wrap gap-1">
            {zoneInfo[soilClassification as keyof typeof zoneInfo]?.properties.map((prop, index) => (
              <Badge key={index} variant="secondary" className="text-[10px] py-0 px-1.5 h-5">
                {prop}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>


    </div>
  );
});

PlasticityChart.displayName = 'PlasticityChart';

export default PlasticityChart;
