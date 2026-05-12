# 📋 AICS Tasks - 팀 업무 관리 시스템

AICS 팀을 위한 할일 관리 및 업무 배정 시스템입니다.

## 기능

- ✅ **할일 관리**: 할일 작성, 수정, 완료 처리
- 👥 **업무 배정**: @mention으로 팀원에게 할일 배정
- 🔔 **자동 알림**: Slack으로 마감일 알림 (1일 전, 마감 후)
- 📊 **대시보드**: 팀 전체 업무 현황 한눈에 보기
- 🎯 **우선도 관리**: 낮음/중간/높음 우선도 설정

## 기술 스택

- **Frontend**: Next.js 14, React 19, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL (Neon)
- **Auth**: Firebase Authentication
- **Notifications**: Slack Bot API
- **Deployment**: Vercel

## 비용

모두 무료 tier로 운영 가능:
- ✅ Neon PostgreSQL (무료)
- ✅ Firebase Auth (무료)
- ✅ Vercel Hosting (무료)
- ✅ Vercel Crons (무료)
- ✅ Slack (무료)

## 빠른 시작

### 1. Neon PostgreSQL 설정

1. [neon.tech](https://neon.tech)에서 회원가입
2. 새 프로젝트 생성
3. Connection string 복사

### 2. Firebase 설정

1. [Firebase Console](https://console.firebase.google.com)에서 `aics-worksho-c390c` 프로젝트 선택
2. 설정 → 프로젝트 설정에서 웹 앱 설정 정보 복사

### 3. Slack Bot 설정

1. [api.slack.com/apps](https://api.slack.com/apps)에서 "Create New App" 클릭
2. "From an app manifest" 선택하고 아래 manifest 입력:

```json
{
  "display_information": {
    "name": "AICS Tasks Bot"
  },
  "features": {
    "bot_user": {
      "display_name": "aics-tasks-bot",
      "always_online": true
    }
  },
  "oauth_config": {
    "scopes": {
      "bot": [
        "chat:write",
        "users:read",
        "users:read.email"
      ]
    }
  },
  "settings": {
    "interactivity": {
      "is_enabled": true
    }
  }
}
```

3. "Install to Workspace" 클릭
4. Bot Token (`xoxb-...`) 복사

### 4. 로컬 개발 환경 설정

```bash
# 환경 변수 설정
cp .env.local.example .env.local

# 아래 값들을 .env.local에 입력:
# - NEXT_PUBLIC_FIREBASE_* (Firebase 설정)
# - DATABASE_URL (Neon Connection String)
# - SLACK_BOT_TOKEN (Slack Bot Token)
# - NEXTAUTH_SECRET (openssl rand -base64 32)
# - CRON_SECRET (임의의 문자열)

# 의존성 설치
npm install

# 개발 서버 실행
npm run dev
```

http://localhost:3000에서 확인하세요.

## API 엔드포인트

### 할일 관리
- `GET /api/tasks` - 할일 목록
- `POST /api/tasks` - 할일 생성
- `PUT /api/tasks/[id]` - 할일 수정
- `DELETE /api/tasks/[id]` - 할일 삭제

### 업무 배정
- `POST /api/tasks/assign` - 할일 배정 (Slack 알림)

### Cron Jobs
- `GET /api/cron/check-due-dates` - 마감일 체크 및 알림 발송

## 배포

### Vercel 배포

```bash
git push origin main
```

Vercel은 자동으로 배포합니다.

### Vercel Crons 설정

`vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/cron/check-due-dates",
      "schedule": "0 0 * * *"
    }
  ]
}
```

## 환경 변수

```env
# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# Database
DATABASE_URL=postgresql://...

# Slack
SLACK_BOT_TOKEN=xoxb-...
SLACK_SIGNING_SECRET=
SLACK_WEBHOOK_URL=

# Auth
NEXTAUTH_SECRET=
NEXTAUTH_URL=http://localhost:3000

# Cron
CRON_SECRET=your-secret-key
```

## 프로젝트 구조

```
aics-tasks/
├── app/
│   ├── api/
│   │   ├── tasks/           # 할일 CRUD
│   │   ├── tasks/assign/    # 할일 배정
│   │   └── cron/            # Cron jobs
│   ├── dashboard/           # 대시보드 페이지
│   ├── layout.tsx
│   └── page.tsx
├── lib/
│   ├── db.ts               # PostgreSQL 연결
│   ├── firebase.ts         # Firebase 설정
│   └── slack.ts            # Slack Bot
├── types/                  # TypeScript 타입
└── components/             # React 컴포넌트
```

## 라이선스

MIT
