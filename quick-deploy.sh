#!/bin/bash

# BlogCraft AI 빠른 배포 스크립트
# 사용법: ./quick-deploy.sh [commit message]

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

# 커밋 메시지 설정
COMMIT_MESSAGE=${1:-"feat: 빠른 배포"}

# 사전 검사
pre_check() {
    log "🔍 배포 전 검사 시작..."
    
    # Git 상태 확인
    if ! git diff --quiet; then
        warning "변경사항이 있습니다. 커밋을 진행합니다."
    fi
    
    # 백엔드 타입 검사
    log "🔍 백엔드 타입 검사 중..."
    cd backend
    npm run build
    cd ..
    
    # 프론트엔드 타입 검사
    log "🔍 프론트엔드 타입 검사 중..."
    cd frontend
    npm run type-check
    npm run lint
    cd ..
    
    success "사전 검사 완료"
}

# Git 커밋 및 푸시
git_deploy() {
    log "📝 Git 커밋 및 푸시 중..."
    
    # 스테이징
    git add .
    
    # 커밋
    git commit -m "$COMMIT_MESSAGE" || {
        warning "커밋할 변경사항이 없습니다."
        return 0
    }
    
    # 푸시
    git push origin main
    
    success "Git 푸시 완료"
}

# 수동 배포 (필요시)
manual_deploy() {
    log "🚀 수동 배포 시작..."
    
    # 백엔드 배포
    if command -v railway &> /dev/null; then
        log "🚂 Railway 백엔드 배포 중..."
        cd backend
        railway up
        cd ..
        success "백엔드 배포 완료"
    else
        warning "Railway CLI가 없습니다. GitHub Actions를 통해 배포됩니다."
    fi
    
    # 프론트엔드 배포
    if command -v vercel &> /dev/null; then
        log "▲ Vercel 프론트엔드 배포 중..."
        cd frontend
        vercel --prod
        cd ..
        success "프론트엔드 배포 완료"
    else
        warning "Vercel CLI가 없습니다. GitHub Actions를 통해 배포됩니다."
    fi
}

# 배포 상태 확인
check_deployment() {
    log "🔍 배포 상태 확인 중..."
    
    # GitHub Actions 상태 확인 (gh CLI가 있는 경우)
    if command -v gh &> /dev/null; then
        log "GitHub Actions 워크플로우 상태 확인 중..."
        gh workflow view --web || true
    else
        log "GitHub Actions 상태는 웹에서 확인하세요: https://github.com/your-repo/actions"
    fi
    
    # 배포 완료 대기
    log "⏳ 배포 완료를 기다리는 중... (약 3-5분 소요)"
    sleep 30
    
    success "배포 상태 확인 완료"
}

# 배포 후 테스트
post_deploy_test() {
    log "🧪 배포 후 테스트 중..."
    
    # 실제 도메인이 설정되어 있다면 테스트
    # 여기서는 예시로 localhost 테스트
    
    echo "배포 후 다음 사항을 확인해주세요:"
    echo "1. 백엔드 상태: https://your-backend-domain.railway.app/health"
    echo "2. 프론트엔드 상태: https://your-frontend-domain.vercel.app"
    echo "3. 로그인 기능 테스트"
    echo "4. 주요 기능 테스트"
    
    success "배포 후 테스트 안내 완료"
}

# 롤백 준비
prepare_rollback() {
    log "🔄 롤백 준비 중..."
    
    # 현재 커밋 해시 저장
    CURRENT_COMMIT=$(git rev-parse HEAD)
    echo "현재 커밋: $CURRENT_COMMIT"
    
    # 롤백 스크립트 생성
    cat > rollback.sh << EOF
#!/bin/bash
echo "이전 커밋으로 롤백하시겠습니까? (y/N)"
read -r response
if [[ "\$response" =~ ^[Yy]$ ]]; then
    git reset --hard HEAD~1
    git push --force origin main
    echo "롤백 완료"
else
    echo "롤백 취소"
fi
EOF
    
    chmod +x rollback.sh
    success "롤백 준비 완료 (./rollback.sh로 실행)"
}

# 헬프 메시지
show_help() {
    echo "BlogCraft AI 빠른 배포 스크립트"
    echo ""
    echo "사용법: ./quick-deploy.sh [커밋 메시지]"
    echo ""
    echo "기능:"
    echo "  - 자동 테스트 (타입 검사, 린팅)"
    echo "  - Git 커밋 및 푸시"
    echo "  - 자동 배포 (GitHub Actions)"
    echo "  - 수동 배포 옵션 (CLI 도구 필요)"
    echo "  - 배포 상태 확인"
    echo "  - 롤백 준비"
    echo ""
    echo "예시:"
    echo "  ./quick-deploy.sh                        # 기본 메시지로 배포"
    echo "  ./quick-deploy.sh \"feat: 새로운 기능\"     # 커스텀 메시지로 배포"
    echo "  ./quick-deploy.sh \"fix: 버그 수정\"       # 버그 수정 배포"
}

# 메인 실행
main() {
    if [[ "$1" == "help" || "$1" == "--help" || "$1" == "-h" ]]; then
        show_help
        exit 0
    fi
    
    log "🚀 BlogCraft AI 빠른 배포 시작..."
    log "커밋 메시지: $COMMIT_MESSAGE"
    
    # 배포 프로세스 실행
    pre_check
    git_deploy
    
    # 사용자 선택: 수동 배포 여부
    echo ""
    echo "GitHub Actions가 자동으로 배포를 진행합니다."
    echo "수동 배포도 함께 실행하시겠습니까? (y/N)"
    read -r response
    if [[ "$response" =~ ^[Yy]$ ]]; then
        manual_deploy
    fi
    
    check_deployment
    post_deploy_test
    prepare_rollback
    
    success "🎉 빠른 배포 완료!"
    echo ""
    echo "배포 상태:"
    echo "  - GitHub Actions: https://github.com/your-repo/actions"
    echo "  - Railway: https://railway.app/dashboard"
    echo "  - Vercel: https://vercel.com/dashboard"
    echo ""
    echo "문제 발생 시 ./rollback.sh 실행으로 롤백하세요."
}

# 에러 처리
trap 'error "배포 중 오류가 발생했습니다. 로그를 확인해주세요."' ERR

# 스크립트 실행
main "$@" 