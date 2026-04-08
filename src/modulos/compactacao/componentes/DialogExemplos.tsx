// frontend/src/modulos/compactacao/componentes/DialogExemplos.tsx
import { BaseDialogExemplos } from "@/componentes/compartilhados/exemplos/BaseDialogoExemplos";
import { exemplosCompactacao, ExemploCompactacao, PontoCompactacao } from "../exemplos";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Plus, X } from "lucide-react";

interface DialogExemplosProps {
  onSelectExample: (example: ExemploCompactacao) => void;
  disabled?: boolean;
  currentFormData?: {
    volumeCilindro?: string;
    pesoCilindro?: string;
    Gs?: string;
    pontos?: { pesoAmostaCilindro?: string; pesoBrutoUmido?: string; pesoBrutoSeco?: string; tara?: string }[];
  };
}

export default function DialogExemplos({ onSelectExample, disabled, currentFormData }: DialogExemplosProps) {
  
  const getFormStateFromStore = (): ExemploCompactacao => {
    const pontos = (currentFormData?.pontos || []).map(p => ({
      pesoAmostaCilindro: p.pesoAmostaCilindro || "",
      pesoBrutoUmido: p.pesoBrutoUmido || "",
      pesoBrutoSeco: p.pesoBrutoSeco || "",
      tara: p.tara || "",
    }));

    return {
      nome: "",
      descricao: "",
      icon: "🧱",
      volumeCilindro: currentFormData?.volumeCilindro || "",
      pesoCilindro: currentFormData?.pesoCilindro || "",
      Gs: currentFormData?.Gs || "",
      pontos: pontos.length > 0 ? pontos : [
        { pesoAmostaCilindro: "", pesoBrutoUmido: "", pesoBrutoSeco: "", tara: "" },
        { pesoAmostaCilindro: "", pesoBrutoUmido: "", pesoBrutoSeco: "", tara: "" },
        { pesoAmostaCilindro: "", pesoBrutoUmido: "", pesoBrutoSeco: "", tara: "" },
      ],
    } as ExemploCompactacao;
  };

  const renderExampleTags = (ex: ExemploCompactacao) => (
    <>
      <span className="text-[10px] font-medium text-muted-foreground/70 bg-muted/50 px-2 py-0.5 rounded-full">
        Vol: {ex.volumeCilindro} cm³
      </span>
      <span className="text-[10px] font-medium text-muted-foreground/70 bg-muted/50 px-2 py-0.5 rounded-full">
        {ex.pontos.length} pontos
      </span>
      {ex.Gs && (
        <span className="text-[10px] font-medium text-muted-foreground/70 bg-muted/50 px-2 py-0.5 rounded-full">
          Gs: {ex.Gs}
        </span>
      )}
    </>
  );

  const renderExtraFields = (
    formState: ExemploCompactacao, 
    updateField: <K extends keyof ExemploCompactacao>(field: K, value: ExemploCompactacao[K]) => void
  ) => {
    const updatePonto = (index: number, field: keyof PontoCompactacao, value: string) => {
      const newPontos = [...formState.pontos];
      newPontos[index] = { ...newPontos[index], [field]: value };
      updateField("pontos", newPontos);
    }

    return (
      <div className="space-y-4">
        {/* Parâmetros Gerais */}
        <div className="space-y-2">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">Parâmetros Gerais</h4>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label className="text-[11px]">Volume (cm³)</Label>
              <Input 
                placeholder="981" 
                value={formState.volumeCilindro} 
                onChange={e => updateField("volumeCilindro", e.target.value)} 
                className="h-8 text-sm" 
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[11px]">Massa Cilindro (g)</Label>
              <Input 
                placeholder="2850" 
                value={formState.pesoCilindro} 
                onChange={e => updateField("pesoCilindro", e.target.value)} 
                className="h-8 text-sm" 
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[11px]">Gs</Label>
              <Input 
                placeholder="2.65" 
                value={formState.Gs} 
                onChange={e => updateField("Gs", e.target.value)} 
                className="h-8 text-sm" 
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Pontos de Compactação */}
        <div className="space-y-2">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">Pontos de Compactação</h4>
          <div className="space-y-1.5">
            <div className="grid grid-cols-[1fr_1fr_1fr_1fr_24px] gap-2 px-1">
              <span className="text-[10px] text-muted-foreground/60 font-medium">Massa+Cil (g)</span>
              <span className="text-[10px] text-muted-foreground/60 font-medium">MBU (g)</span>
              <span className="text-[10px] text-muted-foreground/60 font-medium">MBS (g)</span>
              <span className="text-[10px] text-muted-foreground/60 font-medium">Tara (g)</span>
              <span></span>
            </div>
            {formState.pontos.map((point, i) => (
              <div key={i} className="grid grid-cols-[1fr_1fr_1fr_1fr_24px] gap-2 items-center">
                <Input 
                  className="h-7 text-xs" 
                  placeholder="g" 
                  value={point.pesoAmostaCilindro} 
                  onChange={e => updatePonto(i, "pesoAmostaCilindro", e.target.value)} 
                />
                <Input 
                  className="h-7 text-xs" 
                  placeholder="g" 
                  value={point.pesoBrutoUmido} 
                  onChange={e => updatePonto(i, "pesoBrutoUmido", e.target.value)} 
                />
                <Input 
                  className="h-7 text-xs" 
                  placeholder="g" 
                  value={point.pesoBrutoSeco} 
                  onChange={e => updatePonto(i, "pesoBrutoSeco", e.target.value)} 
                />
                <Input 
                  className="h-7 text-xs" 
                  placeholder="g" 
                  value={point.tara} 
                  onChange={e => updatePonto(i, "tara", e.target.value)} 
                />
                {formState.pontos.length > 1 && (
                  <button 
                    className="text-muted-foreground/40 hover:text-destructive transition-colors" 
                    onClick={() => updateField("pontos", formState.pontos.filter((_, idx) => idx !== i))}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-xs text-muted-foreground gap-1 h-7 mt-1" 
              onClick={() => updateField("pontos", [...formState.pontos, { pesoAmostaCilindro: "", pesoBrutoUmido: "", pesoBrutoSeco: "", tara: "" }])}
            >
              <Plus className="w-3 h-3" /> Adicionar ponto
            </Button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <BaseDialogExemplos
      title="Exemplos de Compactação"
      description="Selecione um exemplo de ensaio Proctor para preencher automaticamente o formulário."
      builtInExamples={exemplosCompactacao}
      storageKey="edusolo_custom_compactacao_examples"
      onSelectExample={(ex) => onSelectExample({ ...ex, icon: "🧱" })}
      disabled={disabled}
      renderExtraFields={renderExtraFields}
      getFormStateFromStore={getFormStateFromStore}
      renderExampleTags={renderExampleTags}
    />
  );
}
