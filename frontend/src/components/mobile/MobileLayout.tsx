import { ReactNode } from "react";
import { MobileHeader } from "./MobileHeader";
import { BottomNav } from "./BottomNav";
import { useLocation } from "react-router-dom";

interface MobileLayoutProps {
  children: ReactNode;
  title?: string;
  showBackButton?: boolean;
}

// Mapeamento de rotas para títulos
const routeTitles: Record<string, string> = {
  "/": "Início",
  "/indices-fisicos": "Índices Físicos",
  "/limites-consistencia": "Limites de Consistência",
  "/granulometria": "Granulometria",
  "/compactacao": "Compactação",
  "/tensoes": "Tensões Geostáticas",
  "/acrescimo-tensoes": "Acréscimo de Tensões",
  "/acrescimo-tensoes/boussinesq": "Boussinesq",
  "/acrescimo-tensoes/love": "Love",
  "/acrescimo-tensoes/carothers": "Carothers",
  "/acrescimo-tensoes/newmark": "Newmark",
  "/educacional": "Material Educacional",
  "/settings": "Configurações",
  "/about": "Sobre",
  "/planos-futuros": "Planos Futuros",
  "/salvos": "Cálculos Salvos",
  "/relatorios": "Relatórios",
};

export function MobileLayout({ children, title, showBackButton }: MobileLayoutProps) {
  const location = useLocation();
  
  // Usa o título fornecido ou busca do mapeamento
  const pageTitle = title || routeTitles[location.pathname];

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header Mobile */}
      <MobileHeader title={pageTitle} showBackButton={showBackButton} />
      
      {/* Espaçador para o header fixo */}
      <div className="h-14" />
      
      {/* Conteúdo Principal */}
      <main className="flex-1 overflow-y-auto">
        <div 
          className="p-4"
          style={{
            animation: 'slideUpFade 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards'
          }}
        >
          {children}
        </div>
      </main>
      
      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
}

