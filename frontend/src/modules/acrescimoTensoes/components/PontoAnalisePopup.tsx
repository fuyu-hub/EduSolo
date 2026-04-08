import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MapPin, Trash2 } from "lucide-react";

interface PontoAnalisePopupProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  coordenadas: { x: number; y?: number; z: number };
  nomeInicial?: string;
  isEdicao?: boolean;
  mostrarY?: boolean; // Se true, mostra campo Y (para Newmark 3D)
  onConfirm: (nome: string, x: number, y: number, z: number) => void;
  onExcluir?: () => void;
}

export default function PontoAnalisePopup({
  open,
  onOpenChange,
  coordenadas,
  nomeInicial = "",
  isEdicao = false,
  mostrarY = true,
  onConfirm,
  onExcluir
}: PontoAnalisePopupProps) {
  const [nome, setNome] = useState(nomeInicial);
  const [x, setX] = useState(coordenadas.x);
  const [y, setY] = useState(coordenadas.y ?? 0);
  const [z, setZ] = useState(coordenadas.z > 0 ? coordenadas.z : 0.5);
  const [erro, setErro] = useState("");
  const [canClose, setCanClose] = useState(false);

  useEffect(() => {
    if (open) {
      setNome(nomeInicial);
      setX(coordenadas.x);
      setY(coordenadas.y ?? 0);
      setZ(coordenadas.z > 0 ? coordenadas.z : 0.5);
      setErro("");
      setCanClose(false);
      
      // Previne fechamento imediato por duplo clique
      const timer = setTimeout(() => {
        setCanClose(true);
      }, 300);
      
      return () => clearTimeout(timer);
    }
  }, [open, nomeInicial, coordenadas]);

  const handleConfirm = () => {
    const nomeTrimmed = nome.trim();
    
    if (nomeTrimmed === "") {
      setErro("O nome do ponto é obrigatório");
      return;
    }
    
    if (isNaN(x) || isNaN(z) || (mostrarY && isNaN(y))) {
      setErro("As coordenadas devem ser números válidos");
      return;
    }
    
    if (z <= 0) {
      setErro("A profundidade (Z) deve ser maior que zero");
      return;
    }
    
    onConfirm(nomeTrimmed, x, y, z);
    onOpenChange(false);
  };

  const handleExcluir = () => {
    if (onExcluir) {
      onExcluir();
      onOpenChange(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleConfirm();
    }
  };

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      // Só permite fechar se canClose for true (após 300ms) ou se estiver fechando programaticamente
      if (!newOpen || canClose) {
        onOpenChange(newOpen);
      }
    }}>
      <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => {
        // Previne fechamento por clique fora durante o período de proteção
        if (!canClose) {
          e.preventDefault();
        }
      }}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
              <MapPin className="w-4 h-4 text-white" />
            </div>
            {isEdicao ? "Editar Ponto de Análise" : "Novo Ponto de Análise"}
          </DialogTitle>
          <DialogDescription>
            {isEdicao ? "Edite o nome, coordenadas do ponto ou exclua-o" : "Defina um nome e coordenadas para o ponto de análise"}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="nome-ponto">Nome do Ponto</Label>
            <Input
              id="nome-ponto"
              type="text"
              placeholder="Ex: Ponto A, P1, Fundação..."
              value={nome}
              onChange={(e) => {
                setNome(e.target.value);
                setErro("");
              }}
              onKeyDown={handleKeyDown}
              onFocus={(e) => e.target.select()} // Seleciona tudo ao focar
              className={erro ? "border-red-500" : ""}
              autoFocus
            />
          </div>
          
          <div className={`grid gap-3 ${mostrarY ? 'grid-cols-3' : 'grid-cols-2'}`}>
            <div className="space-y-2">
              <Label htmlFor="coordenada-x">X (m)</Label>
              <Input
                id="coordenada-x"
                type="number"
                step="0.5"
                placeholder="0.0"
                value={x}
                onChange={(e) => {
                  const val = e.target.value;
                  setX(val === '' ? 0 : parseFloat(val));
                  setErro("");
                }}
                onKeyDown={handleKeyDown}
                className={erro ? "border-red-500" : ""}
              />
              <p className="text-xs text-muted-foreground">Horizontal</p>
            </div>
            
            {mostrarY && (
              <div className="space-y-2">
                <Label htmlFor="coordenada-y">Y (m)</Label>
                <Input
                  id="coordenada-y"
                  type="number"
                  step="0.5"
                  placeholder="0.0"
                  value={y}
                  onChange={(e) => {
                    const val = e.target.value;
                    setY(val === '' ? 0 : parseFloat(val));
                    setErro("");
                  }}
                  onKeyDown={handleKeyDown}
                  className={erro ? "border-red-500" : ""}
                />
                <p className="text-xs text-muted-foreground">Transversal</p>
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="coordenada-z">Z (m)</Label>
              <Input
                id="coordenada-z"
                type="number"
                step="0.5"
                min="0.1"
                placeholder="0.5"
                value={z}
                onChange={(e) => {
                  const val = e.target.value;
                  setZ(val === '' || isNaN(parseFloat(val)) ? 0.5 : parseFloat(val));
                  setErro("");
                }}
                onKeyDown={handleKeyDown}
                className={erro ? "border-red-500" : ""}
              />
              <p className="text-xs text-muted-foreground">Profund.</p>
            </div>
          </div>
          
          {erro && <p className="text-sm text-red-500">{erro}</p>}
          
          <div className="text-xs text-muted-foreground bg-muted p-3 rounded-md">
            <p className="font-semibold mb-1">💡 Dica:</p>
            <p>Você pode editar as coordenadas aqui ou arrastar o ponto no canvas após salvá-lo.</p>
          </div>
        </div>
        
        <DialogFooter className="flex-col sm:flex-row gap-2">
          {isEdicao && onExcluir && (
            <Button 
              variant="destructive" 
              onClick={handleExcluir}
              className="sm:mr-auto"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Excluir Ponto
            </Button>
          )}
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm}>
            {isEdicao ? "Salvar" : "Criar Ponto"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

