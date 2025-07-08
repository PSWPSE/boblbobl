import { Request, Response } from 'express';
import { generateThumbnailImage, generateThumbnailWithText, generateTemplateBasedThumbnail, ThumbnailGenerationRequest } from '../utils/imageGenerator';
import { PrismaClient } from '@prisma/client';
import { AuthenticatedRequest } from '../middleware/auth';

const prisma = new PrismaClient();

/**
 * 기본 썸네일 생성
 */
export async function generateBasicThumbnail(req: AuthenticatedRequest, res: Response) {
  try {
    const { title, content, tags, style, aspectRatio, language } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ error: '로그인이 필요합니다.' });
    }

    // 입력 검증
    if (!title || !content) {
      return res.status(400).json({ error: '제목과 내용을 입력해주세요.' });
    }

    const request: ThumbnailGenerationRequest = {
      title,
      content,
      tags: tags || [],
      style: style || 'modern',
      aspectRatio: aspectRatio || '16:9',
      language: language || 'ko'
    };

    console.log('🎨 Generating thumbnail for:', title);

    const thumbnailResult = await generateThumbnailImage(request);

    // 데이터베이스에 썸네일 정보 저장
    const savedThumbnail = await prisma.generatedContent.create({
      data: {
        userId,
        title: `${title} - 썸네일`,
        content: JSON.stringify({
          type: 'thumbnail',
          originalUrl: thumbnailResult.originalUrl,
          optimizedUrl: thumbnailResult.optimizedUrl,
          thumbnailUrl: thumbnailResult.thumbnailUrl,
          prompt: thumbnailResult.prompt,
          style: thumbnailResult.style,
          metadata: thumbnailResult.metadata
        }),
        contentType: 'THUMBNAIL',
        tags: tags || [],
        metadata: {
          generationType: 'basic',
          prompt: thumbnailResult.prompt,
          style: thumbnailResult.style,
          aspectRatio: request.aspectRatio
        }
      }
    });

    res.json({
      success: true,
      data: {
        id: savedThumbnail.id,
        ...thumbnailResult
      }
    });

  } catch (error) {
    console.error('🚨 Thumbnail generation error:', error);
    res.status(500).json({ 
      error: '썸네일 생성 중 오류가 발생했습니다.',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * 텍스트 오버레이가 포함된 썸네일 생성
 */
export async function generateThumbnailWithOverlay(req: AuthenticatedRequest, res: Response) {
  try {
    const { title, content, tags, style, aspectRatio, language, overlayText } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ error: '로그인이 필요합니다.' });
    }

    // 입력 검증
    if (!title || !content || !overlayText?.title) {
      return res.status(400).json({ error: '제목, 내용, 그리고 오버레이 텍스트를 입력해주세요.' });
    }

    const request: ThumbnailGenerationRequest = {
      title,
      content,
      tags: tags || [],
      style: style || 'modern',
      aspectRatio: aspectRatio || '16:9',
      language: language || 'ko'
    };

    console.log('🎨 Generating thumbnail with text overlay for:', title);

    const thumbnailResult = await generateThumbnailWithText(request, {
      title: overlayText.title,
      subtitle: overlayText.subtitle,
      backgroundColor: overlayText.backgroundColor,
      textColor: overlayText.textColor
    });

    // 데이터베이스에 썸네일 정보 저장
    const savedThumbnail = await prisma.generatedContent.create({
      data: {
        userId,
        title: `${title} - 텍스트 썸네일`,
        content: JSON.stringify({
          type: 'thumbnail_with_text',
          originalUrl: thumbnailResult.originalUrl,
          optimizedUrl: thumbnailResult.optimizedUrl,
          thumbnailUrl: thumbnailResult.thumbnailUrl,
          prompt: thumbnailResult.prompt,
          style: thumbnailResult.style,
          metadata: thumbnailResult.metadata,
          overlayText
        }),
        contentType: 'THUMBNAIL',
        tags: tags || [],
        metadata: {
          generationType: 'with_text',
          prompt: thumbnailResult.prompt,
          style: thumbnailResult.style,
          aspectRatio: request.aspectRatio,
          overlayText
        }
      }
    });

    res.json({
      success: true,
      data: {
        id: savedThumbnail.id,
        ...thumbnailResult
      }
    });

  } catch (error) {
    console.error('🚨 Thumbnail with text generation error:', error);
    res.status(500).json({ 
      error: '텍스트 오버레이 썸네일 생성 중 오류가 발생했습니다.',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * 템플릿 기반 썸네일 생성
 */
export async function generateTemplatedThumbnail(req: AuthenticatedRequest, res: Response) {
  try {
    const { title, content, tags, style, aspectRatio, language, template } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ error: '로그인이 필요합니다.' });
    }

    // 입력 검증
    if (!title || !content || !template) {
      return res.status(400).json({ error: '제목, 내용, 그리고 템플릿을 선택해주세요.' });
    }

    const validTemplates = ['tech', 'lifestyle', 'business', 'travel', 'food', 'health'];
    if (!validTemplates.includes(template)) {
      return res.status(400).json({ error: '유효하지 않은 템플릿입니다.' });
    }

    const request: ThumbnailGenerationRequest = {
      title,
      content,
      tags: tags || [],
      style: style || 'modern',
      aspectRatio: aspectRatio || '16:9',
      language: language || 'ko'
    };

    console.log('🎨 Generating templated thumbnail for:', title, 'with template:', template);

    const thumbnailResult = await generateTemplateBasedThumbnail(request, template);

    // 데이터베이스에 썸네일 정보 저장
    const savedThumbnail = await prisma.generatedContent.create({
      data: {
        userId,
        title: `${title} - ${template} 템플릿 썸네일`,
        content: JSON.stringify({
          type: 'thumbnail_templated',
          originalUrl: thumbnailResult.originalUrl,
          optimizedUrl: thumbnailResult.optimizedUrl,
          thumbnailUrl: thumbnailResult.thumbnailUrl,
          prompt: thumbnailResult.prompt,
          style: thumbnailResult.style,
          metadata: thumbnailResult.metadata,
          template
        }),
        contentType: 'THUMBNAIL',
        tags: tags || [],
        metadata: {
          generationType: 'templated',
          prompt: thumbnailResult.prompt,
          style: thumbnailResult.style,
          aspectRatio: request.aspectRatio,
          template
        }
      }
    });

    res.json({
      success: true,
      data: {
        id: savedThumbnail.id,
        ...thumbnailResult
      }
    });

  } catch (error) {
    console.error('🚨 Templated thumbnail generation error:', error);
    res.status(500).json({ 
      error: '템플릿 기반 썸네일 생성 중 오류가 발생했습니다.',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * 사용자의 썸네일 목록 조회
 */
export async function getUserThumbnails(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.userId;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    if (!userId) {
      return res.status(401).json({ error: '로그인이 필요합니다.' });
    }

    const skip = (page - 1) * limit;

    const [thumbnails, totalCount] = await Promise.all([
      prisma.generatedContent.findMany({
        where: {
          userId,
          contentType: 'THUMBNAIL'
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip,
        take: limit
      }),
      prisma.generatedContent.count({
        where: {
          userId,
          contentType: 'THUMBNAIL'
        }
      })
    ]);

    const formattedThumbnails = thumbnails.map((thumbnail: any) => {
      const content = JSON.parse(thumbnail.content);
      return {
        id: thumbnail.id,
        title: thumbnail.title,
        type: content.type,
        originalUrl: content.originalUrl,
        optimizedUrl: content.optimizedUrl,
        thumbnailUrl: content.thumbnailUrl,
        prompt: content.prompt,
        style: content.style,
        metadata: content.metadata,
        createdAt: thumbnail.createdAt,
        tags: thumbnail.tags
      };
    });

    res.json({
      success: true,
      data: {
        thumbnails: formattedThumbnails,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages: Math.ceil(totalCount / limit)
        }
      }
    });

  } catch (error) {
    console.error('🚨 Get user thumbnails error:', error);
    res.status(500).json({ 
      error: '썸네일 목록 조회 중 오류가 발생했습니다.',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * 특정 썸네일 조회
 */
export async function getThumbnail(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ error: '로그인이 필요합니다.' });
    }

    const thumbnail = await prisma.generatedContent.findFirst({
      where: {
        id,
        userId,
        contentType: 'THUMBNAIL'
      }
    });

    if (!thumbnail) {
      return res.status(404).json({ error: '썸네일을 찾을 수 없습니다.' });
    }

    const content = JSON.parse(thumbnail.content);

    res.json({
      success: true,
      data: {
        id: thumbnail.id,
        title: thumbnail.title,
        type: content.type,
        originalUrl: content.originalUrl,
        optimizedUrl: content.optimizedUrl,
        thumbnailUrl: content.thumbnailUrl,
        prompt: content.prompt,
        style: content.style,
        metadata: content.metadata,
        createdAt: thumbnail.createdAt,
        tags: thumbnail.tags
      }
    });

  } catch (error) {
    console.error('🚨 Get thumbnail error:', error);
    res.status(500).json({ 
      error: '썸네일 조회 중 오류가 발생했습니다.',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * 썸네일 삭제
 */
export async function deleteThumbnail(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ error: '로그인이 필요합니다.' });
    }

    const thumbnail = await prisma.generatedContent.findFirst({
      where: {
        id,
        userId,
        contentType: 'THUMBNAIL'
      }
    });

    if (!thumbnail) {
      return res.status(404).json({ error: '썸네일을 찾을 수 없습니다.' });
    }

    await prisma.generatedContent.delete({
      where: {
        id
      }
    });

    res.json({
      success: true,
      message: '썸네일이 성공적으로 삭제되었습니다.'
    });

  } catch (error) {
    console.error('🚨 Delete thumbnail error:', error);
    res.status(500).json({ 
      error: '썸네일 삭제 중 오류가 발생했습니다.',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * 썸네일 생성 옵션 조회
 */
export async function getThumbnailOptions(req: Request, res: Response) {
  try {
    const options = {
      styles: [
        { value: 'modern', label: '모던', description: '깔끔하고 현대적인 디자인' },
        { value: 'minimal', label: '미니멀', description: '단순하고 우아한 디자인' },
        { value: 'colorful', label: '다채로운', description: '생동감 있고 화려한 디자인' },
        { value: 'professional', label: '전문적', description: '비즈니스 환경에 적합한 디자인' },
        { value: 'illustration', label: '일러스트', description: '아티스틱하고 창의적인 디자인' },
        { value: 'photorealistic', label: '사실적', description: '실제 사진 같은 고품질 디자인' }
      ],
      aspectRatios: [
        { value: '16:9', label: '16:9 (가로)', description: '블로그 썸네일에 최적화' },
        { value: '4:3', label: '4:3 (표준)', description: '일반적인 이미지 비율' },
        { value: '1:1', label: '1:1 (정사각형)', description: '소셜 미디어 최적화' },
        { value: '9:16', label: '9:16 (세로)', description: '모바일 스토리 형태' }
      ],
      templates: [
        { value: 'tech', label: '기술/IT', description: '테크놀로지 관련 콘텐츠' },
        { value: 'lifestyle', label: '라이프스타일', description: '일상생활 관련 콘텐츠' },
        { value: 'business', label: '비즈니스', description: '업무 및 비즈니스 관련 콘텐츠' },
        { value: 'travel', label: '여행', description: '여행 및 관광 관련 콘텐츠' },
        { value: 'food', label: '음식', description: '요리 및 음식 관련 콘텐츠' },
        { value: 'health', label: '건강', description: '건강 및 웰빙 관련 콘텐츠' }
      ]
    };

    res.json({
      success: true,
      data: options
    });

  } catch (error) {
    console.error('🚨 Get thumbnail options error:', error);
    res.status(500).json({ 
      error: '썸네일 옵션 조회 중 오류가 발생했습니다.',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 