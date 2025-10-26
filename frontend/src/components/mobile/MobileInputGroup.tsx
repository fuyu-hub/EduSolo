import { ReactNode } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Info } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface MobileInputGroupProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: "text" | "number";
  placeholder?: string;
  tooltip?: string;
  unit?: string;
  required?: boolean;
  error?: string;
  icon?: ReactNode;
  className?: string;
}

/**
 * Input otimizado para mobile com label, tooltip e unidade
 * Áreas de toque maiores e melhor feedback visual
 */
export function MobileInputGroup({
  label,
  value,
  onChange,
  type = "number",
  placeholder,
  tooltip,
  unit,
  required,
  error,
  icon,
  className,
}: MobileInputGroupProps) {
  return (
    <div className={cn("space-y-2", className)}>
      {/* Label com tooltip */}
      <div className="flex items-center justify-between">
        <Label
          className={cn(
            "text-sm font-medium flex items-center gap-2",
            required && "after:content-['*'] after:text-destructive after:ml-0.5"
          )}
        >
          {icon && <span className="text-primary">{icon}</span>}
          {label}
        </Label>
        
        {tooltip && (
          <Popover>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="w-6 h-6 rounded-full bg-muted/50 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none [-webkit-tap-highlight-color:transparent] active:scale-95"
              >
                <Info className="w-3.5 h-3.5" />
              </button>
            </PopoverTrigger>
            <PopoverContent side="left" className="max-w-xs" align="end">
              <p className="text-xs">{tooltip}</p>
            </PopoverContent>
          </Popover>
        )}
      </div>

      {/* Input com unidade */}
      <div className="relative">
        <Input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={cn(
            "h-12 text-base", // Altura maior para mobile
            unit && "pr-16", // Espaço para unidade
            error && "border-destructive focus-visible:ring-destructive"
          )}
          inputMode={type === "number" ? "decimal" : "text"}
        />
        
        {unit && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-medium">
            {unit}
          </span>
        )}
      </div>

      {/* Mensagem de erro */}
      {error && (
        <p className="text-xs text-destructive flex items-center gap-1">
          <Info className="w-3 h-3" />
          {error}
        </p>
      )}
    </div>
  );
}

