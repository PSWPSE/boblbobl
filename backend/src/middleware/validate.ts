import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';

/**
 * 요청 검증 미들웨어
 */
export const validate = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: '입력 값 검증 실패',
      details: errors.array()
    });
  }
  
  next();
}; 