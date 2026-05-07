# AI Code & Server Log Analysis Platform

AI 기반 코드 및 서버 로그 분석 플랫폼입니다.  
사용자가 업로드한 소스 코드와 서버 로그를 AI가 분석하여 문제 원인, 성능 병목, 보안 취약점 및 개선 방안을 제공합니다.

이 프로젝트는 Next.js 15 프론트엔드와 Python FastAPI 백엔드를 분리한 구조로 설계되었으며, PostgreSQL, Redis, OpenAI API, Docker Compose를 기반으로 운영 환경까지 확장할 수 있는 프로덕션 지향 스타터입니다.

---

# Preview

## 주요 기능

- 소스 코드 분석
- 서버 로그 분석
- AI 기반 코드 리뷰
- 에러 원인 분석
- 실시간 AI 응답 스트리밍
- 프로젝트 대시보드
- 프로젝트 히스토리 관리
- JWT 인증
- 파일 업로드 시스템
- 분석 결과 저장
- AI 채팅 기능
- 토큰 사용량 추적
- 다크 모드 지원
- 구조화 로그 기반 에러 모니터링

---

# Tech Stack

## Frontend

- Next.js 15
- React 19
- TypeScript
- TailwindCSS
- Zustand
- Monaco Editor
- Server-Sent Events Client

---

## Backend

- Python FastAPI
- Async SQLAlchemy
- Pydantic Settings
- JWT Authentication
- Redis
- Structured Logging

> Celery 기반 백그라운드 워커는 대용량 분석 작업 확장 포인트로 설계되어 있으며, 현재 구현은 FastAPI 비동기 API 중심입니다.

---

## Database

- PostgreSQL
- UUID Primary Key
- JSONB 분석 결과 저장
- Token Usage Tracking

---

## AI

- OpenAI API
- Prompt Template Architecture
- Claude API Optional Extension

---

## Infrastructure

- Docker
- Docker Compose
- PostgreSQL Container
- Redis Container
- Nginx Optional Extension

---

# System Architecture

```text
Client
  ↓
Next.js Frontend
  ↓
API Abstraction Layer
  ↓
FastAPI AI Server
  ↓
PostgreSQL / Redis / OpenAI API
```

현재 프론트엔드는 `frontend/lib/api.ts`의 API 추상화 계층을 통해 FastAPI 서버와 통신합니다.  
AI 채팅은 SSE(Server-Sent Events)를 사용하여 토큰 단위 응답을 실시간으로 렌더링합니다.

---

# Main Features

# 1. Source Code Analysis

업로드한 소스 코드를 분석하여:

- 코드 스멜 탐지
- 중복 로직 탐지
- 복잡도 분석
- 성능 문제 탐지
- 보안 취약점 탐지
- 리팩토링 제안
- 개선 코드 예시 생성

을 수행합니다.

분석 결과는 PostgreSQL의 `analyses.result` JSONB 컬럼에 저장되며, 프론트엔드의 Monaco Editor 기반 뷰어에서 확인할 수 있습니다.

---

# 2. Server Log Analysis

서버 로그를 AI가 분석하여:

- 장애 원인 분석
- 에러 패턴 탐지
- 비정상 요청 탐지
- 보안 의심 패턴 탐지
- 성능 병목 분석
- 크래시 원인 추론
- 심각도 분류

를 제공합니다.

---

# 3. AI Chat Assistant

분석 결과 기반 질의응답 기능입니다.  
특정 분석 결과를 컨텍스트로 포함하여 후속 질문에 답변할 수 있습니다.

예시:

```text
왜 이 코드가 성능이 낮은가요?
```

```text
이 로그에서 가장 치명적인 문제는 무엇인가요?
```

```text
리팩토링 예시를 보여주세요.
```

---

# 4. Streaming AI Response

SSE(Server-Sent Events) 기반 실시간 AI 응답 스트리밍을 지원합니다.

프론트엔드:

- `frontend/lib/api.ts`
- `streamChat()`

백엔드:

- `POST /api/analysis/chat/stream`
- `StreamingResponse`

---

# Folder Structure

```bash
project-root/
├── frontend/
│   ├── app/
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   ├── ui/
│   │   ├── AuthPanel.tsx
│   │   ├── CodeEditor.tsx
│   │   └── Shell.tsx
│   ├── lib/
│   │   └── api.ts
│   ├── store/
│   │   └── auth.ts
│   ├── types/
│   │   └── api.ts
│   ├── Dockerfile
│   └── package.json
│
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── dependencies.py
│   │   │   ├── router.py
│   │   │   └── routes/
│   │   ├── core/
│   │   ├── services/
│   │   ├── models/
│   │   └── schemas/
│   ├── Dockerfile
│   └── requirements.txt
│
├── database/
│   └── schema.sql
├── docs/
├── docker-compose.yml
└── README.md
```

---

# Database Schema

## Main Tables

### users

- id
- email
- password_hash
- full_name
- created_at

### projects

- id
- user_id
- name
- description
- created_at

### uploads

- id
- project_id
- user_id
- file_name
- content_type
- kind
- size_bytes
- storage_path
- sha256
- created_at

### analyses

- id
- project_id
- upload_id
- user_id
- kind
- status
- severity
- model
- prompt_version
- summary
- result
- error_message
- created_at
- completed_at

### ai_messages

- id
- analysis_id
- project_id
- user_id
- role
- content
- token_count
- created_at

### token_usage

- id
- user_id
- project_id
- analysis_id
- model
- prompt_tokens
- completion_tokens
- total_tokens
- estimated_cost_usd
- created_at

---

# API Endpoints

## Authentication

```http
POST /api/auth/register
POST /api/auth/login
GET  /api/auth/me
```

---

## Projects

```http
POST /api/projects
GET  /api/projects
GET  /api/projects/dashboard
```

---

## Upload

```http
POST /api/uploads
```

Multipart form data:

- `project_id`
- `file`

---

## Analysis

```http
POST /api/analysis/code
POST /api/analysis/log
GET  /api/analysis/history
```

---

## Chat

```http
POST /api/analysis/chat/stream
```

SSE response:

```text
data: {"delta":"partial response"}
data: [DONE]
```

---

# Environment Variables

## Frontend (.env.local)

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## Backend (.env)

```env
APP_NAME=AI Code & Log Analyzer
ENVIRONMENT=local
OPENAI_API_KEY=your_api_key
OPENAI_MODEL=gpt-4.1-mini
DATABASE_URL=postgresql+asyncpg://postgres:postgres@postgres:5432/ailogcode
REDIS_URL=redis://redis:6379/0
JWT_SECRET=your_secret
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440
UPLOAD_DIR=/app/uploads
MAX_UPLOAD_MB=10
CORS_ORIGINS=http://localhost:3000
```

---

# Installation

# 1. Clone Repository

```bash
git clone https://github.com/your-repo/project.git
cd project
```

---

# 2. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

---

# 3. Backend Setup

```bash
cd backend

python -m venv venv

# Windows
venv\Scripts\activate

# Linux / Mac
source venv/bin/activate

pip install -r requirements.txt

uvicorn app.main:app --reload
```

---

# 4. Docker Run

```bash
cp backend/.env.example backend/.env
docker compose up --build
```

실제 AI 분석을 실행하려면 `backend/.env`에 `OPENAI_API_KEY`를 설정해야 합니다.

Open:

- Frontend: `http://localhost:3000`
- Backend API Docs: `http://localhost:8000/docs`
- Health Check: `http://localhost:8000/health`

---

# AI Prompt Strategy

## Code Analysis Prompt

- 코드 스멜 탐지
- 중복 로직 탐지
- 복잡도 분석
- 성능 개선 제안
- 보안 취약점 분석
- 리팩토링 추천
- 개선 코드 예시 생성

---

## Log Analysis Prompt

- 장애 원인 분석
- 치명적 에러 탐지
- 의심스러운 요청 탐지
- 보안 이슈 탐지
- 성능 병목 분석
- 크래시 패턴 분석
- 심각도 분류

---

# Authentication Flow

1. 사용자가 회원가입 또는 로그인을 요청합니다.
2. 백엔드는 비밀번호를 bcrypt 해시로 저장하거나 검증합니다.
3. 인증 성공 시 JWT access token을 발급합니다.
4. 프론트엔드는 token을 저장하고 API 요청에 `Authorization: Bearer <token>` 헤더를 포함합니다.
5. 백엔드는 토큰을 검증하고 현재 사용자를 로드합니다.
6. 프로젝트, 업로드, 분석, 채팅 데이터는 모두 `user_id` 기준으로 접근을 제한합니다.

---

# Security

- JWT Authentication
- Password Hashing
- File Validation
- Upload Size Limit
- User Ownership Check
- Rate Limiting
- Input Sanitization
- XSS Prevention
- SQL Injection Prevention
- Environment Variable Based Secret Management

---

# Performance Optimization

- Redis Caching 확장 가능 구조
- Streaming Response
- Async FastAPI
- Async SQLAlchemy
- Background Workers 확장 가능 구조
- Lazy Loading 가능 프론트엔드 구조
- API Abstraction Layer
- Token Usage Tracking
- Upload Hash 기반 중복 분석 캐싱 확장 가능

---

# Error Monitoring

백엔드는 `structlog` 기반 구조화 로그를 출력합니다.  
운영 환경에서는 다음 도구와 연동할 수 있습니다.

- Sentry
- OpenTelemetry Collector
- Grafana Loki
- Datadog
- CloudWatch

---

# Documentation

- [API Documentation](docs/API.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Prompt Architecture](docs/PROMPTS.md)
- [Authentication Flow](docs/AUTH_FLOW.md)
- [Deployment Guide](docs/DEPLOYMENT.md)
- [Production Optimization](docs/PRODUCTION.md)

---

# Future Improvements

- GitHub Repository Import
- Multi-LLM Support
- Claude API Integration
- RAG Architecture
- Vector Database
- Team Collaboration
- CI/CD Integration
- AI Severity Scoring
- AI Cost Dashboard
- Redis Queue Worker
- Celery Worker
- Nginx Reverse Proxy
- Object Storage Upload

---

# Why This Project

대규모 코드와 로그를 빠르게 분석하는 것은 개발 생산성과 장애 대응 속도에 매우 중요합니다.

이 프로젝트는 AI를 활용하여 개발자의 분석 시간을 줄이고 더 빠른 문제 해결을 지원하는 것을 목표로 합니다.

코드 리뷰, 장애 대응, 보안 점검, 성능 개선을 하나의 워크스페이스에서 처리할 수 있도록 설계했습니다.

---

# Lessons Learned

- Next.js 기반 Fullstack Architecture
- FastAPI 비동기 서버 설계
- Clean Architecture 기반 모듈 분리
- LLM Prompt Engineering
- Streaming Response 처리
- Docker 기반 개발 환경 구축
- PostgreSQL JSONB 활용
- Redis Queue 확장 전략
- AI 비용 최적화 전략
- JWT 인증 흐름 설계

---

# Author

김형섭

Backend / AI / Fullstack Developer
