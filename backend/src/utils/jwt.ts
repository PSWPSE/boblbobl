import jwt from 'jsonwebtoken';
import { JwtPayload } from '../types';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export interface TokenPayload {
  userId: string;
  email: string;
  name: string;
}

/**
 * JWT 토큰 생성
 */
export function generateToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: 60 * 60 * 24 * 7 }); // 7일 (초 단위)
}

/**
 * JWT 토큰 검증 및 디코딩
 */
export function verifyToken(token: string): JwtPayload {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    return decoded;
  } catch (error) {
    console.error('토큰 검증 에러:', error);
    throw new Error('Invalid token');
  }
}

/**
 * JWT 토큰에서 사용자 ID 추출
 */
export function getUserIdFromToken(token: string): string {
  try {
    const decoded = verifyToken(token);
    return decoded.userId;
  } catch (error) {
    throw new Error('Invalid token');
  }
}

/**
 * Authorization 헤더에서 Bearer 토큰 추출
 */
export function extractTokenFromHeader(authHeader: string): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  return authHeader.substring(7); // "Bearer " 제거
}

/**
 * 토큰 만료 시간 확인
 */
export function isTokenExpired(token: string): boolean {
  try {
    const decoded = verifyToken(token);
    const currentTime = Math.floor(Date.now() / 1000);
    return decoded.exp ? decoded.exp < currentTime : true;
  } catch (error) {
    return true;
  }
} 