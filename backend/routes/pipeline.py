"""
Pipeline Stages API
GET    /api/pipeline/stages         — list all stages
POST   /api/pipeline/stages         — create stage
PUT    /api/pipeline/stages/<id>    — update stage
DELETE /api/pipeline/stages/<id>    — delete stage
PATCH  /api/pipeline/stages/reorder — reorder stages
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from extensions import db
from models.pipeline import Stage
from utils.rbac import role_required, min_role

pipeline_bp = Blueprint('pipeline', __name__, url_prefix='/api/pipeline')


@pipeline_bp.route('/stages', methods=['GET'])
@jwt_required()
def list_stages():
    stages = Stage.query.order_by(Stage.order_index.asc()).all()
    return jsonify({'success': True, 'data': [s.to_dict() for s in stages]}), 200


@pipeline_bp.route('/stages', methods=['POST'])
@role_required('admin', 'manager')
def create_stage():
    data = request.get_json(silent=True) or {}
    name = (data.get('name') or '').strip()
    if not name:
        return jsonify({'success': False, 'message': 'name is required'}), 400

    max_order = db.session.query(db.func.max(Stage.order_index)).scalar() or 0
    stage = Stage(
        name        = name,
        color       = data.get('color', '#185FA5'),
        order_index = max_order + 1,
        is_default  = False,
    )
    db.session.add(stage)
    db.session.commit()
    return jsonify({'success': True, 'data': stage.to_dict()}), 201


@pipeline_bp.route('/stages/<int:stage_id>', methods=['PUT'])
@role_required('admin', 'manager')
def update_stage(stage_id):
    stage = Stage.query.get_or_404(stage_id)
    data  = request.get_json(silent=True) or {}

    if 'name' in data:
        stage.name = data['name'].strip()
    if 'color' in data:
        stage.color = data['color']
    if 'order_index' in data:
        stage.order_index = data['order_index']

    db.session.commit()
    return jsonify({'success': True, 'data': stage.to_dict()}), 200


@pipeline_bp.route('/stages/<int:stage_id>', methods=['DELETE'])
@role_required('admin')
def delete_stage(stage_id):
    stage = Stage.query.get_or_404(stage_id)
    if stage.is_default:
        return jsonify({'success': False, 'message': 'Cannot delete a default stage'}), 400
    if stage.leads.count() > 0:
        return jsonify({'success': False, 'message': 'Stage has leads — reassign them first'}), 400
    db.session.delete(stage)
    db.session.commit()
    return jsonify({'success': True, 'message': 'Stage deleted'}), 200


@pipeline_bp.route('/stages/reorder', methods=['PATCH'])
@role_required('admin', 'manager')
def reorder_stages():
    """
    Body: { "order": [{"id": 1, "order_index": 0}, ...] }
    """
    data  = request.get_json(silent=True) or {}
    order = data.get('order', [])

    if not order:
        return jsonify({'success': False, 'message': 'order list is required'}), 400

    for item in order:
        stage = Stage.query.get(item.get('id'))
        if stage:
            stage.order_index = item.get('order_index', stage.order_index)

    db.session.commit()
    stages = Stage.query.order_by(Stage.order_index.asc()).all()
    return jsonify({'success': True, 'data': [s.to_dict() for s in stages]}), 200
