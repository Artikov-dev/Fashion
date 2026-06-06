# Installation Guide

## Prerequisites

| Requirement  | Version  | Check command         |
|--------------|----------|-----------------------|
| Python       | 3.11+    | `python --version`    |
| Node.js      | 18+      | `node --version`      |
| npm          | 9+       | `npm --version`       |
| Git          | any      | `git --version`       |

---

## Quick Start (Development)

```bash
# 1. Clone the repository
git clone https://github.com/your-username/Fashion-Ecommerce-System.git
cd Fashion-Ecommerce-System
```

---

## Backend Setup

```bash
# Navigate to backend
cd backend

# Create and activate virtual environment
python -m venv venv

# macOS / Linux
source venv/bin/activate

# Windows
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment variables
cp .env.example .env
# Edit .env if needed (SQLite works out of the box — no changes required)

# Initialise the database and run migrations
flask db upgrade

# Seed the database with sample data
flask seed-db

# Start the development server
python app.py
# or
flask run
```

Backend will be available at: **http://127.0.0.1:5000**

Swagger API docs: **http://127.0.0.1:5000/swagger/**

---

## Frontend Setup

Open a **new terminal window**:

```bash
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env
# Default .env points to http://127.0.0.1:5000/api — no change needed

# Start the development server
npm run dev
```

Frontend will be available at: **http://localhost:5173**

---

## Default Credentials

| Role     | Email            | Password  |
|----------|------------------|-----------|
| Admin    | admin@shop.com   | admin123  |
| Customer | user@shop.com    | user123   |

---

## Production Deployment

### Backend (Render)

1. Create a new **Web Service** on render.com
2. Connect your GitHub repository
3. Set **Root Directory**: `backend`
4. Set **Build Command**: `pip install -r requirements.txt && flask db upgrade`
5. Set **Start Command**: `gunicorn wsgi:app`
6. Add environment variables:
   - `SECRET_KEY` (generate a secure random string)
   - `JWT_SECRET_KEY` (generate a secure random string)
   - `DATABASE_URL` (from Render PostgreSQL or Supabase)

### Frontend (Vercel)

1. Import project on vercel.com
2. Set **Root Directory**: `frontend`
3. Framework: **Vite**
4. Add environment variable:
   - `VITE_API_URL` = your Render backend URL + `/api`

---

## Environment Variables Reference

### Backend (`backend/.env`)
```
FLASK_ENV=development
FLASK_APP=app.py
SECRET_KEY=your-32+-char-secret
JWT_SECRET_KEY=your-32+-char-jwt-secret
DATABASE_URL=postgresql://...  (optional, SQLite used by default)
PORT=5000
```

### Frontend (`frontend/.env`)
```
VITE_API_URL=http://127.0.0.1:5000/api
```
