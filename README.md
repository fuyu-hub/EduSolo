<p align="center">
  <a href="https://edusolos.pages.dev">
    <img src="./frontend/public/favicon.svg" alt="EduSolos Logo" width="128" />
  </a>
</p>

<h1 align="center">EduSolos</h1>

<p align="center">
  EduSolos é uma plataforma web para cálculos práticos em Engenharia Geotécnica.
</p>

<div align="center">
  <a href="https://reactjs.org/">
    <img alt="React" src="https://img.shields.io/badge/React-18+-61dafb?style=flat-square&logo=react&logoColor=black">
  </a>
  <a href="https://www.typescriptlang.org/">
    <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5.0+-3178c6?style=flat-square&logo=typescript&logoColor=white">
  </a>
</div>

## Sobre

O EduSolos moderniza a aplicação e o ensino de conceitos de Mecânica dos Solos através de um sistema web de alto desempenho. A ferramenta opera de forma 100% offline dentro do navegador do usuário, sem a exigência de servidores externos. 

A exatidão dos processos respeita metodologias consolidadas e normas da área de atuação.

## Funcionalidades

O sistema compreende módulos que abordam diretamente o tratamento de dados laboratoriais de mecânica dos solos:

- **Índices Físicos e Limites de Consistência**: Avaliação de índices de vazios, umidade e saturação, além do cálculo dos Atterberg (LL, LP). Acompanha um diagrama de fases em tempo real.
- **Granulometria**: Sistema para plote de curvas de distribuição granulométrica e a extração imediata dos parâmetros D10, D30, D60 e dos coeficientes Cu e Cc.
- **Compactação**: Ferramenta de representação de energia de compactação focada na localização exata de umidade ótima e peso específico aparente seco máximo.


## Execução Local

Pré-requisitos: Ter Node.js (versão 18+) instalado na máquina.

A aplicação e todo o seu motor de cálculo situam-se na pasta `frontend/`. Inicie o ambiente local via terminal na raiz do projeto:

```bash
cd frontend
npm install
npm run dev
```

E no seu navegador preferido acesse `http://localhost:5173`.

## Contribuindo

Regras de estruturação para o envio de pull requests, assim como guias das práticas de desenvolvimento adotadas no projeto, estão documentadas no arquivo [CONTRIBUTING.md](./CONTRIBUTING.md). Acesse-o antes de submeter commits de funcionalidade. Notas complementares e o acervo de documentação de versões prévias do refatoramento da arquitetura, encontram-se todos em `docs/`.

## Licença de Uso

Este projeto está ancorado nos termos do arquivo [LICENSE](./LICENSE). O código fonte é disponibilizado por meio da diretriz PolyForm Noncommercial 1.0.0.
