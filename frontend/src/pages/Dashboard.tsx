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
    color: "from-sky-500 to-blue-600",
    preload: () => import("./IndicesFisicos"),
    tourId: "module-indices",
  },
  {
    icon: Droplets,
    title: "Limites de Consistência",
    description: "Calcule LL, LP, IP, IL, IC e classifique a plasticidade do solo",
    path: "/limites-consistencia",
    color: "from-indigo-500 to-blue-600",
    preload: () => import("./LimitesConsistencia"),
    tourId: "module-limites",
  },
  {
    icon: Grip,
    title: "Granulometria e Classificação",
    description: "Análise granulométrica e classificação USCS/AASHTO",
    path: "/granulometria",
    color: "from-fuchsia-500 to-purple-600",
    preload: () => import("./Granulometria"),
    tourId: "module-granulometria",
  },
  {
    icon: Layers,
    title: "Compactação",
    description: "Análise de curvas de compactação e energia Proctor",
    path: "/compactacao",
    color: "from-violet-500 to-purple-600",
    preload: () => import("./Compactacao"),
    tourId: "module-compactacao",
  },
  {
    icon: Pyramid,
    title: "Tensões Geostáticas",
    description: "Calcule tensões verticais, efetivas e neutras no solo",
    path: "/tensoes",
    color: "from-emerald-500 to-green-600",
    preload: () => import("./TensoesGeostaticas"),
    tourId: "module-tensoes",
  },
  {
    icon: Target,
    title: "Acréscimo de Tensões",
    description: "Métodos de Boussinesq e análise de carregamentos",
    path: "/acrescimo-tensoes",
    color: "from-orange-500 to-red-600",
    preload: () => import("./AcrescimoTensoes"),
    tourId: "module-acrescimo",
  },
  {
    icon: ArrowDownToLine,
    title: "Análise de Adensamento",
    description: "Teoria de Terzaghi e análise de recalques",
    path: "#",
    color: "from-amber-500 to-orange-600",
    comingSoon: true,
    tourId: "module-adensamento",
  },
  {
    icon: Activity,
    title: "Resistência ao Cisalhamento",
    description: "Análise de ensaios triaxiais e cisalhamento direto",
    path: "#",
    color: "from-rose-500 to-pink-600",
    comingSoon: true,
    tourId: "module-cisalhamento",
  },
  {
    icon: BookOpen,
    title: "Material Educacional",
    description: "Acesse conteúdos teóricos e conceitos fundamentais",
    path: "/educacional",
    color: "from-cyan-500 to-teal-600",
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
        "glass p-6 transition-smooth hover:shadow-2xl hover:shadow-primary/20 group cursor-pointer relative overflow-hidden h-full min-h-[200px] flex flex-col",
        !comingSoon && "hover:-translate-y-2 hover:scale-[1.02] active:scale-[0.98]"
      )}
    >
      {/* Gradient overlay on hover */}
      <div
        className={cn(
          "absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-10 transition-all duration-500",
          color
        )}
      />

      {/* Shine effect on hover */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
      </div>

      {/* Content */}
      <div className="relative flex-1 flex flex-col">
        <div
          className={cn(
            "w-14 h-14 rounded-xl bg-gradient-to-br flex items-center justify-center mb-4 shadow-lg",
            "transition-all duration-300 group-hover:scale-110 group-hover:rotate-3",
            color
          )}
        >
          <Icon className="w-7 h-7 text-white transition-transform duration-300 group-hover:scale-110" />
        </div>

        <h3 className="text-xl font-semibold text-foreground mb-2 flex items-center gap-2 group-hover:text-primary transition-colors">
          {title}
          {comingSoon && (
            <span className="text-xs px-2 py-1 rounded-full bg-primary/20 text-primary font-normal animate-pulse">
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
    }, 800);

    return () => clearTimeout(timer);
  }, [startTour]);

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Hero Section */}
      <div id="dashboard-hero" className="space-y-3">
        <h1 className="text-4xl font-bold text-foreground">
          Bem-vindo ao <span className="text-primary bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">EduSolo</span>
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl">
          Sua suíte completa de ferramentas para análise e aprendizado em Mecânica dos Solos
        </p>
      </div>

      {/* Modules Grid */}
      <div id="modules-grid" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" role="list" aria-label="Módulos disponíveis">
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
      <div id="dashboard-stats" className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-12">
        <Card className="glass p-5 border-l-4 border-l-primary hover:shadow-lg transition-all hover:border-l-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center transition-all hover:scale-110 hover:rotate-12">
              <Calculator className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground tabular-nums">8+</p>
              <p className="text-sm text-muted-foreground">Módulos de Cálculo</p>
            </div>
          </div>
        </Card>

        <Card className="glass p-5 border-l-4 border-l-violet-500 hover:shadow-lg transition-all hover:border-l-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-violet-500/20 flex items-center justify-center transition-all hover:scale-110 hover:rotate-12">
              <BookOpen className="w-5 h-5 text-violet-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground tabular-nums">100%</p>
              <p className="text-sm text-muted-foreground">Gratuito e Open Source</p>
            </div>
          </div>
        </Card>

        <Card className="glass p-5 border-l-4 border-l-emerald-500 hover:shadow-lg transition-all hover:border-l-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center transition-all hover:scale-110 hover:rotate-12">
              <TrendingUp className="w-5 h-5 text-emerald-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground tabular-nums">Fase 2</p>
              <p className="text-sm text-muted-foreground">Projeto em Desenvolvimento</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
