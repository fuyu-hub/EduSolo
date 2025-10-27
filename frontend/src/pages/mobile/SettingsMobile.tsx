import { useState, useRef } from "react";
import { Settings as SettingsIcon, Palette, Check, Calculator, Monitor, Eye, Database, Download, Upload, Trash2, RotateCcw, Zap, Info, Printer, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTheme } from "@/hooks/use-theme";
import { useSettings } from "@/hooks/use-settings";
import { ThemeColor } from "@/contexts/ThemeContext";
import { UnitSystem, InterfaceDensity, PageOrientation, PageMargins, PaperSize } from "@/contexts/SettingsContext";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";
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
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  MobileSection,
} from "@/components/mobile";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface ThemeOption {
  value: ThemeColor;
  label: string;
  description: string;
  colors: string[];
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
    description: "Tema oficial EduSolo - tons terrosos vibrantes",
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

export default function SettingsMobile() {
  const { theme, setThemeColor } = useTheme();
  const { settings, updateSettings, resetSettings, clearAllCalculations, exportSettings, importSettings } = useSettings();
  const { toast } = useToast();
  const { toursEnabled, setToursEnabled } = useToursControl();
  
  const [showClearDialog, setShowClearDialog] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [themeSheetOpen, setThemeSheetOpen] = useState(false);
  const [printSheetOpen, setPrintSheetOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImportSettings = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      await importSettings(file);
      toast({
        title: "✅ Sucesso!",
        description: "Configurações importadas",
      });
    } catch (error) {
      toast({
        title: "❌ Erro",
        description: error instanceof Error ? error.message : "Erro ao importar",
        variant: "destructive",
      });
    }
    
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleClearCalculations = () => {
    clearAllCalculations();
    setShowClearDialog(false);
    toast({
      title: "🗑️ Limpo!",
      description: "Todos os cálculos foram removidos",
    });
  };

  const handleResetSettings = () => {
    resetSettings();
    setShowResetDialog(false);
    toast({
      title: "🔄 Resetado!",
      description: "Configurações restauradas ao padrão",
    });
  };

  const selectedTheme = themeColors.find(t => t.value === theme.color);

  return (
    <div className="space-y-4 pb-4">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-4 rounded-xl border border-primary/20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
            <SettingsIcon className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground">Configurações</h2>
            <p className="text-xs text-muted-foreground">Personalize sua experiência</p>
          </div>
        </div>
      </div>

      {/* Aparência */}
      <MobileSection
        title="Aparência"
        icon={<Palette className="w-4 h-4" />}
        defaultOpen={true}
      >
        {/* Nota sobre modo claro/escuro */}
        <div className="bg-primary/10 border border-primary/20 rounded-lg p-3 mb-4">
          <div className="flex items-start gap-2">
            <Info className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
            <p className="text-xs text-foreground">
              <strong>Dica:</strong> Use o botão no canto superior direito para alternar entre modo claro e escuro.
            </p>
          </div>
        </div>

        {/* Cores de Destaque */}
        <div className="space-y-3">
          <div>
            <Label className="text-sm font-semibold">Cores de Destaque</Label>
            <p className="text-xs text-muted-foreground mt-0.5">Escolha a cor principal do tema</p>
          </div>

          {/* Seletor de Cor Atual */}
          <button
            onClick={() => setThemeSheetOpen(true)}
            className="w-full p-4 rounded-xl bg-secondary/50 hover:bg-secondary border-2 border-primary/20 transition-all active:scale-95 text-left focus-visible:outline-none [-webkit-tap-highlight-color:transparent]"
          >
            <div className="flex items-center gap-3">
              <div 
                className="w-12 h-12 rounded-xl shadow-md flex-shrink-0"
                style={{
                  background: `linear-gradient(135deg, hsl(${selectedTheme?.colors[0]}) 0%, hsl(${selectedTheme?.colors[2]}) 100%)`,
                }}
              />
              <div className="flex-1">
                <h4 className="font-semibold text-foreground">{selectedTheme?.label}</h4>
                <p className="text-xs text-muted-foreground">{selectedTheme?.description}</p>
              </div>
              <Check className="w-5 h-5 text-primary" />
            </div>
          </button>
        </div>
      </MobileSection>

      {/* Cálculos */}
      <MobileSection
        title="Cálculos"
        icon={<Calculator className="w-4 h-4" />}
        defaultOpen={false}
        collapsible
      >
        {/* Casas Decimais */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Casas Decimais</Label>
          <p className="text-xs text-muted-foreground">Número de casas decimais nos resultados</p>
          <Select
            value={settings.decimalPlaces.toString()}
            onValueChange={(value) => updateSettings({ decimalPlaces: parseInt(value) })}
          >
            <SelectTrigger className="h-12 text-base">
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

        {/* Sistema de Unidades (Disabled) */}
        <div className="space-y-2 opacity-60">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Sistema de Unidades</Label>
            <Badge variant="outline" className="text-xs">Em breve</Badge>
          </div>
          <p className="text-xs text-muted-foreground">Unidades usadas nos cálculos</p>
          <Select
            value={settings.unitSystem}
            onValueChange={(value: UnitSystem) => updateSettings({ unitSystem: value })}
            disabled
          >
            <SelectTrigger className="h-12 text-base" disabled>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="SI">SI (kN/m³, kPa, m)</SelectItem>
              <SelectItem value="CGS">CGS (g/cm³, kg/cm²)</SelectItem>
              <SelectItem value="Imperial">Imperial (lb/ft³, psi)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Notação Científica */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-background/50 border border-border/50">
          <div className="flex-1 pr-3">
            <Label className="text-sm font-medium">Notação Científica</Label>
            <p className="text-xs text-muted-foreground mt-0.5">Valores muito grandes ou pequenos</p>
          </div>
          <Switch
            variant="ios"
            checked={settings.scientificNotation}
            onCheckedChange={(checked) => updateSettings({ scientificNotation: checked })}
          />
        </div>
      </MobileSection>

      {/* Interface */}
      <MobileSection
        title="Interface"
        icon={<Monitor className="w-4 h-4" />}
        defaultOpen={false}
        collapsible
      >
        {/* Densidade da Interface (Disabled) */}
        <div className="space-y-2 opacity-60">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Densidade da Interface</Label>
            <Badge variant="outline" className="text-xs">Em breve</Badge>
          </div>
          <p className="text-xs text-muted-foreground">Espaçamento entre elementos</p>
          <Select
            value={settings.interfaceDensity}
            onValueChange={(value: InterfaceDensity) => updateSettings({ interfaceDensity: value })}
            disabled
          >
            <SelectTrigger className="h-12 text-base" disabled>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="compact">Compacta</SelectItem>
              <SelectItem value="normal">Normal</SelectItem>
              <SelectItem value="comfortable">Espaçosa</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Reduzir Animações */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-background/50 border border-border/50">
          <div className="flex-1 pr-3">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-primary" />
              <Label className="text-sm font-medium">Reduzir Animações</Label>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">Desativar transições e animações</p>
          </div>
          <Switch
            variant="ios"
            checked={settings.reduceMotion}
            onCheckedChange={(checked) => updateSettings({ reduceMotion: checked })}
          />
        </div>
      </MobileSection>

      {/* Preferências de Exibição */}
      <MobileSection
        title="Preferências de Exibição"
        icon={<Eye className="w-4 h-4" />}
        defaultOpen={false}
        collapsible
      >
        {/* Dicas Educacionais */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-background/50 border border-border/50">
          <div className="flex-1 pr-3">
            <Label className="text-sm font-medium">Dicas Educacionais</Label>
            <p className="text-xs text-muted-foreground mt-0.5">Mostrar dicas e explicações</p>
          </div>
          <Switch
            variant="ios"
            checked={settings.showEducationalTips}
            onCheckedChange={(checked) => updateSettings({ showEducationalTips: checked })}
          />
        </div>

        {/* Mostrar Fórmulas */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-background/50 border border-border/50">
          <div className="flex-1 pr-3">
            <Label className="text-sm font-medium">Mostrar Fórmulas</Label>
            <p className="text-xs text-muted-foreground mt-0.5">Exibir fórmulas nos resultados</p>
          </div>
          <Switch
            variant="ios"
            checked={settings.showFormulas}
            onCheckedChange={(checked) => updateSettings({ showFormulas: checked })}
          />
        </div>
      </MobileSection>

      {/* Impressão e Exportação */}
      <MobileSection
        title="Impressão e Exportação"
        icon={<Printer className="w-4 h-4" />}
        defaultOpen={false}
      >
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-foreground">Configurações de PDF</h4>
          <p className="text-xs text-muted-foreground">
            Personalize layout, margens e elementos dos documentos exportados
          </p>
          <p className="text-xs text-muted-foreground">
            {settings.printSettings.pageOrientation === "portrait" ? "Retrato" : "Paisagem"} • 
            Margens {settings.printSettings.pageMargins === "narrow" ? "estreitas" : settings.printSettings.pageMargins === "normal" ? "normais" : "amplas"} • 
            {settings.printSettings.paperSize}
          </p>
          <Button
            onClick={() => setPrintSheetOpen(true)}
            variant="outline"
            className="w-full h-12 justify-start gap-2 focus-visible:ring-0 focus-visible:ring-offset-0 [-webkit-tap-highlight-color:transparent] active:scale-95 transition-transform"
          >
            <Printer className="w-4 h-4" />
            <span className="text-sm font-medium">Configurar PDF</span>
          </Button>
        </div>
      </MobileSection>

      {/* Ajuda e Tutoriais */}
      <MobileSection
        title="Ajuda e Tutoriais"
        icon={<HelpCircle className="w-4 h-4" />}
        defaultOpen={false}
        collapsible
      >
        <div className="space-y-3">
          {/* Card dos Tutoriais Interativos */}
          <div className="p-4 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
            <div className="flex items-start gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
                <HelpCircle className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <Label className="text-base font-semibold">Tutoriais Interativos</Label>
                  <Switch
                    variant="ios"
                    checked={toursEnabled}
                    onCheckedChange={(checked) => {
                      setToursEnabled(checked);
                      if (checked) {
                        // Habilitar tours e reiniciar automaticamente
                        localStorage.removeItem("tours-globally-disabled");
                        
                        // Limpar todos os tours vistos
                        const keys = Object.keys(localStorage).filter(key => key.startsWith("tour-seen-"));
                        keys.forEach(key => localStorage.removeItem(key));
                        
                        toast({
                          title: "🎉 Tours habilitados e reiniciados!",
                          description: "Os tutoriais aparecerão novamente em todos os módulos",
                        });
                      } else {
                        localStorage.setItem("tours-globally-disabled", "true");
                        toast({
                          title: "🔕 Tours desabilitados",
                          description: "Os tutoriais não aparecerão mais",
                        });
                      }
                    }}
                  />
                </div>
                <Badge 
                  variant={toursEnabled ? "default" : "outline"}
                  className="text-xs mb-2"
                >
                  {toursEnabled ? "✓ Ativos" : "✗ Desativados"}
                </Badge>
              </div>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Guias interativos que explicam cada funcionalidade do sistema.
            </p>
            <div className="mt-2 p-2 rounded bg-background/50 border border-border/30">
              <p className="text-xs text-muted-foreground">
                💡 <strong>Dica:</strong> Ao ativar, todos os tours serão reiniciados automaticamente.
              </p>
            </div>
          </div>
        </div>
      </MobileSection>

      {/* Gerenciamento de Dados */}
      <MobileSection
        title="Gerenciamento de Dados"
        icon={<Database className="w-4 h-4" />}
        defaultOpen={false}
        collapsible
      >
        <div className="space-y-3">
          {/* Exportar Configurações */}
          <Button
            onClick={exportSettings}
            variant="outline"
            className="w-full h-12 justify-start gap-2 focus-visible:ring-0 focus-visible:ring-offset-0 [-webkit-tap-highlight-color:transparent] active:scale-95 transition-transform"
          >
            <Download className="w-4 h-4" />
            <div className="text-left flex-1">
              <p className="text-sm font-medium">Exportar Configurações</p>
              <p className="text-xs text-muted-foreground">Salvar em arquivo</p>
            </div>
          </Button>

          {/* Importar Configurações */}
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
            className="w-full h-12 justify-start gap-2 focus-visible:ring-0 focus-visible:ring-offset-0 [-webkit-tap-highlight-color:transparent] active:scale-95 transition-transform"
          >
            <Upload className="w-4 h-4" />
            <div className="text-left flex-1">
              <p className="text-sm font-medium">Importar Configurações</p>
              <p className="text-xs text-muted-foreground">Restaurar de arquivo</p>
            </div>
          </Button>

          {/* Limpar Cálculos */}
          <Button
            onClick={() => setShowClearDialog(true)}
            variant="outline"
            className="w-full h-12 justify-start gap-2 text-destructive hover:bg-destructive/10 focus-visible:ring-0 focus-visible:ring-offset-0 [-webkit-tap-highlight-color:transparent] active:scale-95 transition-transform"
          >
            <Trash2 className="w-4 h-4" />
            <div className="text-left flex-1">
              <p className="text-sm font-medium">Limpar Cálculos Salvos</p>
              <p className="text-xs text-muted-foreground">Remove todos os cálculos</p>
            </div>
          </Button>

          {/* Resetar Configurações */}
          <Button
            onClick={() => setShowResetDialog(true)}
            variant="outline"
            className="w-full h-12 justify-start gap-2 text-destructive hover:bg-destructive/10 focus-visible:ring-0 focus-visible:ring-offset-0 [-webkit-tap-highlight-color:transparent] active:scale-95 transition-transform"
          >
            <RotateCcw className="w-4 h-4" />
            <div className="text-left flex-1">
              <p className="text-sm font-medium">Resetar Configurações</p>
              <p className="text-xs text-muted-foreground">Restaurar valores padrão</p>
            </div>
          </Button>
        </div>
      </MobileSection>

      {/* Informações */}
      <div className="space-y-3">
        <div className="bg-primary/10 border border-primary/20 rounded-lg p-3">
          <p className="text-xs text-foreground">
            <strong>Dica:</strong> As configurações são salvas automaticamente e mantidas nas próximas visitas.
          </p>
        </div>

        <div className="bg-card/50 backdrop-blur-sm rounded-lg border border-border/50 p-4">
          <h3 className="text-sm font-semibold text-foreground mb-2">Configurações Ativas:</h3>
          <ul className="text-xs text-muted-foreground space-y-1.5">
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              <span>Tema: <span className="font-medium text-foreground">{selectedTheme?.label}</span> ({theme.mode === "dark" ? "escuro" : "claro"})</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              <span>Casas decimais: <span className="font-medium text-foreground">{settings.decimalPlaces}</span></span>
            </li>
            <li className="flex items-start gap-2">
              <span className={settings.showEducationalTips ? "text-green-500" : "text-muted-foreground"}>
                {settings.showEducationalTips ? "✓" : "✗"}
              </span>
              <span>Dicas educacionais {settings.showEducationalTips ? "ativas" : "desativadas"}</span>
            </li>
            <li className="flex items-start gap-2">
              <span className={settings.showFormulas ? "text-green-500" : "text-muted-foreground"}>
                {settings.showFormulas ? "✓" : "✗"}
              </span>
              <span>Fórmulas {settings.showFormulas ? "visíveis" : "ocultas"}</span>
            </li>
            <li className="flex items-start gap-2">
              <span className={settings.reduceMotion ? "text-green-500" : "text-muted-foreground"}>
                {settings.reduceMotion ? "✓" : "✗"}
              </span>
              <span>Redução de animações {settings.reduceMotion ? "ativa" : "desativada"}</span>
            </li>
            <li className="flex items-start gap-2">
              <span className={settings.scientificNotation ? "text-green-500" : "text-muted-foreground"}>
                {settings.scientificNotation ? "✓" : "✗"}
              </span>
              <span>Notação científica {settings.scientificNotation ? "ativa" : "desativada"}</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Sheet de Seleção de Cores */}
      <Sheet open={themeSheetOpen} onOpenChange={setThemeSheetOpen}>
        <SheetContent side="bottom" className="h-[70vh] rounded-t-2xl">
          <SheetHeader>
            <SheetTitle>Escolha sua Cor</SheetTitle>
          </SheetHeader>
          <div className="mt-6 grid grid-cols-1 gap-4 overflow-y-auto max-h-[calc(70vh-100px)] pb-4 scrollbar-hide">
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
                  onClick={() => {
                    setThemeColor(themeOption.value);
                    setThemeSheetOpen(false);
                    toast({
                      title: `🎨 ${themeOption.label}`,
                      description: "Tema atualizado com sucesso!",
                    });
                  }}
                  className={cn(
                    "h-[100px] rounded-xl overflow-hidden transition-all duration-300 active:scale-95 focus-visible:outline-none [-webkit-tap-highlight-color:transparent]",
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
        </SheetContent>
      </Sheet>

      {/* Sheet de Configurações de PDF */}
      <Sheet open={printSheetOpen} onOpenChange={(open) => {
        // Ao fechar o sheet (arrastando para baixo ou clicando fora), mantém as configurações
        if (!open) {
          toast({
            title: "Configurações de PDF salvas!",
            description: "As alterações foram aplicadas com sucesso",
          });
        }
        setPrintSheetOpen(open);
      }}>
        <SheetContent side="bottom" className="h-[80vh] rounded-t-2xl px-4 py-6">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Printer className="w-5 h-5 text-primary" />
              Configurações de PDF
            </SheetTitle>
          </SheetHeader>
          <div className="mt-6 space-y-6 overflow-y-auto max-h-[calc(80vh-100px)] pb-4 px-2 scrollbar-hide">
            {/* Layout do Documento */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-foreground">Layout do Documento</h4>
              
              {/* Orientação */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Orientação</Label>
                <Select
                  value={settings.printSettings.pageOrientation}
                  onValueChange={(value: PageOrientation) => 
                    updateSettings({ 
                      printSettings: { ...settings.printSettings, pageOrientation: value } 
                    })
                  }
                >
                  <SelectTrigger className="h-12 text-base">
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
                <Label className="text-sm font-medium">Tamanho do Papel</Label>
                <Select
                  value={settings.printSettings.paperSize}
                  onValueChange={(value: PaperSize) => 
                    updateSettings({ 
                      printSettings: { ...settings.printSettings, paperSize: value } 
                    })
                  }
                >
                  <SelectTrigger className="h-12 text-base">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A4">A4 (210 × 297 mm)</SelectItem>
                    <SelectItem value="Letter">Letter (216 × 279 mm)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Margens */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Margens</Label>
                <Select
                  value={settings.printSettings.pageMargins}
                  onValueChange={(value: PageMargins) => 
                    updateSettings({ 
                      printSettings: { ...settings.printSettings, pageMargins: value } 
                    })
                  }
                >
                  <SelectTrigger className="h-12 text-base">
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
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-foreground">Tema do PDF</h4>
              
              {/* Usar Tema Dinâmico */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-background/50 border border-border/50">
                <div className="flex-1 pr-3">
                  <Label className="text-sm font-medium">Usar Tema Atual</Label>
                  <p className="text-xs text-muted-foreground mt-0.5">PDFs usarão o tema de cor atual do aplicativo</p>
                </div>
                <Switch
                  variant="ios"
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
                  <Label className="text-sm font-medium">Tema Fixo para PDFs</Label>
                  <Select
                    value={settings.printSettings.fixedTheme || "indigo"}
                    onValueChange={(value) => 
                      updateSettings({ 
                        printSettings: { ...settings.printSettings, fixedTheme: value } 
                      })
                    }
                  >
                    <SelectTrigger className="h-12 text-base">
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

            {/* Elementos do Documento */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-foreground">Elementos do Documento</h4>
              
              {/* Logo sempre incluído - informativo */}
              <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-primary" />
                  <div className="flex-1">
                    <Label className="text-sm font-medium text-foreground">Logo EduSolo</Label>
                    <p className="text-xs text-muted-foreground mt-0.5">O logo será sempre incluído no cabeçalho do PDF</p>
                  </div>
                </div>
              </div>

              {/* Incluir Data */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-background/50 border border-border/50">
                <div className="flex-1 pr-3">
                  <Label className="text-sm font-medium">Incluir Data</Label>
                  <p className="text-xs text-muted-foreground mt-0.5">Data e hora no documento</p>
                </div>
                <Switch
                  variant="ios"
                  checked={settings.printSettings.includeDate}
                  onCheckedChange={(checked) => 
                    updateSettings({ 
                      printSettings: { ...settings.printSettings, includeDate: checked } 
                    })
                  }
                />
              </div>

              {/* Título Personalizado */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-background/50 border border-border/50">
                <div className="flex-1 pr-3">
                  <Label className="text-sm font-medium">Título Personalizado</Label>
                  <p className="text-xs text-muted-foreground mt-0.5">Adicionar título ao exportar</p>
                </div>
                <Switch
                  variant="ios"
                  checked={settings.printSettings.includeCustomTitle}
                  onCheckedChange={(checked) => 
                    updateSettings({ 
                      printSettings: { ...settings.printSettings, includeCustomTitle: checked } 
                    })
                  }
                />
              </div>

              {/* Incluir Fórmulas - BLOQUEADO TEMPORARIAMENTE */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-background/50 border border-border/50 opacity-60">
                <div className="flex-1 pr-3">
                  <div className="flex items-center gap-2">
                    <Label className="text-sm font-medium">Incluir Fórmulas</Label>
                    <Badge variant="outline" className="text-xs">Em breve</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">Fórmulas utilizadas nos cálculos</p>
                </div>
                <Switch
                  variant="ios"
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
                  <p>• {settings.printSettings.pageOrientation === "portrait" ? "Retrato" : "Paisagem"}</p>
                  <p>• Papel {settings.printSettings.paperSize}</p>
                  <p>• Margens {settings.printSettings.pageMargins === "narrow" ? "estreitas" : settings.printSettings.pageMargins === "normal" ? "normais" : "amplas"}</p>
                </div>
              </div>
            </div>

            {/* Botão Restaurar Padrão */}
            <Button
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
                toast({
                  title: "🔄 Restaurado!",
                  description: "Configurações de PDF restauradas ao padrão",
                });
              }}
              variant="outline"
              className="w-full h-12 gap-2 focus-visible:ring-0 focus-visible:ring-offset-0 [-webkit-tap-highlight-color:transparent] active:scale-95 transition-transform"
            >
              <RotateCcw className="w-4 h-4" />
              Restaurar Padrão
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Dialog de Confirmação - Limpar Cálculos */}
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

      {/* Dialog de Confirmação - Resetar */}
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
  );
}

