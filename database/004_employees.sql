-- Employees table and its permissions. Back up the database before applying.
-- There is no branches table yet, so branch_id is a plain integer for now.
-- The foreign key to branches(id) is added below only if that table exists;
-- re-run the DO block (or add the constraint by hand) once branches is created.
CREATE TABLE IF NOT EXISTS employees (
  id serial PRIMARY KEY,
  organization_id integer NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  branch_id integer NOT NULL,
  name varchar(150) NOT NULL,
  phone varchar(20) NOT NULL,
  email varchar(255) NULL,
  position varchar(100) NULL,
  status varchar(20) NOT NULL DEFAULT 'ACTIVE',
  deleted boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT chk_employees_status
    CHECK (status IN ('ACTIVE', 'INACTIVE', 'SUSPENDED'))
);

CREATE INDEX IF NOT EXISTS idx_employees_organization_id ON employees (organization_id);
CREATE INDEX IF NOT EXISTS idx_employees_branch_id ON employees (branch_id);

DO $$
BEGIN
  IF to_regclass('branches') IS NOT NULL
     AND NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_employees_branch') THEN
    ALTER TABLE employees ADD CONSTRAINT fk_employees_branch
      FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE RESTRICT;
  END IF;
END $$;

INSERT INTO permissions (code, name, description) VALUES
 ('employees.read', 'Read employees', 'List and view employees'),
 ('employees.create', 'Create employees', 'Create employees'),
 ('employees.update', 'Update employees', 'Update employees'),
 ('employees.delete', 'Delete employees', 'Delete employees')
ON CONFLICT (code) DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r CROSS JOIN permissions p
WHERE r.code = 'admin' AND p.code LIKE 'employees.%'
ON CONFLICT DO NOTHING;
