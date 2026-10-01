# How to Run the Application

## Prerequisites
- Node.js installed
- Python 3 installed
- MySQL database running
- Backend Python dependencies installed

---

## 🚀 Quick Start

### **Terminal 1: Flask Backend (Port 5000)**

```bash
# From the project root, install Python dependencies once
python -m pip install -r backend/requirements.txt

# Start the API; it loads backend/.env and creates missing tables
python run_backend.py
```

**Expected Output:**
```
 * Running on http://127.0.0.1:5000
```

---

### **Terminal 2: Frontend (Port 5173)**

```bash
# Install dependencies (first time only)
npm install --prefix frontend

# Start the development server
npm run dev --prefix frontend
```

**Expected Output:**
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

---

## 📍 Access the Application

1. **Open Browser:** http://localhost:5173
2. **Create Account:** Click "Sign up"
3. **Verify Email:** Open the link sent to the configured email inbox
4. **Login:** Use your credentials
5. **Start Predicting:** Click "Predict Yield"

---

## 🔧 Troubleshooting

### Backend Won't Start

**Error: "Cannot find module"**
```bash
python -m pip install -r backend/requirements.txt
```

**Error: "Database connection failed"**
- Check MySQL is running
- Verify `DATABASE_URL` in `backend/.env`:
  ```
  DATABASE_URL=mysql://root:YOUR_PASSWORD@localhost:3306/majorlogin
  ```
- Create database if needed:
  ```sql
  CREATE DATABASE majorlogin;
  ```

**Error: "Port 5000 already in use"**
```bash
# Windows - Kill process on port 5000
netstat -ano | findstr :5000
taskkill /PID <PID_NUMBER> /F

# Or change port in backend/.env
PORT=5001
```

---

### Frontend Won't Start

**Error: "Cannot find module"**
```bash
npm install --prefix frontend
```

**Error: "Port 5173 already in use"**
```bash
# Windows - Kill process on port 5173
netstat -ano | findstr :5173
taskkill /PID <PID_NUMBER> /F
```

**Error: "Failed to fetch" when logging in**
- Make sure backend is running on port 5000
- Check `frontend/.env`:
  ```
  VITE_API_URL=http://localhost:5000/api
  ```

---

## 📁 Project Structure

```
Major-project/
├── backend/           ← Flask API (Port 5000); Express source retained
│   ├── app.py
│   ├── models.py
│   ├── email_service.py
│   ├── src/
│   ├── .env          ← Backend config
│   └── package.json
│
├── frontend/          ← React UI (Port 5173)
│   ├── src/
│   ├── .env          ← Frontend config
│   └── package.json
│
└── models/            ← ML models (Python)
```

---

## 🗄️ Database Setup

### Create Database

```sql
-- Run in MySQL
CREATE DATABASE majorlogin;
USE majorlogin;
```

The Flask runner creates missing tables and adds missing auth columns to an existing `users` table at startup. Do not manually rerun the legacy email-verification migration after the application has started.

Tables created automatically on first run include:
- `users` - User accounts
- `password_reset_tokens` - Password reset

---

## 🔑 Environment Files

### Backend (.env)

```env
PORT=5000
NODE_ENV=development
DATABASE_URL=mysql://root:YOUR_PASSWORD@localhost:3306/majorlogin
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
FRONTEND_URL=http://localhost:5173

# Email (Gmail)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password

# Bhuvan API
BHUVAN_API_KEY=658fff2f1650d2356b977e9b6cd650601b5147d7
BHUVAN_BASE_URL=https://bhuvan-app1.nrsc.gov.in
```

### Frontend (.env)

```env
VITE_API_URL=http://localhost:5000/api
```

---

## ✅ Verify Everything Works

### 1. Backend Health Check
```bash
# Open in browser or use curl
curl http://localhost:5000/api/health

# Should see:
# {"status":"ok","database":"connected",...}
```

### 2. Frontend Check
- Open http://localhost:5173
- Should see login page
- No console errors

### 3. Full Flow Test
1. Sign up new account
2. Verify the email using the link in your inbox
3. Login
4. See dashboard
5. Click "Predict Yield"
6. Fill form and submit
7. See prediction results

---

## 🛑 Stop Servers

### Stop Backend
- Press `Ctrl + C` in backend terminal

### Stop Frontend
- Press `Ctrl + C` in frontend terminal

---

## 📝 Common Commands

### Backend
```bash
cd backend
npm install          # Install dependencies
npm run dev         # Development mode (auto-reload)
npm start           # Production mode
```

### Frontend
```bash
cd frontend
npm install          # Install dependencies
npm run dev         # Development mode
npm run build       # Build for production
npm run preview     # Preview production build
```

### Database
```bash
# Access MySQL
mysql -u root -p

# Show databases
SHOW DATABASES;

# Use database
USE majorlogin;

# Show tables
SHOW TABLES;

# View users
SELECT * FROM users;
```

---

## 🎯 Development Workflow

**Day-to-day development:**

1. **Open 2 terminals**

Terminal 1 (Backend):
```bash
cd c:\Users\chand\OneDrive\Desktop\Major-project\backend
npm run dev
```

Terminal 2 (Frontend):
```bash
cd c:\Users\chand\OneDrive\Desktop\Major-project\frontend
npm run dev
```

2. **Make changes** - Both auto-reload
3. **Test in browser** - http://localhost:5173
4. **Check API** - Backend logs in Terminal 1

---

## 🔥 Hot Tips

- **Backend changes:** Save file → Server auto-reloads
- **Frontend changes:** Save file → Page auto-reloads
- **Database changes:** Restart backend
- **Environment changes:** Restart both servers

---

## 📞 Need Help?

**Backend not responding?**
- Check if MySQL is running
- Check credentials in `.env`
- Look for errors in terminal

**Frontend not loading?**
- Check if backend is running first
- Clear browser cache
- Check browser console for errors

**Database errors?**
- Check MySQL service is running
- Verify database exists
- Check user permissions

---

## ✨ You're All Set!

Both servers running? You should see:

✅ Backend: http://localhost:5000 (API running)
✅ Frontend: http://localhost:5173 (UI loaded)
✅ Database: Connected to majorlogin

Happy coding! 🚀
