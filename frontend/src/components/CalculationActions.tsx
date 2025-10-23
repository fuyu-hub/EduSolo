import { Save, FolderOpen, FileDown, FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface CalculationActionsProps {
  onSave: () => void;
  onLoad: () => void;
  onExportPDF: () => void;
  onExportExcel: () => void;
  hasResults: boolean;
  isCalculating: boolean;
}

export default function CalculationActions({
  onSave,
  onLoad,
  onExportPDF,
  onExportExcel,
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
            onClick={onExportPDF}
            disabled={!hasResults || isCalculating}
          >
            <FileDown className="w-4 h-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Exportar PDF</TooltipContent>
      </Tooltip>
      
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            onClick={onExportExcel}
            disabled={!hasResults || isCalculating}
          >
            <FileSpreadsheet className="w-4 h-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Exportar Excel</TooltipContent>
      </Tooltip>
    </div>
  );
}

