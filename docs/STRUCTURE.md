# 🗂️ Estrutura da Documentação - EduSolo

Este documento descreve a organização completa da documentação do projeto EduSolo.

## 📁 Estrutura de Arquivos

```
EduSolo/
│
├── 📄 README.md                          # Documentação principal do projeto
├── 📄 CONTRIBUTING.md                    # Guia de contribuição
├── 📄 CHANGELOG.md                       # Histórico de versões
├── 📄 LICENSE                            # Licença MIT
├── 📄 .gitignore                         # Arquivos ignorados pelo Git
│
├── 📁 docs/                              # Documentação centralizada
│   ├── 📄 README.md                      # Índice da documentação
│   └── 📄 STRUCTURE.md                   # Este arquivo
│
├── 📁 backend/                           # Backend (FastAPI)
│   ├── 📄 README.md                      # Documentação da API
│   ├── 📄 requirements.txt               # Dependências Python
│   │
│   ├── 📁 docs/                          # Documentação técnica
│   │   └── 📄 MODULES.md                 # Documentação dos módulos de cálculo
│   │
│   ├── 📁 app/                           # Código da aplicação
│   │   ├── 📄 main.py                    # Entrada da API
│   │   ├── 📄 models.py                  # Modelos Pydantic
│   │   │
│   │   └── 📁 modules/                   # Módulos de cálculo
│   │       ├── 📄 indices_fisicos.py
│   │       ├── 📄 limites_consistencia.py
│   │       ├── 📄 granulometria.py
│   │       ├── 📄 classificacao_uscs.py
│   │       ├── 📄 compactacao.py
│   │       ├── 📄 tensoes_geostaticas.py
│   │       ├── 📄 acrescimo_tensoes.py
│   │       ├── 📄 fluxo_hidraulico.py
│   │       ├── 📄 recalque_adensamento.py
│   │       └── 📄 tempo_adensamento.py
│   │
│   └── 📁 tests/                         # Testes unitários
│       ├── 📄 test_granulometria.py
│       └── 📄 test_fluxo_hidraulico.py
│
└── 📁 frontend/                          # Frontend (React)
    ├── 📄 README.md                      # Documentação do frontend
    ├── 📄 package.json                   # Dependências Node
    │
    └── 📁 src/                           # Código fonte
        ├── 📄 App.tsx                    # Componente raiz
        ├── 📄 main.tsx                   # Entrada da aplicação
        │
        ├── 📁 pages/                     # Páginas da aplicação
        │   ├── 📄 Index.tsx
        │   ├── 📄 Dashboard.tsx
        │   ├── 📄 IndicesFisicos.tsx
        │   ├── 📄 LimitesConsistencia.tsx
        │   ├── 📄 Granulometria.tsx
        │   ├── 📄 Compactacao.tsx
        │   ├── 📄 Tensoes.tsx
        │   ├── 📄 AcrescimoTensoes.tsx
        │   ├── 📄 Educacional.tsx
        │   └── 📄 Settings.tsx
        │
        ├── 📁 components/                # Componentes reutilizáveis
        │   ├── 📁 ui/                    # Componentes base (shadcn)
        │   ├── 📁 visualizations/        # Gráficos e diagramas
        │   ├── 📁 granulometria/         # Componentes específicos
        │   └── 📁 soil/                  # Componentes de solo
        │
        ├── 📁 lib/                       # Utilitários
        ├── 📁 hooks/                     # React hooks
        └── 📁 contexts/                  # Context API
```

## 📚 Guia de Leitura por Perfil

### 👨‍💻 Desenvolvedor Backend

**Início Rápido:**
1. [README.md](../README.md) - Visão geral
2. [backend/README.md](../backend/README.md) - Setup e API
3. [backend/docs/MODULES.md](../backend/docs/MODULES.md) - Teoria e implementação

**Desenvolvimento:**
- [CONTRIBUTING.md](../CONTRIBUTING.md) - Padrões Python
- Código comentado em `backend/app/modules/`
- Testes em `backend/tests/`

### 👨‍🎨 Desenvolvedor Frontend

**Início Rápido:**
1. [README.md](../README.md) - Visão geral
2. [frontend/README.md](../frontend/README.md) - Setup e estrutura

**Desenvolvimento:**
- [CONTRIBUTING.md](../CONTRIBUTING.md) - Padrões TypeScript/React
- Componentes documentados com JSDoc
- Exemplos em `frontend/src/`

### 🧑‍🔬 Usuário/Pesquisador

**Aprender a Usar:**
1. [README.md](../README.md) - O que é o EduSolo
2. [backend/docs/MODULES.md](../backend/docs/MODULES.md) - Teoria por trás dos cálculos

**Referência:**
- Documentação interativa da API: `http://localhost:8000/docs`
- Exemplos na interface web

### 🤝 Contribuidor

**Começar:**
1. [README.md](../README.md) - Visão geral do projeto
2. [CONTRIBUTING.md](../CONTRIBUTING.md) - Como contribuir
3. Escolher área (Backend/Frontend/Docs)

**Contribuir:**
- Reportar bugs via GitHub Issues
- Sugerir melhorias
- Submeter Pull Requests

## 📖 Tipos de Documentação

### 1. Documentação de Usuário

**Objetivo:** Ensinar a usar a aplicação

**Localização:**
- Interface web (tooltips, helpers)
- [docs/README.md](README.md) - Índice geral
- Tutoriais (planejado)

**Público:** Estudantes, professores, profissionais

### 2. Documentação Técnica

**Objetivo:** Explicar conceitos e algoritmos

**Localização:**
- [backend/docs/MODULES.md](../backend/docs/MODULES.md)

**Conteúdo:**
- Fundamentação teórica
- Equações matemáticas
- Métodos e algoritmos
- Referências bibliográficas

**Público:** Desenvolvedores, pesquisadores

### 3. Documentação de API

**Objetivo:** Especificar endpoints e modelos

**Localização:**
- [backend/README.md](../backend/README.md)
- Swagger UI: `/docs`
- ReDoc: `/redoc`

**Conteúdo:**
- Endpoints disponíveis
- Request/Response schemas
- Exemplos de uso
- Códigos de erro

**Público:** Desenvolvedores que integram com a API

### 4. Documentação de Código

**Objetivo:** Facilitar manutenção e contribuição

**Localização:**
- Docstrings (Python)
- JSDoc/TSDoc (TypeScript)
- Comentários inline

**Conteúdo:**
- Descrição de funções/classes
- Parâmetros e retornos
- Exemplos de uso
- Notas importantes

**Público:** Desenvolvedores contribuindo com código

### 5. Guias de Contribuição

**Objetivo:** Padronizar contribuições

**Localização:**
- [CONTRIBUTING.md](../CONTRIBUTING.md)

**Conteúdo:**
- Código de conduta
- Como reportar bugs
- Padrões de código
- Processo de PR
- Setup de ambiente

**Público:** Contribuidores

### 6. Changelog e Versões

**Objetivo:** Rastrear mudanças

**Localização:**
- [CHANGELOG.md](../CHANGELOG.md)

**Conteúdo:**
- Histórico de versões
- Features adicionadas
- Bugs corrigidos
- Breaking changes

**Público:** Todos

## 🔄 Fluxo de Atualização

### Quando adicionar uma nova feature:

1. **Código:**
   - Implementar no backend/frontend
   - Adicionar docstrings/JSDoc

2. **Testes:**
   - Adicionar testes unitários
   - Documentar casos de teste

3. **API (se aplicável):**
   - Atualizar [backend/README.md](../backend/README.md)
   - Exemplo de uso do endpoint

4. **Teoria (se novo cálculo):**
   - Atualizar [MODULES.md](../backend/docs/MODULES.md)
   - Fundamentação teórica
   - Equações e referências

5. **Changelog:**
   - Adicionar entrada em [CHANGELOG.md](../CHANGELOG.md)

6. **README principal:**
   - Atualizar lista de features (se relevante)

## 📝 Convenções de Escrita

### Markdown

- Use títulos hierárquicos (`#`, `##`, `###`)
- Code blocks com syntax highlighting
- Tabelas para dados tabulares
- Emojis para melhor visualização (opcional)
- Links relativos entre documentos

### Código

```markdown
# Python
\`\`\`python
def funcao_exemplo():
    """Docstring aqui."""
    pass
\`\`\`

# TypeScript
\`\`\`typescript
function funcaoExemplo(): void {
  // Comentário
}
\`\`\`
```

### Fórmulas

Use LaTeX inline para fórmulas:

```markdown
A equação é: \( \sigma' = \sigma - u \)

Ou em bloco:

\[
\rho = \frac{C_c}{1 + e_0} \times H \times \log_{10}\frac{\sigma'_f}{\sigma'_0}
\]
```

## 🎯 Checklist de Documentação

### Para cada módulo novo:

- [ ] Código documentado (docstrings/JSDoc)
- [ ] README do backend atualizado (endpoint)
- [ ] MODULES.md atualizado (teoria)
- [ ] Testes documentados
- [ ] Exemplos de uso
- [ ] CHANGELOG atualizado
- [ ] README principal atualizado (se necessário)

### Para release:

- [ ] Todos os módulos documentados
- [ ] API reference completa
- [ ] Changelog consolidado
- [ ] README reflete features atuais
- [ ] Exemplos funcionando
- [ ] Links verificados

## 🔗 Links Importantes

### Documentação Principal
- [README](../README.md)
- [Índice de Docs](README.md)

### Técnica
- [Módulos de Cálculo](../backend/docs/MODULES.md)
- [API Backend](../backend/README.md)
- [Frontend](../frontend/README.md)

### Contribuição
- [Guia de Contribuição](../CONTRIBUTING.md)
- [Changelog](../CHANGELOG.md)

## 💡 Dicas

### Para escrever boa documentação:

1. **Seja claro e conciso**
   - Frases curtas
   - Evite jargão quando possível
   - Explique termos técnicos

2. **Use exemplos**
   - Código de exemplo
   - Casos de uso reais
   - Screenshots (quando relevante)

3. **Mantenha atualizada**
   - Documente ao desenvolver
   - Revise periodicamente
   - Remova informação obsoleta

4. **Organize bem**
   - Estrutura lógica
   - Índice navegável
   - Links entre documentos

5. **Pense no leitor**
   - Contexto necessário
   - Passo a passo
   - Solução de problemas comuns

---

<div align="center">

**Estrutura de Documentação - EduSolo**

Mantido pela comunidade • Última atualização: Janeiro 2025

[⬆ Documentação](README.md) | [🏠 Home](../README.md)

</div>

