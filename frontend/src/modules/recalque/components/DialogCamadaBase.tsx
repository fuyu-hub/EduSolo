// frontend/src/modules/recalque/components/DialogCamadaBase.tsx
import React from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface CamadaBaseData {
  drenante: boolean;
}

interface DialogCamadaBaseProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (data: CamadaBaseData) => void;
  camadaInicial?: CamadaBaseData;
  title?: string;
  description?: string;
}

export default function DialogCamadaBase({ 
  open, 
  onOpenChange, 
  onConfirm, 
  camadaInicial,
  title = "Configurar Camada Base",
  description = "A camada base é fixa e não pode ser editada. Apenas configure se é drenante."
}: DialogCamadaBaseProps) {
  const [drenante, setDrenante] = React.useState(camadaInicial?.drenante ?? false);

  React.useEffect(() => {
    if (camadaInicial) {
      setDrenante(camadaInicial.drenante);
    }
  }, [camadaInicial]);

  const handleConfirm = () => {
    onConfirm({ drenante });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <TooltipProvider>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="drenante"
                checked={drenante}
                onCheckedChange={(checked) => setDrenante(checked === true)}
              />
              <Label htmlFor="drenante" className="text-sm cursor-pointer flex items-center gap-1">
                Camada é drenante
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="w-3.5 h-3.5 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">
                      Se a camada base for drenante, ela facilita a drenagem da argila acima. 
                      Se você tiver duas camadas drenantes (acima e abaixo da argila), o tempo 
                      de adensamento será calculado considerando drenagem dupla.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </Label>
            </div>
          </TooltipProvider>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button type="button" onClick={handleConfirm}>Confirmar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

