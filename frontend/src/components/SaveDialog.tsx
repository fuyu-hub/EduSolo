import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface SaveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  saveName: string;
  onSaveNameChange: (name: string) => void;
  onConfirm: () => void;
}

export default function SaveDialog({
  open,
  onOpenChange,
  saveName,
  onSaveNameChange,
  onConfirm,
}: SaveDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Salvar Cálculo</DialogTitle>
          <DialogDescription>
            Dê um nome para este cálculo para encontrá-lo facilmente depois.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="save-name">Nome do Cálculo</Label>
            <Input
              id="save-name"
              value={saveName}
              onChange={(e) => onSaveNameChange(e.target.value)}
              placeholder="Ex: Análise Solo - Obra X"
              onKeyDown={(e) => {
                if (e.key === "Enter") onConfirm();
              }}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={onConfirm} disabled={!saveName.trim()}>
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

