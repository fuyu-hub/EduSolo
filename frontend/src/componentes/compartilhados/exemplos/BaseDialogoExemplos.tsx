import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  FileText, Plus, BookMarked, Save, X, ChevronLeft, Pencil, Trash2, LucideIcon
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { IconColorPicker } from "./SeletorIconeCor";
import { ExampleCard } from "./CartaoExemplo";
import { getIconComponent, getColorTheme, builtInThemes } from "./utilidades-icones";

export interface BaseExample {
  id?: string;
  nome: string;
  descricao: string;
  iconName?: string;
  colorName?: string;
  isCustom?: boolean;
}

interface BaseDialogExemplosProps<T extends BaseExample> {
  onSelectExample: (example: T) => void;
  disabled?: boolean;
  title: string;
  description: string;
  builtInExamples: T[];
  storageKey: string;
  triggerButton?: React.ReactNode;
  
  // Custom form handling
  renderExtraFields: (formState: T, updateField: <K extends keyof T>(field: K, value: T[K]) => void) => React.ReactNode;
  getFormStateFromStore: () => T;
  renderExampleTags: (example: T) => React.ReactNode;
}

type View = "list" | "form";

export function BaseDialogExemplos<T extends BaseExample>({
  onSelectExample,
  disabled,
  title,
  description,
  builtInExamples,
  storageKey,
  triggerButton,
  renderExtraFields,
  getFormStateFromStore,
  renderExampleTags
}: BaseDialogExemplosProps<T>) {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<View>("list");
  const [customExamples, setCustomExamples] = useState<T[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formState, setFormState] = useState<T | null>(null);

  // Storage Functions
  const getStoredExamples = (): T[] => {
    try {
      const stored = localStorage.getItem(storageKey);
      return stored ? JSON.parse(stored) : [];
    } catch { return []; }
  };

  const saveToStorage = (examples: T[]) => {
    localStorage.setItem(storageKey, JSON.stringify(examples));
    setCustomExamples(examples);
  };

  useEffect(() => {
    if (open) {
      setCustomExamples(getStoredExamples());
      setView("list");
      setEditingId(null);
    }
  }, [open, storageKey]);

  const handleSelect = (example: T) => {
    onSelectExample(example);
    setOpen(false);
  };

  const handleDelete = (id: string) => {
    const filtered = getStoredExamples().filter(e => e.id !== id);
    saveToStorage(filtered);
    toast.info("Exemplo removido.");
  };

  const handleOpenCreate = () => {
    setEditingId(null);
    const initial = getFormStateFromStore();
    setFormState({
      ...initial,
      nome: "",
      descricao: "",
      iconName: "droplets",
      colorName: "blue"
    });
    setView("form");
  };

  const handleOpenEdit = (ex: T) => {
    setEditingId(ex.id || null);
    setFormState({ ...ex });
    setView("form");
  };

  const handleSave = () => {
    if (!formState || !formState.nome.trim()) {
      toast.error("Informe um nome para o exemplo.");
      return;
    }

    const currentCustoms = getStoredExamples();
    
    if (editingId) {
      const index = currentCustoms.findIndex(e => e.id === editingId);
      if (index !== -1) {
        currentCustoms[index] = { ...formState, id: editingId, isCustom: true };
        saveToStorage(currentCustoms);
        toast.success(`Exemplo "${formState.nome}" atualizado!`);
      }
    } else {
      const newExample: T = {
        ...formState,
        isCustom: true,
        id: `custom_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      };
      currentCustoms.push(newExample);
      saveToStorage(currentCustoms);
      toast.success(`Exemplo "${formState.nome}" salvo!`);
    }
    setView("list");
  };

  const updateField = <K extends keyof T>(field: K, value: T[K]) => {
    setFormState(prev => prev ? { ...prev, [field]: value } : null);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {triggerButton || (
          <Button variant="outline" size="sm" disabled={disabled} className="gap-1.5">
            <FileText className="w-4 h-4" />
            <span className="hidden sm:inline">Exemplos</span>
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        {view === "list" ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                {title}
              </DialogTitle>
              <DialogDescription>{description}</DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-2 gap-3 mt-2">
              {builtInExamples.map((exemplo, index) => {
                const t = builtInThemes[index % builtInThemes.length];
                const color = getColorTheme(t.colorKey);
                const Icon = getIconComponent(t.iconKey);
                return (
                  <ExampleCard
                    key={`builtin-${index}`}
                    nome={exemplo.nome}
                    descricao={exemplo.descricao}
                    Icon={Icon}
                    color={color}
                    onClick={() => handleSelect(exemplo)}
                    tags={renderExampleTags(exemplo)}
                  />
                );
              })}

              <button
                className="group relative flex flex-col items-center justify-center text-center p-5 rounded-2xl border-2 border-dashed border-muted-foreground/20 hover:border-primary/40 bg-card/30 backdrop-blur-sm cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-lg active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                onClick={handleOpenCreate}
              >
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/5 to-primary/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative z-10 w-12 h-12 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center mb-3 transition-transform duration-300 group-hover:scale-110 border border-primary/20">
                  <Plus className="w-6 h-6 text-primary" />
                </div>
                <h3 className="relative z-10 font-bold text-sm text-foreground leading-tight mb-1.5">Criar Exemplo</h3>
                <p className="relative z-10 text-[11px] text-muted-foreground leading-relaxed">Salve os dados atuais como um novo exemplo personalizado.</p>
              </button>
            </div>

            {customExamples.length > 0 && (
              <>
                <Separator className="my-2" />
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/60 flex items-center gap-2">
                  <BookMarked className="w-3.5 h-3.5" />
                  Meus Exemplos
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  {customExamples.map((exemplo) => {
                    const color = getColorTheme(exemplo.colorName);
                    const Icon = getIconComponent(exemplo.iconName);
                    return (
                      <div key={exemplo.id} className="relative group/card">
                        <div className="absolute top-2 right-2 z-20 flex items-center gap-0.5 opacity-0 group-hover/card:opacity-100 transition-opacity duration-200">
                          <button
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                            onClick={(e) => { e.stopPropagation(); handleOpenEdit(exemplo); }}
                            title="Editar exemplo"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                            onClick={(e) => { e.stopPropagation(); if (exemplo.id) handleDelete(exemplo.id); }}
                            title="Excluir exemplo"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <ExampleCard
                          nome={exemplo.nome}
                          descricao={exemplo.descricao}
                          Icon={Icon}
                          color={color}
                          onClick={() => handleSelect(exemplo)}
                          tags={renderExampleTags(exemplo)}
                        />
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="h-7 w-7 -ml-1" onClick={() => setView("list")}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Save className="w-5 h-5 text-primary" />
                {editingId ? "Editar Exemplo" : "Criar Exemplo"}
              </DialogTitle>
              <DialogDescription>
                {editingId ? "Edite os dados do exemplo." : "Preencha os dados abaixo para salvar o exemplo."}
              </DialogDescription>
            </DialogHeader>

            {formState && (
              <div className="space-y-5 mt-2">
                {(() => {
                  const previewColor = getColorTheme(formState.colorName);
                  return (
                    <div className={cn("relative flex items-start gap-4 p-4 rounded-2xl border-2 bg-card/50 backdrop-blur-sm transition-colors duration-300", previewColor.border)}>
                      <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${previewColor.gradient} opacity-30 pointer-events-none`} />
                      <div className="relative z-10 shrink-0 mt-0.5">
                        <IconColorPicker
                          icon={formState.iconName || "droplets"}
                          color={formState.colorName || "blue"}
                          onChangeIcon={(icon) => updateField("iconName", icon)}
                          onChangeColor={(color) => updateField("colorName", color)}
                        />
                      </div>
                      <div className="relative z-10 flex-1 min-w-0 space-y-1">
                        <input
                          type="text"
                          value={formState.nome}
                          onChange={e => updateField("nome", e.target.value)}
                          placeholder="Nome do exemplo..."
                          className="w-full bg-transparent border-none outline-none text-sm font-bold text-foreground placeholder:text-muted-foreground/40 focus:ring-0 p-0"
                        />
                        <input
                          type="text"
                          value={formState.descricao}
                          onChange={e => updateField("descricao", e.target.value)}
                          placeholder="Descrição do solo..."
                          className="w-full bg-transparent border-none outline-none text-[12px] text-muted-foreground placeholder:text-muted-foreground/30 focus:ring-0 p-0"
                        />
                      </div>
                    </div>
                  );
                })()}

                <Separator />
                
                {renderExtraFields(formState, updateField)}

                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="outline" size="sm" onClick={() => setView("list")} className="gap-1.5">
                    <X className="w-3.5 h-3.5" />
                    Cancelar
                  </Button>
                  <Button size="sm" onClick={handleSave} className="gap-1.5">
                    <Save className="w-3.5 h-3.5" />
                    {editingId ? "Salvar Alterações" : "Salvar Exemplo"}
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
