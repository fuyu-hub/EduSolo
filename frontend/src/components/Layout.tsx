import { useState, useEffect } from "react";
import { Menu, Calculator, FileText, BookOpen, Layers } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
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
      { icon: Calculator, label: "Índices Físicos", path: "/indices-fisicos" },
      { icon: Layers, label: "Compactação", path: "/compactacao" },
      { icon: FileText, label: "Tensões Geostáticas", path: "/tensoes" },
      // Add future items here if needed
    ],
  },
  {
    title: "Ferramentas",
    items: [
      { icon: BookOpen, label: "Material Educacional", path: "/educacional" },
      // Add future items here if needed
    ],
  },
];

// Componente para o conteúdo da Sidebar (reutilizável)
const SidebarContent = ({ collapsed, onLinkClick }: { collapsed: boolean; onLinkClick?: () => void }) => {
  const location = useLocation();

  return (
    <>
      {/* Logo */}
      <div className="h-16 flex items-center justify-center border-b border-sidebar-border/50 px-3">
        {/* Link fecha a Sheet se onLinkClick estiver definido */}
        <ConditionalSheetClose shouldWrap={!!onLinkClick} asChild>
          <Link to="/" className="flex items-center gap-2" onClick={onLinkClick}>
            {collapsed ? (
              // Mostrar "ES" quando colapsado
              <span className="text-2xl font-bold text-primary">ES</span>
            ) : (
              // Mostrar logo completo quando expandido
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                  <Calculator className="w-5 h-5 text-primary" />
                </div>
                <span className="text-xl font-bold text-foreground">
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
              <h3 className="px-3 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {section.title}
              </h3>
            )}
            <div className="space-y-1">
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                const buttonContent = (
                   <>
                    <Icon className={cn("h-5 w-5", !collapsed && "mr-3")} />
                    {!collapsed && <span>{item.label}</span>}
                   </>
                );

                // Use ConditionalSheetClose para envolver o Link apenas no mobile
                return (
                   <ConditionalSheetClose key={item.path} shouldWrap={!!onLinkClick} asChild>
                      <Link to={item.path} onClick={onLinkClick} title={collapsed ? item.label : undefined}>
                        <Button
                          variant="ghost"
                          className={cn(
                            "w-full transition-smooth",
                            collapsed ? "justify-center px-2" : "justify-start",
                            isActive
                              ? "bg-primary/20 text-primary hover:bg-primary/30"
                              : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                          )}
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
const ConditionalSheetClose = ({ shouldWrap, children, ...props }: { shouldWrap: boolean; children: React.ReactNode } & React.ComponentProps<typeof SheetClose>) => {
  return shouldWrap ? <SheetClose {...props}>{children}</SheetClose> : <>{children}</>;
};


export function Layout({ children }: { children: React.ReactNode }) {
  const isMobile = useIsMobile();

  const [collapsed, setCollapsed] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
       const mobileCheck = window.innerWidth < 768;
       if (mobileCheck) return true;
       return JSON.parse(localStorage.getItem('sidebarCollapsed') ?? 'true');
    }
    return true;
  });

  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!isMobile) {
      localStorage.setItem('sidebarCollapsed', JSON.stringify(collapsed));
    }
  }, [collapsed, isMobile]);

   useEffect(() => {
    if (isMobile) {
      setCollapsed(true);
    }
  }, [isMobile]);

  const toggleDesktopSidebar = () => {
    if (!isMobile) {
      setCollapsed(!collapsed);
    }
  };

  return (
    <div className="flex min-h-screen w-full bg-background">

      {/* -- Mobile Sidebar (Sheet) -- */}
      {isMobile && (
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetContent side="left" className="p-0 w-64 glass border-r border-sidebar-border/50">
            {/* Passa a função para fechar a sheet */}
            <SidebarContent collapsed={false} onLinkClick={() => setMobileOpen(false)} />
          </SheetContent>
        </Sheet>
      )}

      {/* -- Desktop Sidebar -- */}
      {!isMobile && (
        <aside
          className={cn(
            "glass transition-[width] duration-300 ease-in-out border-r border-sidebar-border/50 fixed left-0 top-0 h-full z-20",
            collapsed ? "w-16" : "w-64"
          )}
        >
          {/* Não passa onLinkClick aqui */}
          <SidebarContent collapsed={collapsed} />
        </aside>
      )}

      {/* -- Main Content Area -- */}
      <div
        className={cn(
          "flex-1 transition-[margin-left] duration-300 ease-in-out",
          !isMobile && (collapsed ? "ml-16" : "ml-64")
        )}
      >
        {/* Header */}
        <header className="h-16 glass border-b border-border/30 sticky top-0 z-10 flex items-center px-4 md:px-6 backdrop-blur-sm">
          {isMobile ? (
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-foreground"
                aria-label="Abrir menu"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleDesktopSidebar}
              className="text-muted-foreground hover:text-foreground"
              aria-label={collapsed ? "Expandir menu" : "Recolher menu"}
            >
              <Menu className="h-5 w-5" />
            </Button>
          )}
          <div className="flex-1"></div>
        </header>

        {/* Page Content */}
        <main className="p-4 md:p-6 animate-fade-in">{children}</main>
      </div>
    </div>
  );
}