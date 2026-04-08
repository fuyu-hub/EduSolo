import React, { memo } from "react";
import { cn } from "@/lib/utils";

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

const basePhaseStyle =
    "relative h-full flex flex-col items-center justify-center text-xs font-medium text-center p-1 leading-tight border-l border-black/10 first:border-l-0 transition-all duration-200 select-none overflow-hidden";

const solidColor = "bg-amber-700/90 text-amber-50";
const waterColor = "bg-sky-600/90 text-sky-50";
const airColor = "bg-slate-400/80 text-slate-50";

const EPSILON = 1e-6;
const MIN_VISUAL_WEIGHT = 12;

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
    return (
        <div
            className={cn(basePhaseStyle, colorClass)}
            style={{ width: `${widthPercentage.toFixed(1)}%` }}
            title={`${label}: ${percentage.toFixed(1)}% — ${volume.toFixed(2)} cm³ / ${mass.toFixed(2)} g`}
        >
            <div className="flex flex-col items-center">
                <span className="font-bold text-sm mb-0.5 drop-shadow-sm shadow-black/20">{label}</span>
                <span className="text-xs font-bold opacity-90 drop-shadow-sm">{percentage.toFixed(1)}%</span>
                {volume > 0 && (
                    <span className="text-[10px] opacity-70 mt-0.5">{volume.toFixed(1)} cm³</span>
                )}
            </div>
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
                    "w-full h-20 border border-border rounded-lg flex items-center justify-center text-muted-foreground text-sm bg-muted/20 shadow-inner",
                    className,
                )}
            >
                Aguardando dados...
            </div>
        );
    }

    const vs = volumeSolidosCalc ?? 0;
    const vw = volumeAguaCalc ?? 0;
    const va = volumeArCalc ?? 0;

    const ms = massaSolidosCalc ?? 0;
    const mw = massaAguaCalc ?? 0;

    const percentVolSolidos = (vs / vt) * 100;
    const percentVolAgua = (vw / vt) * 100;
    const percentVolAr = Math.max(0, 100 - percentVolSolidos - percentVolAgua);

    const phases = [
        { label: "Sólido", realPerc: percentVolSolidos, vol: vs, mass: ms, color: solidColor },
        { label: "Água", realPerc: percentVolAgua, vol: vw, mass: mw, color: waterColor },
        { label: "Ar", realPerc: percentVolAr, vol: va, mass: 0, color: airColor },
    ].filter(p => p.vol > EPSILON || p.realPerc > EPSILON);

    const weights = phases.map(p => Math.max(p.realPerc, MIN_VISUAL_WEIGHT));
    const totalWeight = weights.reduce((acc, w) => acc + w, 0);
    const visualWidths = weights.map(w => (w / totalWeight) * 100);

    const isDistorted = phases.some(p => p.realPerc < MIN_VISUAL_WEIGHT && p.realPerc > EPSILON);

    return (
        <div className={cn("w-full space-y-1", className)}>
            <div
                className="w-full h-24 md:h-20 border border-border/50 rounded-xl flex overflow-hidden shadow-sm ring-1 ring-border/20"
                aria-label="Diagrama Trifásico do Solo"
            >
                {phases.map((phase, idx) => (
                    <PhaseBlock
                        key={phase.label}
                        label={phase.label}
                        percentage={phase.realPerc}
                        volume={phase.vol}
                        mass={phase.mass}
                        colorClass={phase.color}
                        widthPercentage={visualWidths[idx]}
                    />
                ))}
            </div>
            {isDistorted && (
                <p className="text-[10px] text-center text-muted-foreground/60 italic">
                    * Escala ajustada para legibilidade. Proporções reais:{" "}
                    {phases.map(p => `${p.label} ${p.realPerc.toFixed(1)}%`).join(", ")}.
                </p>
            )}
        </div>
    );
}

export default memo(DiagramaFases);