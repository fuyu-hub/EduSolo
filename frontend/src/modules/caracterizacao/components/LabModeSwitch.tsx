
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { FlaskConical } from "lucide-react";
import { toast } from "sonner";
import { useCaracterizacaoStore } from "../store";

export function LabModeSwitch() {
    const { labMode, setLabMode } = useCaracterizacaoStore();

    const handleToggle = (checked: boolean) => {
        if (checked) {
            toast.info("Modo Laboratório (Em Breve)", {
                description: "A entrada de dados brutos de laboratório estará disponível na próxima atualização.",
                duration: 3000,
            });
            // Mantém false por enquanto
            setLabMode(false);
        } else {
            setLabMode(checked);
        }
    };

    return (
        <div className="flex items-center space-x-2 bg-muted/30 p-2 rounded-lg border border-border/50">
            <Switch
                id="lab-mode"
                checked={labMode}
                onCheckedChange={handleToggle}
            />
            <Label htmlFor="lab-mode" className="flex items-center gap-2 cursor-pointer text-sm font-medium">
                <FlaskConical className="w-4 h-4 text-primary" />
                Modo Laboratório
            </Label>
        </div>
    );
}
