// Adiciona React à importação
import React, { useState, useEffect } from "react";
import { Menu, Beaker, Droplet, Filter, Database, Mountain, Target, MoveDown, BookOpen, ArrowLeft, Sun, Moon, Info, FileText, LayoutGrid, ChevronDown, HelpCircle, Search, Scissors } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/hooks/use-theme";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

const menuStructure = [
  {
    title: "Análise",
    items: [
      { icon: Beaker, label: "Índices e Limites", path: "/indices-limites" },
      { icon: Database, label: "Granulometria", path: "/granulometria" },
      { icon: CompactacaoIcon, label: "Compactação", path: "/compactacao" },
      { icon: Mountain, label: "Tensões Geostáticas", path: "/tensoes" },
    ],
  },
  {
    title: "Em planejamento",
    items: [
      { icon: Target, label: "Acréscimo de Tensões", path: "#", comingSoon: true },
      { icon: MoveDown, label: "Recalque por Adensamento", path: "#", comingSoon: true },
      { icon: Scissors, label: "Resistência ao Cisalhamento", path: "#", comingSoon: true },
    ],
  },
  {
    title: "Ferramentas",
    items: [
      { icon: BookOpen, label: "Material Educacional", path: "/educacional", comingSoon: true },
    ],
  },
];

import { CompactacaoIcon } from "@/componentes/icones/IconeCompactacao";

// Componente para o conteúdo da Sidebar (reutilizável)
const SidebarContent = ({ collapsed, onLinkClick }: { collapsed: boolean; onLinkClick?: () => void }) => {
  const location = useLocation();
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    "Análise": true,
    "Em planejamento": false,
    "Ferramentas": true
  });

  const toggleSection = (title: string) => {
    setOpenSections(prev => ({ ...prev, [title]: !prev[title] }));
  };

  return (
    <div className="flex flex-col h-full">
      {/* Logo Area */}
      <div className="h-14 flex items-center shrink-0">
        <ConditionalSheetClose shouldWrap={!!onLinkClick} asChild>
          <Link to="/" className="flex items-center justify-center group w-full" onClick={onLinkClick}>
            {collapsed ? (
              <span className="text-2xl font-bold tracking-tighter transition-all group-hover:scale-110">
                <span className="text-primary">E</span>
                <span className="text-foreground">S</span>
              </span>
            ) : (
              <span className="text-2xl font-bold tracking-tight transition-all">
                <span className="text-primary">Edu</span>
                <span className="text-foreground">Solos</span>
              </span>
            )}
          </Link>
        </ConditionalSheetClose>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 pb-4 overflow-y-auto space-y-5 scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent pt-2">
        {/* Dashboard - Item Isolado no Topo */}
        <div className="space-y-1">
          <ConditionalSheetClose shouldWrap={!!onLinkClick} asChild>
            <Link to="/" onClick={onLinkClick} title={collapsed ? "Dashboard" : undefined} className="block group">
              <div className={cn(
                "relative flex items-center min-h-[40px] rounded-[9px] transition-all duration-200 border border-transparent hover:bg-muted/30 hover:border-border/50"
              )}>
                <div className={cn("flex items-center w-full py-1", collapsed ? "justify-center" : "px-3")}>
                  <div className={cn(
                    "w-[26px] h-[26px] flex items-center justify-center rounded-[3px] transition-all shrink-0 border border-border/90 bg-muted/30 text-foreground/70 group-hover:bg-muted/40 shadow-sm"
                  )}>
                    <LayoutGrid className="h-3.5 w-3.5" />
                  </div>
                  {!collapsed && (
                    <div className="ml-3 flex-1 flex items-center overflow-hidden">
                      <span className="text-sm leading-[1.2] font-medium transition-colors text-foreground/90 group-hover:text-foreground">
                        Dashboard
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </Link>
          </ConditionalSheetClose>
        </div>

        {menuStructure.map((section) => (
          <div key={section.title}>
            {!collapsed && (
              <button 
                onClick={() => toggleSection(section.title)}
                className="w-full flex items-center justify-between px-3 mb-2 group/label"
              >
                <h3 className="text-[10px] font-bold text-foreground uppercase tracking-[0.1em] opacity-[0.28] transition-opacity group-hover/label:opacity-60">
                  {section.title}
                </h3>
                <ChevronDown className={cn(
                  "h-3 w-3 text-muted-foreground transition-transform duration-200 opacity-[0.28]",
                  openSections[section.title] ? "rotate-0" : "-rotate-90"
                )} />
              </button>
            )}
            <div className={cn(
              "space-y-1 transition-all duration-300 overflow-hidden",
              collapsed || openSections[section.title] ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
            )}>
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                const isComingSoon = item.comingSoon;
                
                const buttonContent = (
                  <div className={cn("flex items-center w-full py-1", collapsed ? "justify-center" : "px-3")}>
                    <div className={cn(
                      "w-[26px] h-[26px] flex items-center justify-center rounded-[3px] transition-all shrink-0 border border-border/90 bg-muted/30 shadow-sm",
                      isActive 
                        ? "bg-primary text-primary-foreground border-primary/50 shadow-md shadow-primary/20" 
                        : "text-foreground/70 group-hover:text-foreground group-hover:bg-muted/40"
                    )}>
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                    {!collapsed && (
                      <div className="ml-3 flex-1 flex items-center overflow-hidden">
                        <span className={cn(
                          "text-sm leading-[1.2] font-medium transition-colors text-foreground/90",
                          isActive ? "text-foreground" : "group-hover:text-foreground"
                        )}>
                          {item.label}
                        </span>
                      </div>
                    )}
                  </div>
                );

                if (isComingSoon) {
                  return (
                    <div key={item.label} className="opacity-50 cursor-not-allowed group" title={`${item.label} (em breve)`}>
                      <div className="flex items-center min-h-[40px]">{buttonContent}</div>
                    </div>
                  );
                }

                return (
                  <ConditionalSheetClose key={item.path} shouldWrap={!!onLinkClick} asChild>
                    <Link to={item.path} onClick={onLinkClick} title={collapsed ? item.label : undefined} className="block group">
                      <div className={cn(
                        "relative flex items-center min-h-[40px] rounded-[9px] transition-all duration-200 border",
                        isActive 
                          ? "bg-muted/30 border-foreground/30" 
                          : "hover:bg-muted/30 border-transparent hover:border-border/50"
                      )}>
                        {buttonContent}
                      </div>
                    </Link>
                  </ConditionalSheetClose>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer / Version Area */}
      <div className={cn("mt-auto border-t border-border/50 bg-muted/5", collapsed ? "p-2" : "p-3 pb-4")}>
        <div className={cn("flex items-center gap-3", collapsed ? "justify-center" : "w-full px-1")}>
          {/* Favicon / Logo */}
          <img src="/favicon.svg" alt="Logo" className="shrink-0 w-8 h-8 rounded-[4px] object-contain" />

          {!collapsed && (
            <>
              <div className="flex flex-col min-w-0 flex-1 ml-0.5">
                <span className="text-sm font-bold text-foreground truncate">EduSolos</span>
                <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-tight">Versão 1.1.0</span>
              </div>

              {/* Botão de Informação Interativo */}
              <ConditionalSheetClose shouldWrap={!!onLinkClick} asChild>
                <Link 
                   to="/about" 
                   onClick={onLinkClick}
                   title="Sobre o software"
                   className="w-[32px] h-[32px] flex items-center justify-center rounded-[6px] bg-muted/30 border border-border/90 hover:bg-primary hover:text-primary-foreground hover:border-primary/50 transition-all duration-200 shadow-sm group"
                 >
                   <Info className="h-4 w-4" />
                 </Link>
              </ConditionalSheetClose>
            </>
          )}

        </div>
      </div>
    </div>
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


export function Layout({ children }: { children: React.ReactNode }) {
  return <DesktopLayout>{children}</DesktopLayout>;
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

  const isDashboard = location.pathname === "/" || location.pathname === "/dashboard";

  return (
    <div className="flex min-h-screen w-full bg-background">
      {/* -- Desktop Sidebar -- */}
      <aside
        className={cn(
          "bg-card transition-[width] duration-300 ease-in-out border-r border-border/50 fixed left-0 top-0 h-full z-20",
          collapsed ? "w-14" : "w-64"
        )}
      >
        <SidebarContent collapsed={collapsed} />
      </aside>

      {/* -- Main Content Area -- */}
      <div
        className={cn(
          "flex-1 transition-[margin-left] duration-300 ease-in-out",
          collapsed ? "ml-14" : "ml-64"
        )}
      >
        {/* Header - Expansível no Dashboard */}
        <header 
          className={cn(
            "bg-card border-b border-border/50 sticky top-0 z-20 transition-all duration-300",
            isDashboard ? "pb-8 pt-0" : "h-14 flex items-center"
          )}
        >
          <div className="flex items-center px-4 md:px-6 h-14 w-full">
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
            {!isDashboard && (
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
          </div>

          {/* Conteúdo Extra do Header no Dashboard */}
          {isDashboard && (
            <div className="max-w-[1400px] mx-auto px-6 md:px-10 mt-2 animate-in fade-in slide-in-from-top-2 duration-500">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                <span className="text-foreground">Bem-vindo ao </span>
                <span className="text-primary">Edu</span>
                <span className="text-foreground">Solos</span>
              </h1>
              <p className="text-sm text-muted-foreground mt-1 max-w-2xl leading-relaxed">
                Plataforma educacional para Mecânica dos Solos. Selecione um módulo abaixo para começar seus cálculos.
              </p>
            </div>
          )}
        </header>

        {/* Page Content */}
        <main className="px-2 md:px-3 lg:px-4 pt-2 pb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">{children}</main>
      </div>
    </div>
  );
}