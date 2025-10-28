import { useState, useEffect, useCallback } from 'react';
import { revokePdfUrl } from '@/lib/reportManager';

export interface RecentReport {
  id: string;
  name: string;
  moduleType: string; // "granulometria", "indices-fisicos", etc
  moduleName: string; // Nome legível do módulo
  createdAt: string; // ISO date string
  pdfUrl: string; // URL local ou blob do PDF
  calculationData: Record<string, any>; // Dados do ensaio
  pdfData?: string; // Base64 do PDF para persistência em mobile
}

const STORAGE_KEY = 'edusolorecentreports';

export function useRecentReports() {
  const [reports, setReports] = useState<RecentReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Carregar relatórios do localStorage ao montar
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        const sanitized = (Array.isArray(parsed) ? parsed : []).map((r: RecentReport) => ({
          ...r,
          // Evitar reutilizar blob URLs após recarregar a página
          pdfUrl: typeof r.pdfUrl === 'string' && r.pdfUrl.startsWith('blob:') ? '' : r.pdfUrl,
        }));
        setReports(sanitized);
      }
    } catch (error) {
      console.error('Erro ao carregar relatórios:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Salvar relatório
  const addReport = useCallback((report: Omit<RecentReport, 'id' | 'createdAt'>) => {
    try {
      const newReport: RecentReport = {
        ...report,
        id: `report_${Date.now()}`,
        createdAt: new Date().toISOString(),
      };

      const updated = [newReport, ...reports];
      setReports(updated);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      
      return newReport;
    } catch (error) {
      console.error('Erro ao salvar relatório:', error);
      return null;
    }
  }, [reports]);

  // Remover relatório
  const removeReport = useCallback((id: string) => {
    try {
      const toRemove = reports.find(r => r.id === id);
      if (toRemove?.pdfUrl) {
        revokePdfUrl(toRemove.pdfUrl);
      }
      const updated = reports.filter((r) => r.id !== id);
      setReports(updated);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error('Erro ao remover relatório:', error);
    }
  }, [reports]);

  // Limpar todos os relatórios
  const clearAll = useCallback(() => {
    try {
      // Revogar quaisquer blob URLs existentes
      reports.forEach(r => {
        if (r.pdfUrl) revokePdfUrl(r.pdfUrl);
      });
      setReports([]);
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Erro ao limpar relatórios:', error);
    }
  }, []);

  return {
    reports,
    isLoading,
    addReport,
    removeReport,
    clearAll,
  };
}