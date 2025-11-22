/**
 * Índice de exportação de todos os módulos de cálculo
 * Centraliza acesso às funções de cálculo do EduSolos
 */

export { calcularIndicesFisicos } from './indices-fisicos';
export { calcularLimitesConsistencia } from './limites-consistencia';
export { calcularGranulometria } from './granulometria';
export { classificarUSCS } from './classificacao-uscs';
export { classificarHRB } from './classificacao-hrb';
export { calcularTensoesGeostaticas } from './tensoes-geostaticas';
export { calcularCompactacao } from './compactacao';
export { calcularRecalqueAdensamento } from './recalque-adensamento';
export { calcularTempoAdensamento } from './tempo-adensamento';
export { calcularAcrescimoTensoes } from './acrescimo-tensoes';

// Re-exportar schemas
export * from '../schemas';

