import { jsPDF } from 'jspdf';

interface AutoTableOptions {
  startY?: number;
  head?: string[][];
  body?: (string | number)[][];
  theme?: 'striped' | 'grid' | 'plain';
  headStyles?: {
    fillColor?: number[];
    textColor?: number[];
    fontSize?: number;
    fontStyle?: string;
  };
  bodyStyles?: {
    fontSize?: number;
  };
  styles?: {
    fontSize?: number;
    cellPadding?: number;
  };
  alternateRowStyles?: {
    fillColor?: number[];
  };
  margin?: {
    left?: number;
    right?: number;
  };
}

declare module 'jspdf' {
  interface jsPDF {
    lastAutoTable: {
      finalY: number;
    };
    autoTable: (options: AutoTableOptions) => jsPDF;
  }
}

