"""
Role-Based Access Control decorators.

Hierarchy (highest → lowest):
  admin > manager > sales > user

Usage:
    @role_required('admin')
    @role_required('manager', 'admin')
    @role_required('sales', 'manager', 'admin')
"""

from functools import wraps
from flask import jsonify
from flask_jwt_extended import jwt_required, get_jwt

ROLE_HIERARCHY = ['user', 'sales', 'manager', 'admin']


def _role_index(role: str) -> int:
    try:
        return ROLE_HIERARCHY.index(role)
    except ValueError:
        return -1


def role_required(*allowed_roles):
    """
    Decorator that combines @jwt_required() with a role check.
    Pass the minimum set of roles allowed; e.g.:
        @role_required('admin')            — only admins
        @role_required('manager', 'admin') — managers AND admins
    """
    def decorator(fn):
        @wraps(fn)
        @jwt_required()
        def wrapper(*args, **kwargs):
            claims = get_jwt()
            user_role = claims.get('role', 'user')
            if user_role not in allowed_roles:
                return jsonify({
                    'success': False,
                    'message': f"Access denied. Required roles: {', '.join(allowed_roles)}",
                }), 403
            return fn(*args, **kwargs)
        return wrapper
    return decorator


def min_role(minimum: str):
    """
    Decorator that allows the given role AND every role above it in the hierarchy.
    E.g. @min_role('sales') allows: sales, manager, admin
    """
    def decorator(fn):
        @wraps(fn)
        @jwt_required()
        def wrapper(*args, **kwargs):
            claims = get_jwt()
            user_role = claims.get('role', 'user')
            if _role_index(user_role) < _role_index(minimum):
                return jsonify({
                    'success': False,
                    'message': f"Access denied. Minimum role required: {minimum}",
                }), 403
            return fn(*args, **kwargs)
        return wrapper
    return decorator


def get_current_role() -> str:
    """Return the role from the current JWT claims (call inside a jwt_required context)."""
    return get_jwt().get('role', 'user')


def get_current_user_id() -> int:
    """Return integer user id from the current JWT identity."""
    from flask_jwt_extended import get_jwt_identity
    try:
        return int(get_jwt_identity())
    except (TypeError, ValueError):
        return None
