import { useEffect, useState, useRef } from "react";
import { useTour } from "@/contexts/TourContext";
import { Button } from "@/components/ui/button";
import { X, ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export function Tour() {
  const { isActive, currentStep, steps, nextStep, prevStep, skipTour } = useTour();
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const [elementFound, setElementFound] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const retryCountRef = useRef(0);

  const currentStepData = steps[currentStep];

  useEffect(() => {
    if (!isActive || !currentStepData) {
      setTargetRect(null);
      setElementFound(false);
      retryCountRef.current = 0;
      return;
    }

    const updatePosition = () => {
      const element = document.querySelector(currentStepData.target);
      
      if (!element) {
        // Tentar novamente após um delay se o elemento não foi encontrado
        if (retryCountRef.current < 10) {
          retryCountRef.current++;
          setTimeout(updatePosition, 100);
        }
        return;
      }

      setElementFound(true);
      retryCountRef.current = 0;
      
      const rect = element.getBoundingClientRect();
      setTargetRect(rect);

      // Aguardar o próximo frame para ter o tamanho real do tooltip
      requestAnimationFrame(() => {
        const padding = currentStepData.spotlightPadding || 12;
        const tooltipElement = tooltipRef.current;
        const tooltipWidth = tooltipElement?.offsetWidth || 420;
        const tooltipHeight = tooltipElement?.offsetHeight || 250;
        const placement = currentStepData.placement || "bottom";
        const gap = 20;

        let top = 0;
        let left = 0;

        switch (placement) {
          case "bottom":
            top = rect.bottom + padding + gap;
            left = rect.left + rect.width / 2 - tooltipWidth / 2;
            break;
          case "top":
            top = rect.top - padding - tooltipHeight - gap;
            left = rect.left + rect.width / 2 - tooltipWidth / 2;
            break;
          case "left":
            top = rect.top + rect.height / 2 - tooltipHeight / 2;
            left = rect.left - padding - tooltipWidth - gap;
            break;
          case "right":
            top = rect.top + rect.height / 2 - tooltipHeight / 2;
            left = rect.right + padding + gap;
            break;
        }

        // Ajustar para não sair da tela
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;
        const margin = 20;

        if (left < margin) left = margin;
        if (left + tooltipWidth > windowWidth - margin) left = windowWidth - tooltipWidth - margin;
        if (top < margin) top = margin;
        if (top + tooltipHeight > windowHeight - margin) {
          // Se não cabe embaixo, tentar em cima
          const topPosition = rect.top - padding - tooltipHeight - gap;
          if (topPosition > margin) {
            top = topPosition;
          } else {
            top = windowHeight - tooltipHeight - margin;
          }
        }

        setTooltipPosition({ top, left });
      });
    };

    // Pequeno delay para garantir que o DOM está pronto
    const initialTimeout = setTimeout(updatePosition, 100);

    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      clearTimeout(initialTimeout);
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [isActive, currentStepData, currentStep]);

  if (!isActive || !currentStepData) {
    return null;
  }

  if (!elementFound || !targetRect) {
    // Mostrar indicador de carregamento
    return (
      <div className="fixed inset-0 z-[9999] pointer-events-none flex items-center justify-center">
        <div className="glass-strong rounded-lg p-4 pointer-events-auto">
          <div className="flex items-center gap-2 text-foreground">
            <Sparkles className="w-4 h-4 animate-spin" />
            <span className="text-sm">Preparando tour...</span>
          </div>
        </div>
      </div>
    );
  }

  const padding = currentStepData.spotlightPadding || 12;

  return (
    <div className="fixed inset-0 z-[9999] pointer-events-none">
      {/* Overlay escuro com recorte para o elemento destacado */}
      <svg className="absolute inset-0 w-full h-full pointer-events-auto" style={{ zIndex: 9998 }}>
        <defs>
          <mask id="tour-spotlight-mask">
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            <rect
              x={targetRect.left - padding}
              y={targetRect.top - padding}
              width={targetRect.width + padding * 2}
              height={targetRect.height + padding * 2}
              rx="12"
              fill="black"
            />
          </mask>
        </defs>
        <rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          fill="black"
          opacity="0.7"
          mask="url(#tour-spotlight-mask)"
          onClick={skipTour}
        />
      </svg>

      {/* Borda pulsante ao redor do elemento */}
      <div
        className="absolute pointer-events-none animate-pulse"
        style={{
          top: targetRect.top - padding,
          left: targetRect.left - padding,
          width: targetRect.width + padding * 2,
          height: targetRect.height + padding * 2,
          border: "3px solid hsl(var(--primary))",
          borderRadius: "12px",
          boxShadow: "0 0 20px hsl(var(--primary) / 0.5)",
          zIndex: 9999,
        }}
      />

      {/* Tooltip */}
      <div
        ref={tooltipRef}
        className="absolute pointer-events-auto animate-in fade-in zoom-in-95 duration-300"
        style={{
          top: tooltipPosition.top,
          left: tooltipPosition.left,
          maxWidth: "min(420px, calc(100vw - 40px))",
          zIndex: 10000,
        }}
      >
        <div className="glass-strong rounded-2xl border border-white/20 shadow-2xl p-6 backdrop-blur-xl">
          {/* Gradiente decorativo */}
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/10 via-transparent to-transparent pointer-events-none" />
          
          {/* Header */}
          <div className="relative flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <div className="flex items-center gap-1.5 bg-primary/20 backdrop-blur-sm px-2.5 py-1 rounded-full border border-primary/30">
                  <Sparkles className="w-3 h-3 text-primary" />
                  <span className="text-xs font-semibold text-primary">
                    {currentStep + 1} de {steps.length}
                  </span>
                </div>
              </div>
              <h3 className="text-lg font-bold text-foreground">{currentStepData.title}</h3>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={skipTour}
              className="h-8 w-8 -mr-2 -mt-2 hover:bg-destructive/20 hover:text-destructive"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Content */}
          <p className="relative text-sm text-muted-foreground leading-relaxed mb-6">
            {currentStepData.content}
          </p>

          {/* Progress dots */}
          <div className="relative flex justify-center gap-1.5 mb-6">
            {steps.map((_, index) => (
              <div
                key={index}
                className={cn(
                  "h-1.5 rounded-full transition-all duration-300",
                  index === currentStep
                    ? "w-8 bg-primary shadow-lg shadow-primary/50"
                    : index < currentStep
                    ? "w-1.5 bg-primary/50"
                    : "w-1.5 bg-border"
                )}
              />
            ))}
          </div>

          {/* Navigation */}
          <div className="relative flex items-center justify-between gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={skipTour}
              className="text-muted-foreground hover:text-foreground"
            >
              Pular Tour
            </Button>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={prevStep}
                disabled={currentStep === 0}
                className={cn(
                  "backdrop-blur-sm",
                  currentStep === 0 && "opacity-50 cursor-not-allowed"
                )}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Anterior
              </Button>
              <Button
                size="sm"
                onClick={nextStep}
                className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/30"
              >
                {currentStep === steps.length - 1 ? (
                  <>
                    <Sparkles className="h-4 w-4 mr-1" />
                    Concluir
                  </>
                ) : (
                  <>
                    Próximo
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

