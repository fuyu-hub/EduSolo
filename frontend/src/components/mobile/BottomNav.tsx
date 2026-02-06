import { Home, Settings, BookOpen, MoreHorizontal, Save, Beaker, Droplet, Filter, Database, Mountain, Target, Info, Rocket, HelpCircle } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useState, useRef } from "react";

const moreItems = [
  { icon: Beaker, label: "Índices Físicos", path: "/indices-fisicos", color: "from-blue-500 via-blue-600 to-indigo-600" },
  { icon: Droplet, label: "Limites", path: "/limites-consistencia", color: "from-cyan-500 via-teal-500 to-emerald-600" },
  { icon: Filter, label: "Granulometria", path: "/granulometria", color: "from-purple-500 via-purple-600 to-indigo-600" },
  { icon: Database, label: "Compactação", path: "/compactacao", color: "from-violet-500 via-fuchsia-500 to-pink-600" },
  { icon: Home, label: "Início", path: "/", color: "from-primary via-primary to-primary" }, // Centro do grid
  { icon: Mountain, label: "Tensões", path: "/tensoes", color: "from-emerald-500 via-green-500 to-teal-600" },
  { icon: Target, label: "Acréscimo", path: "/acrescimo-tensoes", color: "from-orange-500 via-red-500 to-rose-600", disabled: true },
  { icon: Info, label: "Sobre", path: "/about", color: "from-slate-500 via-gray-500 to-zinc-600" },
  // { icon: Rocket, label: "Planos", path: "/planos-futuros", color: "from-amber-500 via-yellow-500 to-orange-600" },
];

interface NavItem {
  icon: typeof Home;
  label: string;
  path?: string;
  action?: () => void;
  isExpandButton?: boolean;
}

const mainNavItems: NavItem[] = [
  { icon: Save, label: "Relatorios", path: "/relatorios" },
  { icon: BookOpen, label: "Educacional", path: "/educacional" },
  { icon: Home, label: "Início", path: "/", isExpandButton: true },
  { icon: MoreHorizontal, label: "Mais", path: "#placeholder" },
  // { icon: Settings, label: "Config", path: "/settings" },
];

export function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const [moreOpen, setMoreOpen] = useState(false);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isLongPressRef = useRef(false);

  const isActive = (path: string | undefined) => {
    if (!path || path === "#") return false;
    if (path === "/") {
      return location.pathname === "/";
    }
    return location.pathname.startsWith(path);
  };

  // Handlers para long press no botão Início
  const handleLongPressStart = () => {
    isLongPressRef.current = false;
    longPressTimerRef.current = setTimeout(() => {
      isLongPressRef.current = true;
      setMoreOpen(!moreOpen);
    }, 500); // 500ms para ativar o long press
  };

  const handleLongPressEnd = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }

    // Se não foi long press, navega para home
    if (!isLongPressRef.current) {
      navigate("/");
    }

    isLongPressRef.current = false;
  };

  const handleLongPressCancel = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    isLongPressRef.current = false;
  };

  return (
    <>
      {/* Espaçador para evitar que o conteúdo fique sob a bottom nav */}
      <div className="h-16" />

      {/* Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-t border-border/40 safe-area-inset-bottom">
        <div className="flex items-center justify-center h-16 px-2 gap-1">
          {mainNavItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            const isExpandButton = item.isExpandButton;
            const isPlaceholder = item.path === "#placeholder";

            // Renderizar o botão "Início" com long press para menu e click para navegar
            if (isExpandButton) {
              return (
                <button
                  key={item.label}
                  onMouseDown={handleLongPressStart}
                  onMouseUp={handleLongPressEnd}
                  onMouseLeave={handleLongPressCancel}
                  onTouchStart={handleLongPressStart}
                  onTouchEnd={handleLongPressEnd}
                  onTouchCancel={handleLongPressCancel}
                  className={cn(
                    "flex flex-col items-center justify-center h-full gap-1 transition-all duration-300 ease-out px-6",
                    "active:scale-[0.92]"
                  )}
                >
                  <div
                    className={cn(
                      "flex items-center justify-center w-11 h-11 rounded-xl transition-all duration-300 ease-out",
                      moreOpen
                        ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30 scale-105"
                        : "text-muted-foreground hover:text-foreground hover:bg-secondary/50 hover:scale-105",
                      !moreOpen && location.pathname === "/" && "bg-primary text-primary-foreground shadow-lg shadow-primary/30 scale-105"
                    )}
                  >
                    <Icon className="w-5 h-5" strokeWidth={(moreOpen || location.pathname === "/") ? 2.5 : 2} />
                  </div>
                  <span className={cn(
                    "text-[10px] font-medium transition-colors duration-300",
                    (moreOpen || location.pathname === "/") ? "text-primary" : "text-muted-foreground"
                  )}>
                    {item.label}
                  </span>
                </button>
              );
            }

            // Renderizar placeholder como button desabilitado
            if (isPlaceholder) {
              return (
                <button
                  key={item.label}
                  disabled
                  className={cn(
                    "flex flex-col items-center justify-center h-full gap-1 transition-all duration-300 ease-out px-6 cursor-not-allowed opacity-50",
                    "active:scale-[0.92]"
                  )}
                >
                  <div
                    className={cn(
                      "flex items-center justify-center w-11 h-11 rounded-xl transition-all duration-300 ease-out",
                      "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                    )}
                  >
                    <Icon className="w-5 h-5" strokeWidth={2} />
                  </div>
                  <span className="text-[10px] font-medium transition-colors duration-300 text-muted-foreground">
                    {item.label}
                  </span>
                </button>
              );
            }

            // Renderizar outros botões como Links
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex flex-col items-center justify-center h-full gap-1 transition-all duration-300 ease-out px-6",
                  "active:scale-[0.92]"
                )}
              >
                <div
                  className={cn(
                    "flex items-center justify-center w-11 h-11 rounded-xl transition-all duration-300 ease-out",
                    active
                      ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30 scale-105"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary/50 hover:scale-105"
                  )}
                >
                  <Icon className="w-5 h-5" strokeWidth={active ? 2.5 : 2} />
                </div>
                <span
                  className={cn(
                    "text-[10px] font-medium transition-colors duration-300",
                    active ? "text-primary" : "text-muted-foreground"
                  )}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Grid Expansível de Módulos */}
      {moreOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40"
            onClick={() => setMoreOpen(false)}
            style={{
              animation: 'fadeIn 0.25s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards'
            }}
          />

          {/* Grid de Módulos - Centralizado */}
          <div
            className="fixed top-1/2 left-1/2 z-50"
            style={{
              transform: 'translate(-50%, -50%)',
              animation: 'fadeIn 0.25s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards'
            }}
          >
            <div className="relative grid grid-cols-3 gap-2 w-fit">
              {/* Cards dos Módulos - 9 botões */}
              {moreItems.map((item, index) => {
                const Icon = item.icon;
                const active = isActive(item.path);
                const isDisabled = item.disabled;

                // Cálculo de distância do centro (índice 4) para animação
                // Grid 3x3: [0,1,2,3,4,5,6,7,8]
                // Distâncias: [2,1,2,1,0,1,2,1,2]
                const centerIndex = 4;
                const row = Math.floor(index / 3);
                const col = index % 3;
                const centerRow = Math.floor(centerIndex / 3);
                const centerCol = centerIndex % 3;
                const distanceFromCenter = Math.abs(row - centerRow) + Math.abs(col - centerCol);

                const content = (
                  <div
                    className={cn(
                      "flex items-center justify-center w-[70px] h-[70px] rounded-xl relative",
                      "backdrop-blur-md transition-all duration-300",
                      !isDisabled && "active:scale-95",
                      active
                        ? "bg-gradient-to-br border-2 border-white/30 shadow-xl shadow-primary/30" + " " + item.color
                        : "bg-background/70 border border-border/40" + " " + item.color,
                      !isDisabled && !active && "hover:bg-gradient-to-br hover:shadow-xl hover:shadow-primary/20 hover:border-transparent",
                      isDisabled && "opacity-60 cursor-not-allowed"
                    )}
                    style={{
                      animation: `expandFromCenter 350ms cubic-bezier(0.25, 0.46, 0.45, 0.94) ${distanceFromCenter * 60}ms both`
                    }}
                  >
                    <div className={cn(
                      "flex flex-col items-center gap-1 transition-all",
                      active && "text-white"
                    )}>
                      <Icon className="w-5 h-5" strokeWidth={2.5} />
                      <span className="text-[9px] font-medium text-center leading-tight">
                        {item.label}
                      </span>
                      {isDisabled && (
                        <span className="absolute -top-1 -right-1 text-[8px] px-1.5 py-0.5 rounded-full bg-primary text-white font-bold shadow-md">
                          Breve
                        </span>
                      )}
                    </div>
                  </div>
                );

                if (isDisabled) {
                  return (
                    <div key={item.path}>
                      {content}
                    </div>
                  );
                }

                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMoreOpen(false)}
                  >
                    {content}
                  </Link>
                );
              })}
            </div>
          </div>
        </>
      )}
    </>
  );
}

