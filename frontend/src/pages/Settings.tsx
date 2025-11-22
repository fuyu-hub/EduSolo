import { Settings as SettingsIcon, Palette, Check, Calculator, Monitor, Eye, Database, Download, Upload, Trash2, RotateCcw, Zap, HelpCircle, Printer } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { useTheme } from "@/hooks/use-theme";
import { useSettings } from "@/hooks/use-settings";
import { ThemeColor } from "@/contexts/ThemeContext";
import { UnitSystem, InterfaceDensity, PageOrientation, PageMargins, PaperSize } from "@/contexts/SettingsContext";
import { cn } from "@/lib/utils";
import { toast } from "@/components/ui/sonner";
import { useState, useRef } from "react";
import { useToursControl } from "@/components/WelcomeDialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { MobileModuleWrapper } from "@/components/mobile";
import SettingsMobile from "./mobile/SettingsMobile";

interface ThemeOption {
  value: ThemeColor;
  label: string;
  description: string;
  colors: string[]; // Array de cores HSL para a paleta
}

const themeColors: ThemeOption[] = [
  {
    value: "indigo",
    label: "Índigo Profundo",
    description: "Sofisticado e intenso",
    colors: ["238 84% 62%", "238 84% 52%", "238 84% 42%", "241 86% 36%", "244 88% 30%"],
  },
  {
    value: "soil",
    label: "Terra Natural",
    description: "Tema oficial EduSolos - tons terrosos vibrantes",
    colors: ["28 72% 65%", "28 70% 55%", "28 68% 45%", "28 66% 38%", "28 60% 30%"],
  },
  {
    value: "green",
    label: "Verde Esmeralda",
    description: "Natural e equilibrado",
    colors: ["142 76% 56%", "142 76% 46%", "142 76% 36%", "145 80% 30%", "148 85% 25%"],
  },
  {
    value: "amber",
    label: "Âmbar Dourado",
    description: "Caloroso e acolhedor",
    colors: ["38 92% 58%", "38 92% 48%", "38 92% 38%", "35 92% 33%", "32 92% 28%"],
  },
  {
    value: "red",
    label: "Vermelho Coral",
    description: "Forte e determinado",
    colors: ["358 75% 59%", "358 75% 49%", "358 75% 39%", "0 78% 34%", "2 80% 29%"],
  },
  {
    value: "slate",
    label: "Minimalista",
    description: "Clean e com bordas definidas",
    colors: ["0 0% 85%", "0 0% 70%", "0 0% 50%", "0 0% 30%", "0 0% 15%"],
  },
];

function SettingsDesktop() {
  const { theme, setThemeColor } = useTheme();
  const { settings, updateSettings, resetSettings, clearAllCalculations, exportSettings, importSettings } = useSettings();
  const { toursEnabled, setToursEnabled } = useToursControl();
  const [showClearDialog, setShowClearDialog] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [showPrintDialog, setShowPrintDialog] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImportSettings = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      await importSettings(file);
      toast.success("Configurações importadas com sucesso!");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao importar configurações");
    }

    // Limpar input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleClearCalculations = () => {
    clearAllCalculations();
    setShowClearDialog(false);
    toast.success("Todos os cálculos salvos foram removidos");
  };

  const handleResetSettings = () => {
    resetSettings();
    setShowResetDialog(false);
    toast.success("Configurações restauradas para os valores padrão");
  };

  return (
    <TooltipProvider>
      <div className="space-y-8 max-w-4xl mx-auto">
        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
              <SettingsIcon className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Configurações</h1>
              <p className="text-muted-foreground">Personalize sua experiência no EduSolos</p>
            </div>
          </div>
        </div>

        {/* Aparência */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Palette className="w-5 h-5 text-primary" />
            <h2 className="text-2xl font-semibold text-foreground">Aparência</h2>
          </div>

          {/* Nota sobre o modo claro/escuro */}
          <Card className="glass p-4 border-l-4 border-l-primary">
            <p className="text-sm text-muted-foreground">
              <strong className="text-foreground">Dica:</strong> Use o botão no canto superior direito para alternar entre modo claro e escuro.
            </p>
          </Card>

          {/* Temas - Accent Colors */}
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium text-foreground">Cores de Destaque</h3>
              <p className="text-sm text-muted-foreground">Defina a personalidade do design com acentos perfeitos</p>
            </div>

            {/* Cards de Paleta de Cores */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {themeColors.map((themeOption) => {
                const isSelected = theme.color === themeOption.value;

                // Função para converter HSL para HEX
                const hslToHex = (hsl: string) => {
                  const [h, s, l] = hsl.split(' ').map(v => parseFloat(v));
                  const sDecimal = s / 100;
                  const lDecimal = l / 100;

                  const c = (1 - Math.abs(2 * lDecimal - 1)) * sDecimal;
                  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
                  const m = lDecimal - c / 2;

                  let r = 0, g = 0, b = 0;
                  if (h < 60) { r = c; g = x; b = 0; }
                  else if (h < 120) { r = x; g = c; b = 0; }
                  else if (h < 180) { r = 0; g = c; b = x; }
                  else if (h < 240) { r = 0; g = x; b = c; }
                  else if (h < 300) { r = x; g = 0; b = c; }
                  else { r = c; g = 0; b = x; }

                  const toHex = (n: number) => {
                    const hex = Math.round((n + m) * 255).toString(16);
                    return hex.length === 1 ? '0' + hex : hex;
                  };

                  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
                };

                return (
                  <button
                    key={themeOption.value}
                    onClick={() => setThemeColor(themeOption.value)}
                    className={cn(
                      "h-[100px] rounded-xl overflow-hidden transition-all duration-300",
                      "hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
                      isSelected && "ring-4 ring-primary ring-offset-2 scale-[1.02]"
                    )}
                    style={{
                      boxShadow: isSelected
                        ? "0 10px 40px rgba(0,0,0,0.15)"
                        : "0 10px 20px rgba(0,0,0,0.08)"
                    }}
                  >
                    {/* Palette Section - 86% height */}
                    <div className="flex h-[86%] w-full">
                      {themeOption.colors.slice(0, 5).map((color, index) => (
                        <div
                          key={index}
                          className="palette-color h-full flex-1 flex items-center justify-center text-white text-[9px] font-medium tracking-tight"
                          style={{
                            backgroundColor: `hsl(${color})`,
                          }}
                        >
                          <span className="rotate-180 [writing-mode:vertical-lr]">
                            {hslToHex(color)}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Stats Section - 14% height */}
                    <div className="h-[14%] w-full bg-card flex items-center justify-between px-3 text-[10px]">
                      <span className="font-medium text-foreground">{themeOption.label}</span>
                      {isSelected && (
                        <Check className="w-3 h-3 text-primary" strokeWidth={3} />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* Cálculos */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Calculator className="w-5 h-5 text-primary" />
            <h2 className="text-2xl font-semibold text-foreground">Cálculos</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Precisão de Cálculos */}
            <Card className="glass p-5">
              <div className="space-y-3">
                <Label htmlFor="decimal-places" className="text-base font-medium">
                  Casas Decimais
                </Label>
                <p className="text-sm text-muted-foreground">
                  Número de casas decimais nos resultados
                </p>
                <Select
                  value={settings.decimalPlaces.toString()}
                  onValueChange={(value) => updateSettings({ decimalPlaces: parseInt(value) })}
                >
                  <SelectTrigger id="decimal-places">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2">2 casas (ex: 3.14)</SelectItem>
                    <SelectItem value="3">3 casas (ex: 3.142)</SelectItem>
                    <SelectItem value="4">4 casas (ex: 3.1416)</SelectItem>
                    <SelectItem value="5">5 casas (ex: 3.14159)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </Card>

            {/* Sistema de Unidades */}
            <Card className="glass p-5 opacity-60">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="unit-system" className="text-base font-medium">
                    Sistema de Unidades
                  </Label>
                  <Badge variant="outline" className="text-xs">Em desenvolvimento</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Unidades usadas nos cálculos
                </p>
                <Select
                  value={settings.unitSystem}
                  onValueChange={(value: UnitSystem) => updateSettings({ unitSystem: value })}
                  disabled
                >
                  <SelectTrigger id="unit-system" disabled>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SI">SI (kN/m³, kPa, m)</SelectItem>
                    <SelectItem value="CGS">CGS (g/cm³, kg/cm²)</SelectItem>
                    <SelectItem value="Imperial">Imperial (lb/ft³, psi)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground italic">
                  ⚙️ Esta funcionalidade será implementada em breve
                </p>
              </div>
            </Card>
          </div>

          {/* Notação Científica */}
          <Card className="glass p-5">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="scientific-notation" className="text-base font-medium">
                  Notação Científica Automática
                </Label>
                <p className="text-sm text-muted-foreground">
                  Usar notação científica para valores muito grandes ou pequenos
                </p>
              </div>
              <Switch
                id="scientific-notation"
                checked={settings.scientificNotation}
                onCheckedChange={(checked) => updateSettings({ scientificNotation: checked })}
              />
            </div>
          </Card>
        </section>

        {/* Interface */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Monitor className="w-5 h-5 text-primary" />
            <h2 className="text-2xl font-semibold text-foreground">Interface</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Densidade da Interface */}
            <Card className="glass p-5 opacity-60">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="interface-density" className="text-base font-medium">
                    Densidade da Interface
                  </Label>
                  <Badge variant="outline" className="text-xs">Em desenvolvimento</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Espaçamento entre elementos
                </p>
                <Select
                  value={settings.interfaceDensity}
                  onValueChange={(value: InterfaceDensity) => updateSettings({ interfaceDensity: value })}
                  disabled
                >
                  <SelectTrigger id="interface-density" disabled>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="compact">Compacta</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="comfortable">Espaçosa</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground italic">
                  ⚙️ Esta funcionalidade será implementada em breve
                </p>
              </div>
            </Card>

            {/* Reduzir Animações */}
            <Card className="glass p-5">
              <div className="flex items-center justify-between h-full">
                <div className="space-y-1">
                  <Label htmlFor="reduce-motion" className="text-base font-medium flex items-center gap-2">
                    <Zap className="w-4 h-4" />
                    Reduzir Animações
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Desativar transições e animações
                  </p>
                </div>
                <Switch
                  id="reduce-motion"
                  checked={settings.reduceMotion}
                  onCheckedChange={(checked) => updateSettings({ reduceMotion: checked })}
                />
              </div>
            </Card>
          </div>
        </section>

        {/* Preferências de Exibição */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Eye className="w-5 h-5 text-primary" />
            <h2 className="text-2xl font-semibold text-foreground">Preferências de Exibição</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Dicas Educacionais */}
            <Card className="glass p-5">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="show-tips" className="text-base font-medium">
                    Dicas Educacionais
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Mostrar dicas e explicações
                  </p>
                </div>
                <Switch
                  id="show-tips"
                  checked={settings.showEducationalTips}
                  onCheckedChange={(checked) => updateSettings({ showEducationalTips: checked })}
                />
              </div>
            </Card>

            {/* Mostrar Fórmulas */}
            <Card className="glass p-5">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="show-formulas" className="text-base font-medium">
                    Mostrar Fórmulas
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Exibir fórmulas nos resultados
                  </p>
                </div>
                <Switch
                  id="show-formulas"
                  checked={settings.showFormulas}
                  onCheckedChange={(checked) => updateSettings({ showFormulas: checked })}
                />
              </div>
            </Card>
          </div>
        </section>

        {/* Impressão e Exportação */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Printer className="w-5 h-5 text-primary" />
            <h2 className="text-2xl font-semibold text-foreground">Impressão e Exportação</h2>
          </div>

          <Card className="glass p-5">
            <div className="flex items-center justify-between">
              <div className="space-y-1 flex-1">
                <h3 className="text-lg font-semibold text-foreground">Configurações de PDF</h3>
                <p className="text-sm text-muted-foreground">
                  Personalize layout, margens e elementos dos documentos exportados
                </p>
                <div className="flex flex-wrap gap-2 text-xs text-muted-foreground mt-2">
                  <span>• {settings.printSettings.pageOrientation === "portrait" ? "Retrato" : "Paisagem"}</span>
                  <span>• Margens {settings.printSettings.pageMargins === "narrow" ? "estreitas" : settings.printSettings.pageMargins === "normal" ? "normais" : "amplas"}</span>
                  <span>• Papel {settings.printSettings.paperSize}</span>
                  {settings.printSettings.includeDate && <span>• Data</span>}
                  {settings.printSettings.includeFormulas && <span>• Fórmulas</span>}
                </div>
              </div>
              <Button
                variant="outline"
                onClick={() => setShowPrintDialog(true)}
                className="ml-4"
              >
                <Printer className="w-4 h-4 mr-2" />
                Configurar
              </Button>
            </div>
          </Card>
        </section>

        {/* Ajuda e Tutoriais */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-primary" />
            <h2 className="text-2xl font-semibold text-foreground">Ajuda e Tutoriais</h2>
          </div>

          <Card className="glass p-6">
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                      <HelpCircle className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <Label htmlFor="enable-tours" className="text-lg font-semibold cursor-pointer">
                        Tutoriais Interativos
                      </Label>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge
                          variant={toursEnabled ? "default" : "outline"}
                          className="text-xs"
                        >
                          {toursEnabled ? "✓ Ativos" : "✗ Desativados"}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground pl-12">
                    Guias interativos que explicam cada funcionalidade do sistema.
                    <span className="block mt-1 text-xs">
                      💡 <strong>Dica:</strong> Ao ativar, todos os tours serão reiniciados automaticamente.
                    </span>
                  </p>
                </div>
                <Switch
                  id="enable-tours"
                  checked={toursEnabled}
                  onCheckedChange={(checked) => {
                    setToursEnabled(checked);
                    if (checked) {
                      // Habilitar tours e reiniciar automaticamente
                      localStorage.removeItem("tours-globally-disabled");

                      // Limpar todos os tours vistos
                      const keys = Object.keys(localStorage).filter(key => key.startsWith("tour-seen-"));
                      keys.forEach(key => localStorage.removeItem(key));

                      toast.success("🎉 Tours habilitados e reiniciados!", {
                        description: "Os tutoriais aparecerão novamente em todos os módulos",
                      });
                    } else {
                      // Desabilitar tours
                      localStorage.setItem("tours-globally-disabled", "true");
                      toast.success("🔕 Tours desabilitados", {
                        description: "Os tutoriais não aparecerão mais",
                      });
                    }
                  }}
                />
              </div>
            </div>
          </Card>
        </section>

        {/* Gerenciamento de Dados */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-primary" />
            <h2 className="text-2xl font-semibold text-foreground">Gerenciamento de Dados</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Exportar Configurações */}
            <Card className="glass p-5">
              <div className="space-y-3">
                <h3 className="text-base font-medium text-foreground">Exportar Configurações</h3>
                <p className="text-sm text-muted-foreground">
                  Salve suas configurações em um arquivo
                </p>
                <Button
                  onClick={exportSettings}
                  variant="outline"
                  className="w-full"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Exportar
                </Button>
              </div>
            </Card>

            {/* Importar Configurações */}
            <Card className="glass p-5">
              <div className="space-y-3">
                <h3 className="text-base font-medium text-foreground">Importar Configurações</h3>
                <p className="text-sm text-muted-foreground">
                  Restaure configurações de um arquivo
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  onChange={handleImportSettings}
                  className="hidden"
                />
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  variant="outline"
                  className="w-full"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Importar
                </Button>
              </div>
            </Card>

            {/* Limpar Cálculos Salvos */}
            <Card className="glass p-5">
              <div className="space-y-3">
                <h3 className="text-base font-medium text-foreground">Limpar Cálculos</h3>
                <p className="text-sm text-muted-foreground">
                  Remove todos os cálculos salvos
                </p>
                <Button
                  onClick={() => setShowClearDialog(true)}
                  variant="outline"
                  className="w-full text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Limpar Tudo
                </Button>
              </div>
            </Card>

            {/* Resetar Configurações */}
            <Card className="glass p-5">
              <div className="space-y-3">
                <h3 className="text-base font-medium text-foreground">Resetar Configurações</h3>
                <p className="text-sm text-muted-foreground">
                  Restaurar valores padrão
                </p>
                <Button
                  onClick={() => setShowResetDialog(true)}
                  variant="outline"
                  className="w-full text-destructive hover:bg-destructive/10"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Resetar
                </Button>
              </div>
            </Card>
          </div>
        </section>

        {/* Informações e Resumo das Configurações */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="glass p-5 border-l-4 border-l-primary">
            <p className="text-sm text-muted-foreground">
              <strong className="text-foreground">Dica:</strong> As configurações são salvas automaticamente
              no seu navegador e serão mantidas nas próximas visitas.
            </p>
          </Card>

          <Card className="glass p-5 border-l-4 border-l-accent">
            <h3 className="text-sm font-semibold text-foreground mb-2">Configurações Ativas:</h3>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>• Tema: <span className="font-medium text-foreground capitalize">{themeColors.find(t => t.value === theme.color)?.label}</span> ({theme.mode === "dark" ? "escuro" : "claro"})</li>
              <li>• Casas decimais: <span className="font-medium text-foreground">{settings.decimalPlaces}</span></li>
              <li>• {settings.showEducationalTips ? "✓" : "✗"} Dicas educacionais {settings.showEducationalTips ? "ativas" : "desativadas"}</li>
              <li>• {settings.showFormulas ? "✓" : "✗"} Fórmulas {settings.showFormulas ? "visíveis" : "ocultas"}</li>
              <li>• {settings.reduceMotion ? "✓" : "✗"} Redução de animações {settings.reduceMotion ? "ativa" : "desativada"}</li>
              <li>• {settings.scientificNotation ? "✓" : "✗"} Notação científica {settings.scientificNotation ? "ativa" : "desativada"}</li>
            </ul>
          </Card>
        </div>

        {/* Dialog de Configurações de PDF */}
        <Dialog open={showPrintDialog} onOpenChange={(open) => {
          // Ao fechar o diálogo (clicando fora ou no X), mantém as configurações
          if (!open) {
            toast.success("Configurações de PDF salvas!", {
              description: "As alterações foram aplicadas com sucesso",
            });
          }
          setShowPrintDialog(open);
        }}>
          <DialogContent
            className="max-w-2xl max-h-[90vh] overflow-y-auto"
          >
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Printer className="w-5 h-5 text-primary" />
                Configurações de PDF
              </DialogTitle>
              <DialogDescription>
                Personalize como os documentos serão exportados em PDF
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {/* Layout do Documento */}
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-foreground">Layout do Documento</h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Orientação */}
                  <div className="space-y-2">
                    <Label htmlFor="dialog-orientation" className="text-sm font-medium">
                      Orientação
                    </Label>
                    <Select
                      value={settings.printSettings.pageOrientation}
                      onValueChange={(value: PageOrientation) =>
                        updateSettings({
                          printSettings: { ...settings.printSettings, pageOrientation: value }
                        })
                      }
                    >
                      <SelectTrigger id="dialog-orientation">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="portrait">Retrato (Vertical)</SelectItem>
                        <SelectItem value="landscape">Paisagem (Horizontal)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Tamanho do Papel */}
                  <div className="space-y-2">
                    <Label htmlFor="dialog-paper-size" className="text-sm font-medium">
                      Tamanho do Papel
                    </Label>
                    <Select
                      value={settings.printSettings.paperSize}
                      onValueChange={(value: PaperSize) =>
                        updateSettings({
                          printSettings: { ...settings.printSettings, paperSize: value }
                        })
                      }
                    >
                      <SelectTrigger id="dialog-paper-size">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="A4">A4 (210 × 297 mm)</SelectItem>
                        <SelectItem value="Letter">Letter (216 × 279 mm)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Margens */}
                <div className="space-y-2">
                  <Label htmlFor="dialog-margins" className="text-sm font-medium">
                    Margens
                  </Label>
                  <Select
                    value={settings.printSettings.pageMargins}
                    onValueChange={(value: PageMargins) =>
                      updateSettings({
                        printSettings: { ...settings.printSettings, pageMargins: value }
                      })
                    }
                  >
                    <SelectTrigger id="dialog-margins">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="narrow">Estreita (1.27 cm)</SelectItem>
                      <SelectItem value="normal">Normal (2.54 cm)</SelectItem>
                      <SelectItem value="wide">Ampla (3.81 cm)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Tema do PDF */}
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-foreground">Tema do PDF</h4>

                <div className="space-y-3">
                  {/* Usar Tema Dinâmico */}
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                    <div className="space-y-0.5">
                      <Label htmlFor="dialog-dynamic-theme" className="text-sm font-medium">
                        Usar Tema Atual
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        PDFs usarão o tema de cor atual do aplicativo
                      </p>
                    </div>
                    <Switch
                      id="dialog-dynamic-theme"
                      checked={settings.printSettings.useDynamicTheme}
                      onCheckedChange={(checked) =>
                        updateSettings({
                          printSettings: { ...settings.printSettings, useDynamicTheme: checked }
                        })
                      }
                    />
                  </div>

                  {/* Tema Fixo (quando não usar dinâmico) */}
                  {!settings.printSettings.useDynamicTheme && (
                    <div className="space-y-2">
                      <Label htmlFor="dialog-fixed-theme" className="text-sm font-medium">
                        Tema Fixo para PDFs
                      </Label>
                      <Select
                        value={settings.printSettings.fixedTheme || "indigo"}
                        onValueChange={(value) =>
                          updateSettings({
                            printSettings: { ...settings.printSettings, fixedTheme: value }
                          })
                        }
                      >
                        <SelectTrigger id="dialog-fixed-theme">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="indigo">Índigo Profundo</SelectItem>
                          <SelectItem value="soil">Terra Natural (Oficial)</SelectItem>
                          <SelectItem value="green">Verde Esmeralda</SelectItem>
                          <SelectItem value="amber">Âmbar Dourado</SelectItem>
                          <SelectItem value="red">Vermelho Coral</SelectItem>
                          <SelectItem value="slate">Minimalista</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              </div>

              {/* Elementos do Documento */}
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-foreground">Elementos do Documento</h4>

                <div className="space-y-3">
                  {/* Logo sempre incluído - informativo */}
                  <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-primary" />
                      <div className="space-y-0.5">
                        <Label className="text-sm font-medium text-foreground">
                          Logo EduSolos
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          O logo será sempre incluído no cabeçalho do PDF
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Incluir Data */}
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                    <div className="space-y-0.5">
                      <Label htmlFor="dialog-date" className="text-sm font-medium">
                        Incluir Data de Geração
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Adiciona data e hora no documento
                      </p>
                    </div>
                    <Switch
                      id="dialog-date"
                      checked={settings.printSettings.includeDate}
                      onCheckedChange={(checked) =>
                        updateSettings({
                          printSettings: { ...settings.printSettings, includeDate: checked }
                        })
                      }
                    />
                  </div>

                  {/* Título Personalizado */}
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                    <div className="space-y-0.5">
                      <Label htmlFor="dialog-custom-title" className="text-sm font-medium">
                        Título Personalizado do Relatório
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Permite adicionar um título personalizado ao exportar
                      </p>
                    </div>
                    <Switch
                      id="dialog-custom-title"
                      checked={settings.printSettings.includeCustomTitle}
                      onCheckedChange={(checked) =>
                        updateSettings({
                          printSettings: { ...settings.printSettings, includeCustomTitle: checked }
                        })
                      }
                    />
                  </div>

                  {/* Incluir Fórmulas - BLOQUEADO TEMPORARIAMENTE */}
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 opacity-60">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <Label htmlFor="dialog-formulas" className="text-sm font-medium">
                          Incluir Fórmulas
                        </Label>
                        <Badge variant="outline" className="text-xs">Em breve</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Mostra as fórmulas utilizadas nos cálculos
                      </p>
                    </div>
                    <Switch
                      id="dialog-formulas"
                      checked={settings.printSettings.includeFormulas}
                      onCheckedChange={(checked) =>
                        updateSettings({
                          printSettings: { ...settings.printSettings, includeFormulas: checked }
                        })
                      }
                      disabled
                    />
                  </div>
                </div>
              </div>

              {/* Preview */}
              <div className="space-y-2 p-4 rounded-lg bg-primary/5 border border-primary/20">
                <h4 className="text-sm font-semibold text-foreground">Preview</h4>
                <div className="flex items-center gap-4">
                  <div
                    className={cn(
                      "rounded border-2 border-primary/30 shadow-sm flex-shrink-0 bg-background",
                      settings.printSettings.pageOrientation === "portrait" ? "w-16 h-24" : "w-24 h-16"
                    )}
                  >
                    <div
                      className={cn(
                        "w-full h-full rounded-sm bg-primary/10",
                        settings.printSettings.pageMargins === "narrow" && "p-0.5",
                        settings.printSettings.pageMargins === "normal" && "p-1.5",
                        settings.printSettings.pageMargins === "wide" && "p-2.5"
                      )}
                    >
                      <div className="w-full h-full bg-primary/20 rounded-sm"></div>
                    </div>
                  </div>
                  <div className="flex-1 text-xs text-muted-foreground space-y-1">
                    <p>• Orientação: <span className="font-medium text-foreground">{settings.printSettings.pageOrientation === "portrait" ? "Retrato" : "Paisagem"}</span></p>
                    <p>• Papel: <span className="font-medium text-foreground">{settings.printSettings.paperSize}</span></p>
                    <p>• Margens: <span className="font-medium text-foreground">
                      {settings.printSettings.pageMargins === "narrow" ? "Estreitas" :
                        settings.printSettings.pageMargins === "normal" ? "Normais" : "Amplas"}
                    </span></p>
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  updateSettings({
                    printSettings: {
                      pageOrientation: "portrait",
                      pageMargins: "normal",
                      includeLogo: true,
                      includeDate: true,
                      includeFormulas: false,
                      paperSize: "A4",
                      useDynamicTheme: true,
                      fixedTheme: "indigo",
                      includeCustomTitle: false,
                    }
                  });
                  toast.success("Configurações de PDF restauradas para os valores padrão");
                }}
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Restaurar Padrão
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowPrintDialog(false)}
              >
                Fechar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialogs de Confirmação */}
        <AlertDialog open={showClearDialog} onOpenChange={setShowClearDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Limpar todos os cálculos?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta ação não pode ser desfeita. Todos os cálculos salvos serão permanentemente removidos.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleClearCalculations} className="bg-destructive hover:bg-destructive/90">
                Limpar Tudo
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog open={showResetDialog} onOpenChange={setShowResetDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Resetar configurações?</AlertDialogTitle>
              <AlertDialogDescription>
                Todas as configurações serão restauradas para os valores padrão. Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleResetSettings} className="bg-destructive hover:bg-destructive/90">
                Resetar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </TooltipProvider>
  );
}

// Wrapper principal que escolhe versão mobile ou desktop
export default function Settings() {
  return (
    <MobileModuleWrapper mobileVersion={<SettingsMobile />}>
      <SettingsDesktop />
    </MobileModuleWrapper>
  );
}

