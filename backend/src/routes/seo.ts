import express from 'express';
import { 
  analyzeSEOContent,
  getNaverBlogOptimization,
  analyzeKeywords,
  analyzeReadability,
  generateMetaTagsAPI,
  getUserSEOAnalyses,
  getSEOAnalysis,
  deleteSEOAnalysis
} from '../controllers/seoController';
import { authenticate } from '../middleware/auth';
import { body, param, query } from 'express-validator';
import { validate } from '../middleware/validate';

const router = express.Router();

// SEO 분석 수행
router.post('/analyze', 
  authenticate,
  [
    body('title').notEmpty().withMessage('제목은 필수입니다'),
    body('content').notEmpty().withMessage('내용은 필수입니다'),
    body('metaDescription').optional().isString().withMessage('메타 설명은 문자열이어야 합니다'),
    body('targetKeywords').optional().isArray().withMessage('타겟 키워드는 배열이어야 합니다')
  ],
  validate,
  analyzeSEOContent
);

// 네이버 블로그 최적화 제안
router.post('/naver-optimization',
  authenticate,
  [
    body('title').notEmpty().withMessage('제목은 필수입니다'),
    body('content').notEmpty().withMessage('내용은 필수입니다'),
    body('tags').optional().isArray().withMessage('태그는 배열이어야 합니다')
  ],
  validate,
  getNaverBlogOptimization
);

// 키워드 분석
router.post('/keywords',
  authenticate,
  [
    body('content').notEmpty().withMessage('분석할 내용은 필수입니다'),
    body('targetKeywords').optional().isArray().withMessage('타겟 키워드는 배열이어야 합니다')
  ],
  validate,
  analyzeKeywords
);

// 가독성 분석
router.post('/readability',
  authenticate,
  [
    body('content').notEmpty().withMessage('분석할 내용은 필수입니다')
  ],
  validate,
  analyzeReadability
);

// 메타 태그 생성
router.post('/meta-tags',
  authenticate,
  [
    body('title').notEmpty().withMessage('제목은 필수입니다'),
    body('description').notEmpty().withMessage('설명은 필수입니다'),
    body('keywords').optional().isArray().withMessage('키워드는 배열이어야 합니다'),
    body('imageUrl').optional().isURL().withMessage('이미지 URL 형식이 올바르지 않습니다')
  ],
  validate,
  generateMetaTagsAPI
);

// 사용자 SEO 분석 기록 조회
router.get('/my-analyses',
  authenticate,
  [
    query('page').optional().isInt({ min: 1 }).withMessage('페이지는 1 이상의 정수여야 합니다'),
    query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('한 페이지 당 항목 수는 1-50 사이여야 합니다')
  ],
  validate,
  getUserSEOAnalyses
);

// 특정 SEO 분석 조회
router.get('/:id',
  authenticate,
  [
    param('id').isUUID().withMessage('유효하지 않은 분석 ID입니다')
  ],
  validate,
  getSEOAnalysis
);

// SEO 분석 삭제
router.delete('/:id',
  authenticate,
  [
    param('id').isUUID().withMessage('유효하지 않은 분석 ID입니다')
  ],
  validate,
  deleteSEOAnalysis
);

export default router; 