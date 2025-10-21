import { BookOpen } from "lucide-react";
import { Card } from "@/components/ui/card";

export default function Educacional() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-teal-600 flex items-center justify-center shadow-lg">
          <BookOpen className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Material Educacional</h1>
          <p className="text-muted-foreground">Conteúdos teóricos e conceitos fundamentais</p>
        </div>
      </div>

      <Card className="glass p-8">
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <BookOpen className="w-16 h-16 text-cyan-500/30 mb-4" />
          <h3 className="text-xl font-semibold text-foreground mb-2">Em Desenvolvimento</h3>
          <p className="text-muted-foreground max-w-md">
            A biblioteca de material educacional está sendo preparada e incluirá conceitos
            teóricos, exemplos práticos e questões de estudo.
          </p>
        </div>
      </Card>
    </div>
  );
}
