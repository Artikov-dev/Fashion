# Admin Guide

## Accessing the Admin Dashboard

1. Log in with an admin account:
   - Email: `admin@shop.com`
   - Password: `admin123`
2. You'll be automatically redirected to `/admin`
3. The left sidebar provides navigation between sections

---

## Dashboard Overview

The **Dashboard** section shows:
- **Total Products** — count of all products in the catalog
- **Total Orders** — all orders placed
- **Total Users** — registered accounts
- **Revenue** — total revenue from non-cancelled orders
- **Recent Orders** table — last 8 orders with status and amount

---

## Product Management

### Adding a Product
1. Click **Products** in the sidebar
2. Click **+ Add Product**
3. Fill in the form:
   - **Name** (required) — product title
   - **Price** (required) — decimal number (e.g., 49.99)
   - **Stock** — available quantity (defaults to 0)
   - **Category** — select from dropdown
   - **Image URL** — paste an image URL (Unsplash, etc.)
   - **Description** — optional product description
4. Click **Create Product**

### Editing a Product
1. Find the product in the Products table
2. Click **Edit** in the Actions column
3. The form pre-fills with current values
4. Make changes and click **Update Product**

### Deleting a Product
1. Find the product in the Products table
2. Click **Delete**
3. Confirm the deletion in the dialog
4. The product is removed and stock is cleared

> **Note:** Products referenced by existing orders are preserved in order records even after deletion (stored as JSON in the order).

---

## Order Management

### Viewing Orders
1. Click **Orders** in the sidebar
2. All orders are listed with: Invoice number, Customer, Items count, Total, Payment status, Order status, Date

### Updating Order Status
Each order row has a **status dropdown** at the right:
- **Pending** — newly placed, not yet processed
- **Processing** — payment confirmed, being prepared
- **Shipped** — dispatched to customer
- **Delivered** — received by customer
- **Cancelled** — order cancelled

Select the new status — it updates immediately via the API.

---

## User Management

### Viewing Users
1. Click **Users** in the sidebar
2. All registered users are listed with: ID, Name, Email, Role, Joined date, Status

### Understanding User Status
- **Active** (green) — user can log in and shop
- **Inactive** (red) — account is deactivated

### Updating Users via API
Use the admin API endpoints:
```bash
# Update user role
PUT /api/admin/users/{id}
{ "role": "admin" }

# Deactivate user
PUT /api/admin/users/{id}
{ "is_active": false }
```

---

## Analytics

The analytics section provides insights into business performance:

| Endpoint                            | Data                             |
|-------------------------------------|----------------------------------|
| `/api/admin/analytics/dashboard`    | Overview stats (users, revenue)  |
| `/api/admin/analytics/products`     | Stock levels, categories         |
| `/api/admin/analytics/orders/revenue`| Revenue trend (30 days)         |
| `/api/admin/analytics/orders/total` | Orders trend (30 days)           |
| `/api/admin/analytics/orders/categories` | Revenue by category          |

---

## Inventory Management

Check product stock levels via API:
```bash
GET /api/admin/inventory?stock=low    # products with 1–5 units
GET /api/admin/inventory?stock=out    # sold out products
GET /api/admin/inventory?stock=normal # well-stocked

# Update stock
PATCH /api/admin/inventory/{product_id}
{ "stock": 25 }
```

---

## Creating Additional Admin Users

Via the API (must be authenticated as admin):
```bash
# 1. Register normally
POST /api/auth/register
{ "email": "newadmin@shop.com", "password": "secure123" }

# 2. Promote to admin
PUT /api/admin/users/{id}
{ "role": "admin" }
```

---

## Security Notes

- Always use strong passwords in production
- Rotate `SECRET_KEY` and `JWT_SECRET_KEY` periodically
- Tokens expire after 1 hour — users are automatically re-authenticated via refresh tokens
- All admin routes require a valid JWT **and** the admin role — there is no bypass
