// frontend/src/components/tensoes/DialogCamada.tsx
import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Checkbox } from "@/components/ui/checkbox";
import { Info } from "lucide-react";
import { cn } from "@/lib/utils";

const camadaSchema = z.object({
  nome: z.string().min(1, { message: "Nome obrigatório" }),
  espessura: z.string().min(1, { message: "Obrigatório" }).refine(val => !isNaN(parseFloat(val)) && parseFloat(val) > 0, { message: "Deve ser > 0" }),
  profundidadeNA: z.string().optional().refine(val => val === undefined || val === "" || (!isNaN(parseFloat(val)) && parseFloat(val) >= 0), {
    message: "Profundidade >= 0 ou vazio",
  }),
  capilaridade: z.string().optional().refine(val => val === undefined || val === "" || (!isNaN(parseFloat(val)) && parseFloat(val) >= 0), {
    message: "Altura >= 0 ou vazio",
  }),
  gamaNat: z.string().optional().refine(val => val === undefined || val === "" || (!isNaN(parseFloat(val)) && parseFloat(val) > 0), {
    message: "Deve ser > 0 ou vazio",
  }),
  gamaSat: z.string().optional().refine(val => val === undefined || val === "" || (!isNaN(parseFloat(val)) && parseFloat(val) > 0), {
    message: "Deve ser > 0 ou vazio",
  }),
  Ko: z.string().optional().refine(val => val === undefined || val === "" || (!isNaN(parseFloat(val)) && parseFloat(val) >= 0 && parseFloat(val) <= 1), {
    message: "Ko entre 0-1 ou vazio",
  }),
  impermeavel: z.boolean().optional(),
});

type CamadaFormData = z.infer<typeof camadaSchema>;

export interface CamadaData {
  nome: string;
  espessura: string;
  profundidadeNA: string;
  capilaridade: string;
  gamaNat: string;
  gamaSat: string;
  Ko: string;
  impermeavel?: boolean;
}

interface DialogCamadaProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (data: CamadaData) => void;
  camadaInicial?: CamadaData;
  title?: string;
  description?: string;
}

const tooltips = {
  nome: "Nome ou tipo da camada (ex: Argila Mole, Areia Compacta)",
  espessura: "Espessura da camada de solo (m)",
  profundidadeNA: "Profundidade do NA a partir da superfície (m). O NA será atribuído à camada correta automaticamente",
  capilaridade: "Altura da franja capilar acima do NA (m)",
  gamaNat: "Peso específico natural do solo (kN/m³) - usado acima do NA",
  gamaSat: "Peso específico saturado do solo (kN/m³) - usado abaixo do NA",
  Ko: "Coeficiente de empuxo em repouso (opcional, típico: 0.4-0.6). Deixe vazio se não desejar calcular tensões horizontais",
  impermeavel: "Marque se esta camada é impermeável (impede a passagem de água). Camadas impermeáveis podem separar diferentes níveis de água no perfil",
};

export default function DialogCamada({ 
  open, 
  onOpenChange, 
  onConfirm, 
  camadaInicial,
  title = "Adicionar Camada",
  description = "Insira os dados da nova camada de solo"
}: DialogCamadaProps) {
  const form = useForm<CamadaFormData>({
    resolver: zodResolver(camadaSchema),
    defaultValues: {
      nome: "",
      espessura: "",
      profundidadeNA: "",
      capilaridade: "",
      gamaNat: "",
      gamaSat: "",
      Ko: "",
      impermeavel: false,
    },
  });

  useEffect(() => {
    if (open && camadaInicial) {
      form.reset(camadaInicial);
    } else if (open && !camadaInicial) {
      form.reset({
        nome: "",
        espessura: "",
        profundidadeNA: "",
        capilaridade: "",
        gamaNat: "",
        gamaSat: "",
        Ko: "",
        impermeavel: false,
      });
    }
  }, [open, camadaInicial, form]);

  const onSubmit = (data: CamadaFormData) => {
    onConfirm({
      nome: data.nome,
      espessura: data.espessura,
      profundidadeNA: data.profundidadeNA || "",
      capilaridade: data.capilaridade || "",
      gamaNat: data.gamaNat || "",
      gamaSat: data.gamaSat || "",
      Ko: data.Ko || "",
      impermeavel: data.impermeavel || false,
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
            {/* Nome - linha completa */}
            <div className="space-y-1.5">
              <Label htmlFor="nome" className={cn("flex items-center gap-1 text-sm", errors.nome && "text-destructive")}>
                Nome da Camada *
              </Label>
              <Controller
                name="nome"
                control={form.control}
                render={({ field }) => (
                  <Input
                    id="nome"
                    type="text"
                    placeholder="Ex: Argila Mole, Areia Densa"
                    {...field}
                    className={cn("bg-background/50", errors.nome && "border-destructive")}
                  />
                )}
              />
              {errors.nome && <p className="text-xs text-destructive">{errors.nome.message}</p>}
            </div>

            {/* Grid 2 colunas - Espessura e Ko */}
            <div className="grid grid-cols-2 gap-3">
              {/* Espessura */}
              <div className="space-y-1.5">
                <Label htmlFor="espessura" className={cn("flex items-center gap-1 text-sm", errors.espessura && "text-destructive")}>
                  Espessura (m) *
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
                      className={cn("bg-background/50", errors.espessura && "border-destructive")}
                    />
                  )}
                />
                {errors.espessura && <p className="text-xs text-destructive">{errors.espessura.message}</p>}
              </div>

              {/* Ko */}
              <div className="space-y-1.5">
                <Label htmlFor="Ko" className={cn("flex items-center gap-1 text-sm", errors.Ko && "text-destructive")}>
                  K<sub>o</sub>
                </Label>
                <Controller
                  name="Ko"
                  control={form.control}
                  render={({ field }) => (
                    <Input
                      id="Ko"
                      type="number"
                      step="0.01"
                      placeholder="Opcional"
                      {...field}
                      value={field.value ?? ""}
                      className={cn("bg-background/50", errors.Ko && "border-destructive")}
                    />
                  )}
                />
                {errors.Ko && <p className="text-xs text-destructive">{errors.Ko.message}</p>}
              </div>
            </div>

            {/* Grid 2 colunas - Prof. NA e Capilaridade */}
            <div className="grid grid-cols-2 gap-3">
              {/* Profundidade do NA */}
              <div className="space-y-1.5">
                <Label htmlFor="profundidadeNA" className={cn("flex items-center gap-1 text-sm", errors.profundidadeNA && "text-destructive")}>
                  Prof. NA (m)
                </Label>
                <Controller
                  name="profundidadeNA"
                  control={form.control}
                  render={({ field }) => (
                    <Input
                      id="profundidadeNA"
                      type="number"
                      step="0.1"
                      placeholder="Opcional"
                      {...field}
                      value={field.value ?? ""}
                      className={cn("bg-background/50", errors.profundidadeNA && "border-destructive")}
                    />
                  )}
                />
                {errors.profundidadeNA && <p className="text-xs text-destructive">{errors.profundidadeNA.message}</p>}
              </div>

              {/* Capilaridade */}
              <div className="space-y-1.5">
                <Label htmlFor="capilaridade" className={cn("flex items-center gap-1 text-sm", errors.capilaridade && "text-destructive")}>
                  Capilaridade (m)
                </Label>
                <Controller
                  name="capilaridade"
                  control={form.control}
                  render={({ field }) => (
                    <Input
                      id="capilaridade"
                      type="number"
                      step="0.1"
                      placeholder="Opcional"
                      {...field}
                      value={field.value ?? ""}
                      className={cn("bg-background/50", errors.capilaridade && "border-destructive")}
                    />
                  )}
                />
                {errors.capilaridade && <p className="text-xs text-destructive">{errors.capilaridade.message}</p>}
              </div>
            </div>

            {/* Grid 2 colunas - γ natural e γ saturado */}
            <div className="grid grid-cols-2 gap-3">
              {/* γ natural */}
              <div className="space-y-1.5">
                <Label htmlFor="gamaNat" className={cn("flex items-center gap-1 text-sm", errors.gamaNat && "text-destructive")}>
                  γ<sub>nat</sub> (kN/m³)
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
                      value={field.value ?? ""}
                      className={cn("bg-background/50", errors.gamaNat && "border-destructive")}
                    />
                  )}
                />
                {errors.gamaNat && <p className="text-xs text-destructive">{errors.gamaNat.message}</p>}
              </div>

              {/* γ saturado */}
              <div className="space-y-1.5">
                <Label htmlFor="gamaSat" className={cn("flex items-center gap-1 text-sm", errors.gamaSat && "text-destructive")}>
                  γ<sub>sat</sub> (kN/m³)
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
                      value={field.value ?? ""}
                      className={cn("bg-background/50", errors.gamaSat && "border-destructive")}
                    />
                  )}
                />
                {errors.gamaSat && <p className="text-xs text-destructive">{errors.gamaSat.message}</p>}
              </div>
            </div>

            {/* Checkbox Camada Impermeável */}
            <div className="flex items-start space-x-2 pt-2">
              <Controller
                name="impermeavel"
                control={form.control}
                render={({ field }) => (
                  <Checkbox
                    id="impermeavel"
                    checked={field.value || false}
                    onCheckedChange={field.onChange}
                  />
                )}
              />
              <div className="grid gap-1.5 leading-none">
                <Label
                  htmlFor="impermeavel"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-1"
                >
                  Camada impermeável
                </Label>
                <p className="text-xs text-muted-foreground">
                  Impede a passagem de água (ex: argila densa, rocha)
                </p>
              </div>
            </div>
          </TooltipProvider>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit">
              {camadaInicial ? "Atualizar" : "Adicionar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

