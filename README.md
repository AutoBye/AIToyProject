# AI Code & Server Log Analysis Platform

AI 기반 코드 및 서버 로그 분석 플랫폼입니다. 사용자가 업로드한 소스 코드와 서버 로그를 OpenAI API로 분석해 문제 원인, 보안 취약점, 성능 병목, 개선 방향을 제공합니다.

Frontend는 Next.js, Backend는 FastAPI로 분리되어 있으며 PostgreSQL, Redis, Docker Compose를 기반으로 로컬 개발 환경과 배포 환경으로 확장할 수 있도록 구성했습니다.

## 주요 기능

- 소스 코드 분석
- 서버 로그 분석
- AI 기반 코드 리뷰
- 에러 원인 분석
- 성능 병목 및 보안 취약점 탐지
- 분석 결과 저장 및 히스토리 조회
- 분석 결과 기반 AI 채팅
- SSE 기반 실시간 스트리밍 응답
- 프로젝트 단위 관리
- JWT 인증
- 파일 업로드
- 토큰 사용량 추적

## 프로젝트 목표

대규모 코드와 로그를 사람이 직접 훑는 시간을 줄이고, 개발자가 더 빠르게 문제 원인을 파악할 수 있게 돕는 것이 목표입니다.

이 프로젝트는 단순한 챗봇이 아니라 코드/로그 업로드, 분석 요청, 결과 저장, 후속 질문, 토큰 사용량 관리까지 하나의 작업 흐름으로 묶은 분석 플랫폼을 지향합니다.

## Tech Stack

Frontend:

- Next.js 15
- React 19
- TypeScript
- TailwindCSS
- Zustand
- Monaco Editor

Backend:

- Python FastAPI
- Async SQLAlchemy
- Pydantic Settings
- JWT Authentication
- Redis
- Structured Logging

Database:

- PostgreSQL
- UUID Primary Key
- JSONB 분석 결과 저장
- Token Usage Tracking

AI:

- OpenAI API
- Prompt Template Architecture
- SSE Streaming Response

Infrastructure:

- Docker
- Docker Compose
- PostgreSQL Container
- Redis Container

## System Architecture

```text
Client Browser
  -> Next.js Frontend
  -> API Abstraction Layer
  -> FastAPI Backend
  -> PostgreSQL / Redis / OpenAI API
```

Frontend는 사용자 인터페이스, 인증 상태, 업로드 화면, 분석 결과 뷰어, AI 채팅 UI를 담당합니다.

Backend는 인증, 파일 처리, 분석 요청, OpenAI API 호출, SSE 스트리밍, 데이터 저장을 담당합니다.

## 분석 흐름

1. 사용자가 회원가입 또는 로그인을 합니다.
2. 프로젝트를 생성합니다.
3. 소스 코드 또는 서버 로그 파일을 업로드합니다.
4. Backend가 파일 크기, 확장자, 소유권을 검증합니다.
5. 사용자가 코드 분석 또는 로그 분석을 실행합니다.
6. Backend가 분석 프롬프트를 구성하고 OpenAI API를 호출합니다.
7. 분석 결과를 PostgreSQL `analyses.result` JSONB 컬럼에 저장합니다.
8. 사용자는 저장된 분석 결과를 보고, AI 채팅으로 후속 질문을 할 수 있습니다.

## 주요 분석 항목

Code Analysis:

- 코드 스멜 탐지
- 중복 로직 탐지
- 복잡도 분석
- 보안 취약점 분석
- 성능 개선 제안
- 리팩터링 방향 제안
- 개선 코드 예시 생성

Log Analysis:

- 장애 원인 분석
- 반복 에러 패턴 탐지
- 비정상 요청 탐지
- 보안 위협 가능성 탐지
- 성능 병목 분석
- 트래픽 패턴 분석
- 심각도 분류

AI Chat:

- 분석 결과 기반 후속 질문
- 특정 문제 원인 추가 설명
- 개선 코드 예시 요청
- 로그에서 가장 치명적인 문제 확인
- 리팩터링 방향 상담

## Database Schema

주요 테이블:

- `users`: 사용자 계정
- `projects`: 프로젝트
- `uploads`: 업로드 파일 메타데이터
- `analyses`: 분석 결과
- `ai_messages`: AI 채팅 메시지
- `token_usage`: 모델별 토큰 사용량

분석 결과는 유연한 확장을 위해 `analyses.result`에 JSONB 형태로 저장합니다.

## API Summary

Authentication:

```http
POST /api/auth/register
POST /api/auth/login
GET  /api/auth/me
```

Projects:

```http
POST /api/projects
GET  /api/projects
GET  /api/projects/dashboard
```

Uploads:

```http
POST /api/uploads
```

Analysis:

```http
POST /api/analysis/code
POST /api/analysis/log
GET  /api/analysis/history
```

Chat:

```http
POST /api/analysis/chat/stream
```

SSE response example:

```text
data: {"delta":"partial response"}
data: [DONE]
```

## Project Structure

```text
.
|-- backend/
|   |-- app/
|   |   |-- api/
|   |   |-- core/
|   |   |-- models/
|   |   |-- schemas/
|   |   `-- services/
|   |-- Dockerfile
|   |-- requirements.txt
|   `-- .env.example
|-- database/
|   `-- schema.sql
|-- docs/
|   |-- API.md
|   |-- ARCHITECTURE.md
|   |-- AUTH_FLOW.md
|   |-- DEPLOYMENT.md
|   |-- PRODUCTION.md
|   `-- PROMPTS.md
|-- frontend/
|   |-- app/
|   |-- components/
|   |-- lib/
|   |-- store/
|   |-- types/
|   |-- Dockerfile
|   |-- package.json
|   `-- package-lock.json
|-- docker-compose.yml
`-- README.md
```

## Docker 기반 실행

이 프로젝트는 Docker Compose 실행을 기본 개발 환경으로 둡니다. Docker를 사용하면 Node.js, Python, PostgreSQL, Redis를 각각 직접 설치하거나 실행하지 않아도 됩니다.

### Prerequisites

- Docker Desktop
- Git
- OpenAI API key

### Environment Setup

프로젝트 루트에서 Backend 환경 파일을 만듭니다.

```powershell
Copy-Item backend\.env.example backend\.env
```

Linux/macOS 또는 Git Bash:

```bash
cp backend/.env.example backend/.env
```

그 다음 `backend/.env`에서 OpenAI API key를 설정합니다.

```env
OPENAI_API_KEY=your-openai-api-key
```

Docker Compose 기준 기본값:

```env
DATABASE_URL=postgresql+asyncpg://postgres:postgres@postgres:5432/ailogcode
REDIS_URL=redis://redis:6379/0
UPLOAD_DIR=/app/uploads
CORS_ORIGINS=http://localhost:3000
```

### Run

처음 실행하거나 Dockerfile, dependency가 바뀐 경우:

```powershell
docker compose up --build -d
```

일반 실행:

```powershell
docker compose up -d
```

서비스 확인:

```powershell
docker compose ps
```

종료:

```powershell
docker compose down
```

PostgreSQL 데이터와 업로드 볼륨까지 초기화하려면:

```powershell
docker compose down -v
```

주의: `-v`는 PostgreSQL 데이터 볼륨과 업로드 볼륨을 삭제합니다.

## Local URLs

- Frontend: http://localhost:3000
- Backend API docs: http://localhost:8000/docs
- Health check: http://localhost:8000/health
- PostgreSQL: localhost:5432
- Redis: localhost:6379

## Useful Commands

Backend 로그:

```powershell
docker compose logs -f backend
```

Frontend 로그:

```powershell
docker compose logs -f frontend
```

전체 재빌드:

```powershell
docker compose build --no-cache
docker compose up -d
```

## Runtime Data

업로드 파일은 애플리케이션 실행 중 생성되는 데이터입니다. Docker Compose에서는 `uploads` 볼륨에 저장하며 Git에는 포함하지 않습니다.

데이터베이스 데이터는 `postgres-data` 볼륨에 저장됩니다.

## Security

- JWT Authentication
- Password Hashing
- File Validation
- Upload Size Limit
- User Ownership Check
- Rate Limiting
- Environment Variable Based Secret Management

운영 환경에서는 다음 값을 반드시 교체해야 합니다.

- `JWT_SECRET`
- `OPENAI_API_KEY`
- `CORS_ORIGINS`
- Database password

## Future Improvements

- GitHub Repository Import
- Multi-LLM Support
- Claude/Gemini API Integration
- RAG Architecture
- Vector Database
- Team Collaboration
- CI/CD Integration
- AI Severity Scoring
- AI Cost Dashboard
- Redis Queue Worker
- Nginx Reverse Proxy
- Object Storage Upload

## Notes

- `backend/.env`는 Git에 올리지 않습니다.
- `backend/uploads/`는 Git에 올리지 않습니다.
- Docker 내부에서 Backend가 PostgreSQL에 접속할 때는 `localhost`가 아니라 Compose 서비스명인 `postgres`를 사용합니다.
- Docker 내부에서 Backend가 Redis에 접속할 때는 Compose 서비스명인 `redis`를 사용합니다.
- Frontend 브라우저 요청은 사용자의 브라우저에서 Backend로 가기 때문에 `NEXT_PUBLIC_API_URL=http://localhost:8000`을 사용합니다.
