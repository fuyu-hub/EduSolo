// frontend/src/modules/recalque/components/DialogCamadaRecalque.tsx
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

const camadaRecalqueSchema = z.object({
  espessura: z.string().min(1, { message: "Obrigatório" }).refine(val => !isNaN(parseFloat(val)) && parseFloat(val) > 0, { message: "Deve ser > 0" }),
  gamaNat: z.string().optional().refine(val => val === undefined || val === "" || (!isNaN(parseFloat(val)) && parseFloat(val) > 0), {
    message: "Deve ser > 0 ou vazio",
  }),
  gamaSat: z.string().optional().refine(val => val === undefined || val === "" || (!isNaN(parseFloat(val)) && parseFloat(val) > 0), {
    message: "Deve ser > 0 ou vazio",
  }),
  profundidadeNA: z.string().optional().refine(val => val === undefined || val === "" || (!isNaN(parseFloat(val)) && parseFloat(val) >= 0), {
    message: "Profundidade >= 0 ou vazio",
  }),
  Cc: z.string().optional().refine(val => val === undefined || val === "" || (!isNaN(parseFloat(val)) && parseFloat(val) > 0), {
    message: "Deve ser > 0 ou vazio",
  }),
  Cr: z.string().optional().refine(val => val === undefined || val === "" || (!isNaN(parseFloat(val)) && parseFloat(val) > 0), {
    message: "Deve ser > 0 ou vazio",
  }),
  Cv: z.string().optional().refine(val => val === undefined || val === "" || (!isNaN(parseFloat(val)) && parseFloat(val) > 0), {
    message: "Deve ser > 0 ou vazio",
  }),
  e0: z.string().optional().refine(val => val === undefined || val === "" || (!isNaN(parseFloat(val)) && parseFloat(val) > 0), {
    message: "Deve ser > 0 ou vazio",
  }),
});

type CamadaRecalqueFormData = z.infer<typeof camadaRecalqueSchema>;

export interface CamadaRecalqueData {
  espessura: string;
  gamaNat?: string;
  gamaSat?: string;
  profundidadeNA?: string;
  Cc?: string;
  Cr?: string;
  Cv?: string;
  e0?: string;
}

const tooltips = {
  espessura: "Espessura da camada de argila (m)",
  gamaNat: "Peso específico natural do solo (kN/m³) - usado acima do NA",
  gamaSat: "Peso específico saturado do solo (kN/m³) - usado abaixo do NA",
  profundidadeNA: "Profundidade do nível de água a partir da superfície (m)",
  Cc: "Índice de Compressão (adimensional, típico: 0.1-1.5)",
  Cr: "Índice de Recompressão (adimensional, típico: 0.01-0.2)",
  Cv: "Coeficiente de Adensamento (m²/ano, necessário para cálculo de tempo)",
  e0: "Índice de Vazios Inicial (adimensional)",
};

interface DialogCamadaRecalqueProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (data: CamadaRecalqueData) => void;
  camadaInicial?: CamadaRecalqueData;
  title?: string;
  description?: string;
}

export default function DialogCamadaRecalque({ 
  open, 
  onOpenChange, 
  onConfirm, 
  camadaInicial,
  title = "Adicionar Camada de Argila",
  description = "Insira os dados da camada de argila compressível"
}: DialogCamadaRecalqueProps) {
  const form = useForm<CamadaRecalqueFormData>({
    resolver: zodResolver(camadaRecalqueSchema),
    defaultValues: {
      espessura: "",
      gamaNat: "",
      gamaSat: "",
      profundidadeNA: "",
      Cc: "",
      Cr: "",
      Cv: "",
      e0: "",
    },
  });

  useEffect(() => {
    if (open && camadaInicial) {
      form.reset(camadaInicial);
    } else if (open && !camadaInicial) {
      form.reset({
        espessura: "",
        gamaNat: "",
        gamaSat: "",
        profundidadeNA: "",
        Cc: "",
        Cr: "",
        Cv: "",
        e0: "",
      });
    }
  }, [open, camadaInicial, form]);

  const onSubmit = (data: CamadaRecalqueFormData) => {
    onConfirm({
      espessura: data.espessura,
      gamaNat: data.gamaNat || undefined,
      gamaSat: data.gamaSat || undefined,
      profundidadeNA: data.profundidadeNA || undefined,
      Cc: data.Cc || undefined,
      Cr: data.Cr || undefined,
      Cv: data.Cv || undefined,
      e0: data.e0 || undefined,
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
                    placeholder="Ex: 5.0"
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

            {/* Profundidade NA */}
            <div className="space-y-1.5">
              <Label htmlFor="profundidadeNA" className={cn("flex items-center gap-1 text-sm", errors.profundidadeNA && "text-destructive")}>
                Profundidade do Nível de Água (m)
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="w-3.5 h-3.5 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>{tooltips.profundidadeNA}</TooltipContent>
                </Tooltip>
              </Label>
              <Controller
                name="profundidadeNA"
                control={form.control}
                render={({ field }) => (
                  <Input
                    id="profundidadeNA"
                    type="number"
                    step="0.1"
                    placeholder="Ex: 2.0"
                    {...field}
                    className={cn(errors.profundidadeNA && "border-destructive")}
                  />
                )}
              />
              {errors.profundidadeNA && <p className="text-xs text-destructive">{errors.profundidadeNA.message}</p>}
            </div>

            {/* Cc e Cr - linha dupla */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="Cc" className={cn("flex items-center gap-1 text-sm", errors.Cc && "text-destructive")}>
                  C<sub>c</sub> - Índice de Compressão
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="w-3.5 h-3.5 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>{tooltips.Cc}</TooltipContent>
                  </Tooltip>
                </Label>
                <Controller
                  name="Cc"
                  control={form.control}
                  render={({ field }) => (
                    <Input
                      id="Cc"
                      type="number"
                      step="0.01"
                      placeholder="Ex: 1.8"
                      {...field}
                      className={cn(errors.Cc && "border-destructive")}
                    />
                  )}
                />
                {errors.Cc && <p className="text-xs text-destructive">{errors.Cc.message}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="Cr" className={cn("flex items-center gap-1 text-sm", errors.Cr && "text-destructive")}>
                  C<sub>r</sub> - Índice de Recompressão
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="w-3.5 h-3.5 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>{tooltips.Cr}</TooltipContent>
                  </Tooltip>
                </Label>
                <Controller
                  name="Cr"
                  control={form.control}
                  render={({ field }) => (
                    <Input
                      id="Cr"
                      type="number"
                      step="0.01"
                      placeholder="Ex: 0.15"
                      {...field}
                      className={cn(errors.Cr && "border-destructive")}
                    />
                  )}
                />
                {errors.Cr && <p className="text-xs text-destructive">{errors.Cr.message}</p>}
              </div>
            </div>

            {/* Cv e e0 - linha dupla */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="Cv" className={cn("flex items-center gap-1 text-sm", errors.Cv && "text-destructive")}>
                  C<sub>v</sub> - Coef. de Adensamento (m²/ano)
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="w-3.5 h-3.5 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>{tooltips.Cv}</TooltipContent>
                  </Tooltip>
                </Label>
                <Controller
                  name="Cv"
                  control={form.control}
                  render={({ field }) => (
                    <Input
                      id="Cv"
                      type="number"
                      step="0.01"
                      placeholder="Ex: 2.5"
                      {...field}
                      className={cn(errors.Cv && "border-destructive")}
                    />
                  )}
                />
                {errors.Cv && <p className="text-xs text-destructive">{errors.Cv.message}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="e0" className={cn("flex items-center gap-1 text-sm", errors.e0 && "text-destructive")}>
                  e<sub>0</sub> - Índice de Vazios Inicial
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="w-3.5 h-3.5 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>{tooltips.e0}</TooltipContent>
                  </Tooltip>
                </Label>
                <Controller
                  name="e0"
                  control={form.control}
                  render={({ field }) => (
                    <Input
                      id="e0"
                      type="number"
                      step="0.01"
                      placeholder="Ex: 2.8"
                      {...field}
                      className={cn(errors.e0 && "border-destructive")}
                    />
                  )}
                />
                {errors.e0 && <p className="text-xs text-destructive">{errors.e0.message}</p>}
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

