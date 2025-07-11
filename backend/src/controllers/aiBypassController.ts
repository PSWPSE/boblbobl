import { Request, Response } from 'express';
import { bypassAIDetection, AIDetectionBypassOptions, AIDetectionBypassResult } from '../utils/aiDetectionBypass';
import { PrismaClient } from '@prisma/client';
import { isAuthenticated } from '../middleware/auth';
import { ContentMetadata } from '../types';

const prisma = new PrismaClient();

/**
 * AI 탐지 우회 처리
 */
export async function processAIDetectionBypass(req: Request, res: Response): Promise<void> {
  try {
    if (!isAuthenticated(req)) {
      res.status(401).json({ error: '로그인이 필요합니다.' });
      return;
    }

    const { 
      text, 
      humanizationLevel = 'medium', 
      writingStyle = 'conversational',
      targetLanguage = 'ko',
      preserveKeywords = [],
      addPersonalTouch = true,
      varyParagraphLength = true,
      insertNaturalTransitions = true
    } = req.body;

    const userId = req.user.userId!;

    if (!text || text.trim().length === 0) {
      res.status(400).json({ error: '처리할 텍스트를 입력해주세요.' });
      return;
    }

    console.log('🔄 AI 탐지 우회 처리 시작:', text.substring(0, 100) + '...');

    const options: AIDetectionBypassOptions = {
      humanizationLevel,
      writingStyle,
      targetLanguage,
      preserveKeywords,
      addPersonalTouch,
      varyParagraphLength,
      insertNaturalTransitions
    };

    const result = await bypassAIDetection(text, options);

    // 결과를 데이터베이스에 저장
    const metadata: ContentMetadata = {
      humanizationScore: result.humanizationScore,
      detectionRisk: result.detectionRisk,
      changesCount: result.changes.length,
      originalLength: text.length,
      processedLength: result.humanizedText.length
    };

    const savedResult = await prisma.generatedContent.create({
      data: {
        userId,
        title: `AI 우회 처리 - ${new Date().toLocaleDateString()}`,
        content: JSON.stringify({
          type: 'ai_bypass',
          originalText: result.originalText,
          humanizedText: result.humanizedText,
          changes: result.changes,
          humanizationLevel,
          writingStyle,
          targetLanguage
        }),
        contentType: 'AI_BYPASS',
        tags: preserveKeywords,
        metadata
      }
    });

    res.json({
      success: true,
      data: {
        id: savedResult.id,
        originalText: result.originalText,
        humanizedText: result.humanizedText,
        changes: result.changes,
        humanizationScore: result.humanizationScore,
        detectionRisk: result.detectionRisk,
        recommendations: result.recommendations
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
export async function humanizeText(req: Request, res: Response): Promise<void> {
  try {
    if (!isAuthenticated(req)) {
      res.status(401).json({ error: '로그인이 필요합니다.' });
      return;
    }

    const { text, level = 'medium' } = req.body;
    const userId = req.user.userId!;

    if (!text || text.trim().length === 0) {
      res.status(400).json({ error: '자연화할 텍스트를 입력해주세요.' });
      return;
    }

    console.log('🌟 텍스트 자연화 처리:', text.substring(0, 100) + '...');

    const options: AIDetectionBypassOptions = {
      humanizationLevel: level,
      writingStyle: 'conversational',
      targetLanguage: 'ko',
      preserveKeywords: [],
      addPersonalTouch: true,
      varyParagraphLength: true,
      insertNaturalTransitions: true
    };

    const result = await bypassAIDetection(text, options);

    // 결과를 데이터베이스에 저장
    const metadata: ContentMetadata = {
      humanizationScore: result.humanizationScore,
      detectionRisk: result.detectionRisk,
      changesCount: result.changes.length,
      originalLength: text.length,
      processedLength: result.humanizedText.length
    };

    const savedResult = await prisma.generatedContent.create({
      data: {
        userId,
        title: `텍스트 자연화 - ${new Date().toLocaleDateString()}`,
        content: JSON.stringify({
          type: 'text_humanization',
          originalText: result.originalText,
          humanizedText: result.humanizedText,
          changes: result.changes,
          level
        }),
        contentType: 'AI_BYPASS',
        tags: [],
        metadata
      }
    });

    res.json({
      success: true,
      data: {
        id: savedResult.id,
        originalText: result.originalText,
        humanizedText: result.humanizedText,
        humanizationScore: result.humanizationScore,
        detectionRisk: result.detectionRisk,
        changes: result.changes
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
 * 문체 변환
 */
export async function convertWritingStyle(req: Request, res: Response): Promise<void> {
  try {
    if (!isAuthenticated(req)) {
      res.status(401).json({ error: '로그인이 필요합니다.' });
      return;
    }

    const { text, toStyle, fromStyle } = req.body;
    const userId = req.user.userId!;

    if (!text || text.trim().length === 0) {
      res.status(400).json({ error: '변환할 텍스트를 입력해주세요.' });
      return;
    }

    console.log('✍️ 문체 변환:', { fromStyle, toStyle });

    const options: AIDetectionBypassOptions = {
      humanizationLevel: 'medium',
      writingStyle: toStyle,
      targetLanguage: 'ko',
      preserveKeywords: [],
      addPersonalTouch: true,
      varyParagraphLength: true,
      insertNaturalTransitions: true
    };

    const result = await bypassAIDetection(text, options);

    // 결과를 데이터베이스에 저장
    const metadata: ContentMetadata = {
      humanizationScore: result.humanizationScore,
      detectionRisk: result.detectionRisk,
      changesCount: result.changes.length,
      originalLength: text.length,
      processedLength: result.humanizedText.length
    };

    const savedResult = await prisma.generatedContent.create({
      data: {
        userId,
        title: `문체 변환 (${fromStyle} → ${toStyle}) - ${new Date().toLocaleDateString()}`,
        content: JSON.stringify({
          type: 'style_conversion',
          originalText: result.originalText,
          humanizedText: result.humanizedText,
          changes: result.changes,
          fromStyle,
          toStyle
        }),
        contentType: 'AI_BYPASS',
        tags: [],
        metadata
      }
    });

    res.json({
      success: true,
      data: {
        id: savedResult.id,
        originalText: result.originalText,
        humanizedText: result.humanizedText,
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
export async function assessAIDetectionRisk(req: Request, res: Response): Promise<void> {
  try {
    if (!isAuthenticated(req)) {
      res.status(401).json({ error: '로그인이 필요합니다.' });
      return;
    }

    const { text } = req.body;
    const userId = req.user.userId!;

    if (!text || text.trim().length === 0) {
      res.status(400).json({ error: '평가할 텍스트를 입력해주세요.' });
      return;
    }

    console.log('🔍 AI 탐지 위험도 평가:', text.substring(0, 100) + '...');

    const riskFactors = analyzeRiskFactors(text);
    const overallRisk = calculateOverallRisk(riskFactors);
    const recommendations = generateRiskRecommendations(riskFactors);

    // 결과를 데이터베이스에 저장
    const metadata: ContentMetadata = {
      detectionRisk: overallRisk,
      analysisDate: new Date().toISOString()
    };

    const savedResult = await prisma.generatedContent.create({
      data: {
        userId,
        title: `AI 탐지 위험도 평가 - ${new Date().toLocaleDateString()}`,
        content: JSON.stringify({
          type: 'risk_assessment',
          originalText: text,
          riskFactors,
          overallRisk,
          recommendations
        }),
        contentType: 'AI_BYPASS',
        tags: [],
        metadata
      }
    });

    res.json({
      success: true,
      data: {
        id: savedResult.id,
        text,
        riskFactors,
        overallRisk,
        recommendations
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
 * 사용자 AI 우회 처리 기록 조회
 */
export async function getUserAIBypassHistory(req: Request, res: Response): Promise<void> {
  try {
    if (!isAuthenticated(req)) {
      res.status(401).json({ error: '로그인이 필요합니다.' });
      return;
    }

    const userId = req.user.userId!;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = (page - 1) * limit;

    const [history, totalCount] = await Promise.all([
      prisma.generatedContent.findMany({
        where: {
          userId,
          contentType: 'AI_BYPASS'
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
          contentType: 'AI_BYPASS'
        }
      })
    ]);

    // 메타데이터 타입 안전 처리
    const formattedHistory = history.map((item) => {
      const metadata = item.metadata as ContentMetadata;
      return {
        id: item.id,
        title: item.title,
        humanizationScore: metadata?.humanizationScore || 0,
        detectionRisk: metadata?.detectionRisk || 'medium',
        changesCount: metadata?.changesCount || 0,
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
export async function getAIBypassResult(req: Request, res: Response): Promise<void> {
  try {
    if (!isAuthenticated(req)) {
      res.status(401).json({ error: '로그인이 필요합니다.' });
      return;
    }

    const { id } = req.params;
    const userId = req.user.userId!;

    const result = await prisma.generatedContent.findFirst({
      where: {
        id,
        userId,
        contentType: 'AI_BYPASS'
      }
    });

    if (!result) {
      res.status(404).json({ error: 'AI 우회 처리 결과를 찾을 수 없습니다.' });
      return;
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
export async function deleteAIBypassResult(req: Request, res: Response): Promise<void> {
  try {
    if (!isAuthenticated(req)) {
      res.status(401).json({ error: '로그인이 필요합니다.' });
      return;
    }

    const { id } = req.params;
    const userId = req.user.userId!;

    const result = await prisma.generatedContent.findFirst({
      where: {
        id,
        userId,
        contentType: 'AI_BYPASS'
      }
    });

    if (!result) {
      res.status(404).json({ error: 'AI 우회 처리 결과를 찾을 수 없습니다.' });
      return;
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

// 유틸리티 함수들
function analyzeRiskFactors(text: string) {
  const factors = {
    repetitiveStructure: checkRepetitiveStructure(text),
    uniformSentenceLength: checkSentenceLength(text),
    formalLanguage: checkFormalLanguage(text),
    lackOfPersonalTouch: checkPersonalTouch(text),
    perfectGrammar: checkGrammar(text)
  };

  return factors;
}

function calculateOverallRisk(factors: any): 'low' | 'medium' | 'high' {
  const riskScore = Object.values(factors).reduce((sum: number, factor: any) => sum + factor.score, 0);
  const averageRisk = riskScore / Object.keys(factors).length;

  if (averageRisk >= 0.7) return 'high';
  if (averageRisk >= 0.4) return 'medium';
  return 'low';
}

function generateRiskRecommendations(factors: any): string[] {
  const recommendations: string[] = [];

  if (factors.repetitiveStructure.score > 0.6) {
    recommendations.push('문장 구조를 다양화해보세요.');
  }
  if (factors.uniformSentenceLength.score > 0.6) {
    recommendations.push('문장 길이를 다양하게 조정해보세요.');
  }
  if (factors.formalLanguage.score > 0.6) {
    recommendations.push('좀 더 자연스러운 표현을 사용해보세요.');
  }
  if (factors.lackOfPersonalTouch.score > 0.6) {
    recommendations.push('개인적인 경험이나 감정을 추가해보세요.');
  }

  return recommendations;
}

function checkRepetitiveStructure(text: string): { score: number; details: string } {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim());
  const patterns = sentences.map(s => s.trim().split(' ').slice(0, 3).join(' '));
  const uniquePatterns = new Set(patterns);
  
  const repetitionScore = 1 - (uniquePatterns.size / patterns.length);
  
  return {
    score: Math.min(repetitionScore * 2, 1),
    details: `문장 시작 패턴 중복도: ${Math.round(repetitionScore * 100)}%`
  };
}

function checkSentenceLength(text: string): { score: number; details: string } {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim());
  const lengths = sentences.map(s => s.trim().split(' ').length);
  
  const avgLength = lengths.reduce((sum, len) => sum + len, 0) / lengths.length;
  const variance = lengths.reduce((sum, len) => sum + Math.pow(len - avgLength, 2), 0) / lengths.length;
  
  const uniformityScore = 1 - Math.min(variance / 50, 1);
  
  return {
    score: uniformityScore,
    details: `문장 길이 균일도: ${Math.round(uniformityScore * 100)}%`
  };
}

function checkFormalLanguage(text: string): { score: number; details: string } {
  const formalPatterns = [
    /습니다\.|니다\./g,
    /에 대해/g,
    /관하여/g,
    /따라서/g,
    /그러므로/g,
    /또한/g,
    /뿐만 아니라/g
  ];
  
  const matches = formalPatterns.reduce((count, pattern) => {
    return count + (text.match(pattern) || []).length;
  }, 0);
  
  const formalityScore = Math.min(matches / 10, 1);
  
  return {
    score: formalityScore,
    details: `공식적 표현 사용빈도: ${Math.round(formalityScore * 100)}%`
  };
}

function checkPersonalTouch(text: string): { score: number; details: string } {
  const personalPatterns = [
    /저는|제가|나는|내가/g,
    /생각해요|생각합니다|느껴요|느낍니다/g,
    /경험상|개인적으로|솔직히|정말로/g,
    /ㅋㅋ|ㅎㅎ|헤헤|흠|음/g
  ];
  
  const matches = personalPatterns.reduce((count, pattern) => {
    return count + (text.match(pattern) || []).length;
  }, 0);
  
  const personalScore = 1 - Math.min(matches / 5, 1);
  
  return {
    score: personalScore,
    details: `개인적 표현 부족도: ${Math.round(personalScore * 100)}%`
  };
}

function checkGrammar(text: string): { score: number; details: string } {
  // 간단한 문법 완성도 체크 (실제로는 더 복잡한 분석이 필요)
  const grammarPatterns = [
    /\s+\./g,  // 공백 후 마침표
    /\s+,/g,   // 공백 후 쉼표
    /\s+\?/g,  // 공백 후 물음표
    /\s+!/g    // 공백 후 느낌표
  ];
  
  const errors = grammarPatterns.reduce((count, pattern) => {
    return count + (text.match(pattern) || []).length;
  }, 0);
  
  const grammarScore = Math.min(errors / 10, 1);
  
  return {
    score: 1 - grammarScore,
    details: `문법 완성도: ${Math.round((1 - grammarScore) * 100)}%`
  };
} 