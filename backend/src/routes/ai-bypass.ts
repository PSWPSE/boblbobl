import express from 'express';
import {
  processAIDetectionBypass,
  humanizeText,
  convertWritingStyle,
  assessAIDetectionRisk,
  getUserAIBypassHistory,
  getAIBypassResult,
  deleteAIBypassResult
} from '../controllers/aiBypassController';
import { authenticate } from '../middleware/auth';
import { body, param, query } from 'express-validator';
import { validate } from '../middleware/validate';

const router = express.Router();

// AI 탐지 우회 처리
router.post('/process',
  authenticate,
  [
    body('text').notEmpty().withMessage('처리할 텍스트는 필수입니다'),
    body('humanizationLevel').optional().isIn(['low', 'medium', 'high']).withMessage('인간화 레벨이 올바르지 않습니다'),
    body('writingStyle').optional().isIn(['formal', 'casual', 'conversational', 'professional']).withMessage('문체가 올바르지 않습니다'),
    body('targetLanguage').optional().isIn(['ko', 'en']).withMessage('대상 언어가 올바르지 않습니다'),
    body('preserveKeywords').optional().isArray().withMessage('보존할 키워드는 배열이어야 합니다'),
    body('addPersonalTouch').optional().isBoolean().withMessage('개인적 터치는 boolean 값이어야 합니다'),
    body('varyParagraphLength').optional().isBoolean().withMessage('단락 길이 조정은 boolean 값이어야 합니다'),
    body('insertNaturalTransitions').optional().isBoolean().withMessage('자연스러운 전환은 boolean 값이어야 합니다')
  ],
  validate,
  processAIDetectionBypass
);

// 텍스트 자연화
router.post('/humanize',
  authenticate,
  [
    body('text').notEmpty().withMessage('자연화할 텍스트는 필수입니다'),
    body('level').optional().isIn(['low', 'medium', 'high']).withMessage('자연화 레벨이 올바르지 않습니다')
  ],
  validate,
  humanizeText
);

// 문체 변환
router.post('/convert-style',
  authenticate,
  [
    body('text').notEmpty().withMessage('변환할 텍스트는 필수입니다'),
    body('toStyle').notEmpty().isIn(['formal', 'casual', 'conversational', 'professional']).withMessage('변환할 문체가 올바르지 않습니다'),
    body('fromStyle').optional().isIn(['formal', 'casual', 'conversational', 'professional']).withMessage('원본 문체가 올바르지 않습니다')
  ],
  validate,
  convertWritingStyle
);

// AI 탐지 위험도 평가
router.post('/assess-risk',
  authenticate,
  [
    body('text').notEmpty().withMessage('평가할 텍스트는 필수입니다')
  ],
  validate,
  assessAIDetectionRisk
);

// 사용자 AI 우회 처리 기록 조회
router.get('/history',
  authenticate,
  [
    query('page').optional().isInt({ min: 1 }).withMessage('페이지는 1 이상의 정수여야 합니다'),
    query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('한 페이지 당 항목 수는 1-50 사이여야 합니다')
  ],
  validate,
  getUserAIBypassHistory
);

// 특정 AI 우회 처리 결과 조회
router.get('/:id',
  authenticate,
  [
    param('id').isUUID().withMessage('유효하지 않은 결과 ID입니다')
  ],
  validate,
  getAIBypassResult
);

// AI 우회 처리 결과 삭제
router.delete('/:id',
  authenticate,
  [
    param('id').isUUID().withMessage('유효하지 않은 결과 ID입니다')
  ],
  validate,
  deleteAIBypassResult
);

export default router; 