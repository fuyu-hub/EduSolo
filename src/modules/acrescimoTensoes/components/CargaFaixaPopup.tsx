import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Layers } from "lucide-react";

interface CargaFaixaPopupProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  qInicial?: number;
  larguraInicial?: number;
  onConfirm: (q: number, largura: number) => void;
}

export default function CargaFaixaPopup({
  open,
  onOpenChange,
  qInicial,
  larguraInicial,
  onConfirm
}: CargaFaixaPopupProps) {
  const [q, setQ] = useState("");
  const [largura, setLargura] = useState("");

  useEffect(() => {
    if (open) {
      setQ(qInicial !== undefined ? qInicial.toString() : "");
      setLargura(larguraInicial !== undefined ? larguraInicial.toString() : "");
    }
  }, [open, qInicial, larguraInicial]);

  const handleConfirm = () => {
    const qNum = parseFloat(q);
    const larguraNum = parseFloat(largura);

    if (isNaN(qNum) || qNum <= 0) {
      return;
    }

    if (isNaN(larguraNum) || larguraNum <= 0) {
      return;
    }

    onConfirm(qNum, larguraNum);
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
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg">
              <Layers className="w-5 h-5 text-white" />
            </div>
            <div>
              <DialogTitle>Definir Carga em Faixa</DialogTitle>
              <DialogDescription className="text-xs mt-0.5">
                Carga uniformemente distribuída em faixa infinita
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
              Pressão uniformemente distribuída sobre a faixa
            </p>
          </div>

          {/* Largura */}
          <div className="space-y-2">
            <Label htmlFor="largura" className="text-sm font-medium">
              Largura da Faixa B (m)
            </Label>
            <Input
              id="largura"
              type="number"
              step="0.01"
              value={largura}
              onChange={(e) => setLargura(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ex: 4.00"
              className="text-sm"
            />
            <p className="text-xs text-muted-foreground">
              Largura da faixa carregada (centro em x=0, infinita em y)
            </p>
          </div>

          {/* Preview da carga por metro linear */}
          {q && largura && !isNaN(parseFloat(q)) && !isNaN(parseFloat(largura)) && (
            <div className="p-3 rounded-lg bg-gradient-to-br from-green-500/10 to-emerald-600/10 border border-green-500/30">
              <p className="text-xs font-semibold text-muted-foreground mb-1">Carga por Metro Linear</p>
              <p className="text-lg font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                {(parseFloat(q) * parseFloat(largura)).toFixed(2)} kN/m
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                w = q × B = {q} × {largura}
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
            disabled={!q || !largura || parseFloat(q) <= 0 || parseFloat(largura) <= 0}
            className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
          >
            Confirmar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

