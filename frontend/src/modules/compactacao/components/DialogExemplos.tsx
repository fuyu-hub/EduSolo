// frontend/src/components/compactacao/DialogExemplos.tsx
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FileText } from "lucide-react";
import { exemplosCompactacao, ExemploCompactacao } from "@/lib/exemplos-compactacao";

interface DialogExemplosProps {
  onSelectExample: (example: ExemploCompactacao) => void;
  disabled?: boolean;
}

export default function DialogExemplos({ onSelectExample, disabled }: DialogExemplosProps) {
  const [open, setOpen] = useState(false);

  const handleSelect = (exemplo: ExemploCompactacao) => {
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
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Exemplos de Ensaios de Compactação</DialogTitle>
          <DialogDescription>
            Selecione um exemplo de ensaio Proctor para preencher automaticamente o formulário
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 mt-4">
          {exemplosCompactacao.map((exemplo, index) => (
            <Card 
              key={index}
              className="p-4 cursor-pointer hover:bg-accent/50 transition-colors"
              onClick={() => handleSelect(exemplo)}
            >
              <div className="flex items-start gap-3">
                <div className="text-3xl">{exemplo.icon}</div>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground mb-1">{exemplo.nome}</h3>
                  <p className="text-sm text-muted-foreground mb-2">{exemplo.descricao}</p>
                  <div className="flex gap-4 text-xs text-muted-foreground">
                    <span>Volume: {exemplo.volumeCilindro} cm³</span>
                    <span>Pontos: {exemplo.pontos.length}</span>
                    {exemplo.Gs && <span>Gs: {exemplo.Gs}</span>}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

