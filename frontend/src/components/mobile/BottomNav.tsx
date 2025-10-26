import { Home, Settings, BookOpen, MoreHorizontal, Save, Beaker, Droplet, Filter, Database, Mountain, Target, Info, Rocket } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useState } from "react";

const moreItems = [
  { icon: Beaker, label: "Índices Físicos", path: "/indices-fisicos" },
  { icon: Droplet, label: "Limites de Consistência", path: "/limites-consistencia" },
  { icon: Filter, label: "Granulometria", path: "/granulometria" },
  { icon: Database, label: "Compactação", path: "/compactacao" },
  { icon: Mountain, label: "Tensões Geostáticas", path: "/tensoes" },
  { icon: Target, label: "Acréscimo de Tensões", path: "/acrescimo-tensoes" },
  { icon: Info, label: "Sobre", path: "/about" },
  { icon: Rocket, label: "Planos Futuros", path: "/planos-futuros" },
];

interface NavItem {
  icon: typeof Home;
  label: string;
  path: string;
}

const mainNavItems: NavItem[] = [
  { icon: Save, label: "Salvos", path: "/salvos" },
  { icon: BookOpen, label: "Educacional", path: "/educacional" },
  { icon: Home, label: "Início", path: "/" },
  { icon: Settings, label: "Config", path: "/settings" },
];

export function BottomNav() {
  const location = useLocation();
  const [moreOpen, setMoreOpen] = useState(false);

  const isActive = (path: string) => {
    if (path === "/") {
      return location.pathname === "/";
    }
    return location.pathname.startsWith(path);
  };

  return (
    <>
      {/* Espaçador para evitar que o conteúdo fique sob a bottom nav */}
      <div className="h-16" />
      
      {/* Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-t border-border/40 safe-area-inset-bottom">
        <div className="flex items-center justify-center h-16 px-2 gap-1">
          {mainNavItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex flex-col items-center justify-center h-full gap-1 transition-all duration-200 px-6",
                  "active:scale-95"
                )}
              >
                <div
                  className={cn(
                    "flex items-center justify-center w-11 h-11 rounded-xl transition-all duration-200",
                    active
                      ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                  )}
                >
                  <Icon className="w-5 h-5" strokeWidth={active ? 2.5 : 2} />
                </div>
                <span
                  className={cn(
                    "text-[10px] font-medium transition-colors duration-200",
                    active ? "text-primary" : "text-muted-foreground"
                  )}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}

          {/* Botão "Mais" com Sheet */}
          <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
            <SheetTrigger asChild>
              <button
                className={cn(
                  "flex flex-col items-center justify-center h-full gap-1 transition-all duration-200 px-6",
                  "active:scale-95"
                )}
              >
                <div
                  className={cn(
                    "flex items-center justify-center w-11 h-11 rounded-xl transition-all duration-200",
                    "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                  )}
                >
                  <MoreHorizontal className="w-5 h-5" strokeWidth={2} />
                </div>
                <span className="text-[10px] font-medium text-muted-foreground">
                  Mais
                </span>
              </button>
            </SheetTrigger>
            
            <SheetContent 
              side="bottom" 
              className="h-[70vh] rounded-t-2xl"
            >
              <SheetHeader>
                <SheetTitle>Mais Opções</SheetTitle>
              </SheetHeader>
              
              <div className="grid grid-cols-3 gap-3 mt-6">
                {moreItems
                  .filter((item) => !isActive(item.path))
                  .map((item) => {
                    const Icon = item.icon;
                  
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        onClick={() => setMoreOpen(false)}
                        className={cn(
                          "flex flex-col items-center gap-2 p-4 rounded-xl transition-all duration-200",
                          "active:scale-95",
                          "bg-secondary/50 hover:bg-secondary border-2 border-transparent hover:border-primary/20"
                        )}
                      >
                        <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-background text-foreground">
                          <Icon className="w-6 h-6" />
                        </div>
                        <span className="text-xs font-medium text-center line-clamp-2 text-foreground">
                          {item.label}
                        </span>
                      </Link>
                    );
                  })}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </nav>
    </>
  );
}

