from extensions import db
from datetime import datetime, timezone


class Deal(db.Model):
    __tablename__ = 'deals'

    id          = db.Column(db.Integer, primary_key=True)
    lead_id     = db.Column(db.Integer, db.ForeignKey('leads.id'), nullable=False, index=True)
    contact_id  = db.Column(db.Integer, db.ForeignKey('contacts.id'), nullable=False, index=True)
    amount      = db.Column(db.Numeric(15, 2), default=0, nullable=False)
    status      = db.Column(db.String(20), default='pending', nullable=False)
    won_at      = db.Column(db.DateTime, nullable=True)
    lost_reason = db.Column(db.Text, nullable=True)
    created_by  = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    created_at  = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at  = db.Column(
        db.DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    lead    = db.relationship('Lead',    back_populates='deals')
    contact = db.relationship('Contact', back_populates='deals')
    creator = db.relationship('User', foreign_keys=[created_by])

    def to_dict(self):
        return {
            'id':          self.id,
            'lead_id':     self.lead_id,
            'lead_title':  self.lead.title if self.lead else None,
            'contact_id':  self.contact_id,
            'contact':     self.contact.to_dict() if self.contact else None,
            'amount':      float(self.amount) if self.amount is not None else 0,
            'status':      self.status,
            'won_at':      self.won_at.isoformat() if self.won_at else None,
            'lost_reason': self.lost_reason,
            'created_by':  self.created_by,
            'creator':     self.creator.to_dict() if self.creator else None,
            'created_at':  self.created_at.isoformat() if self.created_at else None,
            'updated_at':  self.updated_at.isoformat() if self.updated_at else None,
        }

    def __repr__(self):
        return f'<Deal {self.id} [{self.status}]>'
