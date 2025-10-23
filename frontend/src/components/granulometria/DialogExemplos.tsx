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
import { EXEMPLOS_GRANULOMETRIA, ExemploGranulometria } from "@/lib/exemplos-granulometria";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface DialogExemplosProps {
  onCarregarExemplo: (exemplo: ExemploGranulometria) => void;
}

export default function DialogExemplos({ onCarregarExemplo }: DialogExemplosProps) {
  const [open, setOpen] = useState(false);
  const [exemploSelecionado, setExemploSelecionado] = useState<ExemploGranulometria | null>(null);

  const handleCarregar = (exemplo: ExemploGranulometria) => {
    setExemploSelecionado(exemplo);
  };

  const confirmarCarregamento = () => {
    if (exemploSelecionado) {
      onCarregarExemplo(exemploSelecionado);
      setOpen(false);
      setExemploSelecionado(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Lightbulb className="w-4 h-4 mr-2" />
          Exemplos
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Exemplos de Análises Granulométricas</DialogTitle>
          <DialogDescription>
            Selecione um exemplo para carregar dados de ensaio prontos e testar o sistema
          </DialogDescription>
        </DialogHeader>

        {!exemploSelecionado ? (
          // Lista de exemplos
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            {EXEMPLOS_GRANULOMETRIA.map((exemplo) => (
              <Card
                key={exemplo.id}
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
                        {exemplo.classificacaoEsperada}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {exemplo.descricao}
                    </p>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <div>
                      <span className="font-medium">Massa:</span> {exemplo.massaTotal}g
                    </div>
                    <div>
                      <span className="font-medium">Peneiras:</span> {exemplo.peneiras.length}
                    </div>
                    {exemplo.ll && (
                      <div>
                        <span className="font-medium">LL:</span> {exemplo.ll}%
                      </div>
                    )}
                  </div>

                  {exemplo.observacoes && (
                    <p className="text-xs italic text-muted-foreground border-l-2 border-primary/30 pl-2">
                      {exemplo.observacoes}
                    </p>
                  )}
                </div>
              </Card>
            ))}
          </div>
        ) : (
          // Detalhes do exemplo selecionado
          <div className="space-y-4 mt-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold">{exemploSelecionado.nome}</h3>
                <p className="text-sm text-muted-foreground">
                  {exemploSelecionado.descricao}
                </p>
              </div>
              <Badge variant="default" className="text-base px-3 py-1">
                {exemploSelecionado.classificacaoEsperada}
              </Badge>
            </div>

            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Este exemplo carregará todos os dados automaticamente. Os dados atuais serão substituídos.
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="text-sm font-semibold">Dados Gerais</h4>
                <div className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Massa Total:</span>
                    <span className="font-medium">{exemploSelecionado.massaTotal} g</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Peneiras:</span>
                    <span className="font-medium">{exemploSelecionado.peneiras.length}</span>
                  </div>
                  {exemploSelecionado.ll && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">LL:</span>
                        <span className="font-medium">{exemploSelecionado.ll}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">LP:</span>
                        <span className="font-medium">{exemploSelecionado.lp}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">IP:</span>
                        <span className="font-medium">
                          {exemploSelecionado.ll && exemploSelecionado.lp 
                            ? (exemploSelecionado.ll - exemploSelecionado.lp) 
                            : 'N/A'}%
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-semibold">Peneiras Incluídas</h4>
                <div className="flex flex-wrap gap-1">
                  {exemploSelecionado.peneiras.slice(0, 8).map((p) => (
                    <Badge key={p.numero} variant="secondary" className="text-xs">
                      {p.numero}
                    </Badge>
                  ))}
                  {exemploSelecionado.peneiras.length > 8 && (
                    <Badge variant="secondary" className="text-xs">
                      +{exemploSelecionado.peneiras.length - 8}
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-muted/50 max-h-[200px] overflow-y-auto">
              <h4 className="text-sm font-semibold mb-2">Distribuição das Massas</h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {exemploSelecionado.peneiras.map((peneira) => (
                  <div key={peneira.numero} className="flex justify-between items-center">
                    <span className="text-muted-foreground">
                      {peneira.numero} ({peneira.aberturaMM.toFixed(3)}mm):
                    </span>
                    <span className="font-medium">{peneira.massaRetida.toFixed(2)}g</span>
                  </div>
                ))}
              </div>
            </div>

            {exemploSelecionado.observacoes && (
              <Alert>
                <AlertDescription className="text-sm">
                  <strong>Observações:</strong> {exemploSelecionado.observacoes}
                </AlertDescription>
              </Alert>
            )}

            <div className="flex gap-2 pt-4">
              <Button 
                onClick={confirmarCarregamento} 
                className="flex-1"
              >
                Carregar Este Exemplo
              </Button>
              <Button 
                onClick={() => setExemploSelecionado(null)} 
                variant="outline"
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

