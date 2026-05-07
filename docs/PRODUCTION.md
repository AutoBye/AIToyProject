# Production Optimization Guide

## Backend

- Add Alembic migrations for schema changes after the initial SQL bootstrap.
- Move long analyses to Redis-backed workers for large files.
- Add request IDs and trace IDs to structured logs.
- Redact secrets from uploaded source and logs before AI calls.
- Enforce per-user rate limits and upload quotas.
- Use object storage for uploads and signed URLs for retrieval.

## AI Cost and Latency

- Use smaller models for first-pass triage and larger models for deep review.
- Chunk large files by logical boundaries.
- Cache repeated upload hashes in Redis.
- Track `prompt_tokens`, `completion_tokens`, `total_tokens`, and estimated cost.

## Frontend

- Lazy-load Monaco for faster initial load.
- Add optimistic UI for project creation and upload status.
- Add retry affordances for failed streaming requests.
- Capture client exceptions and web vitals.

## Database

- Keep indexes on `user_id`, `project_id`, and `created_at` columns.
- Partition `ai_messages` and `token_usage` if volume becomes high.
- Archive old uploads and analyses according to retention policy.
