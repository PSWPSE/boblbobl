import { Request, Response } from 'express';
import { generateThumbnailImage, generateThumbnailWithText, generateTemplateBasedThumbnail, ThumbnailGenerationRequest } from '../utils/imageGenerator';
import { PrismaClient } from '@prisma/client';
import { isAuthenticated } from '../middleware/auth';

const prisma = new PrismaClient();

/**
 * 기본 썸네일 생성
 */
export async function generateBasicThumbnail(req: Request, res: Response) {
  try {
    if (!isAuthenticated(req)) {
      return res.status(401).json({ error: '로그인이 필요합니다.' });
    }

    const { title, content, tags, style, aspectRatio, language } = req.body;
    const userId = req.user.userId!;

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
export async function generateThumbnailWithOverlay(req: Request, res: Response) {
  try {
    if (!isAuthenticated(req)) {
      return res.status(401).json({ error: '로그인이 필요합니다.' });
    }

    const { title, content, tags, style, aspectRatio, language, overlayText } = req.body;
    const userId = req.user.userId!;

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
export async function generateTemplatedThumbnail(req: Request, res: Response) {
  try {
    if (!isAuthenticated(req)) {
      return res.status(401).json({ error: '로그인이 필요합니다.' });
    }

    const { title, content, tags, style, aspectRatio, language, template } = req.body;
    const userId = req.user.userId!;

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
 * 사용자 썸네일 목록 조회
 */
export async function getUserThumbnails(req: Request, res: Response) {
  try {
    if (!isAuthenticated(req)) {
      return res.status(401).json({ error: '로그인이 필요합니다.' });
    }

    const userId = req.user.userId!;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = (page - 1) * limit;

    const [thumbnails, totalCount] = await Promise.all([
      prisma.generatedContent.findMany({
        where: {
          userId,
          contentType: 'THUMBNAIL'
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip: offset,
        take: limit
      }),
      prisma.generatedContent.count({
        where: {
          userId,
          contentType: 'THUMBNAIL'
        }
      })
    ]);

    const formattedThumbnails = thumbnails.map(item => {
      const content = JSON.parse(item.content);
      return {
        id: item.id,
        title: item.title,
        type: content.type,
        thumbnailUrl: content.thumbnailUrl,
        createdAt: item.createdAt,
        tags: item.tags
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
    console.error('🚨 User thumbnails retrieval error:', error);
    res.status(500).json({ 
      error: '썸네일 목록 조회 중 오류가 발생했습니다.',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * 특정 썸네일 조회
 */
export async function getThumbnail(req: Request, res: Response) {
  try {
    if (!isAuthenticated(req)) {
      return res.status(401).json({ error: '로그인이 필요합니다.' });
    }

    const { id } = req.params;
    const userId = req.user.userId!;

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
        ...content,
        createdAt: thumbnail.createdAt,
        tags: thumbnail.tags
      }
    });

  } catch (error) {
    console.error('🚨 Thumbnail retrieval error:', error);
    res.status(500).json({ 
      error: '썸네일 조회 중 오류가 발생했습니다.',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * 썸네일 삭제
 */
export async function deleteThumbnail(req: Request, res: Response) {
  try {
    if (!isAuthenticated(req)) {
      return res.status(401).json({ error: '로그인이 필요합니다.' });
    }

    const { id } = req.params;
    const userId = req.user.userId!;

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
    console.error('🚨 Thumbnail deletion error:', error);
    res.status(500).json({ 
      error: '썸네일 삭제 중 오류가 발생했습니다.',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * 썸네일 옵션 조회
 */
export async function getThumbnailOptions(req: Request, res: Response) {
  try {
    const options = {
      styles: ['modern', 'vintage', 'minimalist', 'bold', 'elegant'],
      aspectRatios: ['16:9', '4:3', '1:1', '9:16'],
      templates: ['tech', 'lifestyle', 'business', 'travel', 'food', 'health'],
      languages: ['ko', 'en']
    };

    res.json({
      success: true,
      data: options
    });

  } catch (error) {
    console.error('🚨 Thumbnail options retrieval error:', error);
    res.status(500).json({ 
      error: '썸네일 옵션 조회 중 오류가 발생했습니다.',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 