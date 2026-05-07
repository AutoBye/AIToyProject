# Authentication Flow

1. `POST /api/auth/register` hashes the password with bcrypt and stores the user.
2. `POST /api/auth/login` verifies the bcrypt hash.
3. The backend signs a JWT with `JWT_SECRET` and an expiration.
4. The frontend stores `access_token` and sends `Authorization: Bearer <token>`.
5. Protected routes decode the token and load the current user.
6. Project, upload, analysis, and chat queries filter by `user_id`.

## Production Notes

- Replace `JWT_SECRET` with a high-entropy secret.
- Prefer secure HTTP-only cookies if app and API share a parent domain.
- Add refresh tokens for long-lived sessions.
- Enforce HTTPS at the load balancer or reverse proxy.
