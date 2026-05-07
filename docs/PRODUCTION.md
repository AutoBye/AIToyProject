# Production Optimization Guide

이 문서는 AI Code & Server Log Analysis Platform을 운영 환경에서 안정적으로 실행하기 위한 최적화 전략을 정리합니다.

---

# 1. Backend 최적화

## 비동기 처리

현재 FastAPI는 async 기반으로 작성되어 있습니다.  
다만 OpenAI 분석 요청은 파일 크기와 모델 응답 시간에 따라 오래 걸릴 수 있습니다.

운영 환경에서는 다음 구조를 권장합니다.

- API 서버는 분석 요청을 큐에 등록
- Redis Queue 또는 Celery Worker가 실제 분석 수행
- 프론트엔드는 작업 상태를 polling, SSE, WebSocket으로 확인

확장 예시:

```text
FastAPI
  ↓
Redis Queue
  ↓
Worker
  ↓
OpenAI API
```

---

## 요청 추적

운영 장애 분석을 위해 요청 단위 추적이 필요합니다.

권장 사항:

- Request ID 추가
- Trace ID 추가
- 사용자 ID, 프로젝트 ID, 분석 ID 로그 컨텍스트 추가
- OpenAI 요청 실패 로그 분리
- 업로드 실패 로그 분리

---

## Rate Limiting

AI 분석은 비용이 발생하는 작업이므로 요청 제한이 중요합니다.

권장 제한 기준:

- 사용자별 분당 요청 수
- 사용자별 일일 분석 횟수
- 프로젝트별 업로드 용량
- 월간 토큰 사용량

현재 프로젝트는 `slowapi` 기반 rate limit 확장 준비가 되어 있습니다.

---

# 2. AI 비용 및 지연 시간 최적화

## 모델 선택 전략

모든 작업에 큰 모델을 사용할 필요는 없습니다.

권장 전략:

- 1차 요약: 작은 모델
- 보안 분석: 더 강한 모델
- 코드 개선 예시 생성: 더 강한 모델
- 채팅 후속 질문: 작은 모델 또는 중간 모델

---

## 입력 크기 제어

현재 `build_analysis_prompt()`는 업로드 파일 내용을 최대 120,000자까지 전달합니다.

운영 환경에서는 다음 개선을 권장합니다.

- 파일 chunking
- 함수/클래스 단위 분할
- 로그 시간 구간 단위 분할
- 에러 라인 주변 컨텍스트 추출
- 중복 로그 라인 제거

---

## 캐싱

동일 파일에 대한 반복 분석을 줄이기 위해 `sha256` 해시를 활용할 수 있습니다.

캐싱 전략:

- 같은 `sha256` + 같은 `prompt_version`이면 기존 결과 재사용
- Redis에 임시 분석 결과 캐싱
- PostgreSQL에 최종 결과 저장

---

## 토큰 사용량 추적

`token_usage` 테이블은 다음 정보를 저장합니다.

- model
- prompt_tokens
- completion_tokens
- total_tokens
- estimated_cost_usd

활용 방법:

- 사용자별 사용량 대시보드
- 프로젝트별 비용 분석
- 월간 과금 제한
- 모델 교체 전후 비용 비교

---

# 3. Frontend 최적화

## 번들 최적화

Monaco Editor는 번들 크기가 큰 편입니다.

권장 사항:

- Monaco Editor lazy loading
- 분석 결과 화면 진입 시점에만 로드
- Next.js dynamic import 사용
- 초기 대시보드 렌더링 최소화

---

## 사용자 경험

AI 분석은 시간이 걸릴 수 있으므로 로딩 상태가 중요합니다.

권장 UI:

- 업로드 진행 상태
- 분석 중 상태
- 실패 시 재시도 버튼
- SSE 연결 끊김 안내
- 분석 결과 Skeleton UI
- Token 사용량 표시

---

## 에러 수집

프론트엔드 운영 환경에서는 다음을 수집하는 것이 좋습니다.

- 렌더링 오류
- API 실패
- SSE 연결 실패
- 사용자 브라우저 정보
- Web Vitals

도구 예시:

- Sentry
- Datadog RUM
- OpenTelemetry Web

---

# 4. Database 최적화

## 인덱스

현재 스키마는 주요 조회 경로에 인덱스를 포함합니다.

중요 인덱스:

- `projects.user_id`
- `uploads.project_id`
- `analyses.project_id`
- `analyses.user_id, created_at`
- `ai_messages.project_id, created_at`
- `token_usage.user_id, created_at`

---

## 데이터 보존 정책

업로드 파일과 분석 결과는 시간이 지날수록 커질 수 있습니다.

권장 정책:

- 원본 업로드 파일 보존 기간 설정
- 오래된 분석 결과 archive
- 채팅 메시지 보존 기간 설정
- 사용자 삭제 시 관련 데이터 cascade 삭제

---

## 마이그레이션

현재 초기 스키마는 `database/schema.sql`로 구성되어 있습니다.

운영 환경에서는 Alembic 도입을 권장합니다.

권장 흐름:

```text
모델 변경
  ↓
Alembic migration 생성
  ↓
Staging DB 적용
  ↓
Production DB 적용
```

---

# 5. Upload Storage 최적화

현재 업로드 파일은 컨테이너 파일 시스템 또는 Docker volume에 저장됩니다.

운영 환경에서는 Object Storage를 권장합니다.

예시:

- AWS S3
- Google Cloud Storage
- Azure Blob Storage
- MinIO

권장 구조:

```text
Upload API
  ↓
Object Storage
  ↓
PostgreSQL metadata
```

장점:

- 컨테이너 재시작과 무관하게 파일 유지
- 대용량 파일 저장에 유리
- lifecycle policy 적용 가능
- signed URL 지원 가능

---

# 6. Security 최적화

## Secret 관리

운영 환경에서는 `.env` 파일 대신 Secret Manager를 권장합니다.

예시:

- AWS Secrets Manager
- GCP Secret Manager
- Azure Key Vault
- Doppler
- Vault

---

## 업로드 보안

권장 사항:

- 확장자 검증
- MIME type 검증
- 파일 크기 제한
- 바이너리 파일 차단
- 악성 패턴 검사
- 민감 정보 마스킹 후 AI 전송

---

## AI 입력 보안

업로드 파일에는 민감 정보가 포함될 수 있습니다.

권장 전처리:

- API Key 마스킹
- Password 마스킹
- JWT 마스킹
- 개인정보 마스킹
- 내부 URL 또는 IP 처리 정책 수립

---

# 7. Monitoring

## Backend Metrics

모니터링 권장 항목:

- 요청 수
- 평균 응답 시간
- 4xx/5xx 비율
- 분석 성공률
- 분석 실패율
- OpenAI API latency
- OpenAI API error rate

---

## Business Metrics

서비스 관점에서 중요한 지표:

- 일일 업로드 수
- 일일 분석 수
- 사용자별 토큰 사용량
- 프로젝트별 분석 횟수
- 평균 분석 시간
- severity별 분석 결과 수

---

# 8. 운영 우선순위

초기 운영 시 우선순위는 다음과 같습니다.

1. Secret 관리 강화
2. HTTPS 적용
3. OpenAI 비용 추적
4. 파일 업로드 제한
5. 분석 실패 로깅
6. 대용량 분석 작업 큐 도입
7. Object Storage 전환
8. 프론트엔드 에러 수집
