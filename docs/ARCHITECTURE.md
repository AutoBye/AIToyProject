# 아키텍처 문서

AI Code & Server Log Analysis Platform은 프론트엔드, 백엔드, 데이터베이스, 캐시/큐, AI API를 분리한 구조로 설계되었습니다.

목표는 다음과 같습니다.

- 코드 분석과 로그 분석 기능을 모듈 단위로 확장 가능하게 만들기
- 인증, 업로드, 분석, 채팅, 사용량 추적을 명확히 분리하기
- Docker 기반으로 로컬 개발과 운영 배포를 쉽게 전환하기
- OpenAI API 외 다른 LLM으로도 확장 가능한 구조 유지하기

---

# 전체 구조

```text
Client Browser
  ↓
Next.js Frontend
  ↓
API Abstraction Layer
  ↓
FastAPI Backend
  ↓
PostgreSQL / Redis / OpenAI API
```

프론트엔드는 사용자 인터페이스와 상태 관리를 담당합니다.  
백엔드는 인증, 파일 처리, AI 분석, SSE 스트리밍, 데이터 저장을 담당합니다.

---

# Clean Architecture 경계

## Backend

### `backend/app/api`

HTTP 레이어입니다.

- 라우터 등록
- 인증 의존성 주입
- 요청/응답 처리
- HTTP 예외 처리

주요 파일:

- `backend/app/api/router.py`
- `backend/app/api/dependencies.py`
- `backend/app/api/routes/auth.py`
- `backend/app/api/routes/projects.py`
- `backend/app/api/routes/uploads.py`
- `backend/app/api/routes/analysis.py`

---

### `backend/app/core`

애플리케이션 공통 인프라 레이어입니다.

- 환경 변수 설정
- 데이터베이스 세션
- JWT 보안 설정
- Rate Limiting
- 구조화 로깅

주요 파일:

- `config.py`
- `database.py`
- `security.py`
- `limiter.py`
- `logging.py`

---

### `backend/app/models`

데이터베이스 ORM 모델입니다.

주요 엔티티:

- `User`
- `Project`
- `Upload`
- `Analysis`
- `AiMessage`
- `TokenUsage`

분석 결과는 유연한 확장을 위해 PostgreSQL `JSONB` 컬럼에 저장합니다.

---

### `backend/app/schemas`

API 요청/응답 타입 정의입니다.

- 인증 요청/응답
- 프로젝트 생성/조회
- 업로드 응답
- 분석 응답
- 채팅 요청

Pydantic 기반으로 타입 검증을 수행합니다.

---

### `backend/app/services`

비즈니스 로직과 외부 API 연동을 담당합니다.

- 파일 저장 및 검증
- OpenAI API 호출
- Streaming 응답 처리
- 코드/로그 분석 프롬프트 생성

주요 파일:

- `files.py`
- `openai_client.py`
- `prompts.py`

---

## Frontend

### `frontend/app`

Next.js App Router 기반 화면 진입점입니다.

- `layout.tsx`: 전체 HTML 레이아웃
- `page.tsx`: 대시보드, 업로드, 분석, 채팅 UI
- `globals.css`: TailwindCSS 및 테마 변수

---

### `frontend/components`

재사용 가능한 UI 컴포넌트입니다.

- 인증 패널
- 앱 Shell
- Monaco Editor 기반 분석 결과 뷰어
- 공통 Button/Input

---

### `frontend/lib`

API 추상화 레이어입니다.

- 공통 fetch 처리
- JWT 헤더 자동 추가
- 에러 처리
- SSE 스트리밍 파서

---

### `frontend/store`

Zustand 기반 클라이언트 상태 관리입니다.

- 로그인
- 회원가입
- 현재 사용자 로드
- 로그아웃
- access token 관리

---

# 런타임 흐름

## 1. 인증 흐름

1. 사용자가 회원가입 또는 로그인을 요청합니다.
2. 백엔드는 비밀번호를 bcrypt로 해싱하거나 검증합니다.
3. 인증 성공 시 JWT를 발급합니다.
4. 프론트엔드는 JWT를 저장합니다.
5. 이후 보호된 API 호출 시 `Authorization: Bearer <token>` 헤더를 보냅니다.
6. 백엔드는 토큰을 검증하고 현재 사용자를 로드합니다.

---

## 2. 파일 업로드 흐름

1. 사용자가 프로젝트를 선택합니다.
2. 코드 또는 로그 파일을 업로드합니다.
3. 백엔드는 파일 크기와 확장자를 검증합니다.
4. 파일 내용을 해시 처리하여 `sha256` 값을 생성합니다.
5. 파일은 업로드 디렉터리에 저장됩니다.
6. 업로드 메타데이터는 PostgreSQL `uploads` 테이블에 저장됩니다.

---

## 3. 분석 흐름

1. 사용자가 코드 분석 또는 로그 분석을 실행합니다.
2. 백엔드는 업로드 파일 소유권과 타입을 검증합니다.
3. `analyses` 테이블에 실행 중 상태의 분석 레코드를 생성합니다.
4. 파일 내용을 읽고 분석 타입에 맞는 프롬프트를 생성합니다.
5. OpenAI API를 호출합니다.
6. 응답 결과를 `analyses.result`에 저장합니다.
7. 토큰 사용량을 `token_usage` 테이블에 저장합니다.

---

## 4. AI 채팅 흐름

1. 사용자가 분석 결과에 대해 질문합니다.
2. 백엔드는 선택된 분석 결과를 컨텍스트로 구성합니다.
3. OpenAI Streaming API를 호출합니다.
4. 응답 조각을 SSE로 프론트엔드에 전달합니다.
5. 스트리밍 완료 후 전체 답변을 `ai_messages`에 저장합니다.

---

# 데이터 저장 전략

## PostgreSQL

PostgreSQL은 영속 데이터 저장소입니다.

- 사용자
- 프로젝트
- 업로드 메타데이터
- 분석 결과
- 채팅 메시지
- 토큰 사용량

## Redis

Redis는 캐시와 큐 확장을 위한 기반입니다.

현재 구조에서는 Redis 컨테이너를 포함하고 있으며, 이후 다음 용도로 확장할 수 있습니다.

- 중복 파일 분석 캐시
- 대용량 분석 작업 큐
- Rate Limit 상태 저장
- 실시간 작업 상태 저장

---

# 에러 모니터링

백엔드는 `structlog` 기반 JSON 로그를 출력합니다.

운영 환경에서는 컨테이너 로그를 다음 시스템으로 전달할 수 있습니다.

- OpenTelemetry Collector
- Sentry
- Datadog
- Grafana Loki
- CloudWatch

권장 사항:

- 요청 ID 추가
- 사용자 ID 또는 프로젝트 ID 컨텍스트 추가
- OpenAI API 실패율 모니터링
- 분석 실패율 모니터링
- 업로드 실패율 모니터링

---

# 확장 포인트

- Celery 또는 RQ 기반 Redis Worker 추가
- GitHub Repository Import 기능
- Claude, Gemini 등 Multi-LLM 지원
- Vector DB 기반 RAG 검색
- 팀/조직 단위 권한 관리
- 분석 결과 severity scoring 자동화
- AI 비용 대시보드 고도화
