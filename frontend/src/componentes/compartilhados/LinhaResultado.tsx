import React from "react";
import { cn } from "@/lib/utils";
import { Info } from "lucide-react";
import { DefinicaoTooltip } from "@/components/ui/DefinicaoTooltip";
import { getDefinicao } from "./definicoes";

interface LinhaResultadoProps {
    id?: string;
    simbolo?: string | React.ReactNode;
    label?: string | React.ReactNode;
    value: number | string | null | undefined;
    unit?: string;
    precision?: number;
    highlight?: boolean;
    className?: string;
}

/**
 * Componente LinhaResultado
 * Exibe um par Rótulo: Valor + Unidade de forma padronizada.
 * Se um ID for fornecido, busca automaticamente a definição no glossário para o Tooltip.
 */
export function LinhaResultado({
    id,
    simbolo,
    label,
    value,
    unit,
    precision = 2,
    highlight = false,
    className
}: LinhaResultadoProps) {
    const definicao = id ? getDefinicao(id) : null;
    const finalLabel = label || definicao?.termo || id;
    const finalUnit = unit || definicao?.unidade || "";
    
    const hasSimbolo = !!simbolo;

    const formatValue = (val: number | string | null | undefined) => {
        if (val === null || val === undefined || (typeof val === "number" && isNaN(val))) return "—";
        if (typeof val === "string") return val;
        return val.toFixed(precision);
    };

    return (
        <div className={cn(
            "flex justify-between items-center text-[12.5px] py-1.5 px-3 rounded-md transition-colors group",
            highlight ? "font-semibold bg-primary/5 text-primary" : "text-foreground hover:bg-muted/50",
            className
        )}>
            <div className="flex items-center gap-1.5 flex-1 overflow-hidden">
                <div className="flex items-center gap-1.5 min-w-0">
                    {hasSimbolo && (
                        <span className="font-serif italic font-bold text-lg leading-none text-foreground shrink-0">
                            {simbolo}
                        </span>
                    )}
                    <span className={cn(
                        "flex items-center gap-1 text-foreground truncate",
                        hasSimbolo ? "text-xs opacity-90" : "text-sm",
                        highlight && "text-primary font-bold opacity-100"
                    )}>
                        {finalLabel}
                    </span>
                    <DefinicaoTooltip 
                        id={id} 
                        side="right"
                        termo={simbolo && definicao?.termo ? (
                            <span className="flex items-center gap-2">
                                <span className="font-serif italic font-bold">{simbolo}</span>
                                <span>{definicao.termo}</span>
                            </span>
                        ) : undefined}
                        iconClassName="w-3 h-3 group-hover:opacity-100 transition-opacity"
                    />
                </div>
            </div>
            <span className={cn(
                "font-mono font-medium text-right whitespace-nowrap ml-2 text-foreground",
                highlight && "text-primary"
            )}>
                {formatValue(value)} {(value !== null && value !== undefined && (typeof value !== "number" || !isNaN(value))) && finalUnit}
            </span>
        </div>
    );
}
