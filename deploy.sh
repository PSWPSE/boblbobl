#!/bin/bash

# BlogCraft AI 배포 스크립트
# 사용법: ./deploy.sh [frontend|backend|all]

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

# 환경 변수 확인
check_env() {
    local env_file=$1
    if [ ! -f "$env_file" ]; then
        error "환경 변수 파일을 찾을 수 없습니다: $env_file"
        return 1
    fi
    success "환경 변수 파일 확인: $env_file"
}

# 백엔드 배포
deploy_backend() {
    log "🚀 백엔드 배포 시작..."
    
    cd backend
    
    # 환경 변수 확인
    check_env ".env"
    
    # 의존성 설치
    log "📦 의존성 설치 중..."
    npm ci
    
    # 타입 검사
    log "🔍 타입 검사 중..."
    npm run build
    
    # 데이터베이스 마이그레이션
    log "🗄️ 데이터베이스 마이그레이션 중..."
    npx prisma generate
    npx prisma db push
    
    # Railway 배포
    log "🚂 Railway 배포 중..."
    if command -v railway &> /dev/null; then
        railway up
        success "백엔드 배포 완료!"
    else
        warning "Railway CLI가 설치되지 않았습니다. 수동으로 배포하세요."
        log "Railway CLI 설치: npm install -g @railway/cli"
    fi
    
    cd ..
}

# 프론트엔드 배포
deploy_frontend() {
    log "🚀 프론트엔드 배포 시작..."
    
    cd frontend
    
    # 환경 변수 확인
    check_env ".env.local"
    
    # 의존성 설치
    log "📦 의존성 설치 중..."
    npm ci
    
    # 타입 검사
    log "🔍 타입 검사 중..."
    npm run type-check
    
    # 린팅
    log "🧹 린팅 중..."
    npm run lint
    
    # 빌드
    log "🏗️ 빌드 중..."
    npm run build
    
    # Vercel 배포
    log "▲ Vercel 배포 중..."
    if command -v vercel &> /dev/null; then
        vercel --prod
        success "프론트엔드 배포 완료!"
    else
        warning "Vercel CLI가 설치되지 않았습니다. 수동으로 배포하세요."
        log "Vercel CLI 설치: npm install -g vercel"
    fi
    
    cd ..
}

# 모든 것 배포
deploy_all() {
    log "🚀 전체 배포 시작..."
    deploy_backend
    deploy_frontend
    success "🎉 전체 배포 완료!"
}

# 헬프 메시지
show_help() {
    echo "BlogCraft AI 배포 스크립트"
    echo ""
    echo "사용법: ./deploy.sh [옵션]"
    echo ""
    echo "옵션:"
    echo "  frontend    프론트엔드만 배포"
    echo "  backend     백엔드만 배포"
    echo "  all         전체 배포 (기본값)"
    echo "  help        이 도움말 표시"
    echo ""
    echo "예시:"
    echo "  ./deploy.sh              # 전체 배포"
    echo "  ./deploy.sh frontend     # 프론트엔드만 배포"
    echo "  ./deploy.sh backend      # 백엔드만 배포"
}

# 메인 실행
main() {
    case ${1:-all} in
        frontend)
            deploy_frontend
            ;;
        backend)
            deploy_backend
            ;;
        all)
            deploy_all
            ;;
        help)
            show_help
            ;;
        *)
            error "알 수 없는 옵션: $1"
            show_help
            exit 1
            ;;
    esac
}

# 스크립트 실행
main "$@" 