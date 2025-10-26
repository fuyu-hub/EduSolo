import { Check, X, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ValidationRule {
  validate: (value: string) => boolean;
  message: string;
}

interface InputWithValidationProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  tooltip: string;
  placeholder?: string;
  step?: string;
  validationRules?: ValidationRule[];
  disabled?: boolean;
  optional?: boolean;
}

export default function InputWithValidation({
  id,
  label,
  value,
  onChange,
  tooltip,
  placeholder,
  step = "0.01",
  validationRules = [],
  disabled = false,
  optional = false,
}: InputWithValidationProps) {
  const isEmpty = !value || value.trim() === "";
  
  // Se opcional e vazio, não valida
  if (optional && isEmpty) {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Label htmlFor={id}>{label}</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="h-5 w-5 p-0 hover:bg-muted">
                <AlertCircle className="w-4 h-4 text-muted-foreground cursor-pointer" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="max-w-xs" align="start">
              <p className="text-sm">{tooltip}</p>
            </PopoverContent>
          </Popover>
        </div>
        <Input
          id={id}
          type="number"
          step={step}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="bg-background/50"
          placeholder={placeholder}
          disabled={disabled}
        />
      </div>
    );
  }

  let isValid = true;
  let errorMessage = "";

  if (!isEmpty) {
    for (const rule of validationRules) {
      if (!rule.validate(value)) {
        isValid = false;
        errorMessage = rule.message;
        break;
      }
    }
  } else if (!optional) {
    isValid = false;
    errorMessage = "Campo obrigatório";
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Label htmlFor={id}>{label}</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="h-5 w-5 p-0 hover:bg-muted">
              <AlertCircle className="w-4 h-4 text-muted-foreground cursor-pointer" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="max-w-xs" align="start">
            <p className="text-sm">{tooltip}</p>
          </PopoverContent>
        </Popover>
        
        {!isEmpty && (
          <div className="ml-auto">
            {isValid ? (
              <div className="flex items-center gap-1 text-green-500">
                <Check className="w-3.5 h-3.5" />
                <span className="text-xs">Válido</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 text-destructive">
                <X className="w-3.5 h-3.5" />
                <span className="text-xs">Inválido</span>
              </div>
            )}
          </div>
        )}
      </div>
      
      <Input
        id={id}
        type="number"
        step={step}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "bg-background/50 transition-colors",
          !isEmpty && isValid && "border-green-500/50 focus-visible:ring-green-500/20",
          !isEmpty && !isValid && "border-destructive/50 focus-visible:ring-destructive/20"
        )}
        placeholder={placeholder}
        disabled={disabled}
      />
      
      {!isEmpty && !isValid && errorMessage && (
        <p className="text-xs text-destructive flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />
          {errorMessage}
        </p>
      )}
    </div>
  );
}

