/**
 * Motor de Cálculo — Tensões Geostáticas
 * modulos/tensoes-geostaticas/calculos.ts
 *
 * Funções puras para cálculo de tensões totais, efetivas e pressões neutras
 * em perfis de solo estratificados. Suporta múltiplos NAs, camadas impermeáveis,
 * aquíferos suspensos, franja capilar com sucção e sobrecarga superficial.
 * Zero dependências de UI ou store.
 */
import {
  TensoesGeostaticasInput,
  TensoesGeostaticasOutput,
  TensaoPonto,
  CamadaSolo
} from "./types";

const EPSILON = 1e-4;

/**
 * Retorna as configurações hidrológicas (NA e Capilaridade) válidas para a camada no índice `index`
 * baseado nas regras de camadas superiores e aquíferos suspensos.
 */
function resolverHidrologiaPontoMedio(
  index: number,
  camadas: CamadaSolo[],
  configGlobal: TensoesGeostaticasInput["configuracoes"]
): { na: number | undefined; hc: number } {
  const camada = camadas[index];

  // Regra 1: Definição explícita na própria camada (aquífero suspenso)
  if (camada.profundidadeNA != null) {
    return {
      na: camada.profundidadeNA,
      hc: camada.capilaridade ?? 0.0,
    };
  }

  // Regra 2: Se for impermeável e não definiu NA, corta conexão
  if (camada.impermeavel) {
    return { na: undefined, hc: 0.0 };
  }

  // Regra 3: Procurar em camadas superiores conectadas (sem barreiras)
  for (let j = index - 1; j >= 0; j--) {
    const camadaSuperior = camadas[j];

    // Se uma camada superior é impermeável, ela bloqueia a conexão com NAs mais rasos/superfície
    if (camadaSuperior.impermeavel) {
      return { na: undefined, hc: 0.0 };
    }

    // Achou um NA suspenso numa camada acima que comunica com a atual
    if (camadaSuperior.profundidadeNA != null) {
      return {
        na: camadaSuperior.profundidadeNA,
        hc: camadaSuperior.capilaridade ?? 0.0,
      };
    }
  }

  // Regra 4: Se chegamos até a superfície sem barreira impermeável, podemos usar o NA global (se existir)
  // Nota: o NA global no layout atual ainda depende de qual camada ele interceptará, 
  // mas vamos tratar o "na global" como ausente do config para este layout se não estiver no state novo.
  // Vamos adaptar: no novo formato, o NA é ditado ou globalmente? Não, o módulo atual dita nas camadas.
  // Mas no config global nós adicionamos apenas Peso Especifico, não NA global. 
  // O NA foi passado para a camada. Então isso cobre a lógica.
  return { na: undefined, hc: 0.0 };
}

export function calcularTensoesGeostaticas(dados: TensoesGeostaticasInput): TensoesGeostaticasOutput {
  try {
    const { camadas, configuracoes } = dados;
    const { pesoEspecificoAgua: gamaW, sobrecargaSuperficial: q0, intervaloDiscretizacao } = configuracoes;
    const avisos: string[] = [];
    const pontosCalculo: TensaoPonto[] = [];

    if (!camadas || camadas.length === 0) {
      throw new Error("A lista de camadas não pode estar vazia.");
    }

    // Validações com avisos
    camadas.forEach((c, idx) => {
      if (c.gamaNat && c.gamaSat && c.gamaNat > c.gamaSat) {
        avisos.push(`Camada ${idx + 1}: O peso específico natural (${c.gamaNat}) é maior que o saturado (${c.gamaSat}). Físicamente implausível.`);
      }
      if (c.Ko != null && c.Ko > 1.0) {
        avisos.push(`Camada ${idx + 1}: Ko > 1 indica solo intensamente pré-adensado. Verifique o valor.`);
      }
    });

    let profundidadeAcumulada = 0.0;
    let tensaoTotalAcumulada = q0 ?? 0.0; // Sobrecarga inicial (σv = q0 em z=0)

    // --- Loop pelas Camadas ---
    for (let i = 0; i < camadas.length; i++) {
      const camada = camadas[i];
      const zTopo = profundidadeAcumulada;
      const zBase = profundidadeAcumulada + camada.espessura;

      const { na, hc } = resolverHidrologiaPontoMedio(i, camadas, configuracoes);

      // Pontos Críticos Fixos
      const pCriticos = new Set<number>();
      pCriticos.add(zTopo);
      pCriticos.add(zBase);

      if (na !== undefined) {
        if (na >= zTopo - EPSILON && na <= zBase + EPSILON) {
          pCriticos.add(Math.max(zTopo, Math.min(zBase, na)));
        }
        const capTopo = na - hc;
        if (capTopo >= zTopo - EPSILON && capTopo <= zBase + EPSILON) {
          pCriticos.add(Math.max(zTopo, Math.min(zBase, capTopo)));
        }
      }

      // Adicionar Pontos de Discretização Opcional se configurado
      if (intervaloDiscretizacao) {
        let currentDisc = zTopo + intervaloDiscretizacao;
        while (currentDisc < zBase - EPSILON) {
          pCriticos.add(currentDisc);
          currentDisc += intervaloDiscretizacao;
        }
      }

      // Ordenar e criar segmentos
      const profundidadesOrdenadas = Array.from(pCriticos).sort((a, b) => a - b);

      for (let j = 0; j < profundidadesOrdenadas.length - 1; j++) {
        const dStart = profundidadesOrdenadas[j];
        const dEnd = profundidadesOrdenadas[j + 1];

        if (Math.abs(dEnd - dStart) < EPSILON) continue; // segmento minúsculo

        const dz = dEnd - dStart;
        const dMid = (dStart + dEnd) / 2;

        // Determina o estado FÍSICO deste segmento específico
        let isSaturated = false;
        let inCapillaryFringe = false;
        if (na !== undefined) {
          if (dMid >= na - EPSILON) {
            isSaturated = true; // Submerso
          } else if (dMid >= (na - hc) - EPSILON) {
            isSaturated = true; // Franja capilar
            inCapillaryFringe = true;
          }
        }

        const gamaSegmento = isSaturated
          ? (camada.gamaSat ?? camada.gamaNat)
          : (camada.gamaNat ?? camada.gamaSat);

        if (gamaSegmento == null) {
          throw new Error(`Peso específico ausente na Camada ${i + 1} (${isSaturated ? 'Saturado' : 'Natural'})`);
        }

        const gamaSubmerso = isSaturated ? (gamaSegmento - gamaW) : undefined;

        // Função de cálculo de u amarrada à regra Deste segmento
        const calcularU = (z: number) => {
          if (na === undefined) return 0.0;
          const dist = z - na;
          if (dist >= 0) return dist * gamaW; // Submerso / Abaixo do NA
          if (inCapillaryFringe) return dist * gamaW; // Sucção capilar (dist é negativo aqui)
          return 0.0; // Solo seco/úmido
        };

        // ========================================================
        // 1. CÁLCULO NO TOPO DO SEGMENTO (Cota z+)
        // ========================================================
        const uStart = calcularU(dStart);
        let effVStart = tensaoTotalAcumulada - uStart;
        if (effVStart < 0 && Math.abs(effVStart) < 1e-3) effVStart = 0.0;
        const effHStart = camada.Ko != null ? effVStart * camada.Ko : undefined;
        const totHStart = effHStart != null ? effHStart + uStart : undefined;

        pontosCalculo.push({
          profundidade: Number(dStart.toFixed(4)),
          camadaIndex: i,
          tensaoTotalVertical: Number(tensaoTotalAcumulada.toFixed(4)),
          pressaoNeutra: Number(uStart.toFixed(4)),
          tensaoEfetivaVertical: Number(effVStart.toFixed(4)),
          tensaoEfetivaHorizontal: effHStart != null ? Number(effHStart.toFixed(4)) : undefined,
          tensaoTotalHorizontal: totHStart != null ? Number(totHStart.toFixed(4)) : undefined,
          pesoEspecificoUsado: gamaSegmento,
          pesoEspecificoSubmerso: gamaSubmerso != null ? Number(gamaSubmerso.toFixed(4)) : undefined
        });

        // ========================================================
        // 2. CÁLCULO NA BASE DO SEGMENTO (Cota z-)
        // ========================================================
        tensaoTotalAcumulada += (gamaSegmento * dz); // Adiciona o peso deste sub-estrato

        const uEnd = calcularU(dEnd);
        let effVEnd = tensaoTotalAcumulada - uEnd;
        if (effVEnd < 0 && Math.abs(effVEnd) < 1e-3) effVEnd = 0.0;
        const effHEnd = camada.Ko != null ? effVEnd * camada.Ko : undefined;
        const totHEnd = effHEnd != null ? effHEnd + uEnd : undefined;

        pontosCalculo.push({
          profundidade: Number(dEnd.toFixed(4)),
          camadaIndex: i,
          tensaoTotalVertical: Number(tensaoTotalAcumulada.toFixed(4)),
          pressaoNeutra: Number(uEnd.toFixed(4)),
          tensaoEfetivaVertical: Number(effVEnd.toFixed(4)),
          tensaoEfetivaHorizontal: effHEnd != null ? Number(effHEnd.toFixed(4)) : undefined,
          tensaoTotalHorizontal: totHEnd != null ? Number(totHEnd.toFixed(4)) : undefined,
          pesoEspecificoUsado: gamaSegmento,
          pesoEspecificoSubmerso: gamaSubmerso != null ? Number(gamaSubmerso.toFixed(4)) : undefined
        });
      }

      profundidadeAcumulada = zBase;
    }

    // ========================================================
    // 3. FILTRO FINAL INTELIGENTE (Preserva Descontinuidades)
    // ========================================================
    const pontosUnicos = pontosCalculo.reduce((acc, curr) => {
      if (acc.length === 0) return [curr];
      const prev = acc[acc.length - 1];

      // Checa se as cotas são iguais
      const sameDepth = Math.abs(curr.profundidade - prev.profundidade) < EPSILON;

      // Checa se as tensões principais que podem sofrer salto são iguais
      const sameU = Math.abs(curr.pressaoNeutra - prev.pressaoNeutra) < EPSILON;
      const sameEffV = Math.abs(curr.tensaoEfetivaVertical - prev.tensaoEfetivaVertical) < EPSILON;

      const totHCurr = curr.tensaoTotalHorizontal ?? 0;
      const totHPrev = prev.tensaoTotalHorizontal ?? 0;
      const sameTotH = Math.abs(totHCurr - totHPrev) < EPSILON;

      if (sameDepth) {
        // Se for a mesma profundidade, mas a pressão ou a tensão horizontal for diferente, 
        // significa que estamos em uma fronteira (z- e z+). MANTEMOS ambos!
        if (!sameU || !sameEffV || !sameTotH) {
          acc.push(curr);
        }
        // Se as tensões forem idênticas (ex: nó de discretização contínua), ignoramos e não fazemos o push do curr.
      } else {
        // Profundidade diferente, fluxo normal
        acc.push(curr);
      }
      return acc;
    }, [] as TensaoPonto[]);

    return { pontosCalculo: pontosUnicos, avisos };

  } catch (err: any) {
    return {
      pontosCalculo: [],
      avisos: [],
      erro: err.message || "Erro desconhecido durante o cálculo."
    };
  }
}
