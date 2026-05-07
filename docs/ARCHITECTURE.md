# Architecture

## Clean Architecture Boundaries

- `backend/app/api`: HTTP transport, dependencies, routes, request and response schemas.
- `backend/app/services`: application services for AI prompts, OpenAI streaming, and files.
- `backend/app/models`: database entities.
- `backend/app/core`: configuration, database, logging, rate limiting, and security.
- `frontend/lib`: API abstraction and streaming client.
- `frontend/store`: Zustand client state.
- `frontend/components`: reusable UI primitives and feature components.

## Runtime Flow

1. A user registers or logs in and receives a JWT.
2. The frontend sends the token as a bearer token.
3. Projects scope uploads, analyses, chat, and token usage.
4. Uploaded files are validated, hashed, stored, and indexed in PostgreSQL.
5. Analysis sends bounded content to OpenAI using versioned prompts.
6. Results are stored in `analyses.result` as JSON markdown.
7. Chat streams via SSE and persists conversation messages.
8. Dashboard queries aggregate project, upload, analysis, and token usage data.

## Error Monitoring

The backend emits structured JSON logs through `structlog`. In production, route container logs to OpenTelemetry Collector, Datadog, Sentry, Grafana Loki, CloudWatch, or an equivalent platform.
