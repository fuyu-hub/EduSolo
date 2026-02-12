import React, { memo, useState } from "react";
import { cn } from "@/lib/utils";

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

// --- ESTILOS REFINADOS ---
const basePhaseStyle =
    "relative h-full flex flex-col items-center justify-center text-xs font-medium text-center p-1 leading-tight border-l border-black/10 first:border-l-0 cursor-pointer hover:brightness-110 transition-all duration-200 select-none overflow-hidden";

// Cores
const solidColor = "bg-amber-700/90 text-amber-50";
const waterColor = "bg-sky-600/90 text-sky-50";
const airColor = "bg-slate-400/80 text-slate-50";

const innerTextStyle = "text-xs opacity-90 font-bold drop-shadow-sm";

const EPSILON = 1e-6;

interface PhaseBlockProps {
    label: string;
    percentage: number;
    volume: number;
    mass: number;
    colorClass: string;
    widthPercentage: number;
}

const PhaseBlock = ({
    label,
    percentage,
    volume,
    mass,
    colorClass,
    widthPercentage,
}: PhaseBlockProps) => {
    const [showDetails, setShowDetails] = useState(false);

    // Se a largura for muito pequena, esconde o texto para não quebrar o layout
    // Pode ser ajustado conforme necessidade
    const isTooSmall = widthPercentage < 5;

    return (
        <div
            className={cn(basePhaseStyle, colorClass)}
            style={{ width: `${widthPercentage.toFixed(1)}%` }}
            onClick={() => setShowDetails(!showDetails)}
            title={`${label}: Clique para ver detalhes`}
        >
            {!isTooSmall && (
                !showDetails ? (
                    <div className="flex flex-col items-center animate-in fade-in duration-300">
                        <span className="font-bold text-sm mb-0.5 drop-shadow-sm shadow-black/20">{label}</span>
                        <span className={innerTextStyle}>{percentage.toFixed(1)}%</span>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center text-[10px] leading-snug font-mono animate-in zoom-in-95 duration-200">
                        <span className="whitespace-nowrap font-bold">V: {volume.toFixed(2)}</span>
                        <span className="whitespace-nowrap">M: {mass.toFixed(2)}</span>
                    </div>
                )
            )}
        </div>
    );
};

export function DiagramaFases({
    volumeSolidosNorm,
    volumeAguaNorm,
    volumeArNorm,
    volumeSolidosCalc,
    volumeAguaCalc,
    volumeArCalc,
    massaSolidosCalc,
    massaAguaCalc,
    volumeTotalCalc,
    massaTotalCalc,
    className,
}: DiagramaFasesProps) {

    const vt = volumeTotalCalc;

    if (!vt || vt < EPSILON) {
        return (
            <div
                className={cn(
                    "w-full h-24 border border-border rounded-lg flex items-center justify-center text-muted-foreground text-sm bg-muted/20 shadow-inner",
                    className,
                )}
            >
                Aguardando dados...
            </div>
        );
    }

    // --- Cálculos ---
    const vs = volumeSolidosCalc ?? 0;
    const vw = volumeAguaCalc ?? 0;
    const va = volumeArCalc ?? 0;

    const ms = massaSolidosCalc ?? 0;
    const mw = massaAguaCalc ?? 0;
    // const mt = massaTotalCalc ?? (ms + mw); // Não usado diretamente nos blocos individuais

    const percentVolSolidos = (vs / vt) * 100;
    const percentVolAgua = (vw / vt) * 100;
    const percentVolAr = Math.max(0, 100 - percentVolSolidos - percentVolAgua);

    return (
        <div className={cn("w-full space-y-2", className)}>
            {/* Container Principal Horizontal */}
            <div
                className={cn(
                    "w-full h-32 md:h-28 border border-border/50 rounded-xl flex overflow-hidden shadow-sm ring-1 ring-border/20",
                )}
                aria-label="Diagrama Trifásico do Solo"
            >
                {/* --- Fase Sólidos --- */}
                <PhaseBlock
                    label="Sólido"
                    percentage={percentVolSolidos}
                    volume={vs}
                    mass={ms}
                    colorClass={solidColor}
                    widthPercentage={percentVolSolidos}
                />

                {/* --- Fase Água --- */}
                <PhaseBlock
                    label="Água"
                    percentage={percentVolAgua}
                    volume={vw}
                    mass={mw}
                    colorClass={waterColor}
                    widthPercentage={percentVolAgua}
                />

                {/* --- Fase Ar --- */}
                <PhaseBlock
                    label="Ar"
                    percentage={percentVolAr}
                    volume={va}
                    mass={0}
                    colorClass={airColor}
                    widthPercentage={percentVolAr}
                />
            </div>
            <p className="text-[10px] text-center text-muted-foreground italic">
                * Clique nas seções para alternar entre porcentagem e valores físicos.
            </p>
        </div>
    );
}

export default memo(DiagramaFases);