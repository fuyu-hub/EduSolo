import { Calculator, Layers, FileText, BookOpen, TrendingUp, TrendingDown, Ruler, Droplets, BarChart3 } from "lucide-react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const modules = [
  {
    icon: Calculator,
    title: "Índices Físicos",
    description: "Calcule índices físicos do solo: umidade, densidade, porosidade e mais",
    path: "/indices-fisicos",
    color: "from-sky-500 to-blue-600",
  },
  {
    icon: Droplets,
    title: "Limites de Consistência",
    description: "Calcule LL, LP, IP, IL, IC e classifique a plasticidade do solo",
    path: "/limites-consistencia",
    color: "from-indigo-500 to-blue-600",
  },
  {
    icon: BarChart3,
    title: "Granulometria e Classificação",
    description: "Análise granulométrica e classificação USCS/AASHTO",
    path: "/granulometria",
    color: "from-fuchsia-500 to-purple-600",
  },
  {
    icon: Layers,
    title: "Compactação",
    description: "Análise de curvas de compactação e energia Proctor",
    path: "/compactacao",
    color: "from-violet-500 to-purple-600",
  },
  {
    icon: FileText,
    title: "Tensões Geostáticas",
    description: "Calcule tensões verticais, efetivas e neutras no solo",
    path: "/tensoes",
    color: "from-emerald-500 to-green-600",
  },
  {
    icon: TrendingDown,
    title: "Acréscimo de Tensões",
    description: "Métodos de Boussinesq e análise de carregamentos",
    path: "/acrescimo-tensoes",
    color: "from-orange-500 to-red-600",
  },
  {
    icon: TrendingUp,
    title: "Análise de Adensamento",
    description: "Teoria de Terzaghi e análise de recalques",
    path: "#",
    color: "from-amber-500 to-orange-600",
    comingSoon: true,
  },
  {
    icon: Ruler,
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
  },
];

export default function Dashboard() {
  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Hero Section */}
      <div className="space-y-3">
        <h1 className="text-4xl font-bold text-foreground">
          Bem-vindo ao <span className="text-primary">EduSolo</span>
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl">
          Sua suíte completa de ferramentas para análise e aprendizado em Engenharia Geotécnica
        </p>
      </div>

      {/* Modules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {modules.map((module) => {
          const Icon = module.icon;
          const content = (
            <Card
              className={cn(
                "glass p-6 transition-smooth hover:shadow-2xl hover:shadow-primary/20 group cursor-pointer relative overflow-hidden",
                !module.comingSoon && "hover:-translate-y-1"
              )}
            >
              {/* Gradient overlay on hover */}
              <div
                className={cn(
                  "absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-5 transition-opacity",
                  module.color
                )}
              />

              {/* Content */}
              <div className="relative">
                <div
                  className={cn(
                    "w-14 h-14 rounded-xl bg-gradient-to-br flex items-center justify-center mb-4 shadow-lg",
                    module.color
                  )}
                >
                  <Icon className="w-7 h-7 text-white" />
                </div>

                <h3 className="text-xl font-semibold text-foreground mb-2 flex items-center gap-2">
                  {module.title}
                  {module.comingSoon && (
                    <span className="text-xs px-2 py-1 rounded-full bg-primary/20 text-primary font-normal">
                      Em breve
                    </span>
                  )}
                </h3>

                <p className="text-muted-foreground text-sm leading-relaxed">
                  {module.description}
                </p>
              </div>
            </Card>
          );

          if (module.comingSoon) {
            return <div key={module.title}>{content}</div>;
          }

          return (
            <Link key={module.title} to={module.path}>
              {content}
            </Link>
          );
        })}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-12">
        <Card className="glass p-5 border-l-4 border-l-primary">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
              <Calculator className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">8+</p>
              <p className="text-sm text-muted-foreground">Módulos de Cálculo</p>
            </div>
          </div>
        </Card>

        <Card className="glass p-5 border-l-4 border-l-violet-500">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-violet-500/20 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-violet-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">100%</p>
              <p className="text-sm text-muted-foreground">Gratuito e Open Source</p>
            </div>
          </div>
        </Card>

        <Card className="glass p-5 border-l-4 border-l-emerald-500">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-emerald-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">Fase 2</p>
              <p className="text-sm text-muted-foreground">Projeto em Desenvolvimento</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
