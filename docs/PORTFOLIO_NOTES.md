# Portfolio Notes

## Project Summary

This project is an AI-assisted code and server log analysis workspace. It combines upload, analysis, report review, follow-up chat, and report refinement in one workflow.

## What To Show In A Demo

1. Create or select a project.
2. Load the sample code or upload a source/log file.
3. Run the automatic analysis.
4. Review the structured Markdown report.
5. Ask the AI assistant a follow-up question.
6. Apply a useful assistant answer back into the report.
7. Download the final Markdown report.

## Strong Implementation Points

- FastAPI backend with authenticated project, upload, analysis, and chat APIs.
- PostgreSQL persistence for analysis reports and chat history.
- Server-sent events for streaming assistant responses.
- Docker Compose environment for frontend, backend, PostgreSQL, and Redis.
- Report refinement flow that keeps chat history separate from the canonical analysis report.
- Frontend states for empty, loading, failed, completed, and already-applied assistant answers.

## Useful Interview Talking Points

- Why analysis reports and chat messages are stored separately.
- How ownership checks prevent one user from reading another user's uploads or analyses.
- Why report updates are explicit user actions instead of automatic AI mutations.
- How streaming improves perceived responsiveness for long AI answers.
- What would change for production: background jobs, retry queues, observability, and stricter JSON report schemas.
