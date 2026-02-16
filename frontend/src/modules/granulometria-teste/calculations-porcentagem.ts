/**
 * Módulo para Classificação de Solos por Porcentagem de Frações
 * Recebe porcentagens diretas (pedregulho, areias, silte, argila)
 * + Parâmetros de Caracterização (%P#10, %P#40, %P#200, D10, D30, D60, LL, LP)
 * e retorna classificações USCS e HRB/AASHTO
 */

import { classificarUSCS } from '@/lib/calculations/classificacao-uscs';
import { classificarHRB } from '@/lib/calculations/classificacao-hrb';

export interface ClassificacaoPorcentagemInput {
    pedregulho: number;      // % retida acima da peneira #4 (4.8mm)
    areia_grossa: number;    // % areia grossa (2.0 - 4.8mm)
    areia_media: number;     // % areia média (0.42 - 2.0mm)
    areia_fina: number;      // % areia fina (0.075 - 0.42mm)
    silte: number;           // % silte (0.002 - 0.075mm)
    argila: number;          // % argila (< 0.002mm)

    // Parâmetros de Caracterização
    pass_peneira_10?: number;  // % Passante #10
    pass_peneira_40?: number;  // % Passante #40
    pass_peneira_200?: number; // % Passante #200
    d10?: number;              // Diâmetro efetivo D10 (mm)
    d30?: number;              // Diâmetro D30 (mm)
    d60?: number;              // Diâmetro D60 (mm)
    ll?: number;               // Limite de Liquidez
    lp?: number;               // Limite de Plasticidade
}

export interface ClassificacaoPorcentagemOutput {
    // Classificação USCS
    classificacao_uscs?: string;
    descricao_uscs?: string;

    // Classificação HRB
    classificacao_hrb?: string;
    grupo_hrb?: string;
    subgrupo_hrb?: string;
    indice_grupo_hrb?: number;
    descricao_hrb?: string;
    avaliacao_subleito_hrb?: string;

    // Frações derivadas
    total_areia: number;
    total_finos: number;

    // Erro
    erro?: string;
}

/**
 * Calcula classificações USCS e HRB a partir de porcentagens de frações granulométricas.
 *
 * Mapeamento de frações para peneiras:
 * - Pedregulho: retido na #4 (> 4.8mm)
 * - Areia Grossa: passa #4, retido na #10 (2.0 - 4.8mm)
 * - Areia Média: passa #10, retido na #40 (0.42 - 2.0mm)
 * - Areia Fina: passa #40, retido na #200 (0.075 - 0.42mm)
 * - Silte + Argila: passa #200 (< 0.075mm) → finos
 */
export function calcularClassificacaoPorPorcentagem(
    dados: ClassificacaoPorcentagemInput
): ClassificacaoPorcentagemOutput {
    try {
        // Validação: soma deve ser ~100%
        const soma =
            dados.pedregulho +
            dados.areia_grossa +
            dados.areia_media +
            dados.areia_fina +
            dados.silte +
            dados.argila;

        if (Math.abs(soma - 100) > 1.0) {
            return {
                total_areia: dados.areia_grossa + dados.areia_media + dados.areia_fina,
                total_finos: dados.silte + dados.argila,
                erro: `A soma das frações deve ser igual a 100%. Soma atual: ${soma.toFixed(1).replace('.', ',')}%`,
            };
        }

        // Derivar passantes nas peneiras a partir das frações
        const finos = dados.silte + dados.argila; // % passante na #200
        const total_areia = dados.areia_grossa + dados.areia_media + dados.areia_fina;

        // Passante na #4 = tudo exceto pedregulho
        const pass_peneira_4 = 100 - dados.pedregulho;

        // Usar valores fornecidos pelo usuário ou derivar das frações
        const pass_peneira_10 = dados.pass_peneira_10 ?? (pass_peneira_4 - dados.areia_grossa);
        const pass_peneira_40 = dados.pass_peneira_40 ?? (finos + dados.areia_fina);
        const pass_peneira_200 = dados.pass_peneira_200 ?? finos;

        // Calcular Cu e Cc se D10, D30 e D60 forem fornecidos
        let Cu: number | undefined;
        let Cc: number | undefined;
        if (dados.d10 !== undefined && dados.d10 > 0 && dados.d60 !== undefined && dados.d60 > 0) {
            Cu = dados.d60 / dados.d10;
            if (dados.d30 !== undefined && dados.d30 > 0) {
                Cc = (dados.d30 * dados.d30) / (dados.d10 * dados.d60);
            }
        }

        // Calcular IP se LL e LP disponíveis
        let ip: number | undefined;
        if (dados.ll !== undefined && dados.lp !== undefined) {
            if (dados.lp === 0 || dados.lp > dados.ll) {
                ip = 0;
            } else {
                ip = dados.ll - dados.lp;
                if (ip < 0) ip = 0;
            }
        }

        // Resultado base
        const resultado: ClassificacaoPorcentagemOutput = {
            total_areia,
            total_finos: finos,
        };

        // Classificação USCS
        try {
            const resultado_uscs = classificarUSCS({
                pass_peneira_200,
                pass_peneira_4,
                ll: dados.ll,
                ip,
                Cu,
                Cc,
                is_organico_fino: false,
                is_altamente_organico: false,
            });

            if (!resultado_uscs.erro) {
                resultado.classificacao_uscs = resultado_uscs.classificacao;
                resultado.descricao_uscs = resultado_uscs.descricao;
            }
        } catch (e) {
            console.warn('Não foi possível classificar USCS:', e);
        }

        // Classificação HRB
        try {
            const resultado_hrb = classificarHRB({
                pass_peneira_200,
                pass_peneira_40,
                pass_peneira_10,
                ll: dados.ll,
                ip,
            });

            if (!resultado_hrb.erro) {
                resultado.classificacao_hrb = resultado_hrb.classificacao;
                resultado.grupo_hrb = resultado_hrb.grupo_principal;
                resultado.subgrupo_hrb = resultado_hrb.subgrupo;
                resultado.indice_grupo_hrb = resultado_hrb.indice_grupo;
                resultado.descricao_hrb = resultado_hrb.descricao;
                resultado.avaliacao_subleito_hrb = resultado_hrb.avaliacao_subleito;
            }
        } catch (e) {
            console.warn('Não foi possível classificar HRB:', e);
        }

        return resultado;
    } catch (error) {
        return {
            total_areia: 0,
            total_finos: 0,
            erro: error instanceof Error ? error.message : 'Erro na classificação',
        };
    }
}
