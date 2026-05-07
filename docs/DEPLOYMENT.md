# 배포 가이드

이 문서는 로컬 개발 환경과 운영 배포 환경에서 프로젝트를 실행하기 위한 가이드입니다.

현재 프로젝트는 Docker Compose 기반 실행을 우선 지원합니다.

---

# 1. 사전 준비

## 필수

- Docker Desktop
- OpenAI API Key
- Git

## 로컬 직접 실행 시 추가 필요

- Node.js 22 이상
- npm
- Python 3.12 이상
- PostgreSQL
- Redis

Docker Compose를 사용하면 PostgreSQL과 Redis를 별도로 설치하지 않아도 됩니다.

---

# 2. 환경 변수 준비

프로젝트 루트에서 다음 명령을 실행합니다.

```bash
cp backend/.env.example backend/.env
```

Windows PowerShell:

```powershell
Copy-Item backend\.env.example backend\.env
```

그 후 `backend/.env`에 OpenAI API Key를 설정합니다.

```env
OPENAI_API_KEY=your_openai_api_key
```

---

# 3. Docker Compose 실행

프로젝트 루트에서 실행합니다.

```bash
docker compose up --build
```

실행되는 서비스:

- `frontend`: Next.js 앱
- `backend`: FastAPI 서버
- `postgres`: PostgreSQL
- `redis`: Redis

접속 주소:

- Frontend: `http://localhost:3000`
- Backend Swagger: `http://localhost:8000/docs`
- Backend Health Check: `http://localhost:8000/health`
- PostgreSQL: `localhost:5432`
- Redis: `localhost:6379`

---

# 4. Docker Compose 종료

컨테이너를 종료합니다.

```bash
docker compose down
```

볼륨까지 삭제하려면:

```bash
docker compose down -v
```

주의: `-v` 옵션은 PostgreSQL 데이터도 삭제합니다.

---

# 5. 로컬 프론트엔드 실행

Docker 없이 프론트엔드만 실행하려면:

```bash
cd frontend
npm install
npm run dev
```

환경 변수:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

프론트엔드 주소:

```text
http://localhost:3000
```

---

# 6. 로컬 백엔드 실행

Docker 없이 백엔드를 실행하려면 PostgreSQL과 Redis가 먼저 실행 중이어야 합니다.

```bash
cd backend
python -m venv venv
```

Windows:

```powershell
venv\Scripts\activate
```

Linux / macOS:

```bash
source venv/bin/activate
```

의존성 설치:

```bash
pip install -r requirements.txt
```

서버 실행:

```bash
uvicorn app.main:app --reload
```

백엔드 주소:

```text
http://localhost:8000
```

---

# 7. 데이터베이스 초기화

Docker Compose 환경에서는 `database/schema.sql`이 PostgreSQL 컨테이너 시작 시 자동 실행됩니다.

```text
database/schema.sql
```

이미 볼륨이 생성된 상태에서 스키마를 다시 적용하려면 볼륨을 삭제하고 재시작해야 합니다.

```bash
docker compose down -v
docker compose up --build
```

---

# 8. 운영 배포 체크리스트

## Backend

- `JWT_SECRET`을 운영용 랜덤 secret으로 교체
- `OPENAI_API_KEY`를 Secret Manager에 저장
- `CORS_ORIGINS`를 실제 프론트엔드 도메인으로 제한
- HTTPS 적용
- API rate limit 강화
- 로그 수집 설정

## Frontend

- `NEXT_PUBLIC_API_URL`을 운영 API 주소로 설정
- Next.js production build 사용
- CDN 또는 reverse proxy 설정
- Client error monitoring 적용

## Database

- Managed PostgreSQL 사용 권장
- 자동 백업 활성화
- 연결 수 제한 설정
- 인덱스 확인
- 마이그레이션 전략 도입

## Redis

- Managed Redis 사용 권장
- 외부 공개 금지
- 인증 또는 private network 적용
- Queue/Cache 용도 분리 고려

---

# 9. 운영 환경 예시

```text
User
  ↓
HTTPS Load Balancer
  ↓
Nginx / Reverse Proxy
  ↓
Next.js Frontend
  ↓
FastAPI Backend
  ↓
Managed PostgreSQL
  ↓
Managed Redis
  ↓
OpenAI API
```

---

# 10. 배포 후 확인 항목

- `/health` 응답 확인
- `/docs` 접근 확인
- 회원가입/로그인 확인
- 프로젝트 생성 확인
- 파일 업로드 확인
- 코드/로그 분석 확인
- SSE 채팅 스트리밍 확인
- PostgreSQL 데이터 저장 확인
- 컨테이너 로그 확인
