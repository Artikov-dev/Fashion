"""
Activities API
GET    /api/activities          — last 50 activities
POST   /api/activities          — create
GET    /api/activities/<id>     — detail
DELETE /api/activities/<id>     — delete
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from datetime import datetime, timezone
from extensions import db
from models.activity import Activity
from utils.rbac import get_current_role, get_current_user_id, min_role, role_required

activities_bp = Blueprint('activities', __name__, url_prefix='/api/activities')


@activities_bp.route('', methods=['GET'])
@jwt_required()
def list_activities():
    role = get_current_role()
    uid  = get_current_user_id()

    page       = request.args.get('page', 1, type=int)
    per_page   = min(request.args.get('per_page', 50, type=int), 100)
    contact_id = request.args.get('contact_id', type=int)
    lead_id    = request.args.get('lead_id', type=int)
    act_type   = request.args.get('type', '')

    q = Activity.query
    if role == 'sales':
        q = q.filter(Activity.created_by == uid)
    if contact_id:
        q = q.filter(Activity.contact_id == contact_id)
    if lead_id:
        q = q.filter(Activity.lead_id == lead_id)
    if act_type:
        q = q.filter(Activity.type == act_type)

    q = q.order_by(Activity.activity_date.desc())
    paginated = q.paginate(page=page, per_page=per_page, error_out=False)

    return jsonify({
        'success': True,
        'data': [a.to_dict() for a in paginated.items],
        'meta': {
            'page': paginated.page, 'per_page': paginated.per_page,
            'total': paginated.total, 'pages': paginated.pages,
        },
    }), 200


@activities_bp.route('', methods=['POST'])
@min_role('sales')
def create_activity():
    uid  = get_current_user_id()
    data = request.get_json(silent=True) or {}

    title = (data.get('title') or '').strip()
    if not title:
        return jsonify({'success': False, 'message': 'title is required'}), 400
    if not data.get('contact_id') and not data.get('lead_id'):
        return jsonify({'success': False, 'message': 'contact_id or lead_id is required'}), 400

    activity_date = datetime.now(timezone.utc)
    if data.get('activity_date'):
        try:
            activity_date = datetime.fromisoformat(data['activity_date'])
        except ValueError:
            pass

    activity = Activity(
        type             = data.get('type', 'note'),
        title            = title,
        description      = data.get('description'),
        contact_id       = data.get('contact_id'),
        lead_id          = data.get('lead_id'),
        created_by       = uid,
        activity_date    = activity_date,
        duration_minutes = data.get('duration_minutes'),
    )
    db.session.add(activity)
    db.session.commit()
    return jsonify({'success': True, 'data': activity.to_dict()}), 201


@activities_bp.route('/<int:activity_id>', methods=['GET'])
@jwt_required()
def get_activity(activity_id):
    activity = Activity.query.get_or_404(activity_id)
    return jsonify({'success': True, 'data': activity.to_dict()}), 200


@activities_bp.route('/<int:activity_id>', methods=['DELETE'])
@min_role('sales')
def delete_activity(activity_id):
    role = get_current_role()
    uid  = get_current_user_id()

    activity = Activity.query.get_or_404(activity_id)
    if role == 'sales' and activity.created_by != uid:
        return jsonify({'success': False, 'message': 'Access denied'}), 403

    db.session.delete(activity)
    db.session.commit()
    return jsonify({'success': True, 'message': 'Activity deleted'}), 200
