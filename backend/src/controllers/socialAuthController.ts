import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import { isAuthenticated } from '../middleware/auth';

const prisma = new PrismaClient();

/**
 * 소셜 로그인 성공 콜백 처리
 */
export async function handleSocialLoginCallback(req: Request, res: Response) {
  try {
    const user = req.user as any;
    
    if (!user) {
      res.redirect(`${process.env.FRONTEND_URL}/auth/login?error=소셜 로그인 실패`);
      return;
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
 * 사용자 소셜 계정 목록 조회
 */
export async function getUserSocialAccounts(req: Request, res: Response): Promise<void> {
  try {
    if (!isAuthenticated(req)) {
      res.status(401).json({ error: '로그인이 필요합니다.' });
      return;
    }

    const userId = req.user.userId;

    const socialAccounts = await prisma.socialAccount.findMany({
      where: { userId },
      select: {
        id: true,
        provider: true,
        providerId: true,
        name: true,
        email: true,
        createdAt: true,
        updatedAt: true
      }
    });

    res.json({
      success: true,
      data: socialAccounts
    });

  } catch (error) {
    console.error('소셜 계정 조회 오류:', error);
    res.status(500).json({ 
      error: '소셜 계정 조회 중 오류가 발생했습니다.',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * 소셜 계정 연동 해제
 */
export async function unlinkSocialAccount(req: Request, res: Response): Promise<void> {
  try {
    if (!isAuthenticated(req)) {
      res.status(401).json({ error: '로그인이 필요합니다.' });
      return;
    }

    const userId = req.user.userId;
    const { provider } = req.params;

    const socialAccount = await prisma.socialAccount.findFirst({
      where: { 
        userId,
        provider: provider.toUpperCase()
      }
    });

    if (!socialAccount) {
      res.status(404).json({ error: '해당 소셜 계정을 찾을 수 없습니다.' });
      return;
    }

    await prisma.socialAccount.delete({
      where: { id: socialAccount.id }
    });

    res.json({
      success: true,
      message: `${provider} 계정 연동이 해제되었습니다.`
    });

  } catch (error) {
    console.error('소셜 계정 연동 해제 오류:', error);
    res.status(500).json({ 
      error: '소셜 계정 연동 해제 중 오류가 발생했습니다.',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * 소셜 계정 연동 상태 조회
 */
export async function getSocialAccountStatus(req: Request, res: Response): Promise<void> {
  try {
    if (!isAuthenticated(req)) {
      res.status(401).json({ error: '로그인이 필요합니다.' });
      return;
    }

    const userId = req.user.userId;
    const { provider } = req.params;

    const socialAccount = await prisma.socialAccount.findFirst({
      where: { 
        userId,
        provider: provider.toUpperCase()
      }
    });

    const status = {
      isLinked: !!socialAccount,
      lastUsedAt: socialAccount?.updatedAt || null,
      displayName: socialAccount?.name || null,
      email: socialAccount?.email || null
    };

    res.json({
      success: true,
      data: status
    });

  } catch (error) {
    console.error('소셜 계정 상태 조회 오류:', error);
    res.status(500).json({ 
      error: '소셜 계정 상태 조회 중 오류가 발생했습니다.',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * 소셜 계정 연동 통계 조회
 */
export async function getSocialAccountStats(req: Request, res: Response): Promise<void> {
  try {
    if (!isAuthenticated(req)) {
      res.status(401).json({ error: '로그인이 필요합니다.' });
      return;
    }

    const userId = req.user.userId;

    const stats = await prisma.socialAccount.groupBy({
      by: ['provider'],
      where: { userId },
      _count: { id: true }
    });

    const totalAccounts = await prisma.socialAccount.count({
      where: { userId }
    });

    res.json({
      success: true,
      data: {
        totalAccounts,
        providers: stats.map(stat => ({
          provider: stat.provider,
          count: stat._count.id
        }))
      }
    });

  } catch (error) {
    console.error('소셜 계정 통계 조회 오류:', error);
    res.status(500).json({ 
      error: '소셜 계정 통계 조회 중 오류가 발생했습니다.',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * 소셜 계정 정보 업데이트
 */
export async function updateSocialAccountInfo(req: Request, res: Response): Promise<void> {
  try {
    if (!isAuthenticated(req)) {
      res.status(401).json({ error: '로그인이 필요합니다.' });
      return;
    }

    const userId = req.user.userId;
    const { provider } = req.params;
    const { name, email } = req.body;

    const socialAccount = await prisma.socialAccount.findFirst({
      where: { 
        userId,
        provider: provider.toUpperCase()
      }
    });

    if (!socialAccount) {
      res.status(404).json({ error: '해당 소셜 계정을 찾을 수 없습니다.' });
      return;
    }

    const updatedAccount = await prisma.socialAccount.update({
      where: { id: socialAccount.id },
      data: {
        name: name || socialAccount.name,
        email: email || socialAccount.email,
        updatedAt: new Date()
      }
    });

    res.json({
      success: true,
      data: {
        id: updatedAccount.id,
        provider: updatedAccount.provider,
        name: updatedAccount.name,
        email: updatedAccount.email,
        updatedAt: updatedAccount.updatedAt
      }
    });

  } catch (error) {
    console.error('소셜 계정 정보 업데이트 오류:', error);
    res.status(500).json({ 
      error: '소셜 계정 정보 업데이트 중 오류가 발생했습니다.',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 

/**
 * 전체 소셜 계정 상태 조회 (설정 페이지용)
 */
export async function getAllSocialAccountStatus(req: Request, res: Response): Promise<void> {
  try {
    if (!isAuthenticated(req)) {
      res.status(401).json({ 
        success: false, 
        error: '로그인이 필요합니다.' 
      });
      return;
    }

    const userId = req.user.userId;

    // 사용자 정보 조회 (비밀번호 있는지 확인)
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { 
        password: true,
        provider: true
      }
    });

    // 연결된 소셜 계정 조회
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

    // 제공자별 상태 맵핑
    const providerStatus = {
      google: socialAccounts.some(account => account.provider.toLowerCase() === 'google'),
      naver: socialAccounts.some(account => account.provider.toLowerCase() === 'naver'),
      kakao: socialAccounts.some(account => account.provider.toLowerCase() === 'kakao')
    };

    // 계정 연결 해제 가능 여부 확인
    // 비밀번호가 있거나 2개 이상의 소셜 계정이 연결되어 있으면 해제 가능
    const canUnlink = !!user?.password || socialAccounts.length > 1;

    const response = {
      hasPassword: !!user?.password,
      providerStatus,
      connectedAccounts: socialAccounts.map(account => ({
        id: account.id,
        provider: account.provider.toLowerCase(),
        email: account.email || '',
        name: account.name || '',
        createdAt: account.createdAt.toISOString()
      })),
      canUnlink
    };

    res.json({
      success: true,
      data: response
    });

  } catch (error) {
    console.error('전체 소셜 계정 상태 조회 오류:', error);
    res.status(500).json({ 
      success: false,
      error: '소셜 계정 상태 조회 중 오류가 발생했습니다.',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 