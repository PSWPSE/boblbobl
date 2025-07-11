import express from 'express';
import {
  generateAIContent,
  generateSimpleContent,
  regenerateAIContent,
  regenerateContentPart,
  suggestContentImprovements,
  getGeneratedContents,
  getGeneratedContentById,
  updateGeneratedContent,
  deleteGeneratedContent,
  getContentStats
} from '../controllers/contentController';
import { authenticateToken } from '../middleware/auth';
import { testOpenAIConnection } from '../utils/openai';

const router = express.Router();

// 선택적 인증 미들웨어 (로그인하지 않아도 사용 가능)
const optionalAuth = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    // 인증 헤더가 없으면 그냥 진행 (비로그인 사용자)
    next();
    return;
  }
  
  // 인증 헤더가 있으면 토큰 검증
  authenticateToken(req, res, next);
};

/**
 * @route   GET /api/content/test-openai
 * @desc    OpenAI 연결 상태 테스트
 * @access  Public
 */
router.get('/test-openai', async (req, res) => {
  try {
    console.log('🔍 OpenAI 연결 테스트 시작');
    console.log('API Key 설정 상태:', process.env.OPENAI_API_KEY ? '설정됨' : '없음');
    console.log('API Key 앞 20자:', process.env.OPENAI_API_KEY?.substring(0, 20) || 'N/A');
    
    const isConnected = await testOpenAIConnection();
    
    res.json({
      success: true,
      data: {
        connected: isConnected,
        apiKeySet: !!process.env.OPENAI_API_KEY,
        apiKeyPrefix: process.env.OPENAI_API_KEY?.substring(0, 20) || null,
        environment: process.env.NODE_ENV
      }
    });
  } catch (error) {
    console.error('OpenAI 테스트 오류:', error);
    res.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      data: {
        connected: false,
        apiKeySet: !!process.env.OPENAI_API_KEY,
        apiKeyPrefix: process.env.OPENAI_API_KEY?.substring(0, 20) || null,
        environment: process.env.NODE_ENV
      }
    });
  }
});

/**
 * @route   POST /api/content/generate/simple
 * @desc    간단한 AI 콘텐츠 생성 (3가지 방식: topic, news, url)
 * @access  Public (비로그인 사용자도 가능, 로그인 시 저장)
 */
router.post('/generate/simple', optionalAuth, generateSimpleContent);

/**
 * @route   POST /api/content/regenerate/part
 * @desc    콘텐츠 부분 재생성 (title, summary, content, tags)
 * @access  Public
 */
router.post('/regenerate/part', optionalAuth, regenerateContentPart);

/**
 * @route   POST /api/content/analyze
 * @desc    콘텐츠 품질 분석 및 개선 제안
 * @access  Public
 */
router.post('/analyze', optionalAuth, suggestContentImprovements);

/**
 * @route   POST /api/content/generate
 * @desc    AI 콘텐츠 생성 (기존 복잡한 방식)
 * @access  Private
 */
router.post('/generate', authenticateToken, generateAIContent);

/**
 * @route   POST /api/content/regenerate
 * @desc    AI 콘텐츠 재생성
 * @access  Private
 */
router.post('/regenerate', authenticateToken, regenerateAIContent);

/**
 * @route   GET /api/content/stats
 * @desc    콘텐츠 통계 조회
 * @access  Private
 */
router.get('/stats', authenticateToken, getContentStats);

/**
 * @route   GET /api/content
 * @desc    생성된 콘텐츠 목록 조회
 * @access  Private
 */
router.get('/', authenticateToken, getGeneratedContents);

/**
 * @route   GET /api/content/:id
 * @desc    특정 콘텐츠 조회
 * @access  Private
 */
router.get('/:id', authenticateToken, getGeneratedContentById);

/**
 * @route   PUT /api/content/:id
 * @desc    콘텐츠 수정
 * @access  Private
 */
router.put('/:id', authenticateToken, updateGeneratedContent);

/**
 * @route   DELETE /api/content/:id
 * @desc    콘텐츠 삭제
 * @access  Private
 */
router.delete('/:id', authenticateToken, deleteGeneratedContent);

export default router; 