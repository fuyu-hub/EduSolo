// src/components/visualizations/PlasticityChart.tsx
import React from 'react';
import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Label as RechartsLabel, ReferenceLine, ReferenceArea, ZAxis, Text
} from 'recharts';

interface PlasticityChartProps {
  ll: number | null;
  ip: number | null;
}

// Componente para Rótulos Customizados (melhor controle de posição)
const ZoneLabel = ({ x, y, value, fill, fontSize = 14, fontWeight = 'bold' }: { x: number, y: number, value: string, fill: string, fontSize?: number, fontWeight?: string }) => (
    <Text x={x} y={y} fill={fill} fontSize={fontSize} fontWeight={fontWeight} textAnchor="middle" dominantBaseline="middle">
        {value}
    </Text>
);


const PlasticityChart: React.FC<PlasticityChartProps> = ({ ll, ip }) => {
  // Estado de erro/dados insuficientes (inalterado)
  if (ll === null || ip === null || isNaN(ll) || isNaN(ip)) {
       return (
            <div className="flex items-center justify-center h-[350px] bg-card p-4 rounded-md border border-border/50 shadow-inner text-muted-foreground">
                Dados insuficientes para gerar a carta.
            </div>
       );
  }

  // --- Dados e Domínios ---
  const data = [{ ll, ip, z: 1 }]; // Ponto do solo
  // Linha A: IP = 0.73 * (LL - 20)
  const aLineData = [ { ll: 20, ip: 0 }, { ll: 100, ip: 0.73 * (100 - 20) } ]; // 58.4
  // Linha U: IP = 0.9 * (LL - 8)
  const uLineData = [ { ll: 8, ip: 0 }, { ll: 100, ip: 0.9 * (100 - 8) } ]; // 82.8

  // Ajusta dinamicamente os limites dos eixos
  const xDomain: [number, number] = [0, Math.max(100, Math.ceil((ll + 10) / 10) * 10)];
  const yDomain: [number, number] = [0, Math.max(60, Math.ceil((ip + 5) / 5) * 5)];

  // --- Cores Refinadas (baseado na imagem carta-casagrande.jpg) ---
  const colors = {
    background: 'hsl(var(--card))', // Fundo do card
    grid: 'hsl(var(--foreground) / 0.15)', // Grid mais sutil
    axis: 'hsl(var(--foreground) / 0.8)', // Eixos
    label: 'hsl(var(--muted-foreground))', // Rótulos dos eixos e linhas
    aLine: 'hsl(var(--foreground) / 0.9)', // Linha A (Sólida e escura)
    uLine: 'hsl(var(--foreground) / 0.5)', // Linha U (Tracejada, escura)
    point: 'hsl(var(--destructive))', // Ponto do solo
    // Cores das áreas (cores da imagem, opacidade moderada)
    cl: '#87CEEB', // Ciano/Azul claro (CL) - Usando Hex
    ch: '#FFD700', // Amarelo (CH) - Usando Hex
    ml_ol: '#FFB6C1', // Rosa claro (ML/OL) - Usando Hex
    mh_oh: '#ADD8E6', // Azul claro/pálido (MH/OH) - Usando Hex
    cl_ml: '#D2B48C', // Marrom claro (CL-ML) - Usando Hex
    zoneLabel: 'hsl(var(--foreground) / 0.9)', // Cor para rótulos CL, CH etc. (preto/branco)
    lineB: 'hsl(var(--foreground) / 0.9)', // Linha B (LL=50)
  };
  const areaOpacity = 0.4; // Opacidade para as áreas coloridas

  // --- Funções Auxiliares e Constantes ---
  const ipA = (llVal: number): number => Math.max(0, 0.73 * (llVal - 20)); // Valor IP na Linha A
  const ipA_at_50 = ipA(50); // IP da Linha A em LL=50 (aprox. 21.9)

  // Limites da zona CL-ML
  const ll_at_ip4_lineA = (4 / 0.73) + 20; // ~25.48
  const ll_at_ip7_lineA = (7 / 0.73) + 20; // ~29.59
  // Valor da linha A nesses pontos LL
  const ipA_at_ll_ip4 = ipA(ll_at_ip4_lineA); // Deve ser ~4
  const ipA_at_ll_ip7 = ipA(ll_at_ip7_lineA); // Deve ser ~7


  return (
    <div className="bg-card p-4 rounded-md border border-border/50 shadow-inner" style={{ width: '100%', height: 350 }}>
      <ResponsiveContainer>
        <ScatterChart margin={{ top: 20, right: 30, bottom: 40, left: 35 }}>
           {/* Grid */}
          <CartesianGrid stroke={colors.grid} />

          {/* Eixos */}
          <XAxis type="number" dataKey="ll" name="LL (%)" domain={xDomain} ticks={[0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100].filter(t => t <= xDomain[1])} stroke={colors.axis} tick={{ fill: colors.label, fontSize: 10 }} axisLine={{ stroke: colors.axis }} tickLine={{ stroke: colors.axis }}>
             <RechartsLabel value="Limite de Liquidez (LL %)" offset={-25} position="insideBottom" fill={colors.label} fontSize={12} />
          </XAxis>
          <YAxis type="number" dataKey="ip" name="IP (%)" domain={yDomain} ticks={[0, 10, 20, 30, 40, 50, 60].filter(t => t <= yDomain[1])} stroke={colors.axis} tick={{ fill: colors.label, fontSize: 10 }} axisLine={{ stroke: colors.axis }} tickLine={{ stroke: colors.axis }}>
             <RechartsLabel value="Índice de Plasticidade (IP %)" angle={-90} position="insideLeft" style={{ textAnchor: 'middle', fill: colors.label, fontSize: 12 }} offset={-20} />
          </YAxis>

          {/* Tooltip */}
          <RechartsTooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ backgroundColor: 'hsl(var(--popover))', borderColor: 'hsl(var(--border))' }} itemStyle={{ color: 'hsl(var(--popover-foreground))' }} labelStyle={{ color: 'hsl(var(--popover-foreground))' }}/>

          {/* --- Áreas Coloridas (CORRIGIDO) --- */}
          {/* Ordem de renderização importa */}
          {/* MH ou OH: LL>=50, IP<IP_A */}
          <ReferenceArea x1={50} x2={xDomain[1]} y1={0} y2={ipA_at_50} fill={colors.mh_oh} fillOpacity={areaOpacity} strokeOpacity={0} ifOverflow="extendDomain"/>
          {/* ML ou OL: LL<50 E (IP<4 OU IP<IP_A) */}
          {/* Cobrir a maior área rosa primeiro */}
          <ReferenceArea x1={0} x2={50} y1={0} y2={yDomain[1]} fill={colors.ml_ol} fillOpacity={areaOpacity} strokeOpacity={0} ifOverflow="hidden"/>
          {/* CL-ML: 4<=IP<=7 E IP<IP_A */}
          <ReferenceArea x1={ll_at_ip4_lineA} x2={ll_at_ip7_lineA} y1={4} y2={7} fill={colors.cl_ml} fillOpacity={areaOpacity} strokeOpacity={0} ifOverflow="hidden"/>
          {/* CH: LL>=50, IP>=IP_A */}
          <ReferenceArea x1={50} x2={xDomain[1]} y1={ipA_at_50} y2={yDomain[1]} fill={colors.ch} fillOpacity={areaOpacity} strokeOpacity={0} ifOverflow="extendDomain"/>
          {/* CL: LL<50, IP>7 E IP>=IP_A */}
          {/* Cobre por cima do rosa onde CL se aplica */}
          <ReferenceArea x1={ll_at_ip7_lineA} x2={50} y1={ipA_at_ll_ip7} y2={yDomain[1]} fill={colors.cl} fillOpacity={areaOpacity} strokeOpacity={0} ifOverflow="hidden"/>


          {/* --- Linhas de Referência --- */}
          {/* Linha A */}
          <ReferenceLine segment={aLineData.map(p => ({ x: p.ll, y: p.ip }))} stroke={colors.aLine} strokeWidth={1.5}>
             <RechartsLabel value="Linha A" position="insideTopRight" fill={colors.aLine} fontSize={10} offset={5}/>
          </ReferenceLine>
          {/* Linha U */}
          <ReferenceLine segment={uLineData.map(p => ({ x: p.ll, y: p.ip }))} stroke={colors.uLine} strokeDasharray="3 3" strokeWidth={1}/>
            {/* <RechartsLabel value="Linha U" position="top" fill={colors.uLine} fontSize={10} offset={10} /> */}
           {/* Linha B (LL=50) - Sólida */}
           <ReferenceLine x={50} stroke={colors.lineB} strokeWidth={1.5}>
              <RechartsLabel value="Linha B" angle={-90} position="insideTopLeft" fill={colors.lineB} fontSize={10} dx={-5} dy={10}/>
           </ReferenceLine>
            {/* Linhas Horizontais IP=4 e IP=7 - Sólidas */}
            <ReferenceLine y={4} stroke={colors.grid} strokeWidth={1}/>
            <ReferenceLine y={7} stroke={colors.grid} strokeWidth={1}/>


          {/* --- Rótulos das Zonas --- */}
          <ZoneLabel value="CL" x={35} y={30} fill={colors.zoneLabel} />
          <ZoneLabel value="CH" x={75} y={45} fill={colors.zoneLabel} />
          <ZoneLabel value="ML ou OL" x={35} y={12} fill={colors.zoneLabel} /> {/* Ajustado Y */}
          <ZoneLabel value="MH ou OH" x={75} y={15} fill={colors.zoneLabel} />
          <ZoneLabel value="CL - ML" x={20} y={5.5} fill={colors.zoneLabel} fontSize={9}/>


          {/* --- Ponto Calculado --- */}
           <ZAxis type="number" dataKey="z" range={[150, 150]} />
          <Scatter name={`Solo (${ll.toFixed(1)}, ${ip.toFixed(1)})`} data={data} fill={colors.point} shape="cross" />

        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
};

export default PlasticityChart;