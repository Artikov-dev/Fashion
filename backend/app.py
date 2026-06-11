"""
Nexora CRM — Flask Application Factory
"""

import os
from flask import Flask, jsonify
from flask_cors import CORS
from flask_jwt_extended import jwt_required, get_jwt_identity
from flask_migrate import Migrate

from config import config as app_config
from extensions import db, jwt

# Import all models so SQLAlchemy registers their tables
from models.user           import User
from models.tokenblacklist import TokenBlacklist
from models.contact        import Contact
from models.pipeline       import Stage
from models.lead           import Lead
from models.deal           import Deal
from models.task           import Task
from models.activity       import Activity

migrate = Migrate()


def create_app(config_name='development'):
    app = Flask(__name__)
    app.url_map.strict_slashes = False

    # Logging
    try:
        from utils.error_handlers import setup_logging
        setup_logging(app)
    except Exception:
        pass

    # Config
    if isinstance(config_name, str):
        config_class = app_config.get(config_name, app_config.get('default'))
    else:
        config_class = config_name or app_config.get('default')

    app.config.from_object(config_class)
    if hasattr(config_class, 'init_app'):
        config_class.init_app(app)

    db.init_app(app)
    jwt.init_app(app)
    migrate.init_app(app, db)

    # CORS
    is_production = os.environ.get('FLASK_CONFIG', '') == 'production' or \
                    os.environ.get('FLASK_ENV', '') == 'production'

    cors_origins = '*' if is_production else [
        'http://localhost:5173',
        'http://127.0.0.1:5173',
        'http://localhost:3000',
        'http://127.0.0.1:3000',
        'http://localhost:4173',
        'http://localhost:80',
        'http://localhost',
    ]

    CORS(
        app,
        resources={r'/api/*': {'origins': cors_origins}},
        supports_credentials=not is_production,
        methods=['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allow_headers=['Content-Type', 'Authorization', 'Accept', 'X-Requested-With'],
    )

    # Blueprints
    from routes.auth       import auth_bp
    from routes.contacts   import contacts_bp
    from routes.leads      import leads_bp
    from routes.deals      import deals_bp
    from routes.tasks      import tasks_bp
    from routes.pipeline   import pipeline_bp
    from routes.activities import activities_bp
    from routes.analytics  import analytics_bp
    from routes.admin      import admin_bp

    for bp in [auth_bp, contacts_bp, leads_bp, deals_bp, tasks_bp,
               pipeline_bp, activities_bp, analytics_bp, admin_bp]:
        app.register_blueprint(bp)

    # Health endpoints
    @app.route('/')
    def home():
        return {
            'message': 'Nexora CRM API',
            'status':  'running',
            'version': '1.0.0',
        }

    @app.route('/health')
    @app.route('/api/health')
    def health():
        try:
            db.session.execute(db.text('SELECT 1'))
            return {'status': 'healthy', 'database': 'connected'}, 200
        except Exception as e:
            return {'status': 'unhealthy', 'database': 'failed', 'error': str(e)}, 503

    @app.route('/api/test-auth')
    @jwt_required()
    def test_auth():
        return jsonify({'message': 'JWT working', 'identity': get_jwt_identity()}), 200

    # Error handlers
    from utils.error_handlers import register_error_handlers
    register_error_handlers(app)

    # Seed CLI
    from seed import init_app as init_seed
    init_seed(app)

    # JWT callbacks
    @jwt.expired_token_loader
    def expired_token_callback(jwt_header, jwt_payload):
        return {'message': 'Token has expired', 'error': 'token_expired'}, 401

    @jwt.invalid_token_loader
    def invalid_token_callback(error):
        return {'message': 'Invalid token', 'error': 'invalid_token', 'details': str(error)}, 422

    @jwt.unauthorized_loader
    def missing_token_callback(error):
        return {'message': 'Authorization header missing', 'error': 'authorization_required'}, 401

    @jwt.revoked_token_loader
    def revoked_token_callback(jwt_header, jwt_payload):
        return {'message': 'Token has been revoked', 'error': 'token_revoked'}, 401

    @jwt.token_in_blocklist_loader
    def check_if_token_revoked(jwt_header, jwt_payload):
        jti = jwt_payload['jti']
        return TokenBlacklist.query.filter_by(jti=jti).first() is not None

    return app


_flask_config = (
    os.environ.get('FLASK_CONFIG')
    or os.environ.get('ENV')
    or os.environ.get('FLASK_ENV')
    or 'development'
)
app = create_app(_flask_config)

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=app.config.get('DEBUG', False))
