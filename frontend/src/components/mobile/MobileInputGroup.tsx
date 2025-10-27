import { ReactNode, useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Info, AlertCircle, CheckCircle2 } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export interface ValidationRule {
  validate: (value: string) => boolean;
  message: string;
}

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
  validationRules?: ValidationRule[];
  showValidation?: boolean;
}

/**
 * Input otimizado para mobile com label, tooltip, unidade e validação em tempo real
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
  validationRules = [],
  showValidation = true,
}: MobileInputGroupProps) {
  const [validationError, setValidationError] = useState<string>("");
  const [touched, setTouched] = useState(false);
  const [isValid, setIsValid] = useState(false);

  // Validação em tempo real
  useEffect(() => {
    if (!touched || !value || validationRules.length === 0) {
      setValidationError("");
      setIsValid(false);
      return;
    }

    for (const rule of validationRules) {
      if (!rule.validate(value)) {
        setValidationError(rule.message);
        setIsValid(false);
        return;
      }
    }

    setValidationError("");
    setIsValid(true);
  }, [value, touched, validationRules]);

  const handleBlur = () => {
    setTouched(true);
  };

  const finalError = error || validationError;
  const showSuccessIndicator = showValidation && touched && value && !finalError && isValid && validationRules.length > 0;

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
                aria-label={`Informação sobre ${label}`}
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

      {/* Input com unidade e indicadores de validação */}
      <div className="relative">
        <Input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={handleBlur}
          placeholder={placeholder}
          className={cn(
            "h-12 text-base transition-all", // Altura maior para mobile
            unit && "pr-16", // Espaço para unidade
            showSuccessIndicator && "pr-20", // Espaço extra para ícone de sucesso
            finalError && "border-destructive focus-visible:ring-destructive",
            showSuccessIndicator && "border-green-500 focus-visible:ring-green-500"
          )}
          inputMode={type === "number" ? "decimal" : "text"}
          aria-invalid={!!finalError}
          aria-describedby={finalError ? `${label}-error` : undefined}
        />
        
        {/* Ícone de validação */}
        {showSuccessIndicator && (
          <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-500" />
        )}
        
        {unit && !showSuccessIndicator && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-medium">
            {unit}
          </span>
        )}
      </div>

      {/* Mensagem de erro */}
      {finalError && (
        <p id={`${label}-error`} className="text-xs text-destructive flex items-center gap-1" role="alert">
          <AlertCircle className="w-3 h-3" />
          {finalError}
        </p>
      )}
    </div>
  );
}

