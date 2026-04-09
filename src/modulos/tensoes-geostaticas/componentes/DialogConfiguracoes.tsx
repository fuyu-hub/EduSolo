/**
 * DialogConfiguracoes — Configurações globais da análise de tensões
 * modulos/tensoes-geostaticas/componentes/DialogConfiguracoes.tsx
 *
 * Permite ajustar: peso específico da água (γw), sobrecarga superficial (q₀)
 * e intervalo de discretização. DefinicaoTooltip em cada label.
 */
import { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Settings } from "lucide-react";
import { DefinicaoTooltip } from "@/components/ui/DefinicaoTooltip";
import { ConfiguracoesGerais } from "../types";

interface DialogConfiguracoesProps {
  config: ConfiguracoesGerais;
  onSalvar: (config: Partial<ConfiguracoesGerais>) => void;
}

interface ConfigFormData {
  pesoEspecificoAgua: string;
  sobrecargaSuperficial: string;
  intervaloDiscretizacao: string;
}

export default function DialogConfiguracoes({
  config,
  onSalvar
}: DialogConfiguracoesProps) {
  const [open, setOpen] = useState(false);

  const { control, handleSubmit, reset, formState: { errors } } = useForm<ConfigFormData>({
    defaultValues: {
      pesoEspecificoAgua: config.pesoEspecificoAgua.toString(),
      sobrecargaSuperficial: config.sobrecargaSuperficial?.toString() || "0",
      intervaloDiscretizacao: config.intervaloDiscretizacao?.toString() || "",
    }
  });

  useEffect(() => {
    if (open) {
      reset({
        pesoEspecificoAgua: config.pesoEspecificoAgua.toString(),
        sobrecargaSuperficial: config.sobrecargaSuperficial?.toString() || "0",
        intervaloDiscretizacao: config.intervaloDiscretizacao?.toString() || "",
      });
    }
  }, [open, config, reset]);

  const onSubmit = (data: ConfigFormData) => {
    onSalvar({
      pesoEspecificoAgua: parseFloat(data.pesoEspecificoAgua),
      sobrecargaSuperficial: parseFloat(data.sobrecargaSuperficial) || 0,
      intervaloDiscretizacao: parseFloat(data.intervaloDiscretizacao) || null,
    });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Settings className="w-4 h-4" />
          <span className="hidden sm:inline">Configurar Análise</span>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Configurações Globais</DialogTitle>
          <DialogDescription>
            Ajuste parâmetros que afetam todo o perfil de solo
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="pesoEspecificoAgua" className="flex items-center gap-1 text-sm">γ<sub>w</sub> (kN/m³) <DefinicaoTooltip id="pesoEspecificoAgua" side="right" iconClassName="w-3 h-3" /></Label>
              <Controller
                name="pesoEspecificoAgua"
                control={control}
                rules={{ required: "Obrigatório", min: { value: 0.1, message: "Deve ser > 0" } }}
                render={({ field }) => (
                  <Input id="pesoEspecificoAgua" type="number" step="0.1" placeholder="10.0" {...field} />
                )}
              />
              {errors.pesoEspecificoAgua && <p className="text-xs text-destructive">{errors.pesoEspecificoAgua.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="sobrecargaSuperficial" className="flex items-center gap-1 text-sm">q<sub>0</sub> (kPa) <DefinicaoTooltip id="sobrecargaSuperficial" side="right" iconClassName="w-3 h-3" /></Label>
              <Controller
                name="sobrecargaSuperficial"
                control={control}
                rules={{ min: { value: 0, message: "Não pode ser negativa" } }}
                render={({ field }) => (
                  <Input id="sobrecargaSuperficial" type="number" step="0.1" placeholder="0.0" {...field} />
                )}
              />
              {errors.sobrecargaSuperficial && <p className="text-xs text-destructive">{errors.sobrecargaSuperficial.message}</p>}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="intervaloDiscretizacao" className="flex items-center gap-1 text-sm">Intervalo de Discretização (m) <DefinicaoTooltip id="intervaloDiscretizacao" side="right" iconClassName="w-3 h-3" /></Label>
            <Controller
              name="intervaloDiscretizacao"
              control={control}
              rules={{ min: { value: 0, message: "Deve ser >= 0" } }}
              render={({ field }) => (
                <Input 
                  id="intervaloDiscretizacao" 
                  type="number" 
                  step="0.1" 
                  placeholder="Deixe vazio para gerar apenas nós críticos"
                  {...field} 
                />
              )}
            />
            <p className="text-xs text-muted-foreground">
              Deixe em branco (recomendado) para pontos apenas nas transições/NAs.
            </p>
            {errors.intervaloDiscretizacao && <p className="text-xs text-destructive">{errors.intervaloDiscretizacao.message}</p>}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button type="submit">Salvar</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
