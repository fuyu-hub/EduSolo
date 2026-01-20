import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";


import { PontoGranulometrico } from "../schemas";

interface TabelaDadosGranulometricosProps {
  dados: PontoGranulometrico[];
  showDadosDetalhados?: boolean;
  showComposicao?: boolean;
}

export default function TabelaDadosGranulometricos({
  dados,
  showDadosDetalhados = true,
  showComposicao = true
}: TabelaDadosGranulometricosProps) {



  // Calcular total para verificação (opcional, apenas interno se necessário)
  const massaTotalCalculada = dados.reduce((sum, ponto) => sum + ponto.massa_retida, 0);

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

      // Classificar baseado na abertura da peneira atual (ABNT NBR 7181)
      // Material retido NESTA peneira tem tamanho MAIOR que esta abertura
      if (aberturaAtual >= 2.0) {
        pedregulho += percNaFaixa;
      } else if (aberturaAtual >= 0.6) {
        // Inclui peneira #30 (0.6mm ABNT) como Areia Grossa
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

      {/* Informações adicionais removidas conforme solicitação */}
    </div>
  );
}

// Função auxiliar para identificar nome da peneira (ABNT NBR 7181)
function getNomePeneira(abertura: number): string {
  const peneiras: { [key: number]: string } = {
    // Valores ABNT NBR 7181
    76.0: '3"',
    63.0: '2½"',
    50.0: '2"',
    38.0: '1½"',
    25.0: '1"',
    19.0: '¾"',
    12.5: '½"',
    9.5: '3/8"',
    6.3: '1/4"',
    4.8: 'Nº 4',
    2.36: 'Nº 8',
    2.0: 'Nº 10',
    1.2: 'Nº 16',
    0.85: 'Nº 20',
    0.6: 'Nº 30',
    0.42: 'Nº 40',
    0.25: 'Nº 60',
    0.18: 'Nº 80',
    0.15: 'Nº 100',
    0.106: 'Nº 140',
    0.075: 'Nº 200',
    0.053: 'Nº 270',
  };

  let bestMatch = '-';
  let minDiff = 0.02; // Tolerância máxima rigorosa (0.02mm) para evitar matches errados vizinhos

  for (const [key, value] of Object.entries(peneiras)) {
    const diff = Math.abs(parseFloat(key) - abertura);
    if (diff < minDiff) {
      minDiff = diff;
      bestMatch = value;
    }
  }

  return bestMatch;
}

