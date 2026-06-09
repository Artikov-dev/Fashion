from models.product import Product, Category
from extensions import db


def make_product(db):
    cat = Category.query.first()
    if not cat:
        cat = Category(name='CartCat')
        db.session.add(cat)
        db.session.flush()
    p = Product(name='Cart Item', price=59.99, stock=20,
                description='Cart test product', category_id=cat.id,
                image_url='https://example.com/img.jpg')
    db.session.add(p)
    db.session.commit()
    return p


class TestCart:
    def test_get_empty_cart(self, client, auth_headers):
        res = client.get('/api/cart/', headers=auth_headers)
        assert res.status_code == 200

    def test_add_to_cart(self, client, auth_headers, db):
        p = make_product(db)
        res = client.post('/api/cart/add', headers=auth_headers, json={
            'product_id': p.id,
            'quantity': 2
        })
        assert res.status_code in (200, 201)

    def test_cart_count(self, client, auth_headers, db):
        p = make_product(db)
        client.post('/api/cart/add', headers=auth_headers, json={
            'product_id': p.id, 'quantity': 1
        })
        res = client.get('/api/cart/count', headers=auth_headers)
        assert res.status_code == 200

    def test_clear_cart(self, client, auth_headers, db):
        p = make_product(db)
        client.post('/api/cart/add', headers=auth_headers, json={
            'product_id': p.id, 'quantity': 1
        })
        res = client.delete('/api/cart/clear', headers=auth_headers)
        assert res.status_code == 200

    def test_cart_unauthorized(self, client):
        res = client.get('/api/cart/')
        assert res.status_code == 401
