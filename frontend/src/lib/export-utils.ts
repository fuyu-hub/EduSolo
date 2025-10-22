import jsPDF from 'jspdf';

export interface ExportData {
  moduleName: string;
  moduleTitle: string;
  inputs: { label: string; value: string }[];
  results: { label: string; value: string; highlight?: boolean }[];
  chartImage?: string; // Base64 image de gráficos
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
    yPosition += 10;

    // Seção de Dados de Entrada
    if (data.inputs.length > 0) {
      yPosition += 5;
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Dados de Entrada', margin, yPosition);
      yPosition += 8;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      
      for (const input of data.inputs) {
        // Verificar se precisa de nova página
        if (yPosition > pageHeight - 30) {
          doc.addPage();
          yPosition = margin;
        }

        doc.setFont('helvetica', 'normal');
        doc.text(`${input.label}:`, margin + 5, yPosition);
        doc.setFont('helvetica', 'bold');
        doc.text(input.value, margin + 80, yPosition);
        yPosition += 7;
      }
    }

    // Seção de Resultados
    if (data.results.length > 0) {
      yPosition += 10;
      
      // Verificar se precisa de nova página
      if (yPosition > pageHeight - 40) {
        doc.addPage();
        yPosition = margin;
      }

      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Resultados', margin, yPosition);
      yPosition += 8;

      doc.setFontSize(10);
      
      for (const result of data.results) {
        // Verificar se precisa de nova página
        if (yPosition > pageHeight - 30) {
          doc.addPage();
          yPosition = margin;
        }

        if (result.highlight) {
          // Destaque para resultados importantes
          doc.setFillColor(240, 240, 255);
          doc.rect(margin, yPosition - 5, pageWidth - 2 * margin, 8, 'F');
        }

        doc.setFont('helvetica', 'normal');
        doc.text(`${result.label}:`, margin + 5, yPosition);
        doc.setFont('helvetica', 'bold');
        doc.text(result.value, margin + 80, yPosition);
        yPosition += 7;
      }
    }

    // Adicionar gráfico se disponível
    if (data.chartImage) {
      yPosition += 10;
      
      // Verificar se precisa de nova página
      if (yPosition > pageHeight - 100) {
        doc.addPage();
        yPosition = margin;
      }

      const imgWidth = pageWidth - 2 * margin;
      const imgHeight = 80; // Altura fixa para o gráfico
      
      doc.addImage(data.chartImage, 'PNG', margin, yPosition, imgWidth, imgHeight);
      yPosition += imgHeight + 5;
    }

    // Rodapé
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

    // Salvar PDF
    const fileName = `${data.moduleName}_${new Date().getTime()}.pdf`;
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
    console.error('Erro ao capturar gráfico:', error);
    return null;
  }
}

