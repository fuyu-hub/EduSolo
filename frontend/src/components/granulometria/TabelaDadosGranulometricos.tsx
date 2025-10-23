import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, Table as TableIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PontoGranulometrico {
  abertura: number;
  massa_retida: number;
  porc_retida: number;
  porc_retida_acum: number;
  porc_passante: number;
}

interface TabelaDadosGranulometricosProps {
  dados: PontoGranulometrico[];
  massaTotal: number;
}

export default function TabelaDadosGranulometricos({ dados, massaTotal }: TabelaDadosGranulometricosProps) {
  
  const exportarCSV = () => {
    // Criar cabeçalho
    const headers = [
      "Abertura (mm)",
      "Massa Retida (g)",
      "% Retida",
      "% Retida Acumulada",
      "% Passante"
    ];
    
    // Criar linhas de dados
    const rows = dados.map(ponto => [
      ponto.abertura.toFixed(3),
      ponto.massa_retida.toFixed(2),
      ponto.porc_retida.toFixed(2),
      ponto.porc_retida_acum.toFixed(2),
      ponto.porc_passante.toFixed(2)
    ]);
    
    // Adicionar linha de total
    const massaTotal_calc = dados.reduce((sum, p) => sum + p.massa_retida, 0);
    rows.push([
      "TOTAL",
      massaTotal_calc.toFixed(2),
      "100.00",
      "-",
      "-"
    ]);
    
    // Combinar tudo em CSV
    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.join(","))
    ].join("\n");
    
    // Download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `analise_granulometrica_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Calcular total para verificação
  const massaTotalCalculada = dados.reduce((sum, ponto) => sum + ponto.massa_retida, 0);
  const perdaMassa = massaTotal - massaTotalCalculada;
  const percPerdaMassa = (perdaMassa / massaTotal) * 100;

  return (
    <Card className="glass border-2">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <TableIcon className="w-5 h-5 text-fuchsia-500" />
              Dados Granulométricos Detalhados
            </CardTitle>
          </div>
          <Button onClick={exportarCSV} variant="outline" size="sm" className="gap-1.5 h-8 text-xs">
            <Download className="w-3.5 h-3.5" />
            CSV
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="rounded-lg border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableHead className="text-center font-bold text-xs py-2">Peneira</TableHead>
                <TableHead className="text-center font-bold text-xs py-2">Abertura</TableHead>
                <TableHead className="text-center font-bold text-xs py-2">M. Retida (g)</TableHead>
                <TableHead className="text-center font-bold text-xs py-2">% Ret.</TableHead>
                <TableHead className="text-center font-bold text-xs py-2">% Ret. Ac.</TableHead>
                <TableHead className="text-center font-bold text-xs py-2 bg-primary/10">% Pass.</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dados.map((ponto, index) => (
                <TableRow key={index} className="hover:bg-muted/20">
                  <TableCell className="text-center font-semibold text-xs py-1.5">
                    {getNomePeneira(ponto.abertura)}
                  </TableCell>
                  <TableCell className="text-center text-xs py-1.5">{ponto.abertura.toFixed(3)}</TableCell>
                  <TableCell className="text-center text-xs py-1.5">{ponto.massa_retida.toFixed(2)}</TableCell>
                  <TableCell className="text-center text-xs py-1.5">{ponto.porc_retida.toFixed(2)}%</TableCell>
                  <TableCell className="text-center text-xs py-1.5">{ponto.porc_retida_acum.toFixed(2)}%</TableCell>
                  <TableCell className="text-center font-bold text-xs py-1.5 bg-primary/5">{ponto.porc_passante.toFixed(2)}%</TableCell>
                </TableRow>
              ))}
              <TableRow className="bg-gradient-to-r from-fuchsia-500/10 to-purple-600/10 font-bold border-t border-fuchsia-500/30">
                <TableCell className="text-center text-xs py-2" colSpan={2}>TOTAL</TableCell>
                <TableCell className="text-center text-xs py-2">{massaTotalCalculada.toFixed(2)}</TableCell>
                <TableCell className="text-center text-xs py-2">100.00%</TableCell>
                <TableCell className="text-center text-xs py-2">-</TableCell>
                <TableCell className="text-center text-xs py-2 bg-primary/5">-</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>

        {/* Informações adicionais */}
        <div className="mt-4 p-3 rounded-lg bg-gradient-to-br from-muted/50 to-muted/30 border border-muted space-y-1.5 text-sm">
          <p className="text-sm font-semibold text-muted-foreground uppercase mb-2">Resumo</p>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Massa Total:</span>
            <span className="font-bold text-sm">{massaTotal.toFixed(2)} g</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Massa Retida:</span>
            <span className="font-bold text-sm">{massaTotalCalculada.toFixed(2)} g</span>
          </div>
          {Math.abs(perdaMassa) > 0.01 && (
            <div className="flex justify-between items-center pt-1.5 border-t border-muted-foreground/20">
              <span className="text-muted-foreground">Perda:</span>
              <span className={`font-bold text-sm ${Math.abs(percPerdaMassa) > 1 ? "text-amber-600 dark:text-amber-400" : "text-green-600 dark:text-green-400"}`}>
                {perdaMassa.toFixed(2)} g ({percPerdaMassa.toFixed(2)}%)
              </span>
            </div>
          )}
          {Math.abs(percPerdaMassa) > 1 && (
            <div className="mt-2 p-2 rounded bg-amber-100 dark:bg-amber-900/30 border border-amber-400 dark:border-amber-700 text-xs text-amber-800 dark:text-amber-200 flex items-center gap-2">
              <span>⚠️</span>
              <p>Perda &gt; 1%. Verificar NBR 7181</p>
            </div>
          )}
          {Math.abs(percPerdaMassa) <= 1 && Math.abs(perdaMassa) > 0.01 && (
            <div className="mt-2 p-2 rounded bg-green-100 dark:bg-green-900/30 border border-green-400 dark:border-green-700 text-xs text-green-800 dark:text-green-200 flex items-center gap-2">
              <span>✓</span>
              <p>Perda aceitável</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Função auxiliar para identificar nome da peneira
function getNomePeneira(abertura: number): string {
  const peneiras: { [key: number]: string } = {
    50.8: '2"',
    50.80: '2"',
    38.1: '1½"',
    38.10: '1½"',
    25.4: '1"',
    25.40: '1"',
    19.1: '¾"',
    19.10: '¾"',
    9.52: '3/8"',
    9.5: '3/8"',
    4.76: 'Nº 4',
    4.75: 'Nº 4',
    2.0: 'Nº 10',
    2.00: 'Nº 10',
    1.19: 'Nº 16',
    1.20: 'Nº 16',
    0.59: 'Nº 30',
    0.60: 'Nº 30',
    0.42: 'Nº 40',
    0.25: 'Nº 60',
    0.149: 'Nº 100',
    0.15: 'Nº 100',
    0.150: 'Nº 100',
    0.074: 'Nº 200',
    0.075: 'Nº 200',
  };

  // Procurar correspondência exata ou próxima
  for (const [key, value] of Object.entries(peneiras)) {
    if (Math.abs(parseFloat(key) - abertura) < 0.01) {
      return value;
    }
  }

  return '-';
}

