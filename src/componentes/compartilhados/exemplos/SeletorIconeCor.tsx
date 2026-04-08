import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import {
  ICON_OPTIONS,
  COLOR_OPTIONS,
  getIconComponent,
  getColorTheme,
} from "./utilidades-icones";

interface IconColorPickerProps {
  icon: string;
  color: string;
  onChangeIcon: (key: string) => void;
  onChangeColor: (key: string) => void;
}

export function IconColorPicker({
  icon,
  color,
  onChangeIcon,
  onChangeColor,
}: IconColorPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isOpen]);

  const CurrentIcon = getIconComponent(icon);
  const currentColor = getColorTheme(color);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        className={cn(
          "relative w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-200 bg-gradient-to-br",
          currentColor.gradient,
          "hover:scale-105 active:scale-95 cursor-pointer group/icon"
        )}
        onClick={() => setIsOpen(!isOpen)}
        title="Alterar ícone e cor"
      >
        <CurrentIcon className={cn("w-6 h-6", currentColor.text)} />
        <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-card border border-border flex items-center justify-center transition-opacity duration-200">
          <ChevronDown className="w-2.5 h-2.5 text-muted-foreground" />
        </div>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 z-50 bg-popover border border-border rounded-xl shadow-xl p-3 space-y-3 w-[280px] animate-in fade-in-0 zoom-in-95 duration-200">
          <div className="space-y-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/50">Ícone</span>
            <div className="grid grid-cols-7 gap-1">
              {ICON_OPTIONS.map((opt) => {
                const IconOpt = opt.icon;
                const isActive = icon === opt.key;
                return (
                  <button
                    key={opt.key}
                    type="button"
                    title={opt.label}
                    className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-150",
                      isActive
                        ? cn("bg-gradient-to-br", currentColor.gradient, currentColor.text, "scale-110")
                        : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                    )}
                    onClick={() => onChangeIcon(opt.key)}
                  >
                    <IconOpt className="w-4 h-4" />
                  </button>
                );
              })}
            </div>
          </div>

          <Separator className="!my-2" />

          <div className="space-y-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/50">Cor</span>
            <div className="flex flex-wrap gap-1.5">
              {COLOR_OPTIONS.map((opt) => {
                const isActive = color === opt.key;
                return (
                  <button
                    key={opt.key}
                    type="button"
                    title={opt.label}
                    className={cn(
                      "w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-150",
                      isActive ? "scale-110" : "hover:scale-105"
                    )}
                    onClick={() => onChangeColor(opt.key)}
                  >
                    <span
                      className={cn(
                        "w-5 h-5 rounded-full transition-all",
                        opt.bg,
                        isActive && "ring-2 ring-offset-2 ring-offset-popover ring-foreground/20"
                      )}
                    />
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
