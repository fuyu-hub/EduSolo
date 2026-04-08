// frontend/src/components/tensoes/PerfilTensoes.tsx
import { useMemo } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity } from "lucide-react";

import { TensaoPonto } from "@/modules/tensoes/schemas";


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

  // Verifica se há algum valor de tensão horizontal para exibir
  const temTensaoHorizontal = useMemo(() => {
    return dadosGrafico.some(d => d.sigma_h_ef !== null);
  }, [dadosGrafico]);

  const dominioX = useMemo(() => {
    if (dadosGrafico.length === 0) return [0, 200];

    // Inclui sigma_h_ef no cálculo do domínio apenas se houver tensão horizontal
    const valores = temTensaoHorizontal
      ? dadosGrafico.flatMap(d => [d.sigma_v, d.u, d.sigma_v_ef, d.sigma_h_ef].filter((v): v is number => v !== null))
      : dadosGrafico.flatMap(d => [d.sigma_v, d.u, d.sigma_v_ef].filter((v): v is number => v !== null));

    if (valores.length === 0) return [0, 200];

    const minTensao = Math.min(...valores, 0); // Inclui 0 no mínimo
    const maxTensao = Math.max(...valores, 0); // Inclui 0 no máximo
    const margem = Math.max((maxTensao - minTensao) * 0.15, 10); // Margem mínima de 10
    return [Math.max(0, minTensao - margem * 0.5), maxTensao]; // Sem margem no máximo
  }, [dadosGrafico, temTensaoHorizontal]);

  const dominioY = useMemo(() => {
    if (dadosGrafico.length === 0) return [0, 10];

    const profs = dadosGrafico.map(d => d.prof);
    const minProf = Math.min(...profs, 0);
    const maxProf = Math.max(...profs);
    const margemProf = Math.max(maxProf * 0.08, 0.5); // Margem mínima de 0.5m
    return [Math.max(0, minProf - margemProf * 0.3), maxProf + margemProf];
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
      <CardContent className="flex justify-center bg-white rounded-lg p-3">
        <ResponsiveContainer width="100%" height={350}>
          <LineChart
            data={dadosGrafico}
            layout="vertical"
            margin={{ top: 20, right: 20, left: 20, bottom: 5 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#d1d5db"
              opacity={1}
              horizontal={true}
              vertical={true}
            />

            {/* Eixo X (Tensão) - Horizontal */}
            <XAxis
              type="number"
              domain={dominioX}
              label={{
                value: 'Tensão (kPa)',
                position: 'insideBottom',
                offset: -8,
                style: { fontSize: 13, fontWeight: 600, fill: '#000000' }
              }}
              tick={{ fontSize: 11, fill: '#000000' }}
              axisLine={{ stroke: '#000000', strokeWidth: 1.5 }}
              tickLine={{ stroke: '#000000' }}
            />

            {/* Eixo Y (Profundidade) - 0 no topo, aumenta para baixo */}
            <YAxis
              dataKey="prof"
              type="number"
              domain={[0, 'dataMax + 1']}
              reversed={false}
              orientation="left"
              label={{
                value: 'Profundidade (m)',
                angle: -90,
                position: 'insideLeft',
                style: { fontSize: 13, fontWeight: 600, fill: '#000000' },
                offset: 20,
                dy: 50
              }}
              tick={{ fontSize: 11, fill: '#000000' }}
              axisLine={{ stroke: '#000000', strokeWidth: 1.5 }}
              tickLine={{ stroke: '#000000' }}
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
                    {temTensaoHorizontal && data.sigma_h_ef !== null && (
                      <p className="text-xs">σ'<sub>h</sub>: <span className="text-purple-600">{data.sigma_h_ef} kPa</span></p>
                    )}
                  </div>
                );
              }}
            />

            <Legend
              content={({ payload }) => {
                if (!payload) return null;
                return (
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 justify-items-center mt-5 px-2">
                    {payload.map((entry, index) => {
                      const labels: Record<string, string> = {
                        sigma_v: "σv (Total)",
                        u: "u (Neutra)",
                        sigma_v_ef: "σ'v (Efet. Vert.)",
                        sigma_h_ef: "σ'h (Efet. Horiz.)"
                      };
                      return (
                        <div key={`item-${index}`} className="flex items-center gap-1.5">
                          <div
                            className="w-2.5 h-2.5 rounded-full"
                            style={{ backgroundColor: entry.color }}
                          />
                          <span className="text-[12px] text-black">
                            {labels[entry.value as string] || entry.value}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                );
              }}
            />

            {/* Linhas dos Níveis d'Água - no layout vertical, usamos y para linhas horizontais */}
            {niveisAgua && niveisAgua.length > 0 ? (
              // Múltiplos NAs
              niveisAgua.map((na, idx) => (
                na.profundidade > 0 && (
                  <ReferenceLine
                    key={`na-${idx}`}
                    y={na.profundidade}
                    stroke="#3b82f6"
                    strokeWidth={2.5}
                    strokeDasharray="5 5"
                    label={{
                      value: niveisAgua.length > 1 ? `NA${idx + 1} = ${na.profundidade.toFixed(2)} m` : `NA = ${na.profundidade.toFixed(2)} m`,
                      position: 'insideTopRight',
                      fill: '#3b82f6',
                      fontSize: 12,
                      fontWeight: 'bold',
                      offset: 5
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
                  strokeWidth={2.5}
                  strokeDasharray="5 5"
                  label={{
                    value: `NA = ${profundidadeNA.toFixed(2)} m`,
                    position: 'insideTopRight',
                    fill: '#3b82f6',
                    fontSize: 12,
                    fontWeight: 'bold',
                    offset: 5
                  }}
                />
              )
            )}

            {/* Linhas de tensão - no layout vertical, dataKey aponta para valores no eixo X */}
            <Line
              name="sigma_v"
              type="linear"
              dataKey="sigma_v"
              stroke="#f97316"
              strokeWidth={2}
              dot={{ r: 4, fill: "#f97316" }}
              activeDot={{ r: 6 }}
              connectNulls
              isAnimationActive={true}
            />

            <Line
              name="u"
              type="linear"
              dataKey="u"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={{ r: 4, fill: "#3b82f6" }}
              activeDot={{ r: 6 }}
              connectNulls
              isAnimationActive={true}
            />

            <Line
              name="sigma_v_ef"
              type="linear"
              dataKey="sigma_v_ef"
              stroke="#10b981"
              strokeWidth={2.5}
              dot={{ r: 4, fill: "#10b981" }}
              activeDot={{ r: 6 }}
              connectNulls
              isAnimationActive={true}
            />

            {temTensaoHorizontal && (
              <Line
                name="sigma_h_ef"
                type="linear"
                dataKey="sigma_h_ef"
                stroke="#a855f7"
                strokeWidth={2}
                dot={{ r: 4, fill: "#a855f7" }}
                activeDot={{ r: 6 }}
                connectNulls
                isAnimationActive={true}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

