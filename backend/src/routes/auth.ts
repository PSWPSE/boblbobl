import { Router } from 'express';
import { body } from 'express-validator';
import { validate } from '../middleware/validate';
import { authenticateToken } from '../middleware/auth';
import {
  register,
  login,
  getMe,
  changePassword
} from '../controllers/authController';
import passport from 'passport';

const router = Router();

// 회원가입
router.post('/register',
  [
    body('email').isEmail().withMessage('유효한 이메일 주소를 입력하세요'),
    body('password').isLength({ min: 6 }).withMessage('비밀번호는 최소 6자 이상이어야 합니다'),
    body('name').notEmpty().withMessage('이름을 입력하세요')
  ],
  validate,
  register
);

// 로그인
router.post('/login',
  [
    body('email').isEmail().withMessage('유효한 이메일 주소를 입력하세요'),
    body('password').notEmpty().withMessage('비밀번호를 입력하세요')
  ],
  validate,
  login
);

// 로그아웃 (클라이언트에서 토큰 제거)
router.post('/logout', (req, res) => {
  res.json({
    success: true,
    message: '로그아웃이 완료되었습니다.',
  });
});

// 사용자 정보 조회
router.get('/me', 
  authenticateToken, 
  getMe
);

// 비밀번호 변경
router.post('/change-password',
  authenticateToken,
  [
    body('currentPassword').notEmpty().withMessage('현재 비밀번호를 입력하세요'),
    body('newPassword').isLength({ min: 6 }).withMessage('새 비밀번호는 최소 6자 이상이어야 합니다')
  ],
  validate,
  changePassword
);

// 소셜 로그인 라우트 추가
// Google OAuth
router.get('/google', 
  passport.authenticate('google', { 
    scope: ['profile', 'email'] 
  })
);

router.get('/google/callback',
  passport.authenticate('google', { 
    failureRedirect: '/auth/login?error=Google 로그인에 실패했습니다' 
  }),
  async (req, res) => {
    try {
      const user = req.user as any;
      if (!user) {
        return res.redirect(`${process.env.CLIENT_URL || 'http://localhost:3000'}/auth/login?error=로그인 실패`);
      }

      // JWT 토큰 생성
      const jwt = require('jsonwebtoken');
      const token = jwt.sign(
        { 
          userId: user.id, 
          email: user.email, 
          name: user.name 
        },
        process.env.JWT_SECRET || 'fallback-secret',
        { expiresIn: '24h' }
      );

      // 프론트엔드로 리다이렉트 (토큰과 사용자 정보 포함)
      const redirectUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/auth/callback?token=${token}&user=${encodeURIComponent(JSON.stringify({
        id: user.id,
        email: user.email,
        name: user.name,
        provider: user.provider
      }))}`;
      
      res.redirect(redirectUrl);
    } catch (error) {
      console.error('Google OAuth 콜백 에러:', error);
      res.redirect(`${process.env.CLIENT_URL || 'http://localhost:3000'}/auth/login?error=로그인 처리 중 오류가 발생했습니다`);
    }
  }
);

// Twitter OAuth (임시 비활성화)
router.get('/twitter', (req, res) => {
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
  res.redirect(`${clientUrl}/auth/login?error=Twitter 로그인 설정이 필요합니다`);
});

router.get('/twitter/callback', (req, res) => {
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
  res.redirect(`${clientUrl}/auth/login?error=Twitter 로그인 설정이 필요합니다`);
});

export default router; 