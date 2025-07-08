# BlogCraft - AI 블로그 콘텐츠 생성 서비스

네이버 블로그에 최적화된 AI 콘텐츠 생성 웹서비스입니다.

## 🚀 프로젝트 개요

BlogCraft는 AI 필터링에 걸리지 않는 고품질 블로그 콘텐츠를 자동 생성하는 상용화 웹서비스입니다.

### 주요 기능
- 🤖 AI 탐지 회피 콘텐츠 생성
- 📊 SEO 최적화 및 네이버 블로그 최적화
- 📁 다양한 소스 지원 (PDF, DOC, 뉴스 링크)
- 🎨 자동 썸네일 이미지 생성
- 👥 사용자 맞춤형 가이드라인 설정

## 🛠️ 기술 스택

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **UI Components**: shadcn/ui
- **Form**: React Hook Form + Zod
- **Authentication**: NextAuth.js

### Backend
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Authentication**: JWT
- **File Storage**: Cloudinary
- **File Processing**: Multer

### Deployment
- **Frontend**: Vercel
- **Backend**: Railway
- **Database**: Railway PostgreSQL

## 📦 설치 및 실행

### 사전 요구사항
- Node.js 18.0.0 이상
- npm 또는 yarn
- PostgreSQL 데이터베이스

### 로컬 개발 환경 설정

1. **프로젝트 클론**
```bash
git clone <repository-url>
cd BlogCraft
```

2. **프론트엔드 설정**
```bash
cd frontend
npm install
cp .env.local.example .env.local
# .env.local 파일에 환경 변수 설정
npm run dev
```

3. **백엔드 설정**
```bash
cd backend
npm install
cp .env.example .env
# .env 파일에 환경 변수 설정
npx prisma migrate dev
npx prisma generate
npm run dev
```

### 환경 변수 설정

#### Frontend (.env.local)
```bash
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
NEXT_PUBLIC_API_URL=http://localhost:8000
```

#### Backend (.env)
```bash
NODE_ENV=development
PORT=8000
DATABASE_URL=postgresql://username:password@localhost:5432/blogcraft
JWT_SECRET=your-jwt-secret
OPENAI_API_KEY=your-openai-api-key
CLOUDINARY_CLOUD_NAME=your-cloudinary-name
CLOUDINARY_API_KEY=your-cloudinary-key
CLOUDINARY_API_SECRET=your-cloudinary-secret
```

## 🚀 배포 가이드

### Vercel 배포 (프론트엔드)

1. **Vercel 계정 연결**
```bash
cd frontend
npx vercel
```

2. **환경 변수 설정**
- Vercel Dashboard에서 환경 변수 설정
- 모든 .env.local 변수들을 추가

3. **자동 배포**
- main 브랜치에 푸시하면 자동 배포

### Railway 배포 (백엔드)

1. **Railway 계정 연결**
```bash
cd backend
railway login
railway init
```

2. **PostgreSQL 데이터베이스 추가**
```bash
railway add postgresql
```

3. **환경 변수 설정**
```bash
railway variables set NODE_ENV=production
railway variables set JWT_SECRET=your-jwt-secret
railway variables set OPENAI_API_KEY=your-openai-api-key
# 기타 환경 변수들...
```

4. **배포**
```bash
railway deploy
```

## 📚 API 문서

### 인증 엔드포인트

#### POST /api/auth/register
사용자 회원가입
```json
{
  "email": "user@example.com",
  "password": "Password123!",
  "name": "사용자명"
}
```

#### POST /api/auth/login
사용자 로그인
```json
{
  "email": "user@example.com",
  "password": "Password123!"
}
```

#### GET /api/auth/me
현재 사용자 정보 조회 (인증 필요)

### 가이드라인 엔드포인트

#### GET /api/guidelines
사용자 가이드라인 목록 조회 (인증 필요)

#### POST /api/guidelines
새 가이드라인 생성 (인증 필요)

### 콘텐츠 생성 엔드포인트

#### POST /api/content/generate
AI 콘텐츠 생성 (인증 필요)

## 🏗️ 프로젝트 구조

```
BlogCraft/
├── frontend/           # Next.js 프론트엔드
│   ├── src/
│   │   ├── app/       # App Router 페이지
│   │   ├── components/ # UI 컴포넌트
│   │   └── lib/       # 유틸리티 함수
│   ├── public/        # 정적 파일
│   └── package.json
├── backend/            # Express.js 백엔드
│   ├── src/
│   │   ├── controllers/ # 컨트롤러
│   │   ├── middleware/  # 미들웨어
│   │   ├── routes/     # 라우터
│   │   ├── utils/      # 유틸리티
│   │   └── types/      # TypeScript 타입
│   ├── prisma/         # 데이터베이스 스키마
│   └── package.json
└── README.md
```

## 🔧 개발 도구

### 유용한 명령어

```bash
# 프론트엔드 개발 서버
cd frontend && npm run dev

# 백엔드 개발 서버
cd backend && npm run dev

# 데이터베이스 마이그레이션
cd backend && npx prisma migrate dev

# Prisma 스튜디오 실행
cd backend && npx prisma studio

# 타입 체크
npm run type-check

# 빌드
npm run build
```

## 🚨 문제 해결

### 데이터베이스 연결 오류
```bash
# PostgreSQL 서비스 확인
sudo service postgresql status

# 데이터베이스 연결 테스트
cd backend && npx prisma db push
```

### 환경 변수 오류
- .env 파일이 올바른 위치에 있는지 확인
- 환경 변수 값에 특수문자가 있는 경우 따옴표로 감싸기

## 📄 라이선스

이 프로젝트는 MIT 라이선스를 따릅니다.

## 🤝 기여하기

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📞 연락처

프로젝트 링크: [https://github.com/yourusername/BlogCraft](https://github.com/yourusername/BlogCraft)

---

**BlogCraft** - AI 기반 블로그 콘텐츠 생성의 새로운 표준 