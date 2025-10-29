import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Info } from "lucide-react";
import { cn } from "@/lib/utils";

const camadaAterroSchema = z.object({
  nome: z.string().min(1, { message: "Nome obrigatório" }),
  espessura: z.string().min(1, { message: "Obrigatório" }).refine(val => !isNaN(parseFloat(val)) && parseFloat(val) > 0, { message: "Deve ser > 0" }),
  gamaNat: z.string().optional().refine(val => val === undefined || val === "" || (!isNaN(parseFloat(val)) && parseFloat(val) > 0), {
    message: "Deve ser > 0 ou vazio",
  }),
  gamaSat: z.string().optional().refine(val => val === undefined || val === "" || (!isNaN(parseFloat(val)) && parseFloat(val) > 0), {
    message: "Deve ser > 0 ou vazio",
  }),
});

type CamadaAterroFormData = z.infer<typeof camadaAterroSchema>;

export interface CamadaAterroEditData {
  nome: string;
  espessura: string;
  gamaNat?: string;
  gamaSat?: string;
}

interface DialogCamadaAterroProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (data: CamadaAterroEditData) => void;
  camadaInicial?: Partial<CamadaAterroEditData>;
  title?: string;
  description?: string;
}

const tooltips = {
  nome: "Nome ou tipo da camada de aterro (ex: Aterro Compactado, Terrapleno)",
  espessura: "Espessura da camada de aterro (m)",
  gamaNat: "Peso específico natural do material (kN/m³) - usado acima do NA",
  gamaSat: "Peso específico saturado do material (kN/m³) - usado abaixo do NA",
};

export default function DialogCamadaAterro({ 
  open, 
  onOpenChange, 
  onConfirm, 
  camadaInicial,
  title = "Adicionar Camada de Aterro",
  description = "Insira os dados da nova camada de aterro"
}: DialogCamadaAterroProps) {
  
  const form = useForm<CamadaAterroFormData>({
    resolver: zodResolver(camadaAterroSchema),
    defaultValues: {
      nome: "",
      espessura: "",
      gamaNat: "",
      gamaSat: "",
    },
  });

  useEffect(() => {
    if (open && camadaInicial) {
      form.reset({
        nome: camadaInicial.nome || "",
        espessura: camadaInicial.espessura || "",
        gamaNat: camadaInicial.gamaNat || "",
        gamaSat: camadaInicial.gamaSat || "",
      });
    } else if (open && !camadaInicial) {
      form.reset({
        nome: "",
        espessura: "",
        gamaNat: "",
        gamaSat: "",
      });
    }
  }, [open, camadaInicial, form]);

  const onSubmit = (data: CamadaAterroFormData) => {
    onConfirm({
      nome: data.nome,
      espessura: data.espessura,
      gamaNat: data.gamaNat || "",
      gamaSat: data.gamaSat || "",
    });
    onOpenChange(false);
  };

  const errors = form.formState.errors;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
          <TooltipProvider>
            {/* Nome */}
            <div className="space-y-1.5">
              <Label htmlFor="nome" className={cn("flex items-center gap-1 text-sm", errors.nome && "text-destructive")}>
                Nome *
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="w-3.5 h-3.5 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>{tooltips.nome}</TooltipContent>
                </Tooltip>
              </Label>
              <Controller
                name="nome"
                control={form.control}
                render={({ field }) => (
                  <Input
                    id="nome"
                    placeholder="Ex: Aterro Compactado"
                    {...field}
                    className={cn(errors.nome && "border-destructive")}
                  />
                )}
              />
              {errors.nome && <p className="text-xs text-destructive">{errors.nome.message}</p>}
            </div>

            {/* Espessura */}
            <div className="space-y-1.5">
              <Label htmlFor="espessura" className={cn("flex items-center gap-1 text-sm", errors.espessura && "text-destructive")}>
                Espessura (m) *
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="w-3.5 h-3.5 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>{tooltips.espessura}</TooltipContent>
                </Tooltip>
              </Label>
              <Controller
                name="espessura"
                control={form.control}
                render={({ field }) => (
                  <Input
                    id="espessura"
                    type="number"
                    step="0.1"
                    placeholder="Ex: 2.0"
                    {...field}
                    className={cn(errors.espessura && "border-destructive")}
                  />
                )}
              />
              {errors.espessura && <p className="text-xs text-destructive">{errors.espessura.message}</p>}
            </div>

            {/* Gama Nat e Sat */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="gamaNat" className={cn("flex items-center gap-1 text-sm", errors.gamaNat && "text-destructive")}>
                  γ<sub>nat</sub> - Peso Específico Natural (kN/m³)
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="w-3.5 h-3.5 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>{tooltips.gamaNat}</TooltipContent>
                  </Tooltip>
                </Label>
                <Controller
                  name="gamaNat"
                  control={form.control}
                  render={({ field }) => (
                    <Input
                      id="gamaNat"
                      type="number"
                      step="0.1"
                      placeholder="Ex: 18.0"
                      {...field}
                      className={cn(errors.gamaNat && "border-destructive")}
                    />
                  )}
                />
                {errors.gamaNat && <p className="text-xs text-destructive">{errors.gamaNat.message}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="gamaSat" className={cn("flex items-center gap-1 text-sm", errors.gamaSat && "text-destructive")}>
                  γ<sub>sat</sub> - Peso Específico Saturado (kN/m³)
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="w-3.5 h-3.5 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>{tooltips.gamaSat}</TooltipContent>
                  </Tooltip>
                </Label>
                <Controller
                  name="gamaSat"
                  control={form.control}
                  render={({ field }) => (
                    <Input
                      id="gamaSat"
                      type="number"
                      step="0.1"
                      placeholder="Ex: 20.0"
                      {...field}
                      className={cn(errors.gamaSat && "border-destructive")}
                    />
                  )}
                />
                {errors.gamaSat && <p className="text-xs text-destructive">{errors.gamaSat.message}</p>}
              </div>
            </div>
          </TooltipProvider>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit">Confirmar</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

