-- Organizations table and its permissions. Back up the database before applying.
CREATE TABLE IF NOT EXISTS organizations (
  id serial PRIMARY KEY,
  name varchar(150) NOT NULL,
  owner_id integer NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  phone varchar(20) NOT NULL,
  email varchar(255) NULL,
  description text NULL,
  logo_url text NULL,
  status varchar(20) NOT NULL DEFAULT 'ACTIVE',
  deleted boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT chk_organizations_status
    CHECK (status IN ('ACTIVE', 'INACTIVE', 'SUSPENDED'))
);

CREATE INDEX IF NOT EXISTS idx_organizations_owner_id ON organizations (owner_id);

INSERT INTO permissions (code, name, description) VALUES
 ('organizations.read', 'Read organizations', 'List and view organizations'),
 ('organizations.create', 'Create organizations', 'Create organizations'),
 ('organizations.update', 'Update organizations', 'Update organizations'),
 ('organizations.delete', 'Delete organizations', 'Delete organizations')
ON CONFLICT (code) DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r CROSS JOIN permissions p
WHERE r.code = 'admin' AND p.code LIKE 'organizations.%'
ON CONFLICT DO NOTHING;
