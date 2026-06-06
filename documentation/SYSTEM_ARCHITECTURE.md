# System Architecture

## Overview

The Fashion E-Commerce System is a full-stack web application following a **decoupled architecture** — the React frontend communicates with the Flask backend exclusively through a RESTful API.

```
┌──────────────────────────────────────────────┐
│               Browser / Client               │
│                                              │
│   React 19 + Vite + Redux Toolkit            │
│   TailwindCSS + Google Fonts                 │
│   React Router v7                            │
└─────────────────┬────────────────────────────┘
                  │  HTTP / REST (JSON)
                  │  JWT Bearer tokens
                  ▼
┌──────────────────────────────────────────────┐
│              Flask REST API                  │
│                                              │
│   Flask 3.0 + Flask-JWT-Extended             │
│   Flask-SQLAlchemy + Flask-Migrate           │
│   Flask-CORS + Flasgger (Swagger)            │
└─────────────────┬────────────────────────────┘
                  │  SQLAlchemy ORM
                  ▼
┌──────────────────────────────────────────────┐
│                 Database                     │
│                                              │
│   Development:  SQLite (file-based)          │
│   Production:   PostgreSQL                   │
└──────────────────────────────────────────────┘
```

---

## Frontend Architecture

```
frontend/src/
├── App.jsx              — Router configuration, all routes
├── main.jsx             — React DOM render, Redux Provider
├── index.css            — Global styles, CSS variables, utilities
│
├── pages/               — Full-page route components
│   ├── Auth.jsx         — Login / Register (combined)
│   ├── Home.jsx         — Landing page with hero, featured products
│   ├── Products.jsx     — Product listing with filters + pagination
│   ├── ProductDetail.jsx— Single product view + add to cart
│   ├── Cart.jsx         — Shopping cart with quantity controls
│   ├── Checkout.jsx     — Order placement form
│   ├── OrderSuccess.jsx — Confirmation page
│   ├── OrderHistory.jsx — User's order history (expandable)
│   └── Admin.jsx        — Admin dashboard (4 sections)
│
├── components/          — Shared reusable components
│   ├── Navbar.jsx       — Sticky nav, mobile menu, cart badge
│   ├── ProductCard.jsx  — Product tile with hover quick-add
│   ├── ProtectedRoute.jsx— Route guard (auth + role check)
│   └── Toast.jsx        — Notification system
│
├── features/            — Redux async logic
│   ├── cart/cartSlice.js— Cart CRUD thunks + state
│   └── orders/ordersSlice.js— Order thunks + state
│
├── slices/              — Redux state slices
│   ├── authSlice.js     — Auth state, login/register thunks
│   └── productsSlice.js — Products + categories + sort/filter
│
├── store/index.js       — Redux store configuration
│
└── utils/api.js         — Axios instance + JWT interceptors + auto-refresh
```

### State Management
Redux Toolkit manages all shared application state:
- **auth** — user object, JWT tokens, loading/error states
- **products** — product list, categories, sort, current product
- **cart** — cart items, loading states
- **orders** — user orders, admin orders

### JWT Auto-Refresh
`utils/api.js` implements a request queue pattern:
1. Attaches Bearer token to every request
2. On 401 response, pauses queue and calls `/auth/refresh`
3. Replays all queued requests with new token
4. On refresh failure, clears storage and redirects to `/auth`

---

## Backend Architecture

```
backend/
├── app.py               — Application factory (create_app)
├── config.py            — Config classes: Development, Testing, Production
├── extensions.py        — db, jwt, migrate instances
├── wsgi.py              — WSGI entry point for gunicorn
├── seed.py              — Database seeder (CLI + auto on first run)
│
├── routes/              — Blueprint route handlers
│   ├── auth.py          — /api/auth/*
│   ├── products.py      — /api/products/*
│   ├── cart.py          — /api/cart/*
│   ├── orders.py        — /api/orders/*
│   ├── admin.py         — /api/admin/*
│   └── wishlist.py      — /api/wishlist/*
│
├── models/              — SQLAlchemy ORM models
│   ├── user.py          — User, Role, user_roles
│   ├── product.py       — Product, Category
│   ├── cart.py          — Cart, CartItem, Invoice
│   ├── order.py         — Order, OrderItem
│   ├── wishlist.py      — Wishlist, WishlistItem
│   └── tokenblacklist.py— TokenBlacklist
│
├── utils/
│   ├── decorators.py    — @admin_required, @login_required
│   └── error_handlers.py— Global HTTP error handlers + logging
│
├── services/
│   └── analytics_service.py — Order/revenue analytics logic
│
└── migrations/          — Alembic database migrations
    └── versions/        — Individual migration scripts
```

### Request Lifecycle
```
Request → CORS → JWT Decode → Blueprint Route → Decorator (RBAC)
       → Controller Logic → SQLAlchemy → Database
       → JSON Response → CORS Headers → Client
```

### Role-Based Access Control
Three levels:
- **Public** — no token required (product listing, categories)
- **Authenticated** — valid JWT required (`@jwt_required()`)
- **Admin** — valid JWT + admin role (`@jwt_required()` + `@admin_required`)

---

## Security

| Concern           | Implementation                          |
|-------------------|-----------------------------------------|
| Passwords         | bcrypt via Werkzeug `generate_password_hash` |
| JWT Tokens        | Short-lived access (1h) + long-lived refresh (30d) |
| Token Revocation  | Blacklist table (JTI stored on logout)  |
| CORS              | Whitelist of allowed frontend origins   |
| SQL Injection     | SQLAlchemy ORM (parameterised queries)  |
| RBAC              | Decorator pattern on all admin routes   |

---

## Technology Stack

| Layer     | Technology              | Version |
|-----------|-------------------------|---------|
| Frontend  | React                   | 19      |
| Frontend  | Vite                    | 8       |
| Frontend  | Redux Toolkit           | 2       |
| Frontend  | React Router            | 7       |
| Frontend  | TailwindCSS             | 3       |
| Frontend  | Axios                   | 1       |
| Backend   | Flask                   | 3.0     |
| Backend   | Flask-JWT-Extended      | 4.6     |
| Backend   | Flask-SQLAlchemy        | 3.1     |
| Backend   | Flask-Migrate (Alembic) | 4.0     |
| Backend   | Flask-CORS              | 4.0     |
| Backend   | Flasgger (Swagger)      | 0.9     |
| Backend   | Gunicorn                | 21+     |
| Database  | SQLite (dev)            | 3       |
| Database  | PostgreSQL (prod)       | 15+     |
