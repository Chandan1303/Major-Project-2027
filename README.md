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
- Python Flask REST API
- SQLAlchemy with SQLite by default and optional MySQL support
- JWT authentication
- Bcrypt for password hashing
- Flask-CORS and Flask-Limiter
- Python ML inference with scikit-learn and XGBoost

## Configure and install (Windows PowerShell)

```powershell
Copy-Item .env.example .env
py -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r backend\requirements.txt
cd frontend
npm ci
```

Set a strong `JWT_SECRET` in the root `.env`. The Flask API uses a local SQLite database at `backend/sugar_yield.db` when `DATABASE_URL` is unset. To use MySQL, set `DATABASE_URL` to a `mysql+pymysql://` URL. Configure email and weather credentials only when using those integrations.

## Run

Start the Flask API from the repository root:

```powershell
python run_backend.py
```

In another PowerShell window, start the frontend:

```powershell
cd frontend
npm run dev
```

Open `http://localhost:5173`. The API health check is `http://127.0.0.1:5000/api/health`. Flask SQLAlchemy creates application tables at startup. See [HOW_TO_RUN.md](HOW_TO_RUN.md) for the detailed setup and checks.

## Farm and Field Database

For a new MySQL database, initialize the schema with `python database/setup_db.py` after configuring `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, and `DB_NAME` in the environment. Farm coordinates and field boundaries are optional; missing field soil measurements and planting dates remain `NULL` rather than being synthesized.

For an existing MySQL database, apply `backend/farm-field-nullable-measurements-migration.sql` once in MySQL Workbench with the farm application's database selected. It changes only the nullability of `fields.soil_ph`, `fields.soil_moisture`, and `fields.planting_date`, preserving existing records. `database/schema.sql` contains the matching nullable definitions for fresh installs.

Set `JWT_SECRET` in the repository-root `.env`. `DATABASE_URL` is optional; omit it to use the local SQLite database, or set it to a SQLAlchemy MySQL URL such as `mysql+pymysql://user:password@localhost:3306/sugar_yield?charset=utf8mb4`. `OPENWEATHER_API_KEY` enables OpenWeather data; without it, weather is labeled as a local demo baseline and has no observation time. SMTP variables are needed for email verification and password reset. `BHUVAN_API_KEY` is optional and only used by Bhuvan integrations.

On Windows PowerShell, run the backend from the repository root with `python run_backend.py`. In a second window, run `Set-Location frontend; npm run dev`. Verify the frontend bundle with `Set-Location frontend; npm run build`; run backend tests with `python -m pytest backend/tests -q` using an isolated test database URL.

## API Endpoints

- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user
- `GET /api/auth/verify-email/<token>` - Verify a new account
- `POST /api/auth/resend-verification` - Resend an account verification link
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password with token

All successful requests use `{ success, message, data }`; errors use `{ success: false, message }`. Auth is held only in an HTTP-only cookie—never local storage.

Public registration creates standard user accounts only. New accounts must be verified by email before login; password reset and verification messages require the SMTP settings in the repository-root `.env`. Passwords must be at least 10 characters and include a lowercase letter, uppercase letter, and number. Admin accounts must be provisioned through a trusted administrative process; the public signup form cannot create them. Admin and officer API routes enforce their required roles on the backend, independently of frontend route restrictions.

## Security Features

- HTTP-only JWT cookies
- Password hashing with bcrypt
- Secure password reset tokens
- CORS configuration
- Rate limiting
- Helmet security headers

## Project Structure

```
SugarYieldAI-Project/
├── backend/           # Flask API and SQLAlchemy models
├── ml/                # Prediction and agricultural intelligence
├── models/            # Trained model artifacts and metadata
├── frontend/          # React/Vite interface
├── run_backend.py     # Flask API entry point
└── README.md

```

## License

This project is for educational purposes as part of Major Project 2027.

## Institution

NIE · Agricultural Decision Support System 2024
