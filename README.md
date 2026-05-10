# AI Code & Log Analyzer

AI 기반 코드 및 서버 로그 분석 워크스페이스입니다. 사용자가 코드나 로그를 업로드하면 OpenAI API로 문제 원인, 보안 취약점, 성능 위험, 개선 방향을 분석하고, 후속 질문과 리포트 반영까지 하나의 흐름으로 처리합니다.

이 프로젝트는 단순한 챗봇이 아니라 `업로드 -> 분석 -> 리포트 저장 -> AI 후속 질문 -> 리포트 보강 -> Markdown 다운로드`까지 이어지는 분석 제품을 목표로 만들었습니다.

## 주요 기능

- 코드/로그 파일 업로드 및 텍스트 붙여넣기 분석
- 샘플 코드 불러오기 기반 빠른 데모
- OpenAI 기반 Markdown 분석 리포트 생성
- 분석 히스토리 저장 및 프로젝트별 조회
- 분석 결과를 컨텍스트로 사용하는 AI 후속 질문
- SSE(Server-Sent Events) 기반 실시간 AI 답변 스트리밍
- AI 답변을 사용자가 선택해 리포트에 반영
- 이미 반영한 AI 답변 중복 반영 방지
- Markdown 리포트 다운로드
- JWT 인증, 사용자별 프로젝트/업로드/분석 소유권 검증
- Docker Compose 기반 로컬 실행 환경

## 데모 시나리오

1. 회원가입 또는 로그인
2. 프로젝트 생성 또는 선택
3. `샘플 불러오기` 또는 코드/로그 업로드
4. 자동 분석 실행
5. 중앙 리포트 뷰어에서 분석 결과 확인
6. 우측 AI 어시스턴트에 후속 질문 입력
7. 유용한 답변을 `리포트에 반영`
8. 완성된 리포트를 Markdown으로 다운로드

## 기술 스택

Frontend:

- Next.js 15
- React 19
- TypeScript
- Tailwind CSS
- Zustand
- lucide-react

Backend:

- FastAPI
- Async SQLAlchemy
- Pydantic Settings
- JWT Authentication
- OpenAI API
- SSE Streaming

Database / Infra:

- PostgreSQL
- Redis
- Docker
- Docker Compose

## 아키텍처

```text
Browser
  -> Next.js Frontend
  -> FastAPI Backend
  -> PostgreSQL
  -> Redis
  -> OpenAI API
```

Frontend는 인증 상태, 프로젝트 선택, 업로드, 분석 리포트 뷰어, AI 채팅 UI를 담당합니다.

Backend는 인증, 파일 저장, 분석 실행, OpenAI 호출, SSE 스트리밍, 데이터 저장, 소유권 검증을 담당합니다.

## 데이터 흐름

```text
Upload/Text Input
  -> uploads table
  -> analysis API
  -> OpenAI analysis prompt
  -> analyses.result JSONB
  -> report viewer
  -> chat stream with analysis context
  -> ai_messages table
  -> optional report append
```

분석 리포트와 채팅 메시지는 분리해서 저장합니다. AI 답변은 자동으로 원본 리포트를 바꾸지 않고, 사용자가 명시적으로 `리포트에 반영`을 눌렀을 때만 `analyses.result.markdown`에 추가됩니다.

## 주요 API

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
POST   /api/uploads
POST   /api/uploads/text
DELETE /api/uploads/{upload_id}
```

Analysis:

```http
POST /api/analysis/code
POST /api/analysis/log
GET  /api/analysis/history
POST /api/analysis/{analysis_id}/report/append
```

Chat:

```http
GET  /api/analysis/chat/history
POST /api/analysis/chat/stream
```

SSE response:

```text
data: {"delta":"partial response"}
data: [DONE]
```

## 데이터베이스

주요 테이블:

- `users`: 사용자 계정
- `projects`: 사용자별 작업 공간
- `uploads`: 업로드 파일 메타데이터
- `analyses`: 분석 결과와 Markdown 리포트
- `ai_messages`: 분석 기반 AI 채팅 기록
- `token_usage`: 모델 사용량 추적

분석 결과는 확장성을 위해 `analyses.result`에 JSONB 형태로 저장합니다.

## 실행 방법

### 1. 환경 파일 준비

프로젝트 루트에서 실행합니다.

Windows PowerShell:

```powershell
Copy-Item backend\.env.example backend\.env
```

macOS/Linux 또는 Git Bash:

```bash
cp backend/.env.example backend/.env
```

`backend/.env`에 OpenAI API key를 설정합니다.

```env
OPENAI_API_KEY=your-openai-api-key
JWT_SECRET=replace-with-secure-secret
```

### 2. Docker Compose 실행

```powershell
docker compose up --build -d
```

서비스 상태 확인:

```powershell
docker compose ps
```

로그 확인:

```powershell
docker compose logs -f backend
docker compose logs -f frontend
```

종료:

```powershell
docker compose down
```

데이터까지 초기화:

```powershell
docker compose down -v
```

`-v` 옵션은 PostgreSQL 데이터와 업로드 볼륨을 삭제합니다.

## 접속 주소

- Frontend: http://localhost:3000
- Backend Swagger: http://localhost:8000/docs
- Health Check: http://localhost:8000/health
- PostgreSQL: localhost:5432
- Redis: localhost:6379

## 로컬 개발 명령

Frontend:

```powershell
cd frontend
npm install
npm run dev
npm run typecheck
```

Backend:

```powershell
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Backend를 로컬에서 직접 실행하려면 PostgreSQL과 Redis가 먼저 실행 중이어야 합니다.

## 검증 명령

Frontend type check:

```powershell
cd frontend
npm.cmd run typecheck
```

Backend syntax check:

```powershell
python -m py_compile backend\app\api\routes\analysis.py backend\app\schemas\analysis.py backend\app\services\prompts.py
```

Backend tests:

```powershell
docker compose run --rm backend sh -c "pip install -q -r requirements-dev.txt && pytest -q"
```

Docker rebuild:

```powershell
docker compose up --build -d
```

## 구현 포인트

- 분석 리포트와 AI 채팅을 분리해 저장해 원본 분석 결과의 추적성을 유지했습니다.
- 리포트 반영은 사용자 명시 액션으로만 수행해 AI 답변이 자동으로 결과를 덮어쓰지 않게 했습니다.
- 이미 반영된 답변은 UI와 API 양쪽에서 중복 반영을 막습니다.
- 채팅은 SSE 스트리밍으로 처리해 긴 AI 답변도 즉시 표시됩니다.
- 모든 프로젝트, 업로드, 분석 조회는 현재 사용자 소유권을 검증합니다.
- Docker Compose로 프론트엔드, 백엔드, PostgreSQL, Redis를 한 번에 실행할 수 있습니다.
- 리포트 반영, 중복 반영 방지, 타 사용자 분석 차단을 pytest로 검증합니다.

## 프로젝트 구조

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
|   `-- requirements.txt
|-- database/
|   `-- schema.sql
|-- docs/
|   |-- API.md
|   |-- ARCHITECTURE.md
|   |-- DEPLOYMENT.md
|   |-- PORTFOLIO_NOTES.md
|   `-- PRODUCTION.md
|-- frontend/
|   |-- app/
|   |-- components/
|   |-- lib/
|   |-- store/
|   |-- types/
|   |-- Dockerfile
|   `-- package.json
|-- docker-compose.yml
`-- README.md
```

## 향후 개선 계획

- 분석 API 테스트와 권한 검증 테스트 추가
- 분석 작업을 Redis Queue 기반 비동기 작업으로 전환
- 분석 결과를 Markdown뿐 아니라 구조화 JSON으로도 저장
- Severity 자동 점수화 고도화
- GitHub Repository Import
- 비용 대시보드 고도화
- 운영 환경용 Nginx reverse proxy와 CI/CD 구성

## 참고 문서

- [Portfolio Notes](docs/PORTFOLIO_NOTES.md)
- [API Docs](docs/API.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Deployment](docs/DEPLOYMENT.md)
