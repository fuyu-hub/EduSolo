import { useState, useEffect, createContext, useContext, ReactNode } from "react";
import { GraduationCap, X, Sparkles } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const WELCOME_DIALOG_KEY = "edusolo-welcome-shown";
const TOURS_ENABLED_KEY = "edusolo-tours-enabled";

// Context para gerenciar o estado dos tours de forma reativa
interface ToursContextType {
  toursEnabled: boolean;
  setToursEnabled: (enabled: boolean) => void;
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

  return (
    <ToursContext.Provider value={{ toursEnabled, setToursEnabled }}>
      {children}
    </ToursContext.Provider>
  );
}

interface WelcomeDialogProps {
  onComplete?: (toursEnabled: boolean) => void;
}

/**
 * Dialog de boas-vindas que pergunta ao usuário se deseja ver tutoriais
 * Aparece apenas na primeira visita ao app
 */
export function WelcomeDialog({ onComplete }: WelcomeDialogProps) {
  const [open, setOpen] = useState(false);
  const context = useContext(ToursContext);

  useEffect(() => {
    // Verifica se já foi mostrado antes
    const hasSeenWelcome = localStorage.getItem(WELCOME_DIALOG_KEY);

    if (!hasSeenWelcome) {
      // Delay para garantir que a página carregou completamente
      const timer = setTimeout(() => {
        setOpen(true);
      }, 800);

      return () => clearTimeout(timer);
    }
  }, []);

  const handleChoice = (enableTours: boolean) => {
    // Salvar que já viu o welcome
    localStorage.setItem(WELCOME_DIALOG_KEY, "true");

    // Salvar preferência de tours
    localStorage.setItem(TOURS_ENABLED_KEY, enableTours ? "true" : "false");

    // Atualizar contexto
    context?.setToursEnabled(enableTours);

    // Se desabilitou, marcar todos os tours como vistos
    if (!enableTours) {
      // Limpar tours existentes e adicionar flag global
      const keys = Object.keys(localStorage).filter(key => key.startsWith("tour-seen-"));
      keys.forEach(key => localStorage.setItem(key, "true"));
      localStorage.setItem("tours-globally-disabled", "true");
    } else {
      localStorage.removeItem("tours-globally-disabled");
    }

    setOpen(false);
    onComplete?.(enableTours);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        className="sm:max-w-[500px] border-primary/20"
        onInteractOutside={(e) => e.preventDefault()} // Previne fechar clicando fora
      >
        <DialogHeader>
          <div className="mx-auto mb-4 w-16 h-16 rounded-2xl bg-gradient-to-br from-primary via-primary to-primary/70 flex items-center justify-center shadow-lg">
            <Sparkles className="w-8 h-8 text-white" />
          </div>

          <DialogTitle className="text-center text-2xl">
            Bem-vindo ao EduSolos! 👋
          </DialogTitle>

          <DialogDescription className="text-center text-base pt-2">
            Este é um sistema completo para análise e aprendizado em Mecânica dos Solos.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
                <GraduationCap className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-foreground mb-1">
                  Gostaria de ver tutoriais interativos?
                </h4>
                <p className="text-sm text-muted-foreground">
                  Os tutoriais guiam você pelos recursos do sistema, explicando cada funcionalidade passo a passo.
                  Você pode reativá-los depois nas configurações.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-card border border-border rounded-lg p-4 space-y-2">
              <div className="flex items-center gap-2 text-green-600 dark:text-green-500">
                <div className="w-2 h-2 rounded-full bg-green-600 dark:bg-green-500" />
                <span className="text-sm font-semibold">Com Tutorial</span>
              </div>
              <ul className="text-xs text-muted-foreground space-y-1 ml-4">
                <li>• Tours guiados em cada módulo</li>
                <li>• Dicas contextuais</li>
                <li>• Exemplos práticos</li>
                <li>• Perfeito para iniciantes</li>
              </ul>
            </div>

            <div className="bg-card border border-border rounded-lg p-4 space-y-2">
              <div className="flex items-center gap-2 text-blue-600 dark:text-blue-500">
                <div className="w-2 h-2 rounded-full bg-blue-600 dark:bg-blue-500" />
                <span className="text-sm font-semibold">Sem Tutorial</span>
              </div>
              <ul className="text-xs text-muted-foreground space-y-1 ml-4">
                <li>• Acesso direto aos módulos</li>
                <li>• Interface limpa</li>
                <li>• Sem interrupções</li>
                <li>• Ideal para experientes</li>
              </ul>
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={() => handleChoice(false)}
            className="w-full sm:flex-1"
          >
            <X className="w-4 h-4 mr-2" />
            Não, Obrigado
          </Button>
          <Button
            onClick={() => handleChoice(true)}
            className="w-full sm:flex-1 bg-primary hover:bg-primary/90"
          >
            <GraduationCap className="w-4 h-4 mr-2" />
            Sim, Quero Aprender!
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
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

