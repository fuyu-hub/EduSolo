/**
 * BotaoLimpar — Botão com confirmação em popover para reset de estado.
 * 
 * Evita limpezas de tela (reset) acidentais ao pedir confirmação. 
 * Pode ser facilmente ancorado aos cabeçalhos com o padrão de UI.
 */
import { useState } from "react";
import { Trash2 } from "lucide-react";
import { Button, ButtonProps } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface BotaoLimparProps {
  /** Callback disparado quando a exclusão/limpeza é confirmada pelo usuário */
  onLimpar: () => void;
  /** Texto opcional para o botão de trigger (default: "Limpar") */
  texto?: string;
  /** Classes extras a serem injetadas no botão de trigger */
  className?: string;
  /** Estilo shadcn do botão (default: "ghost") */
  variant?: ButtonProps["variant"];
  /** Tamanho do botão (default: "sm") */
  size?: ButtonProps["size"];
  /** Estado desabilitado (ex: enquanto recalcula ou se estiver em estado inicial) */
  disabled?: boolean;
}

export function BotaoLimpar({ onLimpar, texto = "Limpar", className, variant = "ghost", size = "sm", disabled = false }: BotaoLimparProps) {
  const [open, setOpen] = useState(false);

  const handleConfirm = () => {
    onLimpar();
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant={variant} size={size} disabled={disabled} className={`text-muted-foreground hover:text-destructive gap-1.5 ${className || ""}`}>
          <Trash2 className="w-4 h-4" /> {texto}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-3 shadow-xl border-destructive/20" side="bottom" align="end">
        <div className="space-y-3">
          <p className="text-sm font-medium text-foreground">Confirmar limpeza?</p>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" size="sm" onClick={() => setOpen(false)} className="h-7 text-xs px-2.5">
              Cancelar
            </Button>
            <Button variant="destructive" size="sm" onClick={handleConfirm} className="h-7 text-xs px-2.5 bg-destructive/90 hover:bg-destructive">
              Limpar Tudo
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
