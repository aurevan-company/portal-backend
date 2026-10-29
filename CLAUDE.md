# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run start:dev      # nest start --watch
npm run build          # nest build — run after changes to catch type/import errors
npm run lint           # oxlint --type-aware (not ESLint)
npm run format         # prettier --write
```

Setup: copy `.env.example` to `.env`. Requires PostgreSQL. Note `config/database.module.ts` reads `DATABASE_URL` (not the `DB_*` vars in `.env.example`).

Testing: do not write unit tests. Verify changes with `npm run build`, then run `start:dev` and hit the endpoint (curl / `.http` file).

## Structure

NestJS 12, ESM (`"type": "module"`), TypeORM + PostgreSQL. **Local imports need the `.js` extension.**

```
src/
  modules/<name>/     one flat folder per feature: users, roles, permissions, auth
    <name>.controller.ts / .service.ts / .module.ts / .entity.ts
    dto/
  common/             shared code: guards, decorators, filters, interceptors, response, pagination, storage
  config/             env validation, database module
docs/                 AUTH_USAGE.md (endpoints & auth flow)
database/             hand-written SQL schema changes (synchronize: false)
```

## Adding a new API

Copy the `users` module as the template:
1. Create `src/modules/<name>/` with `<name>.entity.ts`, `dto/`, `<name>.service.ts`, `<name>.controller.ts`, `<name>.module.ts`.
2. Add the module to `imports` in `src/app.module.ts`.
3. Add the table as the next numbered SQL file in `database/` (TypeORM never syncs the schema).
4. Protect routes with `@UseGuards(JwtAuthGuard, PermissionsGuard)` + `@RequirePermissions('<name>.read')` (AND semantics; permissions are declared server-side).

Keep it flat: controller → service → TypeORM repository. No domain/mapper/repository layers.

## Conventions

- **snake_case everywhere data crosses a boundary**: DB tables/columns, JSON request/response fields, query params, and the entity/DTO property names that produce them (`owner_id`, `logo_url`, `created_at`, `updated_user`, `permission_ids`, `access_token`, pagination `total_pages`). Do not use camelCase for these; entity properties are snake_case too so responses serialize as-is. Local variables, functions, and classes stay camelCase/PascalCase.
- Global prefix `api`; global `ValidationPipe` uses `whitelist` + `forbidNonWhitelisted`, so DTOs must declare every accepted field.
- `ResponseEnvelopeInterceptor` wraps every response and `HttpExceptionFilter` formats errors — controllers just return data / throw Nest exceptions.
- Auth: JWT access + rotating refresh tokens; one role per user, many permissions per role. Never add a public endpoint that assigns roles.
