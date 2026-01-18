import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FileText } from "lucide-react";
import { exemplosCaracterizacao, ExemploCaracterizacao } from "@/lib/exemplos-caracterizacao";
import { Badge } from "@/components/ui/badge";

interface DialogExemplosProps {
    onSelectExample: (example: ExemploCaracterizacao) => void;
    disabled?: boolean;
}

export default function DialogExemplos({ onSelectExample, disabled }: DialogExemplosProps) {
    const [open, setOpen] = useState(false);

    const handleSelect = (exemplo: ExemploCaracterizacao) => {
        onSelectExample(exemplo);
        setOpen(false);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" disabled={disabled} className="gap-1.5">
                    <FileText className="w-4 h-4" />
                    <span className="hidden sm:inline">Exemplos</span>
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Exemplos de Índices Físicos e Consistência</DialogTitle>
                    <DialogDescription>
                        Selecione um exemplo abaixo para preencher os dados de índices físicos e limites de consistência.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-3 mt-4">
                    {exemplosCaracterizacao.map((exemplo, index) => (
                        <Card
                            key={index}
                            className="p-4 cursor-pointer hover:bg-accent/50 transition-colors border-2 hover:border-primary/20"
                            onClick={() => handleSelect(exemplo)}
                        >
                            <div className="flex items-start gap-4">
                                <div className="flex-1 space-y-1">
                                    <div className="flex items-center justify-between">
                                        <h3 className="font-semibold text-foreground text-sm uppercase tracking-wide">{exemplo.nome}</h3>
                                        <Badge variant="outline" className="text-xs">{exemplo.numAmostras} Amostra{exemplo.numAmostras > 1 ? 's' : ''}</Badge>
                                    </div>
                                    <p className="text-sm text-muted-foreground line-clamp-2">{exemplo.descricao}</p>

                                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-muted-foreground/80 font-mono">
                                        <span className="flex items-center gap-1">• Gs: {exemplo.settings.Gs}</span>
                                        <span className="flex items-center gap-1">• LL: {exemplo.limites.pontosLL.length} pontos</span>
                                        <span className="flex items-center gap-1">• Umidade: {exemplo.indices.massaUmida}g</span>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            </DialogContent>
        </Dialog>
    );
}
