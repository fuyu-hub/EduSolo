<p align="center">
  <img src="./public/favicon.svg" alt="EduSolos Logo" width="100" />
</p>

<h1 align="center">EduSolos</h1>

<p align="center">
  <strong>Plataforma educacional para análise e aprendizado em Engenharia Geotécnica.</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Versão-1.1.0-blue?style=flat-square" alt="Versão">
  <img src="https://img.shields.io/badge/Status-Em%20Desenvolvimento-orange?style=flat-square" alt="Status">
  <img src="https://img.shields.io/badge/Licença-PolyForm%20NC-green?style=flat-square" alt="Licença">
</p>

---

## Visão Geral

<div align="justify">
O <strong>EduSolos</strong> é uma plataforma digital desenvolvida para auxiliar estudantes, professores e profissionais de Engenharia Civil e Geotecnia na realização de cálculos e análises de Mecânica dos Solos. O projeto combina rigor técnico-científico com uma interface moderna e intuitiva, visando otimizar o fluxo de trabalho acadêmico e profissional.
</div>

<div align="justify">
Fundamentado nas normas da Associação Brasileira de Normas Técnicas (ABNT) e nas principais bibliografias da área, o sistema garante precisão na obtenção de resultados e na geração de representações gráficas fundamentais para a prática geotécnica.
</div>

## Principais Funcionalidades

Atualmente, o sistema dispõe dos seguintes módulos operacionais baseados em normas técnicas vigentes:

- **Índices Físicos e Limites de Consistência**: Avaliação completa de relações entre fases (índice de vazios, porosidade, teor de umidade, grau de saturação) e determinação dos Limites de Atterberg (LL e LP). Inclui geração de diagrama de fases em tempo real.
- **Granulometria**: Processamento de dados granulométricos com geração automática da curva de distribuição e extração de parâmetros como D10, D30, D60, Coeficiente de Uniformidade (Cu) e Curvatura (Cc).
- **Compactação**: Ferramenta para análise de ensaios de compactação, permitindo a determinação da umidade ótima e do peso específico aparente seco máximo.

### Expansões Planejadas

O projeto encontra-se em desenvolvimento contínuo, com implementações previstas para:
- Tensões Geostáticas e Acréscimo de Tensões;
- Recalque por Adensamento;
- Resistência ao Cisalhamento.

## Diferenciais Técnicos

<div align="justify">
<ul>
  <li><strong>Processamento Local:</strong> Todo o processamento de dados é executado no navegador do usuário, garantindo agilidade e privacidade das informações.</li>
  <li><strong>Conformidade Normativa:</strong> Cálculos e procedimentos estruturados de acordo com as normas técnicas brasileiras vigentes.</li>
  <li><strong>Ferramentas Didáticas:</strong> Inclusão de dados de exemplo para facilitar o aprendizado e familiarização com os módulos laboratoriais.</li>
  <li><strong>Exportação de Resultados:</strong> Geração de relatórios e gráficos em alta qualidade, prontos para uso em trabalhos acadêmicos ou relatórios técnicos.</li>
</ul>
</div>

## Tecnologias Utilizadas

A aplicação foi desenvolvida utilizando tecnologias modernas de desenvolvimento web:

- **Core**: React e TypeScript;
- **Build System**: Vite;
- **Estilização**: Tailwind CSS e Radix UI;
- **Visualização de Dados**: Recharts;
- **Exportação**: jsPDF e html2canvas.

## Execução Local

Para executar o projeto em ambiente de desenvolvimento, certifique-se de possuir o [Node.js](https://nodejs.org/) (versão 18 ou superior) instalado.

1. Clone o repositório:
   ```bash
   git clone https://github.com/[seu-usuario]/edusolos.git
   ```

2. Acesse o diretório do projeto:
   ```bash
   cd edusolos
   ```

3. Instale as dependências:
   ```bash
   npm install
   ```

4. Inicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```

5. Acesse a aplicação em: `http://localhost:5173`

## Contribuição

Interessados em contribuir com o desenvolvimento do EduSolos devem consultar o guia detalhado em [CONTRIBUTING.md](./CONTRIBUTING.md).

## Licença

Este projeto está licenciado sob a **PolyForm Noncommercial 1.0.0**. Consulte o arquivo [LICENSE](./LICENSE) para mais detalhes sobre os termos de uso.

---
<p align="center">
  Desenvolvido por <strong>Samuel Sousa Santos</strong>
</p>
