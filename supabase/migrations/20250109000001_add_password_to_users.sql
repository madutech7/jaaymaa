-- Migration: Add password_hash column to users table
-- Date: 2025-01-09
-- Description: Add support for password-based authentication

-- Add password_hash column to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS password_hash TEXT;

-- Add index for better performance on email lookups (if not exists)
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Add comment to explain the column
COMMENT ON COLUMN users.password_hash IS 'Hashed password using bcrypt (nullable for OAuth users)';

