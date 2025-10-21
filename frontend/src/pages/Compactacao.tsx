import { Layers } from "lucide-react";
import { Card } from "@/components/ui/card";

export default function Compactacao() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg">
          <Layers className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Compactação</h1>
          <p className="text-muted-foreground">Análise de curvas de compactação Proctor</p>
        </div>
      </div>

      <Card className="glass p-8">
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <Layers className="w-16 h-16 text-violet-500/30 mb-4" />
          <h3 className="text-xl font-semibold text-foreground mb-2">Em Desenvolvimento</h3>
          <p className="text-muted-foreground max-w-md">
            O módulo de Compactação está sendo desenvolvido e estará disponível em breve com
            análise de curvas Proctor e cálculos de energia.
          </p>
        </div>
      </Card>
    </div>
  );
}
