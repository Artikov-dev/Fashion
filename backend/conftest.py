import pytest
from app import create_app
from extensions import db as _db


@pytest.fixture(scope='session')
def app():
    app = create_app('testing')
    with app.app_context():
        _db.create_all()
        yield app
        _db.drop_all()


@pytest.fixture(scope='function')
def db(app):
    with app.app_context():
        yield _db
        _db.session.rollback()


@pytest.fixture(scope='function')
def client(app):
    return app.test_client()


@pytest.fixture(scope='function')
def auth_headers(client):
    client.post('/api/auth/register', json={
        'email': 'testuser@test.com',
        'password': 'test1234',
        'name': 'Test User'
    })
    res = client.post('/api/auth/login', json={
        'email': 'testuser@test.com',
        'password': 'test1234'
    })
    token = res.get_json()['data']['access_token']
    return {'Authorization': f'Bearer {token}'}


@pytest.fixture(scope='function')
def admin_headers(client, db):
    from models.user import User
    import uuid
    email = f'admin_{uuid.uuid4().hex[:8]}@test.com'
    admin = User(email=email, role='admin', name='Admin')
    admin.set_password('admin1234')
    db.session.add(admin)
    db.session.commit()

    res = client.post('/api/auth/login', json={
        'email': email,
        'password': 'admin1234'
    })
    token = res.get_json()['data']['access_token']
    return {'Authorization': f'Bearer {token}'}
