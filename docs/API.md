# API 문서

AI Code & Server Log Analysis Platform의 FastAPI 백엔드 API 문서입니다.

기본 주소:

```text
http://localhost:8000/api
```

Swagger 문서:

```text
http://localhost:8000/docs
```

헬스 체크:

```http
GET /health
```

---

# 인증 방식

회원가입 또는 로그인에 성공하면 JWT access token을 발급받습니다.  
보호된 API를 호출할 때는 아래 헤더를 포함해야 합니다.

```http
Authorization: Bearer <access_token>
```

인증이 필요한 API:

- `/auth/me`
- `/projects`
- `/projects/dashboard`
- `/uploads`
- `/analysis/code`
- `/analysis/log`
- `/analysis/history`
- `/analysis/chat/stream`

---

# 공통 에러 응답

API 오류는 기본적으로 아래 형태로 반환됩니다.

```json
{
  "detail": "Error message"
}
```

주요 상태 코드:

- `400 Bad Request`: 잘못된 요청
- `401 Unauthorized`: 인증 실패 또는 토큰 누락
- `404 Not Found`: 리소스를 찾을 수 없음
- `409 Conflict`: 이미 존재하는 데이터
- `413 Payload Too Large`: 업로드 파일 크기 초과
- `429 Too Many Requests`: 요청 제한 초과
- `500 Internal Server Error`: 서버 내부 오류

---

# 1. Authentication

사용자 회원가입, 로그인, 현재 사용자 조회 API입니다.

## 1.1 회원가입

```http
POST /auth/register
```

요청 본문:

```json
{
  "email": "user@example.com",
  "password": "password123",
  "full_name": "Ada Lovelace"
}
```

필드 설명:

- `email`: 사용자 이메일
- `password`: 비밀번호, 최소 8자
- `full_name`: 사용자 이름, 선택값

응답:

```json
{
  "access_token": "jwt_token",
  "token_type": "bearer"
}
```

---

## 1.2 로그인

```http
POST /auth/login
```

요청 본문:

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

응답:

```json
{
  "access_token": "jwt_token",
  "token_type": "bearer"
}
```

---

## 1.3 현재 사용자 조회

```http
GET /auth/me
```

인증:

```http
Authorization: Bearer <access_token>
```

응답:

```json
{
  "id": "user_uuid",
  "email": "user@example.com",
  "full_name": "Ada Lovelace"
}
```

---

# 2. Projects

프로젝트는 업로드, 분석, 채팅, 토큰 사용량을 묶는 작업 공간입니다.

## 2.1 프로젝트 생성

```http
POST /projects
```

인증:

```http
Authorization: Bearer <access_token>
```

요청 본문:

```json
{
  "name": "Production API",
  "description": "운영 API 로그와 코드를 분석하는 프로젝트"
}
```

응답:

```json
{
  "id": "project_uuid",
  "name": "Production API",
  "description": "운영 API 로그와 코드를 분석하는 프로젝트",
  "created_at": "2026-05-08T10:00:00Z"
}
```

---

## 2.2 프로젝트 목록 조회

```http
GET /projects
```

응답:

```json
[
  {
    "id": "project_uuid",
    "name": "Production API",
    "description": "운영 API 로그와 코드를 분석하는 프로젝트",
    "created_at": "2026-05-08T10:00:00Z"
  }
]
```

---

## 2.3 대시보드 조회

```http
GET /projects/dashboard
```

프로젝트 수, 업로드 수, 분석 수, 토큰 사용량, 최근 분석 목록을 반환합니다.

응답:

```json
{
  "projects": 1,
  "analyses": 5,
  "uploads": 3,
  "tokens": 12450,
  "recent_analyses": [
    {
      "id": "analysis_uuid",
      "kind": "log",
      "status": "completed",
      "severity": "high",
      "created_at": "2026-05-08T10:10:00Z"
    }
  ]
}
```

---

# 3. Uploads

소스 코드 또는 서버 로그 파일을 업로드합니다.

## 3.1 파일 업로드

```http
POST /uploads
```

요청 형식:

```http
Content-Type: multipart/form-data
Authorization: Bearer <access_token>
```

Form fields:

- `project_id`: 프로젝트 UUID
- `file`: 업로드할 소스 코드 또는 로그 파일

지원 파일 예시:

- 코드: `.py`, `.ts`, `.tsx`, `.js`, `.jsx`, `.go`, `.java`, `.cs`, `.php`, `.rb`, `.rs`, `.sql`
- 로그: `.log`, `.txt`, `.out`, `.err`

응답:

```json
{
  "id": "upload_uuid",
  "project_id": "project_uuid",
  "file_name": "server.log",
  "kind": "log",
  "size_bytes": 2048,
  "sha256": "file_hash"
}
```

주의:

- 지원하지 않는 확장자는 `400 Bad Request`가 반환됩니다.
- `MAX_UPLOAD_MB`를 초과하면 `413 Payload Too Large`가 반환됩니다.

---

# 4. Analysis

업로드한 파일을 AI로 분석합니다.

## 4.1 소스 코드 분석

```http
POST /analysis/code
```

요청 본문:

```json
{
  "upload_id": "upload_uuid"
}
```

응답:

```json
{
  "id": "analysis_uuid",
  "project_id": "project_uuid",
  "upload_id": "upload_uuid",
  "kind": "code",
  "status": "completed",
  "severity": null,
  "summary": "Overview",
  "result": {
    "markdown": "분석 결과 마크다운"
  },
  "created_at": "2026-05-08T10:20:00Z"
}
```

분석 항목:

- 코드 스멜
- 보안 취약점
- 복잡도
- 리팩토링 제안
- 성능 개선
- 개선 코드 예시

---

## 4.2 서버 로그 분석

```http
POST /analysis/log
```

요청 본문:

```json
{
  "upload_id": "upload_uuid"
}
```

응답:

```json
{
  "id": "analysis_uuid",
  "project_id": "project_uuid",
  "upload_id": "upload_uuid",
  "kind": "log",
  "status": "completed",
  "severity": null,
  "summary": "Summary",
  "result": {
    "markdown": "분석 결과 마크다운"
  },
  "created_at": "2026-05-08T10:25:00Z"
}
```

분석 항목:

- 장애 원인
- 치명적 에러
- 의심스러운 요청
- 보안 위험
- 성능 병목
- 크래시 패턴

---

## 4.3 분석 히스토리 조회

```http
GET /analysis/history
```

최근 분석 50개를 반환합니다.

응답:

```json
[
  {
    "id": "analysis_uuid",
    "project_id": "project_uuid",
    "upload_id": "upload_uuid",
    "kind": "code",
    "status": "completed",
    "severity": null,
    "summary": "Overview",
    "result": {
      "markdown": "분석 결과 마크다운"
    },
    "created_at": "2026-05-08T10:20:00Z"
  }
]
```

---

# 5. Streaming Chat

분석 결과를 컨텍스트로 사용하여 AI에게 후속 질문을 할 수 있습니다.  
응답은 SSE(Server-Sent Events)로 스트리밍됩니다.

## 5.1 AI 채팅 스트리밍

```http
POST /analysis/chat/stream
```

요청 본문:

```json
{
  "project_id": "project_uuid",
  "analysis_id": "analysis_uuid",
  "message": "이 로그의 가장 큰 장애 원인은 무엇인가요?"
}
```

필드 설명:

- `project_id`: 채팅이 속한 프로젝트 UUID
- `analysis_id`: 참조할 분석 UUID, 선택값
- `message`: 사용자 질문

응답 형식:

```http
Content-Type: text/event-stream
```

SSE 이벤트 예시:

```text
data: {"delta":"가장 큰 원인은"}

data: {"delta":" 데이터베이스 연결 지연입니다."}

data: [DONE]
```

프론트엔드는 각 `delta` 값을 이어 붙여 실시간 응답처럼 렌더링합니다.

---

# 6. 테스트용 호출 예시

## 6.1 로그인 후 토큰 저장

```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'
```

---

## 6.2 프로젝트 생성

```bash
curl -X POST http://localhost:8000/api/projects \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <access_token>" \
  -d '{"name":"Production API","description":"운영 로그 분석"}'
```

---

## 6.3 파일 업로드

```bash
curl -X POST http://localhost:8000/api/uploads \
  -H "Authorization: Bearer <access_token>" \
  -F "project_id=<project_uuid>" \
  -F "file=@server.log"
```

---

## 6.4 로그 분석 실행

```bash
curl -X POST http://localhost:8000/api/analysis/log \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <access_token>" \
  -d '{"upload_id":"<upload_uuid>"}'
```

---

# 7. 관련 문서

- [Architecture](ARCHITECTURE.md)
- [Prompt Architecture](PROMPTS.md)
- [Authentication Flow](AUTH_FLOW.md)
- [Deployment Guide](DEPLOYMENT.md)
- [Production Optimization](PRODUCTION.md)
