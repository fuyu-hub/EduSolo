
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Droplet, Plus, Trash2 } from "lucide-react";
import { useCaracterizacaoStore } from "../store";
import { Separator } from "@/components/ui/separator";

export function LimitesInput() {
    const { limites, updateLimites } = useCaracterizacaoStore();
    const { pontosLL, pontosLP, umidadeNatural, percentualArgila } = limites;

    const handleUpdateLL = (idx: number, field: string, value: string) => {
        const newPontos = [...pontosLL];
        newPontos[idx] = { ...newPontos[idx], [field]: value };
        updateLimites({ pontosLL: newPontos });
    };

    const handleUpdateLP = (idx: number, field: string, value: string) => {
        const newPontos = [...pontosLP];
        newPontos[idx] = { ...newPontos[idx], [field]: value };
        updateLimites({ pontosLP: newPontos });
    };

    const addPontoLL = () => {
        const generateId = () => `${Date.now()}-${Math.random()}`;
        updateLimites({
            pontosLL: [...pontosLL, { id: generateId(), numGolpes: "", massaUmidaRecipiente: "", massaSecaRecipiente: "", massaRecipiente: "", umidade: "" }]
        });
    };

    const removePontoLL = (index: number) => {
        if (pontosLL.length <= 2) return;
        const newPontos = pontosLL.filter((_, i) => i !== index);
        updateLimites({ pontosLL: newPontos });
    };

    return (
        <Card className="glass h-full">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                    <Droplet className="w-5 h-5 text-blue-500" />
                    Limites (LL e LP)
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">

                {/* Limite de Liquidez */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <Label className="text-base font-medium text-foreground/80">Limite de Liquidez (LL)</Label>
                        <Button size="sm" variant="ghost" onClick={addPontoLL} className="h-7 px-2 text-xs">
                            <Plus className="w-3 h-3 mr-1" /> Adicionar Ponto
                        </Button>
                    </div>

                    <div className="space-y-3 max-h-[200px] overflow-y-auto pr-1">
                        {pontosLL.map((ponto, i) => (
                            <div key={ponto.id} className="grid grid-cols-[1fr,1fr,1fr,auto] gap-2 items-end p-2 rounded border bg-muted/10">
                                <div className="space-y-1">
                                    <Label className="text-[10px]">Golpes</Label>
                                    <Input
                                        className="h-8 text-sm"
                                        placeholder="N"
                                        value={ponto.numGolpes}
                                        onChange={e => handleUpdateLL(i, 'numGolpes', e.target.value)}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-[10px]">M. Úmida+T</Label>
                                    <Input
                                        className="h-8 text-sm"
                                        placeholder="g"
                                        value={ponto.massaUmidaRecipiente}
                                        onChange={e => handleUpdateLL(i, 'massaUmidaRecipiente', e.target.value)}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-[10px]">M. Seca+T</Label>
                                    <Input
                                        className="h-8 text-sm"
                                        placeholder="g"
                                        value={ponto.massaSecaRecipiente}
                                        onChange={e => handleUpdateLL(i, 'massaSecaRecipiente', e.target.value)}
                                    />
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-destructive hover:text-destructive/80 mb-0.5"
                                    onClick={() => removePontoLL(i)}
                                    disabled={pontosLL.length <= 2}
                                >
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>
                        ))}
                    </div>
                </div>

                <Separator />

                {/* Limite de Plasticidade e Outros */}
                <div className="space-y-4">
                    <Label className="text-base font-medium text-foreground/80">Dados Complementares</Label>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="lp_massa_umida">LP - M. Úmida+T</Label>
                            <Input
                                id="lp_massa_umida"
                                placeholder="g"
                                value={pontosLP[0].massaUmidaRecipiente}
                                onChange={e => handleUpdateLP(0, 'massaUmidaRecipiente', e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="lp_massa_seca">LP - M. Seca+T</Label>
                            <Input
                                id="lp_massa_seca"
                                placeholder="g"
                                value={pontosLP[0].massaSecaRecipiente}
                                onChange={e => handleUpdateLP(0, 'massaSecaRecipiente', e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="umidadeNatural">Umidade Nat. (%)</Label>
                            <Input
                                id="umidadeNatural"
                                placeholder="Ex: 15.5"
                                value={umidadeNatural}
                                onChange={e => updateLimites({ umidadeNatural: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="argila">Argila (%)</Label>
                            <Input
                                id="argila"
                                placeholder="Opcional"
                                value={percentualArgila}
                                onChange={e => updateLimites({ percentualArgila: e.target.value })}
                            />
                        </div>
                    </div>
                </div>

            </CardContent>
        </Card>
    );
}
