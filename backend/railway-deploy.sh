#!/bin/bash

# BlogCraft Backend Railway 배포 스크립트

set -e  # 에러 시 중단

echo "🚀 BlogCraft Backend Railway 배포 시작..."

# 1. 현재 디렉토리 확인
echo "📁 현재 디렉토리: $(pwd)"

# 2. 빌드 테스트
echo "🔨 빌드 테스트 중..."
npm run build
echo "✅ 빌드 성공!"

# 3. Railway 프로젝트 연결 확인
echo "🔗 Railway 프로젝트 연결 확인..."
if railway status > /dev/null 2>&1; then
    echo "✅ Railway 프로젝트 연결됨"
else
    echo "❌ Railway 프로젝트가 연결되지 않았습니다."
    echo "다음 명령어로 프로젝트를 연결하세요:"
    echo "railway link --new"
    exit 1
fi

# 4. 환경 변수 설정
echo "🔧 환경 변수 설정 중..."
./railway-env-setup.sh

# 5. 배포 실행
echo "🚀 Railway 배포 실행 중..."
railway up

echo "🎉 배포 완료!"
echo "🔍 배포 상태 확인:"
railway status

echo "📊 로그 확인:"
railway logs --tail 50

echo "🌐 배포된 URL:"
railway domain 