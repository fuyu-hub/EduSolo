import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";
import * as XLSX from 'xlsx';

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
  showDadosDetalhados?: boolean;
  showComposicao?: boolean;
}

export default function TabelaDadosGranulometricos({ 
  dados, 
  massaTotal, 
  showDadosDetalhados = true,
  showComposicao = true 
}: TabelaDadosGranulometricosProps) {
  
  const exportarExcel = () => {
    // Sheet 1: Dados Granulométricos Detalhados
    const wsData1 = [
      // Cabeçalhos
      ["Peneira", "Abertura (mm)", "Massa Retida (g)", "% Retida", "% Retida Acumulada", "% Passante"],
      // Dados
      ...dados.map(ponto => [
        getNomePeneira(ponto.abertura),
        parseFloat(ponto.abertura.toFixed(3)),
        parseFloat(ponto.massa_retida.toFixed(2)),
        parseFloat(ponto.porc_retida.toFixed(2)),
        parseFloat(ponto.porc_retida_acum.toFixed(2)),
        parseFloat(ponto.porc_passante.toFixed(2))
      ]),
      // Total
      ["TOTAL", "", parseFloat(dados.reduce((sum, p) => sum + p.massa_retida, 0).toFixed(2)), 100.00, "-", "-"]
    ];

    // Sheet 2: Composição por Tipo
    const porcentagens = calcularPorcentagensPorTipo();
    const wsData2 = [
      ["Composição por Tipo de Material"],
      [],
      ["Tipo", "Faixa (mm)", "% da Amostra"],
      ["Pedregulho", "≥ 2.0", parseFloat(porcentagens.pedregulho.toFixed(2))],
      ["Areia Grossa", "0.6 - 2.0", parseFloat(porcentagens.areiaGrossa.toFixed(2))],
      ["Areia Média", "0.2 - 0.6", parseFloat(porcentagens.areiaMedia.toFixed(2))],
      ["Areia Fina", "0.06 - 0.2", parseFloat(porcentagens.areiaFina.toFixed(2))],
      ["Silte", "0.002 - 0.06", parseFloat(porcentagens.silte.toFixed(2))],
      ["Argila", "< 0.002", parseFloat(porcentagens.argila.toFixed(2))],
      [],
      ["TOTAL", "", parseFloat((porcentagens.pedregulho + porcentagens.areiaGrossa + 
        porcentagens.areiaMedia + porcentagens.areiaFina + 
        porcentagens.silte + porcentagens.argila).toFixed(2))]
    ];

    // Criar workbook
    const wb = XLSX.utils.book_new();
    
    // Worksheet 1
    const ws1 = XLSX.utils.aoa_to_sheet(wsData1);
    ws1['!cols'] = [
      { wch: 12 }, // Peneira
      { wch: 15 }, // Abertura
      { wch: 18 }, // Massa Retida
      { wch: 12 }, // % Retida
      { wch: 20 }, // % Retida Acumulada
      { wch: 12 }  // % Passante
    ];
    XLSX.utils.book_append_sheet(wb, ws1, "Dados Detalhados");

    // Worksheet 2
    const ws2 = XLSX.utils.aoa_to_sheet(wsData2);
    ws2['!cols'] = [
      { wch: 18 }, // Tipo
      { wch: 15 }, // Faixa
      { wch: 15 }  // % da Amostra
    ];
    XLSX.utils.book_append_sheet(wb, ws2, "Composição por Tipo");

    // Gerar arquivo e fazer download
    XLSX.writeFile(wb, `analise_granulometrica_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // Calcular total para verificação
  const massaTotalCalculada = dados.reduce((sum, ponto) => sum + ponto.massa_retida, 0);
  const perdaMassa = massaTotal - massaTotalCalculada;
  const percPerdaMassa = (perdaMassa / massaTotal) * 100;

  // Calcular porcentagens por tipo de material
  const calcularPorcentagensPorTipo = () => {
    // Ordenar dados por abertura decrescente
    const dadosOrdenados = [...dados].sort((a, b) => b.abertura - a.abertura);
    
    // Inicializar acumuladores
    let pedregulho = 0;
    let areiaGrossa = 0;
    let areiaMedia = 0;
    let areiaFina = 0;
    let silte = 0;
    let argila = 0;

    // Calcular usando a lógica de % passante
    // O material entre duas peneiras é a diferença de % passante
    for (let i = 0; i < dadosOrdenados.length; i++) {
      const pontoAtual = dadosOrdenados[i];
      const pontoAnterior = i > 0 ? dadosOrdenados[i - 1] : null;
      
      // % do material nesta faixa
      const percNaFaixa = pontoAnterior 
        ? pontoAnterior.porc_passante - pontoAtual.porc_passante 
        : 100 - pontoAtual.porc_passante;

      const aberturaAtual = pontoAtual.abertura;

      // Classificar baseado na abertura da peneira atual
      // Material retido NESTA peneira tem tamanho MAIOR que esta abertura
      if (aberturaAtual >= 2.0) {
        pedregulho += percNaFaixa;
      } else if (aberturaAtual >= 0.6) {
        areiaGrossa += percNaFaixa;
      } else if (aberturaAtual >= 0.2) {
        areiaMedia += percNaFaixa;
      } else if (aberturaAtual >= 0.06) {
        areiaFina += percNaFaixa;
      } else if (aberturaAtual >= 0.002) {
        silte += percNaFaixa;
      } else {
        argila += percNaFaixa;
      }
    }

    // Adicionar o que passou pela última peneira
    if (dadosOrdenados.length > 0) {
      const ultimoPonto = dadosOrdenados[dadosOrdenados.length - 1];
      const percPassante = ultimoPonto.porc_passante;
      
      // Classificar o material passante pela menor abertura
      if (ultimoPonto.abertura >= 0.002) {
        // Se a menor peneira é >= 0.002, considerar tudo como silte/argila proporcionalmente
        // Aproximação: metade silte, metade argila
        silte += percPassante * 0.5;
        argila += percPassante * 0.5;
      } else {
        // Material que passou pela menor peneira é argila
        argila += percPassante;
      }
    }

    return {
      pedregulho,
      areiaGrossa,
      areiaMedia,
      areiaFina,
      silte,
      argila
    };
  };

  const porcentagensPorTipo = calcularPorcentagensPorTipo();

  return (
    <div className="space-y-4">
      {/* Botão Excel */}
      <div className="flex justify-end">
        <Button onClick={exportarExcel} variant="outline" size="sm" className="gap-1.5 h-8 text-xs">
          <FileSpreadsheet className="w-3.5 h-3.5" />
          Exportar Excel
        </Button>
      </div>

      {/* Tabela de Dados Detalhados */}
      {showDadosDetalhados && (
        <div className="rounded-lg border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableHead className="text-center font-bold text-sm py-2.5">Peneira</TableHead>
                <TableHead className="text-center font-bold text-sm py-2.5">Abertura</TableHead>
                <TableHead className="text-center font-bold text-sm py-2.5">M. Retida (g)</TableHead>
                <TableHead className="text-center font-bold text-sm py-2.5">% Ret.</TableHead>
                <TableHead className="text-center font-bold text-sm py-2.5">% Ret. Ac.</TableHead>
                <TableHead className="text-center font-bold text-sm py-2.5 bg-primary/10">% Pass.</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dados.map((ponto, index) => (
                <TableRow key={index} className="hover:bg-muted/20">
                  <TableCell className="text-center font-semibold text-sm py-2">
                    {getNomePeneira(ponto.abertura)}
                  </TableCell>
                  <TableCell className="text-center text-sm py-2">{ponto.abertura.toFixed(3)}</TableCell>
                  <TableCell className="text-center text-sm py-2">{ponto.massa_retida.toFixed(2)}</TableCell>
                  <TableCell className="text-center text-sm py-2">{ponto.porc_retida.toFixed(2)}%</TableCell>
                  <TableCell className="text-center text-sm py-2">{ponto.porc_retida_acum.toFixed(2)}%</TableCell>
                  <TableCell className="text-center font-bold text-sm py-2 bg-primary/5">{ponto.porc_passante.toFixed(2)}%</TableCell>
                </TableRow>
              ))}
              <TableRow className="bg-gradient-to-r from-fuchsia-500/10 to-purple-600/10 font-bold border-t border-fuchsia-500/30">
                <TableCell className="text-center text-sm py-2.5" colSpan={2}>TOTAL</TableCell>
                <TableCell className="text-center text-sm py-2.5">{massaTotalCalculada.toFixed(2)}</TableCell>
                <TableCell className="text-center text-sm py-2.5">100.00%</TableCell>
                <TableCell className="text-center text-sm py-2.5">-</TableCell>
                <TableCell className="text-center text-sm py-2.5 bg-primary/5">-</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      )}

      {/* Tabela de Composição por Tipo */}
      {showComposicao && (
        <div className="rounded-lg border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-gradient-to-r from-fuchsia-500/10 to-purple-600/10 hover:bg-gradient-to-r hover:from-fuchsia-500/10 hover:to-purple-600/10">
                <TableHead className="text-center font-bold text-sm py-2.5" colSpan={3}>Composição por Tipo de Material</TableHead>
              </TableRow>
              <TableRow className="bg-muted/30 hover:bg-muted/30">
                <TableHead className="text-center font-bold text-sm py-2">Tipo</TableHead>
                <TableHead className="text-center font-bold text-sm py-2">Faixa (mm)</TableHead>
                <TableHead className="text-center font-bold text-sm py-2 bg-primary/10">% da Amostra</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow className="hover:bg-muted/20">
                <TableCell className="text-center font-semibold text-sm py-2">Pedregulho</TableCell>
                <TableCell className="text-center text-sm py-2">≥ 2.0</TableCell>
                <TableCell className="text-center font-bold text-sm py-2 bg-gray-100 dark:bg-gray-800">
                  {porcentagensPorTipo.pedregulho.toFixed(2)}%
                </TableCell>
              </TableRow>
              <TableRow className="hover:bg-muted/20">
                <TableCell className="text-center font-semibold text-sm py-2">Areia Grossa</TableCell>
                <TableCell className="text-center text-sm py-2">0.6 - 2.0</TableCell>
                <TableCell className="text-center font-bold text-sm py-2 bg-yellow-100 dark:bg-yellow-900/30">
                  {porcentagensPorTipo.areiaGrossa.toFixed(2)}%
                </TableCell>
              </TableRow>
              <TableRow className="hover:bg-muted/20">
                <TableCell className="text-center font-semibold text-sm py-2">Areia Média</TableCell>
                <TableCell className="text-center text-sm py-2">0.2 - 0.6</TableCell>
                <TableCell className="text-center font-bold text-sm py-2 bg-yellow-100 dark:bg-yellow-900/30">
                  {porcentagensPorTipo.areiaMedia.toFixed(2)}%
                </TableCell>
              </TableRow>
              <TableRow className="hover:bg-muted/20">
                <TableCell className="text-center font-semibold text-sm py-2">Areia Fina</TableCell>
                <TableCell className="text-center text-sm py-2">0.06 - 0.2</TableCell>
                <TableCell className="text-center font-bold text-sm py-2 bg-yellow-100 dark:bg-yellow-900/30">
                  {porcentagensPorTipo.areiaFina.toFixed(2)}%
                </TableCell>
              </TableRow>
              <TableRow className="hover:bg-muted/20">
                <TableCell className="text-center font-semibold text-sm py-2">Silte</TableCell>
                <TableCell className="text-center text-sm py-2">0.002 - 0.06</TableCell>
                <TableCell className="text-center font-bold text-sm py-2 bg-orange-100 dark:bg-orange-900/30">
                  {porcentagensPorTipo.silte.toFixed(2)}%
                </TableCell>
              </TableRow>
              <TableRow className="hover:bg-muted/20">
                <TableCell className="text-center font-semibold text-sm py-2">Argila</TableCell>
                <TableCell className="text-center text-sm py-2">&lt; 0.002</TableCell>
                <TableCell className="text-center font-bold text-sm py-2 bg-amber-100 dark:bg-amber-900/30">
                  {porcentagensPorTipo.argila.toFixed(2)}%
                </TableCell>
              </TableRow>
              <TableRow className="bg-gradient-to-r from-fuchsia-500/10 to-purple-600/10 font-bold border-t-2 border-fuchsia-500/30">
                <TableCell className="text-center text-sm py-2.5" colSpan={2}>TOTAL</TableCell>
                <TableCell className="text-center text-sm py-2.5 bg-primary/10">
                  {(porcentagensPorTipo.pedregulho + 
                    porcentagensPorTipo.areiaGrossa + 
                    porcentagensPorTipo.areiaMedia + 
                    porcentagensPorTipo.areiaFina + 
                    porcentagensPorTipo.silte + 
                    porcentagensPorTipo.argila).toFixed(2)}%
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      )}

      {/* Informações adicionais */}
      {showDadosDetalhados && (
        <div className="p-3 rounded-lg bg-gradient-to-br from-muted/50 to-muted/30 border border-muted space-y-1.5 text-sm">
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
      )}
    </div>
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

