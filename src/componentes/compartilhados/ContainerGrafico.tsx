/**
 * ContainerGrafico — Wrapper universal para gráficos Recharts.
 * 
 * Centraliza: botões "Ampliar" e "Salvar JPG", dialog de visualização ampliada,
 * div oculta para captura de alta resolução, e estado vazio (empty state).
 * 
 * Cada componente de gráfico agora apenas renderiza os vetores Recharts
 * e passa para este container como `children` / `renderAmpliar` / `renderExportar`.
 */
import { ReactNode, useState, forwardRef, useImperativeHandle } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Maximize2, Download, BarChart3 } from "lucide-react";
import { exportChartAsImage, getChartImage } from "@/componentes/compartilhados/exportacao-grafico";

export interface ContainerGraficoRef {
  exportAsJPG: () => Promise<void>;
  getImageForExport: () => Promise<string | null>;
}

interface ContainerGraficoProps {
  /** ID único para exportação html2canvas (ex: "curva-compactacao-export") */
  exportId: string;
  /** Nome base do arquivo ao salvar JPG (ex: "grafico_compactacao") */
  exportFileName: string;
  /** Título do dialog de ampliação */
  dialogTitle?: string;
  /** Gráfico principal (tamanho normal). Recebe isDialog=false. */
  children: ReactNode;
  /** Gráfico versão dialog (ampliado). Se omitido, usa children. */
  renderAmpliar?: ReactNode;
  /** Gráfico versão exportação (alta resolução). Se omitido, usa renderAmpliar ou children. */
  renderExportar?: ReactNode;
  /** Se true, mostra o empty state ao invés do gráfico */
  vazio?: boolean;
  /** Mensagem do empty state (default: "Dados insuficientes") */
  mensagemVazio?: string;
  /** Descrição do empty state */
  descricaoVazio?: string;
  /** Conteúdo extra abaixo do gráfico (ex: legendas, cards de equação) */
  rodape?: ReactNode;
  /** Esconde os botões de ação (Ampliar/Salvar) */
  semAcoes?: boolean;
  /** Classes CSS extras no container raiz */
  className?: string;
}

const ContainerGrafico = forwardRef<ContainerGraficoRef, ContainerGraficoProps>(
  (
    {
      exportId,
      exportFileName,
      dialogTitle = "Gráfico Ampliado",
      children,
      renderAmpliar,
      renderExportar,
      vazio = false,
      mensagemVazio = "Dados Insuficientes",
      descricaoVazio = "Preencha os dados do ensaio para visualizar o gráfico.",
      rodape,
      semAcoes = false,
      className,
    },
    ref
  ) => {
    const [dialogOpen, setDialogOpen] = useState(false);

    const handleExportJPG = async () => {
      await exportChartAsImage(exportId, exportFileName);
    };

    const handleGetImage = async (): Promise<string | null> => {
      return await getChartImage(exportId, { scale: 2 });
    };

    useImperativeHandle(ref, () => ({
      exportAsJPG: handleExportJPG,
      getImageForExport: handleGetImage,
    }));

    // Conteúdo amplificado (dialog ou fallback para children)
    const conteudoAmpliar = renderAmpliar ?? children;
    // Conteúdo para exportação (export -> ampliar -> children)
    const conteudoExportar = renderExportar ?? conteudoAmpliar;

    if (vazio) {
      return (
        <div className="flex flex-col items-center justify-center h-[300px] p-8 text-center border-2 border-dashed rounded-lg bg-muted/5">
          <BarChart3 className="w-12 h-12 text-muted-foreground/20 mb-4" />
          <p className="text-sm font-medium text-muted-foreground mb-2">
            {mensagemVazio}
          </p>
          <p className="text-xs text-muted-foreground/70 max-w-sm">
            {descricaoVazio}
          </p>
        </div>
      );
    }

    return (
      <div className={className}>
        <div className="space-y-2 relative">
          {/* Barra de Ações */}
          {!semAcoes && (
            <div className="flex justify-end items-center mb-2">
              <div className="flex gap-2">
                <Button
                  onClick={handleExportJPG}
                  variant="outline"
                  size="sm"
                  className="gap-2"
                >
                  <Download className="w-4 h-4" />
                  Salvar JPG
                </Button>

                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2">
                      <Maximize2 className="w-4 h-4" />
                      Ampliar
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-5xl max-h-[90vh] w-full">
                    <DialogHeader>
                      <DialogTitle>{dialogTitle}</DialogTitle>
                    </DialogHeader>
                    <div className="w-full flex justify-center items-center p-2 bg-muted/10 rounded-lg">
                      <div className="w-full max-w-[1200px]">
                        {conteudoAmpliar}
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          )}

          {/* Gráfico Principal */}
          <div className="w-full rounded-xl border border-border shadow-sm overflow-hidden">
            {children}
          </div>

          {/* Rodapé (legendas, equações, etc) */}
          {rodape}

          {/* Gráfico Oculto para Exportação (alta resolução) */}
          <div
            style={{ position: "absolute", left: "-9999px", top: 0, width: "1000px" }}
            aria-hidden="true"
          >
            <div id={exportId} className="bg-white p-6">
              {conteudoExportar}
            </div>
          </div>
        </div>
      </div>
    );
  }
);

ContainerGrafico.displayName = "ContainerGrafico";

export default ContainerGrafico;
