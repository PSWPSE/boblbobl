import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { body, param } from 'express-validator';
import { validate } from '../middleware/validate';
import {
  getUserSocialAccounts,
  getSocialAccountStatus,
  getSocialAccountStats,
  unlinkSocialAccount,
  updateSocialAccountInfo,
  getAllSocialAccountStatus
} from '../controllers/socialAuthController';

const router = Router();

/**
 * 전체 소셜 계정 상태 조회 (설정 페이지용)
 */
router.get('/status',
  authenticateToken,
  getAllSocialAccountStatus
);

/**
 * 사용자 소셜 계정 목록 조회
 */
router.get('/accounts',
  authenticateToken,
  getUserSocialAccounts
);

/**
 * 소셜 계정 연동 상태 조회 (개별 제공자)
 */
router.get('/status/:provider',
  authenticateToken,
  [
    param('provider').isIn(['google', 'naver', 'kakao']).withMessage('지원하지 않는 소셜 프로바이더입니다')
  ],
  validate,
  getSocialAccountStatus
);

/**
 * 소셜 계정 연동 통계 조회
 */
router.get('/stats',
  authenticateToken,
  getSocialAccountStats
);

/**
 * 소셜 계정 연동 해제
 */
router.delete('/unlink/:provider',
  authenticateToken,
  [
    param('provider').isIn(['google', 'naver', 'kakao']).withMessage('지원하지 않는 소셜 프로바이더입니다')
  ],
  validate,
  unlinkSocialAccount
);

/**
 * 소셜 계정 정보 업데이트
 */
router.patch('/update/:provider',
  authenticateToken,
  [
    param('provider').isIn(['google', 'naver', 'kakao']).withMessage('지원하지 않는 소셜 프로바이더입니다'),
    body('name').optional().isString().withMessage('이름은 문자열이어야 합니다'),
    body('email').optional().isEmail().withMessage('유효한 이메일 주소를 입력하세요')
  ],
  validate,
  updateSocialAccountInfo
);

export default router; 