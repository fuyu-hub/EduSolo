import * as React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Info, CheckCircle2, AlertCircle } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export interface InputEnhancedProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  tooltip?: string;
  error?: string;
  success?: boolean;
  helperText?: string;
  isLoading?: boolean;
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
}

export const InputEnhanced = React.forwardRef<HTMLInputElement, InputEnhancedProps>(
  ({ 
    label, 
    tooltip, 
    error, 
    success, 
    helperText,
    isLoading,
    prefix,
    suffix,
    className,
    id,
    ...props 
  }, ref) => {
    const [isFocused, setIsFocused] = React.useState(false);
    const inputId = id || React.useId();

    return (
      <div className="space-y-2">
        {/* Label com tooltip */}
        {label && (
          <div className="flex items-center gap-2">
            <Label 
              htmlFor={inputId} 
              className={cn(
                "transition-colors duration-200",
                isFocused && "text-primary",
                error && "text-destructive"
              )}
            >
              {label}
            </Label>
            {tooltip && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="w-4 h-4 text-muted-foreground cursor-help hover:text-primary transition-colors" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p>{tooltip}</p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        )}

        {/* Input Container */}
        <div className="relative group">
          {/* Prefix */}
          {prefix && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
              {prefix}
            </div>
          )}

          {/* Input */}
          <Input
            ref={ref}
            id={inputId}
            className={cn(
              "transition-all duration-200",
              prefix && "pl-10",
              suffix && "pr-10",
              error && "border-destructive focus-visible:ring-destructive",
              success && "border-green-500 focus-visible:ring-green-500",
              isFocused && !error && "shadow-md shadow-primary/10 scale-[1.01]",
              isLoading && "opacity-50",
              className
            )}
            onFocus={(e) => {
              setIsFocused(true);
              props.onFocus?.(e);
            }}
            onBlur={(e) => {
              setIsFocused(false);
              props.onBlur?.(e);
            }}
            disabled={isLoading || props.disabled}
            aria-invalid={!!error}
            aria-describedby={
              error ? `${inputId}-error` : 
              helperText ? `${inputId}-helper` : 
              undefined
            }
            {...props}
          />

          {/* Suffix / Status Icons */}
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {isLoading && (
              <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            )}
            {!isLoading && success && (
              <CheckCircle2 className="w-4 h-4 text-green-500 animate-in zoom-in duration-200" />
            )}
            {!isLoading && error && (
              <AlertCircle className="w-4 h-4 text-destructive animate-in zoom-in duration-200" />
            )}
            {suffix && !isLoading && !success && !error && (
              <div className="text-muted-foreground">{suffix}</div>
            )}
          </div>

          {/* Focus Ring Animation */}
          <div 
            className={cn(
              "absolute inset-0 rounded-md pointer-events-none transition-opacity duration-200",
              "bg-gradient-to-r from-primary/20 via-primary/10 to-transparent opacity-0",
              isFocused && "opacity-100 animate-pulse"
            )}
          />
        </div>

        {/* Helper Text / Error */}
        {(helperText || error) && (
          <p
            id={error ? `${inputId}-error` : `${inputId}-helper`}
            className={cn(
              "text-sm animate-in slide-in-from-top-1 duration-200",
              error ? "text-destructive" : "text-muted-foreground"
            )}
          >
            {error || helperText}
          </p>
        )}
      </div>
    );
  }
);

InputEnhanced.displayName = "InputEnhanced";

