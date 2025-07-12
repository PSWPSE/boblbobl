#!/bin/bash

# BlogCraft AI 간편 배포 스크립트
# 사용법: ./easy-deploy.sh [frontend|backend|all] [commit-message]

set -e

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# 로그 함수
log() {
    echo -e "${BLUE}[$(date +'%H:%M:%S')] $1${NC}"
}

success() {
    echo -e "${GREEN}[$(date +'%H:%M:%S')] ✅ $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%H:%M:%S')] ❌ $1${NC}"
}

warning() {
    echo -e "${YELLOW}[$(date +'%H:%M:%S')] ⚠️ $1${NC}"
}

info() {
    echo -e "${CYAN}[$(date +'%H:%M:%S')] 💡 $1${NC}"
}

# 배포 설정
DEPLOY_TYPE=${1:-all}
COMMIT_MESSAGE=${2:-"feat: 배포 업데이트"}

# 서비스 URL
BACKEND_URL="https://boblbobl-production.up.railway.app"
FRONTEND_URL="https://frontend-nr1wsn35d-dsvsdvsdvsds-projects.vercel.app"

# 배너 출력
print_banner() {
    echo -e "${PURPLE}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "🚀 BlogCraft AI 간편 배포 시스템"
    echo "배포 타입: $DEPLOY_TYPE"
    echo "커밋 메시지: $COMMIT_MESSAGE"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo -e "${NC}"
}

# 사전 검증
pre_check() {
    log "🔍 배포 전 사전 검증 시작..."
    
    # Git 상태 확인
    if ! git diff --quiet; then
        warning "변경사항이 있습니다. 스테이징을 진행합니다."
        git add .
    fi
    
    # CLI 도구 확인
    if ! command -v railway &> /dev/null; then
        error "Railway CLI가 설치되지 않았습니다."
        info "설치 명령어: npm install -g @railway/cli"
        exit 1
    fi
    
    if ! command -v vercel &> /dev/null; then
        error "Vercel CLI가 설치되지 않았습니다."
        info "설치 명령어: npm install -g vercel"
        exit 1
    fi
    
    success "사전 검증 완료"
}

# 백엔드 배포
deploy_backend() {
    log "🔧 백엔드 배포 시작..."
    
    cd backend
    
    # 타입 검사 및 빌드 테스트
    log "타입 검사 및 빌드 테스트 중..."
    npm run build
    
    # Railway 배포
    log "Railway에 배포 중..."
    railway up
    
    # 배포 완료 대기
    log "배포 완료 대기 중... (30초)"
    sleep 30
    
    cd ..
    success "백엔드 배포 완료"
}

# 프론트엔드 배포
deploy_frontend() {
    log "🎨 프론트엔드 배포 시작..."
    
    cd frontend
    
    # 타입 검사 및 린팅
    log "타입 검사 및 린팅 중..."
    npm run type-check
    npm run lint
    
    # Vercel 배포
    log "Vercel에 배포 중..."
    vercel --prod
    
    cd ..
    success "프론트엔드 배포 완료"
}

# 배포 후 검증
post_deploy_check() {
    log "🧪 배포 후 검증 시작..."
    
    # 백엔드 상태 확인
    log "백엔드 서비스 상태 확인 중..."
    if curl -s "$BACKEND_URL/health" > /dev/null; then
        success "✅ 백엔드 서비스 정상"
    else
        error "❌ 백엔드 서비스 오류"
        return 1
    fi
    
    # API 테스트
    log "API 연동 테스트 중..."
    local api_test=$(curl -s -X POST "$BACKEND_URL/api/content/generate/simple" \
        -H "Content-Type: application/json" \
        -d '{"type": "topic", "input": "배포 테스트", "style": "친근한", "length": "짧음"}' | jq -r '.success' 2>/dev/null)
    
    if [ "$api_test" = "true" ]; then
        success "✅ API 연동 정상"
    else
        warning "⚠️ API 연동 확인 필요"
    fi
    
    # 프론트엔드 상태 확인
    log "프론트엔드 서비스 상태 확인 중..."
    if curl -s -I "$FRONTEND_URL" > /dev/null 2>&1; then
        success "✅ 프론트엔드 서비스 정상"
    else
        warning "⚠️ 프론트엔드 서비스 확인 필요"
    fi
    
    success "배포 후 검증 완료"
}

# Git 커밋 및 푸시
git_commit_push() {
    log "📝 Git 커밋 및 푸시 중..."
    
    # 커밋
    if git diff --cached --quiet; then
        warning "커밋할 변경사항이 없습니다."
    else
        git commit -m "$COMMIT_MESSAGE"
        success "커밋 완료: $COMMIT_MESSAGE"
    fi
    
    # 푸시
    git push origin main
    success "Git 푸시 완료"
}

# 배포 완료 메시지
print_completion() {
    echo -e "${GREEN}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "🎉 배포 완료!"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo -e "${NC}"
    echo ""
    echo "📍 서비스 URL:"
    echo "   🔧 백엔드:  $BACKEND_URL"
    echo "   🎨 프론트엔드: $FRONTEND_URL"
    echo ""
    echo "🔗 모니터링:"
    echo "   📊 Railway:  https://railway.app/dashboard"
    echo "   📊 Vercel:   https://vercel.com/dashboard"
    echo ""
    echo "🚀 이제 웹사이트에서 새로운 업데이트를 확인하세요!"
}

# 에러 처리
handle_error() {
    error "배포 중 오류가 발생했습니다!"
    error "로그를 확인하고 문제를 해결해주세요."
    exit 1
}

# 롤백 스크립트 생성
create_rollback() {
    cat > rollback.sh << 'EOF'
#!/bin/bash
echo "⚠️ 이전 버전으로 롤백하시겠습니까? (y/N)"
read -r response
if [[ "$response" =~ ^[Yy]$ ]]; then
    echo "🔄 롤백 시작..."
    git reset --hard HEAD~1
    git push --force origin main
    echo "✅ 롤백 완료"
    echo "💡 서비스 재배포가 자동으로 시작됩니다."
else
    echo "❌ 롤백 취소"
fi
EOF
    chmod +x rollback.sh
    info "롤백 스크립트 생성: ./rollback.sh"
}

# 메인 실행 함수
main() {
    # 에러 트랩 설정
    trap handle_error ERR
    
    print_banner
    pre_check
    git_commit_push
    
    case $DEPLOY_TYPE in
        "frontend")
            deploy_frontend
            ;;
        "backend")
            deploy_backend
            ;;
        "all")
            deploy_backend
            deploy_frontend
            ;;
        *)
            error "잘못된 배포 타입: $DEPLOY_TYPE"
            echo "사용법: ./easy-deploy.sh [frontend|backend|all] [commit-message]"
            exit 1
            ;;
    esac
    
    post_deploy_check
    create_rollback
    print_completion
}

# 스크립트 실행
main "$@" 