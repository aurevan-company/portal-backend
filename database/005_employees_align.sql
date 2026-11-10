-- Aligns employees with organizations: BIGINT identity ids, audit columns,
-- firstname/lastname, hire dates and a fixed set of positions.
-- Apply once, after 004. Back up the database before applying.
-- Existing rows: `name` is split on the first space (lastname falls back to
-- firstname when there is no space), created_by is copied from the owning
-- organization, and any position outside the enum becomes 'OTHER'.
BEGIN;

-- id: serial -> BIGINT GENERATED ALWAYS AS IDENTITY
ALTER TABLE employees ALTER COLUMN id DROP DEFAULT;
DROP SEQUENCE IF EXISTS employees_id_seq;
ALTER TABLE employees ALTER COLUMN id TYPE BIGINT;
DO $$
DECLARE next_id BIGINT;
BEGIN
  SELECT COALESCE(MAX(id), 0) + 1 INTO next_id FROM employees;
  EXECUTE format(
    'ALTER TABLE employees ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (START WITH %s)',
    next_id
  );
END $$;

ALTER TABLE employees ALTER COLUMN organization_id TYPE BIGINT;
ALTER TABLE employees ALTER COLUMN branch_id TYPE BIGINT;
ALTER TABLE employees ALTER COLUMN branch_id DROP NOT NULL;

-- name -> firstname / lastname
ALTER TABLE employees ADD COLUMN firstname VARCHAR(100);
ALTER TABLE employees ADD COLUMN lastname VARCHAR(100);
UPDATE employees
SET firstname = LEFT(split_part(trim(name), ' ', 1), 100),
    lastname = LEFT(
      COALESCE(
        NULLIF(trim(substr(trim(name), length(split_part(trim(name), ' ', 1)) + 1)), ''),
        split_part(trim(name), ' ', 1)
      ),
      100
    );
ALTER TABLE employees ALTER COLUMN firstname SET NOT NULL;
ALTER TABLE employees ALTER COLUMN lastname SET NOT NULL;
ALTER TABLE employees DROP COLUMN name;

ALTER TABLE employees ALTER COLUMN phone TYPE VARCHAR(30);

-- position: fixed set of values
UPDATE employees
SET position = CASE
  WHEN upper(position) IN ('MANAGER', 'SUPERVISOR', 'CASHIER', 'WASHER', 'DETAILER')
    THEN upper(position)
  ELSE 'OTHER'
END
WHERE position IS NOT NULL;
ALTER TABLE employees ADD CONSTRAINT chk_employees_position
  CHECK (position IS NULL
    OR position IN ('MANAGER', 'SUPERVISOR', 'CASHIER', 'WASHER', 'DETAILER', 'OTHER'));

-- hire dates
ALTER TABLE employees ADD COLUMN hired_at DATE NULL;
ALTER TABLE employees ADD COLUMN terminated_at DATE NULL;
ALTER TABLE employees ADD CONSTRAINT chk_employees_dates
  CHECK (terminated_at IS NULL OR hired_at IS NULL OR terminated_at >= hired_at);

-- audit columns
ALTER TABLE employees ADD COLUMN created_by BIGINT;
ALTER TABLE employees ADD COLUMN updated_by BIGINT NULL;
UPDATE employees e
SET created_by = o.created_by
FROM organizations o
WHERE o.id = e.organization_id;
ALTER TABLE employees ALTER COLUMN created_by SET NOT NULL;
ALTER TABLE employees ADD CONSTRAINT fk_employees_created_by
  FOREIGN KEY (created_by) REFERENCES users(id);
ALTER TABLE employees ADD CONSTRAINT fk_employees_updated_by
  FOREIGN KEY (updated_by) REFERENCES users(id);

COMMIT;
