import { Save, FolderOpen, Download, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface CalculationActionsProps {
  onSave: () => void;
  onLoad: () => void;
  onExport: () => void;
  onPrint: () => void;
  hasResults: boolean;
  isCalculating: boolean;
}

export default function CalculationActions({
  onSave,
  onLoad,
  onExport,
  onPrint,
  hasResults,
  isCalculating,
}: CalculationActionsProps) {
  return (
    <div className="flex gap-2 no-print">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            onClick={onLoad}
            disabled={isCalculating}
          >
            <FolderOpen className="w-4 h-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Carregar Cálculo</TooltipContent>
      </Tooltip>
      
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            onClick={onSave}
            disabled={!hasResults || isCalculating}
          >
            <Save className="w-4 h-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Salvar Cálculo</TooltipContent>
      </Tooltip>
      
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            onClick={onExport}
            disabled={!hasResults || isCalculating}
          >
            <Download className="w-4 h-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Exportar PDF</TooltipContent>
      </Tooltip>
      
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            onClick={onPrint}
            disabled={!hasResults || isCalculating}
          >
            <Printer className="w-4 h-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Imprimir</TooltipContent>
      </Tooltip>
    </div>
  );
}

