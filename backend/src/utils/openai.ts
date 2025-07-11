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
  const { sourceText, contentType = 'blog', targetLength = 800, additionalPrompt } = request;
  
  // 입력 내용에 따른 맞춤형 데모 콘텐츠 생성
  const inputKeywords = sourceText.toLowerCase();
  let mockTitle = '';
  let mockContent = '';
  let mockSummary = '';
  let mockTags: string[] = [];

  // 주제별 현실적인 콘텐츠 생성
  if (inputKeywords.includes('맛집') || inputKeywords.includes('음식') || inputKeywords.includes('요리')) {
    mockTitle = '🍽️ 서울 숨은 맛집 BEST 5: 현지인만 아는 진짜 맛집';
    mockContent = `🎯 안녕하세요! 오늘은 서울에서 꼭 가봐야 할 숨은 맛집들을 소개해드리려고 합니다.

평소에 맛집 탐방을 좋아하는 저로서는, 정말 **맛있는 곳들**만 엄선해서 가져왔어요! 


💡 현지인만 아는 진짜 맛집들

1️⃣ **홍대 골목 김치찌개 전문점**
▪ 위치: 홍대입구역 2번 출구 도보 5분
▪ 대표메뉴: 묵은지 김치찌개 (8,000원)
▪ 특징: 40년 전통의 김치로 끓인 깊은 맛

2️⃣ **강남 숨은 일식집 '사쿠라'**
▪ 위치: 강남역 11번 출구 지하상가
▪ 대표메뉴: 연어덮밥 (12,000원)
▪ 특징: 매일 새벽 직접 공수하는 신선한 횟감


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━


🔥 실제 가본 후기

개인적으로 모든 곳을 직접 방문해봤는데, 정말 **기대 이상**이었어요! 특히 홍대 김치찌개집은 어머니 손맛 그대로라서 깜짝 놀랐습니다.


💪 **꿀팁**: 점심시간에는 웨이팅이 있으니 11시 30분쯤 가시는 걸 추천드려요!

⚠️ 현재 데모 모드로 실행 중입니다. 실제 OpenAI API를 연결하면 더욱 개인화된 맛집 추천을 받을 수 있습니다!`;
    mockSummary = '서울의 숨은 맛집 5곳을 소개합니다. 현지인만 아는 진짜 맛있는 곳들로, 김치찌개부터 일식까지 다양한 맛집 정보를 담았습니다.';
    mockTags = ['서울맛집', '숨은맛집', '현지인추천', '김치찌개', '일식', '맛집투어'];

  } else if (inputKeywords.includes('여행') || inputKeywords.includes('관광') || inputKeywords.includes('휴가')) {
    mockTitle = '✈️ 겨울 제주도 여행 완벽 가이드: 3박 4일 일정표';
    mockContent = `🎯 안녕하세요! 이번 겨울에 제주도 여행을 계획하고 계신가요?

겨울 제주도는 사람들이 많이 없어서 **여유롭게 즐기기 정말 좋은 시기**입니다!


💡 겨울 제주도만의 특별함

▪ 한라산 설경: 1년 중 가장 아름다운 순간
▪ 따뜻한 온천: 추위를 녹여주는 힐링 타임  
▪ 겨울 한정 감귤: 가장 달고 맛있는 시기
▪ 저렴한 숙박비: 성수기 대비 50% 절약


🔥 3박 4일 완벽 일정

**1일차: 제주시 도착 & 시내 탐방**
1️⃣ 제주공항 도착 (오전)
2️⃣ 렌터카 픽업 및 호텔 체크인
3️⃣ 동문시장에서 현지 음식 체험
4️⃣ 제주항 야경 감상

**2일차: 한라산 트레킹**
1️⃣ 어리목 탐방로 출발 (오전 7시)
2️⃣ 윗세오름 대피소까지 왕복 (4시간)
3️⃣ 오설록 티뮤지엄 방문
4️⃣ 중문관광단지 석식


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━


💭 "겨울 제주도는 정말 특별한 경험이었어요. 설경 속 한라산은 평생 잊지 못할 추억이 되었습니다."


✅ 준비물 체크리스트
▪ 방한복 (산행용 패딩 필수)
▪ 등산화 (겨울용 방수 신발)
▪ 핫팩 (한라산에서 꼭 필요)
▪ 선글라스 (설반사 대비)

💪 **꿀팁**: 렌터카는 미리 예약하면 30% 저렴하고, 겨울철에는 스노우체인 대여도 고려해보세요!`;
    mockSummary = '겨울 제주도 3박 4일 여행 가이드입니다. 한라산 설경, 온천, 감귤 체험 등 겨울만의 특별한 즐거움과 상세한 일정표를 제공합니다.';
    mockTags = ['제주도여행', '겨울여행', '한라산', '국내여행', '3박4일', '여행가이드'];

  } else if (inputKeywords.includes('개발') || inputKeywords.includes('프로그래밍') || inputKeywords.includes('코딩')) {
    mockTitle = '💻 React 18의 새로운 기능들: 개발자가 꼭 알아야 할 5가지';
    mockContent = `🎯 안녕하세요! 프론트엔드 개발자 여러분!

React 18이 출시된 지 꽤 되었지만, 아직도 **새로운 기능들을 제대로 활용하지 못하는 분들**이 많은 것 같아요.


💡 React 18 핵심 업데이트

**1️⃣ Concurrent Rendering**
▪ 백그라운드에서 컴포넌트 렌더링
▪ 사용자 인터랙션 우선순위 처리
▪ 더 부드러운 사용자 경험 제공

**2️⃣ Automatic Batching**
▪ 여러 상태 업데이트를 자동으로 배치 처리
▪ 불필요한 리렌더링 방지
▪ 성능 향상 효과

**3️⃣ Suspense 개선**
▪ 서버 사이드 렌더링 지원 강화
▪ 로딩 상태 관리 최적화
▪ 사용자 경험 개선


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━


🔥 실제 프로젝트 적용 경험

최근 회사 프로젝트에 React 18을 적용해봤는데, **렌더링 성능이 30% 향상**되었어요! 특히 대용량 리스트 처리에서 효과가 크더라고요.

\`\`\`javascript
// Before: React 17
const handleClick = () => {
  setCount(count + 1);
  setName('Updated');
  // 2번의 리렌더링 발생
};

// After: React 18 Automatic Batching
const handleClick = () => {
  setCount(count + 1);
  setName('Updated');
  // 1번의 리렌더링만 발생
};
\`\`\`


✅ 마이그레이션 체크리스트
▪ React와 ReactDOM 18 버전으로 업데이트
▪ createRoot API로 변경
▪ StrictMode 적용으로 잠재적 이슈 확인
▪ 기존 테스트 코드 검증

💪 **꿀팁**: 점진적 마이그레이션을 추천드려요. 한 번에 모든 걸 바꾸려 하지 마시고, 중요한 컴포넌트부터 차례대로 적용해보세요!`;
    mockSummary = 'React 18의 주요 새 기능들을 정리했습니다. Concurrent Rendering, Automatic Batching, Suspense 개선사항과 실제 적용 경험을 공유합니다.';
    mockTags = ['React18', '프론트엔드', '웹개발', 'JavaScript', '성능최적화', '개발자'];

  } else if (inputKeywords.includes('부동산') || inputKeywords.includes('투자') || inputKeywords.includes('재테크')) {
    mockTitle = '🏠 2025년 부동산 투자 전망: 신중한 투자자를 위한 가이드';
    mockContent = `🎯 안녕하세요! 부동산 투자에 관심 있는 여러분!

2025년 부동산 시장이 **많은 변화를 겪고 있는 시점**에서, 어떻게 투자해야 할지 고민이 많으실 텐데요.


💡 2025년 부동산 시장 전망

**📈 상승 요인들**
▪ 공급 부족 현상 지속
▪ 인구 집중 지역의 수요 증가
▪ 인프라 개발 프로젝트 확대

**📉 하락 요인들**  
▪ 금리 상승에 따른 투자 심리 위축
▪ 정부의 부동산 규제 정책
▪ 경제 불확실성 증대


🔥 지역별 투자 포인트

**1️⃣ 수도권 신도시**
▪ 교통 접근성 개선 예정 지역
▪ 대형 쇼핑몰, 병원 등 인프라 확충
▪ 중장기 관점에서 안정적 수익 기대

**2️⃣ 지방 주요 도시**
▪ 상대적으로 저렴한 진입 비용
▪ 지역 경제 활성화 정책 수혜
▪ 임대 수익률 상대적으로 높음


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━


💭 "부동산 투자는 마라톤과 같습니다. 단기적 수익보다는 장기적 관점에서 접근하는 것이 중요해요."


⚠️ 투자 시 주의사항
▪ 무리한 대출은 절대 금물
▪ 충분한 시장 조사 후 결정
▪ 전문가 조언 반드시 참고
▪ 분산 투자로 리스크 관리

💪 **꿀팁**: 부동산 투자 전에는 해당 지역을 직접 방문해서 주변 환경을 꼼꼼히 살펴보세요. 온라인 정보만으로는 알 수 없는 것들이 많답니다!`;
    mockSummary = '2025년 부동산 투자 전망과 전략을 분석했습니다. 시장 상황, 지역별 투자 포인트, 주의사항을 정리하여 신중한 투자 가이드를 제공합니다.';
    mockTags = ['부동산투자', '2025년전망', '재테크', '투자전략', '부동산시장', '투자가이드'];

  } else {
    // 기본 일반적인 콘텐츠
    const topics = ['라이프스타일', '건강', '취미', '문화'];
    const randomTopic = topics[Math.floor(Math.random() * topics.length)];
    
    mockTitle = `🌟 ${sourceText.substring(0, 20)}에 대한 완벽 가이드`;
    mockContent = `🎯 안녕하세요! 오늘은 ${sourceText}에 대해 자세히 알아보겠습니다.

많은 분들이 이 주제에 대해 궁금해하시는데, **실제 경험을 바탕으로** 정리해드리려고 합니다!


💡 핵심 포인트

1️⃣ **기본 이해하기**
▪ 기초 개념 정리
▪ 중요한 배경 지식
▪ 실생활 연관성

2️⃣ **실전 적용법**  
▪ 단계별 접근 방법
▪ 주의해야 할 점들
▪ 효과적인 실행 전략


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━


🔥 개인적인 경험담

저도 처음에는 잘 몰랐었는데, **직접 해보니 생각보다 어렵지 않더라고요!** 중요한 것은 꾸준함과 올바른 방법이었습니다.


✅ 추천 방법
▪ 충분한 정보 수집
▪ 단계적 접근
▪ 꾸준한 실천
▪ 결과 점검 및 개선

💪 **꿀팁**: 너무 완벽하려고 하지 마시고, 작은 것부터 차근차근 시작해보세요. 작은 성공들이 모여서 큰 변화를 만들어낸답니다!

⚠️ 현재 데모 모드로 실행 중입니다. 실제 OpenAI API를 연결하면 더욱 전문적이고 개인화된 콘텐츠를 생성할 수 있습니다.`;
    mockSummary = `${sourceText}에 대한 실용적인 가이드입니다. 기본 개념부터 실전 적용법까지, 실제 경험을 바탕으로 유용한 정보를 제공합니다.`;
    mockTags = [randomTopic, '가이드', '실용정보', '경험담', '팁'];
  }

  const wordCount = mockContent.split(/\s+/).length;
  const charCount = mockContent.length;
  const readingTime = Math.ceil(wordCount / 200);

  return {
    title: mockTitle,
    content: mockContent,
    summary: mockSummary,
    tags: mockTags,
    metadata: {
      wordCount,
      charCount,
      readingTime,
      generatedAt: new Date().toISOString(),
      model: 'demo-mock-enhanced',
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