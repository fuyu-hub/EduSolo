// frontend/src/components/compactacao/TabelaResultados.tsx
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

import { PontoCurvaCompactacao } from "../schemas";

interface TabelaResultadosProps {
  pontos: PontoCurvaCompactacao[];
}

export default function TabelaResultados({ pontos }: TabelaResultadosProps) {
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
            <TableHead className="text-center py-2">
              <span className="font-serif italic">w</span> (%)
            </TableHead>
            <TableHead className="text-center py-2">
              <span className="font-serif italic">ρ</span><sub>d</sub> (g/cm³)
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {pontos.map((ponto, index) => (
            <TableRow key={index} className="h-9">
              <TableCell className="text-center py-1.5 text-sm">{index + 1}</TableCell>
              <TableCell className="text-center py-1.5 text-sm">{ponto.umidade.toFixed(2)}</TableCell>
              <TableCell className="text-center py-1.5 text-sm font-mono">
                {(ponto.peso_especifico_seco / 10).toFixed(3)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

