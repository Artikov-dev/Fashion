from extensions import db


class Stage(db.Model):
    __tablename__ = 'stages'

    id          = db.Column(db.Integer, primary_key=True)
    name        = db.Column(db.String(100), nullable=False)
    color       = db.Column(db.String(7), default='#185FA5', nullable=False)
    order_index = db.Column(db.Integer, default=0, nullable=False)
    is_default  = db.Column(db.Boolean, default=False, nullable=False)

    leads = db.relationship('Lead', back_populates='stage', lazy='dynamic')

    def to_dict(self):
        return {
            'id':          self.id,
            'name':        self.name,
            'color':       self.color,
            'order_index': self.order_index,
            'is_default':  self.is_default,
            'leads_count': self.leads.count(),
        }

    def __repr__(self):
        return f'<Stage {self.name}>'


# Default stages seeded at startup
DEFAULT_STAGES = [
    {'name': "Yangi lead",        'color': '#185FA5', 'order_index': 0, 'is_default': True},
    {'name': "Aloqa o'rnatildi",  'color': '#BA7517', 'order_index': 1, 'is_default': False},
    {'name': "Taklif yuborildi",  'color': '#8B5CF6', 'order_index': 2, 'is_default': False},
    {'name': "Muzokara",          'color': '#F59E0B', 'order_index': 3, 'is_default': False},
    {'name': "Yutildi",           'color': '#1D9E75', 'order_index': 4, 'is_default': False},
]
