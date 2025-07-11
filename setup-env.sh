#!/bin/bash

# BlogCraft AI 환경변수 자동 설정 스크립트
# 사용법: ./setup-env.sh

echo "🛠️  BlogCraft AI 환경변수 자동 설정 시작..."

# 백엔드 환경변수 생성
echo "📁 백엔드 환경변수 파일 확인 중..."
cd /Users/alphabridge/BOBLBOBL/backend
if [ ! -f .env ]; then
    cat > .env << 'EOF'
# JWT 설정
JWT_SECRET=bdb892b35ec2e50210a14b87bc5a257d

# 데이터베이스 설정
DATABASE_URL="postgresql://postgres:TmdGFdaksSgPPbAsDsAnHlTDPpWjkqUu@shortline.proxy.rlwy.net:54002/railway"

# OpenAI API 설정
OPENAI_API_KEY=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

# 클라이언트 URL
CLIENT_URL=http://localhost:3000

# Google OAuth 설정
GOOGLE_CLIENT_ID=663459245926-s568h91gdsu8q33nks47l4umad616uu9.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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

# Naver OAuth 설정
NAVER_CLIENT_ID=Ill7zizD7cfU7FiVwH74
NAVER_CLIENT_SECRET=e6MnDF8vxy

# Cloudinary 설정
CLOUDINARY_CLOUD_NAME=dfrqgjdtd
CLOUDINARY_API_KEY=674531278499429
CLOUDINARY_API_SECRET=3s1ldvQ6qVAh7yOzsSmlf9aR2Sc
EOF
    echo "✅ 백엔드 .env 파일 생성 완료"
else
    echo "✅ 백엔드 .env 파일 이미 존재"
fi

# 프론트엔드 환경변수 생성
echo "📁 프론트엔드 환경변수 파일 확인 중..."
cd /Users/alphabridge/BOBLBOBL/frontend
if [ ! -f .env.local ]; then
    cat > .env.local << 'EOF'
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_CLIENT_URL=http://localhost:3000
EOF
    echo "✅ 프론트엔드 .env.local 파일 생성 완료"
else
    echo "✅ 프론트엔드 .env.local 파일 이미 존재"
fi

# 데이터베이스 연결 확인
echo "🔍 데이터베이스 연결 확인 중..."
cd /Users/alphabridge/BOBLBOBL/backend
npx prisma db push > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✅ 데이터베이스 연결 정상"
else
    echo "❌ 데이터베이스 연결 문제 - 수동 확인 필요"
fi

echo "🎉 환경변수 설정 완료!"
echo "📍 이제 서버를 시작할 수 있습니다:"
echo "   백엔드: cd backend && npm run dev"
echo "   프론트엔드: cd frontend && npm run dev" 