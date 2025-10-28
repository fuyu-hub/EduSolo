// Utilitários para Tensões Geostáticas

export interface CamadaTensoes {
  id: string;
  nome: string;
  espessura: string;
  profundidadeNA: string;
  capilaridade: string;
  gamaNat: string;
  gamaSat: string;
  Ko: string;
  impermeavel?: boolean;
}

/**
 * Calcula a profundidade acumulada de cada camada
 */
export function calcularProfundidades(camadas: CamadaTensoes[]): { 
  profundidadeTopo: number; 
  profundidadeBase: number; 
  index: number;
}[] {
  let profundidadeAcumulada = 0;
  
  return camadas.map((camada, index) => {
    const espessura = parseFloat(camada.espessura) || 0;
    const profundidadeTopo = profundidadeAcumulada;
    const profundidadeBase = profundidadeAcumulada + espessura;
    profundidadeAcumulada = profundidadeBase;
    
    return { profundidadeTopo, profundidadeBase, index };
  });
}

/**
 * Encontra a camada que contém uma determinada profundidade
 */
export function encontrarCamadaPorProfundidade(
  profundidade: number,
  camadas: CamadaTensoes[]
): { index: number; camada: CamadaTensoes } | null {
  const profundidades = calcularProfundidades(camadas);
  
  for (let i = 0; i < profundidades.length; i++) {
    const { profundidadeTopo, profundidadeBase } = profundidades[i];
    
    // O NA está dentro desta camada (inclusive no topo e na base)
    if (profundidade >= profundidadeTopo && profundidade <= profundidadeBase) {
      return { index: i, camada: camadas[i] };
    }
  }
  
  return null;
}

/**
 * Valida se é possível inserir um NA em uma determinada camada
 */
export function validarInsercaoNA(
  indexCamada: number,
  profundidadeNA: number,
  camadas: CamadaTensoes[]
): { valido: boolean; erro?: string } {
  const camada = camadas[indexCamada];
  
  if (!camada) {
    return { valido: false, erro: "Camada não encontrada" };
  }
  
  // Verifica se a camada é impermeável
  if (camada.impermeavel) {
    return { 
      valido: false, 
      erro: "Não é possível inserir nível de água em camada impermeável" 
    };
  }
  
  // Verifica se o NA está dentro da camada
  const profundidades = calcularProfundidades(camadas);
  const { profundidadeTopo, profundidadeBase } = profundidades[indexCamada];
  
  if (profundidadeNA < profundidadeTopo || profundidadeNA > profundidadeBase) {
    return {
      valido: false,
      erro: `O NA em ${profundidadeNA.toFixed(2)}m não está dentro da camada ${camada.nome} (${profundidadeTopo.toFixed(2)}m - ${profundidadeBase.toFixed(2)}m)`
    };
  }
  
  // Verifica se já existe outro NA próximo sem camada impermeável entre eles
  const erroNAConsecutivo = verificarNAsConsecutivos(indexCamada, camadas);
  if (erroNAConsecutivo) {
    return { valido: false, erro: erroNAConsecutivo };
  }
  
  return { valido: true };
}

/**
 * Verifica se há NAs consecutivos sem camada impermeável entre eles
 */
function verificarNAsConsecutivos(
  indexCamadaNova: number,
  camadas: CamadaTensoes[]
): string | null {
  // Procura por outros NAs no perfil
  const camadasComNA = camadas
    .map((c, i) => ({ camada: c, index: i, profundidadeNA: parseFloat(c.profundidadeNA) }))
    .filter((item, i) => i !== indexCamadaNova && !isNaN(item.profundidadeNA) && item.profundidadeNA >= 0);
  
  if (camadasComNA.length === 0) {
    return null; // Não há outros NAs, ok
  }
  
  // Para cada NA existente, verifica se há camada impermeável entre ele e o novo NA
  for (const itemNA of camadasComNA) {
    const indexMin = Math.min(indexCamadaNova, itemNA.index);
    const indexMax = Math.max(indexCamadaNova, itemNA.index);
    
    // Verifica se há alguma camada impermeável entre as duas
    let temImpermeavel = false;
    for (let i = indexMin; i <= indexMax; i++) {
      if (camadas[i].impermeavel) {
        temImpermeavel = true;
        break;
      }
    }
    
    if (!temImpermeavel) {
      return `Não é possível ter dois níveis de água (camadas ${itemNA.index + 1} e ${indexCamadaNova + 1}) sem uma camada impermeável entre eles`;
    }
  }
  
  return null;
}

/**
 * Transfere o NA e capilaridade para a camada correta quando o usuário insere uma profundidade
 */
export function transferirNAParaCamadaCorreta(
  profundidadeNA: number,
  capilaridade: number,
  camadaOrigem: number,
  camadas: CamadaTensoes[]
): { 
  camadas: CamadaTensoes[]; 
  indexDestino: number;
  erro?: string;
} {
  // Encontra a camada que contém esta profundidade
  const resultado = encontrarCamadaPorProfundidade(profundidadeNA, camadas);
  
  if (!resultado) {
    return {
      camadas,
      indexDestino: camadaOrigem,
      erro: `Profundidade ${profundidadeNA.toFixed(2)}m está fora do perfil de solo`
    };
  }
  
  const { index: indexDestino, camada: camadaDestino } = resultado;
  
  // Valida se pode inserir NA nesta camada
  const validacao = validarInsercaoNA(indexDestino, profundidadeNA, camadas);
  if (!validacao.valido) {
    return {
      camadas,
      indexDestino: camadaOrigem,
      erro: validacao.erro
    };
  }
  
  // Se a camada destino é diferente da origem, transfere os dados
  const novasCamadas = [...camadas];
  
  // Remove NA e capilaridade de todas as outras camadas (só pode ter um NA por camada)
  novasCamadas.forEach((camada, i) => {
    if (i !== indexDestino) {
      // Limpa os dados de NA de outras camadas se estiverem definidos
      const profNA = parseFloat(camada.profundidadeNA);
      if (!isNaN(profNA) && Math.abs(profNA - profundidadeNA) < 0.01) {
        camada.profundidadeNA = "";
        camada.capilaridade = "";
      }
    }
  });
  
  // Define NA e capilaridade na camada correta
  novasCamadas[indexDestino] = {
    ...novasCamadas[indexDestino],
    profundidadeNA: profundidadeNA.toString(),
    capilaridade: capilaridade.toString(),
  };
  
  return {
    camadas: novasCamadas,
    indexDestino,
  };
}

/**
 * Obtém todos os NAs definidos no perfil
 */
export function obterNAsDefinidos(camadas: CamadaTensoes[]): {
  index: number;
  profundidade: number;
  capilaridade: number;
}[] {
  return camadas
    .map((c, i) => {
      const profNA = parseFloat(c.profundidadeNA);
      const cap = parseFloat(c.capilaridade);
      return {
        index: i,
        profundidade: profNA,
        capilaridade: isNaN(cap) ? 0 : cap,
      };
    })
    .filter(item => !isNaN(item.profundidade) && item.profundidade >= 0);
}

/**
 * Limpa os dados de NA de uma camada
 */
export function limparNADaCamada(
  indexCamada: number,
  camadas: CamadaTensoes[]
): CamadaTensoes[] {
  const novasCamadas = [...camadas];
  novasCamadas[indexCamada] = {
    ...novasCamadas[indexCamada],
    profundidadeNA: "",
    capilaridade: "",
  };
  return novasCamadas;
}

