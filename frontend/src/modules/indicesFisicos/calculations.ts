/**
 * Módulo para Cálculo de Índices Físicos do Solo
 * Calcula propriedades e índices físicos a partir de diferentes combinações de dados
 * 
 * Referências:
 * - Índices Físicos dos Solos (mecânica dos solos)
 */

import type { IndicesFisicosInput, IndicesFisicosOutput } from './schemas';
// Tipos importados do schema Zod para validação de entrada/saída

const EPSILON = 1e-9;

// Interface para estatísticas de múltiplas amostras
export interface EstatisticaParametro {
  media: number;
  desvio_padrao: number;
  coeficiente_variacao: number;
  minimo: number;
  maximo: number;
}

export interface IndicesFisicosOutputComEstatisticas extends IndicesFisicosOutput {
  erro?: string;
  aviso?: string;
  num_amostras?: number;
  estatisticas?: {
    peso_especifico_natural?: EstatisticaParametro;
    peso_especifico_seco?: EstatisticaParametro;
    peso_especifico_saturado?: EstatisticaParametro;
    umidade?: EstatisticaParametro;
    indice_vazios?: EstatisticaParametro;
    porosidade?: EstatisticaParametro;
    grau_saturacao?: EstatisticaParametro;
  };
}

/**
 * Calcula estatísticas para um conjunto de valores
 */
function calcularEstatisticas(valores: (number | undefined | null)[]): EstatisticaParametro | undefined {
  const valoresValidos = valores.filter((v): v is number => v !== null && v !== undefined && !isNaN(v));
  
  if (valoresValidos.length < 2) {
    return undefined;
  }
  
  const n = valoresValidos.length;
  const media = valoresValidos.reduce((a, b) => a + b, 0) / n;
  
  const variancia = valoresValidos.reduce((sum, v) => sum + Math.pow(v - media, 2), 0) / (n - 1);
  const desvio_padrao = Math.sqrt(variancia);
  const coeficiente_variacao = (desvio_padrao / media) * 100;
  
  const minimo = Math.min(...valoresValidos);
  const maximo = Math.max(...valoresValidos);
  
  return {
    media: Number(media.toFixed(3)),
    desvio_padrao: Number(desvio_padrao.toFixed(3)),
    coeficiente_variacao: Number(coeficiente_variacao.toFixed(2)),
    minimo: Number(minimo.toFixed(3)),
    maximo: Number(maximo.toFixed(3)),
  };
}

/**
 * Calcula índices físicos para múltiplas amostras e retorna estatísticas
 */
export function calcularIndicesFisicosMultiplasAmostras(
  amostras: IndicesFisicosInput[]
): IndicesFisicosOutputComEstatisticas {
  if (amostras.length === 0) {
    return { erro: 'Nenhuma amostra fornecida' };
  }
  
  // Calcular para cada amostra
  const resultados = amostras.map(amostra => calcularIndicesFisicos(amostra));
  
  // Se houver erro em alguma, retornar o primeiro erro
  const erros = resultados.filter(r => r.erro);
  if (erros.length > 0) {
    return erros[0];
  }
  
  // Se for apenas uma amostra, retornar o resultado direto
  if (amostras.length === 1) {
    return { ...resultados[0], num_amostras: 1 };
  }
  
  // Calcular estatísticas para cada parâmetro
  const estatisticas = {
    peso_especifico_natural: calcularEstatisticas(resultados.map(r => r.peso_especifico_natural)),
    peso_especifico_seco: calcularEstatisticas(resultados.map(r => r.peso_especifico_seco)),
    peso_especifico_saturado: calcularEstatisticas(resultados.map(r => r.peso_especifico_saturado)),
    umidade: calcularEstatisticas(resultados.map(r => r.umidade)),
    indice_vazios: calcularEstatisticas(resultados.map(r => r.indice_vazios)),
    porosidade: calcularEstatisticas(resultados.map(r => r.porosidade)),
    grau_saturacao: calcularEstatisticas(resultados.map(r => r.grau_saturacao)),
  };
  
  // Usar médias como valores principais
  const resultado: IndicesFisicosOutputComEstatisticas = {
    peso_especifico_natural: estatisticas.peso_especifico_natural?.media ?? resultados[0].peso_especifico_natural,
    peso_especifico_seco: estatisticas.peso_especifico_seco?.media ?? resultados[0].peso_especifico_seco,
    peso_especifico_saturado: estatisticas.peso_especifico_saturado?.media ?? resultados[0].peso_especifico_saturado,
    peso_especifico_submerso: resultados[0].peso_especifico_submerso,
    peso_especifico_solidos: resultados[0].peso_especifico_solidos,
    Gs: resultados[0].Gs,
    indice_vazios: estatisticas.indice_vazios?.media ?? resultados[0].indice_vazios,
    porosidade: estatisticas.porosidade?.media ?? resultados[0].porosidade,
    grau_saturacao: estatisticas.grau_saturacao?.media ?? resultados[0].grau_saturacao,
    umidade: estatisticas.umidade?.media ?? resultados[0].umidade,
    volume_solidos_norm: resultados[0].volume_solidos_norm,
    volume_agua_norm: resultados[0].volume_agua_norm,
    volume_ar_norm: resultados[0].volume_ar_norm,
    peso_solidos_norm: resultados[0].peso_solidos_norm,
    peso_agua_norm: resultados[0].peso_agua_norm,
    compacidade_relativa: resultados[0].compacidade_relativa,
    classificacao_compacidade: resultados[0].classificacao_compacidade,
    volume_total_calc: resultados[0].volume_total_calc,
    volume_solidos_calc: resultados[0].volume_solidos_calc,
    volume_agua_calc: resultados[0].volume_agua_calc,
    volume_ar_calc: resultados[0].volume_ar_calc,
    massa_total_calc: resultados[0].massa_total_calc,
    massa_solidos_calc: resultados[0].massa_solidos_calc,
    massa_agua_calc: resultados[0].massa_agua_calc,
    estatisticas,
    num_amostras: amostras.length,
  };
  
  // Adicionar aviso sobre CV se necessário
  const CVs = Object.values(estatisticas)
    .filter((e): e is EstatisticaParametro => e !== undefined)
    .map(e => e.coeficiente_variacao);
  
  if (CVs.length > 0) {
    const CV_medio = CVs.reduce((a, b) => a + b, 0) / CVs.length;
    
    if (CV_medio > 15) {
      resultado.aviso = `⚠️ Alta variabilidade detectada entre amostras (CV médio = ${CV_medio.toFixed(1)}%). Recomenda-se revisar os ensaios.`;
    } else if (CV_medio > 10) {
      resultado.aviso = `⚠️ Variação moderada entre amostras (CV médio = ${CV_medio.toFixed(1)}%). Resultados aceitáveis.`;
    }
  }
  
  return resultado;
}

export function calcularIndicesFisicos(dados: IndicesFisicosInput): IndicesFisicosOutput {
  try {
    // Inicializa variáveis a partir dos dados de entrada
    let w = dados.umidade !== undefined ? dados.umidade / 100 : undefined;
    let n = dados.porosidade !== undefined ? dados.porosidade / 100 : undefined;
    let S = dados.grau_saturacao !== undefined ? dados.grau_saturacao / 100 : undefined;
    let e = dados.indice_vazios;
    let gs = dados.Gs;
    let gama_s = dados.peso_especifico_solidos;
    let gama_nat = dados.peso_especifico_natural;
    let gama_d = dados.peso_especifico_seco;
    const gama_w = dados.peso_especifico_agua;
    const mu_in = dados.peso_total; // Massa úmida (g)
    const ms_in = dados.peso_solido; // Massa seca (g)
    const v_in = dados.volume_total; // Volume total (cm³)
    const emax = dados.indice_vazios_max;
    const emin = dados.indice_vazios_min;

    // Variáveis calculadas
    let gama_sat: number | undefined;
    let gama_sub: number | undefined;
    let Dr: number | undefined;
    let classificacao_compacidade: string | undefined;

    // Variáveis para volumes/massas reais
    let v_calc = v_in;
    let vs_calc: number | undefined;
    let vv_calc: number | undefined;
    let vw_calc: number | undefined;
    let va_calc: number | undefined;
    let mt_calc = mu_in;
    let ms_calc = ms_in;
    let mw_calc: number | undefined;

    // γw em g/cm³
    const gama_w_gcm3 = Math.abs(gama_w - 10.0) < 0.5 ? 1.0 : gama_w / 9.81;

    // CÁLCULOS DIRETOS PRIORITÁRIOS
    if (w === undefined && mu_in !== undefined && ms_in !== undefined) {
      if (ms_in <= EPSILON) {
        throw new Error('Massa/Peso seco não pode ser zero para calcular umidade.');
      }
      if (mu_in < ms_in - EPSILON) {
        throw new Error('Massa/Peso úmido menor que seco.');
      }
      w = (mu_in - ms_in) / ms_in;
      mw_calc = mu_in - ms_in;
    } else if (mw_calc === undefined && mu_in !== undefined && ms_in !== undefined) {
      mw_calc = mu_in - ms_in;
    }

    if (gama_nat === undefined && mu_in !== undefined && v_in !== undefined) {
      if (v_in <= EPSILON) {
        throw new Error('Volume total não pode ser zero.');
      }
      const gama_nat_gcm3 = mu_in / v_in;
      gama_nat = (gama_nat_gcm3 * gama_w) / gama_w_gcm3;
    }

    if (gama_d === undefined && ms_in !== undefined && v_in !== undefined) {
      if (v_in <= EPSILON) {
        throw new Error('Volume total não pode ser zero.');
      }
      const gama_d_gcm3 = ms_in / v_in;
      gama_d = (gama_d_gcm3 * gama_w) / gama_w_gcm3;
    }

    if (gama_d === undefined && gama_nat !== undefined && w !== undefined) {
      if (1 + w <= EPSILON) {
        throw new Error('Umidade (w) inválida (-100% ou menos)');
      }
      gama_d = gama_nat / (1 + w);
    }

    // Lógica de cálculo em cascata
    if (gs === undefined && gama_s !== undefined) {
      if (gama_w <= EPSILON) {
        throw new Error('Peso específico da água não pode ser zero.');
      }
      gs = gama_s / gama_w;
    } else if (gama_s === undefined && gs !== undefined) {
      gama_s = gs * gama_w;
    } else if (gs !== undefined && gama_s !== undefined) {
      if (Math.abs(gama_s - gs * gama_w) > 1e-3 * gama_w) {
        return {
          erro: `Gs (${gs}) e Peso Específico dos Sólidos (${gama_s} kN/m³) são inconsistentes para γw=${gama_w} kN/m³.`,
        };
      }
    }

    if (e === undefined && n !== undefined) {
      if (Math.abs(1 - n) <= EPSILON) {
        throw new Error('Porosidade (n) não pode ser 100%');
      }
      e = n / (1 - n);
    } else if (n === undefined && e !== undefined) {
      if (Math.abs(1 + e) <= EPSILON) {
        throw new Error('Índice de Vazios (e) inválido');
      }
      n = e / (1 + e);
    }

    if (e === undefined && gama_d !== undefined) {
      if (gs !== undefined) {
        if (gama_d <= EPSILON) {
          e = gs > EPSILON ? Infinity : undefined;
        } else {
          e = (gs * gama_w) / gama_d - 1;
          if (e < -EPSILON) {
            throw new Error(
              `Cálculo resultou em índice de vazios negativo (${e.toFixed(4)}). Verifique γd (${gama_d}) e Gs (${gs}).`
            );
          } else if (e < 0) {
            e = 0.0;
          }
        }
      } else if (gama_s !== undefined) {
        if (gama_d <= EPSILON) {
          e = gama_s > EPSILON ? Infinity : undefined;
        } else {
          e = gama_s / gama_d - 1;
          if (e < -EPSILON) {
            throw new Error(
              `Cálculo resultou em índice de vazios negativo (${e.toFixed(4)}). Verifique γd (${gama_d}) e γs (${gama_s}).`
            );
          } else if (e < 0) {
            e = 0.0;
          }
        }
      }
    }

    if (n === undefined && e !== undefined) {
      if (Math.abs(1 + e) <= EPSILON) {
        throw new Error('Índice de Vazios (e) inválido');
      }
      n = e / (1 + e);
    }

    if (gs === undefined && gama_d !== undefined && e !== undefined) {
      if (Math.abs(gama_w) > EPSILON) {
        gs = (gama_d * (1 + e)) / gama_w;
        if (gs < 0) {
          throw new Error('Cálculo resultou em Gs negativo.');
        }
        if (gama_s === undefined) {
          gama_s = gs * gama_w;
        }
      }
    }

    // Compacidade Relativa (Dr)
    if (e !== undefined && emax !== undefined && emin !== undefined) {
      if (e < emin - EPSILON || e > emax + EPSILON) {
        classificacao_compacidade = 'Índice de vazios (e) fora da faixa [emin, emax]';
      } else {
        const denominador_dr = emax - emin;
        Dr = ((emax - e) / denominador_dr) * 100;
        Dr = Math.max(0, Math.min(Dr, 100));

        if (Dr <= 15) {
          classificacao_compacidade = 'Muito Fofa';
        } else if (Dr <= 35) {
          classificacao_compacidade = 'Fofa';
        } else if (Dr <= 65) {
          classificacao_compacidade = 'Média';
        } else if (Dr <= 85) {
          classificacao_compacidade = 'Compacta';
        } else {
          classificacao_compacidade = 'Muito Compacta';
        }
      }
    }

    // Relação Se=wGs
    if (S === undefined && w !== undefined && gs !== undefined && e !== undefined) {
      if (e <= EPSILON) {
        S = 0.0;
      } else {
        S = (w * gs) / e;
      }
      S = Math.max(0.0, Math.min(S, 1.0));
    } else if (w === undefined && S !== undefined && e !== undefined && gs !== undefined) {
      if (gs <= EPSILON) {
        w = S * e <= EPSILON ? 0.0 : Infinity;
      } else {
        w = (S * e) / gs;
      }
      if (w !== undefined && w < 0) {
        w = 0.0;
      }
    } else if (e === undefined && w !== undefined && gs !== undefined && S !== undefined) {
      if (S <= EPSILON) {
        if (w > EPSILON) {
          throw new Error('Saturação (S) não pode ser 0 se a umidade (w) for maior que 0.');
        }
      } else {
        e = (w * gs) / S;
        if (e < 0) {
          throw new Error('Cálculo resultou em índice de vazios negativo.');
        }
      }
    }

    if (n === undefined && e !== undefined) {
      if (Math.abs(1 + e) <= EPSILON) {
        throw new Error('Índice de Vazios (e) inválido');
      }
      n = e / (1 + e);
    }

    // Cálculo de γnat, γd, γsat, γsub
    if (gama_nat === undefined) {
      if (gama_d !== undefined && w !== undefined) {
        gama_nat = gama_d * (1 + w);
      } else if (gs !== undefined && e !== undefined && S !== undefined) {
        if (Math.abs(1 + e) <= EPSILON) {
          throw new Error('Índice de Vazios (e) inválido');
        }
        gama_nat = (gama_w * (gs + S * e)) / (1 + e);
      }
    }

    if (gama_d === undefined) {
      if (gama_nat !== undefined && w !== undefined) {
        if (Math.abs(1 + w) <= EPSILON) {
          throw new Error('Umidade (w) inválida');
        }
        gama_d = gama_nat / (1 + w);
      } else if (gs !== undefined && e !== undefined) {
        if (Math.abs(1 + e) <= EPSILON) {
          throw new Error('Índice de Vazios (e) inválido');
        }
        gama_d = (gs * gama_w) / (1 + e);
      }
    }

    if (gama_sat === undefined) {
      if (gs !== undefined && e !== undefined) {
        if (Math.abs(1 + e) <= EPSILON) {
          throw new Error('Índice de Vazios (e) inválido');
        }
        // γsat = γw * (Gs + e) / (1 + e)
        gama_sat = (gama_w * (gs + e)) / (1 + e);
      } else if (gama_d !== undefined && e !== undefined) {
        if (Math.abs(1 + e) <= EPSILON) {
          throw new Error('Índice de Vazios (e) inválido');
        }
        // γsat = γd + γw * e / (1 + e)
        gama_sat = gama_d + (gama_w * e) / (1 + e);
      }
    }

    if (gama_sub === undefined && gama_sat !== undefined) {
      gama_sub = gama_sat - gama_w;
      if (gama_sub < 0) gama_sub = 0.0;
    }

    // CÁLCULO DOS VOLUMES E MASSAS REAIS
    if (v_calc === undefined && mt_calc !== undefined && gama_nat !== undefined && gama_w > EPSILON) {
      const gama_nat_gcm3_calc = (gama_nat * gama_w_gcm3) / gama_w;
      if (gama_nat_gcm3_calc > EPSILON) {
        v_calc = mt_calc / gama_nat_gcm3_calc;
      }
    }

    if (ms_calc === undefined && mt_calc !== undefined && w !== undefined) {
      if (1 + w > EPSILON) {
        ms_calc = mt_calc / (1 + w);
        if (mw_calc === undefined) {
          mw_calc = mt_calc - ms_calc;
        }
      }
    } else if (mw_calc === undefined && mt_calc !== undefined && ms_calc !== undefined) {
      mw_calc = mt_calc - ms_calc;
    }

    // Calcular Vs
    if (vs_calc === undefined && ms_calc !== undefined && gs !== undefined && gama_w_gcm3 > EPSILON) {
      vs_calc = ms_calc / (gs * gama_w_gcm3);
    } else if (vs_calc === undefined && v_calc !== undefined && e !== undefined) {
      if (1 + e > EPSILON) {
        vs_calc = v_calc / (1 + e);
      }
    } else if (vs_calc === undefined && v_calc !== undefined && n !== undefined) {
      vs_calc = v_calc * (1 - n);
    }

    // Calcular Vv
    if (vv_calc === undefined && v_calc !== undefined && vs_calc !== undefined) {
      vv_calc = v_calc - vs_calc;
    } else if (vv_calc === undefined && vs_calc !== undefined && e !== undefined) {
      vv_calc = vs_calc * e;
    }

    // Calcular Vw
    if (vw_calc === undefined && mw_calc !== undefined && gama_w_gcm3 > EPSILON) {
      vw_calc = mw_calc / gama_w_gcm3;
    } else if (vw_calc === undefined && vv_calc !== undefined && S !== undefined) {
      vw_calc = vv_calc * S;
    }

    // Calcular Va
    if (va_calc === undefined && vv_calc !== undefined && vw_calc !== undefined) {
      va_calc = vv_calc - vw_calc;
    }

    // Recalcular V total
    if (v_calc === undefined && vs_calc !== undefined && vv_calc !== undefined) {
      v_calc = vs_calc + vv_calc;
    }

    // Recalcular M total
    if (mt_calc === undefined && ms_calc !== undefined && mw_calc !== undefined) {
      mt_calc = ms_calc + mw_calc;
    }

    // Verificações finais
    let aviso: string | undefined;
    if (
      mu_in !== undefined &&
      ms_in !== undefined &&
      v_in !== undefined &&
      gs === undefined &&
      e === undefined &&
      n === undefined &&
      S === undefined &&
      gama_s === undefined &&
      dados.indice_vazios === undefined
    ) {
      aviso =
        '⚠️ Cálculo parcial realizado. Com apenas massa úmida, massa seca e volume, ' +
        'é possível calcular: Umidade (w), Peso Específico Natural (γn) e Peso Específico Seco (γd). ' +
        'Para calcular TODOS os índices (e, n, Sr, Gs, γsat, γsub), é necessário fornecer ' +
        'a Densidade Relativa dos Grãos (Gs). Valores típicos: Areias=2.65, Argilas=2.70-2.75.';
    }

    const precisao_gama = 3;
    const precisao_indice = 4;
    const precisao_perc = 2;
    const precisao_vol = 3;
    const precisao_massa = 2;

    // Valores normalizados (Vs=1)
    const vol_s_norm = 1.0;
    let peso_s_norm: number | undefined;
    let vol_v_norm: number | undefined;
    let vol_w_norm: number | undefined;
    let peso_w_norm: number | undefined;
    let vol_a_norm: number | undefined;

    if (gs !== undefined) {
      peso_s_norm = Number((gs * gama_w_gcm3 * vol_s_norm).toFixed(2));
    }

    if (e !== undefined) {
      vol_v_norm = Number((e * vol_s_norm).toFixed(precisao_indice));
      if (S !== undefined) {
        vol_w_norm = Number((S * vol_v_norm).toFixed(precisao_indice));
        vol_a_norm = Number((vol_v_norm - vol_w_norm).toFixed(precisao_indice));
        if (vol_a_norm < 0) vol_a_norm = 0.0;
        if (vol_w_norm !== undefined) {
          peso_w_norm = Number((vol_w_norm * gama_w_gcm3).toFixed(2));
        }
      } else if (w !== undefined && peso_s_norm !== undefined) {
        peso_w_norm = Number((w * peso_s_norm).toFixed(2));
        if (gama_w_gcm3 > EPSILON) {
          vol_w_norm = Number((peso_w_norm / gama_w_gcm3).toFixed(precisao_indice));
          vol_a_norm = Number((vol_v_norm - vol_w_norm).toFixed(precisao_indice));
          if (vol_a_norm < 0) vol_a_norm = 0.0;
        }
      }
    }

    return {
      peso_especifico_natural: gama_nat !== undefined ? Number(gama_nat.toFixed(precisao_gama)) : undefined,
      peso_especifico_seco: gama_d !== undefined ? Number(gama_d.toFixed(precisao_gama)) : undefined,
      peso_especifico_saturado: gama_sat !== undefined ? Number(gama_sat.toFixed(precisao_gama)) : undefined,
      peso_especifico_submerso: gama_sub !== undefined ? Number(gama_sub.toFixed(precisao_gama)) : undefined,
      peso_especifico_solidos: gama_s !== undefined ? Number(gama_s.toFixed(precisao_gama)) : undefined,
      Gs: gs !== undefined ? Number(gs.toFixed(precisao_indice)) : undefined,
      indice_vazios: e !== undefined ? Number(e.toFixed(precisao_indice)) : undefined,
      porosidade: n !== undefined ? Number((n * 100).toFixed(precisao_perc)) : undefined,
      grau_saturacao: S !== undefined ? Number((S * 100).toFixed(precisao_perc)) : undefined,
      umidade: w !== undefined ? Number((w * 100).toFixed(precisao_perc)) : undefined,
      volume_solidos_norm: vol_s_norm,
      volume_agua_norm: vol_w_norm,
      volume_ar_norm: vol_a_norm,
      peso_solidos_norm: peso_s_norm,
      peso_agua_norm: peso_w_norm,
      compacidade_relativa: Dr !== undefined ? Number(Dr.toFixed(precisao_perc)) : undefined,
      classificacao_compacidade,
      volume_total_calc: v_calc !== undefined ? Number(v_calc.toFixed(precisao_vol)) : undefined,
      volume_solidos_calc: vs_calc !== undefined ? Number(vs_calc.toFixed(precisao_vol)) : undefined,
      volume_agua_calc: vw_calc !== undefined ? Number(vw_calc.toFixed(precisao_vol)) : undefined,
      volume_ar_calc: va_calc !== undefined ? Number(va_calc.toFixed(precisao_vol)) : undefined,
      massa_total_calc: mt_calc !== undefined ? Number(mt_calc.toFixed(precisao_massa)) : undefined,
      massa_solidos_calc: ms_calc !== undefined ? Number(ms_calc.toFixed(precisao_massa)) : undefined,
      massa_agua_calc: mw_calc !== undefined ? Number(mw_calc.toFixed(precisao_massa)) : undefined,
      aviso,
    };
  } catch (error) {
    return {
      erro: error instanceof Error ? error.message : 'Erro interno no cálculo',
    };
  }
}

