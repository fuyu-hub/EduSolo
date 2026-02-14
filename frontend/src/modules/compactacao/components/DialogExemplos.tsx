// frontend/src/modules/compactacao/components/DialogExemplos.tsx
import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  FileText, Droplets, Mountain, Leaf, Plus, Trash2, BookMarked, Save, X, ChevronLeft,
  FlaskConical, Beaker, Layers, Globe, Waves, Gem, TestTubes, Hammer, Compass, Microscope,
  Pencil, ChevronDown,
  type LucideIcon,
} from "lucide-react";
import {
  exemplosCompactacao,
  ExemploCompactacao,
  PontoCompactacao,
  getCustomExamples,
  saveCustomExample,
  updateCustomExample,
  deleteCustomExample,
} from "@/lib/exemplos-compactacao";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// =============================================
// Icon & Color Presets
// =============================================

const ICON_OPTIONS: { key: string; icon: LucideIcon; label: string }[] = [
  { key: "droplets", icon: Droplets, label: "Água" },
  { key: "mountain", icon: Mountain, label: "Terreno" },
  { key: "leaf", icon: Leaf, label: "Orgânico" },
  { key: "flask", icon: FlaskConical, label: "Frasco" },
  { key: "beaker", icon: Beaker, label: "Béquer" },
  { key: "layers", icon: Layers, label: "Camadas" },
  { key: "globe", icon: Globe, label: "Terra" },
  { key: "waves", icon: Waves, label: "Ondas" },
  { key: "gem", icon: Gem, label: "Mineral" },
  { key: "testtubes", icon: TestTubes, label: "Tubos" },
  { key: "hammer", icon: Hammer, label: "Martelo" },
  { key: "compass", icon: Compass, label: "Bússola" },
  { key: "microscope", icon: Microscope, label: "Microscópio" },
  { key: "bookmark", icon: BookMarked, label: "Marcador" },
];

const COLOR_OPTIONS: { key: string; label: string; bg: string; text: string; border: string; gradient: string; hoverBorder: string; glow: string }[] = [
  { key: "blue", label: "Azul", bg: "bg-blue-500", text: "text-blue-500", border: "border-blue-500/20", gradient: "from-blue-500/20 to-blue-600/5", hoverBorder: "hover:border-blue-500/40", glow: "group-hover:shadow-blue-500/10" },
  { key: "amber", label: "Âmbar", bg: "bg-amber-500", text: "text-amber-500", border: "border-amber-500/20", gradient: "from-amber-500/20 to-amber-600/5", hoverBorder: "hover:border-amber-500/40", glow: "group-hover:shadow-amber-500/10" },
  { key: "emerald", label: "Verde", bg: "bg-emerald-500", text: "text-emerald-500", border: "border-emerald-500/20", gradient: "from-emerald-500/20 to-emerald-600/5", hoverBorder: "hover:border-emerald-500/40", glow: "group-hover:shadow-emerald-500/10" },
  { key: "rose", label: "Rosa", bg: "bg-rose-500", text: "text-rose-500", border: "border-rose-500/20", gradient: "from-rose-500/20 to-rose-600/5", hoverBorder: "hover:border-rose-500/40", glow: "group-hover:shadow-rose-500/10" },
  { key: "violet", label: "Violeta", bg: "bg-violet-500", text: "text-violet-500", border: "border-violet-500/20", gradient: "from-violet-500/20 to-violet-600/5", hoverBorder: "hover:border-violet-500/40", glow: "group-hover:shadow-violet-500/10" },
  { key: "cyan", label: "Ciano", bg: "bg-cyan-500", text: "text-cyan-500", border: "border-cyan-500/20", gradient: "from-cyan-500/20 to-cyan-600/5", hoverBorder: "hover:border-cyan-500/40", glow: "group-hover:shadow-cyan-500/10" },
  { key: "orange", label: "Laranja", bg: "bg-orange-500", text: "text-orange-500", border: "border-orange-500/20", gradient: "from-orange-500/20 to-orange-600/5", hoverBorder: "hover:border-orange-500/40", glow: "group-hover:shadow-orange-500/10" },
  { key: "indigo", label: "Índigo", bg: "bg-indigo-500", text: "text-indigo-500", border: "border-indigo-500/20", gradient: "from-indigo-500/20 to-indigo-600/5", hoverBorder: "hover:border-indigo-500/40", glow: "group-hover:shadow-indigo-500/10" },
];

function getIconComponent(iconName?: string): LucideIcon {
  return ICON_OPTIONS.find(o => o.key === iconName)?.icon || Hammer;
}

function getColorTheme(colorName?: string) {
  return COLOR_OPTIONS.find(o => o.key === colorName) || COLOR_OPTIONS[0];
}

// Built-in themes (fixed for built-in examples)
const builtInThemes = [
  { iconKey: "layers", colorKey: "amber" },
  { iconKey: "mountain", colorKey: "emerald" },
  { iconKey: "waves", colorKey: "cyan" },
];

// =============================================
// Icon/Color Picker Popover
// =============================================

function IconColorPicker({
  icon,
  color,
  onChangeIcon,
  onChangeColor,
}: {
  icon: string;
  color: string;
  onChangeIcon: (key: string) => void;
  onChangeColor: (key: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isOpen]);

  const CurrentIcon = getIconComponent(icon);
  const currentColor = getColorTheme(color);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        className={cn(
          "relative w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-200 bg-gradient-to-br",
          currentColor.gradient,
          "hover:scale-105 active:scale-95 cursor-pointer group/icon"
        )}
        onClick={() => setIsOpen(!isOpen)}
        title="Alterar ícone e cor"
      >
        <CurrentIcon className={cn("w-6 h-6", currentColor.text)} />
        <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-card border border-border flex items-center justify-center transition-opacity duration-200">
          <ChevronDown className="w-2.5 h-2.5 text-muted-foreground" />
        </div>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 z-50 bg-popover border border-border rounded-xl shadow-xl p-3 space-y-3 w-[280px] animate-in fade-in-0 zoom-in-95 duration-200">
          <div className="space-y-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/50">Ícone</span>
            <div className="grid grid-cols-7 gap-1">
              {ICON_OPTIONS.map(opt => {
                const IconOpt = opt.icon;
                const isActive = icon === opt.key;
                return (
                  <button
                    key={opt.key}
                    type="button"
                    title={opt.label}
                    className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-150",
                      isActive
                        ? cn("bg-gradient-to-br", currentColor.gradient, currentColor.text, "scale-110")
                        : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                    )}
                    onClick={() => onChangeIcon(opt.key)}
                  >
                    <IconOpt className="w-4 h-4" />
                  </button>
                );
              })}
            </div>
          </div>

          <Separator className="!my-2" />

          <div className="space-y-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/50">Cor</span>
            <div className="flex flex-wrap gap-1.5">
              {COLOR_OPTIONS.map(opt => {
                const isActive = color === opt.key;
                return (
                  <button
                    key={opt.key}
                    type="button"
                    title={opt.label}
                    className={cn(
                      "w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-150",
                      isActive ? "scale-110" : "hover:scale-105"
                    )}
                    onClick={() => onChangeColor(opt.key)}
                  >
                    <span className={cn(
                      "w-5 h-5 rounded-full transition-all",
                      opt.bg,
                      isActive && "ring-2 ring-offset-2 ring-offset-popover ring-foreground/20"
                    )} />
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// =============================================
// Component
// =============================================

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

type View = "list" | "form";

export default function DialogExemplos({ onSelectExample, disabled, currentFormData }: DialogExemplosProps) {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<View>("list");
  const [customExamples, setCustomExamples] = useState<ExemploCompactacao[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form state
  const [formName, setFormName] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formIcon, setFormIcon] = useState("hammer");
  const [formColor, setFormColor] = useState("blue");
  const [formVolume, setFormVolume] = useState("");
  const [formPesoCil, setFormPesoCil] = useState("");
  const [formGs, setFormGs] = useState("");
  const [formPontos, setFormPontos] = useState<PontoCompactacao[]>([
    { pesoAmostaCilindro: "", pesoBrutoUmido: "", pesoBrutoSeco: "", tara: "" },
    { pesoAmostaCilindro: "", pesoBrutoUmido: "", pesoBrutoSeco: "", tara: "" },
    { pesoAmostaCilindro: "", pesoBrutoUmido: "", pesoBrutoSeco: "", tara: "" },
  ]);

  useEffect(() => {
    if (open) {
      setCustomExamples(getCustomExamples());
      setView("list");
      setEditingId(null);
    }
  }, [open]);

  const handleSelect = (exemplo: ExemploCompactacao) => {
    onSelectExample(exemplo);
    setOpen(false);
  };

  const handleDelete = (id: string) => {
    deleteCustomExample(id);
    setCustomExamples(getCustomExamples());
    toast.info("Exemplo removido.");
  };

  const refreshCustomList = () => {
    setCustomExamples(getCustomExamples());
  };

  // ---- Form helpers ----

  const resetForm = () => {
    setFormName("");
    setFormDesc("");
    setFormIcon("hammer");
    setFormColor("blue");
    setFormVolume(currentFormData?.volumeCilindro || "");
    setFormPesoCil(currentFormData?.pesoCilindro || "");
    setFormGs(currentFormData?.Gs || "");
    const pontos = (currentFormData?.pontos || []).map(p => ({
      pesoAmostaCilindro: p.pesoAmostaCilindro || "",
      pesoBrutoUmido: p.pesoBrutoUmido || "",
      pesoBrutoSeco: p.pesoBrutoSeco || "",
      tara: p.tara || "",
    }));
    setFormPontos(pontos.length > 0 ? pontos : [
      { pesoAmostaCilindro: "", pesoBrutoUmido: "", pesoBrutoSeco: "", tara: "" },
      { pesoAmostaCilindro: "", pesoBrutoUmido: "", pesoBrutoSeco: "", tara: "" },
      { pesoAmostaCilindro: "", pesoBrutoUmido: "", pesoBrutoSeco: "", tara: "" },
    ]);
  };

  const loadFormFromExample = (ex: ExemploCompactacao) => {
    setFormName(ex.nome);
    setFormDesc(ex.descricao);
    setFormIcon(ex.iconName || "hammer");
    setFormColor(ex.colorName || "blue");
    setFormVolume(ex.volumeCilindro);
    setFormPesoCil(ex.pesoCilindro);
    setFormGs(ex.Gs);
    setFormPontos(ex.pontos.length > 0 ? [...ex.pontos] : [
      { pesoAmostaCilindro: "", pesoBrutoUmido: "", pesoBrutoSeco: "", tara: "" },
    ]);
  };

  const handleOpenCreate = () => {
    setEditingId(null);
    resetForm();
    setView("form");
  };

  const handleOpenEdit = (ex: ExemploCompactacao) => {
    setEditingId(ex.id || null);
    loadFormFromExample(ex);
    setView("form");
  };

  const buildExampleFromForm = (): ExemploCompactacao => ({
    nome: formName.trim() || "Sem nome",
    descricao: formDesc.trim() || "Exemplo personalizado",
    icon: "🔧",
    iconName: formIcon,
    colorName: formColor,
    volumeCilindro: formVolume,
    pesoCilindro: formPesoCil,
    Gs: formGs,
    pontos: formPontos.filter(p => p.pesoAmostaCilindro || p.pesoBrutoUmido || p.pesoBrutoSeco || p.tara),
  });

  const handleSave = () => {
    if (!formName.trim()) {
      toast.error("Informe um nome para o exemplo.");
      return;
    }

    if (editingId) {
      updateCustomExample(editingId, buildExampleFromForm());
      toast.success(`Exemplo "${formName}" atualizado!`);
    } else {
      saveCustomExample(buildExampleFromForm());
      toast.success(`Exemplo "${formName}" salvo!`);
    }

    refreshCustomList();
    setView("list");
  };

  const updatePonto = (index: number, field: keyof PontoCompactacao, value: string) => {
    setFormPontos(prev => {
      const c = [...prev];
      c[index] = { ...c[index], [field]: value };
      return c;
    });
  };

  // =============================================
  // Render
  // =============================================

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" disabled={disabled} className="gap-1.5">
          <FileText className="w-4 h-4" />
          <span className="hidden sm:inline">Exemplos</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        {view === "list" ? (
          /* ============================================= */
          /* LIST VIEW                                     */
          /* ============================================= */
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                Exemplos de Compactação
              </DialogTitle>
              <DialogDescription>
                Selecione um exemplo de ensaio Proctor para preencher automaticamente o formulário.
              </DialogDescription>
            </DialogHeader>

            {/* Built-in examples */}
            <div className="grid grid-cols-2 gap-3 mt-2">
              {exemplosCompactacao.map((exemplo, index) => {
                const t = builtInThemes[index];
                const color = getColorTheme(t.colorKey);
                const Icon = getIconComponent(t.iconKey);
                return (
                  <ExampleCard
                    key={`builtin-${index}`}
                    exemplo={exemplo}
                    Icon={Icon}
                    color={color}
                    onClick={() => handleSelect(exemplo)}
                  />
                );
              })}

              {/* Create new card */}
              <button
                className="group relative flex flex-col items-center justify-center text-center p-5 rounded-2xl border-2 border-dashed border-muted-foreground/20 hover:border-primary/40 bg-card/30 backdrop-blur-sm cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-lg active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                onClick={handleOpenCreate}
              >
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/5 to-primary/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative z-10 w-12 h-12 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center mb-3 transition-transform duration-300 group-hover:scale-110 border border-primary/20">
                  <Plus className="w-6 h-6 text-primary" />
                </div>
                <h3 className="relative z-10 font-bold text-sm text-foreground leading-tight mb-1.5">
                  Criar Exemplo
                </h3>
                <p className="relative z-10 text-[11px] text-muted-foreground leading-relaxed">
                  Salve dados como um novo exemplo personalizado.
                </p>
              </button>
            </div>

            {/* Custom examples */}
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
                        {/* Action buttons */}
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
                          exemplo={exemplo}
                          Icon={Icon}
                          color={color}
                          onClick={() => handleSelect(exemplo)}
                        />
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </>
        ) : (
          /* ============================================= */
          /* FORM VIEW (Create / Edit)                     */
          /* ============================================= */
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
                {editingId
                  ? "Edite os dados do exemplo. As alterações serão salvas localmente."
                  : "Preencha os dados abaixo para criar um exemplo personalizado."
                }
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-5 mt-2">
              {/* ---- Editable Card (icon + name + desc inline) ---- */}
              {(() => {
                const previewColor = getColorTheme(formColor);
                return (
                  <div className={cn(
                    "relative flex items-start gap-4 p-4 rounded-2xl border-2 bg-card/50 backdrop-blur-sm transition-colors duration-300",
                    previewColor.border
                  )}>
                    <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${previewColor.gradient} opacity-30 pointer-events-none`} />
                    <div className="relative z-10 shrink-0 mt-0.5">
                      <IconColorPicker
                        icon={formIcon}
                        color={formColor}
                        onChangeIcon={setFormIcon}
                        onChangeColor={setFormColor}
                      />
                    </div>
                    <div className="relative z-10 flex-1 min-w-0 space-y-1">
                      <input
                        type="text"
                        value={formName}
                        onChange={e => setFormName(e.target.value)}
                        placeholder="Nome do exemplo..."
                        className="w-full bg-transparent border-none outline-none text-sm font-bold text-foreground placeholder:text-muted-foreground/40 focus:ring-0 p-0"
                      />
                      <input
                        type="text"
                        value={formDesc}
                        onChange={e => setFormDesc(e.target.value)}
                        placeholder="Descrição do ensaio..."
                        className="w-full bg-transparent border-none outline-none text-[12px] text-muted-foreground placeholder:text-muted-foreground/30 focus:ring-0 p-0"
                      />
                    </div>
                  </div>
                );
              })()}

              <Separator />

              {/* Parâmetros Gerais */}
              <div className="space-y-2">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">Parâmetros Gerais</h4>
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <Label className="text-[11px]">Volume (cm³)</Label>
                    <Input placeholder="981" value={formVolume} onChange={e => setFormVolume(e.target.value)} className="h-8 text-sm" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px]">Massa Cilindro (g)</Label>
                    <Input placeholder="2850" value={formPesoCil} onChange={e => setFormPesoCil(e.target.value)} className="h-8 text-sm" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px]">Gs</Label>
                    <Input placeholder="2.65" value={formGs} onChange={e => setFormGs(e.target.value)} className="h-8 text-sm" />
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
                  {formPontos.map((point, i) => (
                    <div key={i} className="grid grid-cols-[1fr_1fr_1fr_1fr_24px] gap-2 items-center">
                      <Input className="h-7 text-xs" placeholder="g" value={point.pesoAmostaCilindro} onChange={e => updatePonto(i, "pesoAmostaCilindro", e.target.value)} />
                      <Input className="h-7 text-xs" placeholder="g" value={point.pesoBrutoUmido} onChange={e => updatePonto(i, "pesoBrutoUmido", e.target.value)} />
                      <Input className="h-7 text-xs" placeholder="g" value={point.pesoBrutoSeco} onChange={e => updatePonto(i, "pesoBrutoSeco", e.target.value)} />
                      <Input className="h-7 text-xs" placeholder="g" value={point.tara} onChange={e => updatePonto(i, "tara", e.target.value)} />
                      {formPontos.length > 1 && (
                        <button className="text-muted-foreground/40 hover:text-destructive transition-colors" onClick={() => setFormPontos(prev => prev.filter((_, idx) => idx !== i))}>
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                  <Button variant="ghost" size="sm" className="text-xs text-muted-foreground gap-1 h-7 mt-1" onClick={() => setFormPontos(prev => [...prev, { pesoAmostaCilindro: "", pesoBrutoUmido: "", pesoBrutoSeco: "", tara: "" }])}>
                    <Plus className="w-3 h-3" /> Adicionar ponto
                  </Button>
                </div>
              </div>

              {/* Actions */}
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
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

// =============================================
// Reusable Example Card (read-only display)
// =============================================

function ExampleCard({
  exemplo,
  Icon,
  color,
  onClick,
}: {
  exemplo: ExemploCompactacao;
  Icon: LucideIcon;
  color: typeof COLOR_OPTIONS[number];
  onClick: () => void;
}) {
  return (
    <button
      className={cn(
        "group relative flex flex-col items-center text-center p-5 rounded-2xl border-2 bg-card/50 backdrop-blur-sm cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-lg active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary w-full",
        color.border, color.hoverBorder, color.glow
      )}
      onClick={onClick}
    >
      <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${color.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
      <div className={`relative z-10 w-12 h-12 rounded-xl bg-gradient-to-br ${color.gradient} flex items-center justify-center mb-3 transition-transform duration-300 group-hover:scale-110`}>
        <Icon className={`w-6 h-6 ${color.text}`} />
      </div>
      <h3 className="relative z-10 font-bold text-sm text-foreground leading-tight mb-1.5">
        {exemplo.nome}
      </h3>
      <p className="relative z-10 text-[11px] text-muted-foreground leading-relaxed line-clamp-2 mb-3">
        {exemplo.descricao}
      </p>
      <div className="relative z-10 flex flex-wrap items-center justify-center gap-1.5 mt-auto">
        <span className="text-[10px] font-medium text-muted-foreground/70 bg-muted/50 px-2 py-0.5 rounded-full">
          Vol: {exemplo.volumeCilindro} cm³
        </span>
        <span className="text-[10px] font-medium text-muted-foreground/70 bg-muted/50 px-2 py-0.5 rounded-full">
          {exemplo.pontos.length} pontos
        </span>
        {exemplo.Gs && (
          <span className="text-[10px] font-medium text-muted-foreground/70 bg-muted/50 px-2 py-0.5 rounded-full">
            Gs: {exemplo.Gs}
          </span>
        )}
      </div>
    </button>
  );
}
