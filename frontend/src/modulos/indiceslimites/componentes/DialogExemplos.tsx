// frontend/src/modulos/indiceslimites/componentes/DialogExemplos.tsx
import { BaseDialogExemplos } from "@/componentes/compartilhados/exemplos/BaseDialogoExemplos";
import { exemplosCaracterizacao, ExemploCaracterizacao } from "../exemplos";
import { useIndicesLimitesStore } from "../store";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Plus, X } from "lucide-react";

interface DialogExemplosProps {
  onSelectExample: (example: ExemploCaracterizacao) => void;
  disabled?: boolean;
}

export default function DialogExemplos({ onSelectExample, disabled }: DialogExemplosProps) {
  const store = useIndicesLimitesStore();

  const getFormStateFromStore = (): ExemploCaracterizacao => {
    const amostra = store.amostras[store.currentAmostraIndex || 0];
    const llPoints = store.limites.pontosLL.map(p => ({ 
      numGolpes: p.numGolpes || "", 
      massaUmidaRecipiente: p.massaUmidaRecipiente || "", 
      massaSecaRecipiente: p.massaSecaRecipiente || "", 
      massaRecipiente: p.massaRecipiente || "" 
    }));
    while (llPoints.length < 5) llPoints.push({ numGolpes: "", massaUmidaRecipiente: "", massaSecaRecipiente: "", massaRecipiente: "" });

    const lpPoints = store.limites.pontosLP.map(p => ({ 
      massaUmidaRecipiente: p.massaUmidaRecipiente || "", 
      massaSecaRecipiente: p.massaSecaRecipiente || "", 
      massaRecipiente: p.massaRecipiente || "" 
    }));
    while (lpPoints.length < 3) lpPoints.push({ massaUmidaRecipiente: "", massaSecaRecipiente: "", massaRecipiente: "" });

    return {
      nome: "",
      descricao: "",
      numAmostras: 1,
      indices: { 
        massaUmida: amostra?.indices?.massaUmida || "", 
        massaSeca: amostra?.indices?.massaSeca || "", 
        volume: amostra?.indices?.volume || "" 
      },
      settings: { 
        Gs: store.settings.Gs || "", 
        pesoEspecificoAgua: store.settings.pesoEspecificoAgua || "10.0" 
      },
      limites: {
        pontosLL: llPoints,
        pontosLP: lpPoints,
        umidadeNatural: "",
        percentualArgila: "",
      },
      iconName: "layers",
      colorName: "blue"
    } as ExemploCaracterizacao;
  };

  const renderExampleTags = (ex: ExemploCaracterizacao) => (
    <>
      <span className="text-[10px] font-medium text-muted-foreground/70 bg-muted/50 px-2 py-0.5 rounded-full">Gs: {ex.settings.Gs || "—"}</span>
      <span className="text-[10px] font-medium text-muted-foreground/70 bg-muted/50 px-2 py-0.5 rounded-full">LL: {ex.limites.pontosLL.length} pts</span>
    </>
  );

  const renderExtraFields = (
    formState: ExemploCaracterizacao, 
    updateField: <K extends keyof ExemploCaracterizacao>(f: K, v: ExemploCaracterizacao[K]) => void
  ) => {
    const updateLLPoint = (index: number, field: string, value: string) => {
      const newLL = [...formState.limites.pontosLL];
      newLL[index] = { ...newLL[index], [field as keyof typeof newLL[0]]: value };
      updateField("limites", { ...formState.limites, pontosLL: newLL });
    };
    const updateLPPoint = (index: number, field: string, value: string) => {
      const newLP = [...formState.limites.pontosLP];
      newLP[index] = { ...newLP[index], [field as keyof typeof newLP[0]]: value };
      updateField("limites", { ...formState.limites, pontosLP: newLP });
    };

    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">Dados Físicos</h4>
          <div className="grid grid-cols-5 gap-3">
            <div className="space-y-1"><Label className="text-[11px]">Gs</Label><Input placeholder="2.65" value={formState.settings.Gs} onChange={e => updateField("settings", { ...formState.settings, Gs: e.target.value })} className="h-8 text-sm" /></div>
            <div className="space-y-1"><Label className="text-[11px]">γw (kN/m³)</Label><Input placeholder="10.0" value={formState.settings.pesoEspecificoAgua} onChange={e => updateField("settings", { ...formState.settings, pesoEspecificoAgua: e.target.value })} className="h-8 text-sm" /></div>
            <div className="space-y-1"><Label className="text-[11px]">MBU (g)</Label><Input placeholder="0.00" value={formState.indices.massaUmida} onChange={e => updateField("indices", { ...formState.indices, massaUmida: e.target.value })} className="h-8 text-sm" /></div>
            <div className="space-y-1"><Label className="text-[11px]">MBS (g)</Label><Input placeholder="0.00" value={formState.indices.massaSeca} onChange={e => updateField("indices", { ...formState.indices, massaSeca: e.target.value })} className="h-8 text-sm" /></div>
            <div className="space-y-1"><Label className="text-[11px]">Volume (cm³)</Label><Input placeholder="100" value={formState.indices.volume} onChange={e => updateField("indices", { ...formState.indices, volume: e.target.value })} className="h-8 text-sm" /></div>
          </div>
        </div>
        <Separator />
        <div className="space-y-2">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">Limite de Liquidez (LL)</h4>
          <div className="space-y-1.5">
            <div className="grid grid-cols-[1fr_1fr_1fr_1fr_24px] gap-2 px-1">
              <span className="text-[10px] text-muted-foreground/60 font-medium">Nº Golpes</span>
              <span className="text-[10px] text-muted-foreground/60 font-medium">MBU (g)</span>
              <span className="text-[10px] text-muted-foreground/60 font-medium">MBS (g)</span>
              <span className="text-[10px] text-muted-foreground/60 font-medium">Tara (g)</span>
              <span></span>
            </div>
            {formState.limites.pontosLL.map((point, i) => (
              <div key={i} className="grid grid-cols-[1fr_1fr_1fr_1fr_24px] gap-2 items-center">
                <Input className="h-7 text-xs" placeholder="25" value={point.numGolpes} onChange={e => updateLLPoint(i, "numGolpes", e.target.value)} />
                <Input className="h-7 text-xs" placeholder="0.00" value={point.massaUmidaRecipiente} onChange={e => updateLLPoint(i, "massaUmidaRecipiente", e.target.value)} />
                <Input className="h-7 text-xs" placeholder="0.00" value={point.massaSecaRecipiente} onChange={e => updateLLPoint(i, "massaSecaRecipiente", e.target.value)} />
                <Input className="h-7 text-xs" placeholder="0.00" value={point.massaRecipiente} onChange={e => updateLLPoint(i, "massaRecipiente", e.target.value)} />
                {formState.limites.pontosLL.length > 1 && (<button className="text-muted-foreground/40 hover:text-destructive transition-colors" onClick={() => updateField("limites", { ...formState.limites, pontosLL: formState.limites.pontosLL.filter((_, idx) => idx !== i) })}><X className="w-3.5 h-3.5" /></button>)}
              </div>
            ))}
            <Button variant="ghost" size="sm" className="text-xs text-muted-foreground gap-1 h-7 mt-1" onClick={() => updateField("limites", { ...formState.limites, pontosLL: [...formState.limites.pontosLL, { numGolpes: "", massaUmidaRecipiente: "", massaSecaRecipiente: "", massaRecipiente: "" }] })}><Plus className="w-3 h-3" /> Adicionar ponto</Button>
          </div>
        </div>
        <Separator />
        <div className="space-y-2">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">Limite de Plasticidade (LP)</h4>
          <div className="space-y-1.5">
            <div className="grid grid-cols-[1fr_1fr_1fr_24px] gap-2 px-1">
              <span className="text-[10px] text-muted-foreground/60 font-medium">MBU (g)</span>
              <span className="text-[10px] text-muted-foreground/60 font-medium">MBS (g)</span>
              <span className="text-[10px] text-muted-foreground/60 font-medium">Tara (g)</span>
              <span></span>
            </div>
            {formState.limites.pontosLP.map((point, i) => (
              <div key={i} className="grid grid-cols-[1fr_1fr_1fr_24px] gap-2 items-center">
                <Input className="h-7 text-xs" placeholder="0.00" value={point.massaUmidaRecipiente} onChange={e => updateLPPoint(i, "massaUmidaRecipiente", e.target.value)} />
                <Input className="h-7 text-xs" placeholder="0.00" value={point.massaSecaRecipiente} onChange={e => updateLPPoint(i, "massaSecaRecipiente", e.target.value)} />
                <Input className="h-7 text-xs" placeholder="0.00" value={point.massaRecipiente} onChange={e => updateLPPoint(i, "massaRecipiente", e.target.value)} />
                {formState.limites.pontosLP.length > 1 && (<button className="text-muted-foreground/40 hover:text-destructive transition-colors" onClick={() => updateField("limites", { ...formState.limites, pontosLP: formState.limites.pontosLP.filter((_, idx) => idx !== i) })}><X className="w-3.5 h-3.5" /></button>)}
              </div>
            ))}
            <Button variant="ghost" size="sm" className="text-xs text-muted-foreground gap-1 h-7 mt-1" onClick={() => updateField("limites", { ...formState.limites, pontosLP: [...formState.limites.pontosLP, { massaUmidaRecipiente: "", massaSecaRecipiente: "", massaRecipiente: "" }] })}><Plus className="w-3 h-3" /> Adicionar ponto</Button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <BaseDialogExemplos
      title="Exemplos de Índices Físicos e Limites"
      description="Selecione um tipo de solo para carregar dados reais de ensaio."
      builtInExamples={exemplosCaracterizacao}
      storageKey="edusolo_custom_examples_caracterizacao"
      onSelectExample={onSelectExample}
      disabled={disabled}
      renderExtraFields={renderExtraFields}
      getFormStateFromStore={getFormStateFromStore}
      renderExampleTags={renderExampleTags}
    />
  );
}

