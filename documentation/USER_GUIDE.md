# User Guide

## Getting Started

### Creating an Account
1. Visit the application and click **Sign In**
2. Switch to the **Register** tab
3. Enter your name, email, and a password (minimum 6 characters)
4. Click **Create Account**
5. You'll be redirected to the home page automatically

### Logging In
1. Enter your email and password on the Sign In tab
2. Click **Sign In**
3. Admins are redirected to the Admin Dashboard; customers to the Home page

---

## Shopping

### Browsing Products
- From the home page, click **Shop Collection** or **Products** in the navigation
- Products are displayed in a grid layout with image, name, category, and price
- Hover over a product card to reveal the **Add to Cart** button

### Filtering & Searching
Use the left sidebar filters:
- **Search** — type a product name and press → to search
- **Category** — click a category radio button to filter
- **Price Range** — enter Min/Max values and click Apply
- **Sort** — use the dropdown (Newest, Price Low-High, Price High-Low, Name A–Z)

### Viewing a Product
Click any product card to see the full detail page:
- Multiple size options (XS, S, M, L, XL, XXL)
- Quantity selector
- Stock availability indicator
- Related products at the bottom

---

## Cart

### Adding to Cart
- Click **Add to Cart** on any product card
- Or click a product, choose size/quantity, and click **Add to Cart**
- A toast notification confirms the item was added
- The cart icon in the navigation shows the total item count

### Managing Your Cart
Navigate to **Cart** from the navigation:
- **Increase/decrease quantity** using the + / − buttons
- **Remove an item** using the × button
- **Clear all items** using the Clear Cart button
- Free shipping on orders over $100 is shown automatically

---

## Checkout

1. Go to your cart and click **Proceed to Checkout**
2. Fill in your shipping details:
   - Full Name, Email, Phone (optional)
   - Street Address, City, ZIP Code
3. Choose a payment method:
   - **Credit/Debit Card** — simulated (no real charge)
   - **Cash on Delivery**
   - **M-Pesa Mobile** (enter phone number)
4. Click **Place Order**
5. You'll be redirected to the order confirmation page

---

## Order History

1. Click **Orders** in the navigation
2. Your orders are listed most-recent first
3. Click any order to expand and see:
   - All items purchased with quantities and prices
   - Order status (Pending, Processing, Shipped, Delivered, Cancelled)
   - Shipping address

---

## Account

Your profile can be updated — if this feature is available in your deployment:
- Use the `/api/auth/me` endpoint (PUT) to update name/phone/email
- Use `/api/auth/change-password` to change your password

---

## Tips

- Products with **Low Stock** or **Sold Out** badges have limited or no availability
- New products display a **New** badge for the first 14 days after creation
- The navigation cart badge updates in real time as you add items
- You stay logged in after refreshing — tokens are stored in localStorage and automatically refreshed
