"""
Validadores customizados para dados de entrada.

Fornece validadores reutilizáveis para tipos de dados comuns
em cálculos geotécnicos.
"""

from typing import Optional
from app.core.exceptions import ValidationError, PhysicalLimitError


# Limites físicos conhecidos
GS_MIN = 2.0  # Densidade relativa mínima típica
GS_MAX = 3.5  # Densidade relativa máxima típica
POROSIDADE_MAX = 100.0
UMIDADE_MAX = 1000.0  # Máximo razoável para umidade (%)
INDICE_VAZIOS_MAX = 10.0  # Máximo razoável


def validate_positive(value: float, param_name: str) -> float:
    """
    Valida se um valor é positivo.
    
    Args:
        value: Valor a ser validado
        param_name: Nome do parâmetro (para mensagem de erro)
    
    Returns:
        float: Valor validado
    
    Raises:
        ValidationError: Se valor <= 0
    """
    if value <= 0:
        raise ValidationError(f"'{param_name}' deve ser positivo (valor fornecido: {value})")
    return value


def validate_non_negative(value: float, param_name: str) -> float:
    """
    Valida se um valor é não-negativo.
    
    Args:
        value: Valor a ser validado
        param_name: Nome do parâmetro (para mensagem de erro)
    
    Returns:
        float: Valor validado
    
    Raises:
        ValidationError: Se valor < 0
    """
    if value < 0:
        raise ValidationError(f"'{param_name}' não pode ser negativo (valor fornecido: {value})")
    return value


def validate_percentage(value: float, param_name: str, max_value: float = 100.0) -> float:
    """
    Valida se um valor está no intervalo [0, max_value] (porcentagem).
    
    Args:
        value: Valor a ser validado
        param_name: Nome do parâmetro (para mensagem de erro)
        max_value: Valor máximo permitido (padrão: 100.0)
    
    Returns:
        float: Valor validado
    
    Raises:
        ValidationError: Se valor fora do intervalo
    """
    if value < 0 or value > max_value:
        raise ValidationError(
            f"'{param_name}' deve estar entre 0 e {max_value}% (valor fornecido: {value}%)"
        )
    return value


def validate_gs(gs: float) -> float:
    """
    Valida densidade relativa dos grãos (Gs).
    
    Args:
        gs: Densidade relativa dos grãos
    
    Returns:
        float: Gs validado
    
    Raises:
        PhysicalLimitError: Se Gs fora do intervalo típico [2.0, 3.5]
    """
    if gs < GS_MIN or gs > GS_MAX:
        raise PhysicalLimitError("Gs", gs, GS_MIN, GS_MAX)
    return gs


def validate_void_ratio(e: float) -> float:
    """
    Valida índice de vazios.
    
    Args:
        e: Índice de vazios
    
    Returns:
        float: Índice de vazios validado
    
    Raises:
        ValidationError: Se e < 0
        PhysicalLimitError: Se e > limite razoável
    """
    if e < 0:
        raise ValidationError(f"Índice de vazios não pode ser negativo (valor: {e})")
    if e > INDICE_VAZIOS_MAX:
        raise PhysicalLimitError("Índice de vazios", e, 0, INDICE_VAZIOS_MAX)
    return e


def validate_range(
    value: float,
    param_name: str,
    min_value: Optional[float] = None,
    max_value: Optional[float] = None
) -> float:
    """
    Valida se um valor está dentro de um intervalo.
    
    Args:
        value: Valor a ser validado
        param_name: Nome do parâmetro
        min_value: Valor mínimo (opcional)
        max_value: Valor máximo (opcional)
    
    Returns:
        float: Valor validado
    
    Raises:
        ValidationError: Se valor fora do intervalo
    """
    if min_value is not None and value < min_value:
        raise ValidationError(f"'{param_name}' deve ser >= {min_value} (valor: {value})")
    if max_value is not None and value > max_value:
        raise ValidationError(f"'{param_name}' deve ser <= {max_value} (valor: {value})")
    return value


def validate_sum_equals(
    values: list[tuple[float, str]],
    expected_sum: float,
    tolerance: float = 0.1,
    context: str = "soma"
) -> bool:
    """
    Valida se a soma de valores é igual ao esperado (com tolerância).
    
    Args:
        values: Lista de tuplas (valor, nome)
        expected_sum: Soma esperada
        tolerance: Tolerância percentual (padrão: 0.1%)
        context: Contexto da validação (para mensagem de erro)
    
    Returns:
        bool: True se válido
    
    Raises:
        ValidationError: Se soma não corresponde ao esperado
    """
    actual_sum = sum(v[0] for v in values)
    diff_percent = abs(actual_sum - expected_sum) / expected_sum * 100
    
    if diff_percent > tolerance:
        param_names = ", ".join(v[1] for v in values)
        raise ValidationError(
            f"{context}: soma de {param_names} ({actual_sum:.2f}) "
            f"difere do esperado ({expected_sum:.2f}) em {diff_percent:.2f}%"
        )
    
    return True


def empty_str_to_none(v):
    """
    Converte string vazia para None.
    
    Útil como validador Pydantic para campos opcionais.
    
    Args:
        v: Valor a ser convertido
    
    Returns:
        None se v == '', caso contrário retorna v
    """
    if v == '':
        return None
    return v

