/**
 * BarraAcoes — Barra de ações padronizada para manipulação de cálculos.
 * 
 * Agrupa os atalhos vitais dos módulos: Carregar, Salvar e Exportar (PDF/Excel),
 * centralizados num layout consistente com tooltips explicativos.
 */
import { Save, FolderOpen, FileDown, FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface CalculationActionsProps {
  /** Callback executado ao clicar em "Salvar Cálculo" */
  onSave: () => void;
  /** Callback executado ao clicar no ícone de "Carregar Cálculo" da base */
  onLoad: () => void;
  /** Callback para exportar resultados em PDF */
  onExportPDF: () => void;
  /** Callback para exportar planilhas padronizadas em Excel */
  onExportExcel: () => void;
  /** Passar "true" para habilitar as ações de Salvar e Exportar (quando o módulo contém um resultado final gerado) */
  hasResults: boolean;
  /** Impede ações enquanto a requisição de cálculo está processando */
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
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            disabled={!hasResults || isCalculating}
            className="transition-all"
            aria-label="Exportar"
          >
            <FileDown className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={onExportPDF} disabled={!hasResults || isCalculating}>
            <FileDown className="w-4 h-4 mr-2" /> Exportar PDF
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onExportExcel} disabled={!hasResults || isCalculating}>
            <FileSpreadsheet className="w-4 h-4 mr-2" /> Exportar Excel
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

