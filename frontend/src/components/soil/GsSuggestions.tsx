import { HelpCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { gsValues } from "@/lib/soil-constants";
import { Badge } from "@/components/ui/badge";

interface GsSuggestionsProps {
  onSelect?: (value: number) => void;
}

export default function GsSuggestions({ onSelect }: GsSuggestionsProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 px-2 text-xs"
          type="button"
        >
          <HelpCircle className="w-3 h-3 mr-1" />
          Valores Típicos
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Valores Típicos de Gs (Densidade dos Grãos)</DialogTitle>
          <DialogDescription>
            Selecione um material para usar seu valor típico de Gs
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-3 mt-4">
          {gsValues.map((item, index) => (
            <div
              key={index}
              className="p-3 rounded-lg border bg-card hover:bg-accent/5 transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-foreground">{item.material}</h4>
                    <Badge variant="outline" className="text-xs">
                      {item.range}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    {item.description}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    <span className="font-medium">Valor típico:</span> {item.typical}
                  </p>
                </div>
                {onSelect && (
                  <Button
                    size="sm"
                    onClick={() => onSelect(item.typical)}
                    variant="outline"
                  >
                    Usar {item.typical}
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 p-3 rounded-lg bg-muted/50 border">
          <p className="text-xs text-muted-foreground">
            <strong>Nota:</strong> Estes são valores de referência. Para trabalhos críticos,
            recomenda-se determinar o Gs em laboratório conforme NBR 6508.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

