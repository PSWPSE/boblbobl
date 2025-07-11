import { Request } from 'express';

// 사용자 관련 타입
export interface User {
  id: string;
  email: string;
  name: string;
  provider: 'google' | 'email' | 'naver' | 'kakao';
  providerId?: string;
  subscription: 'free' | 'premium';
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserInput {
  email: string;
  name: string;
  provider: 'google' | 'email' | 'naver' | 'kakao';
  providerId?: string;
  password?: string;
}

// 콘텐츠 가이드라인 관련 타입
export interface GuidelineKeywords {
  tone: string[];           // 어조
  structure: string[];      // 구조
  readability: string[];    // 가독성
  seo: string[];           // SEO
  engagement: string[];     // 참여도
  format: string[];        // 형식
}

export interface ContentGuideline {
  id: string;
  userId: string;
  name: string;
  keywords?: GuidelineKeywords;
  memo?: string;
  type: 'keywords' | 'memo';
  createdAt: Date;
}

export interface CreateGuidelineInput {
  name: string;
  keywords?: GuidelineKeywords;
  memo?: string;
  type: 'keywords' | 'memo';
}

// 소스 데이터 관련 타입
export interface SourceData {
  id: string;
  userId: string;
  filename?: string;
  fileType: 'pdf' | 'docx' | 'txt' | 'url';
  fileUrl?: string;
  extractedText?: string;
  metadata?: any;
  createdAt: Date;
}

export interface CreateSourceDataInput {
  filename?: string;
  fileType: 'pdf' | 'docx' | 'txt' | 'url';
  fileUrl?: string;
  extractedText?: string;
  metadata?: any;
}

// 생성된 콘텐츠 관련 타입
export interface GeneratedContent {
  id: string;
  userId: string;
  guidelineId: string;
  sourceDataId: string;
  title: string;
  content: string;
  thumbnailUrl?: string;
  seoMetadata?: {
    title: string;
    description: string;
    keywords: string[];
  };
  createdAt: Date;
}

export interface CreateContentInput {
  guidelineId: string;
  sourceDataId: string;
  title: string;
  content: string;
  thumbnailUrl?: string;
  seoMetadata?: {
    title: string;
    description: string;
    keywords: string[];
  };
}

// API 응답 타입
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// JWT 토큰 관련 타입
export interface JwtPayload {
  userId: string;
  email: string;
  name: string;
  iat: number;
  exp: number;
}

// Express Request 확장 타입 (any 타입으로 간단히 처리)
export interface AuthenticatedRequest {
  user?: {
    userId: string;
    email: string;
    name: string;
  };
  [key: string]: any;
}

// 파일 업로드 관련 타입
export interface FileUpload {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

// AI 우회 관련 메타데이터 타입
export interface AIBypassMetadata {
  humanizationScore?: number;
  detectionRisk?: 'low' | 'medium' | 'high';
  changesCount?: number;
  originalLength?: number;
  processedLength?: number;
  processingTime?: number;
}

// 썸네일 관련 메타데이터 타입
export interface ThumbnailMetadata {
  generationType?: string;
  prompt?: string;
  style?: string;
  aspectRatio?: string;
  imageUrl?: string;
  optimizedUrl?: string;
}

// 통합 메타데이터 타입
export interface ContentMetadata {
  wordCount?: number;
  charCount?: number;
  readingTime?: number;
  seoScore?: number;
  keywordCount?: number;
  analysisDate?: string;
  // AI 우회 관련
  humanizationScore?: number;
  detectionRisk?: 'low' | 'medium' | 'high';
  changesCount?: number;
  // 썸네일 관련
  generationType?: string;
  prompt?: string;
  style?: string;
  aspectRatio?: string;
  imageUrl?: string;
  optimizedUrl?: string;
  // 기타
  [key: string]: any;
}