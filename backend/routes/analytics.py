"""
Analytics API
GET /api/analytics/dashboard        — KPI cards
GET /api/analytics/leads/by-stage   — leads grouped by stage
GET /api/analytics/leads/funnel     — funnel data
GET /api/analytics/revenue/trend    — monthly revenue (12 months)
GET /api/analytics/revenue/forecast — simple linear forecast
GET /api/analytics/team/performance — per-user stats
GET /api/analytics/contacts/growth  — contacts per month
GET /api/analytics/activities/feed  — recent 20 activities
"""

from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required
from datetime import datetime, timezone, timedelta
from sqlalchemy import func, extract
from extensions import db
from models.lead     import Lead
from models.deal     import Deal
from models.contact  import Contact
from models.task     import Task
from models.activity import Activity
from models.user     import User
from utils.rbac      import get_current_role, get_current_user_id, min_role, role_required

analytics_bp = Blueprint('analytics', __name__, url_prefix='/api/analytics')


def _scope_filter(model, role, uid, id_field='assigned_to'):
    """Return a filter clause limiting data to current user if role == sales."""
    if role == 'sales':
        return getattr(model, id_field) == uid
    return True  # SQLAlchemy ignores literal True as a filter


@analytics_bp.route('/dashboard', methods=['GET'])
@min_role('sales')
def dashboard():
    role = get_current_role()
    uid  = get_current_user_id()
    now  = datetime.now(timezone.utc)
    start_of_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

    lead_q = Lead.query
    deal_q = Deal.query
    if role == 'sales':
        lead_q = lead_q.filter(Lead.assigned_to == uid)
        deal_q = deal_q.filter(Deal.created_by == uid)

    total_leads   = lead_q.filter(Lead.status == 'open').count()
    won_deals     = deal_q.filter(Deal.status == 'won').count()
    revenue       = db.session.query(func.coalesce(func.sum(Deal.amount), 0)).filter(
        Deal.status == 'won',
        *([Deal.created_by == uid] if role == 'sales' else []),
    ).scalar()

    total_leads_all = lead_q.count() or 1
    won_leads_count = lead_q.filter(Lead.status == 'won').count()
    conversion_rate = round(won_leads_count / total_leads_all * 100, 1)

    avg_deal_size = db.session.query(func.avg(Deal.amount)).filter(
        Deal.status == 'won',
        *([Deal.created_by == uid] if role == 'sales' else []),
    ).scalar() or 0

    new_contacts_mtd = Contact.query.filter(
        Contact.created_at >= start_of_month,
        *([Contact.assigned_to == uid] if role == 'sales' else []),
    ).count()

    overdue_tasks = Task.query.filter(
        Task.due_date < now,
        Task.status.in_(['todo', 'in_progress']),
        *([Task.assigned_to == uid] if role == 'sales' else []),
    ).count()

    return jsonify({
        'success': True,
        'data': {
            'total_leads':       total_leads,
            'won_deals':         won_deals,
            'revenue':           float(revenue),
            'conversion_rate':   conversion_rate,
            'avg_deal_size':     float(avg_deal_size),
            'new_contacts_mtd':  new_contacts_mtd,
            'overdue_tasks':     overdue_tasks,
        },
    }), 200


@analytics_bp.route('/leads/by-stage', methods=['GET'])
@min_role('sales')
def leads_by_stage():
    from models.pipeline import Stage
    role = get_current_role()
    uid  = get_current_user_id()

    stages = Stage.query.order_by(Stage.order_index).all()
    result = []
    for stage in stages:
        q = Lead.query.filter(Lead.pipeline_stage_id == stage.id, Lead.status == 'open')
        if role == 'sales':
            q = q.filter(Lead.assigned_to == uid)
        result.append({
            'stage':  stage.name,
            'color':  stage.color,
            'count':  q.count(),
            'value':  float(db.session.query(func.coalesce(func.sum(Lead.value), 0))
                           .filter(Lead.pipeline_stage_id == stage.id, Lead.status == 'open',
                                   *([Lead.assigned_to == uid] if role == 'sales' else []))
                           .scalar()),
        })
    return jsonify({'success': True, 'data': result}), 200


@analytics_bp.route('/leads/funnel', methods=['GET'])
@min_role('sales')
def leads_funnel():
    role = get_current_role()
    uid  = get_current_user_id()

    base = Lead.query
    if role == 'sales':
        base = base.filter(Lead.assigned_to == uid)

    total   = base.count()
    open_l  = base.filter(Lead.status == 'open').count()
    won_l   = base.filter(Lead.status == 'won').count()
    lost_l  = base.filter(Lead.status == 'lost').count()

    return jsonify({'success': True, 'data': [
        {'name': 'Jami leads',  'value': total},
        {'name': 'Ochiq',       'value': open_l},
        {'name': 'Yutildi',     'value': won_l},
        {'name': "Yo'qotildi",  'value': lost_l},
    ]}), 200


@analytics_bp.route('/revenue/trend', methods=['GET'])
@min_role('sales')
def revenue_trend():
    role = get_current_role()
    uid  = get_current_user_id()
    now  = datetime.now(timezone.utc)

    result = []
    for i in range(11, -1, -1):
        month_start = (now.replace(day=1) - timedelta(days=i * 28)).replace(day=1)
        month_end   = (month_start + timedelta(days=32)).replace(day=1)
        q = db.session.query(func.coalesce(func.sum(Deal.amount), 0)).filter(
            Deal.status == 'won',
            Deal.won_at >= month_start,
            Deal.won_at < month_end,
        )
        if role == 'sales':
            q = q.filter(Deal.created_by == uid)
        revenue = float(q.scalar())
        result.append({
            'month':   month_start.strftime('%b %Y'),
            'revenue': revenue,
        })

    return jsonify({'success': True, 'data': result}), 200


@analytics_bp.route('/revenue/forecast', methods=['GET'])
@min_role('manager')
def revenue_forecast():
    """Simple 3-month linear forecast based on last 6 months."""
    role = get_current_role()
    uid  = get_current_user_id()
    now  = datetime.now(timezone.utc)

    monthly = []
    for i in range(5, -1, -1):
        month_start = (now.replace(day=1) - timedelta(days=i * 28)).replace(day=1)
        month_end   = (month_start + timedelta(days=32)).replace(day=1)
        q = db.session.query(func.coalesce(func.sum(Deal.amount), 0)).filter(
            Deal.status == 'won',
            Deal.won_at >= month_start,
            Deal.won_at < month_end,
        )
        if role == 'sales':
            q = q.filter(Deal.created_by == uid)
        monthly.append(float(q.scalar()))

    if len(monthly) < 2:
        avg = monthly[0] if monthly else 0
        forecast = [avg, avg, avg]
    else:
        diffs  = [monthly[i+1] - monthly[i] for i in range(len(monthly)-1)]
        trend  = sum(diffs) / len(diffs)
        last   = monthly[-1]
        forecast = [max(0, last + trend * (i+1)) for i in range(3)]

    result = []
    for i, val in enumerate(forecast):
        month_start = (now.replace(day=1) + timedelta(days=(i+1) * 31)).replace(day=1)
        result.append({'month': month_start.strftime('%b %Y'), 'forecast': round(val, 2)})

    return jsonify({'success': True, 'data': result}), 200


@analytics_bp.route('/team/performance', methods=['GET'])
@role_required('admin', 'manager')
def team_performance():
    users = User.query.filter(User.is_active == True, User.role.in_(['sales', 'manager'])).all()
    result = []
    for u in users:
        won = Deal.query.filter(Deal.created_by == u.id, Deal.status == 'won').count()
        rev = float(db.session.query(func.coalesce(func.sum(Deal.amount), 0))
                    .filter(Deal.created_by == u.id, Deal.status == 'won').scalar())
        open_leads = Lead.query.filter(Lead.assigned_to == u.id, Lead.status == 'open').count()
        result.append({
            'user_id':   u.id,
            'name':      u.name or u.email,
            'role':      u.role,
            'won_deals': won,
            'revenue':   rev,
            'open_leads': open_leads,
        })
    result.sort(key=lambda x: x['revenue'], reverse=True)
    return jsonify({'success': True, 'data': result}), 200


@analytics_bp.route('/contacts/growth', methods=['GET'])
@min_role('manager')
def contacts_growth():
    now = datetime.now(timezone.utc)
    result = []
    for i in range(11, -1, -1):
        month_start = (now.replace(day=1) - timedelta(days=i * 28)).replace(day=1)
        month_end   = (month_start + timedelta(days=32)).replace(day=1)
        count = Contact.query.filter(
            Contact.created_at >= month_start,
            Contact.created_at < month_end,
        ).count()
        result.append({'month': month_start.strftime('%b %Y'), 'count': count})
    return jsonify({'success': True, 'data': result}), 200


@analytics_bp.route('/activities/feed', methods=['GET'])
@jwt_required()
def activities_feed():
    role = get_current_role()
    uid  = get_current_user_id()

    q = Activity.query
    if role == 'sales':
        q = q.filter(Activity.created_by == uid)

    feed = q.order_by(Activity.activity_date.desc()).limit(20).all()
    return jsonify({'success': True, 'data': [a.to_dict() for a in feed]}), 200
