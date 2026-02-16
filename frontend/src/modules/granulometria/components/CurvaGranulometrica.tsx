import { memo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Maximize2, Download } from "lucide-react";
import { Line, XAxis, YAxis, CartesianGrid, Tooltip, ComposedChart, ReferenceLine, ReferenceArea } from "recharts";
import html2canvas from "html2canvas";
import { toast } from "@/components/ui/sonner";

import { PontoGranulometrico } from "../schemas";

interface CurvaGranulometricaProps {
  dados: PontoGranulometrico[];
  d10?: number | null;
  d30?: number | null;
  d60?: number | null;
}

// Otimizado com React.memo para evitar re-renders desnecessários
const CurvaGranulometrica = memo(function CurvaGranulometrica({ dados, d10, d30, d60 }: CurvaGranulometricaProps) {
  const [dialogOpen, setDialogOpen] = useState(false);

  // Função para exportar o gráfico como JPG
  const handleExportJPG = async () => {
    try {
      toast.info("Capturando gráfico...");

      const chartElement = document.getElementById('curva-granulometrica-ampliada');
      if (!chartElement) {
        toast.error("Erro ao localizar o gráfico");
        return;
      }

      const canvas = await html2canvas(chartElement, {
        scale: 2,
        backgroundColor: '#ffffff',
        logging: false,
        useCORS: true,
      });

      // Converter para JPG
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.download = `curva_granulometrica_${new Date().toISOString().split('T')[0]}.jpg`;
          link.href = url;
          link.click();
          URL.revokeObjectURL(url);
          toast.success("Gráfico exportado com sucesso!");
        }
      }, 'image/jpeg', 0.95);
    } catch (error) {
      console.error("Erro ao exportar gráfico:", error);
      toast.error("Erro ao exportar o gráfico");
    }
  };

  // Preparar dados para o gráfico (ordenar por abertura crescente para plotagem)
  const dadosGrafico = [...dados]
    .filter(ponto => ponto.abertura > 0) // Filtrar valores inválidos
    .sort((a, b) => a.abertura - b.abertura)
    .map(ponto => ({
      abertura: ponto.abertura,
      aberturaLog: Math.log10(ponto.abertura),
      passante: ponto.porc_passante,
      aberturaFormatada: ponto.abertura >= 1
        ? ponto.abertura.toFixed(1)
        : ponto.abertura.toFixed(3),
    }));

  // Se não há dados, retornar mensagem
  if (dadosGrafico.length === 0) {
    return (
      <div className="p-8 text-center">
        <p className="text-muted-foreground">
          Nenhum dado disponível para plotar a curva granulométrica.
        </p>
      </div>
    );
  }

  // Definir domínio do eixo X (escala logarítmica) dinamicamente baseado nos dados
  const valoresLog = dadosGrafico.map(d => d.aberturaLog).filter(v => isFinite(v));

  if (valoresLog.length === 0) {
    return (
      <div className="p-8 text-center">
        <p className="text-muted-foreground">
          Erro ao calcular escala logarítmica dos dados.
        </p>
      </div>
    );
  }

  const minAberturaLog = Math.floor(Math.min(...valoresLog) - 0.2);
  const maxAberturaLog = Math.ceil(Math.max(...valoresLog) + 0.2);

  // Ticks principais para escala logarítmica (apenas décadas: 0.01, 0.1, 1, 10, etc)
  const gerarTicksPrincipais = () => {
    const ticks = [];
    for (let i = minAberturaLog; i <= maxAberturaLog; i++) {
      ticks.push(i);
    }
    return ticks.length > 0 ? ticks : [-2, -1, 0, 1];
  };
  const ticksX = gerarTicksPrincipais();

  // Grid logarítmico vertical - 10 divisões por década (0.01, 0.02, 0.03...0.09, 0.1)
  const gerarGridLogVertical = () => {
    const gridLines = [];
    for (let decada = minAberturaLog; decada <= maxAberturaLog; decada++) {
      // Adicionar as 10 subdivisões (1, 2, 3, 4, 5, 6, 7, 8, 9, 10)
      for (let subdiv = 1; subdiv <= 9; subdiv++) {
        const valor = decada + Math.log10(subdiv);
        if (valor >= minAberturaLog && valor <= maxAberturaLog) {
          gridLines.push(valor);
        }
      }
    }
    // Adicionar a última linha da última década
    if (maxAberturaLog <= maxAberturaLog) {
      gridLines.push(maxAberturaLog);
    }
    return [...new Set(gridLines)].sort((a, b) => a - b);
  };
  const gridLinesX = gerarGridLogVertical();

  // Função para formatar valores logarítmicos de volta para linear
  const formatarEixoX = (value: number) => {
    const abertura = Math.pow(10, value);
    // Formato mais limpo para as décadas principais
    if (abertura >= 100) return abertura.toFixed(0);
    if (abertura >= 10) return abertura.toFixed(0);
    if (abertura >= 1) return abertura.toFixed(0);
    if (abertura >= 0.1) return abertura.toFixed(1);
    if (abertura >= 0.01) return abertura.toFixed(2);
    return abertura.toFixed(3);
  };

  // Interfaces para o Tooltip do Recharts
  interface TooltipPayload {
    dataKey?: string;
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
      const curveData = payload.find(p => p.dataKey === 'passante');

      if (curveData && curveData.payload) {
        const data = curveData.payload;
        return (
          <div className="bg-background/95 backdrop-blur-sm border rounded-lg shadow-lg p-3">
            <p className="font-semibold text-sm mb-1">
              Diâmetro: {data.aberturaFormatada} mm
            </p>
            <p className="text-sm text-primary">
              % Passante: <span className="font-bold">{data.passante.toFixed(1)}%</span>
            </p>
          </div>
        );
      }
    }
    return null;
  };

  // Componente do gráfico
  const GraficoContent = ({ isDialog = false }: { isDialog?: boolean }) => (
    <ComposedChart
      width={isDialog ? 950 : 1300}
      height={isDialog ? 520 : 380}
      data={dadosGrafico}
      margin={isDialog
        ? { top: 50, right: 40, left: 60, bottom: 80 }
        : { top: 45, right: 30, left: 60, bottom: 50 }
      }
    >
      <defs>
        <linearGradient id="colorCurva" x1="0" y1="0" x2="0" y2="1">
          <stop offset="5%" stopColor="#2563eb" stopOpacity={0.1} />
          <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
        </linearGradient>
      </defs>

      {/* Fundo branco */}
      <rect width="100%" height="100%" fill="white" />

      {/* Fundo amarelo cobrindo toda a área do gráfico */}
      <ReferenceArea
        x1={minAberturaLog}
        x2={maxAberturaLog}
        y1={0}
        y2={100}
        fill="#fef3c7"
        fillOpacity={0.3}
      />

      {/* Grid: horizontal linear, vertical logarítmico */}
      <CartesianGrid
        strokeDasharray="0"
        stroke="#d1d5db"
        strokeWidth={0.8}
        horizontal={true}
        vertical={false}
      />

      {/* Linhas verticais do grid logarítmico */}
      {gridLinesX.map((valor, index) => {
        const ehDecadaPrincipal = Math.abs(valor - Math.round(valor)) < 0.001;
        return (
          <ReferenceLine
            key={`grid-vertical-${index}`}
            x={valor}
            stroke={ehDecadaPrincipal ? "#000000" : "#9ca3af"}
            strokeWidth={ehDecadaPrincipal ? 2 : 1}
            opacity={ehDecadaPrincipal ? 0.8 : 1}
          />
        );
      })}

      {/* Eixo X - Escala Logarítmica */}
      <XAxis
        dataKey="aberturaLog"
        type="number"
        domain={[minAberturaLog, maxAberturaLog]}
        ticks={ticksX}
        tickFormatter={formatarEixoX}
        label={{
          value: 'Diâmetro das partículas (mm)',
          position: 'bottom',
          offset: isDialog ? 5 : 10,
          style: { fontSize: isDialog ? 14 : 13, fontWeight: 600, fill: '#374151' }
        }}
        tick={{ fontSize: isDialog ? 13 : 12, fill: '#6b7280' }}
        stroke="#9ca3af"
        strokeWidth={1}
      />

      {/* Eixo Y - Porcentagem Passante */}
      <YAxis
        domain={[0, 100]}
        ticks={isDialog
          ? [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 100]
          : [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100]
        }
        label={{
          value: '% Passante',
          angle: -90,
          position: 'insideLeft',
          offset: isDialog ? 10 : 5,
          style: { fontSize: isDialog ? 14 : 13, fontWeight: 600, fill: '#374151' }
        }}
        tick={{ fontSize: isDialog ? 13 : 12, fill: '#6b7280' }}
        stroke="#9ca3af"
        strokeWidth={1}
      />

      <Tooltip content={<CustomTooltip />} />

      {/* Área sob a curva */}
      <defs>
        <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
        </linearGradient>
      </defs>

      {/* Linha da curva granulométrica */}
      <Line
        type="monotone"
        dataKey="passante"
        stroke="#065f46"
        strokeWidth={isDialog ? 3 : 2.5}
        dot={{
          fill: "#065f46",
          stroke: "#fff",
          strokeWidth: 2,
          r: isDialog ? 5 : 4
        }}
        activeDot={{
          r: isDialog ? 7 : 6,
          fill: "#065f46",
          stroke: "#fff",
          strokeWidth: 2
        }}
        name=""
      />

      {/* Linhas de delimitação principais (vermelhas grossas) */}
      {/* Limite Argila/Silte: 0.02 mm */}
      {minAberturaLog <= Math.log10(0.02) && Math.log10(0.02) <= maxAberturaLog && (
        <ReferenceLine
          x={Math.log10(0.02)}
          stroke="#dc2626"
          strokeWidth={2.5}
          opacity={0.9}
        />
      )}

      {/* Limite Silte/Areia: 0.06 mm */}
      {minAberturaLog <= Math.log10(0.06) && Math.log10(0.06) <= maxAberturaLog && (
        <ReferenceLine
          x={Math.log10(0.06)}
          stroke="#dc2626"
          strokeWidth={2.5}
          opacity={0.9}
        />
      )}

      {/* Limite Areia/Pedregulho: 2.0 mm */}
      {minAberturaLog <= Math.log10(2.0) && Math.log10(2.0) <= maxAberturaLog && (
        <ReferenceLine
          x={Math.log10(2.0)}
          stroke="#dc2626"
          strokeWidth={2.5}
          opacity={0.9}
        />
      )}

      {/* Limite máximo Pedregulho: 60 mm */}
      {minAberturaLog <= Math.log10(60) && Math.log10(60) <= maxAberturaLog && (
        <ReferenceLine
          x={Math.log10(60)}
          stroke="#dc2626"
          strokeWidth={2.5}
          opacity={0.9}
        />
      )}

      {/* Subdivisões da Areia (linhas vermelhas mais finas) */}
      {/* Areia Fina/Média: 0.2 mm */}
      {minAberturaLog <= Math.log10(0.2) && Math.log10(0.2) <= maxAberturaLog && (
        <ReferenceLine
          x={Math.log10(0.2)}
          stroke="#dc2626"
          strokeWidth={1.5}
          opacity={0.7}
        />
      )}

      {/* Areia Média/Grossa: 0.6 mm */}
      {minAberturaLog <= Math.log10(0.6) && Math.log10(0.6) <= maxAberturaLog && (
        <ReferenceLine
          x={Math.log10(0.6)}
          stroke="#dc2626"
          strokeWidth={1.5}
          opacity={0.7}
        />
      )}

      {/* Labels das frações principais */}
      <>
        {/* Label ARGILA (< 0.02 mm) */}
        {minAberturaLog <= Math.log10(0.02) && (
          <ReferenceLine
            x={(minAberturaLog + Math.log10(0.02)) / 2}
            stroke="transparent"
            label={{
              value: 'ARGILA',
              position: 'top',
              fill: '#dc2626',
              fontSize: isDialog ? 13 : 11,
              fontWeight: 'bold',
              offset: 20
            }}
          />
        )}

        {/* Label SILTE (0.02 - 0.06 mm) */}
        {minAberturaLog <= Math.log10(0.06) && maxAberturaLog >= Math.log10(0.02) && (
          <ReferenceLine
            x={(Math.log10(0.02) + Math.log10(0.06)) / 2}
            stroke="transparent"
            label={{
              value: 'SILTE',
              position: 'top',
              fill: '#dc2626',
              fontSize: isDialog ? 13 : 11,
              fontWeight: 'bold',
              offset: 20
            }}
          />
        )}

        {/* Label AREIA (0.06 - 2.0 mm) */}
        {minAberturaLog <= Math.log10(2.0) && maxAberturaLog >= Math.log10(0.06) && (
          <ReferenceLine
            x={(Math.log10(0.06) + Math.log10(2.0)) / 2}
            stroke="transparent"
            label={{
              value: 'AREIA',
              position: 'top',
              fill: '#dc2626',
              fontSize: isDialog ? 13 : 11,
              fontWeight: 'bold',
              offset: 20
            }}
          />
        )}

        {/* Subdivisões da Areia - Labels (acima do gráfico) */}
        {minAberturaLog <= Math.log10(0.2) && maxAberturaLog >= Math.log10(0.06) && (
          <ReferenceLine
            x={(Math.log10(0.06) + Math.log10(0.2)) / 2}
            stroke="transparent"
            label={{
              value: 'Fina',
              position: 'top',
              fill: '#991b1b',
              fontSize: isDialog ? 11 : 9,
              fontWeight: '600',
              offset: 5
            }}
          />
        )}

        {minAberturaLog <= Math.log10(0.6) && maxAberturaLog >= Math.log10(0.2) && (
          <ReferenceLine
            x={(Math.log10(0.2) + Math.log10(0.6)) / 2}
            stroke="transparent"
            label={{
              value: 'Média',
              position: 'top',
              fill: '#991b1b',
              fontSize: isDialog ? 11 : 9,
              fontWeight: '600',
              offset: 5
            }}
          />
        )}

        {minAberturaLog <= Math.log10(2.0) && maxAberturaLog >= Math.log10(0.6) && (
          <ReferenceLine
            x={(Math.log10(0.6) + Math.log10(2.0)) / 2}
            stroke="transparent"
            label={{
              value: 'Grossa',
              position: 'top',
              fill: '#991b1b',
              fontSize: isDialog ? 11 : 9,
              fontWeight: '600',
              offset: 5
            }}
          />
        )}

        {/* Label PEDREGULHO (2.0 - 60 mm) */}
        {maxAberturaLog >= Math.log10(2.0) && (
          <ReferenceLine
            x={(Math.log10(2.0) + Math.min(maxAberturaLog, Math.log10(60))) / 2}
            stroke="transparent"
            label={{
              value: 'PEDREGULHO',
              position: 'top',
              fill: '#dc2626',
              fontSize: isDialog ? 13 : 11,
              fontWeight: 'bold',
              offset: 20
            }}
          />
        )}
      </>


    </ComposedChart>
  );

  return (
    <div id="curva-granulometrica-chart" className="space-y-4">
      {/* Botões Ampliar e Exportar */}
      <div className="flex justify-end gap-2">
        <Button
          onClick={handleExportJPG}
          variant="outline"
          size="sm"
          className="gap-2"
        >
          <Download className="w-4 h-4" />
          Salvar JPG
        </Button>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <Maximize2 className="w-4 h-4" />
              Ampliar
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-5xl max-h-[90vh] w-full">
            <DialogHeader>
              <DialogTitle>Curva Granulométrica - Visualização Ampliada</DialogTitle>
            </DialogHeader>
            <div className="w-full flex justify-center items-center p-4">
              <GraficoContent isDialog={true} />
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Gráfico ampliado renderizado em background (invisível) para captura */}
      <div
        className="fixed pointer-events-none"
        style={{
          left: '-9999px',
          top: 0,
          width: '1000px', // Largura fixa para o gráfico ampliado
          zIndex: -9999
        }}
      >
        <div id="curva-granulometrica-ampliada" className="bg-white p-4">
          <GraficoContent isDialog={true} />
        </div>
      </div>

      {/* Gráfico */}
      <div className="w-full h-[420px] border rounded-lg overflow-x-auto overflow-y-hidden flex items-center p-2 shadow-sm" style={{ backgroundColor: 'white' }}>
        <GraficoContent isDialog={false} />
      </div>

      {/* Legenda dos diâmetros característicos */}
      <div className="grid grid-cols-2 gap-4">
        {/* Diâmetros característicos */}
        {(d10 || d30 || d60) && (
          <div className="p-4 rounded-lg bg-white dark:bg-gray-900 border shadow-sm">
            <p className="text-sm font-semibold mb-3 text-gray-700 dark:text-gray-300">Diâmetros Característicos</p>
            <div className="space-y-2 text-sm">
              {d10 && (
                <div className="flex items-center gap-3 p-2 rounded-md hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors">
                  <div className="w-4 h-4 rounded-full bg-red-500 shadow-sm"></div>
                  <span className="text-gray-700 dark:text-gray-300"><strong>D10</strong> = {d10.toFixed(4)} mm</span>
                </div>
              )}
              {d30 && (
                <div className="flex items-center gap-3 p-2 rounded-md hover:bg-amber-50 dark:hover:bg-amber-950/30 transition-colors">
                  <div className="w-4 h-4 rounded-full bg-amber-500 shadow-sm"></div>
                  <span className="text-gray-700 dark:text-gray-300"><strong>D30</strong> = {d30.toFixed(4)} mm</span>
                </div>
              )}
              {d60 && (
                <div className="flex items-center gap-3 p-2 rounded-md hover:bg-green-50 dark:hover:bg-green-950/30 transition-colors">
                  <div className="w-4 h-4 rounded-full bg-green-500 shadow-sm"></div>
                  <span className="text-gray-700 dark:text-gray-300"><strong>D60</strong> = {d60.toFixed(4)} mm</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Classificação granulométrica */}
        <div className="p-4 rounded-lg bg-white dark:bg-gray-900 border shadow-sm">
          <p className="text-sm font-semibold mb-3 text-gray-700 dark:text-gray-300">Limites de Tamanho (ABNT)</p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2 rounded-md bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
              <span className="font-semibold text-amber-900 dark:text-amber-300">Argila</span>
              <div className="text-amber-800 dark:text-amber-400 font-medium mt-1">&lt; 0.002 mm</div>
            </div>
            <div className="p-2 rounded-md bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800">
              <span className="font-semibold text-orange-900 dark:text-orange-300">Silte</span>
              <div className="text-orange-800 dark:text-orange-400 font-medium mt-1">0.002-0.06</div>
            </div>
            <div className="p-2 rounded-md bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
              <span className="font-semibold text-yellow-900 dark:text-yellow-300">Areia</span>
              <div className="text-yellow-800 dark:text-yellow-400 font-medium mt-1">0.06-2.0</div>
            </div>
            <div className="p-2 rounded-md bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700">
              <span className="font-semibold text-gray-900 dark:text-gray-300">Pedregulho</span>
              <div className="text-gray-800 dark:text-gray-400 font-medium mt-1">2.0-60 mm</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

export default CurvaGranulometrica;

