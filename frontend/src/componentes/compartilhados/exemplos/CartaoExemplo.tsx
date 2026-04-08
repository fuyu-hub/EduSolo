import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { COLOR_OPTIONS } from "./utilidades-icones";
import React from "react";

export interface ExampleCardProps {
  nome: string;
  descricao: string;
  Icon: LucideIcon;
  color: typeof COLOR_OPTIONS[number];
  onClick: () => void;
  tags?: React.ReactNode;
}

export function ExampleCard({
  nome,
  descricao,
  Icon,
  color,
  onClick,
  tags,
}: ExampleCardProps) {
  return (
    <button
      className={cn(
        "group relative flex flex-col items-center text-center p-5 rounded-2xl border-2 bg-card/50 backdrop-blur-sm cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-lg active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary w-full",
        color.border,
        color.hoverBorder,
        color.glow
      )}
      onClick={onClick}
    >
      <div
        className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${color.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
      />
      <div
        className={`relative z-10 w-12 h-12 rounded-xl bg-gradient-to-br ${color.gradient} flex items-center justify-center mb-3 transition-transform duration-300 group-hover:scale-110`}
      >
        <Icon className={`w-6 h-6 ${color.text}`} />
      </div>
      <h3 className="relative z-10 font-bold text-sm text-foreground leading-tight mb-1.5">
        {nome}
      </h3>
      <p className="relative z-10 text-[11px] text-muted-foreground leading-relaxed line-clamp-2 mb-3">
        {descricao}
      </p>
      {tags && (
        <div className="relative z-10 flex flex-wrap items-center justify-center gap-1.5 mt-auto">
          {tags}
        </div>
      )}
    </button>
  );
}
