import os
import sys
import bcrypt
import pymysql
from datetime import datetime

DB_HOST = os.environ.get("DB_HOST", "localhost")
DB_USER = os.environ.get("DB_USER", "root")
DB_PASSWORD = os.environ.get("DB_PASSWORD", "212006")
DB_PORT = int(os.environ.get("DB_PORT", 3306))
DB_NAME = os.environ.get("DB_NAME", "majorlogin")

conn = pymysql.connect(
    host=DB_HOST,
    user=DB_USER,
    password=DB_PASSWORD,
    port=DB_PORT,
    database=DB_NAME,
    autocommit=True,
    cursorclass=pymysql.cursors.DictCursor
)

cur = conn.cursor()

# Ensure default current timestamp on users table
try:
    cur.execute("ALTER TABLE `users` MODIFY COLUMN `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP;")
    cur.execute("ALTER TABLE `users` MODIFY COLUMN `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;")
except Exception as e:
    print("Column alter note:", e)

# Hash standard demo password
pw_hash = bcrypt.hashpw("password123".encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
now = datetime.utcnow()

demo_users = [
    {
        "email": "farmer@sugarcane.ai",
        "name": "Ramesh Patil (Farmer)",
        "role": "farmer",
        "role_id": 1,
        "phone": "+91 98220 12345",
        "location": "Kolhapur, Maharashtra"
    },
    {
        "email": "officer@sugarcane.ai",
        "name": "Dr. Sunita Deshmukh (Agronomy Officer)",
        "role": "officer",
        "role_id": 2,
        "phone": "+91 98220 54321",
        "location": "Regional Agriculture Office, Pune"
    },
    {
        "email": "admin@sugarcane.ai",
        "name": "Platform Administrator",
        "role": "admin",
        "role_id": 3,
        "phone": "+91 98220 99999",
        "location": "Central Directorate, Mumbai"
    },
    {
        "email": "testfarmer@agritech.org",
        "name": "Chandan Farmer",
        "role": "farmer",
        "role_id": 1,
        "phone": "+91 98220 77777",
        "location": "Belagavi, Karnataka"
    }
]

created_ids = {}

for u in demo_users:
    cur.execute("SELECT id FROM users WHERE email = %s", (u["email"],))
    row = cur.fetchone()
    if row:
        user_id = row["id"]
        cur.execute("""
            UPDATE users 
            SET name = %s, password_hash = %s, role = %s, role_id = %s, 
                phone = %s, location = %s, email_verified = 1, status = 'active', updated_at = %s
            WHERE id = %s
        """, (u["name"], pw_hash, u["role"], u["role_id"], u["phone"], u["location"], now, user_id))
        print(f"Updated user: {u['email']} (ID: {user_id})")
    else:
        cur.execute("""
            INSERT INTO users (name, email, password_hash, role, role_id, phone, location, email_verified, status, created_at, updated_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s, 1, 'active', %s, %s)
        """, (u["name"], u["email"], pw_hash, u["role"], u["role_id"], u["phone"], u["location"], now, now))
        user_id = cur.lastrowid
        print(f"Created user: {u['email']} (ID: {user_id})")
    created_ids[u["email"]] = user_id

farmer_id = created_ids["farmer@sugarcane.ai"]

# Associate farms with farmer_id so farmer dashboard immediately displays all farms & fields
cur.execute("UPDATE farms SET user_id = %s", (farmer_id,))
cur.execute("UPDATE predictions SET user_id = %s", (farmer_id,))
cur.execute("UPDATE yield_predictions SET user_id = %s", (farmer_id,))
cur.execute("UPDATE prediction_history SET user_id = %s", (farmer_id,))
cur.execute("UPDATE alerts SET user_id = %s", (farmer_id,))
cur.execute("UPDATE reports SET user_id = %s", (farmer_id,))
cur.execute("UPDATE recommendations SET user_id = %s", (farmer_id,))

print("[OK] Successfully linked demo farms, fields, predictions, alerts, reports to farmer@sugarcane.ai!")
cur.close()
conn.close()
