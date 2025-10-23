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
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Layers, Sparkles } from "lucide-react";
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
}

interface SeletorPeneirasProps {
  peneiras: PeneiraDado[];
  onChange: (peneiras: PeneiraDado[]) => void;
}

export default function SeletorPeneiras({ peneiras, onChange }: SeletorPeneirasProps) {
  const [peneiraSelecionada, setPeneiraSelecionada] = useState<string>("");
  const [dialogTemplateOpen, setDialogTemplateOpen] = useState(false);

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
      massaRetida: ""
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

  const aplicarTemplate = (templateId: TemplateId) => {
    const template = TEMPLATES_PENEIRAS[templateId];
    
    const novasPeneiras: PeneiraDado[] = template.peneiras
      .map(numeroPeneira => {
        const info = getPeneiraInfo(numeroPeneira);
        if (!info) return null;
        return {
          abertura: info.aberturaMM.toString(),
          massaRetida: ""
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
    <div className="space-y-4">
      {/* Cabeçalho com ações */}
      <div className="flex items-center justify-between">
        <Label className="text-sm font-semibold">Peneiras Utilizadas</Label>
        <div className="flex gap-2">
          <Dialog open={dialogTemplateOpen} onOpenChange={setDialogTemplateOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Sparkles className="w-4 h-4 mr-2" />
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
            <Button variant="ghost" size="sm" onClick={limparTodas}>
              <Trash2 className="w-4 h-4 mr-2" />
              Limpar
            </Button>
          )}
        </div>
      </div>

      {/* Adicionar nova peneira */}
      <div className="flex gap-2">
        <div className="flex-1">
          <Select value={peneiraSelecionada} onValueChange={setPeneiraSelecionada}>
            <SelectTrigger>
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
        >
          <Plus className="w-4 h-4 mr-2" />
          Adicionar
        </Button>
      </div>

      {/* Lista de peneiras adicionadas */}
      <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
        {peneiras.length === 0 ? (
          <div className="text-center p-8 border-2 border-dashed rounded-lg">
            <Layers className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-sm text-muted-foreground mb-2">
              Nenhuma peneira adicionada
            </p>
            <p className="text-xs text-muted-foreground">
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
                className="p-3 rounded-lg border bg-card hover:bg-accent/5 transition-colors"
              >
                <div className="flex items-start gap-3">
                  {/* Info da peneira */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge 
                        variant="secondary" 
                        className={peneiraInfo ? getCorTipo(peneiraInfo.tipo) : ""}
                      >
                        {peneiraInfo?.numero || `${abertura.toFixed(3)} mm`}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {abertura.toFixed(3)} mm
                      </span>
                    </div>

                    {/* Input de massa retida */}
                    <div className="space-y-1">
                      <Label htmlFor={`massa-${index}`} className="text-xs">
                        Massa Retida (g)
                      </Label>
                      <Input
                        id={`massa-${index}`}
                        type="number"
                        step="0.01"
                        value={peneira.massaRetida}
                        onChange={(e) => atualizarMassaRetida(index, e.target.value)}
                        placeholder="Ex: 150.00"
                        className="h-9"
                      />
                    </div>
                  </div>

                  {/* Botão remover */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removerPeneira(index)}
                    className="h-8 w-8 p-0 mt-6"
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Resumo */}
      {peneiras.length > 0 && (
        <div className="p-3 rounded-lg bg-muted/50 text-sm">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">
              Peneiras adicionadas:
            </span>
            <span className="font-semibold">{peneiras.length}</span>
          </div>
          <div className="flex justify-between items-center mt-1">
            <span className="text-muted-foreground">
              Peneiras com massa:
            </span>
            <span className="font-semibold">
              {peneiras.filter(p => p.massaRetida && parseFloat(p.massaRetida) > 0).length}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

