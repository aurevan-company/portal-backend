-- Organizations table and its permissions. Back up the database before applying.
-- If an older version of this table (owner_id / UPPERCASE status) already exists,
-- drop or migrate it first: this schema is not compatible with the old one.
CREATE TABLE IF NOT EXISTS organizations (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

  owner_id BIGINT NOT NULL,
  parent_id BIGINT NULL,

  name VARCHAR(150) NOT NULL,
  logo_url TEXT NULL,
  description TEXT NULL,

  phone VARCHAR(30) NULL,
  email VARCHAR(255) NULL,

  address VARCHAR(500) NULL,
  latitude DECIMAL(10, 7) NULL,
  longitude DECIMAL(10, 7) NULL,
  google_place_id VARCHAR(255) NULL,

  facebook_url TEXT NULL,
  instagram_url TEXT NULL,

  working_hours JSONB NULL,

  status VARCHAR(30) NOT NULL DEFAULT 'pending',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  deleted BOOLEAN NOT NULL DEFAULT FALSE,

  created_by BIGINT NOT NULL,
  updated_by BIGINT NULL,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT fk_organizations_owner
    FOREIGN KEY (owner_id) REFERENCES users(id),

  CONSTRAINT fk_organizations_parent
    FOREIGN KEY (parent_id) REFERENCES organizations(id),

  CONSTRAINT fk_organizations_created_by
    FOREIGN KEY (created_by) REFERENCES users(id),

  CONSTRAINT fk_organizations_updated_by
    FOREIGN KEY (updated_by) REFERENCES users(id),

  CONSTRAINT chk_organizations_status
    CHECK (status IN ('pending', 'active', 'suspended')),

  CONSTRAINT chk_organizations_latitude
    CHECK (latitude IS NULL OR latitude BETWEEN -90 AND 90),

  CONSTRAINT chk_organizations_longitude
    CHECK (longitude IS NULL OR longitude BETWEEN -180 AND 180)
);

CREATE INDEX IF NOT EXISTS idx_organizations_owner_id
  ON organizations(owner_id);

CREATE INDEX IF NOT EXISTS idx_organizations_parent_id
  ON organizations(parent_id);

CREATE INDEX IF NOT EXISTS idx_organizations_location
  ON organizations(latitude, longitude);

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
