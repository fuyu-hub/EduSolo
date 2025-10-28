import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Layers, Sparkles, ChevronDown } from "lucide-react";
import { 
  PENEIRAS_PADRAO, 
  TEMPLATES_PENEIRAS, 
  TemplateId,
  getPeneiraInfo,
  getCorTipo
} from "@/lib/peneiras-padrao";

interface PeneiraDado {
  abertura: string;
  massaRetida: string;
  peneira?: string;
}

interface SeletorPeneirasProps {
  peneiras: PeneiraDado[];
  onChange: (peneiras: PeneiraDado[]) => void;
}

export default function SeletorPeneiras({ peneiras, onChange }: SeletorPeneirasProps) {
  const [peneiraSelecionada, setPeneiraSelecionada] = useState<string>("");
  const [dialogTemplateOpen, setDialogTemplateOpen] = useState(false);
  const [popoverAberto, setPopoverAberto] = useState<number | null>(null);

  // Peneiras já adicionadas (aberturas)
  const aberturasPeneirasAdicionadas = peneiras
    .filter(p => p.abertura)
    .map(p => parseFloat(p.abertura));

  // Filtrar peneiras disponíveis (não adicionadas ainda)
  const peneirasDisponiveis = PENEIRAS_PADRAO.filter(p => 
    !aberturasPeneirasAdicionadas.some(a => Math.abs(a - p.aberturaMM) < 0.01)
  );

  const adicionarPeneira = () => {
    if (!peneiraSelecionada) return;

    const peneiraInfo = getPeneiraInfo(peneiraSelecionada);
    if (!peneiraInfo) return;

    // Verificar se já existe
    if (aberturasPeneirasAdicionadas.some(a => Math.abs(a - peneiraInfo.aberturaMM) < 0.01)) {
      return;
    }

    const novaPeneira: PeneiraDado = {
      abertura: peneiraInfo.aberturaMM.toString(),
      massaRetida: "",
      peneira: peneiraInfo.nome
    };

    // Adicionar e ordenar por abertura decrescente
    const novasPeneiras = [...peneiras, novaPeneira].sort((a, b) => 
      parseFloat(b.abertura || "0") - parseFloat(a.abertura || "0")
    );

    onChange(novasPeneiras);
    setPeneiraSelecionada("");
  };

  const removerPeneira = (index: number) => {
    const novasPeneiras = peneiras.filter((_, i) => i !== index);
    onChange(novasPeneiras);
  };

  const atualizarMassaRetida = (index: number, valor: string) => {
    const novasPeneiras = [...peneiras];
    novasPeneiras[index].massaRetida = valor;
    onChange(novasPeneiras);
  };

  const atualizarAbertura = (index: number, valor: string) => {
    const novasPeneiras = [...peneiras];
    novasPeneiras[index].abertura = valor;
    // Reordenar por abertura decrescente
    novasPeneiras.sort((a, b) => 
      parseFloat(b.abertura || "0") - parseFloat(a.abertura || "0")
    );
    onChange(novasPeneiras);
  };

  const trocarPeneira = (index: number, novoPeneiraNome: string) => {
    const peneiraInfo = getPeneiraInfo(novoPeneiraNome);
    if (!peneiraInfo) return;

    const novasPeneiras = [...peneiras];
    novasPeneiras[index].abertura = peneiraInfo.aberturaMM.toString();
    
    // Reordenar por abertura decrescente
    novasPeneiras.sort((a, b) => 
      parseFloat(b.abertura || "0") - parseFloat(a.abertura || "0")
    );
    
    onChange(novasPeneiras);
    setPopoverAberto(null);
  };

  const aplicarTemplate = (templateId: TemplateId) => {
    const template = TEMPLATES_PENEIRAS[templateId];
    
    const novasPeneiras: PeneiraDado[] = template.peneiras
      .map(numeroPeneira => {
        const info = getPeneiraInfo(numeroPeneira);
        if (!info) return null;
        return {
          abertura: info.aberturaMM.toString(),
          massaRetida: "",
          peneira: info.nome
        };
      })
      .filter(Boolean) as PeneiraDado[];

    // Ordenar por abertura decrescente
    novasPeneiras.sort((a, b) => parseFloat(b.abertura) - parseFloat(a.abertura));

    onChange(novasPeneiras);
    setDialogTemplateOpen(false);
  };

  const limparTodas = () => {
    onChange([]);
  };

  return (
    <div className="space-y-2">
      {/* Cabeçalho com ações */}
      <div className="flex items-center justify-between">
        <Label className="text-xs font-semibold">Peneiras Utilizadas</Label>
        <div className="flex gap-2">
          <Dialog open={dialogTemplateOpen} onOpenChange={setDialogTemplateOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="h-7 text-xs">
                <Sparkles className="w-3 h-3 mr-1.5" />
                Templates
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Templates de Peneiras</DialogTitle>
                <DialogDescription>
                  Selecione um conjunto pré-definido de peneiras
                </DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                {(Object.keys(TEMPLATES_PENEIRAS) as TemplateId[]).map(templateId => {
                  const template = TEMPLATES_PENEIRAS[templateId];
                  return (
                    <Card
                      key={templateId}
                      className="p-4 cursor-pointer hover:bg-accent/50 transition-colors"
                      onClick={() => aplicarTemplate(templateId)}
                    >
                      <h4 className="font-semibold mb-1">{template.nome}</h4>
                      <p className="text-sm text-muted-foreground mb-2">
                        {template.descricao}
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {template.peneiras.slice(0, 6).map(p => (
                          <Badge key={p} variant="secondary" className="text-xs">
                            {p}
                          </Badge>
                        ))}
                        {template.peneiras.length > 6 && (
                          <Badge variant="secondary" className="text-xs">
                            +{template.peneiras.length - 6}
                          </Badge>
                        )}
                      </div>
                    </Card>
                  );
                })}
              </div>
            </DialogContent>
          </Dialog>

          {peneiras.length > 0 && (
            <Button variant="ghost" size="sm" onClick={limparTodas} className="h-7 text-xs">
              <Trash2 className="w-3 h-3 mr-1.5" />
              Limpar
            </Button>
          )}
        </div>
      </div>

      {/* Adicionar nova peneira */}
      <div className="flex gap-2">
        <div className="flex-1">
          <Select value={peneiraSelecionada} onValueChange={setPeneiraSelecionada}>
            <SelectTrigger className="h-7 text-xs">
              <SelectValue placeholder="Selecione uma peneira..." />
            </SelectTrigger>
            <SelectContent className="max-h-[300px]">
              {/* Agrupar por tipo */}
              <div className="p-2">
                <div className="text-xs font-semibold text-muted-foreground mb-1 px-2">
                  PEDREGULHOS
                </div>
                {peneirasDisponiveis
                  .filter(p => p.tipo === 'pedregulho')
                  .map(peneira => (
                    <SelectItem key={peneira.numero} value={peneira.numero}>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{peneira.numero}</span>
                        <span className="text-muted-foreground text-sm">
                          ({peneira.aberturaMM.toFixed(2)} mm)
                        </span>
                      </div>
                    </SelectItem>
                  ))}
              </div>

              <div className="p-2 border-t">
                <div className="text-xs font-semibold text-muted-foreground mb-1 px-2">
                  AREIAS
                </div>
                {peneirasDisponiveis
                  .filter(p => p.tipo.includes('areia'))
                  .map(peneira => (
                    <SelectItem key={peneira.numero} value={peneira.numero}>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{peneira.numero}</span>
                        <span className="text-muted-foreground text-sm">
                          ({peneira.aberturaMM.toFixed(3)} mm)
                        </span>
                      </div>
                    </SelectItem>
                  ))}
              </div>

              <div className="p-2 border-t">
                <div className="text-xs font-semibold text-muted-foreground mb-1 px-2">
                  FINOS
                </div>
                {peneirasDisponiveis
                  .filter(p => p.tipo === 'finos')
                  .map(peneira => (
                    <SelectItem key={peneira.numero} value={peneira.numero}>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{peneira.numero}</span>
                        <span className="text-muted-foreground text-sm">
                          ({peneira.aberturaMM.toFixed(3)} mm)
                        </span>
                      </div>
                    </SelectItem>
                  ))}
              </div>
            </SelectContent>
          </Select>
        </div>
        <Button 
          onClick={adicionarPeneira} 
          disabled={!peneiraSelecionada}
          className="h-7 text-xs"
        >
          <Plus className="w-3 h-3 mr-1.5" />
          Adicionar
        </Button>
      </div>

      {/* Lista de peneiras adicionadas */}
      <div className="space-y-1.5 max-h-[350px] overflow-y-auto pr-1">
        {peneiras.length === 0 ? (
          <div className="text-center p-6 border-2 border-dashed rounded-lg">
            <Layers className="w-10 h-10 mx-auto text-muted-foreground/50 mb-2" />
            <p className="text-xs text-muted-foreground mb-1">
              Nenhuma peneira adicionada
            </p>
            <p className="text-[10px] text-muted-foreground">
              Use os templates ou adicione peneiras manualmente
            </p>
          </div>
        ) : (
          peneiras.map((peneira, index) => {
            const abertura = parseFloat(peneira.abertura || "0");
            const peneiraInfo = PENEIRAS_PADRAO.find(p => 
              Math.abs(p.aberturaMM - abertura) < 0.01
            );

            return (
              <div 
                key={index} 
                className="p-2 rounded-lg border bg-card hover:bg-accent/5 transition-colors"
              >
                <div className="flex items-start gap-2">
                  {/* Info e inputs da peneira */}
                  <div className="flex-1 grid grid-cols-2 gap-2">
                    {/* Seletor de Peneira com Popover */}
                    <div className="space-y-0.5">
                      <Label className="text-[10px]">
                        Peneira / Abertura (mm)
                      </Label>
                      {peneiraInfo ? (
                        <Popover 
                          open={popoverAberto === index} 
                          onOpenChange={(open) => setPopoverAberto(open ? index : null)}
                        >
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className={`h-7 text-xs px-2 w-full justify-between ${getCorTipo(peneiraInfo.tipo)}`}
                            >
                              <span className="flex items-center gap-2">
                                <span className="font-bold">{peneiraInfo.numero}</span>
                                <span className="text-muted-foreground text-[10px]">({peneiraInfo.aberturaMM.toFixed(3)} mm)</span>
                              </span>
                              <ChevronDown className="w-3 h-3" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-64 p-2" align="start">
                            <div className="space-y-1 max-h-[300px] overflow-y-auto">
                              <p className="text-xs font-semibold mb-2 px-2">Trocar peneira:</p>
                              
                              {/* Pedregulhos */}
                              <div className="space-y-1">
                                <p className="text-[10px] text-muted-foreground font-semibold px-2 pt-1">PEDREGULHOS</p>
                                {PENEIRAS_PADRAO
                                  .filter(p => p.tipo === 'pedregulho')
                                  .filter(p => !aberturasPeneirasAdicionadas.some(a => Math.abs(a - p.aberturaMM) < 0.01) || Math.abs(p.aberturaMM - abertura) < 0.01)
                                  .map(p => (
                                    <Button
                                      key={p.numero}
                                      variant="ghost"
                                      size="sm"
                                      className="w-full justify-start h-7 text-xs"
                                      onClick={() => trocarPeneira(index, p.numero)}
                                    >
                                      <Badge variant="secondary" className={`mr-2 text-[9px] ${getCorTipo(p.tipo)}`}>
                                        {p.numero}
                                      </Badge>
                                      <span className="text-muted-foreground">{p.aberturaMM.toFixed(2)} mm</span>
                                    </Button>
                                  ))}
                              </div>

                              {/* Areias */}
                              <div className="space-y-1 border-t pt-1">
                                <p className="text-[10px] text-muted-foreground font-semibold px-2">AREIAS</p>
                                {PENEIRAS_PADRAO
                                  .filter(p => p.tipo.includes('areia'))
                                  .filter(p => !aberturasPeneirasAdicionadas.some(a => Math.abs(a - p.aberturaMM) < 0.01) || Math.abs(p.aberturaMM - abertura) < 0.01)
                                  .map(p => (
                                    <Button
                                      key={p.numero}
                                      variant="ghost"
                                      size="sm"
                                      className="w-full justify-start h-7 text-xs"
                                      onClick={() => trocarPeneira(index, p.numero)}
                                    >
                                      <Badge variant="secondary" className={`mr-2 text-[9px] ${getCorTipo(p.tipo)}`}>
                                        {p.numero}
                                      </Badge>
                                      <span className="text-muted-foreground">{p.aberturaMM.toFixed(3)} mm</span>
                                    </Button>
                                  ))}
                              </div>

                              {/* Finos */}
                              <div className="space-y-1 border-t pt-1">
                                <p className="text-[10px] text-muted-foreground font-semibold px-2">FINOS</p>
                                {PENEIRAS_PADRAO
                                  .filter(p => p.tipo === 'finos')
                                  .filter(p => !aberturasPeneirasAdicionadas.some(a => Math.abs(a - p.aberturaMM) < 0.01) || Math.abs(p.aberturaMM - abertura) < 0.01)
                                  .map(p => (
                                    <Button
                                      key={p.numero}
                                      variant="ghost"
                                      size="sm"
                                      className="w-full justify-start h-7 text-xs"
                                      onClick={() => trocarPeneira(index, p.numero)}
                                    >
                                      <Badge variant="secondary" className={`mr-2 text-[9px] ${getCorTipo(p.tipo)}`}>
                                        {p.numero}
                                      </Badge>
                                      <span className="text-muted-foreground">{p.aberturaMM.toFixed(3)} mm</span>
                                    </Button>
                                  ))}
                              </div>
                            </div>
                          </PopoverContent>
                        </Popover>
                      ) : (
                        <div className="h-7 flex items-center text-xs text-muted-foreground px-2 border rounded">
                          Peneira desconhecida
                        </div>
                      )}
                    </div>

                    {/* Massa retida */}
                    <div className="space-y-0.5">
                      <Label htmlFor={`massa-${index}`} className="text-[10px]">
                        Massa Retida (g)
                      </Label>
                      <Input
                        id={`massa-${index}`}
                        type="number"
                        step="0.01"
                        value={peneira.massaRetida}
                        onChange={(e) => atualizarMassaRetida(index, e.target.value)}
                        placeholder="Ex: 150.00"
                        className="h-7 text-xs"
                      />
                    </div>
                  </div>

                  {/* Botão remover */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removerPeneira(index)}
                    className="h-7 w-7 p-0 mt-4"
                  >
                    <Trash2 className="w-3 h-3 text-destructive" />
                  </Button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Resumo compacto */}
      {peneiras.length > 0 && (
        <div className="p-2 rounded-lg bg-muted/50 text-xs">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">
              Peneiras: {peneiras.length}
            </span>
            <span className="text-muted-foreground">
              Com massa: {peneiras.filter(p => p.massaRetida && parseFloat(p.massaRetida) > 0).length}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

