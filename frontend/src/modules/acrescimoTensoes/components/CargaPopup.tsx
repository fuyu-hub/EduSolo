import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Weight } from "lucide-react";

interface CargaPopupProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  valorInicial?: number;
  onConfirm: (valor: number) => void;
}

export default function CargaPopup({ open, onOpenChange, valorInicial = 100, onConfirm }: CargaPopupProps) {
  const [valor, setValor] = useState(valorInicial.toString());
  const [erro, setErro] = useState("");

  useEffect(() => {
    if (open) {
      setValor(valorInicial.toString());
      setErro("");
    }
  }, [open, valorInicial]);

  const handleConfirm = () => {
    const valorNum = parseFloat(valor);
    
    if (isNaN(valorNum)) {
      setErro("Valor inválido");
      return;
    }
    
    if (valorNum <= 0) {
      setErro("A carga deve ser maior que zero");
      return;
    }
    
    onConfirm(valorNum);
    onOpenChange(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleConfirm();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center">
              <Weight className="w-4 h-4 text-white" />
            </div>
            Configurar Carga Pontual
          </DialogTitle>
          <DialogDescription>
            Defina o valor da carga vertical aplicada na superfície do solo
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="valor-carga">Valor da Carga P (kN)</Label>
            <Input
              id="valor-carga"
              type="number"
              step="0.1"
              placeholder="100.0"
              value={valor}
              onChange={(e) => {
                setValor(e.target.value);
                setErro("");
              }}
              onKeyDown={handleKeyDown}
              className={erro ? "border-red-500" : ""}
              autoFocus
            />
            {erro && <p className="text-sm text-red-500">{erro}</p>}
          </div>
          
          <div className="text-xs text-muted-foreground bg-muted p-3 rounded-md">
            <p className="font-semibold mb-1">💡 Dica:</p>
            <p>A carga P será aplicada no ponto central da superfície (X=0, Z=0). Valores típicos: 50-500 kN para cargas estruturais.</p>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm}>
            Confirmar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

