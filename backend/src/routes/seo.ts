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
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// SEO 분석 수행
router.post('/analyze', authenticateToken, analyzeSEOContent);

// 네이버 블로그 최적화 분석
router.post('/naver-optimization', authenticateToken, getNaverBlogOptimization);

// 키워드 분석
router.post('/keywords', authenticateToken, analyzeKeywords);

// 가독성 분석
router.post('/readability', authenticateToken, analyzeReadability);

// 메타 태그 생성
router.post('/meta-tags', authenticateToken, generateMetaTagsAPI);

// 사용자 SEO 분석 기록 조회
router.get('/my-analyses', authenticateToken, getUserSEOAnalyses);

// 특정 SEO 분석 조회
router.get('/:id', authenticateToken, getSEOAnalysis);

// SEO 분석 삭제
router.delete('/:id', authenticateToken, deleteSEOAnalysis);

export default router; 