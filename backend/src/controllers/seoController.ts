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
import { AuthenticatedRequest } from '../middleware/auth';

const prisma = new PrismaClient();

/**
 * SEO 분석 수행
 */
export async function analyzeSEOContent(req: AuthenticatedRequest, res: Response) {
  try {
    const { title, content, metaDescription, targetKeywords } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ error: '로그인이 필요합니다.' });
    }

    // 입력 검증
    if (!title || !content) {
      return res.status(400).json({ error: '제목과 내용을 입력해주세요.' });
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

    // 분석 결과 데이터베이스에 저장
    const savedAnalysis = await prisma.generatedContent.create({
      data: {
        userId,
        title: `${title} - SEO 분석`,
        content: JSON.stringify({
          type: 'seo_analysis',
          originalTitle: title,
          originalContent: content,
          seoAnalysis,
          naverOptimization,
          metaTags,
          structuredData
        }),
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
export async function getNaverBlogOptimization(req: AuthenticatedRequest, res: Response) {
  try {
    const { title, content, tags } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ error: '로그인이 필요합니다.' });
    }

    if (!title || !content) {
      return res.status(400).json({ error: '제목과 내용을 입력해주세요.' });
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
export async function analyzeKeywords(req: AuthenticatedRequest, res: Response) {
  try {
    const { content, targetKeywords } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ error: '로그인이 필요합니다.' });
    }

    if (!content) {
      return res.status(400).json({ error: '분석할 내용을 입력해주세요.' });
    }

    console.log('🔑 키워드 분석 시작');

    const { analyzeKeywords: keywordAnalyzer } = await import('../utils/seoAnalyzer');
    const keywords = keywordAnalyzer(content, targetKeywords || []);

    // 키워드 제안 생성
    const keywordSuggestions = generateKeywordSuggestions(content, keywords);

    res.json({
      success: true,
      data: {
        keywords,
        suggestions: keywordSuggestions,
        totalWords: content.split(/\s+/).length,
        analysisDate: new Date().toISOString()
      }
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
export async function analyzeReadability(req: AuthenticatedRequest, res: Response) {
  try {
    const { content } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ error: '로그인이 필요합니다.' });
    }

    if (!content) {
      return res.status(400).json({ error: '분석할 내용을 입력해주세요.' });
    }

    console.log('📖 가독성 분석 시작');

    const { analyzeContentReadability } = await import('../utils/seoAnalyzer');
    const readabilityAnalysis = analyzeContentReadability(content);

    // 가독성 개선 제안 생성
    const improvementSuggestions = generateReadabilityImprovements(readabilityAnalysis);

    res.json({
      success: true,
      data: {
        ...readabilityAnalysis,
        improvements: improvementSuggestions,
        analysisDate: new Date().toISOString()
      }
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
export async function generateMetaTagsAPI(req: AuthenticatedRequest, res: Response) {
  try {
    const { title, description, keywords, imageUrl } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ error: '로그인이 필요합니다.' });
    }

    if (!title || !description) {
      return res.status(400).json({ error: '제목과 설명을 입력해주세요.' });
    }

    console.log('🏷️ 메타 태그 생성:', title);

    const metaTags = generateMetaTags(title, description, keywords || [], imageUrl);
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
        preview: {
          title,
          description,
          keywords: keywords || [],
          imageUrl: imageUrl || null
        }
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
export async function getUserSEOAnalyses(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.userId;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    if (!userId) {
      return res.status(401).json({ error: '로그인이 필요합니다.' });
    }

    const skip = (page - 1) * limit;

    const [analyses, totalCount] = await Promise.all([
      prisma.generatedContent.findMany({
        where: {
          userId,
          contentType: 'SEO'
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
          contentType: 'SEO'
        }
      })
    ]);

    const formattedAnalyses = analyses.map(analysis => {
      const content = JSON.parse(analysis.content);
      return {
        id: analysis.id,
        title: analysis.title,
        originalTitle: content.originalTitle,
        seoScore: analysis.metadata?.seoScore || 0,
        keywordCount: analysis.metadata?.keywordCount || 0,
        createdAt: analysis.createdAt,
        tags: analysis.tags
      };
    });

    res.json({
      success: true,
      data: {
        analyses: formattedAnalyses,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages: Math.ceil(totalCount / limit)
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
export async function getSEOAnalysis(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ error: '로그인이 필요합니다.' });
    }

    const analysis = await prisma.generatedContent.findFirst({
      where: {
        id,
        userId,
        contentType: 'SEO'
      }
    });

    if (!analysis) {
      return res.status(404).json({ error: 'SEO 분석을 찾을 수 없습니다.' });
    }

    const content = JSON.parse(analysis.content);

    res.json({
      success: true,
      data: {
        id: analysis.id,
        title: analysis.title,
        ...content,
        createdAt: analysis.createdAt,
        tags: analysis.tags
      }
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
export async function deleteSEOAnalysis(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ error: '로그인이 필요합니다.' });
    }

    const analysis = await prisma.generatedContent.findFirst({
      where: {
        id,
        userId,
        contentType: 'SEO'
      }
    });

    if (!analysis) {
      return res.status(404).json({ error: 'SEO 분석을 찾을 수 없습니다.' });
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

/**
 * 키워드 제안 생성
 */
function generateKeywordSuggestions(content: string, keywords: KeywordAnalysis[]): string[] {
  const suggestions: string[] = [];
  
  // 부족한 키워드 제안
  const lowDensityKeywords = keywords.filter(k => k.density < 1);
  if (lowDensityKeywords.length > 0) {
    suggestions.push(`다음 키워드들의 사용을 늘려보세요: ${lowDensityKeywords.map(k => k.keyword).join(', ')}`);
  }
  
  // 과도한 키워드 경고
  const highDensityKeywords = keywords.filter(k => k.density > 3);
  if (highDensityKeywords.length > 0) {
    suggestions.push(`다음 키워드들의 사용을 줄여보세요: ${highDensityKeywords.map(k => k.keyword).join(', ')}`);
  }
  
  // 롱테일 키워드 제안
  suggestions.push('롱테일 키워드를 활용하여 더 구체적인 검색 의도를 잡아보세요');
  
  // 관련 키워드 제안
  suggestions.push('동의어나 관련 키워드를 사용하여 키워드 다양성을 높이세요');
  
  return suggestions;
}

/**
 * 가독성 개선 제안 생성
 */
function generateReadabilityImprovements(analysis: any): string[] {
  const improvements: string[] = [];
  
  if (analysis.wordCount < 1000) {
    improvements.push('콘텐츠 분량을 늘려 검색엔진 친화성을 높이세요');
  }
  
  if (analysis.avgSentenceLength > 25) {
    improvements.push('문장 길이를 줄여 가독성을 높이세요');
  }
  
  if (analysis.readability < 70) {
    improvements.push('복잡한 문장을 간단하게 수정하세요');
  }
  
  improvements.push('단락을 적절히 나누어 시각적 가독성을 높이세요');
  improvements.push('글머리 기호나 번호를 활용하여 내용을 구조화하세요');
  
  return improvements;
} 