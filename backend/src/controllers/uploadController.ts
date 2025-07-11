import { Request, Response } from 'express';
import { ApiResponse, CreateSourceDataInput } from '../types';
import prisma from '../utils/database';
import { processFile, extractTextFromURL, validateExtractedText } from '../utils/fileProcessor';
import { uploadFileToCloudinary, deleteFileFromCloudinary } from '../utils/cloudinary';

/**
 * 파일 업로드 및 텍스트 추출
 */
export async function uploadFile(req: Request, res: Response<ApiResponse<any>>): Promise<void> {
  try {
    if (!req.user || !req.user.userId) {
      res.status(401).json({
        success: false,
        error: '인증이 필요합니다.'
      });
      return;
    }

    const file = req.file;
    if (!file) {
      res.status(400).json({
        success: false,
        error: '파일이 업로드되지 않았습니다.'
      });
      return;
    }

    // 파일 크기 제한 검사 (50MB)
    if (file.size > 50 * 1024 * 1024) {
      res.status(400).json({
        success: false,
        error: '파일 크기는 50MB를 초과할 수 없습니다.'
      });
      return;
    }

    // 지원되는 파일 형식 검사
    const supportedTypes = ['application/pdf', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!supportedTypes.includes(file.mimetype)) {
      res.status(400).json({
        success: false,
        error: '지원되지 않는 파일 형식입니다. PDF, TXT, DOC, DOCX 파일만 업로드 가능합니다.'
      });
      return;
    }

    // Cloudinary에 파일 업로드
    const cloudinaryResult = await uploadFileToCloudinary(file.buffer, {
      folder: 'blogcraft-uploads',
      resource_type: 'auto',
      public_id: `${Date.now()}-${file.originalname.replace(/\.[^/.]+$/, '')}`
    });

    // 파일에서 텍스트 추출
    const processResult = await processFile(file.buffer, file.mimetype, file.originalname);
    
    // 텍스트 품질 검증
    const validation = validateExtractedText(processResult.extractedText);
    if (!validation.isValid) {
      res.status(400).json({
        success: false,
        error: `파일 처리 중 문제가 발견되었습니다: ${validation.issues.join(', ')}`
      });
      return;
    }

    // 데이터베이스에 저장
    const sourceData = await prisma.sourceData.create({
      data: {
        userId: req.user.userId,
        filename: file.originalname,
        fileType: getFileTypeFromMimetype(file.mimetype),
        fileUrl: cloudinaryResult.secure_url,
        extractedText: processResult.extractedText,
        metadata: {
          ...processResult.metadata,
          cloudinaryPublicId: cloudinaryResult.public_id,
          uploadedAt: new Date().toISOString(),
          fileSize: file.size,
          mimetype: file.mimetype
        }
      }
    });

    res.status(201).json({
      success: true,
      data: sourceData,
      message: '파일이 성공적으로 업로드되고 처리되었습니다.'
    });

  } catch (error) {
    console.error('File upload error:', error);
    res.status(500).json({
      success: false,
      error: '파일 업로드 중 오류가 발생했습니다.'
    });
  }
}

/**
 * URL에서 텍스트 추출
 */
export async function processURL(req: Request, res: Response<ApiResponse<any>>): Promise<void> {
  try {
    if (!req.user || !req.user.userId) {
      res.status(401).json({
        success: false,
        error: '인증이 필요합니다.'
      });
      return;
    }

    const { url } = req.body;
    if (!url) {
      res.status(400).json({
        success: false,
        error: 'URL이 제공되지 않았습니다.'
      });
      return;
    }

    // URL에서 텍스트 추출
    const processResult = await extractTextFromURL(url);
    
    // 텍스트 품질 검증
    const validation = validateExtractedText(processResult.extractedText);
    if (!validation.isValid) {
      res.status(400).json({
        success: false,
        error: `URL 처리 중 문제가 발견되었습니다: ${validation.issues.join(', ')}`
      });
      return;
    }

    // 데이터베이스에 저장
    const sourceData = await prisma.sourceData.create({
      data: {
        userId: req.user.userId,
        filename: processResult.metadata.title || 'URL 콘텐츠',
        fileType: 'url',
        fileUrl: url,
        extractedText: processResult.extractedText,
        metadata: {
          ...processResult.metadata,
          processedAt: new Date().toISOString()
        }
      }
    });

    res.status(201).json({
      success: true,
      data: sourceData,
      message: 'URL 콘텐츠가 성공적으로 처리되었습니다.'
    });

  } catch (error) {
    console.error('URL processing error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'URL 처리 중 오류가 발생했습니다.'
    });
  }
}

/**
 * 사용자의 소스 데이터 목록 조회
 */
export async function getSourceData(req: Request, res: Response<ApiResponse<any>>): Promise<void> {
  try {
    if (!req.user || !req.user.userId) {
      res.status(401).json({
        success: false,
        error: '인증이 필요합니다.'
      });
      return;
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const [sourceData, total] = await Promise.all([
      prisma.sourceData.findMany({
        where: { userId: req.user.userId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: { generatedContent: true }
          }
        }
      }),
      prisma.sourceData.count({
        where: { userId: req.user.userId }
      })
    ]);

    const totalPages = Math.ceil(total / limit);

    res.json({
      success: true,
      data: {
        items: sourceData,
        pagination: {
          page,
          limit,
          total,
          totalPages
        }
      }
    });

  } catch (error) {
    console.error('Get source data error:', error);
    res.status(500).json({
      success: false,
      error: '소스 데이터 조회 중 오류가 발생했습니다.'
    });
  }
}

/**
 * 특정 소스 데이터 조회
 */
export async function getSourceDataById(req: Request, res: Response<ApiResponse<any>>): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: '인증이 필요합니다.'
      });
      return;
    }

    const { id } = req.params;

    const sourceData = await prisma.sourceData.findFirst({
      where: {
        id,
        userId: req.user.userId
      },
      include: {
        _count: {
          select: { generatedContent: true }
        }
      }
    });

    if (!sourceData) {
      res.status(404).json({
        success: false,
        error: '소스 데이터를 찾을 수 없습니다.'
      });
      return;
    }

    res.json({
      success: true,
      data: sourceData
    });

  } catch (error) {
    console.error('Get source data by id error:', error);
    res.status(500).json({
      success: false,
      error: '소스 데이터 조회 중 오류가 발생했습니다.'
    });
  }
}

/**
 * 소스 데이터 삭제
 */
export async function deleteSourceData(req: Request, res: Response<ApiResponse<any>>): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: '인증이 필요합니다.'
      });
      return;
    }

    const { id } = req.params;

    // 소스 데이터 존재 확인
    const existingSourceData = await prisma.sourceData.findFirst({
      where: {
        id,
        userId: req.user.userId
      }
    });

    if (!existingSourceData) {
      res.status(404).json({
        success: false,
        error: '소스 데이터를 찾을 수 없습니다.'
      });
      return;
    }

    // 연관된 생성 콘텐츠 확인
    const relatedContent = await prisma.generatedContent.count({
      where: { sourceDataId: id }
    });

    if (relatedContent > 0) {
      res.status(400).json({
        success: false,
        error: '이 소스 데이터로 생성된 콘텐츠가 있어 삭제할 수 없습니다.'
      });
      return;
    }

    // Cloudinary에서 파일 삭제 (파일이 업로드된 경우)
    if (existingSourceData.metadata && 
        typeof existingSourceData.metadata === 'object' && 
        'cloudinaryPublicId' in existingSourceData.metadata) {
      try {
        await deleteFileFromCloudinary(existingSourceData.metadata.cloudinaryPublicId as string);
      } catch (error) {
        console.error('Cloudinary 파일 삭제 실패:', error);
        // Cloudinary 삭제 실패해도 DB에서는 삭제 진행
      }
    }

    // 데이터베이스에서 삭제
    await prisma.sourceData.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: '소스 데이터가 성공적으로 삭제되었습니다.'
    });

  } catch (error) {
    console.error('Delete source data error:', error);
    res.status(500).json({
      success: false,
      error: '소스 데이터 삭제 중 오류가 발생했습니다.'
    });
  }
}

/**
 * MIME 타입에서 파일 타입 추출
 */
function getFileTypeFromMimetype(mimetype: string): string {
  switch (mimetype) {
    case 'application/pdf':
      return 'pdf';
    case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
      return 'docx';
    case 'application/msword':
      return 'doc';
    case 'text/plain':
      return 'txt';
    default:
      return 'unknown';
  }
} 