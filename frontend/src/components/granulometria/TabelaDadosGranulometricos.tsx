import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Download } from "lucide-react";
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
    <Card className="glass">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Dados Granulométricos Detalhados</CardTitle>
          <Button onClick={exportarCSV} variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Exportar CSV
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-center font-semibold">Peneira</TableHead>
                <TableHead className="text-center font-semibold">Abertura (mm)</TableHead>
                <TableHead className="text-center font-semibold">Massa Retida (g)</TableHead>
                <TableHead className="text-center font-semibold">% Retida</TableHead>
                <TableHead className="text-center font-semibold">% Retida Acum.</TableHead>
                <TableHead className="text-center font-semibold">% Passante</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dados.map((ponto, index) => (
                <TableRow key={index}>
                  <TableCell className="text-center font-medium">
                    {getNomePeneira(ponto.abertura)}
                  </TableCell>
                  <TableCell className="text-center">{ponto.abertura.toFixed(3)}</TableCell>
                  <TableCell className="text-center">{ponto.massa_retida.toFixed(2)}</TableCell>
                  <TableCell className="text-center">{ponto.porc_retida.toFixed(2)}</TableCell>
                  <TableCell className="text-center">{ponto.porc_retida_acum.toFixed(2)}</TableCell>
                  <TableCell className="text-center font-medium">{ponto.porc_passante.toFixed(2)}</TableCell>
                </TableRow>
              ))}
              <TableRow className="bg-accent/50 font-semibold">
                <TableCell className="text-center" colSpan={2}>TOTAL</TableCell>
                <TableCell className="text-center">{massaTotalCalculada.toFixed(2)}</TableCell>
                <TableCell className="text-center">100.00</TableCell>
                <TableCell className="text-center">-</TableCell>
                <TableCell className="text-center">-</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>

        {/* Informações adicionais */}
        <div className="mt-4 p-3 rounded-lg bg-muted/50 space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Massa Total da Amostra:</span>
            <span className="font-semibold">{massaTotal.toFixed(2)} g</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Massa Total Retida:</span>
            <span className="font-semibold">{massaTotalCalculada.toFixed(2)} g</span>
          </div>
          {Math.abs(perdaMassa) > 0.01 && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Perda de Massa:</span>
              <span className={`font-semibold ${Math.abs(percPerdaMassa) > 1 ? "text-amber-500" : ""}`}>
                {perdaMassa.toFixed(2)} g ({percPerdaMassa.toFixed(2)}%)
              </span>
            </div>
          )}
          {Math.abs(percPerdaMassa) > 1 && (
            <div className="text-xs text-amber-600 dark:text-amber-400 mt-2">
              ⚠️ Perda de massa superior a 1%. Verifique os dados do ensaio.
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

