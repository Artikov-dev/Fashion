from extensions import db
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime, timezone
import enum


class UserRole(enum.Enum):
    admin   = 'admin'
    manager = 'manager'
    sales   = 'sales'
    user    = 'user'


class User(db.Model):
    __tablename__ = 'users'

    id         = db.Column(db.Integer, primary_key=True)
    email      = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password   = db.Column(db.String(255), nullable=False)
    name       = db.Column(db.String(120), nullable=True)
    phone      = db.Column(db.String(20), nullable=True)
    is_active  = db.Column(db.Boolean, default=True, nullable=False)
    role       = db.Column(
        db.Enum('admin', 'manager', 'sales', 'user', name='userrole'),
        default='user', nullable=False
    )
    avatar_url  = db.Column(db.String(255), nullable=True)
    last_login  = db.Column(db.DateTime, nullable=True)
    created_at  = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at  = db.Column(
        db.DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # back-references from other models
    assigned_contacts = db.relationship('Contact', foreign_keys='Contact.assigned_to', back_populates='assignee', lazy='dynamic')
    assigned_leads    = db.relationship('Lead',    foreign_keys='Lead.assigned_to',    back_populates='assignee', lazy='dynamic')
    assigned_tasks    = db.relationship('Task',    foreign_keys='Task.assigned_to',    back_populates='assignee', lazy='dynamic')
    created_tasks     = db.relationship('Task',    foreign_keys='Task.created_by',     back_populates='creator',  lazy='dynamic')
    activities        = db.relationship('Activity', foreign_keys='Activity.created_by', back_populates='creator', lazy='dynamic')

    def set_password(self, password: str):
        self.password = generate_password_hash(password, method='pbkdf2:sha256')

    def check_password(self, password: str) -> bool:
        return check_password_hash(self.password, password)

    @property
    def is_admin(self):
        return self.role == 'admin'

    def to_dict(self):
        return {
            'id':         self.id,
            'email':      self.email,
            'name':       self.name,
            'phone':      self.phone,
            'is_active':  self.is_active,
            'role':       self.role,
            'avatar_url': self.avatar_url,
            'last_login': self.last_login.isoformat() if self.last_login else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }

    def __repr__(self):
        return f'<User {self.email} [{self.role}]>'
