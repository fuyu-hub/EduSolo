/**
 * Módulo para Análise Granulométrica de Solos
 * Calcula curva granulométrica, parâmetros característicos e classificação
 * 
 * Referências:
 * - NBR 7181 - Análise Granulométrica
 * - ASTM D422 - Particle-Size Analysis of Soils
 */

import type {
  GranulometriaInput,
  GranulometriaOutput,
  PontoGranulometrico,
} from '../schemas';
import { classificarUSCS } from './classificacao-uscs';
import { classificarHRB } from './classificacao-hrb';

const EPSILON = 1e-9;

// Limites de tamanho de partículas (mm)
const LIMITE_PENEIRA_4 = 4.76; // Separação pedregulho/areia
const LIMITE_PENEIRA_200 = 0.075; // Separação areia/finos

export function calcularGranulometria(dados: GranulometriaInput): GranulometriaOutput {
  try {
    const massa_total = dados.massa_total;

    // Validação básica
    if (massa_total <= EPSILON) {
      throw new Error('Massa total deve ser maior que zero.');
    }

    // Ordenar peneiras por abertura (decrescente)
    const peneiras_ordenadas = [...dados.peneiras].sort((a, b) => b.abertura - a.abertura);

    // Calcular porcentagens retidas e passantes
    const dados_granulometricos: PontoGranulometrico[] = [];
    let massa_acumulada = 0.0;

    for (const peneira of peneiras_ordenadas) {
      massa_acumulada += peneira.massa_retida;

      const porc_retida = (peneira.massa_retida / massa_total) * 100;
      const porc_retida_acum = (massa_acumulada / massa_total) * 100;
      const porc_passante = 100 - porc_retida_acum;

      dados_granulometricos.push({
        abertura: peneira.abertura,
        massa_retida: peneira.massa_retida,
        porc_retida: Number(porc_retida.toFixed(2)),
        porc_retida_acum: Number(porc_retida_acum.toFixed(2)),
        porc_passante: Number(porc_passante.toFixed(2)),
      });
    }

    // Verificar se soma das massas não excede a massa total
    if (massa_acumulada > massa_total + EPSILON) {
      throw new Error(
        `Soma das massas retidas (${massa_acumulada.toFixed(2)}g) excede a massa total (${massa_total.toFixed(2)}g).`
      );
    }

    // Calcular percentuais de pedregulho, areia e finos
    const percentagens = calcularPercentuaisGranulometricos(dados_granulometricos);

    // Calcular D10, D30, D60 por interpolação
    const d10 = calcularDiametroCaracteristico(dados_granulometricos, 10);
    const d30 = calcularDiametroCaracteristico(dados_granulometricos, 30);
    const d60 = calcularDiametroCaracteristico(dados_granulometricos, 60);

    // Calcular coeficientes de uniformidade e curvatura
    const [cu, cc] = calcularCoeficientes(d10, d30, d60);

    // Integração com classificação USCS
    let classificacao_uscs: string | undefined;
    let descricao_uscs: string | undefined;

    // Integração com classificação HRB
    let classificacao_hrb: string | undefined;
    let grupo_hrb: string | undefined;
    let subgrupo_hrb: string | undefined;
    let indice_grupo_hrb: number | undefined;
    let descricao_hrb: string | undefined;
    let avaliacao_subleito_hrb: string | undefined;

    if (percentagens.finos !== undefined) {
      // Calcular IP se LL e LP foram fornecidos
      let ip: number | undefined;
      if (dados.ll !== undefined && dados.lp !== undefined) {
        ip = dados.ll - dados.lp;
        if (ip < 0) ip = 0;
      }

      // Classificação USCS
      try {
        const resultado_uscs = classificarUSCS({
          pass_peneira_200: percentagens.finos,
          pass_peneira_4: (percentagens.finos ?? 0) + (percentagens.areia ?? 0),
          ll: dados.ll,
          ip,
          Cu: cu,
          Cc: cc,
          is_organico_fino: false,
          is_altamente_organico: false,
        });

        if (!resultado_uscs.erro) {
          classificacao_uscs = resultado_uscs.classificacao;
          descricao_uscs = resultado_uscs.descricao;
        }
      } catch (e) {
        console.warn('Não foi possível classificar USCS:', e);
      }

      // Classificação HRB
      try {
        const pass_10 = interpolarPassante(dados_granulometricos, 2.0); // Peneira #10
        const pass_40 = interpolarPassante(dados_granulometricos, 0.42); // Peneira #40

        const resultado_hrb = classificarHRB({
          pass_peneira_200: percentagens.finos,
          pass_peneira_40: pass_40,
          pass_peneira_10: pass_10,
          ll: dados.ll,
          ip,
        });

        if (!resultado_hrb.erro) {
          classificacao_hrb = resultado_hrb.classificacao;
          grupo_hrb = resultado_hrb.grupo_principal;
          subgrupo_hrb = resultado_hrb.subgrupo;
          indice_grupo_hrb = resultado_hrb.indice_grupo;
          descricao_hrb = resultado_hrb.descricao;
          avaliacao_subleito_hrb = resultado_hrb.avaliacao_subleito;
        }
      } catch (e) {
        console.warn('Não foi possível classificar HRB:', e);
      }
    }

    return {
      dados_granulometricos,
      percentagem_pedregulho: percentagens.pedregulho,
      percentagem_areia: percentagens.areia,
      percentagem_finos: percentagens.finos,
      d10,
      d30,
      d60,
      coef_uniformidade: cu,
      coef_curvatura: cc,
      classificacao_uscs,
      descricao_uscs,
      classificacao_hrb,
      grupo_hrb,
      subgrupo_hrb,
      indice_grupo_hrb,
      descricao_hrb,
      avaliacao_subleito_hrb,
    };
  } catch (error) {
    return {
      dados_granulometricos: [],
      erro: error instanceof Error ? error.message : 'Erro na análise granulométrica',
    };
  }
}

function calcularPercentuaisGranulometricos(dados: PontoGranulometrico[]): {
  pedregulho: number | undefined;
  areia: number | undefined;
  finos: number | undefined;
} {
  // Encontrar porcentagem passante na peneira #4 (4.76mm)
  let passante_4: number | undefined;
  for (const ponto of dados) {
    if (Math.abs(ponto.abertura - LIMITE_PENEIRA_4) < 0.1) {
      passante_4 = ponto.porc_passante;
      break;
    }
  }

  // Interpolar se necessário
  if (passante_4 === undefined) {
    if (dados.every((p) => p.abertura > LIMITE_PENEIRA_4)) {
      passante_4 = dados.length > 0 ? dados[dados.length - 1].porc_passante : 100.0;
    } else if (dados.every((p) => p.abertura < LIMITE_PENEIRA_4)) {
      passante_4 = 100.0;
    } else {
      passante_4 = interpolarPassante(dados, LIMITE_PENEIRA_4);
    }
  }

  // Encontrar porcentagem passante na peneira #200 (0.075mm)
  let passante_200: number | undefined;
  for (const ponto of dados) {
    if (Math.abs(ponto.abertura - LIMITE_PENEIRA_200) < 0.01) {
      passante_200 = ponto.porc_passante;
      break;
    }
  }

  if (passante_200 === undefined) {
    if (dados.every((p) => p.abertura > LIMITE_PENEIRA_200)) {
      passante_200 = dados.length > 0 ? dados[dados.length - 1].porc_passante : 100.0;
    } else if (dados.every((p) => p.abertura < LIMITE_PENEIRA_200)) {
      passante_200 = 100.0;
    } else {
      passante_200 = interpolarPassante(dados, LIMITE_PENEIRA_200);
    }
  }

  // Calcular percentuais
  const perc_pedregulho =
    passante_4 !== undefined ? Number((100.0 - passante_4).toFixed(2)) : undefined;
  const perc_finos = passante_200 !== undefined ? Number(passante_200.toFixed(2)) : undefined;

  let perc_areia: number | undefined;
  if (passante_4 !== undefined && passante_200 !== undefined) {
    perc_areia = Number((passante_4 - passante_200).toFixed(2));
  }

  return {
    pedregulho: perc_pedregulho,
    areia: perc_areia,
    finos: perc_finos,
  };
}

function interpolarPassante(dados: PontoGranulometrico[], abertura_alvo: number): number {
  for (let i = 0; i < dados.length - 1; i++) {
    const p1 = dados[i];
    const p2 = dados[i + 1];

    // Verifica se a abertura alvo está entre os dois pontos
    if (p1.abertura >= abertura_alvo && abertura_alvo >= p2.abertura) {
      // Interpolação linear
      if (Math.abs(p1.abertura - p2.abertura) < EPSILON) {
        return p1.porc_passante;
      }

      const passante =
        p2.porc_passante +
        ((p1.porc_passante - p2.porc_passante) * (abertura_alvo - p2.abertura)) /
          (p1.abertura - p2.abertura);

      return passante;
    }
  }

  // Se não encontrou, retorna o valor do primeiro ponto
  return dados.length > 0 ? dados[0].porc_passante : 100.0;
}

function calcularDiametroCaracteristico(
  dados: PontoGranulometrico[],
  percentual_passante: number
): number | undefined {
  if (dados.length < 2) {
    return undefined;
  }

  for (let i = 0; i < dados.length - 1; i++) {
    const p1 = dados[i];
    const p2 = dados[i + 1];

    // Verifica se o percentual está entre os dois pontos
    if (p1.porc_passante >= percentual_passante && percentual_passante >= p2.porc_passante) {
      // Interpolação logarítmica
      if (Math.abs(p1.porc_passante - p2.porc_passante) < EPSILON) {
        return Number(Math.sqrt(p1.abertura * p2.abertura).toFixed(4));
      }

      // Converter aberturas para escala logarítmica
      const log_d1 = Math.log10(p1.abertura);
      const log_d2 = Math.log10(p2.abertura);

      // Interpolação linear no espaço logarítmico
      const log_diametro =
        log_d2 +
        ((log_d1 - log_d2) * (percentual_passante - p2.porc_passante)) /
          (p1.porc_passante - p2.porc_passante);

      const diametro = Math.pow(10, log_diametro);

      return Number(diametro.toFixed(4));
    }
  }

  return undefined;
}

function calcularCoeficientes(
  d10: number | undefined,
  d30: number | undefined,
  d60: number | undefined
): [number | undefined, number | undefined] {
  let cu: number | undefined;
  let cc: number | undefined;

  // Calcular Cu
  if (d10 !== undefined && d60 !== undefined && d10 > EPSILON) {
    cu = Number((d60 / d10).toFixed(2));
  }

  // Calcular Cc
  if (d10 !== undefined && d30 !== undefined && d60 !== undefined) {
    if (d10 > EPSILON && d60 > EPSILON) {
      cc = Number(((d30 * d30) / (d10 * d60)).toFixed(2));
    }
  }

  return [cu, cc];
}

