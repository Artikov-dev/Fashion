"""
Authentication routes
- POST /api/auth/register
- POST /api/auth/login
- POST /api/auth/logout
- POST /api/auth/refresh
- GET  /api/auth/me
- PUT  /api/auth/me
- PUT  /api/auth/change-password

BUG FIXED: JWT identity stored as str(user.id); all lookups now cast to int.
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import (
    create_access_token, create_refresh_token,
    jwt_required, get_jwt_identity, get_jwt,
)
from datetime import timedelta
from extensions import db
from models.user import User
from models.tokenblacklist import TokenBlacklist

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')

# ─── helpers ───────────────────────────────────────────────────────────────────

def _make_tokens(user):
    access = create_access_token(
        identity=str(user.id),
        additional_claims={'role': user.role},
        expires_delta=timedelta(hours=1),
    )
    refresh = create_refresh_token(
        identity=str(user.id),
        additional_claims={'role': user.role},
    )
    return access, refresh


def _current_user():
    """Return the User object for the JWT caller, or None."""
    uid = get_jwt_identity()
    try:
        uid = int(uid)
    except (TypeError, ValueError):
        return None
    return db.session.get(User, uid)


# ─── routes ────────────────────────────────────────────────────────────────────

@auth_bp.route('/register', methods=['POST'])
def register():
    """Register a new customer account."""
    data = request.get_json(silent=True) or {}
    email    = (data.get('email') or '').strip().lower()
    password = data.get('password', '')
    name     = data.get('name', '').strip()

    if not email or not password:
        return jsonify({'success': False, 'message': 'Email and password are required'}), 400
    if len(password) < 6:
        return jsonify({'success': False, 'message': 'Password must be at least 6 characters'}), 400

    try:
        # Ensure any prior failed transaction state doesn't break this request
        # (Postgres requires ROLLBACK after an error).
        user_exists = User.query.filter_by(email=email).first()
        if user_exists:
            return jsonify({'success': False, 'message': 'An account with this email already exists'}), 409

        user = User(email=email, role='customer', name=name or None)
        user.set_password(password)
        db.session.add(user)
        db.session.commit()

        access, refresh = _make_tokens(user)
        return jsonify({
            'success': True,
            'message': 'Account created successfully',
            'data': {
                'user':          user.to_dict(),
                'access_token':  access,
                'refresh_token': refresh,
            },
        }), 201
    except Exception as e:
        # Ensure transaction is rolled back and stacktrace is visible in Gunicorn logs.
        import traceback
        db.session.rollback()
        traceback.print_exc()
        return jsonify({'success': False, 'message': 'Registration failed', 'error': str(e)}), 500


@auth_bp.route('/login', methods=['POST'])
def login():
    """Authenticate and return tokens."""
    data     = request.get_json(silent=True) or {}
    email    = (data.get('email') or '').strip().lower()
    password = data.get('password', '')

    if not email or not password:
        return jsonify({'success': False, 'message': 'Email and password are required'}), 400

    user = User.query.filter_by(email=email).first()
    if not user or not user.check_password(password):
        return jsonify({'success': False, 'message': 'Invalid email or password'}), 401
    if not user.is_active:
        return jsonify({'success': False, 'message': 'Your account has been deactivated'}), 403

    try:
        access, refresh = _make_tokens(user)
        return jsonify({
            'success': True,
            'message': 'Login successful',
            'data': {
                'user':          user.to_dict(),
                'access_token':  access,
                'refresh_token': refresh,
            },
        }), 200
    except Exception as e:
        return jsonify({'success': False, 'message': 'Login failed', 'error': str(e)}), 500


@auth_bp.route('/refresh', methods=['POST'])
@jwt_required(refresh=True)
def refresh():
    """Issue a new short-lived access token using the refresh token."""
    user = _current_user()
    if not user:
        return jsonify({'success': False, 'message': 'User not found'}), 404

    access = create_access_token(
        identity=str(user.id),
        additional_claims={'role': user.role},
        expires_delta=timedelta(hours=1),
    )
    return jsonify({'success': True, 'data': {'access_token': access}}), 200


@auth_bp.route('/logout', methods=['POST'])
@jwt_required()
def logout():
    """Blacklist the current token (stateful revocation)."""
    try:
        jti = get_jwt()['jti']
        if not TokenBlacklist.query.filter_by(jti=jti).first():
            db.session.add(TokenBlacklist(jti=jti))
            db.session.commit()
        return jsonify({'success': True, 'message': 'Logged out successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': 'Logout failed', 'error': str(e)}), 500


@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def get_me():
    """Return the authenticated user's profile."""
    user = _current_user()
    if not user:
        return jsonify({'success': False, 'message': 'User not found'}), 404
    return jsonify({'success': True, 'data': user.to_dict()}), 200


@auth_bp.route('/me', methods=['PUT'])
@jwt_required()
def update_me():
    """Update authenticated user's name / phone / email."""
    user = _current_user()
    if not user:
        return jsonify({'success': False, 'message': 'User not found'}), 404

    data = request.get_json(silent=True) or {}
    try:
        if 'name' in data:
            user.name = data['name'].strip() or None
        if 'phone' in data:
            user.phone = data['phone'].strip() or None
        if 'email' in data:
            new_email = data['email'].strip().lower()
            if new_email != user.email:
                if User.query.filter_by(email=new_email).first():
                    return jsonify({'success': False, 'message': 'Email already in use'}), 409
                user.email = new_email
        db.session.commit()
        return jsonify({'success': True, 'data': user.to_dict()}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': 'Update failed', 'error': str(e)}), 500


@auth_bp.route('/change-password', methods=['PUT'])
@jwt_required()
def change_password():
    """Change authenticated user's password."""
    user = _current_user()
    if not user:
        return jsonify({'success': False, 'message': 'User not found'}), 404

    data = request.get_json(silent=True) or {}
    current  = data.get('current_password', '')
    new_pass = data.get('new_password', '')

    if not current or not new_pass:
        return jsonify({'success': False, 'message': 'current_password and new_password required'}), 400
    if len(new_pass) < 6:
        return jsonify({'success': False, 'message': 'New password must be at least 6 characters'}), 400
    if not user.check_password(current):
        return jsonify({'success': False, 'message': 'Current password is incorrect'}), 400

    try:
        user.set_password(new_pass)
        db.session.commit()
        return jsonify({'success': True, 'message': 'Password updated successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': 'Password change failed', 'error': str(e)}), 500
