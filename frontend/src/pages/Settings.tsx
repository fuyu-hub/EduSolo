import { Settings as SettingsIcon, Palette, Check, Calculator, Monitor, Eye, Database, Download, Upload, Trash2, RotateCcw, Zap } from "lucide-react";
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
import { UnitSystem, InterfaceDensity } from "@/contexts/SettingsContext";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useState, useRef } from "react";
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

export default function Settings() {
  const { theme, setThemeColor } = useTheme();
  const { settings, updateSettings, resetSettings, clearAllCalculations, exportSettings, importSettings } = useSettings();
  const [showClearDialog, setShowClearDialog] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);
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
            <p className="text-muted-foreground">Personalize sua experiência no EduSolo</p>
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
          
          {/* Seletor de Cores em Círculos */}
          <div className="flex flex-wrap items-center gap-4 p-6 rounded-xl bg-gradient-to-br from-background/50 to-muted/20 border border-border/50">
            {themeColors.map((themeOption) => {
              const isSelected = theme.color === themeOption.value;
              const primaryColor = themeOption.colors[0];
              
              return (
                <Tooltip key={themeOption.value}>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => setThemeColor(themeOption.value)}
                      className={cn(
                        "relative w-14 h-14 rounded-full transition-all duration-300 hover:scale-110",
                        "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary",
                        isSelected && "scale-110"
                      )}
                      style={{
                        backgroundColor: `hsl(${primaryColor})`,
                        boxShadow: isSelected 
                          ? `0 0 0 3px hsl(var(--background)), 0 0 0 5px hsl(${primaryColor}), 0 8px 24px -4px hsl(${primaryColor} / 0.5)`
                          : `0 4px 12px -2px hsl(${primaryColor} / 0.3)`,
                      }}
                      aria-label={`Selecionar tema ${themeOption.label}`}
                    >
                      {isSelected && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Check className="w-6 h-6 text-white drop-shadow-lg" strokeWidth={3} />
                        </div>
                      )}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="text-center">
                      <p className="font-semibold">{themeOption.label}</p>
                      <p className="text-xs text-muted-foreground">{themeOption.description}</p>
                    </div>
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </div>

          {/* Preview do Tema Selecionado */}
          <Card className="glass p-5 border-l-4 border-l-primary">
            <div className="flex items-start gap-4">
              <div 
                className="w-16 h-16 rounded-xl shadow-lg flex-shrink-0"
                style={{
                  background: `linear-gradient(135deg, hsl(${themeColors.find(t => t.value === theme.color)?.colors[0]}) 0%, hsl(${themeColors.find(t => t.value === theme.color)?.colors[2]}) 100%)`,
                }}
              />
              <div className="flex-1">
                <h4 className="text-base font-semibold text-foreground mb-1">
                  {themeColors.find(t => t.value === theme.color)?.label}
                </h4>
                <p className="text-sm text-muted-foreground mb-3">
                  {themeColors.find(t => t.value === theme.color)?.description}
                </p>
                {/* Mini paleta */}
                <div className="flex gap-1.5">
                  {themeColors.find(t => t.value === theme.color)?.colors.map((color, index) => (
                    <div
                      key={index}
                      className="w-8 h-8 rounded-md border-2 border-background shadow-sm"
                      style={{ backgroundColor: `hsl(${color})` }}
                      title={`Cor ${index + 1}`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </Card>
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

