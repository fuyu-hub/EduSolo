
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Info, Beaker } from "lucide-react";
import { useCaracterizacaoStore } from "../store";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export function IndicesInput() {
    const { amostras, currentAmostraIndex, updateIndices, updateSettings, settings } = useCaracterizacaoStore();
    const currentAmostra = amostras[currentAmostraIndex];

    return (
        <Card className="glass h-full">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                    <Beaker className="w-5 h-5 text-primary" />
                    Dados Físicos
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Configurações Globais (Gs) */}
                <div className="space-y-2 p-3 bg-muted/20 rounded-lg border border-border/50">
                    <Label htmlFor="Gs" className="text-sm font-semibold flex items-center gap-2">
                        Densidade dos Grãos (Gs)
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger>
                                    <Info className="w-3.5 h-3.5 text-muted-foreground" />
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>Adimensional. Ex: Areia ≈ 2.65</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </Label>
                    <Input
                        id="Gs"
                        placeholder="Ex: 2.65"
                        value={settings.Gs}
                        onChange={(e) => updateSettings({ Gs: e.target.value })}
                        className="bg-background/80"
                    />
                </div>

                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="massaUmida">Massa Úmida (g)</Label>
                            <Input
                                id="massaUmida"
                                placeholder="0.00"
                                value={currentAmostra.indices.massaUmida}
                                onChange={(e) => updateIndices(currentAmostraIndex, { massaUmida: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="massaSeca">Massa Seca (g)</Label>
                            <Input
                                id="massaSeca"
                                placeholder="0.00"
                                value={currentAmostra.indices.massaSeca}
                                onChange={(e) => updateIndices(currentAmostraIndex, { massaSeca: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="volume">Volume Total (cm³)</Label>
                        <Input
                            id="volume"
                            placeholder="Ex: 1000"
                            value={currentAmostra.indices.volume || ""}
                            onChange={(e) => updateIndices(currentAmostraIndex, { volume: e.target.value })}
                        />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
