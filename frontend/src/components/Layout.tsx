import { useState, useEffect } from "react";
import { Menu, Calculator, FileText, BookOpen, Layers } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
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
    <div className="flex min-h-screen w-full">
      {/* Sidebar com glassmorphism */}
      <aside
        className={cn(
          "glass transition-smooth border-r border-sidebar-border fixed left-0 top-0 h-full z-50",
          collapsed ? "w-16" : "w-64"
        )}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-center border-b border-sidebar-border">
          <Link to="/" className="flex items-center gap-2">
            {collapsed ? (
              <span className="text-2xl font-bold text-primary">ES</span>
            ) : (
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
        </div>

        {/* Navigation */}
        <nav className="p-3 space-y-6">
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
                  return (
                    <Link key={item.path} to={item.path}>
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
                        <Icon className={cn("h-5 w-5", !collapsed && "mr-3")} />
                        {!collapsed && <span>{item.label}</span>}
                      </Button>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <div className={cn("flex-1 transition-smooth", collapsed ? "ml-16" : "ml-64")}>
        {/* Header */}
        <header className="h-16 glass border-b border-border sticky top-0 z-40 flex items-center px-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed(!collapsed)}
            className="text-muted-foreground hover:text-foreground"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </header>

        {/* Page Content */}
        <main className="p-4 md:p-6 animate-fade-in">{children}</main>
      </div>
    </div>
  );
}