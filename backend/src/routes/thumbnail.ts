import express from 'express';
import { 
  generateBasicThumbnail, 
  generateThumbnailWithOverlay, 
  generateTemplatedThumbnail,
  getUserThumbnails,
  getThumbnail,
  deleteThumbnail,
  getThumbnailOptions
} from '../controllers/thumbnailController';
import { authenticate } from '../middleware/auth';
import { body, param, query } from 'express-validator';
import { validate } from '../middleware/validate';

const router = express.Router();

// 썸네일 생성 옵션 조회 (인증 불필요)
router.get('/options', getThumbnailOptions);

// 기본 썸네일 생성
router.post('/generate', 
  authenticate,
  [
    body('title').notEmpty().withMessage('제목은 필수입니다'),
    body('content').notEmpty().withMessage('내용은 필수입니다'),
    body('tags').optional().isArray().withMessage('태그는 배열이어야 합니다'),
    body('style').optional().isIn(['modern', 'minimal', 'colorful', 'professional', 'illustration', 'photorealistic']).withMessage('유효하지 않은 스타일입니다'),
    body('aspectRatio').optional().isIn(['16:9', '4:3', '1:1', '9:16']).withMessage('유효하지 않은 비율입니다'),
    body('language').optional().isIn(['ko', 'en']).withMessage('유효하지 않은 언어입니다')
  ],
  validate,
  generateBasicThumbnail
);

// 텍스트 오버레이 썸네일 생성
router.post('/generate/with-text',
  authenticate,
  [
    body('title').notEmpty().withMessage('제목은 필수입니다'),
    body('content').notEmpty().withMessage('내용은 필수입니다'),
    body('overlayText.title').notEmpty().withMessage('오버레이 제목은 필수입니다'),
    body('overlayText.subtitle').optional().isString().withMessage('오버레이 부제목은 문자열이어야 합니다'),
    body('overlayText.backgroundColor').optional().isString().withMessage('배경색은 문자열이어야 합니다'),
    body('overlayText.textColor').optional().isString().withMessage('텍스트 색상은 문자열이어야 합니다'),
    body('tags').optional().isArray().withMessage('태그는 배열이어야 합니다'),
    body('style').optional().isIn(['modern', 'minimal', 'colorful', 'professional', 'illustration', 'photorealistic']).withMessage('유효하지 않은 스타일입니다'),
    body('aspectRatio').optional().isIn(['16:9', '4:3', '1:1', '9:16']).withMessage('유효하지 않은 비율입니다'),
    body('language').optional().isIn(['ko', 'en']).withMessage('유효하지 않은 언어입니다')
  ],
  validate,
  generateThumbnailWithOverlay
);

// 템플릿 기반 썸네일 생성
router.post('/generate/templated',
  authenticate,
  [
    body('title').notEmpty().withMessage('제목은 필수입니다'),
    body('content').notEmpty().withMessage('내용은 필수입니다'),
    body('template').isIn(['tech', 'lifestyle', 'business', 'travel', 'food', 'health']).withMessage('유효하지 않은 템플릿입니다'),
    body('tags').optional().isArray().withMessage('태그는 배열이어야 합니다'),
    body('style').optional().isIn(['modern', 'minimal', 'colorful', 'professional', 'illustration', 'photorealistic']).withMessage('유효하지 않은 스타일입니다'),
    body('aspectRatio').optional().isIn(['16:9', '4:3', '1:1', '9:16']).withMessage('유효하지 않은 비율입니다'),
    body('language').optional().isIn(['ko', 'en']).withMessage('유효하지 않은 언어입니다')
  ],
  validate,
  generateTemplatedThumbnail
);

// 사용자 썸네일 목록 조회
router.get('/my-thumbnails',
  authenticate,
  [
    query('page').optional().isInt({ min: 1 }).withMessage('페이지는 1 이상의 정수여야 합니다'),
    query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('한 페이지 당 항목 수는 1-50 사이여야 합니다')
  ],
  validate,
  getUserThumbnails
);

// 특정 썸네일 조회
router.get('/:id',
  authenticate,
  [
    param('id').isUUID().withMessage('유효하지 않은 썸네일 ID입니다')
  ],
  validate,
  getThumbnail
);

// 썸네일 삭제
router.delete('/:id',
  authenticate,
  [
    param('id').isUUID().withMessage('유효하지 않은 썸네일 ID입니다')
  ],
  validate,
  deleteThumbnail
);

export default router; 