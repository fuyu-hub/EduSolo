/**
 * Página: Classificação Granulométrica
 * modulos/granulometria/pagina.tsx
 *
 * Classificação de Solos pelos Sistemas USCS e AASHTO (HRB).
 * Orquestra componentes, estado e cálculos.
 */
import { useState, useEffect, useMemo, useRef } from "react";
import { Helmet } from 'react-helmet-async';
import { Database, Info, Activity, AlertCircle, Droplet, ChevronDown, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TooltipProvider } from "@/components/ui/tooltip";
import { toast } from "@/components/ui/sonner";
import { Separator } from "@/components/ui/separator";
import PrintHeader from "@/componentes/base/CabecalhoImpressao";
import PlasticityChart from "./componentes/CartaPlasticidade";
import { UI_STANDARDS } from "@/lib/ui-standards";
import { cn } from "@/lib/utils";
import { handleArrowNavigation } from "@/lib/navigation";
import { parseDecimal } from "@/lib/shared";

import { useGranulometriaStore } from "./store";
import { calcularClassificacao } from "./calculos";
import { FRACOES } from "./types";
import type { GranulometriaFormData, ClassificacaoOutput } from "./types";
import type { ExemploGranulometria } from "./exemplos";
import DialogExemplos from "./componentes/DialogExemplos";
import { LinhaResultado } from "@/componentes/compartilhados/LinhaResultado";
import { getDefinicao } from "@/componentes/compartilhados/definicoes";
import { DefinicaoTooltip } from "@/components/ui/DefinicaoTooltip";
import { BotaoLimpar } from "@/componentes/compartilhados/BotaoLimpar";

function CompositionBar({ formData, somaFracoes, somaValida, temFracoes }: {
  formData: GranulometriaFormData; somaFracoes: number; somaValida: boolean; temFracoes: boolean;
}) {
  if (!temFracoes) return null;
  const valores = FRACOES.map((f) => ({ ...f, valor: parseDecimal(formData[f.key]) || 0 })).filter((f) => f.valor > 0);
  if (valores.length === 0) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>Composição</span>
        <span className={cn("font-mono font-semibold", somaValida ? "text-green-500" : "text-destructive")}>{somaFracoes.toFixed(1)}%</span>
      </div>
      <div className="h-3 rounded-full overflow-hidden flex bg-muted/50 border border-border/40">
        {valores.map((f) => (
          <div key={f.key} className={cn("h-full transition-all duration-300 group relative", f.colorClass)} style={{ width: `${(f.valor / Math.max(somaFracoes, 100)) * 100}%` }}>
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block bg-popover text-popover-foreground text-xs px-2 py-1 rounded shadow-sm border whitespace-nowrap z-10 pointer-events-none">{f.label}: {f.valor}%</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Página ───

export default function GranulometriaPage() {
  const { formData, updateFormData, clearFormData } = useGranulometriaStore();
  const [results, setResults] = useState<ClassificacaoOutput | null>(null);
  const [showComplementares, setShowComplementares] = useState(true);
  const resultRef = useRef<HTMLDivElement>(null);

  const handleInputChange = (field: keyof GranulometriaFormData, value: string) => updateFormData({ [field]: value });
  const handleClear = () => { clearFormData(); setResults(null); };

  const handleSelectExample = (exemplo: ExemploGranulometria) => {
    updateFormData({ ...exemplo.fracoes, ...exemplo.parametros });
    toast.success(`Exemplo "${exemplo.nome}" carregado!`);
  };

  const somaFracoes = useMemo(() => FRACOES.reduce((sum, f) => {
    const val = parseDecimal(formData[f.key]); return sum + (isNaN(val) ? 0 : val);
  }, 0), [formData]);

  const somaValida = useMemo(() => Math.abs(somaFracoes - 100) <= 1.0, [somaFracoes]);
  const temFracoes = useMemo(() => FRACOES.some((f) => formData[f.key] !== ""), [formData]);

  const { pedregulho, areia_grossa, areia_media, areia_fina, silte, argila, pass_p10, pass_p40, pass_p200, d10, d30, d60, ll, lp } = formData;

  useEffect(() => {
    const fracoesPreenchidas = FRACOES.filter((f) => formData[f.key] !== "" && !isNaN(parseDecimal(formData[f.key])));
    if (fracoesPreenchidas.length < 2 || (!somaValida && temFracoes)) { setResults(null); return; }

    const resultado = calcularClassificacao({
      pedregulho: parseDecimal(pedregulho) || 0, areia_grossa: parseDecimal(areia_grossa) || 0,
      areia_media: parseDecimal(areia_media) || 0, areia_fina: parseDecimal(areia_fina) || 0,
      silte: parseDecimal(silte) || 0, argila: parseDecimal(argila) || 0,
      pass_peneira_10: pass_p10 ? parseDecimal(pass_p10) : undefined,
      pass_peneira_40: pass_p40 ? parseDecimal(pass_p40) : undefined,
      pass_peneira_200: pass_p200 ? parseDecimal(pass_p200) : undefined,
      d10: d10 ? parseDecimal(d10) : undefined, d30: d30 ? parseDecimal(d30) : undefined,
      d60: d60 ? parseDecimal(d60) : undefined, ll: ll ? parseDecimal(ll) : undefined,
      lp: lp ? parseDecimal(lp) : undefined,
    });
    setResults(resultado.erro ? null : resultado);
  }, [pedregulho, areia_grossa, areia_media, areia_fina, silte, argila, pass_p10, pass_p40, pass_p200, d10, d30, d60, ll, lp, somaValida, temFracoes]);

  const diff = 100 - somaFracoes;
  const diffAbs = Math.abs(diff).toFixed(1);
  const msgErroSoma = diff > 0
    ? `Faltam ${diffAbs}% para completar 100%. Aumente uma das frações.`
    : `Soma excede 100% em ${diffAbs}%. Reduza uma das frações.`;

  return (
    <TooltipProvider>
      <div className={UI_STANDARDS.pageContainer} onKeyDown={handleArrowNavigation}>
        <Helmet>
          <title>Classificação Granulométrica | EduSolos</title>
          <meta name="description" content="Classifique solos pelos sistemas USCS e AASHTO (HRB) informando apenas as frações granulométricas e limites de consistência." />
        </Helmet>
        <PrintHeader moduleTitle="Classificação Granulométrica" moduleName="granulometria" />

        <div className={UI_STANDARDS.header.container}>
          <div className="flex items-center gap-3">
            <div className={UI_STANDARDS.header.iconContainer}><Database className={UI_STANDARDS.header.icon} /></div>
            <div>
              <h1 className={UI_STANDARDS.header.title}>Classificação Granulométrica</h1>
              <p className={UI_STANDARDS.header.subtitle}>Classificação de Solos pelos Sistemas USCS e AASHTO</p>
            </div>
          </div>
          <div className={UI_STANDARDS.header.actionsContainer}>
            <Separator orientation="vertical" className="h-6 mx-1 bg-border" />
            <DialogExemplos onSelectExample={handleSelectExample} currentFormData={formData} />
            <Separator orientation="vertical" className="h-6 mx-1 bg-border" />
            <BotaoLimpar onLimpar={handleClear} />
          </div>
        </div>

        <div className={UI_STANDARDS.mainGrid}>
          <div className="space-y-4 animate-in slide-in-from-left-5 duration-300">
            {/* Card: Frações */}
            <Card className="glass border-primary/20">
              <CardHeader className="pb-3 bg-gradient-to-r from-primary/5 to-transparent">
                <CardTitle className="flex items-center gap-2 text-base"><Database className="w-5 h-5 text-primary" />Frações Granulométricas (%)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 pt-3">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {FRACOES.slice(0, 3).map((fracao) => (
                      <div key={fracao.key} className="space-y-1.5">
                        <div className="flex items-center h-5">
                          <Label htmlFor={fracao.key} className="text-xs flex items-center gap-1">
                            {fracao.label} (%)
                            <DefinicaoTooltip id={fracao.key} iconClassName="w-3 h-3" />
                          </Label>
                        </div>
                        <Input id={fracao.key} placeholder="0.0" value={formData[fracao.key]} onChange={(e) => handleInputChange(fracao.key, e.target.value)} className="h-9" />
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {FRACOES.slice(3).map((fracao) => (
                      <div key={fracao.key} className="space-y-1.5">
                        <div className="flex items-center h-5">
                          <Label htmlFor={fracao.key} className="text-xs flex items-center gap-1">
                            {fracao.label} (%)
                            <DefinicaoTooltip id={fracao.key} iconClassName="w-3 h-3" />
                          </Label>
                        </div>
                        <Input id={fracao.key} placeholder="0.0" value={formData[fracao.key]} onChange={(e) => handleInputChange(fracao.key, e.target.value)} className="h-9" />
                      </div>
                    ))}
                  </div>
                </div>
                <Separator className="!my-3 opacity-50" />
                <CompositionBar formData={formData} somaFracoes={somaFracoes} somaValida={somaValida} temFracoes={temFracoes} />
                {temFracoes && !somaValida && (
                  <p className="text-xs text-red-500/90 flex items-start gap-1.5 mt-2 font-medium">
                    <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />{msgErroSoma}
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Card: Parâmetros Complementares */}
            <Card className="glass border-blue-500/20">
              <CardHeader className="pb-3 bg-gradient-to-r from-blue-500/5 to-transparent cursor-pointer select-none" onClick={() => setShowComplementares(v => !v)}>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-base"><Droplet className="w-5 h-5 text-blue-500" />Parâmetros Complementares</CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[10px] bg-background/50">Complementar</Badge>
                    <ChevronDown className={cn("w-4 h-4 text-muted-foreground transition-transform", showComplementares && "rotate-180")} />
                  </div>
                </div>
              </CardHeader>
              {showComplementares && (
                <CardContent className="space-y-4 pt-3 border-t border-border/40">
                  <div>
                    <Label className="text-sm font-medium">Percentuais Passantes (%)</Label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-2">
                      {[{ id: "pass_p10", label: "Passante #10 (%)" }, { id: "pass_p40", label: "Passante #40 (%)" }, { id: "pass_p200", label: "Passante #200 (%)" }].map(f => (
                        <div key={f.id} className="space-y-1.5">
                          <div className="flex items-center h-5">
                            <Label htmlFor={f.id} className="text-xs flex items-center gap-1">
                              {f.label} 
                              <DefinicaoTooltip id={f.id} iconClassName="w-3 h-3" />
                            </Label>
                          </div>
                          <Input id={f.id} placeholder="—" value={formData[f.id as keyof GranulometriaFormData]} onChange={(e) => handleInputChange(f.id as keyof GranulometriaFormData, e.target.value)} className="h-9" />
                        </div>
                      ))}
                    </div>
                  </div>
                  <Separator />
                  <div>
                    <Label className="text-sm font-medium">Diâmetros Característicos (mm)</Label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-2">
                      {[{ id: "d10", label: "D10 (mm)" }, { id: "d30", label: "D30 (mm)" }, { id: "d60", label: "D60 (mm)" }].map(f => (
                        <div key={f.id} className="space-y-1.5">
                          <div className="flex items-center h-5">
                            <Label htmlFor={f.id} className="text-xs flex items-center gap-1">
                              {f.label} 
                              <DefinicaoTooltip id={f.id} iconClassName="w-3 h-3" />
                            </Label>
                          </div>
                          <Input id={f.id} placeholder="0.000" value={formData[f.id as keyof GranulometriaFormData]} onChange={(e) => handleInputChange(f.id as keyof GranulometriaFormData, e.target.value)} className="h-9" />
                        </div>
                      ))}
                    </div>
                  </div>
                  <Separator />
                  <div>
                    <Label className="text-sm font-medium">Limites de Consistência (%)</Label>
                    <div className="grid grid-cols-2 gap-4 mt-2">
                      <div className="space-y-1.5">
                        <div className="flex items-center h-5">
                          <Label htmlFor="ll" className="text-xs flex items-center gap-1">
                            Lim. Liquidez (LL) 
                            <DefinicaoTooltip id="LL" iconClassName="w-3 h-3" />
                          </Label>
                        </div>
                        <Input id="ll" placeholder="Ex: 45" value={formData.ll} onChange={(e) => handleInputChange("ll", e.target.value)} className="h-9" />
                      </div>
                      <div className="space-y-1.5">
                        <div className="flex items-center h-5">
                          <Label htmlFor="lp" className="text-xs flex items-center gap-1">
                            Lim. Plasticidade (LP) 
                            <DefinicaoTooltip id="LP" iconClassName="w-3 h-3" />
                          </Label>
                        </div>
                        <Input id="lp" placeholder="Ex: 25" value={formData.lp} onChange={(e) => handleInputChange("lp", e.target.value)} className="h-9" />
                      </div>
                      {formData.ll && formData.lp && (() => {
                        const ip = parseDecimal(formData.ll) - parseDecimal(formData.lp);
                        return (
                          <div className="col-span-2 mt-1 px-1">
                            <LinhaResultado 
                              id="IP" 
                              simbolo="IP"
                              label="Índice de Plasticidade"
                              value={ip} 
                              precision={1} 
                              className="bg-muted/30 border border-border/40" 
                            />
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>
          </div>

          {/* Resultados */}
          <div ref={resultRef} className="space-y-4 animate-in slide-in-from-right-5 duration-300 sticky top-4 self-start">
            <Card className="glass">
              <CardContent className="p-0">
                <div role="status" aria-live="polite" aria-label="Resultados da classificação" className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-border">
                  <div className="p-4 flex flex-col">
                    <h4 className="font-semibold text-xs flex items-center gap-2 text-blue-500 mb-3 uppercase tracking-wider">
                      <span className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_6px_rgba(59,130,246,0.4)]" />Classificação (USCS)
                    </h4>
                    {results?.classificacao_uscs ? (
                      <div className="flex flex-col flex-1">
                        <div className="flex items-center gap-3 h-10 mb-1"><span className="text-3xl font-black tracking-tight text-blue-600 dark:text-blue-500 tabular-nums leading-tight">{results.classificacao_uscs}</span></div>
                        <p className="text-sm text-foreground/70 leading-relaxed">{results.descricao_uscs}</p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-6 gap-2 text-center h-full">
                        <Database className="w-8 h-8 text-muted-foreground/30 mb-2" />
                        <p className="text-sm text-muted-foreground">Preencha as frações<br />para ver a classificação</p>
                      </div>
                    )}
                  </div>
                  <div className="p-4 flex flex-col">
                    <h4 className="font-semibold text-xs flex items-center gap-2 text-orange-500 mb-3 uppercase tracking-wider">
                      <span className="w-2 h-2 rounded-full bg-orange-500 shadow-[0_0_6px_rgba(249,115,22,0.4)]" />Classificação (HRB)
                    </h4>
                    {results?.classificacao_hrb ? (
                      <div className="flex flex-col flex-1">
                        <div className="flex items-center gap-3 h-10 mb-1">
                          <span className="text-3xl font-black tracking-tight text-foreground tabular-nums leading-tight">{results.subgrupo_hrb ? `${results.grupo_hrb}-${results.subgrupo_hrb}` : results.grupo_hrb}</span>
                          {results.indice_grupo_hrb !== undefined && (
                            <div className="flex items-center gap-1.5 bg-muted/50 px-2 py-0.5 rounded-md border border-border/40">
                              <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider opacity-70">IG</span>
                              <span className="text-base font-bold tabular-nums">{results.indice_grupo_hrb}</span>
                            </div>
                          )}
                        </div>
                        <p className="text-sm text-foreground/70 leading-relaxed mb-3">{results.descricao_hrb}</p>
                        <div className="mt-auto">
                          {results.avaliacao_subleito_hrb && (
                            <DefinicaoTooltip id="subleito" side="right">
                              <Badge 
                                variant="outline" 
                                className="font-bold text-[10px] uppercase text-foreground border-foreground/20 py-0.5 px-2.5 bg-foreground/5 rounded-full cursor-help transition-colors hover:bg-foreground/10"
                              >
                                Subleito: {results.avaliacao_subleito_hrb}
                              </Badge>
                            </DefinicaoTooltip>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-6 gap-2 text-center h-full">
                        <Database className="w-8 h-8 text-muted-foreground/30 mb-2" />
                        <p className="text-sm text-muted-foreground">Preencha as frações<br />para ver a classificação</p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base"><Activity className="w-5 h-5 text-primary" />Carta de Plasticidade</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                {(formData.ll && formData.lp) ? (
                  <PlasticityChart ll={parseDecimal(formData.ll)} ip={parseDecimal(formData.ll) - parseDecimal(formData.lp)} />
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-muted-foreground/60 bg-muted/10 rounded-lg border border-dashed border-border/50">
                    <Activity className="w-12 h-12 mb-4 opacity-30" />
                    <p className="text-base font-medium mb-1">Carta de Plasticidade indisponível</p>
                    <p className="text-sm">Defina os Limites de Liquidez e Plasticidade para visualizar.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {results && (
          <div className="fixed bottom-6 right-6 z-50 md:hidden animate-in slide-in-from-bottom-5">
            <Button size="default" className="shadow-xl rounded-full gap-2 px-5" onClick={() => resultRef.current?.scrollIntoView({ behavior: 'smooth' })}>
              <Activity className="w-4 h-4" />Ver Resultado
            </Button>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}
