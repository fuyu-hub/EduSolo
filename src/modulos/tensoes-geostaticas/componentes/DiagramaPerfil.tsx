/**
 * DiagramaPerfil — Visualização interativa do perfil estratigráfico
 * modulos/tensoes-geostaticas/componentes/DiagramaPerfil.tsx
 *
 * Renderiza camadas de solo seguindo estilo técnico P&B, colunas litológicas
 * com propriedades organizadas (γnat, γsat, h, K0) e layout limpo.
 */
import { useState, useRef, useLayoutEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Layers, Plus, Trash2, Download } from "lucide-react";
import html2canvas from "html2canvas";
import { Button } from "@/components/ui/button";
import DialogCamada from "./DialogCamada";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { CamadaSolo } from "../types";
import { HachurasDefs, RenderHachura, inferirHachura } from "./Hachuras";

interface NivelAguaInfo {
  profundidade: number;
  capilaridade?: number;
}

interface DiagramaPerfilProps {
  camadas: CamadaSolo[];
  onAddCamada?: (camada: Partial<CamadaSolo>) => void;
  onEditCamada?: (index: number, camada: Partial<CamadaSolo>) => void;
  onRemoveCamada?: (index: number) => void;
  interactive?: boolean;
}

export default function DiagramaPerfil({
  camadas,
  onAddCamada,
  onEditCamada,
  onRemoveCamada,
  interactive = false
}: DiagramaPerfilProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [camadaInicial, setCamadaInicial] = useState<Partial<CamadaSolo> | undefined>(undefined);
  const diagramRef = useRef<HTMLDivElement>(null);

  const exportarJPG = async () => {
    if (!diagramRef.current) return;

    try {
      const canvas = await html2canvas(diagramRef.current, {
        backgroundColor: "#ffffff",
        scale: 2,
        logging: false,
        useCORS: true
      });

      const link = document.createElement('a');
      link.download = `perfil-solo-${new Date().getTime()}.jpg`;
      link.href = canvas.toDataURL('image/jpeg', 0.9);
      link.click();
      toast.success("Perfil exportado com sucesso!");
    } catch (err) {
      console.error(err);
      toast.error("Erro ao exportar perfil");
    }
  };

  const handleAddClick = () => {
    setEditingIndex(null);
    setCamadaInicial(undefined);
    setDialogOpen(true);
  };

  const handleEditClick = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingIndex(index);
    setCamadaInicial(camadas[index]);
    setDialogOpen(true);
  };

  const handleConfirm = (data: Partial<CamadaSolo>) => {
    if (editingIndex !== null && onEditCamada) {
      onEditCamada(editingIndex, data);
    } else if (onAddCamada) {
      onAddCamada(data);
    }
  };

  if (!camadas || camadas.length === 0) {
    return (
      <Card className="glass border-primary/20 h-full flex flex-col">
        <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent py-3 flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <Layers className="w-5 h-5 text-primary" />
            Perfil do Solo
          </CardTitle>
          {interactive && onAddCamada && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleAddClick}
              className="h-8 gap-1.5 text-xs font-bold border-primary/30 hover:bg-primary/10"
            >
              <Plus className="w-4 h-4" />
              Adicionar
            </Button>
          )}
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center flex-1 text-muted-foreground p-12 text-center">
          <Layers className="w-16 h-16 mb-4 opacity-10" />
          <p className="text-lg font-medium mb-1">Perfil Vazio</p>
          <p className="text-sm max-w-[200px]">Comece adicionando camadas para visualizar o perfil do solo.</p>
        </CardContent>
        {interactive && (
          <DialogCamada
            open={dialogOpen}
            onOpenChange={setDialogOpen}
            onConfirm={handleConfirm}
            camadaInicial={camadaInicial}
            title={editingIndex !== null ? `Editar Camada ${editingIndex + 1}` : "Nova Camada"}
          />
        )}
      </Card>
    );
  }

  // Lógica de cálculo de cotas e alturas
  const niveisAgua: NivelAguaInfo[] = camadas
    .filter(c => c.profundidadeNA != null)
    .map(c => ({ profundidade: c.profundidadeNA as number, capilaridade: c.capilaridade || 0 }));

  const profundidadeTotal = camadas.reduce((sum, c) => sum + c.espessura, 0);

  // Fixar a renderização vertical permanentemente para anular bugs de stretch infinito do CSS
  const alturaMaximaPixels = 350;
  const escala = alturaMaximaPixels / profundidadeTotal;

  const cotasImportantes = new Set<number>();
  cotasImportantes.add(0);
  cotasImportantes.add(profundidadeTotal);

  let profAcum = 0;
  camadas.forEach((camada) => {
    profAcum += camada.espessura;
    if (profAcum < profundidadeTotal) {
      cotasImportantes.add(profAcum);
    }
  });

  niveisAgua.forEach(na => {
    if (na.profundidade > 0 && na.profundidade <= profundidadeTotal) {
      cotasImportantes.add(na.profundidade);
      if (na.capilaridade && na.capilaridade > 0) {
        const hcBase = na.profundidade - na.capilaridade;
        if (hcBase >= 0) {
          cotasImportantes.add(hcBase);
        }
      }
    }
  });

  const cotasOrdenadas = Array.from(cotasImportantes).sort((a, b) => a - b);

  return (
    <Card className="glass border-primary/20 h-full flex flex-col overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent py-3 rounded-t-lg shrink-0 flex flex-row items-center justify-between space-y-0">
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <Layers className="w-4 h-4 text-primary" />
          Perfil do Solo
        </CardTitle>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={exportarJPG}
            className="h-8 gap-2 text-xs"
          >
            <Download className="w-4 h-4" />
            Salvar JPG
          </Button>

          {interactive && onAddCamada && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleAddClick}
              className="h-8 gap-2 text-xs"
            >
              <Plus className="w-4 h-4" />
              Adicionar Camada
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-0 flex-1 flex flex-col bg-background min-h-0">
        <div className="flex-1 overflow-y-auto overflow-x-hidden w-full relative custom-scrollbar">
          <div className="w-full flex justify-center py-4 px-2">
            {/* Wrapper de exportação - fixado em fundo branco com borda sutíl */}
            <div
              ref={diagramRef}
              className="w-full max-w-2xl relative pl-[80px] pr-[16px] pt-[32px] pb-[32px] bg-white text-black shadow-sm rounded-sm shrink-0"
            >
              <HachurasDefs />

              {/* Box principal do diagrama */}
              <div
                className="relative border-t-2 border-l-2 border-r-2 border-black w-full z-10 box-content"
                style={{ height: alturaMaximaPixels + 'px' }}
              >

                {/* Marcadores de cota (Escala) à esquerda */}
                {cotasOrdenadas.map((cota, idx) => {
                  const posY = cota * escala;
                  const isLast = Math.abs(cota - profundidadeTotal) < EPSILON;
                  const offset = isLast ? 0 : -1;
                  return (
                    <div key={`cota-${idx}`} className="absolute left-0 w-0 h-0 z-20 pointer-events-none" style={{ top: `${posY + offset}px` }}>
                      {/* Texto da cota colado na linha e alinhado à esquerda */}
                      <div className="absolute left-[-60px] bottom-0 translate-y-[-2px] whitespace-nowrap">
                        <span className="text-xs font-bold text-black leading-none flex items-end">
                          {cota.toFixed(2)}m
                        </span>
                      </div>
                      {/* Linha horizontal conectando a cota ao box via SVG */}
                      <svg className="absolute right-[0px] w-[60px] h-[10px] overflow-visible" style={{ top: '-5px' }}>
                        <line x1="0" y1="5" x2="60" y2="5" stroke="black" strokeWidth="1.5" />
                      </svg>
                    </div>
                  );
                })}

                {/* Símbolo técnico de indicação de terreno natural (Topo) */}
                <div className="absolute top-[0px] w-[90px] sm:w-[120px] left-0 flex justify-center pointer-events-none z-20">
                  <svg className="text-black overflow-visible" width="50" height="15" viewBox="0 0 50 15">
                    {/* Par esquerdo (//) */}
                    <line x1="2" y1="13" x2="11" y2="0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    <line x1="10" y1="13" x2="19" y2="0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />

                    {/* Espaço central preservado */}

                    {/* Par direito (\\) */}
                    <line x1="40" y1="13" x2="31" y2="0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    <line x1="48" y1="13" x2="39" y2="0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </div>



                {/* Renderização das camadas preenchendo o diagrama */}
                {camadas.map((camada, index) => {
                  const altura = camada.espessura * escala;
                  const absTop = camadas.slice(0, index).reduce((acc, c) => acc + c.espessura * escala, 0);

                  return (
                    <div
                      key={index}
                      className={cn(
                        "absolute left-0 right-0 border-b-2 border-black group/layer flex",
                        interactive && "cursor-pointer hover:bg-black/5 transition-colors"
                      )}
                      style={{ top: `${absTop}px`, height: `${altura}px` }}
                      onClick={interactive ? (e) => handleEditClick(index, e) : undefined}
                    >
                      {/* Fundo de Hachuras (Preenchendo Toda a Camada) */}
                      <div className="absolute inset-0 w-full h-full pointer-events-none z-0 overflow-hidden opacity-60">
                        <RenderHachura hachura={camada.hachura || inferirHachura(camada.nome || "", camada.impermeavel)} />
                      </div>

                      {/* Coluna direita de Propriedades */}
                      <div className="flex-1 flex items-center justify-center text-black relative z-10 text-center">

                        {/* Wrapper Absoluto para não ser engolido ou esmagado por camadas finas */}
                        <div
                          className={cn(
                            "absolute left-1/2 top-1/2 -translate-y-1/2 -translate-x-1/2 flex flex-col items-center justify-center z-[60] transition-all w-full px-2"
                          )}
                          style={{
                            filter: "drop-shadow(0px 0px 1.5px white) drop-shadow(0px 0px 1.5px white) drop-shadow(0px 0px 1.5px white) drop-shadow(0px 0px 1.5px white)"
                          }}
                        >

                          {/* Nome da camada */}
                          <div className={cn("font-bold max-w-full truncate text-center", altura < 50 ? "text-xs mb-0" : "text-sm md:text-base mb-3")}>
                            {camada.nome || `Camada ${index + 1}`}
                          </div>

                          {/* Grade de Propriedades */}
                          {altura >= 80 ? (
                            <div className="flex w-full justify-center gap-12 md:gap-32 text-sm font-semibold">
                              <div className="flex flex-col gap-1.5 items-start">
                                {camada.gamaNat && <div><span className="font-serif italic font-bold">γ</span><sub>nat</sub> = {camada.gamaNat} kN/m³</div>}
                                {camada.gamaSat && <div><span className="font-serif italic font-bold">γ</span><sub>sat</sub> = {camada.gamaSat} kN/m³</div>}
                              </div>
                              <div className="flex flex-col gap-1.5 items-start">
                                <div><span className="font-serif italic font-bold">h</span> = {camada.espessura} m</div>
                                {camada.Ko != null && <div><span className="font-serif italic font-bold">K</span><sub>0</sub> = {camada.Ko}</div>}
                              </div>
                            </div>
                          ) : altura >= 45 ? (
                            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-1 text-xs font-semibold">
                              {camada.gamaNat && <div><span className="font-serif italic font-bold">γ</span><sub>nat</sub> = {camada.gamaNat}</div>}
                              <div><span className="font-serif italic font-bold">h</span> = {camada.espessura}m</div>
                              {camada.gamaSat && <div><span className="font-serif italic font-bold">γ</span><sub>sat</sub> = {camada.gamaSat}</div>}
                              {camada.Ko != null && <div><span className="font-serif italic font-bold">K</span><sub>0</sub> = {camada.Ko}</div>}
                            </div>
                          ) : (
                            <div className="flex flex-wrap items-center justify-center gap-x-3 text-[10px] md:text-[11px] font-bold">
                              {camada.gamaNat && <div><span className="font-serif italic font-bold text-[11px]">γ</span><sub>nat</sub>={camada.gamaNat}</div>}
                              {camada.gamaSat && <div><span className="font-serif italic font-bold text-[11px]">γ</span><sub>sat</sub>={camada.gamaSat}</div>}
                              <div><span className="font-serif italic font-bold text-[11px]">h</span>={camada.espessura}m</div>
                              {camada.Ko != null && <div><span className="font-serif italic font-bold text-[11px]">K</span><sub>0</sub>={camada.Ko}</div>}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Botão remover */}
                      {interactive && onRemoveCamada && (
                        <button
                          type="button"
                          className="absolute top-2 right-2 opacity-0 group-hover/layer:opacity-100 transition-opacity bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded-md p-1.5 z-20 shadow-sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            onRemoveCamada(index);
                          }}
                          title={`Remover ${camada.nome || `Camada ${index + 1}`}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  );
                })}

                {/* Camadas Níveis D'água (Absolutas por cima do grid) */}
                {niveisAgua.map((na, idx) => {
                  if (na.profundidade <= 0 || na.profundidade >= profundidadeTotal) return null;
                  const posY = na.profundidade * escala;
                  const hc = na.capilaridade || 0;
                  const alturaCapilarPixels = hc * escala;

                  return (
                    <div key={`na-${idx}`} className="absolute left-0 w-full pointer-events-none z-20" style={{ top: `${posY - 1}px` }}>

                      {/* --- REPRESENTAÇÃO DA CAPILARIDADE --- */}
                      {hc > 0 && (
                        <div className="absolute left-0 w-full" style={{ bottom: '0px', height: `${alturaCapilarPixels}px` }}>

                          {/* Fundo de Saturação Capilar*/}
                          <div className="absolute inset-0 bg-blue-400/20 mix-blend-multiply" />

                          {/* Teto do nível tático da capilaridade (Linha Fina Azul) */}
                          <div className="absolute top-0 w-full h-0 border-t border-dashed border-[#0096FF]/60" />

                          {/* Etiqueta + Cota Lateral na Direita */}
                          <div className="absolute top-0 w-[90px] sm:w-[120px] right-[4px] flex flex-col items-center justify-end h-full">

                            <div className="relative w-full h-full">
                              {/* Linha vertical de cota técnica */}
                              <svg className="absolute left-1/2 -translate-x-1/2 top-0 h-full w-[40px]" preserveAspectRatio="none">
                                {/* Ticks base e topo (traços horizontais de limite) */}
                                <line x1="14" y1="1" x2="26" y2="1" stroke="black" strokeWidth="1.5" />
                                <line x1="14" y1="calc(100% - 1px)" x2="26" y2="calc(100% - 1px)" stroke="black" strokeWidth="1.5" />

                                {/* Linha Mestra Sólida */}
                                <line x1="20" y1="0" x2="20" y2="100%" stroke="black" strokeWidth="1.5" />
                              </svg>

                              {/* Texto Solto da Cota Técnica */}
                              <div className="absolute top-1/2 -translate-y-1/2 left-1/2 translate-x-[6px] text-black leading-none mb-0 whitespace-nowrap z-30">
                                <span className="text-[11px] font-bold tracking-tight">hc = {hc.toFixed(2)}m</span>
                              </div>
                            </div>

                          </div>
                        </div>
                      )}

                      {/* Container geral para o Nível D'água na esquerda */}
                      <div className="absolute left-0 w-[90px] sm:w-[120px] h-0">

                        {/* Text (Fundo Branco com quinas vivas) */}
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-[32px] z-10 flex">
                          <span className="bg-white text-[#0096FF] text-[13px] font-black leading-none px-1.5 py-[3px] ring-2 ring-white">
                            {niveisAgua.length > 1 ? `NA ${idx + 1}` : 'NA'}
                          </span>
                        </div>

                        {/* Triângulo SVG (Com stroke branco nativo rigoroso) */}
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-full pb-[1px] z-10">
                          <svg width="18" height="15" viewBox="0 0 18 15" className="overflow-visible">
                            <polygon points="1,1 17,1 9,14" fill="#0096FF" stroke="white" strokeWidth="2.5" strokeLinejoin="miter" />
                          </svg>
                        </div>

                        {/* Linhas Tracejadas (Usando SVG para traços grossos, espaçados e sem aura) */}
                        <div className="relative w-full h-[20px] top-[0px] z-0">
                          {/* Linha Principal Larga */}
                          <svg className="absolute top-[0px] left-0 w-full h-[3px] overflow-visible -translate-y-[1px]">
                            <line x1="0" y1="1.5" x2="100%" y2="1.5" stroke="#0096FF" strokeWidth="2.5" strokeDasharray="9,6" />
                          </svg>
                          {/* Escadinha (Média) */}
                          <svg className="absolute top-[5px] left-1/2 -translate-x-1/2 w-[35px] h-[3px] overflow-visible">
                            <line x1="0" y1="1.5" x2="35" y2="1.5" stroke="#0096FF" strokeWidth="2.5" strokeDasharray="9,6" />
                          </svg>
                          {/* Escadinha (Curta) */}
                          <svg className="absolute top-[11px] left-1/2 -translate-x-1/2 w-[15px] h-[3px] overflow-visible">
                            <line x1="0" y1="1.5" x2="15" y2="1.5" stroke="#0096FF" strokeWidth="2.5" strokeDasharray="9,6" />
                          </svg>
                        </div>

                      </div>

                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {interactive && (
          <DialogCamada
            open={dialogOpen}
            onOpenChange={setDialogOpen}
            onConfirm={handleConfirm}
            camadaInicial={camadaInicial}
            title={editingIndex !== null ? `Editar Camada ${editingIndex + 1}` : "Nova Camada"}
          />
        )}
      </CardContent>
    </Card>
  );
}

const EPSILON = 1e-4;
