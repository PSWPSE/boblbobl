import express from 'express';
import {
  getKeywordOptions,
  getGuidelines,
  getGuidelineById,
  createGuideline,
  updateGuideline,
  deleteGuideline
} from '../controllers/guidelineController';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

/**
 * @route   GET /api/guidelines/keywords
 * @desc    사전 정의된 키워드 옵션 조회
 * @access  Public
 */
router.get('/keywords', getKeywordOptions);

/**
 * @route   GET /api/guidelines
 * @desc    사용자의 가이드라인 목록 조회
 * @access  Private
 */
router.get('/', authenticateToken, getGuidelines);

/**
 * @route   GET /api/guidelines/:id
 * @desc    특정 가이드라인 조회
 * @access  Private
 */
router.get('/:id', authenticateToken, getGuidelineById);

/**
 * @route   POST /api/guidelines
 * @desc    새 가이드라인 생성
 * @access  Private
 */
router.post('/', authenticateToken, createGuideline);

/**
 * @route   PUT /api/guidelines/:id
 * @desc    가이드라인 수정
 * @access  Private
 */
router.put('/:id', authenticateToken, updateGuideline);

/**
 * @route   DELETE /api/guidelines/:id
 * @desc    가이드라인 삭제
 * @access  Private
 */
router.delete('/:id', authenticateToken, deleteGuideline);

export default router; 