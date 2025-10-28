/**
 * Módulo para Cálculo de Tensões Geostáticas
 * Calcula tensões totais, pressões neutras e tensões efetivas em perfis de solo
 * 
 * Referências:
 * - Mecânica dos Solos - Tensões no Solo
 */

import type {
  TensoesGeostaticasInput,
  TensoesGeostaticasOutput,
  TensaoPonto,
  CamadaSolo,
} from '../schemas';

const EPSILON = 1e-9;

export function calcularTensoesGeostaticas(
  dados: TensoesGeostaticasInput
): TensoesGeostaticasOutput {
  const pontos_calculo: TensaoPonto[] = [];
  let profundidade_atual = 0.0;
  let tensao_total_atual = 0.0;
  const gama_w = dados.peso_especifico_agua;

  try {
    if (!dados.camadas || dados.camadas.length === 0) {
      throw new Error('A lista de camadas não pode estar vazia.');
    }

    // Constrói lista de NAs por camada
    const nas_camadas = dados.camadas.map((c) => c.profundidade_na_camada ?? null);

    const tem_na_especifico = nas_camadas.some((na) => na !== null);

    const profundidade_total = dados.camadas.reduce((sum, c) => sum + c.espessura, 0);
    const na_global_valido =
      dados.profundidade_na !== undefined &&
      dados.profundidade_na >= 0 &&
      dados.profundidade_na <= profundidade_total * 1.5;

    // Ponto inicial na superfície
    let u_inicial = 0.0;
    if (dados.profundidade_na !== undefined && dados.profundidade_na <= 0 && dados.altura_capilar > 0) {
      u_inicial = -dados.altura_capilar * gama_w;
    }

    const sigma_ef_v_inicial = 0.0 - u_inicial;
    const sigma_ef_h_inicial =
      dados.camadas[0].Ko !== undefined ? sigma_ef_v_inicial * dados.camadas[0].Ko : undefined;

    pontos_calculo.push({
      profundidade: 0.0,
      tensao_total_vertical: 0.0,
      pressao_neutra: u_inicial,
      tensao_efetiva_vertical: sigma_ef_v_inicial,
      tensao_efetiva_horizontal: sigma_ef_h_inicial,
    });

    for (let i = 0; i < dados.camadas.length; i++) {
      const camada = dados.camadas[i];
      const profundidade_base_camada = profundidade_atual + camada.espessura;
      const z_topo = profundidade_atual;
      const z_base = profundidade_base_camada;

      // Adicionar ponto no NA específico da camada
      if (camada.profundidade_na_camada !== undefined) {
        const na_camada_val = camada.profundidade_na_camada;
        if (z_topo <= na_camada_val && na_camada_val <= z_base) {
          const espessura_ate_na = na_camada_val - z_topo;
          const gama_ate_na = camada.gama_nat ?? camada.gama_sat;

          if (gama_ate_na !== undefined) {
            const sigma_v_na_camada = tensao_total_atual + gama_ate_na * espessura_ate_na;
            const u_na_camada = 0.0;
            const sigma_ef_v_na_camada = sigma_v_na_camada - u_na_camada;
            const sigma_ef_h_na_camada =
              camada.Ko !== undefined ? sigma_ef_v_na_camada * camada.Ko : undefined;

            if (!pontos_calculo.some((p) => Math.abs(p.profundidade - na_camada_val) < 0.01)) {
              pontos_calculo.push({
                profundidade: Number(na_camada_val.toFixed(4)),
                tensao_total_vertical: Number(sigma_v_na_camada.toFixed(4)),
                pressao_neutra: Number(u_na_camada.toFixed(4)),
                tensao_efetiva_vertical: Number(sigma_ef_v_na_camada.toFixed(4)),
                tensao_efetiva_horizontal:
                  sigma_ef_h_na_camada !== undefined ? Number(sigma_ef_h_na_camada.toFixed(4)) : undefined,
              });
            }
          }
        }
      }

      // Adicionar ponto no início da capilaridade
      const altura_cap_usar = camada.altura_capilar_camada ?? dados.altura_capilar;
      const na_usar = camada.profundidade_na_camada ?? dados.profundidade_na;

      let prof_inicio_capilaridade_camada: number | undefined;
      if (na_usar !== undefined && altura_cap_usar > 0) {
        prof_inicio_capilaridade_camada = Math.max(0, na_usar - altura_cap_usar);
      }

      if (prof_inicio_capilaridade_camada !== undefined && prof_inicio_capilaridade_camada > 0) {
        if (z_topo < prof_inicio_capilaridade_camada && prof_inicio_capilaridade_camada <= z_base) {
          const espessura_ate_capilar = prof_inicio_capilaridade_camada - z_topo;
          const gama_ate_capilar = camada.gama_nat ?? camada.gama_sat;

          if (gama_ate_capilar !== undefined) {
            const sigma_v_capilar = tensao_total_atual + gama_ate_capilar * espessura_ate_capilar;
            const u_capilar = -altura_cap_usar * gama_w;
            const sigma_ef_v_capilar = sigma_v_capilar - u_capilar;
            const sigma_ef_h_capilar =
              camada.Ko !== undefined ? sigma_ef_v_capilar * camada.Ko : undefined;

            if (!pontos_calculo.some((p) => Math.abs(p.profundidade - prof_inicio_capilaridade_camada!) < 0.01)) {
              pontos_calculo.push({
                profundidade: Number(prof_inicio_capilaridade_camada.toFixed(4)),
                tensao_total_vertical: Number(sigma_v_capilar.toFixed(4)),
                pressao_neutra: Number(u_capilar.toFixed(4)),
                tensao_efetiva_vertical: Number(sigma_ef_v_capilar.toFixed(4)),
                tensao_efetiva_horizontal:
                  sigma_ef_h_capilar !== undefined ? Number(sigma_ef_h_capilar.toFixed(4)) : undefined,
              });
            }
          }
        }
      }

      // Calcular tensão total na base da camada
      let na_para_tensao: number | undefined;
      if (camada.profundidade_na_camada !== undefined) {
        na_para_tensao = camada.profundidade_na_camada;
      } else if (dados.profundidade_na !== undefined) {
        na_para_tensao = dados.profundidade_na;
      }

      if (na_para_tensao === undefined) {
        const gama_camada = camada.gama_nat ?? camada.gama_sat;
        if (gama_camada === undefined) {
          throw new Error(
            `Peso específico (γnat ou γsat) não definido para a camada ${i + 1}. Defina pelo menos um deles.`
          );
        }
        tensao_total_atual += gama_camada * camada.espessura;
      } else if (z_base <= na_para_tensao) {
        // Camada inteira acima do NA
        const gama_camada = camada.gama_nat;
        if (gama_camada === undefined) {
          throw new Error(
            `Peso específico natural (γnat) não definido para a camada ${i + 1} que está acima do NA.`
          );
        }
        tensao_total_atual += gama_camada * camada.espessura;
      } else if (z_topo >= na_para_tensao) {
        // Camada inteira abaixo do NA
        const gama_camada = camada.gama_sat;
        if (gama_camada === undefined) {
          throw new Error(
            `Peso específico saturado (γsat) não definido para a camada ${i + 1} que está abaixo do NA.`
          );
        }
        tensao_total_atual += gama_camada * camada.espessura;
      } else {
        // Camada atravessada pelo NA
        const espessura_acima_na = na_para_tensao - z_topo;
        const espessura_abaixo_na = z_base - na_para_tensao;

        const gama_nat_camada = camada.gama_nat;
        const gama_sat_camada = camada.gama_sat;

        if (gama_nat_camada === undefined) {
          throw new Error(
            `Peso específico natural (γnat) não definido para a camada ${i + 1} que é atravessada pelo NA.`
          );
        }
        if (gama_sat_camada === undefined) {
          throw new Error(
            `Peso específico saturado (γsat) não definido para a camada ${i + 1} que é atravessada pelo NA.`
          );
        }

        const tensao_total_na_interface = tensao_total_atual + gama_nat_camada * espessura_acima_na;

        // Ponto no NA
        const u_no_na = 0.0;
        const sigma_v_no_na = tensao_total_na_interface;
        const sigma_ef_v_no_na = sigma_v_no_na - u_no_na;
        const sigma_ef_h_no_na = camada.Ko !== undefined ? sigma_ef_v_no_na * camada.Ko : undefined;

        if (!pontos_calculo.some((p) => Math.abs(p.profundidade - na_para_tensao) < EPSILON)) {
          pontos_calculo.push({
            profundidade: na_para_tensao,
            tensao_total_vertical: Number(sigma_v_no_na.toFixed(4)),
            pressao_neutra: Number(u_no_na.toFixed(4)),
            tensao_efetiva_vertical: Number(sigma_ef_v_no_na.toFixed(4)),
            tensao_efetiva_horizontal:
              sigma_ef_h_no_na !== undefined ? Number(sigma_ef_h_no_na.toFixed(4)) : undefined,
          });
        }

        tensao_total_atual = tensao_total_na_interface + gama_sat_camada * espessura_abaixo_na;
      }

      // Calcular pressão neutra e tensão efetiva na base da camada
      let na_relevante: number | undefined;
      let altura_capilar_relevante = 0.0;

      if (camada.impermeavel && camada.profundidade_na_camada === undefined) {
        na_relevante = undefined;
      } else if (camada.profundidade_na_camada !== undefined) {
        na_relevante = camada.profundidade_na_camada;
        altura_capilar_relevante = camada.altura_capilar_camada ?? 0.0;
      } else if (!tem_na_especifico && na_global_valido && dados.profundidade_na !== undefined) {
        na_relevante = dados.profundidade_na;
        altura_capilar_relevante = dados.altura_capilar;
      } else {
        let na_candidato: number | undefined;
        let altura_cap_candidato = 0.0;

        for (let j = i - 1; j >= 0; j--) {
          const camada_j = dados.camadas[j];
          if (camada_j.impermeavel) break;

          if (camada_j.profundidade_na_camada !== undefined) {
            na_candidato = camada_j.profundidade_na_camada;
            altura_cap_candidato = camada_j.altura_capilar_camada ?? 0.0;
            break;
          }
        }

        if (na_candidato === undefined && na_global_valido && dados.profundidade_na !== undefined) {
          const tem_impermeavel = dados.camadas.slice(0, i).some((c) => c.impermeavel);
          if (!tem_impermeavel) {
            na_candidato = dados.profundidade_na;
            altura_cap_candidato = dados.altura_capilar;
          }
        }

        na_relevante = na_candidato;
        altura_capilar_relevante = altura_cap_candidato;
      }

      let pressao_neutra = 0.0;
      if (na_relevante !== undefined) {
        const distancia_vertical_na = z_base - na_relevante;

        if (distancia_vertical_na >= 0) {
          pressao_neutra = distancia_vertical_na * gama_w;
        } else if (Math.abs(distancia_vertical_na) <= altura_capilar_relevante) {
          pressao_neutra = distancia_vertical_na * gama_w;
        } else {
          pressao_neutra = 0.0;
        }
      }

      let tensao_efetiva_vertical = tensao_total_atual - pressao_neutra;
      if (tensao_efetiva_vertical < -1e-9) {
        tensao_efetiva_vertical = 0.0;
      }

      const tensao_efetiva_horizontal =
        camada.Ko !== undefined ? tensao_efetiva_vertical * camada.Ko : undefined;

      pontos_calculo.push({
        profundidade: Number(profundidade_base_camada.toFixed(4)),
        tensao_total_vertical: Number(tensao_total_atual.toFixed(4)),
        pressao_neutra: Number(pressao_neutra.toFixed(4)),
        tensao_efetiva_vertical: Number(tensao_efetiva_vertical.toFixed(4)),
        tensao_efetiva_horizontal:
          tensao_efetiva_horizontal !== undefined ? Number(tensao_efetiva_horizontal.toFixed(4)) : undefined,
      });

      profundidade_atual = profundidade_base_camada;
    }

    // Ordenar e remover duplicados
    pontos_calculo.sort((a, b) => a.profundidade - b.profundidade);

    const pontos_unicos: TensaoPonto[] = [];
    const profundidades_vistas = new Set<number>();

    for (const ponto of pontos_calculo) {
      const prof_rounded = Number(ponto.profundidade.toFixed(4));
      if (!profundidades_vistas.has(prof_rounded)) {
        pontos_unicos.push(ponto);
        profundidades_vistas.add(prof_rounded);
      }
    }

    return { pontos_calculo: pontos_unicos };
  } catch (error) {
    return {
      pontos_calculo: [],
      erro: error instanceof Error ? error.message : 'Erro interno no cálculo',
    };
  }
}

