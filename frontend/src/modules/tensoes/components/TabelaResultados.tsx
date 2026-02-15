// frontend/src/components/tensoes/TabelaResultados.tsx
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

import { TensaoPonto } from "@/modules/tensoes/schemas";

interface NivelAgua {
  profundidade: number;
  capilaridade?: number;
}

interface TabelaResultadosProps {
  pontos: TensaoPonto[];
  profundidadeNA?: number;
  alturaCapilar?: number;
  niveisAgua?: NivelAgua[];
}

export default function TabelaResultados({ pontos, profundidadeNA, alturaCapilar = 0, niveisAgua }: TabelaResultadosProps) {
  if (!pontos || pontos.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Nenhum ponto calculado ainda
      </div>
    );
  }

  // Verifica se há algum valor de tensão horizontal para exibir
  const temTensaoHorizontal = pontos.some(p => p.tensao_efetiva_horizontal !== null && p.tensao_efetiva_horizontal !== undefined);

  // Calcula a cota de início da capilaridade para destacar na tabela
  const cotaInicioCapilaridade = profundidadeNA !== undefined && alturaCapilar > 0
    ? Math.max(0, profundidadeNA - alturaCapilar)
    : null;

  return (
    <div className="rounded-md border overflow-auto" style={{ maxHeight: '400px' }}>
      <Table>
        <TableHeader className="sticky top-0 bg-background z-10">
          <TableRow>
            <TableHead className="text-center bg-muted">Prof. (m)</TableHead>
            <TableHead className="text-center bg-muted">σ<sub>v</sub> (kPa)</TableHead>
            <TableHead className="text-center bg-muted">u (kPa)</TableHead>
            <TableHead className="text-center bg-muted">σ'<sub>v</sub> (kPa)</TableHead>
            {temTensaoHorizontal && <TableHead className="text-center bg-muted">σ'<sub>h</sub> (kPa)</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {pontos.map((ponto, index) => {
            // Verifica se é algum NA (se houver múltiplos NAs)
            let naLabel = "";
            let isNA = false;

            if (niveisAgua && niveisAgua.length > 0) {
              niveisAgua.forEach((na, idx) => {
                if (Math.abs(ponto.profundidade - na.profundidade) < 0.01) {
                  isNA = true;
                  naLabel = niveisAgua.length > 1 ? `(NA${idx + 1})` : "(NA)";
                }
              });
            } else if (profundidadeNA !== undefined && Math.abs(ponto.profundidade - profundidadeNA) < 0.01) {
              isNA = true;
              naLabel = "(NA)";
            }

            // Verifica se é início de capilaridade
            let isInicioCapilar = false;
            let capilarLabel = "";

            if (niveisAgua && niveisAgua.length > 0) {
              niveisAgua.forEach((na, idx) => {
                if (na.capilaridade && na.capilaridade > 0) {
                  const inicioCapilar = Math.max(0, na.profundidade - na.capilaridade);
                  if (Math.abs(ponto.profundidade - inicioCapilar) < 0.01) {
                    isInicioCapilar = true;
                    capilarLabel = niveisAgua.length > 1 ? `(Início Cap. ${idx + 1})` : "(Início Cap.)";
                  }
                }
              });
            } else if (cotaInicioCapilaridade !== null && Math.abs(ponto.profundidade - cotaInicioCapilaridade) < 0.01) {
              isInicioCapilar = true;
              capilarLabel = "(Início Cap.)";
            }

            return (
              <TableRow
                key={index}
                className={
                  isNA ? "bg-blue-100/50 dark:bg-blue-900/20 font-medium" :
                    isInicioCapilar ? "bg-cyan-50/50 dark:bg-cyan-900/10 font-medium" : ""
                }
              >
                <TableCell className="text-center font-mono">
                  {ponto.profundidade.toFixed(2)}
                  {isNA && <span className="ml-2 text-xs text-blue-600 dark:text-blue-400">{naLabel}</span>}
                  {isInicioCapilar && <span className="ml-2 text-xs text-cyan-600 dark:text-cyan-400">{capilarLabel}</span>}
                </TableCell>
                <TableCell className="text-center font-mono">
                  {ponto.tensao_total_vertical !== null && ponto.tensao_total_vertical !== undefined
                    ? ponto.tensao_total_vertical.toFixed(2)
                    : "-"}
                </TableCell>
                <TableCell className="text-center font-mono">
                  {ponto.pressao_neutra !== null && ponto.pressao_neutra !== undefined
                    ? ponto.pressao_neutra.toFixed(2)
                    : "-"}
                </TableCell>
                <TableCell className="text-center font-mono">
                  {ponto.tensao_efetiva_vertical !== null && ponto.tensao_efetiva_vertical !== undefined
                    ? ponto.tensao_efetiva_vertical.toFixed(2)
                    : "-"}
                </TableCell>
                {temTensaoHorizontal && (
                  <TableCell className="text-center font-mono">
                    {ponto.tensao_efetiva_horizontal !== null && ponto.tensao_efetiva_horizontal !== undefined
                      ? ponto.tensao_efetiva_horizontal.toFixed(2)
                      : "-"}
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

