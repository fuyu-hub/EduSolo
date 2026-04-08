import { Beaker, Droplet, Database, Mountain, Target, MoveDown, Scissors, ArrowRight, BookOpen } from "lucide-react";
import { Helmet } from 'react-helmet-async';
import { CompactacaoIcon } from "@/componentes/icones/IconeCompactacao";
import React, { memo } from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Link, LinkProps } from "react-router-dom";
import { usePreloadOnHover } from "@/hooks/use-route-preload";

interface PreloaderLinkProps extends LinkProps {
  preload: () => Promise<any>;
}

export const PreloaderLink = ({ preload, children, ...props }: PreloaderLinkProps) => {
  const hoverProps = usePreloadOnHover(preload);

  return (
    <Link {...props} {...hoverProps}>
      {children}
    </Link>
  );
};

const modules = [
  {
    icon: Beaker,
    title: "Índices Físicos e Limites de Consistência",
    description: "Índices físicos, limites de liquidez e plasticidade",
    path: "/indices-limites",
    preload: () => import("@/modulos/indiceslimites/pagina"),
  },
  {
    icon: Database,
    title: "Classificação Granulométrica",
    description: "Classificação de Solos pelos Sistemas USCS e AASHTO",
    path: "/granulometria",
    preload: () => import("@/modulos/granulometria/pagina"),
  },
  {
    icon: CompactacaoIcon,
    title: "Ensaio de Compactação",
    description: "Curvas de compactação e energia Proctor",
    path: "/compactacao",
    preload: () => import("@/modulos/compactacao/pagina"),
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

      <div className="relative p-5 space-y-4 flex flex-col h-full">
        <div className="flex items-center justify-between">
          {/* Ícone linear - sem fundo colorido, apenas stroke */}
          <div className={cn(
            "w-11 h-11 rounded-xl flex items-center justify-center",
            "border transition-colors duration-200",
            !comingSoon
              ? "border-primary/30 group-hover:border-primary/60 group-hover:bg-primary/5"
              : "border-border/30"
          )}>
            <Icon className={cn(
              "w-6 h-6 transition-colors duration-200",
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
            <ArrowRight className="w-5 h-5 text-muted-foreground/50 group-hover:text-primary group-hover:translate-x-0.5 transition-all duration-200" />
          )}
        </div>
        <div className="space-y-1.5 flex-1">
          <h3 className={cn(
            "text-base font-semibold transition-colors duration-200",
            !comingSoon
              ? "text-foreground group-hover:text-primary"
              : "text-muted-foreground"
          )}>
            {title}
          </h3>
          {description && (
            <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
              {description}
            </p>
          )}
        </div>
      </div>
    </Card>
  );
});

ModuleCard.displayName = "ModuleCard";

export default function Dashboard() {
  return (
    <div className="space-y-4 sm:space-y-5 max-w-[1400px] mx-auto">
      <Helmet>
        <title>EduSolos - Ferramentas de Mecânica dos Solos e Geotecnia</title>
        <meta name="description" content="Plataforma interativa para cálculos de Geotecnia: Granulometria, Compactação, Limites de Atterberg, Tensões Geostáticas e mais. Ideal para estudantes e engenheiros." />
      </Helmet>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 auto-rows-fr" role="list" aria-label="Módulos disponíveis">
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
