"""
Utility decorators for authentication and authorization.

BUG FIXED: admin_required previously passed raw JWT identity (a string)
           to db.session.get(User, user_id).  SQLAlchemy's get() requires
           the primary-key type (int), so this always returned None, causing
           every admin route to return 403.  Now casts to int before lookup.
"""

from functools import wraps
from flask import jsonify
from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity
from extensions import db


def admin_required(fn):
    """
    Decorator: restrict access to users whose role == 'admin'.
    Must be applied AFTER @jwt_required() (or calls verify_jwt_in_request itself).
    """
    @wraps(fn)
    def wrapper(*args, **kwargs):
        verify_jwt_in_request()
        # JWT identity is stored as str(user.id) — convert back to int
        user_id = get_jwt_identity()
        try:
            user_id = int(user_id)
        except (TypeError, ValueError):
            return jsonify({'success': False, 'message': 'Invalid token identity'}), 401

        from models.user import User
        user = db.session.get(User, user_id)

        if not user:
            return jsonify({'success': False, 'message': 'User not found'}), 404
        if not user.is_admin:
            return jsonify({'success': False, 'message': 'Admin access required'}), 403

        return fn(*args, **kwargs)
    return wrapper


def login_required(fn):
    """
    Decorator: require any authenticated user (admin or customer).
    """
    @wraps(fn)
    def wrapper(*args, **kwargs):
        verify_jwt_in_request()
        user_id = get_jwt_identity()
        try:
            user_id = int(user_id)
        except (TypeError, ValueError):
            return jsonify({'success': False, 'message': 'Invalid token identity'}), 401

        from models.user import User
        user = db.session.get(User, user_id)
        if not user:
            return jsonify({'success': False, 'message': 'User not found'}), 404
        return fn(*args, **kwargs)
    return wrapper
