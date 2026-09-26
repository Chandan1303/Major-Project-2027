"""
Database Setup and Migration Script for Major Project 2027
Executes schema.sql and seed_data.sql into MySQL 'majorlogin' database,
and ensures existing tables are gracefully upgraded without data loss.
"""

import os
import sys
from pathlib import Path

# Ensure UTF-8 output on Windows consoles
if sys.stdout.encoding and sys.stdout.encoding.lower() != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

import pymysql

# MySQL Configuration
DB_HOST = os.environ.get("DB_HOST", "localhost")
DB_USER = os.environ.get("DB_USER", "root")
DB_PASSWORD = os.environ.get("DB_PASSWORD", "212006")
DB_PORT = int(os.environ.get("DB_PORT", 3306))
DB_NAME = os.environ.get("DB_NAME", "majorlogin")

ROOT_DIR = Path(__file__).resolve().parent.parent
DATABASE_DIR = ROOT_DIR / "database"

def execute_sql_file(cursor, file_path):
    print(f"📖 Reading {file_path.name}...")
    with open(file_path, "r", encoding="utf-8") as f:
        sql_content = f.read()

    # Split by semicolon statements, avoiding comments and empty statements
    statements = []
    current_stmt = []
    for line in sql_content.splitlines():
        trimmed = line.strip()
        if not trimmed or trimmed.startswith("--") or trimmed.startswith("/*"):
            continue
        current_stmt.append(line)
        if trimmed.endswith(";"):
            statements.append("\n".join(current_stmt))
            current_stmt = []

    print(f"⚙️  Executing {len(statements)} statements from {file_path.name}...")
    for idx, stmt in enumerate(statements, 1):
        try:
            cursor.execute(stmt)
        except Exception as e:
            # If table already exists or column exists, log and proceed gracefully
            if "already exists" in str(e).lower() or "duplicate column" in str(e).lower():
                continue
            print(f"⚠️ Statement {idx} note: {e}")

def upgrade_existing_tables(cursor):
    """Ensure older tables receive new required columns (e.g. address on farms)"""
    print("🔄 Checking and upgrading existing table columns...")
    
    # Check address column on farms
    cursor.execute("""
        SELECT COUNT(*) FROM information_schema.COLUMNS 
        WHERE TABLE_SCHEMA = %s AND TABLE_NAME = 'farms' AND COLUMN_NAME = 'address';
    """, (DB_NAME,))
    if cursor.fetchone()[0] == 0:
        print("➕ Adding 'address' column to 'farms' table...")
        cursor.execute("ALTER TABLE `farms` ADD COLUMN `address` VARCHAR(255) NULL AFTER `location`;")
    
    # Check status column on users
    cursor.execute("""
        SELECT COUNT(*) FROM information_schema.COLUMNS 
        WHERE TABLE_SCHEMA = %s AND TABLE_NAME = 'users' AND COLUMN_NAME = 'status';
    """, (DB_NAME,))
    if cursor.fetchone()[0] == 0:
        print("➕ Adding 'status' column to 'users' table...")
        cursor.execute("ALTER TABLE `users` ADD COLUMN `status` ENUM('active','inactive','suspended') NOT NULL DEFAULT 'active';")

    # Check variety_id on fields
    cursor.execute("""
        SELECT COUNT(*) FROM information_schema.COLUMNS 
        WHERE TABLE_SCHEMA = %s AND TABLE_NAME = 'fields' AND COLUMN_NAME = 'variety_id';
    """, (DB_NAME,))
    if cursor.fetchone()[0] == 0:
        print("➕ Adding 'variety_id' column to 'fields' table...")
        cursor.execute("ALTER TABLE `fields` ADD COLUMN `variety_id` INT UNSIGNED NULL AFTER `sugarcane_variety`;")

    try:
        cursor.execute("ALTER TABLE `sugarcane_varieties` MODIFY COLUMN `disease_resistance` TEXT NOT NULL;")
    except Exception as e:
        pass

def main():
    print("=================================================================")
    print("🌾 Sugarcane Yield Decision Support System — Database Setup")
    print("=================================================================")
    
    try:
        # First connect without db to ensure database exists
        conn = pymysql.connect(
            host=DB_HOST,
            user=DB_USER,
            password=DB_PASSWORD,
            port=DB_PORT,
            autocommit=True
        )
        cur = conn.cursor()
        cur.execute(f"CREATE DATABASE IF NOT EXISTS `{DB_NAME}` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;")
        conn.select_db(DB_NAME)

        # Run schema
        schema_file = DATABASE_DIR / "schema.sql"
        if schema_file.exists():
            execute_sql_file(cur, schema_file)

        # Upgrade existing tables
        upgrade_existing_tables(cur)

        # Run seed data
        seed_file = DATABASE_DIR / "seed_data.sql"
        if seed_file.exists():
            execute_sql_file(cur, seed_file)

        # Show final tables
        cur.execute("SHOW TABLES;")
        tables = [r[0] for r in cur.fetchall()]
        print("\n✅ Database setup complete! Active tables in database:")
        for t in sorted(tables):
            cur.execute(f"SELECT COUNT(*) FROM `{t}`;")
            cnt = cur.fetchone()[0]
            print(f"   • {t:<22} ({cnt} rows)")

        cur.close()
        conn.close()
        print("\n🎉 Database initialization finished successfully!\n")
    except Exception as e:
        print(f"\n❌ Database setup error: {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()
