# 🚀 BlogCraft AI 배포 가이드

본 가이드는 BlogCraft AI 서비스를 안정적이고 편리하게 배포하는 방법을 안내합니다.

## 📋 배포 구조

- **백엔드**: Railway (Express.js + PostgreSQL)
- **프론트엔드**: Vercel (Next.js 15)
- **데이터베이스**: Railway PostgreSQL
- **자동화**: GitHub Actions CI/CD

## 🔧 사전 준비

### 1. 필수 도구 설치

```bash
# Railway CLI 설치
npm install -g @railway/cli

# Vercel CLI 설치
npm install -g vercel

# 설치 확인
railway --version
vercel --version
```

### 2. 계정 설정

1. **Railway 계정**: https://railway.app
2. **Vercel 계정**: https://vercel.com
3. **GitHub 계정**: https://github.com

## 🚀 배포 실행

### 1단계: 환경 변수 설정

```bash
# 배포 환경 설정 실행
./setup-deploy-env.sh
```

### 2단계: Railway 백엔드 배포

#### 2-1. Railway 프로젝트 생성

```bash
cd backend
railway login
railway init
```

#### 2-2. 환경 변수 설정

Railway 대시보드에서 환경 변수 설정:

```env
NODE_ENV=production
DATABASE_URL=postgresql://postgres:TmdGFdaksSgPPbAsDsAnHlTDPpWjkqUu@shortline.proxy.rlwy.net:54002/railway
JWT_SECRET=bdb892b35ec2e50210a14b87bc5a257d
OPENAI_API_KEY=your-openai-api-key
CLIENT_URL=https://your-frontend-domain.vercel.app
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
NAVER_CLIENT_ID=Ill7zizD7cfU7FiVwH74
NAVER_CLIENT_SECRET=e6MnDF8vxy
CLOUDINARY_CLOUD_NAME=dfrqgjdtd
CLOUDINARY_API_KEY=674531278499429
CLOUDINARY_API_SECRET=3s1ldvQ6qVAh7yOzsSmlf9aR2Sc
```

#### 2-3. 백엔드 배포

```bash
# 수동 배포
railway up

# 또는 배포 스크립트 사용
./deploy.sh backend
```

### 3단계: Vercel 프론트엔드 배포

#### 3-1. Vercel 프로젝트 생성

```bash
cd frontend
vercel login
vercel
```

#### 3-2. 환경 변수 설정

Vercel 대시보드에서 환경 변수 설정:

```env
NEXT_PUBLIC_API_URL=https://your-backend-domain.railway.app
NEXT_PUBLIC_APP_URL=https://your-frontend-domain.vercel.app
```

#### 3-3. 프론트엔드 배포

```bash
# 수동 배포
vercel --prod

# 또는 배포 스크립트 사용
./deploy.sh frontend
```

### 4단계: 도메인 연결

1. **Railway 도메인**: Railway 대시보드에서 커스텀 도메인 설정
2. **Vercel 도메인**: Vercel 대시보드에서 커스텀 도메인 설정

### 5단계: 환경 변수 업데이트

배포 후 실제 도메인으로 환경 변수 업데이트:

```bash
# Railway에서 CLIENT_URL 업데이트
# Vercel에서 NEXT_PUBLIC_API_URL과 NEXT_PUBLIC_APP_URL 업데이트
```

## 🔄 자동 배포 설정

### 1. GitHub Secrets 설정

Repository → Settings → Secrets and variables → Actions

```env
# Railway 관련
RAILWAY_TOKEN=your_railway_token
RAILWAY_SERVICE_ID=your_service_id

# Vercel 관련
VERCEL_TOKEN=your_vercel_token
VERCEL_ORG_ID=your_org_id
VERCEL_PROJECT_ID=your_project_id
```

### 2. GitHub Actions 워크플로우

`.github/workflows/deploy.yml` 파일이 자동으로 다음을 실행:

1. **테스트**: 타입 검사, 린팅
2. **백엔드 배포**: Railway 자동 배포
3. **프론트엔드 배포**: Vercel 자동 배포

### 3. 자동 배포 트리거

```bash
# main 브랜치에 push하면 자동 배포
git add .
git commit -m "feat: 새로운 기능 추가"
git push origin main
```

## 🛠️ 업데이트 프로세스

### 로컬 개발 → 배포 워크플로우

1. **로컬 개발**
   ```bash
   # 백엔드 개발
   cd backend && npm run dev
   
   # 프론트엔드 개발
   cd frontend && npm run dev
   ```

2. **테스트**
   ```bash
   # 백엔드 테스트
   cd backend && npm run build
   
   # 프론트엔드 테스트
   cd frontend && npm run type-check && npm run lint
   ```

3. **배포**
   ```bash
   # 자동 배포 (권장)
   git add .
   git commit -m "feat: 새로운 기능"
   git push origin main
   
   # 수동 배포
   ./deploy.sh all
   ```

### 핫픽스 배포

긴급 수정사항 배포:

```bash
# 백엔드만 배포
./deploy.sh backend

# 프론트엔드만 배포
./deploy.sh frontend
```

## 🔍 모니터링 및 로그

### Railway 모니터링

1. **대시보드**: https://railway.app/dashboard
2. **로그 확인**: 프로젝트 → Deployments → 로그 탭
3. **메트릭**: CPU, 메모리, 네트워크 사용량

### Vercel 모니터링

1. **대시보드**: https://vercel.com/dashboard
2. **함수 로그**: 프로젝트 → Functions → 로그 탭
3. **Analytics**: 방문자 통계, 성능 메트릭

## 🚨 문제 해결

### 백엔드 문제

```bash
# 로그 확인
railway logs

# 환경 변수 확인
railway variables

# 데이터베이스 연결 확인
railway run npx prisma studio
```

### 프론트엔드 문제

```bash
# 로그 확인
vercel logs

# 환경 변수 확인
vercel env ls

# 로컬 빌드 테스트
npm run build
```

### 데이터베이스 문제

```bash
# 마이그레이션 확인
npx prisma db push

# 데이터베이스 리셋 (주의!)
npx prisma db reset
```

## 🔐 보안 고려사항

### 환경 변수 관리

- ✅ 절대 `.env` 파일을 커밋하지 않음
- ✅ 프로덕션 환경변수는 플랫폼 대시보드에서 관리
- ✅ API 키는 정기적으로 교체

### HTTPS 설정

- ✅ Railway, Vercel 모두 자동 HTTPS 제공
- ✅ 커스텀 도메인도 자동 SSL 인증서 발급

### CORS 설정

백엔드에서 프론트엔드 도메인만 허용:

```javascript
// backend/src/index.ts
const corsOptions = {
  origin: [
    'http://localhost:3000',
    'https://your-frontend-domain.vercel.app'
  ],
  credentials: true
};
```

## 📊 성능 최적화

### 백엔드 최적화

- **데이터베이스 인덱스**: 자주 조회되는 필드에 인덱스 추가
- **Redis 캐싱**: 자주 조회되는 데이터 캐싱
- **CDN**: 이미지 파일은 Cloudinary CDN 사용

### 프론트엔드 최적화

- **Next.js 이미지 최적화**: `next/image` 사용
- **코드 스플리팅**: 동적 임포트 활용
- **SEO 최적화**: 메타 태그, 구조화된 데이터

## 🎯 배포 체크리스트

### 초기 배포

- [ ] Railway 계정 생성 및 프로젝트 설정
- [ ] Vercel 계정 생성 및 프로젝트 설정
- [ ] GitHub Secrets 설정
- [ ] 환경 변수 설정
- [ ] 도메인 연결
- [ ] SSL 인증서 확인
- [ ] 데이터베이스 마이그레이션
- [ ] 기본 기능 테스트

### 업데이트 배포

- [ ] 로컬 테스트 완료
- [ ] 타입 검사 통과
- [ ] 린팅 통과
- [ ] 빌드 성공
- [ ] 환경 변수 업데이트 (필요시)
- [ ] 배포 후 기능 테스트
- [ ] 로그 확인

## 💡 Tips

1. **브랜치 전략**: `main`은 항상 배포 가능한 상태 유지
2. **환경 분리**: 개발/스테이징/프로덕션 환경 분리
3. **백업**: 정기적 데이터베이스 백업
4. **모니터링**: 에러 트래킹 도구 (Sentry) 고려
5. **성능**: 정기적 성능 테스트 및 최적화

## 🆘 도움이 필요한 경우

1. **Railway 문서**: https://docs.railway.app
2. **Vercel 문서**: https://vercel.com/docs
3. **Next.js 문서**: https://nextjs.org/docs
4. **Prisma 문서**: https://www.prisma.io/docs 