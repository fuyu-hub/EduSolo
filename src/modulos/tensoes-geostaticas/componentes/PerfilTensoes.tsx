/**
 * PerfilTensoes — Gráfico de tensões em função da profundidade
 * modulos/tensoes-geostaticas/componentes/PerfilTensoes.tsx
 *
 * Diagrama vertical (Recharts) com σv, u, σ'v e opcionalmente σh, σ'h.
 * Inclui linhas de referência para NAs.
 * Padrão visual alinhado com CurvaCompactacao e LimiteLiquidezChart.
 */
import { useMemo } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, ReferenceLine, Label } from "recharts";
import ContainerGrafico from "@/componentes/compartilhados/ContainerGrafico";
import { TensaoPonto, CamadaSolo } from "../types";

interface NivelAguaInfo {
  profundidade: number;
  capilaridade?: number;
}

interface PerfilTensoesProps {
  pontos: TensaoPonto[];
  camadas: CamadaSolo[];
}

export default function PerfilTensoes({ pontos, camadas }: PerfilTensoesProps) {
  // Deriva os NAs baseando-se nas camadas como em DiagramaPerfil
  const niveisAgua = useMemo(() => {
    const nas: NivelAguaInfo[] = [];
    camadas.forEach(c => {
      if (c.profundidadeNA != null) {
        nas.push({ profundidade: c.profundidadeNA, capilaridade: c.capilaridade || 0 });
      }
    });
    return nas;
  }, [camadas]);

  const dadosGrafico = useMemo(() => {
    if (!pontos || pontos.length === 0) return [];

    return pontos.map(p => ({
      prof: Number(p.profundidade.toFixed(2)),
      sigma_v: p.tensaoTotalVertical,
      u: p.pressaoNeutra,
      sigma_v_ef: p.tensaoEfetivaVertical,
      sigma_h_ef: p.tensaoEfetivaHorizontal,
      sigma_h: p.tensaoTotalHorizontal,
    }));
  }, [pontos]);

  const temTensaoHorizontalEfetiva = useMemo(() => dadosGrafico.some(d => d.sigma_h_ef !== undefined), [dadosGrafico]);
  const temTensaoHorizontalTotal = useMemo(() => dadosGrafico.some(d => d.sigma_h !== undefined), [dadosGrafico]);

  const dominioX = useMemo(() => {
    if (dadosGrafico.length === 0) return [0, 200];

    const valores: number[] = [];
    dadosGrafico.forEach(d => {
      if (d.sigma_v !== undefined) valores.push(d.sigma_v);
      if (d.u !== undefined) valores.push(d.u);
      if (d.sigma_v_ef !== undefined) valores.push(d.sigma_v_ef);
      if (d.sigma_h_ef !== undefined) valores.push(d.sigma_h_ef);
      if (d.sigma_h !== undefined) valores.push(d.sigma_h);
    });

    if (valores.length === 0) return [0, 200];

    const minTensao = Math.min(...valores, 0);
    const maxTensao = Math.max(...valores, 0);
    const margem = Math.max((maxTensao - minTensao) * 0.15, 10);
    return [Math.floor(Math.min(0, minTensao - margem * 0.5)), Math.ceil(maxTensao + margem * 0.3)];
  }, [dadosGrafico]);

  const dominioY = useMemo(() => {
    if (dadosGrafico.length === 0) return [0, 10];
    const maxProf = Math.max(...dadosGrafico.map(d => d.prof));
    return [0, maxProf];
  }, [dadosGrafico]);

  if (dadosGrafico.length === 0) {
    return (
      <ContainerGrafico
        exportId="tensoes-grafico-export"
        exportFileName="perfil_tensoes_geostaticas"
        vazio={true}
        mensagemVazio="Dados Insuficientes"
        descricaoVazio="O diagrama de tensões será gerado após o cálculo."
      >
        <div />
      </ContainerGrafico>
    );
  }

  // Componente do gráfico reutilizável (mesmo padrão de CurvaCompactacao)
  const ChartContent = ({ isDialog = false }: { isDialog?: boolean }) => {
    const height = isDialog ? 500 : 300;
    const fontSize = isDialog ? 14 : 12;
    const labelFontSize = isDialog ? 16 : 14;

    return (
      <div className="bg-white p-4 w-full relative">
        <ResponsiveContainer width="100%" height={height}>
          <LineChart
            data={dadosGrafico}
            layout="vertical"
            margin={{ top: 40, right: 30, left: 20, bottom: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#000000" opacity={0.1} />

            <XAxis
              type="number"
              domain={dominioX}
              stroke="#000000"
              orientation="top"
              tick={{ fontSize, fill: '#000000' }}
              axisLine={{ stroke: '#000000', strokeWidth: 1 }}
              tickLine={{ stroke: '#000000' }}
            >
              <Label
                value="Tensão (kPa)"
                position="top"
                offset={isDialog ? 20 : 10}
                style={{ fontSize: labelFontSize, fontWeight: 'bold', fill: '#000000' }}
              />
            </XAxis>

            <YAxis
              dataKey="prof"
              type="number"
              domain={dominioY}
              reversed={false}
              orientation="left"
              stroke="#000000"
              tick={{ fontSize, fill: '#000000' }}
              axisLine={{ stroke: '#000000', strokeWidth: 1 }}
              tickLine={{ stroke: '#000000' }}
            >
              <Label
                value="Profundidade (m)"
                angle={-90}
                position="insideLeft"
                offset={10}
                style={{ fontSize: labelFontSize, fontWeight: 'bold', fill: '#000000', textAnchor: 'middle' }}
              />
            </YAxis>

            {niveisAgua.map((na, idx) => (
              na.profundidade > 0 && (
                <ReferenceLine
                  key={`na-${idx}`}
                  y={na.profundidade}
                  stroke="#3b82f6"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                />
              )
            ))}

            <Line
              name="sigma_v"
              type="linear"
              dataKey="sigma_v"
              stroke="#f97316"
              strokeWidth={2}
              dot={false}
              activeDot={false}
              isAnimationActive={false}
              connectNulls
            />

            <Line
              name="u"
              type="linear"
              dataKey="u"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={false}
              activeDot={false}
              isAnimationActive={false}
              connectNulls
            />

            <Line
              name="sigma_v_ef"
              type="linear"
              dataKey="sigma_v_ef"
              stroke="#10b981"
              strokeWidth={2}
              dot={false}
              activeDot={false}
              isAnimationActive={false}
              connectNulls
            />

            {temTensaoHorizontalTotal && (
              <Line
                name="sigma_h"
                type="linear"
                dataKey="sigma_h"
                stroke="#ec4899"
                strokeWidth={2}
                dot={false}
                activeDot={false}
                isAnimationActive={false}
                connectNulls
              />
            )}

            {temTensaoHorizontalEfetiva && (
              <Line
                name="sigma_h_ef"
                type="linear"
                dataKey="sigma_h_ef"
                stroke="#a855f7"
                strokeWidth={2}
                dot={false}
                activeDot={false}
                isAnimationActive={false}
                connectNulls
              />
            )}
          </LineChart>
        </ResponsiveContainer>

        {/* Caixa de Legenda na posição inferior */}
        <div className="w-full mt-2 bg-white rounded-none border border-gray-200">
          <div
            className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2"
            style={{
              padding: isDialog ? '12px 16px' : '8px 12px',
              fontSize: isDialog ? 13 : 11
            }}
          >
            <div className="flex items-center gap-1.5 font-medium text-black">
              <div className="w-4 h-0.5 bg-[#f97316] flex-shrink-0"></div>
              <span><span className="font-serif italic font-bold text-sm">σ</span><sub>v</sub> (Total Vert.)</span>
            </div>
            <div className="flex items-center gap-1.5 font-medium text-black">
              <div className="w-4 h-0.5 bg-[#3b82f6] flex-shrink-0"></div>
              <span><span className="font-serif italic font-bold text-sm">u</span> (Neutra)</span>
            </div>
            <div className="flex items-center gap-1.5 font-medium text-black">
              <div className="w-4 h-0.5 bg-[#10b981] flex-shrink-0" style={{ height: '2.5px' }}></div>
              <span><span className="font-serif italic font-bold text-sm">σ'</span><sub>v</sub> (Efet. Vert.)</span>
            </div>
            {temTensaoHorizontalTotal && (
              <div className="flex items-center gap-1.5 font-medium text-black">
                <svg width="16" height="4" className="flex-shrink-0">
                  <line x1="0" y1="2" x2="16" y2="2" stroke="#ec4899" strokeWidth="2" strokeDasharray="3 2" />
                </svg>
                <span><span className="font-serif italic font-bold text-sm">σ</span><sub>h</sub> (Total Horiz.)</span>
              </div>
            )}
            {temTensaoHorizontalEfetiva && (
              <div className="flex items-center gap-1.5 font-medium text-black">
                <div className="w-4 h-0.5 bg-[#a855f7] flex-shrink-0"></div>
                <span><span className="font-serif italic font-bold text-sm">σ'</span><sub>h</sub> (Efet. Horiz.)</span>
              </div>
            )}
            {niveisAgua.length > 0 && (
              <div className="flex items-center gap-1.5 font-medium text-black">
                <svg width="16" height="4" className="flex-shrink-0">
                  <line x1="0" y1="2" x2="16" y2="2" stroke="#3b82f6" strokeWidth="2" strokeDasharray="3 2" />
                </svg>
                <span>Nível d'Água</span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <ContainerGrafico
      exportId="tensoes-grafico-export"
      exportFileName="perfil_tensoes_geostaticas"
      dialogTitle="Perfil de Tensões Geostáticas (Ampliado)"
      className="p-1"
      vazio={false}
      renderAmpliar={<ChartContent isDialog={true} />}
      renderExportar={<ChartContent isDialog={true} />}
    >
      <ChartContent isDialog={false} />
    </ContainerGrafico>
  );
}
