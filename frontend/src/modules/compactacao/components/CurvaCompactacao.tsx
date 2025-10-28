import { memo, useState, useRef, forwardRef, useImperativeHandle } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Maximize2, Download } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Scatter, ReferenceDot } from "recharts";
import html2canvas from "html2canvas";
import { toast } from "sonner";

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

    // Função para exportar como JPG
    const handleExportJPG = async () => {
      if (!chartRef.current) return;
      
      try {
        toast.info("Capturando gráfico...");
        
        const canvas = await html2canvas(chartRef.current, {
          backgroundColor: '#ffffff',
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
      if (!chartRef.current) return null;
      
      try {
        const canvas = await html2canvas(chartRef.current, {
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

    // Componente do gráfico reutilizável
    const ChartComponent = ({ height = 320, showActions = false }: { height?: number; showActions?: boolean }) => (
      <div className="space-y-3">
        {showActions && (
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportJPG}
              className="gap-2"
            >
              <Download className="w-4 h-4" />
              Exportar JPG
            </Button>
          </div>
        )}
        
        <ResponsiveContainer width="100%" height={height}>
          <LineChart margin={{ top: 20, right: 30, left: 20, bottom: 40 }}>
            <defs>
              <linearGradient id="colorEnsaio" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
              </linearGradient>
            </defs>
            
            <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" opacity={0.5} />
            
            <XAxis 
              type="number" 
              dataKey="umidade" 
              domain={dominioX}
              label={{ 
                value: 'Umidade (%)', 
                position: 'bottom',
                offset: 0,
                style: { fontSize: '13px', fontWeight: 'bold', fill: '#666' }
              }}
              tick={{ fontSize: 11, fill: '#666' }}
              tickLine={{ stroke: '#999' }}
              axisLine={{ stroke: '#999', strokeWidth: 1.5 }}
            />
            
            <YAxis 
              type="number"
              domain={dominioY}
              label={{ 
                value: 'γd (g/cm³)', 
                angle: -90, 
                position: 'left',
                offset: 0,
                style: { fontSize: '13px', fontWeight: 'bold', fill: '#666' }
              }}
              tick={{ fontSize: 11, fill: '#666' }}
              tickLine={{ stroke: '#999' }}
              axisLine={{ stroke: '#999', strokeWidth: 1.5 }}
            />
            
            <Tooltip 
              contentStyle={{
                backgroundColor: 'rgba(255, 255, 255, 0.98)',
                border: '1px solid #ddd',
                borderRadius: '8px',
                padding: '12px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
              }}
              content={({ active, payload }) => {
                if (!active || !payload || payload.length === 0) return null;
                const data = payload[0]?.payload;
                return (
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-gray-700">
                      Umidade: <span className="text-violet-600">{data?.umidade}%</span>
                    </p>
                    <p className="text-sm font-semibold text-gray-700">
                      γd: <span className="text-violet-600">{data?.gamaSeco} g/cm³</span>
                    </p>
                  </div>
                );
              }}
            />
            
            {/* Linha de interpolação entre pontos */}
            <Line
              name="Curva de Compactação"
              data={pontosConvertidos}
              type="monotone"
              dataKey="gamaSeco"
              stroke="#8b5cf6"
              strokeWidth={3}
              dot={false}
              activeDot={false}
            />

            {/* Pontos do ensaio */}
            <Scatter 
              name="Pontos do Ensaio" 
              data={pontosConvertidos} 
              fill="#8b5cf6"
              shape="circle"
              r={7}
            />

            {/* Curva de saturação S=100% */}
            {pontosSaturacaoConvertidos.length > 0 && (
              <Line
                name="Saturação (S=100%)"
                data={pontosSaturacaoConvertidos}
                type="monotone"
                dataKey="gamaSeco"
                stroke="#f59e0b"
                strokeWidth={2.5}
                strokeDasharray="6 4"
                dot={false}
                activeDot={false}
              />
            )}

            {/* Ponto ótimo */}
            {pontoOtimo && (
              <ReferenceDot
                x={pontoOtimo.umidade}
                y={pontoOtimo.gamaSeco}
                r={9}
                fill="#10b981"
                stroke="#ffffff"
                strokeWidth={3}
                label={{
                  value: `wót = ${pontoOtimo.umidade}%`,
                  position: 'top',
                  fill: '#10b981',
                  fontSize: 12,
                  fontWeight: 'bold',
                  offset: 15
                }}
              />
            )}
          </LineChart>
        </ResponsiveContainer>

        {/* Legenda de informações */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-4">
          <div className="flex items-center gap-2 text-xs">
            <div className="w-3 h-3 rounded-full bg-violet-600"></div>
            <span className="text-muted-foreground">Pontos do Ensaio</span>
          </div>
          
          {pontosSaturacaoConvertidos.length > 0 && (
            <div className="flex items-center gap-2 text-xs">
              <div className="w-6 h-0.5 bg-amber-500" style={{ borderTop: '2px dashed #f59e0b' }}></div>
              <span className="text-muted-foreground">Saturação (S=100%)</span>
            </div>
          )}
          
          {pontoOtimo && (
            <div className="flex items-center gap-2 text-xs">
              <div className="w-3 h-3 rounded-full bg-green-500 border-2 border-white"></div>
              <span className="text-muted-foreground">Ponto Ótimo</span>
            </div>
          )}
        </div>

        {/* Card com resultados principais */}
        {pontoOtimo && (
          <div className="mt-4 p-4 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 rounded-lg border border-green-200 dark:border-green-800">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Umidade Ótima</p>
                <p className="text-xl font-bold text-green-600 dark:text-green-400">
                  {pontoOtimo.umidade}%
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">γd,máx</p>
                <p className="text-xl font-bold text-green-600 dark:text-green-400">
                  {pontoOtimo.gamaSeco} g/cm³
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    );

    if (pontosConvertidos.length === 0) {
      return (
        <div className="flex items-center justify-center h-64 text-muted-foreground">
          O gráfico será exibido após o cálculo
        </div>
      );
    }

    return (
      <div className="space-y-2">
        {/* Versão compacta com botão de ampliar */}
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-sm text-foreground">
            Curva de Compactação
          </h3>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Maximize2 className="w-4 h-4" />
                Ampliar
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-5xl max-h-[90vh] overflow-auto">
              <DialogHeader>
                <DialogTitle>Curva de Compactação - Visualização Ampliada</DialogTitle>
              </DialogHeader>
              <div id="curva-compactacao-ampliada" ref={chartRef} className="p-4 bg-white rounded-lg">
                <ChartComponent height={500} showActions={true} />
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Gráfico normal (versão compacta) */}
        <div id="curva-compactacao-chart">
          <ChartComponent height={320} />
        </div>
      </div>
    );
  }
);

CurvaCompactacao.displayName = "CurvaCompactacao";

export default memo(CurvaCompactacao);
