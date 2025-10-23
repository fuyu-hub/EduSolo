# backend/app/modules/granulometria.py
"""
Módulo para análise granulométrica de solos.
Calcula curva granulométrica, parâmetros característicos (D10, D30, D60),
coeficientes de uniformidade e curvatura, e integra com classificação USCS.

Referências:
- NBR 7181 - Análise Granulométrica
- ASTM D422 - Particle-Size Analysis of Soils
- USCS (Unified Soil Classification System)
"""

from typing import Optional, Tuple, List
from app.models import (
    GranulometriaInput, 
    GranulometriaOutput, 
    PontoGranulometrico,
    ClassificacaoUSCSInput,
    ClassificacaoHRBInput,
)
from app.modules.classificacao_uscs import classificar_uscs
from app.modules.classificacao_hrb import classificar_hrb

EPSILON = 1e-9

# Limites de tamanho de partículas (mm) segundo ABNT/ASTM
LIMITE_PENEIRA_4 = 4.76  # Separação pedregulho/areia
LIMITE_PENEIRA_200 = 0.075  # Separação areia/finos


def calcular_granulometria(dados: GranulometriaInput) -> GranulometriaOutput:
    """
    Realiza análise granulométrica completa de uma amostra de solo.
    
    Args:
        dados: Dados de entrada contendo massa total, dados das peneiras e limites de Atterberg
        
    Returns:
        Resultado da análise com curva granulométrica, parâmetros e classificação USCS
    """
    try:
        massa_total = dados.massa_total
        
        # Validação básica
        if massa_total <= EPSILON:
            raise ValueError("Massa total deve ser maior que zero.")
        
        # Ordenar peneiras por abertura (decrescente - da maior para a menor)
        peneiras_ordenadas = sorted(
            dados.peneiras, 
            key=lambda p: p.abertura, 
            reverse=True
        )
        
        # Calcular porcentagens retidas e passantes
        dados_granulometricos = []
        massa_acumulada = 0.0
        
        for peneira in peneiras_ordenadas:
            massa_acumulada += peneira.massa_retida
            
            porc_retida = (peneira.massa_retida / massa_total) * 100
            porc_retida_acum = (massa_acumulada / massa_total) * 100
            porc_passante = 100 - porc_retida_acum
            
            ponto = PontoGranulometrico(
                abertura=peneira.abertura,
                massa_retida=peneira.massa_retida,
                porc_retida=round(porc_retida, 2),
                porc_retida_acum=round(porc_retida_acum, 2),
                porc_passante=round(porc_passante, 2)
            )
            dados_granulometricos.append(ponto)
        
        # Verificar se soma das massas não excede a massa total
        if massa_acumulada > massa_total + EPSILON:
            raise ValueError(
                f"Soma das massas retidas ({massa_acumulada:.2f}g) excede a massa total ({massa_total:.2f}g)."
            )
        
        # Calcular percentuais de pedregulho, areia e finos
        percentagens = _calcular_percentuais_granulometricos(dados_granulometricos)
        
        # Calcular D10, D30, D60 por interpolação linear
        d10 = _calcular_diametro_caracteristico(dados_granulometricos, 10)
        d30 = _calcular_diametro_caracteristico(dados_granulometricos, 30)
        d60 = _calcular_diametro_caracteristico(dados_granulometricos, 60)
        
        # Calcular coeficientes de uniformidade e curvatura
        cu, cc = _calcular_coeficientes(d10, d30, d60)
        
        # Integração com classificação USCS
        classificacao_uscs = None
        descricao_uscs = None
        
        # Integração com classificação HRB
        classificacao_hrb = None
        grupo_hrb = None
        subgrupo_hrb = None
        indice_grupo_hrb = None
        descricao_hrb = None
        avaliacao_subleito_hrb = None
        
        if percentagens['finos'] is not None:
            # Calcular IP se LL e LP foram fornecidos
            ip = None
            if dados.ll is not None and dados.lp is not None:
                ip = dados.ll - dados.lp
                if ip < 0:
                    ip = 0  # IP não pode ser negativo
            
            # Preparar entrada para classificação USCS
            try:
                uscs_input = ClassificacaoUSCSInput(
                    pass_peneira_200=percentagens['finos'],
                    pass_peneira_4=percentagens['finos'] + percentagens['areia'],
                    ll=dados.ll,
                    ip=ip,
                    Cu=cu,
                    Cc=cc,
                    is_organico_fino=False,
                    is_altamente_organico=False
                )
                
                resultado_uscs = classificar_uscs(uscs_input)
                
                if resultado_uscs.erro:
                    # Se houver erro na classificação, apenas registra mas não falha
                    pass
                else:
                    classificacao_uscs = resultado_uscs.classificacao
                    descricao_uscs = resultado_uscs.descricao
                    
            except Exception as e:
                # Classificação USCS é opcional, não falha a análise granulométrica
                print(f"Aviso: Não foi possível classificar USCS: {e}")
            
            # Preparar entrada para classificação HRB
            try:
                # Buscar % passando nas peneiras #10 e #40
                pass_10 = _interpolar_passante(dados_granulometricos, 2.0)  # Peneira #10
                pass_40 = _interpolar_passante(dados_granulometricos, 0.42)  # Peneira #40
                
                hrb_input = ClassificacaoHRBInput(
                    pass_peneira_200=percentagens['finos'],
                    pass_peneira_40=pass_40,
                    pass_peneira_10=pass_10,
                    ll=dados.ll,
                    ip=ip
                )
                
                resultado_hrb = classificar_hrb(hrb_input)
                
                if resultado_hrb.erro:
                    # Se houver erro na classificação HRB, apenas registra mas não falha
                    pass
                else:
                    classificacao_hrb = resultado_hrb.classificacao
                    grupo_hrb = resultado_hrb.grupo_principal
                    subgrupo_hrb = resultado_hrb.subgrupo
                    indice_grupo_hrb = resultado_hrb.indice_grupo
                    descricao_hrb = resultado_hrb.descricao
                    avaliacao_subleito_hrb = resultado_hrb.avaliacao_subleito
                    
            except Exception as e:
                # Classificação HRB é opcional, não falha a análise granulométrica
                print(f"Aviso: Não foi possível classificar HRB: {e}")
        
        return GranulometriaOutput(
            dados_granulometricos=dados_granulometricos,
            percentagem_pedregulho=percentagens['pedregulho'],
            percentagem_areia=percentagens['areia'],
            percentagem_finos=percentagens['finos'],
            d10=d10,
            d30=d30,
            d60=d60,
            coef_uniformidade=cu,
            coef_curvatura=cc,
            classificacao_uscs=classificacao_uscs,
            descricao_uscs=descricao_uscs,
            classificacao_hrb=classificacao_hrb,
            grupo_hrb=grupo_hrb,
            subgrupo_hrb=subgrupo_hrb,
            indice_grupo_hrb=indice_grupo_hrb,
            descricao_hrb=descricao_hrb,
            avaliacao_subleito_hrb=avaliacao_subleito_hrb
        )
        
    except ValueError as ve:
        return GranulometriaOutput(
            dados_granulometricos=[],
            erro=str(ve)
        )
    except Exception as e:
        import traceback
        print(f"Erro inesperado na análise granulométrica: {e}\n{traceback.format_exc()}")
        return GranulometriaOutput(
            dados_granulometricos=[],
            erro=f"Erro interno no servidor: {type(e).__name__}"
        )


def _calcular_percentuais_granulometricos(
    dados: List[PontoGranulometrico]
) -> dict:
    """
    Calcula percentuais de pedregulho, areia e finos.
    
    Limites segundo ABNT:
    - Pedregulho: > 4.76mm (peneira #4)
    - Areia: 4.76mm a 0.075mm (peneiras #4 a #200)
    - Finos (silte + argila): < 0.075mm (passa peneira #200)
    """
    # Encontrar porcentagem passante na peneira #4 (4.76mm)
    passante_4 = None
    for ponto in dados:
        if abs(ponto.abertura - LIMITE_PENEIRA_4) < 0.1:
            passante_4 = ponto.porc_passante
            break
    
    # Se não temos dados da peneira #4, interpolar ou usar valores extremos
    if passante_4 is None:
        # Verificar se todas as aberturas são maiores que 4.76mm
        if all(p.abertura > LIMITE_PENEIRA_4 for p in dados):
            passante_4 = dados[-1].porc_passante if dados else 100.0
        # Verificar se todas as aberturas são menores que 4.76mm
        elif all(p.abertura < LIMITE_PENEIRA_4 for p in dados):
            passante_4 = 100.0
        else:
            # Interpolar
            passante_4 = _interpolar_passante(dados, LIMITE_PENEIRA_4)
    
    # Encontrar porcentagem passante na peneira #200 (0.075mm)
    passante_200 = None
    for ponto in dados:
        if abs(ponto.abertura - LIMITE_PENEIRA_200) < 0.01:
            passante_200 = ponto.porc_passante
            break
    
    if passante_200 is None:
        if all(p.abertura > LIMITE_PENEIRA_200 for p in dados):
            passante_200 = dados[-1].porc_passante if dados else 100.0
        elif all(p.abertura < LIMITE_PENEIRA_200 for p in dados):
            passante_200 = 100.0
        else:
            passante_200 = _interpolar_passante(dados, LIMITE_PENEIRA_200)
    
    # Calcular percentuais
    perc_pedregulho = round(100.0 - passante_4, 2) if passante_4 is not None else None
    perc_finos = round(passante_200, 2) if passante_200 is not None else None
    
    perc_areia = None
    if passante_4 is not None and passante_200 is not None:
        perc_areia = round(passante_4 - passante_200, 2)
    
    return {
        'pedregulho': perc_pedregulho,
        'areia': perc_areia,
        'finos': perc_finos
    }


def _interpolar_passante(dados: List[PontoGranulometrico], abertura_alvo: float) -> float:
    """
    Interpola a porcentagem passante para uma abertura específica.
    """
    for i in range(len(dados) - 1):
        p1 = dados[i]
        p2 = dados[i + 1]
        
        # Verifica se a abertura alvo está entre os dois pontos
        if p1.abertura >= abertura_alvo >= p2.abertura:
            # Interpolação linear
            if abs(p1.abertura - p2.abertura) < EPSILON:
                return p1.porc_passante
            
            passante = p2.porc_passante + (
                (p1.porc_passante - p2.porc_passante) * 
                (abertura_alvo - p2.abertura) / 
                (p1.abertura - p2.abertura)
            )
            return passante
    
    # Se não encontrou, retorna o valor do ponto mais próximo
    return dados[0].porc_passante if dados else 100.0


def _calcular_diametro_caracteristico(
    dados: List[PontoGranulometrico], 
    percentual_passante: float
) -> Optional[float]:
    """
    Calcula o diâmetro característico (D10, D30, D60) por interpolação linear.
    
    Args:
        dados: Lista de pontos granulométricos ordenados por abertura decrescente
        percentual_passante: Porcentagem passante desejada (10, 30 ou 60)
        
    Returns:
        Diâmetro em mm correspondente ao percentual passante, ou None se não for possível calcular
    """
    if len(dados) < 2:
        return None
    
    for i in range(len(dados) - 1):
        p1 = dados[i]
        p2 = dados[i + 1]
        
        # Verifica se o percentual está entre os dois pontos
        # p1 tem abertura maior e p2 tem abertura menor
        # p1 tem passante maior e p2 tem passante menor (ou igual)
        if p1.porc_passante >= percentual_passante >= p2.porc_passante:
            # Interpolação linear
            if abs(p1.porc_passante - p2.porc_passante) < EPSILON:
                # Se as porcentagens passantes são iguais, retorna a média das aberturas
                return (p1.abertura + p2.abertura) / 2
            
            # d = d2 + (d1 - d2) * (p - p2) / (p1 - p2)
            diametro = p2.abertura + (
                (p1.abertura - p2.abertura) * 
                (percentual_passante - p2.porc_passante) / 
                (p1.porc_passante - p2.porc_passante)
            )
            
            return round(diametro, 4)
    
    # Se o percentual está fora do intervalo medido
    return None


def _calcular_coeficientes(
    d10: Optional[float], 
    d30: Optional[float], 
    d60: Optional[float]
) -> Tuple[Optional[float], Optional[float]]:
    """
    Calcula os coeficientes de uniformidade (Cu) e curvatura (Cc).
    
    Cu = D60 / D10
    Cc = (D30)² / (D10 × D60)
    
    Returns:
        Tupla (Cu, Cc) ou (None, None) se não for possível calcular
    """
    cu = None
    cc = None
    
    # Calcular Cu
    if d10 is not None and d60 is not None and d10 > EPSILON:
        cu = round(d60 / d10, 2)
    
    # Calcular Cc
    if d10 is not None and d30 is not None and d60 is not None:
        if d10 > EPSILON and d60 > EPSILON:
            cc = round((d30 * d30) / (d10 * d60), 2)
    
    return cu, cc

