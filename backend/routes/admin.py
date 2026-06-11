"""
Admin API (admin role only)
GET    /api/admin/users              — list all users
POST   /api/admin/users              — create user
GET    /api/admin/users/<id>         — user detail
PUT    /api/admin/users/<id>         — update user (role, name, etc.)
DELETE /api/admin/users/<id>         — delete user
PATCH  /api/admin/users/<id>/block   — block/unblock user
GET    /api/admin/stats              — system statistics
GET    /api/admin/audit              — audit log placeholder
"""

from flask import Blueprint, request, jsonify
from datetime import datetime, timezone
from extensions import db
from models.user     import User
from models.lead     import Lead
from models.contact  import Contact
from models.deal     import Deal
from models.task     import Task
from models.activity import Activity
from utils.rbac      import role_required

admin_bp = Blueprint('admin', __name__, url_prefix='/api/admin')


@admin_bp.route('/users', methods=['GET'])
@role_required('admin')
def list_users():
    page     = request.args.get('page', 1, type=int)
    per_page = min(request.args.get('per_page', 20, type=int), 100)
    search   = request.args.get('q', '').strip()
    role_f   = request.args.get('role', '')

    q = User.query
    if search:
        q = q.filter(db.or_(
            User.name.ilike(f'%{search}%'),
            User.email.ilike(f'%{search}%'),
        ))
    if role_f:
        q = q.filter(User.role == role_f)

    q = q.order_by(User.created_at.desc())
    paginated = q.paginate(page=page, per_page=per_page, error_out=False)

    return jsonify({
        'success': True,
        'data': [u.to_dict() for u in paginated.items],
        'meta': {
            'page': paginated.page, 'per_page': paginated.per_page,
            'total': paginated.total, 'pages': paginated.pages,
        },
    }), 200


@admin_bp.route('/users', methods=['POST'])
@role_required('admin')
def create_user():
    data     = request.get_json(silent=True) or {}
    email    = (data.get('email') or '').strip().lower()
    password = data.get('password', '')
    name     = data.get('name', '').strip()
    role     = data.get('role', 'user')

    if not email or not password:
        return jsonify({'success': False, 'message': 'email and password are required'}), 400
    if len(password) < 6:
        return jsonify({'success': False, 'message': 'Password must be at least 6 chars'}), 400
    if role not in ('admin', 'manager', 'sales', 'user'):
        return jsonify({'success': False, 'message': 'Invalid role'}), 400
    if User.query.filter_by(email=email).first():
        return jsonify({'success': False, 'message': 'Email already in use'}), 409

    user = User(email=email, name=name or None, role=role)
    user.set_password(password)
    db.session.add(user)
    db.session.commit()
    return jsonify({'success': True, 'data': user.to_dict()}), 201


@admin_bp.route('/users/<int:user_id>', methods=['GET'])
@role_required('admin')
def get_user(user_id):
    user = User.query.get_or_404(user_id)
    data = user.to_dict()
    data['leads_count']    = Lead.query.filter_by(assigned_to=user_id).count()
    data['contacts_count'] = Contact.query.filter_by(assigned_to=user_id).count()
    data['tasks_count']    = Task.query.filter_by(assigned_to=user_id).count()
    return jsonify({'success': True, 'data': data}), 200


@admin_bp.route('/users/<int:user_id>', methods=['PUT'])
@role_required('admin')
def update_user(user_id):
    user = User.query.get_or_404(user_id)
    data = request.get_json(silent=True) or {}

    if 'name' in data:
        user.name = data['name'].strip() or None
    if 'phone' in data:
        user.phone = data['phone'].strip() or None
    if 'role' in data:
        if data['role'] not in ('admin', 'manager', 'sales', 'user'):
            return jsonify({'success': False, 'message': 'Invalid role'}), 400
        user.role = data['role']
    if 'avatar_url' in data:
        user.avatar_url = data['avatar_url']
    if 'email' in data:
        new_email = data['email'].strip().lower()
        if new_email != user.email and User.query.filter_by(email=new_email).first():
            return jsonify({'success': False, 'message': 'Email already in use'}), 409
        user.email = new_email
    if 'password' in data and data['password']:
        if len(data['password']) < 6:
            return jsonify({'success': False, 'message': 'Password too short'}), 400
        user.set_password(data['password'])

    db.session.commit()
    return jsonify({'success': True, 'data': user.to_dict()}), 200


@admin_bp.route('/users/<int:user_id>', methods=['DELETE'])
@role_required('admin')
def delete_user(user_id):
    user = User.query.get_or_404(user_id)
    if user.role == 'admin':
        admin_count = User.query.filter_by(role='admin').count()
        if admin_count <= 1:
            return jsonify({'success': False, 'message': 'Cannot delete the last admin'}), 400
    db.session.delete(user)
    db.session.commit()
    return jsonify({'success': True, 'message': 'User deleted'}), 200


@admin_bp.route('/users/<int:user_id>/block', methods=['PATCH'])
@role_required('admin')
def block_user(user_id):
    user = User.query.get_or_404(user_id)
    data = request.get_json(silent=True) or {}
    user.is_active = not data.get('block', True)
    db.session.commit()
    action = 'blocked' if not user.is_active else 'unblocked'
    return jsonify({'success': True, 'message': f'User {action}', 'data': user.to_dict()}), 200


@admin_bp.route('/stats', methods=['GET'])
@role_required('admin', 'manager')
def system_stats():
    return jsonify({
        'success': True,
        'data': {
            'total_users':      User.query.count(),
            'active_users':     User.query.filter_by(is_active=True).count(),
            'total_contacts':   Contact.query.count(),
            'total_leads':      Lead.query.count(),
            'open_leads':       Lead.query.filter_by(status='open').count(),
            'won_deals':        Deal.query.filter_by(status='won').count(),
            'total_tasks':      Task.query.count(),
            'pending_tasks':    Task.query.filter(Task.status.in_(['todo', 'in_progress'])).count(),
            'total_activities': Activity.query.count(),
        },
    }), 200


@admin_bp.route('/audit', methods=['GET'])
@role_required('admin')
def audit_log():
    return jsonify({
        'success': True,
        'data': [],
        'message': 'Audit log feature — connect AuditLog model in production.',
    }), 200
