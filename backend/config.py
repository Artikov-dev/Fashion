import os
import warnings
import secrets
from datetime import timedelta

BASE_DIR = os.path.abspath(os.path.dirname(__file__))
DEFAULT_SQLITE_PATH = os.path.join(BASE_DIR, 'instance', 'fashion_shop.db')

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'dev-secret-key'
    # For development: always use SQLite unless DATABASE_URL is explicitly set to postgresql
    # Render uses postgres:// but SQLAlchemy needs postgresql://
    database_url = os.environ.get('DATABASE_URL') or f'sqlite:///{DEFAULT_SQLITE_PATH}'
    if database_url and database_url.startswith('postgres://'):
        database_url = database_url.replace('postgres://', 'postgresql://', 1)
    # Force SQLite for development if running locally and no DATABASE_URL is explicitly set
    if not os.environ.get('DATABASE_URL'):
        database_url = f'sqlite:///{DEFAULT_SQLITE_PATH}'
    SQLALCHEMY_DATABASE_URI = database_url
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    # Ensure a sufficiently long JWT secret.
    # Production deployments should provide JWT_SECRET_KEY, but we also add a safe fallback
    # to prevent the app from failing to boot due to misconfiguration.
    _raw_jwt_key = os.environ.get('JWT_SECRET_KEY') or 'jwt-secret-key'
    if len(_raw_jwt_key) < 32:
        warnings.warn(
            'JWT_SECRET_KEY is missing or shorter than 32 bytes. Generating a secure runtime key as a fallback. '
            'Set JWT_SECRET_KEY explicitly for production to keep tokens valid across restarts.',
            UserWarning,
        )
        _raw_jwt_key = secrets.token_urlsafe(48)
    JWT_SECRET_KEY = _raw_jwt_key
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=1)
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=30)

    @staticmethod
    def init_app(app):
        pass

class DevelopmentConfig(Config):
    DEBUG = True

class TestingConfig(Config):
    TESTING = True
    DEBUG = True
    # Use SQLite for testing to avoid PostgreSQL dependency
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'
    # Use a sufficiently long deterministic test key
    JWT_SECRET_KEY = os.environ.get('TEST_JWT_SECRET') or 'test-jwt-secret-please-change-0123456789'
    WTF_CSRF_ENABLED = False

class ProductionConfig(Config):
    DEBUG = False
    ENV = 'production'
    SECRET_KEY = os.environ.get('SECRET_KEY')
    database_url = os.environ.get('DATABASE_URL')
    if database_url and database_url.startswith('postgres://'):
        database_url = database_url.replace('postgres://', 'postgresql://', 1)
    SQLALCHEMY_DATABASE_URI = database_url

    @classmethod
    def init_app(cls, app):
        # Avoid hard-crashing on missing SECRET_KEY in production.
        # JWT_SECRET_KEY is handled in the base Config with a secure fallback.
        # SECRET_KEY is required by Flask for sessions/csrf signing.
        if not cls.SECRET_KEY:
            warnings.warn(
                'SECRET_KEY is missing in production. Generating a secure runtime key as a fallback. '
                'Set SECRET_KEY explicitly for production to keep session/csrf signing stable across restarts.',
                UserWarning,
            )
            cls.SECRET_KEY = secrets.token_urlsafe(48)

        if not cls.SQLALCHEMY_DATABASE_URI:
            raise RuntimeError('DATABASE_URL must be set in production')

# Configuration dictionary
config = {
    'development': DevelopmentConfig,
    'testing': TestingConfig,
    'production': ProductionConfig,
    'default': DevelopmentConfig
}
