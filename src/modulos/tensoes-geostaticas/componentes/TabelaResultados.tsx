/**
 * TabelaResultados — Tabela de pontos calculados do perfil de tensões
 * modulos/tensoes-geostaticas/componentes/TabelaResultados.tsx
 *
 * Exibe profundidade, γ utilizado, σv, u, σ'v e opcionalmente σh/σ'h.
 * Destaca linhas de NA e início de franja capilar com cores distintas.
 */
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TensaoPonto, CamadaSolo } from "../types";
import { cn } from "@/lib/utils";

interface NivelAguaInfo {
  profundidade: number;
  capilaridade?: number;
}

interface TabelaResultadosProps {
  pontos: TensaoPonto[];
  camadas: CamadaSolo[];
}

export default function TabelaResultados({ pontos, camadas }: TabelaResultadosProps) {
  if (!pontos || pontos.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-sm text-muted-foreground bg-muted/20 border border-dashed rounded-lg">
        Nenhum ponto calculado ainda
      </div>
    );
  }

  const niveisAgua: NivelAguaInfo[] = [];
  camadas.forEach(c => {
    if (c.profundidadeNA != null) {
      niveisAgua.push({ profundidade: c.profundidadeNA, capilaridade: c.capilaridade || 0 });
    }
  });

  const temTensaoHorizontalEfetiva = pontos.some(p => p.tensaoEfetivaHorizontal !== undefined);
  const temTensaoHorizontalTotal = pontos.some(p => p.tensaoTotalHorizontal !== undefined);

  return (
    <div className="rounded-md border overflow-auto" style={{ maxHeight: '450px' }}>
      <Table>
        <TableHeader className="sticky top-0 bg-muted/95 backdrop-blur-sm z-30 border-b">
          <TableRow>
            <TableHead className="sticky left-0 bg-muted/95 z-40 text-center font-semibold text-xs whitespace-nowrap shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] border-r text-black dark:text-white">Profundidade (m)</TableHead>
            <TableHead className="text-right font-semibold text-xs whitespace-nowrap px-4 text-black dark:text-white"><span className="font-serif italic font-bold text-sm">γ</span> (kN/m³)</TableHead>
            <TableHead className="text-right font-semibold text-xs whitespace-nowrap px-4 text-black dark:text-white"><span className="font-serif italic font-bold text-sm">σ</span><sub>v</sub> (kPa)</TableHead>
            <TableHead className="text-right font-semibold text-xs whitespace-nowrap px-4 text-black dark:text-white"><span className="font-serif italic font-bold text-sm">u</span> (kPa)</TableHead>
            <TableHead className="text-right font-semibold text-xs whitespace-nowrap px-4 text-black dark:text-white"><span className="font-serif italic font-bold text-sm">σ'</span><sub>v</sub> (kPa)</TableHead>
            {temTensaoHorizontalEfetiva && <TableHead className="text-right font-semibold text-xs whitespace-nowrap px-4 text-black dark:text-white"><span className="font-serif italic font-bold text-sm">σ'</span><sub>h</sub> (kPa)</TableHead>}
            {temTensaoHorizontalTotal && <TableHead className="text-right font-semibold text-xs whitespace-nowrap px-4 text-black dark:text-white"><span className="font-serif italic font-bold text-sm">σ</span><sub>h</sub> (kPa)</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {pontos.map((ponto, index) => {
            const isDuplicateNext = index < pontos.length - 1 && Math.abs(pontos[index + 1].profundidade - ponto.profundidade) < 0.001;
            const isDuplicatePrev = index > 0 && Math.abs(pontos[index - 1].profundidade - ponto.profundidade) < 0.001;
            const postfix = isDuplicateNext ? "( - )" : (isDuplicatePrev ? "( + )" : "");

            let naLabel = "";
            let isNA = false;

            niveisAgua.forEach((na, idx) => {
              if (Math.abs(ponto.profundidade - na.profundidade) < 0.01) {
                isNA = true;
                naLabel = niveisAgua.length > 1 ? `(NA${idx + 1})` : "(NA)";
              }
            });

            let isInicioCapilar = false;
            let capilarLabel = "";

            niveisAgua.forEach((na, idx) => {
              if (na.capilaridade && na.capilaridade > 0) {
                const inicioCapilar = Math.max(0, na.profundidade - na.capilaridade);
                if (Math.abs(ponto.profundidade - inicioCapilar) < 0.01) {
                  isInicioCapilar = true;
                  capilarLabel = niveisAgua.length > 1 ? `(Cap. ${idx + 1})` : "(Cap.)";
                }
              }
            });

            return (
              <TableRow
                key={index}
                style={{ borderBottom: isDuplicateNext ? '1px dashed var(--border)' : undefined }}
                className={cn(isDuplicateNext && "border-b-transparent")}
              >
                <TableCell className={cn(
                  "sticky left-0 bg-background text-center py-2 px-1 text-[13px] shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] z-20 border-r"
                )}>
                  <div className="flex items-center justify-center gap-1.5 h-full">
                    <span className="tabular-nums font-medium">
                      {ponto.profundidade.toFixed(2)}
                      {postfix && <sup className="ml-0.5 text-[10px]">{postfix}</sup>}
                    </span>
                    {isNA && <span className="text-[9px] text-blue-600 dark:text-blue-400 font-bold tracking-tight">{naLabel}</span>}
                    {isInicioCapilar && <span className="text-[9px] text-cyan-500 dark:text-cyan-400 font-bold tracking-tight">{capilarLabel}</span>}
                  </div>
                </TableCell>
                <TableCell className="text-right tabular-nums py-2 px-4 text-[13px] opacity-80">
                  {ponto.pesoEspecificoUsado > 0 ? ponto.pesoEspecificoUsado.toFixed(2) : <span className="opacity-40">—</span>}
                </TableCell>
                <TableCell className="text-right tabular-nums py-2 px-4 text-[13px]">
                  {ponto.tensaoTotalVertical.toFixed(2)}
                </TableCell>
                <TableCell className={cn("text-right tabular-nums py-2 px-4 text-[13px]", (isNA || isInicioCapilar) && "font-bold text-blue-600 dark:text-blue-400")}>
                  {ponto.pressaoNeutra.toFixed(2)}
                </TableCell>
                <TableCell className="text-right tabular-nums py-2 px-4 text-[13px]">
                  {ponto.tensaoEfetivaVertical.toFixed(2)}
                </TableCell>
                {temTensaoHorizontalEfetiva && (
                  <TableCell className={cn("text-right tabular-nums py-2 px-4 text-[13px]", (isDuplicateNext || isDuplicatePrev) && "font-semibold")}>
                    {ponto.tensaoEfetivaHorizontal !== undefined ? ponto.tensaoEfetivaHorizontal.toFixed(2) : <span className="opacity-40">—</span>}
                  </TableCell>
                )}
                {temTensaoHorizontalTotal && (
                  <TableCell className={cn("text-right tabular-nums py-2 px-4 text-[13px]", (isDuplicateNext || isDuplicatePrev) && "font-semibold")}>
                    {ponto.tensaoTotalHorizontal !== undefined ? ponto.tensaoTotalHorizontal.toFixed(2) : <span className="opacity-40">—</span>}
                  </TableCell>
                )}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
