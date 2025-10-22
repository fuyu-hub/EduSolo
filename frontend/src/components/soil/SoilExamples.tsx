import { FileText } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { soilExamples, SoilExample } from "@/lib/soil-constants";

interface SoilExamplesProps {
  onSelect: (example: SoilExample) => void;
  disabled?: boolean;
}

export default function SoilExamples({ onSelect, disabled }: SoilExamplesProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" disabled={disabled}>
          <FileText className="w-4 h-4 mr-2" />
          Exemplos
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72">
        <DropdownMenuLabel>Selecione um Tipo de Solo</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {soilExamples.map((example, index) => (
          <DropdownMenuItem
            key={index}
            onClick={() => onSelect(example)}
            className="cursor-pointer"
          >
            <div className="flex items-start gap-2 w-full">
              <span className="text-2xl shrink-0">{example.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">{example.name}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {example.description}
                </p>
              </div>
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

