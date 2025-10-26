// frontend/src/components/tensoes/DiagramaCamadas.tsx
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Layers, Plus, Edit2 } from "lucide-react";
import DialogCamada, { CamadaData } from "./DialogCamada";
import { cn } from "@/lib/utils";

interface CamadaInfo {
  nome?: string;
  espessura: number;
  profundidadeNA?: number | null;
  capilaridade?: number | null;
  gamaNat?: number | null;
  gamaSat?: number | null;
  Ko?: number;
  impermeavel?: boolean;
}

// Função para retornar cor de texto (sempre escura)
function getCorTexto(corHex: string): string {
  return '#1f2937'; // Sempre texto escuro
}

// Função para misturar duas cores hex
function misturarCores(cor1: string, cor2: string, percentualCor1: number): string {
  const hex1 = cor1.replace('#', '');
  const hex2 = cor2.replace('#', '');
  
  const r1 = parseInt(hex1.substring(0, 2), 16);
  const g1 = parseInt(hex1.substring(2, 4), 16);
  const b1 = parseInt(hex1.substring(4, 6), 16);
  
  const r2 = parseInt(hex2.substring(0, 2), 16);
  const g2 = parseInt(hex2.substring(2, 4), 16);
  const b2 = parseInt(hex2.substring(4, 6), 16);
  
  const r = Math.round(r1 * percentualCor1 + r2 * (1 - percentualCor1));
  const g = Math.round(g1 * percentualCor1 + g2 * (1 - percentualCor1));
  const b = Math.round(b1 * percentualCor1 + b2 * (1 - percentualCor1));
  
  return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

// Paleta de cores de solo realistas (fora da função para manter consistência)
const CORES_SOLO = [
  { bg: "#d9bc8c", border: "#a67c52" }, // Areia amarelada
  { bg: "#c4a57b", border: "#8b7355" }, // Areia marrom-claro
  { bg: "#b8a99a", border: "#6b5d50" }, // Argila cinza-marrom
  { bg: "#d4c5b9", border: "#9c8b7e" }, // Silte bege claro
  { bg: "#b8956a", border: "#8b6f47" }, // Argila marrom
  { bg: "#9c7a5e", border: "#6b4423" }, // Argila marrom-escuro
  { bg: "#c9b89a", border: "#a08968" }, // Solo arenoso claro
  { bg: "#a89080", border: "#7d6b5c" }, // Solo argiloso médio
  { bg: "#8b7968", border: "#5d4e3f" }, // Solo compacto escuro
  { bg: "#d6c3a8", border: "#b39a7d" }, // Areia fina clara
];

// Função para gerar número pseudo-aleatório determinístico
function seededRandom(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

interface NivelAgua {
  profundidade: number;
  capilaridade?: number;
  index?: number;
}

interface DiagramaCamadasProps {
  camadas: CamadaInfo[];
  profundidadeNA: number;
  alturaCapilar?: number;
  niveisAgua?: NivelAgua[];
  onAddCamada?: (camada: CamadaData) => void;
  onEditCamada?: (index: number, camada: CamadaData) => void;
  interactive?: boolean;
}

export default function DiagramaCamadas({ 
  camadas, 
  profundidadeNA, 
  alturaCapilar = 0,
  niveisAgua,
  onAddCamada,
  onEditCamada,
  interactive = false
}: DiagramaCamadasProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [camadaInicial, setCamadaInicial] = useState<CamadaData | undefined>(undefined);

  const handleAddClick = () => {
    setEditingIndex(null);
    setCamadaInicial(undefined);
    setDialogOpen(true);
  };

  const handleEditClick = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const camada = camadas[index];
    setEditingIndex(index);
    setCamadaInicial({
      nome: camada.nome || `Camada ${index + 1}`,
      espessura: camada.espessura.toString(),
      profundidadeNA: camada.profundidadeNA !== null && camada.profundidadeNA !== undefined ? camada.profundidadeNA.toString() : "",
      capilaridade: camada.capilaridade !== null && camada.capilaridade !== undefined ? camada.capilaridade.toString() : "",
      gamaNat: camada.gamaNat !== null && camada.gamaNat !== undefined ? camada.gamaNat.toString() : "",
      gamaSat: camada.gamaSat !== null && camada.gamaSat !== undefined ? camada.gamaSat.toString() : "",
      Ko: camada.Ko !== undefined ? camada.Ko.toString() : "0.5",
      impermeavel: camada.impermeavel || false,
    });
    setDialogOpen(true);
  };

  const handleConfirm = (data: CamadaData) => {
    if (editingIndex !== null && onEditCamada) {
      onEditCamada(editingIndex, data);
    } else if (onAddCamada) {
      onAddCamada(data);
    }
  };
  if (!camadas || camadas.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Layers className="w-5 h-5 text-primary" />
            Perfil Estratigráfico
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            Adicione camadas para visualizar o perfil
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calcula profundidade total e normalizações
  const profundidadeTotal = camadas.reduce((sum, c) => sum + c.espessura, 0);
  const alturaMaximaPixels = 280; // Altura fixa e compacta
  const escala = alturaMaximaPixels / profundidadeTotal;

  let profundidadeAcumulada = 0;

  // Coleta todas as cotas importantes
  const cotasImportantes = new Set<number>();
  cotasImportantes.add(0); // Superfície
  cotasImportantes.add(profundidadeTotal); // Fundo
  
  // Adiciona transições de camadas
  let profAcum = 0;
  camadas.forEach((camada) => {
    profAcum += camada.espessura;
    if (profAcum < profundidadeTotal) {
      cotasImportantes.add(profAcum);
    }
  });
  
  // Adiciona NA e zona capilar
  if (profundidadeNA > 0 && profundidadeNA <= profundidadeTotal) {
    cotasImportantes.add(profundidadeNA);
    if (alturaCapilar > 0) {
      const profCapilar = Math.max(0, profundidadeNA - alturaCapilar);
      cotasImportantes.add(profCapilar);
    }
  }
  
  const cotasOrdenadas = Array.from(cotasImportantes).sort((a, b) => a - b);

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex gap-2">
          {/* Escala de profundidade com cotas */}
          <div className="relative text-xs font-mono" style={{ width: '60px', height: alturaMaximaPixels + 'px' }}>
            {cotasOrdenadas.map((cota, index) => {
              const posY = cota * escala;
              const isNA = cota === profundidadeNA;
              const isCapilar = alturaCapilar > 0 && cota === Math.max(0, profundidadeNA - alturaCapilar);
              
              return (
                <div
                  key={index}
                  className="absolute right-0 flex items-center gap-1"
                  style={{ top: `${posY}px`, transform: 'translateY(-50%)' }}
                >
                  <span className={cn(
                    "text-xs font-semibold",
                    isNA && "text-blue-600 dark:text-blue-400",
                    isCapilar && "text-blue-500/70 dark:text-blue-400/70",
                    !isNA && !isCapilar && "text-muted-foreground"
                  )}>
                    {cota.toFixed(2)} m
                  </span>
                  <div className={cn(
                    "w-2 h-0.5",
                    isNA && "bg-blue-600",
                    isCapilar && "bg-blue-500/70",
                    !isNA && !isCapilar && "bg-border"
                  )} />
                </div>
              );
            })}
          </div>

          {/* Diagrama */}
          <div className="flex-1 relative border-l-2 border-border">
            <div style={{ height: alturaMaximaPixels + 'px' }}>
            {(() => {
              let corAnterior: number | undefined = undefined;
              return camadas.map((camada, index) => {
                const profTopo = profundidadeAcumulada;
                const profBase = profundidadeAcumulada + camada.espessura;
                profundidadeAcumulada = profBase;

                const altura = camada.espessura * escala;
                
                // Determina cor baseada no índice e saturação
                const acimaDoNA = profBase <= profundidadeNA;
                const abaixoDoNA = profTopo >= profundidadeNA;
                const atravessaNA = !acimaDoNA && !abaixoDoNA;
                
                // Gera cor aleatória mas diferente da anterior
                let corIndex = Math.floor(seededRandom(index * 7919 + 12345) * CORES_SOLO.length);
                if (corAnterior !== undefined && corIndex === corAnterior) {
                  corIndex = (corIndex + 1) % CORES_SOLO.length;
                }
                corAnterior = corIndex;
                
                const coresSelecionadas = CORES_SOLO[corIndex];
                let cores = { bg: coresSelecionadas.bg, border: coresSelecionadas.border, texto: getCorTexto(coresSelecionadas.bg) };
                let pattern = "";

                if (acimaDoNA) {
                  pattern = ""; // Acima do NA - sem padrão
                } else if (abaixoDoNA) {
                  // Saturado - deixa um pouco mais azulado
                  const bgMisturada = misturarCores(coresSelecionadas.bg, '#a8c5d8', 0.7);
                  const borderMisturada = misturarCores(coresSelecionadas.border, '#6a8fb8', 0.7);
                  cores = { 
                    bg: bgMisturada,
                    border: borderMisturada,
                    texto: getCorTexto(bgMisturada)
                  };
                  pattern = "url(#saturado)";
                } else {
                  pattern = "url(#parcial)"; // Atravessa NA
                }

              // Adiciona padrão para camadas impermeáveis
              const isImpermeavel = camada.impermeavel || false;

              // Determina nível de detalhe baseado na altura da camada
              const alturaMuitoPequena = altura < 35;
              const alturaPequena = altura < 55;
              const alturaMedia = altura < 80;

              return (
                <div
                  key={index}
                  className={`relative border-b border-border ${interactive ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}`}
                  style={{
                    height: altura + 'px',
                    backgroundColor: cores.bg,
                    borderLeft: `4px solid ${cores.border}`,
                    backgroundImage: isImpermeavel ? 
                      'repeating-linear-gradient(45deg, transparent, transparent 8px, rgba(0, 0, 0, 0.1) 8px, rgba(0, 0, 0, 0.1) 16px)' : 
                      'none',
                  }}
                  onClick={interactive ? (e) => handleEditClick(index, e) : undefined}
                >
                  <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
                    <div className="text-center px-1.5 w-full">
                      {/* Camada muito pequena - apenas nome abreviado */}
                      {alturaMuitoPequena ? (
                        <div className="font-semibold text-xs leading-tight flex items-center justify-center gap-1" style={{ color: cores.texto }}>
                          <span className="truncate max-w-[120px]">{camada.nome || `C${index + 1}`}</span>
                          {isImpermeavel && <span className="text-[10px] bg-blue-900/70 text-white px-1 py-0.5 rounded shrink-0">I</span>}
                        </div>
                      ) : alturaPequena ? (
                        /* Camada pequena - nome e espessura compactos */
                        <>
                          <div className="font-bold text-xs flex items-center justify-center gap-1 leading-tight" style={{ color: cores.texto }}>
                            <span className="truncate max-w-[150px]">{camada.nome || `Camada ${index + 1}`}</span>
                            {isImpermeavel && (
                              <span className="text-[10px] bg-blue-900/60 text-white px-1 py-0.5 rounded shrink-0">Imp.</span>
                            )}
                          </div>
                          <div className="text-[11px] font-medium leading-tight" style={{ color: cores.texto, opacity: 0.9 }}>
                            {camada.espessura.toFixed(2)} m
                          </div>
                        </>
                      ) : alturaMedia ? (
                        /* Camada média - nome, espessura e γs em linha */
                        <>
                          <div className="font-bold text-sm flex items-center justify-center gap-1" style={{ color: cores.texto }}>
                            <span className="truncate max-w-[160px]">{camada.nome || `Camada ${index + 1}`}</span>
                            {isImpermeavel && (
                              <span className="text-xs bg-blue-900/60 text-white px-1.5 py-0.5 rounded shrink-0">Imp.</span>
                            )}
                            {interactive && (
                              <Edit2 className="w-3 h-3 opacity-60 shrink-0" />
                            )}
                          </div>
                          <div className="text-xs font-medium mt-0.5" style={{ color: cores.texto, opacity: 0.9 }}>
                            {camada.espessura.toFixed(2)} m
                          </div>
                          <div className="text-[11px] leading-tight mt-0.5 flex items-center justify-center gap-2" style={{ color: cores.texto, opacity: 0.85 }}>
                            {camada.gamaNat !== null && camada.gamaNat !== undefined && camada.gamaNat > 0 && (
                              <span>γ<sub>n</sub>:{camada.gamaNat.toFixed(1)}</span>
                            )}
                            {camada.gamaSat !== null && camada.gamaSat !== undefined && camada.gamaSat > 0 && (
                              <span>γ<sub>s</sub>:{camada.gamaSat.toFixed(1)}</span>
                            )}
                          </div>
                        </>
                      ) : (
                        /* Camada grande - todas as informações */
                        <>
                          <div className="font-bold text-sm flex items-center justify-center gap-1" style={{ color: cores.texto }}>
                            {camada.nome || `Camada ${index + 1}`}
                            {isImpermeavel && (
                              <span className="text-xs bg-blue-900/60 text-white px-1.5 py-0.5 rounded">Imp.</span>
                            )}
                            {interactive && (
                              <Edit2 className="w-3 h-3 opacity-60" />
                            )}
                          </div>
                          <div className="text-xs font-medium mt-0.5" style={{ color: cores.texto, opacity: 0.9 }}>
                            {camada.espessura.toFixed(2)} m
                          </div>
                          <div className="text-xs mt-1 space-y-0.5" style={{ color: cores.texto, opacity: 0.85 }}>
                            {camada.gamaNat !== null && camada.gamaNat !== undefined && camada.gamaNat > 0 && (
                              <div>
                                γ<sub>nat</sub>: {camada.gamaNat.toFixed(1)} kN/m³
                              </div>
                            )}
                            {camada.gamaSat !== null && camada.gamaSat !== undefined && camada.gamaSat > 0 && (
                              <div>
                                γ<sub>sat</sub>: {camada.gamaSat.toFixed(1)} kN/m³
                              </div>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
              });
            })()}

            {/* Linhas dos Níveis d'Água */}
            {niveisAgua && niveisAgua.length > 0 ? (
              // Múltiplos NAs definidos nas camadas
              niveisAgua.map((na, idx) => {
                if (na.profundidade > 0 && na.profundidade <= profundidadeTotal) {
                  return (
                    <div key={`na-${idx}`}>
                      <div
                        className="absolute left-0 right-0 z-10 pointer-events-none"
                        style={{ top: na.profundidade * escala + 'px' }}
                      >
                        <div className="absolute inset-x-0 border-t-2 border-blue-500 border-dashed" />
                        <div className="absolute right-1 -top-3.5 bg-blue-500 text-white text-xs font-bold px-2.5 py-1 rounded-md shadow-lg">
                          {niveisAgua.length > 1 ? `NA${idx + 1}` : 'NA'}
                        </div>
                      </div>
                      {/* Franja Capilar */}
                      {na.capilaridade && na.capilaridade > 0 && (
                        <div
                          className="absolute left-0 right-0 bg-blue-200/30 dark:bg-blue-900/20 border-t border-blue-300 border-dashed pointer-events-none"
                          style={{
                            top: Math.max(0, na.profundidade - na.capilaridade) * escala + 'px',
                            height: na.capilaridade * escala + 'px',
                          }}
                        />
                      )}
                    </div>
                  );
                }
                return null;
              })
            ) : (
              // NA único (modo compatibilidade)
              profundidadeNA > 0 && profundidadeNA <= profundidadeTotal && (
                <>
                  <div
                    className="absolute left-0 right-0 z-10 pointer-events-none"
                    style={{ top: profundidadeNA * escala + 'px' }}
                  >
                    <div className="absolute inset-x-0 border-t-2 border-blue-500 border-dashed" />
                    <div className="absolute right-1 -top-3.5 bg-blue-500 text-white text-xs font-bold px-2.5 py-1 rounded-md shadow-lg">
                      NA
                    </div>
                  </div>
                  {/* Franja Capilar - visual apenas */}
                  {alturaCapilar > 0 && (
                    <div
                      className="absolute left-0 right-0 bg-blue-200/30 dark:bg-blue-900/20 border-t border-blue-300 border-dashed pointer-events-none"
                      style={{
                        top: Math.max(0, profundidadeNA - alturaCapilar) * escala + 'px',
                        height: alturaCapilar * escala + 'px',
                      }}
                    />
                  )}
                </>
              )
            )}
            </div>

            {/* Botão Adicionar Camada - integrado ao diagrama */}
            {interactive && onAddCamada && (
              <div
                className="relative border-2 border-primary/40 border-t-border cursor-pointer hover:bg-primary/10 hover:border-primary/60 transition-all flex items-center justify-center py-3 rounded-b-lg"
                onClick={handleAddClick}
              >
                <div className="flex items-center gap-2 text-primary font-medium">
                  <Plus className="w-4 h-4" />
                  <span className="text-sm">Adicionar Camada</span>
                </div>
              </div>
            )}
          </div>

          {/* Legenda */}
          <div className="flex flex-col gap-2 text-xs">
            <div className="font-semibold mb-1">Legenda:</div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-0.5 border-t-2 border-blue-500 border-dashed"></div>
              <span>NA</span>
            </div>
            {alturaCapilar > 0 && (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-blue-200/30 border border-blue-300 border-dashed"></div>
                <span>Capilar</span>
              </div>
            )}
            {camadas.some(c => c.impermeavel) && (
              <div className="flex items-center gap-2">
                <div 
                  className="w-4 h-4 bg-amber-100 border border-amber-300"
                  style={{
                    backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 2px, rgba(0, 0, 0, 0.15) 2px, rgba(0, 0, 0, 0.15) 4px)'
                  }}
                ></div>
                <span>Impermeável</span>
              </div>
            )}
            {interactive && (
              <div className="flex items-center gap-2 mt-2 text-muted-foreground">
                <Edit2 className="w-3 h-3" />
                <span className="text-xs">Clique para editar</span>
              </div>
            )}
          </div>
        </div>

        {/* Dialog para adicionar/editar camada */}
        {interactive && (
          <DialogCamada
            open={dialogOpen}
            onOpenChange={setDialogOpen}
            onConfirm={handleConfirm}
            camadaInicial={camadaInicial}
            title={editingIndex !== null ? `Editar Camada ${editingIndex + 1}` : "Adicionar Nova Camada"}
            description={editingIndex !== null ? "Atualize os dados da camada" : "Insira os dados da nova camada de solo"}
          />
        )}
      </CardContent>
    </Card>
  );
}

