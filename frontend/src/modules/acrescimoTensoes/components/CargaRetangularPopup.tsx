import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Square } from "lucide-react";

interface CargaRetangularPopupProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSalvar: (dados: { largura: number; comprimento: number; intensidade: number; nomeSapata: string }) => void;
  larguraInicial?: number;
  comprimentoInicial?: number;
  intensidadeInicial?: number;
  nomeSapataInicial?: string;
}

export default function CargaRetangularPopup({
  open,
  onOpenChange,
  onSalvar,
  larguraInicial,
  comprimentoInicial,
  intensidadeInicial,
  nomeSapataInicial,
}: CargaRetangularPopupProps) {
  const [largura, setLargura] = useState("");
  const [comprimento, setComprimento] = useState("");
  const [intensidade, setIntensidade] = useState("");
  const [nomeSapata, setNomeSapata] = useState("");

  useEffect(() => {
    if (open) {
      setLargura(larguraInicial !== undefined ? larguraInicial.toString() : "");
      setComprimento(comprimentoInicial !== undefined ? comprimentoInicial.toString() : "");
      setIntensidade(intensidadeInicial !== undefined ? intensidadeInicial.toString() : "");
      setNomeSapata(nomeSapataInicial || "Sapata 1");
    }
  }, [open, larguraInicial, comprimentoInicial, intensidadeInicial, nomeSapataInicial]);

  const handleConfirm = () => {
    const l = parseFloat(largura);
    const c = parseFloat(comprimento);
    const p = parseFloat(intensidade);

    if (isNaN(l) || l <= 0 || isNaN(c) || c <= 0 || isNaN(p) || p <= 0 || !nomeSapata.trim()) {
      return;
    }

    onSalvar({ largura: l, comprimento: c, intensidade: p, nomeSapata: nomeSapata.trim() });
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
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center shadow-lg">
              <Square className="w-5 h-5 text-white" />
            </div>
            <div>
              <DialogTitle>Definir Carga Retangular</DialogTitle>
              <DialogDescription className="text-xs mt-0.5">
                Carga uniformemente distribuída em área retangular
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Nome da Sapata */}
          <div className="space-y-2">
            <Label htmlFor="nomeSapata" className="text-sm font-medium">
              Nome da Sapata
            </Label>
            <Input
              id="nomeSapata"
              type="text"
              value={nomeSapata}
              onChange={(e) => setNomeSapata(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ex: Sapata 1"
              className="text-sm"
              autoFocus
            />
            <p className="text-xs text-muted-foreground">
              Identificação da sapata no projeto
            </p>
          </div>

          {/* Intensidade */}
          <div className="space-y-2">
            <Label htmlFor="intensidade" className="text-sm font-medium">
              Carga Distribuída p (kPa)
            </Label>
            <Input
              id="intensidade"
              type="number"
              step="0.01"
              value={intensidade}
              onChange={(e) => setIntensidade(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ex: 100.00"
              className="text-sm"
            />
            <p className="text-xs text-muted-foreground">
              Pressão uniformemente distribuída sobre a área retangular
            </p>
          </div>

          {/* Largura */}
          <div className="space-y-2">
            <Label htmlFor="largura" className="text-sm font-medium">
              Largura L (m)
            </Label>
            <Input
              id="largura"
              type="number"
              step="0.01"
              value={largura}
              onChange={(e) => setLargura(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ex: 3.00"
              className="text-sm"
            />
            <p className="text-xs text-muted-foreground">
              Largura da sapata retangular
            </p>
          </div>

          {/* Comprimento */}
          <div className="space-y-2">
            <Label htmlFor="comprimento" className="text-sm font-medium">
              Comprimento C (m)
            </Label>
            <Input
              id="comprimento"
              type="number"
              step="0.01"
              value={comprimento}
              onChange={(e) => setComprimento(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ex: 2.00"
              className="text-sm"
            />
            <p className="text-xs text-muted-foreground">
              Comprimento da sapata retangular
            </p>
          </div>

          {/* Preview da carga total */}
          {intensidade && largura && comprimento && 
           !isNaN(parseFloat(intensidade)) && !isNaN(parseFloat(largura)) && !isNaN(parseFloat(comprimento)) && (
            <div className="p-3 rounded-lg bg-gradient-to-br from-orange-500/10 to-red-600/10 border border-orange-500/30">
              <p className="text-xs font-semibold text-muted-foreground mb-1">Carga Total</p>
              <p className="text-lg font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                {(parseFloat(intensidade) * parseFloat(largura) * parseFloat(comprimento)).toFixed(2)} kN
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                P = p × L × C = {intensidade} × {largura} × {comprimento}
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
            disabled={!intensidade || !largura || !comprimento || 
                     parseFloat(intensidade) <= 0 || parseFloat(largura) <= 0 || parseFloat(comprimento) <= 0}
            className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700"
          >
            Confirmar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

