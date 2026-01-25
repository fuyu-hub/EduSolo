import React, { useRef, useState } from 'react';
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
  ReferenceLine,
  Label,
  Line,
  ComposedChart
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
      const elementToCapture = document.getElementById('limite-liquidez-ampliado');
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
    // Onde x = log(golpes) e y = umidade
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

    // Criar pontos da linha de tendência limitados ao range dos dados
    const numPontosLinha = 50;
    const stepX = (maxLogGolpes - minLogGolpes) / numPontosLinha;
    const linhaRegressao = [];
    for (let i = 0; i <= numPontosLinha; i++) {
      const x = minLogGolpes + i * stepX;
      const y = slope * x + intercept;

      // Adicionar apenas se estiver dentro do range de umidade
      if (y >= minUmidade - 1 && y <= maxUmidade + 1) {
        linhaRegressao.push({
          x: x,
          y: y
        });
      }
    }

    // Preparar dados separadamente
    const pontosDados = pontos.map(p => ({
      x: p.y, // umidade no eixo X
      y: p.x, // log(golpes) no eixo Y
      golpes: Math.round(Math.pow(10, p.x)),
      umidade: p.y
    }));

    const linhaDados = linhaRegressao.map(p => ({
      x: p.y, // umidade no eixo X
      yLinha: p.x // log(golpes) no eixo Y
    }));

    // log10(25) = 1.397940
    const log25 = Math.log10(25);

    // Componente do gráfico reutilizável
    const ChartContent = ({ isDialog = false }: { isDialog?: boolean }) => {
      const chartWidth = isDialog ? 1150 : (isMobile ? 340 : 450);
      const chartHeight = isDialog ? 580 : 280;
      const fontSize = isDialog ? 14 : 12;
      const labelFontSize = isDialog ? 16 : 14;

      // Domínios invertidos (umidade no X, log golpes no Y)
      const minUmidadeChart = minUmidade - 2;
      const maxUmidadeChart = maxUmidade + 2;
      const minLogGolpesChart = minLogGolpes - 0.05;
      const maxLogGolpesChart = maxLogGolpes + 0.05;

      return (
        <div style={{ width: chartWidth, height: chartHeight }}>
          <ComposedChart
            width={chartWidth}
            height={chartHeight}
            data={linhaDados}
            margin={isDialog
              ? { top: 40, right: 40, bottom: 80, left: 80 }
              : { top: 20, right: 20, bottom: 60, left: 20 }
            }
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#000000" opacity={1} />

            <XAxis
              dataKey="x"
              type="number"
              domain={[minUmidadeChart, maxUmidadeChart]}
              tick={{ fontSize, fill: '#000000' }}
              stroke="#000000"
              tickFormatter={(value) => value.toFixed(1)}
            >
              <Label
                value="Teor de Umidade (%)"
                position="bottom"
                offset={isDialog ? 40 : 30}
                style={{ fontSize: labelFontSize, fontWeight: 'bold', fill: '#000000' }}
              />
            </XAxis>

            <YAxis
              type="number"
              domain={[minLogGolpesChart, maxLogGolpesChart]}
              tick={{ fontSize, fill: '#000000' }}
              stroke="#000000"
              tickFormatter={(value) => Math.round(Math.pow(10, value)).toString()}
            >
              <Label
                value="Número de Golpes"
                angle={-90}
                position="insideLeft"
                offset={isDialog ? -10 : 0}
                style={{ fontSize: labelFontSize, fontWeight: 'bold', fill: '#000000', textAnchor: 'middle' }}
              />
            </YAxis>

            <Legend
              verticalAlign="top"
              height={36}
              iconType="circle"
              wrapperStyle={{ fontSize, color: '#000000' }}
            />

            {/* Linha de tendência (regressão linear) */}
            <Line
              type="monotone"
              dataKey="yLinha"
              stroke="#2563eb"
              strokeWidth={2}
              dot={false}
              name="Linha de Tendência"
              connectNulls={false}
            />

            {/* Pontos do ensaio */}
            <Scatter
              data={pontosDados}
              dataKey="y"
              fill="#dc2626"
              name="Pontos do Ensaio"
              shape={(props: any) => {
                const { cx, cy } = props;
                return (
                  <g>
                    <circle cx={cx} cy={cy} r={5} fill="#dc2626" stroke="#ffffff" strokeWidth={2} />
                  </g>
                );
              }}
            />

            {/* Linha vertical no LL */}
            {ll !== null && (
              <ReferenceLine
                x={ll}
                stroke="#22c55e"
                strokeDasharray="5 5"
                strokeWidth={2}
                label={{
                  value: `LL = ${ll.toFixed(1)}%`,
                  position: 'top',
                  fill: '#22c55e',
                  fontSize,
                  fontWeight: 'bold'
                }}
              />
            )}
          </ComposedChart>
        </div>
      );
    };

    return (
      <div className="space-y-2 relative" ref={ref}>
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

          {!isMobile && (
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Maximize2 className="w-4 h-4" />
                  Ampliar
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-[95vw] max-h-[95vh] w-full">
                <DialogHeader>
                  <DialogTitle>Gráfico - Limite de Liquidez (Ampliado)</DialogTitle>
                </DialogHeader>
                <div className="w-full flex justify-center items-center p-2">
                  <div className="bg-white p-4 rounded-xl border border-border shadow-sm">
                    <ChartContent isDialog={true} />
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* Gráfico ampliado renderizado em background (invisível) para captura */}
        <div
          className="fixed pointer-events-none"
          style={{
            left: '-9999px',
            top: 0,
            width: '1240px',
            zIndex: -9999
          }}
        >
          <div id="limite-liquidez-ampliado" className="bg-white p-4">
            <ChartContent isDialog={true} />
          </div>
        </div>

        {/* Gráfico principal */}
        <div ref={chartRef} className="bg-white p-4 rounded-xl border border-border shadow-sm w-full overflow-x-auto">
          <div className="flex items-center justify-center min-w-[350px]">
            <ChartContent isDialog={false} />
          </div>
        </div>

        {/* Informações adicionais */}
        <Card>
          <CardHeader className="pb-2 pt-3">
            <CardTitle className="text-sm">Sobre o Gráfico</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 pb-3">
            <div className="space-y-2 text-xs text-muted-foreground">
              <p>
                <strong>Equação da Reta:</strong> h = {slope.toFixed(4)} ⋅ log(N) + {intercept.toFixed(4)}
              </p>
              <p>
                <strong>Regressão Linear:</strong> A linha azul representa a relação linear entre o teor de umidade e o logaritmo do número de golpes.
              </p>
              <p>
                <strong>Limite de Liquidez (LL):</strong> Determinado como o teor de umidade correspondente a 25 golpes (linha verde tracejada).
              </p>
              <p>
                <strong>Norma:</strong> NBR 6459 - Solo - Determinação do Limite de Liquidez.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
);

LimiteLiquidezChart.displayName = 'LimiteLiquidezChart';

export default LimiteLiquidezChart;
