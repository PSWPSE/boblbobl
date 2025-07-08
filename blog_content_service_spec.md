# 블로그 콘텐츠 작성 웹서비스 개발 기획서

## 1. 프로젝트 개요

### 1.1 서비스명
**BlogCraft** (가칭)

### 1.2 서비스 목적
네이버 블로그에 최적화된 고품질 콘텐츠를 AI 필터링에 걸리지 않고 SEO 최적화된 형태로 자동 생성하는 웹서비스

### 1.3 핵심 가치
- 사용자 맞춤형 콘텐츠 작성 가이드라인 설정
- 다양한 소스 데이터 활용 (뉴스, PDF, 텍스트)
- 자동 썸네일 이미지 생성
- AI 탐지 회피 및 SEO 최적화

## 2. 기술 스택

### 2.1 프론트엔드
- **플랫폼**: Vercel
- **프레임워크**: Next.js 14 (App Router)
- **언어**: TypeScript
- **스타일링**: Tailwind CSS
- **상태 관리**: Zustand
- **UI 컴포넌트**: shadcn/ui
- **폼 관리**: React Hook Form + Zod

### 2.2 백엔드
- **플랫폼**: Railway
- **프레임워크**: Express.js
- **언어**: TypeScript
- **데이터베이스**: PostgreSQL
- **ORM**: Prisma
- **파일 업로드**: Multer + Cloudinary
- **인증**: NextAuth.js (프론트) + JWT (백엔드)

### 2.3 외부 서비스
- **AI 모델**: OpenAI GPT-4 / Claude API
- **이미지 생성**: DALL-E 3 또는 Midjourney API
- **파일 파싱**: pdf-parse, mammoth (docx)
- **소셜 로그인**: Google OAuth, 네이버/카카오 OAuth

## 3. 주요 기능 명세

### 3.1 콘텐츠 작성 가이드라인 설정

#### 3.1.1 키워드 선택 방식
```typescript
interface GuidelineKeywords {
  tone: string[];           // 어조 (친절하게, 전문성있게, 유머러스하게, 짧고간결하게)
  structure: string[];      // 구조 (Q&A구조, 단계별설명, 비교분석, 스토리텔링)
  readability: string[];    // 가독성 (이해하기쉽게, 전문용어최소화, 예시많이)
  seo: string[];           // SEO (키워드최적화, 제목다양화, 메타설명포함)
  engagement: string[];     // 참여도 (질문던지기, 경험담포함, 실용적팁)
  format: string[];        // 형식 (리스트활용, 소제목구분, 이미지설명)
}
```

#### 3.1.2 직접 메모 입력
- 자유형식 텍스트 입력
- 마크다운 지원
- 실시간 프리뷰

### 3.2 기초 데이터 입력 시스템

#### 3.2.1 지원 형식
- **뉴스 기사 링크**: 자동 크롤링 및 본문 추출
- **PDF 파일**: 텍스트 추출 및 구조 분석
- **텍스트 파일**: 직접 업로드 및 편집

#### 3.2.2 데이터 처리 플로우
```
파일 업로드 → 형식 검증 → 텍스트 추출 → 전처리 → 분석 → 저장
```

### 3.3 콘텐츠 생성 엔진

#### 3.3.1 AI 필터링 회피 전략
- 인간적인 글쓰기 패턴 모방
- 문장 구조 다양화
- 자연스러운 오탈자 및 구어체 포함
- 개인적 경험담 삽입

#### 3.3.2 네이버 블로그 최적화
- 네이버 검색 알고리즘 최적화
- 적절한 키워드 밀도 유지
- 네이버 블로그 포맷 준수

#### 3.3.3 SEO 최적화 요소
- 제목 태그 최적화
- 메타 디스크립션 생성
- 구조화된 데이터 마크업
- 내부 링크 제안

### 3.4 썸네일 이미지 생성

#### 3.4.1 이미지 사양
- **크기**: 1080x1080px
- **형식**: PNG/JPEG
- **스타일**: 깔끔하고 세련된 텍스트 기반 디자인

#### 3.4.2 생성 요소
- 콘텐츠 핵심 키워드
- 눈길을 끄는 카피라이팅
- 브랜드 일관성 유지
- 가독성 높은 폰트 사용

### 3.5 사용자 인증 시스템

#### 3.5.1 로그인 방식
- **필수**: Google OAuth, 이메일/비밀번호
- **선택**: 네이버, 카카오 OAuth

#### 3.5.2 사용자 데이터
```typescript
interface User {
  id: string;
  email: string;
  name: string;
  provider: 'google' | 'email' | 'naver' | 'kakao';
  subscription: 'free' | 'premium';
  createdAt: Date;
  updatedAt: Date;
}
```

## 4. 데이터베이스 설계

### 4.1 주요 테이블

#### 4.1.1 Users 테이블
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  provider VARCHAR(20) NOT NULL,
  provider_id VARCHAR(255),
  subscription VARCHAR(20) DEFAULT 'free',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### 4.1.2 Content_Guidelines 테이블
```sql
CREATE TABLE content_guidelines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  name VARCHAR(100) NOT NULL,
  keywords JSONB,
  memo TEXT,
  type VARCHAR(20) NOT NULL, -- 'keywords' | 'memo'
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### 4.1.3 Source_Data 테이블
```sql
CREATE TABLE source_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  filename VARCHAR(255),
  file_type VARCHAR(50),
  file_url VARCHAR(500),
  extracted_text TEXT,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### 4.1.4 Generated_Content 테이블
```sql
CREATE TABLE generated_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  guideline_id UUID REFERENCES content_guidelines(id),
  source_data_id UUID REFERENCES source_data(id),
  title VARCHAR(200),
  content TEXT,
  thumbnail_url VARCHAR(500),
  seo_metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## 5. API 설계

### 5.1 인증 관련 API
```
POST /api/auth/register
POST /api/auth/login
POST /api/auth/logout
GET  /api/auth/me
POST /api/auth/oauth/google
POST /api/auth/oauth/naver
POST /api/auth/oauth/kakao
```

### 5.2 가이드라인 관리 API
```
GET    /api/guidelines
POST   /api/guidelines
PUT    /api/guidelines/:id
DELETE /api/guidelines/:id
GET    /api/guidelines/keywords  // 사전 정의된 키워드 목록
```

### 5.3 파일 업로드 API
```
POST /api/upload/file
POST /api/upload/url     // 뉴스 링크 처리
GET  /api/upload/:id
DELETE /api/upload/:id
```

### 5.4 콘텐츠 생성 API
```
POST /api/content/generate
GET  /api/content/history
GET  /api/content/:id
PUT  /api/content/:id
DELETE /api/content/:id
```

### 5.5 이미지 생성 API
```
POST /api/image/generate
GET  /api/image/:id
```

## 6. 사용자 인터페이스 설계

### 6.1 페이지 구조
```
/                     - 랜딩 페이지
/auth/login          - 로그인
/auth/register       - 회원가입
/dashboard           - 대시보드
/guidelines          - 가이드라인 관리
/upload              - 파일 업로드
/generate            - 콘텐츠 생성
/history             - 생성 기록
/profile             - 프로필 관리
```

### 6.2 주요 컴포넌트
- **Header**: 네비게이션, 사용자 정보
- **Sidebar**: 메뉴, 빠른 액세스
- **GuidelineSelector**: 키워드 선택 인터페이스
- **FileUploader**: 드래그앤드롭 파일 업로드
- **ContentEditor**: 생성된 콘텐츠 편집
- **ThumbnailGenerator**: 이미지 생성 및 편집

## 7. 개발 단계별 계획

### 7.1 Phase 1: 기본 인프라 구축 (1-2주)
- [ ] 프로젝트 초기 설정 (Next.js, Express.js)
- [ ] 데이터베이스 설계 및 마이그레이션
- [ ] 기본 인증 시스템 구현
- [ ] Vercel, Railway 배포 환경 설정

### 7.2 Phase 2: 핵심 기능 개발 (2-3주)
- [ ] 가이드라인 설정 시스템
- [ ] 파일 업로드 및 처리
- [ ] AI 콘텐츠 생성 엔진
- [ ] 기본 UI/UX 구현

### 7.3 Phase 3: 고도화 기능 (1-2주)
- [ ] 썸네일 이미지 생성
- [ ] SEO 최적화 기능
- [ ] AI 필터링 회피 알고리즘
- [ ] 소셜 로그인 연동

### 7.4 Phase 4: 테스트 및 최적화 (1주)
- [ ] 단위 테스트 및 통합 테스트
- [ ] 성능 최적화
- [ ] 보안 강화
- [ ] 사용자 피드백 반영

## 8. 환경 변수 설정

### 8.1 프론트엔드 (.env.local)
```
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
NAVER_CLIENT_ID=your-naver-client-id
NAVER_CLIENT_SECRET=your-naver-client-secret
KAKAO_CLIENT_ID=your-kakao-client-id
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### 8.2 백엔드 (.env)
```
DATABASE_URL=postgresql://username:password@localhost:5432/blogcraft
JWT_SECRET=your-jwt-secret
OPENAI_API_KEY=your-openai-api-key
CLOUDINARY_CLOUD_NAME=your-cloudinary-name
CLOUDINARY_API_KEY=your-cloudinary-key
CLOUDINARY_API_SECRET=your-cloudinary-secret
PORT=8000
```

## 9. 보안 고려사항

### 9.1 데이터 보안
- 사용자 비밀번호 해싱 (bcrypt)
- JWT 토큰 만료 시간 설정
- API 요청 제한 (Rate Limiting)
- 파일 업로드 검증 및 제한

### 9.2 개인정보 보호
- GDPR 준수
- 개인정보 암호화 저장
- 사용자 데이터 삭제 기능
- 로그 관리 및 모니터링

## 10. 성능 최적화

### 10.1 프론트엔드
- Next.js Image 최적화
- 코드 스플리팅
- 캐싱 전략
- CDN 활용

### 10.2 백엔드
- 데이터베이스 인덱싱
- 쿼리 최적화
- 캐싱 (Redis)
- API 응답 압축

## 11. 모니터링 및 로깅

### 11.1 모니터링 도구
- Vercel Analytics (프론트엔드)
- Railway Metrics (백엔드)
- Sentry (에러 트래킹)

### 11.2 로깅 전략
- 구조화된 로깅 (Winston)
- 에러 로그 수집
- 사용자 행동 분석
- 성능 메트릭 추적

## 12. 배포 및 CI/CD

### 12.1 배포 전략
- **프론트엔드**: Vercel 자동 배포
- **백엔드**: Railway 자동 배포
- **데이터베이스**: Railway PostgreSQL

### 12.2 CI/CD 파이프라인
```yaml
# .github/workflows/deploy.yml
name: Deploy
on:
  push:
    branches: [main]
jobs:
  deploy-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
  
  deploy-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy to Railway
        uses: railway/action@v1
```

## 13. 개발 시작 가이드

### 13.1 초기 설정
```bash
# 프론트엔드 설정
npx create-next-app@latest frontend --typescript --tailwind --app
cd frontend
npm install @next-auth/prisma-adapter @prisma/client next-auth

# 백엔드 설정
mkdir backend && cd backend
npm init -y
npm install express typescript @types/node @types/express
npm install prisma @prisma/client
npm install bcryptjs jsonwebtoken multer
```

### 13.2 Cursor 개발 가이드
1. 이 기획서를 Cursor에 붙여넣기
2. "이 기획서를 바탕으로 프로젝트를 생성해줘"라고 요청
3. 단계별로 기능 구현 요청
4. 코드 리뷰 및 최적화 요청

### 13.3 우선순위 개발 항목
1. 기본 Next.js + Express.js 프로젝트 구조
2. 데이터베이스 설계 및 Prisma 스키마
3. 사용자 인증 시스템
4. 파일 업로드 기능
5. AI 콘텐츠 생성 기능

---

**개발 시작 시 참고사항**
- 이 기획서는 Cursor AI에 최적화되어 작성되었습니다
- 각 기능별로 세분화하여 단계적으로 개발 요청하세요
- 코드 생성 후 반드시 테스트 및 검증 과정을 거치세요
- 보안 관련 설정은 개발 초기부터 적용하세요