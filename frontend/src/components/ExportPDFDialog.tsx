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
import { FileDown } from "lucide-react";

interface ExportPDFDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fileName: string;
  onFileNameChange: (name: string) => void;
  onConfirm: () => void;
  isExporting?: boolean;
}

export default function ExportPDFDialog({
  open,
  onOpenChange,
  fileName,
  onFileNameChange,
  onConfirm,
  isExporting = false,
}: ExportPDFDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileDown className="w-5 h-5 text-primary" />
            Exportar para PDF
          </DialogTitle>
          <DialogDescription>
            Personalize o nome do arquivo PDF antes de exportar.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="file-name">Nome do Arquivo</Label>
            <Input
              id="file-name"
              value={fileName}
              onChange={(e) => onFileNameChange(e.target.value)}
              placeholder="Ex: Análise Granulométrica - Obra X"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !isExporting) onConfirm();
              }}
              disabled={isExporting}
            />
            <p className="text-xs text-muted-foreground">
              A extensão .pdf será adicionada automaticamente
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={isExporting}
          >
            Cancelar
          </Button>
          <Button 
            onClick={onConfirm} 
            disabled={!fileName.trim() || isExporting}
          >
            {isExporting ? "Exportando..." : "Exportar PDF"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

