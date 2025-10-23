// frontend/src/components/compactacao/CurvaCompactacao.tsx
import { useMemo } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Scatter, ScatterChart, ReferenceDot, Label } from "recharts";
import { TrendingUp } from "lucide-react";

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

export default function CurvaCompactacao({ pontosEnsaio, umidadeOtima, gamaSecoMax, pontosSaturacao }: CurvaCompactacaoProps) {
  // Converte γd de kN/m³ para g/cm³ para exibição
  const pontosConvertidos = useMemo(() => {
    return pontosEnsaio.map(p => ({
      umidade: Number(p.umidade.toFixed(2)),
      gamaSeco: Number((p.peso_especifico_seco / 10).toFixed(3)) // kN/m³ -> g/cm³
    }));
  }, [pontosEnsaio]);

  const pontosSaturacaoConvertidos = useMemo(() => {
    if (!pontosSaturacao || pontosSaturacao.length === 0) return [];
    return pontosSaturacao.map(p => ({
      umidade: Number(p.umidade.toFixed(2)),
      gamaSeco: Number((p.peso_especifico_seco / 10).toFixed(3))
    }));
  }, [pontosSaturacao]);

  const pontoOtimo = useMemo(() => {
    if (umidadeOtima === undefined || gamaSecoMax === undefined) return null;
    return {
      umidade: Number(umidadeOtima.toFixed(2)),
      gamaSeco: Number((gamaSecoMax / 10).toFixed(3))
    };
  }, [umidadeOtima, gamaSecoMax]);

  // Determina os limites dos eixos
  const dominioX = useMemo(() => {
    if (pontosConvertidos.length === 0) return [0, 40];
    const umidades = pontosConvertidos.map(p => p.umidade);
    if (pontosSaturacaoConvertidos.length > 0) {
      umidades.push(...pontosSaturacaoConvertidos.map(p => p.umidade));
    }
    const minU = Math.min(...umidades);
    const maxU = Math.max(...umidades);
    const margem = (maxU - minU) * 0.1 || 5;
    return [Math.max(0, minU - margem), maxU + margem];
  }, [pontosConvertidos, pontosSaturacaoConvertidos]);

  const dominioY = useMemo(() => {
    if (pontosConvertidos.length === 0) return [1.0, 2.2];
    const gamas = pontosConvertidos.map(p => p.gamaSeco);
    if (pontosSaturacaoConvertidos.length > 0) {
      gamas.push(...pontosSaturacaoConvertidos.map(p => p.gamaSeco));
    }
    const minG = Math.min(...gamas);
    const maxG = Math.max(...gamas);
    const margem = (maxG - minG) * 0.1 || 0.1;
    return [Math.max(1.0, minG - margem), maxG + margem];
  }, [pontosConvertidos, pontosSaturacaoConvertidos]);

  if (pontosConvertidos.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        O gráfico será exibido após o cálculo
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <h3 className="font-semibold text-sm text-foreground mb-2 flex items-center gap-1.5">
        <TrendingUp className="w-4 h-4 text-primary" />
        Curva de Compactação
      </h3>
      <div>
        <ResponsiveContainer width="100%" height={320}>
          <LineChart margin={{ top: 5, right: 20, left: 5, bottom: 30 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
            <XAxis 
              type="number" 
              dataKey="umidade" 
              domain={dominioX}
              label={{ value: 'Umidade (%)', position: 'insideBottom', offset: -10 }}
              tick={{ fontSize: 12 }}
            />
            <YAxis 
              type="number"
              domain={dominioY}
              label={{ value: 'γ seco (g/cm³)', angle: -90, position: 'insideLeft' }}
              tick={{ fontSize: 12 }}
            />
            <Tooltip 
              content={({ active, payload }) => {
                if (!active || !payload || payload.length === 0) return null;
                return (
                  <div className="bg-background border border-border rounded-lg shadow-lg p-3">
                    <p className="text-sm font-medium">
                      Umidade: <span className="text-primary">{payload[0]?.payload?.umidade}%</span>
                    </p>
                    <p className="text-sm font-medium">
                      γ seco: <span className="text-primary">{payload[0]?.payload?.gamaSeco} g/cm³</span>
                    </p>
                  </div>
                );
              }}
            />
            <Legend wrapperStyle={{ paddingTop: "10px" }} />
            
            {/* Pontos do ensaio */}
            <Scatter 
              name="Pontos do Ensaio" 
              data={pontosConvertidos} 
              fill="#3b82f6"
              shape="circle"
              r={6}
            />

            {/* Curva de saturação S=100% */}
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

            {/* Ponto ótimo */}
            {pontoOtimo && (
              <ReferenceDot
                x={pontoOtimo.umidade}
                y={pontoOtimo.gamaSeco}
                r={8}
                fill="#10b981"
                stroke="#ffffff"
                strokeWidth={2}
                label={{
                  value: `w_ót=${pontoOtimo.umidade}%`,
                  position: 'top',
                  fill: '#10b981',
                  fontSize: 12,
                  fontWeight: 'bold'
                }}
              />
            )}
          </LineChart>
        </ResponsiveContainer>

        {/* Legenda adicional */}
        {pontoOtimo && (
          <div className="mt-3 p-2.5 bg-accent/30 rounded-lg border border-accent">
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-muted-foreground">Umidade Ótima:</span>
                <span className="ml-2 font-semibold text-green-600">{pontoOtimo.umidade}%</span>
              </div>
              <div>
                <span className="text-muted-foreground">γ<sub>d,máx</sub>:</span>
                <span className="ml-2 font-semibold text-green-600">{pontoOtimo.gamaSeco} g/cm³</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

