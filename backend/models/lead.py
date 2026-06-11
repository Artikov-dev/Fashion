from extensions import db
from datetime import datetime, timezone


class Lead(db.Model):
    __tablename__ = 'leads'

    id                  = db.Column(db.Integer, primary_key=True)
    title               = db.Column(db.String(200), nullable=False)
    contact_id          = db.Column(db.Integer, db.ForeignKey('contacts.id'), nullable=False, index=True)
    pipeline_stage_id   = db.Column(db.Integer, db.ForeignKey('stages.id'), nullable=True, index=True)
    value               = db.Column(db.Numeric(15, 2), default=0, nullable=False)
    currency            = db.Column(db.String(10), default='UZS', nullable=False)
    priority            = db.Column(
        db.Enum('low', 'medium', 'high', 'urgent', name='lead_priority'),
        default='medium', nullable=False,
    )
    status              = db.Column(
        db.Enum('open', 'won', 'lost', 'archived', name='lead_status'),
        default='open', nullable=False,
    )
    assigned_to         = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True, index=True)
    expected_close_date = db.Column(db.DateTime, nullable=True)
    created_at          = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at          = db.Column(
        db.DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    contact    = db.relationship('Contact', back_populates='leads')
    stage      = db.relationship('Stage', back_populates='leads')
    assignee   = db.relationship('User', foreign_keys=[assigned_to], back_populates='assigned_leads')
    tasks      = db.relationship('Task', back_populates='lead', lazy='dynamic', cascade='all, delete-orphan')
    activities = db.relationship('Activity', back_populates='lead', lazy='dynamic', cascade='all, delete-orphan')
    deals      = db.relationship('Deal', back_populates='lead', lazy='dynamic', cascade='all, delete-orphan')

    def to_dict(self, include_contact=False):
        data = {
            'id':                   self.id,
            'title':                self.title,
            'contact_id':           self.contact_id,
            'pipeline_stage_id':    self.pipeline_stage_id,
            'stage':                self.stage.to_dict() if self.stage else None,
            'value':                float(self.value) if self.value is not None else 0,
            'currency':             self.currency,
            'priority':             self.priority,
            'status':               self.status,
            'assigned_to':          self.assigned_to,
            'assignee':             self.assignee.to_dict() if self.assignee else None,
            'expected_close_date':  self.expected_close_date.isoformat() if self.expected_close_date else None,
            'created_at':           self.created_at.isoformat() if self.created_at else None,
            'updated_at':           self.updated_at.isoformat() if self.updated_at else None,
        }
        if include_contact and self.contact:
            data['contact'] = self.contact.to_dict()
        return data

    def __repr__(self):
        return f'<Lead {self.title}>'
