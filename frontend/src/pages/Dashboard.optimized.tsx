import { Calculator, BookOpen, TrendingUp, Beaker, Droplet, Filter, Database, Mountain, Target, MoveDown, Scissors } from "lucide-react";
import { memo } from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { PreloaderLink } from "@/components/RoutePreloader";

const modules = [
  {
    icon: Beaker,
    title: "Índices Físicos",
    description: "Calcule índices físicos do solo: umidade, densidade, porosidade e mais",
    path: "/indices-fisicos",
    color: "from-sky-500 to-blue-600",
    preload: () => import("./IndicesFisicos"),
  },
  {
    icon: Droplet,
    title: "Limites de Consistência",
    description: "Calcule LL, LP, IP, IL, IC e classifique a plasticidade do solo",
    path: "/limites-consistencia",
    color: "from-indigo-500 to-blue-600",
    preload: () => import("./LimitesConsistencia"),
  },
  {
    icon: Filter,
    title: "Granulometria e Classificação",
    description: "Análise granulométrica e classificação USCS/AASHTO",
    path: "/granulometria",
    color: "from-fuchsia-500 to-purple-600",
    preload: () => import("./Granulometria"),
  },
  {
    icon: Database,
    title: "Compactação",
    description: "Análise de curvas de compactação e energia Proctor",
    path: "/compactacao",
    color: "from-violet-500 to-purple-600",
    preload: () => import("./Compactacao"),
  },
  {
    icon: Mountain,
    title: "Tensões Geostáticas",
    description: "Calcule tensões verticais, efetivas e neutras no solo",
    path: "/tensoes",
    color: "from-emerald-500 to-green-600",
    preload: () => import("./TensoesGeostaticas"),
  },
  {
    icon: Target,
    title: "Acréscimo de Tensões",
    description: "Métodos de Boussinesq e análise de carregamentos",
    path: "/acrescimo-tensoes",
    color: "from-orange-500 to-red-600",
    preload: () => import("./AcrescimoTensoes"),
  },
  {
    icon: MoveDown,
    title: "Análise de Adensamento",
    description: "Teoria de Terzaghi e análise de recalques",
    path: "#",
    color: "from-amber-500 to-orange-600",
    comingSoon: true,
  },
  {
    icon: Scissors,
    title: "Resistência ao Cisalhamento",
    description: "Análise de ensaios triaxiais e cisalhamento direto",
    path: "#",
    color: "from-rose-500 to-pink-600",
    comingSoon: true,
  },
  {
    icon: BookOpen,
    title: "Material Educacional",
    description: "Acesse conteúdos teóricos e conceitos fundamentais",
    path: "/educacional",
    color: "from-cyan-500 to-teal-600",
    comingSoon: true,
  },
];

// Componente de Card de Módulo otimizado com memo
const ModuleCard = memo<{
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  color: string;
  comingSoon?: boolean;
}>(({ icon: Icon, title, description, color, comingSoon }) => {
  return (
    <Card
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

// Componente de Estatística otimizado com memo
const StatCard = memo<{
  icon: React.ComponentType<{ className?: string }>;
  value: string;
  label: string;
  color: string;
}>(({ icon: Icon, value, label, color }) => {
  return (
    <Card className="glass p-5 border-l-4 hover:shadow-lg transition-all hover:border-l-8" style={{ borderLeftColor: color }}>
      <div className="flex items-center gap-3">
        <div 
          className="w-10 h-10 rounded-lg flex items-center justify-center transition-all hover:scale-110 hover:rotate-12"
          style={{ backgroundColor: `${color}33` }}
        >
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
        <div>
          <p className="text-2xl font-bold text-foreground tabular-nums">{value}</p>
          <p className="text-sm text-muted-foreground">{label}</p>
        </div>
      </div>
    </Card>
  );
});

StatCard.displayName = "StatCard";

export default function DashboardOptimized() {
  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Hero Section */}
      <div className="space-y-3">
        <h1 className="text-4xl font-bold text-foreground">
          Bem-vindo ao <span className="text-primary bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">EduSolo</span>
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl">
          Sua suíte completa de ferramentas para análise e aprendizado em Mecânica dos Solos
        </p>
      </div>

      {/* Modules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" role="list" aria-label="Módulos disponíveis">
        {modules.map((module) => {
          const content = (
            <ModuleCard
              icon={module.icon}
              title={module.title}
              description={module.description}
              color={module.color}
              comingSoon={module.comingSoon}
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-12">
        <StatCard
          icon={Calculator}
          value="8+"
          label="Módulos de Cálculo"
          color="hsl(var(--primary))"
        />
        <StatCard
          icon={BookOpen}
          value="100%"
          label="Gratuito e Open Source"
          color="rgb(139, 92, 246)"
        />
        <StatCard
          icon={TrendingUp}
          value="Fase 2"
          label="Projeto em Desenvolvimento"
          color="rgb(16, 185, 129)"
        />
      </div>
    </div>
  );
}

