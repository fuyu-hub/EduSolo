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
  customTitle?: string;
  onCustomTitleChange?: (title: string) => void;
  showCustomTitle?: boolean;
  onConfirm: () => void;
  isExporting?: boolean;
}

export default function ExportPDFDialog({
  open,
  onOpenChange,
  fileName,
  onFileNameChange,
  customTitle = "",
  onCustomTitleChange,
  showCustomTitle = false,
  onConfirm,
  isExporting = false,
}: ExportPDFDialogProps) {
  const handleOpenChange = (newOpen: boolean) => {
    // Se está fechando o diálogo e há um nome de arquivo válido, confirma a exportação
    if (!newOpen && fileName.trim() && !isExporting) {
      onConfirm();
    } else {
      onOpenChange(newOpen);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
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
          {/* Título Personalizado do Relatório */}
          {showCustomTitle && (
            <div className="space-y-2">
              <Label htmlFor="custom-title">Título do Relatório (Opcional)</Label>
              <Input
                id="custom-title"
                value={customTitle}
                onChange={(e) => onCustomTitleChange?.(e.target.value)}
                placeholder="Ex: Relatório Geotécnico - Obra ABC"
                disabled={isExporting}
              />
              <p className="text-xs text-muted-foreground">
                Este título aparecerá no cabeçalho do PDF
              </p>
            </div>
          )}

          {/* Nome do Arquivo */}
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
            onClick={() => {
              // Cancelar sem salvar - fecha diretamente
              onOpenChange(false);
            }}
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

