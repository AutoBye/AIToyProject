# AI Code & Server Log Analysis Platform

AI 기반 코드 및 서버 로그 분석 플랫폼입니다.  
사용자가 업로드한 소스 코드와 서버 로그를 AI가 분석하여
문제 원인, 성능 병목, 보안 취약점 및 개선 방안을 제공합니다.

---

# Preview

## 주요 기능

- 소스 코드 분석
- 서버 로그 분석
- AI 기반 코드 리뷰
- 에러 원인 분석
- 실시간 AI 응답 스트리밍
- 프로젝트 히스토리 관리
- JWT 인증
- 파일 업로드 시스템
- 분석 결과 저장
- AI 채팅 기능

---

# Tech Stack

## Frontend

- Next.js 15
- React
- TypeScript
- TailwindCSS
- Zustand
- Monaco Editor

---

## Backend

- Python FastAPI
- Celery
- Redis

---

## Database

- PostgreSQL

---

## AI

- OpenAI API
- Claude API (Optional)

---

## Infrastructure

- Docker
- Docker Compose
- Nginx

---

# System Architecture

```text
Client
  ↓
Next.js Frontend
  ↓
Next.js API Routes (BFF)
  ↓
FastAPI AI Server
  ↓
OpenAI API
```

---

# Main Features

# 1. Source Code Analysis

업로드한 소스코드를 분석하여:

- 코드 스멜 탐지
- 복잡도 분석
- 성능 문제 탐지
- 보안 취약점 탐지
- 리팩토링 제안
- 개선 코드 생성

을 수행합니다.

---

# 2. Server Log Analysis

서버 로그를 AI가 분석하여:

- 장애 원인 분석
- 에러 패턴 탐지
- 비정상 요청 탐지
- 성능 병목 분석
- 크래시 원인 추론

을 제공합니다.

---

# 3. AI Chat Assistant

분석 결과 기반 질의응답 기능.

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

SSE(Server-Sent Events) 기반 실시간 AI 응답 스트리밍 지원.

---

# Folder Structure

```bash
project-root/
├── frontend/
│   ├── app/
│   ├── components/
│   ├── hooks/
│   ├── store/
│   ├── services/
│   ├── types/
│   └── utils/
│
├── backend/
│   ├── app/
│   │   ├── api/
│   │   ├── core/
│   │   ├── services/
│   │   ├── models/
│   │   ├── schemas/
│   │   ├── workers/
│   │   └── utils/
│   │
│   └── main.py
│
├── docker/
├── nginx/
├── docs/
└── README.md
```

---

# Database Schema

## Main Tables

### users
- id
- email
- password
- created_at

### projects
- id
- user_id
- name
- created_at

### uploads
- id
- project_id
- file_name
- file_type

### analyses
- id
- upload_id
- result
- severity
- created_at

### ai_messages
- id
- analysis_id
- role
- content

---

# API Endpoints

## Authentication

```http
POST /api/auth/register
POST /api/auth/login
```

---

## Upload

```http
POST /api/upload
```

---

## Analysis

```http
POST /api/analyze/code
POST /api/analyze/log
```

---

## Chat

```http
POST /api/chat
```

---

## History

```http
GET /api/history
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
OPENAI_API_KEY=your_api_key
DATABASE_URL=postgresql://postgres:password@db:5432/app
REDIS_URL=redis://redis:6379
JWT_SECRET=your_secret
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
docker-compose up --build
```

---

# AI Prompt Strategy

## Code Analysis Prompt

- 코드 스멜 탐지
- 성능 개선 제안
- 보안 취약점 분석
- 리팩토링 추천

---

## Log Analysis Prompt

- 장애 원인 분석
- 에러 패턴 탐지
- 보안 이슈 탐지
- 성능 병목 분석

---

# Security

- JWT Authentication
- File Validation
- Rate Limiting
- Input Sanitization
- XSS Prevention
- SQL Injection Prevention

---

# Performance Optimization

- Redis Caching
- Streaming Response
- Async FastAPI
- Background Workers
- Lazy Loading
- API Abstraction

---

# Future Improvements

- GitHub Repository Import
- Multi-LLM Support
- RAG Architecture
- Vector Database
- Team Collaboration
- CI/CD Integration
- AI Severity Scoring
- AI Cost Dashboard

---

# Why This Project

대규모 코드와 로그를 빠르게 분석하는 것은
개발 생산성과 장애 대응 속도에 매우 중요합니다.

이 프로젝트는 AI를 활용하여
개발자의 분석 시간을 줄이고
더 빠른 문제 해결을 지원하는 것을 목표로 합니다.

---

# Lessons Learned

- Next.js 기반 Fullstack Architecture
- FastAPI 비동기 서버 설계
- LLM Prompt Engineering
- Streaming Response 처리
- Docker 기반 개발 환경 구축
- Redis Queue 처리
- AI 비용 최적화 전략

---

# Author

김형섭

Backend / AI / Fullstack Developer
