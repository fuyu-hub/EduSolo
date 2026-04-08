/**
 * lib/shared — Módulo central de utilitários reutilizáveis do EduSolos.
 * 
 * Este barrel export agrupa todas as funções compartilhadas entre módulos.
 * Para importar: import { parseDecimal, calcularUmidade, generateId } from '@/lib/shared';
 */

export { parseDecimal, parseOptional, parseOrZero } from './parsing';
export { calcularUmidade, calcularMBSInverso, calcularUmidadeNum } from './soil-calculations';
export { generateId, formatValue, isValidNumber } from './helpers';
