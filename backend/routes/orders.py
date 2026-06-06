"""
Orders routes
- GET  /api/orders/history     user's order history (alias frontend uses)
- GET  /api/orders/my-orders   same
- GET  /api/orders/<id>        single order
- POST /api/orders/            create order directly (rare; checkout goes through cart)

BUG FIXED: int() cast around get_jwt_identity() since identity is stored as str.
NEW:       /api/orders/history alias so frontend doesn't get 404.
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from extensions import db
from models.order import Order
from models.user import User

orders_bp = Blueprint('orders', __name__, url_prefix='/api/orders')


def _uid():
    return int(get_jwt_identity())


def _is_admin(user_id):
    u = db.session.get(User, user_id)
    return u and u.is_admin


# ─── Customer: order history ─────────────────────────────────────────────────

@orders_bp.route('/history', methods=['GET'])
@jwt_required()
def get_order_history():
    """
    Get the current user's order history.
    Frontend calls GET /api/orders/history
    """
    try:
        uid = _uid()
        orders = (
            Order.query
            .filter_by(user_id=uid)
            .order_by(Order.created_at.desc())
            .all()
        )
        return jsonify({'success': True, 'data': [o.to_dict() for o in orders]}), 200
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500


@orders_bp.route('/my-orders', methods=['GET'])
@jwt_required()
def get_my_orders():
    """Alias kept for backward compatibility."""
    return get_order_history()


@orders_bp.route('/<int:order_id>', methods=['GET'])
@jwt_required()
def get_order(order_id):
    """Get single order — user can only see their own, admins can see all."""
    order = db.session.get(Order, order_id)
    if not order:
        return jsonify({'success': False, 'message': 'Order not found'}), 404

    uid = _uid()
    if order.user_id != uid and not _is_admin(uid):
        return jsonify({'success': False, 'message': 'Access denied'}), 403

    return jsonify({
        'success': True,
        'data': order.to_dict(),
    }), 200


@orders_bp.route('/', methods=['POST'])
@jwt_required()
def create_order():
    """
    Create order directly from cart_items payload.
    Most of the time checkout goes through /api/cart/checkout; this
    endpoint exists for completeness / alternative flows.
    """
    uid  = _uid()
    data = request.get_json(silent=True) or {}

    cart_items       = data.get('cart_items')
    shipping_address = data.get('shipping_address')
    payment_method   = data.get('payment_method', 'card')

    if not cart_items or not isinstance(cart_items, list) or len(cart_items) == 0:
        return jsonify({'success': False, 'message': 'cart_items must be a non-empty list'}), 400
    if not shipping_address:
        return jsonify({'success': False, 'message': 'shipping_address is required'}), 400

    try:
        from models.product import Product

        detailed = []
        for item in cart_items:
            pid = item.get('product_id')
            qty = item.get('quantity', 1)
            if not pid or qty <= 0:
                return jsonify({'success': False, 'message': 'Each item needs product_id and quantity > 0'}), 400

            p = db.session.get(Product, pid)
            if not p:
                return jsonify({'success': False, 'message': f'Product {pid} not found'}), 404
            if p.stock < qty:
                return jsonify({'success': False, 'message': f'Only {p.stock} units of {p.name} available'}), 400

            detailed.append({
                'product_id':    p.id,
                'product_name':  p.name,
                'product_image': p.image_url or '',
                'quantity':      qty,
                'unit_price':    float(p.price),
                'category_name': p.category.name if p.category else 'Uncategorized',
            })
            p.stock -= qty

        order = Order.create_from_cart(
            user_id=uid,
            cart_items=detailed,
            shipping_address=shipping_address,
            payment_method=payment_method,
        )
        order.generate_invoice_number()
        db.session.add(order)
        db.session.commit()

        return jsonify({
            'success': True,
            'message': 'Order placed successfully',
            'data': order.to_dict(),
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': 'Order creation failed', 'error': str(e)}), 500
