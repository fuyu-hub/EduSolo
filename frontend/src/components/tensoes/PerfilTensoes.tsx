// frontend/src/components/tensoes/PerfilTensoes.tsx
import { useMemo } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity } from "lucide-react";

interface TensaoPonto {
  profundidade: number;
  tensao_total_vertical?: number | null;
  pressao_neutra?: number | null;
  tensao_efetiva_vertical?: number | null;
  tensao_efetiva_horizontal?: number | null;
}

interface NivelAgua {
  profundidade: number;
  capilaridade?: number;
}

interface PerfilTensoesProps {
  pontos: TensaoPonto[];
  profundidadeNA?: number;
  niveisAgua?: NivelAgua[];
}

export default function PerfilTensoes({ pontos, profundidadeNA, niveisAgua }: PerfilTensoesProps) {
  const dadosGrafico = useMemo(() => {
    if (!pontos || pontos.length === 0) return [];
    
    return pontos.map(p => ({
      prof: Number(p.profundidade.toFixed(2)),
      sigma_v: p.tensao_total_vertical !== null && p.tensao_total_vertical !== undefined ? Number(p.tensao_total_vertical.toFixed(2)) : null,
      u: p.pressao_neutra !== null && p.pressao_neutra !== undefined ? Number(p.pressao_neutra.toFixed(2)) : null,
      sigma_v_ef: p.tensao_efetiva_vertical !== null && p.tensao_efetiva_vertical !== undefined ? Number(p.tensao_efetiva_vertical.toFixed(2)) : null,
      sigma_h_ef: p.tensao_efetiva_horizontal !== null && p.tensao_efetiva_horizontal !== undefined ? Number(p.tensao_efetiva_horizontal.toFixed(2)) : null,
    }));
  }, [pontos]);

  const dominioX = useMemo(() => {
    if (dadosGrafico.length === 0) return [0, 200];
    
    const valores = dadosGrafico.flatMap(d => [d.sigma_v, d.u, d.sigma_v_ef, d.sigma_h_ef].filter((v): v is number => v !== null));
    if (valores.length === 0) return [0, 200];
    
    const maxTensao = Math.max(...valores);
    const margem = maxTensao * 0.1 || 10;
    return [0, maxTensao + margem];
  }, [dadosGrafico]);

  const dominioY = useMemo(() => {
    if (dadosGrafico.length === 0) return [0, 10];
    
    const profs = dadosGrafico.map(d => d.prof);
    const maxProf = Math.max(...profs);
    return [0, maxProf + maxProf * 0.05]; // Pequena margem no fundo
  }, [dadosGrafico]);

  if (dadosGrafico.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Activity className="w-5 h-5 text-primary" />
            Perfil de Tensões
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-96 text-muted-foreground">
            O perfil de tensões será exibido após o cálculo
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Activity className="w-5 h-5 text-primary" />
          Perfil de Tensões
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={500}>
          <LineChart 
            data={dadosGrafico} 
            margin={{ top: 10, right: 30, left: 20, bottom: 50 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
            
            {/* Eixo X (Tensão) - Normal */}
            <XAxis 
              type="number"
              domain={dominioX}
              label={{ value: 'Tensão (kPa)', position: 'insideBottom', offset: -10 }}
              tick={{ fontSize: 12 }}
            />
            
            {/* Eixo Y (Profundidade) - INVERTIDO */}
            <YAxis 
              dataKey="prof"
              type="number"
              domain={dominioY}
              reversed={true}  // Inverte o eixo Y
              label={{ value: 'Profundidade (m)', angle: -90, position: 'insideLeft' }}
              tick={{ fontSize: 12 }}
            />
            
            <Tooltip 
              content={({ active, payload }) => {
                if (!active || !payload || payload.length === 0) return null;
                const data = payload[0].payload;
                return (
                  <div className="bg-background border border-border rounded-lg shadow-lg p-3">
                    <p className="text-sm font-medium mb-2">
                      Profundidade: <span className="text-primary">{data.prof} m</span>
                    </p>
                    {data.sigma_v !== null && (
                      <p className="text-xs">σ<sub>v</sub>: <span className="text-orange-600">{data.sigma_v} kPa</span></p>
                    )}
                    {data.u !== null && (
                      <p className="text-xs">u: <span className="text-blue-600">{data.u} kPa</span></p>
                    )}
                    {data.sigma_v_ef !== null && (
                      <p className="text-xs">σ'<sub>v</sub>: <span className="text-green-600">{data.sigma_v_ef} kPa</span></p>
                    )}
                    {data.sigma_h_ef !== null && (
                      <p className="text-xs">σ'<sub>h</sub>: <span className="text-purple-600">{data.sigma_h_ef} kPa</span></p>
                    )}
                  </div>
                );
              }}
            />
            
            <Legend 
              wrapperStyle={{ paddingTop: "20px" }}
              formatter={(value) => {
                const labels: Record<string, string> = {
                  sigma_v: "σv (Tensão Total)",
                  u: "u (Pressão Neutra)",
                  sigma_v_ef: "σ'v (Tensão Efetiva Vertical)",
                  sigma_h_ef: "σ'h (Tensão Efetiva Horizontal)"
                };
                return labels[value] || value;
              }}
            />
            
            {/* Linhas dos Níveis d'Água */}
            {niveisAgua && niveisAgua.length > 0 ? (
              // Múltiplos NAs
              niveisAgua.map((na, idx) => (
                na.profundidade > 0 && (
                  <ReferenceLine 
                    key={`na-${idx}`}
                    y={na.profundidade} 
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    label={{ 
                      value: niveisAgua.length > 1 ? `NA${idx + 1} = ${na.profundidade.toFixed(2)} m` : `NA = ${na.profundidade.toFixed(2)} m`, 
                      position: 'right',
                      fill: '#3b82f6',
                      fontSize: 12,
                      fontWeight: 'bold'
                    }}
                  />
                )
              ))
            ) : (
              // NA único (modo compatibilidade)
              profundidadeNA !== undefined && profundidadeNA > 0 && (
                <ReferenceLine 
                  y={profundidadeNA} 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  label={{ 
                    value: `NA = ${profundidadeNA.toFixed(2)} m`, 
                    position: 'right',
                    fill: '#3b82f6',
                    fontSize: 12,
                    fontWeight: 'bold'
                  }}
                />
              )
            )}
            
            {/* Linhas de tensão */}
            <Line
              name="sigma_v"
              type="monotone"
              dataKey="sigma_v"
              stroke="#f97316"
              strokeWidth={2}
              dot={{ r: 4, fill: "#f97316" }}
              activeDot={{ r: 6 }}
              connectNulls
            />
            
            <Line
              name="u"
              type="monotone"
              dataKey="u"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={{ r: 4, fill: "#3b82f6" }}
              activeDot={{ r: 6 }}
              connectNulls
            />
            
            <Line
              name="sigma_v_ef"
              type="monotone"
              dataKey="sigma_v_ef"
              stroke="#10b981"
              strokeWidth={2.5}
              dot={{ r: 4, fill: "#10b981" }}
              activeDot={{ r: 6 }}
              connectNulls
            />
            
            <Line
              name="sigma_h_ef"
              type="monotone"
              dataKey="sigma_h_ef"
              stroke="#a855f7"
              strokeWidth={2}
              dot={{ r: 4, fill: "#a855f7" }}
              activeDot={{ r: 6 }}
              connectNulls
            />
          </LineChart>
        </ResponsiveContainer>

        {/* Informações adicionais */}
        <div className="mt-4 p-3 bg-accent/30 rounded-lg border border-accent text-xs">
          <p className="text-muted-foreground">
            <strong>Nota:</strong> A profundidade aumenta para baixo (eixo Y invertido). 
            As tensões são calculadas em cada interface de camada e no nível d'água (se aplicável).
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

