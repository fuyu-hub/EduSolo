import { Calculator, Layers, FileText, BookOpen, TrendingUp, TrendingDown, Ruler, Droplets, BarChart3, Scale, Grip, ArrowDownToLine, Target, Activity, Pyramid } from "lucide-react";
import { memo, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { PreloaderLink } from "@/components/RoutePreloader";
import { useTour } from "@/contexts/TourContext";

const modules = [
  {
    icon: Scale,
    title: "Índices Físicos",
    description: "Calcule índices físicos do solo: umidade, densidade, porosidade e mais",
    path: "/indices-fisicos",
    color: "from-blue-500 via-blue-600 to-indigo-600",
    preload: () => import("./IndicesFisicos"),
    tourId: "module-indices",
  },
  {
    icon: Droplets,
    title: "Limites de Consistência",
    description: "Calcule LL, LP, IP, IL, IC e classifique a plasticidade do solo",
    path: "/limites-consistencia",
    color: "from-cyan-500 via-teal-500 to-emerald-600",
    preload: () => import("./LimitesConsistencia"),
    tourId: "module-limites",
  },
  {
    icon: Grip,
    title: "Granulometria e Classificação",
    description: "Análise granulométrica e classificação USCS/AASHTO",
    path: "/granulometria",
    color: "from-purple-500 via-purple-600 to-indigo-600",
    preload: () => import("./Granulometria"),
    tourId: "module-granulometria",
  },
  {
    icon: Layers,
    title: "Compactação",
    description: "Análise de curvas de compactação e energia Proctor",
    path: "/compactacao",
    color: "from-violet-500 via-fuchsia-500 to-pink-600",
    preload: () => import("./Compactacao"),
    tourId: "module-compactacao",
  },
  {
    icon: Pyramid,
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
    icon: ArrowDownToLine,
    title: "Análise de Adensamento",
    description: "Teoria de Terzaghi e análise de recalques",
    path: "#",
    color: "from-amber-500 via-orange-500 to-red-500",
    comingSoon: true,
    tourId: "module-adensamento",
  },
  {
    icon: Activity,
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

// Componente de Card de Módulo otimizado com memo
const ModuleCard = memo<{
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
        "glass-card p-6 transition-all duration-300 group cursor-pointer relative overflow-hidden h-full min-h-[180px] flex flex-col",
        "rounded-xl border",
        !comingSoon && "hover:shadow-modern-lg hover:-translate-y-2 hover:scale-[1.01] hover:border-primary/30 active:scale-[0.98]",
        comingSoon && "opacity-70"
      )}
    >
      {/* Gradient overlay on hover */}
      <div
        className={cn(
          "absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-[0.12] transition-all duration-500 rounded-xl",
          color
        )}
      />

      {/* Shine effect on hover */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 rounded-xl">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
      </div>

      {/* Content */}
      <div className="relative flex-1 flex flex-col">
        <div
          className={cn(
            "w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center mb-4 shadow-lg",
            "transition-all duration-300 group-hover:scale-110 group-hover:rotate-3 group-hover:shadow-xl",
            color
          )}
        >
          <Icon className="w-6 h-6 text-white transition-transform duration-300 group-hover:scale-110" />
        </div>

        <h3 className="text-lg font-semibold text-foreground mb-2 flex items-center gap-2 group-hover:text-primary transition-colors">
          {title}
          {comingSoon && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary font-medium animate-pulse">
              Em breve
            </span>
          )}
        </h3>

        <p className="text-muted-foreground text-sm leading-relaxed flex-1">
          {description}
        </p>
      </div>
    </Card>
  );
});

ModuleCard.displayName = "ModuleCard";

export default function Dashboard() {
  const { startTour } = useTour();

  useEffect(() => {
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
          target: "#dashboard-stats",
          title: "Estatísticas do Projeto",
          content: "Acompanhe o progresso do EduSolo. Temos diversos módulos disponíveis, 100% gratuito e em constante desenvolvimento.",
          placement: "top",
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
  }, [startTour]);

  return (
    <div className="space-y-6 sm:space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Hero Section */}
      <div id="dashboard-hero" className="glass-card p-4 sm:p-6 rounded-xl sm:rounded-2xl shadow-modern border border-primary/20">
        <div className="space-y-2">
          <h1 className="text-3xl md:text-4xl font-bold">
            <span className="text-foreground">Bem-vindo ao </span>
            <span className="bg-gradient-to-r from-primary via-primary to-primary/70 bg-clip-text text-transparent">
              EduSolo
            </span>
          </h1>
          <p className="text-base md:text-lg text-muted-foreground max-w-3xl leading-relaxed">
            Sua suíte completa de ferramentas para análise e aprendizado em Mecânica dos Solos
          </p>
        </div>
      </div>

      {/* Modules Grid */}
      <div id="modules-grid" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6" role="list" aria-label="Módulos disponíveis">
        {modules.map((module) => {
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

      {/* Quick Stats */}
      <div id="dashboard-stats" className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-5 mt-8 sm:mt-10">
        <Card className="glass-card p-4 sm:p-5 rounded-lg sm:rounded-xl border border-blue-500/20 hover:shadow-modern hover:-translate-y-1 transition-all duration-300 group">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 flex items-center justify-center shadow-md transition-all group-hover:scale-105 group-hover:rotate-3">
              <Calculator className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-xl sm:text-2xl font-bold text-foreground tabular-nums group-hover:text-blue-500 transition-colors">8+</p>
              <p className="text-xs sm:text-sm text-muted-foreground">Módulos de Cálculo</p>
            </div>
          </div>
        </Card>

        <Card className="glass-card p-4 sm:p-5 rounded-lg sm:rounded-xl border border-emerald-500/20 hover:shadow-modern hover:-translate-y-1 transition-all duration-300 group">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600 flex items-center justify-center shadow-md transition-all group-hover:scale-105 group-hover:rotate-3">
              <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-xl sm:text-2xl font-bold text-foreground tabular-nums group-hover:text-emerald-500 transition-colors">100%</p>
              <p className="text-xs sm:text-sm text-muted-foreground">Gratuito e Open Source</p>
            </div>
          </div>
        </Card>

        <Card className="glass-card p-4 sm:p-5 rounded-lg sm:rounded-xl border border-orange-500/20 hover:shadow-modern hover:-translate-y-1 transition-all duration-300 group">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-gradient-to-br from-orange-500 via-amber-500 to-yellow-500 flex items-center justify-center shadow-md transition-all group-hover:scale-105 group-hover:rotate-3">
              <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-xl sm:text-2xl font-bold text-foreground tabular-nums group-hover:text-orange-500 transition-colors">Fase 3</p>
              <p className="text-xs sm:text-sm text-muted-foreground">Em Desenvolvimento</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
