"""
Tasks API
GET    /api/tasks          — list (filter by status/due_date)
POST   /api/tasks          — create
PUT    /api/tasks/<id>     — update
PATCH  /api/tasks/<id>/status — quick status update
DELETE /api/tasks/<id>     — delete
GET    /api/tasks/my       — tasks assigned to current user
GET    /api/tasks/overdue  — overdue tasks
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from datetime import datetime, timezone
from extensions import db
from models.task import Task
from utils.rbac  import get_current_role, get_current_user_id, min_role, role_required

tasks_bp = Blueprint('tasks', __name__, url_prefix='/api/tasks')


def _base_query(role, uid):
    q = Task.query
    if role == 'sales':
        q = q.filter(Task.assigned_to == uid)
    return q


@tasks_bp.route('', methods=['GET'])
@jwt_required()
def list_tasks():
    role = get_current_role()
    uid  = get_current_user_id()

    page      = request.args.get('page', 1, type=int)
    per_page  = min(request.args.get('per_page', 20, type=int), 100)
    status    = request.args.get('status', '')
    priority  = request.args.get('priority', '')
    due_from  = request.args.get('due_from', '')
    due_to    = request.args.get('due_to', '')
    contact_id = request.args.get('contact_id', type=int)
    lead_id   = request.args.get('lead_id', type=int)

    q = _base_query(role, uid)

    if status:
        q = q.filter(Task.status == status)
    if priority:
        q = q.filter(Task.priority == priority)
    if contact_id:
        q = q.filter(Task.contact_id == contact_id)
    if lead_id:
        q = q.filter(Task.lead_id == lead_id)
    if due_from:
        try:
            q = q.filter(Task.due_date >= datetime.fromisoformat(due_from))
        except ValueError:
            pass
    if due_to:
        try:
            q = q.filter(Task.due_date <= datetime.fromisoformat(due_to))
        except ValueError:
            pass

    q = q.order_by(Task.due_date.asc().nullslast(), Task.created_at.desc())
    paginated = q.paginate(page=page, per_page=per_page, error_out=False)

    return jsonify({
        'success': True,
        'data': [t.to_dict() for t in paginated.items],
        'meta': {
            'page': paginated.page, 'per_page': paginated.per_page,
            'total': paginated.total, 'pages': paginated.pages,
        },
    }), 200


@tasks_bp.route('/my', methods=['GET'])
@jwt_required()
def my_tasks():
    uid = get_current_user_id()
    tasks = (
        Task.query
        .filter(Task.assigned_to == uid, Task.status.in_(['todo', 'in_progress']))
        .order_by(Task.due_date.asc().nullslast())
        .limit(50)
        .all()
    )
    return jsonify({'success': True, 'data': [t.to_dict() for t in tasks]}), 200


@tasks_bp.route('/overdue', methods=['GET'])
@jwt_required()
def overdue_tasks():
    role = get_current_role()
    uid  = get_current_user_id()
    now  = datetime.now(timezone.utc)

    q = Task.query.filter(
        Task.due_date < now,
        Task.status.in_(['todo', 'in_progress']),
    )
    if role == 'sales':
        q = q.filter(Task.assigned_to == uid)

    tasks = q.order_by(Task.due_date.asc()).limit(100).all()
    return jsonify({'success': True, 'data': [t.to_dict() for t in tasks]}), 200


@tasks_bp.route('', methods=['POST'])
@min_role('sales')
def create_task():
    uid  = get_current_user_id()
    role = get_current_role()
    data = request.get_json(silent=True) or {}

    title = (data.get('title') or '').strip()
    if not title:
        return jsonify({'success': False, 'message': 'title is required'}), 400

    due_date = None
    if data.get('due_date'):
        try:
            due_date = datetime.fromisoformat(data['due_date'])
        except ValueError:
            pass

    assigned = data.get('assigned_to') or uid
    if role == 'sales':
        assigned = uid

    task = Task(
        title       = title,
        description = data.get('description'),
        due_date    = due_date,
        priority    = data.get('priority', 'medium'),
        status      = data.get('status', 'todo'),
        contact_id  = data.get('contact_id'),
        lead_id     = data.get('lead_id'),
        assigned_to = assigned,
        created_by  = uid,
    )
    db.session.add(task)
    db.session.commit()
    return jsonify({'success': True, 'data': task.to_dict()}), 201


@tasks_bp.route('/<int:task_id>', methods=['PUT'])
@min_role('sales')
def update_task(task_id):
    role = get_current_role()
    uid  = get_current_user_id()

    task = Task.query.get_or_404(task_id)
    if role == 'sales' and task.assigned_to != uid:
        return jsonify({'success': False, 'message': 'Access denied'}), 403

    data = request.get_json(silent=True) or {}
    fields = ['title', 'description', 'priority', 'status', 'contact_id', 'lead_id']
    for field in fields:
        if field in data:
            setattr(task, field, data[field])

    if 'due_date' in data and data['due_date']:
        try:
            task.due_date = datetime.fromisoformat(data['due_date'])
        except ValueError:
            pass

    if 'assigned_to' in data and role in ('admin', 'manager'):
        task.assigned_to = data['assigned_to']

    db.session.commit()
    return jsonify({'success': True, 'data': task.to_dict()}), 200


@tasks_bp.route('/<int:task_id>/status', methods=['PATCH'])
@min_role('sales')
def update_task_status(task_id):
    role = get_current_role()
    uid  = get_current_user_id()

    task = Task.query.get_or_404(task_id)
    if role == 'sales' and task.assigned_to != uid:
        return jsonify({'success': False, 'message': 'Access denied'}), 403

    data   = request.get_json(silent=True) or {}
    status = data.get('status')
    if status not in ('todo', 'in_progress', 'done', 'cancelled'):
        return jsonify({'success': False, 'message': 'Invalid status'}), 400

    task.status = status
    db.session.commit()
    return jsonify({'success': True, 'data': task.to_dict()}), 200


@tasks_bp.route('/<int:task_id>', methods=['DELETE'])
@min_role('sales')
def delete_task(task_id):
    role = get_current_role()
    uid  = get_current_user_id()

    task = Task.query.get_or_404(task_id)
    if role == 'sales' and task.assigned_to != uid and task.created_by != uid:
        return jsonify({'success': False, 'message': 'Access denied'}), 403

    db.session.delete(task)
    db.session.commit()
    return jsonify({'success': True, 'message': 'Task deleted'}), 200
