# API Documentation

Base URL: `http://localhost:8000/api`

All protected endpoints require `Authorization: Bearer <jwt>`.

## Authentication

`POST /auth/register`

```json
{ "email": "user@example.com", "password": "password123", "full_name": "Ada" }
```

`POST /auth/login`

```json
{ "email": "user@example.com", "password": "password123" }
```

`GET /auth/me` returns the authenticated user.

## Projects

`POST /projects`

```json
{ "name": "Production API", "description": "Backend reliability workspace" }
```

`GET /projects` lists projects.

`GET /projects/dashboard` returns project, upload, analysis, token, and recent analysis totals.

## Uploads

`POST /uploads`

Multipart form fields:

- `project_id`: project UUID
- `file`: source code or log file

## Analysis

`POST /analysis/code`

```json
{ "upload_id": "uuid" }
```

`POST /analysis/log`

```json
{ "upload_id": "uuid" }
```

`GET /analysis/history` returns recent analyses.

## Streaming Chat

`POST /analysis/chat/stream`

```json
{ "project_id": "uuid", "analysis_id": "uuid", "message": "What is the root cause?" }
```

Returns `text/event-stream` chunks:

```text
data: {"delta":"partial text"}
data: [DONE]
```
