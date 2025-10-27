import { Beaker, Droplet, Filter, Database, Mountain, Target, MoveDown, Scissors, ArrowRight, BookOpen } from "lucide-react";
import { memo, useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { PreloaderLink } from "@/components/RoutePreloader";
import { useTour } from "@/contexts/TourContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { WelcomeDialog, useToursEnabled, WELCOME_DIALOG_KEY } from "@/components/WelcomeDialog";
import { useScrollToTop } from "@/hooks/use-scroll-to-top";

const modules = [
  {
    icon: Beaker,
    title: "Índices Físicos",
    description: "Calcule índices físicos do solo: umidade, densidade, porosidade e mais",
    path: "/indices-fisicos",
    color: "from-blue-500 via-blue-600 to-indigo-600",
    preload: () => import("./IndicesFisicos"),
    tourId: "module-indices",
  },
  {
    icon: Droplet,
    title: "Limites de Consistência",
    description: "Calcule LL, LP, IP, IL, IC e classifique a plasticidade do solo",
    path: "/limites-consistencia",
    color: "from-cyan-500 via-teal-500 to-emerald-600",
    preload: () => import("./LimitesConsistencia"),
    tourId: "module-limites",
  },
  {
    icon: Filter,
    title: "Granulometria e Classificação",
    description: "Análise granulométrica e classificação USCS/AASHTO",
    path: "/granulometria",
    color: "from-purple-500 via-purple-600 to-indigo-600",
    preload: () => import("./Granulometria"),
    tourId: "module-granulometria",
  },
  {
    icon: Database,
    title: "Compactação",
    description: "Análise de curvas de compactação e energia Proctor",
    path: "/compactacao",
    color: "from-violet-500 via-fuchsia-500 to-pink-600",
    preload: () => import("./Compactacao"),
    tourId: "module-compactacao",
  },
  {
    icon: Mountain,
    title: "Tensões Geostáticas",
    description: "Calcule tensões verticais, efetivas e neutras no solo",
    path: "/tensoes",
    color: "from-emerald-500 via-green-500 to-teal-600",
    preload: () => import("./TensoesGeostaticas"),
    tourId: "module-tensoes",
  },
  {
    icon: Target,
    title: "Acréscimo de Tensões",
    description: "Métodos de Boussinesq e análise de carregamentos",
    path: "/acrescimo-tensoes",
    color: "from-orange-500 via-red-500 to-rose-600",
    preload: () => import("./AcrescimoTensoes"),
    tourId: "module-acrescimo",
  },
  {
    icon: MoveDown,
    title: "Análise de Adensamento",
    description: "Teoria de Terzaghi e análise de recalques",
    path: "#",
    color: "from-amber-500 via-orange-500 to-red-500",
    comingSoon: true,
    tourId: "module-adensamento",
  },
  {
    icon: Scissors,
    title: "Resistência ao Cisalhamento",
    description: "Análise de ensaios triaxiais e cisalhamento direto",
    path: "#",
    color: "from-rose-500 via-pink-500 to-fuchsia-600",
    comingSoon: true,
    tourId: "module-cisalhamento",
  },
  {
    icon: BookOpen,
    title: "Material Educacional",
    description: "Acesse conteúdos teóricos e conceitos fundamentais",
    path: "/educacional",
    color: "from-sky-500 via-cyan-500 to-blue-600",
    comingSoon: true,
    tourId: "module-educacional",
  },
];

// Card para Mobile - Simplificado
const ModuleCardMobile = memo<{
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  color: string;
  comingSoon?: boolean;
  tourId?: string;
}>(({ icon: Icon, title, description, color, comingSoon, tourId }) => {
  return (
    <Card
      data-tour={tourId}
      className={cn(
        "p-4 transition-all duration-200 group relative overflow-hidden h-full",
        "border border-border/50 bg-card/50 backdrop-blur-sm",
        !comingSoon && "active:scale-[0.98] [-webkit-tap-highlight-color:transparent]",
        comingSoon && "opacity-60 cursor-not-allowed"
      )}
    >
      <div className="flex items-start gap-3 h-full">
        {/* Icon */}
        <div
          className={cn(
            "w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center shrink-0 shadow-md",
            "transition-transform duration-200",
            !comingSoon && "group-active:scale-95",
            color
          )}
        >
          <Icon className="w-6 h-6 text-white" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 flex flex-col">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h3 className="font-semibold text-foreground">
              {title}
            </h3>
            {comingSoon && (
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-primary/20 text-primary font-medium shrink-0">
                Em breve
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
            {description}
          </p>
        </div>
      </div>
    </Card>
  );
});

ModuleCardMobile.displayName = "ModuleCardMobile";

// Card para Desktop - Versão Antiga Elaborada
const ModuleCardDesktop = memo<{
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  color: string;
  comingSoon?: boolean;
  tourId?: string;
}>(({ icon: Icon, title, description, color, comingSoon, tourId }) => {
  return (
    <Card
      data-tour={tourId}
      className={cn(
        "group relative overflow-hidden transition-all duration-300 h-full flex flex-col",
        "border border-border/50 bg-gradient-to-br from-card/80 via-card/60 to-card/40 backdrop-blur-sm",
        !comingSoon && "hover:shadow-2xl hover:shadow-primary/10 hover:-translate-y-1 hover:scale-[1.02] cursor-pointer",
        comingSoon && "opacity-60"
      )}
    >
      {/* Gradient overlay on hover */}
      <div className={cn(
        "absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-5 transition-opacity duration-300",
        color
      )} />
      
      {/* Shimmer effect */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
      </div>

      <div className="relative p-6 space-y-4 flex flex-col h-full">
        {/* Icon */}
        <div className="flex items-center justify-between">
          <div
            className={cn(
              "w-14 h-14 rounded-2xl bg-gradient-to-br flex items-center justify-center shadow-lg",
              "transition-all duration-300 group-hover:scale-110 group-hover:rotate-3",
              color
            )}
          >
            <Icon className="w-7 h-7 text-white" />
          </div>
          
          {comingSoon && (
            <span className="px-2.5 py-1 rounded-full bg-primary/20 text-primary text-xs font-semibold">
              Em breve
            </span>
          )}
          
          {!comingSoon && (
            <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all duration-300" />
          )}
        </div>

        {/* Content */}
        <div className="space-y-2 flex-1">
          <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors duration-300">
            {title}
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
            {description}
          </p>
        </div>
      </div>
    </Card>
  );
});

ModuleCardDesktop.displayName = "ModuleCardDesktop";

export default function Dashboard() {
  const { startTour } = useTour();
  const isMobile = useIsMobile();
  const toursEnabled = useToursEnabled();
  const [shouldStartTour, setShouldStartTour] = useState(false);
  
  // Força scroll para o topo ao entrar na página
  useScrollToTop();

  // Marcar Acréscimo de Tensões como "Em breve" no mobile
  const displayModules = modules.map(module => {
    if (module.path === "/acrescimo-tensoes" && isMobile) {
      return { ...module, comingSoon: true };
    }
    return module;
  });

  // Callback quando o WelcomeDialog é completado
  const handleWelcomeComplete = (toursEnabled: boolean) => {
    if (toursEnabled) {
      // Usuário aceitou ver tours, iniciar após um delay
      setTimeout(() => {
        setShouldStartTour(true);
      }, 500);
    }
  };

  useEffect(() => {
    // Verificar se é primeira visita
    const hasSeenWelcome = localStorage.getItem(WELCOME_DIALOG_KEY);
    
    // Se é primeira visita, não iniciar tour (esperar WelcomeDialog)
    if (!hasSeenWelcome) return;
    
    // Só iniciar tour se estiver habilitado e não for primeira visita
    if (!toursEnabled) return;
    
    // Iniciar tour após um delay maior para garantir que todos os elementos estejam renderizados
    // Delay maior para navegadores como Brave que podem ter renderização mais lenta
    const timer = setTimeout(() => {
      startTour([
        {
          target: "#dashboard-hero",
          title: "Bem-vindo ao EduSolo",
          content: "Este é seu painel principal. Aqui você encontra todos os módulos de cálculo geotécnico disponíveis. Vamos fazer um tour rápido!",
          placement: "bottom",
        },
        {
          target: "#modules-grid",
          title: "Módulos de Cálculo",
          content: "Aqui estão os módulos principais para análise geotécnica. Clique em qualquer card para começar seus cálculos. Os módulos com 'Em breve' estarão disponíveis em futuras atualizações.",
          placement: "bottom",
        },
        {
          target: "[data-tour='module-indices']",
          title: "Índices Físicos",
          content: "Calcule propriedades fundamentais do solo como umidade, densidade, porosidade e índice de vazios. Perfeito para caracterização inicial do solo.",
          placement: "right",
        },
        {
          target: "[data-tour='module-limites']",
          title: "Limites de Consistência",
          content: "Determine os limites de Atterberg (LL, LP, IP) e classifique a plasticidade do solo segundo critérios estabelecidos.",
          placement: "right",
        },
        {
          target: "[data-tour='module-granulometria']",
          title: "Granulometria",
          content: "Analise a distribuição granulométrica do solo e obtenha classificação automática pelos sistemas USCS e AASHTO.",
          placement: "left",
        },
        {
          target: "[data-tour='module-compactacao']",
          title: "Compactação",
          content: "Visualize curvas de compactação, calcule grau de compactação e analise energia Proctor.",
          placement: "right",
        },
        {
          target: "[data-tour='module-tensoes']",
          title: "Tensões Geostáticas",
          content: "Calcule tensões verticais totais, efetivas e neutras em camadas de solo. Essencial para análise de estabilidade.",
          placement: "right",
        },
        {
          target: "[data-tour='module-acrescimo']",
          title: "Acréscimo de Tensões",
          content: "Use métodos de Boussinesq, Love, Newmark e Carothers para calcular tensões induzidas por carregamentos. Inclui análise interativa 2D.",
          placement: "left",
        },
        {
          target: "[data-tour='theme-toggle']",
          title: "Modo Claro/Escuro",
          content: "Prefere trabalhar no escuro? Alterne entre os modos claro e escuro clicando neste botão no header.",
          placement: "bottom",
        },
        {
          target: "[data-tour='settings-menu']",
          title: "Configurações",
          content: "Acesse as configurações do sistema, ajuste preferências de cálculo e personalize sua experiência. Você também pode reiniciar este tour a qualquer momento.",
          placement: "right",
        },
      ], "dashboard-main");
    }, 1200);

    return () => clearTimeout(timer);
  }, [startTour, toursEnabled]);

  // Effect separado para iniciar tour após WelcomeDialog
  useEffect(() => {
    if (!shouldStartTour) return;
    
    const timer = setTimeout(() => {
      startTour([
        {
          target: "#dashboard-hero",
          title: "Bem-vindo ao EduSolo",
          content: "Este é seu painel principal. Aqui você encontra todos os módulos de cálculo geotécnico disponíveis. Vamos fazer um tour rápido!",
          placement: "bottom",
        },
        {
          target: "#modules-grid",
          title: "Módulos de Cálculo",
          content: "Aqui estão os módulos principais para análise geotécnica. Clique em qualquer card para começar seus cálculos. Os módulos com 'Em breve' estarão disponíveis em futuras atualizações.",
          placement: "bottom",
        },
        {
          target: "[data-tour='module-indices']",
          title: "Índices Físicos",
          content: "Calcule propriedades fundamentais do solo como umidade, densidade, porosidade e índice de vazios. Perfeito para caracterização inicial do solo.",
          placement: "right",
        },
        {
          target: "[data-tour='module-limites']",
          title: "Limites de Consistência",
          content: "Determine os limites de Atterberg (LL, LP, IP) e classifique a plasticidade do solo segundo critérios estabelecidos.",
          placement: "right",
        },
        {
          target: "[data-tour='module-granulometria']",
          title: "Granulometria",
          content: "Analise a distribuição granulométrica do solo e obtenha classificação automática pelos sistemas USCS e AASHTO.",
          placement: "left",
        },
        {
          target: "[data-tour='module-compactacao']",
          title: "Compactação",
          content: "Visualize curvas de compactação, calcule grau de compactação e analise energia Proctor.",
          placement: "right",
        },
        {
          target: "[data-tour='module-tensoes']",
          title: "Tensões Geostáticas",
          content: "Calcule tensões verticais totais, efetivas e neutras em camadas de solo. Essencial para análise de estabilidade.",
          placement: "right",
        },
        {
          target: "[data-tour='module-acrescimo']",
          title: "Acréscimo de Tensões",
          content: "Use métodos de Boussinesq, Love, Newmark e Carothers para calcular tensões induzidas por carregamentos. Inclui análise interativa 2D.",
          placement: "left",
        },
        {
          target: "[data-tour='theme-toggle']",
          title: "Modo Claro/Escuro",
          content: "Prefere trabalhar no escuro? Alterne entre os modos claro e escuro clicando neste botão no header.",
          placement: "bottom",
        },
        {
          target: "[data-tour='settings-menu']",
          title: "Configurações",
          content: "Acesse as configurações do sistema, ajuste preferências de cálculo e personalize sua experiência. Você também pode reiniciar este tour a qualquer momento.",
          placement: "right",
        },
      ], "dashboard-main");
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [shouldStartTour, startTour]);

  return (
    <>
      <WelcomeDialog onComplete={handleWelcomeComplete} />
      
      <div className="space-y-4 sm:space-y-6 max-w-7xl mx-auto">
        {/* Hero Section */}
      <div id="dashboard-hero" className="glass-card p-5 sm:p-6 rounded-xl sm:rounded-2xl shadow-modern border border-primary/20">
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold leading-tight">
            <span className="text-foreground">Bem-vindo ao </span>
            <span className="bg-gradient-to-r from-primary via-primary to-primary/70 bg-clip-text text-transparent">
              EduSolo
            </span>
          </h1>
          <p className="text-sm sm:text-base md:text-lg text-muted-foreground max-w-3xl leading-relaxed">
            Sua suíte completa de ferramentas para análise e aprendizado em Mecânica dos Solos
          </p>
        </div>
      </div>

      {/* Modules Grid */}
      <div id="modules-grid" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 auto-rows-fr" role="list" aria-label="Módulos disponíveis">
        {displayModules.map((module) => {
          const ModuleCard = isMobile ? ModuleCardMobile : ModuleCardDesktop;
          
          const content = (
            <ModuleCard
              icon={module.icon}
              title={module.title}
              description={module.description}
              color={module.color}
              comingSoon={module.comingSoon}
              tourId={module.tourId}
            />
          );

          if (module.comingSoon) {
            return <div key={module.title} role="listitem">{content}</div>;
          }

          return (
            <PreloaderLink
              key={module.title}
              to={module.path}
              preload={module.preload}
              role="listitem"
              aria-label={`Acessar módulo ${module.title}`}
            >
              {content}
            </PreloaderLink>
          );
        })}
      </div>
      </div>
    </>
  );
}
