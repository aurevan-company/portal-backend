-- PostgreSQL migration for role/permission relations and refresh tokens.
-- Back up the database before applying. Existing roles and permissions tables are preserved.
ALTER TABLE users ADD COLUMN IF NOT EXISTS role_id integer NULL;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_users_role') THEN
    ALTER TABLE users ADD CONSTRAINT fk_users_role
      FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS role_permissions (
  role_id integer NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id integer NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  CONSTRAINT pk_role_permissions PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE IF NOT EXISTS refresh_tokens (
  id serial PRIMARY KEY,
  "tokenHash" varchar(64) NOT NULL UNIQUE,
  "userId" integer NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  "expiresAt" timestamptz NOT NULL,
  "revokedAt" timestamptz NULL,
  "createdAt" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens ("userId");

INSERT INTO permissions (code, name, description) VALUES
 ('users.read', 'Read users', 'List and view users'),
 ('users.create', 'Create users', 'Create users and assign a role'),
 ('users.update', 'Update users', 'Update users'),
 ('users.delete', 'Delete users', 'Delete users'),
 ('roles.read', 'Read roles', 'List and view roles'),
 ('roles.create', 'Create roles', 'Create roles'),
 ('roles.update', 'Update roles', 'Update roles'),
 ('roles.delete', 'Delete roles', 'Delete roles'),
 ('permissions.read', 'Read permissions', 'List and view permissions'),
 ('permissions.create', 'Create permissions', 'Create permissions'),
 ('permissions.update', 'Update permissions', 'Update permissions'),
 ('permissions.delete', 'Delete permissions', 'Delete permissions')
ON CONFLICT (code) DO NOTHING;

INSERT INTO roles (code, name, description)
VALUES ('admin', 'Administrator', 'Full access to the API')
ON CONFLICT (code) DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r CROSS JOIN permissions p
WHERE r.code = 'admin'
ON CONFLICT DO NOTHING;
