import { useState, useRef } from "react";
import { Settings as SettingsIcon, Palette, Check, Calculator, Monitor, Eye, Database, Download, Upload, Trash2, RotateCcw, Zap, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTheme } from "@/hooks/use-theme";
import { useSettings } from "@/hooks/use-settings";
import { ThemeColor } from "@/contexts/ThemeContext";
import { UnitSystem, InterfaceDensity } from "@/contexts/SettingsContext";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";
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
    value: "soil",
    label: "Terra Natural",
    description: "Tema oficial EduSolo",
    colors: ["25 65% 58%", "25 65% 48%", "25 65% 38%", "99 78% 36%", "25 50% 33%"],
  },
  {
    value: "indigo",
    label: "Índigo Profundo",
    description: "Sofisticado e intenso",
    colors: ["238 84% 62%", "238 84% 52%", "238 84% 42%", "241 86% 36%", "244 88% 30%"],
  },
  {
    value: "blue",
    label: "Azul Céu",
    description: "Profissional e sereno",
    colors: ["200 98% 60%", "200 98% 50%", "200 98% 40%", "210 100% 35%", "215 100% 30%"],
  },
  {
    value: "cyan",
    label: "Ciano Água",
    description: "Fresco e luminoso",
    colors: ["189 94% 55%", "189 94% 45%", "189 94% 35%", "192 96% 30%", "195 98% 25%"],
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
    value: "orange",
    label: "Laranja Energia",
    description: "Vibrante e dinâmico",
    colors: ["24 95% 60%", "24 95% 50%", "24 95% 40%", "20 95% 35%", "16 95% 30%"],
  },
  {
    value: "red",
    label: "Vermelho Paixão",
    description: "Forte e determinado",
    colors: ["358 75% 59%", "358 75% 49%", "358 75% 39%", "0 78% 34%", "2 80% 29%"],
  },
  {
    value: "pink",
    label: "Rosa Coral",
    description: "Elegante e caloroso",
    colors: ["346 77% 60%", "346 77% 50%", "346 77% 40%", "350 80% 35%", "354 82% 30%"],
  },
  {
    value: "purple",
    label: "Roxo Vibrante",
    description: "Criativo e moderno",
    colors: ["262 83% 58%", "262 83% 48%", "262 83% 38%", "265 85% 32%", "268 88% 28%"],
  },
];

export default function SettingsMobile() {
  const { theme, setThemeColor } = useTheme();
  const { settings, updateSettings, resetSettings, clearAllCalculations, exportSettings, importSettings } = useSettings();
  const { toast } = useToast();
  
  const [showClearDialog, setShowClearDialog] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [themeSheetOpen, setThemeSheetOpen] = useState(false);
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
            checked={settings.showFormulas}
            onCheckedChange={(checked) => updateSettings({ showFormulas: checked })}
          />
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
          <div className="mt-6 space-y-3 overflow-y-auto max-h-[calc(70vh-100px)]">
            {themeColors.map((themeOption) => {
              const isSelected = theme.color === themeOption.value;
              
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
                    "w-full p-4 rounded-xl bg-secondary/50 hover:bg-secondary border-2 transition-all active:scale-95 text-left focus-visible:outline-none [-webkit-tap-highlight-color:transparent]",
                    isSelected ? "border-primary/50" : "border-transparent"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-14 h-14 rounded-xl shadow-md flex-shrink-0"
                      style={{
                        background: `linear-gradient(135deg, hsl(${themeOption.colors[0]}) 0%, hsl(${themeOption.colors[2]}) 100%)`,
                      }}
                    />
                    <div className="flex-1">
                      <h4 className="font-semibold text-foreground flex items-center gap-2">
                        {themeOption.label}
                        {isSelected && <Check className="w-4 h-4 text-primary" />}
                      </h4>
                      <p className="text-xs text-muted-foreground mt-0.5">{themeOption.description}</p>
                      
                      {/* Mini paleta */}
                      <div className="flex gap-1 mt-2">
                        {themeOption.colors.slice(0, 5).map((color, index) => (
                          <div
                            key={index}
                            className="w-5 h-5 rounded border border-background/50"
                            style={{ backgroundColor: `hsl(${color})` }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
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

