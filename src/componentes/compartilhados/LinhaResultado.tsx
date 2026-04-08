/**
 * LinhaResultado — Renderizador de resultados parciais ou finais em formato de grid.
 * 
 * Exibe um par "Rótulo + Unidade + Valor" padronizado para leituras de resultados.
 * Possui integração automática com a base léxica caso providenciado o ID do glossário.
 */
import React from "react";
import { cn } from "@/lib/utils";
import { Info } from "lucide-react";
import { DefinicaoTooltip } from "@/components/ui/DefinicaoTooltip";
import { getDefinicao } from "./definicoes";

interface LinhaResultadoProps {
    /** ID de identificação interno usado para busca no dicionário `definicoes.ts` para renderizar o helper de `DefinicaoTooltip` */
    id?: string;
    /** Símbolo de engenharia ou abreviação da grandeza (Ex: "\u03B3d", "P") */
    simbolo?: string | React.ReactNode;
    /** Nome descritivo (Ex: "Peso Específico Seco Máximo") */
    label?: string | React.ReactNode;
    /** Valor numérico ou string a ser computado à direita */
    value: number | string | null | undefined;
    /** Unidade física correspondente (Ex: "g/cm³") */
    unit?: string;
    /** Casas decimais para valores number ou formatType (default: 2) */
    precision?: number;
    /** Booleana para demarcar destaque visual (exibição como valor final) */
    highlight?: boolean;
    /** Permite empurrar classes base para o Container flex do componente */
    className?: string;
}


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
            <div className={cn(
                "font-mono text-right whitespace-nowrap ml-2 flex items-baseline justify-end gap-1",
                highlight ? "text-primary" : "text-foreground"
            )}>
                <span className="font-semibold text-[15px]">
                    {formatValue(value)}
                </span>
                {(value !== null && value !== undefined && (typeof value !== "number" || !isNaN(value))) && finalUnit && (
                    <span className="text-[11px] font-medium text-foreground">
                        {finalUnit}
                    </span>
                )}
            </div>
        </div>
    );
}
