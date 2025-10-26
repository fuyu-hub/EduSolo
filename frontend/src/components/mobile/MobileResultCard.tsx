import { ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface MobileResultItemProps {
  label: string;
  value: string | number | null;
  unit?: string;
  tooltip?: string;
  highlight?: boolean;
  className?: string;
}

/**
 * Item individual de resultado otimizado para mobile
 */
export function MobileResultItem({
  label,
  value,
  unit,
  tooltip,
  highlight,
  className,
}: MobileResultItemProps) {
  const displayValue = value !== null && value !== undefined ? value : "—";

  return (
    <div
      className={cn(
        "flex items-center justify-between py-3 border-b border-border/50 last:border-0",
        highlight && "bg-primary/5 -mx-3 px-3 rounded-lg",
        className
      )}
    >
      {/* Label */}
      <div className="flex items-center gap-2 flex-1">
        <span className={cn(
          "text-sm font-medium",
          highlight ? "text-primary" : "text-muted-foreground"
        )}>
          {label}
        </span>
        
        {tooltip && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  className="w-5 h-5 rounded-full bg-muted/30 flex items-center justify-center text-muted-foreground"
                >
                  <Info className="w-3 h-3" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="left" className="max-w-xs">
                <p className="text-xs">{tooltip}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>

      {/* Value */}
      <div className="flex items-baseline gap-1.5">
        <span className={cn(
          "text-base font-semibold tabular-nums",
          highlight ? "text-primary" : "text-foreground"
        )}>
          {displayValue}
        </span>
        {unit && (
          <span className="text-xs text-muted-foreground font-medium">
            {unit}
          </span>
        )}
      </div>
    </div>
  );
}

interface MobileResultCardProps {
  title: string;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
}

/**
 * Card para exibir resultados de cálculos em mobile
 * Design compacto com boa hierarquia visual
 */
export function MobileResultCard({
  title,
  icon,
  children,
  className,
}: MobileResultCardProps) {
  return (
    <Card className={cn("overflow-hidden border border-primary/20", className)}>
      {/* Header */}
      <div className="bg-primary/5 p-4 border-b border-primary/20">
        <div className="flex items-center gap-3">
          {icon && (
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              {icon}
            </div>
          )}
          <h3 className="font-semibold text-base text-foreground">{title}</h3>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {children}
      </div>
    </Card>
  );
}

