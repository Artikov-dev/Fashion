"""
Product catalog routes
- GET    /api/products            list with filtering, search, pagination
- POST   /api/products            create (admin)
- GET    /api/products/<id>       single product
- PUT    /api/products/<id>       update (admin)
- DELETE /api/products/<id>       delete (admin)
- GET    /api/products/categories           list categories
- POST   /api/products/categories           create category (admin)
- PUT    /api/products/categories/<id>      update category (admin)
- DELETE /api/products/categories/<id>      delete category (admin)
"""

from flask import Blueprint, request, jsonify, abort
from extensions import db
from models.product import Product, Category
from utils.decorators import admin_required

products_bp = Blueprint('products', __name__, url_prefix='/api/products')

# ─── helpers ──────────────────────────────────────────────────────────────────

def _validate_price(value):
    try:
        p = float(value)
        if p < 0:
            raise ValueError
        return p
    except (TypeError, ValueError):
        return None


# ─── Products ────────────────────────────────────────────────────────────────

@products_bp.route('/', methods=['GET'])
def get_products():
    """
    List products with optional filters.
    Query params: category, category_id, min_price, max_price, search, page, per_page, sort
    """
    category_name = request.args.get('category')
    category_id   = request.args.get('category_id', type=int)
    min_price     = request.args.get('min_price', type=float)
    max_price     = request.args.get('max_price', type=float)
    search        = request.args.get('search', '').strip()
    sort          = request.args.get('sort', 'newest')  # newest | price_asc | price_desc | name
    page          = request.args.get('page', 1, type=int)
    per_page      = request.args.get('per_page', 0, type=int)  # 0 = no pagination

    query = Product.query

    if category_name:
        query = query.join(Category).filter(Category.name.ilike(f'%{category_name}%'))
    elif category_id:
        query = query.filter(Product.category_id == category_id)

    if min_price is not None:
        query = query.filter(Product.price >= min_price)
    if max_price is not None:
        query = query.filter(Product.price <= max_price)
    if search:
        query = query.filter(Product.name.ilike(f'%{search}%'))

    # Sorting
    if sort == 'price_asc':
        query = query.order_by(Product.price.asc())
    elif sort == 'price_desc':
        query = query.order_by(Product.price.desc())
    elif sort == 'name':
        query = query.order_by(Product.name.asc())
    else:
        query = query.order_by(Product.created_at.desc())

    if per_page and per_page > 0:
        pagination = query.paginate(page=page, per_page=per_page, error_out=False)
        return jsonify({
            'success': True,
            'data': [p.to_dict() for p in pagination.items],
            'pagination': {
                'page':       pagination.page,
                'per_page':   pagination.per_page,
                'total':      pagination.total,
                'pages':      pagination.pages,
            },
        }), 200

    products = query.all()
    return jsonify({'success': True, 'data': products} if False else [p.to_dict() for p in products]), 200


@products_bp.route('/<int:product_id>', methods=['GET'])
def get_product(product_id):
    """Get a single product by ID."""
    product = db.session.get(Product, product_id)
    if product is None:
        return jsonify({'success': False, 'message': 'Product not found'}), 404
    return jsonify(product.to_dict()), 200


@products_bp.route('/', methods=['POST'])
@admin_required
def create_product():
    """Create a new product (admin only)."""
    data = request.get_json(silent=True) or {}

    name  = (data.get('name') or '').strip()
    price = _validate_price(data.get('price'))

    if not name:
        return jsonify({'success': False, 'message': 'Product name is required'}), 400
    if price is None:
        return jsonify({'success': False, 'message': 'A valid price is required'}), 400

    try:
        product = Product(
            name=name,
            description=data.get('description', '').strip() or None,
            price=price,
            stock=int(data.get('stock', 0)),
            image_url=data.get('image_url', '').strip() or None,
            category_id=data.get('category_id') or None,
        )
        db.session.add(product)
        db.session.commit()
        return jsonify({'success': True, 'message': 'Product created', 'data': product.to_dict()}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': 'Failed to create product', 'error': str(e)}), 500


@products_bp.route('/<int:product_id>', methods=['PUT'])
@admin_required
def update_product(product_id):
    """Update a product (admin only)."""
    product = db.session.get(Product, product_id)
    if product is None:
        return jsonify({'success': False, 'message': 'Product not found'}), 404

    data = request.get_json(silent=True) or {}
    try:
        if 'name' in data and data['name'].strip():
            product.name = data['name'].strip()
        if 'description' in data:
            product.description = data['description'].strip() or None
        if 'price' in data:
            p = _validate_price(data['price'])
            if p is None:
                return jsonify({'success': False, 'message': 'Invalid price'}), 400
            product.price = p
        if 'stock' in data:
            product.stock = max(0, int(data['stock']))
        if 'image_url' in data:
            product.image_url = data['image_url'].strip() or None
        if 'category_id' in data:
            product.category_id = data['category_id'] or None

        db.session.commit()
        return jsonify({'success': True, 'message': 'Product updated', 'data': product.to_dict()}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': 'Failed to update product', 'error': str(e)}), 500


@products_bp.route('/<int:product_id>', methods=['DELETE'])
@admin_required
def delete_product(product_id):
    """Delete a product (admin only)."""
    product = db.session.get(Product, product_id)
    if product is None:
        return jsonify({'success': False, 'message': 'Product not found'}), 404
    try:
        db.session.delete(product)
        db.session.commit()
        return jsonify({'success': True, 'message': 'Product deleted'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': 'Failed to delete product', 'error': str(e)}), 500


# ─── Categories ──────────────────────────────────────────────────────────────

@products_bp.route('/categories', methods=['GET'])
def get_categories():
    """List all categories."""
    categories = Category.query.order_by(Category.name.asc()).all()
    return jsonify([c.to_dict() for c in categories]), 200


@products_bp.route('/categories', methods=['POST'])
@admin_required
def create_category():
    """Create a new category (admin only)."""
    data = request.get_json(silent=True) or {}
    name = (data.get('name') or '').strip()
    if not name:
        return jsonify({'success': False, 'message': 'Category name is required'}), 400
    if Category.query.filter_by(name=name).first():
        return jsonify({'success': False, 'message': 'Category already exists'}), 409

    try:
        cat = Category(name=name, description=data.get('description', '').strip() or None)
        db.session.add(cat)
        db.session.commit()
        return jsonify({'success': True, 'message': 'Category created', 'data': cat.to_dict()}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500


@products_bp.route('/categories/<int:cat_id>', methods=['PUT'])
@admin_required
def update_category(cat_id):
    """Update a category (admin only)."""
    cat = db.session.get(Category, cat_id)
    if cat is None:
        return jsonify({'success': False, 'message': 'Category not found'}), 404

    data = request.get_json(silent=True) or {}
    try:
        if 'name' in data and data['name'].strip():
            cat.name = data['name'].strip()
        if 'description' in data:
            cat.description = data['description'].strip() or None
        db.session.commit()
        return jsonify({'success': True, 'data': cat.to_dict()}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500


@products_bp.route('/categories/<int:cat_id>', methods=['DELETE'])
@admin_required
def delete_category(cat_id):
    """Delete a category (admin only). Products in this category are un-categorised."""
    cat = db.session.get(Category, cat_id)
    if cat is None:
        return jsonify({'success': False, 'message': 'Category not found'}), 404
    try:
        # Detach products instead of cascading delete
        Product.query.filter_by(category_id=cat_id).update({'category_id': None})
        db.session.delete(cat)
        db.session.commit()
        return jsonify({'success': True, 'message': 'Category deleted'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500
