# Guia de Contribuição

Obrigado pelo seu interesse em contribuir com o **EduSolos**. Este documento estabelece as diretrizes para garantir que o processo de colaboração seja eficiente e mantenha a qualidade técnica do projeto.

## Código de Conduta

Esperamos que todos os colaboradores mantenham uma postura profissional, respeitosa e construtiva. O foco deve ser sempre a melhoria da ferramenta para benefício da comunidade acadêmica e profissional.

## Como Contribuir

### Reportando Bugs

Ao identificar uma falha:
1. Verifique se o problema já foi reportado nas *Issues*.
2. Caso não, abra uma nova *Issue* detalhando:
   - Descrição clara do comportamento inesperado;
   - Passo a passo para reprodução;
   - Comportamento esperado;
   - Informações sobre o ambiente (navegador e versão).

### Sugerindo Melhorias

Sugestões de novas funcionalidades ou melhorias de interface são bem-vindas. Ao abrir uma *Issue* de sugestão, descreva claramente o problema que a funcionalidade resolve e, se possível, anexe referências ou protótipos.

## Desenvolvimento

### Configuração do Ambiente

1. Realize o **Fork** do repositório.
2. Clone o seu fork localmente.
3. Certifique-se de estar utilizando o Node.js 18+.
4. Instale as dependências com `npm install`.

### Fluxo de Trabalho

1. Crie uma branch para sua alteração:
   - Funcionalidades: `feat/nome-da-feature`
   - Correções: `fix/nome-do-bug`
   - Documentação: `docs/nome-da-melhoria`
2. Realize as alterações seguindo os padrões de código do projeto.
3. Antes de submeter, execute o linting: `npm run lint`.
4. Faça o push para o seu fork e abra um **Pull Request** para a branch principal do repositório original.

## Padrões de Código

### TypeScript e React

- Utilize componentes funcionais e Hooks.
- Mantenha a tipagem rigorosa de interfaces e propriedades.
- Siga a nomenclatura: `PascalCase` para componentes e `camelCase` para funções e variáveis.
- Utilize o ESLint e Prettier configurados no projeto para garantir a consistência da formatação.

### Commits

As mensagens de commit devem ser claras e em português, seguindo o padrão de **Conventional Commits**:

- `feat`: Nova funcionalidade.
- `fix`: Correção de bug.
- `docs`: Alterações em documentação.
- `style`: Formatação e ajustes visuais que não alteram a lógica.
- `refactor`: Refatoração de código existente.
- `perf`: Melhoria de desempenho.

Exemplo: `feat(granulometria): adiciona cálculo de coeficiente de curvatura`

## Processo de Pull Request

Todos os Pull Requests passarão por revisão. Durante este processo:
- O código será avaliado quanto à legibilidade, performance e conformidade normativa.
- Podem ser solicitados ajustes antes da aprovação final.
- Certifique-se de que sua branch está atualizada com a branch principal do projeto original para evitar conflitos.

---
Ao contribuir, você concorda que seu código será disponibilizado sob a mesma licença do projeto (**PolyForm Noncommercial 1.0.0**).

