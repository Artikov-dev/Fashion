import os
import warnings
import secrets
from datetime import timedelta

BASE_DIR = os.path.abspath(os.path.dirname(__file__))
DEFAULT_SQLITE_PATH = os.path.join(BASE_DIR, 'instance', 'nexora_crm.db')



class Config:
    SECRET_KEY             = os.environ.get('SECRET_KEY') or secrets.token_urlsafe(48)
    SQLALCHEMY_DATABASE_URI = _resolve_db_url()
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ENGINE_OPTIONS = {
        'pool_pre_ping': True,
        'pool_recycle':  300,
    }

    _raw_jwt_key = os.environ.get('JWT_SECRET_KEY') or ''
    if len(_raw_jwt_key) < 32:
        _raw_jwt_key = secrets.token_urlsafe(48)
    JWT_SECRET_KEY              = _raw_jwt_key
    JWT_ACCESS_TOKEN_EXPIRES    = timedelta(hours=2)
    JWT_REFRESH_TOKEN_EXPIRES   = timedelta(days=30)

    @staticmethod
    def init_app(app):
        pass


class DevelopmentConfig(Config):
    DEBUG = True


class TestingConfig(Config):
    TESTING = True
    DEBUG   = True
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'
    JWT_SECRET_KEY = 'test-jwt-secret-please-change-0123456789abcdef'
    WTF_CSRF_ENABLED = False


class ProductionConfig(Config):
    DEBUG = False

    @classmethod
    def init_app(cls, app):
        db_url = os.environ.get('DATABASE_URL', '')
        if db_url.startswith('postgres://'):
            db_url = db_url.replace('postgres://', 'postgresql://', 1)
        if db_url:
            cls.SQLALCHEMY_DATABASE_URI = db_url
        if not os.environ.get('SECRET_KEY'):
            warnings.warn('SECRET_KEY not set — using a random key (sessions invalid on restart)')
        if not os.environ.get('JWT_SECRET_KEY'):
            warnings.warn('JWT_SECRET_KEY not set — tokens invalid on restart')


config = {
    'development': DevelopmentConfig,
    'testing':     TestingConfig,
    'production':  ProductionConfig,
    'default':     DevelopmentConfig,
}
