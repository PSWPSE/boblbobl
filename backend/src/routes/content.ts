import express from 'express';
import {
  generateAIContent,
  regenerateAIContent,
  getGeneratedContents,
  getGeneratedContentById,
  updateGeneratedContent,
  deleteGeneratedContent,
  getContentStats
} from '../controllers/contentController';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

/**
 * @route   POST /api/content/generate
 * @desc    AI 콘텐츠 생성
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