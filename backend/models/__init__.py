"""
Models package — import order matters for SQLAlchemy relationship resolution.
"""
from extensions import db

from models.user           import User
from models.tokenblacklist import TokenBlacklist
from models.contact        import Contact
from models.pipeline       import Stage
from models.lead           import Lead
from models.deal           import Deal
from models.task           import Task
from models.activity       import Activity

__all__ = [
    'db',
    'User', 'TokenBlacklist',
    'Contact', 'Stage',
    'Lead', 'Deal',
    'Task', 'Activity',
]
