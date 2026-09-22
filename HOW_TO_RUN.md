# How to Run the Application

## Prerequisites
- Node.js installed
- MySQL database running
- Python installed (for ML models)

---

## 🚀 Quick Start

### **Terminal 1: Backend (Port 5000)**

```bash
# Navigate to backend folder
cd backend

# Install dependencies (first time only)
npm install

# Start the server
npm run dev
```

**Expected Output:**
```
Database connected successfully
API running on 5000
```

---

### **Terminal 2: Frontend (Port 5173)**

```bash
# Navigate to frontend folder
cd frontend

# Install dependencies (first time only)
npm install

# Start the development server
npm run dev
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
3. **Verify Email:** Check console (email in dev mode)
4. **Login:** Use your credentials
5. **Start Predicting:** Click "Predict Yield"

---

## 🔧 Troubleshooting

### Backend Won't Start

**Error: "Cannot find module"**
```bash
cd backend
npm install
```

**Error: "Database connection failed"**
- Check MySQL is running
- Verify credentials in `backend/.env`:
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
cd frontend
npm install
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
  VITE_API_URL=http://localhost:5000
  ```

---

## 📁 Project Structure

```
Major-project/
├── backend/           ← Node.js API (Port 5000)
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

### Run Migration (Optional - auto creates tables)

```bash
cd backend
mysql -u root -p majorlogin < database-migration.sql
```

Tables created automatically on first run:
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
VITE_API_URL=http://localhost:5000
```

---

## ✅ Verify Everything Works

### 1. Backend Health Check
```bash
# Open in browser or use curl
curl http://localhost:5000/api/auth/health

# Should see:
# {"success":true,"message":"API is running"}
```

### 2. Frontend Check
- Open http://localhost:5173
- Should see login page
- No console errors

### 3. Full Flow Test
1. Sign up new account
2. Check email verification (console logs in dev)
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
