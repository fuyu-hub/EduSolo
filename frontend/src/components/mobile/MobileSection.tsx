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
          "transition-all duration-300 ease-out",
          collapsible && "active:scale-[0.98] active:bg-card/80"
        )}
        disabled={!collapsible}
      >
        <div className="flex items-center gap-3">
          {icon && (
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary transition-all duration-300 active:scale-110">
              {icon}
            </div>
          )}
          <h3 className="font-semibold text-base text-foreground">{title}</h3>
        </div>
        
        {collapsible && (
          <ChevronDown
            className={cn(
              "w-5 h-5 text-muted-foreground transition-all duration-300 ease-out",
              isOpen && "rotate-180 text-primary"
            )}
          />
        )}
      </button>

      {/* Content */}
      <div
        className={cn(
          "transition-all duration-300 ease-out overflow-hidden",
          isOpen ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0"
        )}
      >
        <div 
          className="p-4 space-y-4"
          style={{
            animation: isOpen ? 'slideUpFade 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards' : 'none'
          }}
        >
          {children}
        </div>
      </div>
    </Card>
  );
}

