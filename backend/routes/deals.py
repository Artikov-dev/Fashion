"""
Deals API
GET    /api/deals          — list
POST   /api/deals          — create
GET    /api/deals/<id>     — detail
PUT    /api/deals/<id>     — update
PATCH  /api/deals/<id>/close — close deal (won/lost)
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from datetime import datetime, timezone
from extensions import db
from models.deal import Deal
from utils.rbac  import get_current_role, get_current_user_id, min_role, role_required

deals_bp = Blueprint('deals', __name__, url_prefix='/api/deals')


@deals_bp.route('', methods=['GET'])
@jwt_required()
def list_deals():
    role = get_current_role()
    uid  = get_current_user_id()

    page     = request.args.get('page', 1, type=int)
    per_page = min(request.args.get('per_page', 20, type=int), 100)
    status   = request.args.get('status', '')

    q = Deal.query
    if role == 'sales':
        q = q.filter(Deal.created_by == uid)
    if status:
        q = q.filter(Deal.status == status)

    q = q.order_by(Deal.created_at.desc())
    paginated = q.paginate(page=page, per_page=per_page, error_out=False)

    return jsonify({
        'success': True,
        'data': [d.to_dict() for d in paginated.items],
        'meta': {
            'page':     paginated.page,
            'per_page': paginated.per_page,
            'total':    paginated.total,
            'pages':    paginated.pages,
        },
    }), 200


@deals_bp.route('', methods=['POST'])
@min_role('sales')
def create_deal():
    uid  = get_current_user_id()
    data = request.get_json(silent=True) or {}

    if not data.get('lead_id') or not data.get('contact_id'):
        return jsonify({'success': False, 'message': 'lead_id and contact_id are required'}), 400

    deal = Deal(
        lead_id    = data['lead_id'],
        contact_id = data['contact_id'],
        amount     = data.get('amount', 0),
        status     = data.get('status', 'pending'),
        created_by = uid,
    )
    db.session.add(deal)
    db.session.commit()
    return jsonify({'success': True, 'data': deal.to_dict()}), 201


@deals_bp.route('/<int:deal_id>', methods=['GET'])
@jwt_required()
def get_deal(deal_id):
    deal = Deal.query.get_or_404(deal_id)
    return jsonify({'success': True, 'data': deal.to_dict()}), 200


@deals_bp.route('/<int:deal_id>', methods=['PUT'])
@role_required('admin', 'manager')
def update_deal(deal_id):
    deal = Deal.query.get_or_404(deal_id)
    data = request.get_json(silent=True) or {}

    for field in ['amount', 'status', 'lost_reason']:
        if field in data:
            setattr(deal, field, data[field])

    db.session.commit()
    return jsonify({'success': True, 'data': deal.to_dict()}), 200


@deals_bp.route('/<int:deal_id>/close', methods=['PATCH'])
@min_role('sales')
def close_deal(deal_id):
    uid  = get_current_user_id()
    role = get_current_role()

    deal = Deal.query.get_or_404(deal_id)
    if role == 'sales' and deal.created_by != uid:
        return jsonify({'success': False, 'message': 'Access denied'}), 403

    data   = request.get_json(silent=True) or {}
    status = data.get('status')
    if status not in ('won', 'lost'):
        return jsonify({'success': False, 'message': 'status must be won or lost'}), 400

    deal.status = status
    if status == 'won':
        deal.won_at = datetime.now(timezone.utc)
    else:
        deal.lost_reason = data.get('lost_reason')

    db.session.commit()
    return jsonify({'success': True, 'data': deal.to_dict()}), 200
