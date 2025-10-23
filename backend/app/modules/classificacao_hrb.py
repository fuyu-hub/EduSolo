# backend/app/modules/classificacao_hrb.py
"""
Módulo para classificação de solos segundo o sistema HRB (Highway Research Board)
também conhecido como classificação AASHTO (American Association of State Highway 
and Transportation Officials).

Este sistema é amplamente utilizado para classificação de solos para fins de 
pavimentação rodoviária.

Referências:
- AASHTO M 145 - Standard Specification for Classification of Soils and 
  Soil-Aggregate Mixtures for Highway Construction Purposes
- DER/SP - Departamento de Estradas de Rodagem de São Paulo
"""

from typing import Optional
from app.models import ClassificacaoHRBInput, ClassificacaoHRBOutput

EPSILON = 1e-9


def classificar_hrb(dados: ClassificacaoHRBInput) -> ClassificacaoHRBOutput:
    """
    Classifica o solo de acordo com o sistema HRB/AASHTO.
    
    Args:
        dados: Objeto ClassificacaoHRBInput contendo os parâmetros necessários.
        
    Returns:
        Um objeto ClassificacaoHRBOutput com a classificação, descrição e índice de grupo.
    """
    try:
        # Extrai dados de entrada
        p200 = dados.pass_peneira_200  # % passando na peneira #200
        p40 = dados.pass_peneira_40    # % passando na peneira #40
        p10 = dados.pass_peneira_10    # % passando na peneira #10
        ll = dados.ll                   # Limite de Liquidez
        ip = dados.ip                   # Índice de Plasticidade
        
        # Validações
        if not (0 <= p200 <= 100):
            raise ValueError("% passando na #200 deve estar entre 0 e 100.")
        
        # LL e IP são opcionais para alguns grupos, mas necessários para outros
        if ll is not None and ll < 0:
            raise ValueError("LL não pode ser negativo.")
        if ip is not None and ip < 0:
            raise ValueError("IP não pode ser negativo.")
        
        # Determina o grupo principal
        grupo, subgrupo = _determinar_grupo_hrb(p200, p40, p10, ll, ip)
        
        # Calcula o Índice de Grupo (IG)
        ig = _calcular_indice_grupo(p200, ll, ip)
        
        # Monta a classificação completa
        if subgrupo:
            classificacao = f"{grupo}-{subgrupo}"
        else:
            classificacao = grupo
        
        # Adiciona o índice de grupo se aplicável
        if ig > 0:
            classificacao += f" ({ig})"
        
        # Obtém a descrição do grupo
        descricao = _obter_descricao_hrb(grupo, subgrupo)
        
        # Obtém avaliação como subleito
        avaliacao_subleito = _obter_avaliacao_subleito(grupo)
        
        return ClassificacaoHRBOutput(
            classificacao=classificacao,
            grupo_principal=grupo,
            subgrupo=subgrupo,
            indice_grupo=ig,
            descricao=descricao,
            avaliacao_subleito=avaliacao_subleito
        )
        
    except ValueError as ve:
        return ClassificacaoHRBOutput(erro=str(ve))
    except Exception as e:
        print(f"Erro inesperado na classificação HRB: {e}")
        return ClassificacaoHRBOutput(erro=f"Erro interno no servidor: {type(e).__name__}")


def _determinar_grupo_hrb(
    p200: float,
    p40: Optional[float],
    p10: Optional[float],
    ll: Optional[float],
    ip: Optional[float]
) -> tuple[str, Optional[str]]:
    """
    Determina o grupo e subgrupo HRB baseado nos critérios da AASHTO.
    
    Returns:
        Tupla (grupo, subgrupo)
    """
    
    # MATERIAIS GRANULARES (≤ 35% passando na #200)
    if p200 <= 35:
        
        # Grupo A-1
        if p200 <= 15:
            if p40 is not None and p40 <= 50:
                return ("A-1", "a")
            elif p40 is not None and p40 > 50:
                return ("A-1", "b")
            else:
                return ("A-1", None)
        
        # Grupo A-3 (areia fina)
        if p200 <= 10:
            if ll is not None and ll <= 40:
                if ip is None or ip <= 10:
                    # Verifica se tem características de A-3
                    # A-3: mais de 51% passa na #40 e IP ≤ 10
                    if p40 is not None and p40 > 51:
                        return ("A-3", None)
        
        # Grupo A-2 (materiais granulares siltosos ou argilosos)
        if ll is not None and ip is not None:
            if ll <= 40:
                if ip <= 10:
                    return ("A-2", "4")
                else:
                    return ("A-2", "6")
            else:  # LL > 40
                if ip <= 10:
                    return ("A-2", "5")
                else:
                    return ("A-2", "7")
        
        # Se não tem LL e IP, assume A-2-4 como padrão para granulares com finos
        if p200 > 15:
            return ("A-2", "4")
        
        # Padrão para granulares
        return ("A-1", None)
    
    # MATERIAIS SILTO-ARGILOSOS (> 35% passando na #200)
    else:
        if ll is None or ip is None:
            raise ValueError("LL e IP são necessários para classificar solos com mais de 35% de finos.")
        
        # Grupo A-7 (solos argilosos)
        if ll > 40 and ip > 10:
            # A-7-5 se IP ≤ LL - 30
            # A-7-6 se IP > LL - 30
            if ip <= (ll - 30):
                return ("A-7", "5")
            else:
                return ("A-7", "6")
        
        # Grupo A-6 (solos argilosos)
        if ll <= 40 and ip > 10:
            return ("A-6", None)
        
        # Grupo A-5 (solos siltosos)
        if ll > 40 and ip <= 10:
            return ("A-5", None)
        
        # Grupo A-4 (solos siltosos)
        if ll <= 40 and ip <= 10:
            return ("A-4", None)
        
        # Fallback
        return ("A-4", None)


def _calcular_indice_grupo(p200: float, ll: Optional[float], ip: Optional[float]) -> int:
    """
    Calcula o Índice de Grupo (IG) segundo a fórmula AASHTO.
    
    IG = (F - 35)[0.2 + 0.005(LL - 40)] + 0.01(F - 15)(IP - 10)
    
    Onde:
    - F = % passando na peneira #200
    - LL = Limite de Liquidez
    - IP = Índice de Plasticidade
    
    Restrições:
    - IG máximo de cada parcela é 4
    - IG negativo é considerado 0
    - IG é arredondado para o inteiro mais próximo
    """
    
    # IG só é calculado para solos com mais de 35% de finos
    if p200 <= 35:
        return 0
    
    # Se não temos LL ou IP, não podemos calcular IG
    if ll is None or ip is None:
        return 0
    
    # Primeira parcela: (F - 35)[0.2 + 0.005(LL - 40)]
    parcela1 = 0.0
    if p200 > 35 and ll > 40:
        parcela1 = (p200 - 35) * (0.2 + 0.005 * (ll - 40))
        parcela1 = min(parcela1, 4.0)  # Máximo de 4
    
    # Segunda parcela: 0.01(F - 15)(IP - 10)
    parcela2 = 0.0
    if p200 > 15 and ip > 10:
        parcela2 = 0.01 * (p200 - 15) * (ip - 10)
        parcela2 = min(parcela2, 4.0)  # Máximo de 4
    
    ig_total = parcela1 + parcela2
    
    # IG não pode ser negativo
    if ig_total < 0:
        ig_total = 0
    
    # Arredondar para o inteiro mais próximo
    return round(ig_total)


def _obter_descricao_hrb(grupo: str, subgrupo: Optional[str]) -> str:
    """
    Retorna a descrição do material baseado no grupo HRB.
    """
    descricoes = {
        "A-1": "Misturas bem graduadas de fragmentos de pedra, pedregulho e areia",
        "A-2": "Materiais granulares com teor de silte e argila",
        "A-3": "Areia fina de praia ou dunas, sem finos plásticos",
        "A-4": "Solos siltosos pouco ou nada plásticos",
        "A-5": "Solos siltosos com alta compressibilidade",
        "A-6": "Solos argilosos plásticos",
        "A-7": "Solos argilosos altamente plásticos"
    }
    
    subgrupo_desc = {
        "a": " (predominantemente pedregulho)",
        "b": " (predominantemente areia)",
        "4": " (características siltosas)",
        "5": " (características siltosas, alta compressibilidade)",
        "6": " (características argilosas)",
        "7": " (características argilosas, alta plasticidade)"
    }
    
    desc = descricoes.get(grupo, "Material não classificado")
    
    if subgrupo:
        desc += subgrupo_desc.get(subgrupo, "")
    
    return desc


def _obter_avaliacao_subleito(grupo: str) -> str:
    """
    Retorna a avaliação da qualidade do material como subleito de pavimento.
    """
    avaliacoes = {
        "A-1": "Excelente a Bom",
        "A-2": "Bom a Regular",
        "A-3": "Regular",
        "A-4": "Regular a Pobre",
        "A-5": "Pobre",
        "A-6": "Regular a Pobre",
        "A-7": "Pobre a Muito Pobre"
    }
    
    return avaliacoes.get(grupo, "Não avaliado")

