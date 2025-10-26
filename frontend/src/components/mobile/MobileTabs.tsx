import { ReactNode, useState } from "react";
import { cn } from "@/lib/utils";

interface Tab {
  id: string;
  label: string;
  icon?: ReactNode;
  content: ReactNode;
}

interface MobileTabsProps {
  tabs: Tab[];
  defaultTab?: string;
  className?: string;
}

/**
 * Tabs otimizadas para mobile com scroll horizontal
 */
export function MobileTabs({ tabs, defaultTab, className }: MobileTabsProps) {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id);

  const activeContent = tabs.find((tab) => tab.id === activeTab)?.content;

  // Se tiver 3 tabs ou menos, usa grid full-width
  const useGrid = tabs.length <= 3;

  return (
    <div className={cn("space-y-4", className)}>
      {/* Tab Headers */}
      <div className="relative -mx-4">
        <div className={cn("px-4", !useGrid && "overflow-x-auto scrollbar-hide")}>
          <div className={cn(
            "gap-2",
            useGrid ? "grid grid-cols-3" : "flex min-w-max"
          )}>
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center justify-center gap-2 rounded-lg font-medium text-sm transition-all duration-200",
                  "active:scale-95",
                  useGrid ? "w-full px-2 py-3" : "px-4 py-2.5 whitespace-nowrap",
                  activeTab === tab.id
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                    : "bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground"
                )}
              >
                {tab.icon && <span className="w-4 h-4 shrink-0">{tab.icon}</span>}
                {tab.label && <span>{tab.label}</span>}
              </button>
            ))}
          </div>
        </div>
        
        {/* Fade effect nas bordas - só quando não é grid */}
        {!useGrid && (
          <>
            <div className="absolute left-0 top-0 bottom-0 w-4 bg-gradient-to-r from-background to-transparent pointer-events-none" />
            <div className="absolute right-0 top-0 bottom-0 w-4 bg-gradient-to-l from-background to-transparent pointer-events-none" />
          </>
        )}
      </div>

      {/* Tab Content */}
      <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
        {activeContent}
      </div>
    </div>
  );
}

