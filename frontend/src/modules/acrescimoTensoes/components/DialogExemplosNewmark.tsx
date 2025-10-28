import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { FileText, MapPin } from "lucide-react";

import { exemplosNewmark, type ExemploNewmark } from "@/lib/exemplos-newmark";

interface DialogExemplosNewmarkProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCarregarExemplo: (exemplo: ExemploNewmark) => void;
}

export default function DialogExemplosNewmark({
  open,
  onOpenChange,
  onCarregarExemplo,
}: DialogExemplosNewmarkProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle>Exemplos de Análise de Newmark</DialogTitle>
          <DialogDescription>
            Selecione um exemplo para carregar automaticamente os parâmetros e pontos de análise
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[500px] pr-4">
          <div className="space-y-3">
            {exemplosNewmark.map((exemplo) => (
              <div
                key={exemplo.id}
                className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex-1">
                    <h4 className="font-semibold text-base mb-1">{exemplo.titulo}</h4>
                    <p className="text-sm text-muted-foreground">{exemplo.descricao}</p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => {
                      onCarregarExemplo(exemplo);
                      onOpenChange(false);
                    }}
                  >
                    Carregar
                  </Button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs mb-2">
                  <div className="bg-muted/50 p-2 rounded">
                    <div className="text-muted-foreground mb-0.5">Largura</div>
                    <div className="font-semibold">{exemplo.largura} m</div>
                  </div>
                  <div className="bg-muted/50 p-2 rounded">
                    <div className="text-muted-foreground mb-0.5">Comprimento</div>
                    <div className="font-semibold">{exemplo.comprimento} m</div>
                  </div>
                  <div className="bg-muted/50 p-2 rounded">
                    <div className="text-muted-foreground mb-0.5">Carga</div>
                    <div className="font-semibold">{exemplo.intensidade} kPa</div>
                  </div>
                  <div className="bg-muted/50 p-2 rounded">
                    <div className="text-muted-foreground mb-0.5 flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      Pontos
                    </div>
                    <div className="font-semibold">{exemplo.pontos.length}</div>
                  </div>
                </div>

                {exemplo.fonte && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
                    <FileText className="w-3 h-3" />
                    <span>{exemplo.fonte}</span>
                  </div>
                )}

                {exemplo.observacoes && (
                  <div className="mt-2 text-xs text-muted-foreground italic border-l-2 border-orange-500 pl-2">
                    {exemplo.observacoes}
                  </div>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

