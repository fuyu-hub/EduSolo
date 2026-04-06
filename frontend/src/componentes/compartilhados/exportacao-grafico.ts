import html2canvas from 'html2canvas';
import { toast } from "@/components/ui/sonner";

/**
 * Utilitário compartilhado para exportar gráficos como imagem (JPEG)
 * Captura um elemento do DOM e inicia o download
 * 
 * @param elementId ID do elemento HTML a ser capturado
 * @param fileName Nome base do arquivo de saída
 * @param options Configurações adicionais
 */
export const exportChartAsImage = async (
  elementId: string,
  fileName: string,
  options: {
    scale?: number;
    backgroundColor?: string;
    quality?: number;
  } = {}
) => {
  const element = document.getElementById(elementId);
  
  if (!element) {
    console.error(`Elemento com ID "${elementId}" não encontrado.`);
    toast.error("Erro ao localizar o gráfico para exportação.");
    return;
  }

  try {
    toast.info("Capturando gráfico em alta resolução...");

    // Pequeno delay para garantir que o Recharts terminou de renderizar se for um elemento oculto recém-montado
    await new Promise(resolve => setTimeout(resolve, 100));

    const canvas = await html2canvas(element, {
      backgroundColor: options.backgroundColor || '#ffffff',
      scale: options.scale || 3, // Escala 3 para alta definição
      logging: false,
      useCORS: true,
      allowTaint: true,
    });

    canvas.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        const timestamp = new Date().toISOString().split('T')[0];
        
        link.download = `${fileName}_${timestamp}.jpg`;
        link.href = url;
        link.click();
        
        // Limpeza
        setTimeout(() => {
          URL.revokeObjectURL(url);
        }, 100);
        
        toast.success("Gráfico exportado com sucesso!");
      }
    }, 'image/jpeg', options.quality || 0.95);
  } catch (error) {
    console.error('Erro ao exportar gráfico:', error);
    toast.error("Erro técnico ao gerar a imagem do gráfico.");
  }
};

/**
 * Captura um elemento do DOM e retorna como DataURL (PNG)
 * Útil para inclusão em PDFs ou outros documentos
 * 
 * @param elementId ID do elemento HTML
 * @param options Configurações (scale, etc)
 * @returns Promise com DataURL ou null em caso de erro
 */
export const getChartImage = async (
  elementId: string,
  options: {
    scale?: number;
    backgroundColor?: string;
  } = {}
): Promise<string | null> => {
  const element = document.getElementById(elementId);
  if (!element) return null;

  try {
    const canvas = await html2canvas(element, {
      backgroundColor: options.backgroundColor || '#ffffff',
      scale: options.scale || 2,
      logging: false,
      useCORS: true,
      allowTaint: true,
    });

    return canvas.toDataURL('image/png');
  } catch (error) {
    console.error('Erro ao capturar imagem do gráfico:', error);
    return null;
  }
};
