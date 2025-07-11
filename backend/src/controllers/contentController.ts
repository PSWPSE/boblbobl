import { Request, Response } from 'express';
import { ApiResponse, PaginatedResponse } from '../types';
import prisma from '../utils/database';
import { generateContent, regenerateContent, ContentGenerationRequest } from '../utils/openai';
import { extractContentFromUrl, validateExtractedContent } from '../utils/webScraper';

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
  console.log('🎯 콘텐츠 생성 API 호출 시작');
  
  try {
    if (!req.user || !req.user.userId) {
      console.warn('❌ 인증 실패: 사용자 정보 없음');
      res.status(401).json({
        success: false,
        error: '인증이 필요합니다.'
      });
      return;
    }

    console.log('✅ 사용자 인증 확인:', { userId: req.user.userId });

    const { sourceDataId, guidelineId, additionalPrompt, contentType = 'blog', targetLength = 800 }: GenerateContentRequest = req.body;

    console.log('📋 요청 데이터:', { sourceDataId, guidelineId, contentType, targetLength });

    if (!sourceDataId || !guidelineId) {
      console.warn('❌ 필수 데이터 누락:', { sourceDataId, guidelineId });
      res.status(400).json({
        success: false,
        error: '소스 데이터 ID와 가이드라인 ID를 입력해주세요.'
      });
      return;
    }

    // 소스 데이터 조회
    console.log('🔍 소스 데이터 조회 중:', sourceDataId);
    const sourceData = await prisma.sourceData.findFirst({
      where: {
        id: sourceDataId,
        userId: req.user.userId
      }
    });

    if (!sourceData) {
      console.warn('❌ 소스 데이터 없음:', sourceDataId);
      res.status(404).json({
        success: false,
        error: '소스 데이터를 찾을 수 없습니다.'
      });
      return;
    }

    console.log('✅ 소스 데이터 조회 성공:', { 
      filename: sourceData.filename, 
      textLength: sourceData.extractedText?.length || 0 
    });

    // 가이드라인 조회
    console.log('🔍 가이드라인 조회 중:', guidelineId);
    const guideline = await prisma.contentGuideline.findFirst({
      where: {
        id: guidelineId,
        userId: req.user.userId
      }
    });

    if (!guideline) {
      console.warn('❌ 가이드라인 없음:', guidelineId);
      res.status(404).json({
        success: false,
        error: '가이드라인을 찾을 수 없습니다.'
      });
      return;
    }

    console.log('✅ 가이드라인 조회 성공:', { 
      name: guideline.name, 
      type: guideline.type 
    });

    // AI 콘텐츠 생성 요청 구성
    const generationRequest: ContentGenerationRequest = {
      sourceText: sourceData.extractedText || '',
      guideline: {
        name: guideline.name,
        type: guideline.type as 'keywords' | 'memo',
        keywords: guideline.keywords ? guideline.keywords as any : undefined,
        memo: guideline.memo || undefined
      },
      additionalPrompt,
      contentType,
      targetLength
    };

    console.log('🤖 AI 콘텐츠 생성 시작');
    console.log('📝 생성 요청 상세:', { 
      sourceTextLength: generationRequest.sourceText.length,
      guidelineType: generationRequest.guideline.type,
      contentType,
      targetLength
    });

    // AI 콘텐츠 생성
    const startTime = Date.now();
    const aiResponse = await generateContent(generationRequest);
    const endTime = Date.now();
    
    console.log('🎉 AI 콘텐츠 생성 완료:', { 
      duration: `${endTime - startTime}ms`,
      titleLength: aiResponse.title.length,
      contentLength: aiResponse.content.length,
      model: aiResponse.metadata.model
    });

    // 데이터베이스에 저장
    console.log('💾 데이터베이스 저장 중');
    const generatedContent = await prisma.generatedContent.create({
      data: {
        userId: req.user.userId,
        sourceDataId,
        guidelineId,
        title: aiResponse.title,
        content: aiResponse.content,
        summary: aiResponse.summary,
        tags: Array.isArray(aiResponse.tags) ? aiResponse.tags : [aiResponse.tags],
        contentType: contentType,
        metadata: {
          ...aiResponse.metadata,
          generationRequest: {
            additionalPrompt,
            contentType,
            targetLength
          }
        } as any,
        status: 'draft'
      }
    });

    console.log('✅ 콘텐츠 생성 완료:', { 
      contentId: generatedContent.id,
      totalDuration: `${Date.now() - startTime}ms`
    });

    res.status(201).json({
      success: true,
      data: generatedContent,
      message: '콘텐츠가 성공적으로 생성되었습니다.'
    });

  } catch (error) {
    console.error('🚨 콘텐츠 생성 오류:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      userId: req.user?.userId
    });
    
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
    if (!req.user || !req.user.userId) {
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

    if (!existingContent || !existingContent.sourceData || !existingContent.guideline) {
      res.status(404).json({
        success: false,
        error: '콘텐츠를 찾을 수 없습니다.'
      });
      return;
    }

    // 원본 생성 요청 재구성
    const originalRequest: ContentGenerationRequest = {
      sourceText: existingContent.sourceData.extractedText || '',
      guideline: {
        name: existingContent.guideline.name,
        type: existingContent.guideline.type as 'keywords' | 'memo',
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
        tags: Array.isArray(aiResponse.tags) ? aiResponse.tags : [aiResponse.tags],
        metadata: {
          generationRequest: {
            additionalPrompt: originalRequest.additionalPrompt,
            contentType: originalRequest.contentType,
            targetLength: originalRequest.targetLength
          },
          regenerationHistory: [
            ...(existingContent.metadata && 
                typeof existingContent.metadata === 'object' && 
                'regenerationHistory' in existingContent.metadata
                ? (existingContent.metadata.regenerationHistory as any[]) || []
                : []),
            {
              modificationRequest,
              timestamp: new Date().toISOString(),
              previousContent: existingContent.content
            }
          ],
          ...aiResponse.metadata
        } as any
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
    if (!req.user || !req.user.userId) {
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
              id: true,
              filename: true,
              fileType: true
            }
          },
          guideline: {
            select: {
              id: true,
              name: true,
              type: true
            }
          }
        }
      }),
      prisma.generatedContent.count({ where })
    ]);

    res.json({
      success: true,
      data: contents,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
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

/**
 * 새로운 간단한 콘텐츠 생성 API (3가지 방식 지원)
 */
export async function generateSimpleContent(req: Request, res: Response<ApiResponse<any>>): Promise<void> {
  console.log('🎯 간단 콘텐츠 생성 API 호출 시작');
  
  try {
    const { type, input, style = '친근한', length = '중간' } = req.body;

    console.log('📋 요청 데이터:', { type, inputLength: input?.length, style, length });

    if (!type || !input) {
      console.warn('❌ 필수 데이터 누락:', { type, input: !!input });
      res.status(400).json({
        success: false,
        error: '생성 타입과 입력 내용을 제공해주세요.'
      });
      return;
    }

    if (!['topic', 'news', 'url'].includes(type)) {
      res.status(400).json({
        success: false,
        error: '지원하지 않는 생성 타입입니다. (topic, news, url만 지원)'
      });
      return;
    }

    let sourceText = '';
    let contentType = 'blog';
    let extractedData = null;

    // 타입별 처리
    if (type === 'topic') {
      sourceText = input;
      contentType = 'blog';
      console.log('📝 주제 기반 콘텐츠 생성:', input);
    } else if (type === 'news') {
      sourceText = input;
      contentType = 'news';
      console.log('📰 뉴스 기반 콘텐츠 생성:', input.substring(0, 100) + '...');
    } else if (type === 'url') {
      console.log('🔗 URL 기반 콘텐츠 생성:', input);
      try {
        // 실제 웹 스크래핑으로 콘텐츠 추출
        extractedData = await extractContentFromUrl(input);
        
        // 추출된 콘텐츠 품질 검증
        if (!validateExtractedContent(extractedData)) {
          throw new Error('추출된 콘텐츠의 품질이 부족합니다.');
        }
        
        sourceText = `제목: ${extractedData.title}\n\n본문:\n${extractedData.content}`;
        contentType = 'news';
        
        console.log('✅ URL 콘텐츠 추출 성공:', {
          title: extractedData.title.substring(0, 50) + '...',
          contentLength: extractedData.content.length,
          source: extractedData.metadata.source
        });
        
      } catch (error) {
        console.error('❌ URL 콘텐츠 추출 실패:', error);
        res.status(400).json({
          success: false,
          error: error instanceof Error ? error.message : 'URL에서 콘텐츠를 추출할 수 없습니다.'
        });
        return;
      }
    }

    // 길이 매핑
    const lengthMap: { [key: string]: number } = {
      '짧은': 500,
      '중간': 1000,
      '긴': 2000
    };

    const targetLength = lengthMap[length] || 1000;

    // 스타일별 프롬프트 매핑
    const stylePrompts: { [key: string]: string } = {
      '친근한': '친근하고 편안한 말투로, 독자와 대화하듯이 작성해주세요.',
      '전문적인': '전문적이고 신뢰할 수 있는 톤으로, 정확한 정보를 제공하며 작성해주세요.',
      '유머러스한': '재미있고 유머러스한 표현을 사용하여, 읽는 재미가 있도록 작성해주세요.',
      '감성적인': '감성적이고 따뜻한 느낌으로, 독자의 마음에 와닿도록 작성해주세요.'
    };

    // AI 콘텐츠 생성 요청 구성
    let additionalPrompt = '';
    if (type === 'topic') {
      additionalPrompt = `주제: "${input}"에 대한 유용하고 흥미로운 블로그 글을 작성해주세요.`;
    } else if (type === 'news') {
      additionalPrompt = `다음 뉴스 내용을 개인 블로그 글로 자연스럽게 재구성해주세요: ${input.substring(0, 500)}...`;
    } else if (type === 'url' && extractedData) {
      additionalPrompt = `다음 뉴스 기사를 바탕으로 개인적인 시각이 담긴 블로그 글을 작성해주세요. 원본 기사의 핵심 내용은 유지하되, 개인적인 의견이나 경험담을 자연스럽게 포함해서 작성해주세요.`;
    }

    const generationRequest: ContentGenerationRequest = {
      sourceText,
      guideline: {
        name: `${style} 스타일`,
        type: 'memo' as const,
        memo: `${stylePrompts[style]} 네이버 블로그에 적합한 형태로 작성하고, 적절한 소제목과 단락 구분을 사용해주세요.`
      },
      additionalPrompt,
      contentType: contentType as 'blog' | 'news',
      targetLength
    };

    console.log('🤖 AI 콘텐츠 생성 시작');
    console.log('📝 생성 요청 상세:', { 
      type,
      style,
      length,
      targetLength,
      sourceTextLength: sourceText.length,
      hasExtractedData: !!extractedData
    });

    // AI 콘텐츠 생성
    const startTime = Date.now();
    const aiResponse = await generateContent(generationRequest);
    const endTime = Date.now();
    
    console.log('🎉 AI 콘텐츠 생성 완료:', { 
      duration: `${endTime - startTime}ms`,
      titleLength: aiResponse.title.length,
      contentLength: aiResponse.content.length,
      model: aiResponse.metadata.model
    });

    // 응답 데이터 구성
    const responseData = {
      title: aiResponse.title,
      content: aiResponse.content,
      summary: aiResponse.summary,
      tags: Array.isArray(aiResponse.tags) ? aiResponse.tags : [aiResponse.tags],
      metadata: {
        wordCount: aiResponse.metadata.wordCount,
        charCount: aiResponse.metadata.charCount,
        readingTime: aiResponse.metadata.readingTime,
        model: aiResponse.metadata.model,
        generationType: type,
        style,
        length,
        generatedAt: new Date().toISOString(),
        // URL 추출 정보 포함
        ...(extractedData && {
          sourceUrl: extractedData.url,
          originalTitle: extractedData.title,
          extractedAt: extractedData.metadata.extractedAt,
          sourceMetadata: extractedData.metadata
        })
      }
    };

    // 로그인한 사용자인 경우 데이터베이스에 저장
    if (req.user && req.user.userId) {
      console.log('💾 로그인 사용자 - 데이터베이스 저장 중');
      try {
        await prisma.generatedContent.create({
          data: {
            userId: req.user.userId,
            title: aiResponse.title,
            content: aiResponse.content,
            summary: aiResponse.summary,
            tags: Array.isArray(aiResponse.tags) ? aiResponse.tags : [aiResponse.tags],
            contentType: contentType,
            metadata: {
              ...aiResponse.metadata,
              generationRequest: {
                type,
                input,
                style,
                length,
                targetLength,
                ...(extractedData && {
                  sourceUrl: extractedData.url,
                  originalTitle: extractedData.title,
                  extractedContent: {
                    title: extractedData.title,
                    summary: extractedData.summary,
                    author: extractedData.author,
                    publishedAt: extractedData.publishedAt,
                    source: extractedData.metadata.source
                  }
                })
              }
            } as any,
            status: 'draft'
          }
        });
        console.log('✅ 데이터베이스 저장 완료');
      } catch (dbError) {
        console.warn('⚠️ 데이터베이스 저장 실패 (비로그인 사용자로 처리):', dbError);
      }
    } else {
      console.log('👤 비로그인 사용자 - 데이터베이스 저장 생략');
    }

    console.log('✅ 간단 콘텐츠 생성 완료:', { 
      totalDuration: `${Date.now() - startTime}ms`,
      saved: !!req.user?.userId,
      urlExtracted: !!extractedData
    });

    res.status(200).json({
      success: true,
      data: responseData,
      message: '콘텐츠가 성공적으로 생성되었습니다.'
    });

  } catch (error) {
    console.error('🚨 간단 콘텐츠 생성 오류:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      userId: req.user?.userId
    });
    
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '콘텐츠 생성 중 오류가 발생했습니다.'
    });
  }
} 

/**
 * 콘텐츠 부분 재생성 API
 */
export async function regenerateContentPart(req: Request, res: Response<ApiResponse<any>>): Promise<void> {
  console.log('✏️ 콘텐츠 부분 재생성 API 호출 시작');
  
  try {
    const { 
      originalContent, 
      partToRegenerate, // 'title', 'summary', 'content', 'tags'
      instruction,
      style = '친근한',
      originalType,
      originalInput 
    } = req.body;

    console.log('📋 재생성 요청:', { 
      partToRegenerate, 
      instruction: instruction?.substring(0, 100),
      style,
      originalType
    });

    if (!originalContent || !partToRegenerate || !instruction) {
      res.status(400).json({
        success: false,
        error: '원본 콘텐츠, 재생성할 부분, 수정 지시사항을 모두 제공해주세요.'
      });
      return;
    }

    const validParts = ['title', 'summary', 'content', 'tags'];
    if (!validParts.includes(partToRegenerate)) {
      res.status(400).json({
        success: false,
        error: '유효하지 않은 재생성 부분입니다. (title, summary, content, tags만 지원)'
      });
      return;
    }

    // 스타일별 프롬프트
    const stylePrompts: { [key: string]: string } = {
      '친근한': '친근하고 편안한 말투로',
      '전문적인': '전문적이고 신뢰할 수 있는 톤으로',
      '유머러스한': '재미있고 유머러스한 표현으로',
      '감성적인': '감성적이고 따뜻한 느낌으로'
    };

    // 부분별 재생성 프롬프트 생성
    let regenerationPrompt = '';
    
    switch (partToRegenerate) {
      case 'title':
        regenerationPrompt = `다음 블로그 콘텐츠의 제목을 ${stylePrompts[style]} 새롭게 작성해주세요.

수정 요청: ${instruction}

원본 콘텐츠:
${originalContent.content || originalContent}

원본 제목: ${originalContent.title || ''}

새로운 제목만 생성해주세요. 이모지를 적절히 포함하여 매력적으로 작성하세요.`;
        break;
        
      case 'summary':
        regenerationPrompt = `다음 블로그 콘텐츠의 요약을 ${stylePrompts[style]} 새롭게 작성해주세요.

수정 요청: ${instruction}

제목: ${originalContent.title || ''}
본문: ${originalContent.content || originalContent}

3줄 이내로 핵심 내용을 요약해주세요.`;
        break;
        
      case 'content':
        regenerationPrompt = `다음 블로그 콘텐츠의 본문을 ${stylePrompts[style]} 수정해주세요.

수정 요청: ${instruction}

원본 제목: ${originalContent.title || ''}
원본 본문: ${originalContent.content || originalContent}

수정된 본문을 네이버 블로그 형식으로 작성해주세요. 이모지와 스타일링을 적절히 사용하세요.`;
        break;
        
      case 'tags':
        regenerationPrompt = `다음 블로그 콘텐츠에 적합한 태그를 새롭게 생성해주세요.

수정 요청: ${instruction}

제목: ${originalContent.title || ''}
본문: ${originalContent.content || originalContent}

5-8개의 관련성 높은 태그를 제안해주세요. 배열 형태로 반환: ["태그1", "태그2", ...]`;
        break;
    }

    console.log('🤖 AI 부분 재생성 시작');
    
    // OpenAI API 호출
    const startTime = Date.now();
    
    try {
      // OpenAI가 설정되어 있으면 실제 AI 사용
      if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your-openai-api-key-here') {
        const { generateContent } = await import('../utils/openai');
        
        const generationRequest: ContentGenerationRequest = {
          sourceText: regenerationPrompt,
          guideline: {
            name: `${partToRegenerate} 재생성`,
            type: 'memo' as const,
            memo: `${instruction} ${stylePrompts[style]} 작성해주세요.`
          },
          contentType: 'blog',
          targetLength: partToRegenerate === 'content' ? 1000 : 200
        };
        
        const aiResponse = await generateContent(generationRequest);
        
        // 부분별 결과 추출
        let regeneratedPart = '';
        switch (partToRegenerate) {
          case 'title':
            regeneratedPart = aiResponse.title;
            break;
          case 'summary':
            regeneratedPart = aiResponse.summary;
            break;
          case 'content':
            regeneratedPart = aiResponse.content;
            break;
          case 'tags':
            regeneratedPart = JSON.stringify(aiResponse.tags);
            break;
        }
        
        console.log('🎉 AI 부분 재생성 완료:', {
          part: partToRegenerate,
          length: regeneratedPart.length,
          duration: `${Date.now() - startTime}ms`
        });
        
        res.json({
          success: true,
          data: {
            [partToRegenerate]: partToRegenerate === 'tags' ? aiResponse.tags : regeneratedPart,
            metadata: {
              regeneratedPart: partToRegenerate,
              instruction,
              style,
              generatedAt: new Date().toISOString(),
              model: aiResponse.metadata.model
            }
          },
          message: `${partToRegenerate} 재생성이 완료되었습니다.`
        });
        
      } else {
        // 데모 모드
        console.log('📝 데모 모드로 부분 재생성');
        
        const demoResults: { [key: string]: any } = {
          title: '🌟 수정된 블로그 제목 (데모)',
          summary: '이것은 수정된 요약입니다. OpenAI API 키를 설정하면 실제 AI가 생성합니다.',
          content: '🎯 수정된 본문 내용\n\n이것은 데모 버전입니다. 실제 사용을 위해서는 OpenAI API 키 설정이 필요합니다.\n\n**수정 요청**: ' + instruction,
          tags: ['수정됨', '데모', 'AI콘텐츠', partToRegenerate]
        };
        
        res.json({
          success: true,
          data: {
            [partToRegenerate]: demoResults[partToRegenerate],
            metadata: {
              regeneratedPart: partToRegenerate,
              instruction,
              style,
              generatedAt: new Date().toISOString(),
              model: 'demo-regeneration'
            }
          },
          message: `${partToRegenerate} 재생성이 완료되었습니다. (데모 모드)`
        });
      }
      
    } catch (error) {
      console.error('AI 재생성 오류:', error);
      throw error;
    }

  } catch (error) {
    console.error('🚨 부분 재생성 오류:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '부분 재생성 중 오류가 발생했습니다.'
    });
  }
}

/**
 * 콘텐츠 개선 제안 API
 */
export async function suggestContentImprovements(req: Request, res: Response<ApiResponse<any>>): Promise<void> {
  console.log('💡 콘텐츠 개선 제안 API 호출 시작');
  
  try {
    const { content, type = 'blog' } = req.body;

    if (!content) {
      res.status(400).json({
        success: false,
        error: '분석할 콘텐츠를 제공해주세요.'
      });
      return;
    }

    // 기본 분석
    const analysis = {
      wordCount: content.split(/\s+/).length,
      charCount: content.length,
      sentences: content.split(/[.!?]/).filter((s: string) => s.trim().length > 0).length,
      paragraphs: content.split(/\n\s*\n/).filter((p: string) => p.trim().length > 0).length
    };

    // 개선 제안 생성
    const suggestions = [];

    // 길이 관련 제안
    if (analysis.wordCount < 300) {
      suggestions.push({
        type: 'length',
        priority: 'high',
        title: '콘텐츠 길이 확장',
        description: '더 상세한 설명이나 예시를 추가하여 콘텐츠를 풍부하게 만들어보세요.',
        action: '본문에 개인적인 경험이나 구체적인 예시를 추가해보세요.'
      });
    }

    // 구조 관련 제안
    if (analysis.paragraphs < 3) {
      suggestions.push({
        type: 'structure',
        priority: 'medium',
        title: '단락 구조 개선',
        description: '내용을 여러 단락으로 나누어 가독성을 높여보세요.',
        action: '큰 단락을 2-3개의 작은 단락으로 나누고 소제목을 추가해보세요.'
      });
    }

    // 이모지 사용 관련
    const emojiCount = (content.match(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]/gu) || []).length;
    if (emojiCount < 3) {
      suggestions.push({
        type: 'engagement',
        priority: 'low',
        title: '이모지 활용',
        description: '적절한 이모지를 사용하여 글을 더 친근하고 읽기 쉽게 만들어보세요.',
        action: '제목과 소제목에 관련된 이모지를 추가해보세요.'
      });
    }

    // SEO 관련 제안
    if (type === 'blog') {
      suggestions.push({
        type: 'seo',
        priority: 'medium',
        title: 'SEO 최적화',
        description: '검색 노출을 위해 키워드를 자연스럽게 포함해보세요.',
        action: '주요 키워드를 제목과 첫 번째 단락에 포함시켜보세요.'
      });
    }

    // 읽기 시간 계산
    const readingTime = Math.ceil(analysis.wordCount / 200);

    res.json({
      success: true,
      data: {
        analysis: {
          ...analysis,
          readingTime,
          readability: analysis.sentences > 0 ? Math.round(analysis.wordCount / analysis.sentences) : 0
        },
        suggestions,
        score: Math.max(0, Math.min(100, 
          (analysis.wordCount > 300 ? 30 : analysis.wordCount / 10) +
          (analysis.paragraphs > 2 ? 20 : analysis.paragraphs * 7) +
          (emojiCount > 0 ? 15 : 0) +
          35 // 기본 점수
        ))
      },
      message: '콘텐츠 분석이 완료되었습니다.'
    });

  } catch (error) {
    console.error('🚨 콘텐츠 개선 제안 오류:', error);
    
    res.status(500).json({
      success: false,
      error: '콘텐츠 분석 중 오류가 발생했습니다.'
    });
  }
} 