import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface ExportData {
  moduleName: string;
  moduleTitle: string;
  inputs: { label: string; value: string }[];
  results: { label: string; value: string; highlight?: boolean }[];
  summary?: { label: string; value: string }[]; // Resumo da análise
  tables?: { title: string; headers: string[]; rows: (string | number)[][] }[];
  chartImage?: string; // Base64 image de gráficos
  customFileName?: string; // Nome customizado para o arquivo
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
 * Substitui símbolos Unicode por equivalentes em notação técnica legível
 * que funcionam corretamente no PDF
 */
function formatarSimbolosParaPDF(texto: string): string {
  return texto
    // Símbolos de acréscimo/variação
    .replace(/Δσ/g, 'delta-sigma')
    .replace(/Δ/g, 'delta')
    // Símbolos gregos minúsculos
    .replace(/γ/g, 'gamma')
    .replace(/σ'/g, "sigma'") // Tensão efetiva (sigma linha)
    .replace(/σ/g, 'sigma')
    .replace(/τ/g, 'tau')
    .replace(/φ/g, 'phi')
    .replace(/ω/g, 'omega')
    .replace(/μ/g, 'mu')
    .replace(/ε/g, 'epsilon')
    .replace(/δ/g, 'delta')
    .replace(/α/g, 'alfa')
    .replace(/β/g, 'beta')
    .replace(/θ/g, 'theta')
    .replace(/ρ/g, 'rho');
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

    // Cabeçalho com fundo colorido
    doc.setFillColor(100, 50, 150); // Roxo EduSolo
    doc.rect(0, 0, pageWidth, 35, 'F');
    
    // Logo/Nome EduSolo
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
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
    doc.setTextColor(0, 0, 0);
    yPosition = 45;

    // Título do módulo com fundo
    doc.setFillColor(245, 245, 250);
    doc.roundedRect(margin, yPosition - 5, pageWidth - 2 * margin, 12, 2, 2, 'F');
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(100, 50, 150);
    doc.text(data.moduleTitle, margin + 5, yPosition + 3);
    doc.setTextColor(0, 0, 0);
    yPosition += 16;

    // Seção de Dados de Entrada
    if (data.inputs.length > 0) {
      // Cabeçalho da seção
      doc.setFillColor(100, 50, 150);
      doc.rect(margin, yPosition, pageWidth - 2 * margin, 8, 'F');
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(255, 255, 255);
      doc.text('DADOS DE ENTRADA', margin + 3, yPosition + 5.5);
      doc.setTextColor(0, 0, 0);
      yPosition += 12;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      
      for (const input of data.inputs) {
        if (yPosition > pageHeight - 30) {
          doc.addPage();
          yPosition = margin;
        }

        // Fundo alternado
        doc.setFillColor(250, 250, 252);
        doc.rect(margin, yPosition - 4, pageWidth - 2 * margin, 7, 'F');
        
        doc.setFont('helvetica', 'normal');
        doc.text(formatarSimbolosParaPDF(input.label) + ':', margin + 5, yPosition);
        doc.setFont('helvetica', 'bold');
        doc.text(formatarSimbolosParaPDF(input.value), margin + 90, yPosition);
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
      doc.setFillColor(100, 50, 150);
      doc.rect(margin, yPosition, pageWidth - 2 * margin, 8, 'F');
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(255, 255, 255);
      doc.text('RESULTADOS', margin + 3, yPosition + 5.5);
      doc.setTextColor(0, 0, 0);
      yPosition += 12;

      doc.setFontSize(10);
      
      for (const result of data.results) {
        if (yPosition > pageHeight - 30) {
          doc.addPage();
          yPosition = margin;
        }

        // Formatar textos para remover símbolos Unicode
        const labelFormatado = formatarSimbolosParaPDF(result.label);
        const valueFormatado = formatarSimbolosParaPDF(result.value);
        
        // Calcular altura necessária para textos longos
        const maxWidth = pageWidth - margin - 95;
        const valueLines = doc.splitTextToSize(valueFormatado, maxWidth);
        const numLines = valueLines.length;
        const lineHeight = 7;
        const totalHeight = numLines * lineHeight;

        // Verificar se precisa de nova página
        if (yPosition + totalHeight > pageHeight - 30) {
          doc.addPage();
          yPosition = margin;
        }

        if (result.highlight) {
          doc.setFillColor(255, 245, 230);
          doc.rect(margin, yPosition - 4, pageWidth - 2 * margin, totalHeight + 2, 'F');
        } else {
          doc.setFillColor(250, 250, 252);
          doc.rect(margin, yPosition - 4, pageWidth - 2 * margin, totalHeight + 2, 'F');
        }

        doc.setFont('helvetica', 'normal');
        doc.text(labelFormatado + ':', margin + 5, yPosition);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(result.highlight ? 100 : 0, result.highlight ? 50 : 0, result.highlight ? 150 : 0);
        
        // Renderizar texto com quebra de linha
        if (numLines === 1) {
          doc.text(valueFormatado, margin + 90, yPosition);
        } else {
          doc.text(valueLines, margin + 90, yPosition);
        }
        doc.setTextColor(0, 0, 0);
        
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
      doc.setFillColor(100, 50, 150);
      doc.rect(margin, yPosition, pageWidth - 2 * margin, 8, 'F');
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(255, 255, 255);
      doc.text('RESUMO DA ANÁLISE', margin + 3, yPosition + 5.5);
      doc.setTextColor(0, 0, 0);
      yPosition += 12;

      doc.setFontSize(10);
      
      for (const item of data.summary) {
        if (yPosition > pageHeight - 30) {
          doc.addPage();
          yPosition = margin;
        }

        // Formatar textos para remover símbolos Unicode
        const labelFormatado = formatarSimbolosParaPDF(item.label);
        const valueFormatado = formatarSimbolosParaPDF(item.value);

        // Calcular altura necessária para textos longos
        const maxWidth = pageWidth - margin - 95;
        const valueLines = doc.splitTextToSize(valueFormatado, maxWidth);
        const numLines = valueLines.length;
        const lineHeight = 7;
        const totalHeight = numLines * lineHeight;

        // Verificar se precisa de nova página
        if (yPosition + totalHeight > pageHeight - 30) {
          doc.addPage();
          yPosition = margin;
        }

        // Fundo alternado
        doc.setFillColor(250, 250, 252);
        doc.rect(margin, yPosition - 4, pageWidth - 2 * margin, totalHeight + 2, 'F');

        doc.setFont('helvetica', 'normal');
        doc.text(labelFormatado + ':', margin + 5, yPosition);
        doc.setFont('helvetica', 'bold');
        
        // Renderizar texto com quebra de linha
        if (numLines === 1) {
          doc.text(valueFormatado, margin + 90, yPosition);
        } else {
          doc.text(valueLines, margin + 90, yPosition);
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
        doc.setFillColor(100, 50, 150);
        doc.rect(margin, yPosition, pageWidth - 2 * margin, 8, 'F');
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(255, 255, 255);
        doc.text(formatarSimbolosParaPDF(table.title).toUpperCase(), margin + 3, yPosition + 5.5);
        doc.setTextColor(0, 0, 0);
        yPosition += 10;

        // Formatar headers e linhas da tabela
        const headersFormatados = table.headers.map(h => 
          typeof h === 'string' ? formatarSimbolosParaPDF(h) : h
        );
        const rowsFormatadas = table.rows.map(row => 
          row.map(cell => typeof cell === 'string' ? formatarSimbolosParaPDF(cell) : cell)
        );

        // Usar autoTable para criar a tabela
        try {
          autoTable(doc, {
            startY: yPosition,
            head: [headersFormatados],
            body: rowsFormatadas,
            theme: 'grid',
            headStyles: {
              fillColor: [120, 70, 170],
              textColor: [255, 255, 255],
              fontStyle: 'bold',
              fontSize: 9,
              halign: 'center',
              lineWidth: 0.1,
              lineColor: [100, 50, 150]
            },
            bodyStyles: {
              fontSize: 8,
              lineWidth: 0.1,
              lineColor: [200, 200, 200]
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
      doc.setFillColor(100, 50, 150);
      doc.rect(margin, yPosition, pageWidth - 2 * margin, 8, 'F');
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(255, 255, 255);
      doc.text('GRÁFICO', margin + 3, yPosition + 5.5);
      doc.setTextColor(0, 0, 0);
      yPosition += 12;
      
      // Borda ao redor do gráfico
      doc.setDrawColor(100, 50, 150);
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
      doc.setDrawColor(100, 50, 150);
      doc.setLineWidth(0.3);
      doc.line(margin, footerY - 3, pageWidth - margin, footerY - 3);
      
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 100, 100);
      doc.text(
        'Gerado por EduSolo - Sistema de Análise Geotécnica',
        pageWidth / 2,
        footerY,
        { align: 'center' }
      );
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(100, 50, 150);
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

