// frontend/src/components/compactacao/TabelaResultados.tsx
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

interface PontoCalculado {
  umidade: number;
  peso_especifico_seco: number;
}

interface TabelaResultadosProps {
  pontos: PontoCalculado[];
  indiceMaximo?: number;
}

export default function TabelaResultados({ pontos, indiceMaximo }: TabelaResultadosProps) {
  if (!pontos || pontos.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Nenhum ponto calculado ainda
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow className="h-8">
            <TableHead className="text-center py-2">Ponto</TableHead>
            <TableHead className="text-center py-2">Umidade (%)</TableHead>
            <TableHead className="text-center py-2">γ seco (g/cm³)</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {pontos.map((ponto, index) => (
            <TableRow 
              key={index}
              className={cn(
                "h-9",
                indiceMaximo === index && "bg-primary/10 font-semibold"
              )}
            >
              <TableCell className="text-center py-1.5 text-sm">{index + 1}</TableCell>
              <TableCell className="text-center py-1.5 text-sm">{ponto.umidade.toFixed(2)}</TableCell>
              <TableCell className="text-center py-1.5 text-sm font-mono">
                {(ponto.peso_especifico_seco / 10).toFixed(3)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {indiceMaximo !== undefined && (
        <div className="text-xs text-muted-foreground px-4 py-2 bg-muted/30 border-t">
          <span className="flex items-center gap-2">
            <span className="inline-block w-3 h-3 bg-primary/10 border border-primary/20 rounded"></span>
            Ponto com máximo γ seco
          </span>
        </div>
      )}
    </div>
  );
}

