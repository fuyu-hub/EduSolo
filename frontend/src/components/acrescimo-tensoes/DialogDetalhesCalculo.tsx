import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Info } from "lucide-react";

interface Quadrante {
  nome: string;
  a: number;
  b: number;
  m: number;
  n: number;
  I: number;
  I_com_sinal: number;
  sinal: string;
}

interface DetalhesCalculo {
  x_rel: number;
  y_rel: number;
  z: number;
  distancias: {
    dist_direita: number;
    dist_esquerda: number;
    dist_frente: number;
    dist_tras: number;
  };
  quadrantes: Quadrante[];
  I_total: number;
  p: number;
  delta_sigma_v: number;
}

interface DialogDetalhesCalculoProps {
  open: boolean;
  onClose: () => void;
  detalhes: DetalhesCalculo | null;
  nomePonto: string;
}

export default function DialogDetalhesCalculo({
  open,
  onClose,
  detalhes,
  nomePonto,
}: DialogDetalhesCalculoProps) {
  if (!detalhes) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/30">
              <Info className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            </div>
            Detalhes do Cálculo - {nomePonto}
          </DialogTitle>
          <DialogDescription>
            Método de Newmark - Princípio da Superposição
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Informações do Ponto */}
          <div className="p-4 rounded-lg bg-muted/50 border">
            <h3 className="font-semibold text-sm mb-3 text-orange-600 dark:text-orange-400">
              📍 Posição do Ponto
            </h3>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">x (rel.)</p>
                <p className="font-mono font-semibold">{detalhes.x_rel} m</p>
              </div>
              <div>
                <p className="text-muted-foreground">y (rel.)</p>
                <p className="font-mono font-semibold">{detalhes.y_rel} m</p>
              </div>
              <div>
                <p className="text-muted-foreground">Profundidade (z)</p>
                <p className="font-mono font-semibold">{detalhes.z} m</p>
              </div>
            </div>
          </div>

          {/* Distâncias */}
          <div className="p-4 rounded-lg bg-muted/50 border">
            <h3 className="font-semibold text-sm mb-3 text-orange-600 dark:text-orange-400">
              📏 Distâncias aos Lados da Sapata
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm mb-3">
              <div>
                <p className="text-muted-foreground">Direita</p>
                <p className="font-mono font-semibold">
                  {Math.abs(detalhes.distancias.dist_direita).toFixed(2)} m
                  {detalhes.distancias.dist_direita < 0 && (
                    <span className="text-xs text-red-600 dark:text-red-400 ml-2 font-bold">(fora)</span>
                  )}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Esquerda</p>
                <p className="font-mono font-semibold">
                  {Math.abs(detalhes.distancias.dist_esquerda).toFixed(2)} m
                  {detalhes.distancias.dist_esquerda < 0 && (
                    <span className="text-xs text-red-600 dark:text-red-400 ml-2 font-bold">(fora)</span>
                  )}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Frente (y+)</p>
                <p className="font-mono font-semibold">
                  {Math.abs(detalhes.distancias.dist_frente).toFixed(2)} m
                  {detalhes.distancias.dist_frente < 0 && (
                    <span className="text-xs text-red-600 dark:text-red-400 ml-2 font-bold">(fora)</span>
                  )}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Trás (y-)</p>
                <p className="font-mono font-semibold">
                  {Math.abs(detalhes.distancias.dist_tras).toFixed(2)} m
                  {detalhes.distancias.dist_tras < 0 && (
                    <span className="text-xs text-red-600 dark:text-red-400 ml-2 font-bold">(fora)</span>
                  )}
                </p>
              </div>
            </div>
            <div className="text-xs text-muted-foreground bg-blue-50 dark:bg-blue-950/20 p-2 rounded border border-blue-200 dark:border-blue-800">
              <Info className="w-3 h-3 inline mr-1" />
              <strong>Nota:</strong> Quando marcado como <span className="text-red-600 dark:text-red-400 font-bold">(fora)</span>, 
              o ponto está além da borda da sapata. O método de Newmark usa superposição com sinais para calcular corretamente 
              a tensão em pontos externos.
            </div>
          </div>

          {/* Quadrantes */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm text-orange-600 dark:text-orange-400">
              🔢 Superposição - 4 Quadrantes
            </h3>
            {detalhes.quadrantes.map((q, idx) => (
              <div
                key={idx}
                className={`p-4 rounded-lg border ${
                  q.sinal === "+"
                    ? "bg-green-50 dark:bg-green-950/20 border-green-300 dark:border-green-800"
                    : "bg-red-50 dark:bg-red-950/20 border-red-300 dark:border-red-800"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-sm">{q.nome}</h4>
                  <span
                    className={`text-xl font-bold ${
                      q.sinal === "+"
                        ? "text-green-700 dark:text-green-400"
                        : "text-red-700 dark:text-red-400"
                    }`}
                  >
                    {q.sinal}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-3 text-xs">
                  <div>
                    <p className="text-muted-foreground">Dimensões</p>
                    <p className="font-mono">
                      a = {q.a} m<br />
                      b = {q.b} m
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Razões (m, n)</p>
                    <p className="font-mono">
                      m = {q.m}<br />
                      n = {q.n}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Fator I</p>
                    <p className="font-mono">
                      |I| = {q.I.toFixed(6)}<br />
                      I = {q.I_com_sinal.toFixed(6)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Resultado Final */}
          <div className="p-4 rounded-lg bg-gradient-to-br from-orange-100 to-red-100 dark:from-orange-950/30 dark:to-red-950/30 border-2 border-orange-500">
            <h3 className="font-semibold text-sm mb-3 text-orange-700 dark:text-orange-300">
              ✅ Resultado Final
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between items-center">
                <p className="text-muted-foreground">Fator de Influência Total (I<sub>total</sub>)</p>
                <p className="font-mono font-bold text-lg">
                  {detalhes.I_total.toFixed(6)}
                </p>
              </div>
              <div className="flex justify-between items-center">
                <p className="text-muted-foreground">Pressão Aplicada (p)</p>
                <p className="font-mono font-bold text-lg">{detalhes.p} kPa</p>
              </div>
              <div className="h-px bg-orange-300 dark:bg-orange-700 my-2"></div>
              <div className="flex justify-between items-center">
                <p className="font-semibold">Acréscimo de Tensão (Δσ<sub>z</sub>)</p>
                <p className="font-mono font-bold text-2xl bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                  {detalhes.delta_sigma_v.toFixed(2)} kPa
                </p>
              </div>
            </div>
          </div>

          {/* Fórmula */}
          <div className="p-4 rounded-lg bg-muted/30 border text-xs text-muted-foreground">
            <p className="font-mono text-center">
              Δσ<sub>z</sub> = p × I<sub>total</sub> = {detalhes.p} × {detalhes.I_total.toFixed(6)} = {detalhes.delta_sigma_v.toFixed(2)} kPa
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

