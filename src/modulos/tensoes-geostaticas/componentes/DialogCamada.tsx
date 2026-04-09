/**
 * DialogCamada — Formulário modal para adição/edição de camadas de solo
 * modulos/tensoes-geostaticas/componentes/DialogCamada.tsx
 *
 * Campos: nome, espessura, Ko, NA, capilaridade, γnat, γsat, impermeável.
 * Validação via Zod + react-hook-form. DefinicaoTooltip em cada label.
 */
import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { DefinicaoTooltip } from "@/components/ui/DefinicaoTooltip";
import { CamadaSolo } from "../types";
import { HACHURAS_OPCOES, inferirHachura } from "./Hachuras";

const camadaFormSchema = z.object({
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
  hachura: z.string().optional(),
});

type CamadaFormData = z.infer<typeof camadaFormSchema>;

interface DialogCamadaProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (data: Partial<CamadaSolo>) => void;
  camadaInicial?: Partial<CamadaSolo>;
  title?: string;
  description?: string;
}

export default function DialogCamada({ 
  open, 
  onOpenChange, 
  onConfirm, 
  camadaInicial,
  title = "Adicionar Camada",
  description = "Insira os dados da nova camada de solo",
}: DialogCamadaProps) {
  const form = useForm<CamadaFormData>({
    resolver: zodResolver(camadaFormSchema),
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
      form.reset({
        nome: camadaInicial.nome || "",
        espessura: camadaInicial.espessura?.toString() || "",
        profundidadeNA: camadaInicial.profundidadeNA != null ? camadaInicial.profundidadeNA.toString() : "",
        capilaridade: camadaInicial.capilaridade != null ? camadaInicial.capilaridade.toString() : "",
        gamaNat: camadaInicial.gamaNat != null ? camadaInicial.gamaNat.toString() : "",
        gamaSat: camadaInicial.gamaSat != null ? camadaInicial.gamaSat.toString() : "",
        Ko: camadaInicial.Ko != null ? camadaInicial.Ko.toString() : "",
        impermeavel: camadaInicial.impermeavel || false,
        hachura: camadaInicial.hachura || inferirHachura(camadaInicial.nome || "", camadaInicial.impermeavel),
      });
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
        hachura: "nenhuma",
      });
    }
  }, [open, camadaInicial, form]);

  const nomeValue = form.watch("nome");
  const impermeavelValue = form.watch("impermeavel");

  useEffect(() => {
    // Auto-inferir hachura baseado no nome caso ele mude (apenas se não estiver no modo de edição estrita)
    if (open && !camadaInicial) {
      if (nomeValue || impermeavelValue) {
        form.setValue("hachura", inferirHachura(nomeValue, impermeavelValue));
      }
    }
  }, [nomeValue, impermeavelValue, open, camadaInicial, form]);

  const onSubmit = (data: CamadaFormData) => {
    onConfirm({
      nome: data.nome,
      espessura: parseFloat(data.espessura),
      profundidadeNA: data.profundidadeNA ? parseFloat(data.profundidadeNA) : null,
      capilaridade: data.capilaridade ? parseFloat(data.capilaridade) : null,
      gamaNat: data.gamaNat ? parseFloat(data.gamaNat) : null,
      gamaSat: data.gamaSat ? parseFloat(data.gamaSat) : null,
      Ko: data.Ko ? parseFloat(data.Ko) : null,
      impermeavel: data.impermeavel || false,
      hachura: data.hachura || "nenhuma",
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

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="espessura" className={cn("flex items-center gap-1 text-sm", errors.espessura && "text-destructive")}>
                Espessura (m) *
                <DefinicaoTooltip id="espessuraCamada" side="right" iconClassName="w-3 h-3" />
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

            <div className="space-y-1.5">
              <Label htmlFor="Ko" className={cn("flex items-center gap-1 text-sm", errors.Ko && "text-destructive")}>
                K<sub>o</sub>
                <DefinicaoTooltip id="Ko" side="right" iconClassName="w-3 h-3" />
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

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="profundidadeNA" className={cn("flex items-center gap-1 text-sm", errors.profundidadeNA && "text-destructive")}>
                NA (m)
                <DefinicaoTooltip id="profundidadeNA" side="right" iconClassName="w-3 h-3" />
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

            <div className="space-y-1.5">
              <Label htmlFor="capilaridade" className={cn("flex items-center gap-1 text-sm", errors.capilaridade && "text-destructive")}>
                Capilaridade (m)
                <DefinicaoTooltip id="capilaridade" side="right" iconClassName="w-3 h-3" />
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

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="gamaNat" className={cn("flex items-center gap-1 text-sm", errors.gamaNat && "text-destructive")}>
                γ<sub>nat</sub> (kN/m³)
                <DefinicaoTooltip id="gamaNat" side="right" iconClassName="w-3 h-3" />
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

            <div className="space-y-1.5">
              <Label htmlFor="gamaSat" className={cn("flex items-center gap-1 text-sm", errors.gamaSat && "text-destructive")}>
                γ<sub>sat</sub> (kN/m³)
                <DefinicaoTooltip id="gamaSat" side="right" iconClassName="w-3 h-3" />
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

          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="hachura" className={cn("flex items-center gap-1 text-sm", impermeavelValue && "opacity-50")}>
                Padrão de Hachura
              </Label>
              <Controller
                name="hachura"
                control={form.control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value || "nenhuma"} disabled={impermeavelValue}>
                    <SelectTrigger className="bg-background/50 text-xs h-9">
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      {HACHURAS_OPCOES.map((op) => (
                        <SelectItem key={op.value} value={op.value} className="text-xs">
                          {op.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="flex items-start justify-end space-x-2 pt-2">
              <Controller
                name="impermeavel"
                control={form.control}
                render={({ field }) => (
                  <Checkbox
                    id="impermeavel"
                    checked={field.value || false}
                    onCheckedChange={(checked) => {
                      field.onChange(checked);
                      if (checked) {
                        form.setValue("hachura", "impermeavel");
                      }
                    }}
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
                <p className="text-xs text-muted-foreground mr-1">
                  Impede a passagem de água
                </p>
              </div>
            </div>
          </div>

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
