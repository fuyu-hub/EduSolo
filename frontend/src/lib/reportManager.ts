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
 * Salva um relatório no localStorage
 * Retorna um objeto RecentReport que pode ser salvo via useRecentReports
 */
export function prepareReportForStorage(
  params: CreateReportParams
): Omit<RecentReport, 'id' | 'createdAt'> {
  return {
    name: params.name,
    moduleType: params.moduleType,
    moduleName: params.moduleName,
    pdfUrl: createPdfUrl(params.pdfBlob),
    calculationData: params.calculationData,
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
 *   calculationData: { /* dados do ensaio */ }
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