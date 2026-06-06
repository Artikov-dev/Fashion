"""
Wishlist model — allows users to save products for later.

Table: wishlists
  - user_id  → FK to users.id  (unique per user, one wishlist per user)

Table: wishlist_items
  - wishlist_id → FK to wishlists.id
  - product_id  → FK to products.id
  - UNIQUE(wishlist_id, product_id) prevents duplicate saves
"""

from datetime import datetime, timezone
from extensions import db


class Wishlist(db.Model):
    __tablename__ = 'wishlists'

    id         = db.Column(db.Integer, primary_key=True)
    user_id    = db.Column(db.Integer, db.ForeignKey('users.id'), unique=True, nullable=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    user  = db.relationship('User', backref=db.backref('wishlist', uselist=False))
    items = db.relationship('WishlistItem', backref='wishlist', lazy='select',
                            cascade='all, delete-orphan')

    def to_dict(self):
        return {
            'id':       self.id,
            'user_id':  self.user_id,
            'items':    [item.to_dict() for item in self.items],
            'count':    len(self.items),
        }

    def __repr__(self):
        return f'<Wishlist user={self.user_id}>'


class WishlistItem(db.Model):
    __tablename__ = 'wishlist_items'
    __table_args__ = (
        db.UniqueConstraint('wishlist_id', 'product_id', name='uq_wishlist_product'),
    )

    id           = db.Column(db.Integer, primary_key=True)
    wishlist_id  = db.Column(db.Integer, db.ForeignKey('wishlists.id'), nullable=False)
    product_id   = db.Column(db.Integer, db.ForeignKey('products.id'), nullable=False)
    added_at     = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    # Eager-load product so .to_dict() works without extra queries
    product = db.relationship('Product')

    def to_dict(self):
        p = self.product
        return {
            'id':            self.id,
            'product_id':    self.product_id,
            'added_at':      self.added_at.isoformat(),
            'product': {
                'id':           p.id,
                'name':         p.name,
                'price':        float(p.price),
                'image_url':    p.image_url,
                'category_name': p.category.name if p.category else None,
                'stock':        p.stock,
            } if p else None,
        }

    def __repr__(self):
        return f'<WishlistItem product={self.product_id}>'
