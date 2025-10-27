"""
Middleware de logging para requisições HTTP.

Registra informações sobre cada requisição recebida pela API,
incluindo tempo de processamento, status code e erros.
"""

import time
import logging
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from typing import Callable

logger = logging.getLogger("edusolo.middleware")


class LoggingMiddleware(BaseHTTPMiddleware):
    """
    Middleware que registra informações sobre requisições HTTP.
    
    Registra:
    - Método HTTP e path
    - Tempo de processamento
    - Status code da resposta
    - Erros (se houver)
    """
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        """
        Processa a requisição e registra informações.
        
        Args:
            request: Objeto de requisição FastAPI
            call_next: Função para chamar o próximo middleware/rota
        
        Returns:
            Response: Resposta HTTP
        """
        # Timestamp de início
        start_time = time.time()
        
        # Informações da requisição
        method = request.method
        url_path = request.url.path
        client_host = request.client.host if request.client else "unknown"
        
        # Log de entrada (apenas para DEBUG)
        if logger.level == logging.DEBUG:
            logger.debug(f"→ {method} {url_path} de {client_host}")
        
        # Processar requisição
        try:
            response = await call_next(request)
            
            # Calcular tempo de processamento
            process_time = time.time() - start_time
            process_time_ms = process_time * 1000
            
            # Adicionar header com tempo de processamento
            response.headers["X-Process-Time"] = f"{process_time_ms:.2f}ms"
            
            # Log de saída
            status_code = response.status_code
            
            # Determinar nível de log baseado no status code
            if status_code >= 500:
                log_level = logging.ERROR
            elif status_code >= 400:
                log_level = logging.WARNING
            else:
                log_level = logging.INFO
            
            logger.log(
                log_level,
                f"{method} {url_path} - Status: {status_code} - Tempo: {process_time_ms:.2f}ms"
            )
            
            return response
            
        except Exception as exc:
            # Calcular tempo até o erro
            process_time = time.time() - start_time
            process_time_ms = process_time * 1000
            
            # Log de erro
            logger.error(
                f"{method} {url_path} - ERRO: {type(exc).__name__}: {str(exc)} - Tempo: {process_time_ms:.2f}ms"
            )
            
            # Re-lançar exceção para ser tratada pelos handlers do FastAPI
            raise

