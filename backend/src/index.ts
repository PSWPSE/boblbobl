import express from 'express';
import cors from 'cors';
import session from 'express-session';
import MongoStore from 'connect-mongo';
import dotenv from 'dotenv';
import passport from './config/passport';
import authRoutes from './routes/auth';
import socialAuthRoutes from './routes/socialAuth';
import guidelineRoutes from './routes/guidelines';
import uploadRoutes from './routes/upload';
import contentRoutes from './routes/content';
import thumbnailRoutes from './routes/thumbnail';
import seoRoutes from './routes/seo';
import aiBypassRoutes from './routes/ai-bypass';

// 환경 변수 로드
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// 미들웨어 설정
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());

// 세션 설정 (소셜 로그인용)
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-session-secret',
  resave: false,
  saveUninitialized: false,
  store: process.env.MONGODB_URI ? MongoStore.create({
    mongoUrl: process.env.MONGODB_URI
  }) : undefined,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24시간
  }
}));

// Passport 초기화
app.use(passport.initialize());
app.use(passport.session());

// 라우트 설정
app.use('/api/auth', authRoutes);
app.use('/api/social', socialAuthRoutes);
app.use('/api/guidelines', guidelineRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/thumbnail', thumbnailRoutes);
app.use('/api/seo', seoRoutes);
app.use('/api/ai-bypass', aiBypassRoutes);

// 기본 라우트
app.get('/', (req, res) => {
  res.json({ message: 'BlogCraft API Server' });
});

// 헬스체크 엔드포인트
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

// 404 핸들러
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Route not found',
    method: req.method,
    path: req.originalUrl
  });
});

// 에러 핸들러
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 서버 시작
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// 종료 시 데이터베이스 연결 해제
process.on('SIGINT', async () => {
  console.log('\n🔄 Shutting down gracefully...');
  // await disconnectDatabase(); // This line was removed as per the new_code, as the database connection is no longer managed here.
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🔄 Shutting down gracefully...');
  // await disconnectDatabase(); // This line was removed as per the new_code, as the database connection is no longer managed here.
  process.exit(0);
});

export default app; 