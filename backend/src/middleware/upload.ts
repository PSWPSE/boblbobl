import multer from 'multer';
import { Request } from 'express';

// 메모리 스토리지 설정 (파일을 메모리에 저장)
const storage = multer.memoryStorage();

// 파일 필터 함수
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // 허용된 MIME 타입
  const allowedTypes = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
    'application/msword', // .doc
    'text/plain' // .txt
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('지원하지 않는 파일 형식입니다. PDF, DOC, DOCX, TXT 파일만 업로드 가능합니다.'));
  }
};

// Multer 설정
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB 제한
    files: 1 // 한 번에 하나의 파일만
  }
});

// 단일 파일 업로드 미들웨어
export const uploadSingleFile = upload.single('file');

// 에러 처리 미들웨어
export const handleUploadError = (error: any, req: Request, res: any, next: any) => {
  if (error instanceof multer.MulterError) {
    switch (error.code) {
      case 'LIMIT_FILE_SIZE':
        return res.status(400).json({
          success: false,
          error: '파일 크기가 너무 큽니다. 최대 10MB까지 업로드 가능합니다.'
        });
      case 'LIMIT_FILE_COUNT':
        return res.status(400).json({
          success: false,
          error: '한 번에 하나의 파일만 업로드 가능합니다.'
        });
      case 'LIMIT_UNEXPECTED_FILE':
        return res.status(400).json({
          success: false,
          error: '예상하지 못한 파일 필드입니다.'
        });
      default:
        return res.status(400).json({
          success: false,
          error: `파일 업로드 오류: ${error.message}`
        });
    }
  }

  if (error.message) {
    return res.status(400).json({
      success: false,
      error: error.message
    });
  }

  next(error);
};

export default upload; 