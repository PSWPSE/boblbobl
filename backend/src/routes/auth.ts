import express from 'express';
import { register, login, getMe, changePassword } from '../controllers/authController';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

/**
 * @route   POST /api/auth/register
 * @desc    사용자 회원가입
 * @access  Public
 */
router.post('/register', register);

/**
 * @route   POST /api/auth/login
 * @desc    사용자 로그인
 * @access  Public
 */
router.post('/login', login);

/**
 * @route   GET /api/auth/me
 * @desc    현재 사용자 정보 조회
 * @access  Private
 */
router.get('/me', authenticateToken, getMe);

/**
 * @route   POST /api/auth/change-password
 * @desc    비밀번호 변경
 * @access  Private
 */
router.post('/change-password', authenticateToken, changePassword);

/**
 * @route   POST /api/auth/logout
 * @desc    로그아웃 (클라이언트에서 토큰 제거)
 * @access  Public
 */
router.post('/logout', (req, res) => {
  res.json({
    success: true,
    message: '로그아웃이 완료되었습니다.',
  });
});

export default router; 