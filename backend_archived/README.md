# 🔧 EduSolo Backend - API Documentation

## 📋 Visão Geral

Backend da plataforma EduSolo desenvolvido com **FastAPI**, fornecendo endpoints REST para todos os cálculos geotécnicos e de mecânica dos solos.

## 🏗️ Arquitetura

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py              # Aplicação FastAPI principal
│   ├── models.py            # Modelos Pydantic (Input/Output)
│   ├── modules/             # Módulos de cálculo
│   │   ├── __init__.py
│   │   ├── indices_fisicos.py
│   │   ├── limites_consistencia.py
│   │   ├── granulometria.py
│   │   ├── compactacao.py
│   │   ├── tensoes_geostaticas.py
│   │   ├── acrescimo_tensoes.py
│   │   ├── fluxo_hidraulico.py
│   │   ├── recalque_adensamento.py
│   │   ├── tempo_adensamento.py
│   │   └── classificacao_uscs.py
│   └── database/            # Futura integração de BD
├── tests/                   # Testes unitários
│   ├── test_granulometria.py
│   └── test_fluxo_hidraulico.py
├── requirements.txt
└── README.md
```

## 🚀 Instalação e Execução

### Instalação

```bash
# Navegar para o diretório do backend
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
```

### Execução

```bash
# Desenvolvimento (com hot reload)
uvicorn app.main:app --reload

# Produção
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

### Acessar Documentação Interativa

Após executar o servidor:

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
- **OpenAPI JSON**: http://localhost:8000/openapi.json

## 📚 Dependências

- **fastapi** - Framework web moderno para APIs
- **uvicorn[standard]** - Servidor ASGI de alta performance
- **numpy** - Biblioteca para cálculos numéricos
- **pydantic** - Validação de dados e serialização
- **pytest** - Framework de testes
- **requests** - Cliente HTTP para testes

## 🔌 Endpoints da API

### 📍 Root

#### `GET /`

Verifica se a API está online.

**Response:**
```json
{
  "message": "Bem-vindo à API do EduSolo v0.4.0"
}
```

---

## 📐 Módulos de Cálculo

### 1️⃣ Índices Físicos

#### `POST /calcular/indices-fisicos`

Calcula índices físicos do solo com base em parâmetros fornecidos.

**Tags**: `Índices e Limites`

**Request Body** (`IndicesFisicosInput`):
```json
{
  "peso_total": 150.5,
  "volume_total": 75.0,
  "peso_solido": 125.0,
  "Gs": 2.65,
  "umidade": 15.0,
  "peso_especifico_agua": 10.0,
  "indice_vazios_max": 0.95,
  "indice_vazios_min": 0.45
}
```

**Response** (`IndicesFisicosOutput`):
```json
{
  "peso_especifico_natural": 20.07,
  "peso_especifico_seco": 17.45,
  "peso_especifico_saturado": 20.85,
  "peso_especifico_submerso": 10.85,
  "Gs": 2.65,
  "indice_vazios": 0.518,
  "porosidade": 34.1,
  "grau_saturacao": 76.8,
  "umidade": 15.0,
  "compacidade_relativa": 86.4,
  "classificacao_compacidade": "Muito Compacta",
  "erro": null
}
```

---

### 2️⃣ Limites de Consistência

#### `POST /calcular/limites-consistencia`

Calcula limites de Atterberg e índices de plasticidade.

**Tags**: `Índices e Limites`

**Request Body** (`LimitesConsistenciaInput`):
```json
{
  "pontos_ll": [
    {
      "num_golpes": 15,
      "massa_umida_recipiente": 45.2,
      "massa_seca_recipiente": 38.5,
      "massa_recipiente": 25.0
    },
    {
      "num_golpes": 25,
      "massa_umida_recipiente": 44.8,
      "massa_seca_recipiente": 38.9,
      "massa_recipiente": 25.0
    }
  ],
  "massa_umida_recipiente_lp": 42.3,
  "massa_seca_recipiente_lp": 40.1,
  "massa_recipiente_lp": 25.0,
  "umidade_natural": 28.0,
  "percentual_argila": 45.0
}
```

**Response** (`LimitesConsistenciaOutput`):
```json
{
  "ll": 48.5,
  "lp": 24.3,
  "ip": 24.2,
  "ic": 0.85,
  "classificacao_plasticidade": "Média Plasticidade",
  "classificacao_consistencia": "Dura",
  "atividade_argila": 0.54,
  "classificacao_atividade": "Normal",
  "pontos_grafico_ll": [...],
  "erro": null
}
```

---

### 3️⃣ Granulometria e Classificação USCS

#### `POST /analisar/granulometria`

Análise granulométrica completa com classificação USCS.

**Tags**: `Granulometria`

**Request Body** (`GranulometriaInput`):
```json
{
  "massa_total": 500.0,
  "peneiras": [
    {"abertura": 19.0, "massa_retida": 0},
    {"abertura": 9.5, "massa_retida": 25.5},
    {"abertura": 4.75, "massa_retida": 45.3},
    {"abertura": 2.0, "massa_retida": 78.2},
    {"abertura": 0.42, "massa_retida": 125.0},
    {"abertura": 0.075, "massa_retida": 98.5}
  ],
  "ll": 35.0,
  "lp": 18.0
}
```

**Response** (`GranulometriaOutput`):
```json
{
  "dados_granulometricos": [...],
  "percentagem_pedregulho": 14.16,
  "percentagem_areia": 60.54,
  "percentagem_finos": 25.3,
  "d10": 0.085,
  "d30": 0.52,
  "d60": 2.15,
  "coef_uniformidade": 25.29,
  "coef_curvatura": 1.48,
  "classificacao_uscs": "SC",
  "descricao_uscs": "Areia argilosa",
  "erro": null
}
```

#### `POST /classificar/uscs`

Classifica solo pelo Sistema Unificado (USCS).

**Tags**: `Classificação`

**Request Body** (`ClassificacaoUSCSInput`):
```json
{
  "pass_peneira_200": 25.3,
  "pass_peneira_4": 85.7,
  "ll": 35.0,
  "ip": 17.0,
  "Cu": 25.29,
  "Cc": 1.48,
  "is_organico_fino": false,
  "is_altamente_organico": false
}
```

**Response** (`ClassificacaoUSCSOutput`):
```json
{
  "classificacao": "SC",
  "descricao": "Areia argilosa",
  "erro": null
}
```

---

### 4️⃣ Compactação

#### `POST /calcular/compactacao`

Análise de curvas de compactação (Ensaio Proctor).

**Tags**: `Compactação`

**Request Body** (`CompactacaoInput`):
```json
{
  "pontos_ensaio": [
    {
      "massa_umida_total": 3850.0,
      "massa_molde": 2000.0,
      "volume_molde": 1000.0,
      "massa_umida_recipiente_w": 145.2,
      "massa_seca_recipiente_w": 135.5,
      "massa_recipiente_w": 50.0
    },
    // ... mais pontos
  ],
  "Gs": 2.68,
  "peso_especifico_agua": 10.0
}
```

**Response** (`CompactacaoOutput`):
```json
{
  "umidade_otima": 12.5,
  "peso_especifico_seco_max": 18.45,
  "pontos_curva_compactacao": [...],
  "pontos_curva_saturacao_100": [...],
  "erro": null
}
```

---

### 5️⃣ Tensões Geostáticas

#### `POST /calcular/tensoes-geostaticas`

Calcula tensões verticais, neutras e efetivas no solo.

**Tags**: `Tensões`

**Request Body** (`TensoesGeostaticasInput`):
```json
{
  "camadas": [
    {
      "espessura": 3.0,
      "gama_nat": 17.5,
      "gama_sat": 19.2,
      "Ko": 0.5
    },
    {
      "espessura": 5.0,
      "gama_nat": 18.0,
      "gama_sat": 20.1,
      "Ko": 0.45
    }
  ],
  "profundidade_na": 2.5,
  "altura_capilar": 0.5,
  "peso_especifico_agua": 10.0
}
```

**Response** (`TensoesGeostaticasOutput`):
```json
{
  "pontos_calculo": [
    {
      "profundidade": 0,
      "tensao_total_vertical": 0,
      "pressao_neutra": 0,
      "tensao_efetiva_vertical": 0,
      "tensao_efetiva_horizontal": 0
    },
    // ... mais pontos
  ],
  "erro": null
}
```

---

### 6️⃣ Acréscimo de Tensões

#### `POST /calcular/acrescimo-tensoes`

Calcula acréscimo de tensão por cargas (Boussinesq e outros métodos).

**Tags**: `Tensões`

**Tipos de Carga Suportados**:
- Carga Pontual (Boussinesq)
- Carga em Faixa Infinita
- Carga Circular

**Request Body** (`AcrescimoTensoesInput`) - Exemplo Carga Pontual:
```json
{
  "tipo_carga": "pontual",
  "ponto_interesse": {
    "x": 2.0,
    "y": 3.0,
    "z": 5.0
  },
  "carga_pontual": {
    "x": 0,
    "y": 0,
    "P": 100.0
  }
}
```

**Response** (`AcrescimoTensoesOutput`):
```json
{
  "delta_sigma_v": 2.47,
  "metodo": "Boussinesq (Carga Pontual)",
  "erro": null
}
```

---

### 7️⃣ Fluxo Hidráulico

#### `POST /analisar/fluxo-hidraulico`

Análises de fluxo hidráulico 1D em solo estratificado.

**Tags**: `Fluxo Hidráulico`

**Request Body** (`FluxoHidraulicoInput`):
```json
{
  "camadas": [
    {
      "espessura": 2.0,
      "k": 1e-5,
      "n": 0.35,
      "gamma_sat": 19.5
    },
    {
      "espessura": 3.0,
      "k": 5e-6,
      "n": 0.40,
      "gamma_sat": 18.8
    }
  ],
  "direcao_permeabilidade_equivalente": "vertical",
  "gradiente_hidraulico_aplicado": 0.8,
  "profundidades_tensao": [0, 1, 2, 3, 4, 5],
  "profundidade_na_entrada": 0,
  "profundidade_na_saida": 5,
  "direcao_fluxo_vertical": "ascendente",
  "peso_especifico_agua": 10.0
}
```

**Response** (`FluxoHidraulicoOutput`):
```json
{
  "permeabilidade_equivalente": 6.67e-6,
  "velocidade_descarga": 5.34e-6,
  "velocidade_fluxo": 1.42e-5,
  "gradiente_critico": 0.88,
  "fs_liquefacao": 1.1,
  "pontos_tensao_fluxo": [...],
  "erro": null
}
```

---

### 8️⃣ Adensamento

#### `POST /calcular/recalque-adensamento`

Calcula recalque por adensamento primário.

**Tags**: `Adensamento`

**Request Body** (`RecalqueAdensamentoInput`):
```json
{
  "espessura_camada": 5.0,
  "indice_vazios_inicial": 0.85,
  "Cc": 0.25,
  "Cr": 0.05,
  "tensao_efetiva_inicial": 100.0,
  "tensao_pre_adensamento": 150.0,
  "acrescimo_tensao": 80.0
}
```

**Response** (`RecalqueAdensamentoOutput`):
```json
{
  "recalque_total_primario": 0.245,
  "deformacao_volumetrica": 4.9,
  "tensao_efetiva_final": 180.0,
  "estado_adensamento": "Sobreadensado passando a Normalmente Adensado",
  "RPA": 1.5,
  "erro": null
}
```

#### `POST /calcular/tempo-adensamento`

Calcula tempo de adensamento (Teoria de Terzaghi).

**Tags**: `Adensamento`

**Request Body** (`TempoAdensamentoInput`):
```json
{
  "recalque_total_primario": 0.245,
  "coeficiente_adensamento": 2.5e-3,
  "altura_drenagem": 2.5,
  "grau_adensamento_medio": 90.0
}
```

**Response** (`TempoAdensamentoOutput`):
```json
{
  "tempo_calculado": 318.5,
  "recalque_no_tempo": 0.221,
  "grau_adensamento_medio_calculado": 90.0,
  "fator_tempo": 0.848,
  "erro": null
}
```

---

## 🧪 Testes

### Executar Testes

```bash
# Todos os testes
pytest

# Com cobertura
pytest --cov=app tests/

# Teste específico
pytest tests/test_granulometria.py

# Modo verboso
pytest -v
```

### Estrutura de Testes

```python
# tests/test_granulometria.py
import pytest
from app.modules.granulometria import calcular_granulometria
from app.models import GranulometriaInput, PeneiraDado

def test_granulometria_basica():
    input_data = GranulometriaInput(
        massa_total=500.0,
        peneiras=[
            PeneiraDado(abertura=4.75, massa_retida=100),
            PeneiraDado(abertura=0.075, massa_retida=200)
        ]
    )
    resultado = calcular_granulometria(input_data)
    assert resultado.erro is None
    assert resultado.percentagem_finos > 0
```

---

## 🔐 CORS

A API está configurada para aceitar requisições de qualquer origem durante o desenvolvimento:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Em produção, especificar domínios permitidos
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

⚠️ **Importante**: Em produção, configure `allow_origins` com domínios específicos.

---

## 📊 Modelos de Dados (Pydantic)

Todos os endpoints utilizam modelos Pydantic para validação de entrada e saída. Os modelos estão definidos em `app/models.py`.

### Validações Automáticas

- Tipos de dados
- Valores mínimos/máximos
- Campos obrigatórios
- Dependências entre campos
- Validações customizadas

### Exemplo de Modelo

```python
class IndicesFisicosInput(BaseModel):
    peso_total: Optional[float] = Field(None, description="Peso total da amostra (g)")
    volume_total: Optional[float] = Field(None, gt=0, description="Volume total (cm³)")
    Gs: Optional[float] = Field(None, gt=0, description="Densidade relativa dos grãos")
    umidade: Optional[float] = Field(None, ge=0, le=100, description="Teor de umidade (%)")
    # ... outros campos
```

---

## 🚀 Deploy

### Usando Docker (Recomendado)

```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY ./app ./app

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

```bash
# Build
docker build -t edusolo-backend .

# Run
docker run -p 8000:8000 edusolo-backend
```

### Deploy Manual

```bash
# Instalar dependências
pip install -r requirements.txt

# Executar com gunicorn (produção)
pip install gunicorn
gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

---

## 📈 Performance

- Utiliza **NumPy** para operações vetorizadas
- Validação eficiente com **Pydantic**
- Servidor assíncrono com **Uvicorn**
- Suporte a múltiplos workers

---

## 🔧 Configuração Avançada

### Variáveis de Ambiente

Crie um arquivo `.env`:

```env
APP_NAME=EduSolo API
APP_VERSION=0.4.0
DEBUG=False
ALLOWED_ORIGINS=https://edusolo.com,https://app.edusolo.com
```

### Logging

```python
import logging

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
```

---

## 📞 Suporte

- **Issues**: https://github.com/seu-usuario/edusolo/issues
- **Documentação**: http://localhost:8000/docs
- **Email**: backend@edusolo.com

---

## 🔄 Versionamento da API

**Versão atual**: `v0.4.0`

### Changelog

- **v0.4.0** - Adicionado módulo de Granulometria
- **v0.3.0** - Adicionados módulos de Fluxo e Classificação USCS
- **v0.2.0** - Adicionados módulos de Adensamento
- **v0.1.0** - Versão inicial com módulos básicos

---

<div align="center">

**Backend desenvolvido com FastAPI** 🚀

[⬆ Voltar ao README Principal](../README.md)

</div>

