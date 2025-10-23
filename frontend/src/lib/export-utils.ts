import jsPDF from 'jspdf';
import 'jspdf-autotable';

export interface ExportData {
  moduleName: string;
  moduleTitle: string;
  inputs: { label: string; value: string }[];
  results: { label: string; value: string; highlight?: boolean }[];
  tables?: { title: string; headers: string[]; rows: (string | number)[][] }[];
  chartImage?: string; // Base64 image de gráficos
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

export async function exportToPDF(data: ExportData): Promise<boolean> {
  try {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    const margin = 20;
    let yPosition = margin;

    // Cabeçalho
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('EduSolo', margin, yPosition);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const currentDate = new Date().toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
    doc.text(currentDate, pageWidth - margin, yPosition, { align: 'right' });
    
    yPosition += 10;
    
    // Linha separadora
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 15;

    // Título do módulo
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(data.moduleTitle, margin, yPosition);
    yPosition += 12;

    // Seção de Dados de Entrada
    if (data.inputs.length > 0) {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(100, 50, 150);
      doc.text('Dados de Entrada', margin, yPosition);
      doc.setTextColor(0, 0, 0);
      yPosition += 8;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      
      for (const input of data.inputs) {
        if (yPosition > pageHeight - 30) {
          doc.addPage();
          yPosition = margin;
        }

        doc.setFont('helvetica', 'normal');
        doc.text(`${input.label}:`, margin + 5, yPosition);
        doc.setFont('helvetica', 'bold');
        doc.text(input.value, margin + 90, yPosition);
        yPosition += 7;
      }
    }

    // Seção de Resultados
    if (data.results.length > 0) {
      yPosition += 10;
      
      if (yPosition > pageHeight - 40) {
        doc.addPage();
        yPosition = margin;
      }

      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(100, 50, 150);
      doc.text('Resultados', margin, yPosition);
      doc.setTextColor(0, 0, 0);
      yPosition += 8;

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

        if (result.highlight) {
          doc.setFillColor(240, 235, 250);
          doc.rect(margin, yPosition - 5, pageWidth - 2 * margin, totalHeight + 2, 'F');
        }

        doc.setFont('helvetica', 'normal');
        doc.text(`${result.label}:`, margin + 5, yPosition);
        doc.setFont('helvetica', 'bold');
        
        // Renderizar texto com quebra de linha
        if (numLines === 1) {
          doc.text(result.value, margin + 90, yPosition);
        } else {
          doc.text(valueLines, margin + 90, yPosition);
        }
        
        yPosition += totalHeight;
      }
    }

    // Adicionar tabelas se disponíveis
    if (data.tables && data.tables.length > 0) {
      for (const table of data.tables) {
        yPosition += 10;
        
        if (yPosition > pageHeight - 60) {
          doc.addPage();
          yPosition = margin;
        }

        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(100, 50, 150);
        doc.text(table.title, margin, yPosition);
        doc.setTextColor(0, 0, 0);
        yPosition += 5;

        // Usar autoTable para criar a tabela
        try {
          doc.autoTable({
            startY: yPosition,
            head: [table.headers],
            body: table.rows,
            theme: 'striped',
            headStyles: {
              fillColor: [100, 50, 150],
              textColor: [255, 255, 255],
              fontStyle: 'bold',
              fontSize: 9
            },
            bodyStyles: {
              fontSize: 8
            },
            alternateRowStyles: {
              fillColor: [245, 245, 250]
            },
            margin: { left: margin, right: margin },
          });

          yPosition = doc.lastAutoTable.finalY + 5;
        } catch (tableError) {
          // Se falhar, continuar sem a tabela
          yPosition += 10;
        }
      }
    }

    // Adicionar gráfico se disponível
    if (data.chartImage) {
      yPosition += 10;
      
      if (yPosition > pageHeight - 100) {
        doc.addPage();
        yPosition = margin;
      }

      const imgWidth = pageWidth - 2 * margin;
      const imgHeight = 80;
      
      doc.addImage(data.chartImage, 'PNG', margin, yPosition, imgWidth, imgHeight);
      yPosition += imgHeight + 5;
    }

    // Rodapé em todas as páginas
    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      const footerY = pageHeight - 15;
      doc.setFontSize(8);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(128, 128, 128);
      doc.text(
        'Gerado por EduSolo - Sistema de Análise Geotécnica',
        pageWidth / 2,
        footerY,
        { align: 'center' }
      );
      doc.text(
        `Página ${i} de ${totalPages}`,
        pageWidth - margin,
        footerY,
        { align: 'right' }
      );
    }

    // Salvar PDF
    const fileName = `${data.moduleName}_${new Date().getTime()}.pdf`;
    doc.save(fileName);
    
    return true;
  } catch (error) {
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

