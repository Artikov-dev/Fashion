class TestRegister:
    def test_register_success(self, client):
        res = client.post('/api/auth/register', json={
            'email': 'new@test.com',
            'password': 'pass1234',
            'name': 'New User'
        })
        data = res.get_json()
        assert res.status_code == 201
        assert data['success'] is True
        assert 'access_token' in data['data']
        assert data['data']['user']['email'] == 'new@test.com'
        assert data['data']['user']['role'] == 'customer'

    def test_register_duplicate_email(self, client):
        client.post('/api/auth/register', json={
            'email': 'dup@test.com', 'password': 'pass1234', 'name': 'User'
        })
        res = client.post('/api/auth/register', json={
            'email': 'dup@test.com', 'password': 'pass1234', 'name': 'User'
        })
        assert res.status_code == 409

    def test_register_missing_email(self, client):
        res = client.post('/api/auth/register', json={'password': 'pass1234'})
        assert res.status_code == 400

    def test_register_short_password(self, client):
        res = client.post('/api/auth/register', json={
            'email': 'short@test.com', 'password': '123'
        })
        assert res.status_code == 400


class TestLogin:
    def test_login_success(self, client):
        client.post('/api/auth/register', json={
            'email': 'login@test.com', 'password': 'pass1234', 'name': 'Login User'
        })
        res = client.post('/api/auth/login', json={
            'email': 'login@test.com', 'password': 'pass1234'
        })
        data = res.get_json()
        assert res.status_code == 200
        assert data['success'] is True
        assert 'access_token' in data['data']
        assert 'refresh_token' in data['data']

    def test_login_wrong_password(self, client):
        client.post('/api/auth/register', json={
            'email': 'wp@test.com', 'password': 'pass1234', 'name': 'User'
        })
        res = client.post('/api/auth/login', json={
            'email': 'wp@test.com', 'password': 'wrongpass'
        })
        assert res.status_code == 401

    def test_login_nonexistent_user(self, client):
        res = client.post('/api/auth/login', json={
            'email': 'nobody@test.com', 'password': 'pass1234'
        })
        assert res.status_code == 401

    def test_login_missing_fields(self, client):
        res = client.post('/api/auth/login', json={'email': 'test@test.com'})
        assert res.status_code == 400


class TestMe:
    def test_get_me(self, client, auth_headers):
        res = client.get('/api/auth/me', headers=auth_headers)
        data = res.get_json()
        assert res.status_code == 200
        assert data['success'] is True
        assert 'email' in data['data']

    def test_get_me_unauthorized(self, client):
        res = client.get('/api/auth/me')
        assert res.status_code == 401
