# 인증 흐름 문서

이 문서는 AI Code & Server Log Analysis Platform의 JWT 기반 인증 흐름을 설명합니다.

현재 인증 구현은 다음 파일에 나뉘어 있습니다.

- `backend/app/api/routes/auth.py`
- `backend/app/api/dependencies.py`
- `backend/app/core/security.py`
- `frontend/store/auth.ts`

---

# 1. 인증 개요

사용자는 이메일과 비밀번호로 회원가입 또는 로그인을 수행합니다.  
백엔드는 인증 성공 시 JWT access token을 발급하고, 프론트엔드는 이후 API 요청마다 해당 토큰을 전달합니다.

```text
User
  ↓
Frontend Auth Form
  ↓
POST /api/auth/register 또는 /api/auth/login
  ↓
FastAPI Auth Route
  ↓
JWT 발급
  ↓
Authorization: Bearer <token>
```

---

# 2. 회원가입 흐름

Endpoint:

```http
POST /api/auth/register
```

처리 순서:

1. 사용자가 이메일, 비밀번호, 이름을 입력합니다.
2. 백엔드는 이메일 중복 여부를 확인합니다.
3. 비밀번호를 bcrypt 해시로 변환합니다.
4. 사용자 정보를 `users` 테이블에 저장합니다.
5. 사용자 ID를 subject로 JWT를 생성합니다.
6. access token을 응답합니다.

응답 예시:

```json
{
  "access_token": "jwt_token",
  "token_type": "bearer"
}
```

---

# 3. 로그인 흐름

Endpoint:

```http
POST /api/auth/login
```

처리 순서:

1. 사용자가 이메일과 비밀번호를 입력합니다.
2. 백엔드는 이메일로 사용자를 조회합니다.
3. 입력된 비밀번호와 저장된 bcrypt 해시를 비교합니다.
4. 검증에 성공하면 JWT를 발급합니다.
5. 검증에 실패하면 `401 Unauthorized`를 반환합니다.

---

# 4. JWT 생성

JWT 생성은 `backend/app/core/security.py`에서 처리합니다.

토큰 payload에는 다음 정보가 포함됩니다.

```json
{
  "sub": "user_uuid",
  "exp": "expiration_datetime"
}
```

필드 설명:

- `sub`: 토큰 주체, 현재는 사용자 ID
- `exp`: 토큰 만료 시간

관련 환경 변수:

```env
JWT_SECRET=your_secret
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440
```

---

# 5. 보호된 API 접근

보호된 API는 `Authorization` 헤더를 요구합니다.

```http
Authorization: Bearer <access_token>
```

백엔드 처리 순서:

1. `HTTPBearer`가 토큰을 추출합니다.
2. `jwt.decode()`로 서명과 만료 시간을 검증합니다.
3. payload의 `sub`에서 사용자 ID를 읽습니다.
4. DB에서 사용자를 조회합니다.
5. 사용자가 없거나 토큰이 유효하지 않으면 `401 Unauthorized`를 반환합니다.

---

# 6. 프론트엔드 인증 상태

프론트엔드는 Zustand store에서 인증 상태를 관리합니다.

파일:

```text
frontend/store/auth.ts
```

관리 상태:

- `user`
- `loading`
- `token`

주요 액션:

- `login()`
- `register()`
- `loadUser()`
- `logout()`

현재 구현에서는 `access_token`을 `localStorage`에 저장합니다.

```text
localStorage.getItem("access_token")
```

---

# 7. 권한 경계

인증 후에도 모든 리소스는 `user_id` 기준으로 제한됩니다.

예시:

- 프로젝트는 현재 사용자의 프로젝트만 조회
- 업로드는 현재 사용자가 소유한 프로젝트에만 가능
- 분석은 현재 사용자가 업로드한 파일만 실행 가능
- 채팅 컨텍스트는 현재 사용자의 분석 결과만 사용

이 구조는 다른 사용자의 파일 또는 분석 결과에 접근하는 것을 방지합니다.

---

# 8. 보안 고려사항

## 현재 구현

- bcrypt 비밀번호 해싱
- JWT access token
- Bearer token 인증
- 사용자 소유권 검증
- 환경 변수 기반 secret 관리

## 운영 환경 권장 사항

- `JWT_SECRET`을 충분히 긴 랜덤 값으로 교체
- HTTPS 강제
- Access token 만료 시간 단축
- Refresh token 도입
- 가능하면 HttpOnly Secure Cookie 사용
- 로그인 실패 횟수 제한
- 비밀번호 정책 강화
- 감사 로그 저장

---

# 9. 인증 실패 응답

토큰 누락, 만료, 위조, 사용자 없음 등의 경우:

```json
{
  "detail": "Invalid token"
}
```

또는:

```json
{
  "detail": "User not found"
}
```

상태 코드:

```http
401 Unauthorized
```
