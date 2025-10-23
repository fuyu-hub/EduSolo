import React from "react";
import { Button, ButtonProps } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface AccessibleButtonProps extends ButtonProps {
  /**
   * Texto descritivo para leitores de tela
   */
  ariaLabel?: string;
  
  /**
   * Indica se o botão está em estado de carregamento
   */
  isLoading?: boolean;
  
  /**
   * Texto a ser exibido durante o carregamento
   */
  loadingText?: string;
  
  /**
   * Ícone a ser exibido à esquerda do texto
   */
  leftIcon?: React.ReactNode;
  
  /**
   * Ícone a ser exibido à direita do texto
   */
  rightIcon?: React.ReactNode;
}

/**
 * Botão com melhorias de acessibilidade e UX.
 * 
 * Features:
 * - Suporte completo a aria-labels
 * - Estado de carregamento visual
 * - Ícones posicionáveis
 * - Feedback de foco aprimorado
 */
export const AccessibleButton = React.forwardRef<HTMLButtonElement, AccessibleButtonProps>(
  (
    {
      children,
      ariaLabel,
      isLoading = false,
      loadingText,
      leftIcon,
      rightIcon,
      disabled,
      className,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || isLoading;

    return (
      <Button
        ref={ref}
        disabled={isDisabled}
        aria-label={ariaLabel}
        aria-busy={isLoading}
        aria-disabled={isDisabled}
        className={cn(
          "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          "transition-all duration-200",
          className
        )}
        {...props}
      >
        {isLoading && (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
        )}
        
        {!isLoading && leftIcon && (
          <span className="mr-2" aria-hidden="true">
            {leftIcon}
          </span>
        )}
        
        <span>{isLoading ? loadingText || children : children}</span>
        
        {!isLoading && rightIcon && (
          <span className="ml-2" aria-hidden="true">
            {rightIcon}
          </span>
        )}
      </Button>
    );
  }
);

AccessibleButton.displayName = "AccessibleButton";

