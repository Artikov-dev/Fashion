# API Documentation

Base URL (development): `http://127.0.0.1:5000/api`

All protected endpoints require: `Authorization: Bearer <access_token>`

---

## Authentication `/api/auth`

| Method | Endpoint              | Auth | Description                  |
|--------|-----------------------|------|------------------------------|
| POST   | `/register`           | ❌   | Create new account           |
| POST   | `/login`              | ❌   | Login and receive tokens     |
| POST   | `/logout`             | ✅   | Invalidate current token     |
| POST   | `/refresh`            | 🔄   | Get new access token         |
| GET    | `/me`                 | ✅   | Get current user profile     |
| PUT    | `/me`                 | ✅   | Update profile               |
| PUT    | `/change-password`    | ✅   | Change password              |

### POST `/api/auth/register`
```json
Request:  { "email": "user@example.com", "password": "secret123", "name": "John Doe" }
Response: { "success": true, "data": { "user": {...}, "access_token": "...", "refresh_token": "..." } }
```

### POST `/api/auth/login`
```json
Request:  { "email": "user@example.com", "password": "secret123" }
Response: { "success": true, "data": { "user": {...}, "access_token": "...", "refresh_token": "..." } }
```

---

## Products `/api/products`

| Method | Endpoint                      | Auth     | Description              |
|--------|-------------------------------|----------|--------------------------|
| GET    | `/`                           | ❌       | List products (filterable)|
| GET    | `/<id>`                       | ❌       | Get single product        |
| POST   | `/`                           | 🔑 Admin | Create product            |
| PUT    | `/<id>`                       | 🔑 Admin | Update product            |
| DELETE | `/<id>`                       | 🔑 Admin | Delete product            |
| GET    | `/categories`                 | ❌       | List categories           |
| POST   | `/categories`                 | 🔑 Admin | Create category           |
| PUT    | `/categories/<id>`            | 🔑 Admin | Update category           |
| DELETE | `/categories/<id>`            | 🔑 Admin | Delete category           |

### GET `/api/products` — Query Parameters
| Param       | Type    | Description                        |
|-------------|---------|------------------------------------|
| search      | string  | Filter by name (ILIKE)             |
| category_id | integer | Filter by category                 |
| category    | string  | Filter by category name            |
| min_price   | float   | Minimum price                      |
| max_price   | float   | Maximum price                      |
| sort        | string  | `newest` `price_asc` `price_desc` `name` |
| page        | integer | Page number (requires per_page)    |
| per_page    | integer | Items per page                     |

---

## Cart `/api/cart`

| Method | Endpoint         | Auth | Description                   |
|--------|------------------|------|-------------------------------|
| GET    | `/`              | ✅   | Get user's cart               |
| POST   | `/add`           | ✅   | Add product to cart           |
| PUT    | `/update`        | ✅   | Update item quantity          |
| DELETE | `/remove/<id>`   | ✅   | Remove specific item          |
| DELETE | `/clear`         | ✅   | Remove all items              |
| GET    | `/count`         | ✅   | Get total item count          |
| POST   | `/checkout`      | ✅   | Place order from cart         |

### POST `/api/cart/add`
```json
Request: { "product_id": 1, "quantity": 2, "size": "M", "color": "Black" }
```

### POST `/api/cart/checkout`
```json
Request: {
  "shipping_address": { "name": "John", "address": "123 Main St", "city": "NYC", "zip": "10001" },
  "payment_method": "card",
  "phone_number": ""
}
```

---

## Wishlist `/api/wishlist`

| Method | Endpoint              | Auth | Description                    |
|--------|-----------------------|------|--------------------------------|
| GET    | `/`                   | ✅   | Get user's wishlist            |
| POST   | `/add`                | ✅   | Add product to wishlist        |
| DELETE | `/remove/<product_id>`| ✅   | Remove product from wishlist   |
| DELETE | `/clear`              | ✅   | Clear entire wishlist          |
| GET    | `/check/<product_id>` | ✅   | Check if product is in wishlist|

---

## Orders `/api/orders`

| Method | Endpoint       | Auth | Description                   |
|--------|----------------|------|-------------------------------|
| GET    | `/history`     | ✅   | User's order history          |
| GET    | `/my-orders`   | ✅   | Same (legacy alias)           |
| GET    | `/<id>`        | ✅   | Get specific order            |
| POST   | `/`            | ✅   | Create order directly         |

---

## Admin `/api/admin`

All admin endpoints require admin role (`🔑 Admin`).

### Users
| Method | Endpoint                    | Description           |
|--------|-----------------------------|-----------------------|
| GET    | `/users`                    | List all users        |
| GET    | `/users/<id>`               | Get single user       |
| PUT    | `/users/<id>`               | Update user           |
| DELETE | `/users/<id>`               | Delete user           |
| PUT    | `/users/<id>/roles`         | Update user roles     |

### Orders
| Method | Endpoint                        | Description           |
|--------|---------------------------------|-----------------------|
| GET    | `/orders`                       | All orders            |
| PUT    | `/orders/<id>/status`           | Update order status   |
| PATCH  | `/orders/<id>/status`           | Update order status   |

### Analytics
| Method | Endpoint                        | Description           |
|--------|---------------------------------|-----------------------|
| GET    | `/analytics/dashboard`          | Overall stats         |
| GET    | `/analytics/products`           | Product stats         |
| GET    | `/analytics/orders/revenue`     | Revenue trend         |
| GET    | `/analytics/orders/total`       | Orders trend          |
| GET    | `/analytics/orders/categories`  | Category breakdown    |

### Inventory
| Method | Endpoint               | Description           |
|--------|------------------------|-----------------------|
| GET    | `/inventory`           | Stock levels          |
| PATCH  | `/inventory/<id>`      | Update stock          |

---

## Response Format

All responses follow this structure:
```json
{
  "success": true | false,
  "message": "Human-readable message",
  "data": { ... } | [ ... ]
}
```

Error responses:
```json
{
  "success": false,
  "message": "What went wrong"
}
```

---

## HTTP Status Codes

| Code | Meaning                        |
|------|--------------------------------|
| 200  | OK                             |
| 201  | Created                        |
| 400  | Bad Request (validation error) |
| 401  | Unauthorized (no/bad token)    |
| 403  | Forbidden (insufficient role)  |
| 404  | Not Found                      |
| 409  | Conflict (duplicate)           |
| 422  | Unprocessable Entity           |
| 500  | Internal Server Error          |

---

## Swagger UI

Interactive API documentation available at: `http://127.0.0.1:5000/swagger/`
