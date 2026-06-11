"""
Contacts API
GET    /api/contacts          — list (search, filter, pagination)
POST   /api/contacts          — create
GET    /api/contacts/<id>     — detail + activities + leads
PUT    /api/contacts/<id>     — update
DELETE /api/contacts/<id>     — delete (admin/manager only)
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from extensions import db
from models.contact  import Contact
from models.activity import Activity
from models.lead     import Lead
from utils.rbac      import get_current_role, get_current_user_id, min_role, role_required

contacts_bp = Blueprint('contacts', __name__, url_prefix='/api/contacts')


def _base_query(role, uid):
    q = Contact.query
    if role == 'sales':
        q = q.filter(Contact.assigned_to == uid)
    return q


@contacts_bp.route('', methods=['GET'])
@jwt_required()
def list_contacts():
    role = get_current_role()
    uid  = get_current_user_id()

    page     = request.args.get('page', 1, type=int)
    per_page = min(request.args.get('per_page', 20, type=int), 100)
    search   = request.args.get('q', '').strip()
    status   = request.args.get('status', '')
    source   = request.args.get('source', '')
    assigned = request.args.get('assigned_to', type=int)

    q = _base_query(role, uid)

    if search:
        like = f'%{search}%'
        q = q.filter(
            db.or_(
                Contact.full_name.ilike(like),
                Contact.email.ilike(like),
                Contact.company.ilike(like),
                Contact.phone.ilike(like),
            )
        )
    if status:
        q = q.filter(Contact.status == status)
    if source:
        q = q.filter(Contact.source == source)
    if assigned and role in ('admin', 'manager'):
        q = q.filter(Contact.assigned_to == assigned)

    q = q.order_by(Contact.created_at.desc())
    paginated = q.paginate(page=page, per_page=per_page, error_out=False)

    return jsonify({
        'success': True,
        'data': [c.to_dict() for c in paginated.items],
        'meta': {
            'page':     paginated.page,
            'per_page': paginated.per_page,
            'total':    paginated.total,
            'pages':    paginated.pages,
        },
    }), 200


@contacts_bp.route('', methods=['POST'])
@min_role('sales')
def create_contact():
    uid  = get_current_user_id()
    role = get_current_role()
    data = request.get_json(silent=True) or {}

    full_name = (data.get('full_name') or '').strip()
    if not full_name:
        return jsonify({'success': False, 'message': 'full_name is required'}), 400

    assigned = data.get('assigned_to') or uid
    if role == 'sales':
        assigned = uid

    contact = Contact(
        full_name   = full_name,
        email       = data.get('email', '').strip() or None,
        phone       = data.get('phone', '').strip() or None,
        company     = data.get('company', '').strip() or None,
        position    = data.get('position', '').strip() or None,
        source      = data.get('source', 'Other'),
        status      = data.get('status', 'prospect'),
        assigned_to = assigned,
        notes       = data.get('notes'),
        tags        = data.get('tags', []),
    )
    db.session.add(contact)
    db.session.commit()

    return jsonify({'success': True, 'data': contact.to_dict()}), 201


@contacts_bp.route('/<int:contact_id>', methods=['GET'])
@jwt_required()
def get_contact(contact_id):
    role = get_current_role()
    uid  = get_current_user_id()

    contact = Contact.query.get_or_404(contact_id)
    if role == 'sales' and contact.assigned_to != uid:
        return jsonify({'success': False, 'message': 'Access denied'}), 403

    activities = (
        Activity.query
        .filter_by(contact_id=contact_id)
        .order_by(Activity.activity_date.desc())
        .limit(20)
        .all()
    )
    leads = (
        Lead.query
        .filter_by(contact_id=contact_id)
        .order_by(Lead.created_at.desc())
        .all()
    )

    data = contact.to_dict(include_stats=True)
    data['recent_activities'] = [a.to_dict() for a in activities]
    data['leads']             = [l.to_dict() for l in leads]

    return jsonify({'success': True, 'data': data}), 200


@contacts_bp.route('/<int:contact_id>', methods=['PUT'])
@min_role('sales')
def update_contact(contact_id):
    role = get_current_role()
    uid  = get_current_user_id()

    contact = Contact.query.get_or_404(contact_id)
    if role == 'sales' and contact.assigned_to != uid:
        return jsonify({'success': False, 'message': 'Access denied'}), 403

    data   = request.get_json(silent=True) or {}
    fields = ['full_name', 'email', 'phone', 'company', 'position',
              'source', 'status', 'notes', 'tags']

    for field in fields:
        if field in data:
            setattr(contact, field, data[field])

    if 'assigned_to' in data and role in ('admin', 'manager'):
        contact.assigned_to = data['assigned_to']

    db.session.commit()
    return jsonify({'success': True, 'data': contact.to_dict()}), 200


@contacts_bp.route('/<int:contact_id>', methods=['DELETE'])
@role_required('admin', 'manager')
def delete_contact(contact_id):
    contact = Contact.query.get_or_404(contact_id)
    db.session.delete(contact)
    db.session.commit()
    return jsonify({'success': True, 'message': 'Contact deleted'}), 200
