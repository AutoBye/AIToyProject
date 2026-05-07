# AI Prompt Architecture

이 문서는 코드 분석, 로그 분석, AI 채팅에 사용되는 프롬프트 설계 방식을 설명합니다.

프롬프트 정의 위치:

```text
backend/app/services/prompts.py
```

---

# 설계 목표

프롬프트 아키텍처의 목표는 다음과 같습니다.

- 코드 분석과 로그 분석의 역할을 명확히 분리하기
- 매번 일정한 출력 포맷을 유지하기
- 분석 결과를 프론트엔드에서 그대로 표시할 수 있도록 Markdown 친화적으로 만들기
- 향후 프롬프트 버전 관리와 모델 교체가 가능하도록 구조화하기
- 토큰 사용량을 통제하기 위해 입력 길이를 제한하기

---

# 1. Code Analysis Prompt

코드 분석 프롬프트는 모델에게 “시니어 소프트웨어 엔지니어이자 보안 관점의 코드 리뷰어” 역할을 부여합니다.

## 분석 대상

사용자가 업로드한 소스 코드입니다.

지원 예시:

- Python
- TypeScript
- JavaScript
- Java
- Go
- Rust
- SQL

## 분석 항목

- 코드 스멜 탐지
- 보안 취약점 분석
- 복잡도 분석
- 리팩토링 제안
- 성능 개선 제안
- 개선이 필요한 이유 설명
- 개선 코드 예시 생성

## 기대 출력 형식

```text
- Overview
- Problems
- Severity
- Recommended Fixes
- Improved Code
```

## 활용 목적

이 프롬프트는 단순한 코드 설명이 아니라 실제 리뷰 결과에 가까운 보고서를 생성하는 데 초점을 둡니다.

예상 사용 사례:

- PR 리뷰 보조
- 레거시 코드 개선 포인트 탐색
- 보안 취약점 1차 점검
- 성능 개선 후보 탐색
- 리팩토링 방향 수립

---

# 2. Log Analysis Prompt

로그 분석 프롬프트는 모델에게 “백엔드 신뢰성 엔지니어” 역할을 부여합니다.

## 분석 대상

사용자가 업로드한 서버 로그입니다.

지원 예시:

- 애플리케이션 로그
- 에러 로그
- API Gateway 로그
- Nginx/Reverse Proxy 로그
- Worker 로그
- Crash 로그

## 분석 항목

- 장애 원인 분석
- 치명적 에러 탐지
- 의심스러운 요청 패턴 탐지
- 성능 병목 탐지
- 문제를 쉬운 말로 설명
- 수정 방안 제안
- 심각도 분류

## 기대 출력 형식

```text
- Summary
- Critical Issues
- Root Cause
- Recommendations
- Security Risks
- Performance Risks
```

## 활용 목적

로그 분석 프롬프트는 장애 대응 시간을 줄이는 데 초점을 둡니다.

예상 사용 사례:

- 장애 원인 1차 분석
- 반복 에러 패턴 탐지
- 5xx 증가 원인 파악
- 느린 요청 탐지
- 보안 의심 요청 확인
- 크래시 패턴 정리

---

# 3. Chat Prompt

채팅 프롬프트는 분석 결과를 기반으로 사용자의 후속 질문에 답변하기 위한 프롬프트입니다.

정의 위치:

```text
CHAT_PROMPT
```

## 역할

모델은 “코드 및 장애 분석 보조 AI”로 동작합니다.

## 입력 컨텍스트

채팅 요청에 `analysis_id`가 포함되면 백엔드는 해당 분석 결과를 가져와 컨텍스트에 포함합니다.

```text
Context:
<analysis.result>

User question:
<message>
```

## 응답 방식

응답은 SSE(Server-Sent Events)로 스트리밍됩니다.

프론트엔드는 각 chunk를 받아 화면에 이어 붙입니다.

---

# 4. Prompt Builder

분석 프롬프트는 `build_analysis_prompt()` 함수에서 생성됩니다.

```python
def build_analysis_prompt(kind: str, content: str) -> str:
    template = CODE_ANALYSIS_PROMPT if kind == "code" else LOG_ANALYSIS_PROMPT
    return f"{template}\n\n--- INPUT START ---\n{content[:120000]}\n--- INPUT END ---"
```

## 핵심 포인트

- `kind`가 `code`이면 코드 분석 프롬프트를 사용합니다.
- `kind`가 `log`이면 로그 분석 프롬프트를 사용합니다.
- 업로드 파일 내용은 최대 120,000자까지 전달합니다.
- 과도한 토큰 사용과 API 비용 증가를 방지합니다.

---

# 5. Prompt Versioning

현재 분석 테이블에는 `prompt_version` 필드가 있습니다.

```text
analyses.prompt_version
```

이 필드는 다음 목적을 가집니다.

- 과거 분석 결과가 어떤 프롬프트로 생성되었는지 추적
- 프롬프트 개선 전후 품질 비교
- A/B 테스트
- 모델 교체 시 결과 차이 분석

현재 기본값:

```text
v1
```

---

# 6. Production Controls

운영 환경에서는 다음 제어 장치를 권장합니다.

## 입력 전처리

- API Key, Secret, Password 등 민감 정보 마스킹
- 개인정보 제거
- 긴 파일 chunking
- 바이너리 또는 압축 파일 차단

## 비용 제어

- 모델별 토큰 사용량 기록
- 사용자별 월간 사용량 제한
- 중복 업로드 해시 캐싱
- 작은 모델과 큰 모델의 역할 분리

## 품질 제어

- 출력 형식 강제
- severity 기준 정의
- JSON Schema 응답 도입
- 분석 결과 평가 데이터셋 구축

---

# 7. 향후 개선 방향

- 프롬프트 템플릿 파일 분리
- 관리자 화면에서 프롬프트 버전 관리
- 모델별 프롬프트 최적화
- JSON mode 또는 structured output 적용
- RAG 기반 프로젝트 컨텍스트 주입
- Repository 단위 코드 분석 프롬프트 추가
