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
} from './schemas';

const EPSILON = 1e-4; // Precisão para comparações de profundidade

export function calcularTensoesGeostaticas(
  dados: TensoesGeostaticasInput
): TensoesGeostaticasOutput {
  try {
    if (!dados.camadas || dados.camadas.length === 0) {
      throw new Error('A lista de camadas não pode estar vazia.');
    }

    const pontos_calculo: TensaoPonto[] = [];
    const gama_w = dados.peso_especifico_agua;

    // Função auxiliar para encontrar o NA e Altura Capilar aplicáveis a uma determinada camada
    // Baseado na lógica de herança (aquíferos suspensos vs global)
    const getHidrologiaCamada = (index: number) => {
      const camada = dados.camadas[index];

      // 1. Se a camada define explicitamente, usa ela
      if (camada.profundidade_na_camada !== undefined) {
        return {
          na: camada.profundidade_na_camada,
          hc: camada.altura_capilar_camada ?? 0.0
        };
      }

      // 2. Se a camada é impermeável (e não definiu NA), ela bloqueia a hidrologia de cima
      // Para fins de poro-pressão, ela "corta" a coluna d'água vinda de baixo? 
      // Ou vinda de cima?
      // Se impermeável, u=0 (ou indefinido/irrelevante) a menos que tenha seu próprio NA.
      if (camada.impermeavel) {
        return { na: undefined, hc: 0.0 };
      }

      // 3. Procura nas camadas acima (aquífero superior comunicante)
      // Imagina-se que a camada atual é permeável e está conectada hidraulicamente às de cima
      for (let j = index - 1; j >= 0; j--) {
        const camada_j = dados.camadas[j];
        if (camada_j.impermeavel) {
          // Bloqueio encontrado (aquiclude acima)
          return { na: undefined, hc: 0.0 };
        }
        if (camada_j.profundidade_na_camada !== undefined) {
          // Encontrou um NA definido num aquífero acima conectado
          return {
            na: camada_j.profundidade_na_camada,
            hc: camada_j.altura_capilar_camada ?? 0.0
          };
        }
      }

      // 4. Se não achou barreiras impermeáveis acima, tenta o NA global
      // Verifica se existe alguma camada impermeável acima cortando a conexão com a superfície/global
      const tem_impermeavel_acima = dados.camadas.slice(0, index).some(c => c.impermeavel);

      const profundidade_total = dados.camadas.reduce((acc, c) => acc + c.espessura, 0);
      const na_global_valido =
        dados.profundidade_na !== undefined &&
        dados.profundidade_na <= profundidade_total * 1.5; // Validação frouxa para permitir NAs profundos ou superficiais

      if (!tem_impermeavel_acima && na_global_valido && dados.profundidade_na !== undefined) {
        return {
          na: dados.profundidade_na,
          hc: dados.altura_capilar
        };
      }

      return { na: undefined, hc: 0.0 };
    };

    let profundidade_acumulada = 0.0;
    let tensao_total_acumulada = 0.0;

    // Adiciona ponto inicial (superfície)
    const hidro_surf = getHidrologiaCamada(0);
    let u_surf = 0.0;
    if (hidro_surf.na !== undefined) {
      const dist_surf = 0.0 - hidro_surf.na; // Profundidade 0 - NA
      // Se NA=2, dist = -2. Se NA=-1 (enchente?), dist = 1.

      if (dist_surf >= 0) {
        u_surf = dist_surf * gama_w; // NA acima da superfície (enchente)
      } else if (Math.abs(dist_surf) <= hidro_surf.hc + EPSILON) {
        u_surf = dist_surf * gama_w; // Sucção Capilar
      }
    }

    pontos_calculo.push({
      profundidade: 0.0,
      tensao_total_vertical: 0.0,
      pressao_neutra: Number(u_surf.toFixed(4)),
      tensao_efetiva_vertical: Number((0.0 - u_surf).toFixed(4)),
      tensao_efetiva_horizontal:
        dados.camadas[0].Ko !== undefined
          ? Number(((0.0 - u_surf) * dados.camadas[0].Ko).toFixed(4))
          : undefined
    });


    // Loop pelas camadas
    for (let i = 0; i < dados.camadas.length; i++) {
      const camada = dados.camadas[i];
      const z_topo = profundidade_acumulada;
      const z_base = profundidade_acumulada + camada.espessura;

      const { na, hc } = getHidrologiaCamada(i);

      // Definir pontos de interesse dentro desta camada
      const depths = new Set<number>();
      depths.add(z_topo);
      depths.add(z_base);

      if (na !== undefined) {
        // Adiciona NA se estiver dentro da camada (com tolerância)
        // Se NA == z_topo, já está lá. Se NA == z_base, já está lá.
        if (na >= z_topo - EPSILON && na <= z_base + EPSILON) {
          // Ajustar para os limites exatos se estiver muito perto
          const val = Math.abs(na - z_topo) < EPSILON ? z_topo : (Math.abs(na - z_base) < EPSILON ? z_base : na);
          depths.add(val);
        }

        // Adiciona Topo Capilar se estiver dentro
        const cap_topo = na - hc;
        if (cap_topo >= z_topo - EPSILON && cap_topo <= z_base + EPSILON) {
          const val = Math.abs(cap_topo - z_topo) < EPSILON ? z_topo : (Math.abs(cap_topo - z_base) < EPSILON ? z_base : cap_topo);
          depths.add(val);
        }
      }

      // Ordenar pontos para criar segmentos
      const sortedDepths = Array.from(depths).sort((a, b) => a - b);

      // Iterar pelos segmentos da camada
      for (let j = 0; j < sortedDepths.length - 1; j++) {
        const d_start = sortedDepths[j];
        const d_end = sortedDepths[j + 1];

        if (Math.abs(d_end - d_start) < EPSILON) continue; // Segmento nulo

        const dz = d_end - d_start;
        const d_mid = (d_start + d_end) / 2;

        // Determinar estado no meio do segmento
        let gama_segmento: number | undefined;
        let is_saturated_zone = false;

        if (na !== undefined) {
          if (d_mid >= na) {
            is_saturated_zone = true; // Abaixo do NA
          } else if (d_mid >= (na - hc)) {
            is_saturated_zone = true; // Zona capilar (saturada)
          }
        }

        if (is_saturated_zone) {
          gama_segmento = camada.gama_sat ?? camada.gama_nat;
          if (gama_segmento === undefined) {
            throw new Error(`Peso específico saturado (γsat) (ou natural) não definido para camada ${i + 1} em zona saturada.`);
          }
        } else {
          gama_segmento = camada.gama_nat ?? camada.gama_sat;
          if (gama_segmento === undefined) {
            throw new Error(`Peso específico natural (γnat) (ou saturado) não definido para camada ${i + 1} em zona não saturada.`);
          }
        }

        // Acumular Tensão Total
        tensao_total_acumulada += gama_segmento * dz;

        // Calcular Pressão Neutra no final do segmento
        let u_end = 0.0;
        if (na !== undefined) {
          const dist = d_end - na;
          if (dist >= 0) {
            u_end = dist * gama_w; // Hidrostática positiva
          } else if (Math.abs(dist) <= hc + EPSILON) {
            u_end = dist * gama_w; // Sucção capilar
          } else {
            u_end = 0.0;
          }
        }

        // Calcular Efetiva
        let sigma_eff_v = tensao_total_acumulada - u_end;

        // Correção de sanidade para evitar valores negativos microscópicos ou -0
        if (sigma_eff_v < 0 && Math.abs(sigma_eff_v) < 1e-3) sigma_eff_v = 0.0;

        const sigma_eff_h = camada.Ko !== undefined ? sigma_eff_v * camada.Ko : undefined;

        pontos_calculo.push({
          profundidade: Number(d_end.toFixed(4)),
          tensao_total_vertical: Number(tensao_total_acumulada.toFixed(4)),
          pressao_neutra: Number(u_end.toFixed(4)),
          tensao_efetiva_vertical: Number(sigma_eff_v.toFixed(4)),
          tensao_efetiva_horizontal: sigma_eff_h !== undefined ? Number(sigma_eff_h.toFixed(4)) : undefined
        });
      }

      profundidade_acumulada = z_base;
    }

    // Remover duplicatas exatas de profundidade
    const pontos_unicos: TensaoPonto[] = [];
    const profs_vistas = new Set<string>();

    for (const p of pontos_calculo) {
      // Usa string com 4 casas para chave única
      const k = p.profundidade.toFixed(4);
      if (!profs_vistas.has(k)) {
        profs_vistas.add(k);
        pontos_unicos.push(p);
      } else {
        // Se já existe, atualiza com o valor mais recente (geralmente mais preciso ou acumulado corretamente nos loops)
        // No nosso loop, o último valor para uma profundidade é o "final" daquele segmento.
        // Mas se tivermos segmentos adjacentes, o "Start" do próximo é igual ao "End" do anterior.
        // Nossos loops só dão push no "End".
        // Então duplicações só ocorrem se houver sobreposição estranha ou pontos artificiais.
        // O algoritmo de POIs evita overlaps.
        // MAS, se tivermos camada de espessura 0 ou algo assim?
        // Melhor garantir. Vamos substituir o anterior se for exatamente igual? 
        // Não, o primeiro push (do loop anterior) é o correto.
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
