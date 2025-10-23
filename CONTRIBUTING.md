# 🤝 Guia de Contribuição - EduSolo

Obrigado por considerar contribuir com o EduSolo! Este documento fornece diretrizes para contribuir com o projeto.

## 📋 Índice

1. [Código de Conduta](#código-de-conduta)
2. [Como Posso Contribuir?](#como-posso-contribuir)
3. [Configuração do Ambiente de Desenvolvimento](#configuração-do-ambiente-de-desenvolvimento)
4. [Padrões de Código](#padrões-de-código)
5. [Processo de Pull Request](#processo-de-pull-request)
6. [Reportar Bugs](#reportar-bugs)
7. [Sugerir Melhorias](#sugerir-melhorias)
8. [Estrutura de Commits](#estrutura-de-commits)
9. [Testes](#testes)
10. [Documentação](#documentação)

---

## 📜 Código de Conduta

### Nossa Promessa

No interesse de promover um ambiente aberto e acolhedor, nós, como contribuidores e mantenedores, nos comprometemos a tornar a participação em nosso projeto e comunidade uma experiência livre de assédio para todos.

### Comportamentos Esperados

✅ **Faça:**
- Use linguagem acolhedora e inclusiva
- Respeite pontos de vista e experiências diferentes
- Aceite críticas construtivas graciosamente
- Foque no que é melhor para a comunidade
- Mostre empatia com outros membros

❌ **Não faça:**
- Use linguagem ou imagens sexualizadas
- Faça comentários insultuosos/depreciativos
- Assédio público ou privado
- Publique informações privadas de outros
- Condutas não profissionais

---

## 🚀 Como Posso Contribuir?

### 1. 🐛 Reportar Bugs

Encontrou um bug? Ajude-nos reportando!

**Antes de reportar:**
- Verifique se o bug já foi reportado nas [Issues](https://github.com/seu-usuario/edusolo/issues)
- Teste com a versão mais recente
- Colete informações sobre o bug

**Como reportar:**
1. Abra uma nova [Issue](https://github.com/seu-usuario/edusolo/issues/new)
2. Use o template de bug report
3. Forneça:
   - Descrição clara do problema
   - Passos para reproduzir
   - Comportamento esperado vs atual
   - Screenshots (se aplicável)
   - Ambiente (OS, versões, etc.)

### 2. 💡 Sugerir Melhorias

Tem uma ideia para melhorar o EduSolo?

**Antes de sugerir:**
- Verifique se já não foi sugerido
- Considere se está alinhado com os objetivos do projeto

**Como sugerir:**
1. Abra uma [Issue](https://github.com/seu-usuario/edusolo/issues/new)
2. Use o template de feature request
3. Descreva:
   - Problema que resolve
   - Solução proposta
   - Alternativas consideradas
   - Contexto adicional

### 3. 📝 Melhorar Documentação

Documentação é crucial! Você pode:
- Corrigir erros de digitação
- Melhorar explicações
- Adicionar exemplos
- Traduzir conteúdo
- Criar tutoriais

### 4. 💻 Contribuir com Código

#### Áreas que Precisam de Ajuda

- ✨ Novos módulos de cálculo
- 🐛 Correção de bugs
- 🎨 Melhorias de UI/UX
- ⚡ Otimizações de performance
- 🧪 Testes unitários e de integração
- 📱 Responsividade mobile
- 🌐 Internacionalização (i18n)

---

## 🛠️ Configuração do Ambiente de Desenvolvimento

### Pré-requisitos

- **Python** 3.8+
- **Node.js** 18+
- **Git**
- Editor de código (recomendado: VS Code)

### 1. Fork e Clone

```bash
# Fork o repositório no GitHub
# Depois clone seu fork

git clone https://github.com/seu-usuario/edusolo.git
cd edusolo

# Adicione o repositório original como upstream
git remote add upstream https://github.com/original-usuario/edusolo.git
```

### 2. Backend

```bash
cd backend

# Criar ambiente virtual
python -m venv venv

# Ativar ambiente virtual
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# Instalar dependências
pip install -r requirements.txt

# Instalar dependências de desenvolvimento
pip install pytest pytest-cov black flake8 mypy

# Executar testes
pytest

# Executar servidor
uvicorn app.main:app --reload
```

### 3. Frontend

```bash
cd frontend

# Instalar dependências
npm install
# ou
bun install

# Executar em desenvolvimento
npm run dev

# Executar linting
npm run lint

# Build
npm run build
```

### 4. Configuração do Editor (VS Code)

Crie `.vscode/settings.json`:

```json
{
  "python.linting.enabled": true,
  "python.linting.flake8Enabled": true,
  "python.formatting.provider": "black",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.tsdk": "frontend/node_modules/typescript/lib"
}
```

---

## 📏 Padrões de Código

### Python (Backend)

#### Estilo

Seguimos **PEP 8** com algumas adaptações:

- Formatador: **Black** (linha: 100 caracteres)
- Linter: **Flake8**
- Type hints: **mypy**

```python
# Bom
def calcular_indice_vazios(
    volume_vazios: float,
    volume_solidos: float
) -> float:
    """
    Calcula o índice de vazios.
    
    Args:
        volume_vazios: Volume de vazios (cm³)
        volume_solidos: Volume de sólidos (cm³)
    
    Returns:
        Índice de vazios (adimensional)
    """
    if volume_solidos <= 0:
        raise ValueError("Volume de sólidos deve ser positivo")
    
    return volume_vazios / volume_solidos
```

#### Convenções

- **Funções**: `snake_case`
- **Classes**: `PascalCase`
- **Constantes**: `UPPER_SNAKE_CASE`
- **Variáveis privadas**: `_leading_underscore`

#### Docstrings

Use o formato Google:

```python
def funcao_exemplo(param1: int, param2: str) -> bool:
    """
    Resumo de uma linha.
    
    Descrição mais detalhada se necessário.
    
    Args:
        param1: Descrição do primeiro parâmetro
        param2: Descrição do segundo parâmetro
    
    Returns:
        Descrição do retorno
    
    Raises:
        ValueError: Quando param1 é negativo
    """
    pass
```

#### Formatação

```bash
# Formatar código
black backend/

# Verificar estilo
flake8 backend/

# Type checking
mypy backend/
```

### TypeScript (Frontend)

#### Estilo

Seguimos o **Airbnb Style Guide** adaptado:

- Formatador: **Prettier**
- Linter: **ESLint**
- Aspas: Duplas
- Ponto-e-vírgula: Obrigatório
- Indentação: 2 espaços

```typescript
// Bom
interface CalculationResult {
  value: number;
  unit: string;
  error?: string;
}

export function calculateSomething(input: number): CalculationResult {
  if (input < 0) {
    return {
      value: 0,
      unit: "kN/m³",
      error: "Input deve ser positivo",
    };
  }
  
  return {
    value: input * 2,
    unit: "kN/m³",
  };
}
```

#### Convenções

- **Componentes**: `PascalCase`
- **Funções**: `camelCase`
- **Constantes**: `UPPER_SNAKE_CASE`
- **Interfaces/Types**: `PascalCase`
- **Hooks**: `useCamelCase`

#### React

```tsx
// Bom - Functional Component com TypeScript
import { useState } from "react";
import { Button } from "@/components/ui/button";

interface MyComponentProps {
  title: string;
  initialValue?: number;
  onSubmit: (value: number) => void;
}

export function MyComponent({ 
  title, 
  initialValue = 0, 
  onSubmit 
}: MyComponentProps) {
  const [value, setValue] = useState(initialValue);

  const handleSubmit = () => {
    if (value > 0) {
      onSubmit(value);
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">{title}</h2>
      <input
        type="number"
        value={value}
        onChange={(e) => setValue(Number(e.target.value))}
        className="border rounded px-3 py-2"
      />
      <Button onClick={handleSubmit}>Enviar</Button>
    </div>
  );
}
```

#### Formatação

```bash
# Formatar código
npm run format

# Verificar linting
npm run lint

# Corrigir automaticamente
npm run lint:fix
```

---

## 🔄 Processo de Pull Request

### 1. Criar Branch

Use nomes descritivos:

```bash
# Features
git checkout -b feature/nome-da-feature

# Bugs
git checkout -b fix/nome-do-bug

# Documentação
git checkout -b docs/nome-da-doc

# Refatoração
git checkout -b refactor/nome-da-refatoracao
```

### 2. Fazer Alterações

- Faça commits pequenos e atômicos
- Escreva mensagens de commit claras
- Teste suas alterações
- Atualize a documentação se necessário

### 3. Sincronizar com Upstream

```bash
# Buscar alterações do repositório original
git fetch upstream

# Fazer rebase
git rebase upstream/main
```

### 4. Push para seu Fork

```bash
git push origin nome-da-sua-branch
```

### 5. Abrir Pull Request

1. Vá para o repositório original no GitHub
2. Clique em "New Pull Request"
3. Selecione sua branch
4. Preencha o template:
   - Descrição clara das mudanças
   - Issue relacionada (se houver)
   - Screenshots (se aplicável)
   - Checklist de verificação

### 6. Revisão de Código

- Aguarde revisão dos mantenedores
- Responda a comentários educadamente
- Faça alterações solicitadas
- Mantenha a discussão focada e profissional

### 7. Merge

Após aprovação, um mantenedor fará o merge!

---

## 🐛 Reportar Bugs

### Template de Bug Report

```markdown
## Descrição do Bug
Descrição clara e concisa do bug.

## Passos para Reproduzir
1. Vá para '...'
2. Clique em '...'
3. Role até '...'
4. Veja o erro

## Comportamento Esperado
O que deveria acontecer.

## Comportamento Atual
O que está acontecendo.

## Screenshots
Se aplicável, adicione screenshots.

## Ambiente
- OS: [e.g. Windows 11, Ubuntu 22.04]
- Navegador: [e.g. Chrome 120, Firefox 121]
- Versão do Python: [e.g. 3.11]
- Versão do Node: [e.g. 18.17]

## Contexto Adicional
Qualquer outra informação relevante.
```

---

## 💡 Sugerir Melhorias

### Template de Feature Request

```markdown
## Problema que Resolve
Descrição clara do problema que a feature resolve.

## Solução Proposta
Descrição clara da solução que você gostaria.

## Alternativas Consideradas
Outras soluções que você considerou.

## Contexto Adicional
Screenshots, mockups, referências, etc.
```

---

## 📝 Estrutura de Commits

Seguimos [Conventional Commits](https://www.conventionalcommits.org/):

### Formato

```
<tipo>[escopo opcional]: <descrição>

[corpo opcional]

[rodapé opcional]
```

### Tipos

- **feat**: Nova funcionalidade
- **fix**: Correção de bug
- **docs**: Mudanças na documentação
- **style**: Formatação, ponto-e-vírgula, etc (sem mudança de código)
- **refactor**: Refatoração de código
- **perf**: Melhoria de performance
- **test**: Adicionar ou corrigir testes
- **chore**: Tarefas de build, configs, etc
- **ci**: Mudanças em CI/CD

### Exemplos

```bash
# Feature
git commit -m "feat(indices-fisicos): adiciona cálculo de compacidade relativa"

# Bug fix
git commit -m "fix(granulometria): corrige interpolação de D10"

# Documentação
git commit -m "docs(readme): atualiza instruções de instalação"

# Refatoração
git commit -m "refactor(api): extrai lógica de validação para função separada"

# Com corpo
git commit -m "feat(tensoes): adiciona cálculo de tensões horizontais

Implementa cálculo de σ'h usando coeficiente K0.
Adiciona suporte para K0 customizado por camada.

Closes #42"
```

### Regras

- Use imperativos ("adiciona", não "adicionado" ou "adicionando")
- Primeira linha com no máximo 72 caracteres
- Corpo com linhas de no máximo 100 caracteres
- Referencie issues quando aplicável

---

## 🧪 Testes

### Backend (pytest)

```python
# tests/test_indices_fisicos.py
import pytest
from app.modules.indices_fisicos import calcular_indices_fisicos
from app.models import IndicesFisicosInput

def test_calculo_basico():
    """Testa cálculo básico de índices físicos."""
    input_data = IndicesFisicosInput(
        peso_total=150.0,
        volume_total=100.0,
        peso_solido=130.0,
        Gs=2.65,
        peso_especifico_agua=10.0
    )
    
    resultado = calcular_indices_fisicos(input_data)
    
    assert resultado.erro is None
    assert resultado.peso_especifico_natural is not None
    assert resultado.peso_especifico_natural > 0


def test_validacao_entrada_invalida():
    """Testa validação de entrada inválida."""
    input_data = IndicesFisicosInput(
        volume_total=-100.0,  # Inválido
        Gs=2.65
    )
    
    with pytest.raises(ValueError):
        calcular_indices_fisicos(input_data)


@pytest.mark.parametrize("gs,esperado", [
    (2.65, True),
    (2.70, True),
    (2.60, True),
])
def test_diferentes_gs(gs, esperado):
    """Testa com diferentes valores de Gs."""
    input_data = IndicesFisicosInput(
        Gs=gs,
        peso_especifico_agua=10.0
    )
    resultado = calcular_indices_fisicos(input_data)
    assert (resultado.erro is None) == esperado
```

#### Executar Testes

```bash
# Todos os testes
pytest

# Com cobertura
pytest --cov=app --cov-report=html

# Teste específico
pytest tests/test_indices_fisicos.py::test_calculo_basico

# Modo verbose
pytest -v

# Com print
pytest -s
```

### Frontend (Jest/Vitest)

```typescript
// src/lib/__tests__/calculation-helpers.test.ts
import { describe, it, expect } from 'vitest';
import { calculateIndiceVazios } from '../calculation-helpers';

describe('calculateIndiceVazios', () => {
  it('calcula corretamente o índice de vazios', () => {
    const result = calculateIndiceVazios(0.5, 1.0);
    expect(result).toBe(0.5);
  });

  it('lança erro para volume de sólidos zero', () => {
    expect(() => {
      calculateIndiceVazios(0.5, 0);
    }).toThrow();
  });

  it('retorna null para valores inválidos', () => {
    const result = calculateIndiceVazios(-0.5, 1.0);
    expect(result).toBeNull();
  });
});
```

### Cobertura de Testes

**Metas:**
- Backend: > 80% cobertura
- Frontend: > 70% cobertura
- Funções críticas: 100% cobertura

---

## 📚 Documentação

### Documentação de Código

#### Backend

Use docstrings detalhadas:

```python
def calcular_tensao_efetiva(
    tensao_total: float,
    pressao_neutra: float
) -> float:
    """
    Calcula a tensão efetiva usando o princípio de Terzaghi.
    
    A tensão efetiva é a tensão transmitida pelos contatos entre
    as partículas sólidas do solo, responsável pela resistência
    e deformabilidade.
    
    Args:
        tensao_total: Tensão total vertical (kPa)
        pressao_neutra: Pressão neutra ou poro-pressão (kPa)
    
    Returns:
        Tensão efetiva vertical (kPa)
    
    Raises:
        ValueError: Se tensão_total < pressao_neutra
    
    Example:
        >>> calcular_tensao_efetiva(100.0, 30.0)
        70.0
    
    References:
        Terzaghi, K. (1943). Theoretical Soil Mechanics.
    """
    if tensao_total < pressao_neutra:
        raise ValueError(
            "Tensão total não pode ser menor que pressão neutra"
        )
    
    return tensao_total - pressao_neutra
```

#### Frontend

Use JSDoc/TSDoc:

```typescript
/**
 * Calcula a tensão efetiva usando o princípio de Terzaghi.
 *
 * @param tensaoTotal - Tensão total vertical (kPa)
 * @param pressaoNeutra - Pressão neutra (kPa)
 * @returns Tensão efetiva vertical (kPa)
 *
 * @throws {Error} Se tensão total < pressão neutra
 *
 * @example
 * ```ts
 * const sigmaEfetiva = calcularTensaoEfetiva(100, 30);
 * console.log(sigmaEfetiva); // 70
 * ```
 */
export function calcularTensaoEfetiva(
  tensaoTotal: number,
  pressaoNeutra: number
): number {
  if (tensaoTotal < pressaoNeutra) {
    throw new Error("Tensão total < pressão neutra");
  }
  
  return tensaoTotal - pressaoNeutra;
}
```

### README de Módulos

Ao adicionar um novo módulo, documente em `backend/docs/MODULES.md`:

- Fundamentação teórica
- Equações utilizadas
- Exemplos
- Referências

---

## 🎯 Checklist para Pull Request

Antes de submeter, verifique:

### Código

- [ ] Código segue os padrões do projeto
- [ ] Código está formatado (Black/Prettier)
- [ ] Não há erros de linting
- [ ] Type hints/types estão corretos
- [ ] Sem warnings do compilador

### Testes

- [ ] Todos os testes passam
- [ ] Adicionei testes para novas funcionalidades
- [ ] Cobertura de testes mantida ou aumentada

### Documentação

- [ ] Código está documentado (docstrings/JSDoc)
- [ ] README atualizado (se necessário)
- [ ] MODULES.md atualizado (se novo cálculo)
- [ ] CHANGELOG.md atualizado

### Git

- [ ] Commits seguem Conventional Commits
- [ ] Branch atualizada com main/upstream
- [ ] Sem merge conflicts
- [ ] Mensagens de commit descritivas

### Geral

- [ ] Funcionalidade testada manualmente
- [ ] Não quebra funcionalidades existentes
- [ ] Performance considerada
- [ ] Acessibilidade considerada (frontend)
- [ ] Responsividade testada (frontend)

---

## 🏆 Reconhecimento

Todos os contribuidores serão reconhecidos:

- Nome no README (seção Contributors)
- Menção no CHANGELOG
- Agradecimento nas release notes

---

## 📞 Dúvidas?

- **Issues**: https://github.com/seu-usuario/edusolo/issues
- **Discussions**: https://github.com/seu-usuario/edusolo/discussions
- **Email**: contribute@edusolo.com

---

## 📜 Licença

Ao contribuir, você concorda que suas contribuições serão licenciadas sob a mesma licença do projeto (MIT License).

---

<div align="center">

**Obrigado por contribuir com o EduSolo!** 🎉

Sua contribuição ajuda estudantes e profissionais do mundo inteiro.

[⬆ Voltar ao README](README.md)

</div>

