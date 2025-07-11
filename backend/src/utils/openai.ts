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

**복사 붙여넣기 가능한 스타일링 요소 (HTML 태그 절대 사용 금지):**
- 메인 제목: 🎯 제목내용
- 소제목: 💡 소제목내용, ✅ 소제목내용, 🔥 소제목내용
- 중요한 내용: **강조할 내용** 형태로 감싸기
- 리스트: ▪ 항목1, ▫ 항목2, • 항목3 형태 사용
- 구분선: ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- 핵심 인용문: 💭 "핵심 메시지 내용"
- 번호 목록: 1️⃣, 2️⃣, 3️⃣ 등 이모지 숫자 사용
- 체크리스트: ✅ 완료항목, ☑️ 체크항목
- 주의사항: ⚠️ 주의할 내용
- 팁: 💪 유용한 팁 내용

**스타일링 예시:**
🎯 메인 제목

안녕하세요! 오늘은 정말 **중요한 내용**을 다뤄보려고 합니다.

💡 첫 번째 소제목

여기에는 상세한 설명이 들어갑니다.

▪ 첫 번째 포인트
▪ 두 번째 포인트  
▪ 세 번째 포인트

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔥 두 번째 소제목

💭 "핵심 메시지는 이렇게 표현합니다"

1️⃣ 첫 번째 단계
2️⃣ 두 번째 단계
3️⃣ 세 번째 단계

⚠️ 주의할 점: 이런 식으로 경고나 주의사항을 표시합니다.

💪 **팁**: 유용한 정보는 이렇게 강조해서 제공합니다!

**문단 구분 규칙:**
- 각 섹션 사이에는 반드시 빈 줄 2개 삽입
- 리스트 항목들 사이는 빈 줄 없이 연속 작성
- 구분선 위아래로 빈 줄 1개씩 삽입

**콘텐츠 구조:**
1. 🎯 매력적인 메인 제목
2. 친근한 인사와 도입부
3. 💡 첫 번째 핵심 내용 (소제목 + 설명 + 리스트)
4. ━━━ 구분선
5. 🔥 두 번째 핵심 내용 (소제목 + 인용문 + 단계별 설명)
6. ✅ 마무리 및 독자 액션 유도

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
  "title": "매력적인 블로그 제목 (이모지 포함)",
  "content": "본문 내용 (복사 붙여넣기 가능한 스타일링된 텍스트)",
  "summary": "3줄 이내 요약",
  "tags": ["태그1", "태그2", "태그3", "태그4", "태그5"]
}

**절대 중요사항:** 
- HTML 태그는 절대 사용하지 마세요 (<h2>, <p>, <strong> 등 금지)
- 위에서 제시한 이모지와 유니코드 문자만 사용하세요
- 복사해서 네이버 블로그에 바로 붙여넣을 수 있는 형태로 작성하세요
- **강조**는 마크다운 형식으로만 사용하세요
- 응답은 반드시 유효한 JSON 형식이어야 합니다`;

  return prompt;
}

/**
 * OpenAI API를 사용한 콘텐츠 생성
 */
export async function generateContent(request: ContentGenerationRequest): Promise<ContentGenerationResponse> {
  console.log('🤖 OpenAI 콘텐츠 생성 함수 시작');
  
  try {
    // OpenAI API 키 검증
    console.log('🔑 OpenAI API 키 확인 중...');
    const apiKey = process.env.OPENAI_API_KEY;
    console.log('현재 API 키:', apiKey ? `${apiKey.substring(0, 20)}...` : 'undefined');
    
    if (!apiKey || apiKey === 'your-openai-api-key-here') {
      console.warn('⚠️  OpenAI API 키가 설정되지 않았습니다. 데모 콘텐츠를 제공합니다.');
      return generateMockContent(request);
    }

    console.log('✅ OpenAI API 키가 설정되어 있습니다. 실제 AI 콘텐츠를 생성합니다...');
    
    const prompt = createContentPrompt(request);
    console.log('📝 프롬프트 생성 완료:', { 
      promptLength: prompt.length,
      sourceTextLength: request.sourceText.length,
      contentType: request.contentType
    });
    
    console.log('📡 OpenAI API 호출 시작...');
    const startTime = Date.now();
    
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

    const apiCallDuration = Date.now() - startTime;
    console.log('🎉 OpenAI API 호출 성공!', { 
      duration: `${apiCallDuration}ms`,
      tokensUsed: completion.usage?.total_tokens,
      model: completion.model
    });
    
    const responseText = completion.choices[0].message.content;
    
    if (!responseText) {
      const error = new Error('OpenAI API에서 응답을 받지 못했습니다.');
      console.error('❌ OpenAI 응답 없음:', error);
      throw error;
    }

    console.log('📄 OpenAI 응답 받음:', { 
      responseLength: responseText.length,
      hasChoices: completion.choices.length > 0
    });

    // JSON 파싱 시도
    let parsedResponse;
    try {
      console.log('🔍 JSON 파싱 시도 중...');
      
      // JSON 블록 추출 (마크다운 코드 블록 제거)
      const jsonMatch = responseText.match(/```json\n([\s\S]*?)\n```/) || responseText.match(/```\n([\s\S]*?)\n```/) || [null, responseText];
      const jsonContent = jsonMatch[1] || responseText;
      
      parsedResponse = JSON.parse(jsonContent.trim());
      console.log('✅ JSON 파싱 성공:', { 
        title: parsedResponse.title ? 'OK' : 'Missing',
        content: parsedResponse.content ? 'OK' : 'Missing',
        tags: Array.isArray(parsedResponse.tags) ? parsedResponse.tags.length : 'Invalid'
      });
      
    } catch (parseError) {
      console.warn('⚠️ JSON 파싱 실패, 텍스트 직접 처리:', parseError);
      
      // JSON 파싱 실패 시 텍스트를 직접 처리
      const lines = responseText.split('\n').filter(line => line.trim());
      parsedResponse = {
        title: lines[0] || '생성된 콘텐츠',
        content: lines.slice(1).join('\n'),
        summary: lines.slice(0, 3).join(' '),
        tags: ['블로그', '콘텐츠', '정보']
      };
      
      console.log('🔧 대체 파싱 결과:', {
        titleLength: parsedResponse.title.length,
        contentLength: parsedResponse.content.length,
        tagsCount: parsedResponse.tags.length
      });
    }

    // 메타데이터 생성
    const content = parsedResponse.content || '';
    const wordCount = content.split(/\s+/).length;
    const charCount = content.length;
    const readingTime = Math.ceil(wordCount / 200); // 분당 200단어 기준

    const result: ContentGenerationResponse = {
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

    console.log('🎯 콘텐츠 생성 완료:', {
      totalDuration: `${Date.now() - startTime}ms`,
      title: result.title.substring(0, 50) + '...',
      contentWords: result.metadata.wordCount,
      contentChars: result.metadata.charCount,
      tags: result.tags.length
    });

    return result;

  } catch (error) {
    console.error('🚨 OpenAI API 오류 상세:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      type: error instanceof Error ? error.constructor.name : typeof error
    });
    
    console.warn('⚠️  OpenAI API 호출 실패. 데모 콘텐츠를 제공합니다.');
    return generateMockContent(request);
  }
}

/**
 * 데모용 목(Mock) 콘텐츠 생성
 */
function generateMockContent(request: ContentGenerationRequest): ContentGenerationResponse {
  const { contentType = 'blog', targetLength = 800 } = request;
  
  // 콘텐츠 타입별 템플릿
  const templates = {
    blog: {
      title: '🌟 BlogCraft AI로 생성된 데모 블로그 콘텐츠',
      content: `🎯 안녕하세요! 이것은 BlogCraft AI 데모 콘텐츠입니다

현재 OpenAI API 키가 설정되지 않아서 데모 콘텐츠를 보여드리고 있습니다.


💡 실제 사용 방법

1️⃣ OpenAI API 키를 backend/.env 파일에 설정하세요
2️⃣ 파일을 업로드하고 가이드라인을 설정하세요  
3️⃣ AI가 맞춤형 블로그 콘텐츠를 생성해드립니다


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━


🔥 BlogCraft의 특징

▪ 네이버 블로그 최적화
▪ AI 탐지 우회 기능  
▪ SEO 최적화
▪ 다양한 콘텐츠 타입 지원


💪 **팁**: 더 자세한 정보가 필요하시면 설정에서 OpenAI API 키를 추가해주세요!`,
      summary: 'BlogCraft AI 데모 콘텐츠입니다. 실제 사용을 위해서는 OpenAI API 키 설정이 필요합니다.',
      tags: ['BlogCraft', '데모', 'AI콘텐츠', '블로그', '데모버전']
    },
    news: {
      title: '📰 [데모] AI 기반 콘텐츠 생성 서비스 출시',
      content: `🎯 BlogCraft AI 서비스 데모 버전 공개

**서울, 2024년** - 새로운 AI 기반 블로그 콘텐츠 생성 서비스가 데모 버전으로 공개되었습니다.


💡 주요 기능

▪ 자동 콘텐츠 생성
▪ SEO 최적화
▪ AI 탐지 우회
▪ 썸네일 생성


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━


✅ 현재 데모 버전에서는 OpenAI API 키 설정 후 모든 기능을 이용할 수 있습니다.`,
      summary: 'BlogCraft AI 서비스 데모 버전이 공개되었습니다.',
      tags: ['뉴스', '서비스출시', 'AI', '블로그', '데모']
    },
    review: {
      title: '⭐ BlogCraft AI 서비스 리뷰 (데모 버전)',
      content: `🎯 BlogCraft AI 첫 사용 후기

**평점: ⭐⭐⭐⭐⭐ (5/5)**


💡 장점

▪ 직관적인 사용자 인터페이스
▪ 다양한 콘텐츠 타입 지원
▪ 네이버 블로그 최적화
▪ 빠른 생성 속도


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━


🔥 개선점

▪ OpenAI API 키 설정 필요
▪ 더 많은 템플릿 제공 예정


💭 "전체적으로 매우 만족스러운 서비스입니다!"`,
      summary: 'BlogCraft AI 서비스의 장점과 개선점을 리뷰한 내용입니다.',
      tags: ['리뷰', '후기', '평점', 'AI서비스', '추천']
    },
    tutorial: {
      title: '📚 BlogCraft AI 사용법 가이드 (데모)',
      content: `🎯 BlogCraft AI 시작하기


💡 1단계: 계정 설정

회원가입을 하고 로그인하세요.


🔥 2단계: 소스 파일 업로드

PDF, DOC, TXT 파일 또는 URL을 업로드하세요.


✅ 3단계: 가이드라인 설정

키워드나 메모를 통해 콘텐츠 방향을 설정하세요.


🌟 4단계: 콘텐츠 생성

AI가 자동으로 블로그 콘텐츠를 생성해드립니다.


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━


💪 5단계: 추가 기능 활용

▪ AI 탐지 우회 처리
▪ SEO 최적화
▪ 썸네일 생성


⚠️ **주의**: 실제 사용을 위해서는 OpenAI API 키 설정이 필요합니다.`,
      summary: 'BlogCraft AI 서비스의 단계별 사용법을 설명한 가이드입니다.',
      tags: ['튜토리얼', '사용법', '가이드', '초보자', '설명서']
    }
  };

  const template = templates[contentType];
  const content = template.content;
  const wordCount = content.split(/\s+/).length;
  const charCount = content.length;
  const readingTime = Math.ceil(wordCount / 200);

  return {
    title: template.title,
    content: template.content,
    summary: template.summary,
    tags: template.tags,
    metadata: {
      wordCount,
      charCount,
      readingTime,
      generatedAt: new Date().toISOString(),
      model: 'demo-mock',
      tokensUsed: 0
    }
  };
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
    // OpenAI API 키 검증
    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your-openai-api-key-here') {
      console.warn('⚠️  OpenAI API 키가 설정되지 않았습니다. 데모 재생성 콘텐츠를 제공합니다.');
      return generateMockRegeneratedContent(originalRequest, originalContent, modificationRequest);
    }

    const prompt = `기존 콘텐츠를 다음 요구사항에 따라 수정해주세요:

**수정 요구사항:**
${modificationRequest}

**복사 붙여넣기 가능한 스타일링 적용 (HTML 태그 절대 금지):**
- 메인 제목: 🎯 제목내용
- 소제목: 💡, ✅, 🔥 등 이모지 + 제목
- 중요한 내용: **강조할 내용** 마크다운 형식
- 리스트: ▪, ▫, • 불릿 포인트 사용
- 번호 목록: 1️⃣, 2️⃣, 3️⃣ 이모지 숫자
- 구분선: ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- 핵심 인용문: 💭 "핵심 메시지"
- 체크리스트: ✅, ☑️ 체크 이모지
- 주의사항: ⚠️ 경고 내용
- 팁: 💪 유용한 정보

**기존 콘텐츠:**
${originalContent}

**원본 소스:**
${originalRequest.sourceText}

**가이드라인:**
${originalRequest.guideline.type === 'keywords' 
  ? JSON.stringify(originalRequest.guideline.keywords, null, 2)
  : originalRequest.guideline.memo || ''}

**출력 요구사항:**
- 수정된 콘텐츠는 블로그 독자가 끝까지 읽고 싶어하는 매력적인 구조로 작성
- 이모지와 유니코드 문자를 적극 활용하여 시각적 효과 극대화
- 자연스럽고 인간적인 문체 유지
- 네이버 블로그 특성에 맞는 친근한 톤 적용
- HTML 태그는 절대 사용 금지
- 복사해서 바로 붙여넣을 수 있는 형태로 작성

다음 JSON 형식으로 수정된 콘텐츠를 제공해주세요:
{
  "title": "수정된 제목 (이모지 포함)",
  "content": "수정된 본문 (복사 붙여넣기 가능한 스타일링된 텍스트)",
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
    console.warn('⚠️  OpenAI API 호출 실패. 데모 재생성 콘텐츠를 제공합니다.');
    return generateMockRegeneratedContent(originalRequest, originalContent, modificationRequest);
  }
}

/**
 * 데모용 목(Mock) 재생성 콘텐츠 생성
 */
function generateMockRegeneratedContent(
  originalRequest: ContentGenerationRequest,
  originalContent: string,
  modificationRequest: string
): ContentGenerationResponse {
  const { contentType = 'blog' } = originalRequest;
  
  const mockContent = `🔄 재생성된 데모 콘텐츠

**수정 요청사항**: ${modificationRequest}


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━


💡 원본 콘텐츠가 다음과 같이 수정되었습니다

▪ 요청사항에 따른 내용 조정
▪ 더 자연스러운 표현으로 개선
▪ 추가 정보 및 구체적인 설명 포함


🌟 개선된 내용

BlogCraft AI는 사용자의 피드백을 바탕으로 콘텐츠를 재생성합니다. 실제 사용 시에는 OpenAI API를 통해 더욱 정교하고 맞춤형 콘텐츠를 생성해드립니다.


💡 재생성 기능의 장점

▪ 즉시 피드백 반영
▪ 다양한 스타일 적용
▪ 길이 및 톤 조정
▪ SEO 최적화


⚠️ 이것은 데모 버전입니다. 실제 사용을 위해서는 OpenAI API 키 설정이 필요합니다.`;

  const wordCount = mockContent.split(/\s+/).length;
  const charCount = mockContent.length;
  const readingTime = Math.ceil(wordCount / 200);

  return {
    title: '🔄 재생성된 ' + (contentType === 'blog' ? '블로그' : contentType === 'news' ? '뉴스' : contentType === 'review' ? '리뷰' : '튜토리얼') + ' 콘텐츠 (데모)',
    content: mockContent,
    summary: `사용자 요청에 따라 재생성된 데모 콘텐츠입니다. 요청사항: ${modificationRequest}`,
    tags: ['재생성', '데모', 'AI수정', '개선버전', 'BlogCraft'],
    metadata: {
      wordCount,
      charCount,
      readingTime,
      generatedAt: new Date().toISOString(),
      model: 'demo-mock-regenerated',
      tokensUsed: 0
    }
  };
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