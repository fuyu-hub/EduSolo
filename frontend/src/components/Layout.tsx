// Adiciona React à importação
import React, { useState, useEffect } from "react";
import { Menu, Calculator, FileText, BookOpen, Layers, Droplets, BarChart3, TrendingDown, ArrowLeft, Settings, Sun, Moon, Info } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/hooks/use-theme";
import { IsometricCube } from "@/components/ui/isometric-cube";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

const menuItems = [
  {
    title: "Análise Geotécnica",
    items: [
      { icon: Calculator, label: "Índices Físicos", path: "/indices-fisicos", tourId: "" },
      { icon: Droplets, label: "Limites de Consistência", path: "/limites-consistencia", tourId: "" },
      { icon: BarChart3, label: "Granulometria", path: "/granulometria", tourId: "" },
      { icon: Layers, label: "Compactação", path: "/compactacao", tourId: "" },
      { icon: FileText, label: "Tensões Geostáticas", path: "/tensoes", tourId: "" },
      { icon: TrendingDown, label: "Acréscimo de Tensões", path: "/acrescimo-tensoes", tourId: "" },
    ],
  },
  {
    title: "Ferramentas",
    items: [
      { icon: BookOpen, label: "Material Educacional", path: "/educacional", tourId: "" },
      { icon: Settings, label: "Configurações", path: "/settings", tourId: "settings-menu" },
      { icon: Info, label: "Sobre", path: "/about", tourId: "" },
    ],
  },
];

// Componente para o conteúdo da Sidebar (reutilizável)
const SidebarContent = ({ collapsed, onLinkClick }: { collapsed: boolean; onLinkClick?: () => void }) => {
  const location = useLocation();

  return (
    <>
      {/* Logo */}
      <div className="h-16 flex items-center justify-center px-3">
        {/* Link fecha a Sheet se onLinkClick estiver definido */}
        <ConditionalSheetClose shouldWrap={!!onLinkClick} asChild>
          <Link to="/" className="flex items-center gap-2.5 group" onClick={onLinkClick}>
            {collapsed ? (
              // Mostrar "ES" quando colapsado
              <span className="text-xl font-bold text-primary group-hover:scale-105 transition-transform">ES</span>
            ) : (
              // Mostrar logo completo quando expandido
              <div className="flex items-center gap-2.5">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-md group-hover:scale-105 group-hover:rotate-3 transition-all">
                  <IsometricCube className="w-7 h-7 text-white" />
                </div>
                <span className="text-xl font-bold text-foreground group-hover:text-primary transition-colors">
                  Edu<span className="text-primary">Solo</span>
                </span>
              </div>
            )}
          </Link>
        </ConditionalSheetClose>
      </div>

      {/* Navigation */}
      <nav className="p-3 space-y-4">
        {menuItems.map((section) => (
          <div key={section.title}>
            {!collapsed && (
              <h3 className="px-3 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                {section.title}
              </h3>
            )}
            <div className="space-y-1.5">
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                const buttonContent = (
                   <>
                    <Icon className={cn("h-5 w-5", !collapsed && "mr-3")} />
                    {!collapsed && <span className="font-medium">{item.label}</span>}
                   </>
                );

                // Use ConditionalSheetClose para envolver o Link apenas no mobile
                return (
                   <ConditionalSheetClose key={item.path} shouldWrap={!!onLinkClick} asChild>
                      <Link to={item.path} onClick={onLinkClick} title={collapsed ? item.label : undefined}>
                <Button
                  data-tour={item.tourId}
                  variant="ghost"
                  className={cn(
                    "w-full transition-all duration-300 h-10 rounded-lg",
                    collapsed ? "justify-center px-2" : "justify-start px-3",
                    isActive
                      ? "bg-gradient-to-r from-primary/20 to-primary/10 text-primary hover:from-primary/30 hover:to-primary/20 shadow-sm border border-primary/30"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary/50 hover:scale-[1.01] border border-transparent"
                  )}
                  aria-label={item.label}
                  aria-current={isActive ? "page" : undefined}
                >
                  {buttonContent}
                </Button>
                      </Link>
                   </ConditionalSheetClose>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
    </>
  );
};

// Componente auxiliar para renderizar SheetClose condicionalmente
// Agora usa React.ComponentProps e React.ReactNode corretamente
const ConditionalSheetClose = ({ shouldWrap, children, ...props }: { shouldWrap: boolean; children: React.ReactNode } & React.ComponentProps<typeof SheetClose>) => {
  // Se não deve envolver ou se children não for um elemento válido, retorna children diretamente
  if (!shouldWrap || !React.isValidElement(children)) {
    return <>{children}</>;
  }
  // Envolve o children com SheetClose se shouldWrap for true
  return <SheetClose {...props}>{children}</SheetClose>;
};


// Agora usa React.ReactNode corretamente
export function Layout({ children }: { children: React.ReactNode }) {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggleMode } = useTheme();

  const [collapsed, setCollapsed] = useState<boolean>(() => {
    // Default to true (collapsed) if on mobile or no localStorage value
    if (typeof window !== 'undefined') {
       const mobileCheck = window.innerWidth < 768;
       if (mobileCheck) return true; // Always default to collapsed on mobile load/check
       // For desktop, check localStorage, default to true if not found
       return JSON.parse(localStorage.getItem('sidebarCollapsed') ?? 'true');
    }
    return true; // Fallback default
  });

  const [mobileOpen, setMobileOpen] = useState(false);

  // Effect to save desktop state
  useEffect(() => {
    if (!isMobile) { // Only save state when on desktop
      localStorage.setItem('sidebarCollapsed', JSON.stringify(collapsed));
    }
  }, [collapsed, isMobile]);

   // Effect to ensure sidebar is considered collapsed visually on mobile resize/load
   useEffect(() => {
    if (isMobile) {
       // We don't need to visually collapse the <aside> as it's not rendered,
       // but we ensure the logic considers it collapsed if we switch TO mobile.
       // Set the state only if it's not already collapsed, to avoid unnecessary re-renders.
       if(!collapsed) {
         setCollapsed(true);
       }
    } else {
        // Optional: When switching back to desktop, restore saved preference
        const savedState = JSON.parse(localStorage.getItem('sidebarCollapsed') ?? 'true');
        setCollapsed(savedState);
    }
  }, [isMobile]); // Re-run when isMobile changes

  const toggleDesktopSidebar = () => {
    if (!isMobile) {
      setCollapsed((prev) => !prev); // Use functional update
    }
  };

  // Handler for Sheet's onOpenChange - syncs with mobileOpen state
  const handleSheetOpenChange = (open: boolean) => {
    setMobileOpen(open);
  };

  return (
    // Wrap the entire structure potentially needing Sheet context in the Sheet component
    <Sheet open={isMobile && mobileOpen} onOpenChange={handleSheetOpenChange}>
      <div className="flex min-h-screen w-full bg-background">

        {/* -- Mobile Only: Sheet Content (Portal'ed) -- */}
        {/* This SheetContent is controlled by the Sheet above */}
        <SheetContent side="left" className="p-0 w-64 glass border-r border-sidebar-border/50 data-[state=closed]:duration-0 data-[state=open]:duration-0 sm:data-[state=closed]:duration-0 sm:data-[state=open]:duration-0"> {/* Remove default animations if needed */}
          {/* Ensure onLinkClick is passed ONLY when it's for mobile */}
          <SidebarContent collapsed={false} onLinkClick={() => setMobileOpen(false)} />
        </SheetContent>

        {/* -- Desktop Sidebar (Rendered only on Desktop) -- */}
        {!isMobile && (
          <aside
            className={cn(
              "glass-card transition-[width] duration-300 ease-in-out border-r border-sidebar-border/30 fixed left-0 top-0 h-full z-20 shadow-modern",
              collapsed ? "w-16" : "w-64"
            )}
          >
            {/* onLinkClick is not needed/passed here */}
            <SidebarContent collapsed={collapsed} />
          </aside>
        )}

        {/* -- Main Content Area -- */}
        <div
          className={cn(
            "flex-1 transition-[margin-left] duration-300 ease-in-out",
             // Apply margin only on desktop
            !isMobile && (collapsed ? "ml-16" : "ml-64")
          )}
        >
          {/* Header */}
          <header className="h-16 glass-card border-b border-border/30 sticky top-0 z-10 flex items-center px-4 md:px-6 shadow-sm">
            {/* Button is always rendered, but wrapped by SheetTrigger conditionally */}
            <Button
              variant="ghost"
              size="icon"
              onClick={isMobile ? undefined : toggleDesktopSidebar} // Only toggle desktop state if not mobile
              className="text-muted-foreground hover:text-foreground"
              aria-label={isMobile ? "Abrir menu" : (collapsed ? "Expandir menu" : "Recolher menu")}
              asChild={isMobile} // Make the Button the child of SheetTrigger on mobile
            >
              {isMobile ? (
                // On mobile, Button is wrapped by SheetTrigger
                <SheetTrigger aria-label="Abrir menu">
                   <Menu className="h-5 w-5" />
                </SheetTrigger>
              ) : (
                // On desktop, Button is standalone
                <Menu className="h-5 w-5" />
              )}
            </Button>
            
            {/* Botão de Voltar */}
            {location.pathname !== "/" && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/")}
                className="ml-2 text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Voltar</span>
              </Button>
            )}
            
            <div className="flex-1"></div>
            
            {/* Botão de Toggle de Modo Claro/Escuro */}
            <Button
              data-tour="theme-toggle"
              variant="ghost"
              size="icon"
              onClick={toggleMode}
              className="text-muted-foreground hover:text-foreground transition-all duration-200 hover:bg-primary/10 hover:text-primary"
              aria-label={theme.mode === "dark" ? "Ativar modo claro" : "Ativar modo escuro"}
            >
              {theme.mode === "dark" ? (
                <Sun className="h-5 w-5 transition-transform hover:rotate-90" />
              ) : (
                <Moon className="h-5 w-5 transition-transform hover:-rotate-12" />
              )}
            </Button>
          </header>

          {/* Page Content */}
          <main className="p-4 md:p-6 lg:p-8 animate-in fade-in slide-in-from-bottom-4 duration-500 min-h-screen">{children}</main>
        </div>
      </div>
    </Sheet>
  );
}