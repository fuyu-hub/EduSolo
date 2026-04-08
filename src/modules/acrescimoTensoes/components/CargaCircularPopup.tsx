import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Circle } from "lucide-react";

interface CargaCircularPopupProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  qInicial?: number;
  raioInicial?: number;
  onConfirm: (q: number, raio: number) => void;
}

export default function CargaCircularPopup({
  open,
  onOpenChange,
  qInicial,
  raioInicial,
  onConfirm
}: CargaCircularPopupProps) {
  const [q, setQ] = useState("");
  const [raio, setRaio] = useState("");

  useEffect(() => {
    if (open) {
      setQ(qInicial !== undefined ? qInicial.toString() : "");
      setRaio(raioInicial !== undefined ? raioInicial.toString() : "");
    }
  }, [open, qInicial, raioInicial]);

  const handleConfirm = () => {
    const qNum = parseFloat(q);
    const raioNum = parseFloat(raio);

    if (isNaN(qNum) || qNum <= 0) {
      return;
    }

    if (isNaN(raioNum) || raioNum <= 0) {
      return;
    }

    onConfirm(qNum, raioNum);
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
          <div className="flex items-center gap-2 mb-2">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-lg">
              <Circle className="w-5 h-5 text-white" />
            </div>
            <div>
              <DialogTitle>Definir Carga Circular</DialogTitle>
              <DialogDescription className="text-xs mt-0.5">
                Carga uniformemente distribuída em área circular
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Carga q */}
          <div className="space-y-2">
            <Label htmlFor="q" className="text-sm font-medium">
              Carga Distribuída q (kPa)
            </Label>
            <Input
              id="q"
              type="number"
              step="0.01"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ex: 100.00"
              className="text-sm"
              autoFocus
            />
            <p className="text-xs text-muted-foreground">
              Pressão uniformemente distribuída sobre a área circular
            </p>
          </div>

          {/* Raio */}
          <div className="space-y-2">
            <Label htmlFor="raio" className="text-sm font-medium">
              Raio da Área Circular R (m)
            </Label>
            <Input
              id="raio"
              type="number"
              step="0.01"
              value={raio}
              onChange={(e) => setRaio(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ex: 3.00"
              className="text-sm"
            />
            <p className="text-xs text-muted-foreground">
              Raio da área circular carregada (centro em x=0, z=0)
            </p>
          </div>

          {/* Preview da carga total */}
          {q && raio && !isNaN(parseFloat(q)) && !isNaN(parseFloat(raio)) && (
            <div className="p-3 rounded-lg bg-gradient-to-br from-purple-500/10 to-pink-600/10 border border-purple-500/30">
              <p className="text-xs font-semibold text-muted-foreground mb-1">Carga Total</p>
              <p className="text-lg font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                {(parseFloat(q) * Math.PI * parseFloat(raio) * parseFloat(raio)).toFixed(2)} kN
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                P = q × π × R² = {q} × π × {raio}²
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={handleConfirm}
            disabled={!q || !raio || parseFloat(q) <= 0 || parseFloat(raio) <= 0}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
          >
            Confirmar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

