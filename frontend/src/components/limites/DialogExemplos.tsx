import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FileText } from "lucide-react";
import { exemplosLimites, ExemploLimites } from "@/lib/exemplos-limites";
import { ScrollArea } from "@/components/ui/scroll-area";

interface DialogExemplosProps {
  onSelectExample: (example: ExemploLimites) => void;
  disabled?: boolean;
}

export default function DialogExemplos({ onSelectExample, disabled }: DialogExemplosProps) {
  const [open, setOpen] = useState(false);

  const handleSelect = (exemplo: ExemploLimites) => {
    onSelectExample(exemplo);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" disabled={disabled} className="gap-2">
          <FileText className="w-4 h-4" />
          Exemplos
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Exemplos de Ensaios de Limites de Consistência</DialogTitle>
          <DialogDescription>
            Selecione um exemplo para preencher automaticamente o formulário com dados típicos de diferentes tipos de solo
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-[500px] pr-4">
          <div className="grid gap-3 mt-4">
            {exemplosLimites.map((exemplo) => (
              <Card 
                key={exemplo.id}
                className="p-4 cursor-pointer hover:bg-accent/50 transition-colors border-2 hover:border-primary"
                onClick={() => handleSelect(exemplo)}
              >
                <div className="flex items-start gap-3">
                  <div className="text-3xl">{exemplo.icon}</div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground mb-1">{exemplo.nome}</h3>
                    <p className="text-sm text-muted-foreground mb-2">{exemplo.descricao}</p>
                    <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                      <span className="px-2 py-1 bg-primary/10 rounded">
                        Tipo: {exemplo.tipoSolo}
                      </span>
                      <span className="px-2 py-1 bg-blue-500/10 rounded">
                        Pontos LL: {exemplo.pontosLL.length}
                      </span>
                      {exemplo.percentualArgila && (
                        <span className="px-2 py-1 bg-green-500/10 rounded">
                          Argila: {exemplo.percentualArgila}%
                        </span>
                      )}
                      {exemplo.umidadeNatural && (
                        <span className="px-2 py-1 bg-orange-500/10 rounded">
                          w natural: {exemplo.umidadeNatural}%
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

