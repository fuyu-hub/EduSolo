/**
 * Componente para exibir cálculos recentes
 * Usa o Zustand store para gerenciar estado
 */

import { memo, useCallback } from "react";
import { useCalculationStore } from "@/stores/calculationStore";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Star, Trash2, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface RecentCalculationsProps {
  moduleName?: string;
  maxItems?: number;
  className?: string;
}

export const RecentCalculations = memo<RecentCalculationsProps>(
  ({ moduleName, maxItems = 10, className }) => {
    const { recentCalculations, getCalculationsByModule, removeCalculation, toggleFavorite } =
      useCalculationStore();

    // Filtrar cálculos por módulo se especificado
    const calculations = moduleName
      ? getCalculationsByModule(moduleName).slice(0, maxItems)
      : recentCalculations.slice(0, maxItems);

    const handleDelete = useCallback(
      (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        removeCalculation(id);
      },
      [removeCalculation]
    );

    const handleToggleFavorite = useCallback(
      (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        toggleFavorite(id);
      },
      [toggleFavorite]
    );

    if (calculations.length === 0) {
      return (
        <Card className={className}>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Cálculos Recentes
            </CardTitle>
            <CardDescription>
              {moduleName
                ? "Nenhum cálculo recente para este módulo"
                : "Nenhum cálculo realizado ainda"}
            </CardDescription>
          </CardHeader>
        </Card>
      );
    }

    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Cálculos Recentes
          </CardTitle>
          <CardDescription>
            {calculations.length} {calculations.length === 1 ? "cálculo" : "cálculos"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[300px] pr-4">
            <div className="space-y-2">
              {calculations.map((calc) => (
                <div
                  key={calc.id}
                  className={cn(
                    "group p-3 rounded-lg border border-border bg-card hover:bg-accent/50 transition-colors",
                    "cursor-pointer"
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium truncate">
                          {calc.title || calc.moduleName}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {calc.type}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(calc.timestamp, {
                          addSuffix: true,
                          locale: ptBR,
                        })}
                      </p>
                    </div>

                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={(e) => handleToggleFavorite(calc.id, e)}
                        aria-label={
                          calc.favorite ? "Remover dos favoritos" : "Adicionar aos favoritos"
                        }
                      >
                        <Star
                          className={cn(
                            "h-4 w-4",
                            calc.favorite && "fill-yellow-400 text-yellow-400"
                          )}
                        />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={(e) => handleDelete(calc.id, e)}
                        aria-label="Remover"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    );
  }
);

RecentCalculations.displayName = "RecentCalculations";

