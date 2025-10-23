// frontend/src/components/tensoes/TabelaCamadas.tsx
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface CamadaResumo {
  espessura: number;
  gamaNat?: number | null;
  gamaSat?: number | null;
  Ko: number;
}

interface TabelaCamadasProps {
  camadas: CamadaResumo[];
  profundidadeNA: number;
}

export default function TabelaCamadas({ camadas, profundidadeNA }: TabelaCamadasProps) {
  if (!camadas || camadas.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Nenhuma camada definida ainda
      </div>
    );
  }

  let profundidadeAcumulada = 0;
  const camadasComProfundidade = camadas.map(camada => {
    const profBase = profundidadeAcumulada + camada.espessura;
    const resultado = { ...camada, profundidadeBase: profBase };
    profundidadeAcumulada = profBase;
    return resultado;
  });

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-center w-16">#</TableHead>
            <TableHead className="text-center">Espess. (m)</TableHead>
            <TableHead className="text-center">γ<sub>nat</sub> (kN/m³)</TableHead>
            <TableHead className="text-center">γ<sub>sat</sub> (kN/m³)</TableHead>
            <TableHead className="text-center">K<sub>o</sub></TableHead>
            <TableHead className="text-center">Prof. Base (m)</TableHead>
            <TableHead className="text-center">Posição NA</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {camadasComProfundidade.map((camada, index) => {
            const profTopo = index === 0 ? 0 : camadasComProfundidade[index - 1].profundidadeBase;
            const profBase = camada.profundidadeBase;
            
            let posicaoNA: string;
            let badgeVariant: "default" | "secondary" | "destructive" | "outline" = "outline";
            
            if (profBase <= profundidadeNA) {
              posicaoNA = "Acima NA";
              badgeVariant = "default";
            } else if (profTopo >= profundidadeNA) {
              posicaoNA = "Abaixo NA";
              badgeVariant = "secondary";
            } else {
              posicaoNA = "Atravessa NA";
              badgeVariant = "destructive";
            }

            return (
              <TableRow key={index}>
                <TableCell className="text-center font-medium">{index + 1}</TableCell>
                <TableCell className="text-center">{camada.espessura.toFixed(2)}</TableCell>
                <TableCell className="text-center">
                  {camada.gamaNat !== null && camada.gamaNat !== undefined ? camada.gamaNat.toFixed(1) : "-"}
                </TableCell>
                <TableCell className="text-center">
                  {camada.gamaSat !== null && camada.gamaSat !== undefined ? camada.gamaSat.toFixed(1) : "-"}
                </TableCell>
                <TableCell className="text-center">{camada.Ko.toFixed(2)}</TableCell>
                <TableCell className="text-center font-mono">{profBase.toFixed(2)}</TableCell>
                <TableCell className="text-center">
                  <Badge variant={badgeVariant} className="text-xs">
                    {posicaoNA}
                  </Badge>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      <div className="text-xs text-muted-foreground px-4 py-2 bg-muted/30 border-t">
        Profundidade do NA: {profundidadeNA.toFixed(2)} m
      </div>
    </div>
  );
}

