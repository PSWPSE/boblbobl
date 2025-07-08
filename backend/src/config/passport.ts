import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as NaverStrategy } from 'passport-naver-v2';
import { Strategy as KakaoStrategy } from 'passport-kakao';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// Google OAuth 설정
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID!,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
  callbackURL: "/api/auth/google/callback"
}, async (accessToken, refreshToken, profile, done) => {
  try {
    console.log('🔍 Google OAuth 프로필:', profile);
    
    const email = profile.emails?.[0]?.value;
    const name = profile.displayName || profile.name?.givenName || 'Google 사용자';
    const providerId = profile.id;
    
    if (!email) {
      return done(new Error('Google 계정에서 이메일을 가져올 수 없습니다.'));
    }
    
    // 기존 소셜 계정 확인
    let socialAccount = await prisma.socialAccount.findFirst({
      where: {
        provider: 'google',
        providerId: providerId
      },
      include: {
        user: true
      }
    });
    
    if (socialAccount) {
      // 기존 소셜 계정이 있는 경우
      console.log('✅ 기존 Google 계정 로그인:', socialAccount.user.email);
      return done(null, socialAccount.user);
    }
    
    // 이메일로 기존 사용자 확인
    let existingUser = await prisma.user.findUnique({
      where: { email }
    });
    
    if (existingUser) {
      // 기존 사용자에 소셜 계정 연결
      await prisma.socialAccount.create({
        data: {
          userId: existingUser.id,
          provider: 'google',
          providerId: providerId,
          email: email,
          name: name,
          accessToken: accessToken,
          refreshToken: refreshToken || null
        }
      });
      
      console.log('🔗 기존 계정에 Google 연결:', existingUser.email);
      return done(null, existingUser);
    }
    
    // 새 사용자 생성
    const newUser = await prisma.user.create({
      data: {
        email: email,
        name: name,
        password: await bcrypt.hash(Math.random().toString(36), 10), // 임시 비밀번호
        isVerified: true, // 소셜 로그인은 자동 인증
        socialAccounts: {
          create: {
            provider: 'google',
            providerId: providerId,
            email: email,
            name: name,
            accessToken: accessToken,
            refreshToken: refreshToken || null
          }
        }
      }
    });
    
    console.log('🆕 새 Google 사용자 생성:', newUser.email);
    return done(null, newUser);
    
  } catch (error) {
    console.error('🚨 Google OAuth 오류:', error);
    return done(error, null);
  }
}));

// 네이버 OAuth 설정
passport.use(new NaverStrategy({
  clientID: process.env.NAVER_CLIENT_ID!,
  clientSecret: process.env.NAVER_CLIENT_SECRET!,
  callbackURL: "/api/auth/naver/callback"
}, async (accessToken, refreshToken, profile, done) => {
  try {
    console.log('🔍 네이버 OAuth 프로필:', profile);
    
    const email = profile.email;
    const name = profile.name || profile.nickname || '네이버 사용자';
    const providerId = profile.id;
    
    if (!email) {
      return done(new Error('네이버 계정에서 이메일을 가져올 수 없습니다.'));
    }
    
    // 기존 소셜 계정 확인
    let socialAccount = await prisma.socialAccount.findFirst({
      where: {
        provider: 'naver',
        providerId: providerId
      },
      include: {
        user: true
      }
    });
    
    if (socialAccount) {
      console.log('✅ 기존 네이버 계정 로그인:', socialAccount.user.email);
      return done(null, socialAccount.user);
    }
    
    // 이메일로 기존 사용자 확인
    let existingUser = await prisma.user.findUnique({
      where: { email }
    });
    
    if (existingUser) {
      // 기존 사용자에 소셜 계정 연결
      await prisma.socialAccount.create({
        data: {
          userId: existingUser.id,
          provider: 'naver',
          providerId: providerId,
          email: email,
          name: name,
          accessToken: accessToken,
          refreshToken: refreshToken || null
        }
      });
      
      console.log('🔗 기존 계정에 네이버 연결:', existingUser.email);
      return done(null, existingUser);
    }
    
    // 새 사용자 생성
    const newUser = await prisma.user.create({
      data: {
        email: email,
        name: name,
        password: await bcrypt.hash(Math.random().toString(36), 10),
        isVerified: true,
        socialAccounts: {
          create: {
            provider: 'naver',
            providerId: providerId,
            email: email,
            name: name,
            accessToken: accessToken,
            refreshToken: refreshToken || null
          }
        }
      }
    });
    
    console.log('🆕 새 네이버 사용자 생성:', newUser.email);
    return done(null, newUser);
    
  } catch (error) {
    console.error('🚨 네이버 OAuth 오류:', error);
    return done(error, null);
  }
}));

// 카카오 OAuth 설정
passport.use(new KakaoStrategy({
  clientID: process.env.KAKAO_CLIENT_ID!,
  clientSecret: process.env.KAKAO_CLIENT_SECRET!,
  callbackURL: "/api/auth/kakao/callback"
}, async (accessToken, refreshToken, profile, done) => {
  try {
    console.log('🔍 카카오 OAuth 프로필:', profile);
    
    const email = profile._json.kakao_account?.email;
    const name = profile._json.kakao_account?.profile?.nickname || profile.displayName || '카카오 사용자';
    const providerId = profile.id;
    
    if (!email) {
      return done(new Error('카카오 계정에서 이메일을 가져올 수 없습니다.'));
    }
    
    // 기존 소셜 계정 확인
    let socialAccount = await prisma.socialAccount.findFirst({
      where: {
        provider: 'kakao',
        providerId: providerId
      },
      include: {
        user: true
      }
    });
    
    if (socialAccount) {
      console.log('✅ 기존 카카오 계정 로그인:', socialAccount.user.email);
      return done(null, socialAccount.user);
    }
    
    // 이메일로 기존 사용자 확인
    let existingUser = await prisma.user.findUnique({
      where: { email }
    });
    
    if (existingUser) {
      // 기존 사용자에 소셜 계정 연결
      await prisma.socialAccount.create({
        data: {
          userId: existingUser.id,
          provider: 'kakao',
          providerId: providerId,
          email: email,
          name: name,
          accessToken: accessToken,
          refreshToken: refreshToken || null
        }
      });
      
      console.log('🔗 기존 계정에 카카오 연결:', existingUser.email);
      return done(null, existingUser);
    }
    
    // 새 사용자 생성
    const newUser = await prisma.user.create({
      data: {
        email: email,
        name: name,
        password: await bcrypt.hash(Math.random().toString(36), 10),
        isVerified: true,
        socialAccounts: {
          create: {
            provider: 'kakao',
            providerId: providerId,
            email: email,
            name: name,
            accessToken: accessToken,
            refreshToken: refreshToken || null
          }
        }
      }
    });
    
    console.log('🆕 새 카카오 사용자 생성:', newUser.email);
    return done(null, newUser);
    
  } catch (error) {
    console.error('🚨 카카오 OAuth 오류:', error);
    return done(error, null);
  }
}));

// 사용자 직렬화
passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

// 사용자 역직렬화
passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        socialAccounts: true
      }
    });
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

export default passport; 