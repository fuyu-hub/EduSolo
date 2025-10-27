"""
Sistema de cache para otimizar cálculos repetidos.

Fornece decoradores e utilitários para cachear resultados de cálculos
geotécnicos, melhorando a performance da API.
"""

import hashlib
import json
from functools import wraps
from typing import Any, Callable, Optional
from app.core.logging_config import get_logger

logger = get_logger(__name__)


def generate_cache_key(*args, **kwargs) -> str:
    """
    Gera uma chave única para cache baseada nos argumentos.
    
    Args:
        *args: Argumentos posicionais
        **kwargs: Argumentos nomeados
    
    Returns:
        str: Hash MD5 dos argumentos serializados
    """
    # Serializar argumentos para JSON
    try:
        # Converter Pydantic models para dict se necessário
        serialized_args = []
        for arg in args:
            if hasattr(arg, 'model_dump'):
                serialized_args.append(arg.model_dump())
            elif hasattr(arg, 'dict'):
                serialized_args.append(arg.dict())
            else:
                serialized_args.append(arg)
        
        serialized_kwargs = {}
        for key, value in kwargs.items():
            if hasattr(value, 'model_dump'):
                serialized_kwargs[key] = value.model_dump()
            elif hasattr(value, 'dict'):
                serialized_kwargs[key] = value.dict()
            else:
                serialized_kwargs[key] = value
        
        # Criar representação em string
        cache_data = {
            'args': serialized_args,
            'kwargs': serialized_kwargs
        }
        
        # Serializar para JSON com chaves ordenadas para consistência
        json_str = json.dumps(cache_data, sort_keys=True)
        
        # Gerar hash MD5
        hash_obj = hashlib.md5(json_str.encode('utf-8'))
        return hash_obj.hexdigest()
    
    except Exception as e:
        logger.warning(f"Erro ao gerar cache key: {e}")
        # Fallback: usar str() dos argumentos
        return hashlib.md5(str((args, kwargs)).encode('utf-8')).hexdigest()


class SimpleCache:
    """
    Cache simples em memória com limite de tamanho.
    
    Implementa LRU (Least Recently Used) básico.
    """
    
    def __init__(self, maxsize: int = 128):
        """
        Inicializa o cache.
        
        Args:
            maxsize: Número máximo de itens no cache
        """
        self.maxsize = maxsize
        self.cache: dict[str, Any] = {}
        self.access_order: list[str] = []
        self.hits = 0
        self.misses = 0
    
    def get(self, key: str) -> Optional[Any]:
        """
        Recupera um valor do cache.
        
        Args:
            key: Chave do cache
        
        Returns:
            Valor armazenado ou None se não encontrado
        """
        if key in self.cache:
            # Atualizar ordem de acesso (mover para o final)
            self.access_order.remove(key)
            self.access_order.append(key)
            self.hits += 1
            logger.debug(f"Cache HIT: {key}")
            return self.cache[key]
        else:
            self.misses += 1
            logger.debug(f"Cache MISS: {key}")
            return None
    
    def set(self, key: str, value: Any) -> None:
        """
        Armazena um valor no cache.
        
        Args:
            key: Chave do cache
            value: Valor a ser armazenado
        """
        # Se cache está cheio, remover item menos recentemente usado
        if len(self.cache) >= self.maxsize and key not in self.cache:
            lru_key = self.access_order.pop(0)
            del self.cache[lru_key]
            logger.debug(f"Cache EVICT (LRU): {lru_key}")
        
        # Armazenar valor
        if key in self.cache:
            # Atualizar ordem de acesso
            self.access_order.remove(key)
        
        self.cache[key] = value
        self.access_order.append(key)
        logger.debug(f"Cache SET: {key}")
    
    def clear(self) -> None:
        """Limpa todo o cache."""
        self.cache.clear()
        self.access_order.clear()
        self.hits = 0
        self.misses = 0
        logger.info("Cache limpo")
    
    def get_stats(self) -> dict:
        """
        Retorna estatísticas do cache.
        
        Returns:
            dict: Estatísticas (hits, misses, size, hit_rate)
        """
        total_requests = self.hits + self.misses
        hit_rate = (self.hits / total_requests * 100) if total_requests > 0 else 0
        
        return {
            'size': len(self.cache),
            'maxsize': self.maxsize,
            'hits': self.hits,
            'misses': self.misses,
            'total_requests': total_requests,
            'hit_rate': f"{hit_rate:.2f}%"
        }


# Instância global do cache
_global_cache = SimpleCache(maxsize=256)


def cached_calculation(func: Callable) -> Callable:
    """
    Decorador para cachear resultados de cálculos.
    
    Usage:
        @cached_calculation
        def calcular_algo(dados: Input) -> Output:
            # ... cálculos ...
            return resultado
    
    Args:
        func: Função a ser cacheada
    
    Returns:
        Função decorada com cache
    """
    @wraps(func)
    def wrapper(*args, **kwargs):
        # Gerar chave de cache
        cache_key = generate_cache_key(*args, **kwargs)
        
        # Tentar recuperar do cache
        cached_result = _global_cache.get(cache_key)
        if cached_result is not None:
            logger.debug(f"Retornando resultado cacheado para {func.__name__}")
            return cached_result
        
        # Calcular resultado
        logger.debug(f"Calculando {func.__name__}...")
        result = func(*args, **kwargs)
        
        # Armazenar no cache (apenas se não houver erro)
        if hasattr(result, 'erro') and result.erro is None:
            _global_cache.set(cache_key, result)
        elif not hasattr(result, 'erro'):
            # Para resultados que não têm campo 'erro'
            _global_cache.set(cache_key, result)
        
        return result
    
    return wrapper


def get_cache_stats() -> dict:
    """
    Retorna estatísticas globais do cache.
    
    Returns:
        dict: Estatísticas do cache
    """
    return _global_cache.get_stats()


def clear_cache() -> None:
    """Limpa todo o cache global."""
    _global_cache.clear()


# Decorador para desabilitar cache em desenvolvimento/testes
def cacheable(enabled: bool = True):
    """
    Decorador condicional para cache.
    
    Args:
        enabled: Se True, usa cache; se False, executa função normalmente
    
    Returns:
        Decorador apropriado
    """
    def decorator(func: Callable) -> Callable:
        if enabled:
            return cached_calculation(func)
        else:
            return func
    
    return decorator

