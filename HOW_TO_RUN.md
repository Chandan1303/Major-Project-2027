# Run the Sugarcane Yield Forecasting System

This repository runs a React/Vite frontend and a Python Flask API. The Flask API also loads the yield models from `models/` and creates a local SQLite database automatically when no database URL is configured.

## Prerequisites

- Node.js and npm
- Python 3.10 or newer
- The packages in `backend/requirements.txt`
- A MySQL server only if you choose MySQL instead of the default local SQLite database

## Install dependencies

From the repository root, install the frontend packages:

```powershell
cd frontend
npm ci
```

Install the Flask backend packages in a virtual environment:

```powershell
cd ..
py -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r backend\requirements.txt
```

If `py` is unavailable, use the installed Python executable in its place. `ml_service/requirements.txt` is for the separate legacy ML microservice and is not required by `run_backend.py`.

## Configure the application

Copy `.env.example` to `.env` at the repository root and set a strong `JWT_SECRET`. The backend reads this root `.env` file. SQLite is used by default at `backend/sugar_yield.db`. To use MySQL, set `DATABASE_URL`, for example:

```text
DATABASE_URL=mysql+pymysql://user:password@localhost:3306/sugar_yield?charset=utf8mb4
```

Set `FRONTEND_URL=http://localhost:5173` when running locally. Email and weather integrations need their respective credentials; core local startup does not require them.

## Start the API

From the repository root with the virtual environment active:

```powershell
python run_backend.py
```

The API listens on `http://127.0.0.1:5000`. Verify it at `http://127.0.0.1:5000/api/health`.

## Start the frontend

In a second terminal:

```powershell
cd frontend
npm run dev
```

Open `http://localhost:5173`. Vite proxies `/api` requests to the Flask API; keep the API running while using the app.

## Build and checks

```powershell
cd frontend
npm run build
cd ..
python -m unittest discover -s backend/tests -v
```

The repository also contains root-level data and ML scripts; those are separate workflows and are not needed to start the web application.
