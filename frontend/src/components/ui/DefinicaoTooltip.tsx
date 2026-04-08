import * as React from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "./tooltip";
import { getDefinicao } from "@/componentes/compartilhados/definicoes";
import { cn } from "@/lib/utils";
import { Info } from "lucide-react";

interface DefinicaoTooltipProps {
    id?: string;
    termo?: React.ReactNode;
    descricao?: React.ReactNode;
    referencia?: React.ReactNode;
    children?: React.ReactNode;
    side?: "top" | "right" | "bottom" | "left";
    className?: string;
    iconClassName?: string;
}

export function DefinicaoTooltip({
    id,
    termo,
    descricao,
    referencia,
    children,
    side = "top",
    className,
    iconClassName,
}: DefinicaoTooltipProps) {
    // Busca no glossário se o ID for fornecido
    const definicao = id ? getDefinicao(id) : null;

    const displayTermo = termo || definicao?.termo;
    const displayDescricao = descricao || definicao?.descricao;
    const displayReferencia = referencia || definicao?.referencia;

    const triggerContent = children || (
        <button type="button" tabIndex={-1} className={cn("inline-flex items-center justify-center align-middle ml-1", className)}>
            <Info className={cn("w-3.5 h-3.5 text-white opacity-100 hover:opacity-80 transition-opacity cursor-help", iconClassName)} />
        </button>
    );

    if (!displayDescricao) return <>{triggerContent}</>;

    return (
        <Tooltip>
            <TooltipTrigger asChild>
                {triggerContent}
            </TooltipTrigger>
            <TooltipContent
                side={side}
                className={cn(
                    "max-w-xs p-3 glass border-primary/20 shadow-xl",
                    className
                )}
            >
                <div className="space-y-2">
                    {displayTermo && (
                        <h5 className="font-bold text-primary border-b border-primary/10 pb-1 mb-1">
                            {displayTermo}
                        </h5>
                    )}
                    <p className="text-xs leading-relaxed text-foreground/90">
                        {displayDescricao}
                    </p>
                    {displayReferencia && (
                        <div className="text-[10px] text-foreground/80 pt-1 border-t border-border/40 text-right italic font-medium">
                            {displayReferencia}
                        </div>
                    )}
                </div>
            </TooltipContent>
        </Tooltip>
    );
}
