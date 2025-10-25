import React, { createContext, useContext, useState, useCallback, useEffect } from "react";

export interface TourStep {
  target: string; // Seletor CSS ou ID do elemento
  title: string;
  content: string;
  placement?: "top" | "bottom" | "left" | "right";
  spotlightPadding?: number;
}

interface TourContextType {
  isActive: boolean;
  currentStep: number;
  steps: TourStep[];
  startTour: (steps: TourStep[], tourId: string, force?: boolean) => void;
  endTour: () => void;
  nextStep: () => void;
  prevStep: () => void;
  skipTour: () => void;
  tourId: string | null;
}

const TourContext = createContext<TourContextType | undefined>(undefined);

export function TourProvider({ children }: { children: React.ReactNode }) {
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [steps, setSteps] = useState<TourStep[]>([]);
  const [tourId, setTourId] = useState<string | null>(null);

  const startTour = useCallback((newSteps: TourStep[], id: string, force: boolean = false) => {
    // Verificar se o usuário já viu este tour (ignorar se force=true)
    if (!force) {
      const hasSeenTour = localStorage.getItem(`tour-seen-${id}`);
      if (hasSeenTour === "true") {
        return;
      }
    }

    setSteps(newSteps);
    setCurrentStep(0);
    setTourId(id);
    setIsActive(true);
  }, []);

  const endTour = useCallback(() => {
    if (tourId) {
      localStorage.setItem(`tour-seen-${tourId}`, "true");
    }
    setIsActive(false);
    setCurrentStep(0);
    setSteps([]);
    setTourId(null);
  }, [tourId]);

  const skipTour = useCallback(() => {
    endTour();
  }, [endTour]);

  const nextStep = useCallback(() => {
    if (currentStep < steps.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      endTour();
    }
  }, [currentStep, steps.length, endTour]);

  const prevStep = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  }, [currentStep]);

  // Scroll to element when step changes
  useEffect(() => {
    if (isActive && steps[currentStep]) {
      // Pequeno delay para garantir que o elemento está renderizado
      const timer = setTimeout(() => {
        const element = document.querySelector(steps[currentStep].target);
        if (element) {
          const rect = element.getBoundingClientRect();
          const absoluteTop = window.pageYOffset + rect.top;
          
          // Calcular posição ideal considerando espaço para o tooltip
          // Deixar espaço extra acima e abaixo (300px de cada lado)
          const tooltipSpace = 300;
          const viewportHeight = window.innerHeight;
          
          // Se o elemento é muito grande, centralizar ele
          if (rect.height > viewportHeight - tooltipSpace * 2) {
            const middle = absoluteTop - (viewportHeight / 2) + (rect.height / 2);
            window.scrollTo({
              top: middle,
              behavior: "smooth",
            });
          } else {
            // Tentar posicionar o elemento na parte superior da tela com espaço para tooltip acima
            const targetTop = absoluteTop - tooltipSpace;
            
            // Verificar se há espaço suficiente abaixo também
            const elementBottom = absoluteTop + rect.height;
            const bottomSpace = window.pageYOffset + viewportHeight - elementBottom;
            
            if (bottomSpace < tooltipSpace) {
              // Se não há espaço embaixo, tentar centralizar
              const middle = absoluteTop - (viewportHeight / 2) + (rect.height / 2);
              window.scrollTo({
                top: Math.max(0, middle),
                behavior: "smooth",
              });
            } else {
              // Há espaço, posicionar com margem superior
              window.scrollTo({
                top: Math.max(0, targetTop),
                behavior: "smooth",
              });
            }
          }
        }
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [currentStep, isActive, steps]);

  return (
    <TourContext.Provider
      value={{
        isActive,
        currentStep,
        steps,
        startTour,
        endTour,
        nextStep,
        prevStep,
        skipTour,
        tourId,
      }}
    >
      {children}
    </TourContext.Provider>
  );
}

export function useTour() {
  const context = useContext(TourContext);
  if (context === undefined) {
    throw new Error("useTour must be used within a TourProvider");
  }
  return context;
}

