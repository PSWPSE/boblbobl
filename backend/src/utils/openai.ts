import OpenAI from 'openai';

// OpenAI 클라이언트 초기화
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface ContentGenerationRequest {
  sourceText: string;
  guideline: {
    name: string;
    type: 'keywords' | 'memo';
    keywords?: {
      tone: string[];
      structure: string[];
      readability: string[];
      seo: string[];
      engagement: string[];
      format: string[];
    };
    memo?: string;
  };
  additionalPrompt?: string;
  contentType?: 'blog' | 'news' | 'review' | 'tutorial';
  targetLength?: number;
}

export interface ContentGenerationResponse {
  title: string;
  content: string;
  summary: string;
  tags: string[];
  metadata: {
    wordCount: number;
    charCount: number;
    readingTime: number;
    generatedAt: string;
    model: string;
    tokensUsed?: number;
  };
}

/**
 * AI 콘텐츠 생성을 위한 프롬프트 생성
 */
function createContentPrompt(request: ContentGenerationRequest): string {
  const { sourceText, guideline, additionalPrompt, contentType = 'blog', targetLength = 800 } = request;
  
  // 기본 프롬프트
  let prompt = `당신은 한국어 블로그 콘텐츠 작성 전문가입니다. 주어진 소스 텍스트를 바탕으로 매력적이고 유익한 블로그 글을 작성해주세요.

**중요한 지침:**
1. 자연스럽고 인간적인 글쓰기 스타일을 유지하세요
2. AI가 작성한 것처럼 보이지 않도록 다양한 문체와 표현을 사용하세요
3. 개인적인 경험담이나 감정을 적절히 포함하세요
4. 완벽하지 않은 자연스러운 문장 구조를 사용하세요
5. 네이버 블로그 특성에 맞게 친근하고 접근하기 쉬운 톤으로 작성하세요

**콘텐츠 타입:** ${contentType === 'blog' ? '블로그 포스트' : contentType === 'news' ? '뉴스 기사' : contentType === 'review' ? '리뷰' : '튜토리얼'}
**목표 길이:** ${targetLength}자 내외\n\n`;

  // 가이드라인 추가
  if (guideline.type === 'keywords' && guideline.keywords) {
    prompt += `**스타일 가이드라인:**\n`;
    
    Object.entries(guideline.keywords).forEach(([category, values]) => {
      if (values.length > 0) {
        const categoryNames = {
          tone: '어조',
          structure: '구조',
          readability: '가독성',
          seo: 'SEO',
          engagement: '참여도',
          format: '형식'
        };
        prompt += `- ${categoryNames[category as keyof typeof categoryNames]}: ${values.join(', ')}\n`;
      }
    });
    prompt += '\n';
  } else if (guideline.type === 'memo' && guideline.memo) {
    prompt += `**작성 가이드라인:**\n${guideline.memo}\n\n`;
  }

  // 추가 프롬프트
  if (additionalPrompt) {
    prompt += `**추가 요구사항:**\n${additionalPrompt}\n\n`;
  }

  // 소스 텍스트
  prompt += `**소스 텍스트:**\n${sourceText}\n\n`;

  // 출력 형식 지정
  prompt += `**출력 형식:**
다음 JSON 형식으로 응답해주세요:
{
  "title": "매력적인 블로그 제목",
  "content": "본문 내용 (HTML 태그 사용 가능)",
  "summary": "3줄 이내 요약",
  "tags": ["태그1", "태그2", "태그3", "태그4", "태그5"]
}

**중요:** 응답은 반드시 유효한 JSON 형식이어야 합니다.`;

  return prompt;
}

/**
 * OpenAI API를 사용한 콘텐츠 생성
 */
export async function generateContent(request: ContentGenerationRequest): Promise<ContentGenerationResponse> {
  try {
    const prompt = createContentPrompt(request);
    
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: '당신은 한국어 블로그 콘텐츠 작성 전문가입니다. 자연스럽고 인간적인 글쓰기로 매력적인 블로그 글을 작성합니다. AI 탐지를 피하기 위해 다양한 문체와 개인적인 톤을 사용합니다.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.8,
      max_tokens: 3000,
      top_p: 0.9,
      frequency_penalty: 0.1,
      presence_penalty: 0.1
    });

    const responseText = completion.choices[0].message.content;
    if (!responseText) {
      throw new Error('OpenAI API에서 응답을 받지 못했습니다.');
    }

    // JSON 파싱 시도
    let parsedResponse;
    try {
      // JSON 블록 추출 (마크다운 코드 블록 제거)
      const jsonMatch = responseText.match(/```json\n([\s\S]*?)\n```/) || responseText.match(/```\n([\s\S]*?)\n```/) || [null, responseText];
      const jsonContent = jsonMatch[1] || responseText;
      
      parsedResponse = JSON.parse(jsonContent.trim());
    } catch (error) {
      // JSON 파싱 실패 시 텍스트를 직접 처리
      const lines = responseText.split('\n').filter(line => line.trim());
      parsedResponse = {
        title: lines[0] || '생성된 콘텐츠',
        content: lines.slice(1).join('\n'),
        summary: lines.slice(0, 3).join(' '),
        tags: ['블로그', '콘텐츠', '정보']
      };
    }

    // 메타데이터 생성
    const content = parsedResponse.content || '';
    const wordCount = content.split(/\s+/).length;
    const charCount = content.length;
    const readingTime = Math.ceil(wordCount / 200); // 분당 200단어 기준

    return {
      title: parsedResponse.title || '생성된 콘텐츠',
      content: parsedResponse.content || '',
      summary: parsedResponse.summary || '',
      tags: parsedResponse.tags || [],
      metadata: {
        wordCount,
        charCount,
        readingTime,
        generatedAt: new Date().toISOString(),
        model: 'gpt-4o',
        tokensUsed: completion.usage?.total_tokens
      }
    };

  } catch (error) {
    console.error('OpenAI API 오류:', error);
    throw new Error(`콘텐츠 생성 중 오류가 발생했습니다: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * 콘텐츠 재생성 (수정 요청)
 */
export async function regenerateContent(
  originalRequest: ContentGenerationRequest,
  originalContent: string,
  modificationRequest: string
): Promise<ContentGenerationResponse> {
  try {
    const prompt = `기존 콘텐츠를 다음 요구사항에 따라 수정해주세요:

**수정 요구사항:**
${modificationRequest}

**기존 콘텐츠:**
${originalContent}

**원본 소스:**
${originalRequest.sourceText}

**가이드라인:**
${originalRequest.guideline.type === 'keywords' 
  ? JSON.stringify(originalRequest.guideline.keywords, null, 2)
  : originalRequest.guideline.memo || ''}

다음 JSON 형식으로 수정된 콘텐츠를 제공해주세요:
{
  "title": "수정된 제목",
  "content": "수정된 본문",
  "summary": "수정된 요약",
  "tags": ["수정된", "태그", "목록"]
}`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: '당신은 콘텐츠 수정 전문가입니다. 사용자의 요구사항에 따라 기존 콘텐츠를 개선합니다.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 3000
    });

    const responseText = completion.choices[0].message.content;
    if (!responseText) {
      throw new Error('콘텐츠 재생성 중 오류가 발생했습니다.');
    }

    const parsedResponse = JSON.parse(responseText);
    const content = parsedResponse.content || '';
    const wordCount = content.split(/\s+/).length;
    const charCount = content.length;
    const readingTime = Math.ceil(wordCount / 200);

    return {
      title: parsedResponse.title || '수정된 콘텐츠',
      content: parsedResponse.content || '',
      summary: parsedResponse.summary || '',
      tags: parsedResponse.tags || [],
      metadata: {
        wordCount,
        charCount,
        readingTime,
        generatedAt: new Date().toISOString(),
        model: 'gpt-4o',
        tokensUsed: completion.usage?.total_tokens
      }
    };

  } catch (error) {
    console.error('콘텐츠 재생성 오류:', error);
    throw new Error(`콘텐츠 재생성 중 오류가 발생했습니다: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * OpenAI API 연결 테스트
 */
export async function testOpenAIConnection(): Promise<boolean> {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: 'Hello' }],
      max_tokens: 10
    });

    console.log('✅ OpenAI API connected successfully');
    return true;
  } catch (error) {
    console.error('❌ OpenAI API connection failed:', error);
    return false;
  }
}

export default openai; 