import { Request, Response } from 'express';
import { hashPassword, verifyPassword, validatePasswordStrength } from '../utils/password';
import { generateToken } from '../utils/jwt';
import { ApiResponse, CreateUserInput } from '../types';
import { isAuthenticated } from '../middleware/auth';
import prisma from '../utils/database';

/**
 * 회원가입
 */
export async function register(req: Request, res: Response<ApiResponse<any>>): Promise<void> {
  try {
    const { email, password, name } = req.body;

    // 입력 검증
    if (!email || !password || !name) {
      res.status(400).json({
        success: false,
        error: '이메일, 비밀번호, 이름은 필수 입력사항입니다.',
      });
      return;
    }

    // 비밀번호 강도 검증
    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.isValid) {
      res.status(400).json({
        success: false,
        error: passwordValidation.errors.join(', '),
      });
      return;
    }

    // 이메일 중복 확인
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      res.status(409).json({
        success: false,
        error: '이미 등록된 이메일입니다.',
      });
      return;
    }

    // 비밀번호 해싱
    const hashedPassword = await hashPassword(password);

    // 사용자 생성
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        provider: 'email',
      },
      select: {
        id: true,
        email: true,
        name: true,
        provider: true,
        subscription: true,
        createdAt: true,
      },
    });

    // JWT 토큰 생성
    const token = generateToken({
      userId: user.id,
      email: user.email,
      name: user.name,
    });

    res.status(201).json({
      success: true,
      data: {
        user,
        token,
      },
      message: '회원가입이 완료되었습니다.',
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      error: '서버 오류가 발생했습니다.',
    });
  }
}

/**
 * 로그인
 */
export async function login(req: Request, res: Response<ApiResponse<any>>): Promise<void> {
  try {
    const { email, password } = req.body;

    // 입력 검증
    if (!email || !password) {
      res.status(400).json({
        success: false,
        error: '이메일과 비밀번호를 입력해주세요.',
      });
      return;
    }

    // 사용자 찾기
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      res.status(401).json({
        success: false,
        error: '이메일 또는 비밀번호가 올바르지 않습니다.',
      });
      return;
    }

    // 이메일 로그인인지 확인
    if (user.provider !== 'email' || !user.password) {
      res.status(401).json({
        success: false,
        error: '소셜 로그인 계정입니다. 해당 플랫폼으로 로그인해주세요.',
      });
      return;
    }

    // 비밀번호 검증
    const isPasswordValid = await verifyPassword(password, user.password);
    if (!isPasswordValid) {
      res.status(401).json({
        success: false,
        error: '이메일 또는 비밀번호가 올바르지 않습니다.',
      });
      return;
    }

    // JWT 토큰 생성
    const token = generateToken({
      userId: user.id,
      email: user.email,
      name: user.name,
    });

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          provider: user.provider,
          subscription: user.subscription,
        },
        token,
      },
      message: '로그인이 완료되었습니다.',
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: '서버 오류가 발생했습니다.',
    });
  }
}

/**
 * 현재 사용자 정보 조회
 */
export async function getMe(req: Request, res: Response<ApiResponse<any>>): Promise<void> {
  try {
    if (!isAuthenticated(req)) {
      res.status(401).json({
        success: false,
        error: '인증이 필요합니다.',
      });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: {
        id: true,
        email: true,
        name: true,
        provider: true,
        subscription: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      res.status(404).json({
        success: false,
        error: '사용자를 찾을 수 없습니다.',
      });
      return;
    }

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({
      success: false,
      error: '서버 오류가 발생했습니다.',
    });
  }
}

/**
 * 비밀번호 변경
 */
export async function changePassword(req: Request, res: Response<ApiResponse<any>>): Promise<void> {
  try {
    if (!isAuthenticated(req)) {
      res.status(401).json({
        success: false,
        error: '인증이 필요합니다.',
      });
      return;
    }

    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      res.status(400).json({
        success: false,
        error: '현재 비밀번호와 새 비밀번호를 입력해주세요.',
      });
      return;
    }

    // 사용자 찾기
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
    });

    if (!user || !user.password) {
      res.status(400).json({
        success: false,
        error: '비밀번호 변경이 불가능한 계정입니다.',
      });
      return;
    }

    // 현재 비밀번호 확인
    const isCurrentPasswordValid = await verifyPassword(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      res.status(401).json({
        success: false,
        error: '현재 비밀번호가 올바르지 않습니다.',
      });
      return;
    }

    // 새 비밀번호 강도 검증
    const passwordValidation = validatePasswordStrength(newPassword);
    if (!passwordValidation.isValid) {
      res.status(400).json({
        success: false,
        error: passwordValidation.errors.join(', '),
      });
      return;
    }

    // 새 비밀번호 해싱 및 업데이트
    const hashedNewPassword = await hashPassword(newPassword);
    await prisma.user.update({
      where: { id: req.user.userId },
      data: { password: hashedNewPassword },
    });

    res.json({
      success: true,
      message: '비밀번호가 성공적으로 변경되었습니다.',
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      error: '서버 오류가 발생했습니다.',
    });
  }
} 