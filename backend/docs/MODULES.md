# 📐 Documentação dos Módulos de Cálculo - EduSolo

Este documento detalha a fundamentação teórica e implementação de cada módulo de cálculo do EduSolo.

## 📑 Índice

1. [Índices Físicos](#1-índices-físicos)
2. [Limites de Consistência](#2-limites-de-consistência)
3. [Granulometria](#3-granulometria)
4. [Classificação USCS](#4-classificação-uscs)
5. [Compactação](#5-compactação)
6. [Tensões Geostáticas](#6-tensões-geostáticas)
7. [Acréscimo de Tensões](#7-acréscimo-de-tensões)
8. [Fluxo Hidráulico](#8-fluxo-hidráulico)
9. [Recalque por Adensamento](#9-recalque-por-adensamento)
10. [Tempo de Adensamento](#10-tempo-de-adensamento)

---

## 1. Índices Físicos

### 📚 Fundamentação Teórica

Os índices físicos caracterizam o estado do solo através das relações entre as três fases: sólida, líquida e gasosa.

### 🔢 Parâmetros Fundamentais

#### Pesos Específicos

**Peso Específico Natural (γₙₐₜ)**
```
γₙₐₜ = W_total / V_total
```

**Peso Específico Seco (γd)**
```
γd = W_sólidos / V_total
γd = γₙₐₜ / (1 + w)
```

**Peso Específico Saturado (γsₐₜ)**
```
γsₐₜ = (Gs + e) / (1 + e) × γw
```

**Peso Específico Submerso (γ' ou γsᵤb)**
```
γ' = γsₐₜ - γw
γ' = (Gs - 1) / (1 + e) × γw
```

#### Índices de Vazios e Porosidade

**Índice de Vazios (e)**
```
e = V_vazios / V_sólidos
e = (Gs × γw / γd) - 1
```

**Porosidade (n)**
```
n = V_vazios / V_total × 100%
n = e / (1 + e) × 100%
```

#### Umidade e Saturação

**Teor de Umidade (w)**
```
w = W_água / W_sólidos × 100%
```

**Grau de Saturação (S)**
```
S = V_água / V_vazios × 100%
S = w × Gs / e × 100%
```

#### Compacidade Relativa

**Compacidade Relativa (Dr)**
```
Dr = (eₘₐₓ - e) / (eₘₐₓ - eₘᵢₙ) × 100%
```

**Classificação:**
- Dr < 15%: Muito Fofa
- 15% ≤ Dr < 35%: Fofa
- 35% ≤ Dr < 65%: Medianamente Compacta
- 65% ≤ Dr < 85%: Compacta
- Dr ≥ 85%: Muito Compacta

### 🔧 Implementação

**Arquivo**: `backend/app/modules/indices_fisicos.py`

**Principais Funções:**
- `calcular_indices_fisicos(dados: IndicesFisicosInput) -> IndicesFisicosOutput`
- `calcular_compacidade_relativa(e, emax, emin)`

### 📊 Diagrama de Fases

```
┌─────────────┐
│     Ar      │  Va
│   (vazio)   │
├─────────────┤
│    Água     │  Vw
├─────────────┤
│             │
│   Sólidos   │  Vs
│             │
└─────────────┘
```

---

## 2. Limites de Consistência

### 📚 Fundamentação Teórica

Os Limites de Atterberg definem os estados de consistência dos solos finos (argilas e siltes).

### 🔢 Limites e Índices

#### Limite de Liquidez (LL)

Determinado pelo **Aparelho de Casagrande**:
- Sulco fecha com **25 golpes**
- Relação entre número de golpes e umidade

**Equação de regressão:**
```
w = a - b × log₁₀(N)
```
onde:
- w = umidade (%)
- N = número de golpes
- a, b = coeficientes da regressão

**LL é o valor de w para N = 25 golpes**

#### Limite de Plasticidade (LP)

Umidade na qual o solo começa a fissurar ao ser moldado em cilindro de ~3mm de diâmetro.

#### Índice de Plasticidade (IP)

```
IP = LL - LP
```

**Classificação:**
- IP < 1%: Não plástico
- 1% ≤ IP < 7%: Baixa plasticidade
- 7% ≤ IP < 15%: Média plasticidade
- IP ≥ 15%: Alta plasticidade

#### Índice de Consistência (IC)

```
IC = (LL - w) / IP
```

**Classificação:**
- IC < 0: Líquida
- 0 ≤ IC < 0.5: Muito Mole
- 0.5 ≤ IC < 0.75: Mole
- 0.75 ≤ IC < 1.0: Média
- IC ≥ 1.0: Dura/Rija

#### Atividade da Argila (Ia)

```
Ia = IP / % Argila (< 0.002 mm)
```

**Classificação (Skempton):**
- Ia < 0.75: Argila Inativa
- 0.75 ≤ Ia ≤ 1.25: Argila Normal
- Ia > 1.25: Argila Ativa

### 📈 Carta de Plasticidade (Casagrande)

**Linha A:**
```
IP = 0.73 × (LL - 20)
```

**Linha U (Limite superior):**
```
IP = 0.9 × (LL - 8)
```

**Classificação:**
- Acima da Linha A: Argilas (C)
- Abaixo da Linha A: Siltes (M)
- LL < 50%: Baixa compressibilidade (L)
- LL ≥ 50%: Alta compressibilidade (H)

### 🔧 Implementação

**Arquivo**: `backend/app/modules/limites_consistencia.py`

**Principais Funções:**
- `calcular_limites_consistencia(dados: LimitesConsistenciaInput)`
- `calcular_limite_liquidez(pontos: List[PontoEnsaioLL])`
- `classificar_plasticidade(ip: float)`
- `classificar_consistencia(ic: float)`
- `calcular_atividade_argila(ip: float, perc_argila: float)`

---

## 3. Granulometria

### 📚 Fundamentação Teórica

Análise granulométrica determina a distribuição do tamanho das partículas no solo.

### 🔢 Classificação por Tamanho

**ABNT/ASTM:**
- **Pedregulho**: 4.76 mm a 76 mm
- **Areia**: 0.075 mm a 4.76 mm
  - Areia grossa: 2.0 a 4.76 mm
  - Areia média: 0.42 a 2.0 mm
  - Areia fina: 0.075 a 0.42 mm
- **Finos (Silte + Argila)**: < 0.075 mm

### 📏 Peneiras Padrão ASTM

| Peneira | Abertura (mm) |
|---------|---------------|
| 3"      | 76.2          |
| 2"      | 50.8          |
| 1½"     | 38.1          |
| 1"      | 25.4          |
| ¾"      | 19.0          |
| ½"      | 12.7          |
| ⅜"      | 9.5           |
| #4      | 4.75          |
| #10     | 2.00          |
| #20     | 0.84          |
| #40     | 0.42          |
| #60     | 0.25          |
| #100    | 0.149         |
| #200    | 0.075         |

### 📊 Curva Granulométrica

Gráfico semi-log:
- **Eixo X**: Diâmetro das partículas (escala logarítmica)
- **Eixo Y**: Porcentagem passante (%)

### 🔢 Parâmetros Característicos

#### Diâmetros Efetivos

- **D₁₀**: Diâmetro efetivo (10% passante)
- **D₃₀**: Diâmetro correspondente a 30% passante
- **D₆₀**: Diâmetro correspondente a 60% passante

#### Coeficiente de Uniformidade (Cu)

```
Cu = D₆₀ / D₁₀
```

**Interpretação:**
- Cu < 4: Mal graduado (uniforme)
- Cu > 4: Bem graduado

#### Coeficiente de Curvatura (Cc)

```
Cc = (D₃₀)² / (D₁₀ × D₆₀)
```

**Para solo bem graduado:**
```
1 ≤ Cc ≤ 3
```

### 🔧 Implementação

**Arquivo**: `backend/app/modules/granulometria.py`

**Principais Funções:**
- `calcular_granulometria(dados: GranulometriaInput)`
- `calcular_porcentagens_granulometricas(dados)`
- `interpolar_diametro_efetivo(dados, porcentagem_passante)`
- `calcular_coeficientes(d10, d30, d60)`

---

## 4. Classificação USCS

### 📚 Fundamentação Teórica

Sistema Unificado de Classificação de Solos (Unified Soil Classification System).

### 🔢 Grupos Principais

#### Solos Grossos (> 50% retido na #200)

**Pedregulho (G)** - > 50% da fração grossa retida na #4

- **GW**: Pedregulho bem graduado
  - Menos de 5% de finos
  - Cu ≥ 4 e 1 ≤ Cc ≤ 3

- **GP**: Pedregulho mal graduado
  - Menos de 5% de finos
  - Não satisfaz critérios de GW

- **GM**: Pedregulho siltoso
  - 12% ou mais de finos
  - Finos abaixo da Linha A ou IP < 4

- **GC**: Pedregulho argiloso
  - 12% ou mais de finos
  - Finos acima da Linha A e IP ≥ 7

**Areia (S)** - ≥ 50% da fração grossa passa na #4

- **SW**: Areia bem graduada
- **SP**: Areia mal graduada
- **SM**: Areia siltosa
- **SC**: Areia argilosa

#### Solos Finos (≥ 50% passa na #200)

**Silte (M)** - Abaixo da Linha A

- **ML**: Silte de baixa compressibilidade (LL < 50)
- **MH**: Silte de alta compressibilidade (LL ≥ 50)

**Argila (C)** - Acima da Linha A

- **CL**: Argila de baixa compressibilidade (LL < 50)
- **CH**: Argila de alta compressibilidade (LL ≥ 50)

**Orgânico (O)**

- **OL**: Silte/argila orgânica (LL < 50)
- **OH**: Argila orgânica (LL ≥ 50)

**Turfa (Pt)**

- Solo altamente orgânico

### 📈 Linha A (Carta de Plasticidade)

```
IP = 0.73 × (LL - 20)
```

### 🔧 Implementação

**Arquivo**: `backend/app/modules/classificacao_uscs.py`

**Principais Funções:**
- `classificar_uscs(dados: ClassificacaoUSCSInput)`
- `classificar_solo_grosso(p200, p4, Cu, Cc, ll, ip)`
- `classificar_solo_fino(ll, ip, is_organico)`

---

## 5. Compactação

### 📚 Fundamentação Teórica

Ensaio Proctor determina a relação entre umidade e densidade do solo compactado.

### 🔢 Energia de Compactação

**Proctor Normal:**
- Número de camadas: 3
- Golpes por camada: 26
- Peso do soquete: 2.5 kg
- Altura de queda: 30 cm
- Energia: ~600 kN·m/m³

**Proctor Modificado:**
- Número de camadas: 5
- Golpes por camada: 27
- Peso do soquete: 4.5 kg
- Altura de queda: 45 cm
- Energia: ~2700 kN·m/m³

### 📊 Curva de Compactação

Relaciona:
- **Eixo X**: Umidade (w%)
- **Eixo Y**: Peso específico seco (γd)

**Pontos notáveis:**
- **w_ot**: Umidade ótima
- **γd,max**: Peso específico seco máximo

### 🔢 Curva de Saturação

Para um dado Gs, a curva teórica de S = 100%:

```
γd = (Gs × γw) / (1 + w × Gs / 100)
```

### 📈 Linha de Saturação para diferentes graus

```
γd = (Gs × γw × S/100) / (1 + w × Gs / 100)
```

### 🔧 Implementação

**Arquivo**: `backend/app/modules/compactacao.py`

**Principais Funções:**
- `calcular_compactacao(dados: CompactacaoInput)`
- `processar_ponto_ensaio(ponto: PontoEnsaioCompactacao)`
- `encontrar_ponto_otimo(pontos)`
- `gerar_curva_saturacao(Gs, gamma_w, S=100)`

**Método de Otimização:**
- Regressão polinomial (grau 2 ou 3)
- Encontra o vértice da parábola

---

## 6. Tensões Geostáticas

### 📚 Fundamentação Teórica

Análise de tensões em maciços de solo devido ao peso próprio e presença de água.

### 🔢 Equações Fundamentais

#### Tensão Total Vertical (σᵥ)

```
σᵥ = Σ (γᵢ × hᵢ)
```

onde:
- γᵢ = peso específico da camada i
- hᵢ = espessura da camada i

#### Pressão Neutra (u)

**Abaixo do NA:**
```
u = γw × h_abaixo_NA
```

**Zona Capilar (saturada):**
```
u = -γw × h_capilar
```

**Acima da zona capilar:**
```
u = 0
```

#### Tensão Efetiva Vertical (σ'ᵥ)

**Princípio de Terzaghi:**
```
σ'ᵥ = σᵥ - u
```

#### Tensão Efetiva Horizontal (σ'ₕ)

```
σ'ₕ = K₀ × σ'ᵥ
```

onde K₀ é o coeficiente de empuxo em repouso:

**Fórmula de Jaky (areias normalmente adensadas):**
```
K₀ = 1 - sen(φ')
```

**Típico:**
- Areias: K₀ ≈ 0.4 a 0.5
- Argilas NC: K₀ ≈ 0.5 a 0.6
- Argilas SA: K₀ pode ser > 1

### 🔧 Implementação

**Arquivo**: `backend/app/modules/tensoes_geostaticas.py`

**Principais Funções:**
- `calcular_tensoes_geostaticas(dados: TensoesGeostaticasInput)`
- `calcular_tensao_total_vertical(camadas, z)`
- `calcular_pressao_neutra(z, z_na, h_cap, gamma_w)`
- `calcular_tensao_efetiva(sigma_v, u)`

---

## 7. Acréscimo de Tensões

### 📚 Fundamentação Teórica

Cálculo de acréscimos de tensão no solo devido a carregamentos externos.

### 🔢 Soluções Elásticas

#### 1. Carga Pontual - Solução de Boussinesq (1885)

Para carga pontual P aplicada na superfície:

```
Δσᵥ = (3P / 2π) × (z³ / R⁵)
```

onde:
- R = √(x² + y² + z²)
- z = profundidade
- x, y = coordenadas horizontais

**Fator de Influência:**
```
I = 3 / (2π) × (1 / (1 + (r/z)²)^(5/2))
Δσᵥ = P × I / z²
```

#### 2. Carga em Faixa Infinita

Faixa de largura b com pressão uniforme p:

```
Δσᵥ = (p/π) × (α + sen(α) × cos(α + 2β))
```

onde α e β são ângulos geométricos.

**Caso especial - abaixo do centro:**
```
Δσᵥ = (2p/π) × (α + sen(α) × cos(α))
α = arctan(b / 2z)
```

#### 3. Carga Circular Uniformemente Distribuída

Círculo de raio R com pressão p:

**Abaixo do centro (r = 0):**
```
Δσᵥ = p × [1 - (1 / (1 + (R/z)²)^(3/2))]
```

**Fora do centro (r > 0):**
Usa cartas de Newmark ou integração numérica.

### 🔧 Implementação

**Arquivo**: `backend/app/modules/acrescimo_tensoes.py`

**Principais Funções:**
- `calcular_acrescimo_tensoes(dados: AcrescimoTensoesInput)`
- `boussinesq_pontual(P, x, y, z)`
- `carga_faixa_infinita(p, b, x, z)`
- `carga_circular(p, R, r, z)`

---

## 8. Fluxo Hidráulico

### 📚 Fundamentação Teórica

Análise de fluxo unidimensional em solos saturados.

### 🔢 Equações Fundamentais

#### Lei de Darcy

```
v = k × i
```

onde:
- v = velocidade de descarga (m/s)
- k = coeficiente de permeabilidade (m/s)
- i = gradiente hidráulico (adimensional)

#### Gradiente Hidráulico

```
i = Δh / L
```

onde:
- Δh = perda de carga
- L = comprimento do percurso

#### Velocidade de Fluxo (Percolação)

```
vf = v / n = k × i / n
```

onde n é a porosidade.

#### Permeabilidade Equivalente

**Fluxo Horizontal (paralelo às camadas):**
```
kₕ,eq = (Σ kᵢ × hᵢ) / H
```

**Fluxo Vertical (perpendicular às camadas):**
```
kᵥ,eq = H / (Σ hᵢ/kᵢ)
```

onde:
- kᵢ = permeabilidade da camada i
- hᵢ = espessura da camada i
- H = espessura total

### 🔢 Gradiente Crítico e Liquefação

#### Gradiente Crítico

Condição de areia movediça (fluxo ascendente):

```
i_crit = γ' / γw = (γ_sat - γw) / γw
```

Para Gs ≈ 2.65 e e ≈ 0.65:
```
i_crit ≈ 1.0
```

#### Fator de Segurança

```
FS = i_crit / i_atuante
```

**Critérios:**
- FS > 3: Muito seguro
- FS = 2 a 3: Seguro
- FS < 2: Atenção necessária
- FS < 1: Liquefação/Piping

### 🔧 Implementação

**Arquivo**: `backend/app/modules/fluxo_hidraulico.py`

**Principais Funções:**
- `calcular_permeabilidade_equivalente(camadas, direcao)`
- `calcular_velocidades_fluxo(k, i, n)`
- `calcular_gradiente_critico(gamma_sat, gamma_w)`
- `calcular_fs_liquefacao(i_crit, i_atuante)`
- `calcular_tensoes_com_fluxo(profundidades, camadas, ...)`

---

## 9. Recalque por Adensamento

### 📚 Fundamentação Teórica

Teoria de Terzaghi para adensamento primário unidimensional.

### 🔢 Estados de Adensamento

#### Solo Normalmente Adensado (NC)

```
σ'₀ = σ'p
```

onde:
- σ'₀ = tensão efetiva inicial
- σ'p = tensão de pré-adensamento

#### Solo Sobreadensado (SA)

```
σ'₀ < σ'p
```

**Razão de Pré-Adensamento (RPA):**
```
RPA = σ'p / σ'₀
```

**Classificação:**
- RPA = 1: Normalmente Adensado
- 1 < RPA < 2: Levemente Sobreadensado
- RPA ≥ 2: Sobreadensado

### 🔢 Cálculo de Recalque

#### Caso 1: Solo NC (σ'₀ + Δσ ≤ σ'p)

```
ρ = (Cc / (1 + e₀)) × H × log₁₀((σ'₀ + Δσ) / σ'₀)
```

#### Caso 2: Solo SA permanece SA (σ'₀ + Δσ ≤ σ'p)

```
ρ = (Cr / (1 + e₀)) × H × log₁₀((σ'₀ + Δσ) / σ'₀)
```

#### Caso 3: Solo SA passa a NC (σ'₀ + Δσ > σ'p)

```
ρ = (Cr / (1 + e₀)) × H × log₁₀(σ'p / σ'₀) +
    (Cc / (1 + e₀)) × H × log₁₀((σ'₀ + Δσ) / σ'p)
```

onde:
- ρ = recalque (m)
- H = espessura da camada (m)
- e₀ = índice de vazios inicial
- Cc = índice de compressão
- Cr = índice de recompressão
- σ'₀ = tensão efetiva inicial
- σ'p = tensão de pré-adensamento
- Δσ = acréscimo de tensão

### 📊 Ensaio Oedométrico

Determina:
- **Cc**: Inclinação do trecho virgem (log σ' vs e)
- **Cr**: Inclinação do trecho de recompressão
- **σ'p**: Método de Casagrande ou Pacheco Silva

**Valores Típicos de Cc:**
- Areias: 0.01 a 0.10
- Siltes: 0.10 a 0.30
- Argilas: 0.20 a 1.50
- Argilas orgânicas: > 1.50

### 🔧 Implementação

**Arquivo**: `backend/app/modules/recalque_adensamento.py`

**Principais Funções:**
- `calcular_recalque_adensamento(dados: RecalqueAdensamentoInput)`
- `calcular_deformacao_volumetrica(recalque, H)`
- `determinar_estado_adensamento(sigma_0, sigma_p, sigma_f)`

---

## 10. Tempo de Adensamento

### 📚 Fundamentação Teórica

Tempo necessário para ocorrer determinado percentual do recalque total.

### 🔢 Teoria de Terzaghi

#### Fator Tempo (Tv)

```
Tv = (cv × t) / Hdr²
```

onde:
- cv = coeficiente de adensamento (m²/ano)
- t = tempo (anos)
- Hdr = altura de drenagem (m)

**Altura de Drenagem:**
- Drenagem dupla: Hdr = H/2
- Drenagem simples: Hdr = H

#### Grau de Adensamento Médio (U%)

**Para U ≤ 60%:**
```
U = (4/π) × √Tv × 100%
ou
Tv = (π/4) × (U/100)²
```

**Para U > 60%:**
```
Tv = -0.9332 × log₁₀(1 - U/100) - 0.0851
```

ou tabela:

| U (%) | Tv     |
|-------|--------|
| 10    | 0.008  |
| 20    | 0.031  |
| 30    | 0.071  |
| 40    | 0.126  |
| 50    | 0.197  |
| 60    | 0.287  |
| 70    | 0.403  |
| 80    | 0.567  |
| 90    | 0.848  |
| 95    | 1.129  |
| 99    | 1.781  |

#### Recalque no Tempo t

```
ρ(t) = U × ρ_total
```

### 🔢 Coeficiente de Adensamento (cv)

Determinado por ensaio oedométrico:

**Método de Taylor (√t):**
```
cv = (0.848 × Hdr²) / t₉₀
```

**Método de Casagrande (log t):**
```
cv = (0.197 × Hdr²) / t₅₀
```

**Valores Típicos:**
- Areias: cv > 1 m²/ano
- Siltes: cv = 0.1 a 1 m²/ano
- Argilas: cv = 0.001 a 0.1 m²/ano

### 🔧 Implementação

**Arquivo**: `backend/app/modules/tempo_adensamento.py`

**Principais Funções:**
- `calcular_tempo_adensamento(dados: TempoAdensamentoInput)`
- `calcular_fator_tempo(U)`
- `calcular_grau_adensamento(Tv)`
- `calcular_tempo_para_U(cv, Hdr, U)`
- `calcular_recalque_no_tempo(rho_total, U)`

---

## 📚 Referências Bibliográficas

### Livros Fundamentais

1. **Pinto, C. S.** (2006). *Curso Básico de Mecânica dos Solos*. 3ª ed. São Paulo: Oficina de Textos.

2. **Caputo, H. P.** (1988). *Mecânica dos Solos e suas Aplicações*. 6ª ed. Rio de Janeiro: LTC.

3. **Das, B. M.** (2016). *Principles of Geotechnical Engineering*. 8th ed. Cengage Learning.

4. **Lambe, T. W.; Whitman, R. V.** (1979). *Soil Mechanics*. John Wiley & Sons.

5. **Terzaghi, K.; Peck, R. B.; Mesri, G.** (1996). *Soil Mechanics in Engineering Practice*. 3rd ed. John Wiley & Sons.

### Normas Técnicas

- **ABNT NBR 6457** - Amostras de solo - Preparação para ensaios
- **ABNT NBR 6458** - Grãos de pedregulho retidos na peneira de abertura 4,8 mm
- **ABNT NBR 6459** - Solo - Determinação do limite de liquidez
- **ABNT NBR 7180** - Solo - Determinação do limite de plasticidade
- **ABNT NBR 7181** - Solo - Análise granulométrica
- **ABNT NBR 7182** - Solo - Ensaio de compactação
- **ABNT NBR 12007** - Solo - Ensaio de adensamento unidimensional
- **ASTM D422** - Standard Test Method for Particle-Size Analysis of Soils
- **ASTM D2487** - Standard Practice for Classification of Soils (USCS)
- **ASTM D698** - Standard Test Methods for Laboratory Compaction (Standard Proctor)
- **ASTM D1557** - Standard Test Methods for Laboratory Compaction (Modified Proctor)

---

## 🔗 Links Úteis

- [ABNT - Catálogo de Normas](https://www.abnt.org.br/)
- [ASTM International](https://www.astm.org/)
- [ISSMGE - International Society for Soil Mechanics](https://www.issmge.org/)
- [Geotechnical Software](https://www.geotechnicalsoftware.com/)

---

<div align="center">

**Documentação Técnica - EduSolo** 📐

[⬆ Voltar ao README Principal](../../README.md) | [Backend](../README.md)

</div>

