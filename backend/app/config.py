"""
EcoVision Backend Configuration
Separates Development, Production, and Testing environments with strict security controls:
- DEBUG is False by default
- CORS restricts origins by environment (wildcard rejected in production)
- Request size bounded via MAX_CONTENT_LENGTH
- Validates configuration on application startup
"""

import os
import secrets
from pathlib import Path
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")

# Approved local frontend development origins
DEFAULT_DEV_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000"
]

def parse_cors_origins(raw_origins: str | None, is_production: bool = False) -> list[str]:
    """Parse and validate CORS origins from environment variable."""
    if not raw_origins or not raw_origins.strip():
        if is_production:
            return []
        return DEFAULT_DEV_ORIGINS

    origins = [orig.strip().rstrip("/") for orig in raw_origins.split(",") if orig.strip()]
    
    if is_production and ("*" in origins or any(o == "*" for o in origins)):
        raise ValueError(
            "CRITICAL SECURITY CONFIGURATION ERROR: Wildcard '*' CORS origin is strictly "
            "prohibited in production environment. Please specify explicit authorized domains."
        )

    return origins if origins else (DEFAULT_DEV_ORIGINS if not is_production else [])


class Config:
    """Base Configuration with hardened security defaults."""
    PROJECT_NAME = "EcoVision"
    DESCRIPTION = "City Environmental Monitoring, Analysis and Prediction System"
    VERSION = "0.2.0"
    
    # Security Defaults: Debug and Testing are ALWAYS False by default
    ENV = os.getenv("FLASK_ENV", "development").lower()
    DEBUG = False
    TESTING = False
    
    # Server Binding
    PORT = int(os.getenv("PORT", 5000))
    HOST = os.getenv("HOST", "127.0.0.1")
    
    # Session / Token Secret Key
    SECRET_KEY = os.getenv("SECRET_KEY")
    if not SECRET_KEY:
        # Generate a runtime cryptographically strong ephemeral key if not set
        SECRET_KEY = secrets.token_hex(32)
    
    # Database
    DATABASE_PATH = os.getenv("DATABASE_PATH", str(BASE_DIR / "ecovision.db"))
    
    # Payload Bounds (1 MB limit prevents memory-exhaustion DoS attacks)
    MAX_CONTENT_LENGTH = int(os.getenv("MAX_CONTENT_LENGTH", 1 * 1024 * 1024))
    
    # Rate Limiting
    RATELIMIT_ENABLED = os.getenv("RATELIMIT_ENABLED", "True").lower() in ("true", "1", "yes")
    RATELIMIT_DEFAULT = os.getenv("RATELIMIT_DEFAULT", "60/minute")
    RATELIMIT_ML = os.getenv("RATELIMIT_ML", "10/minute")
    
    # CORS Origins
    CORS_ORIGINS = parse_cors_origins(os.getenv("CORS_ORIGINS"), is_production=(ENV == "production"))


class DevelopmentConfig(Config):
    """Development environment configuration."""
    ENV = "development"
    DEBUG = os.getenv("FLASK_DEBUG", "False").lower() in ("true", "1", "yes")
    TESTING = False


class ProductionConfig(Config):
    """Production environment configuration with strict enforcement."""
    ENV = "production"
    DEBUG = False
    TESTING = False
    HOST = os.getenv("HOST", "127.0.0.1")
    CORS_ORIGINS = parse_cors_origins(os.getenv("CORS_ORIGINS"), is_production=True)


class TestingConfig(Config):
    """Automated testing configuration."""
    ENV = "testing"
    DEBUG = False
    TESTING = True
    DATABASE_PATH = str(BASE_DIR / "test_ecovision.db")
    CORS_ORIGINS = ["http://localhost:5173", "http://127.0.0.1:5173"]
    RATELIMIT_ENABLED = False


def get_config_by_name(env_name: str | None = None) -> type[Config]:
    """Factory to retrieve config class by environment name."""
    env = (env_name or os.getenv("FLASK_ENV", "development")).lower()
    if env == "production":
        return ProductionConfig
    elif env == "testing":
        return TestingConfig
    return DevelopmentConfig


def validate_config(app) -> None:
    """Validate critical runtime configuration parameters at startup."""
    is_prod = app.config.get("ENV") == "production"
    
    # 1. Reject DEBUG in Production
    if is_prod and app.config.get("DEBUG") is True:
        raise RuntimeError("FATAL: FLASK_DEBUG cannot be True in production mode.")
        
    # 2. Reject Wildcard CORS in Production
    cors_origins = app.config.get("CORS_ORIGINS", [])
    if is_prod:
        if not cors_origins or "*" in cors_origins:
            raise RuntimeError("FATAL: Wildcard '*' or empty CORS origins prohibited in production.")
            
    # 3. Validate database directory writeability
    db_path = Path(app.config.get("DATABASE_PATH", "ecovision.db"))
    db_dir = db_path.parent
    if not db_dir.exists():
        db_dir.mkdir(parents=True, exist_ok=True)
