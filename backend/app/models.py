# backend/app/models.py
from pydantic import BaseModel, Field, validator
from typing import Optional, List

# --- Constantes ---
EPSILON = 1e-9

# --- Modelos Gerais ---
# ... (PontoCurva, PontoCurvaCompactacao - inalterados) ...
class PontoCurva(BaseModel):
    x: float
    y: float

class PontoCurvaCompactacao(BaseModel):
    umidade: float
    peso_especifico_seco: float


# --- Modelos Módulo 1: Índices Físicos ---
class IndicesFisicosInput(BaseModel):
    # ... (campos existentes inalterados) ...
    peso_total: Optional[float] = Field(None, description="Peso total da amostra (ex: g)")
    volume_total: Optional[float] = Field(None, description="Volume total da amostra (ex: cm³)")
    peso_solido: Optional[float] = Field(None, description="Peso dos sólidos (seco) (ex: g)")
    peso_especifico_solidos: Optional[float] = Field(None, description="Peso específico dos grãos/sólidos (Gs * γw) (ex: g/cm³ ou kN/m³)")
    Gs: Optional[float] = Field(None, description="Densidade relativa dos grãos (adimensional)")
    umidade: Optional[float] = Field(None, description="Teor de umidade (w) em porcentagem (%)")
    indice_vazios: Optional[float] = Field(None, description="Índice de vazios (e) (adimensional)")
    porosidade: Optional[float] = Field(None, description="Porosidade (n) em porcentagem (%)")
    grau_saturacao: Optional[float] = Field(None, description="Grau de saturação (S) em porcentagem (%)")
    peso_especifico_natural: Optional[float] = Field(None, description="Peso específico natural (γnat) (ex: kN/m³)")
    peso_especifico_seco: Optional[float] = Field(None, description="Peso específico seco (γd) (ex: kN/m³)")
    peso_especifico_agua: float = Field(10.0, description="Peso específico da água (γw) (ex: kN/m³)")
    indice_vazios_max: Optional[float] = Field(None, gt=0, description="Índice de vazios máximo (emax)")
    indice_vazios_min: Optional[float] = Field(None, ge=0, description="Índice de vazios mínimo (emin)")

    @validator('indice_vazios_min')
    def check_emin_vs_emax(cls, emin, values):
        emax = values.get('indice_vazios_max')
        if emax is not None and emin is not None and emin >= emax - EPSILON:
            raise ValueError("Índice de vazios mínimo (emin) deve ser estritamente menor que o máximo (emax).")
        return emin

class IndicesFisicosOutput(BaseModel):
    # ... (campos existentes inalterados) ...
    peso_especifico_natural: Optional[float] = Field(None, description="γnat (kN/m³)")
    peso_especifico_seco: Optional[float] = Field(None, description="γd (kN/m³)")
    peso_especifico_saturado: Optional[float] = Field(None, description="γsat (kN/m³)")
    peso_especifico_submerso: Optional[float] = Field(None, description="γsub ou γ' (kN/m³)")
    peso_especifico_solidos: Optional[float] = Field(None, description="γs (kN/m³)")
    Gs: Optional[float] = Field(None, description="Densidade relativa dos grãos (adimensional)")
    indice_vazios: Optional[float] = Field(None, description="e (adimensional)")
    porosidade: Optional[float] = Field(None, description="n (%)")
    grau_saturacao: Optional[float] = Field(None, description="S (%)")
    umidade: Optional[float] = Field(None, description="w (%)")
    # --- Valores Normalizados (Vs=1) ---
    volume_solidos_norm: Optional[float] = Field(None, description="Vs normalizado (Vs=1)")
    volume_agua_norm: Optional[float] = Field(None, description="Vw normalizado (para Vs=1)")
    volume_ar_norm: Optional[float] = Field(None, description="Va normalizado (para Vs=1)")
    peso_solidos_norm: Optional[float] = Field(None, description="Ws normalizado (para Vs=1, em g se γw_gcm3=1)")
    peso_agua_norm: Optional[float] = Field(None, description="Ww normalizado (para Vs=1, em g se γw_gcm3=1)")
    # --- Compacidade ---
    compacidade_relativa: Optional[float] = Field(None, description="Compacidade Relativa (Dr) em %")
    classificacao_compacidade: Optional[str] = Field(None, description="Classificação da compacidade (Fofa, Compacta, etc.)")
    # --- NOVOS CAMPOS: Volumes e Massas Calculados ---
    volume_total_calc: Optional[float] = Field(None, description="Volume total calculado (ex: cm³)")
    volume_solidos_calc: Optional[float] = Field(None, description="Volume de sólidos calculado (ex: cm³)")
    volume_agua_calc: Optional[float] = Field(None, description="Volume de água calculado (ex: cm³)")
    volume_ar_calc: Optional[float] = Field(None, description="Volume de ar calculado (ex: cm³)")
    massa_total_calc: Optional[float] = Field(None, description="Massa total calculada (ex: g)")
    massa_solidos_calc: Optional[float] = Field(None, description="Massa de sólidos calculada (ex: g)")
    massa_agua_calc: Optional[float] = Field(None, description="Massa de água calculada (ex: g)")
    # -----------------------------------------------
    erro: Optional[str] = None


# --- Modelos Módulo 1: Limites de Consistência ---
# ... (restante do arquivo inalterado) ...
class PontoEnsaioLL(BaseModel):
    num_golpes: int = Field(..., gt=0)
    massa_umida_recipiente: float = Field(..., description="Massa do recipiente + solo úmido (g)")
    massa_seca_recipiente: float = Field(..., description="Massa do recipiente + solo seco (g)")
    massa_recipiente: float = Field(..., description="Massa do recipiente (g)")

class LimitesConsistenciaInput(BaseModel):
    pontos_ll: List[PontoEnsaioLL] = Field(..., min_items=2, description="Lista de pontos do ensaio de LL (pelo menos 2)")
    massa_umida_recipiente_lp: float = Field(..., description="Massa do recipiente + solo úmido (g) - Ensaio LP")
    massa_seca_recipiente_lp: float = Field(..., description="Massa do recipiente + solo seco (g) - Ensaio LP")
    massa_recipiente_lp: float = Field(..., description="Massa do recipiente (g) - Ensaio LP")
    umidade_natural: Optional[float] = Field(None, description="Teor de umidade natural atual do solo in situ (%)")
    percentual_argila: Optional[float] = Field(None, ge=0, le=100, description="Percentual de argila (< 0.002mm) na amostra (%)")

class LimitesConsistenciaOutput(BaseModel):
    ll: Optional[float] = Field(None, description="Limite de Liquidez (%)")
    lp: Optional[float] = Field(None, description="Limite de Plasticidade (%)")
    ip: Optional[float] = Field(None, description="Índice de Plasticidade (%)")
    ic: Optional[float] = Field(None, description="Índice de Consistência (adimensional)")
    classificacao_plasticidade: Optional[str] = None
    classificacao_consistencia: Optional[str] = None
    atividade_argila: Optional[float] = Field(None, description="Índice de Atividade (Ia) (adimensional)")
    classificacao_atividade: Optional[str] = None
    pontos_grafico_ll: Optional[List[PontoCurva]] = Field(None, description="Pontos (log_golpes, umidade) calculados para gráfico LL")
    erro: Optional[str] = None

# --- Modelos Módulo 2: Compactação ---
class PontoEnsaioCompactacao(BaseModel):
    massa_umida_total: float = Field(..., description="Massa do solo úmido + molde (ex: g ou kg)")
    massa_molde: float = Field(..., description="Massa do molde (ex: g ou kg)")
    volume_molde: float = Field(..., gt=0, description="Volume do molde (ex: cm³ ou m³)")
    massa_umida_recipiente_w: float = Field(..., description="Massa do recipiente + amostra úmida para umidade (g)")
    massa_seca_recipiente_w: float = Field(..., description="Massa do recipiente + amostra seca para umidade (g)")
    massa_recipiente_w: float = Field(..., description="Massa do recipiente para umidade (g)")

class CompactacaoInput(BaseModel):
    pontos_ensaio: List[PontoEnsaioCompactacao] = Field(..., min_items=3, description="Lista de pontos do ensaio (pelo menos 3)")
    Gs: Optional[float] = Field(None, gt=0, description="Densidade relativa dos grãos (Gs > 0), necessária para curva de saturação")
    peso_especifico_agua: float = Field(10.0, gt=0, description="Peso específico da água (γw) (ex: kN/m³)")

class CompactacaoOutput(BaseModel):
    umidade_otima: Optional[float] = Field(None, description="w_ot (%)")
    peso_especifico_seco_max: Optional[float] = Field(None, description="γd,max (kN/m³)")
    pontos_curva_compactacao: Optional[List[PontoCurvaCompactacao]] = Field(None, description="Pontos (w, γd) calculados do ensaio")
    pontos_curva_saturacao_100: Optional[List[PontoCurvaCompactacao]] = Field(None, description="Pontos (w, γd) para a curva S=100%")
    erro: Optional[str] = None

# --- Modelos Módulo 3: Tensões Geostáticas ---
class CamadaSolo(BaseModel):
    espessura: float = Field(..., gt=0, description="Espessura da camada (m)")
    gama_nat: Optional[float] = Field(None, description="Peso específico natural (kN/m³) - Acima do NA")
    gama_sat: Optional[float] = Field(None, description="Peso específico saturado (kN/m³) - Abaixo do NA")
    Ko: float = Field(0.5, ge=0, description="Coeficiente de empuxo em repouso (adimensional)")
    impermeavel: bool = Field(False, description="Indica se a camada é impermeável (impede passagem de água)")
    profundidade_na_camada: Optional[float] = Field(None, ge=0, description="Profundidade do NA nesta camada específica (m) - para aquíferos separados")
    altura_capilar_camada: Optional[float] = Field(None, ge=0, description="Altura capilar nesta camada específica (m)")

class TensaoPonto(BaseModel):
    profundidade: float
    tensao_total_vertical: Optional[float] = None
    pressao_neutra: Optional[float] = None
    tensao_efetiva_vertical: Optional[float] = None
    tensao_efetiva_horizontal: Optional[float] = None

class TensoesGeostaticasInput(BaseModel):
    camadas: List[CamadaSolo] = Field(..., min_items=1, description="Lista das camadas de solo, da superfície para baixo")
    profundidade_na: Optional[float] = Field(None, ge=0, description="Profundidade do Nível d'Água (NA) a partir da superfície (m). Usar 0 se na superfície, None ou valor muito alto se não há NA.")
    altura_capilar: float = Field(0.0, ge=0, description="Altura da franja capilar acima do NA (m)")
    peso_especifico_agua: float = Field(10.0, gt=0, description="Peso específico da água (γw) (kN/m³)")

class TensoesGeostaticasOutput(BaseModel):
    pontos_calculo: List[TensaoPonto] = Field(...)
    erro: Optional[str] = None

# --- Modelos Módulo 4: Acréscimo de Tensões ---
class PontoInteresse(BaseModel):
    x: float
    y: float
    z: float = Field(..., gt=0)

class CargaPontual(BaseModel):
    x: float = Field(0.0)
    y: float = Field(0.0)
    P: float = Field(..., gt=0)

class CargaFaixa(BaseModel):
    largura: float = Field(..., gt=0, description="Largura da faixa (b) (ex: m)")
    intensidade: float = Field(..., gt=0, description="Pressão uniforme aplicada (p) (ex: kPa)")
    centro_x: float = Field(0.0, description="Coordenada X do centro da faixa na superfície")

class CargaCircular(BaseModel):
    raio: float = Field(..., gt=0, description="Raio da área circular (R) (ex: m)")
    intensidade: float = Field(..., gt=0, description="Pressão uniforme aplicada (p) (ex: kPa)")
    centro_x: float = Field(0.0, description="Coordenada X do centro do círculo na superfície")
    centro_y: float = Field(0.0, description="Coordenada Y do centro do círculo na superfície")

class CargaRetangular(BaseModel):
    largura: float = Field(..., gt=0, description="Largura da área retangular (B) (ex: m)")
    comprimento: float = Field(..., gt=0, description="Comprimento da área retangular (L) (ex: m)")
    intensidade: float = Field(..., gt=0, description="Pressão uniforme aplicada (p) (ex: kPa)")
    centro_x: float = Field(0.0, description="Coordenada X do centro do retângulo na superfície")
    centro_y: float = Field(0.0, description="Coordenada Y do centro do retângulo na superfície")

class AcrescimoTensoesInput(BaseModel):
    tipo_carga: str = Field(..., description="Tipo de carga ('pontual', 'faixa', 'circular', 'retangular')")
    ponto_interesse: PontoInteresse = Field(...)
    carga_pontual: Optional[CargaPontual] = None
    carga_faixa: Optional[CargaFaixa] = None
    carga_circular: Optional[CargaCircular] = None
    carga_retangular: Optional[CargaRetangular] = None
    usar_abaco_newmark: Optional[bool] = Field(False, description="Para Newmark: True=ábaco, False=fórmula")

class AcrescimoTensoesOutput(BaseModel):
    delta_sigma_v: Optional[float] = Field(None, description="Acréscimo de tensão vertical (Δσv) no ponto (ex: kPa)")
    metodo: Optional[str] = None
    erro: Optional[str] = None
    # Detalhes técnicos do cálculo (opcional - para Newmark)
    detalhes: Optional[dict] = Field(None, description="Detalhes técnicos do cálculo (m, n, I, quadrantes, etc.)")

# --- Modelos Módulo 5: Recalque por Adensamento Primário ---
class RecalqueAdensamentoInput(BaseModel):
    espessura_camada: float = Field(..., gt=0)
    indice_vazios_inicial: float = Field(..., gt=0)
    Cc: float = Field(..., gt=0)
    Cr: float = Field(..., gt=0)
    tensao_efetiva_inicial: float = Field(..., gt=0)
    tensao_pre_adensamento: float = Field(..., gt=0)
    acrescimo_tensao: float = Field(..., ge=0)

class RecalqueAdensamentoOutput(BaseModel):
    recalque_total_primario: Optional[float] = None
    deformacao_volumetrica: Optional[float] = None
    tensao_efetiva_final: Optional[float] = None
    estado_adensamento: Optional[str] = None
    RPA: Optional[float] = None
    erro: Optional[str] = None

# --- Modelos Módulo 6: Tempo de Adensamento ---
class TempoAdensamentoInput(BaseModel):
    recalque_total_primario: float = Field(..., gt=0)
    coeficiente_adensamento: float = Field(..., gt=0)
    altura_drenagem: float = Field(..., gt=0)
    tempo: Optional[float] = Field(None, ge=0)
    grau_adensamento_medio: Optional[float] = Field(None, ge=0, le=100)

class TempoAdensamentoOutput(BaseModel):
    tempo_calculado: Optional[float] = None
    recalque_no_tempo: Optional[float] = None
    grau_adensamento_medio_calculado: Optional[float] = None
    fator_tempo: Optional[float] = None
    erro: Optional[str] = None

# --- Modelos Módulo 7: Fluxo Hidráulico ---
class CamadaFluxo(BaseModel):
    espessura: float = Field(..., gt=0)
    k: float = Field(..., ge=0, description="Coeficiente de permeabilidade (kx ou kz, ex: m/s)")
    n: Optional[float] = Field(None, gt=0, lt=1, description="Porosidade (0 < n < 1)")
    gamma_sat: Optional[float] = Field(None, gt=0, description="Peso específico saturado (kN/m³)")

class FluxoHidraulicoInput(BaseModel):
    camadas: List[CamadaFluxo] = Field(..., min_items=1)
    direcao_permeabilidade_equivalente: Optional[str] = Field(None, description="'horizontal' ou 'vertical'")
    gradiente_hidraulico_aplicado: Optional[float] = Field(None, ge=0, description="Gradiente hidráulico médio (i)")
    profundidades_tensao: Optional[List[float]] = Field(None, description="Lista de profundidades para calcular tensões (m)")
    profundidade_na_entrada: Optional[float] = Field(None, ge=0, description="Profundidade do NA a montante (m)")
    profundidade_na_saida: Optional[float] = Field(None, ge=0, description="Profundidade do NA a jusante (m)")
    direcao_fluxo_vertical: Optional[str] = Field(None, description="'ascendente' ou 'descendente'")
    peso_especifico_agua: float = Field(10.0, gt=0, description="γw (kN/m³)")

class TensaoPontoFluxo(BaseModel):
    profundidade: float
    tensao_total_vertical: Optional[float] = None
    pressao_neutra: Optional[float] = None
    tensao_efetiva_vertical: Optional[float] = None
    carga_hidraulica_total: Optional[float] = None # ht = u/gamma_w + Z_elev

class FluxoHidraulicoOutput(BaseModel):
    permeabilidade_equivalente: Optional[float] = Field(None, description="Coeficiente de permeabilidade equivalente (k_eq)")
    velocidade_descarga: Optional[float] = Field(None, description="Velocidade de descarga (v = ki)")
    velocidade_fluxo: Optional[float] = Field(None, description="Velocidade de fluxo/percolação (vf = v/n)")
    gradiente_critico: Optional[float] = Field(None, description="Gradiente hidráulico crítico (icrit = γ'/γw)")
    fs_liquefacao: Optional[float] = Field(None, description="Fator de segurança contra liquefação (FS = icrit / i_ascendente)")
    pontos_tensao_fluxo: Optional[List[TensaoPontoFluxo]] = Field(None, description="Tensões calculadas em diferentes profundidades sob fluxo")
    erro: Optional[str] = None

# --- Modelos Módulo 8: Classificação USCS ---
class ClassificacaoUSCSInput(BaseModel):
    pass_peneira_200: float = Field(..., ge=0, le=100, description="% passando na peneira #200 (0.075mm)")
    pass_peneira_4: float = Field(..., ge=0, le=100, description="% passando na peneira #4 (4.75mm)")
    ll: Optional[float] = Field(None, ge=0, description="Limite de Liquidez (%)")
    ip: Optional[float] = Field(None, ge=0, description="Índice de Plasticidade (%)")
    Cu: Optional[float] = Field(None, ge=0, description="Coeficiente de Uniformidade (D60/D10)")
    Cc: Optional[float] = Field(None, ge=0, description="Coeficiente de Curvatura (D30²/ (D10*D60))")
    is_organico_fino: bool = Field(False, description="Indica se é solo fino orgânico (OL/OH)")
    is_altamente_organico: bool = Field(False, description="Indica se é Turfa (Pt)")

    @validator('ip')
    def check_ip_ll(cls, ip, values):
        ll = values.get('ll')
        if ll is not None and ip is not None and ip > ll + EPSILON:
            raise ValueError("Índice de Plasticidade (IP) não pode ser maior que o Limite de Liquidez (LL).")
        return ip

    @validator('pass_peneira_200')
    def check_p200_p4(cls, p200, values):
         p4 = values.get('pass_peneira_4')
         if p4 is not None and p200 > p4 + EPSILON:
              raise ValueError("Percentagem passando na #200 não pode ser maior que a #4.")
         return p200

class ClassificacaoUSCSOutput(BaseModel):
    classificacao: Optional[str] = Field(None, description="Símbolo do grupo USCS (ex: SW, CL, GP-GC)")
    descricao: Optional[str] = Field(None, description="Descrição do grupo (ex: Areia bem graduada, Argila de baixa plasticidade)")
    erro: Optional[str] = None

# --- Modelos Classificação HRB/AASHTO ---
class ClassificacaoHRBInput(BaseModel):
    pass_peneira_200: float = Field(..., ge=0, le=100, description="% passando na peneira #200 (0.075mm)")
    pass_peneira_40: Optional[float] = Field(None, ge=0, le=100, description="% passando na peneira #40 (0.42mm)")
    pass_peneira_10: Optional[float] = Field(None, ge=0, le=100, description="% passando na peneira #10 (2.0mm)")
    ll: Optional[float] = Field(None, ge=0, description="Limite de Liquidez (%)")
    ip: Optional[float] = Field(None, ge=0, description="Índice de Plasticidade (%)")

class ClassificacaoHRBOutput(BaseModel):
    classificacao: Optional[str] = Field(None, description="Classificação HRB completa (ex: A-2-4, A-7-6 (10))")
    grupo_principal: Optional[str] = Field(None, description="Grupo principal (ex: A-2, A-7)")
    subgrupo: Optional[str] = Field(None, description="Subgrupo (ex: 4, 5, 6, 7, a, b)")
    indice_grupo: Optional[int] = Field(None, description="Índice de Grupo (IG)")
    descricao: Optional[str] = Field(None, description="Descrição do material")
    avaliacao_subleito: Optional[str] = Field(None, description="Qualidade como subleito de pavimento")
    erro: Optional[str] = None

# --- Modelos Módulo 9: Granulometria ---
class PeneiraDado(BaseModel):
    abertura: float = Field(..., gt=0, description="Abertura da peneira (mm)")
    massa_retida: float = Field(..., ge=0, description="Massa retida (g)")

class GranulometriaInput(BaseModel):
    massa_total: float = Field(..., gt=0, description="Massa total da amostra (g)")
    peneiras: List[PeneiraDado] = Field(..., min_items=1, description="Dados das peneiras")
    ll: Optional[float] = Field(None, ge=0, description="Limite de Liquidez (%)")
    lp: Optional[float] = Field(None, ge=0, description="Limite de Plasticidade (%)")

class PontoGranulometrico(BaseModel):
    abertura: float
    massa_retida: float
    porc_retida: float
    porc_retida_acum: float
    porc_passante: float

class GranulometriaOutput(BaseModel):
    dados_granulometricos: List[PontoGranulometrico] = Field(..., description="Dados calculados para cada peneira")
    percentagem_pedregulho: Optional[float] = Field(None, description="% de pedregulho (> 4.76mm)")
    percentagem_areia: Optional[float] = Field(None, description="% de areia (4.76 - 0.075mm)")
    percentagem_finos: Optional[float] = Field(None, description="% de finos (< 0.075mm)")
    d10: Optional[float] = Field(None, description="Diâmetro efetivo D10 (mm)")
    d30: Optional[float] = Field(None, description="Diâmetro D30 (mm)")
    d60: Optional[float] = Field(None, description="Diâmetro D60 (mm)")
    coef_uniformidade: Optional[float] = Field(None, description="Coeficiente de Uniformidade Cu = D60/D10")
    coef_curvatura: Optional[float] = Field(None, description="Coeficiente de Curvatura Cc = (D30)²/(D10×D60)")
    # Classificação USCS
    classificacao_uscs: Optional[str] = Field(None, description="Classificação USCS do solo")
    descricao_uscs: Optional[str] = Field(None, description="Descrição da classificação USCS")
    # Classificação HRB/AASHTO
    classificacao_hrb: Optional[str] = Field(None, description="Classificação HRB/AASHTO do solo")
    grupo_hrb: Optional[str] = Field(None, description="Grupo principal HRB")
    subgrupo_hrb: Optional[str] = Field(None, description="Subgrupo HRB")
    indice_grupo_hrb: Optional[int] = Field(None, description="Índice de Grupo (IG)")
    descricao_hrb: Optional[str] = Field(None, description="Descrição da classificação HRB")
    avaliacao_subleito_hrb: Optional[str] = Field(None, description="Avaliação como subleito")
    erro: Optional[str] = None