"""
Leads API
GET    /api/leads                  — list (filter by stage/priority/status)
POST   /api/leads                  — create
GET    /api/leads/<id>             — detail
PUT    /api/leads/<id>             — update
DELETE /api/leads/<id>             — delete
PATCH  /api/leads/<id>/stage       — kanban drag-drop
PATCH  /api/leads/<id>/status      — won/lost/archived
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from datetime import datetime, timezone
from extensions import db
from models.lead  import Lead
from models.deal  import Deal
from utils.rbac   import get_current_role, get_current_user_id, min_role, role_required

leads_bp = Blueprint('leads', __name__, url_prefix='/api/leads')


def _base_query(role, uid):
    q = Lead.query
    if role == 'sales':
        q = q.filter(Lead.assigned_to == uid)
    return q


@leads_bp.route('', methods=['GET'])
@jwt_required()
def list_leads():
    role = get_current_role()
    uid  = get_current_user_id()

    page      = request.args.get('page', 1, type=int)
    per_page  = min(request.args.get('per_page', 20, type=int), 100)
    stage_id  = request.args.get('stage_id', type=int)
    priority  = request.args.get('priority', '')
    status    = request.args.get('status', '')
    contact_id = request.args.get('contact_id', type=int)
    search    = request.args.get('q', '').strip()

    q = _base_query(role, uid)

    if stage_id:
        q = q.filter(Lead.pipeline_stage_id == stage_id)
    if priority:
        q = q.filter(Lead.priority == priority)
    if status:
        q = q.filter(Lead.status == status)
    if contact_id:
        q = q.filter(Lead.contact_id == contact_id)
    if search:
        q = q.filter(Lead.title.ilike(f'%{search}%'))

    q = q.order_by(Lead.created_at.desc())
    paginated = q.paginate(page=page, per_page=per_page, error_out=False)

    return jsonify({
        'success': True,
        'data': [l.to_dict(include_contact=True) for l in paginated.items],
        'meta': {
            'page':     paginated.page,
            'per_page': paginated.per_page,
            'total':    paginated.total,
            'pages':    paginated.pages,
        },
    }), 200


@leads_bp.route('', methods=['POST'])
@min_role('sales')
def create_lead():
    uid  = get_current_user_id()
    role = get_current_role()
    data = request.get_json(silent=True) or {}

    title = (data.get('title') or '').strip()
    if not title:
        return jsonify({'success': False, 'message': 'title is required'}), 400
    if not data.get('contact_id'):
        return jsonify({'success': False, 'message': 'contact_id is required'}), 400

    expected_close = None
    if data.get('expected_close_date'):
        try:
            expected_close = datetime.fromisoformat(data['expected_close_date'])
        except ValueError:
            pass

    assigned = data.get('assigned_to') or uid
    if role == 'sales':
        assigned = uid

    lead = Lead(
        title               = title,
        contact_id          = data['contact_id'],
        pipeline_stage_id   = data.get('pipeline_stage_id'),
        value               = data.get('value', 0),
        currency            = data.get('currency', 'UZS'),
        priority            = data.get('priority', 'medium'),
        status              = 'open',
        assigned_to         = assigned,
        expected_close_date = expected_close,
    )
    db.session.add(lead)
    db.session.commit()

    return jsonify({'success': True, 'data': lead.to_dict(include_contact=True)}), 201


@leads_bp.route('/<int:lead_id>', methods=['GET'])
@jwt_required()
def get_lead(lead_id):
    role = get_current_role()
    uid  = get_current_user_id()

    lead = Lead.query.get_or_404(lead_id)
    if role == 'sales' and lead.assigned_to != uid:
        return jsonify({'success': False, 'message': 'Access denied'}), 403

    data = lead.to_dict(include_contact=True)
    data['tasks']      = [t.to_dict() for t in lead.tasks.order_by('due_date').limit(10)]
    data['activities'] = [a.to_dict() for a in lead.activities.order_by(
        __import__('models.activity', fromlist=['Activity']).Activity.activity_date.desc()
    ).limit(20)]
    return jsonify({'success': True, 'data': data}), 200


@leads_bp.route('/<int:lead_id>', methods=['PUT'])
@min_role('sales')
def update_lead(lead_id):
    role = get_current_role()
    uid  = get_current_user_id()

    lead = Lead.query.get_or_404(lead_id)
    if role == 'sales' and lead.assigned_to != uid:
        return jsonify({'success': False, 'message': 'Access denied'}), 403

    data = request.get_json(silent=True) or {}
    fields = ['title', 'value', 'currency', 'priority', 'pipeline_stage_id', 'contact_id']
    for field in fields:
        if field in data:
            setattr(lead, field, data[field])

    if 'expected_close_date' in data and data['expected_close_date']:
        try:
            lead.expected_close_date = datetime.fromisoformat(data['expected_close_date'])
        except ValueError:
            pass

    if 'assigned_to' in data and role in ('admin', 'manager'):
        lead.assigned_to = data['assigned_to']

    db.session.commit()
    return jsonify({'success': True, 'data': lead.to_dict(include_contact=True)}), 200


@leads_bp.route('/<int:lead_id>', methods=['DELETE'])
@role_required('admin', 'manager')
def delete_lead(lead_id):
    lead = Lead.query.get_or_404(lead_id)
    db.session.delete(lead)
    db.session.commit()
    return jsonify({'success': True, 'message': 'Lead deleted'}), 200


@leads_bp.route('/<int:lead_id>/stage', methods=['PATCH'])
@min_role('sales')
def update_lead_stage(lead_id):
    role = get_current_role()
    uid  = get_current_user_id()

    lead = Lead.query.get_or_404(lead_id)
    if role == 'sales' and lead.assigned_to != uid:
        return jsonify({'success': False, 'message': 'Access denied'}), 403

    data = request.get_json(silent=True) or {}
    stage_id = data.get('pipeline_stage_id')
    if stage_id is None:
        return jsonify({'success': False, 'message': 'pipeline_stage_id is required'}), 400

    lead.pipeline_stage_id = stage_id
    db.session.commit()
    return jsonify({'success': True, 'data': lead.to_dict()}), 200


@leads_bp.route('/<int:lead_id>/status', methods=['PATCH'])
@min_role('sales')
def update_lead_status(lead_id):
    role = get_current_role()
    uid  = get_current_user_id()

    lead = Lead.query.get_or_404(lead_id)
    if role == 'sales' and lead.assigned_to != uid:
        return jsonify({'success': False, 'message': 'Access denied'}), 403

    data       = request.get_json(silent=True) or {}
    new_status = data.get('status')
    if new_status not in ('open', 'won', 'lost', 'archived'):
        return jsonify({'success': False, 'message': 'Invalid status'}), 400

    lead.status = new_status

    if new_status == 'won':
        deal = Deal(
            lead_id    = lead.id,
            contact_id = lead.contact_id,
            amount     = lead.value,
            status     = 'won',
            won_at     = datetime.now(timezone.utc),
            created_by = uid,
        )
        db.session.add(deal)
    elif new_status == 'lost':
        deal = Deal(
            lead_id     = lead.id,
            contact_id  = lead.contact_id,
            amount      = lead.value,
            status      = 'lost',
            lost_reason = data.get('lost_reason'),
            created_by  = uid,
        )
        db.session.add(deal)

    db.session.commit()
    return jsonify({'success': True, 'data': lead.to_dict()}), 200
