/**
 * Exemplos — Tensões Geostáticas
 * modulos/tensoes-geostaticas/exemplos.ts
 *
 * Perfis de solo pré-configurados para demonstração e aprendizado.
 * Inclui cenários com NA simples, franja capilar e aquíferos separados.
 */
import { CamadaSolo, ConfiguracoesGerais } from "./types";

export interface ExemploTensoes {
  id: string;
  nome: string;
  descricao: string;
  icone: string;
  configuracoes: ConfiguracoesGerais;
  camadas: CamadaSolo[];
}

export const exemplosTensoes: ExemploTensoes[] = [
  {
    id: "areia-sobre-argila",
    nome: "Areia sobre Argila",
    descricao: "Perfil típico: areia (4m) sobre argila rija (6m), NA a 3m",
    icone: "🏖️",
    configuracoes: {
      pesoEspecificoAgua: 10.0,
      sobrecargaSuperficial: 0.0,
      intervaloDiscretizacao: 0.5,
    },
    camadas: [
      {
        nome: "Areia Média",
        espessura: 4.0,
        profundidadeNA: 3.0,
        capilaridade: 0.0,
        gamaNat: 17.5,
        gamaSat: 19.2,
        impermeavel: false,
        Ko: 0.45,
      },
      {
        nome: "Argila Rija",
        espessura: 6.0,
        profundidadeNA: null,
        capilaridade: null,
        gamaNat: null,
        gamaSat: 18.8,
        impermeavel: false,
        Ko: 0.6,
      }
    ]
  },
  {
    id: "capilaridade",
    nome: "Franja Capilar",
    descricao: "Perfil estratificado com franja capilar de 1m acima do NA",
    icone: "🌊",
    configuracoes: {
      pesoEspecificoAgua: 10.0,
      sobrecargaSuperficial: 20.0, // Exemplo com sobrecarga!
      intervaloDiscretizacao: 0.5,
    },
    camadas: [
      {
        nome: "Argila Média",
        espessura: 2.5,
        profundidadeNA: 4.0,
        capilaridade: 1.0,
        gamaNat: 18.5,
        gamaSat: 20.2,
        impermeavel: false,
        Ko: 0.5,
      },
      {
        nome: "Silte Arenoso",
        espessura: 3.0,
        profundidadeNA: null,
        capilaridade: null,
        gamaNat: 17.8,
        gamaSat: 19.5,
        impermeavel: false,
        Ko: 0.4,
      },
      {
        nome: "Areia Densa",
        espessura: 4.5,
        profundidadeNA: null,
        capilaridade: null,
        gamaNat: null,
        gamaSat: 19.8,
        impermeavel: false,
        Ko: 0.35,
      }
    ]
  },
  {
    id: "aquiferos-separados",
    nome: "Aquíferos Separados",
    descricao: "Dois níveis de água separados por uma camada impermeável (aquitarde)",
    icone: "🌍",
    configuracoes: {
      pesoEspecificoAgua: 10.0,
      sobrecargaSuperficial: 0.0,
      intervaloDiscretizacao: null,
    },
    camadas: [
      {
        nome: "Areia Fina (Aquífero Livre)",
        espessura: 3.0,
        profundidadeNA: 2.0,
        capilaridade: 0.5,
        gamaNat: 17.0,
        gamaSat: 19.0,
        impermeavel: false,
        Ko: 0.45,
      },
      {
        nome: "Argila Impermeável",
        espessura: 2.0,
        profundidadeNA: null,
        capilaridade: null,
        gamaNat: 19.0,
        gamaSat: 20.5,
        impermeavel: true,
        Ko: 0.8,
      },
      {
        nome: "Areia Grossa (Aquífero Confinado)",
        espessura: 5.0,
        profundidadeNA: 5.0, // Novo NA estabelecido pelo aquífero arteziano isolado do de cima
        capilaridade: 0.0,
        gamaNat: null,
        gamaSat: 20.0,
        impermeavel: false,
        Ko: 0.38,
      }
    ]
  }
];
