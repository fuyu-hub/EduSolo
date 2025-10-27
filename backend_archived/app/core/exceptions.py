"""
Exceções personalizadas para a API EduSolo.

Define exceções customizadas para diferentes tipos de erros que podem
ocorrer durante os cálculos geotécnicos.
"""

from fastapi import HTTPException, status


class EduSoloException(HTTPException):
    """Exceção base para todas as exceções customizadas do EduSolo."""
    
    def __init__(self, detail: str, status_code: int = status.HTTP_400_BAD_REQUEST):
        super().__init__(status_code=status_code, detail=detail)


class CalculationError(EduSoloException):
    """
    Exceção lançada quando ocorre erro durante cálculos.
    
    Exemplos:
        - Divisão por zero
        - Valores fora de limites físicos
        - Convergência não atingida
    """
    
    def __init__(self, detail: str):
        super().__init__(
            detail=f"Erro no cálculo: {detail}",
            status_code=status.HTTP_400_BAD_REQUEST
        )


class InsufficientDataError(EduSoloException):
    """
    Exceção lançada quando dados insuficientes são fornecidos.
    
    Args:
        missing_fields: Lista de campos necessários mas não fornecidos
    """
    
    def __init__(self, missing_fields: List[str]):
        fields_str = ", ".join(missing_fields)
        super().__init__(
            detail=f"Dados insuficientes. Campos faltando: {fields_str}",
            status_code=status.HTTP_400_BAD_REQUEST
        )


class ValidationError(EduSoloException):
    """
    Exceção lançada quando validação de dados falha.
    
    Exemplos:
        - Valores negativos onde devem ser positivos
        - Porcentagens > 100%
        - Incompatibilidade entre parâmetros
    """
    
    def __init__(self, detail: str):
        super().__init__(
            detail=f"Erro de validação: {detail}",
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY
        )


class PhysicalLimitError(EduSoloException):
    """
    Exceção lançada quando valores excedem limites físicos.
    
    Exemplos:
        - Gs fora do intervalo [2.0, 3.5]
        - Porosidade > 100%
        - Índice de vazios negativo
    """
    
    def __init__(self, parameter: str, value: float, min_val: float = None, max_val: float = None):
        if min_val is not None and max_val is not None:
            detail = f"Parâmetro '{parameter}' = {value} está fora do intervalo físico válido [{min_val}, {max_val}]"
        elif min_val is not None:
            detail = f"Parâmetro '{parameter}' = {value} deve ser >= {min_val}"
        elif max_val is not None:
            detail = f"Parâmetro '{parameter}' = {value} deve ser <= {max_val}"
        else:
            detail = f"Parâmetro '{parameter}' = {value} está fora dos limites físicos"
        
        super().__init__(
            detail=detail,
            status_code=status.HTTP_400_BAD_REQUEST
        )


class ClassificationError(EduSoloException):
    """
    Exceção lançada quando classificação de solo falha.
    
    Exemplos:
        - Dados insuficientes para classificação USCS
        - Limites de Atterberg inconsistentes
    """
    
    def __init__(self, detail: str):
        super().__init__(
            detail=f"Erro na classificação: {detail}",
            status_code=status.HTTP_400_BAD_REQUEST
        )


# Importar List para type hints
from typing import List

