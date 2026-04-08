import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, TrendingDown, Calculator, Table as TableIcon, BarChart3, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";
import DialogDetalhesCalculo from "./DialogDetalhesCalculo";

export interface PontoAnalise {
  id: string;
  nome: string;
  x: number;
  y?: number; // Coordenada transversal (apenas para Newmark 3D)
  z: number;
  tensao?: number;
  detalhes?: any; // Detalhes técnicos do cálculo (para Newmark)
}

interface PainelResultadosProps {
  pontos: PontoAnalise[];
  cargaP?: number;
  cargaQ?: number;
  raio?: number;
  largura?: number;
  comprimento?: number;
  intensidade?: number;
  tipoAnalise?: "boussinesq" | "love" | "newmark" | "carothers";
  isCalculating: boolean;
  onExcluirPonto?: (id: string) => void;
  onCalcular?: () => void;
  decimalPlaces?: number;
}

export default function PainelResultados({
  pontos,
  cargaP,
  cargaQ,
  raio,
  largura,
  comprimento,
  intensidade,
  tipoAnalise = "boussinesq",
  isCalculating,
  onExcluirPonto,
  onCalcular,
  decimalPlaces = 3
}: PainelResultadosProps) {
  const [dialogDetalhesOpen, setDialogDetalhesOpen] = useState(false);
  const [pontoSelecionado, setPontoSelecionado] = useState<PontoAnalise | null>(null);
  
  const temResultados = pontos.some(p => p.tensao !== undefined);
  
  const abrirDetalhes = (ponto: PontoAnalise) => {
    setPontoSelecionado(ponto);
    setDialogDetalhesOpen(true);
  };
  
  // Validação de cálculo depende do tipo de análise
  const podeCalcular = tipoAnalise === "love"
    ? (cargaQ !== undefined && cargaQ > 0 && raio !== undefined && raio > 0 && pontos.length > 0)
    : tipoAnalise === "carothers"
    ? (cargaQ !== undefined && cargaQ > 0 && largura !== undefined && largura > 0 && pontos.length > 0)
    : tipoAnalise === "newmark"
    ? (largura !== undefined && largura > 0 && comprimento !== undefined && comprimento > 0 && intensidade !== undefined && intensidade > 0 && pontos.length > 0)
    : (cargaP !== undefined && cargaP > 0 && pontos.length > 0);

  // Calcular estatísticas
  const pontosComTensao = pontos.filter(p => p.tensao !== undefined);
  const tensoes = pontosComTensao.map(p => p.tensao!);
  const tensaoMax = tensoes.length > 0 ? Math.max(...tensoes) : undefined;
  const tensaoMin = tensoes.length > 0 ? Math.min(...tensoes) : undefined;
  
  // Encontrar pontos de máxima e mínima tensão
  const pontoMaxTensao = pontosComTensao.find(p => p.tensao === tensaoMax);
  const pontoMinTensao = pontosComTensao.find(p => p.tensao === tensaoMin);

  return (
    <Card className="h-fit">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingDown className="w-5 h-5 text-blue-500" />
            Análise de Resultados
          </CardTitle>
          <div className="flex items-center gap-2">
            {temResultados && (
              <Badge variant="default" className="text-xs bg-green-600">
                ✓ Calculado
              </Badge>
            )}
            <Badge variant={pontos.length > 0 ? "default" : "secondary"} className="text-xs">
              {pontos.length} {pontos.length === 1 ? 'ponto' : 'pontos'}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Informação da Carga */}
        {tipoAnalise === "boussinesq" && (
          <div className="p-3 rounded-lg bg-gradient-to-br from-blue-500/10 to-cyan-600/10 border border-blue-500/30">
            <div className="flex items-center gap-1 mb-1">
              <div className="w-1 h-1 rounded-full bg-blue-500"></div>
              <p className="text-[9px] font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wide">
                Carga Pontual
              </p>
            </div>
            <p className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
              {cargaP !== undefined ? `${cargaP.toFixed(1)} kN` : "Não definida"}
            </p>
            <p className="text-[10px] text-foreground/70 mt-0.5">Aplicada na superfície (x=0, z=0)</p>
          </div>
        )}
        
        {tipoAnalise === "love" && (
          <div className="p-3 rounded-lg bg-gradient-to-br from-purple-500/10 to-pink-600/10 border border-purple-500/30">
            <div className="flex items-center gap-1 mb-1">
              <div className="w-1 h-1 rounded-full bg-purple-500"></div>
              <p className="text-[9px] font-bold text-purple-700 dark:text-purple-400 uppercase tracking-wide">
                Carga Circular
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 mb-2">
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">Pressão (q)</p>
                <p className="text-lg font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  {cargaQ !== undefined ? `${cargaQ.toFixed(1)} kPa` : "-"}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">Raio (R)</p>
                <p className="text-lg font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  {raio !== undefined ? `${raio.toFixed(2)} m` : "-"}
                </p>
              </div>
            </div>
            {cargaQ !== undefined && raio !== undefined && (
              <div className="pt-2 border-t border-purple-500/20">
                <p className="text-[10px] text-foreground/70">
                  Carga Total: <span className="font-semibold">{(cargaQ * Math.PI * raio * raio).toFixed(2)} kN</span>
                </p>
              </div>
            )}
          </div>
        )}
        
        {tipoAnalise === "carothers" && (
          <div className="p-3 rounded-lg bg-gradient-to-br from-green-500/10 to-emerald-600/10 border border-green-500/30">
            <div className="flex items-center gap-1 mb-1">
              <div className="w-1 h-1 rounded-full bg-green-500"></div>
              <p className="text-[9px] font-bold text-green-700 dark:text-green-400 uppercase tracking-wide">
                Carga em Faixa
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 mb-2">
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">Pressão (q)</p>
                <p className="text-lg font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                  {cargaQ !== undefined ? `${cargaQ.toFixed(1)} kPa` : "-"}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">Largura (B)</p>
                <p className="text-lg font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                  {largura !== undefined ? `${largura.toFixed(2)} m` : "-"}
                </p>
              </div>
            </div>
            {cargaQ !== undefined && largura !== undefined && (
              <div className="pt-2 border-t border-green-500/20">
                <p className="text-[10px] text-foreground/70">
                  Carga por Metro: <span className="font-semibold">{(cargaQ * largura).toFixed(2)} kN/m</span>
                </p>
              </div>
            )}
          </div>
        )}
        
        {tipoAnalise === "newmark" && (
          <div className="p-3 rounded-lg bg-gradient-to-br from-orange-500/10 to-red-600/10 border border-orange-500/30">
            <div className="flex items-center gap-1 mb-1">
              <div className="w-1 h-1 rounded-full bg-orange-500"></div>
              <p className="text-[9px] font-bold text-orange-700 dark:text-orange-400 uppercase tracking-wide">
                Carga Retangular
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 mb-2">
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">Largura (L)</p>
                <p className="text-lg font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                  {largura !== undefined ? `${largura.toFixed(1)} m` : "-"}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">Compr. (C)</p>
                <p className="text-lg font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                  {comprimento !== undefined ? `${comprimento.toFixed(1)} m` : "-"}
                </p>
              </div>
            </div>
            {largura !== undefined && comprimento !== undefined && intensidade !== undefined && (
              <div className="pt-2 border-t border-orange-500/20">
                <p className="text-[10px] text-foreground/70">
                  Pressão: <span className="font-semibold">{intensidade.toFixed(0)} kPa</span> | 
                  Área: <span className="font-semibold">{(largura * comprimento).toFixed(1)} m²</span> | 
                  Carga Total: <span className="font-semibold">{(intensidade * largura * comprimento).toFixed(0)} kN</span>
                </p>
              </div>
            )}
          </div>
        )}
        
        {/* Botão Calcular */}
        {onCalcular && (
          <Button
            onClick={onCalcular}
            disabled={!podeCalcular || isCalculating}
            className="w-full"
            size="lg"
            data-tour="btn-calcular"
          >
            {isCalculating ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Calculando...
              </>
            ) : (
              <>
                <Calculator className="w-4 h-4 mr-2" />
                Calcular Tensões
              </>
            )}
          </Button>
        )}
        
        {/* Resultados em Tabs */}
        {pontos.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-muted flex items-center justify-center">
              <TrendingDown className="w-8 h-8 text-muted-foreground/50" />
            </div>
            <p className="text-sm font-medium">Nenhum ponto adicionado</p>
            <p className="text-xs mt-1">Duplo clique no canvas para criar pontos</p>
          </div>
        ) : (
          <Tabs defaultValue="cards" className="w-full" data-tour="resultados">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="cards" className="text-xs">
                <BarChart3 className="w-3 h-3 mr-1.5" />
                Cards
              </TabsTrigger>
              <TabsTrigger value="tabela" className="text-xs">
                <TableIcon className="w-3 h-3 mr-1.5" />
                Tabela
              </TabsTrigger>
            </TabsList>
            
            {/* Tab: Cards */}
            <TabsContent value="cards" className="mt-3">
              <ScrollArea className="h-[400px] pr-3">
                <div className="space-y-2">
                  {pontos.map((ponto) => (
                    <div
                      key={ponto.id}
                      className="border rounded-lg p-3 hover:border-primary/50 transition-all hover:shadow-md group bg-card"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2 flex-1">
                          <div className={`w-2 h-2 rounded-full ${ponto.tensao !== undefined ? 'bg-primary animate-pulse' : 'bg-muted-foreground'}`}></div>
                          <h4 className="font-semibold text-sm">{ponto.nome}</h4>
                        </div>
                        <div className="flex items-center gap-1">
                          {ponto.tensao !== undefined && (
                            <Badge variant="default" className="text-xs bg-gradient-to-r from-blue-600 to-cyan-600">
                              {ponto.tensao.toFixed(decimalPlaces)} kPa
                            </Badge>
                          )}
                          {ponto.detalhes && tipoAnalise === "newmark" && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-950/20"
                              onClick={() => abrirDetalhes(ponto)}
                              disabled={isCalculating}
                              title="Ver detalhes do cálculo"
                            >
                              <Info className="w-3.5 h-3.5" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
                            onClick={() => onExcluirPonto?.(ponto.id)}
                            disabled={isCalculating}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                      
                      <div className={`grid gap-2 text-xs ${ponto.y !== undefined ? 'grid-cols-3' : 'grid-cols-2'}`}>
                        <div className="p-2 rounded bg-muted/30">
                          <span className="text-muted-foreground block mb-0.5 text-[10px]">X</span>
                          <span className="font-mono font-semibold text-foreground">{ponto.x.toFixed(2)} m</span>
                        </div>
                        {ponto.y !== undefined && (
                          <div className="p-2 rounded bg-muted/30">
                            <span className="text-muted-foreground block mb-0.5 text-[10px]">Y</span>
                            <span className="font-mono font-semibold text-foreground">{ponto.y.toFixed(2)} m</span>
                          </div>
                        )}
                        <div className="p-2 rounded bg-muted/30">
                          <span className="text-muted-foreground block mb-0.5 text-[10px]">Z</span>
                          <span className="font-mono font-semibold text-foreground">{ponto.z.toFixed(2)} m</span>
                        </div>
                      </div>
                      
                      {ponto.tensao !== undefined && (
                        <div className="mt-2 pt-2 border-t">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground font-medium">Δσz:</span>
                            <span className="font-mono font-bold text-primary text-sm">{ponto.tensao.toFixed(decimalPlaces)} kPa</span>
                          </div>
                          {/* Indicador de intensidade */}
                          <div className="mt-2">
                            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full transition-all"
                                style={{ 
                                  width: tensaoMax ? `${(ponto.tensao / tensaoMax) * 100}%` : '0%' 
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {isCalculating && ponto.tensao === undefined && (
                        <div className="mt-2 pt-2 border-t flex items-center gap-1.5">
                          <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></div>
                          <p className="text-xs text-blue-600 font-medium">Calculando...</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>
            
            {/* Tab: Tabela */}
            <TabsContent value="tabela" className="mt-3">
              <div className="rounded-lg border overflow-hidden">
                <ScrollArea className="h-[400px]">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50 hover:bg-muted/50">
                        <TableHead className="text-center font-bold text-xs py-2">Ponto</TableHead>
                        <TableHead className="text-center font-bold text-xs py-2">X (m)</TableHead>
                        {pontos.some(p => p.y !== undefined) && (
                          <TableHead className="text-center font-bold text-xs py-2">Y (m)</TableHead>
                        )}
                        <TableHead className="text-center font-bold text-xs py-2">Z (m)</TableHead>
                        <TableHead className="text-center font-bold text-xs py-2 bg-primary/10">Δσz (kPa)</TableHead>
                        {tipoAnalise !== "newmark" && (
                          <TableHead className="text-center font-bold text-xs py-2 w-16">Ações</TableHead>
                        )}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pontos.map((ponto) => (
                        <TableRow key={ponto.id} className="hover:bg-muted/20">
                          <TableCell className="text-center font-semibold text-xs py-2">
                            <div className="flex items-center justify-center gap-1.5">
                              <div className={`w-1.5 h-1.5 rounded-full ${ponto.tensao !== undefined ? 'bg-primary' : 'bg-muted-foreground'}`}></div>
                              {ponto.nome}
                            </div>
                          </TableCell>
                          <TableCell className="text-center text-xs py-2 font-mono">{ponto.x.toFixed(2)}</TableCell>
                          {pontos.some(p => p.y !== undefined) && (
                            <TableCell className="text-center text-xs py-2 font-mono">
                              {ponto.y !== undefined ? ponto.y.toFixed(2) : '0.00'}
                            </TableCell>
                          )}
                          <TableCell className="text-center text-xs py-2 font-mono">{ponto.z.toFixed(2)}</TableCell>
                          <TableCell className="text-center font-bold text-xs py-2 bg-primary/5">
                            {ponto.tensao !== undefined ? (
                              <span className="text-primary">{ponto.tensao.toFixed(decimalPlaces)}</span>
                            ) : isCalculating ? (
                              <span className="text-blue-600">...</span>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          {tipoAnalise !== "newmark" && (
                            <TableCell className="text-center py-2">
                              <div className="flex items-center justify-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
                                  onClick={() => onExcluirPonto?.(ponto.id)}
                                  disabled={isCalculating}
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            </TableCell>
                          )}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </div>
              
              {/* Resumo da Tabela */}
              {temResultados && (
                <div className="mt-3 p-3 rounded-lg bg-gradient-to-br from-muted/50 to-muted/30 border border-muted space-y-1.5">
                  <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Resumo da Análise</p>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Pontos analisados:</span>
                      <span className="font-bold">{pontosComTensao.length}</span>
                    </div>
                    
                    {/* Informações da Carga por tipo de análise */}
                    {tipoAnalise === "boussinesq" && cargaP !== undefined && (
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Carga P:</span>
                        <span className="font-bold">{cargaP.toFixed(1)} kN</span>
                      </div>
                    )}
                    
                    {tipoAnalise === "love" && (
                      <>
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">Pressão q:</span>
                          <span className="font-bold">{cargaQ?.toFixed(1)} kPa</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">Raio R:</span>
                          <span className="font-bold">{raio?.toFixed(2)} m</span>
                        </div>
                      </>
                    )}
                    
                    {tipoAnalise === "carothers" && (
                      <>
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">Pressão q:</span>
                          <span className="font-bold">{cargaQ?.toFixed(1)} kPa</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">Largura B:</span>
                          <span className="font-bold">{largura?.toFixed(2)} m</span>
                        </div>
                      </>
                    )}
                    
                    {tipoAnalise === "newmark" && (
                      <>
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">Largura L:</span>
                          <span className="font-bold">{largura?.toFixed(1)} m</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">Compr. C:</span>
                          <span className="font-bold">{comprimento?.toFixed(1)} m</span>
                        </div>
                        <div className="flex justify-between items-center col-span-2">
                          <span className="text-muted-foreground">Pressão p:</span>
                          <span className="font-bold">{intensidade?.toFixed(0)} kPa</span>
                        </div>
                      </>
                    )}
                    
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Δσz máx:</span>
                      <span className="font-bold text-red-600 dark:text-red-400">{tensaoMax?.toFixed(decimalPlaces)} kPa</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Δσz mín:</span>
                      <span className="font-bold text-green-600 dark:text-green-400">{tensaoMin?.toFixed(decimalPlaces)} kPa</span>
                    </div>
                  </div>
                  {pontoMaxTensao && pontoMinTensao && (
                    <div className="mt-2 pt-2 border-t border-muted-foreground/20 text-[10px] text-muted-foreground">
                      <p>• Máx em: <span className="font-semibold text-foreground">{pontoMaxTensao.nome}</span> (X={pontoMaxTensao.x.toFixed(2)}m{pontoMaxTensao.y !== undefined ? `, Y=${pontoMaxTensao.y.toFixed(2)}m` : ''}, Z={pontoMaxTensao.z.toFixed(2)}m)</p>
                      <p className="mt-0.5">• Mín em: <span className="font-semibold text-foreground">{pontoMinTensao.nome}</span> (X={pontoMinTensao.x.toFixed(2)}m{pontoMinTensao.y !== undefined ? `, Y=${pontoMinTensao.y.toFixed(2)}m` : ''}, Z={pontoMinTensao.z.toFixed(2)}m)</p>
                    </div>
                  )}
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
      
      {/* Dialog de Detalhes */}
      <DialogDetalhesCalculo
        open={dialogDetalhesOpen}
        onClose={() => setDialogDetalhesOpen(false)}
        detalhes={pontoSelecionado?.detalhes || null}
        nomePonto={pontoSelecionado?.nome || ""}
      />
    </Card>
  );
}

