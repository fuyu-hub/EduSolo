"""
Formatadores para saída de dados.

Fornece funções para formatar números e resultados de forma consistente.
"""

from typing import Optional
import numpy as np


def format_number(
    value: Optional[float],
    decimal_places: int = 3,
    scientific_threshold: float = 1e6
) -> Optional[float]:
    """
    Formata um número para um número específico de casas decimais.
    
    Args:
        value: Valor a ser formatado (pode ser None)
        decimal_places: Número de casas decimais
        scientific_threshold: Limite para usar notação científica
    
    Returns:
        float ou None: Valor formatado ou None se entrada for None
    """
    if value is None:
        return None
    
    # Verificar se é NaN ou infinito
    if not np.isfinite(value):
        return None
    
    # Arredondar para o número de casas decimais
    rounded = round(value, decimal_places)
    
    return rounded


def format_percentage(
    value: Optional[float],
    decimal_places: int = 2
) -> Optional[float]:
    """
    Formata um valor percentual.
    
    Args:
        value: Valor percentual (já em %, não decimal)
        decimal_places: Número de casas decimais
    
    Returns:
        float ou None: Percentual formatado
    """
    return format_number(value, decimal_places)


def safe_divide(
    numerator: float,
    denominator: float,
    default: Optional[float] = None
) -> Optional[float]:
    """
    Divide dois números de forma segura.
    
    Args:
        numerator: Numerador
        denominator: Denominador
        default: Valor padrão se denominador for zero
    
    Returns:
        float ou None: Resultado da divisão ou default
    """
    if abs(denominator) < 1e-10:  # Evitar divisão por zero
        return default
    
    result = numerator / denominator
    
    if not np.isfinite(result):
        return default
    
    return result


def format_scientific(value: float, precision: int = 3) -> str:
    """
    Formata número em notação científica.
    
    Args:
        value: Valor a ser formatado
        precision: Número de casas decimais na mantissa
    
    Returns:
        str: Número formatado em notação científica
    """
    return f"{value:.{precision}e}"


def clean_dict(data: dict) -> dict:
    """
    Remove valores None de um dicionário.
    
    Args:
        data: Dicionário a ser limpo
    
    Returns:
        dict: Dicionário sem valores None
    """
    return {k: v for k, v in data.items() if v is not None}


def format_array(
    arr: list[float],
    decimal_places: int = 3
) -> list[float]:
    """
    Formata todos os elementos de uma lista.
    
    Args:
        arr: Lista de números
        decimal_places: Número de casas decimais
    
    Returns:
        list[float]: Lista formatada
    """
    return [format_number(x, decimal_places) for x in arr]

