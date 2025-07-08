import express from 'express';
import passport from '../config/passport';
import {
  handleSocialLoginCallback,
  handleSocialLoginFailure,
  getUserSocialAccounts,
  unlinkSocialAccount,
  getSocialAccountStatus,
  getSocialAccountStats,
  updateSocialAccountInfo
} from '../controllers/socialAuthController';
import { authenticate } from '../middleware/auth';
import { param } from 'express-validator';
import { validate } from '../middleware/validate';

const router = express.Router();

// Google OAuth 라우트
router.get('/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.get('/google/callback',
  passport.authenticate('google', { failureRedirect: '/api/auth/failure' }),
  handleSocialLoginCallback
);

// 네이버 OAuth 라우트
router.get('/naver',
  passport.authenticate('naver', { scope: ['profile', 'email'] })
);

router.get('/naver/callback',
  passport.authenticate('naver', { failureRedirect: '/api/auth/failure' }),
  handleSocialLoginCallback
);

// 카카오 OAuth 라우트
router.get('/kakao',
  passport.authenticate('kakao', { scope: ['profile_nickname', 'account_email'] })
);

router.get('/kakao/callback',
  passport.authenticate('kakao', { failureRedirect: '/api/auth/failure' }),
  handleSocialLoginCallback
);

// 소셜 로그인 실패 처리
router.get('/failure', handleSocialLoginFailure);

// 사용자 소셜 계정 관리 라우트
router.get('/accounts',
  authenticate,
  getUserSocialAccounts
);

// 소셜 계정 상태 확인
router.get('/status',
  authenticate,
  getSocialAccountStatus
);

// 소셜 계정 통계 (관리자용)
router.get('/stats',
  authenticate,
  getSocialAccountStats
);

// 소셜 계정 연결 해제
router.delete('/unlink/:provider',
  authenticate,
  [
    param('provider').isIn(['google', 'naver', 'kakao']).withMessage('지원하지 않는 소셜 프로바이더입니다')
  ],
  validate,
  unlinkSocialAccount
);

// 소셜 계정 정보 업데이트
router.put('/update/:provider',
  authenticate,
  [
    param('provider').isIn(['google', 'naver', 'kakao']).withMessage('지원하지 않는 소셜 프로바이더입니다')
  ],
  validate,
  updateSocialAccountInfo
);

export default router; 