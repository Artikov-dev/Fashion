-- ============================================================
--  Fashion E-Commerce System — Database Schema
--  Compatible with: SQLite (development) & PostgreSQL (production)
--  Generated: 2025
-- ============================================================

-- ── Users & Roles ────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS users (
    id          INTEGER      PRIMARY KEY AUTOINCREMENT,
    email       VARCHAR(120) NOT NULL UNIQUE,
    password    VARCHAR(255) NOT NULL,
    name        VARCHAR(120),
    phone       VARCHAR(20),
    role        VARCHAR(20)  NOT NULL DEFAULT 'customer',
    is_active   BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS roles (
    id          INTEGER     PRIMARY KEY AUTOINCREMENT,
    name        VARCHAR(50) NOT NULL UNIQUE,
    description TEXT
);

CREATE TABLE IF NOT EXISTS user_roles (
    user_id     INTEGER NOT NULL REFERENCES users(id)  ON DELETE CASCADE,
    role_id     INTEGER NOT NULL REFERENCES roles(id)  ON DELETE CASCADE,
    PRIMARY KEY (user_id, role_id)
);

-- ── Token Blacklist (JWT revocation) ─────────────────────────

CREATE TABLE IF NOT EXISTS token_blacklist (
    id         INTEGER     PRIMARY KEY AUTOINCREMENT,
    jti        VARCHAR(36) NOT NULL UNIQUE,
    created_at DATETIME    DEFAULT CURRENT_TIMESTAMP
);

-- ── Product Catalog ───────────────────────────────────────────

CREATE TABLE IF NOT EXISTS categories (
    id          INTEGER      PRIMARY KEY AUTOINCREMENT,
    name        VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_at  DATETIME     DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS products (
    id          INTEGER       PRIMARY KEY AUTOINCREMENT,
    name        VARCHAR(200)  NOT NULL,
    description TEXT,
    price       DECIMAL(10,2) NOT NULL,
    stock       INTEGER       NOT NULL DEFAULT 0,
    image_url   VARCHAR(500),
    category_id INTEGER       REFERENCES categories(id) ON DELETE SET NULL,
    created_at  DATETIME      DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME      DEFAULT CURRENT_TIMESTAMP
);

-- ── Shopping Cart ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS carts (
    id         INTEGER  PRIMARY KEY AUTOINCREMENT,
    user_id    INTEGER  NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS cart_items (
    id            INTEGER       PRIMARY KEY AUTOINCREMENT,
    cart_id       INTEGER       NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
    product_id    INTEGER       NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    product_name  VARCHAR(200)  NOT NULL,
    product_image VARCHAR(500),
    quantity      INTEGER       NOT NULL DEFAULT 1,
    unit_price    DECIMAL(10,2) NOT NULL,
    size          VARCHAR(20),
    color         VARCHAR(50),
    created_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ── Wishlist ──────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS wishlists (
    id         INTEGER  PRIMARY KEY AUTOINCREMENT,
    user_id    INTEGER  NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS wishlist_items (
    id           INTEGER  PRIMARY KEY AUTOINCREMENT,
    wishlist_id  INTEGER  NOT NULL REFERENCES wishlists(id) ON DELETE CASCADE,
    product_id   INTEGER  NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    added_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (wishlist_id, product_id)
);

-- ── Orders ───────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS orders (
    id               INTEGER       PRIMARY KEY AUTOINCREMENT,
    user_id          INTEGER       NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    invoice_number   VARCHAR(50)   UNIQUE,
    status           VARCHAR(20)   NOT NULL DEFAULT 'pending',
    total_amount     DECIMAL(10,2) NOT NULL,
    subtotal         DECIMAL(10,2),
    shipping_fee     DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    items            TEXT          NOT NULL,  -- JSON string
    shipping_address TEXT,                   -- JSON string
    payment_method   VARCHAR(50),
    payment_status   VARCHAR(20)   NOT NULL DEFAULT 'pending',
    notes            TEXT,
    created_at       DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at       DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS order_items (
    id            INTEGER       PRIMARY KEY AUTOINCREMENT,
    order_id      INTEGER       NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id    INTEGER       NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    product_name  VARCHAR(200)  NOT NULL,
    product_image VARCHAR(500),
    quantity      INTEGER       NOT NULL,
    unit_price    DECIMAL(10,2) NOT NULL,
    total_price   DECIMAL(10,2) NOT NULL,
    category_name VARCHAR(100)
);

CREATE TABLE IF NOT EXISTS invoices (
    id             INTEGER       PRIMARY KEY AUTOINCREMENT,
    invoice_number VARCHAR(50)   NOT NULL UNIQUE,
    order_id       INTEGER       NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    user_id        INTEGER       NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    subtotal       DECIMAL(10,2) NOT NULL,
    tax            DECIMAL(10,2) NOT NULL DEFAULT 0,
    shipping_fee   DECIMAL(10,2) NOT NULL DEFAULT 0,
    total          DECIMAL(10,2) NOT NULL,
    pdf_url        VARCHAR(500),
    created_at     DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ── Seed default roles ────────────────────────────────────────
INSERT OR IGNORE INTO roles (name, description) VALUES
    ('admin',    'Full system access — can manage products, users, and orders'),
    ('customer', 'Standard customer account — can browse, shop, and view orders');
