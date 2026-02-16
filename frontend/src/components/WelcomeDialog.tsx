import { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

const STORAGE_KEY = "edusolo-welcome-dismissed";
const APP_VERSION = "v1.0.0";

export function WelcomeDialog() {
    const [open, setOpen] = useState(false);
    const [dontShowAgain, setDontShowAgain] = useState(false);

    useEffect(() => {
        const dismissed = localStorage.getItem(STORAGE_KEY);
        if (!dismissed) {
            setOpen(true);
        }
    }, []);

    const handleClose = () => {
        if (dontShowAgain) {
            localStorage.setItem(STORAGE_KEY, "true");
        }
        setOpen(false);
    };

    return (
        <Dialog open={open} onOpenChange={(value) => {
            if (!value) handleClose();
        }}>
            <DialogContent className="sm:max-w-[520px] gap-0 p-0 overflow-hidden">
                {/* Header com gradiente */}
                <div className="bg-gradient-to-br from-primary/15 via-primary/5 to-transparent px-6 pt-6 pb-4">
                    <DialogHeader className="space-y-1">
                        <DialogTitle className="text-xl font-bold text-foreground">
                            Bem-vindo ao{" "}
                            <span className="text-primary">Edu</span>
                            <span>Solos</span>
                        </DialogTitle>
                        <DialogDescription className="text-sm text-muted-foreground">
                            Plataforma educacional para Mecânica dos Solos
                        </DialogDescription>
                    </DialogHeader>
                </div>

                {/* Conteúdo */}
                <div className="px-6 py-4 space-y-4 text-sm text-muted-foreground leading-relaxed max-h-[60vh] overflow-y-auto">
                    <p>
                        O <strong className="text-foreground">EduSolos</strong> é uma plataforma interativa voltada
                        para o aprendizado e a prática de cálculos em Mecânica dos Solos e Geotecnia.
                        A ferramenta oferece módulos para índices físicos, limites de consistência,
                        classificação granulométrica, compactação e mais.
                    </p>

                    <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 space-y-1.5">
                        <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wide">
                            ⚠ Aviso Importante
                        </p>
                        <p className="text-xs text-muted-foreground">
                            Esta é uma ferramenta de caráter <strong className="text-foreground">exclusivamente educacional</strong>.
                            Os resultados obtidos não devem ser utilizados para fins profissionais sem a devida
                            verificação e validação por profissional habilitado. O autor não se responsabiliza
                            pelo uso dos resultados para finalidades diferentes das educacionais.
                        </p>
                    </div>

                    <div className="bg-primary/5 border border-primary/15 rounded-lg p-3 space-y-1.5">
                        <p className="text-xs font-semibold text-primary uppercase tracking-wide">
                            🚧 Em Desenvolvimento
                        </p>
                        <p className="text-xs text-muted-foreground">
                            Alguns recursos como <strong className="text-foreground">Relatórios</strong> e{" "}
                            <strong className="text-foreground">Material Educacional</strong> ainda estão sendo
                            desenvolvidos e serão disponibilizados em futuras atualizações.
                        </p>
                    </div>

                    {/* Créditos */}
                    <div className="pt-2 border-t border-border/50">
                        <div className="flex justify-between">
                            <div className="space-y-0.5">
                                <p className="text-xs text-foreground font-medium">Samuel Sousa Santos</p>
                                <p className="text-xs text-muted-foreground">Aluno de Engenharia Civil</p>
                                <p className="text-xs text-muted-foreground">Universidade Federal do Cariri (UFCA)</p>
                            </div>
                            <div className="space-y-0.5 text-right">
                                <p className="text-xs text-foreground font-medium">Danilo Ferreira da Silva</p>
                                <p className="text-xs text-muted-foreground">Aluno de Engenharia Civil</p>
                                <p className="text-xs text-muted-foreground">Universidade Federal do Cariri (UFCA)</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <DialogFooter className="px-6 py-4 border-t border-border/50 bg-muted/30">
                    <div className="flex items-center justify-between w-full gap-4">
                        <div className="flex items-center gap-2">
                            <Checkbox
                                id="dont-show-again"
                                checked={dontShowAgain}
                                onCheckedChange={(checked) => setDontShowAgain(checked === true)}
                            />
                            <Label
                                htmlFor="dont-show-again"
                                className="text-xs text-muted-foreground cursor-pointer select-none"
                            >
                                Não exibir novamente
                            </Label>
                        </div>

                        <div className="flex items-center gap-3">
                            <span className="text-[10px] text-muted-foreground/50 font-mono">{APP_VERSION}</span>
                            <Button onClick={handleClose} size="sm" className="px-6">
                                Entendido
                            </Button>
                        </div>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
