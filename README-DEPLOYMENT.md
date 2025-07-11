# 🚀 BlogCraft AI 배포 시스템

BlogCraft AI 서비스를 안정적이고 편리하게 배포하기 위한 완전한 배포 시스템입니다.

## 🏗️ 배포 구조

```
📦 BlogCraft AI
├── 🌐 프론트엔드: Vercel (Next.js 15)
├── 🗄️ 백엔드: Railway (Express.js)
├── 📊 데이터베이스: Railway PostgreSQL
├── 🔄 자동화: GitHub Actions CI/CD
└── 🐳 Docker: 대안 배포 옵션
```

## 🚀 빠른 시작

### 1. 환경 설정
```bash
# 배포 환경 설정
./setup-deploy-env.sh

# CLI 도구 설치
npm install -g @railway/cli vercel
```

### 2. 빠른 배포
```bash
# 한 번에 배포 (권장)
./quick-deploy.sh "feat: 새로운 기능"

# 또는 단계별 배포
./deploy.sh all
```

### 3. 자동 배포
```bash
# main 브랜치에 push하면 자동 배포
git add .
git commit -m "feat: 새로운 기능"
git push origin main
```

## 📋 배포 스크립트

### 🔧 setup-deploy-env.sh
배포 환경 변수와 설정 파일을 자동으로 생성합니다.

```bash
./setup-deploy-env.sh
```

### 🚀 deploy.sh
선택적 배포를 수행합니다.

```bash
./deploy.sh all        # 전체 배포
./deploy.sh backend    # 백엔드만
./deploy.sh frontend   # 프론트엔드만
```

### ⚡ quick-deploy.sh
테스트부터 배포까지 한 번에 실행합니다.

```bash
./quick-deploy.sh "커밋 메시지"
```

## 🔄 배포 옵션

### 1. 클라우드 배포 (권장)
- **백엔드**: Railway
- **프론트엔드**: Vercel
- **자동화**: GitHub Actions

### 2. Docker 배포
```bash
# 전체 스택 실행
docker-compose up -d

# 개별 서비스 실행
docker-compose up -d backend
docker-compose up -d frontend
```

### 3. 수동 배포
```bash
# 백엔드 (Railway)
cd backend
railway up

# 프론트엔드 (Vercel)
cd frontend
vercel --prod
```

## 🛠️ 업데이트 워크플로우

### 로컬 개발 → 배포
```bash
# 1. 로컬 개발
npm run dev

# 2. 테스트
npm run build
npm run type-check
npm run lint

# 3. 배포
./quick-deploy.sh "변경사항 설명"
```

### 핫픽스 배포
```bash
# 긴급 수정사항
./deploy.sh backend   # 백엔드만 빠르게 배포
./deploy.sh frontend  # 프론트엔드만 빠르게 배포
```

## 🔍 모니터링

### 배포 상태 확인
- **GitHub Actions**: https://github.com/your-repo/actions
- **Railway**: https://railway.app/dashboard
- **Vercel**: https://vercel.com/dashboard

### 로그 확인
```bash
# Railway 로그
railway logs

# Vercel 로그
vercel logs

# Docker 로그
docker-compose logs -f
```

## 🚨 문제 해결

### 배포 실패 시
```bash
# 로그 확인
railway logs
vercel logs

# 환경 변수 확인
railway variables
vercel env ls

# 롤백
./rollback.sh
```

### 데이터베이스 문제
```bash
# 마이그레이션 재실행
npx prisma db push

# 스키마 재생성
npx prisma generate
```

## 🔐 보안 설정

### 환경 변수 관리
- ✅ 로컬: `.env` 파일 (gitignore)
- ✅ Railway: 대시보드 Variables
- ✅ Vercel: 대시보드 Environment Variables
- ✅ GitHub: Repository Secrets

### 필수 환경 변수
```env
# 백엔드
DATABASE_URL=postgresql://...
JWT_SECRET=your-jwt-secret
OPENAI_API_KEY=sk-...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...

# 프론트엔드
NEXT_PUBLIC_API_URL=https://your-backend.railway.app
NEXT_PUBLIC_APP_URL=https://your-frontend.vercel.app
```

## 📊 성능 최적화

### 자동 최적화
- ✅ Next.js 이미지 최적화
- ✅ 코드 스플리팅
- ✅ API 응답 캐싱
- ✅ CDN 활용 (Cloudinary)

### 모니터링
- ✅ Railway 메트릭
- ✅ Vercel Analytics
- ✅ GitHub Actions 워크플로우

## 🎯 배포 체크리스트

### 초기 설정
- [ ] Railway 계정 생성
- [ ] Vercel 계정 생성
- [ ] GitHub Secrets 설정
- [ ] CLI 도구 설치
- [ ] 환경 변수 설정

### 배포 전 체크
- [ ] 로컬 테스트 완료
- [ ] 타입 검사 통과
- [ ] 린팅 통과
- [ ] 빌드 성공

### 배포 후 체크
- [ ] 서비스 접속 확인
- [ ] 주요 기능 테스트
- [ ] 로그 확인
- [ ] 성능 확인

## 💡 사용 팁

### 1. 개발 효율성
```bash
# 개발 시 실시간 반영
npm run dev

# 빌드 확인
npm run build
```

### 2. 배포 효율성
```bash
# 빠른 배포
./quick-deploy.sh "변경사항"

# 단계별 배포
./deploy.sh frontend
```

### 3. 디버깅
```bash
# 로그 실시간 확인
railway logs --tail
vercel logs --tail

# 환경 변수 확인
railway variables
vercel env ls
```

## 🆘 지원

### 문서
- [배포 가이드](./DEPLOYMENT-GUIDE.md)
- [Railway 문서](https://docs.railway.app)
- [Vercel 문서](https://vercel.com/docs)

### 문제 해결
1. 로그 확인
2. 환경 변수 확인
3. 네트워크 연결 확인
4. 서비스 상태 확인

---

## 📱 빠른 참조

| 명령어 | 설명 |
|--------|------|
| `./quick-deploy.sh` | 빠른 배포 |
| `./deploy.sh all` | 전체 배포 |
| `./deploy.sh backend` | 백엔드만 |
| `./deploy.sh frontend` | 프론트엔드만 |
| `./setup-deploy-env.sh` | 환경 설정 |
| `./rollback.sh` | 롤백 |
| `docker-compose up -d` | Docker 실행 |

**🎉 이제 BlogCraft AI를 안정적이고 편리하게 배포할 수 있습니다!** 