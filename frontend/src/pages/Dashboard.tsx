import { Beaker, Droplet, Filter, Database as DbIcon, Mountain, Target, MoveDown, Scissors, ArrowRight, BookOpen, FileText, Settings, LayoutGrid, FolderOpen, PlusCircle, Calculator, Activity, Layers } from "lucide-react";
import { memo, useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { PreloaderLink } from "@/components/RoutePreloader";
import { useTour } from "@/contexts/TourContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { WelcomeDialog, useToursEnabled, WELCOME_DIALOG_KEY } from "@/components/WelcomeDialog";
import { useScrollToTop } from "@/hooks/use-scroll-to-top";
import { Button } from "@/components/ui/button";
import { useRecentReports } from "@/hooks/useRecentReports";
import { Link } from "react-router-dom";
import { ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts";

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
    icon: DbIcon,
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

function DynamicTipsCard() {
  const tips = [
    "Use Módulos para começar um novo cálculo rapidamente.",
    "Salve seus cálculos para gerar relatórios comparáveis.",
    "Pressione Ctrl+K para abrir a Paleta de Comandos.",
  ];
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setIdx((i) => (i + 1) % tips.length), 5000);
    return () => clearInterval(id);
  }, []);
  return (
    <Card className="p-4 sm:p-5 glass-card border">
      <h2 className="text-lg font-semibold mb-3">Dicas</h2>
      <div className="min-h-12 flex items-center text-sm text-muted-foreground">
        <span className="animate-in fade-in duration-300">{tips[idx]}</span>
      </div>
      <div className="mt-2 flex gap-1">
        {tips.map((_, i) => (
          <span key={i} className={cn("h-1.5 w-1.5 rounded-full", i === idx ? "bg-primary" : "bg-muted")}></span>
        ))}
      </div>
    </Card>
  );
}

type RecentCalc = { id: string; moduleName: string; name: string; timestamp: string };
type RecentReportLite = { id: string; name: string; moduleName: string; createdAt: string };

function UnifiedRecentActivity({ recentReports, recentCalcs }: { recentReports: RecentReportLite[]; recentCalcs: RecentCalc[] }) {
  const items = [
    ...recentReports.map((r) => ({ id: `rep_${r.id}`, kind: "report" as const, name: r.name, when: r.createdAt, moduleName: r.moduleName })),
    ...recentCalcs.map((c) => ({ id: `calc_${c.id}`, kind: "calc" as const, name: c.name, when: c.timestamp, moduleName: c.moduleName })),
  ]
    .sort((a, b) => new Date(b.when).getTime() - new Date(a.when).getTime())
    .slice(0, 4);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
      <Card className="p-4 sm:p-5 glass-card border lg:col-span-2">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Atividade recente</h2>
          <div className="flex gap-3 text-sm">
            <Link to="/salvos" className="text-primary">Cálculos</Link>
            <Link to="/relatorios" className="text-primary">Relatórios</Link>
          </div>
        </div>
        <div className="space-y-2">
          {items.length === 0 && <div className="text-sm text-muted-foreground">Nada por aqui ainda. Experimente iniciar um novo cálculo nos Módulos.</div>}
          {items.map((it) => (
            <div key={it.id} className="rounded-md border p-2 flex items-center gap-3">
              {it.kind === "report" ? (
                <FileText className="w-4 h-4 text-primary" />
              ) : (
                <Calculator className="w-4 h-4 text-primary" />
              )}
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm truncate">{it.name}</div>
                <div className="text-xs text-muted-foreground truncate">{new Date(it.when).toLocaleString()} • {it.moduleName}</div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

export default function Dashboard() {
  const { startTour } = useTour();
  const isMobile = useIsMobile();
  const toursEnabled = useToursEnabled();
  const [shouldStartTour, setShouldStartTour] = useState(false);
  const { reports } = useRecentReports();

  const recentReports = (reports || []).slice(0, 4);

  const [recentCalcs, setRecentCalcs] = useState<{ id: string; moduleName: string; name: string; timestamp: string }[]>([]);
  const [kpis, setKpis] = useState<{ totalReports: number; reportsThisWeek: number; totalCalcs: number }>({ totalReports: 0, reportsThisWeek: 0, totalCalcs: 0 });

  useEffect(() => {
    try {
      const stored = localStorage.getItem('edusolo_calculations');
      const all = stored ? JSON.parse(stored) as Record<string, Array<{ id: string; name: string; timestamp: string }>> : {};
      const flat = Object.entries(all)
        .flatMap(([moduleName, arr]) => (arr || []).map((c) => ({ id: c.id, moduleName, name: c.name, timestamp: c.timestamp })))
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setRecentCalcs(flat.slice(0, 4));
      const totalCalcs = flat.length;
      const totalReports = (reports || []).length;
      const startOfWeek = (() => { const d = new Date(); const day = d.getDay(); const diff = d.getDate() - day + (day === 0 ? -6 : 1); const s = new Date(d.setDate(diff)); s.setHours(0,0,0,0); return s; })();
      const reportsThisWeek = (reports || []).filter(r => new Date(r.createdAt) >= startOfWeek).length;
      setKpis({ totalReports, reportsThisWeek, totalCalcs });
    } catch { setRecentCalcs([]); }
  }, [reports]);

  // Build 7-day activity arrays for sparklines
  const buildLast7Days = () => {
    const days: { label: string; start: Date }[] = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      d.setHours(0,0,0,0);
      const label = d.toLocaleDateString(undefined, { weekday: 'short' });
      days.push({ label, start: d });
    }
    return days;
  };

  const days = buildLast7Days();
  const reportsData = days.map((d, idx) => {
    const next = new Date(d.start); next.setDate(next.getDate() + 1);
    const count = (reports || []).filter(r => {
      const t = new Date(r.createdAt);
      return t >= d.start && t < next;
    }).length;
    return { name: d.label, value: count, idx };
  });
  const calcsData = (() => {
    try {
      const stored = localStorage.getItem('edusolo_calculations');
      const all = stored ? JSON.parse(stored) as Record<string, Array<{ timestamp: string }>> : {};
      return days.map((d, idx) => {
        const next = new Date(d.start); next.setDate(next.getDate() + 1);
        let count = 0;
        Object.values(all).forEach(arr => {
          (arr || []).forEach(c => {
            const t = new Date(c.timestamp);
            if (t >= d.start && t < next) count++;
          });
        });
        return { name: d.label, value: count, idx };
      });
    } catch { return days.map((d, idx) => ({ name: d.label, value: 0, idx })); }
  })();

  // Compute most used module from recent reports
  const moduleUsage = (() => {
    const map = new Map<string, number>();
    (reports || []).forEach((r) => {
      const key = r.moduleName || r.moduleType || "Outro";
      map.set(key, (map.get(key) || 0) + 1);
    });
    const entries = Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
    const top = entries[0] || ["—", 0];
    const total = entries.reduce((acc, [, v]) => acc + v, 0) || 1;
    const data = entries.slice(0, 5).map(([name, value]) => ({ name, value }));
    return { topName: top[0], topValue: top[1], total, data };
  })();
  
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
      <div id="dashboard-hero" className="relative glass-card p-5 sm:p-6 rounded-xl sm:rounded-2xl shadow-modern border border-primary/20 overflow-hidden">
        {/* Right KPI pill */}
        <div className="absolute right-4 top-4 hidden md:flex items-center gap-2 rounded-full bg-primary/15 text-primary px-3 py-1 border border-primary/20">
          <span className="text-xs">Relatórios (semana)</span>
          <span className="text-sm font-semibold">{kpis.reportsThisWeek}</span>
        </div>

        <div className="flex items-start justify-between gap-4">
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
            <div className="mt-3 flex items-center gap-2">
              <Link to="/modulos">
                <Button className="h-10"><LayoutGrid className="w-4 h-4 mr-2" /> Iniciar novo cálculo</Button>
              </Link>
              <Link to="/relatorios">
                <Button variant="ghost" className="h-10 text-muted-foreground hover:text-foreground">
                  <FileText className="w-4 h-4 mr-2" /> Ver relatórios
                </Button>
              </Link>
            </div>
          </div>
          <div className="hidden md:block relative w-40 h-24">
            <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 blur-2xl" />
            <img src="/edusolo - logo.svg" alt="EduSolo" className="relative w-24 h-24 opacity-80" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="p-4 sm:p-5 glass-card border">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">Ações rápidas</h2>
          </div>
          <div className="grid grid-cols-1">
            <Link to="/modulos" className="col-span-1">
              <Button className="w-full justify-center h-11 text-base">
                <LayoutGrid className="w-5 h-5 mr-2" /> Iniciar novo cálculo
              </Button>
            </Link>
          </div>
        </Card>

        <Card className="p-4 sm:p-5 glass-card border">
          <h2 className="text-lg font-semibold mb-3">KPIs</h2>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border p-3">
              <div className="text-xs text-muted-foreground flex items-center gap-1"><Activity className="w-3 h-3"/> Relatórios (semana)</div>
              <div className="flex items-end gap-2">
                <div className="text-2xl font-bold">{kpis.reportsThisWeek}</div>
                <div className="h-8 w-24">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={reportsData} margin={{ top: 6, bottom: 0, left: 0, right: 0 }}>
                      <Line type="monotone" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
            <div className="rounded-lg border p-3">
              <div className="text-xs text-muted-foreground flex items-center gap-1"><FileText className="w-3 h-3"/> Relatórios (total)</div>
              <div className="text-2xl font-bold">{kpis.totalReports}</div>
            </div>
            <div className="rounded-lg border p-3 col-span-2 lg:col-span-1">
              <div className="text-xs text-muted-foreground flex items-center gap-1"><DbIcon className="w-3 h-3"/> Cálculos salvos</div>
              <div className="flex items-end gap-2">
                <div className="text-2xl font-bold">{kpis.totalCalcs}</div>
                <div className="h-8 w-24">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={calcsData} margin={{ top: 6, bottom: 0, left: 0, right: 0 }}>
                      <Line type="monotone" dataKey="value" stroke="hsl(var(--foreground))" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
            <div className="rounded-lg border p-3">
              <div className="text-xs text-muted-foreground flex items-center gap-1"><Layers className="w-3 h-3"/> Módulo mais usado</div>
              <div className="flex items-center gap-3">
                <div className="h-14 w-14">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={moduleUsage.data.length ? moduleUsage.data : [{ name: "—", value: 1 }]}
                           dataKey="value"
                           innerRadius={18}
                           outerRadius={28}
                           startAngle={90}
                           endAngle={-270}
                           paddingAngle={2}
                           stroke="none">
                        {(moduleUsage.data.length ? moduleUsage.data : [{ name: "—", value: 1 }]).map((_, i) => (
                          <Cell key={i} fill={`hsl(var(--primary) / ${0.4 + i*0.12})`} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div>
                  <div className="text-sm font-semibold truncate max-w-[10rem]">{moduleUsage.topName}</div>
                  <div className="text-xs text-muted-foreground">{moduleUsage.topValue} de {moduleUsage.total}</div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        <DynamicTipsCard />
      </div>

      <Card className="p-4 sm:p-5 glass-card border mt-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold">Atividade recente</h2>
            <div className="flex items-center gap-1">
              <span className="px-2 py-0.5 text-xs rounded-md bg-primary/15 text-primary">Todos</span>
              <span className="px-2 py-0.5 text-xs rounded-md bg-secondary/50 text-foreground/70">Relatórios</span>
            </div>
          </div>
          <Link to="/relatorios" className="text-sm text-primary">Ver todos</Link>
        </div>
        <div className="space-y-2">
          {recentReports.length === 0 && <div className="text-sm text-muted-foreground">Nada por aqui ainda. Gere seu primeiro relatório!</div>}
          {recentReports.map((r) => (
            <button key={r.id} onClick={() => (window.location.href = '/relatorios')} className="w-full text-left">
              <div className="rounded-md border p-2 flex items-center gap-3 hover:bg-secondary/50 transition-colors">
                <FileText className="w-4 h-4 text-primary" />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">{r.name}</div>
                  <div className="text-xs text-muted-foreground truncate">{new Date(r.createdAt).toLocaleString()} • {r.moduleName}</div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </Card>
      </div>
    </>
  );
}
