# backend/app/main.py
"""
API Principal do EduSolo - Plataforma de Cálculos Geotécnicos.

Esta API fornece endpoints para diversos cálculos de Mecânica dos Solos,
incluindo índices físicos, limites de consistência, granulometria, compactação,
tensões geostáticas e mais.
"""

import numpy as np
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

# Importar configurações e logging
from app.config import settings
from app.core.logging_config import setup_logging, get_logger
from app.middleware.logging_middleware import LoggingMiddleware

# Importar modelos Pydantic
from app.models import (
    IndicesFisicosInput, IndicesFisicosOutput,
    LimitesConsistenciaInput, LimitesConsistenciaOutput,
    CompactacaoInput, CompactacaoOutput,
    TensoesGeostaticasInput, TensoesGeostaticasOutput,
    AcrescimoTensoesInput, AcrescimoTensoesOutput,
    RecalqueAdensamentoInput, RecalqueAdensamentoOutput,
    TempoAdensamentoInput, TempoAdensamentoOutput,
    FluxoHidraulicoInput, FluxoHidraulicoOutput,
    ClassificacaoUSCSInput, ClassificacaoUSCSOutput,
    GranulometriaInput, GranulometriaOutput
)

# Importar funções de cálculo
from app.modules.indices_fisicos import calcular_indices_fisicos
from app.modules.limites_consistencia import calcular_limites_consistencia
from app.modules.compactacao import calcular_compactacao
from app.modules.tensoes_geostaticas import calcular_tensoes_geostaticas
from app.modules.acrescimo_tensoes import calcular_acrescimo_tensoes
from app.modules.recalque_adensamento import calcular_recalque_adensamento
from app.modules.tempo_adensamento import calcular_tempo_adensamento
from app.modules.fluxo_hidraulico import (
    calcular_permeabilidade_equivalente, calcular_velocidades_fluxo,
    calcular_tensoes_com_fluxo, calcular_gradiente_critico, calcular_fs_liquefacao
)
from app.modules.classificacao_uscs import classificar_uscs
from app.modules.granulometria import calcular_granulometria

# Configurar logging
setup_logging()
logger = get_logger(__name__)


# Lifespan context manager (substitui event handlers deprecados)
@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Gerencia o ciclo de vida da aplicação.
    Substitui os event handlers deprecados @app.on_event.
    """
    # Startup
    logger.info("=" * 60)
    logger.info(f"🚀 Iniciando {settings.API_TITLE} v{settings.API_VERSION}")
    logger.info(f"Ambiente: {settings.ENVIRONMENT}")
    logger.info(f"Debug: {settings.DEBUG}")
    logger.info("=" * 60)
    
    yield
    
    # Shutdown
    logger.info("=" * 60)
    logger.info("🛑 Encerrando EduSolo API")
    logger.info("=" * 60)


# Criar aplicação FastAPI
app = FastAPI(
    title=settings.API_TITLE,
    description=settings.API_DESCRIPTION,
    version=settings.API_VERSION,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    lifespan=lifespan
)

# Adicionar middleware de logging
app.add_middleware(LoggingMiddleware)

# Configuração do CORS
if settings.CORS_ENABLED:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.ALLOWED_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    logger.info(f"CORS habilitado para origens: {settings.ALLOWED_ORIGINS}")

# --- Endpoints ---

@app.get("/", tags=["Root"])
def read_root():
    """
    Endpoint raiz para verificar se a API está online.
    
    Returns:
        dict: Mensagem de boas-vindas e informações da API
    """
    logger.debug("Endpoint raiz acessado")
    return {
        "message": f"Bem-vindo à API do EduSolo v{settings.API_VERSION}",
        "version": settings.API_VERSION,
        "environment": settings.ENVIRONMENT,
        "docs": "/docs",
        "status": "online"
    }


@app.get("/health", tags=["Root"])
def health_check():
    """
    Endpoint de health check para monitoramento.
    
    Returns:
        dict: Status de saúde da aplicação
    """
    return {
        "status": "healthy",
        "version": settings.API_VERSION,
        "environment": settings.ENVIRONMENT
    }


@app.get("/cache/stats", tags=["Monitoramento"])
def get_cache_statistics():
    """
    Retorna estatísticas do cache de cálculos.
    
    Returns:
        dict: Estatísticas do cache (hits, misses, size, hit_rate)
    """
    from app.utils.cache import get_cache_stats
    
    stats = get_cache_stats()
    logger.debug(f"Estatísticas do cache solicitadas: {stats}")
    return stats


@app.post("/cache/clear", tags=["Monitoramento"])
def clear_calculation_cache():
    """
    Limpa o cache de cálculos.
    
    Útil para desenvolvimento ou quando dados de referência mudam.
    
    Returns:
        dict: Mensagem de confirmação
    """
    from app.utils.cache import clear_cache
    
    clear_cache()
    logger.info("Cache de cálculos limpo manualmente")
    return {
        "message": "Cache limpo com sucesso",
        "timestamp": "now"
    }

# --- Módulos Anteriores (mantidos) ---
@app.post("/calcular/indices-fisicos", response_model=IndicesFisicosOutput, tags=["Índices e Limites"])
def post_calcular_indices(dados_entrada: IndicesFisicosInput):
    resultados = calcular_indices_fisicos(dados_entrada)
    if resultados.erro: raise HTTPException(status_code=400, detail=resultados.erro)
    return resultados

@app.post("/calcular/limites-consistencia", response_model=LimitesConsistenciaOutput, tags=["Índices e Limites"])
def post_calcular_limites(dados_entrada: LimitesConsistenciaInput):
    resultados = calcular_limites_consistencia(dados_entrada)
    if resultados.erro: raise HTTPException(status_code=400, detail=resultados.erro)
    return resultados

@app.post("/calcular/compactacao", response_model=CompactacaoOutput, tags=["Compactação"])
def post_calcular_compactacao(dados_entrada: CompactacaoInput):
    resultados = calcular_compactacao(dados_entrada)
    if resultados.erro: raise HTTPException(status_code=400, detail=resultados.erro)
    return resultados

@app.post("/calcular/tensoes-geostaticas", response_model=TensoesGeostaticasOutput, tags=["Tensões"])
def post_calcular_tensoes_geostaticas(dados_entrada: TensoesGeostaticasInput):
    resultados = calcular_tensoes_geostaticas(dados_entrada)
    if resultados.erro: raise HTTPException(status_code=400, detail=resultados.erro)
    return resultados

@app.post("/calcular/acrescimo-tensoes", response_model=AcrescimoTensoesOutput, tags=["Tensões"])
def post_calcular_acrescimo_tensoes(dados_entrada: AcrescimoTensoesInput):
    """ Calcula acréscimo de tensão para carga pontual, faixa ou circular. """
    # Validação: Garante que apenas um tipo de carga seja fornecido
    tipos_carga_presentes = [
        dados_entrada.carga_pontual is not None,
        dados_entrada.carga_faixa is not None,
        dados_entrada.carga_circular is not None,
        # dados_entrada.carga_retangular is not None, # Descomentar quando implementar
    ]
    if sum(tipos_carga_presentes) != 1:
        raise HTTPException(status_code=400, detail="Exatamente um tipo de dados de carga (pontual, faixa ou circular) deve ser fornecido.")

    resultados = calcular_acrescimo_tensoes(dados_entrada)
    if resultados.erro: raise HTTPException(status_code=400, detail=resultados.erro)
    return resultados

@app.post("/calcular/recalque-adensamento", response_model=RecalqueAdensamentoOutput, tags=["Adensamento"])
def post_calcular_recalque(dados_entrada: RecalqueAdensamentoInput):
    resultados = calcular_recalque_adensamento(dados_entrada)
    if resultados.erro: raise HTTPException(status_code=400, detail=resultados.erro)
    return resultados

@app.post("/calcular/tempo-adensamento", response_model=TempoAdensamentoOutput, tags=["Adensamento"])
def post_calcular_tempo_adensamento(dados_entrada: TempoAdensamentoInput):
    resultados = calcular_tempo_adensamento(dados_entrada)
    if resultados.erro: raise HTTPException(status_code=400, detail=resultados.erro)
    return resultados

# --- Novos Módulos: Fluxo e Classificação ---

@app.post("/analisar/fluxo-hidraulico", response_model=FluxoHidraulicoOutput, tags=["Fluxo Hidráulico"])
def post_analisar_fluxo(dados_entrada: FluxoHidraulicoInput):
    """
    Realiza análises de fluxo hidráulico 1D: permeabilidade equivalente,
    velocidades, gradiente crítico, FS liquefação e tensões sob fluxo.
    Forneça os dados relevantes para a análise desejada.
    """
    output = FluxoHidraulicoOutput()
    try:
        # Calcular permeabilidade equivalente se solicitado
        if dados_entrada.direcao_permeabilidade_equivalente:
            k_eq = calcular_permeabilidade_equivalente(
                dados_entrada.camadas,
                dados_entrada.direcao_permeabilidade_equivalente
            )
            output.permeabilidade_equivalente = round(k_eq, 6) if k_eq is not None else None

        # Calcular velocidades se k_eq (ou k da primeira camada) e gradiente forem dados
        k_para_velocidade = output.permeabilidade_equivalente
        if k_para_velocidade is None and dados_entrada.camadas:
            k_para_velocidade = dados_entrada.camadas[0].k # Usa k da primeira camada se k_eq não foi calculado

        if k_para_velocidade is not None and dados_entrada.gradiente_hidraulico_aplicado is not None:
             porosidade_media = None
             if dados_entrada.camadas and all(c.n is not None for c in dados_entrada.camadas):
                 # Média ponderada pela espessura? Ou só da primeira camada? Usar média simples por ora.
                 porosidades = [c.n for c in dados_entrada.camadas if c.n is not None]
                 if porosidades: porosidade_media = sum(porosidades) / len(porosidades)

             velocidades = calcular_velocidades_fluxo(
                 k_para_velocidade,
                 dados_entrada.gradiente_hidraulico_aplicado,
                 porosidade_media
             )
             output.velocidade_descarga = round(velocidades["velocidade_descarga"], 6) if velocidades["velocidade_descarga"] is not None else None
             output.velocidade_fluxo = round(velocidades["velocidade_fluxo"], 6) if velocidades["velocidade_fluxo"] is not None else None

        # Calcular gradiente crítico e FS (apenas para fluxo ascendente)
        # Usa gamma_sat da última camada para icrit (ponto de saída do fluxo ascendente)
        if dados_entrada.direcao_fluxo_vertical and dados_entrada.direcao_fluxo_vertical.lower() == 'ascendente':
             if dados_entrada.camadas and dados_entrada.camadas[-1].gamma_sat:
                 gamma_sat_saida = dados_entrada.camadas[-1].gamma_sat
                 icrit = calcular_gradiente_critico(gamma_sat_saida, dados_entrada.peso_especifico_agua)
                 output.gradiente_critico = round(icrit, 3) if icrit is not None else None
                 if icrit is not None and dados_entrada.gradiente_hidraulico_aplicado is not None:
                      # Gradiente atuante para FS deve ser o local na saída, não o médio?
                      # Por simplicidade, usa o gradiente médio aplicado. Cuidado: pode subestimar FS.
                      i_atuante = dados_entrada.gradiente_hidraulico_aplicado
                      fs_liq = calcular_fs_liquefacao(icrit, i_atuante)
                      output.fs_liquefacao = round(fs_liq, 2) if fs_liq is not None and np.isfinite(fs_liq) else fs_liq
             else:
                 output.erro = "γ_sat da última camada necessário para calcular icrit."


        # Calcular tensões sob fluxo se solicitado
        if (dados_entrada.profundidades_tensao and
            dados_entrada.profundidade_na_entrada is not None and
            dados_entrada.profundidade_na_saida is not None and
            dados_entrada.direcao_fluxo_vertical):
            # Valida se todas as camadas têm gamma_sat
            if not all(c.gamma_sat is not None for c in dados_entrada.camadas):
                 output.erro = "γ_sat deve ser definido para todas as camadas para cálculo de tensões com fluxo."
            else:
                 pontos_tensao = calcular_tensoes_com_fluxo(
                     profundidades=dados_entrada.profundidades_tensao,
                     camadas=dados_entrada.camadas,
                     profundidade_na_entrada=dados_entrada.profundidade_na_entrada,
                     profundidade_na_saida=dados_entrada.profundidade_na_saida,
                     gamma_w=dados_entrada.peso_especifico_agua,
                     direcao_fluxo=dados_entrada.direcao_fluxo_vertical
                 )
                 output.pontos_tensao_fluxo = pontos_tensao

        # Verifica se alguma operação foi realizada ou se há erro
        if not any([output.permeabilidade_equivalente, output.velocidade_descarga, output.gradiente_critico, output.pontos_tensao_fluxo]) and not output.erro:
             output.erro = "Nenhuma análise de fluxo solicitada ou dados insuficientes."

        if output.erro:
             # Se já houve erro parcial, não levanta HTTP Exception, retorna no corpo
             pass

        return output

    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        print(f"Erro inesperado na análise de fluxo: {e}")
        raise HTTPException(status_code=500, detail=f"Erro interno no servidor: {type(e).__name__}")


@app.post("/classificar/uscs", response_model=ClassificacaoUSCSOutput, tags=["Classificação"])
def post_classificar_uscs(dados_entrada: ClassificacaoUSCSInput):
    """
    Classifica o solo de acordo com o Sistema Unificado (USCS).
    Forneça os dados granulométricos e limites de Atterberg.
    Cu e Cc são necessários para solos grossos com < 5% de finos ou classificação dupla.
    """
    resultados = classificar_uscs(dados_entrada)
    if resultados.erro:
        raise HTTPException(status_code=400, detail=resultados.erro)
    return resultados


@app.post("/analisar/granulometria", response_model=GranulometriaOutput, tags=["Granulometria"])
def post_analisar_granulometria(dados_entrada: GranulometriaInput):
    """
    Realiza análise granulométrica completa e classificação USCS.
    Calcula curva granulométrica, parâmetros D10/D30/D60, Cu, Cc e classificação.
    
    Forneça:
    - massa_total: Massa total da amostra (g)
    - peneiras: Lista com abertura (mm) e massa retida (g) de cada peneira
    - ll (opcional): Limite de Liquidez (%)
    - lp (opcional): Limite de Plasticidade (%)
    
    Retorna análise completa com classificação USCS se os dados permitirem.
    """
    resultados = calcular_granulometria(dados_entrada)
    if resultados.erro:
        raise HTTPException(status_code=400, detail=resultados.erro)
    return resultados


# --- Para executar (na pasta backend): uvicorn app.main:app --reload ---