import { Settings as SettingsIcon, Palette, Check, Calculator, Monitor, Eye, Database, Download, Upload, Trash2, RotateCcw, Zap } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
    value: "blue",
    label: "Azul",
    description: "Tema padrão com tons de azul céu",
    colors: ["200 98% 60%", "200 98% 50%", "200 98% 40%", "210 100% 35%"],
  },
  {
    value: "green",
    label: "Verde",
    description: "Tons de verde esmeralda",
    colors: ["142 76% 56%", "142 76% 46%", "142 76% 36%", "145 80% 30%"],
  },
  {
    value: "purple",
    label: "Roxo",
    description: "Tons de roxo vibrante",
    colors: ["262 83% 58%", "262 83% 48%", "262 83% 38%", "265 85% 32%"],
  },
  {
    value: "pink",
    label: "Rosa",
    description: "Tons de rosa coral",
    colors: ["346 77% 60%", "346 77% 50%", "346 77% 40%", "350 80% 35%"],
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

        {/* Temas */}
        <div className="space-y-3">
          <h3 className="text-lg font-medium text-foreground">Temas</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {themeColors.map((themeOption) => (
              <Card
                key={themeOption.value}
                className={cn(
                  "glass p-5 cursor-pointer transition-smooth hover:shadow-lg hover:shadow-primary/20 relative",
                  theme.color === themeOption.value && "ring-2 ring-primary"
                )}
                onClick={() => setThemeColor(themeOption.value)}
              >
                <div className="space-y-3">
                  {/* Informações */}
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <h4 className="text-base font-semibold text-foreground mb-1 flex items-center gap-2">
                        {themeOption.label}
                        {theme.color === themeOption.value && (
                          <Check className="w-4 h-4 text-primary" />
                        )}
                      </h4>
                      <p className="text-sm text-muted-foreground">{themeOption.description}</p>
                    </div>
                  </div>

                  {/* Paleta de Cores */}
                  <div className="flex gap-2">
                    {themeOption.colors.map((color, index) => (
                      <div
                        key={index}
                        className="flex-1 h-12 rounded-lg shadow-sm border border-border/50"
                        style={{ backgroundColor: `hsl(${color})` }}
                      />
                    ))}
                  </div>
                </div>
              </Card>
            ))}
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
          <Card className="glass p-5">
            <div className="space-y-3">
              <Label htmlFor="unit-system" className="text-base font-medium">
                Sistema de Unidades
              </Label>
              <p className="text-sm text-muted-foreground">
                Unidades usadas nos cálculos
              </p>
              <Select
                value={settings.unitSystem}
                onValueChange={(value: UnitSystem) => updateSettings({ unitSystem: value })}
              >
                <SelectTrigger id="unit-system">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SI">SI (kN/m³, kPa, m)</SelectItem>
                  <SelectItem value="CGS">CGS (g/cm³, kg/cm²)</SelectItem>
                  <SelectItem value="Imperial">Imperial (lb/ft³, psi)</SelectItem>
                </SelectContent>
              </Select>
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
          <Card className="glass p-5">
            <div className="space-y-3">
              <Label htmlFor="interface-density" className="text-base font-medium">
                Densidade da Interface
              </Label>
              <p className="text-sm text-muted-foreground">
                Espaçamento entre elementos
              </p>
              <Select
                value={settings.interfaceDensity}
                onValueChange={(value: InterfaceDensity) => updateSettings({ interfaceDensity: value })}
              >
                <SelectTrigger id="interface-density">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="compact">Compacta</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="comfortable">Espaçosa</SelectItem>
                </SelectContent>
              </Select>
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

      {/* Informações */}
      <Card className="glass p-5 border-l-4 border-l-primary">
        <p className="text-sm text-muted-foreground">
          <strong className="text-foreground">Dica:</strong> As configurações são salvas automaticamente
          no seu navegador e serão mantidas nas próximas visitas.
        </p>
      </Card>

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
  );
}

