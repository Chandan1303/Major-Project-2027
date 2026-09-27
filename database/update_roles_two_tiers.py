import os
import pymysql

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

# Update roles table
cur.execute("""
    UPDATE roles 
    SET name='user', display_name='User', 
        description='Standard platform user with farm monitoring, yield predictions, and agronomic telemetry' 
    WHERE id=1
""")
cur.execute("""
    UPDATE roles 
    SET name='admin', display_name='System Administrator', 
        description='Full system governance, user administration, ML pipeline monitoring, and platform configuration' 
    WHERE id=3
""")

# Update any users that were 'farmer' or 'officer' to 'user'
cur.execute("UPDATE users SET role='user', role_id=1 WHERE role IN ('farmer', 'officer')")
cur.execute("UPDATE users SET role='admin', role_id=3 WHERE email='admin@sugarcane.ai'")

cur.execute("SELECT id, name, email, role, role_id FROM users")
users = cur.fetchall()
print("Updated users:")
for u in users:
    print(f"  [{u['id']}] {u['name']} ({u['email']}) -> Role: {u['role']} (role_id: {u['role_id']})")

cur.execute("SELECT id, name, display_name FROM roles")
roles = cur.fetchall()
print("\nUpdated roles:")
for r in roles:
    print(f"  [{r['id']}] {r['name']}: {r['display_name']}")

cur.close()
conn.close()
print("\n[OK] Database roles updated successfully to two-tier: User and Admin!")
