import { RecentReport } from '@/hooks/useRecentReports';

/**
 * Funções utilitárias para gerenciar relatórios salvos
 */

export interface CreateReportParams {
  name: string;
  moduleType: string;
  moduleName: string;
  pdfBlob: Blob;
  calculationData: Record<string, any>;
}

/**
 * Cria um blob URL do PDF para armazenar localmente
 */
export function createPdfUrl(blob: Blob): string {
  return URL.createObjectURL(blob);
}

/**
 * Converte um Blob para uma string base64 (sem prefixo data:)
 */
export function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      // result é um data URL: "data:application/pdf;base64,...." -> extrair a parte base64
      const base64 = result.split(',')[1] || '';
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Salva um relatório no localStorage
 * Retorna um objeto RecentReport que pode ser salvo via useRecentReports
 */
export async function prepareReportForStorage(
  params: CreateReportParams
): Promise<Omit<RecentReport, 'id' | 'createdAt'>> {
  const pdfUrl = createPdfUrl(params.pdfBlob);
  const pdfData = await blobToBase64(params.pdfBlob);
  return {
    name: params.name,
    moduleType: params.moduleType,
    moduleName: params.moduleName,
    pdfUrl,
    calculationData: params.calculationData,
    pdfData,
  };
}

/**
 * Exemplo de como usar em um componente de exportação:
 * 
 * import { useRecentReports } from '@/hooks/useRecentReports';
 * import { prepareReportForStorage } from '@/lib/reportManager';
 * 
 * const { addReport } = useRecentReports();
 * 
 * // Quando gerar um PDF:
 * const pdfBlob = await generatePDF(); // seu código de geração de PDF
 * const reportData = prepareReportForStorage({
 *   name: 'Ensaio de Granulometria - 28/10/2025',
 *   moduleType: 'granulometria',
 *   moduleName: 'Granulometria',
 *   pdfBlob: pdfBlob,
 *   calculationData: { }
 * });
 * addReport(reportData);
 */

/**
 * Converte um blob URL para um arquivo baixável
 */
export function downloadPdfFromUrl(url: string, filename: string) {
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Limpa blob URLs para evitar vazamento de memória
 * Chame isso quando um relatório for removido
 */
export function revokePdfUrl(url: string) {
  if (url.startsWith('blob:')) {
    URL.revokeObjectURL(url);
  }
}

/**
 * Abre um PDF a partir de base64 em nova aba, criando um Blob temporário
 */
export function openPdfFromBase64(base64: string) {
  const byteCharacters = atob(base64);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  const blob = new Blob([byteArray], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank');
}

/**
 * Faz o download de um PDF a partir de base64 gerando um Blob temporário
 */
export function downloadPdfFromBase64(base64: string, filename: string) {
  const byteCharacters = atob(base64);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  const blob = new Blob([byteArray], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  downloadPdfFromUrl(url, filename);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}