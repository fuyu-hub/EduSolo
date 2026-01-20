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
import { FileText, Info } from "lucide-react";
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
          <FileText className="w-4 h-4 mr-2" />
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
          // Lista de exemplos ou mensagem de vazio
          EXEMPLOS_GRANULOMETRIA.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FileText className="w-16 h-16 text-muted-foreground/30 mb-4" />
              <h3 className="text-lg font-medium text-muted-foreground mb-2">
                Ainda não há exemplos
              </h3>
              <p className="text-sm text-muted-foreground/70 max-w-sm">
                Os exemplos de análises granulométricas serão adicionados em breve.
              </p>
            </div>
          ) : (
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
          )
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
                {exemploSelecionado.classificacaoEsperada}
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
                <h4 className="text-xs font-semibold">Dados Gerais</h4>
                <div className="text-xs space-y-0.5">
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

              <div className="space-y-1">
                <h4 className="text-xs font-semibold">Peneiras Incluídas</h4>
                <div className="flex flex-wrap gap-1">
                  {exemploSelecionado.peneiras.slice(0, 8).map((p) => (
                    <Badge key={p.numero} variant="secondary" className="text-[10px] px-1.5 py-0">
                      {p.numero}
                    </Badge>
                  ))}
                  {exemploSelecionado.peneiras.length > 8 && (
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                      +{exemploSelecionado.peneiras.length - 8}
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            <div className="p-2 rounded-lg bg-muted/50 max-h-[120px] overflow-y-auto">
              <h4 className="text-xs font-semibold mb-1">Distribuição das Massas</h4>
              <div className="grid grid-cols-2 gap-1 text-[10px]">
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
              <Alert className="py-2">
                <AlertDescription className="text-xs">
                  <strong>Observações:</strong> {exemploSelecionado.observacoes}
                </AlertDescription>
              </Alert>
            )}

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

