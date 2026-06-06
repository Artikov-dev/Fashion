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
    # Ensure a sufficiently long JWT secret. In production, require an explicit secure key.
    _raw_jwt_key = os.environ.get('JWT_SECRET_KEY') or 'jwt-secret-key'
    if len(_raw_jwt_key) < 32:
        # If running in production, do not allow weak keys
        if os.environ.get('FLASK_ENV') == 'production' or os.environ.get('ENV') == 'production':
            raise RuntimeError('JWT_SECRET_KEY must be at least 32 bytes in production')
        # For development/testing, auto-generate a secure runtime key and warn
        warnings.warn('Provided JWT_SECRET_KEY is shorter than 32 bytes — generating a secure runtime key for local use', UserWarning)
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
        if not cls.SECRET_KEY:
            raise RuntimeError('SECRET_KEY must be set in production')
        if not cls.SQLALCHEMY_DATABASE_URI:
            raise RuntimeError('DATABASE_URL must be set in production')

# Configuration dictionary
config = {
    'development': DevelopmentConfig,
    'testing': TestingConfig,
    'production': ProductionConfig,
    'default': DevelopmentConfig
}
