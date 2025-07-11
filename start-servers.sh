#!/bin/bash

# BlogCraft AI 완전 자동 서버 시작 스크립트
# 사용법: ./start-servers.sh

echo "🚀 BlogCraft AI 서버 자동 시작 중..."

# 1. 기존 프로세스 정리
echo "🔄 기존 프로세스 정리 중..."
pkill -f "node.*ts-node" 2>/dev/null
pkill -f "node.*nodemon" 2>/dev/null
pkill -f "node.*next" 2>/dev/null
sleep 3

# 2. 환경변수 파일 확인 및 생성
echo "📁 환경변수 파일 확인 중..."
./setup-env.sh

# 3. 포트 충돌 해결
echo "🔍 포트 충돌 확인 중..."
if lsof -i :8000 > /dev/null 2>&1; then
    echo "⚠️  포트 8000 사용 중. 프로세스 종료 중..."
    lsof -ti :8000 | xargs kill -9 2>/dev/null
    sleep 2
fi

if lsof -i :3000 > /dev/null 2>&1; then
    echo "⚠️  포트 3000 사용 중. 프로세스 종료 중..."
    lsof -ti :3000 | xargs kill -9 2>/dev/null
    sleep 2
fi

# 4. 백엔드 서버 시작
echo "🔧 백엔드 서버 시작 중..."
cd /Users/alphabridge/BOBLBOBL/backend
npm run dev &
BACKEND_PID=$!
echo "백엔드 PID: $BACKEND_PID"

# 5. 백엔드 서버 상태 확인 (최대 30초 대기)
echo "⏳ 백엔드 서버 시작 대기 중..."
for i in {1..30}; do
    if curl -s http://localhost:8000/health > /dev/null 2>&1; then
        echo "✅ 백엔드 서버 시작 성공 (${i}초 소요)"
        break
    fi
    echo "대기 중... (${i}/30)"
    sleep 1
done

# 백엔드 서버 시작 실패 시 종료
if ! curl -s http://localhost:8000/health > /dev/null 2>&1; then
    echo "❌ 백엔드 서버 시작 실패"
    kill $BACKEND_PID 2>/dev/null
    exit 1
fi

# 6. 프론트엔드 서버 시작
echo "🎨 프론트엔드 서버 시작 중..."
cd /Users/alphabridge/BOBLBOBL/frontend
npm run dev &
FRONTEND_PID=$!
echo "프론트엔드 PID: $FRONTEND_PID"

# 7. 프론트엔드 서버 상태 확인 (최대 30초 대기)
echo "⏳ 프론트엔드 서버 시작 대기 중..."
for i in {1..30}; do
    if curl -s -I http://localhost:3000 > /dev/null 2>&1; then
        echo "✅ 프론트엔드 서버 시작 성공 (${i}초 소요)"
        break
    fi
    echo "대기 중... (${i}/30)"
    sleep 1
done

# 프론트엔드 서버 시작 실패 시 경고
if ! curl -s -I http://localhost:3000 > /dev/null 2>&1; then
    echo "⚠️  프론트엔드 서버 시작 지연 중 - 브라우저에서 확인해주세요"
fi

echo ""
echo "🎉 BlogCraft AI 서버 시작 완료!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📍 백엔드 서버: http://localhost:8000"
echo "🌐 프론트엔드 서버: http://localhost:3000"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🔧 서버 종료 시 Ctrl+C를 누르거나 다음 명령 실행:"
echo "   pkill -f \"node.*ts-node\" && pkill -f \"node.*next\""
echo ""
echo "📋 문제 발생 시 체크리스트:"
echo "   1. 환경변수 파일 확인: ls -la backend/.env frontend/.env.local"
echo "   2. 포트 충돌 확인: lsof -i :8000,3000"
echo "   3. 프로세스 정리: pkill -f \"node.*ts-node\""
echo "   4. 데이터베이스 연결: cd backend && npx prisma db push"

# 서버 프로세스 추적
echo ""
echo "서버가 백그라운드에서 실행 중입니다..."
echo "종료하려면 Ctrl+C를 누르세요."

# 사용자가 Ctrl+C를 누를 때까지 대기
trap 'echo ""; echo "🔄 서버 종료 중..."; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; echo "✅ 서버 종료 완료"; exit 0' INT

# 무한 대기
while true; do
    sleep 1
done 