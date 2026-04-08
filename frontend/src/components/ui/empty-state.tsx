import * as React from "react";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    variant?: "default" | "outline" | "ghost";
  };
  className?: string;
  iconClassName?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
  iconClassName,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center px-4 py-12 min-h-[300px]",
        "animate-in fade-in slide-in-from-bottom-4 duration-500",
        className
      )}
    >
      {Icon && (
        <div className="relative mb-6">
          {/* Background glow effect */}
          <div className="absolute inset-0 blur-2xl opacity-20 bg-primary rounded-full animate-pulse" />
          <Icon
            className={cn(
              "relative w-16 h-16 text-muted-foreground/40 transition-all",
              iconClassName
            )}
            strokeWidth={1.5}
          />
        </div>
      )}
      
      <h3 className="text-lg font-semibold text-foreground mb-2">
        {title}
      </h3>
      
      {description && (
        <p className="text-sm text-muted-foreground max-w-md mb-6 leading-relaxed">
          {description}
        </p>
      )}
      
      {action && (
        <Button
          variant={action.variant || "default"}
          onClick={action.onClick}
          className="transition-all hover:scale-105 active:scale-95"
        >
          {action.label}
        </Button>
      )}
    </div>
  );
}

