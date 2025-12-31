import { Settings as SettingsIcon, Check, Calculator, Monitor, Eye, Database, Download, Upload, Trash2, RotateCcw, Zap, HelpCircle, Printer } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { useSettings } from "@/hooks/use-settings";
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

function SettingsDesktop() {
  const { settings, updateSettings, resetSettings, clearAllCalculations, exportSettings, importSettings } = useSettings();
  const { resetAllTours } = useToursControl();
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
            <h2 className="text-2xl font-semibold text-foreground">Tutoriais</h2>
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
                      <Label className="text-lg font-semibold">
                        Resetar Tutoriais
                      </Label>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground pl-12">
                    Ao acessar cada módulo pela primeira vez, você verá uma sugestão para
                    visualizar o tutorial interativo.
                    <span className="block mt-1 text-xs">
                      <strong>Dica:</strong> Clique no botão abaixo para resetar todos os tutoriais e vê-los novamente.
                    </span>
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => {
                    resetAllTours();
                    toast.success("Tutoriais resetados", {
                      description: "As sugestões de tutorial aparecerão novamente em todos os módulos",
                    });
                  }}
                >
                  Resetar Tutoriais
                </Button>
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

