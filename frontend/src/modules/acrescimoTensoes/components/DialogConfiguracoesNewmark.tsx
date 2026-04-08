import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Settings } from "lucide-react";

interface DialogConfiguracoesNewmarkProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  usarAbaco: boolean;
  onToggleMetodo: (usar: boolean) => void;
}

export default function DialogConfiguracoesNewmark({
  open,
  onOpenChange,
  usarAbaco,
  onToggleMetodo,
}: DialogConfiguracoesNewmarkProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center">
              <Settings className="w-4 h-4 text-white" />
            </div>
            Configurações de Cálculo
          </DialogTitle>
          <DialogDescription>
            Escolha o método de cálculo para a análise de Newmark
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex items-start justify-between p-4 bg-muted/50 rounded-lg">
            <div className="space-y-1 flex-1 mr-4">
              <Label htmlFor="metodo-toggle" className="text-base font-semibold cursor-pointer">
                {usarAbaco ? "Ábaco de Newmark" : "Fórmula Analítica"}
              </Label>
              <p className="text-sm text-muted-foreground">
                {usarAbaco 
                  ? "Valores tabelados exatos (sem interpolação) - Simula cálculo manual" 
                  : "Integração analítica de Newmark - Cálculo contínuo e preciso"}
              </p>
            </div>
            <Switch
              id="metodo-toggle"
              checked={usarAbaco}
              onCheckedChange={onToggleMetodo}
              className="mt-1"
            />
          </div>

          <div className="bg-blue-500/10 border border-blue-500/20 p-3 rounded-lg">
            <div className="flex items-start gap-2 text-sm text-blue-700 dark:text-blue-400">
              <div className="text-lg">ℹ️</div>
              <div>
                <p className="font-semibold mb-1">
                  {usarAbaco ? "Modo: Ábaco" : "Modo: Fórmula"}
                </p>
                <p className="text-xs">
                  {usarAbaco 
                    ? "Pega o valor mais próximo da tabela (sem interpolação). Resulta idêntico ao cálculo manual com ábaco impresso."
                    : "Cálculo preciso usando a solução analítica de Newmark. Ideal para precisão matemática."}
                </p>
              </div>
            </div>
          </div>

          <div className="text-xs text-muted-foreground">
            <p className="font-semibold mb-1">Diferenças entre métodos:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li><span className="font-medium">Fórmula:</span> Cálculo contínuo, alta precisão matemática</li>
              <li><span className="font-medium">Ábaco:</span> Valor mais próximo da tabela (discreto), como cálculo manual</li>
              <li>Diferença típica entre métodos: pode variar dependendo da posição na tabela</li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

