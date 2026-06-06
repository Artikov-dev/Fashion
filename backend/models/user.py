from extensions import db
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime, timezone

# Association table for many-to-many User <-> Role
user_roles = db.Table(
    'user_roles',
    db.Column('user_id', db.Integer, db.ForeignKey('users.id'), primary_key=True),
    db.Column('role_id', db.Integer, db.ForeignKey('roles.id'), primary_key=True)
)


class Role(db.Model):
    __tablename__ = 'roles'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), unique=True, nullable=False)
    description = db.Column(db.Text, nullable=True)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description
        }

    def __repr__(self):
        return f'<Role {self.name}>'


class User(db.Model):
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(255), nullable=False)
    name = db.Column(db.String(120), nullable=True)
    phone = db.Column(db.String(20), nullable=True)
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    # keep a legacy single-role column for compatibility, but prefer `roles` relationship
    role = db.Column(db.String(20), default='customer', nullable=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    # Many-to-many relationship to support multiple roles per user
    roles = db.relationship('Role', secondary=user_roles, backref=db.backref('users', lazy='select'))

    def set_password(self, password):
        self.password = generate_password_hash(password, method='pbkdf2:sha256')

    def check_password(self, password):
        return check_password_hash(self.password, password)

    @property
    def is_admin(self):
        if any(r.name.lower() == 'admin' for r in self.roles):
            return True
        return self.role.lower() == 'admin'

    @is_admin.setter
    def is_admin(self, value):
        if value:
            self.role = 'admin'
            if not any(r.name.lower() == 'admin' for r in self.roles):
                admin_role = db.session.query(Role).filter_by(name='admin').first()
                if admin_role is None:
                    admin_role = Role(name='admin')
                self.roles.append(admin_role)
        else:
            current_role = self.role or 'customer'
            if current_role.lower() == 'admin':
                self.role = 'customer'
            self.roles = [r for r in self.roles if r.name.lower() != 'admin']

    def to_dict(self):
        return {
            'id': self.id,
            'email': self.email,
            'name': self.name,
            'phone': self.phone,
            'is_active': self.is_active,
            'role': self.role,
            'roles': [r.name for r in self.roles] if self.roles else [self.role],
            'created_at': self.created_at.isoformat() if self.created_at else None
        }