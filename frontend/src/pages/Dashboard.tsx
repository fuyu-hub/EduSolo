import { Beaker, Droplet, Database, Mountain, Target, MoveDown, Scissors, ArrowRight, BookOpen } from "lucide-react";
import { CompactacaoIcon } from "@/components/icons/CompactacaoIcon";
import { memo } from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { PreloaderLink } from "@/components/RoutePreloader";

const modules = [
  {
    icon: Beaker,
    title: "Índices Físicos e Limites de Consistência",
    description: "Índices físicos, limites de liquidez e plasticidade",
    path: "/indices-limites",
    preload: () => import("./../modules/caracterizacao"),
  },
  {
    icon: Database,
    title: "Granulometria e Classificação",
    description: "Análise granulométrica com classificação USCS e AASHTO",
    path: "/granulometria",
    preload: () => import("./Granulometria"),
  },
  {
    icon: Database,
    title: "Granulometria Teste",
    description: "Classificação por porcentagem de frações granulométricas",
    path: "/granulometria-teste",
    preload: () => import("./GranulometriaTeste"),
  },
  {
    icon: CompactacaoIcon,
    title: "Compactação",
    description: "Curvas de compactação e energia Proctor",
    path: "/compactacao",
    preload: () => import("./Compactacao"),
  },
  {
    icon: Mountain,
    title: "Tensões Geostáticas",
    path: "#",
    comingSoon: true,
  },
  {
    icon: Target,
    title: "Acréscimo de Tensões",
    path: "#",
    comingSoon: true,
  },
  {
    icon: MoveDown,
    title: "Recalque por Adensamento",
    path: "#",
    comingSoon: true,
  },
  {
    icon: Scissors,
    title: "Resistência ao Cisalhamento",
    path: "#",
    comingSoon: true,
  },
  {
    icon: BookOpen,
    title: "Material Educacional",
    path: "/educacional",
    comingSoon: true,
  },
];

const ModuleCard = memo<{
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  comingSoon?: boolean;
}>(({ icon: Icon, title, description, comingSoon }) => {
  return (
    <Card
      className={cn(
        "group relative overflow-hidden transition-all duration-200 h-full flex flex-col",
        "bg-card border",
        !comingSoon && [
          "border-white/10 hover:border-primary/40",
          "md:hover:shadow-lg md:hover:shadow-primary/5 md:hover:-translate-y-0.5",
          "active:scale-[0.99] cursor-pointer [-webkit-tap-highlight-color:transparent]"
        ],
        comingSoon && [
          "opacity-50 border-dashed border-border/40",
          "cursor-not-allowed"
        ]
      )}
    >
      {/* Hover glow effect - apenas para cards ativos */}
      {!comingSoon && (
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
          <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
        </div>
      )}

      <div className="relative p-4 space-y-3 flex flex-col h-full">
        <div className="flex items-center justify-between">
          {/* Ícone linear - sem fundo colorido, apenas stroke */}
          <div className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center",
            "border transition-colors duration-200",
            !comingSoon
              ? "border-primary/30 group-hover:border-primary/60 group-hover:bg-primary/5"
              : "border-border/30"
          )}>
            <Icon className={cn(
              "w-5 h-5 transition-colors duration-200",
              !comingSoon
                ? "text-primary/80 group-hover:text-primary"
                : "text-muted-foreground/60"
            )} />
          </div>
          {comingSoon && (
            <span className="px-2 py-0.5 rounded text-[10px] font-medium tracking-wide uppercase text-muted-foreground/70 border border-dashed border-border/50">
              Em planejamento
            </span>
          )}
          {!comingSoon && (
            <ArrowRight className="w-4 h-4 text-muted-foreground/50 group-hover:text-primary group-hover:translate-x-0.5 transition-all duration-200" />
          )}
        </div>
        <div className="space-y-1 flex-1">
          <h3 className={cn(
            "text-sm font-semibold transition-colors duration-200",
            !comingSoon
              ? "text-foreground group-hover:text-primary"
              : "text-muted-foreground"
          )}>
            {title}
          </h3>
          {description && (
            <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
              {description}
            </p>
          )}
        </div>
      </div>
    </Card>
  );
})
  ;

ModuleCard.displayName = "ModuleCard";

export default function Dashboard() {
  return (
    <div className="space-y-4 sm:space-y-5 max-w-7xl mx-auto" style={{ zoom: 1.1 }}>
      {/* Banner compacto - 30-40% menor */}
      <div className="bg-card border border-border/50 p-4 sm:p-5 rounded-xl shadow-sm">
        <div className="space-y-1">
          <h1 className="text-xl sm:text-2xl font-bold leading-tight">
            <span className="text-foreground">Bem-vindo ao </span>
            <span className="text-primary">Edu</span>
            <span className="text-foreground">Solos</span>
          </h1>
          <p className="text-sm text-muted-foreground max-w-2xl leading-relaxed">
            Ferramentas de análise para Mecânica dos Solos. Selecione um módulo para começar.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 auto-rows-fr" role="list" aria-label="Módulos disponíveis">
        {modules.map((module, idx) => {
          const content = (
            <ModuleCard
              icon={module.icon}
              title={module.title}
              description={module.description}
              comingSoon={module.comingSoon}
            />
          );

          if (module.comingSoon) {
            return (
              <div
                key={module.title}
                role="listitem"
                className="animate-in fade-in slide-in-from-bottom-1 duration-500"
                style={{ animationDelay: `${idx * 60}ms` }}
              >
                {content}
              </div>
            );
          }

          return (
            <div
              key={module.title}
              className="animate-in fade-in slide-in-from-bottom-1 duration-500"
              style={{ animationDelay: `${idx * 60}ms` }}
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

