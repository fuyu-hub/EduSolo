import * as React from "react";
import { Button } from "@/components/ui/button";
import { Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface QuickAction {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  color?: string;
}

interface QuickActionFABProps {
  actions: QuickAction[];
  mainIcon?: React.ReactNode;
  className?: string;
}

export function QuickActionFAB({ 
  actions, 
  mainIcon = <Plus className="w-6 h-6" />,
  className 
}: QuickActionFABProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <div className={cn("fixed bottom-6 right-6 z-40 print:hidden", className)}>
      {/* Action Buttons */}
      <div className="flex flex-col-reverse gap-3 mb-3">
        {actions.map((action, index) => (
          <div
            key={index}
            className={cn(
              "flex items-center gap-3 transition-all duration-300",
              isOpen 
                ? "opacity-100 translate-y-0" 
                : "opacity-0 translate-y-4 pointer-events-none"
            )}
            style={{
              transitionDelay: isOpen ? `${index * 50}ms` : "0ms",
            }}
          >
            {/* Label */}
            <div className="bg-background border border-border rounded-lg px-3 py-2 shadow-lg">
              <span className="text-sm font-medium whitespace-nowrap">
                {action.label}
              </span>
            </div>

            {/* Action Button */}
            <Button
              size="icon"
              className={cn(
                "h-12 w-12 rounded-full shadow-lg transition-all hover:scale-110",
                action.color || "bg-primary"
              )}
              onClick={() => {
                action.onClick();
                setIsOpen(false);
              }}
              aria-label={action.label}
            >
              {action.icon}
            </Button>
          </div>
        ))}
      </div>

      {/* Main FAB */}
      <Button
        size="icon"
        className={cn(
          "h-14 w-14 rounded-full shadow-2xl transition-all duration-300",
          "bg-primary hover:bg-primary/90",
          isOpen && "rotate-45 bg-destructive hover:bg-destructive/90"
        )}
        onClick={() => setIsOpen(!isOpen)}
        aria-label={isOpen ? "Fechar ações rápidas" : "Abrir ações rápidas"}
        aria-expanded={isOpen}
      >
        {isOpen ? <X className="w-6 h-6" /> : mainIcon}
      </Button>

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 -z-10 bg-black/20 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}

