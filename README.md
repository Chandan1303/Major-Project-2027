# Atelier authentication

A JavaScript-only React + Express + MySQL authentication system. It uses HTTP-only JWT cookies, Sequelize, bcrypt, secure one-time password-reset tokens, Nodemailer, Helmet, CORS, and rate limiting.

## 1. Create the database

Open MySQL and run:

```sql
CREATE DATABASE atelier_auth CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

## 2. Configure and install (Windows PowerShell)

```powershell
Copy-Item backend\.env.example backend\.env
Copy-Item frontend\.env.example frontend\.env
npm run install:all
```

Set `DATABASE_URL`, `JWT_SECRET`, and valid SMTP values in `backend/.env`. For Gmail, use an app password, not your normal account password. `EMAIL_FROM` should be a verified sender. Google OAuth is intentionally not rendered until genuine OAuth credentials and server flow are added.

## 3. Run

In one PowerShell window:

```powershell
cd backend
npm run dev
```

In another:

```powershell
cd frontend
npm run dev
```

Open `http://localhost:5173`. Sequelize creates the `users` and `password_reset_tokens` tables on startup. For production, use managed migrations rather than `sequelize.sync()` and set `NODE_ENV=production`, a strong unique `JWT_SECRET`, HTTPS, and an appropriate `FRONTEND_URL`.

## API

`POST /api/auth/register`, `login`, `logout`, `forgot-password`, `reset-password`; `GET /api/auth/me`.

All successful requests use `{ success, message, data }`; errors use `{ success: false, message }`. Auth is held only in an HTTP-only cookie—never local storage.
