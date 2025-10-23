"""
Constantes físicas e valores padrão para cálculos geotécnicos.

Este módulo centraliza todos os valores constantes usados nos cálculos,
facilitando manutenção e garantindo consistência.
"""

# ============================================================================
# CONSTANTES FÍSICAS
# ============================================================================

# Peso específico da água
PESO_ESPECIFICO_AGUA_PADRAO = 10.0  # kN/m³
PESO_ESPECIFICO_AGUA_CGS = 1.0      # g/cm³
PESO_ESPECIFICO_AGUA_SI = 9810.0    # N/m³

# Aceleração da gravidade
GRAVIDADE = 9.81  # m/s²

# Epsilon para comparações de ponto flutuante
EPSILON = 1e-9
EPSILON_PORCENTAGEM = 0.1  # 0.1%

# ============================================================================
# LIMITES FÍSICOS PARA SOLOS
# ============================================================================

# Densidade relativa dos grãos (Gs)
GS_MIN = 2.0   # Solos orgânicos/leves
GS_MAX = 3.5   # Minerais pesados
GS_PADRAO_AREIA = 2.65
GS_PADRAO_ARGILA = 2.70
GS_PADRAO_SILTE = 2.68

# Índice de vazios
INDICE_VAZIOS_MIN = 0.0
INDICE_VAZIOS_MAX = 10.0  # Limite razoável para solos naturais
INDICE_VAZIOS_AREIA_COMPACTA = 0.4
INDICE_VAZIOS_AREIA_FOFA = 1.0
INDICE_VAZIOS_ARGILA_COMPACTA = 0.6
INDICE_VAZIOS_ARGILA_MOLE = 2.0

# Porosidade
POROSIDADE_MIN = 0.0
POROSIDADE_MAX = 100.0  # %

# Umidade
UMIDADE_MIN = 0.0
UMIDADE_MAX = 1000.0  # % (limite razoável, solos moles podem ter > 100%)

# Grau de saturação
GRAU_SATURACAO_MIN = 0.0
GRAU_SATURACAO_MAX = 100.0  # %

# ============================================================================
# GRANULOMETRIA - LIMITES DE PENEIRAS (mm)
# ============================================================================

# Limites de frações granulométricas (ABNT)
LIMITE_PEDREGULHO_AREIA = 4.76   # Peneira #4
LIMITE_AREIA_FINOS = 0.075       # Peneira #200
LIMITE_SILTE_ARGILA = 0.002      # Sedimentação

# Classificação detalhada
LIMITE_PEDREGULHO_GROSSO = 60.0
LIMITE_PEDREGULHO_MEDIO = 20.0
LIMITE_PEDREGULHO_FINO = 6.0
LIMITE_AREIA_GROSSA = 2.0
LIMITE_AREIA_MEDIA = 0.6
LIMITE_AREIA_FINA = 0.2
LIMITE_SILTE_GROSSO = 0.06
LIMITE_SILTE_MEDIO = 0.02
LIMITE_SILTE_FINO = 0.006

# ============================================================================
# LIMITES DE ATTERBERG
# ============================================================================

# Limite de Liquidez
LL_MIN = 0.0
LL_MAX = 200.0  # % (solos muito plásticos)
LL_PLASTICIDADE_BAIXA = 50.0

# Limite de Plasticidade
LP_MIN = 0.0
LP_MAX = 100.0  # %

# Índice de Plasticidade
IP_MIN = 0.0
IP_MAX = 150.0  # %
IP_NAO_PLASTICO = 0.0
IP_PLASTICIDADE_BAIXA = 7.0
IP_PLASTICIDADE_MEDIA = 15.0

# Índice de Consistência
IC_MUITO_MOLE = 0.0
IC_MOLE = 0.5
IC_MEDIA = 0.75
IC_RIJA = 1.0
IC_DURA = 1.5

# Atividade da argila
ATIVIDADE_INATIVA = 0.75
ATIVIDADE_NORMAL = 1.25
ATIVIDADE_ATIVA = 1.25  # > 1.25

# ============================================================================
# CLASSIFICAÇÃO USCS
# ============================================================================

# Percentuais para classificação
USCS_LIMITE_GROSSO_FINO = 50.0              # % passante #200
USCS_LIMITE_PEDREGULHO_AREIA = 50.0         # % retido #4
USCS_FINOS_MINIMO_DUPLA = 5.0               # %
USCS_FINOS_MAXIMO_DUPLA = 12.0              # %

# Coeficientes de uniformidade e curvatura
USCS_CU_BEM_GRADUADA_PEDREGULHO = 4.0
USCS_CU_BEM_GRADUADA_AREIA = 6.0
USCS_CC_MIN = 1.0
USCS_CC_MAX = 3.0

# ============================================================================
# COMPACTAÇÃO
# ============================================================================

# Energia de compactação (kN·m/m³)
ENERGIA_PROCTOR_NORMAL = 600.0
ENERGIA_PROCTOR_MODIFICADO = 2700.0
ENERGIA_PROCTOR_INTERMEDIARIO = 1280.0

# Grau de compactação típico
GRAU_COMPACTACAO_MIN_ATERRO = 95.0  # %
GRAU_COMPACTACAO_MIN_SUBLEITO = 100.0  # %

# ============================================================================
# TENSÕES E DEFORMAÇÕES
# ============================================================================

# Coeficiente de empuxo em repouso (K0)
K0_PADRAO = 0.5
K0_AREIA_COMPACTA = 0.4
K0_AREIA_FOFA = 0.6
K0_ARGILA_NC = 0.5  # Normalmente adensada
K0_ARGILA_OC = 0.7  # Sobreadensada

# Altura capilar típica (m)
ALTURA_CAPILAR_AREIA_GROSSA = 0.05
ALTURA_CAPILAR_AREIA_FINA = 0.30
ALTURA_CAPILAR_SILTE = 1.00
ALTURA_CAPILAR_ARGILA = 3.00

# ============================================================================
# PERMEABILIDADE (cm/s)
# ============================================================================

K_PEDREGULHO_LIMPO = 1.0e0       # > 10^-1
K_AREIA_LIMPA = 1.0e-2           # 10^-3 a 10^-1
K_AREIA_FINA = 1.0e-4            # 10^-5 a 10^-3
K_SILTE = 1.0e-6                 # 10^-7 a 10^-5
K_ARGILA = 1.0e-8                # < 10^-7
K_ARGILA_COMPACTA = 1.0e-10

# ============================================================================
# ADENSAMENTO
# ============================================================================

# Índice de compressão típico (Cc)
CC_AREIA = 0.05
CC_SILTE = 0.15
CC_ARGILA_RIJA = 0.30
CC_ARGILA_MOLE = 0.50

# Coeficiente de adensamento típico (cv - cm²/s)
CV_AREIA = 1.0e-2
CV_SILTE = 1.0e-4
CV_ARGILA = 1.0e-6

# ============================================================================
# RESISTÊNCIA AO CISALHAMENTO
# ============================================================================

# Ângulo de atrito típico (graus)
PHI_AREIA_FOFA = 28.0
PHI_AREIA_COMPACTA = 40.0
PHI_PEDREGULHO = 35.0
PHI_SILTE = 25.0
PHI_ARGILA_SATURADA = 0.0  # Condição não-drenada

# Coesão típica (kPa)
C_AREIA = 0.0
C_SILTE = 10.0
C_ARGILA_MOLE = 20.0
C_ARGILA_RIJA = 100.0

# ============================================================================
# FATORES DE SEGURANÇA MÍNIMOS
# ============================================================================

FS_MIN_FUNDACAO = 3.0
FS_MIN_TALUDE = 1.5
FS_MIN_LIQUEFACAO = 1.5
FS_MIN_MURO_ARRIMO = 2.0

# ============================================================================
# PRECISÃO DE CÁLCULOS
# ============================================================================

PRECISAO_INDICES_FISICOS = 3        # casas decimais
PRECISAO_TENSOES = 2                # casas decimais
PRECISAO_PERCENTUAL = 2             # casas decimais
PRECISAO_DIAMETRO = 4               # casas decimais (D10, D30, D60)
PRECISAO_COEFICIENTES = 3           # casas decimais (Cu, Cc)

# ============================================================================
# LIMITES DE API
# ============================================================================

MAX_CAMADAS_PERFIL = 50              # Máximo de camadas em um perfil
MAX_PONTOS_ENSAIO = 100              # Máximo de pontos em um ensaio
MAX_PENEIRAS = 50                    # Máximo de peneiras em granulometria
MAX_PROFUNDIDADE_CALCULO = 100.0     # m

# ============================================================================
# MENSAGENS PADRÃO
# ============================================================================

MSG_DADOS_INSUFICIENTES = "Dados insuficientes para realizar o cálculo."
MSG_VALOR_FORA_LIMITE = "Valor fora dos limites físicos aceitáveis."
MSG_ERRO_CALCULO = "Erro durante o processamento do cálculo."
MSG_CLASSIFICACAO_IMPOSSIVEL = "Não foi possível classificar o solo com os dados fornecidos."

# ============================================================================
# CLASSIFICAÇÃO DE COMPACIDADE RELATIVA (Dr - %)
# ============================================================================

COMPACIDADE_CLASSES = {
    'Muito fofa': (0, 15),
    'Fofa': (15, 35),
    'Medianamente compacta': (35, 65),
    'Compacta': (65, 85),
    'Muito compacta': (85, 100)
}

# ============================================================================
# CLASSIFICAÇÃO DE CONSISTÊNCIA (IC)
# ============================================================================

CONSISTENCIA_CLASSES = {
    'Muito mole': (float('-inf'), 0.0),
    'Mole': (0.0, 0.5),
    'Média': (0.5, 0.75),
    'Rija': (0.75, 1.0),
    'Muito rija': (1.0, 1.5),
    'Dura': (1.5, float('inf'))
}

