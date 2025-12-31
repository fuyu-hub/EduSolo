import { createContext, useContext, ReactNode, useState } from "react";

const TOURS_ENABLED_KEY = "edusolo-tours-enabled";

// Context para gerenciar o estado dos tours de forma reativa
interface ToursContextType {
  toursEnabled: boolean;
  setToursEnabled: (enabled: boolean) => void;
  resetAllTours: () => void;
}

const ToursContext = createContext<ToursContextType | undefined>(undefined);

export function ToursProvider({ children }: { children: ReactNode }) {
  const [toursEnabled, setToursEnabledState] = useState(() => {
    const toursDisabled = localStorage.getItem("tours-globally-disabled") === "true";
    return !toursDisabled;
  });

  const setToursEnabled = (enabled: boolean) => {
    setToursEnabledState(enabled);
    if (enabled) {
      localStorage.removeItem("tours-globally-disabled");
    } else {
      localStorage.setItem("tours-globally-disabled", "true");
    }
  };

  const resetAllTours = () => {
    // Limpar todos os tours vistos
    const keys = Object.keys(localStorage).filter(key => key.startsWith("tour-seen-"));
    keys.forEach(key => localStorage.removeItem(key));
    // Garantir que tours estão habilitados
    setToursEnabled(true);
  };

  return (
    <ToursContext.Provider value={{ toursEnabled, setToursEnabled, resetAllTours }}>
      {children}
    </ToursContext.Provider>
  );
}

/**
 * Hook para verificar se tours estão habilitados (REATIVO)
 */
export function useToursEnabled(): boolean {
  const context = useContext(ToursContext);
  if (context === undefined) {
    // Fallback se não estiver dentro do Provider
    return localStorage.getItem("tours-globally-disabled") !== "true";
  }
  return context.toursEnabled;
}

/**
 * Hook para obter controle completo sobre tours
 */
export function useToursControl() {
  const context = useContext(ToursContext);
  if (context === undefined) {
    throw new Error("useToursControl must be used within a ToursProvider");
  }
  return context;
}

// Re-export for backwards compatibility (WelcomeDialog component removed)
export const WELCOME_DIALOG_KEY = "edusolo-welcome-shown";

// Dummy WelcomeDialog that renders nothing (for backwards compatibility)
export function WelcomeDialog() {
  return null;
}
