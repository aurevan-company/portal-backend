# Auth / Bearer token usage

## 1. Environment
Copy `.env.example` to `.env` and set your database credentials plus two different long random JWT secrets. Never commit `.env` or share its values.

## 2. Database migration
The app uses `synchronize: false`, so TypeORM does not automatically update PostgreSQL. Back up your DB, confirm your current table names, then apply `database/001_auth_role_permissions.sql`, then `database/002_users_profile_soft_delete.sql`. This migration assumes the existing `users`, `roles`, and `permissions` tables already exist.

## 3. Login
`POST /api/auth/login`
```json
{ "email": "admin@example.com", "password": "your-password" }
```
The response contains `access_token`, `refresh_token`, `token_type`, `expires_in`, and the user's role/permissions.

## 4. Call protected APIs
Send only the access token in the Authorization header:
```http
GET /api/users
Authorization: Bearer <access_token>
```
Example:
```bash
curl http://localhost:3000/api/users -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## 5. Require multiple permissions
Permissions are declared on the server route, not supplied by the client:
```ts
@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequirePermissions('users.read', 'users.update')
@Get(':id/audit')
auditUser() {
  // Both users.read AND users.update are required.
}
```
The guard uses AND semantics: every listed permission must belong to the user's role. A missing/invalid token returns 401; a valid token without required permissions returns 403.

## 6. Roles and users
`POST /api/roles` accepts `code`, `name`, optional `description`, and `permission_ids`, for example:
```json
{
  "code": "manager",
  "name": "Manager",
  "description": "Can manage users",
  "permission_ids": [1, 2]
}
```
`POST /api/user` accepts `firstname`, `lastname`, `email`, `password`, and optional `phone`, `status` (`ACTIVE`/`INACTIVE`/`SUSPENDED`) and `role_id`. `DELETE` is a soft delete (`deleted = true`); `updated_user` stores the email of whoever last updated or deleted the user. User creation is protected by `users.create`; do not expose a public endpoint that lets anyone assign themselves a role. Bootstrap the first admin/role through a controlled seed script or direct database setup.

## 7. Refresh and logout
`POST /api/auth/refresh` with `{ "refresh_token": "..." }` rotates the refresh token.
`POST /api/auth/logout` requires the access Bearer token and body `{ "refresh_token": "..." }`.

## 8. Naming convention
All request/response JSON fields and query params use snake_case (`role_id`, `owner_id`, `refresh_token`, `created_at`, pagination `total_pages`). New endpoints must follow this.
