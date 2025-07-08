import express from 'express';
import {
  uploadFile,
  processURL,
  getSourceData,
  getSourceDataById,
  deleteSourceData
} from '../controllers/uploadController';
import { authenticateToken } from '../middleware/auth';
import { uploadSingleFile, handleUploadError } from '../middleware/upload';

const router = express.Router();

/**
 * @route   POST /api/upload/file
 * @desc    파일 업로드 및 텍스트 추출
 * @access  Private
 */
router.post('/file', 
  authenticateToken, 
  uploadSingleFile, 
  handleUploadError,
  uploadFile
);

/**
 * @route   POST /api/upload/url
 * @desc    URL에서 텍스트 추출
 * @access  Private
 */
router.post('/url', authenticateToken, processURL);

/**
 * @route   GET /api/upload
 * @desc    사용자의 소스 데이터 목록 조회
 * @access  Private
 */
router.get('/', authenticateToken, getSourceData);

/**
 * @route   GET /api/upload/:id
 * @desc    특정 소스 데이터 조회
 * @access  Private
 */
router.get('/:id', authenticateToken, getSourceDataById);

/**
 * @route   DELETE /api/upload/:id
 * @desc    소스 데이터 삭제
 * @access  Private
 */
router.delete('/:id', authenticateToken, deleteSourceData);

export default router; 