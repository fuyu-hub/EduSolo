// src/components/visualizations/PlasticityChart.tsx
import React, { useState } from 'react';
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Label as RechartsLabel,
  ZAxis,
  Customized
} from 'recharts';
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface PlasticityChartProps {
  ll: number | null;
  ip: number | null;
}

// Informações das zonas de classificação
const zoneInfo = {
  CL: {
    name: "Argila de Baixa Plasticidade",
    description: "Solo argiloso com baixa plasticidade. Características: coesão moderada, compressibilidade média.",
    color: "#00D07A",
    properties: ["Coesão moderada", "Compressibilidade média", "Boa para fundações rasas"]
  },
  CH: {
    name: "Argila de Alta Plasticidade", 
    description: "Solo argiloso com alta plasticidade. Características: alta coesão, alta compressibilidade.",
    color: "#FFD400",
    properties: ["Alta coesão", "Alta compressibilidade", "Requer cuidados especiais em fundações"]
  },
  ML: {
    name: "Silte de Baixa Plasticidade",
    description: "Solo siltoso com baixa plasticidade. Características: baixa coesão, comportamento intermediário.",
    color: "#FFB6C1", 
    properties: ["Baixa coesão", "Comportamento intermediário", "Sensível à água"]
  },
  MH: {
    name: "Silte de Alta Plasticidade",
    description: "Solo siltoso com alta plasticidade. Características: comportamento expansivo, alta sensibilidade à água.",
    color: "#BFE9FF",
    properties: ["Comportamento expansivo", "Alta sensibilidade à água", "Requer drenagem adequada"]
  },
  "CL-ML": {
    name: "Zona de Transição CL-ML",
    description: "Zona de transição entre argila de baixa plasticidade e silte de baixa plasticidade.",
    color: "#8B4513",
    properties: ["Características mistas", "Comportamento variável", "Análise detalhada necessária"]
  }
};

/**
 * CustomizedPolygonDrawer:
 * recebe acesso aos scales do gráfico via props (xAxis, yAxis) e desenha SVG poligonos
 * com base no domínio [0..xMax] e [0..yMax], seguindo a linha A (ip = 0.73*(ll-20)).
 */
const CustomizedPolygonDrawer = (props: any) => {
  const { width, height, xAxisMap, yAxisMap, xAxisProps, yAxisProps, xDomain, yDomain, onZoneClick } = props;

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

  // polygon for left-up (CL):
  // trace from LL=0 at top (yMax) down to intersection with LineA, then along LineA to LL=50, then up to yMax at LL=50, then close.
  const leftCL: { x: number; y: number }[] = [];
  // top-left corner
  leftCL.push({ x: xScale(xMin), y: yScale(yMax) });
  // top edge until LL=50
  leftCL.push({ x: xScale(Math.min(50, xMax)), y: yScale(yMax) });

  // Go back along Line A from LL=50 to LL where Line A crosses near left side
  // We'll walk line A backwards from LL=50 down to the left domain min, and add only points where ip >= IP (so the polygon top boundary).
  const aPointsTo50 = aPoints.filter(p => p[0] <= 50).reverse();
  // Ensure we clamp ip to yMax (if line below domain)
  aPointsTo50.forEach(([llv, ipv]) => {
    const px = xScale(llv);
    const py = yScale(Math.min(ipv, yMax));
    leftCL.push({ x: px, y: py });
  });

  // close polygon back to top-left at xMin
  leftCL.push({ x: xScale(xMin), y: yScale(yMax) });

  // Calculate LL values where IP=4 and IP=7 intersect Line A
  const ll_ip4_onA = (4 / 0.73) + 20;
  const ll_ip7_onA = (7 / 0.73) + 20;

  // polygon for left-bottom (ML/OL) - area under LineA and left of LL=50, including area under CL-ML
  const leftML: { x: number; y: number }[] = [];
  // start at LL=0, IP=0
  leftML.push({ x: xScale(xMin), y: yScale(yMin) });
  // go right along bottom to LL=50 (or xMax if smaller)
  leftML.push({ x: xScale(Math.min(50, xMax)), y: yScale(yMin) });
  // go up along vertical at LL=50 to ip at lineA
  const ipA_50 = ipA(50);
  leftML.push({ x: xScale(Math.min(50, xMax)), y: yScale(Math.min(ipA_50, yMax)) });
  // go back along LineA from LL=50 to ll_ip7_onA (top of CL-ML band)
  const aPointsTo_ip7 = aPoints.filter(p => p[0] >= ll_ip7_onA && p[0] <= 50).reverse();
  aPointsTo_ip7.forEach(([llv, ipv]) => {
    leftML.push({ x: xScale(llv), y: yScale(Math.min(ipv, yMax)) });
  });
  // go along IP=7 line to left edge
  leftML.push({ x: xScale(ll_ip7_onA), y: yScale(7) });
  leftML.push({ x: xScale(xMin), y: yScale(7) });
  // finally close at bottom-left
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

  // colors (close to your reference image)
  const colors = {
    cl: '#00D07A', // green
    ch: '#FFD400', // yellow
    ml_ol: '#FFB6C1', // pink
    mh_oh: '#BFE9FF', // light blue
    cl_ml: '#8B4513' // brown for small stripe
  };

  return (
    <g>
      {/* Layer 1: Base areas */}
      {/* Left CL (green) */}
      <path 
        d={polyToPath(leftCL)} 
        fill={colors.cl} 
        fillOpacity={0.95} 
        stroke="none" 
        style={{ cursor: 'pointer' }}
        onClick={() => onZoneClick && onZoneClick('CL')}
        onMouseEnter={(e) => {
          e.currentTarget.style.fillOpacity = '0.8';
          e.currentTarget.style.stroke = '#333';
          e.currentTarget.style.strokeWidth = '2';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.fillOpacity = '0.95';
          e.currentTarget.style.stroke = 'none';
        }}
      />
      {/* Right CH (yellow) */}
      <path 
        d={polyToPath(rightCHpoly)} 
        fill={colors.ch} 
        fillOpacity={0.95} 
        stroke="none" 
        style={{ cursor: 'pointer' }}
        onClick={() => onZoneClick && onZoneClick('CH')}
        onMouseEnter={(e) => {
          e.currentTarget.style.fillOpacity = '0.8';
          e.currentTarget.style.stroke = '#333';
          e.currentTarget.style.strokeWidth = '2';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.fillOpacity = '0.95';
          e.currentTarget.style.stroke = 'none';
        }}
      />
      {/* Right MH/OH (blue) */}
      <path 
        d={polyToPath(rightBottomPoly)} 
        fill={colors.mh_oh} 
        fillOpacity={0.95} 
        stroke="none" 
        style={{ cursor: 'pointer' }}
        onClick={() => onZoneClick && onZoneClick('MH')}
        onMouseEnter={(e) => {
          e.currentTarget.style.fillOpacity = '0.8';
          e.currentTarget.style.stroke = '#333';
          e.currentTarget.style.strokeWidth = '2';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.fillOpacity = '0.95';
          e.currentTarget.style.stroke = 'none';
        }}
      />
      {/* Left ML/OL (pink) */}
      <path 
        d={polyToPath(leftML)} 
        fill={colors.ml_ol} 
        fillOpacity={0.95} 
        stroke="none" 
        style={{ cursor: 'pointer' }}
        onClick={() => onZoneClick && onZoneClick('ML')}
        onMouseEnter={(e) => {
          e.currentTarget.style.fillOpacity = '0.8';
          e.currentTarget.style.stroke = '#333';
          e.currentTarget.style.strokeWidth = '2';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.fillOpacity = '0.95';
          e.currentTarget.style.stroke = 'none';
        }}
      />
      {/* Layer 2: CL-ML stripe (brown) - on top of ML */}
      <path 
        d={polyToPath(clmlPoly)} 
        fill={colors.cl_ml} 
        fillOpacity={0.95} 
        stroke="none" 
        style={{ cursor: 'pointer' }}
        onClick={() => onZoneClick && onZoneClick('CL-ML')}
        onMouseEnter={(e) => {
          e.currentTarget.style.fillOpacity = '0.8';
          e.currentTarget.style.stroke = '#333';
          e.currentTarget.style.strokeWidth = '2';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.fillOpacity = '0.95';
          e.currentTarget.style.stroke = 'none';
        }}
      />
      
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
        x={xScale(30)}
        y={yScale(15)}
        fill="#000"
        fontSize={12}
        fontWeight="600"
        textAnchor="middle"
        dominantBaseline="central"
      >
        ML
      </text>
      <text
        x={xScale(30)}
        y={yScale(11)}
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
        fontSize={14}
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
        fontSize={14}
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
      
      {/* Linha U - dashed line */}
      <line
        x1={xScale(8)}
        y1={yScale(0)}
        x2={xScale(xMax)}
        y2={yScale(Math.max(0, 0.9 * (xMax - 8)))}
        stroke="#000"
        strokeWidth={1.5}
        strokeDasharray="4 4"
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
  );
};

const PlasticityChart: React.FC<PlasticityChartProps> = ({ ll, ip }) => {
  const [selectedZone, setSelectedZone] = useState<string | null>(null);
  const [showZoneInfo, setShowZoneInfo] = useState<boolean>(false);

  if (ll === null || ip === null || isNaN(ll) || isNaN(ip)) {
    return (
      <div className="flex items-center justify-center h-[260px] bg-card p-2 rounded-md border border-border/50 shadow-inner text-muted-foreground text-sm">
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

  // data point
  const data = [{ ll, ip, z: 1 }];

  // Função para determinar a classificação do solo
  const getSoilClassification = () => {
    if (ll < 50) {
      if (ip >= ipA(ll)) {
        return 'CL';
      } else if (ip >= 4 && ip <= 7 && ll <= 20) {
        return 'CL-ML';
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
      {/* Gráfico principal */}
      <div className="bg-card p-2 rounded-md border border-border/50 shadow-inner" style={{ width: '100%', height: 260 }}>
        <ResponsiveContainer>
          <ScatterChart margin={{ top: 8, right: 12, bottom: 32, left: 28 }}>
            <CartesianGrid stroke="rgba(0,0,0,0.12)" />
            <XAxis
              type="number"
              dataKey="ll"
              name="LL"
              domain={xDomain}
              ticks={[0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100].filter(t => t <= xDomain[1])}
              stroke="rgba(0,0,0,0.85)"
              tick={{ fill: 'rgba(0,0,0,0.8)', fontSize: 10 }}
              axisLine={{ stroke: 'rgba(0,0,0,0.9)' }}
              tickLine={{ stroke: 'rgba(0,0,0,0.9)' }}
            >
              <RechartsLabel value="Limite de Liquidez" offset={-18} position="insideBottom" fill="rgba(0,0,0,0.8)" fontSize={11} />
            </XAxis>

            <YAxis
              type="number"
              dataKey="ip"
              name="IP"
              domain={yDomain}
              ticks={[0, 5, 10, 15, 20, 30, 40, 50, 60].filter(t => t <= yDomain[1])}
              stroke="rgba(0,0,0,0.85)"
              tick={{ fill: 'rgba(0,0,0,0.8)', fontSize: 10 }}
              axisLine={{ stroke: 'rgba(0,0,0,0.9)' }}
              tickLine={{ stroke: 'rgba(0,0,0,0.9)' }}
            >
              <RechartsLabel value="Índice de Plasticidade (IP %)" angle={-90} position="insideLeft" style={{ textAnchor: 'middle', fill: 'rgba(0,0,0,0.8)', fontSize: 11 }} offset={-16} />
            </YAxis>

            <RechartsTooltip cursor={{ strokeDasharray: '3 3' }} />

            {/* Customized: draw polygons that respect the Line A shape */}
            <Customized
              component={
                // Recharts pass chart width/height etc. via props to this function. We'll wrap it so it receives the domains.
                (chartProps: any) => (
                  <CustomizedPolygonDrawer
                    {...chartProps}
                    xDomain={xDomain}
                    yDomain={yDomain}
                    onZoneClick={(zone) => {
                      setSelectedZone(zone);
                      setShowZoneInfo(true);
                    }}
                  />
                )
              }
            />

            {/* Zone labels will be shown only when clicking on zones */}

            {/* plotted soil point */}
            <ZAxis type="number" dataKey="z" range={[120, 120]} />
            <Scatter name={`Solo (${ll.toFixed(1)}, ${ip.toFixed(1)})`} data={data} fill="#981b1b" shape="cross" />

          </ScatterChart>
        </ResponsiveContainer>
      </div>

      {/* Popover compacto da zona selecionada */}
      {showZoneInfo && selectedZone && (
        <div className="absolute top-2 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="bg-popover text-popover-foreground rounded-md border border-border shadow-lg max-w-[280px] p-2.5">
            <button
              onClick={() => setShowZoneInfo(false)}
              className="absolute top-1.5 right-1.5 rounded-sm opacity-70 hover:opacity-100 transition-opacity"
            >
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <div className="space-y-1.5 pr-4">
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
        </div>
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
};

export default PlasticityChart;
