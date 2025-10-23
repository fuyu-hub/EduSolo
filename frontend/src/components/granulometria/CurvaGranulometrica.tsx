import { memo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine, Area, ComposedChart, Scatter, ReferenceArea } from "recharts";

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

// Definições das zonas granulométricas (em mm)
const ZONAS_GRANULOMETRICAS = {
  argila: { min: 0.001, max: 0.002, label: 'ARGILA', cor: '#8B4513' },
  silteFina: { min: 0.002, max: 0.006, label: 'Fina', cor: '#CD853F' },
  silteMedia: { min: 0.006, max: 0.02, label: 'Média', cor: '#D2691E' },
  silteGrossa: { min: 0.02, max: 0.06, label: 'Grossa', cor: '#A0522D' },
  silte: { min: 0.002, max: 0.06, label: 'SILTE' },
  areiaFina: { min: 0.06, max: 0.2, label: 'Fina', cor: '#DAA520' },
  areiaMedia: { min: 0.2, max: 0.6, label: 'Média', cor: '#F4A460' },
  areiaGrossa: { min: 0.6, max: 2.0, label: 'Grossa', cor: '#DEB887' },
  areia: { min: 0.06, max: 2.0, label: 'AREIA' },
  pedregulhoFino: { min: 2.0, max: 6.0, label: 'Fino', cor: '#A9A9A9' },
  pedregulhoMedio: { min: 6.0, max: 20.0, label: 'Médio', cor: '#808080' },
  pedregulhoGrosso: { min: 20.0, max: 60.0, label: 'Grosso', cor: '#696969' },
  pedregulho: { min: 2.0, max: 60.0, label: 'PEDREGULHO' }
};

// Otimizado com React.memo para evitar re-renders desnecessários
const CurvaGranulometrica = memo(function CurvaGranulometrica({ dados, d10, d30, d60 }: CurvaGranulometricaProps) {
  
  // Preparar dados para o gráfico (ordenar por abertura crescente para plotagem)
  const dadosGrafico = [...dados]
    .sort((a, b) => a.abertura - b.abertura)
    .map(ponto => ({
      abertura: ponto.abertura,
      aberturaLog: Math.log10(ponto.abertura),
      passante: ponto.porc_passante,
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
      color: '#ef4444'
    });
  }
  if (d30) {
    pontosCaracteristicos.push({
      abertura: d30,
      aberturaLog: Math.log10(d30),
      passante: 30,
      label: 'D30',
      color: '#f59e0b'
    });
  }
  if (d60) {
    pontosCaracteristicos.push({
      abertura: d60,
      aberturaLog: Math.log10(d60),
      passante: 60,
      label: 'D60',
      color: '#10b981'
    });
  }

  // Definir domínio do eixo X (escala logarítmica)
  const minAbertura = Math.min(...dadosGrafico.map(d => d.aberturaLog), -3);
  const maxAbertura = Math.max(...dadosGrafico.map(d => d.aberturaLog), 2);

  // Função para formatar valores logarítmicos de volta para linear
  const formatarEixoX = (value: number) => {
    const abertura = Math.pow(10, value);
    if (abertura >= 10) return abertura.toFixed(0);
    if (abertura >= 1) return abertura.toFixed(1);
    if (abertura >= 0.01) return abertura.toFixed(2);
    return abertura.toFixed(3);
  };

  // Interfaces para o Tooltip do Recharts
  interface TooltipPayload {
    payload: {
      aberturaFormatada: string;
      passante: number;
    };
  }

  interface CustomTooltipProps {
    active?: boolean;
    payload?: TooltipPayload[];
  }

  // Tooltip customizado
  const CustomTooltip = ({ active, payload }: CustomTooltipProps) => {
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

  // Componente customizado para renderizar as zonas e labels
  const CustomizedAxisLabel = () => {
    return (
      <g>
        {/* Labels das zonas principais */}
        <text x="5%" y="30" textAnchor="middle" fill="#8B4513" fontSize="11" fontWeight="600">
          {ZONAS_GRANULOMETRICAS.argila.label}
        </text>
        <text x="15%" y="30" textAnchor="middle" fill="#CD853F" fontSize="12" fontWeight="700">
          {ZONAS_GRANULOMETRICAS.silte.label}
        </text>
        <text x="40%" y="30" textAnchor="middle" fill="#DAA520" fontSize="12" fontWeight="700">
          {ZONAS_GRANULOMETRICAS.areia.label}
        </text>
        <text x="75%" y="30" textAnchor="middle" fill="#808080" fontSize="12" fontWeight="700">
          {ZONAS_GRANULOMETRICAS.pedregulho.label}
        </text>
        
        {/* Sub-labels */}
        <text x="10%" y="45" textAnchor="middle" fill="#CD853F" fontSize="9">
          {ZONAS_GRANULOMETRICAS.silteFina.label}
        </text>
        <text x="15%" y="45" textAnchor="middle" fill="#D2691E" fontSize="9">
          {ZONAS_GRANULOMETRICAS.silteMedia.label}
        </text>
        <text x="20%" y="45" textAnchor="middle" fill="#A0522D" fontSize="9">
          {ZONAS_GRANULOMETRICAS.silteGrossa.label}
        </text>
        
        <text x="30%" y="45" textAnchor="middle" fill="#DAA520" fontSize="9">
          {ZONAS_GRANULOMETRICAS.areiaFina.label}
        </text>
        <text x="40%" y="45" textAnchor="middle" fill="#F4A460" fontSize="9">
          {ZONAS_GRANULOMETRICAS.areiaMedia.label}
        </text>
        <text x="50%" y="45" textAnchor="middle" fill="#DEB887" fontSize="9">
          {ZONAS_GRANULOMETRICAS.areiaGrossa.label}
        </text>
        
        <text x="65%" y="45" textAnchor="middle" fill="#A9A9A9" fontSize="9">
          {ZONAS_GRANULOMETRICAS.pedregulhoFino.label}
        </text>
        <text x="75%" y="45" textAnchor="middle" fill="#808080" fontSize="9">
          {ZONAS_GRANULOMETRICAS.pedregulhoMedio.label}
        </text>
        <text x="88%" y="45" textAnchor="middle" fill="#696969" fontSize="9">
          {ZONAS_GRANULOMETRICAS.pedregulhoGrosso.label}
        </text>
      </g>
    );
  };

  return (
    <div id="curva-granulometrica-chart">
      <Card className="glass border-2">
        <CardHeader className="pb-2">
          <div className="text-center">
            <CardTitle className="text-base font-bold uppercase tracking-wide mb-0.5">
              Curva Granulométrica
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Distribuição do tamanho das partículas (NBR 7181)
            </p>
          </div>
        </CardHeader>
        <CardContent className="pb-3">
          <div className="w-full h-[380px] relative">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={dadosGrafico}
              margin={{ top: 45, right: 20, left: 15, bottom: 45 }}
            >
              <defs>
                <linearGradient id="colorPassante" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0.05}/>
                </linearGradient>
              </defs>
              
              {/* Grid mais visível */}
              <CartesianGrid 
                strokeDasharray="2 2" 
                stroke="#999" 
                opacity={0.4}
                verticalPoints={[
                  Math.log10(0.002), Math.log10(0.006), Math.log10(0.02), Math.log10(0.06),
                  Math.log10(0.2), Math.log10(0.6), Math.log10(2.0),
                  Math.log10(6.0), Math.log10(20.0), Math.log10(60.0)
                ]}
              />
              
              {/* Linhas verticais vermelhas separando as zonas */}
              <ReferenceLine x={Math.log10(0.002)} stroke="#dc2626" strokeWidth={2} />
              <ReferenceLine x={Math.log10(0.06)} stroke="#dc2626" strokeWidth={2} />
              <ReferenceLine x={Math.log10(0.2)} stroke="#dc2626" strokeWidth={2} />
              <ReferenceLine x={Math.log10(0.6)} stroke="#dc2626" strokeWidth={2} />
              <ReferenceLine x={Math.log10(2.0)} stroke="#dc2626" strokeWidth={2} />
              <ReferenceLine x={Math.log10(6.0)} stroke="#dc2626" strokeWidth={2} />
              <ReferenceLine x={Math.log10(20.0)} stroke="#dc2626" strokeWidth={2} />
              <ReferenceLine x={Math.log10(60.0)} stroke="#dc2626" strokeWidth={2} />
              
              {/* Sub-divisões (linhas mais finas) */}
              <ReferenceLine x={Math.log10(0.006)} stroke="#dc2626" strokeWidth={1.5} opacity={0.6} />
              <ReferenceLine x={Math.log10(0.02)} stroke="#dc2626" strokeWidth={1.5} opacity={0.6} />
              
              <XAxis
                dataKey="aberturaLog"
                type="number"
                domain={[minAbertura, maxAbertura]}
                ticks={[-3, -2.7, -2.5, -2, -1.7, -1.5, -1, -0.7, -0.5, 0, 0.3, 0.5, 0.8, 1, 1.3, 1.5, 1.8]}
                tickFormatter={formatarEixoX}
                label={{ 
                  value: 'Diâmetro dos grãos (mm)', 
                  position: 'bottom',
                  offset: 30,
                  style: { fontSize: '11px', fontWeight: 600 }
                }}
                tick={{ fontSize: 9 }}
                height={60}
              />
              
              <YAxis
                domain={[0, 100]}
                ticks={[0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100]}
                label={{ 
                  value: '% Passante', 
                  angle: -90, 
                  position: 'insideLeft',
                  style: { fontSize: '11px', fontWeight: 600 }
                }}
                tick={{ fontSize: 9 }}
              />
              
              <Tooltip content={<CustomTooltip />} />

              {/* Área sob a curva */}
              <Area
                type="monotone"
                dataKey="passante"
                fill="url(#colorPassante)"
                stroke="none"
                name="Área"
                legendType="none"
              />
              
              {/* Linha principal - verde como na imagem */}
              <Line
                type="monotone"
                dataKey="passante"
                stroke="#22c55e"
                strokeWidth={3}
                dot={{ fill: "#22c55e", r: 3 }}
                activeDot={{ r: 6 }}
                name="Curva da Brita"
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
                        <circle cx={cx} cy={cy} r={7} fill={payload.color} stroke="white" strokeWidth={2} />
                        <text
                          x={cx}
                          y={cy - 14}
                          textAnchor="middle"
                          fill={payload.color}
                          fontSize={13}
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
                  strokeDasharray="4 4"
                  strokeWidth={1.5}
                  opacity={0.6}
                />
              )}
              {d30 && (
                <ReferenceLine
                  x={Math.log10(d30)}
                  stroke="#f59e0b"
                  strokeDasharray="4 4"
                  strokeWidth={1.5}
                  opacity={0.6}
                />
              )}
              {d60 && (
                <ReferenceLine
                  x={Math.log10(d60)}
                  stroke="#10b981"
                  strokeDasharray="4 4"
                  strokeWidth={1.5}
                  opacity={0.6}
                />
              )}
              
              {/* Linhas horizontais para porcentagens */}
              <ReferenceLine y={10} stroke="#999" strokeDasharray="3 3" strokeWidth={1} opacity={0.3} />
              <ReferenceLine y={30} stroke="#999" strokeDasharray="3 3" strokeWidth={1} opacity={0.3} />
              <ReferenceLine y={60} stroke="#999" strokeDasharray="3 3" strokeWidth={1} opacity={0.3} />
            </ComposedChart>
          </ResponsiveContainer>
          
          {/* Labels das zonas - Renderizado fora do gráfico para melhor controle */}
          <div className="absolute top-0 left-0 right-0 h-11 flex items-center justify-around px-8">
            <div className="flex-1 text-center">
              <div className="text-[10px] font-bold text-amber-900 dark:text-amber-700">ARGILA</div>
            </div>
            <div className="flex-[2] text-center border-l-2 border-r-2 border-red-600">
              <div className="text-xs font-bold text-orange-800 dark:text-orange-600">SILTE</div>
              <div className="text-[8px] text-orange-700 dark:text-orange-500 flex justify-around mt-0.5">
                <span>Fina</span>
                <span>Média</span>
                <span>Grossa</span>
              </div>
            </div>
            <div className="flex-[3] text-center border-r-2 border-red-600">
              <div className="text-xs font-bold text-yellow-700 dark:text-yellow-600">AREIA</div>
              <div className="text-[8px] text-yellow-600 dark:text-yellow-500 flex justify-around mt-0.5">
                <span>Fina</span>
                <span>Média</span>
                <span>Grossa</span>
              </div>
            </div>
            <div className="flex-[3] text-center">
              <div className="text-xs font-bold text-gray-700 dark:text-gray-400">PEDREGULHO</div>
              <div className="text-[8px] text-gray-600 dark:text-gray-500 flex justify-around mt-0.5">
                <span>Fino</span>
                <span>Médio</span>
                <span>Grosso</span>
              </div>
            </div>
          </div>
        </div>

        {/* Legenda */}
        <div className="mt-4 grid grid-cols-2 gap-3">
          {/* Diâmetros característicos */}
          {pontosCaracteristicos.length > 0 && (
            <div className="p-3 rounded-lg bg-muted/50 border">
              <p className="text-sm font-semibold mb-2">Diâmetros Característicos:</p>
              <div className="space-y-1.5 text-xs">
                {d10 && (
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <span><strong>D10</strong> = {d10.toFixed(4)} mm</span>
                  </div>
                )}
                {d30 && (
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                    <span><strong>D30</strong> = {d30.toFixed(4)} mm</span>
                  </div>
                )}
                {d60 && (
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    <span><strong>D60</strong> = {d60.toFixed(4)} mm</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Classificação granulométrica */}
          <div className="p-3 rounded-lg bg-muted/50 border">
            <p className="text-sm font-semibold mb-2">Limites de Tamanho (ABNT):</p>
            <div className="grid grid-cols-2 gap-1.5 text-xs">
              <div className="p-1.5 rounded bg-amber-100 dark:bg-amber-900/30">
                <span className="font-semibold text-amber-900 dark:text-amber-300">Argila:</span>
                <div className="text-amber-800 dark:text-amber-400 font-medium">&lt; 0.002</div>
              </div>
              <div className="p-1.5 rounded bg-orange-100 dark:bg-orange-900/30">
                <span className="font-semibold text-orange-900 dark:text-orange-300">Silte:</span>
                <div className="text-orange-800 dark:text-orange-400 font-medium">0.002-0.06</div>
              </div>
              <div className="p-1.5 rounded bg-yellow-100 dark:bg-yellow-900/30">
                <span className="font-semibold text-yellow-900 dark:text-yellow-300">Areia:</span>
                <div className="text-yellow-800 dark:text-yellow-400 font-medium">0.06-2.0</div>
              </div>
              <div className="p-1.5 rounded bg-gray-200 dark:bg-gray-800">
                <span className="font-semibold text-gray-900 dark:text-gray-300">Pedregulho:</span>
                <div className="text-gray-800 dark:text-gray-400 font-medium">2.0-60 mm</div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
    </div>
  );
});

export default CurvaGranulometrica;

