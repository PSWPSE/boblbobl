import { Request, Response } from 'express';
import { bypassAIDetection, AIDetectionBypassOptions } from '../utils/aiDetectionBypass';
import { PrismaClient } from '@prisma/client';
import { AuthenticatedRequest } from '../middleware/auth';

const prisma = new PrismaClient();

/**
 * AI 탐지 우회 처리
 */
export async function processAIDetectionBypass(req: AuthenticatedRequest, res: Response) {
  try {
    const { 
      text, 
      humanizationLevel, 
      writingStyle, 
      targetLanguage,
      preserveKeywords,
      addPersonalTouch,
      varyParagraphLength,
      insertNaturalTransitions
    } = req.body;
    
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ error: '로그인이 필요합니다.' });
    }

    // 입력 검증
    if (!text) {
      return res.status(400).json({ error: '처리할 텍스트를 입력해주세요.' });
    }

    console.log('🤖 AI 탐지 우회 처리 시작');

    const options: AIDetectionBypassOptions = {
      humanizationLevel: humanizationLevel || 'medium',
      writingStyle: writingStyle || 'casual',
      targetLanguage: targetLanguage || 'ko',
      preserveKeywords: preserveKeywords || [],
      addPersonalTouch: addPersonalTouch || false,
      varyParagraphLength: varyParagraphLength || true,
      insertNaturalTransitions: insertNaturalTransitions || true
    };

    const result = await bypassAIDetection(text, options);

    // 결과 데이터베이스에 저장
    const savedResult = await prisma.generatedContent.create({
      data: {
        userId,
        title: `AI 탐지 우회 처리 - ${new Date().toLocaleDateString()}`,
        content: JSON.stringify({
          type: 'ai_detection_bypass',
          originalText: result.originalText,
          humanizedText: result.humanizedText,
          changes: result.changes,
          humanizationScore: result.humanizationScore,
          detectionRisk: result.detectionRisk,
          recommendations: result.recommendations,
          options
        }),
        contentType: 'AI_BYPASS',
        tags: preserveKeywords || [],
        metadata: {
          humanizationScore: result.humanizationScore,
          detectionRisk: result.detectionRisk,
          changesCount: result.changes.length,
          processedAt: new Date().toISOString()
        }
      }
    });

    res.json({
      success: true,
      data: {
        id: savedResult.id,
        ...result
      }
    });

  } catch (error) {
    console.error('🚨 AI 탐지 우회 처리 오류:', error);
    res.status(500).json({ 
      error: 'AI 탐지 우회 처리 중 오류가 발생했습니다.',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * 텍스트 자연화 처리
 */
export async function humanizeText(req: AuthenticatedRequest, res: Response) {
  try {
    const { text, level } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ error: '로그인이 필요합니다.' });
    }

    if (!text) {
      return res.status(400).json({ error: '자연화할 텍스트를 입력해주세요.' });
    }

    console.log('✨ 텍스트 자연화 처리');

    const options: AIDetectionBypassOptions = {
      humanizationLevel: level || 'medium',
      writingStyle: 'conversational',
      targetLanguage: 'ko',
      preserveKeywords: [],
      addPersonalTouch: true,
      varyParagraphLength: true,
      insertNaturalTransitions: true
    };

    const result = await bypassAIDetection(text, options);

    res.json({
      success: true,
      data: {
        originalText: result.originalText,
        humanizedText: result.humanizedText,
        humanizationScore: result.humanizationScore,
        detectionRisk: result.detectionRisk,
        changesCount: result.changes.length
      }
    });

  } catch (error) {
    console.error('🚨 텍스트 자연화 오류:', error);
    res.status(500).json({ 
      error: '텍스트 자연화 중 오류가 발생했습니다.',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * 문체 변환 처리
 */
export async function convertWritingStyle(req: AuthenticatedRequest, res: Response) {
  try {
    const { text, fromStyle, toStyle } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ error: '로그인이 필요합니다.' });
    }

    if (!text || !toStyle) {
      return res.status(400).json({ error: '텍스트와 변환할 문체를 입력해주세요.' });
    }

    console.log('📝 문체 변환 처리:', fromStyle, '->', toStyle);

    const options: AIDetectionBypassOptions = {
      humanizationLevel: 'medium',
      writingStyle: toStyle,
      targetLanguage: 'ko',
      preserveKeywords: [],
      addPersonalTouch: false,
      varyParagraphLength: false,
      insertNaturalTransitions: false
    };

    const result = await bypassAIDetection(text, options);

    res.json({
      success: true,
      data: {
        originalText: result.originalText,
        convertedText: result.humanizedText,
        changes: result.changes.filter(c => c.type.includes('style')),
        fromStyle,
        toStyle
      }
    });

  } catch (error) {
    console.error('🚨 문체 변환 오류:', error);
    res.status(500).json({ 
      error: '문체 변환 중 오류가 발생했습니다.',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * AI 탐지 위험도 평가
 */
export async function assessAIDetectionRisk(req: AuthenticatedRequest, res: Response) {
  try {
    const { text } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ error: '로그인이 필요합니다.' });
    }

    if (!text) {
      return res.status(400).json({ error: '평가할 텍스트를 입력해주세요.' });
    }

    console.log('🔍 AI 탐지 위험도 평가');

    // 기본 분석을 통한 위험도 평가
    const riskFactors = analyzeRiskFactors(text);
    const overallRisk = calculateOverallRisk(riskFactors);

    res.json({
      success: true,
      data: {
        overallRisk,
        riskFactors,
        recommendations: generateRiskRecommendations(riskFactors),
        textLength: text.length,
        analysisDate: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('🚨 AI 탐지 위험도 평가 오류:', error);
    res.status(500).json({ 
      error: 'AI 탐지 위험도 평가 중 오류가 발생했습니다.',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * 사용자의 AI 우회 처리 기록 조회
 */
export async function getUserAIBypassHistory(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.userId;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    if (!userId) {
      return res.status(401).json({ error: '로그인이 필요합니다.' });
    }

    const skip = (page - 1) * limit;

    const [history, totalCount] = await Promise.all([
      prisma.generatedContent.findMany({
        where: {
          userId,
          contentType: 'AI_BYPASS'
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
          contentType: 'AI_BYPASS'
        }
      })
    ]);

    const formattedHistory = history.map(item => {
      const content = JSON.parse(item.content);
      return {
        id: item.id,
        title: item.title,
        humanizationScore: item.metadata?.humanizationScore || 0,
        detectionRisk: item.metadata?.detectionRisk || 'medium',
        changesCount: item.metadata?.changesCount || 0,
        createdAt: item.createdAt,
        tags: item.tags
      };
    });

    res.json({
      success: true,
      data: {
        history: formattedHistory,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages: Math.ceil(totalCount / limit)
        }
      }
    });

  } catch (error) {
    console.error('🚨 AI 우회 처리 기록 조회 오류:', error);
    res.status(500).json({ 
      error: 'AI 우회 처리 기록 조회 중 오류가 발생했습니다.',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * 특정 AI 우회 처리 결과 조회
 */
export async function getAIBypassResult(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ error: '로그인이 필요합니다.' });
    }

    const result = await prisma.generatedContent.findFirst({
      where: {
        id,
        userId,
        contentType: 'AI_BYPASS'
      }
    });

    if (!result) {
      return res.status(404).json({ error: 'AI 우회 처리 결과를 찾을 수 없습니다.' });
    }

    const content = JSON.parse(result.content);

    res.json({
      success: true,
      data: {
        id: result.id,
        title: result.title,
        ...content,
        createdAt: result.createdAt,
        tags: result.tags
      }
    });

  } catch (error) {
    console.error('🚨 AI 우회 처리 결과 조회 오류:', error);
    res.status(500).json({ 
      error: 'AI 우회 처리 결과 조회 중 오류가 발생했습니다.',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * AI 우회 처리 결과 삭제
 */
export async function deleteAIBypassResult(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ error: '로그인이 필요합니다.' });
    }

    const result = await prisma.generatedContent.findFirst({
      where: {
        id,
        userId,
        contentType: 'AI_BYPASS'
      }
    });

    if (!result) {
      return res.status(404).json({ error: 'AI 우회 처리 결과를 찾을 수 없습니다.' });
    }

    await prisma.generatedContent.delete({
      where: {
        id
      }
    });

    res.json({
      success: true,
      message: 'AI 우회 처리 결과가 성공적으로 삭제되었습니다.'
    });

  } catch (error) {
    console.error('🚨 AI 우회 처리 결과 삭제 오류:', error);
    res.status(500).json({ 
      error: 'AI 우회 처리 결과 삭제 중 오류가 발생했습니다.',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

// 헬퍼 함수들
function analyzeRiskFactors(text: string): {
  repetitivePatterns: number;
  formalLanguage: number;
  lackOfPersonalTouch: number;
  uniformSentenceLength: number;
  technicalTerms: number;
} {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim());
  
  // 반복적 패턴 분석
  const words = text.toLowerCase().match(/\b\w+\b/g) || [];
  const wordFreq = new Map<string, number>();
  words.forEach(word => wordFreq.set(word, (wordFreq.get(word) || 0) + 1));
  const repetitivePatterns = Array.from(wordFreq.values()).filter(freq => freq > 3).length / words.length;
  
  // 형식적 언어 분석
  const formalWords = ['따라서', '그러므로', '결론적으로', '요약하면', '정리하면'];
  const formalLanguage = formalWords.reduce((count, word) => 
    count + (text.includes(word) ? 1 : 0), 0) / formalWords.length;
  
  // 개인적 터치 부족 분석
  const personalWords = ['제가', '저는', '개인적으로', '경험상', '생각하기로는'];
  const lackOfPersonalTouch = 1 - personalWords.reduce((count, word) => 
    count + (text.includes(word) ? 1 : 0), 0) / personalWords.length;
  
  // 균일한 문장 길이 분석
  const sentenceLengths = sentences.map(s => s.length);
  const avgLength = sentenceLengths.reduce((sum, len) => sum + len, 0) / sentenceLengths.length;
  const variance = sentenceLengths.reduce((sum, len) => sum + Math.pow(len - avgLength, 2), 0) / sentenceLengths.length;
  const uniformSentenceLength = variance < 100 ? 1 : 0;
  
  // 기술적 용어 분석
  const techWords = ['시스템', '알고리즘', '프로세스', '메커니즘', '구조'];
  const technicalTerms = techWords.reduce((count, word) => 
    count + (text.includes(word) ? 1 : 0), 0) / techWords.length;
  
  return {
    repetitivePatterns,
    formalLanguage,
    lackOfPersonalTouch,
    uniformSentenceLength,
    technicalTerms
  };
}

function calculateOverallRisk(factors: any): 'low' | 'medium' | 'high' {
  const riskScore = (
    factors.repetitivePatterns * 0.3 +
    factors.formalLanguage * 0.2 +
    factors.lackOfPersonalTouch * 0.2 +
    factors.uniformSentenceLength * 0.2 +
    factors.technicalTerms * 0.1
  );
  
  if (riskScore < 0.3) return 'low';
  if (riskScore < 0.6) return 'medium';
  return 'high';
}

function generateRiskRecommendations(factors: any): string[] {
  const recommendations = [];
  
  if (factors.repetitivePatterns > 0.5) {
    recommendations.push('반복적인 패턴을 줄이고 어휘를 다양화하세요');
  }
  
  if (factors.formalLanguage > 0.5) {
    recommendations.push('형식적인 언어를 줄이고 자연스러운 표현을 사용하세요');
  }
  
  if (factors.lackOfPersonalTouch > 0.7) {
    recommendations.push('개인적인 의견이나 경험을 추가하세요');
  }
  
  if (factors.uniformSentenceLength > 0.5) {
    recommendations.push('문장 길이를 다양화하세요');
  }
  
  if (factors.technicalTerms > 0.5) {
    recommendations.push('기술적 용어를 일반적인 표현으로 바꾸세요');
  }
  
  return recommendations;
} 