// frontend/src/modulos/granulometria/componentes/DialogExemplos.tsx
import { BaseDialogExemplos } from "@/componentes/compartilhados/exemplos/BaseDialogoExemplos";
import { exemplosGranulometria, ExemploGranulometria } from "../exemplos";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

const FRACOES_FORM = [
  { key: "pedregulho", label: "Pedregulho (%)" },
  { key: "areia_grossa", label: "Areia Grossa (%)" },
  { key: "areia_media", label: "Areia Média (%)" },
  { key: "areia_fina", label: "Areia Fina (%)" },
  { key: "silte", label: "Silte (%)" },
  { key: "argila", label: "Argila (%)" },
] as const;

interface FormData {
  pedregulho: string;
  areia_grossa: string;
  areia_media: string;
  areia_fina: string;
  silte: string;
  argila: string;
  pass_p10: string;
  pass_p40: string;
  pass_p200: string;
  d10: string;
  d30: string;
  d60: string;
  ll: string;
  lp: string;
}

interface DialogExemplosProps {
  onSelectExample: (example: ExemploGranulometria) => void;
  currentFormData: FormData;
  disabled?: boolean;
}

export default function DialogExemplos({ onSelectExample, currentFormData, disabled }: DialogExemplosProps) {
  
  const getFormStateFromStore = (): ExemploGranulometria => ({
    nome: "",
    descricao: "",
    iconName: "layers",
    colorName: "blue",
    fracoes: {
      pedregulho: currentFormData.pedregulho || "",
      areia_grossa: currentFormData.areia_grossa || "",
      areia_media: currentFormData.areia_media || "",
      areia_fina: currentFormData.areia_fina || "",
      silte: currentFormData.silte || "",
      argila: currentFormData.argila || "",
    },
    parametros: {
      pass_p10: currentFormData.pass_p10 || "",
      pass_p40: currentFormData.pass_p40 || "",
      pass_p200: currentFormData.pass_p200 || "",
      d10: currentFormData.d10 || "",
      d30: currentFormData.d30 || "",
      d60: currentFormData.d60 || "",
      ll: currentFormData.ll || "",
      lp: currentFormData.lp || "",
    }
  } as ExemploGranulometria);

  const renderExampleTags = (ex: ExemploGranulometria) => {
    const soma = Object.values(ex.fracoes).reduce((s, v) => {
      const n = parseFloat(v);
      return s + (isNaN(n) ? 0 : n);
    }, 0);
    return (
      <>
        <span className="text-[10px] font-medium text-muted-foreground/70 bg-muted/50 px-2 py-0.5 rounded-full">
          Σ: {soma.toFixed(0)}%
        </span>
        {ex.parametros.ll && (
          <span className="text-[10px] font-medium text-muted-foreground/70 bg-muted/50 px-2 py-0.5 rounded-full">
            LL: {ex.parametros.ll}
          </span>
        )}
        {ex.parametros.lp && (
          <span className="text-[10px] font-medium text-muted-foreground/70 bg-muted/50 px-2 py-0.5 rounded-full">
            LP: {ex.parametros.lp}
          </span>
        )}
      </>
    );
  };

  const renderExtraFields = (
    formState: ExemploGranulometria, 
    updateField: <K extends keyof ExemploGranulometria>(field: K, value: ExemploGranulometria[K]) => void
  ) => {
    const updateFracao = (key: string, value: string) => {
      updateField("fracoes", { ...formState.fracoes, [key]: value });
    };
    const updateParam = (key: string, value: string) => {
      updateField("parametros", { ...formState.parametros, [key]: value });
    };

    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">Frações Granulométricas</h4>
          <div className="grid grid-cols-3 gap-3">
            {FRACOES_FORM.map((f) => (
              <div key={f.key} className="space-y-1">
                <Label className="text-[11px]">{f.label}</Label>
                <Input
                  placeholder="0.0"
                  value={formState.fracoes[f.key as keyof typeof formState.fracoes]}
                  onChange={e => updateFracao(f.key, e.target.value)}
                  className="h-8 text-sm"
                />
              </div>
            ))}
          </div>
        </div>
        <Separator />
        <div className="space-y-2">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">Percentuais Passantes (%)</h4>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label className="text-[11px]">Passante #10</Label>
              <Input placeholder="—" value={formState.parametros.pass_p10} onChange={e => updateParam("pass_p10", e.target.value)} className="h-8 text-sm" />
            </div>
            <div className="space-y-1">
              <Label className="text-[11px]">Passante #40</Label>
              <Input placeholder="—" value={formState.parametros.pass_p40} onChange={e => updateParam("pass_p40", e.target.value)} className="h-8 text-sm" />
            </div>
            <div className="space-y-1">
              <Label className="text-[11px]">Passante #200</Label>
              <Input placeholder="—" value={formState.parametros.pass_p200} onChange={e => updateParam("pass_p200", e.target.value)} className="h-8 text-sm" />
            </div>
          </div>
        </div>
        <Separator />
        <div className="space-y-2">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">Diâmetros Característicos (mm)</h4>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label className="text-[11px]">D10</Label>
              <Input placeholder="—" value={formState.parametros.d10} onChange={e => updateParam("d10", e.target.value)} className="h-8 text-sm" />
            </div>
            <div className="space-y-1">
              <Label className="text-[11px]">D30</Label>
              <Input placeholder="—" value={formState.parametros.d30} onChange={e => updateParam("d30", e.target.value)} className="h-8 text-sm" />
            </div>
            <div className="space-y-1">
              <Label className="text-[11px]">D60</Label>
              <Input placeholder="—" value={formState.parametros.d60} onChange={e => updateParam("d60", e.target.value)} className="h-8 text-sm" />
            </div>
          </div>
        </div>
        <Separator />
        <div className="space-y-2">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">Limites de Consistência (%)</h4>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-[11px]">LL</Label>
              <Input placeholder="—" value={formState.parametros.ll} onChange={e => updateParam("ll", e.target.value)} className="h-8 text-sm" />
            </div>
            <div className="space-y-1">
              <Label className="text-[11px]">LP</Label>
              <Input placeholder="—" value={formState.parametros.lp} onChange={e => updateParam("lp", e.target.value)} className="h-8 text-sm" />
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <BaseDialogExemplos
      title="Exemplos de Granulometria"
      description="Selecione um tipo de solo para carregar dados de classificação granulométrica."
      builtInExamples={exemplosGranulometria}
      storageKey="edusolo_custom_examples_granulometria"
      onSelectExample={onSelectExample}
      disabled={disabled}
      renderExtraFields={renderExtraFields}
      getFormStateFromStore={getFormStateFromStore}
      renderExampleTags={renderExampleTags}
    />
  );
}
