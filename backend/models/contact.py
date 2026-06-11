from extensions import db
from datetime import datetime, timezone


class Contact(db.Model):
    __tablename__ = 'contacts'

    id          = db.Column(db.Integer, primary_key=True)
    full_name   = db.Column(db.String(150), nullable=False)
    email       = db.Column(db.String(120), nullable=True, index=True)
    phone       = db.Column(db.String(30), nullable=True)
    company     = db.Column(db.String(150), nullable=True)
    position    = db.Column(db.String(100), nullable=True)
    source      = db.Column(
        db.Enum('Instagram', 'Referral', 'Website', 'Cold call', 'Other', name='contact_source'),
        default='Other', nullable=False,
    )
    status      = db.Column(
        db.Enum('active', 'inactive', 'prospect', name='contact_status'),
        default='prospect', nullable=False,
    )
    assigned_to = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True, index=True)
    notes       = db.Column(db.Text, nullable=True)
    tags        = db.Column(db.JSON, nullable=True, default=list)
    created_at  = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at  = db.Column(
        db.DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    assignee   = db.relationship('User', foreign_keys=[assigned_to], back_populates='assigned_contacts')
    leads      = db.relationship('Lead', back_populates='contact', lazy='dynamic', cascade='all, delete-orphan')
    activities = db.relationship('Activity', back_populates='contact', lazy='dynamic', cascade='all, delete-orphan')
    tasks      = db.relationship('Task', back_populates='contact', lazy='dynamic', cascade='all, delete-orphan')
    deals      = db.relationship('Deal', back_populates='contact', lazy='dynamic', cascade='all, delete-orphan')

    def to_dict(self, include_stats=False):
        data = {
            'id':          self.id,
            'full_name':   self.full_name,
            'email':       self.email,
            'phone':       self.phone,
            'company':     self.company,
            'position':    self.position,
            'source':      self.source,
            'status':      self.status,
            'assigned_to': self.assigned_to,
            'assignee':    self.assignee.to_dict() if self.assignee else None,
            'notes':       self.notes,
            'tags':        self.tags or [],
            'created_at':  self.created_at.isoformat() if self.created_at else None,
            'updated_at':  self.updated_at.isoformat() if self.updated_at else None,
        }
        if include_stats:
            data['leads_count']      = self.leads.count()
            data['activities_count'] = self.activities.count()
            data['tasks_count']      = self.tasks.count()
        return data

    def __repr__(self):
        return f'<Contact {self.full_name}>'
