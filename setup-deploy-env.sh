#!/bin/bash

# BlogCraft AI 배포 환경 변수 설정 스크립트
# 사용법: ./setup-deploy-env.sh

set -e

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 로그 함수
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

success() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] ✅ $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ❌ $1${NC}"
}

warning() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] ⚠️ $1${NC}"
}

# 프론트엔드 배포 환경 변수 설정
setup_frontend_env() {
    log "🔧 프론트엔드 배포 환경 변수 설정 중..."
    
    cd frontend
    
    # 프로덕션 환경 변수 파일 생성
    cat > .env.production << 'EOF'
# 프로덕션 환경 변수
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://your-backend-domain.railway.app
NEXT_PUBLIC_APP_URL=https://your-frontend-domain.vercel.app
EOF
    
    # 로컬 환경 변수 파일이 없으면 생성
    if [ ! -f ".env.local" ]; then
        cp .env.production .env.local
        warning "로컬 환경 변수 파일이 생성되었습니다. 필요에 따라 수정하세요."
    fi
    
    success "프론트엔드 환경 변수 설정 완료"
    cd ..
}

# 백엔드 배포 환경 변수 설정
setup_backend_env() {
    log "🔧 백엔드 배포 환경 변수 설정 중..."
    
    cd backend
    
    # 프로덕션 환경 변수 파일 생성
    cat > .env.production << 'EOF'
# 프로덕션 환경 변수
NODE_ENV=production
PORT=8000

# 데이터베이스 (기존 Railway PostgreSQL 사용)
DATABASE_URL="postgresql://postgres:TmdGFdaksSgPPbAsDsAnHlTDPpWjkqUu@shortline.proxy.rlwy.net:54002/railway"

# JWT 설정
JWT_SECRET=bdb892b35ec2e50210a14b87bc5a257d

# OpenAI API 설정
OPENAI_API_KEY=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

# 클라이언트 URL (프로덕션)
CLIENT_URL=https://your-frontend-domain.vercel.app

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
    
    # 로컬 환경 변수 파일이 없으면 생성
    if [ ! -f ".env" ]; then
        cp .env.production .env
        warning "로컬 환경 변수 파일이 생성되었습니다. 필요에 따라 수정하세요."
    fi
    
    success "백엔드 환경 변수 설정 완료"
    cd ..
}

# Railway 환경 변수 설정 안내
setup_railway_env() {
    log "🚂 Railway 환경 변수 설정 안내"
    
    echo ""
    echo "Railway 대시보드에서 다음 환경 변수를 설정하세요:"
    echo "https://railway.app/dashboard"
    echo ""
    echo "1. 프로젝트 선택 → Variables 탭"
    echo "2. 다음 환경 변수들을 추가:"
    echo ""
    echo "   NODE_ENV=production"
    echo "   DATABASE_URL=postgresql://postgres:TmdGFdaksSgPPbAsDsAnHlTDPpWjkqUu@shortline.proxy.rlwy.net:54002/railway"
    echo "   JWT_SECRET=bdb892b35ec2e50210a14b87bc5a257d"
    echo "   OPENAI_API_KEY=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"
    echo "   CLIENT_URL=https://your-frontend-domain.vercel.app"
    echo "   GOOGLE_CLIENT_ID=663459245926-s568h91gdsu8q33nks47l4umad616uu9.apps.googleusercontent.com"
    echo "   GOOGLE_CLIENT_SECRET=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"
    echo "   NAVER_CLIENT_ID=Ill7zizD7cfU7FiVwH74"
    echo "   NAVER_CLIENT_SECRET=e6MnDF8vxy"
    echo "   CLOUDINARY_CLOUD_NAME=dfrqgjdtd"
    echo "   CLOUDINARY_API_KEY=674531278499429"
    echo "   CLOUDINARY_API_SECRET=3s1ldvQ6qVAh7yOzsSmlf9aR2Sc"
    echo ""
    warning "배포 후 CLIENT_URL을 실제 프론트엔드 도메인으로 업데이트하세요!"
}

# Vercel 환경 변수 설정 안내
setup_vercel_env() {
    log "▲ Vercel 환경 변수 설정 안내"
    
    echo ""
    echo "Vercel 대시보드에서 다음 환경 변수를 설정하세요:"
    echo "https://vercel.com/dashboard"
    echo ""
    echo "1. 프로젝트 선택 → Settings → Environment Variables"
    echo "2. 다음 환경 변수들을 추가:"
    echo ""
    echo "   NEXT_PUBLIC_API_URL=https://your-backend-domain.railway.app"
    echo "   NEXT_PUBLIC_APP_URL=https://your-frontend-domain.vercel.app"
    echo ""
    warning "배포 후 실제 도메인으로 업데이트하세요!"
}

# GitHub Secrets 설정 안내
setup_github_secrets() {
    log "🔐 GitHub Secrets 설정 안내"
    
    echo ""
    echo "GitHub 저장소에서 다음 Secrets를 설정하세요:"
    echo "Repository → Settings → Secrets and variables → Actions"
    echo ""
    echo "1. Railway 관련:"
    echo "   RAILWAY_TOKEN: Railway 계정의 API 토큰"
    echo "   RAILWAY_SERVICE_ID: Railway 서비스 ID"
    echo ""
    echo "2. Vercel 관련:"
    echo "   VERCEL_TOKEN: Vercel 계정의 API 토큰"
    echo "   VERCEL_ORG_ID: Vercel 조직 ID"
    echo "   VERCEL_PROJECT_ID: Vercel 프로젝트 ID"
    echo ""
    echo "Railway 토큰 생성: https://railway.app/dashboard/account/tokens"
    echo "Vercel 토큰 생성: https://vercel.com/account/tokens"
}

# 메인 실행
main() {
    log "🚀 BlogCraft AI 배포 환경 설정 시작..."
    
    setup_frontend_env
    setup_backend_env
    setup_railway_env
    setup_vercel_env
    setup_github_secrets
    
    success "🎉 배포 환경 설정 완료!"
    echo ""
    echo "다음 단계:"
    echo "1. Railway와 Vercel 대시보드에서 환경 변수 설정"
    echo "2. GitHub Secrets 설정"
    echo "3. CLI 도구 설치 (railway, vercel)"
    echo "4. 배포 실행: ./deploy.sh"
}

# 스크립트 실행
main "$@" 