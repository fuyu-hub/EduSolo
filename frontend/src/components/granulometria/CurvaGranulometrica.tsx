import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine, Area, ComposedChart, Scatter } from "recharts";

interface PontoGranulometrico {
  abertura: number;
  massa_retida: number;
  porc_retida: number;
  porc_retida_acum: number;
  porc_passante: number;
}

interface CurvaGranulometricaProps {
  dados: PontoGranulometrico[];
  d10?: number | null;
  d30?: number | null;
  d60?: number | null;
}

export default function CurvaGranulometrica({ dados, d10, d30, d60 }: CurvaGranulometricaProps) {
  
  // Preparar dados para o gráfico (ordenar por abertura crescente para plotagem)
  const dadosGrafico = [...dados]
    .sort((a, b) => a.abertura - b.abertura)
    .map(ponto => ({
      abertura: ponto.abertura,
      aberturaLog: Math.log10(ponto.abertura),
      passante: ponto.porc_passante,
      // Para exibição no tooltip
      aberturaFormatada: ponto.abertura.toFixed(3),
    }));

  // Preparar pontos D10, D30, D60 para marcação
  const pontosCaracteristicos = [];
  if (d10) {
    pontosCaracteristicos.push({
      abertura: d10,
      aberturaLog: Math.log10(d10),
      passante: 10,
      label: 'D10',
      color: '#ef4444' // red-500
    });
  }
  if (d30) {
    pontosCaracteristicos.push({
      abertura: d30,
      aberturaLog: Math.log10(d30),
      passante: 30,
      label: 'D30',
      color: '#f59e0b' // amber-500
    });
  }
  if (d60) {
    pontosCaracteristicos.push({
      abertura: d60,
      aberturaLog: Math.log10(d60),
      passante: 60,
      label: 'D60',
      color: '#10b981' // green-500
    });
  }

  // Função para formatar valores logarítmicos de volta para linear
  const formatarEixoX = (value: number) => {
    const abertura = Math.pow(10, value);
    if (abertura >= 1) {
      return abertura.toFixed(1);
    } else if (abertura >= 0.1) {
      return abertura.toFixed(2);
    } else {
      return abertura.toFixed(3);
    }
  };

  // Tooltip customizado
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background/95 backdrop-blur-sm border rounded-lg shadow-lg p-3">
          <p className="font-semibold text-sm mb-1">
            Abertura: {data.aberturaFormatada} mm
          </p>
          <p className="text-sm text-primary">
            % Passante: <span className="font-bold">{data.passante.toFixed(2)}%</span>
          </p>
        </div>
      );
    }
    return null;
  };

  // Tooltip para pontos característicos
  const CustomScatterTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background/95 backdrop-blur-sm border rounded-lg shadow-lg p-3">
          <p className="font-semibold text-sm mb-1" style={{ color: data.color }}>
            {data.label}
          </p>
          <p className="text-sm">
            Abertura: {data.abertura.toFixed(4)} mm
          </p>
          <p className="text-sm">
            % Passante: <span className="font-bold">{data.passante}%</span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="glass">
      <CardHeader>
        <CardTitle className="text-lg">Curva Granulométrica</CardTitle>
        <p className="text-sm text-muted-foreground">
          Distribuição do tamanho das partículas (NBR 7181)
        </p>
      </CardHeader>
      <CardContent>
        <div className="w-full h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={dadosGrafico}
              margin={{ top: 10, right: 30, left: 10, bottom: 60 }}
            >
              <defs>
                <linearGradient id="colorPassante" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.05}/>
                </linearGradient>
              </defs>
              
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              
              <XAxis
                dataKey="aberturaLog"
                type="number"
                domain={['auto', 'auto']}
                tickFormatter={formatarEixoX}
                label={{ 
                  value: 'Diâmetro das Partículas (mm)', 
                  position: 'bottom',
                  offset: 40,
                  style: { fontSize: '14px', fontWeight: 500 }
                }}
                tick={{ fontSize: 12 }}
              />
              
              <YAxis
                domain={[0, 100]}
                label={{ 
                  value: '% Passante', 
                  angle: -90, 
                  position: 'insideLeft',
                  style: { fontSize: '14px', fontWeight: 500 }
                }}
                tick={{ fontSize: 12 }}
              />
              
              <Tooltip content={<CustomTooltip />} />
              
              <Legend 
                wrapperStyle={{ paddingTop: '20px' }}
                iconType="line"
              />

              {/* Área sob a curva */}
              <Area
                type="monotone"
                dataKey="passante"
                fill="url(#colorPassante)"
                stroke="none"
                name="Área"
                legendType="none"
              />
              
              {/* Linha principal */}
              <Line
                type="monotone"
                dataKey="passante"
                stroke="hsl(var(--primary))"
                strokeWidth={2.5}
                dot={{ fill: "hsl(var(--primary))", r: 4 }}
                activeDot={{ r: 6 }}
                name="Curva Granulométrica"
              />

              {/* Pontos característicos D10, D30, D60 */}
              {pontosCaracteristicos.length > 0 && (
                <Scatter
                  data={pontosCaracteristicos}
                  fill="red"
                  shape={(props: any) => {
                    const { cx, cy, payload } = props;
                    return (
                      <g>
                        <circle cx={cx} cy={cy} r={6} fill={payload.color} stroke="white" strokeWidth={2} />
                        <text
                          x={cx}
                          y={cy - 12}
                          textAnchor="middle"
                          fill={payload.color}
                          fontSize={12}
                          fontWeight="bold"
                        >
                          {payload.label}
                        </text>
                      </g>
                    );
                  }}
                  name="Diâmetros Característicos"
                />
              )}

              {/* Linhas de referência para D10, D30, D60 */}
              {d10 && (
                <ReferenceLine
                  x={Math.log10(d10)}
                  stroke="#ef4444"
                  strokeDasharray="5 5"
                  strokeWidth={1}
                  opacity={0.5}
                />
              )}
              {d30 && (
                <ReferenceLine
                  x={Math.log10(d30)}
                  stroke="#f59e0b"
                  strokeDasharray="5 5"
                  strokeWidth={1}
                  opacity={0.5}
                />
              )}
              {d60 && (
                <ReferenceLine
                  x={Math.log10(d60)}
                  stroke="#10b981"
                  strokeDasharray="5 5"
                  strokeWidth={1}
                  opacity={0.5}
                />
              )}
              
              {/* Linhas horizontais para 10%, 30%, 60% */}
              <ReferenceLine y={10} stroke="#999" strokeDasharray="3 3" strokeWidth={1} opacity={0.3} />
              <ReferenceLine y={30} stroke="#999" strokeDasharray="3 3" strokeWidth={1} opacity={0.3} />
              <ReferenceLine y={60} stroke="#999" strokeDasharray="3 3" strokeWidth={1} opacity={0.3} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Legenda dos diâmetros característicos */}
        {pontosCaracteristicos.length > 0 && (
          <div className="mt-4 p-3 rounded-lg bg-muted/50">
            <p className="text-sm font-semibold mb-2">Diâmetros Característicos:</p>
            <div className="grid grid-cols-3 gap-2 text-sm">
              {d10 && (
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <span>D10 = {d10.toFixed(4)} mm</span>
                </div>
              )}
              {d30 && (
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                  <span>D30 = {d30.toFixed(4)} mm</span>
                </div>
              )}
              {d60 && (
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span>D60 = {d60.toFixed(4)} mm</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Zonas de classificação */}
        <div className="mt-4 p-3 rounded-lg bg-muted/50 text-xs">
          <p className="font-semibold mb-2">Limites de Tamanho (ABNT):</p>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <span className="font-medium">Pedregulho:</span> &gt; 4.76 mm
            </div>
            <div>
              <span className="font-medium">Areia:</span> 4.76 - 0.075 mm
            </div>
            <div>
              <span className="font-medium">Finos:</span> &lt; 0.075 mm
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

