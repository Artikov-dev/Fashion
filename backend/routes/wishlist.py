"""
Wishlist routes
- GET    /api/wishlist/          get user's wishlist
- POST   /api/wishlist/add       add product to wishlist
- DELETE /api/wishlist/remove/<product_id>  remove product from wishlist
- DELETE /api/wishlist/clear     clear entire wishlist
- GET    /api/wishlist/check/<product_id>   check if product is in wishlist
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from extensions import db
from models.wishlist import Wishlist, WishlistItem
from models.product import Product

wishlist_bp = Blueprint('wishlist', __name__, url_prefix='/api/wishlist')


def _uid():
    return int(get_jwt_identity())


def _get_or_create_wishlist(user_id):
    wl = Wishlist.query.filter_by(user_id=user_id).first()
    if not wl:
        wl = Wishlist(user_id=user_id)
        db.session.add(wl)
        db.session.flush()
    return wl


# ─── GET wishlist ─────────────────────────────────────────────────────────────

@wishlist_bp.route('/', methods=['GET'])
@jwt_required()
def get_wishlist():
    """Return the authenticated user's wishlist with product details."""
    try:
        wl = _get_or_create_wishlist(_uid())
        db.session.commit()
        return jsonify({'success': True, 'data': wl.to_dict()}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500


# ─── Add to wishlist ──────────────────────────────────────────────────────────

@wishlist_bp.route('/add', methods=['POST'])
@jwt_required()
def add_to_wishlist():
    """Add a product to the wishlist. Idempotent — adding twice is harmless."""
    data       = request.get_json(silent=True) or {}
    product_id = data.get('product_id')

    if not product_id:
        return jsonify({'success': False, 'message': 'product_id is required'}), 400

    product = db.session.get(Product, int(product_id))
    if not product:
        return jsonify({'success': False, 'message': 'Product not found'}), 404

    try:
        wl = _get_or_create_wishlist(_uid())

        exists = WishlistItem.query.filter_by(
            wishlist_id=wl.id, product_id=product.id
        ).first()

        if not exists:
            item = WishlistItem(wishlist_id=wl.id, product_id=product.id)
            db.session.add(item)

        db.session.commit()
        return jsonify({
            'success': True,
            'message': 'Added to wishlist' if not exists else 'Already in wishlist',
            'data': wl.to_dict(),
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500


# ─── Remove from wishlist ─────────────────────────────────────────────────────

@wishlist_bp.route('/remove/<int:product_id>', methods=['DELETE'])
@jwt_required()
def remove_from_wishlist(product_id):
    """Remove a product from the wishlist."""
    try:
        wl = Wishlist.query.filter_by(user_id=_uid()).first()
        if not wl:
            return jsonify({'success': True, 'message': 'Wishlist is empty'}), 200

        item = WishlistItem.query.filter_by(
            wishlist_id=wl.id, product_id=product_id
        ).first()

        if item:
            db.session.delete(item)
            db.session.commit()

        return jsonify({'success': True, 'message': 'Removed from wishlist', 'data': wl.to_dict()}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500


# ─── Clear wishlist ────────────────────────────────────────────────────────────

@wishlist_bp.route('/clear', methods=['DELETE'])
@jwt_required()
def clear_wishlist():
    try:
        wl = Wishlist.query.filter_by(user_id=_uid()).first()
        if wl:
            WishlistItem.query.filter_by(wishlist_id=wl.id).delete(synchronize_session=False)
            db.session.commit()
        return jsonify({'success': True, 'message': 'Wishlist cleared'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500


# ─── Check product ────────────────────────────────────────────────────────────

@wishlist_bp.route('/check/<int:product_id>', methods=['GET'])
@jwt_required()
def check_wishlist(product_id):
    """Return whether the given product is in the user's wishlist."""
    wl = Wishlist.query.filter_by(user_id=_uid()).first()
    in_wishlist = False
    if wl:
        in_wishlist = WishlistItem.query.filter_by(
            wishlist_id=wl.id, product_id=product_id
        ).first() is not None

    return jsonify({'success': True, 'data': {'in_wishlist': in_wishlist}}), 200
