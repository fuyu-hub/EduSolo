// frontend/src/components/tensoes/DialogConfiguracoes.tsx
import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Info, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const configSchema = z.object({
  pesoEspecificoAgua: z.string().refine(val => !isNaN(parseFloat(val)) && parseFloat(val) > 0, { message: "γw > 0" }),
});

type ConfigFormData = z.infer<typeof configSchema>;

export interface ConfigData {
  pesoEspecificoAgua: string;
}

interface DialogConfiguracoesProps {
  configInicial: ConfigData;
  onConfirm: (data: ConfigData) => void;
  disabled?: boolean;
}

const tooltips = {
  pesoEspecificoAgua: "Peso específico da água (kN/m³). Padrão: 10.0",
};

export default function DialogConfiguracoes({ configInicial, onConfirm, disabled = false }: DialogConfiguracoesProps) {
  const form = useForm<ConfigFormData>({
    resolver: zodResolver(configSchema),
    defaultValues: configInicial,
  });

  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (open) {
      form.reset(configInicial);
    }
  }, [open, configInicial, form]);

  const onSubmit = (data: ConfigFormData) => {
    onConfirm(data);
    setOpen(false);
  };

  const errors = form.formState.errors;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" disabled={disabled} className="h-9">
          <Settings className="w-4 h-4 mr-1.5" />
          Configurações
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Configurações</DialogTitle>
          <DialogDescription>Ajuste parâmetros globais do cálculo</DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <TooltipProvider>
            {/* γ da água */}
            <div className="space-y-2">
              <Label htmlFor="pesoEspecificoAgua" className={cn("flex items-center gap-1 text-sm", errors.pesoEspecificoAgua && "text-destructive")}>
                γ<sub>w</sub> - Peso Específico da Água (kN/m³) *
                <Tooltip>
                  <TooltipTrigger><Info className="w-3 h-3 text-muted-foreground" /></TooltipTrigger>
                  <TooltipContent>{tooltips.pesoEspecificoAgua}</TooltipContent>
                </Tooltip>
              </Label>
              <Controller
                name="pesoEspecificoAgua"
                control={form.control}
                render={({ field }) => (
                  <Input
                    id="pesoEspecificoAgua"
                    type="number"
                    step="0.01"
                    placeholder="Ex: 10.0"
                    {...field}
                    className={cn("bg-background/50", errors.pesoEspecificoAgua && "border-destructive")}
                  />
                )}
              />
              {errors.pesoEspecificoAgua && <p className="text-xs text-destructive">{errors.pesoEspecificoAgua.message}</p>}
            </div>
          </TooltipProvider>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit">
              Aplicar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

