import { Save, FolderOpen, FileDown, FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

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
    <div className="flex gap-2 print:hidden">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            onClick={onLoad}
            disabled={isCalculating}
            className="hover:bg-blue-500/10 hover:text-blue-500 hover:border-blue-500/50 transition-all"
            aria-label="Carregar cálculo salvo"
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
            className={cn(
              "transition-all",
              hasResults && !isCalculating && "hover:bg-green-500/10 hover:text-green-500 hover:border-green-500/50"
            )}
            aria-label="Salvar cálculo"
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
            className={cn(
              "transition-all",
              hasResults && !isCalculating && "hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/50"
            )}
            aria-label="Exportar para PDF"
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
            className={cn(
              "transition-all",
              hasResults && !isCalculating && "hover:bg-emerald-500/10 hover:text-emerald-500 hover:border-emerald-500/50"
            )}
            aria-label="Exportar para Excel"
          >
            <FileSpreadsheet className="w-4 h-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Exportar Excel</TooltipContent>
      </Tooltip>
    </div>
  );
}

