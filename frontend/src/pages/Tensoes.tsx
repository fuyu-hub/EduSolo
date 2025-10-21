import { FileText } from "lucide-react";
import { Card } from "@/components/ui/card";

export default function Tensoes() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-lg">
          <FileText className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Tensões Geostáticas</h1>
          <p className="text-muted-foreground">Cálculo de tensões no solo</p>
        </div>
      </div>

      <Card className="glass p-8">
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <FileText className="w-16 h-16 text-emerald-500/30 mb-4" />
          <h3 className="text-xl font-semibold text-foreground mb-2">Em Desenvolvimento</h3>
          <p className="text-muted-foreground max-w-md">
            O módulo de Tensões Geostáticas está sendo desenvolvido e incluirá cálculos de
            tensões verticais, efetivas e neutras.
          </p>
        </div>
      </Card>
    </div>
  );
}
