// Adiciona React à importação
import React, { useState, useEffect } from "react";
import { Menu, Beaker, Droplet, Filter, Database, Mountain, Target, MoveDown, BookOpen, ArrowLeft, Settings, Sun, Moon, Info, Rocket, FileText, LayoutGrid, ChevronDown } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/hooks/use-theme";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { MobileLayout } from "@/components/mobile/MobileLayout";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

const menuItems = [
  {
    title: "Análise Geotécnica",
    items: [
      { icon: LayoutGrid, label: "Dashboard", path: "/", tourId: "" },
    ],
  },
  {
    title: "Ferramentas",
    items: [
      { icon: FileText, label: "Relatórios", path: "/relatorios", tourId: "" },
      { icon: BookOpen, label: "Material Educacional", path: "/educacional", tourId: "" },
      { icon: Settings, label: "Configurações", path: "/settings", tourId: "settings-menu" },
      { icon: Info, label: "Sobre", path: "/about", tourId: "" },
      { icon: Rocket, label: "Planos Futuros", path: "/planos-futuros", tourId: "" },
    ],
  },
];

// Componente para o conteúdo da Sidebar (reutilizável)
const SidebarContent = ({ collapsed, onLinkClick }: { collapsed: boolean; onLinkClick?: () => void }) => {
  const location = useLocation();
  // Lista resumida de módulos para o menu expansível
  const modulesBrief = [
    { icon: Beaker, label: "Índices Físicos", path: "/indices-fisicos" },
    { icon: Droplet, label: "Limites de Consistência", path: "/limites-consistencia" },
    { icon: Filter, label: "Granulometria", path: "/granulometria" },
    { icon: Database, label: "Compactação", path: "/compactacao" },
    { icon: Mountain, label: "Tensões Geostáticas", path: "/tensoes" },
    { icon: Target, label: "Acréscimo de Tensões", path: "/acrescimo-tensoes" },
    { icon: MoveDown, label: "Recalque por Adensamento", path: "/recalque-adensamento" },
  ];
  const isModulePath =
    modulesBrief.some((m) => location.pathname.startsWith(m.path)) ||
    location.pathname === "/" ||
    location.pathname === "/dashboard";
  const [modulesOpen, setModulesOpen] = React.useState<boolean>(isModulePath);

  return (
    <>
      {/* Logo */}
      <div className="h-16 flex items-center justify-center px-3">
        {/* Link fecha a Sheet se onLinkClick estiver definido */}
        <ConditionalSheetClose shouldWrap={!!onLinkClick} asChild>
          <Link to="/" className="flex items-center gap-2.5 group" onClick={onLinkClick}>
            {collapsed ? (
              // Mostrar logo pequena quando colapsado
              <img 
                src="/edusolo - logo.svg" 
                alt="EduSolo" 
                className="w-10 h-10 group-hover:scale-105 transition-transform"
              />
            ) : (
              // Mostrar logo com texto quando expandido
              <img 
                src="/edusolo-logo-texto.svg" 
                alt="EduSolo - Ferramentas de Mecânica dos Solos" 
                className="h-20 group-hover:scale-105 transition-transform"
              />
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
                if (item.label === "Dashboard") {
                  return (
                    <Collapsible key="modules-collapsible" open={modulesOpen} onOpenChange={setModulesOpen}>
                      <CollapsibleTrigger asChild>
                        <Button
                          variant="ghost"
                          className={cn(
                            "w-full transition-all duration-300 h-10 rounded-lg",
                            collapsed ? "justify-center px-2" : "justify-start px-3",
                            modulesOpen ? "bg-gradient-to-r from-primary/20 to-primary/10 text-primary border border-primary/30" : "text-muted-foreground hover:text-foreground hover:bg-secondary/50 border border-transparent"
                          )}
                          aria-label="Dashboard"
                        >
                          {buttonContent}
                          {!collapsed && (
                            <ChevronDown className={cn("ml-auto h-4 w-4 transition-transform duration-200", modulesOpen && "rotate-180")} />
                          )}
                        </Button>
                      </CollapsibleTrigger>
                      <CollapsibleContent className={cn("mt-1 pl-0 collapsible-content", !collapsed && "pl-2")}> 
                        <div className={cn("space-y-1", collapsed ? "px-1" : "")}> 
                          {modulesBrief.map((m) => {
                            const MIcon = m.icon;
                            const active = location.pathname === m.path;
                            return (
                              <ConditionalSheetClose key={m.path} shouldWrap={!!onLinkClick} asChild>
                                <Link to={m.path} onClick={onLinkClick} title={collapsed ? m.label : undefined}>
                                  <Button
                                    variant="ghost"
                                    className={cn(
                                      "w-full h-9 rounded-md",
                                      collapsed ? "justify-center px-1" : "justify-start px-2",
                                      active ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                                    )}
                                  >
                                    <MIcon className={cn("h-4 w-4", !collapsed && "mr-2")} />
                                    {!collapsed && <span className="text-sm">{m.label}</span>}
                                  </Button>
                                </Link>
                              </ConditionalSheetClose>
                            );
                          })}
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  );
                }

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
  
  // Usa React.useMemo para garantir renderização consistente e evitar flash
  const layout = React.useMemo(() => {
    // Se for mobile, usa o MobileLayout
    if (isMobile) {
      return <MobileLayout>{children}</MobileLayout>;
    }
    
    // Caso contrário, usa o layout desktop normal
    return <DesktopLayout>{children}</DesktopLayout>;
  }, [isMobile, children]);
  
  return layout;
}

// Desktop Layout Component
function DesktopLayout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggleMode } = useTheme();

  const [collapsed, setCollapsed] = useState<boolean>(() => {
    // For desktop, check localStorage, default to true if not found
    if (typeof window !== 'undefined') {
       return JSON.parse(localStorage.getItem('sidebarCollapsed') ?? 'true');
    }
    return true; // Fallback default
  });

  // Effect to save desktop state
  useEffect(() => {
    localStorage.setItem('sidebarCollapsed', JSON.stringify(collapsed));
  }, [collapsed]);

  const toggleDesktopSidebar = () => {
    setCollapsed((prev) => !prev); // Use functional update
  };

  return (
    <div className="flex min-h-screen w-full bg-background">
      {/* -- Desktop Sidebar -- */}
      <aside
        className={cn(
          "glass-card transition-[width] duration-300 ease-in-out border-r border-sidebar-border/30 fixed left-0 top-0 h-full z-20 shadow-modern",
          collapsed ? "w-16" : "w-64"
        )}
      >
        <SidebarContent collapsed={collapsed} />
      </aside>

      {/* -- Main Content Area -- */}
      <div
        className={cn(
          "flex-1 transition-[margin-left] duration-300 ease-in-out",
          collapsed ? "ml-16" : "ml-64"
        )}
      >
        {/* Header */}
        <header className="h-16 glass-card border-b border-border/30 sticky top-0 z-10 flex items-center px-4 md:px-6 shadow-sm">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleDesktopSidebar}
            className="text-muted-foreground hover:text-foreground"
            aria-label={collapsed ? "Expandir menu" : "Recolher menu"}
          >
            <Menu className="h-5 w-5" />
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
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/relatorios")}
            className="mr-1 text-muted-foreground hover:text-foreground hidden md:inline-flex"
          >
            <FileText className="h-4 w-4 mr-2" />
            Relatórios
          </Button>


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
  );
}