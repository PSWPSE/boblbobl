import { Request, Response, NextFunction } from 'express';
import { verifyToken, extractTokenFromHeader } from '../utils/jwt';
import { ApiResponse } from '../types';
import prisma from '../utils/database';

// Passport 타입 재정의
declare global {
  namespace Express {
    interface User {
      id: string;
      email: string;
      name: string;
      userId?: string;
    }
  }
}

// 타입 가드 함수
export function isAuthenticated(req: Request): req is Request & { user: Express.User } {
  return req.user !== undefined;
}

/**
 * JWT 토큰 검증 미들웨어 (표준)
 */
export async function authenticateToken(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    const token = extractTokenFromHeader(authHeader || '');

    if (!token) {
      res.status(401).json({
        success: false,
        error: 'Access token is missing',
      });
      return;
    }

    // 토큰 검증
    const decoded = verifyToken(token);
    
    // 사용자 존재 확인
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        name: true,
      },
    });

    if (!user) {
      res.status(401).json({
        success: false,
        error: 'User not found',
      });
      return;
    }

    // 사용자 정보를 request에 추가
    req.user = {
      id: user.id,
      userId: user.id,
      email: user.email,
      name: user.name,
    };

    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      error: 'Invalid token',
    });
  }
}

/**
 * 간단한 인증 미들웨어 (통일된 타입)
 */
export async function authenticate(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    const token = extractTokenFromHeader(authHeader || '');

    if (!token) {
      res.status(401).json({
        error: 'Access token is missing',
      });
      return;
    }

    // 토큰 검증
    const decoded = verifyToken(token);
    
    // 사용자 존재 확인
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        name: true,
      },
    });

    if (!user) {
      res.status(401).json({
        error: 'User not found',
      });
      return;
    }

    // 사용자 정보를 request에 추가
    req.user = {
      id: user.id,
      userId: user.id,
      email: user.email,
      name: user.name,
    };

    next();
  } catch (error) {
    res.status(401).json({
      error: 'Invalid token',
    });
  }
}

/**
 * 선택적 인증 미들웨어 (토큰이 있으면 검증, 없어도 통과)
 */
export async function optionalAuthenticate(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    const token = extractTokenFromHeader(authHeader || '');

    if (token) {
      const decoded = verifyToken(token);
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          email: true,
          name: true,
        },
      });

      if (user) {
        req.user = {
          id: user.id,
          userId: user.id,
          email: user.email,
          name: user.name,
        };
      }
    }

    next();
  } catch (error) {
    // 토큰이 잘못되어도 통과
    next();
  }
}

/**
 * 관리자 권한 확인 미들웨어
 */
export async function requireAdmin(
  req: Request,
  res: Response<ApiResponse<any>>,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    // 관리자 확인 로직 (현재는 이메일 기반)
    const adminEmails = ['admin@blogcraft.com']; // 환경 변수로 설정 가능
    
    if (!adminEmails.includes(req.user.email)) {
      res.status(403).json({
        success: false,
        error: 'Admin access required',
      });
      return;
    }

    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server error',
    });
  }
}

/**
 * 프리미엄 사용자 권한 확인 미들웨어
 */
export async function requirePremium(
  req: Request,
  res: Response<ApiResponse<any>>,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    // 사용자 구독 상태 확인
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { subscription: true },
    });

    if (!user || user.subscription !== 'premium') {
      res.status(403).json({
        success: false,
        error: 'Premium subscription required',
      });
      return;
    }

    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server error',
    });
  }
} 