import * as React from "react";
import { useNavigate } from "react-router-dom";
import { Command } from "cmdk";
import { Beaker, Droplet, Filter, Database, Mountain, Target, LayoutGrid, FileText, Settings, Search } from "lucide-react";
import { cn } from "@/lib/utils";

export function CommandPalette() {
  const navigate = useNavigate();
  const [open, setOpen] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement | null>(null);

  React.useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  React.useEffect(() => {
    if (open && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open]);

  const goto = (to: string) => {
    setOpen(false);
    navigate(to);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className={cn(
        "fixed inset-0 z-[60]",
        open ? "block" : "hidden"
      )}
      onClick={() => setOpen(false)}
    >
      <div className="absolute inset-0 bg-black/40" />
      <div className="absolute left-1/2 top-24 -translate-x-1/2 w-[90vw] max-w-xl">
        <Command
          className="rounded-xl border bg-popover text-popover-foreground shadow-xl overflow-hidden"
          onKeyDown={(e) => {
            if (e.key === "Escape") setOpen(false);
          }}
        >
          <div className="flex items-center gap-2 px-3 py-2 border-b">
            <Search className="w-4 h-4 text-muted-foreground" />
            <Command.Input
              ref={inputRef}
              autoFocus
              placeholder="Busque módulos, relatórios e configurações..."
              className="w-full bg-transparent outline-none text-sm py-2"
            />
          </div>
          <Command.List className="max-h-[60vh] overflow-auto">
            <Command.Empty className="px-3 py-4 text-sm text-muted-foreground">Sem resultados</Command.Empty>

            <Command.Group heading="Módulos">
              <Command.Item onSelect={() => goto("/indices-fisicos")} className="px-3 py-2 flex items-center gap-2 cursor-pointer">
                <Beaker className="w-4 h-4" /> Índices Físicos
              </Command.Item>
              <Command.Item onSelect={() => goto("/limites-consistencia")} className="px-3 py-2 flex items-center gap-2 cursor-pointer">
                <Droplet className="w-4 h-4" /> Limites de Consistência
              </Command.Item>
              <Command.Item onSelect={() => goto("/granulometria")} className="px-3 py-2 flex items-center gap-2 cursor-pointer">
                <Filter className="w-4 h-4" /> Granulometria
              </Command.Item>
              <Command.Item onSelect={() => goto("/compactacao")} className="px-3 py-2 flex items-center gap-2 cursor-pointer">
                <Database className="w-4 h-4" /> Compactação
              </Command.Item>
              <Command.Item onSelect={() => goto("/tensoes")} className="px-3 py-2 flex items-center gap-2 cursor-pointer">
                <Mountain className="w-4 h-4" /> Tensões Geostáticas
              </Command.Item>
              <Command.Item onSelect={() => goto("/acrescimo-tensoes")} className="px-3 py-2 flex items-center gap-2 cursor-pointer">
                <Target className="w-4 h-4" /> Acréscimo de Tensões
              </Command.Item>
              <Command.Item onSelect={() => goto("/")} className="px-3 py-2 flex items-center gap-2 cursor-pointer">
                <LayoutGrid className="w-4 h-4" /> Ver todos os módulos
              </Command.Item>
            </Command.Group>

            <Command.Group heading="Navegação">
              <Command.Item onSelect={() => goto("/relatorios")} className="px-3 py-2 flex items-center gap-2 cursor-pointer">
                <FileText className="w-4 h-4" /> Relatórios
              </Command.Item>
              {/* <Command.Item onSelect={() => goto("/settings")} className="px-3 py-2 flex items-center gap-2 cursor-pointer">
                <Settings className="w-4 h-4" /> Configurações
              </Command.Item> */}
            </Command.Group>
          </Command.List>
        </Command>
      </div>
    </div>
  );
}
