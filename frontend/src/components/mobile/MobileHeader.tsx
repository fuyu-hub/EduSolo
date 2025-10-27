import { ArrowLeft, Sun, Moon, Menu } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/hooks/use-theme";
import { cn } from "@/lib/utils";

interface MobileHeaderProps {
  title?: string;
  showBackButton?: boolean;
}

export function MobileHeader({ title, showBackButton = true }: MobileHeaderProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggleMode } = useTheme();
  const isHome = location.pathname === "/";

  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-background/95 backdrop-blur-md border-b border-border/40 safe-area-inset-top">
      <div className="flex items-center h-14 px-4 gap-2">
        {/* Botão Voltar ou Logo */}
        {showBackButton && !isHome ? (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/")}
            className="text-foreground active:text-primary shrink-0 transition-transform active:scale-90 focus-visible:ring-0 focus-visible:ring-offset-0 [-webkit-tap-highlight-color:transparent]"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
        ) : (
          <div className="flex items-center gap-2 shrink-0">
            <img 
              src="/edusolo - logo.svg" 
              alt="EduSolo" 
              className="w-8 h-8"
            />
          </div>
        )}

        {/* Título ou Logo com Texto */}
        <div className="flex-1 min-w-0">
          {title ? (
            <h1 className="text-base font-semibold text-foreground truncate">
              {title}
            </h1>
          ) : (
            <img 
              src="/edusolo-logo-texto.svg" 
              alt="EduSolo - Ferramentas de Mecânica dos Solos" 
              className="h-7"
            />
          )}
        </div>

        {/* Botão Theme Toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleMode}
          className="text-muted-foreground active:text-primary shrink-0 transition-transform active:scale-90 focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 [-webkit-tap-highlight-color:transparent]"
          aria-label={theme.mode === "dark" ? "Ativar modo claro" : "Ativar modo escuro"}
        >
          {theme.mode === "dark" ? (
            <Sun className="h-5 w-5" />
          ) : (
            <Moon className="h-5 w-5" />
          )}
        </Button>
      </div>
    </header>
  );
}

