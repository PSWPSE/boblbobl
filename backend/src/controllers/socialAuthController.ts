import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import { AuthenticatedRequest } from '../middleware/auth';

const prisma = new PrismaClient();

/**
 * 소셜 로그인 성공 콜백 처리
 */
export async function handleSocialLoginCallback(req: Request, res: Response) {
  try {
    const user = req.user as any;
    
    if (!user) {
      return res.redirect(`${process.env.FRONTEND_URL}/auth/login?error=소셜 로그인 실패`);
    }

    // JWT 토큰 생성
    const token = jwt.sign(
      { userId: user.id, email: user.email, name: user.name },
      process.env.JWT_SECRET!,
      { expiresIn: '24h' }
    );

    // 사용자 정보와 함께 프론트엔드로 리다이렉트
    const redirectUrl = `${process.env.FRONTEND_URL}/auth/callback?token=${token}&user=${encodeURIComponent(JSON.stringify({
      id: user.id,
      email: user.email,
      name: user.name
    }))}`;
    
    console.log('✅ 소셜 로그인 성공:', user.email);
    res.redirect(redirectUrl);
    
  } catch (error) {
    console.error('🚨 소셜 로그인 콜백 오류:', error);
    res.redirect(`${process.env.FRONTEND_URL}/auth/login?error=로그인 처리 중 오류가 발생했습니다`);
  }
}

/**
 * 소셜 로그인 실패 처리
 */
export async function handleSocialLoginFailure(req: Request, res: Response) {
  console.error('🚨 소셜 로그인 실패:', req.query.error);
  res.redirect(`${process.env.FRONTEND_URL}/auth/login?error=소셜 로그인에 실패했습니다`);
}

/**
 * 사용자의 소셜 계정 목록 조회
 */
export async function getUserSocialAccounts(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ error: '로그인이 필요합니다.' });
    }

    const socialAccounts = await prisma.socialAccount.findMany({
      where: { userId },
      select: {
        id: true,
        provider: true,
        email: true,
        name: true,
        createdAt: true
      }
    });

    res.json({
      success: true,
      data: socialAccounts
    });

  } catch (error) {
    console.error('🚨 소셜 계정 조회 오류:', error);
    res.status(500).json({ 
      error: '소셜 계정 조회 중 오류가 발생했습니다.',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * 소셜 계정 연결 해제
 */
export async function unlinkSocialAccount(req: AuthenticatedRequest, res: Response) {
  try {
    const { provider } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ error: '로그인이 필요합니다.' });
    }

    // 지원하는 프로바이더 확인
    const supportedProviders = ['google', 'naver', 'kakao'];
    if (!supportedProviders.includes(provider)) {
      return res.status(400).json({ error: '지원하지 않는 소셜 프로바이더입니다.' });
    }

    // 소셜 계정 확인
    const socialAccount = await prisma.socialAccount.findFirst({
      where: {
        userId,
        provider
      }
    });

    if (!socialAccount) {
      return res.status(404).json({ error: '연결된 소셜 계정을 찾을 수 없습니다.' });
    }

    // 사용자의 다른 로그인 방법 확인
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        socialAccounts: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: '사용자를 찾을 수 없습니다.' });
    }

    // 마지막 로그인 방법인지 확인 (비밀번호가 없고 소셜 계정이 하나뿐인 경우)
    const hasPassword = user.password && user.password.length > 0;
    const socialAccountCount = user.socialAccounts.length;

    if (!hasPassword && socialAccountCount === 1) {
      return res.status(400).json({ 
        error: '마지막 로그인 방법입니다. 비밀번호를 설정하거나 다른 소셜 계정을 연결한 후 해제하세요.' 
      });
    }

    // 소셜 계정 연결 해제
    await prisma.socialAccount.delete({
      where: { id: socialAccount.id }
    });

    console.log(`🔗 소셜 계정 연결 해제: ${provider} - ${user.email}`);
    
    res.json({
      success: true,
      message: `${provider.toUpperCase()} 계정 연결이 해제되었습니다.`
    });

  } catch (error) {
    console.error('🚨 소셜 계정 연결 해제 오류:', error);
    res.status(500).json({ 
      error: '소셜 계정 연결 해제 중 오류가 발생했습니다.',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * 소셜 계정 연결 상태 확인
 */
export async function getSocialAccountStatus(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ error: '로그인이 필요합니다.' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        socialAccounts: {
          select: {
            provider: true,
            email: true,
            name: true,
            createdAt: true
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ error: '사용자를 찾을 수 없습니다.' });
    }

    const hasPassword = user.password && user.password.length > 0;
    const connectedProviders = user.socialAccounts.map(acc => acc.provider);
    
    const providerStatus = {
      google: connectedProviders.includes('google'),
      naver: connectedProviders.includes('naver'),
      kakao: connectedProviders.includes('kakao')
    };

    res.json({
      success: true,
      data: {
        hasPassword,
        providerStatus,
        connectedAccounts: user.socialAccounts,
        canUnlink: hasPassword || user.socialAccounts.length > 1
      }
    });

  } catch (error) {
    console.error('🚨 소셜 계정 상태 확인 오류:', error);
    res.status(500).json({ 
      error: '소셜 계정 상태 확인 중 오류가 발생했습니다.',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * 소셜 계정 통계 조회
 */
export async function getSocialAccountStats(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ error: '로그인이 필요합니다.' });
    }

    // 전체 소셜 계정 통계 (관리자용)
    const totalStats = await prisma.socialAccount.groupBy({
      by: ['provider'],
      _count: {
        id: true
      }
    });

    // 사용자별 소셜 계정 정보
    const userSocialAccounts = await prisma.socialAccount.findMany({
      where: { userId },
      select: {
        provider: true,
        createdAt: true
      }
    });

    res.json({
      success: true,
      data: {
        userAccounts: userSocialAccounts,
        totalStats: totalStats.map(stat => ({
          provider: stat.provider,
          count: stat._count.id
        }))
      }
    });

  } catch (error) {
    console.error('🚨 소셜 계정 통계 조회 오류:', error);
    res.status(500).json({ 
      error: '소셜 계정 통계 조회 중 오류가 발생했습니다.',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * 소셜 계정 정보 업데이트
 */
export async function updateSocialAccountInfo(req: AuthenticatedRequest, res: Response) {
  try {
    const { provider } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ error: '로그인이 필요합니다.' });
    }

    const socialAccount = await prisma.socialAccount.findFirst({
      where: {
        userId,
        provider
      }
    });

    if (!socialAccount) {
      return res.status(404).json({ error: '연결된 소셜 계정을 찾을 수 없습니다.' });
    }

    // 소셜 계정 정보 업데이트 (필요시 구현)
    // 현재는 기본 정보만 반환
    res.json({
      success: true,
      data: {
        provider: socialAccount.provider,
        email: socialAccount.email,
        name: socialAccount.name,
        lastUpdated: socialAccount.updatedAt
      }
    });

  } catch (error) {
    console.error('🚨 소셜 계정 정보 업데이트 오류:', error);
    res.status(500).json({ 
      error: '소셜 계정 정보 업데이트 중 오류가 발생했습니다.',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 