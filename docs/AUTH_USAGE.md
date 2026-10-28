# Auth / Bearer token usage

## 1. Environment
Copy `.env.example` to `.env` and set your database credentials plus two different long random JWT secrets. Never commit `.env` or share its values.

## 2. Database migration
The app uses `synchronize: false`, so TypeORM does not automatically update PostgreSQL. Back up your DB, confirm your current table names, then apply `database/001_auth_role_permissions.sql`. This migration assumes the existing `users`, `roles`, and `permissions` tables already exist.

## 3. Login
`POST /api/auth/login`
```json
{ "email": "admin@example.com", "password": "your-password" }
```
The response contains `accessToken`, `refreshToken`, `tokenType`, `expiresIn`, and the user's role/permissions.

## 4. Call protected APIs
Send only the access token in the Authorization header:
```http
GET /api/users
Authorization: Bearer <accessToken>
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
`POST /api/roles` accepts `code`, `name`, optional `description`, and `permissionIds`, for example:
```json
{
  "code": "manager",
  "name": "Manager",
  "description": "Can manage users",
  "permissionIds": [1, 2]
}
```
`POST /api/users` accepts `name`, `email`, `password`, and optional `roleId`. User creation is protected by `users.create`; do not expose a public endpoint that lets anyone assign themselves a role. Bootstrap the first admin/role through a controlled seed script or direct database setup.

## 7. Refresh and logout
`POST /api/auth/refresh` with `{ "refreshToken": "..." }` rotates the refresh token.
`POST /api/auth/logout` requires the access Bearer token and body `{ "refreshToken": "..." }`.
