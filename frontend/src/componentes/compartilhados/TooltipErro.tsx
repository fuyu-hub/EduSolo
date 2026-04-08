import React from "react";
import { AlertCircle } from "lucide-react";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface TooltipErroProps {
    mensagem?: string;
    className?: string;
}

/**
 * Componente TooltipErro
 * Exibe um indicador visual de erro (exclamação) que mostra uma mensagem ao passar o mouse.
 */
export function TooltipErro({ mensagem, className }: TooltipErroProps) {
    if (!mensagem) return null;

    return (
        <TooltipProvider delayDuration={100}>
            <Tooltip>
                <TooltipTrigger asChild>
                    <div className={cn(
                        "absolute -top-1.5 -right-1.5 w-3.5 h-3.5 rounded-full bg-red-500 text-white text-[9px] flex items-center justify-center cursor-help z-50 shadow-sm animate-in zoom-in-50 duration-200",
                        className
                    )}>
                        !
                    </div>
                </TooltipTrigger>
                <TooltipContent 
                    side="top" 
                    className="bg-destructive text-destructive-foreground border-destructive px-3 py-1.5 text-xs font-semibold shadow-xl"
                >
                    <div className="flex items-center gap-2">
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span>{mensagem}</span>
                    </div>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}
