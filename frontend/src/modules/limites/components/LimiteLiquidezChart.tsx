import React, { useRef, useState } from 'react';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  ReferenceLine,
  Label,
  Line,
  LineChart,
  ResponsiveContainer,
  ReferenceDot
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Maximize2, Download } from "lucide-react";
import html2canvas from 'html2canvas';
import { toast } from "@/components/ui/sonner";

interface PontoCurva {
  x: number; // log10(num_golpes)
  y: number; // umidade (%)
}

interface LimiteLiquidezChartProps {
  pontos: PontoCurva[];
  ll: number | null;
  isMobile?: boolean;
}

const LimiteLiquidezChart = React.forwardRef<HTMLDivElement, LimiteLiquidezChartProps>(
  ({ pontos, ll, isMobile = false }, ref) => {
    const [dialogOpen, setDialogOpen] = useState(false);
    const chartRef = useRef<HTMLDivElement>(null);

    // Função para exportar como JPG
    const handleExportJPG = async () => {
      const elementToCapture = document.getElementById('limite-liquidez-main');
      if (!elementToCapture) return;

      try {
        toast.info("Capturando gráfico...");

        const canvas = await html2canvas(elementToCapture, {
          backgroundColor: '#ffffff',
          scale: 2,
          logging: false,
          useCORS: true,
        });

        canvas.toBlob((blob) => {
          if (blob) {
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.download = `grafico_limite_liquidez_${new Date().toISOString().split('T')[0]}.jpg`;
            link.href = url;
            link.click();
            URL.revokeObjectURL(url);
            toast.success("Gráfico exportado com sucesso!");
          }
        }, 'image/jpeg', 0.95);
      } catch (error) {
        console.error('Erro ao exportar imagem:', error);
        toast.error("Erro ao exportar o gráfico");
      }
    };

    if (!pontos || pontos.length === 0) {
      return (
        <Card>
          <CardHeader className="pb-2 pt-3">
            <CardTitle className="text-sm">Gráfico - Limite de Liquidez</CardTitle>
            <CardDescription className="text-xs">
              Relação entre número de golpes e teor de umidade
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center h-[300px] p-8 text-center border-2 border-dashed rounded-lg bg-muted/5">
              <p className="text-sm font-medium text-muted-foreground mb-2">
                Dados Insuficientes
              </p>
              <p className="text-xs text-muted-foreground/70 max-w-sm">
                Execute o ensaio de Limite de Liquidez com pelo menos 2 pontos para visualizar o gráfico.
              </p>
            </div>
          </CardContent>
        </Card>
      );
    }

    // Calcular regressão linear para linha de tendência
    const n = pontos.length;
    const sumX = pontos.reduce((sum, p) => sum + p.x, 0);
    const sumY = pontos.reduce((sum, p) => sum + p.y, 0);
    const sumXY = pontos.reduce((sum, p) => sum + p.x * p.y, 0);
    const sumX2 = pontos.reduce((sum, p) => sum + p.x * p.x, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    // Domínios dos dados
    const minLogGolpes = Math.min(...pontos.map(p => p.x));
    const maxLogGolpes = Math.max(...pontos.map(p => p.x));
    const minUmidade = Math.min(...pontos.map(p => p.y));
    const maxUmidade = Math.max(...pontos.map(p => p.y));

    // Converter pontos para formato do gráfico
    const pontosConvertidos = pontos.map(p => ({
      golpes: Math.round(Math.pow(10, p.x)),
      umidade: Number(p.y.toFixed(2))
    }));

    // log10(25) = 1.397940
    const log25 = Math.log10(25);

    // Verificar se algum ponto tem menos de 10 golpes
    const minGolpesReal = Math.min(...pontosConvertidos.map(p => p.golpes));
    const comecaEm1 = minGolpesReal < 10;

    // Criar pontos da linha de regressão - começar no primeiro ponto, não no eixo
    const linhaRegressao = (() => {
      const pontosLinha = [];
      // Começar no primeiro ponto real e ir até o último ponto ou 25 golpes (o que for maior)
      const minX = minLogGolpes;
      const maxX = Math.max(maxLogGolpes, log25);
      const step = (maxX - minX) / 50;

      for (let x = minX; x <= maxX; x += step) {
        const umidade = slope * x + intercept;
        pontosLinha.push({
          golpes: Number(Math.pow(10, x).toFixed(1)),
          umidade: Number(umidade.toFixed(2))
        });
      }
      return pontosLinha;
    })();

    // Ponto do LL (interseção com 25 golpes)
    const pontoLL = ll !== null ? {
      golpes: 25,
      umidade: Number(ll.toFixed(2))
    } : null;

    // Determina os limites dos eixos (dinâmicos)
    const dominioX = (() => {
      // Se tivermos pontos <= 10, começamos em (menor - 1) para dar um respiro.
      let inicio = 10;
      if (minGolpesReal <= 10) {
        inicio = Math.max(1, minGolpesReal - 1);
      }

      const maxGolpes = Math.max(...pontosConvertidos.map(p => p.golpes), 25);
      const fim = Math.ceil(maxGolpes / 10) * 10;
      return [inicio, Math.max(fim, 40)];
    })();

    const dominioY = (() => {
      const umidades = pontosConvertidos.map(p => p.umidade);
      if (ll !== null) umidades.push(ll);
      const maxU = Math.max(...umidades);
      const minU = Math.min(...umidades);
      // Eixo Y inicia ~5 abaixo do menor valor (arredondado para baixo ao múltiplo de 5)
      const inicioY = Math.max(0, Math.floor((minU - 5) / 5) * 5);
      // Próximo múltiplo de 5 acima do máximo
      const fimY = Math.ceil((maxU + 2) / 5) * 5;
      return [inicioY, Math.max(fimY, inicioY + 10)];
    })();

    // Gerar ticks principais para o eixo X (valores logarítmicos importantes)
    const ticksX = (() => {
      const arr: number[] = [];
      const min = dominioX[0];
      const max = dominioX[1];

      // Valores abaixo de 10 (se o domínio permitir)
      if (min < 10) {
        for (let i = min; i < 10; i++) {
          arr.push(i);
        }
      }

      // Múltiplos de 10
      for (let i = 10; i <= max; i += 10) {
        arr.push(i);
      }

      // Sempre incluir 25 como tick (referência normativa)
      if (!arr.includes(25)) {
        arr.push(25);
        arr.sort((a, b) => a - b);
      }
      return arr;
    })();

    // Gerar linhas de grade secundárias logarítmicas para o eixo X
    const gradeSecundariaX = (() => {
      const arr: number[] = [];
      const min = dominioX[0];
      const max = dominioX[1];

      // Década 1-10: Adicionar o que não está nos ticks
      for (let i = 1; i < 10; i++) {
        if (i >= min && !ticksX.includes(i)) arr.push(i);
      }

      // Década 10-100: Adicionar subdivisões (20, 30, 40 etc que não sejam ticks - embora costumem ser)
      // E também subdivisões de 5 (15, 35) para ajudar na leitura logarítmica
      for (let i = 15; i <= max; i += 10) {
        if (!ticksX.includes(i)) arr.push(i);
      }
      for (let i = 10; i <= max; i += 10) {
        // Adiciona linhas extras se faltarem
        [2, 3, 4, 5, 6, 7, 8, 9].forEach(sub => {
          const val = i + (sub * (i / 10)); // Não, isso é para linear. 
          // Para log 10-100 as linhas são 20, 30, 40...
        });
      }

      return arr;
    })();

    // Gerar ticks para o eixo Y (de 5 em 5)
    const ticksY = (() => {
      const arr = [];
      const step = 5;
      for (let i = dominioY[0]; i <= dominioY[1]; i += step) {
        arr.push(i);
      }
      return arr;
    })();

    // Custom tick renderer para destacar o "25" no eixo X
    const CustomXTick = (props: any) => {
      const { x, y, payload } = props;
      const is25 = payload.value === 25;
      return (
        <text
          x={x}
          y={y + 14}
          textAnchor="middle"
          fill={is25 ? '#dc2626' : '#000000'}
          fontWeight={is25 ? 'bold' : 'normal'}
          fontSize={is25 ? (props.fontSize || 12) + 1 : (props.fontSize || 12)}
        >
          {payload.value}
        </text>
      );
    };

    // Componente do gráfico reutilizável
    const ChartContent = ({ isDialog = false, isExport = false }: { isDialog?: boolean; isExport?: boolean }) => {
      const height = isDialog ? 500 : 320;
      const fontSize = isDialog ? 14 : 12;
      const labelFontSize = isDialog ? 16 : 14;

      return (
        <div
          id={isExport ? "limite-liquidez-export" : "limite-liquidez-main"}
          className="bg-white p-4 w-full relative"
        >
          {/* Caixa de Legenda no canto superior direito */}
          <div
            className="absolute z-10 bg-white border-2 border-black"
            style={{
              top: isDialog ? 30 : 15,
              right: isDialog ? 50 : 35,
              padding: isDialog ? '12px 16px' : '8px 12px'
            }}
          >
            {/* Valores do LL */}
            {pontoLL && (
              <div className={`space-y-0.5 ${isDialog ? 'pb-3 mb-3' : 'pb-2 mb-2'} border-b border-gray-400`}>
                <div className="flex justify-between items-center gap-4 text-black" style={{ fontSize: isDialog ? 16 : 12 }}>
                  <span className="font-bold" style={{ fontSize: isDialog ? 20 : 16 }}>LL</span>
                  <span className="font-mono font-semibold">{Math.round(pontoLL.umidade)} %</span>
                </div>
              </div>
            )}

            {/* Legenda */}
            <div className="space-y-0.5 text-black" style={{ fontSize: isDialog ? 11 : 9 }}>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-red-700 border border-white flex-shrink-0" style={{ boxShadow: '0 0 0 1px #b91c1c' }}></div>
                <span>Limite de Liquidez</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-0.5 bg-blue-600 flex-shrink-0"></div>
                <span>Linha de Tendência</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-black flex-shrink-0"></div>
                <span>Pontos do Ensaio</span>
              </div>
              <div className="flex items-center gap-1.5">
                <svg width="16" height="4" className="flex-shrink-0">
                  <line x1="0" y1="2" x2="16" y2="2" stroke="#dc2626" strokeWidth="2" strokeDasharray="3 2" />
                </svg>
                <span>Projeção</span>
              </div>
            </div>
          </div>

          <ResponsiveContainer width="100%" height={height}>
            <LineChart margin={{ top: 20, right: 30, left: 20, bottom: 40 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#000000" opacity={0.1} />

              {/* Linhas de grade secundárias (logarítmicas) */}
              {gradeSecundariaX.map((val) => (
                <ReferenceLine
                  key={`grid-minor-${val}`}
                  x={val}
                  stroke="#000000"
                  strokeOpacity={0.05}
                  strokeWidth={0.5}
                />
              ))}

              <XAxis
                type="number"
                dataKey="golpes"
                domain={dominioX}
                ticks={ticksX}
                stroke="#000000"
                tick={<CustomXTick fontSize={fontSize} />}
                scale="log"
              >
                <Label
                  value="Número de Golpes"
                  position="bottom"
                  offset={isDialog ? 20 : 10}
                  style={{ fontSize: labelFontSize, fontWeight: 'bold', fill: '#000000' }}
                />
              </XAxis>

              <YAxis
                type="number"
                domain={dominioY}
                ticks={ticksY}
                stroke="#000000"
                tick={{ fontSize, fill: '#000000' }}
                tickFormatter={(val) => val.toFixed(0)}
              >
                <Label
                  value="Teor de Umidade (%)"
                  angle={-90}
                  position="insideLeft"
                  offset={10}
                  style={{ fontSize: labelFontSize, fontWeight: 'bold', fill: '#000000', textAnchor: 'middle' }}
                />
              </YAxis>

              {/* Linha de Regressão Linear */}
              <Line
                name="Linha de Tendência"
                data={linhaRegressao}
                type="linear"
                dataKey="umidade"
                stroke="#2563eb"
                strokeWidth={2.5}
                dot={false}
                activeDot={false}
                isAnimationActive={false}
                connectNulls
              />

              {/* Pontos do Ensaio - pretos */}
              <Line
                name="Pontos do Ensaio"
                data={pontosConvertidos}
                type="linear"
                dataKey="umidade"
                stroke="transparent"
                strokeWidth={0}
                dot={{ r: 5, fill: "#000000", stroke: "#fff", strokeWidth: 1 }}
                activeDot={false}
                isAnimationActive={false}
              />

              {/* Linha vertical em 25 golpes (Projeção) */}
              <ReferenceLine
                x={25}
                stroke="#dc2626"
                strokeDasharray="5 5"
                strokeWidth={2}
              />

              {/* Linha horizontal no LL */}
              {ll !== null && (
                <ReferenceLine
                  y={ll}
                  stroke="#dc2626"
                  strokeDasharray="5 5"
                  strokeWidth={2}
                />
              )}

              {/* Ponto do LL - vermelho escuro */}
              {pontoLL && (
                <ReferenceDot
                  x={pontoLL.golpes}
                  y={pontoLL.umidade}
                  r={isDialog ? 6 : 5}
                  fill="#b91c1c"
                  stroke="#ffffff"
                  strokeWidth={1}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      );
    };

    return (
      <div className="space-y-2 relative" ref={ref}>
        {/* Botões Ampliar e Exportar */}
        <div className="flex justify-end items-center mb-2">
          <div className="flex gap-2">
            <Button
              onClick={handleExportJPG}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <Download className="w-4 h-4" />
              Salvar JPG
            </Button>

            {!isMobile && (
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Maximize2 className="w-4 h-4" />
                    Ampliar
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-5xl max-h-[90vh] w-full">
                  <DialogHeader>
                    <DialogTitle>Gráfico - Limite de Liquidez (Ampliado)</DialogTitle>
                  </DialogHeader>
                  <div className="w-full flex justify-center items-center p-2 bg-muted/10 rounded-lg">
                    <div className="w-full max-w-[1200px]">
                      <ChartContent isDialog={true} />
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>

        {/* Gráfico Principal */}
        <div ref={chartRef} className="w-full rounded-xl border border-border shadow-sm overflow-hidden">
          <ChartContent isDialog={false} />
        </div>

        {/* Sobre o Gráfico */}
        <Card className="bg-muted/30 border-none shadow-inner">
          <CardContent className="p-4 space-y-2 text-xs text-muted-foreground">
            <p>
              <strong>Equação da Reta:</strong> w (%) = {slope.toFixed(4)} ⋅ log(N) + {intercept.toFixed(4)}
            </p>
            <p>
              <strong>Regressão Linear:</strong> A linha azul representa a relação linear entre o teor de umidade e o logaritmo do número de golpes.
            </p>
            <p>
              <strong>Limite de Liquidez (LL):</strong> Determinado como o teor de umidade correspondente a 25 golpes (ponto vermelho).
            </p>
            <p>
              <strong>Norma:</strong> NBR 6459/2025 - Solos - Determinação do limite de liquidez.
            </p>
          </CardContent>
        </Card>

        {/* Gráfico Oculto para Exportação */}
        <div style={{ position: 'absolute', left: '-9999px', top: 0, width: '1200px' }} aria-hidden="true">
          <ChartContent isDialog={true} isExport={true} />
        </div>
      </div>
    );
  }
);

LimiteLiquidezChart.displayName = 'LimiteLiquidezChart';

export default LimiteLiquidezChart;
