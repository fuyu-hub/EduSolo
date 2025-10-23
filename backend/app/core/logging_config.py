"""
Configuração de logging para a aplicação EduSolo.

Configura o sistema de logs com diferentes níveis e handlers
para desenvolvimento e produção.
"""

import logging
import sys
from pathlib import Path
from datetime import datetime
from app.config import settings


def setup_logging():
    """
    Configura o sistema de logging da aplicação.
    
    - Em desenvolvimento: logs no console e arquivo
    - Em produção: logs estruturados com rotação
    """
    
    # Criar diretório de logs se não existir
    log_dir = Path("logs")
    log_dir.mkdir(exist_ok=True)
    
    # Formato de log
    log_format = '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    date_format = '%Y-%m-%d %H:%M:%S'
    
    # Configurar nível de log
    log_level = getattr(logging, settings.LOG_LEVEL.upper(), logging.INFO)
    
    # Handlers
    handlers = []
    
    # Handler para console (stdout)
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(log_level)
    console_formatter = logging.Formatter(log_format, date_format)
    console_handler.setFormatter(console_formatter)
    handlers.append(console_handler)
    
    # Handler para arquivo (com timestamp no nome)
    if settings.ENVIRONMENT != "testing":
        log_filename = log_dir / f"edusolo_{datetime.now().strftime('%Y%m%d')}.log"
        file_handler = logging.FileHandler(log_filename, encoding='utf-8')
        file_handler.setLevel(log_level)
        file_formatter = logging.Formatter(log_format, date_format)
        file_handler.setFormatter(file_formatter)
        handlers.append(file_handler)
    
    # Configurar logging básico
    logging.basicConfig(
        level=log_level,
        format=log_format,
        datefmt=date_format,
        handlers=handlers
    )
    
    # Logger específico da aplicação
    logger = logging.getLogger("edusolo")
    logger.setLevel(log_level)
    
    # Reduzir verbosidade de bibliotecas externas
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
    
    logger.info(f"Sistema de logging iniciado - Nível: {settings.LOG_LEVEL} - Ambiente: {settings.ENVIRONMENT}")
    
    return logger


def get_logger(name: str = "edusolo") -> logging.Logger:
    """
    Retorna um logger com o nome especificado.
    
    Args:
        name: Nome do logger (geralmente __name__ do módulo)
    
    Returns:
        logging.Logger: Instância do logger
    """
    return logging.getLogger(name)

