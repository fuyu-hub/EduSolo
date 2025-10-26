import { ReactNode, useState } from "react";
import { ChevronDown } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface MobileSectionProps {
  title: string;
  icon?: ReactNode;
  children: ReactNode;
  defaultOpen?: boolean;
  collapsible?: boolean;
  className?: string;
}

/**
 * Seção colapsável otimizada para mobile
 * Permite organizar conteúdo de forma compacta e acessível
 */
export function MobileSection({
  title,
  icon,
  children,
  defaultOpen = true,
  collapsible = true,
  className,
}: MobileSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <Card className={cn("overflow-hidden border border-border/50", className)}>
      {/* Header */}
      <button
        onClick={() => collapsible && setIsOpen(!isOpen)}
        className={cn(
          "w-full flex items-center justify-between p-4 bg-card/50 backdrop-blur-sm",
          "transition-colors duration-200",
          collapsible && "active:bg-card/80"
        )}
        disabled={!collapsible}
      >
        <div className="flex items-center gap-3">
          {icon && (
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              {icon}
            </div>
          )}
          <h3 className="font-semibold text-base text-foreground">{title}</h3>
        </div>
        
        {collapsible && (
          <ChevronDown
            className={cn(
              "w-5 h-5 text-muted-foreground transition-transform duration-200",
              isOpen && "rotate-180"
            )}
          />
        )}
      </button>

      {/* Content */}
      <div
        className={cn(
          "transition-all duration-200 ease-in-out",
          isOpen ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0 overflow-hidden"
        )}
      >
        <div className="p-4 space-y-4">{children}</div>
      </div>
    </Card>
  );
}

