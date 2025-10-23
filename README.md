# 🏗️ EduSolo

<div align="center">

![EduSolo Banner](https://img.shields.io/badge/EduSolo-Mecânica_dos_Solos-blue?style=for-the-badge)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.109+-00a393?style=flat-square&logo=fastapi)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-18.3+-61dafb?style=flat-square&logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8+-3178c6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Python](https://img.shields.io/badge/Python-3.8+-3776ab?style=flat-square&logo=python)](https://www.python.org/)
[![License](https://img.shields.io/badge/license-MIT-green?style=flat-square)](LICENSE)

**Plataforma educacional completa para análise e aprendizado em Mecânica dos Solos**

[Demonstração](#demonstração) • [Funcionalidades](#funcionalidades) • [Instalação](#instalação) • [Documentação](#documentação) • [Contribuir](#contribuir)

</div>

---

## 📋 Sobre o Projeto

**EduSolo** é uma suíte completa de ferramentas para cálculos geotécnicos e ensino de Mecânica dos Solos. Desenvolvido com foco em educação, oferece uma interface moderna e intuitiva para estudantes, professores e profissionais da engenharia civil e geotecnia.

### 🎯 Objetivos

- 🎓 **Educação**: Facilitar o aprendizado de conceitos de mecânica dos solos
- 🧮 **Cálculos Precisos**: Fornecer ferramentas confiáveis para análises geotécnicas
- 📊 **Visualização**: Apresentar resultados de forma gráfica e intuitiva
- 🌐 **Acessibilidade**: 100% gratuito e open source
- 🔬 **Rigor Técnico**: Baseado em normas e métodos consolidados

---

## ✨ Funcionalidades

### 📐 Módulos Disponíveis

#### ✅ Implementados

1. **Índices Físicos**
   - Cálculo de peso específico (natural, seco, saturado, submerso)
   - Índice de vazios, porosidade e grau de saturação
   - Compacidade relativa
   - Diagrama de fases interativo

2. **Limites de Consistência**
   - Limite de Liquidez (LL) - Método de Casagrande
   - Limite de Plasticidade (LP)
   - Índice de Plasticidade (IP)
   - Índice de Consistência (IC)
   - Carta de Plasticidade de Casagrande
   - Atividade da argila

3. **Granulometria e Classificação**
   - Análise granulométrica completa
   - Curva granulométrica
   - Parâmetros D10, D30, D60
   - Coeficientes Cu e Cc
   - Classificação USCS (Sistema Unificado)

4. **Compactação**
   - Curva de compactação
   - Determinação de umidade ótima e γd,max
   - Curvas de saturação
   - Análise de energia Proctor

5. **Tensões Geostáticas**
   - Tensões verticais totais
   - Pressões neutras (poro-pressão)
   - Tensões efetivas verticais e horizontais
   - Análise multicamadas
   - Efeito do nível d'água e capilaridade

6. **Acréscimo de Tensões**
   - Solução de Boussinesq (carga pontual)
   - Carga em faixa infinita
   - Carga circular uniformemente distribuída
   - Análise em profundidade

7. **Fluxo Hidráulico**
   - Permeabilidade equivalente (horizontal e vertical)
   - Velocidades de descarga e percolação
   - Gradiente crítico
   - Fator de segurança contra liquefação
   - Análise de tensões sob fluxo

8. **Adensamento**
   - Recalque por adensamento primário
   - Teoria de Terzaghi
   - Tempo de adensamento
   - Curvas U vs T

#### 🚧 Em Desenvolvimento

- Resistência ao Cisalhamento
- Empuxo de Terra
- Capacidade de Carga
- Estabilidade de Taludes

---

## 🚀 Instalação

### Pré-requisitos

- **Python** 3.8+
- **Node.js** 18+
- **npm** ou **bun**

### 1️⃣ Clonar o Repositório

```bash
git clone https://github.com/seu-usuario/edusolo.git
cd edusolo
```

### 2️⃣ Backend (FastAPI)

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

# Executar servidor
uvicorn app.main:app --reload
```

A API estará disponível em: `http://localhost:8000`

Documentação interativa: `http://localhost:8000/docs`

### 3️⃣ Frontend (React + TypeScript)

```bash
cd frontend

# Instalar dependências
npm install
# ou
bun install

# Executar em modo desenvolvimento
npm run dev
# ou
bun dev
```

A aplicação estará disponível em: `http://localhost:5173`

### 4️⃣ Build para Produção

```bash
# Frontend
cd frontend
npm run build
# ou
bun run build

# Os arquivos otimizados estarão em frontend/dist
```

---

## 📚 Documentação

### Estrutura do Projeto

```
EduSolo/
├── backend/                 # API FastAPI
│   ├── app/
│   │   ├── main.py         # Entrada principal da API
│   │   ├── models.py       # Modelos Pydantic
│   │   └── modules/        # Módulos de cálculo
│   │       ├── indices_fisicos.py
│   │       ├── limites_consistencia.py
│   │       ├── granulometria.py
│   │       ├── compactacao.py
│   │       ├── tensoes_geostaticas.py
│   │       ├── acrescimo_tensoes.py
│   │       ├── fluxo_hidraulico.py
│   │       ├── recalque_adensamento.py
│   │       ├── tempo_adensamento.py
│   │       └── classificacao_uscs.py
│   ├── tests/              # Testes unitários
│   └── requirements.txt
│
├── frontend/               # Interface React
│   ├── src/
│   │   ├── pages/          # Páginas da aplicação
│   │   ├── components/     # Componentes reutilizáveis
│   │   ├── lib/            # Utilitários e helpers
│   │   ├── hooks/          # React hooks personalizados
│   │   └── contexts/       # Context API
│   └── package.json
│
└── README.md
```

### Documentação Detalhada

- 📘 [Backend - Documentação da API](backend/README.md)
- 📗 [Frontend - Guia de Desenvolvimento](frontend/README.md)
- 📙 [Módulos de Cálculo](backend/docs/MODULES.md)
- 📕 [Guia de Contribuição](CONTRIBUTING.md)

---

## 🧪 Testes

### Backend

```bash
cd backend
pytest tests/
```

### Frontend

```bash
cd frontend
npm run lint
```

---

## 🛠️ Tecnologias Utilizadas

### Backend

- **FastAPI** - Framework web moderno para APIs
- **Pydantic** - Validação de dados
- **NumPy** - Cálculos numéricos
- **Uvicorn** - Servidor ASGI

### Frontend

- **React 18** - Biblioteca UI
- **TypeScript** - Tipagem estática
- **Vite** - Build tool
- **TanStack Query** - Gerenciamento de estado assíncrono
- **Recharts** - Gráficos interativos
- **Radix UI** - Componentes acessíveis
- **Tailwind CSS** - Estilização
- **shadcn/ui** - Sistema de componentes

---

## 🤝 Contribuir

Contribuições são bem-vindas! Veja o [Guia de Contribuição](CONTRIBUTING.md) para mais detalhes.

### Como Contribuir

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/MinhaFeature`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova feature'`)
4. Push para a branch (`git push origin feature/MinhaFeature`)
5. Abra um Pull Request

---

## 📝 Roadmap

### Fase 1 ✅ (Concluída)

- [x] Índices Físicos
- [x] Limites de Consistência
- [x] Interface básica

### Fase 2 🚧 (Em Andamento)

- [x] Granulometria
- [x] Compactação
- [x] Tensões Geostáticas
- [x] Acréscimo de Tensões
- [x] Fluxo Hidráulico
- [x] Adensamento
- [ ] Sistema de autenticação
- [ ] Salvamento de cálculos

### Fase 3 📋 (Planejado)

- [ ] Resistência ao Cisalhamento
- [ ] Empuxo de Terra
- [ ] Capacidade de Carga
- [ ] Estabilidade de Taludes
- [ ] Geração de relatórios PDF
- [ ] API de exportação de dados

### Fase 4 🔮 (Futuro)

- [ ] Aplicativo mobile
- [ ] Modo offline
- [ ] Integração com CAD
- [ ] Machine Learning para predições

---

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

---

## 👥 Autores

- **Desenvolvedor Principal** - *Desenvolvimento inicial* - [Seu Nome](https://github.com/seu-usuario)

---

## 🙏 Agradecimentos

- Comunidade de Engenharia Geotécnica
- Contribuidores do projeto
- Professores e alunos que forneceram feedback

---

## 📞 Contato

- **Email**: contato@edusolo.com
- **Website**: https://edusolo.com
- **GitHub**: https://github.com/seu-usuario/edusolo

---

<div align="center">

**Desenvolvido com ❤️ para a comunidade de Engenharia Civil e Geotecnia**

[⬆ Voltar ao topo](#-edusolo)

</div>

