-- Switch to your database
USE majorlogin;

-- Show all tables
SHOW TABLES;

-- Show table structure
DESCRIBE users;

-- View all user data
SELECT 
    id,
    name,
    email,
    CONCAT(LEFT(password_hash, 15), '...') AS password_preview,
    created_at,
    updated_at
FROM users
ORDER BY created_at DESC;
