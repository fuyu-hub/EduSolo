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
      // Capturar o elemento específico com fundo branco (id="chart-container")
      // Se estiver no dialog, usa o ref do dialog, senão o ref principal
      const element = document.getElementById('chart-capture-container');
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
    const ChartContent = ({ isDialog = false }: { isDialog?: boolean }) => {
      const height = isDialog ? 500 : 320;
      const fontSize = isDialog ? 14 : 12;
      const labelFontSize = isDialog ? 16 : 14;

      return (
        <div
          id={isDialog || !dialogOpen ? "chart-capture-container" : undefined}
          className="bg-white p-4 rounded-xl border border-border shadow-sm w-full"
        >
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

              {/* Tooltip e Legend removidos para gráfico não-interativo */}

              {/* Curva de Compactação */}
              <Line
                name="Curva de Compactação"
                data={pontosConvertidos}
                type="monotone"
                dataKey="gamaSeco"
                stroke="#2563eb"
                strokeWidth={2.5}
                dot={{ r: 5, fill: "#dc2626", stroke: "#fff", strokeWidth: 1 }}
                activeDot={false}
                isAnimationActive={false}
                connectNulls
              />

              {/* Saturação */}
              {pontosSaturacaoConvertidos.length > 0 && (
                <Line
                  name="Saturação (S=100%)"
                  data={pontosSaturacaoConvertidos}
                  type="monotone"
                  dataKey="gamaSeco"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={false}
                  activeDot={false}
                />
              )}

              {/* Pontos do Ensaio - removido pois já estão na Line com dot */}

              {/* Ponto Ótimo */}
              {pontoOtimo && (
                <ReferenceDot
                  x={pontoOtimo.umidade}
                  y={pontoOtimo.gamaSeco}
                  r={isDialog ? 6 : 5}
                  fill="#10b981"
                  stroke="#ffffff"
                  strokeWidth={2}
                  label={{
                    value: `wót=${pontoOtimo.umidade}% γd=${pontoOtimo.gamaSeco}`,
                    position: 'top',
                    fill: '#10b981',
                    fontSize: fontSize - 2,
                    fontWeight: 'bold'
                  }}
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
              <DialogContent className="max-w-[95vw] max-h-[95vh] w-full">
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
              <strong>Ponto Ótimo:</strong> O ponto verde indica a umidade ótima ({pontoOtimo?.umidade || '-'}%) e a densidade seca máxima ({pontoOtimo?.gamaSeco || '-'} g/cm³).
            </p>
            {pontosSaturacaoConvertidos.length > 0 && (
              <p>
                <strong>Linha de Saturação:</strong> A linha tracejada laranja indica a relação teórica para o solo com 100% de saturação.
              </p>
            )}
            <p>
              <strong>Norma:</strong> NBR 7182 - Solo - Ensaio de Compactação.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }
);

CurvaCompactacao.displayName = "CurvaCompactacao";

export default memo(CurvaCompactacao);
