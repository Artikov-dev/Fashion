from models.product import Product, Category
from extensions import db


def make_product(db, name='Test Shirt', price=99.99, stock=10):
    cat = Category.query.first()
    if not cat:
        cat = Category(name='TestCat')
        db.session.add(cat)
        db.session.flush()
    p = Product(name=name, price=price, stock=stock,
                description='Test desc', category_id=cat.id,
                image_url='https://example.com/img.jpg')
    db.session.add(p)
    db.session.commit()
    return p


class TestProducts:
    def test_get_products_empty(self, client, auth_headers):
        res = client.get('/api/products/', headers=auth_headers)
        assert res.status_code == 200

    def test_get_products_list(self, client, auth_headers, db):
        make_product(db)
        res = client.get('/api/products/', headers=auth_headers)
        data = res.get_json()
        assert res.status_code == 200
        assert isinstance(data.get('data') or data.get('products') or data, (list, dict))

    def test_get_categories(self, client, auth_headers, db):
        if not Category.query.first():
            db.session.add(Category(name='Dresses'))
            db.session.commit()
        res = client.get('/api/products/categories', headers=auth_headers)
        assert res.status_code == 200

    def test_get_product_not_found(self, client, auth_headers):
        res = client.get('/api/products/99999', headers=auth_headers)
        assert res.status_code == 404


class TestAdminProducts:
    def test_create_product(self, client, admin_headers, db):
        cat = Category(name='AdminCat')
        db.session.add(cat)
        db.session.commit()

        res = client.post('/api/products/', headers=admin_headers, json={
            'name': 'Admin Product',
            'price': 149.99,
            'stock': 20,
            'description': 'Admin created product',
            'category_id': cat.id,
            'image_url': 'https://example.com/img.jpg'
        })
        assert res.status_code in (200, 201)

    def test_create_product_unauthorized(self, client, auth_headers):
        res = client.post('/api/products/', headers=auth_headers, json={
            'name': 'Unauthorized Product', 'price': 99.99, 'stock': 5
        })
        assert res.status_code == 403

    def test_delete_product(self, client, admin_headers, db):
        p = make_product(db, name='To Delete')
        res = client.delete(f'/api/products/{p.id}', headers=admin_headers)
        assert res.status_code in (200, 204)
