import { Save, Trash2, FolderOpen, Calendar } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useSavedCalculations } from "@/hooks/use-saved-calculations";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useNavigate } from "react-router-dom";

export default function Salvos() {
  const navigate = useNavigate();
  const { calculations, deleteCalculation } = useSavedCalculations("todos");

  // Agrupar cálculos por módulo
  const calculationsByModule = calculations.reduce((acc, calc) => {
    const module = calc.moduleName || "Outros";
    if (!acc[module]) {
      acc[module] = [];
    }
    acc[module].push(calc);
    return acc;
  }, {} as Record<string, typeof calculations>);

  const handleOpen = (calculation: any) => {
    // Navegar para o módulo específico (implementar lógica de navegação)
    const moduleRoutes: Record<string, string> = {
      "Índices Físicos": "/indices-fisicos",
      "Limites de Consistência": "/limites-consistencia",
      "Granulometria": "/granulometria",
      "Compactação": "/compactacao",
      "Tensões Geostáticas": "/tensoes",
      "Acréscimo de Tensões": "/acrescimo-tensoes",
    };

    const route = moduleRoutes[calculation.moduleName];
    if (route) {
      navigate(route);
    }
  };

  if (calculations.length === 0) {
    return (
      <div className="space-y-4 max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6 rounded-xl border border-primary/20">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
              <Save className="w-6 h-6 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">Cálculos Salvos</h1>
          </div>
          <p className="text-muted-foreground">
            Acesse seus cálculos salvos de todos os módulos
          </p>
        </div>

        {/* Empty State */}
        <Alert>
          <FolderOpen className="h-4 w-4" />
          <AlertDescription>
            Você ainda não tem cálculos salvos. Comece um novo cálculo em qualquer módulo e salve para acessá-lo aqui depois!
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6 rounded-xl border border-primary/20">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
            <Save className="w-6 h-6 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Cálculos Salvos</h1>
        </div>
        <p className="text-muted-foreground">
          {calculations.length} {calculations.length === 1 ? "cálculo salvo" : "cálculos salvos"}
        </p>
      </div>

      {/* Cálculos agrupados por módulo */}
      {Object.entries(calculationsByModule).map(([moduleName, moduleCalcs]) => (
        <div key={moduleName}>
          <h2 className="text-lg font-semibold mb-3 text-foreground">{moduleName}</h2>
          <div className="grid gap-3">
            {moduleCalcs.map((calc) => (
              <Card
                key={calc.id}
                className="p-4 hover:shadow-lg transition-all duration-200 border border-border/50 hover:border-primary/30"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground mb-1 truncate">
                      {calc.name}
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="w-3 h-3" />
                      <span>
                        Salvo há{" "}
                        {formatDistanceToNow(new Date(calc.timestamp), {
                          locale: ptBR,
                          addSuffix: false,
                        })}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleOpen(calc)}
                    >
                      <FolderOpen className="w-4 h-4 mr-1" />
                      Abrir
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => deleteCalculation(calc.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

