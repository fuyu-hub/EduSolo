import { AlertCircle, CheckCircle, Info, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { interpretResults, ResultInterpretation as InterpretationType } from "@/lib/soil-constants";
import { Badge } from "@/components/ui/badge";
import { useSettings } from "@/hooks/use-settings";

interface ResultInterpretationProps {
  results: any;
}

export default function ResultInterpretation({ results }: ResultInterpretationProps) {
  const { settings } = useSettings();
  const interpretations = interpretResults(results);

  // Se dicas educacionais estiverem desativadas, não mostra nada
  if (!settings.showEducationalTips || interpretations.length === 0) {
    return null;
  }

  const getIcon = (alert?: string) => {
    switch (alert) {
      case "success":
        return <CheckCircle className="w-4 h-4" />;
      case "warning":
        return <AlertTriangle className="w-4 h-4" />;
      case "error":
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <Info className="w-4 h-4" />;
    }
  };

  const getAlertVariant = (alert?: string): "default" | "destructive" => {
    return alert === "error" ? "destructive" : "default";
  };

  const getAlertClass = (alert?: string) => {
    switch (alert) {
      case "success":
        return "border-green-500/50 bg-green-500/10";
      case "warning":
        return "border-yellow-500/50 bg-yellow-500/10";
      case "error":
        return "border-red-500/50 bg-red-500/10";
      default:
        return "border-blue-500/50 bg-blue-500/10";
    }
  };

  return (
    <Card className="glass">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Info className="w-5 h-5 text-primary" />
          Interpretação Prática
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {interpretations.map((interp, index) => (
          <Alert
            key={index}
            variant={getAlertVariant(interp.alert)}
            className={getAlertClass(interp.alert)}
          >
            <div className="flex items-start gap-2">
              {getIcon(interp.alert)}
              <div className="flex-1 space-y-1">
                <AlertTitle className="text-sm flex items-center gap-2">
                  {interp.parameter}
                  {interp.value !== null && (
                    <Badge variant="outline" className="ml-auto">
                      {typeof interp.value === 'number' 
                        ? interp.value.toFixed(1)
                        : interp.value
                      }
                      {interp.parameter.includes("Saturação") || 
                       interp.parameter.includes("Umidade") ||
                       interp.parameter.includes("Porosidade") ||
                       interp.parameter.includes("Compacidade")
                        ? "%"
                        : ""
                      }
                    </Badge>
                  )}
                </AlertTitle>
                <AlertDescription className="text-xs">
                  {interp.interpretation}
                </AlertDescription>
              </div>
            </div>
          </Alert>
        ))}

        <div className="mt-4 p-3 rounded-lg bg-muted/50 border border-border/50">
          <p className="text-xs text-muted-foreground">
            <strong>Nota:</strong> As interpretações são baseadas em valores típicos da literatura
            técnica. Sempre considere as condições específicas do projeto.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

