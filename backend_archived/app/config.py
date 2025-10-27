"""
Configurações centralizadas da aplicação EduSolo.

Este módulo gerencia todas as configurações da API, incluindo:
- Configurações de ambiente
- CORS
- Versão da API
- Configurações de logging
"""

from typing import List
from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    """Configurações da aplicação."""
    
    # Informações da API
    API_VERSION: str = "0.4.0"
    API_TITLE: str = "EduSolo API"
    API_DESCRIPTION: str = "Backend para cálculos de Mecânica dos Solos."
    
    # Ambiente
    ENVIRONMENT: str = "development"  # development, production, testing
    DEBUG: bool = True
    
    # CORS
    ALLOWED_ORIGINS: List[str] = ["*"]  # Em produção, especificar domínios
    CORS_ENABLED: bool = True
    
    # Logging
    LOG_LEVEL: str = "INFO"
    LOG_FILE: str = "app.log"
    
    # Rate Limiting (para implementação futura)
    RATE_LIMIT_ENABLED: bool = False
    RATE_LIMIT_PER_MINUTE: int = 100
    
    # Database (para implementação futura)
    DATABASE_URL: str | None = None
    
    # Segurança
    SECRET_KEY: str = "edusolo-secret-key-change-in-production"  # Mudar em produção!
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True


@lru_cache()
def get_settings() -> Settings:
    """
    Retorna uma instância em cache das configurações.
    
    O uso de @lru_cache garante que as configurações sejam carregadas
    apenas uma vez durante a execução da aplicação.
    
    Returns:
        Settings: Objeto de configurações da aplicação
    """
    return Settings()


# Instância global de configurações
settings = get_settings()

