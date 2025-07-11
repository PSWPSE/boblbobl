#!/bin/bash

# Railway 환경 변수 자동 설정 스크립트

echo "🚀 Railway 환경 변수 설정 중..."

# 환경 변수 설정
railway variables --set "NODE_ENV=production"
railway variables --set "JWT_SECRET=bdb892b35ec2e50210a14b87bc5a257d"
railway variables --set "DATABASE_URL=postgresql://postgres:TmdGFdaksSgPPbAsDsAnHlTDPpWjkqUu@shortline.proxy.rlwy.net:54002/railway"
railway variables --set "OPENAI_API_KEY=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"
railway variables --set "GOOGLE_CLIENT_ID=663459245926-s568h91gdsu8q33nks47l4umad616uu9.apps.googleusercontent.com"
railway variables --set "GOOGLE_CLIENT_SECRET=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"
railway variables --set "NAVER_CLIENT_ID=Ill7zizD7cfU7FiVwH74"
railway variables --set "NAVER_CLIENT_SECRET=e6MnDF8vxy"
railway variables --set "CLOUDINARY_CLOUD_NAME=dfrqgjdtd"
railway variables --set "CLOUDINARY_API_KEY=674531278499429"
railway variables --set "CLOUDINARY_API_SECRET=3s1ldvQ6qVAh7yOzsSmlf9aR2Sc"
railway variables --set "CLIENT_URL=https://blogcraft-frontend.vercel.app"
railway variables --set "FRONTEND_URL=https://blogcraft-frontend.vercel.app"
railway variables --set "SERVER_URL=https://nongbuxxbackend-production.up.railway.app"

echo "✅ 환경 변수 설정 완료!"
echo "🔍 설정된 환경 변수 목록:"
railway variables 