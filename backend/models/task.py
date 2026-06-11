from extensions import db
from datetime import datetime, timezone


class Task(db.Model):
    __tablename__ = 'tasks'

    id          = db.Column(db.Integer, primary_key=True)
    title       = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=True)
    due_date    = db.Column(db.DateTime, nullable=True)
    priority    = db.Column(
        db.Enum('low', 'medium', 'high', 'urgent', name='task_priority'),
        default='medium', nullable=False,
    )
    status      = db.Column(
        db.Enum('todo', 'in_progress', 'done', 'cancelled', name='task_status'),
        default='todo', nullable=False,
    )
    contact_id  = db.Column(db.Integer, db.ForeignKey('contacts.id'), nullable=True, index=True)
    lead_id     = db.Column(db.Integer, db.ForeignKey('leads.id'), nullable=True, index=True)
    assigned_to = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True, index=True)
    created_by  = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    created_at  = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at  = db.Column(
        db.DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    contact  = db.relationship('Contact', back_populates='tasks', foreign_keys=[contact_id])
    lead     = db.relationship('Lead',    back_populates='tasks', foreign_keys=[lead_id])
    assignee = db.relationship('User', foreign_keys=[assigned_to], back_populates='assigned_tasks')
    creator  = db.relationship('User', foreign_keys=[created_by],  back_populates='created_tasks')

    @property
    def is_overdue(self):
        if self.due_date and self.status not in ('done', 'cancelled'):
            return datetime.now(timezone.utc) > self.due_date.replace(tzinfo=timezone.utc) if self.due_date.tzinfo is None else datetime.now(timezone.utc) > self.due_date
        return False

    def to_dict(self):
        return {
            'id':          self.id,
            'title':       self.title,
            'description': self.description,
            'due_date':    self.due_date.isoformat() if self.due_date else None,
            'priority':    self.priority,
            'status':      self.status,
            'is_overdue':  self.is_overdue,
            'contact_id':  self.contact_id,
            'contact':     {'id': self.contact.id, 'full_name': self.contact.full_name} if self.contact else None,
            'lead_id':     self.lead_id,
            'lead':        {'id': self.lead.id, 'title': self.lead.title} if self.lead else None,
            'assigned_to': self.assigned_to,
            'assignee':    self.assignee.to_dict() if self.assignee else None,
            'created_by':  self.created_by,
            'creator':     self.creator.to_dict() if self.creator else None,
            'created_at':  self.created_at.isoformat() if self.created_at else None,
            'updated_at':  self.updated_at.isoformat() if self.updated_at else None,
        }

    def __repr__(self):
        return f'<Task {self.title}>'
