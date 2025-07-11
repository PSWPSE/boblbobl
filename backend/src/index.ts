import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import session from 'express-session';
import passport from './config/passport';
import path from 'path';

// 라우터 import (ES modules 방식)
import authRoutes from './routes/auth';
import contentRoutes from './routes/content';
import uploadRoutes from './routes/upload';
import guidelineRoutes from './routes/guidelines';
import seoRoutes from './routes/seo';
import thumbnailRoutes from './routes/thumbnail';
import aiBypassRoutes from './routes/ai-bypass';
import socialAuthRoutes from './routes/socialAuth';

// 환경 변수 로드 (가장 먼저)
dotenv.config();

const app = express();
const PORT = process.env.PORT || 8000;

// 신뢰 프록시 설정 (production에서 필요)
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

// 기본 미들웨어 설정
app.use(express.json({ limit: '50mb' }));

// CORS 설정 (가장 중요)
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin']
}));

// 세션 설정
app.use(session({
  secret: process.env.JWT_SECRET || 'fallback-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24 // 24시간
  }
}));

// Passport 초기화
app.use(passport.initialize());
app.use(passport.session());

// 요청 로깅 미들웨어 (개발 환경에서만)
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`📝 ${req.method} ${req.path} - ${new Date().toISOString()}`);
    next();
  });
}

// Health check (서버 상태 확인)
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV,
    port: PORT
  });
});

// API 라우트 등록
app.use('/api/auth', authRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/guidelines', guidelineRoutes);
app.use('/api/seo', seoRoutes);
app.use('/api/thumbnail', thumbnailRoutes);
app.use('/api/ai-bypass', aiBypassRoutes);
app.use('/api/social-auth', socialAuthRoutes);

// 404 핸들러 (올바른 Express 방식)
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    error: 'API 엔드포인트를 찾을 수 없습니다.',
    path: req.path,
    method: req.method
  });
});

// 글로벌 에러 핸들러
app.use((err: any, req: any, res: any, next: any) => {
  console.error('🚨 서버 에러:', err);
  
  // 개발 환경에서는 자세한 에러 정보 제공
  if (process.env.NODE_ENV === 'development') {
    res.status(500).json({
      success: false,
      error: '서버 내부 오류가 발생했습니다.',
      details: err.message,
      stack: err.stack
    });
  } else {
    res.status(500).json({
      success: false,
      error: '서버 내부 오류가 발생했습니다.'
    });
  }
});

// 서버 시작
const server = app.listen(PORT, () => {
  console.log(`🚀 BlogCraft API Server started successfully!`);
  console.log(`📍 Server URL: http://localhost:${PORT}`);
  console.log(`🌍 Client URL: ${process.env.CLIENT_URL || 'http://localhost:3000'}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`⏰ Started at: ${new Date().toISOString()}`);
  console.log(`🔑 JWT Secret: ${process.env.JWT_SECRET ? '설정됨' : '❌ 누락'}`);
  console.log(`🤖 OpenAI API: ${process.env.OPENAI_API_KEY ? '설정됨' : '❌ 누락'}`);
  console.log(`🔐 Google OAuth: ${process.env.GOOGLE_CLIENT_ID ? '설정됨' : '❌ 누락'}`);
  console.log(`✅ Ready to accept requests!`);
});

// 프로세스 종료 시 깔끔한 종료
process.on('SIGINT', () => {
  console.log('\n🔄 서버 종료 중...');
  server.close(() => {
    console.log('✅ 서버가 정상적으로 종료되었습니다.');
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  console.log('\n🔄 서버 종료 중...');
  server.close(() => {
    console.log('✅ 서버가 정상적으로 종료되었습니다.');
    process.exit(0);
  });
});

export default app; 









