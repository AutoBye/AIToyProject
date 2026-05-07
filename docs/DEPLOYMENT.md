# Deployment Guide

## Local Docker

```bash
cp backend/.env.example backend/.env
docker compose up --build
```

Open:

- Frontend: `http://localhost:3000`
- Backend docs: `http://localhost:8000/docs`
- Health: `http://localhost:8000/health`

## Environment Variables

Backend:

- `DATABASE_URL`
- `REDIS_URL`
- `JWT_SECRET`
- `OPENAI_API_KEY`
- `OPENAI_MODEL`
- `UPLOAD_DIR`
- `MAX_UPLOAD_MB`
- `CORS_ORIGINS`

Frontend:

- `NEXT_PUBLIC_API_URL`

## Production Checklist

- Use managed PostgreSQL with automated backups.
- Use managed Redis or a hardened Redis deployment.
- Store secrets in the platform secret manager.
- Run migrations before app rollout.
- Put FastAPI behind a TLS reverse proxy.
- Add object storage for uploads if containers are ephemeral.
- Configure log shipping and alerting.
