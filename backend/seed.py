"""
Database seed — run via: flask seed-db
or automatically called on app startup (only if tables are empty).

Changes vs original:
  - Admin user seeding now sets name field
  - Wishlist tables are handled by model imports in app.py
  - All existing product/category data preserved
"""

import click
from flask.cli import with_appcontext
from extensions import db
from models.product import Product, Category
from models.user import User


def seed_data():
    """Populate database with initial data if tables are empty."""

    seeded = False

    # ── Admin user ──────────────────────────────────────────────────────────
    admin = User.query.filter_by(email='admin@shop.com').first()
    if not admin:
        admin = User(email='admin@shop.com', role='admin', name='Admin User')
        admin.set_password('admin123')
        db.session.add(admin)
        click.echo('✔ Created admin user: admin@shop.com / admin123')
        seeded = True

    # Ensure legacy role column is set correctly for existing admin
    if admin and admin.role != 'admin':
        admin.role = 'admin'
        seeded = True

    # ── Demo customer ────────────────────────────────────────────────────────
    demo = User.query.filter_by(email='user@shop.com').first()
    if not demo:
        demo = User(email='user@shop.com', role='customer', name='Demo User')
        demo.set_password('user123')
        db.session.add(demo)
        click.echo('✔ Created demo user: user@shop.com / user123')
        seeded = True

    # ── Categories ───────────────────────────────────────────────────────────
    categories_data = [
        {'name': 'Men',         'description': 'Fashion for men'},
        {'name': 'Women',       'description': 'Fashion for women'},
        {'name': 'Children',    'description': 'Fashion for children'},
        {'name': 'Accessories', 'description': 'Fashion accessories'},
    ]
    for cat_data in categories_data:
        if not Category.query.filter_by(name=cat_data['name']).first():
            db.session.add(Category(**cat_data))
            seeded = True

    db.session.commit()

    men_cat   = Category.query.filter_by(name='Men').first()
    women_cat = Category.query.filter_by(name='Women').first()
    kids_cat  = Category.query.filter_by(name='Children').first()
    acc_cat   = Category.query.filter_by(name='Accessories').first()

    # ── Products ─────────────────────────────────────────────────────────────
    if Product.query.count() == 0:
        products_data = [
            # Men
            {'name': 'Slim Fit T-Shirt',       'description': 'Premium cotton slim-fit tee', 'price': 25.99, 'stock': 50, 'category_id': men_cat.id,   'image_url': 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600'},
            {'name': 'Slim Fit Denim Jeans',   'description': 'Modern slim cut blue jeans',  'price': 59.99, 'stock': 30, 'category_id': men_cat.id,   'image_url': 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=600'},
            {'name': 'Leather Biker Jacket',   'description': 'Premium leather jacket',       'price': 199.99,'stock': 10, 'category_id': men_cat.id,   'image_url': 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=600'},
            {'name': 'Classic White Sneakers', 'description': 'Canvas sneakers',              'price': 79.99, 'stock': 40, 'category_id': men_cat.id,   'image_url': 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=600'},
            {'name': 'Casual Polo Shirt',      'description': 'Comfortable polo shirt',       'price': 39.99, 'stock': 45, 'category_id': men_cat.id,   'image_url': 'https://images.unsplash.com/photo-1586790170083-2f9ceadc732d?w=600'},
            {'name': 'Chino Pants',            'description': 'Smart casual chinos',          'price': 69.99, 'stock': 28, 'category_id': men_cat.id,   'image_url': 'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=600'},
            # Women
            {'name': 'Floral Wrap Dress',      'description': 'Elegant floral dress',         'price': 89.99, 'stock': 20, 'category_id': women_cat.id, 'image_url': 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=600'},
            {'name': 'Evening Cocktail Dress', 'description': 'Elegant evening wear',         'price': 129.99,'stock': 12, 'category_id': women_cat.id, 'image_url': 'https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=600'},
            {'name': 'Denim Jacket',           'description': 'Classic blue denim jacket',    'price': 79.99, 'stock': 18, 'category_id': women_cat.id, 'image_url': 'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=600'},
            {'name': 'High Waist Skirt',       'description': 'Stylish high waist skirt',     'price': 55.99, 'stock': 25, 'category_id': women_cat.id, 'image_url': 'https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?w=600'},
            {'name': 'Cardigan Sweater',       'description': 'Cozy knit cardigan',           'price': 65.99, 'stock': 22, 'category_id': women_cat.id, 'image_url': 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=600'},
            {'name': 'Leather Ankle Boots',    'description': 'Brown leather boots',          'price': 149.99,'stock': 20, 'category_id': women_cat.id, 'image_url': 'https://images.unsplash.com/photo-1608256246200-53e635b5b65f?w=600'},
            # Children
            {'name': 'Kids Hoodie',            'description': 'Warm and cozy hoodie',         'price': 35.99, 'stock': 38, 'category_id': kids_cat.id,  'image_url': 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=600'},
            {'name': 'Kids Denim Jeans',       'description': 'Comfortable denim for kids',   'price': 39.99, 'stock': 35, 'category_id': kids_cat.id,  'image_url': 'https://images.unsplash.com/photo-1475178626620-a4d074967452?w=600'},
            {'name': 'Running Shoes Kids',     'description': 'Sports shoes for kids',        'price': 49.99, 'stock': 30, 'category_id': kids_cat.id,  'image_url': 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600'},
            {'name': 'Winter Jacket Kids',     'description': 'Warm winter jacket',           'price': 69.99, 'stock': 20, 'category_id': kids_cat.id,  'image_url': 'https://images.unsplash.com/photo-1578587018452-892bacefd3f2?w=600'},
            # Accessories
            {'name': 'Leather Belt',           'description': 'Genuine leather belt',         'price': 29.99, 'stock': 35, 'category_id': acc_cat.id,  'image_url': 'https://images.unsplash.com/photo-1624222247344-550fb60583bb?w=600'},
            {'name': 'Polarised Sunglasses',   'description': 'UV-protection sunglasses',     'price': 45.99, 'stock': 45, 'category_id': acc_cat.id,  'image_url': 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=600'},
            {'name': 'Leather Wallet',         'description': 'Slim bifold leather wallet',   'price': 39.99, 'stock': 40, 'category_id': acc_cat.id,  'image_url': 'https://images.unsplash.com/photo-1627123424574-724758594e93?w=600'},
            {'name': 'Canvas Tote Bag',        'description': 'Everyday canvas tote',         'price': 24.99, 'stock': 55, 'category_id': acc_cat.id,  'image_url': 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600'},
        ]
        for pd in products_data:
            db.session.add(Product(**pd))
        click.echo(f'✔ Seeded {len(products_data)} products')
        seeded = True

    if seeded:
        db.session.commit()
        click.echo('✔ Database seed complete')
    else:
        click.echo('ℹ  Database already seeded — nothing to do')


@click.command('seed-db')
@with_appcontext
def seed_command():
    """Seed the database with initial data."""
    with db.engine.connect():
        seed_data()


def init_app(app):
    """Register the seed CLI command and auto-seed on first run."""
    app.cli.add_command(seed_command)

    @app.before_request
    def auto_seed():
        """Auto-seed only on the very first request if tables exist but are empty."""
        # Remove after first run to avoid overhead
        app.before_request_funcs[None].remove(auto_seed)
        try:
            if User.query.count() == 0:
                seed_data()
        except Exception:
            pass
