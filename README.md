# VÊTEMENT — Fashion E-Commerce System

> A full-stack fashion e-commerce platform built with React + Flask.  
> University Assignment | BTEC Level 4 Software Development

---

## Features

### Customer Features
- Browse and search fashion products by category, price, and keyword
- Product detail pages with size selection and quantity control
- Shopping cart with real-time quantity updates
- Wishlist — save products for later
- Secure checkout with multiple payment methods (Card, Cash on Delivery, M-Pesa)
- Order history with expandable order details
- JWT-based authentication with automatic token refresh

### Admin Features
- Dashboard overview — total products, orders, users, and revenue
- Product management — create, edit, delete products and categories
- Order management — view all orders, update order status
- User management — view all registered users and roles
- Inventory tracking — stock levels and low-stock alerts
- Revenue analytics — 30-day trend data

---

## Technology Stack

| Layer     | Technologies                                          |
|-----------|-------------------------------------------------------|
| Frontend  | React 19, Vite 8, Redux Toolkit, React Router 7       |
| Styling   | TailwindCSS 3, Cormorant Garamond + Jost fonts        |
| Backend   | Flask 3.0, Flask-JWT-Extended, Flask-SQLAlchemy       |
| Database  | SQLite (dev) / PostgreSQL (prod) via SQLAlchemy ORM   |
| API Docs  | Swagger / Flasgger                                    |
| Deployment| Vercel (frontend), Render (backend)                   |

---

## Project Structure

```
Fashion-Ecommerce-System/
│
├── frontend/                   # React + Vite application
│   ├── src/
│   │   ├── pages/              # Route-level page components
│   │   │   ├── Auth.jsx        # Login & Register
│   │   │   ├── Home.jsx        # Landing page
│   │   │   ├── Products.jsx    # Product listing + filters
│   │   │   ├── ProductDetail.jsx # Single product view
│   │   │   ├── Cart.jsx        # Shopping cart
│   │   │   ├── Checkout.jsx    # Order placement
│   │   │   ├── OrderSuccess.jsx # Confirmation
│   │   │   ├── OrderHistory.jsx # User orders
│   │   │   └── Admin.jsx       # Admin dashboard
│   │   ├── components/         # Shared components
│   │   │   ├── Navbar.jsx      # Navigation with mobile menu
│   │   │   ├── ProductCard.jsx # Product tile component
│   │   │   ├── ProtectedRoute.jsx # Auth + role guard
│   │   │   └── Toast.jsx       # Notification system
│   │   ├── features/           # Redux async slices
│   │   │   ├── cart/           # Cart state management
│   │   │   └── orders/         # Orders state management
│   │   ├── slices/             # Redux state slices
│   │   │   ├── authSlice.js    # Authentication state
│   │   │   └── productsSlice.js # Products state
│   │   ├── store/index.js      # Redux store
│   │   └── utils/api.js        # Axios + JWT interceptors
│   ├── .env.example
│   ├── package.json
│   ├── vite.config.js
│   └── tailwind.config.js
│
├── backend/                    # Flask REST API
│   ├── routes/                 # API route blueprints
│   │   ├── auth.py             # /api/auth/*
│   │   ├── products.py         # /api/products/*
│   │   ├── cart.py             # /api/cart/*
│   │   ├── orders.py           # /api/orders/*
│   │   ├── admin.py            # /api/admin/*
│   │   └── wishlist.py         # /api/wishlist/*
│   ├── models/                 # SQLAlchemy models
│   │   ├── user.py             # User, Role, user_roles
│   │   ├── product.py          # Product, Category
│   │   ├── cart.py             # Cart, CartItem, Invoice
│   │   ├── order.py            # Order, OrderItem
│   │   ├── wishlist.py         # Wishlist, WishlistItem
│   │   └── tokenblacklist.py   # JWT revocation
│   ├── utils/
│   │   ├── decorators.py       # @admin_required
│   │   └── error_handlers.py   # Global error handling
│   ├── services/
│   │   └── analytics_service.py # Business analytics
│   ├── migrations/             # Alembic migrations
│   ├── app.py                  # Application factory
│   ├── config.py               # Environment configuration
│   ├── extensions.py           # Flask extensions
│   ├── seed.py                 # Database seeder
│   ├── wsgi.py                 # Production WSGI entry
│   ├── requirements.txt        # Python dependencies
│   └── .env.example
│
├── database/
│   ├── schema.sql              # Full database schema
│   └── DATABASE.md             # Database documentation
│
├── documentation/
│   ├── API_DOCUMENTATION.md    # All API endpoints
│   ├── SYSTEM_ARCHITECTURE.md  # Architecture overview
│   ├── INSTALLATION_GUIDE.md   # Setup instructions
│   ├── USER_GUIDE.md           # Customer usage guide
│   └── ADMIN_GUIDE.md          # Admin usage guide
│
├── screenshots/                # Application screenshots
├── .gitignore
└── README.md
```

---

## Quick Start

### Prerequisites
- Python 3.11+
- Node.js 18+
- npm 9+

### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate      # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
flask db upgrade
flask seed-db
python app.py
```
→ API running at **http://127.0.0.1:5000**  
→ Swagger docs at **http://127.0.0.1:5000/swagger/**

### Frontend
```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```
→ App running at **http://localhost:5173**

---

## Default Credentials

| Role     | Email           | Password |
|----------|-----------------|----------|
| Admin    | admin@shop.com  | admin123 |
| Customer | user@shop.com   | user123  |

---

## Environment Variables

### Backend (`backend/.env`)
```
FLASK_ENV=development
FLASK_APP=app.py
SECRET_KEY=your-secret-key-32chars-minimum
JWT_SECRET_KEY=your-jwt-secret-32chars-minimum
# DATABASE_URL=postgresql://user:pass@host/db   ← optional (SQLite default)
PORT=5000
```

### Frontend (`frontend/.env`)
```
VITE_API_URL=http://127.0.0.1:5000/api
```

---

## API Endpoints Summary

| Area       | Base Path        | Key Endpoints                              |
|------------|------------------|--------------------------------------------|
| Auth       | `/api/auth`      | register, login, logout, refresh, /me      |
| Products   | `/api/products`  | list, detail, CRUD (admin), categories     |
| Cart       | `/api/cart`      | get, add, update, remove, clear, checkout  |
| Wishlist   | `/api/wishlist`  | get, add, remove, check                    |
| Orders     | `/api/orders`    | history, detail, place                     |
| Admin      | `/api/admin`     | users, orders, analytics, inventory        |

Full documentation: [`documentation/API_DOCUMENTATION.md`](documentation/API_DOCUMENTATION.md)

---

## Deployment

### Backend → Render
- Root directory: `backend`
- Build: `pip install -r requirements.txt && flask db upgrade`
- Start: `gunicorn wsgi:app`

### Frontend → Vercel
- Root directory: `frontend`
- Framework: Vite
- Environment: `VITE_API_URL=https://your-backend.onrender.com/api`

---

## Academic Information

This project was developed as a practical assignment for **BTEC Level 4 Software Development** at **PDP University**, demonstrating:

- Full-stack web application development
- RESTful API design and implementation
- Database design with ORM and migrations
- JWT authentication and role-based access control
- React state management with Redux Toolkit
- Responsive UI/UX design with TailwindCSS
- Software engineering principles and clean code practices

---

## License

This project is for educational purposes.
