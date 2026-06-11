"""
Nexora CRM — Database seed
Run via:  flask seed-db
Or called automatically on first startup if tables are empty.

Creates:
  - 5 pipeline stages
  - 6 users  (admin, manager, 2x sales, user, viewer)
  - 25 contacts
  - 20 leads
  - 15 tasks
  - 40 activities
  - 10 deals
"""

import random
from datetime import datetime, timezone, timedelta
from extensions import db


# ─── helpers ───────────────────────────────────────────────────────────────────

def _rand_date(days_back=180, days_forward=60):
    delta = random.randint(-days_back, days_forward)
    return datetime.now(timezone.utc) + timedelta(days=delta)


COMPANIES  = ["Uzum Market", "Texnomart", "Mohirdev", "Astrum IT", "Beeline UZ",
              "Ucell", "HUMO", "Kapitalbank", "Ipoteka Bank", "Express24",
              "Makro", "Korzinka", "OFB", "Alif Tech", "PayMe", "Click UZ"]
POSITIONS  = ["CEO", "CMO", "CTO", "Sales Director", "Marketing Manager",
              "Procurement Manager", "IT Manager", "CFO", "Operations Lead"]
FIRST_NAMES = ["Jasur", "Dilnoza", "Bobur", "Malika", "Sherzod", "Nilufar",
               "Ulugbek", "Madina", "Azizbek", "Gulnora", "Sarvar", "Feruza",
               "Mansur", "Zulfiya", "Behruz", "Kamola", "Ravshan", "Nargiza",
               "Eldor", "Barno", "Sanjar", "Mohira", "Firdavs", "Shahnoza", "Otabek"]
LAST_NAMES  = ["Karimov", "Umarov", "Xasanov", "Yusupov", "Toshmatov",
               "Nazarov", "Mirzayev", "Rahimov", "Ergashev", "Abdullayev"]

LEAD_TITLES = [
    "Korporativ CRM yechimi", "Marketing avtomatizatsiyasi", "HR platformasi",
    "Moliyaviy hisobot tizimi", "Omborxona boshqaruvi", "E-commerce integratsiya",
    "Mijozlar qo'llab-quvvatlash", "Analitika dashboard", "Mobil ilova",
    "API integratsiya loyihasi", "Kiberxavfsizlik audit", "Bulutli infratuzilma",
    "IoT monitoring tizimi", "AI chatbot yechimi", "ERP joriy etish",
    "Digital marketing kampaniya", "SEO optimizatsiya", "SMM boshqaruvi",
    "Brend identifikatsiyasi", "UX/UI dizayn loyihasi",
]

ACTIVITY_TITLES = [
    "Dastlabki qo'ng'iroq", "Demo namoyishi", "Taklifnoma yuborildi",
    "Shartnoma muhokamasi", "Texnik talablar aniqlanishi", "Buxgalter bilan uchrashuv",
    "Email yuborildi", "WhatsApp orqali muloqot", "Ofisda uchrashuv",
    "Qo'ng'iroq konferentsiyasi", "Mahsulot taqdimoti", "Narx kelishuvi",
]

TASK_TITLES = [
    "Taklifnoma tayyorlash", "Shartnomani ko'rib chiqish",
    "Demo muhitini sozlash", "Mijozga email yuborish",
    "Texnik hujjatlarni tayyorlash", "Hisobot yozish",
    "Qo'ng'iroq rejalash", "Uchrashuv tashkil etish",
    "Narxlash jadvalini yangilash", "Mijoz ma'lumotlarini tekshirish",
    "Hamkorlik shartnomasini yakunlash", "Trening materiallari tayyorlash",
    "Qo'llab-quvvatlash ticketini hal qilish",
    "KPI hisobotini tayyorlash", "Loyiha timeline'ini yangilash",
]


def seed_all():
    from models.user     import User
    from models.pipeline import Stage, DEFAULT_STAGES
    from models.contact  import Contact
    from models.lead     import Lead
    from models.deal     import Deal
    from models.task     import Task
    from models.activity import Activity

    # ── stages ─────────────────────────────────────────────────────────────────
    if Stage.query.count() == 0:
        for s in DEFAULT_STAGES:
            db.session.add(Stage(**s))
        db.session.flush()

    stages = Stage.query.order_by(Stage.order_index).all()

    # ── users ──────────────────────────────────────────────────────────────────
    seed_users = [
        {'email': 'admin@nexora.uz',    'password': 'Admin@2026',   'name': 'Admin User',     'role': 'admin'},
        {'email': 'manager@nexora.uz',  'password': 'Manager@2026', 'name': 'Manager User',   'role': 'manager'},
        {'email': 'sales1@nexora.uz',   'password': 'Sales@2026',   'name': 'Jasur Karimov',  'role': 'sales'},
        {'email': 'sales2@nexora.uz',   'password': 'Sales@2026',   'name': 'Dilnoza Umarova','role': 'sales'},
        {'email': 'user@nexora.uz',     'password': 'User@2026',    'name': 'Oddiy Foydalanuvchi', 'role': 'user'},
    ]

    created_users = {}
    for u_data in seed_users:
        u = User.query.filter_by(email=u_data['email']).first()
        if not u:
            u = User(email=u_data['email'], name=u_data['name'], role=u_data['role'])
            u.set_password(u_data['password'])
            db.session.add(u)
            db.session.flush()
        created_users[u_data['email']] = u

    sales_users = [created_users['sales1@nexora.uz'], created_users['sales2@nexora.uz']]

    # ── contacts — 12 oyga tarqatilgan ────────────────────────────────────────
    if Contact.query.count() < 5:
        sources  = ['Instagram', 'Referral', 'Website', 'Cold call', 'Other']
        statuses = ['active', 'inactive', 'prospect']

        # har oy nechta kontakt qo'shilganini belgilaymiz (12 oy, indeks 0=eng eski)
        monthly_contacts = [1, 2, 1, 3, 2, 1, 3, 2, 4, 2, 3, 4]  # jami 28

        contacts = []
        name_idx = 0
        now = datetime.now(timezone.utc)

        for months_ago, count in enumerate(reversed(monthly_contacts)):
            # o'sha oyning taxminiy sanasi (15-kuni)
            base = now.replace(day=15, hour=10, minute=0, second=0, microsecond=0)
            for _ in range(months_ago):
                base = (base.replace(day=1) - timedelta(days=1)).replace(day=15)

            for _ in range(count):
                idx = name_idx % len(FIRST_NAMES)
                fname = FIRST_NAMES[idx]
                lname = random.choice(LAST_NAMES)
                assignee = random.choice(sales_users)
                jitter = timedelta(days=random.randint(-10, 10))
                c = Contact(
                    full_name   = f"{fname} {lname}",
                    email       = f"{fname.lower()}{name_idx+1}@example.com",
                    phone       = f"+99890{random.randint(1000000, 9999999)}",
                    company     = random.choice(COMPANIES),
                    position    = random.choice(POSITIONS),
                    source      = random.choice(sources),
                    status      = random.choice(statuses),
                    assigned_to = assignee.id,
                    tags        = random.sample(['VIP', 'Yangi', 'Faol', 'Uzluksiz', 'Korporativ'], k=random.randint(0, 2)),
                    created_at  = base + jitter,
                )
                db.session.add(c)
                contacts.append(c)
                name_idx += 1

        db.session.flush()
    else:
        contacts = Contact.query.all()

    # ── leads ──────────────────────────────────────────────────────────────────
    if Lead.query.count() < 5:
        priorities = ['low', 'medium', 'high', 'urgent']
        lead_statuses = ['open', 'open', 'open', 'won', 'lost']

        leads = []
        for i in range(20):
            contact  = contacts[i % len(contacts)]
            assignee = random.choice(sales_users)
            stage    = random.choice(stages)
            status   = random.choice(lead_statuses)

            lead = Lead(
                title               = LEAD_TITLES[i],
                contact_id          = contact.id,
                pipeline_stage_id   = stage.id,
                value               = random.choice([500000, 1000000, 2500000, 5000000,
                                                     10000000, 25000000, 50000000]),
                currency            = 'UZS',
                priority            = random.choice(priorities),
                status              = status,
                assigned_to         = assignee.id,
                expected_close_date = _rand_date(days_back=10, days_forward=90),
                created_at          = _rand_date(days_back=90, days_forward=0),
            )
            db.session.add(lead)
            leads.append(lead)

        db.session.flush()
    else:
        leads = Lead.query.all()

    # ── deals — 12 oyga tarqatilgan ──────────────────────────────────────────
    if Deal.query.count() < 3:
        admin_user   = created_users['admin@nexora.uz']
        sales1       = created_users['sales1@nexora.uz']
        sales2       = created_users['sales2@nexora.uz']

        # 12 oyning har biriga turli miqdorda deals yaratamiz
        # (oy = 0 → 11 oy oldin, oy = 11 → joriy oy)
        monthly_plan = [
            # (oy_oldin, won_soni, won_summa_list,        lost_soni)
            (11, 1, [3_000_000, 8_000_000],               1),
            (10, 2, [5_000_000, 12_000_000],              1),
            (9,  1, [2_500_000],                          2),
            (8,  3, [7_000_000, 15_000_000, 4_000_000],  0),
            (7,  2, [20_000_000, 6_000_000],              1),
            (6,  1, [10_000_000],                         1),
            (5,  4, [8_000_000, 25_000_000, 3_000_000, 9_000_000], 1),
            (4,  2, [18_000_000, 5_000_000],              2),
            (3,  3, [12_000_000, 30_000_000, 7_000_000], 1),
            (2,  2, [22_000_000, 11_000_000],             1),
            (1,  5, [15_000_000, 40_000_000, 8_000_000, 5_000_000, 12_000_000], 0),
            (0,  3, [50_000_000, 20_000_000, 10_000_000], 1),
        ]

        contact_pool = contacts[:10]
        lead_pool    = leads[:10]
        lost_reasons = [
            "Byudjet yetarli emas", "Raqobatchi tanladi",
            "Loyiha bekor qilindi", "Muloqot uzildi",
        ]

        deal_idx = 0
        for (months_ago, won_count, won_amounts, lost_count) in monthly_plan:
            # month center — e.g. 15th of that month
            base_date = datetime.now(timezone.utc).replace(day=15, hour=12,
                                                            minute=0, second=0,
                                                            microsecond=0)
            # go back N months
            for _ in range(months_ago):
                # subtract ~30 days then re-anchor to 15th
                base_date = (base_date.replace(day=1) - timedelta(days=1)).replace(day=15)

            # won deals
            for amount in won_amounts[:won_count]:
                # randomize day within ±10 days of the 15th
                jitter = timedelta(days=random.randint(-10, 10))
                won_date = base_date + jitter
                c = contact_pool[deal_idx % len(contact_pool)]
                l = lead_pool[deal_idx % len(lead_pool)]
                db.session.add(Deal(
                    lead_id    = l.id,
                    contact_id = c.id,
                    amount     = amount,
                    status     = 'won',
                    won_at     = won_date,
                    created_by = random.choice([admin_user, sales1, sales2]).id,
                ))
                deal_idx += 1

            # lost deals
            for _ in range(lost_count):
                jitter = timedelta(days=random.randint(-10, 10))
                c = contact_pool[deal_idx % len(contact_pool)]
                l = lead_pool[deal_idx % len(lead_pool)]
                db.session.add(Deal(
                    lead_id     = l.id,
                    contact_id  = c.id,
                    amount      = random.choice([1_000_000, 3_000_000, 5_000_000]),
                    status      = 'lost',
                    lost_reason = random.choice(lost_reasons),
                    created_by  = random.choice([admin_user, sales1, sales2]).id,
                ))
                deal_idx += 1

        db.session.flush()

    # ── tasks ──────────────────────────────────────────────────────────────────
    if Task.query.count() < 5:
        t_statuses   = ['todo', 'in_progress', 'done', 'cancelled']
        t_priorities = ['low', 'medium', 'high', 'urgent']

        for i in range(15):
            contact  = contacts[i % len(contacts)]
            lead     = leads[i % len(leads)]
            assignee = random.choice(sales_users)

            db.session.add(Task(
                title       = TASK_TITLES[i],
                description = f"{TASK_TITLES[i]} uchun batafsil vazifa tavsifi.",
                due_date    = _rand_date(days_back=20, days_forward=30),
                priority    = random.choice(t_priorities),
                status      = random.choice(t_statuses),
                contact_id  = contact.id,
                lead_id     = lead.id,
                assigned_to = assignee.id,
                created_by  = assignee.id,
            ))

        db.session.flush()

    # ── activities ─────────────────────────────────────────────────────────────
    if Activity.query.count() < 10:
        act_types = ['call', 'email', 'meeting', 'note', 'whatsapp']

        for i in range(40):
            contact  = contacts[i % len(contacts)]
            lead     = leads[i % len(leads)] if i < len(leads) else None
            creator  = random.choice(sales_users)

            db.session.add(Activity(
                type             = random.choice(act_types),
                title            = ACTIVITY_TITLES[i % len(ACTIVITY_TITLES)],
                description      = f"Mijoz bilan {ACTIVITY_TITLES[i % len(ACTIVITY_TITLES)].lower()} amalga oshirildi.",
                contact_id       = contact.id,
                lead_id          = lead.id if lead else None,
                created_by       = creator.id,
                activity_date    = _rand_date(days_back=90, days_forward=0),
                duration_minutes = random.choice([None, 15, 30, 45, 60, 90]),
            ))

        db.session.flush()

    db.session.commit()
    print("Nexora CRM - seed muvaffaqiyatli bajarildi.")


def init_app(app):
    @app.cli.command('seed-db')
    def seed_command():
        """Seed the database with CRM test data."""
        with app.app_context():
            db.create_all()
            seed_all()

    @app.before_request
    def auto_seed():
        """Auto-seed on first request if User table is empty."""
        app.before_request_funcs[None].remove(auto_seed)
        try:
            from models.user import User
            if User.query.count() == 0:
                db.create_all()
                seed_all()
        except Exception as e:
            print(f"Auto-seed skipped: {e}")
