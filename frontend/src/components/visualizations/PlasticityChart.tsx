// src/components/visualizations/PlasticityChart.tsx
import React from 'react';
import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Label as RechartsLabel, ReferenceLine, ReferenceArea, ZAxis
} from 'recharts';

interface PlasticityChartProps {
  ll: number | null;
  ip: number | null;
}

const PlasticityChart: React.FC<PlasticityChartProps> = ({ ll, ip }) => {
  if (ll === null || ip === null || isNaN(ll) || isNaN(ip)) {
       return (
            <div className="flex items-center justify-center h-[350px] bg-card p-4 rounded-md border border-border/50 shadow-inner text-muted-foreground">
                Dados insuficientes para gerar a carta.
            </div>
       );
  }

  const data = [{ ll, ip, z: 1 }];
  const aLineData = [ { ll: 20, ip: 0 }, { ll: 100, ip: 0.73 * (100 - 20) } ];
  const uLineData = [ { ll: 8, ip: 0 }, { ll: 100, ip: 0.9 * (100 - 8) } ];
  const xDomain: [number, number] = [0, Math.max(100, Math.ceil((ll + 10) / 10) * 10)];
  const yDomain: [number, number] = [0, Math.max(60, Math.ceil((ip + 5) / 5) * 5)];

  const colors = { /* ... (cores como antes) ... */
    background: 'hsl(var(--card))',
    grid: 'hsl(var(--border) / 0.3)',
    axis: 'hsl(var(--foreground) / 0.8)',
    label: 'hsl(var(--muted-foreground))',
    aLine: 'hsl(var(--primary) / 0.8)',
    uLine: 'hsl(var(--muted-foreground) / 0.6)',
    point: 'hsl(var(--destructive))',
    cl: 'hsl(140 70% 80% / 0.1)',
    ch: 'hsl(50 90% 80% / 0.1)',
    ml_ol: 'hsl(0 80% 90% / 0.1)',
    mh_oh: 'hsl(190 70% 85% / 0.1)',
    cl_ml: 'hsl(30 60% 85% / 0.1)',
  };

  const ipA = (llVal: number): number => Math.max(0, 0.73 * (llVal - 20));
  const ipA_at_50 = ipA(50); // Calcula o valor da Linha A em LL=50

  return (
    <div className="bg-card p-4 rounded-md border border-border/50 shadow-inner" style={{ width: '100%', height: 350 }}>
      <ResponsiveContainer>
        <ScatterChart margin={{ top: 25, right: 30, bottom: 40, left: 30 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />
          <XAxis type="number" dataKey="ll" name="LL (%)" domain={xDomain} tickCount={11} stroke={colors.axis} tick={{ fill: colors.label, fontSize: 10 }} axisLine={{ stroke: colors.axis }} tickLine={{ stroke: colors.axis }}>
             <RechartsLabel value="Limite de Liquidez (LL %)" offset={-25} position="insideBottom" fill={colors.label} fontSize={12} />
          </XAxis>
          <YAxis type="number" dataKey="ip" name="IP (%)" domain={yDomain} allowDecimals={false} stroke={colors.axis} tick={{ fill: colors.label, fontSize: 10 }} axisLine={{ stroke: colors.axis }} tickLine={{ stroke: colors.axis }} label={{ value: 'Índice de Plasticidade (IP %)', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: colors.label }, offset: -15 }} />
          <RechartsTooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ backgroundColor: 'hsl(var(--popover))', borderColor: 'hsl(var(--border))' }} itemStyle={{ color: 'hsl(var(--popover-foreground))' }} labelStyle={{ color: 'hsl(var(--popover-foreground))' }}/>

          {/* Regiões com ReferenceArea */}
          <ReferenceArea x1={20} x2={50} y1={7} y2={ipA_at_50} fill={colors.cl} strokeOpacity={0.3} stroke={colors.grid} ifOverflow="hidden"/>
          <ReferenceArea x1={8} x2={29.18} y1={4} y2={7} fill={colors.cl_ml} strokeOpacity={0.3} stroke={colors.grid} ifOverflow="hidden"/>
          <ReferenceArea x1={50} x2={xDomain[1]} y1={ipA_at_50} y2={yDomain[1]} fill={colors.ch} strokeOpacity={0.3} stroke={colors.grid} ifOverflow="extendDomain"/>
          <ReferenceArea x1={50} x2={xDomain[1]} y1={0} y2={ipA_at_50} fill={colors.mh_oh} strokeOpacity={0.3} stroke={colors.grid} ifOverflow="extendDomain"/>
          <ReferenceArea x1={0} x2={25.5} y1={0} y2={4} fill={colors.ml_ol} strokeOpacity={0.3} stroke={colors.grid} ifOverflow="hidden"/>
          {/* CORREÇÃO AQUI: Usa valor fixo para y2 */}
          <ReferenceArea x1={25.5} x2={50} y1={4} y2={7} fill={colors.ml_ol} strokeOpacity={0.3} stroke={colors.grid} ifOverflow="hidden" />

          {/* Linhas */}
          <ReferenceLine segment={aLineData.map(p => ({ x: p.ll, y: p.ip }))} stroke={colors.aLine} strokeDasharray="5 5" strokeWidth={1.5}>
             <RechartsLabel value="Linha A" position="right" fill={colors.aLine} fontSize={10} offset={5}/>
          </ReferenceLine>
          <ReferenceLine segment={uLineData.map(p => ({ x: p.ll, y: p.ip }))} stroke={colors.uLine} strokeDasharray="3 3" strokeWidth={1}>
             <RechartsLabel value="Linha U" position="top" fill={colors.uLine} fontSize={10} offset={5}/>
           </ReferenceLine>
           <ReferenceLine x={50} stroke={colors.grid} strokeDasharray="2 2">
              <RechartsLabel value="LL=50" position="insideTopLeft" fill={colors.label} fontSize={10} />
           </ReferenceLine>
            <ReferenceLine y={4} stroke={colors.grid} strokeDasharray="2 2">
                <RechartsLabel value="IP=4" position="right" fill={colors.label} fontSize={10} offset={5}/>
            </ReferenceLine>
            <ReferenceLine y={7} stroke={colors.grid} strokeDasharray="2 2">
                <RechartsLabel value="IP=7" position="right" fill={colors.label} fontSize={10} offset={5}/>
            </ReferenceLine>

          {/* Ponto Calculado */}
           <ZAxis type="number" dataKey="z" range={[200, 200]} />
          <Scatter name="Solo (LL, IP)" data={data} fill={colors.point} shape="cross" />

        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
};

export default PlasticityChart;