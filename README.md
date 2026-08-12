# Major Project 2027 - Sugarcane Yield Forecasting System

An AI-powered agricultural decision support system for sugarcane yield prediction using Machine Learning, satellite NDVI data, climate analysis, and soil characteristics.

## Features

- **AI-Powered Predictions**: XGBoost and Random Forest models for accurate yield forecasting
- **Satellite Integration**: Real-time NDVI data analysis from satellite imagery
- **Climate Analysis**: Weather pattern analysis for better predictions
- **User Authentication**: Secure JWT-based authentication with HTTP-only cookies
- **Password Reset**: Secure one-time password reset tokens
- **Responsive Design**: Mobile-friendly interface

## Tech Stack

### Frontend
- React with React Router
- React Hook Form with Zod validation
- Axios for API calls
- Vite for build tooling

### Backend
- Express.js
- MySQL with Sequelize ORM
- JWT authentication
- Bcrypt for password hashing
- Nodemailer for email services
- Helmet and CORS for security
- Rate limiting

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

Set `DATABASE_URL`, `JWT_SECRET`, and valid SMTP values in `backend/.env`. For Gmail, use an app password, not your normal account password. `EMAIL_FROM` should be a verified sender.

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

## API Endpoints

- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password with token
- `GET /api/auth/me` - Get current user

All successful requests use `{ success, message, data }`; errors use `{ success: false, message }`. Auth is held only in an HTTP-only cookie—never local storage.

## Security Features

- HTTP-only JWT cookies
- Password hashing with bcrypt
- Secure password reset tokens
- CORS configuration
- Rate limiting
- Helmet security headers

## Project Structure

```
Major-project/
├── backend/           # Express.js backend
│   ├── src/
│   │   ├── config/    # Database configuration
│   │   ├── controllers/ # Route controllers
│   │   ├── middleware/ # Auth middleware
│   │   ├── models/    # Sequelize models
│   │   ├── routes/    # API routes
│   │   ├── services/  # Email service
│   │   └── utils/     # Utility functions
│   └── .env.example   # Environment variables template
├── frontend/          # React frontend
│   ├── src/
│   │   ├── assets/    # Images and static files
│   │   ├── components/ # Reusable components
│   │   ├── context/   # React context
│   │   ├── layouts/   # Page layouts
│   │   ├── pages/     # Page components
│   │   ├── routes/    # Route protection
│   │   └── services/  # API service
│   └── .env.example   # Environment variables template
└── README.md

```

## License

This project is for educational purposes as part of Major Project 2027.

## Institution

NIE · Agricultural Decision Support System 2024
