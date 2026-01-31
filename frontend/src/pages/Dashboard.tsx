import { Beaker, Droplet, Filter, Database, Mountain, Target, MoveDown, Scissors, ArrowRight, BookOpen } from "lucide-react";
import { memo } from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { PreloaderLink } from "@/components/RoutePreloader";

const modules = [
  {
    icon: Beaker,
    title: "Índices Físicos e Consistência",
    description: "Módulo unificado: Índices Físicos, LL, LP e classificações",
    path: "/caracterizacao",
    color: "from-blue-500 via-blue-600 to-cyan-600",
    preload: () => import("./../modules/caracterizacao"),
  },
  {
    icon: Filter,
    title: "Granulometria e Classificação",
    description: "Análise granulométrica e classificação USCS/AASHTO",
    path: "/granulometria",
    color: "from-purple-500 via-purple-600 to-indigo-600",
    preload: () => import("./Granulometria"),
  },
  {
    icon: Database,
    title: "Compactação",
    description: "Análise de curvas de compactação e energia Proctor",
    path: "/compactacao",
    color: "from-violet-500 via-fuchsia-500 to-pink-600",
    preload: () => import("./Compactacao"),
  },
  {
    icon: Mountain,
    title: "Tensões Geostáticas",
    description: "Calcule tensões verticais, efetivas e neutras no solo",
    path: "#",
    color: "from-emerald-500 via-green-500 to-teal-600",
    comingSoon: true,
  },
  {
    icon: Target,
    title: "Acréscimo de Tensões",
    description: "Métodos de Boussinesq e análise de carregamentos",
    path: "#",
    color: "from-orange-500 via-red-500 to-rose-600",
    comingSoon: true,
  },
  {
    icon: MoveDown,
    title: "Recalque por Adensamento",
    description: "Cálculo de recalque primário por adensamento em camadas compressíveis",
    path: "#",
    color: "from-amber-500 via-orange-500 to-red-500",
    comingSoon: true,
  },
  {
    icon: Scissors,
    title: "Resistência ao Cisalhamento",
    description: "Análise de ensaios triaxiais e cisalhamento direto",
    path: "#",
    color: "from-rose-500 via-pink-500 to-fuchsia-600",
    comingSoon: true,
  },
  {
    icon: BookOpen,
    title: "Material Educacional",
    description: "Acesse conteúdos teóricos e conceitos fundamentais",
    path: "/educacional",
    color: "from-sky-500 via-cyan-500 to-blue-600",
    comingSoon: true,
  },
];

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
        "group relative overflow-hidden transition-all duration-300 h-full flex flex-col",
        "border border-border/50 bg-gradient-to-br from-card/80 via-card/60 to-card/40 backdrop-blur-sm",
        !comingSoon && "md:hover:shadow-2xl md:hover:shadow-primary/10 md:hover:-translate-y-1 md:hover:scale-[1.02] active:scale-[0.98] cursor-pointer [-webkit-tap-highlight-color:transparent]",
        comingSoon && "opacity-60"
      )}
    >
      <div className={cn(
        "absolute inset-0 bg-gradient-to-br opacity-0 md:group-hover:opacity-5 transition-opacity duration-300",
        color
      )} />
      <div className="absolute inset-0 opacity-0 md:group-hover:opacity-100 transition-opacity duration-500">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full md:group-hover:translate-x-full transition-transform duration-1000" />
      </div>

      <div className="relative p-4 sm:p-6 space-y-4 flex flex-col h-full">
        <div className="flex items-center justify-between">
          <div className={cn("w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-gradient-to-br flex items-center justify-center shadow-lg",
            "transition-all duration-300 md:group-hover:scale-110 md:group-hover:rotate-3",
            color
          )}>
            <Icon className="w-6 h-6 md:w-7 md:h-7 text-white" />
          </div>
          {comingSoon && (
            <span className="px-2.5 py-1 rounded-full bg-primary/20 text-primary text-xs font-semibold">
              Em breve
            </span>
          )}
          {!comingSoon && (
            <ArrowRight className="w-5 h-5 text-muted-foreground md:group-hover:text-primary md:group-hover:translate-x-1 transition-all duration-300" />
          )}
        </div>
        <div className="space-y-2 flex-1">
          <h3 className="text-base md:text-lg font-bold text-foreground md:group-hover:text-primary transition-colors duration-300">
            {title}
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
            {description}
          </p>
        </div>
      </div>
    </Card>
  );
})
  ;

ModuleCard.displayName = "ModuleCard";

export default function Dashboard() {
  return (
    <div className="space-y-5 sm:space-y-6 max-w-7xl mx-auto">
      <div className="glass-card p-5 sm:p-6 rounded-xl sm:rounded-2xl shadow-modern border border-primary/20">
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold leading-tight">
            <span className="text-foreground">Bem-vindo ao </span>
            <span className="bg-gradient-to-r from-primary via-primary to-primary/70 bg-clip-text text-transparent">
              Edu
            </span>
            <span className="text-foreground">
              Solos
            </span>
          </h1>
          <p className="text-sm sm:text-base md:text-lg text-muted-foreground max-w-3xl leading-relaxed">
            Sua suíte completa de ferramentas para análise e aprendizado em Mecânica dos Solos. Selecione um módulo para começar.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 auto-rows-fr" role="list" aria-label="Módulos disponíveis">
        {modules.map((module, idx) => {
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
            return (
              <div
                key={module.title}
                role="listitem"
                className="animate-in fade-in slide-in-from-bottom-2 zoom-in-95 duration-800 ease-[cubic-bezier(0.22,1,0.36,1)]"
                style={{ animationDelay: `${idx * 120}ms` }}
              >
                {content}
              </div>
            );
          }

          return (
            <div
              key={module.title}
              className="animate-in fade-in slide-in-from-bottom-2 zoom-in-95 duration-800 ease-[cubic-bezier(0.22,1,0.36,1)]"
              style={{ animationDelay: `${idx * 120}ms` }}
            >
              <PreloaderLink
                to={module.path}
                preload={module.preload}
                role="listitem"
                aria-label={`Acessar módulo ${module.title}`}
              >
                {content}
              </PreloaderLink>
            </div>
          );
        })}
      </div>
    </div>
  );
}
