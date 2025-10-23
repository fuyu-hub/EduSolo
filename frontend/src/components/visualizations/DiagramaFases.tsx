import React, { memo } from "react";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

// Interface (inalterada)
interface DiagramaFasesProps {
  volumeSolidosNorm: number;
  volumeAguaNorm: number;
  volumeArNorm: number;
  pesoSolidosNorm?: number | null;
  pesoAguaNorm?: number | null;
  volumeSolidosCalc?: number | null;
  volumeAguaCalc?: number | null;
  volumeArCalc?: number | null;
  massaSolidosCalc?: number | null;
  massaAguaCalc?: number | null;
  volumeTotalCalc?: number | null;
  massaTotalCalc?: number | null;
  className?: string;
}

// --- ESTILOS REFINADOS (CORES MAIS ESCURAS) ---
const basePhaseStyle =
  "relative h-full flex flex-col items-center justify-center text-xs font-medium text-center p-2 leading-tight border-l border-black/30 first:border-l-0 cursor-pointer hover:brightness-125 transition-all duration-150"; // Aumentado brightness no hover

// Cores mais escuras e integradas (ajuste conforme a paleta exata)
const solidColor = "bg-yellow-800/80 hover:bg-yellow-800/90 text-yellow-50"; // Mantido, talvez um pouco mais escuro se necessário (ex: bg-yellow-900/80)
const waterColor = "bg-sky-700/80 hover:bg-sky-700/90 text-sky-50"; // Azul mais escuro
const airColor = "bg-slate-500/50 hover:bg-slate-500/60 text-slate-100"; // Cinza mais escuro, texto claro

const innerTextStyle = "text-xs opacity-90 drop-shadow-[0_1px_1px_rgba(0,0,0,0.5)]"; // Aumentado text-xs

const EPSILON = 1e-6;

// Componente LegendItem REMOVIDO

export function DiagramaFases({
  volumeSolidosNorm,
  volumeAguaNorm,
  volumeArNorm,
  pesoSolidosNorm,
  pesoAguaNorm,
  volumeSolidosCalc,
  volumeAguaCalc,
  volumeArCalc,
  massaSolidosCalc,
  massaAguaCalc,
  volumeTotalCalc,
  massaTotalCalc,
  className,
}: DiagramaFasesProps) {

  if (!volumeTotalCalc || volumeTotalCalc < EPSILON) {
    return (
      <div
        className={cn(
          "w-full h-36 border border-border rounded flex items-center justify-center text-muted-foreground text-sm bg-background/30 shadow-inner", // Altura aumentada para h-20
          className,
        )}
      >
        Volumes Indisponíveis
      </div>
    );
  }

  // --- Cálculos (inalterados) ---
  const vs = volumeSolidosCalc ?? 0;
  const vw = volumeAguaCalc ?? 0;
  const va = volumeArCalc ?? 0;
  const vt = volumeTotalCalc;
  const ms = massaSolidosCalc ?? 0;
  const mw = massaAguaCalc ?? 0;
  const mt = massaTotalCalc ?? (ms + mw);

  const percentVolSolidos = (vs / vt) * 100;
  const percentVolAgua = (vw / vt) * 100;
  const percentVolAr = Math.max(0, 100 - percentVolSolidos - percentVolAgua); // Garante >= 0

  const percentMassaSolidos = mt > EPSILON ? (ms / mt) * 100 : 0;
  const percentMassaAgua = mt > EPSILON ? (mw / mt) * 100 : 0;

  const widthSolidos = `${percentVolSolidos.toFixed(1)}%`;
  const widthAgua = `${percentVolAgua.toFixed(1)}%`;
  const widthAr = `${percentVolAr.toFixed(1)}%`;

  return (
    <div className={cn("w-full", className)}>
        {/* Legenda REMOVIDA */}
        {/* Container Principal Horizontal */}
        <div
            className={cn(
                "w-full h-36 border border-border rounded flex overflow-hidden shadow-md bg-background/20", // Altura aumentada para h-20
            )}
            aria-label="Diagrama Trifásico do Solo - Proporção de Volumes"
        >
            {/* --- Fase Sólidos --- */}
            {vs > EPSILON && percentVolSolidos > 0.1 && ( // Condição para exibir
                <Popover>
                    <PopoverTrigger asChild>
                        <div
                            className={cn(basePhaseStyle, solidColor)}
                            style={{ width: widthSolidos }}
                            title={`Fase Sólida (${percentVolSolidos.toFixed(1)}%) - Clique para detalhes`}
                        >
                            <span className="font-semibold text-sm">Sólido</span>
                            <span className={innerTextStyle}>
                                {percentVolSolidos.toFixed(1)}%
                            </span>
                        </div>
                    </PopoverTrigger>
                    {/* PopoverContent (inalterado) */}
                    <PopoverContent side="top" align="center" className="w-auto p-3 text-sm shadow-xl glass">
                        <div className="space-y-1.5">
                            <div className="font-bold text-lg mb-1 text-yellow-800">Fase Sólida</div>
                            <div>Volume (Vs): {vs.toFixed(3)} cm³ ({percentVolSolidos.toFixed(1)}%)</div>
                            <div>Massa (Ws): {ms.toFixed(2)} g ({percentMassaSolidos.toFixed(1)}%)</div>
                            <div className="text-muted-foreground pt-1 text-xs">Partículas minerais que compõem o esqueleto do solo.</div>
                        </div>
                    </PopoverContent>
                </Popover>
            )}

            {/* --- Fase Água --- */}
            {vw > EPSILON && percentVolAgua > 0.1 && ( // Condição para exibir
                 <Popover>
                    <PopoverTrigger asChild>
                        <div
                            className={cn(basePhaseStyle, waterColor)}
                            style={{ width: widthAgua }}
                            title={`Fase Líquida (${percentVolAgua.toFixed(1)}%) - Clique para detalhes`}
                        >
                            <span className="font-semibold text-sm">Água</span>
                            <span className={innerTextStyle}>
                                {percentVolAgua.toFixed(1)}%
                            </span>
                        </div>
                    </PopoverTrigger>
                     {/* PopoverContent (inalterado) */}
                    <PopoverContent side="top" align="center" className="w-auto p-3 text-sm shadow-xl glass">
                        <div className="space-y-1.5">
                            <div className="font-bold text-lg mb-1 text-sky-600">Fase Líquida (Água)</div>
                            <div>Volume (Vw): {vw.toFixed(3)} cm³ ({percentVolAgua.toFixed(1)}%)</div>
                            <div>Massa (Ww): {mw.toFixed(2)} g ({percentMassaAgua.toFixed(1)}%)</div>
                            <div className="text-muted-foreground pt-1 text-xs">Água que preenche parcial ou totalmente os vazios do solo.</div>
                        </div>
                    </PopoverContent>
                </Popover>
            )}

             {/* --- Fase Ar --- */}
             {va > EPSILON && percentVolAr > 0.1 && ( // Condição para exibir
                 <Popover>
                    <PopoverTrigger asChild>
                        <div
                            className={cn(basePhaseStyle, airColor)}
                            style={{ width: widthAr }}
                            title={`Fase Gasosa (${percentVolAr.toFixed(1)}%) - Clique para detalhes`}
                        >
                            <span className="font-semibold text-sm">Ar</span>
                            <span className={cn(innerTextStyle, "text-slate-100")}> {/* Texto claro */}
                                {percentVolAr.toFixed(1)}%
                            </span>
                        </div>
                    </PopoverTrigger>
                    {/* PopoverContent (inalterado) */}
                    <PopoverContent side="top" align="center" className="w-auto p-3 text-sm shadow-xl glass">
                        <div className="space-y-1.5">
                            <div className="font-bold text-lg mb-1 text-slate-300 dark:text-slate-300">Fase Gasosa (Ar)</div> {/* Ajuste cor título popover */}
                            <div>Volume (Va): {va.toFixed(3)} cm³ ({percentVolAr.toFixed(1)}%)</div>
                            <div>Massa (Wa): ≈ 0 g (0.0%)</div>
                            <div className="text-muted-foreground pt-1 text-xs">
                                Representa os vazios preenchidos por ar e vapor d'água.
                            </div>
                        </div>
                    </PopoverContent>
                </Popover>
            )}
        </div>
    </div>
  );
}

export default DiagramaFases;