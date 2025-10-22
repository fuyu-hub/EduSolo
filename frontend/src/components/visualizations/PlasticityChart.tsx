// src/components/visualizations/PlasticityChart.tsx
import React from 'react';
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Label as RechartsLabel,
  ReferenceLine,
  ZAxis,
  Text,
  Customized
} from 'recharts';

interface PlasticityChartProps {
  ll: number | null;
  ip: number | null;
}

/**
 * Pequeno componente para rótulos (Text do Recharts)
 */
const ZoneLabel = ({
  x,
  y,
  value,
  fontSize = 14,
  fontWeight = '700',
  fill = '#111'
}: {
  x: number;
  y: number;
  value: string;
  fontSize?: number;
  fontWeight?: string | number;
  fill?: string;
}) => (
  <Text
    x={x}
    y={y}
    fill={fill}
    fontSize={fontSize}
    fontWeight={fontWeight}
    textAnchor="middle"
    dominantBaseline="central"
  >
    {value}
  </Text>
);

/**
 * CustomizedPolygonDrawer:
 * recebe acesso aos scales do gráfico via props (xAxis, yAxis) e desenha SVG poligonos
 * com base no domínio [0..xMax] e [0..yMax], seguindo a linha A (ip = 0.73*(ll-20)).
 */
const CustomizedPolygonDrawer = (props: any) => {
  const { width, height, xAxisMap, yAxisMap, xAxisProps, yAxisProps, xDomain, yDomain } = props;

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

  // polygon for left-bottom (ML/OL) - area under LineA and left of LL=50
  const leftML: { x: number; y: number }[] = [];
  // start at LL=0, IP=0
  leftML.push({ x: xScale(xMin), y: yScale(yMin) });
  // go right along bottom to LL=50 (or xMax if smaller)
  leftML.push({ x: xScale(Math.min(50, xMax)), y: yScale(yMin) });
  // go up along vertical at LL=50 to ip at lineA
  const ipA_50 = ipA(50);
  leftML.push({ x: xScale(Math.min(50, xMax)), y: yScale(Math.min(ipA_50, yMax)) });
  // go back along LineA from LL=50 to xMin
  const aPointsUpTo50 = aPoints.filter(p => p[0] <= 50).reverse();
  // Append the line A points (from LL=50 back to LL=min)
  aPointsUpTo50.forEach(([llv, ipv]) => {
    leftML.push({ x: xScale(llv), y: yScale(Math.min(ipv, yMax)) });
  });
  // finally close at bottom-left
  leftML.push({ x: xScale(xMin), y: yScale(yMin) });

  // small CL-ML band between IP=4 and IP=7 under A (left side)
  // Build polygon that follows IP=7 line to intersection with A, then along A down to intersection with IP=4, then back along IP=4 to left edge.
  const ll_ip4_onA = (4 / 0.73) + 20;
  const ll_ip7_onA = (7 / 0.73) + 20;
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
      {/* Left CL (green) */}
      <path d={polyToPath(leftCL)} fill={colors.cl} fillOpacity={0.95} stroke="none" />
      {/* CL-ML stripe (brown thin) */}
      <path d={polyToPath(clmlPoly)} fill={colors.cl_ml} fillOpacity={0.95} stroke="none" />
      {/* Left ML/OL (pink) */}
      <path d={polyToPath(leftML)} fill={colors.ml_ol} fillOpacity={0.95} stroke="none" />
      {/* Right CH (yellow) */}
      <path d={polyToPath(rightCHpoly)} fill={colors.ch} fillOpacity={0.95} stroke="none" />
      {/* Right MH/OH (blue) */}
      <path d={polyToPath(rightBottomPoly)} fill={colors.mh_oh} fillOpacity={0.95} stroke="none" />
    </g>
  );
};

const PlasticityChart: React.FC<PlasticityChartProps> = ({ ll, ip }) => {
  if (ll === null || ip === null || isNaN(ll) || isNaN(ip)) {
    return (
      <div className="flex items-center justify-center h-[350px] bg-card p-4 rounded-md border border-border/50 shadow-inner text-muted-foreground">
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

  return (
    <div className="bg-card p-4 rounded-md border border-border/50 shadow-inner" style={{ width: '100%', height: 380 }}>
      <ResponsiveContainer>
        <ScatterChart margin={{ top: 12, right: 16, bottom: 44, left: 36 }}>
          <CartesianGrid stroke="rgba(0,0,0,0.12)" />
          <XAxis
            type="number"
            dataKey="ll"
            name="LL"
            domain={xDomain}
            ticks={[0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100].filter(t => t <= xDomain[1])}
            stroke="rgba(0,0,0,0.85)"
            tick={{ fill: 'rgba(0,0,0,0.8)', fontSize: 11 }}
            axisLine={{ stroke: 'rgba(0,0,0,0.9)' }}
            tickLine={{ stroke: 'rgba(0,0,0,0.9)' }}
          >
            <RechartsLabel value="Limite de Liquidez" offset={-20} position="insideBottom" fill="rgba(0,0,0,0.8)" fontSize={12} />
          </XAxis>

          <YAxis
            type="number"
            dataKey="ip"
            name="IP"
            domain={yDomain}
            ticks={[0, 5, 10, 15, 20, 30, 40, 50, 60].filter(t => t <= yDomain[1])}
            stroke="rgba(0,0,0,0.85)"
            tick={{ fill: 'rgba(0,0,0,0.8)', fontSize: 11 }}
            axisLine={{ stroke: 'rgba(0,0,0,0.9)' }}
            tickLine={{ stroke: 'rgba(0,0,0,0.9)' }}
          >
            <RechartsLabel value="Índice de Plasticidade (IP %)" angle={-90} position="insideLeft" style={{ textAnchor: 'middle', fill: 'rgba(0,0,0,0.8)', fontSize: 12 }} offset={-18} />
          </YAxis>

          <RechartsTooltip cursor={{ strokeDasharray: '3 3' }} />

          {/* Linha A (segment) */}
          <ReferenceLine segment={[{ x: 20, y: ipA(20) }, { x: xMax, y: ipA(xMax) }]} stroke="#222" strokeWidth={2} />
          {/* Linha U */}
          <ReferenceLine segment={[{ x: 8, y: 0 }, { x: xMax, y: Math.max(0, 0.9 * (xMax - 8)) }]} stroke="#222" strokeDasharray="4 4" strokeWidth={1} />
          {/* Linha B LL=50 */}
          <ReferenceLine x={50} stroke="#222" strokeWidth={2} />

          {/* IP = 4 and 7 guide lines */}
          <ReferenceLine y={4} stroke="rgba(0,0,0,0.12)" strokeWidth={1} />
          <ReferenceLine y={7} stroke="rgba(0,0,0,0.12)" strokeWidth={1} />

          {/* Customized: draw polygons that respect the Line A shape */}
          <Customized
            component={
              // Recharts pass chart width/height etc. via props to this function. We'll wrap it so it receives the domains.
              (chartProps: any) => (
                <CustomizedPolygonDrawer
                  {...chartProps}
                  xDomain={xDomain}
                  yDomain={yDomain}
                />
              )
            }
          />

          {/* Zone labels - positions chosen to match the reference image */}
          <ZoneLabel value="CL" x={130} y={110} fill="#073b26" fontSize={22} />
          <ZoneLabel value="CH" x={330} y={70} fill="#3e3e00" fontSize={22} />
          <ZoneLabel value="ML ou OL" x={190} y={260} fill="#4b0b1b" fontSize={16} />
          <ZoneLabel value="MH ou OH" x={330} y={220} fill="#0b3a4b" fontSize={18} />
          <ZoneLabel value="CL - ML" x={70} y={295} fill="#fff" fontSize={11} />

          {/* plotted soil point */}
          <ZAxis type="number" dataKey="z" range={[150, 150]} />
          <Scatter name={`Solo (${ll.toFixed(1)}, ${ip.toFixed(1)})`} data={data} fill="#981b1b" shape="cross" />

        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
};

export default PlasticityChart;
