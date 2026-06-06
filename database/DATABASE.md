# Database Documentation

## Overview

The Fashion E-Commerce System uses **SQLite** for local development and **PostgreSQL** for production (Render, Supabase, Railway, etc.). SQLAlchemy ORM with Flask-Migrate (Alembic) handles schema management.

---

## Tables & Relationships

### Entity Relationship Summary

```
users ──< user_roles >── roles
users ──< carts ──< cart_items >── products
users ──< wishlists ──< wishlist_items >── products
users ──< orders ──< order_items >── products
orders ──< invoices
categories ──< products
token_blacklist  (standalone — JWT revocation)
```

---

## Table Descriptions

### `users`
| Column     | Type         | Description                        |
|------------|--------------|------------------------------------|
| id         | INTEGER PK   | Auto-increment primary key         |
| email      | VARCHAR(120) | Unique email address               |
| password   | VARCHAR(255) | bcrypt-hashed password             |
| name       | VARCHAR(120) | Display name (optional)            |
| phone      | VARCHAR(20)  | Phone number (optional)            |
| role       | VARCHAR(20)  | Legacy role: `admin` or `customer` |
| is_active  | BOOLEAN      | Account status                     |
| created_at | DATETIME     | Registration timestamp             |

### `roles` / `user_roles`
Many-to-many via `user_roles` junction table. Supports future multi-role expansion. Currently two roles: `admin`, `customer`.

### `categories`
| Column      | Type         | Description          |
|-------------|--------------|----------------------|
| id          | INTEGER PK   | Primary key          |
| name        | VARCHAR(100) | Unique category name |
| description | TEXT         | Optional description |

### `products`
| Column      | Type          | Description                  |
|-------------|---------------|------------------------------|
| id          | INTEGER PK    | Primary key                  |
| name        | VARCHAR(200)  | Product name                 |
| description | TEXT          | Product description          |
| price       | DECIMAL(10,2) | Price in USD                 |
| stock       | INTEGER       | Available quantity           |
| image_url   | VARCHAR(500)  | Product image URL            |
| category_id | INTEGER FK    | References `categories.id`   |

### `carts` / `cart_items`
One cart per user (UNIQUE on user_id). Items store denormalised product name and image at time of adding — prevents issues if product changes.

### `wishlists` / `wishlist_items`
One wishlist per user. Unique constraint on (wishlist_id, product_id) prevents duplicates.

### `orders` / `order_items`
Orders store `items` as a JSON string for SQLite compatibility. `order_items` table provides a normalised copy for analytics queries.

### `token_blacklist`
Stores JTI (JWT ID) of revoked tokens to implement stateful logout.

---

## Migration History

| Revision         | Description                    |
|------------------|--------------------------------|
| `77f2732613b9`  | Initial — token_blacklist, user |
| `7831c2cccd2f`  | Products, users, carts, orders  |
| `4ae2c6a8a215`  | Updated cart and order tables   |
| `d8bfb73f5322`  | Merge heads                     |
| `a1f9b3c7d2e4`  | Roles and user_roles tables     |
| `b2f7c4d2f1a6`  | Role description column         |
| `c3f8a1b9d4e2`  | Wishlist tables                 |

---

## Running Migrations

```bash
cd backend

# Apply all pending migrations
flask db upgrade

# Create a new migration after model changes
flask db migrate -m "description of change"

# View migration history
flask db history

# Rollback one step
flask db downgrade
```

---

## Switching to PostgreSQL

1. Install PostgreSQL locally or use a cloud provider (Supabase, Railway, Render)
2. Create a database and get the connection string
3. Set in `backend/.env`:
   ```
   DATABASE_URL=postgresql://user:password@host:5432/fashion_shop
   ```
4. Run `flask db upgrade` — all migrations apply automatically
