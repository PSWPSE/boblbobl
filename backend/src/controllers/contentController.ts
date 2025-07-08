import { Request, Response } from 'express';
import { ApiResponse, PaginatedResponse } from '../types';
import prisma from '../utils/database';
import { generateContent, regenerateContent, ContentGenerationRequest } from '../utils/openai';

export interface GenerateContentRequest {
  sourceDataId: string;
  guidelineId: string;
  additionalPrompt?: string;
  contentType?: 'blog' | 'news' | 'review' | 'tutorial';
  targetLength?: number;
}

export interface RegenerateContentRequest {
  contentId: string;
  modificationRequest: string;
}

/**
 * AI 콘텐츠 생성
 */
export async function generateAIContent(req: Request, res: Response<ApiResponse<any>>): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: '인증이 필요합니다.'
      });
      return;
    }

    const { sourceDataId, guidelineId, additionalPrompt, contentType = 'blog', targetLength = 800 }: GenerateContentRequest = req.body;

    // 입력 검증
    if (!sourceDataId || !guidelineId) {
      res.status(400).json({
        success: false,
        error: '소스 데이터와 가이드라인을 선택해주세요.'
      });
      return;
    }

    // 소스 데이터 조회
    const sourceData = await prisma.sourceData.findFirst({
      where: {
        id: sourceDataId,
        userId: req.user.userId
      }
    });

    if (!sourceData) {
      res.status(404).json({
        success: false,
        error: '소스 데이터를 찾을 수 없습니다.'
      });
      return;
    }

    // 가이드라인 조회
    const guideline = await prisma.contentGuideline.findFirst({
      where: {
        id: guidelineId,
        userId: req.user.userId
      }
    });

    if (!guideline) {
      res.status(404).json({
        success: false,
        error: '가이드라인을 찾을 수 없습니다.'
      });
      return;
    }

    // OpenAI API 요청 준비
    const generationRequest: ContentGenerationRequest = {
      sourceText: sourceData.extractedText,
      guideline: {
        name: guideline.name,
        type: guideline.type,
        keywords: guideline.keywords ? guideline.keywords as any : undefined,
        memo: guideline.memo || undefined
      },
      additionalPrompt,
      contentType,
      targetLength
    };

    // AI 콘텐츠 생성
    const aiResponse = await generateContent(generationRequest);

    // 데이터베이스에 저장
    const generatedContent = await prisma.generatedContent.create({
      data: {
        userId: req.user.userId,
        sourceDataId,
        guidelineId,
        title: aiResponse.title,
        content: aiResponse.content,
        summary: aiResponse.summary,
        tags: aiResponse.tags,
        metadata: {
          ...aiResponse.metadata,
          generationRequest: {
            additionalPrompt,
            contentType,
            targetLength
          }
        },
        status: 'draft'
      }
    });

    res.status(201).json({
      success: true,
      data: generatedContent,
      message: '콘텐츠가 성공적으로 생성되었습니다.'
    });

  } catch (error) {
    console.error('Content generation error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '콘텐츠 생성 중 오류가 발생했습니다.'
    });
  }
}

/**
 * 콘텐츠 재생성
 */
export async function regenerateAIContent(req: Request, res: Response<ApiResponse<any>>): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: '인증이 필요합니다.'
      });
      return;
    }

    const { contentId, modificationRequest }: RegenerateContentRequest = req.body;

    if (!contentId || !modificationRequest) {
      res.status(400).json({
        success: false,
        error: '콘텐츠 ID와 수정 요청사항을 입력해주세요.'
      });
      return;
    }

    // 기존 콘텐츠 조회
    const existingContent = await prisma.generatedContent.findFirst({
      where: {
        id: contentId,
        userId: req.user.userId
      },
      include: {
        sourceData: true,
        guideline: true
      }
    });

    if (!existingContent) {
      res.status(404).json({
        success: false,
        error: '콘텐츠를 찾을 수 없습니다.'
      });
      return;
    }

    // 원본 생성 요청 재구성
    const originalRequest: ContentGenerationRequest = {
      sourceText: existingContent.sourceData.extractedText,
      guideline: {
        name: existingContent.guideline.name,
        type: existingContent.guideline.type,
        keywords: existingContent.guideline.keywords ? existingContent.guideline.keywords as any : undefined,
        memo: existingContent.guideline.memo || undefined
      },
      additionalPrompt: existingContent.metadata && 
        typeof existingContent.metadata === 'object' && 
        'generationRequest' in existingContent.metadata
        ? (existingContent.metadata.generationRequest as any)?.additionalPrompt
        : undefined,
      contentType: existingContent.metadata && 
        typeof existingContent.metadata === 'object' && 
        'generationRequest' in existingContent.metadata
        ? (existingContent.metadata.generationRequest as any)?.contentType || 'blog'
        : 'blog',
      targetLength: existingContent.metadata && 
        typeof existingContent.metadata === 'object' && 
        'generationRequest' in existingContent.metadata
        ? (existingContent.metadata.generationRequest as any)?.targetLength || 800
        : 800
    };

    // AI 콘텐츠 재생성
    const aiResponse = await regenerateContent(originalRequest, existingContent.content, modificationRequest);

    // 데이터베이스 업데이트
    const updatedContent = await prisma.generatedContent.update({
      where: { id: contentId },
      data: {
        title: aiResponse.title,
        content: aiResponse.content,
        summary: aiResponse.summary,
        tags: aiResponse.tags,
        metadata: {
          ...aiResponse.metadata,
          generationRequest: originalRequest,
          regenerationHistory: [
            ...(existingContent.metadata && 
                typeof existingContent.metadata === 'object' && 
                'regenerationHistory' in existingContent.metadata
                ? (existingContent.metadata.regenerationHistory as any[]) || []
                : []),
            {
              request: modificationRequest,
              timestamp: new Date().toISOString()
            }
          ]
        }
      }
    });

    res.json({
      success: true,
      data: updatedContent,
      message: '콘텐츠가 성공적으로 재생성되었습니다.'
    });

  } catch (error) {
    console.error('Content regeneration error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '콘텐츠 재생성 중 오류가 발생했습니다.'
    });
  }
}

/**
 * 생성된 콘텐츠 목록 조회
 */
export async function getGeneratedContents(req: Request, res: Response<PaginatedResponse<any>>): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        data: [],
        pagination: { page: 1, limit: 10, total: 0, totalPages: 0 }
      });
      return;
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const status = req.query.status as string;
    const search = req.query.search as string;
    const skip = (page - 1) * limit;

    // 검색 조건 구성
    const where: any = { userId: req.user.userId };
    
    if (status) {
      where.status = status;
    }
    
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [contents, total] = await Promise.all([
      prisma.generatedContent.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          sourceData: {
            select: {
              filename: true,
              fileType: true
            }
          },
          guideline: {
            select: {
              name: true,
              type: true
            }
          }
        }
      }),
      prisma.generatedContent.count({ where })
    ]);

    const totalPages = Math.ceil(total / limit);

    res.json({
      success: true,
      data: contents,
      pagination: {
        page,
        limit,
        total,
        totalPages
      }
    });

  } catch (error) {
    console.error('Get generated contents error:', error);
    res.status(500).json({
      success: false,
      data: [],
      pagination: { page: 1, limit: 10, total: 0, totalPages: 0 }
    });
  }
}

/**
 * 특정 콘텐츠 조회
 */
export async function getGeneratedContentById(req: Request, res: Response<ApiResponse<any>>): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: '인증이 필요합니다.'
      });
      return;
    }

    const { id } = req.params;

    const content = await prisma.generatedContent.findFirst({
      where: {
        id,
        userId: req.user.userId
      },
      include: {
        sourceData: true,
        guideline: true
      }
    });

    if (!content) {
      res.status(404).json({
        success: false,
        error: '콘텐츠를 찾을 수 없습니다.'
      });
      return;
    }

    res.json({
      success: true,
      data: content
    });

  } catch (error) {
    console.error('Get generated content by id error:', error);
    res.status(500).json({
      success: false,
      error: '콘텐츠 조회 중 오류가 발생했습니다.'
    });
  }
}

/**
 * 콘텐츠 수정
 */
export async function updateGeneratedContent(req: Request, res: Response<ApiResponse<any>>): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: '인증이 필요합니다.'
      });
      return;
    }

    const { id } = req.params;
    const { title, content, summary, tags, status } = req.body;

    // 콘텐츠 존재 확인
    const existingContent = await prisma.generatedContent.findFirst({
      where: {
        id,
        userId: req.user.userId
      }
    });

    if (!existingContent) {
      res.status(404).json({
        success: false,
        error: '콘텐츠를 찾을 수 없습니다.'
      });
      return;
    }

    // 콘텐츠 업데이트
    const updatedContent = await prisma.generatedContent.update({
      where: { id },
      data: {
        title: title || existingContent.title,
        content: content || existingContent.content,
        summary: summary || existingContent.summary,
        tags: tags || existingContent.tags,
        status: status || existingContent.status,
        updatedAt: new Date()
      }
    });

    res.json({
      success: true,
      data: updatedContent,
      message: '콘텐츠가 성공적으로 수정되었습니다.'
    });

  } catch (error) {
    console.error('Update generated content error:', error);
    res.status(500).json({
      success: false,
      error: '콘텐츠 수정 중 오류가 발생했습니다.'
    });
  }
}

/**
 * 콘텐츠 삭제
 */
export async function deleteGeneratedContent(req: Request, res: Response<ApiResponse<any>>): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: '인증이 필요합니다.'
      });
      return;
    }

    const { id } = req.params;

    // 콘텐츠 존재 확인
    const existingContent = await prisma.generatedContent.findFirst({
      where: {
        id,
        userId: req.user.userId
      }
    });

    if (!existingContent) {
      res.status(404).json({
        success: false,
        error: '콘텐츠를 찾을 수 없습니다.'
      });
      return;
    }

    // 콘텐츠 삭제
    await prisma.generatedContent.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: '콘텐츠가 성공적으로 삭제되었습니다.'
    });

  } catch (error) {
    console.error('Delete generated content error:', error);
    res.status(500).json({
      success: false,
      error: '콘텐츠 삭제 중 오류가 발생했습니다.'
    });
  }
}

/**
 * 콘텐츠 통계 조회
 */
export async function getContentStats(req: Request, res: Response<ApiResponse<any>>): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: '인증이 필요합니다.'
      });
      return;
    }

    const [totalContents, draftContents, publishedContents, recentContents] = await Promise.all([
      prisma.generatedContent.count({
        where: { userId: req.user.userId }
      }),
      prisma.generatedContent.count({
        where: { userId: req.user.userId, status: 'draft' }
      }),
      prisma.generatedContent.count({
        where: { userId: req.user.userId, status: 'published' }
      }),
      prisma.generatedContent.count({
        where: {
          userId: req.user.userId,
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // 최근 7일
          }
        }
      })
    ]);

    res.json({
      success: true,
      data: {
        totalContents,
        draftContents,
        publishedContents,
        recentContents
      }
    });

  } catch (error) {
    console.error('Get content stats error:', error);
    res.status(500).json({
      success: false,
      error: '통계 조회 중 오류가 발생했습니다.'
    });
  }
} 