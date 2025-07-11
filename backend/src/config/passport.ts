import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { PrismaClient } from '@prisma/client';

// PrismaClient 인스턴스 생성 (싱글톤 패턴)
declare global {
  var __prisma: PrismaClient | undefined;
}

const prisma = globalThis.__prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalThis.__prisma = prisma;
}

// 데이터베이스 연결 및 스키마 동기화
async function initializeDatabase() {
  try {
    console.log('📊 데이터베이스 연결 중...');
    await prisma.$connect();
    console.log('✅ 데이터베이스 연결 성공');
    
    // 프로덕션 환경에서 스키마 동기화
    if (process.env.NODE_ENV === 'production') {
      console.log('🔄 프로덕션 환경 스키마 동기화 중...');
      try {
        // 테이블 존재 확인
        await prisma.$executeRaw`SELECT 1 FROM "social_accounts" LIMIT 1`;
        console.log('✅ 스키마 확인 완료');
      } catch (error) {
        console.log('📝 스키마 생성 중...');
        // 스키마가 없으면 생성
        await prisma.$executeRaw`
          CREATE TABLE IF NOT EXISTS "users" (
            "id" TEXT NOT NULL,
            "email" TEXT NOT NULL,
            "name" TEXT NOT NULL,
            "password" TEXT,
            "provider" TEXT NOT NULL DEFAULT 'email',
            "subscription" TEXT NOT NULL DEFAULT 'free',
            "isVerified" BOOLEAN NOT NULL DEFAULT false,
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" TIMESTAMP(3) NOT NULL,
            CONSTRAINT "users_pkey" PRIMARY KEY ("id")
          )
        `;
        
        await prisma.$executeRaw`
          CREATE TABLE IF NOT EXISTS "social_accounts" (
            "id" TEXT NOT NULL,
            "userId" TEXT NOT NULL,
            "provider" TEXT NOT NULL,
            "providerId" TEXT NOT NULL,
            "email" TEXT,
            "name" TEXT,
            "accessToken" TEXT,
            "refreshToken" TEXT,
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" TIMESTAMP(3) NOT NULL,
            CONSTRAINT "social_accounts_pkey" PRIMARY KEY ("id")
          )
        `;
        
        await prisma.$executeRaw`
          CREATE TABLE IF NOT EXISTS "content_guidelines" (
            "id" TEXT NOT NULL,
            "userId" TEXT NOT NULL,
            "name" TEXT NOT NULL,
            "type" TEXT NOT NULL,
            "keywords" JSONB,
            "memo" TEXT,
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" TIMESTAMP(3) NOT NULL,
            CONSTRAINT "content_guidelines_pkey" PRIMARY KEY ("id")
          )
        `;
        
        await prisma.$executeRaw`
          CREATE TABLE IF NOT EXISTS "source_data" (
            "id" TEXT NOT NULL,
            "userId" TEXT NOT NULL,
            "filename" TEXT NOT NULL,
            "fileType" TEXT NOT NULL,
            "fileUrl" TEXT,
            "extractedText" TEXT NOT NULL,
            "metadata" JSONB,
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT "source_data_pkey" PRIMARY KEY ("id")
          )
        `;
        
        await prisma.$executeRaw`
          CREATE TABLE IF NOT EXISTS "generated_contents" (
            "id" TEXT NOT NULL,
            "userId" TEXT NOT NULL,
            "sourceDataId" TEXT,
            "guidelineId" TEXT,
            "title" TEXT NOT NULL,
            "content" TEXT NOT NULL,
            "summary" TEXT,
            "contentType" TEXT NOT NULL,
            "status" TEXT NOT NULL DEFAULT 'draft',
            "tags" JSONB,
            "metadata" JSONB,
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" TIMESTAMP(3) NOT NULL,
            CONSTRAINT "generated_contents_pkey" PRIMARY KEY ("id")
          )
        `;
        
        // 유니크 제약 조건 추가
        await prisma.$executeRaw`
          CREATE UNIQUE INDEX IF NOT EXISTS "users_email_key" ON "users"("email")
        `;
        
        await prisma.$executeRaw`
          CREATE UNIQUE INDEX IF NOT EXISTS "social_accounts_provider_providerId_key" ON "social_accounts"("provider", "providerId")
        `;
        
        // 외래키 제약 조건 추가
        await prisma.$executeRaw`
          ALTER TABLE "social_accounts" DROP CONSTRAINT IF EXISTS "social_accounts_userId_fkey"
        `;
        await prisma.$executeRaw`
          ALTER TABLE "social_accounts" ADD CONSTRAINT "social_accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
        `;
        
        await prisma.$executeRaw`
          ALTER TABLE "content_guidelines" DROP CONSTRAINT IF EXISTS "content_guidelines_userId_fkey"
        `;
        await prisma.$executeRaw`
          ALTER TABLE "content_guidelines" ADD CONSTRAINT "content_guidelines_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
        `;
        
        await prisma.$executeRaw`
          ALTER TABLE "source_data" DROP CONSTRAINT IF EXISTS "source_data_userId_fkey"
        `;
        await prisma.$executeRaw`
          ALTER TABLE "source_data" ADD CONSTRAINT "source_data_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
        `;
        
        await prisma.$executeRaw`
          ALTER TABLE "generated_contents" DROP CONSTRAINT IF EXISTS "generated_contents_userId_fkey"
        `;
        await prisma.$executeRaw`
          ALTER TABLE "generated_contents" ADD CONSTRAINT "generated_contents_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
        `;
        
        console.log('✅ 스키마 생성 완료');
      }
    }
  } catch (error) {
    console.error('❌ 데이터베이스 초기화 실패:', error);
    throw error;
  }
}

// Google OAuth 전략 설정
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  console.log('🔐 Google OAuth strategy initialized');
  
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: `${process.env.SERVER_URL || 'http://localhost:8000'}/api/auth/google/callback`
  },
  async (accessToken: string, refreshToken: string, profile: any, done: any) => {
    try {
      console.log('🔍 Google OAuth callback received:', profile.displayName);
      console.log('📧 Email:', profile.emails[0].value);
      console.log('🆔 Provider ID:', profile.id);
      
      // 기존 소셜 계정 찾기
      console.log('🔍 Searching for existing social account...');
      let socialAccount = await prisma.socialAccount.findFirst({
        where: {
          provider: 'GOOGLE',
          providerId: profile.id
        },
        include: {
          user: true
        }
      });

      let user;
      
      if (socialAccount) {
        // 기존 계정이 있는 경우
        console.log('✅ Found existing social account:', socialAccount.user.email);
        user = socialAccount.user;
      } else {
        // 새 계정 생성
        console.log('📝 Creating new user account...');
        user = await prisma.user.create({
          data: {
            email: profile.emails[0].value,
            name: profile.displayName,
            provider: 'GOOGLE',
            isVerified: true,
            socialAccounts: {
              create: {
                provider: 'GOOGLE',
                providerId: profile.id,
                email: profile.emails[0].value,
                name: profile.displayName,
                accessToken,
                refreshToken
              }
            }
          }
        });
        console.log('✅ New user created:', user.email);
      }

      return done(null, user);
    } catch (error) {
      console.error('❌ Google OAuth error details:', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        code: (error as any)?.code,
        meta: (error as any)?.meta
      });
      return done(error, null);
    }
  }));
} else {
  console.log('⚠️  Google OAuth credentials not configured');
}

// 직렬화/역직렬화
passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await prisma.user.findUnique({ where: { id } });
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// 데이터베이스 초기화 실행
initializeDatabase().catch(console.error);

export default passport; 