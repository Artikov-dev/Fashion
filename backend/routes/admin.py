"""
Admin-only routes
- GET    /api/admin/users                     paginated user list
- GET    /api/admin/users/<id>                single user
- PUT    /api/admin/users/<id>                update user
- DELETE /api/admin/users/<id>                delete user
- GET    /api/admin/orders                    all orders
- PUT    /api/admin/orders/<id>/status        update order status (FIXED: also accepts PATCH)
- PATCH  /api/admin/orders/<id>/status        update order status
- GET    /api/admin/analytics/dashboard       dashboard stats
- GET    /api/admin/analytics/products        product stats
- GET    /api/admin/analytics/orders/revenue  revenue trend
- GET    /api/admin/analytics/orders/total    orders trend

BUGS FIXED:
  1. admin_required decorator int-cast bug — already fixed in utils/decorators.py;
     this file no longer needs to re-cast.
  2. analytics/dashboard had bare `timezone` reference — now imports correctly.
  3. analytics/products used nonexistent fields (is_active, is_featured,
     view_count, stock_quantity) — replaced with real model fields (stock).
  4. inventory endpoints used `stock_quantity` — replaced with `stock`.
  5. update_order_status was PATCH-only — now also accepts PUT so frontend works.
"""

from datetime import datetime, timezone, timedelta

from flask import Blueprint, request, jsonify, abort
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy import func

from extensions import db
from models.user import User, Role
from models.product import Product, Category
from models.order import Order
from utils.decorators import admin_required

admin_bp = Blueprint('admin', __name__, url_prefix='/api/admin')


def _get_or_404(model, model_id):
    obj = db.session.get(model, model_id)
    if obj is None:
        abort(404)
    return obj


# ══════════════════════════════════════════════════════════
#  USER MANAGEMENT
# ══════════════════════════════════════════════════════════

@admin_bp.route('/users', methods=['GET'])
@jwt_required()
@admin_required
def get_all_users():
    """Paginated, searchable user list."""
    try:
        page     = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        search   = request.args.get('search', '').strip()

        q = User.query
        if search:
            q = q.filter(
                User.email.ilike(f'%{search}%') | User.name.ilike(f'%{search}%')
            )

        pagination = q.order_by(User.created_at.desc()).paginate(
            page=page, per_page=per_page, error_out=False
        )
        return jsonify({
            'success': True,
            'data': [u.to_dict() for u in pagination.items],
            'pagination': {
                'page': page, 'per_page': per_page, 'total': pagination.total,
            },
        }), 200
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500


@admin_bp.route('/users/<int:user_id>', methods=['GET'])
@jwt_required()
@admin_required
def get_user(user_id):
    user = _get_or_404(User, user_id)
    return jsonify({'success': True, 'data': user.to_dict()}), 200


@admin_bp.route('/users/<int:user_id>', methods=['PUT'])
@jwt_required()
@admin_required
def update_user(user_id):
    """Update user fields (name, phone, is_active, role)."""
    user = _get_or_404(User, user_id)
    data = request.get_json(silent=True) or {}
    try:
        if 'name' in data:
            user.name = data['name'].strip() or None
        if 'phone' in data:
            user.phone = data['phone'].strip() or None
        if 'is_active' in data:
            user.is_active = bool(data['is_active'])
        if 'role' in data and data['role'] in ('admin', 'customer'):
            user.role = data['role']
            user.is_admin = (data['role'] == 'admin')
        if 'is_admin' in data:
            user.is_admin = bool(data['is_admin'])
        db.session.commit()
        return jsonify({'success': True, 'message': 'User updated', 'data': user.to_dict()}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500


@admin_bp.route('/users/<int:user_id>', methods=['DELETE'])
@jwt_required()
@admin_required
def delete_user(user_id):
    user = _get_or_404(User, user_id)
    try:
        caller_id = int(get_jwt_identity())
        if user.id == caller_id:
            return jsonify({'success': False, 'message': 'Cannot delete your own account'}), 400
        db.session.delete(user)
        db.session.commit()
        return jsonify({'success': True, 'message': 'User deleted'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500


# ══════════════════════════════════════════════════════════
#  ROLE MANAGEMENT
# ══════════════════════════════════════════════════════════

@admin_bp.route('/roles', methods=['GET'])
@jwt_required()
@admin_required
def get_roles():
    return jsonify({'success': True, 'data': [r.to_dict() for r in Role.query.all()]}), 200


@admin_bp.route('/roles', methods=['POST'])
@jwt_required()
@admin_required
def create_role():
    data = request.get_json(silent=True) or {}
    name = (data.get('name') or '').strip()
    if not name:
        return jsonify({'success': False, 'message': 'Role name required'}), 400
    if Role.query.filter_by(name=name).first():
        return jsonify({'success': False, 'message': 'Role already exists'}), 409
    try:
        role = Role(name=name, description=data.get('description'))
        db.session.add(role)
        db.session.commit()
        return jsonify({'success': True, 'data': role.to_dict()}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500


@admin_bp.route('/users/<int:user_id>/roles', methods=['PUT'])
@jwt_required()
@admin_required
def update_user_roles(user_id):
    user = _get_or_404(User, user_id)
    data = request.get_json(silent=True) or {}
    try:
        role_names = data.get('roles', [])
        user.roles = []
        for rn in role_names:
            role = Role.query.filter_by(name=rn).first()
            if role:
                user.roles.append(role)
        user.role = user.roles[0].name.lower() if user.roles else 'customer'
        db.session.commit()
        return jsonify({'success': True, 'data': user.to_dict()}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500


# ══════════════════════════════════════════════════════════
#  ORDER MANAGEMENT
# ══════════════════════════════════════════════════════════

VALID_STATUSES = ['pending', 'processing', 'shipped', 'delivered', 'cancelled']


@admin_bp.route('/orders', methods=['GET'])
@jwt_required()
@admin_required
def get_all_orders():
    """All orders with optional status filter and pagination."""
    try:
        status   = request.args.get('status')
        page     = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 50, type=int)

        q = Order.query
        if status and status in VALID_STATUSES:
            q = q.filter_by(status=status)

        pagination = q.order_by(Order.created_at.desc()).paginate(
            page=page, per_page=per_page, error_out=False
        )
        return jsonify({
            'success': True,
            'data': [o.to_dict() for o in pagination.items],
            'pagination': {
                'page': page, 'per_page': per_page, 'total': pagination.total,
            },
        }), 200
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500


# FIX: accept both PUT and PATCH so the frontend (which sends PUT) works
@admin_bp.route('/orders/<int:order_id>/status', methods=['PUT', 'PATCH'])
@jwt_required()
@admin_required
def update_order_status(order_id):
    """Update order status. Accepts PUT or PATCH."""
    data       = request.get_json(silent=True) or {}
    new_status = data.get('status')

    if new_status not in VALID_STATUSES:
        return jsonify({
            'success': False,
            'message': f'Invalid status. Allowed: {VALID_STATUSES}',
        }), 400

    order = _get_or_404(Order, order_id)
    try:
        order.status = new_status
        db.session.commit()
        return jsonify({'success': True, 'message': 'Order status updated', 'data': order.to_dict()}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500


# ══════════════════════════════════════════════════════════
#  ANALYTICS
# ══════════════════════════════════════════════════════════

@admin_bp.route('/analytics/dashboard', methods=['GET'])
@jwt_required()
@admin_required
def get_admin_dashboard():
    """
    Overview stats for admin dashboard.

    BUG FIXED: 'timezone' was used without importing it.
               Added 'from datetime import datetime, timezone, timedelta' at top.
    """
    try:
        now            = datetime.now(timezone.utc)
        thirty_ago     = now - timedelta(days=30)

        total_users    = User.query.count()
        new_users_30d  = User.query.filter(User.created_at >= thirty_ago).count()

        total_orders   = Order.query.count()
        orders_30d     = Order.query.filter(Order.created_at >= thirty_ago).count()
        pending_orders = Order.query.filter_by(status='pending').count()

        total_revenue  = db.session.query(
            func.coalesce(func.sum(Order.total_amount), 0)
        ).scalar() or 0

        revenue_30d    = db.session.query(
            func.coalesce(func.sum(Order.total_amount), 0)
        ).filter(Order.created_at >= thirty_ago).scalar() or 0

        total_products = Product.query.count()

        status_dist = db.session.query(
            Order.status, func.count(Order.id)
        ).group_by(Order.status).all()

        recent_orders = Order.query.order_by(Order.created_at.desc()).limit(10).all()

        return jsonify({
            'success': True,
            'data': {
                'overview': {
                    'totalUsers':    total_users,
                    'newUsers30d':   new_users_30d,
                    'totalOrders':   total_orders,
                    'orders30d':     orders_30d,
                    'pendingOrders': pending_orders,
                    'totalRevenue':  float(total_revenue),
                    'revenue30d':    float(revenue_30d),
                    'totalProducts': total_products,
                },
                'orderStatus':  [{'status': s, 'count': c} for s, c in status_dist],
                'recentOrders': [o.to_dict() for o in recent_orders],
            },
        }), 200
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500


@admin_bp.route('/analytics/products', methods=['GET'])
@jwt_required()
@admin_required
def get_product_analytics():
    """
    Product inventory stats.

    BUG FIXED: previous version referenced Product.stock_quantity,
               Product.is_active, Product.is_featured, Product.view_count —
               none of these columns exist in the actual model.
               Now uses Product.stock (the real column).
    """
    try:
        total_products = Product.query.count()
        # Products with stock > 0 (the model has no is_active column)
        in_stock       = Product.query.filter(Product.stock > 0).count()
        low_stock      = Product.query.filter(Product.stock > 0, Product.stock <= 5).count()
        out_of_stock   = Product.query.filter(Product.stock == 0).count()

        # Products by category
        by_category = db.session.query(
            Category.name, func.count(Product.id)
        ).join(Product, isouter=True).group_by(Category.name).all()

        return jsonify({
            'success': True,
            'data': {
                'totalProducts': total_products,
                'inStock':       in_stock,
                'lowStock':      low_stock,
                'outOfStock':    out_of_stock,
                'byCategory':    [{'category': c, 'count': n} for c, n in by_category],
            },
        }), 200
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500


@admin_bp.route('/analytics/orders/revenue', methods=['GET'])
@jwt_required()
@admin_required
def get_revenue_analytics():
    from services.analytics_service import get_admin_analytics
    try:
        data = get_admin_analytics()
        return jsonify({
            'success': True,
            'data': {
                'revenueTrend': data['revenueTrend'],
                'summary': {
                    'totalRevenue':  data['summary']['totalRevenue'],
                    'avgOrderValue': data['summary']['avgOrderValue'],
                },
            },
        }), 200
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500


@admin_bp.route('/analytics/orders/total', methods=['GET'])
@jwt_required()
@admin_required
def get_total_orders_analytics():
    from services.analytics_service import get_admin_analytics
    try:
        data = get_admin_analytics()
        return jsonify({
            'success': True,
            'data': {
                'ordersTrend': data['ordersTrend'],
                'summary': {'totalOrders': data['summary']['totalOrders']},
            },
        }), 200
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500


@admin_bp.route('/analytics/orders/categories', methods=['GET'])
@jwt_required()
@admin_required
def get_category_analytics():
    from services.analytics_service import get_admin_analytics
    try:
        data = get_admin_analytics()
        return jsonify({
            'success': True,
            'data': {'categoryStatistics': data['categoryStatistics']},
        }), 200
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500


# ══════════════════════════════════════════════════════════
#  INVENTORY  (uses Product.stock, not stock_quantity)
# ══════════════════════════════════════════════════════════

@admin_bp.route('/inventory', methods=['GET'])
@jwt_required()
@admin_required
def get_inventory():
    """
    Inventory overview.
    BUG FIXED: was filtering by Product.stock_quantity — column does not exist.
    """
    try:
        page     = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 50, type=int)
        status   = request.args.get('stock')

        q = Product.query
        if status == 'out':
            q = q.filter(Product.stock == 0)
        elif status == 'low':
            q = q.filter(Product.stock > 0, Product.stock <= 5)
        elif status == 'normal':
            q = q.filter(Product.stock > 5)

        pagination = q.order_by(Product.stock.asc()).paginate(
            page=page, per_page=per_page, error_out=False
        )
        return jsonify({
            'success': True,
            'data': [p.to_dict() for p in pagination.items],
            'pagination': {
                'page': page, 'per_page': per_page, 'total': pagination.total,
            },
        }), 200
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500


@admin_bp.route('/inventory/<int:product_id>', methods=['PATCH'])
@jwt_required()
@admin_required
def update_inventory(product_id):
    """
    Update product stock.
    BUG FIXED: used product.stock_quantity — replaced with product.stock.
    """
    product = _get_or_404(Product, product_id)
    data    = request.get_json(silent=True) or {}

    stock = data.get('stock')
    if stock is None:
        stock = data.get('stock_quantity')  # accept old name too

    if stock is None:
        return jsonify({'success': False, 'message': '"stock" field is required'}), 400

    try:
        product.stock = max(0, int(stock))
        db.session.commit()
        return jsonify({'success': True, 'message': 'Stock updated', 'data': product.to_dict()}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500
