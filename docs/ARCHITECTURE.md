# Arquitetura e Tecnologias

Este documento detalha a arquitetura do **EduSolos**, as tecnologias empregadas no desenvolvimento e a organização do projeto.

## 1. Visão Geral da Arquitetura

O EduSolos é uma **Single Page Application (SPA)** moderna, desenvolvida com React e TypeScript. A arquitetura foi projetada para ser modular, escalável e altamente performática em ambiente web.

### Objetivos da Arquitetura
1. **Padrão Modular:** Cada módulo de cálculo (Ex: Granulometria) é independente, facilitando a manutenção e adição de novas ferramentas.
2. **Processamento Client-side:** Todos os cálculos complexos são executados no navegador do usuário, reduzindo a latência e a carga no servidor.
3. **Persistência Local:** Permite o armazenamento temporário de dados e preferências via estado local e context API.

---

## 2. Tecnologias Empregadas

- **Framework:** [React v18+](https://react.dev/)
- **Linguagem:** [TypeScript](https://www.typescriptlang.org/) (Tipagem estática para robustez nos cálculos).
- **Gerenciador de Estado:** [Zustand](https://zustand-demo.pmnd.rs/) ou [Context API](https://react.dev/learn/passing-data-deeply-with-context) (Gerenciamento de fluxos de dados globais).
- **Estilização:** [Tailwind CSS](https://tailwindcss.com/) (Design responsivo e utilitário).
- **Componentes UI:** [Radix UI](https://www.radix-ui.com/) e [Shadcn UI](https://ui.shadcn.com/) (Componentes acessíveis e customizáveis).
- **Gráficos:** [Recharts](https://recharts.org/) (Visualização flexível de curvas granulométricas e de compactação).

---

## 3. Estrutura do Projeto

A organização dos diretórios segue o padrão moderno de aplicações React:

```bash
src/
├── componentes/     # Componentes compartilhados de interface (Botões, Cards, Layouts)
├── modulos/         # Implementação específica de cada módulo geotécnico
│   ├── granulometria/
│   ├── compactação/
│   └── ...
├── lib/             # Lógica de negócio, constantes e cálculos geotecnicos puros
├── hooks/           # Hooks customizados para reutilização de lógica
├── providers/       # Provedores de contexto para estado global
├── styles/          # Configurações globais de CSS e temas
└── utils/           # Funções utilitárias (formatação, conversão de unidades)
```

---

## 4. Integração de Cálculos

A lógica de cálculo é separada da interface. As funções matemáticas puras residem em `src/lib/calculations/` (ou diretório equivalente), permitindo que sejam testadas de forma isolada do React.

### Exemplo de Fluxo
1. **Entrada:** Usuário preenche formulários validados com [Zod](https://zod.dev/).
2. **Cálculo:** O motor de cálculo processa os dados e retorna objetos estruturados.
3. **Visualização:** O Recharts renderiza a curva baseada nos resultados calculados.
4. **Geração de Relatórios:** Bibliotecas como `jsPDF` capturam o estado da tela para gerar documentos técnicos.

---

## 5. Garantia de Qualidade

- **Linting:** Configurado com ESLint seguindo padrões de boas práticas.
- **Formatação:** Prettier para garantir padronização do código fonte.
- **Tipagem:** Interfaces TypeScript rigorosas para evitar erros de lógica em operações matemáticas.

---
**Observação:** Este documento é revisado periodicamente conforme a arquitetura do projeto evolui.
