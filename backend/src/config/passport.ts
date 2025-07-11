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

// 데이터베이스 연결 테스트
async function testDatabaseConnection() {
  try {
    await prisma.$connect();
    console.log('✅ Database connected successfully');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
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
  async (accessToken, refreshToken, profile, done) => {
    try {
      console.log('🔍 Google OAuth callback received:', profile.displayName);
      
      // 기존 소셜 계정 찾기
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
        // 기존 소셜 계정이 있는 경우
        user = socialAccount.user;
        console.log('👤 Existing social account found:', user.email);
        
        // 소셜 계정 정보 업데이트
        await prisma.socialAccount.update({
          where: { id: socialAccount.id },
          data: {
            email: profile.emails?.[0]?.value,
            name: profile.displayName,
            accessToken,
            refreshToken,
            updatedAt: new Date()
          }
        });
      } else {
        // 이메일로 기존 사용자 찾기
        const userEmail = profile.emails?.[0]?.value;
        if (userEmail) {
          user = await prisma.user.findUnique({
            where: { email: userEmail }
          });
        }

        if (!user) {
          // 새 사용자 생성
          console.log('🆕 Creating new user:', profile.displayName);
          user = await prisma.user.create({
            data: {
              email: profile.emails?.[0]?.value || '',
              name: profile.displayName || '구글 사용자',
              provider: 'GOOGLE',
              subscription: 'free'
            }
          });
        }

        // 소셜 계정 연결
        await prisma.socialAccount.create({
          data: {
            userId: user.id,
            provider: 'GOOGLE',
            providerId: profile.id,
            email: profile.emails?.[0]?.value,
            name: profile.displayName,
            accessToken,
            refreshToken
          }
        });
        
        console.log('🔗 Social account linked to user:', user.email);
      }

      // 사용자 정보 반환
      const userData = {
        id: user.id,
        email: user.email,
        name: user.name,
        provider: user.provider,
        subscription: user.subscription
      };

      console.log('✅ Google OAuth success:', userData.email);
      return done(null, userData);
      
    } catch (error) {
      console.error('❌ Google OAuth error:', error);
      return done(error, false);
    }
  }));
} else {
  console.log('⚠️ Google OAuth credentials not found');
}

// 사용자 직렬화 (세션에 저장)
passport.serializeUser((user: any, done) => {
  console.log('📦 Serializing user:', user.id);
  done(null, user.id);
});

// 사용자 역직렬화 (세션에서 복원)
passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        provider: true,
        subscription: true,
        createdAt: true,
        updatedAt: true
      }
    });
    
    if (user) {
      console.log('📦 Deserializing user:', user.email);
      done(null, user);
    } else {
      console.log('❌ User not found during deserialization:', id);
      done(new Error('사용자를 찾을 수 없습니다.'), null);
    }
  } catch (error) {
    console.error('❌ Deserialization error:', error);
    done(error, null);
  }
});

// 데이터베이스 연결 테스트 실행
testDatabaseConnection();

export default passport;
export { prisma }; 