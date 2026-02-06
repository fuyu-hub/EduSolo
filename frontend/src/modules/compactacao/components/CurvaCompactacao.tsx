import { memo, useState, useRef, forwardRef, useImperativeHandle } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Maximize2, Download } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Scatter, ReferenceDot, Label, Legend } from "recharts";
import html2canvas from "html2canvas";
import { toast } from "@/components/ui/sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

interface PontoCurva {
  umidade: number;
  peso_especifico_seco: number;
}

interface CurvaCompactacaoProps {
  pontosEnsaio: PontoCurva[];
  umidadeOtima?: number;
  gamaSecoMax?: number;
  pontosSaturacao?: PontoCurva[];
}

export interface CurvaCompactacaoRef {
  exportAsJPG: () => Promise<void>;
  getImageForExport: () => Promise<string | null>;
}

const CurvaCompactacao = forwardRef<CurvaCompactacaoRef, CurvaCompactacaoProps>(
  ({ pontosEnsaio, umidadeOtima, gamaSecoMax, pontosSaturacao }, ref) => {
    const [dialogOpen, setDialogOpen] = useState(false);
    const chartRef = useRef<HTMLDivElement>(null);

    // Converte γd de kN/m³ para g/cm³ para exibição
    const pontosConvertidos = pontosEnsaio.map(p => ({
      umidade: Number(p.umidade.toFixed(2)),
      gamaSeco: Number((p.peso_especifico_seco / 10).toFixed(3))
    }));

    const pontosSaturacaoConvertidos = (pontosSaturacao || []).map(p => ({
      umidade: Number(p.umidade.toFixed(2)),
      gamaSeco: Number((p.peso_especifico_seco / 10).toFixed(3))
    }));

    const pontoOtimo = (umidadeOtima !== undefined && gamaSecoMax !== undefined) ? {
      umidade: Number(umidadeOtima.toFixed(2)),
      gamaSeco: Number((gamaSecoMax / 10).toFixed(3))
    } : null;

    // Regressão quadrática: y = ax² + bx + c
    const calcularRegressaoQuadratica = (pontos: { umidade: number; gamaSeco: number }[]) => {
      if (pontos.length < 3) return null;

      const n = pontos.length;
      let sumX = 0, sumX2 = 0, sumX3 = 0, sumX4 = 0;
      let sumY = 0, sumXY = 0, sumX2Y = 0;

      for (const p of pontos) {
        const x = p.umidade;
        const y = p.gamaSeco;
        const x2 = x * x;
        sumX += x;
        sumX2 += x2;
        sumX3 += x2 * x;
        sumX4 += x2 * x2;
        sumY += y;
        sumXY += x * y;
        sumX2Y += x2 * y;
      }

      // Sistema de equações normais para regressão quadrática
      const A = [
        [n, sumX, sumX2],
        [sumX, sumX2, sumX3],
        [sumX2, sumX3, sumX4]
      ];
      const B = [sumY, sumXY, sumX2Y];

      // Resolver usando eliminação gaussiana
      for (let i = 0; i < 3; i++) {
        let maxRow = i;
        for (let k = i + 1; k < 3; k++) {
          if (Math.abs(A[k][i]) > Math.abs(A[maxRow][i])) maxRow = k;
        }
        [A[i], A[maxRow]] = [A[maxRow], A[i]];
        [B[i], B[maxRow]] = [B[maxRow], B[i]];

        for (let k = i + 1; k < 3; k++) {
          const factor = A[k][i] / A[i][i];
          for (let j = i; j < 3; j++) {
            A[k][j] -= factor * A[i][j];
          }
          B[k] -= factor * B[i];
        }
      }

      const coef = [0, 0, 0];
      for (let i = 2; i >= 0; i--) {
        coef[i] = B[i];
        for (let j = i + 1; j < 3; j++) {
          coef[i] -= A[i][j] * coef[j];
        }
        coef[i] /= A[i][i];
      }

      return { c: coef[0], b: coef[1], a: coef[2] }; // y = ax² + bx + c
    };

    // Gerar pontos da curva de regressão
    const regressao = calcularRegressaoQuadratica(pontosConvertidos);
    const pontosRegressao = (() => {
      if (!regressao || pontosConvertidos.length < 3) return pontosConvertidos;

      const { a, b, c } = regressao;
      const umidades = pontosConvertidos.map(p => p.umidade);
      const minU = Math.min(...umidades) - 1;
      const maxU = Math.max(...umidades) + 1;
      const step = (maxU - minU) / 50;

      const pontos = [];
      for (let x = minU; x <= maxU; x += step) {
        const y = a * x * x + b * x + c;
        pontos.push({ umidade: Number(x.toFixed(2)), gamaSeco: Number(y.toFixed(3)) });
      }
      return pontos;
    })();

    // Determina os limites dos eixos
    const dominioX = (() => {
      if (pontosConvertidos.length === 0) return [0, 40];
      const umidades = pontosConvertidos.map(p => p.umidade);
      if (pontosSaturacaoConvertidos.length > 0) {
        umidades.push(...pontosSaturacaoConvertidos.map(p => p.umidade));
      }
      const minU = Math.min(...umidades);
      const maxU = Math.max(...umidades);
      const margem = (maxU - minU) * 0.15 || 5;
      return [Math.max(0, minU - margem), maxU + margem];
    })();

    const dominioY = (() => {
      if (pontosConvertidos.length === 0) return [1.0, 2.2];
      const gamas = pontosConvertidos.map(p => p.gamaSeco);
      if (pontosSaturacaoConvertidos.length > 0) {
        gamas.push(...pontosSaturacaoConvertidos.map(p => p.gamaSeco));
      }
      const minG = Math.min(...gamas);
      const maxG = Math.max(...gamas);
      const margem = (maxG - minG) * 0.15 || 0.1;
      return [Math.max(1.0, minG - margem), maxG + margem];
    })();

    // Gerar ticks personalizados
    const ticksX = (() => {
      const arr = [];
      const start = Math.ceil(dominioX[0]);
      const end = Math.floor(dominioX[1]);
      for (let i = start; i <= end; i++) {
        arr.push(i);
      }
      return arr;
    })();

    const ticksY = (() => {
      const arr = [];
      const start = Math.ceil(dominioY[0] * 100);
      const end = Math.floor(dominioY[1] * 100);
      for (let i = start; i <= end; i++) {
        arr.push(Number((i / 100).toFixed(2)));
      }
      return arr;
    })();

    // Função para exportar como JPG
    const handleExportJPG = async () => {
      // Capturar o elemento específico de exportação (versão expandida oculta)
      const element = document.getElementById('chart-export-container');
      if (!element) return;

      try {
        toast.info("Capturando gráfico...");

        const canvas = await html2canvas(element, {
          backgroundColor: '#ffffff', // Força fundo branco na exportação
          scale: 2,
          logging: false,
        });

        const image = canvas.toDataURL('image/jpeg', 0.95);

        const link = document.createElement('a');
        link.href = image;
        link.download = `curva-compactacao-${Date.now()}.jpg`;
        link.click();

        toast.success("Gráfico exportado com sucesso!");
      } catch (error) {
        console.error('Erro ao exportar imagem:', error);
        toast.error("Erro ao exportar o gráfico");
      }
    };

    // Função para obter imagem para exportação (sem download)
    const getImageForExport = async (): Promise<string | null> => {
      const element = document.getElementById('chart-capture-container');
      if (!element) return null;

      try {
        const canvas = await html2canvas(element, {
          backgroundColor: '#ffffff',
          scale: 2,
          logging: false,
        });

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

    if (pontosConvertidos.length === 0) {
      return (
        <Card>
          <CardHeader className="pb-2 pt-3">
            <CardTitle className="text-sm">Gráfico - Curva de Compactação</CardTitle>
            <CardDescription className="text-xs">
              Relação entre umidade e densidade do solo
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center h-[300px] p-8 text-center border-2 border-dashed rounded-lg bg-muted/5">
              <p className="text-sm font-medium text-muted-foreground mb-2">
                Dados Insuficientes
              </p>
              <p className="text-xs text-muted-foreground/70 max-w-sm">
                Preencha os dados do ensaio para visualizar a curva.
              </p>
            </div>
          </CardContent>
        </Card>
      );
    }

    // Componente do gráfico reutilizável
    const ChartContent = ({ isDialog = false, isExport = false }: { isDialog?: boolean; isExport?: boolean }) => {
      const height = isDialog ? 500 : 320;
      const fontSize = isDialog ? 14 : 12;
      const labelFontSize = isDialog ? 16 : 14;

      return (
        <div
          id={isExport ? "chart-export-container" : (isDialog || !dialogOpen ? "chart-capture-container" : undefined)}
          className={`bg-white p-4 w-full relative ${isExport ? '' : 'rounded-xl border border-border shadow-sm'}`}
        >
          {/* Caixa de Resultados no canto superior direito */}
          {pontoOtimo && (
            <div
              className="absolute z-10 bg-white border-2 border-black"
              style={{
                top: isDialog ? 30 : 15,
                right: isDialog ? 50 : 35,
                padding: isDialog ? '12px 16px' : '8px 12px'
              }}
            >
              {/* Valores Ótimos */}
              <div className={`space-y-0.5 pb-2 border-b border-gray-400 ${isDialog ? 'mb-3' : 'mb-2'}`}>
                <div className="flex justify-between items-center gap-4 text-black" style={{ fontSize: isDialog ? 16 : 12 }}>
                  <span className="font-bold"><span className="font-serif italic" style={{ fontSize: isDialog ? 20 : 16 }}>w</span><sub style={{ fontSize: isDialog ? 10 : 8 }}>ót</sub></span>
                  <span className="font-mono font-semibold">{pontoOtimo.umidade} %</span>
                </div>
                <div className="flex justify-between items-center gap-4 text-black" style={{ fontSize: isDialog ? 16 : 12 }}>
                  <span className="font-bold"><span className="font-serif italic" style={{ fontSize: isDialog ? 20 : 16 }}>ρ</span><sub style={{ fontSize: isDialog ? 10 : 8 }}>d,máx</sub></span>
                  <span className="font-mono font-semibold">{pontoOtimo.gamaSeco} g/cm³</span>
                </div>
              </div>

              {/* Legenda */}
              <div className="space-y-0.5 text-black" style={{ fontSize: isDialog ? 11 : 9 }}>
                <div className="flex items-center gap-1.5">
                  <div className="w-4 h-0.5 bg-blue-600"></div>
                  <span>Curva de Compactação</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-black"></div>
                  <span>Pontos do Ensaio</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-red-700"></div>
                  <span>Ponto Ótimo</span>
                </div>
                {pontosSaturacaoConvertidos.length > 0 && (
                  <div className="flex items-center gap-1.5">
                    <svg width="16" height="4" className="flex-shrink-0">
                      <line x1="0" y1="2" x2="16" y2="2" stroke="black" strokeWidth="2" strokeDasharray="3 2" />
                    </svg>
                    <span>Saturação (S=100%)</span>
                  </div>
                )}
              </div>
            </div>
          )}

          <ResponsiveContainer width="100%" height={height}>
            <LineChart margin={{ top: 20, right: 30, left: 20, bottom: 40 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#000000" opacity={0.1} />

              <XAxis
                type="number"
                dataKey="umidade"
                domain={dominioX}
                ticks={ticksX}
                stroke="#000000"
                tick={{ fontSize, fill: '#000000' }}
                tickFormatter={(val) => val.toFixed(1)}
              >
                <Label
                  value="Teor de Umidade (%)"
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
                tickFormatter={(val) => val.toFixed(2)}
              >
                <Label
                  value="Densidade Seca (g/cm³)"
                  angle={-90}
                  position="insideLeft"
                  offset={10}
                  style={{ fontSize: labelFontSize, fontWeight: 'bold', fill: '#000000', textAnchor: 'middle' }}
                />
              </YAxis>

              {/* Curva de Compactação - Regressão Quadrática */}
              <Line
                name="Curva de Compactação"
                data={pontosRegressao}
                type="linear"
                dataKey="gamaSeco"
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
                dataKey="gamaSeco"
                stroke="transparent"
                strokeWidth={0}
                dot={{ r: 5, fill: "#000000", stroke: "#fff", strokeWidth: 1 }}
                activeDot={false}
                isAnimationActive={false}
              />

              {/* Saturação - linha preta tracejada */}
              {pontosSaturacaoConvertidos.length > 0 && (
                <Line
                  name="Saturação (S=100%)"
                  data={pontosSaturacaoConvertidos}
                  type="natural"
                  dataKey="gamaSeco"
                  stroke="#000000"
                  strokeWidth={1.5}
                  strokeDasharray="5 5"
                  dot={false}
                  activeDot={false}
                />
              )}

              {/* Ponto Ótimo - vermelho escuro com borda branca */}
              {pontoOtimo && (
                <ReferenceDot
                  x={pontoOtimo.umidade}
                  y={pontoOtimo.gamaSeco}
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
      <div className="space-y-2 relative">
        {/* Botões Ampliar e Exportar */}
        <div className="flex justify-between items-center mb-2">
          <div>
            <h3 className="text-sm font-semibold text-foreground">Gráfico Curva de Compactação</h3>
            <p className="text-xs text-muted-foreground">Curva de compactação</p>
          </div>
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

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Maximize2 className="w-4 h-4" />
                  Ampliar
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-5xl max-h-[90vh] w-full">
                <DialogHeader>
                  <DialogTitle>Gráfico - Curva de Compactação (Ampliado)</DialogTitle>
                </DialogHeader>
                <div className="w-full flex justify-center items-center p-2 bg-muted/10 rounded-lg">
                  <div className="w-full max-w-[1200px]">
                    <ChartContent isDialog={true} />
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Gráfico Principal */}
        <div ref={chartRef} className="w-full">
          <ChartContent isDialog={false} />
        </div>

        {/* Sobre o Gráfico */}
        <Card className="bg-muted/30 border-none shadow-inner">
          <CardContent className="p-4 space-y-2 text-xs text-muted-foreground">
            <p>
              <strong>Curva de Compactação:</strong> A linha azul representa a relação entre a densidade seca do solo e seu teor de umidade para uma energia de compactação específica.
            </p>
            <p>
              <strong>Ponto Ótimo:</strong> O ponto vermelho indica a umidade ótima ({pontoOtimo?.umidade || '-'}%) e a densidade seca máxima ({pontoOtimo?.gamaSeco || '-'} g/cm³).
            </p>
            {pontosSaturacaoConvertidos.length > 0 && (
              <p>
                <strong>Linha de Saturação:</strong> A linha tracejada preta indica a relação teórica para o solo com 100% de saturação.
              </p>
            )}
            <p>
              <strong>Norma:</strong> NBR 7182 - Solo - Ensaio de Compactação.
            </p>
          </CardContent>
        </Card>

        {/* Gráfico Oculto para Exportação (Sempre Expandido, Sem Bordas Arredondadas) */}
        <div style={{ position: 'absolute', left: '-9999px', top: 0, width: '1200px' }} aria-hidden="true">
          <ChartContent isDialog={true} isExport={true} />
        </div>
      </div>
    );
  }
);

CurvaCompactacao.displayName = "CurvaCompactacao";

export default memo(CurvaCompactacao);
