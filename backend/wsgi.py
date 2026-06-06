import os
from app import create_app

_config = os.environ.get('FLASK_CONFIG') or os.environ.get('ENV') or os.environ.get('FLASK_ENV') or 'development'
app = create_app(_config)

if __name__ == "__main__":
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=app.config.get('DEBUG', False))
