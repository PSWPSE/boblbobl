import { Request, Response } from 'express';
import { 
  analyzeSEO, 
  analyzeNaverBlogSEO, 
  generateMetaTags, 
  generateStructuredData,
  KeywordAnalysis,
  SEOAnalysis,
  NaverBlogOptimization
} from '../utils/seoAnalyzer';
import { PrismaClient } from '@prisma/client';
import { isAuthenticated } from '../middleware/auth';

const prisma = new PrismaClient();

/**
 * SEO 분석 수행
 */
export async function analyzeSEOContent(req: Request, res: Response): Promise<void> {
  try {
    if (!isAuthenticated(req)) {
      res.status(401).json({ error: '로그인이 필요합니다.' });
      return;
    }

    const { title, content, metaDescription, targetKeywords } = req.body;
    const userId = req.user.userId!;

    // 입력 검증
    if (!title || !content) {
      res.status(400).json({ error: '제목과 내용을 입력해주세요.' });
      return;
    }

    console.log('🔍 SEO 분석 시작:', title);

    // SEO 분석 수행
    const seoAnalysis = analyzeSEO(
      title,
      content,
      metaDescription || '',
      targetKeywords || []
    );

    // 네이버 블로그 최적화 분석
    const naverOptimization = analyzeNaverBlogSEO(
      title,
      content,
      targetKeywords || []
    );

    // 메타 태그 생성
    const metaTags = generateMetaTags(
      title,
      metaDescription || seoAnalysis.metaDescription.recommendation,
      targetKeywords || []
    );

    // 구조화된 데이터 생성
    const structuredData = generateStructuredData(
      title,
      metaDescription || seoAnalysis.metaDescription.recommendation,
      req.user.name,
      new Date().toISOString()
    );

    // 간단한 분석 결과 저장 (기존 스키마와 호환)
    const analysisContent = JSON.stringify({
      type: 'seo_analysis',
      originalTitle: title,
      originalContent: content,
      seoAnalysis,
      naverOptimization,
      metaTags,
      structuredData
    });

    // 기존 스키마와 호환되는 방식으로 저장
    const savedAnalysis = await prisma.generatedContent.create({
      data: {
        userId,
        title: `${title} - SEO 분석`,
        content: analysisContent,
        contentType: 'SEO',
        tags: targetKeywords || [],
        metadata: {
          seoScore: seoAnalysis.score,
          keywordCount: seoAnalysis.keywords.length,
          analysisDate: new Date().toISOString()
        }
      }
    });

    res.json({
      success: true,
      data: {
        id: savedAnalysis.id,
        seoAnalysis,
        naverOptimization,
        metaTags,
        structuredData,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('🚨 SEO 분석 오류:', error);
    res.status(500).json({ 
      error: 'SEO 분석 중 오류가 발생했습니다.',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * 네이버 블로그 최적화 제안
 */
export async function getNaverBlogOptimization(req: Request, res: Response): Promise<void> {
  try {
    if (!isAuthenticated(req)) {
      res.status(401).json({ error: '로그인이 필요합니다.' });
      return;
    }

    const { title, content, tags } = req.body;

    if (!title || !content) {
      res.status(400).json({ error: '제목과 내용을 입력해주세요.' });
      return;
    }

    console.log('📝 네이버 블로그 최적화 분석:', title);

    const naverOptimization = analyzeNaverBlogSEO(title, content, tags || []);

    res.json({
      success: true,
      data: naverOptimization
    });

  } catch (error) {
    console.error('🚨 네이버 블로그 최적화 오류:', error);
    res.status(500).json({ 
      error: '네이버 블로그 최적화 분석 중 오류가 발생했습니다.',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * 키워드 분석 및 제안
 */
export async function analyzeKeywords(req: Request, res: Response): Promise<void> {
  try {
    if (!isAuthenticated(req)) {
      res.status(401).json({ error: '로그인이 필요합니다.' });
      return;
    }

    const { content, targetKeywords } = req.body;

    if (!content) {
      res.status(400).json({ error: '분석할 내용을 입력해주세요.' });
      return;
    }

    // 키워드 분석 로직 (간단한 구현)
    const keywords = targetKeywords || [];
    const analysis = {
      suggestedKeywords: keywords,
      density: 0.5,
      recommendations: ['키워드 밀도를 높여보세요.']
    };

    res.json({
      success: true,
      data: analysis
    });

  } catch (error) {
    console.error('🚨 키워드 분석 오류:', error);
    res.status(500).json({ 
      error: '키워드 분석 중 오류가 발생했습니다.',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * 콘텐츠 가독성 분석
 */
export async function analyzeReadability(req: Request, res: Response): Promise<void> {
  try {
    if (!isAuthenticated(req)) {
      res.status(401).json({ error: '로그인이 필요합니다.' });
      return;
    }

    const { content } = req.body;

    if (!content) {
      res.status(400).json({ error: '분석할 내용을 입력해주세요.' });
      return;
    }

    // 가독성 분석 로직 (간단한 구현)
    const readability = {
      score: 75,
      level: 'good',
      suggestions: ['문장을 더 짧게 만들어보세요.']
    };

    res.json({
      success: true,
      data: readability
    });

  } catch (error) {
    console.error('🚨 가독성 분석 오류:', error);
    res.status(500).json({ 
      error: '가독성 분석 중 오류가 발생했습니다.',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * 메타 태그 생성
 */
export async function generateMetaTagsAPI(req: Request, res: Response): Promise<void> {
  try {
    if (!isAuthenticated(req)) {
      res.status(401).json({ error: '로그인이 필요합니다.' });
      return;
    }

    const { title, description, keywords, imageUrl } = req.body;

    if (!title || !description) {
      res.status(400).json({ error: '제목과 설명을 입력해주세요.' });
      return;
    }

    console.log('🏷️ 메타 태그 생성:', title);

    const metaTags = generateMetaTags(title, description, keywords || []);
    const structuredData = generateStructuredData(
      title,
      description,
      req.user.name,
      new Date().toISOString(),
      imageUrl
    );

    res.json({
      success: true,
      data: {
        metaTags,
        structuredData,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('🚨 메타 태그 생성 오류:', error);
    res.status(500).json({ 
      error: '메타 태그 생성 중 오류가 발생했습니다.',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * 사용자의 SEO 분석 기록 조회
 */
export async function getUserSEOAnalyses(req: Request, res: Response): Promise<void> {
  try {
    if (!isAuthenticated(req)) {
      res.status(401).json({ error: '로그인이 필요합니다.' });
      return;
    }

    const userId = req.user.userId!;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const skip = (page - 1) * limit;

    const analyses = await prisma.generatedContent.findMany({
      where: {
        userId,
        title: {
          contains: 'SEO 분석'
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip,
      take: limit,
      select: {
        id: true,
        title: true,
        summary: true,
        metadata: true,
        createdAt: true
      }
    });

    const total = await prisma.generatedContent.count({
      where: {
        userId,
        title: {
          contains: 'SEO 분석'
        }
      }
    });

    res.json({
      success: true,
      data: {
        analyses,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('🚨 SEO 분석 기록 조회 오류:', error);
    res.status(500).json({ 
      error: 'SEO 분석 기록 조회 중 오류가 발생했습니다.',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * 특정 SEO 분석 조회
 */
export async function getSEOAnalysis(req: Request, res: Response): Promise<void> {
  try {
    if (!isAuthenticated(req)) {
      res.status(401).json({ error: '로그인이 필요합니다.' });
      return;
    }

    const { id } = req.params;
    const userId = req.user.userId!;

    const analysis = await prisma.generatedContent.findFirst({
      where: {
        id,
        userId
      },
      select: {
        id: true,
        title: true,
        content: true,
        summary: true,
        metadata: true,
        createdAt: true
      }
    });

    if (!analysis) {
      res.status(404).json({ error: 'SEO 분석을 찾을 수 없습니다.' });
      return;
    }

    res.json({
      success: true,
      data: analysis
    });

  } catch (error) {
    console.error('🚨 SEO 분석 조회 오류:', error);
    res.status(500).json({ 
      error: 'SEO 분석 조회 중 오류가 발생했습니다.',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * SEO 분석 삭제
 */
export async function deleteSEOAnalysis(req: Request, res: Response): Promise<void> {
  try {
    if (!isAuthenticated(req)) {
      res.status(401).json({ error: '로그인이 필요합니다.' });
      return;
    }

    const { id } = req.params;
    const userId = req.user.userId!;

    const analysis = await prisma.generatedContent.findFirst({
      where: {
        id,
        userId
      }
    });

    if (!analysis) {
      res.status(404).json({ error: 'SEO 분석을 찾을 수 없습니다.' });
      return;
    }

    await prisma.generatedContent.delete({
      where: {
        id
      }
    });

    res.json({
      success: true,
      message: 'SEO 분석이 성공적으로 삭제되었습니다.'
    });

  } catch (error) {
    console.error('🚨 SEO 분석 삭제 오류:', error);
    res.status(500).json({ 
      error: 'SEO 분석 삭제 중 오류가 발생했습니다.',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 