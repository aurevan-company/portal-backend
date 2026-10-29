-- Users: replace name with firstname/lastname, add phone/status/deleted/updated_user.
-- Email is the login identity and must be unique. Back up the database before applying.
-- Existing rows get firstname = old name, lastname = ''.
ALTER TABLE users ADD COLUMN IF NOT EXISTS firstname varchar(100) NOT NULL DEFAULT '';
ALTER TABLE users ADD COLUMN IF NOT EXISTS lastname varchar(100) NOT NULL DEFAULT '';
UPDATE users SET firstname = name WHERE firstname = '';
ALTER TABLE users ALTER COLUMN firstname DROP DEFAULT;
ALTER TABLE users ALTER COLUMN lastname DROP DEFAULT;
ALTER TABLE users DROP COLUMN IF EXISTS name;
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone varchar(20) NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS status varchar(20) NOT NULL DEFAULT 'ACTIVE';
ALTER TABLE users ADD COLUMN IF NOT EXISTS deleted boolean NOT NULL DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_user varchar(150) NULL;

ALTER TABLE users ADD CONSTRAINT chk_users_status
  CHECK (status IN ('ACTIVE', 'INACTIVE', 'SUSPENDED'));

-- No-op duplicate index if the column was already unique.
CREATE UNIQUE INDEX IF NOT EXISTS uq_users_email ON users (email);
