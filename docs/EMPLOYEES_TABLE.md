# Employees хүснэгт үүсгэх

`synchronize: false` тул TypeORM хүснэгт үүсгэдэггүй. Доорх query-г DB дээр гараар ажиллуулна.

## Урьдчилсан нөхцөл

- `users`, `roles`, `permissions`, `role_permissions` хүснэгтүүд байх (`database/001`, `002`).
- `organizations` хүснэгт байх (`database/003_organizations.sql`). `employees.organization_id` нь үүн рүү FK-тэй.

## Хэзээ ашиглах

| Нөхцөл | Хийх зүйл |
|---|---|
| `employees` хүснэгт DB дээр **огт байхгүй** | Доорх query-г нэг удаа ажиллуулна. `004`, `005` хэрэггүй. |
| `004_employees.sql`-ийг аль хэдийн ажиллуулсан | Доорхийг ажиллуулахгүй. Оронд нь `database/005_employees_align.sql`-ийг ажиллуулна. |

Энэ query нь `004` + `005`-ийн эцсийн үр дүнтэй тэнцүү. Хоёуланг нь давхар ажиллуулж болохгүй.

Доорх query-г DB client дээр хуулж ажиллуулна, эсвэл `psql "$DATABASE_URL"` дотор буулгана.

## Query

```sql
CREATE TABLE IF NOT EXISTS employees (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

  organization_id BIGINT NOT NULL,
  branch_id BIGINT NULL,

  firstname VARCHAR(100) NOT NULL,
  lastname VARCHAR(100) NOT NULL,
  phone VARCHAR(30) NOT NULL,
  email VARCHAR(255) NULL,

  position VARCHAR(100) NULL,

  hired_at DATE NULL,
  terminated_at DATE NULL,

  status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
  deleted BOOLEAN NOT NULL DEFAULT FALSE,

  created_by BIGINT NOT NULL,
  updated_by BIGINT NULL,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT fk_employees_organization
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE RESTRICT,

  CONSTRAINT fk_employees_created_by
    FOREIGN KEY (created_by) REFERENCES users(id),

  CONSTRAINT fk_employees_updated_by
    FOREIGN KEY (updated_by) REFERENCES users(id),

  CONSTRAINT chk_employees_status
    CHECK (status IN ('ACTIVE', 'INACTIVE', 'SUSPENDED')),

  CONSTRAINT chk_employees_position
    CHECK (position IS NULL
      OR position IN ('MANAGER', 'SUPERVISOR', 'CASHIER', 'WASHER', 'DETAILER', 'OTHER')),

  CONSTRAINT chk_employees_dates
    CHECK (terminated_at IS NULL OR hired_at IS NULL OR terminated_at >= hired_at)
);

CREATE INDEX IF NOT EXISTS idx_employees_organization_id
  ON employees(organization_id);

CREATE INDEX IF NOT EXISTS idx_employees_branch_id
  ON employees(branch_id);

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
```

## Тэмдэглэл

- **`branch_id`** нь одоохондоо FK-гүй, nullable. `branches` хүснэгт үүссэний дараа дараах FK-г нэмнэ:
  ```sql
  ALTER TABLE employees ADD CONSTRAINT fk_employees_branch
    FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE RESTRICT;
  ```
- **`status`** болон **`position`** нь дандаа ТОМ ҮСЭГ (`CLAUDE.md`-ийн Conventions). Утга нэмэх бол `src/modules/employees/employee-status.enum.ts` / `employee-position.enum.ts` болон дээрх `CHECK` constraint-ыг хамт засна.
- **Permission-ууд** (`employees.*`) нь `admin` role-д автоматаар олгогдоно. Бусад role-д `role_permissions`-аар гараар олгоно.
- **Хүснэгт байхгүй үед** endpoint дуудахад `relation "employees" does not exist` (PostgreSQL `42P01`) алдаа гарч, хэрэглэгчид 500 `INTERNAL_SERVER_ERROR` очно.
