from extensions import db
from datetime import datetime, timezone


class Activity(db.Model):
    __tablename__ = 'activities'

    id               = db.Column(db.Integer, primary_key=True)
    type             = db.Column(
        db.Enum('call', 'email', 'meeting', 'note', 'whatsapp', name='activity_type'),
        default='note', nullable=False,
    )
    title            = db.Column(db.String(200), nullable=False)
    description      = db.Column(db.Text, nullable=True)
    contact_id       = db.Column(db.Integer, db.ForeignKey('contacts.id'), nullable=True, index=True)
    lead_id          = db.Column(db.Integer, db.ForeignKey('leads.id'), nullable=True, index=True)
    created_by       = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True, index=True)
    activity_date    = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    duration_minutes = db.Column(db.Integer, nullable=True)
    created_at       = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    contact = db.relationship('Contact', back_populates='activities', foreign_keys=[contact_id])
    lead    = db.relationship('Lead',    back_populates='activities', foreign_keys=[lead_id])
    creator = db.relationship('User', foreign_keys=[created_by], back_populates='activities')

    def to_dict(self):
        return {
            'id':               self.id,
            'type':             self.type,
            'title':            self.title,
            'description':      self.description,
            'contact_id':       self.contact_id,
            'contact':          {'id': self.contact.id, 'full_name': self.contact.full_name} if self.contact else None,
            'lead_id':          self.lead_id,
            'lead':             {'id': self.lead.id, 'title': self.lead.title} if self.lead else None,
            'created_by':       self.created_by,
            'creator':          self.creator.to_dict() if self.creator else None,
            'activity_date':    self.activity_date.isoformat() if self.activity_date else None,
            'duration_minutes': self.duration_minutes,
            'created_at':       self.created_at.isoformat() if self.created_at else None,
        }

    def __repr__(self):
        return f'<Activity {self.type}: {self.title}>'
