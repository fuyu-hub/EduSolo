/**
 * Matemática Pura — Classificação Granulométrica
 * modulos/granulometria/calculos.ts
 *
 * Recebe porcentagens diretas (pedregulho, areias, silte, argila)
 * + Parâmetros de Caracterização (%P#10, %P#40, %P#200, D10, D30, D60, LL, LP)
 * e retorna classificações USCS e HRB/AASHTO.
 */

import { classificarUSCS } from '@/lib/calculations/classificacao-uscs';
import { classificarHRB } from '@/lib/calculations/classificacao-hrb';
import type { ClassificacaoInput, ClassificacaoOutput } from './types';

export function calcularClassificacao(dados: ClassificacaoInput): ClassificacaoOutput {
  try {
    const soma =
      dados.pedregulho + dados.areia_grossa + dados.areia_media +
      dados.areia_fina + dados.silte + dados.argila;

    if (Math.abs(soma - 100) > 1.0) {
      return {
        total_areia: dados.areia_grossa + dados.areia_media + dados.areia_fina,
        total_finos: dados.silte + dados.argila,
        erro: `A soma das frações deve ser igual a 100%. Soma atual: ${soma.toFixed(1).replace('.', ',')}%`,
      };
    }

    const finos = dados.silte + dados.argila;
    const total_areia = dados.areia_grossa + dados.areia_media + dados.areia_fina;
    const pass_peneira_4 = 100 - dados.pedregulho;

    const pass_peneira_10 = dados.pass_peneira_10 ?? (pass_peneira_4 - dados.areia_grossa);
    const pass_peneira_40 = dados.pass_peneira_40 ?? (finos + dados.areia_fina);
    const pass_peneira_200 = dados.pass_peneira_200 ?? finos;

    // Cu e Cc
    let Cu: number | undefined;
    let Cc: number | undefined;
    if (dados.d10 !== undefined && dados.d10 > 0 && dados.d60 !== undefined && dados.d60 > 0) {
      Cu = dados.d60 / dados.d10;
      if (dados.d30 !== undefined && dados.d30 > 0) {
        Cc = (dados.d30 * dados.d30) / (dados.d10 * dados.d60);
      }
    }

    // IP
    let ip: number | undefined;
    if (dados.ll !== undefined && dados.lp !== undefined) {
      if (dados.lp === 0 || dados.lp > dados.ll) ip = 0;
      else { ip = dados.ll - dados.lp; if (ip < 0) ip = 0; }
    }

    const resultado: ClassificacaoOutput = { total_areia, total_finos: finos };

    // USCS
    try {
      const res_uscs = classificarUSCS({
        pass_peneira_200, pass_peneira_4,
        ll: dados.ll, ip, Cu, Cc,
        is_organico_fino: false, is_altamente_organico: false,
      });
      if (!res_uscs.erro) {
        resultado.classificacao_uscs = res_uscs.classificacao;
        resultado.descricao_uscs = res_uscs.descricao;
      }
    } catch (e) { console.warn('USCS:', e); }

    // HRB
    try {
      const res_hrb = classificarHRB({
        pass_peneira_200, pass_peneira_40, pass_peneira_10,
        ll: dados.ll, ip,
      });
      if (!res_hrb.erro) {
        resultado.classificacao_hrb = res_hrb.classificacao;
        resultado.grupo_hrb = res_hrb.grupo_principal;
        resultado.subgrupo_hrb = res_hrb.subgrupo;
        resultado.indice_grupo_hrb = res_hrb.indice_grupo;
        resultado.descricao_hrb = res_hrb.descricao;
        resultado.avaliacao_subleito_hrb = res_hrb.avaliacao_subleito;
      }
    } catch (e) { console.warn('HRB:', e); }

    return resultado;
  } catch (error) {
    return {
      total_areia: 0, total_finos: 0,
      erro: error instanceof Error ? error.message : 'Erro na classificação',
    };
  }
}
