import { ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface MobileFeatureCardProps {
  icon: ReactNode;
  title: string;
  description: string;
  color?: string;
  onClick?: () => void;
  className?: string;
}

/**
 * Card otimizado para dispositivos móveis com áreas de toque maiores
 * e feedback visual aprimorado
 */
export function MobileFeatureCard({
  icon,
  title,
  description,
  color = "from-primary to-primary/70",
  onClick,
  className,
}: MobileFeatureCardProps) {
  return (
    <Card
      onClick={onClick}
      className={cn(
        "p-4 transition-all duration-300 ease-out active:scale-[0.97]",
        "bg-card/50 backdrop-blur-sm border border-border/50",
        "hover:bg-card/80 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/10",
        onClick && "cursor-pointer",
        className
      )}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div
          className={cn(
            "w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center shrink-0 shadow-md",
            "transition-transform duration-300 ease-out",
            onClick && "group-hover:scale-110",
            color
          )}
        >
          {icon}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-base text-foreground mb-1 line-clamp-1">
            {title}
          </h3>
          <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
            {description}
          </p>
        </div>
      </div>
    </Card>
  );
}

