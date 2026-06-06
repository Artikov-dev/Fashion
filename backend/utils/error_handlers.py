"""
Global error handling and logging utilities.
"""

from flask import jsonify
import logging
import os


def register_error_handlers(app):
    """Register global HTTP error handlers."""

    @app.errorhandler(400)
    def bad_request(e):
        return jsonify({'success': False, 'message': 'Bad request',
                        'error': str(e.description) if hasattr(e, 'description') else 'Invalid request'}), 400

    @app.errorhandler(401)
    def unauthorized(e):
        return jsonify({'success': False, 'message': 'Unauthorized', 'error': 'Authentication required'}), 401

    @app.errorhandler(403)
    def forbidden(e):
        return jsonify({'success': False, 'message': 'Forbidden', 'error': 'Access denied'}), 403

    @app.errorhandler(404)
    def not_found(e):
        try:
            from flask import request
            logging.getLogger(__name__).warning('404: %s %s', request.method, request.path)
        except Exception:
            pass
        return jsonify({'success': False, 'message': 'Not found', 'error': 'Resource not found'}), 404

    @app.errorhandler(405)
    def method_not_allowed(e):
        return jsonify({'success': False, 'message': 'Method not allowed'}), 405

    @app.errorhandler(422)
    def unprocessable(e):
        return jsonify({'success': False, 'message': 'Unprocessable entity',
                        'error': str(e.description) if hasattr(e, 'description') else 'Validation failed'}), 422

    @app.errorhandler(500)
    def internal_error(e):
        logging.getLogger(__name__).exception('Internal server error: %s', e)
        return jsonify({'success': False, 'message': 'Internal server error'}), 500


def setup_logging(app):
    """Configure application logging."""
    logs_dir = 'logs'
    os.makedirs(logs_dir, exist_ok=True)

    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s %(name)s %(levelname)s %(message)s',
        handlers=[
            logging.FileHandler(os.path.join(logs_dir, 'app.log')),
            logging.StreamHandler(),
        ],
    )
    logging.getLogger('sqlalchemy.engine').setLevel(logging.WARNING)
    return app
