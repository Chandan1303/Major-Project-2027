-- Email Verification Migration Script
-- Run this script to add email verification fields to existing users table

USE majorlogin;

-- Add new columns for email verification
ALTER TABLE users
ADD COLUMN email_verified BOOLEAN NOT NULL DEFAULT FALSE AFTER password_hash,
ADD COLUMN verification_token VARCHAR(64) NULL AFTER email_verified,
ADD COLUMN verification_token_expires DATETIME NULL AFTER verification_token;

-- Mark all existing users as verified (since they registered before verification was required)
-- Comment out the line below if you want existing users to verify their emails
UPDATE users SET email_verified = TRUE WHERE email_verified = FALSE;

-- View updated table structure
DESCRIBE users;

-- View all users and their verification status
SELECT id, name, email, email_verified, created_at FROM users;

-- Optional: If you want to force existing users to verify, comment out the UPDATE above
-- and uncomment the lines below to send them verification emails manually

-- SELECT id, name, email 
-- FROM users 
-- WHERE email_verified = FALSE;
