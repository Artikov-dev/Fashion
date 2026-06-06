"""
Models package — import order matters for SQLAlchemy relationship resolution.
"""
from extensions import db

from models.user import User
from models.product import Product, Category
from models.cart import Cart, CartItem, Invoice
from models.order import Order, OrderItem
from models.wishlist import Wishlist, WishlistItem

__all__ = [
    'db',
    'User',
    'Product', 'Category',
    'Cart', 'CartItem', 'Invoice',
    'Order', 'OrderItem',
    'Wishlist', 'WishlistItem',
]
