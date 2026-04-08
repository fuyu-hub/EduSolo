import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Lightbulb, Info } from "lucide-react";
import { exemplosRecalque, ExemploRecalque } from "@/lib/exemplos/recalque-adensamento";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface DialogExemplosProps {
  onSelectExample: (example: ExemploRecalque) => void;
  disabled?: boolean;
}

export default function DialogExemplos({ onSelectExample, disabled }: DialogExemplosProps) {
  const [open, setOpen] = useState(false);
  const [exemploSelecionado, setExemploSelecionado] = useState<ExemploRecalque | null>(null);

  const handleCarregar = (exemplo: ExemploRecalque) => {
    setExemploSelecionado(exemplo);
  };

  const confirmarCarregamento = () => {
    if (exemploSelecionado) {
      onSelectExample(exemploSelecionado);
      setOpen(false);
      setExemploSelecionado(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" disabled={disabled}>
          <Lightbulb className="w-4 h-4 mr-2" />
          Exemplos
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Exemplos de Recalque por Adensamento</DialogTitle>
          <DialogDescription>
            Selecione um exemplo para carregar dados de perfil estratigráfico prontos e testar o sistema
          </DialogDescription>
        </DialogHeader>

        {!exemploSelecionado ? (
          // Lista de exemplos
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            {exemplosRecalque.map((exemplo, index) => {
              const aterrosPassado = exemplo.dados.camadasAterroPassado.reduce((sum, c) => sum + c.espessura, 0);
              const aterrosPresente = exemplo.dados.camadasAterroPresente.reduce((sum, c) => sum + c.espessura, 0);
              const aterrosFuturo = exemplo.dados.camadasAterroFuturo.reduce((sum, c) => sum + c.espessura, 0);
              const totalCamadas = exemplo.dados.perfil.camadas.length;
              const argilaEspessura = exemplo.dados.camadaArgila.espessura;
              const naRelativo = parseFloat(exemplo.dados.perfil.profundidadeNA) || 0;
              
              return (
                <Card
                  key={index}
                  className="p-4 cursor-pointer hover:bg-accent/50 transition-colors"
                  onClick={() => handleCarregar(exemplo)}
                >
                  <div className="space-y-3">
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h4 className="font-semibold text-sm leading-tight">
                          {exemplo.nome}
                        </h4>
                        <Badge variant="outline" className="shrink-0">
                          {exemplo.tipoAdensamento === "normalmenteAdensada" ? "Normalmente Adensada" : "Pré-Adensada"}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {exemplo.descricao}
                      </p>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <div>
                        <span className="font-medium">Argila:</span> {argilaEspessura}m
                      </div>
                      <div>
                        <span className="font-medium">Camadas:</span> {totalCamadas}
                      </div>
                      {naRelativo !== 0 && (
                        <div>
                          <span className="font-medium">NA:</span> {naRelativo > 0 ? '+' : ''}{naRelativo.toFixed(1)}m
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        ) : (
          // Detalhes do exemplo selecionado
          <div className="space-y-2 mt-2">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="text-base font-semibold">{exemploSelecionado.nome}</h3>
                <p className="text-xs text-muted-foreground">
                  {exemploSelecionado.descricao}
                </p>
              </div>
              <Badge variant="default" className="text-sm px-2 py-0.5">
                {exemploSelecionado.tipoAdensamento === "normalmenteAdensada" ? "Normalmente Adensada" : "Pré-Adensada"}
              </Badge>
            </div>

            <Alert className="py-2 [&>svg]:top-2">
              <Info className="h-3 w-3" />
              <AlertDescription className="text-xs">
                Este exemplo carregará todos os dados automaticamente. Os dados atuais serão substituídos.
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <h4 className="text-xs font-semibold">Camada de Argila</h4>
                <div className="text-xs space-y-0.5">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Espessura:</span>
                    <span className="font-medium">{exemploSelecionado.dados.camadaArgila.espessura} m</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">γ<sub>nat</sub>:</span>
                    <span className="font-medium">{exemploSelecionado.dados.camadaArgila.gamaNat?.toFixed(1) || 'N/A'} kN/m³</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">γ<sub>sat</sub>:</span>
                    <span className="font-medium">{exemploSelecionado.dados.camadaArgila.gamaSat?.toFixed(1) || 'N/A'} kN/m³</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Cc:</span>
                    <span className="font-medium">{exemploSelecionado.dados.camadaArgila.Cc}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Cr:</span>
                    <span className="font-medium">{exemploSelecionado.dados.camadaArgila.Cr}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">e₀:</span>
                    <span className="font-medium">{exemploSelecionado.dados.camadaArgila.e0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Cv:</span>
                    <span className="font-medium">{exemploSelecionado.dados.camadaArgila.Cv} m²/ano</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Base:</span>
                    <span className="font-medium">{exemploSelecionado.dados.camadaBase.drenante ? 'Drenante' : 'Não drenante'}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <h4 className="text-xs font-semibold">Perfil e Camadas</h4>
                <div className="text-xs space-y-0.5">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">NA (relativo):</span>
                    <span className="font-medium">
                      {parseFloat(exemploSelecionado.dados.perfil.profundidadeNA) > 0 ? '+' : ''}
                      {parseFloat(exemploSelecionado.dados.perfil.profundidadeNA)} m
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Aterro Passado:</span>
                    <span className="font-medium">{exemploSelecionado.dados.camadasAterroPassado.length} camadas</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Aterro Presente:</span>
                    <span className="font-medium">{exemploSelecionado.dados.camadasAterroPresente.length} camadas</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Aterro Futuro:</span>
                    <span className="font-medium">{exemploSelecionado.dados.camadasAterroFuturo.length} camadas</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Camadas Perfil:</span>
                    <span className="font-medium">{exemploSelecionado.dados.perfil.camadas.length}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-2 rounded-lg bg-muted/50 max-h-[120px] overflow-y-auto">
              <h4 className="text-xs font-semibold mb-1">Camadas de Aterro Futuro</h4>
              <div className="grid grid-cols-2 gap-1 text-[10px]">
                {exemploSelecionado.dados.camadasAterroFuturo.length > 0 ? (
                  exemploSelecionado.dados.camadasAterroFuturo.map((aterro, idx) => (
                    <div key={idx} className="flex justify-between items-center">
                      <span className="text-muted-foreground">{aterro.nome}:</span>
                      <span className="font-medium">{aterro.espessura}m (γ={aterro.gamaNat?.toFixed(1) || 'N/A'} kN/m³)</span>
                    </div>
                  ))
                ) : (
                  <span className="text-muted-foreground text-[10px]">Nenhuma camada adicional</span>
                )}
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button 
                onClick={confirmarCarregamento} 
                className="flex-1 h-9 text-sm"
              >
                Carregar Este Exemplo
              </Button>
              <Button 
                onClick={() => setExemploSelecionado(null)} 
                variant="outline"
                className="h-9 text-sm"
              >
                Voltar
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

