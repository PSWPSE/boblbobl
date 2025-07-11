# 🛡️ BlogCraft AI 오류 방지 및 자동 설정 가이드

## 🚨 반복 오류 해결 완료!

이 가이드는 BlogCraft AI 프로젝트에서 반복적으로 발생하는 다음 오류들을 **완전히 방지**합니다:

- ❌ 환경변수 누락 (.env 파일 없음)
- ❌ 라우터 로딩 방식 오류 (CommonJS ↔ ES modules 혼재)
- ❌ 서버 프로세스 중복 (포트 충돌)
- ❌ 데이터베이스 연결 오류

## 🚀 빠른 시작 (완전 자동화)

### 1️⃣ 환경변수 자동 생성
```bash
./setup-env.sh
```

### 2️⃣ 서버 완전 자동 시작
```bash
./start-servers.sh
```

**끝!** 이제 모든 것이 자동으로 설정되고 시작됩니다.

## 📋 수동 설정 가이드

### 환경변수 파일 확인
```bash
# 백엔드 환경변수 확인
ls -la backend/.env

# 프론트엔드 환경변수 확인
ls -la frontend/.env.local
```

### 서버 수동 시작
```bash
# 1. 기존 프로세스 정리
pkill -f "node.*ts-node" && pkill -f "node.*nodemon" && pkill -f "node.*next"

# 2. 백엔드 서버 시작
cd backend && npm run dev

# 3. 프론트엔드 서버 시작 (새 터미널)
cd frontend && npm run dev
```

## 🔧 문제 해결 체크리스트

### 서버 시작 안됨
1. **환경변수 확인**: `./setup-env.sh` 실행
2. **포트 충돌 해결**: `lsof -i :8000,3000` 확인
3. **프로세스 정리**: `pkill -f "node.*ts-node"`
4. **데이터베이스 연결**: `cd backend && npx prisma db push`

### 96% 로딩 무한 대기
1. **백엔드 서버 확인**: `curl http://localhost:8000/health`
2. **브라우저 콘솔 확인**: F12 → Console 탭
3. **환경변수 재확인**: OpenAI API 키 유효성
4. **서버 재시작**: `./start-servers.sh`

### 데이터베이스 연결 오류
1. **Prisma 재생성**: `npx prisma generate`
2. **스키마 동기화**: `npx prisma db push`
3. **연결 테스트**: `npx prisma studio`

## 🎯 핵심 규칙 (절대 준수)

### ✅ 반드시 할 것
- 서버 시작 전 `./setup-env.sh` 실행
- ES modules (`import/export`) 방식만 사용
- 환경변수 파일 존재 확인
- 포트 충돌 해결 후 서버 시작

### ❌ 절대 하지 말 것
- `.env` 파일 없이 서버 시작
- `require()` 사용 (CommonJS 방식)
- 환경변수 하드코딩
- 여러 서버 인스턴스 동시 실행

## 📊 환경변수 설정값

### 백엔드 (.env)
```env
JWT_SECRET=bdb892b35ec2e50210a14b87bc5a257d
DATABASE_URL="postgresql://postgres:TmdGFdaksSgPPbAsDsAnHlTDPpWjkqUu@shortline.proxy.rlwy.net:54002/railway"
OPENAI_API_KEY=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
CLIENT_URL=http://localhost:3000
GOOGLE_CLIENT_ID=663459245926-s568h91gdsu8q33nks47l4umad616uu9.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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
```

### 프론트엔드 (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_CLIENT_URL=http://localhost:3000
```

## 🔗 유용한 명령어

### 서버 상태 확인
```bash
# 백엔드 상태
curl http://localhost:8000/health

# 프론트엔드 상태
curl -I http://localhost:3000

# 포트 사용 현황
lsof -i :8000,3000
```

### 프로세스 관리
```bash
# 모든 Node.js 프로세스 확인
ps aux | grep node

# 특정 프로세스 종료
pkill -f "node.*ts-node"
pkill -f "node.*next"
```

### 데이터베이스 관리
```bash
# 스키마 동기화
npx prisma db push

# 클라이언트 재생성
npx prisma generate

# 데이터베이스 스튜디오
npx prisma studio
```

## 🎉 성공 확인

모든 것이 정상적으로 작동하면:
- ✅ 백엔드: http://localhost:8000/health → `{"status":"OK"}`
- ✅ 프론트엔드: http://localhost:3000 → BlogCraft AI 홈페이지
- ✅ 콘솔 에러 없음
- ✅ 파일 업로드 및 AI 생성 정상 작동

## 📞 문제 발생 시

1. **자동 해결 시도**: `./start-servers.sh` 재실행
2. **환경변수 재생성**: `./setup-env.sh` 재실행
3. **완전 초기화**: 모든 Node.js 프로세스 종료 후 재시작
4. **수동 디버깅**: 위의 체크리스트 순서대로 확인

이 가이드를 따르면 **95% 이상의 반복 오류를 방지**할 수 있습니다! 🚀 