import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * SISTEMA DE RENDERIZAÇÃO DE SÍMBOLOS MATEMÁTICOS EM PDF
 * 
 * Este módulo implementa renderização avançada de símbolos matemáticos em PDFs,
 * preservando os símbolos Unicode originais e aplicando formatação apropriada.
 * 
 * FUNCIONALIDADES:
 * 
 * 1. Símbolos Gregos:
 *    - São renderizados 35% maiores que o texto normal
 *    - Suportados: γ, σ, τ, φ, ω, μ, ε, δ, α, β, θ, ρ, Δ, Γ, Σ, Φ, Ω, Θ
 * 
 * 2. Subscritos:
 *    - Detectados após underscore (_) ou diretamente após símbolo
 *    - Exemplo: γ_sat, σ_v renderiza "sat" e "v" menores e abaixo
 *    - Tamanho: 65% do texto base
 * 
 * 3. Superscritos (linha/apóstrofo):
 *    - Detectados como apóstrofo após símbolo
 *    - Exemplo: σ' renderiza o apóstrofo menor e elevado
 *    - Tamanho: 75% do texto base
 * 
 * 4. Combinações:
 *    - Suporta combinações complexas: Δσ_v, γ_sat, σ'_v, etc.
 *    - Múltiplos símbolos consecutivos são tratados individualmente
 * 
 * EXEMPLO DE USO:
 *    Input: "Peso específico γ_sat = 18.5 kN/m³"
 *    Output: Texto normal + γ (grande) + "sat" (pequeno, abaixo) + = 18.5 kN/m³
 * 
 * As funções principais são aplicadas automaticamente em:
 * - Labels e valores de entrada (inputs)
 * - Labels e valores de resultados (results)
 * - Labels e valores de resumo (summary)
 * - Títulos de tabelas (tables)
 */

export type ThemeColor = "soil" | "blue" | "green" | "purple" | "pink" | "orange" | "cyan" | "amber" | "indigo" | "red";
export type ThemeMode = "light" | "dark";

export interface ExportData {
  moduleName: string;
  moduleTitle: string;
  inputs: { label: string; value: string }[];
  results: { label: string; value: string; highlight?: boolean }[];
  summary?: { label: string; value: string }[]; // Resumo da análise
  tables?: { title: string; headers: string[]; rows: (string | number)[][] }[];
  chartImage?: string; // Base64 image de gráficos
  customFileName?: string; // Nome customizado para o arquivo
  theme?: { color: ThemeColor; mode: ThemeMode }; // Tema para cores do PDF
}

export interface ExcelExportData {
  moduleName: string;
  moduleTitle: string;
  sheets: {
    name: string;
    data: { label: string; value: string | number }[];
  }[];
  tables?: { title: string; headers: string[]; rows: (string | number)[][] }[];
}

/**
 * Interface para representar um segmento de texto formatado
 */
interface TextoFormatado {
  texto: string;
  tamanho: 'normal' | 'grande' | 'pequeno';
  tipo: 'simbolo' | 'texto' | 'subscrito' | 'superscrito';
}

/**
 * Analisa texto e identifica símbolos matemáticos, subscritos e superscritos
 * Retorna array de segmentos formatados
 */
function analisarTextoMatematico(texto: string): TextoFormatado[] {
  const segmentos: TextoFormatado[] = [];
  const simbolosGrecos = ['γ', 'σ', 'τ', 'φ', 'ω', 'μ', 'ε', 'δ', 'α', 'β', 'θ', 'ρ', 'Δ', 'Γ', 'Σ', 'Φ', 'Ω', 'Θ'];
  
  // Padrões complexos: γsat, γ_sat, σ'v, σ'_v, Δσv, Δσ_v, etc.
  // Captura: símbolo(s) + apóstrofo opcional + underscore opcional + subscrito opcional
  // Subscrito pode ser: letras minúsculas ou números (sat, sub, n, d, v, h, w, 0, 1, etc.)
  const padraoComplexo = /([γσταφωμεδαβθρΔΓΣΦΩΘ]{1,2})(['']?)(_)?([a-z0-9]+)?/gi;
  
  let ultimoIndice = 0;
  let match;
  let encontrouPadrao = false;
  
  while ((match = padraoComplexo.exec(texto)) !== null) {
    // Ignorar matches vazios ou apenas com o símbolo sem subscrito
    const temConteudoRelevante = match[2] || match[4]; // tem apóstrofo ou subscrito
    
    // Se tem só o símbolo sem nada relevante, pular (será processado depois)
    if (!temConteudoRelevante && match[0].length <= 2) {
      // É apenas um ou dois símbolos isolados, processar depois
      continue;
    }
    
    encontrouPadrao = true;
    
    // Adicionar texto antes do match (se houver)
    if (match.index > ultimoIndice) {
      const textoAntes = texto.substring(ultimoIndice, match.index);
      if (textoAntes) {
        // Processar texto antes para símbolos isolados
        for (let i = 0; i < textoAntes.length; i++) {
          const char = textoAntes[i];
          if (simbolosGrecos.includes(char)) {
            segmentos.push({ texto: char, tamanho: 'grande', tipo: 'simbolo' });
          } else {
            // Adicionar caracteres normais
            if (segmentos.length > 0 && segmentos[segmentos.length - 1].tipo === 'texto') {
              segmentos[segmentos.length - 1].texto += char;
            } else {
              segmentos.push({ texto: char, tamanho: 'normal', tipo: 'texto' });
            }
          }
        }
      }
    }
    
    // Processar símbolos (pode ser Δσ - dois símbolos)
    const simbolos = match[1];
    for (const simbolo of simbolos) {
      segmentos.push({ 
        texto: simbolo, 
        tamanho: 'grande', 
        tipo: 'simbolo' 
      });
    }
    
    // Apóstrofo (linha) - tamanho normal ao lado do símbolo
    if (match[2]) {
      segmentos.push({ 
        texto: match[2] === '\u2019' ? "'" : match[2], 
        tamanho: 'normal', 
        tipo: 'superscrito' 
      });
    }
    
    // Subscrito (menor)
    if (match[4]) {
      segmentos.push({ 
        texto: match[4], 
        tamanho: 'pequeno', 
        tipo: 'subscrito' 
      });
    }
    
    ultimoIndice = match.index + match[0].length;
  }
  
  // Adicionar texto restante
  if (ultimoIndice < texto.length) {
    const textoRestante = texto.substring(ultimoIndice);
    if (textoRestante) {
      // Processar caractere por caractere para capturar símbolos isolados
      for (let i = 0; i < textoRestante.length; i++) {
        const char = textoRestante[i];
        if (simbolosGrecos.includes(char)) {
          segmentos.push({ texto: char, tamanho: 'grande', tipo: 'simbolo' });
          encontrouPadrao = true;
        } else {
          if (segmentos.length > 0 && segmentos[segmentos.length - 1].tipo === 'texto') {
            segmentos[segmentos.length - 1].texto += char;
          } else {
            segmentos.push({ texto: char, tamanho: 'normal', tipo: 'texto' });
          }
        }
      }
    }
  }
  
  // Se não encontrou nenhum padrão matemático, retornar o texto completo como normal
  if (!encontrouPadrao) {
    return [{ texto, tamanho: 'normal', tipo: 'texto' }];
  }
  
  return segmentos;
}

/**
 * Renderiza texto com símbolos matemáticos formatados no PDF
 */
function renderizarTextoMatematico(
  doc: jsPDF, 
  texto: string, 
  x: number, 
  y: number, 
  tamanhoBase: number = 10
): number {
  const segmentos = analisarTextoMatematico(texto);
  let posX = x;
  
  for (let i = 0; i < segmentos.length; i++) {
    const segmento = segmentos[i];
    let tamanhoFonte = tamanhoBase;
    let offsetY = 0;
    let espacamentoExtra = 0;
    
    switch (segmento.tamanho) {
      case 'grande':
        tamanhoFonte = tamanhoBase * 1.35; // 35% maior para símbolos
        // Adicionar pequeno espaço antes de símbolos (exceto no início)
        if (i > 0 && segmentos[i - 1].tipo === 'texto') {
          espacamentoExtra = tamanhoBase * 0.1;
        }
        break;
      case 'pequeno':
        tamanhoFonte = tamanhoBase * 0.65; // 35% menor para subscritos
        offsetY = tamanhoBase * 0.3; // Descer um pouco
        break;
      case 'normal':
        if (segmento.tipo === 'superscrito') {
          tamanhoFonte = tamanhoBase * 0.75;
          offsetY = -tamanhoBase * 0.25; // Subir um pouco
        }
        break;
    }
    
    posX += espacamentoExtra;
    doc.setFontSize(tamanhoFonte);
    const larguraTexto = doc.getTextWidth(segmento.texto);
    doc.text(segmento.texto, posX, y + offsetY);
    posX += larguraTexto;
    
    // Adicionar pequeno espaço depois de subscritos antes de texto normal
    if (segmento.tipo === 'subscrito' && i < segmentos.length - 1 && segmentos[i + 1].tipo === 'texto') {
      posX += tamanhoBase * 0.15;
    }
  }
  
  // Retornar posição X final
  return posX;
}

/**
 * Calcula a largura total que um texto formatado ocupará
 * Útil para centralização e alinhamento
 */
function calcularLarguraTextoMatematico(
  doc: jsPDF,
  texto: string,
  tamanhoBase: number = 10
): number {
  const segmentos = analisarTextoMatematico(texto);
  let larguraTotal = 0;
  
  for (let i = 0; i < segmentos.length; i++) {
    const segmento = segmentos[i];
    let tamanhoFonte = tamanhoBase;
    let espacamentoExtra = 0;
    
    switch (segmento.tamanho) {
      case 'grande':
        tamanhoFonte = tamanhoBase * 1.35;
        if (i > 0 && segmentos[i - 1].tipo === 'texto') {
          espacamentoExtra = tamanhoBase * 0.1;
        }
        break;
      case 'pequeno':
        tamanhoFonte = tamanhoBase * 0.65;
        break;
      case 'normal':
        if (segmento.tipo === 'superscrito') {
          tamanhoFonte = tamanhoBase * 0.75;
        }
        break;
    }
    
    const tamanhoAnterior = doc.getFontSize();
    doc.setFontSize(tamanhoFonte);
    larguraTotal += espacamentoExtra + doc.getTextWidth(segmento.texto);
    doc.setFontSize(tamanhoAnterior);
    
    if (segmento.tipo === 'subscrito' && i < segmentos.length - 1 && segmentos[i + 1].tipo === 'texto') {
      larguraTotal += tamanhoBase * 0.15;
    }
  }
  
  return larguraTotal;
}

/**
 * Obtém paleta de cores baseada no tema selecionado
 */
function obterPaletaCores(theme?: { color: ThemeColor; mode: ThemeMode }) {
  const themeColor = theme?.color || 'indigo';
  // Forçar sempre tema claro para PDFs
  const themeMode = 'light';
  
  // Cores primárias por tema
  const colorMap: Record<ThemeColor, { r: number; g: number; b: number }> = {
    soil: { r: 138, g: 99, b: 69 },       // Terra Natural (tema oficial)
    blue: { r: 59, g: 130, b: 246 },      // blue-500
    green: { r: 34, g: 197, b: 94 },      // green-500
    purple: { r: 168, g: 85, b: 247 },    // purple-500
    pink: { r: 236, g: 72, b: 153 },      // pink-500
    orange: { r: 249, g: 115, b: 22 },    // orange-500
    cyan: { r: 6, g: 182, b: 212 },       // cyan-500
    amber: { r: 245, g: 158, b: 11 },     // amber-500
    indigo: { r: 99, g: 102, b: 241 },    // indigo-500
    red: { r: 239, g: 68, b: 68 },        // red-500
  };
  
  const primaryColor = colorMap[themeColor];
  
  // PDFs sempre em modo claro
  return {
    // Cor primária do tema
    primary: primaryColor,
    
    // Cor mais escura para cabeçalhos
    primaryDark: {
      r: Math.max(0, primaryColor.r - 40),
      g: Math.max(0, primaryColor.g - 40),
      b: Math.max(0, primaryColor.b - 40),
    },
    
    // Fundo do cabeçalho principal
    headerBg: primaryColor,
    
    // Texto do cabeçalho
    headerText: { r: 255, g: 255, b: 255 },
    
    // Fundo do título do módulo
    moduleTitleBg: { r: 245, g: 245, b: 250 },
    
    // Texto do título do módulo
    moduleTitleText: primaryColor,
    
    // Fundo das seções
    sectionHeaderBg: primaryColor,
    
    // Fundo alternado dos itens
    itemBg: { r: 250, g: 250, b: 252 },
    
    // Fundo de destaque
    highlightBg: { r: 255, g: 245, b: 230 },
    
    // Texto normal
    text: { r: 0, g: 0, b: 0 },
    
    // Texto secundário
    textSecondary: { r: 100, g: 100, b: 100 },
    
    // Fundo da página
    pageBg: { r: 255, g: 255, b: 255 },
    
    // Linhas e bordas
    border: { r: 200, g: 200, b: 200 },
  };
}

export async function exportToPDF(data: ExportData): Promise<boolean> {
  try {
    const doc = new jsPDF({
      compress: true,
      putOnlyUsedFonts: true,
    });
    
    // Usar helvetica que é mais confiável
    doc.setFont('helvetica');
    
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    const margin = 20;
    let yPosition = margin;

    // Obter paleta de cores baseada no tema
    const colors = obterPaletaCores(data.theme);

    // Cabeçalho com fundo colorido (tema)
    doc.setFillColor(colors.headerBg.r, colors.headerBg.g, colors.headerBg.b);
    doc.rect(0, 0, pageWidth, 35, 'F');
    
    // Logo/Nome EduSolo
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(colors.headerText.r, colors.headerText.g, colors.headerText.b);
    doc.text('EduSolo', margin, yPosition + 5);
    
    // Subtítulo
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Sistema de Análise Geotécnica', margin, yPosition + 12);
    
    // Data
    const currentDate = new Date().toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
    doc.setFontSize(9);
    doc.text(currentDate, pageWidth - margin, yPosition + 8, { align: 'right' });
    
    // Resetar cor do texto
    doc.setTextColor(colors.text.r, colors.text.g, colors.text.b);
    yPosition = 45;

    // Título do módulo com fundo
    doc.setFillColor(colors.moduleTitleBg.r, colors.moduleTitleBg.g, colors.moduleTitleBg.b);
    doc.roundedRect(margin, yPosition - 5, pageWidth - 2 * margin, 12, 2, 2, 'F');
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(colors.moduleTitleText.r, colors.moduleTitleText.g, colors.moduleTitleText.b);
    doc.text(data.moduleTitle, margin + 5, yPosition + 3);
    doc.setTextColor(colors.text.r, colors.text.g, colors.text.b);
    yPosition += 16;

    // Seção de Dados de Entrada
    if (data.inputs.length > 0) {
      // Cabeçalho da seção
      doc.setFillColor(colors.sectionHeaderBg.r, colors.sectionHeaderBg.g, colors.sectionHeaderBg.b);
      doc.rect(margin, yPosition, pageWidth - 2 * margin, 8, 'F');
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(colors.headerText.r, colors.headerText.g, colors.headerText.b);
      doc.text('DADOS DE ENTRADA', margin + 3, yPosition + 5.5);
      doc.setTextColor(colors.text.r, colors.text.g, colors.text.b);
      yPosition += 12;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      
      for (const input of data.inputs) {
        if (yPosition > pageHeight - 30) {
          doc.addPage();
          yPosition = margin;
        }

        // Fundo alternado
        doc.setFillColor(colors.itemBg.r, colors.itemBg.g, colors.itemBg.b);
        doc.rect(margin, yPosition - 4, pageWidth - 2 * margin, 7, 'F');
        
        // Renderizar label com símbolos matemáticos
        doc.setFont('helvetica', 'normal');
        const labelPosX = renderizarTextoMatematico(doc, input.label, margin + 5, yPosition, 10);
        doc.setFontSize(10);
        doc.text(':', labelPosX, yPosition);
        
        // Renderizar valor com símbolos matemáticos
        doc.setFont('helvetica', 'bold');
        renderizarTextoMatematico(doc, input.value, margin + 90, yPosition, 10);
        
        yPosition += 7;
      }
      yPosition += 3;
    }

    // Seção de Resultados
    if (data.results.length > 0) {
      yPosition += 5;
      
      if (yPosition > pageHeight - 40) {
        doc.addPage();
        yPosition = margin;
      }

      // Cabeçalho da seção
      doc.setFillColor(colors.sectionHeaderBg.r, colors.sectionHeaderBg.g, colors.sectionHeaderBg.b);
      doc.rect(margin, yPosition, pageWidth - 2 * margin, 8, 'F');
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(colors.headerText.r, colors.headerText.g, colors.headerText.b);
      doc.text('RESULTADOS', margin + 3, yPosition + 5.5);
      doc.setTextColor(colors.text.r, colors.text.g, colors.text.b);
      yPosition += 12;

      doc.setFontSize(10);
      
      for (const result of data.results) {
        if (yPosition > pageHeight - 30) {
          doc.addPage();
          yPosition = margin;
        }

        // Calcular altura necessária para textos longos
        const maxWidth = pageWidth - margin - 95;
        const valueLines = doc.splitTextToSize(result.value, maxWidth);
        const numLines = valueLines.length;
        const lineHeight = 7;
        const totalHeight = numLines * lineHeight;

        // Verificar se precisa de nova página
        if (yPosition + totalHeight > pageHeight - 30) {
          doc.addPage();
          yPosition = margin;
        }

        doc.setFillColor(colors.itemBg.r, colors.itemBg.g, colors.itemBg.b);
        doc.rect(margin, yPosition - 4, pageWidth - 2 * margin, totalHeight + 2, 'F');

        // Renderizar label com símbolos matemáticos
        doc.setFont('helvetica', 'normal');
        const labelPosX = renderizarTextoMatematico(doc, result.label, margin + 5, yPosition, 10);
        doc.setFontSize(10);
        doc.text(':', labelPosX, yPosition);
        
        // Renderizar valor com símbolos matemáticos
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(colors.text.r, colors.text.g, colors.text.b);
        
        if (numLines === 1) {
          renderizarTextoMatematico(doc, result.value, margin + 90, yPosition, 10);
        } else {
          // Para textos com quebra de linha, renderizar linha por linha
          let currentY = yPosition;
          for (const linha of valueLines) {
            renderizarTextoMatematico(doc, linha, margin + 90, currentY, 10);
            currentY += lineHeight;
          }
        }
        doc.setTextColor(colors.text.r, colors.text.g, colors.text.b);
        
        yPosition += totalHeight;
      }
      yPosition += 3;
    }

    // Seção de Resumo da Análise
    if (data.summary && data.summary.length > 0) {
      yPosition += 5;
      
      if (yPosition > pageHeight - 40) {
        doc.addPage();
        yPosition = margin;
      }

      // Cabeçalho da seção
      doc.setFillColor(colors.sectionHeaderBg.r, colors.sectionHeaderBg.g, colors.sectionHeaderBg.b);
      doc.rect(margin, yPosition, pageWidth - 2 * margin, 8, 'F');
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(colors.headerText.r, colors.headerText.g, colors.headerText.b);
      doc.text('RESUMO DA ANÁLISE', margin + 3, yPosition + 5.5);
      doc.setTextColor(colors.text.r, colors.text.g, colors.text.b);
      yPosition += 12;

      doc.setFontSize(10);
      
      for (const item of data.summary) {
        if (yPosition > pageHeight - 30) {
          doc.addPage();
          yPosition = margin;
        }

        // Calcular altura necessária para textos longos
        const maxWidth = pageWidth - margin - 95;
        const valueLines = doc.splitTextToSize(item.value, maxWidth);
        const numLines = valueLines.length;
        const lineHeight = 7;
        const totalHeight = numLines * lineHeight;

        // Verificar se precisa de nova página
        if (yPosition + totalHeight > pageHeight - 30) {
          doc.addPage();
          yPosition = margin;
        }

        // Fundo alternado
        doc.setFillColor(colors.itemBg.r, colors.itemBg.g, colors.itemBg.b);
        doc.rect(margin, yPosition - 4, pageWidth - 2 * margin, totalHeight + 2, 'F');

        // Renderizar label com símbolos matemáticos
        doc.setFont('helvetica', 'normal');
        const labelPosX = renderizarTextoMatematico(doc, item.label, margin + 5, yPosition, 10);
        doc.setFontSize(10);
        doc.text(':', labelPosX, yPosition);
        
        // Renderizar valor com símbolos matemáticos
        doc.setFont('helvetica', 'bold');
        if (numLines === 1) {
          renderizarTextoMatematico(doc, item.value, margin + 90, yPosition, 10);
        } else {
          // Para textos com quebra de linha, renderizar linha por linha
          let currentY = yPosition;
          for (const linha of valueLines) {
            renderizarTextoMatematico(doc, linha, margin + 90, currentY, 10);
            currentY += lineHeight;
          }
        }
        
        yPosition += totalHeight;
      }
      yPosition += 3;
    }

    // Adicionar tabelas se disponíveis (ANTES do gráfico)
    if (data.tables && data.tables.length > 0) {
      console.log(`Processando ${data.tables.length} tabelas...`);
      
      for (const table of data.tables) {
        console.log(`Tabela: ${table.title}, Headers: ${table.headers.length}, Rows: ${table.rows.length}`);
        
        yPosition += 5;
        
        if (yPosition > pageHeight - 50) {
          doc.addPage();
          yPosition = margin;
        }

        // Cabeçalho da tabela
        doc.setFillColor(colors.sectionHeaderBg.r, colors.sectionHeaderBg.g, colors.sectionHeaderBg.b);
        doc.rect(margin, yPosition, pageWidth - 2 * margin, 8, 'F');
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(colors.headerText.r, colors.headerText.g, colors.headerText.b);
        doc.text(table.title.toUpperCase(), margin + 3, yPosition + 5.5);
        doc.setTextColor(colors.text.r, colors.text.g, colors.text.b);
        yPosition += 10;

        // Headers e linhas mantêm símbolos Unicode
        const headersFormatados = table.headers;
        const rowsFormatadas = table.rows;

        // Usar autoTable para criar a tabela
        try {
          autoTable(doc, {
            startY: yPosition,
            head: [headersFormatados],
            body: rowsFormatadas,
            theme: 'grid',
            headStyles: {
              fillColor: [colors.primaryDark.r, colors.primaryDark.g, colors.primaryDark.b],
              textColor: [colors.headerText.r, colors.headerText.g, colors.headerText.b],
              fontStyle: 'bold',
              fontSize: 9,
              halign: 'center',
              lineWidth: 0.1,
              lineColor: [colors.primary.r, colors.primary.g, colors.primary.b]
            },
            bodyStyles: {
              fontSize: 8,
              lineWidth: 0.1,
              lineColor: [colors.border.r, colors.border.g, colors.border.b],
              textColor: [colors.text.r, colors.text.g, colors.text.b],
            },
            alternateRowStyles: {
              fillColor: [248, 248, 252]
            },
            margin: { left: margin, right: margin },
          });

          // @ts-ignore - lastAutoTable é adicionado pelo plugin
          yPosition = doc.lastAutoTable.finalY + 8;
          console.log(`Tabela ${table.title} adicionada com sucesso`);
        } catch (tableError) {
          console.error(`Erro ao adicionar tabela ${table.title}:`, tableError);
          // Se falhar, continuar sem a tabela
          yPosition += 10;
        }
      }
    } else {
      console.log("Nenhuma tabela para adicionar ao PDF");
    }

    // Adicionar gráfico se disponível (DEPOIS das tabelas - última coisa)
    if (data.chartImage) {
      const imgWidth = pageWidth - 2 * margin;
      const imgHeight = 110; // Altura maior para o gráfico ampliado
      const titleHeight = 10;
      const totalHeight = imgHeight + titleHeight + 20; // Total com margens
      
      yPosition += 5;
      
      // Só criar nova página se não houver espaço suficiente
      if (yPosition + totalHeight > pageHeight - 30) {
        doc.addPage();
        yPosition = margin;
      }

      // Cabeçalho do gráfico
      doc.setFillColor(colors.sectionHeaderBg.r, colors.sectionHeaderBg.g, colors.sectionHeaderBg.b);
      doc.rect(margin, yPosition, pageWidth - 2 * margin, 8, 'F');
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(colors.headerText.r, colors.headerText.g, colors.headerText.b);
      doc.text('GRÁFICO', margin + 3, yPosition + 5.5);
      doc.setTextColor(colors.text.r, colors.text.g, colors.text.b);
      yPosition += 12;
      
      // Borda ao redor do gráfico
      doc.setDrawColor(colors.primary.r, colors.primary.g, colors.primary.b);
      doc.setLineWidth(0.5);
      doc.rect(margin, yPosition, imgWidth, imgHeight);
      
      doc.addImage(data.chartImage, 'PNG', margin, yPosition, imgWidth, imgHeight);
      yPosition += imgHeight + 10;
    }

    // Rodapé em todas as páginas
    // @ts-ignore - método existe em runtime
    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      

      const footerY = pageHeight - 12;
      
      // Linha superior do rodapé
      doc.setDrawColor(colors.primary.r, colors.primary.g, colors.primary.b);
      doc.setLineWidth(0.3);
      doc.line(margin, footerY - 3, pageWidth - margin, footerY - 3);
      
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(colors.textSecondary.r, colors.textSecondary.g, colors.textSecondary.b);
      doc.text(
        'Gerado por EduSolo - Sistema de Análise Geotécnica',
        pageWidth / 2,
        footerY,
        { align: 'center' }
      );
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(colors.primary.r, colors.primary.g, colors.primary.b);
      doc.text(
        `${i} / ${totalPages}`,
        pageWidth - margin,
        footerY,
        { align: 'right' }
      );
    }

    // Salvar PDF com nome customizado ou padrão
    let fileName: string;
    if (data.customFileName) {
      // Remove extensão .pdf se já estiver presente
      fileName = data.customFileName.endsWith('.pdf') 
        ? data.customFileName 
        : `${data.customFileName}.pdf`;
    } else {
      // Nome padrão: [Módulo] - EduSolo - [Data]
      const dateStr = new Date().toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: '2-digit'
      }).replace(/\//g, '-');
      fileName = `${data.moduleTitle} - EduSolo - ${dateStr}.pdf`;
    }
    
    doc.save(fileName);
    
    return true;
  } catch (error) {
    console.error('Erro ao exportar PDF:', error);
    return false;
  }
}

export function formatNumberForExport(value: number | null | undefined, precision: number = 2): string {
  if (value === null || value === undefined) return 'N/A';
  return value.toFixed(precision);
}

export function formatPercentageForExport(value: number | null | undefined): string {
  if (value === null || value === undefined) return 'N/A';
  return `${value.toFixed(1)}%`;
}

/**
 * Gera nome padrão para arquivo PDF no formato: [Nome do Módulo] - EduSolo - [Data]
 * @param moduleTitle - Nome do módulo (ex: "Índices Físicos", "Granulometria")
 * @returns Nome do arquivo formatado (ex: "Índices Físicos - EduSolo - 25/10/25")
 */
export function generateDefaultPDFFileName(moduleTitle: string): string {
  const dateStr = new Date().toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit'
  }).replace(/\//g, '/');
  
  return `${moduleTitle} - EduSolo - ${dateStr}`;
}

export async function captureChartAsImage(elementId: string): Promise<string | null> {
  try {
    const element = document.getElementById(elementId);
    if (!element) return null;

    // Dinamicamente importar html2canvas apenas quando necessário
    const html2canvas = (await import('html2canvas')).default;
    const canvas = await html2canvas(element, {
      backgroundColor: '#ffffff',
      scale: 2,
    });
    
    return canvas.toDataURL('image/png');
  } catch (error) {
    return null;
  }
}

export async function exportToExcel(data: ExcelExportData): Promise<boolean> {
  try {
    // Dinamicamente importar xlsx apenas quando necessário
    const XLSX = await import('xlsx');
    
    const workbook = XLSX.utils.book_new();
    
    // Adicionar sheets de dados
    data.sheets.forEach((sheet, index) => {
      const wsData: any[][] = [];
      
      // Cabeçalho
      wsData.push([data.moduleTitle]);
      wsData.push([]);
      wsData.push([sheet.name]);
      wsData.push([]);
      
      // Dados
      sheet.data.forEach(item => {
        wsData.push([item.label, item.value]);
      });
      
      const ws = XLSX.utils.aoa_to_sheet(wsData);
      
      // Estilizar a primeira linha
      const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
      ws['!cols'] = [{ wch: 30 }, { wch: 20 }];
      
      XLSX.utils.book_append_sheet(workbook, ws, sheet.name.substring(0, 31));
    });
    
    // Adicionar tabelas se existirem
    if (data.tables && data.tables.length > 0) {
      data.tables.forEach((table, index) => {
        const wsData: any[][] = [];
        
        // Título da tabela
        wsData.push([table.title]);
        wsData.push([]);
        
        // Headers
        wsData.push(table.headers);
        
        // Rows
        table.rows.forEach(row => {
          wsData.push(row);
        });
        
        const ws = XLSX.utils.aoa_to_sheet(wsData);
        
        // Ajustar largura das colunas
        const colWidths = table.headers.map(() => ({ wch: 15 }));
        ws['!cols'] = colWidths;
        
        XLSX.utils.book_append_sheet(
          workbook, 
          ws, 
          table.title.substring(0, 31)
        );
      });
    }
    
    // Salvar arquivo
    const fileName = `${data.moduleName}_${new Date().getTime()}.xlsx`;
    XLSX.writeFile(workbook, fileName);
    
    return true;
  } catch (error) {
    return false;
  }
}

