"""
Cart and checkout routes
- GET    /api/cart/           get cart
- POST   /api/cart/add        add item
- PUT    /api/cart/update     update quantity
- DELETE /api/cart/remove/<id> remove item
- DELETE /api/cart/clear      clear all items
- GET    /api/cart/count      item count
- POST   /api/cart/checkout   place order from cart

BUG FIXED: get_authenticated_user_id() now casts to int (JWT stores str).
"""

import logging
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from extensions import db
from models.cart import Cart, CartItem
from models.product import Product
from models.order import Order

cart_bp = Blueprint('cart', __name__, url_prefix='/api/cart')
logger  = logging.getLogger(__name__)


def _uid():
    """Return current user's id as int."""
    return int(get_jwt_identity())


def _get_or_create_cart(user_id):
    cart = Cart.query.filter_by(user_id=user_id).first()
    if not cart:
        cart = Cart(user_id=user_id)
        db.session.add(cart)
        db.session.flush()
    return cart


# ─── GET cart ────────────────────────────────────────────────────────────────

@cart_bp.route('/', methods=['GET'])
@jwt_required()
def get_cart():
    try:
        cart = _get_or_create_cart(_uid())
        db.session.commit()  # persist newly created cart
        return jsonify({'success': True, 'data': cart.to_dict()}), 200
    except Exception as e:
        db.session.rollback()
        logger.exception('get_cart error')
        return jsonify({'success': False, 'message': str(e)}), 500


# ─── Add item ────────────────────────────────────────────────────────────────

@cart_bp.route('/add', methods=['POST'])
@jwt_required()
def add_to_cart():
    data = request.get_json(silent=True) or {}

    product_id = data.get('product_id')
    quantity   = data.get('quantity', 1)
    size       = data.get('size', 'M')
    color      = data.get('color', 'Default')

    if not product_id:
        return jsonify({'success': False, 'message': 'product_id is required'}), 400

    try:
        quantity = int(quantity)
    except (TypeError, ValueError):
        return jsonify({'success': False, 'message': 'quantity must be an integer'}), 400

    if quantity <= 0:
        return jsonify({'success': False, 'message': 'quantity must be greater than 0'}), 400

    product = db.session.get(Product, int(product_id))
    if not product:
        return jsonify({'success': False, 'message': 'Product not found'}), 404
    if product.stock < quantity:
        return jsonify({'success': False,
                        'message': f'Only {product.stock} items available for {product.name}'}), 400

    try:
        cart = _get_or_create_cart(_uid())

        existing = CartItem.query.filter_by(
            cart_id=cart.id, product_id=product.id, size=size, color=color
        ).first()

        if existing:
            new_qty = existing.quantity + quantity
            if new_qty > product.stock:
                return jsonify({'success': False,
                                'message': f'Cannot add more — only {product.stock} in stock'}), 400
            existing.quantity   = new_qty
            existing.unit_price = float(product.price)
        else:
            item = CartItem(
                cart_id       = cart.id,
                product_id    = product.id,
                product_name  = product.name,
                product_image = product.image_url or '',
                quantity      = quantity,
                unit_price    = float(product.price),
                size          = size,
                color         = color,
            )
            db.session.add(item)

        db.session.commit()
        return jsonify({'success': True, 'message': 'Added to cart', 'data': cart.to_dict()}), 200

    except Exception as e:
        db.session.rollback()
        logger.exception('add_to_cart error')
        return jsonify({'success': False, 'message': str(e)}), 500


# ─── Update quantity ──────────────────────────────────────────────────────────

@cart_bp.route('/update', methods=['PUT'])
@jwt_required()
def update_cart_item():
    data = request.get_json(silent=True) or {}
    item_id  = data.get('item_id')
    quantity = data.get('quantity')

    if not item_id or quantity is None:
        return jsonify({'success': False, 'message': 'item_id and quantity are required'}), 400

    try:
        quantity = int(quantity)
    except (TypeError, ValueError):
        return jsonify({'success': False, 'message': 'quantity must be an integer'}), 400

    try:
        cart = Cart.query.filter_by(user_id=_uid()).first()
        if not cart:
            return jsonify({'success': False, 'message': 'Cart not found'}), 404

        item = CartItem.query.filter_by(id=item_id, cart_id=cart.id).first()
        if not item:
            return jsonify({'success': False, 'message': 'Cart item not found'}), 404

        if quantity <= 0:
            db.session.delete(item)
        else:
            product = db.session.get(Product, item.product_id)
            if product and quantity > product.stock:
                return jsonify({'success': False,
                                'message': f'Only {product.stock} items available'}), 400
            item.quantity   = quantity
            if product:
                item.unit_price = float(product.price)

        db.session.commit()
        return jsonify({'success': True, 'message': 'Cart updated', 'data': cart.to_dict()}), 200

    except Exception as e:
        db.session.rollback()
        logger.exception('update_cart_item error')
        return jsonify({'success': False, 'message': str(e)}), 500


# ─── Remove item ─────────────────────────────────────────────────────────────

@cart_bp.route('/remove/<int:item_id>', methods=['DELETE'])
@jwt_required()
def remove_from_cart(item_id):
    try:
        cart = Cart.query.filter_by(user_id=_uid()).first()
        if not cart:
            return jsonify({'success': False, 'message': 'Cart not found'}), 404

        item = CartItem.query.filter_by(id=item_id, cart_id=cart.id).first()
        if not item:
            return jsonify({'success': False, 'message': 'Item not found'}), 404

        db.session.delete(item)
        db.session.commit()
        return jsonify({'success': True, 'message': 'Item removed', 'data': cart.to_dict()}), 200

    except Exception as e:
        db.session.rollback()
        logger.exception('remove_from_cart error')
        return jsonify({'success': False, 'message': str(e)}), 500


# ─── Clear cart ───────────────────────────────────────────────────────────────

@cart_bp.route('/clear', methods=['DELETE'])
@jwt_required()
def clear_cart():
    try:
        cart = Cart.query.filter_by(user_id=_uid()).first()
        if not cart:
            return jsonify({'success': True, 'message': 'Cart already empty', 'data': {}}), 200

        CartItem.query.filter_by(cart_id=cart.id).delete(synchronize_session=False)
        db.session.commit()
        return jsonify({'success': True, 'message': 'Cart cleared', 'data': cart.to_dict()}), 200

    except Exception as e:
        db.session.rollback()
        logger.exception('clear_cart error')
        return jsonify({'success': False, 'message': str(e)}), 500


# ─── Cart count ───────────────────────────────────────────────────────────────

@cart_bp.route('/count', methods=['GET'])
@jwt_required()
def get_cart_count():
    try:
        cart  = Cart.query.filter_by(user_id=_uid()).first()
        count = cart.get_item_count() if cart else 0
        return jsonify({'success': True, 'data': {'count': count}}), 200
    except Exception as e:
        logger.exception('get_cart_count error')
        return jsonify({'success': False, 'message': str(e)}), 500


# ─── Checkout ────────────────────────────────────────────────────────────────

@cart_bp.route('/checkout', methods=['POST'])
@jwt_required()
def checkout():
    """
    Checkout: validate cart → deduct stock → create order → clear cart.
    Expects JSON body:
      {
        "shipping_address": { "name": "...", "address": "...", "city": "...", "zip": "..." },
        "payment_method":   "card" | "cash" | "mpesa",
        "phone_number":     "..." (required for mpesa)
      }
    """
    data = request.get_json(silent=True) or {}

    if not data.get('shipping_address'):
        return jsonify({'success': False, 'message': 'shipping_address is required'}), 422

    payment_method = data.get('payment_method', 'card')
    if payment_method == 'mpesa' and not data.get('phone_number', '').strip():
        return jsonify({'success': False, 'message': 'phone_number is required for M-Pesa payment'}), 400

    try:
        uid  = _uid()
        cart = Cart.query.filter_by(user_id=uid).first()

        if not cart or cart.get_item_count() == 0:
            return jsonify({'success': False, 'message': 'Your cart is empty'}), 422

        cart_items_data = []
        for item in list(cart.items):
            product = db.session.get(Product, item.product_id)
            if not product:
                continue  # skip orphaned items
            if item.quantity > product.stock:
                return jsonify({
                    'success': False,
                    'message': f'Only {product.stock} units of "{product.name}" are available',
                }), 400

            # Deduct stock
            product.stock -= item.quantity

            cart_items_data.append({
                'product_id':    item.product_id,
                'product_name':  item.product_name,
                'product_image': item.product_image or '',
                'quantity':      item.quantity,
                'unit_price':    float(item.unit_price),
                'category_name': product.category.name if product.category else 'Uncategorized',
            })

        if not cart_items_data:
            return jsonify({'success': False, 'message': 'Cart contains unavailable products'}), 422

        order = Order.create_from_cart(
            user_id=uid,
            cart_items=cart_items_data,
            shipping_address=data['shipping_address'],
            payment_method=payment_method,
        )
        db.session.add(order)
        db.session.flush()
        order.generate_invoice_number()

        # Clear cart after order
        CartItem.query.filter_by(cart_id=cart.id).delete(synchronize_session=False)
        db.session.commit()

        return jsonify({
            'success': True,
            'message': 'Order placed successfully',
            'data': {'order': order.to_dict()},
        }), 201

    except Exception as e:
        db.session.rollback()
        logger.exception('checkout error')
        return jsonify({'success': False, 'message': 'Checkout failed', 'error': str(e)}), 500
