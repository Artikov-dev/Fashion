"""
Flask application factory.
Changes vs original:
  - Registers the new wishlist_bp blueprint
  - Adds CORS origins for common dev ports
  - Imports WishlistItem model so its table is created
  - Keeps all existing blueprints and JWT configuration
"""

import os
from flask import Flask, jsonify
from flask_cors import CORS
from flask_jwt_extended import jwt_required, get_jwt_identity
from flask_migrate import Migrate
from flasgger import Swagger

from config import config as app_config
from extensions import db, jwt
from models.tokenblacklist import TokenBlacklist

# Import all models so SQLAlchemy registers their tables
from models.user    import User
from models.product import Product, Category
from models.cart    import Cart, CartItem, Invoice
from models.order   import Order, OrderItem
from models.wishlist import Wishlist, WishlistItem   # NEW

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

    # CORS — production da barcha originlarga ruxsat (Nginx orqali keladi)
    is_production = os.environ.get('FLASK_CONFIG', '') == 'production' or \
                    os.environ.get('FLASK_ENV', '') == 'production'

    if is_production:
        cors_origins = '*'
    else:
        cors_origins = [
            'http://localhost:5173',
            'http://127.0.0.1:5173',
            'http://localhost:3000',
            'http://127.0.0.1:3000',
            'http://localhost:4173',
            'http://localhost',
            'http://localhost:80',
            'https://fashion-clothes-shop-brown.vercel.app',
        ]

    CORS(
        app,
        resources={r'/api/*': {'origins': cors_origins}},
        supports_credentials=not is_production,
        methods=['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allow_headers=['Content-Type', 'Authorization', 'Accept', 'X-Requested-With'],
    )

    # Blueprints
    from routes.auth     import auth_bp
    from routes.products import products_bp
    from routes.cart     import cart_bp
    from routes.orders   import orders_bp
    from routes.admin    import admin_bp
    from routes.wishlist import wishlist_bp   # NEW

    app.register_blueprint(auth_bp)
    app.register_blueprint(products_bp)
    app.register_blueprint(cart_bp)
    app.register_blueprint(orders_bp)
    app.register_blueprint(admin_bp)
    app.register_blueprint(wishlist_bp)      # NEW

    # Swagger
    swagger_config = {
        'headers': [],
        'specs': [{'endpoint': 'apispec', 'route': '/swagger.json',
                   'rule_filter': lambda rule: True, 'model_filter': lambda tag: True}],
        'static_url_path': '/flasgger_static',
        'swagger_ui': True,
        'specs_route': '/swagger/',
    }
    swagger_template = {
        'swagger': '2.0',
        'info': {
            'title':       'Fashion Clothes Store API',
            'description': 'REST API for the Fashion E-Commerce platform',
            'version':     '2.0.0',
        },
        'basePath': '/api',
        'schemes':  ['http', 'https'],
    }
    Swagger(app, config=swagger_config, template=swagger_template)

    # Health / root
    @app.route('/')
    def home():
        return {
            'message': 'Fashion Clothes Shop API',
            'status':  'running',
            'version': '2.0',
            'docs':    '/swagger/',
        }

    @app.route('/health')
    def health():
        """Health check endpoint for Docker/Kubernetes liveness probes"""
        try:
            db.session.execute('SELECT 1')
            return {'status': 'healthy', 'database': 'connected'}, 200
        except Exception as e:
            return {'status': 'unhealthy', 'database': 'failed', 'error': str(e)}, 503

    @app.route('/api/health')
    def api_health():
        """Health check for API (same as /health but under /api)"""
        try:
            db.session.execute('SELECT 1')
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
