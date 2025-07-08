import { parse } from 'node-html-parser';
import * as Korean from 'korean-js';

export interface KeywordAnalysis {
  keyword: string;
  frequency: number;
  density: number;
  positions: number[];
  isOptimal: boolean;
  recommendation: string;
}

export interface SEOAnalysis {
  score: number;
  keywords: KeywordAnalysis[];
  titleAnalysis: {
    length: number;
    isOptimal: boolean;
    hasKeyword: boolean;
    recommendation: string;
  };
  metaDescription: {
    length: number;
    isOptimal: boolean;
    hasKeyword: boolean;
    recommendation: string;
  };
  headingStructure: {
    h1Count: number;
    h2Count: number;
    h3Count: number;
    isOptimal: boolean;
    recommendation: string;
  };
  contentAnalysis: {
    wordCount: number;
    readability: number;
    avgSentenceLength: number;
    isOptimal: boolean;
    recommendation: string;
  };
  recommendations: string[];
}

export interface NaverBlogOptimization {
  naverKeywords: string[];
  trendingTopics: string[];
  relatedSearches: string[];
  naverSEOTips: string[];
  optimizedTitle: string;
  optimizedDescription: string;
  hashtags: string[];
}

/**
 * 텍스트에서 키워드 분석
 */
export function analyzeKeywords(content: string, targetKeywords: string[] = []): KeywordAnalysis[] {
  const text = content.toLowerCase();
  const words = text.match(/[\w가-힣]+/g) || [];
  const totalWords = words.length;
  
  // 키워드 빈도 계산
  const keywordFrequency = new Map<string, number>();
  const keywordPositions = new Map<string, number[]>();
  
  words.forEach((word, index) => {
    keywordFrequency.set(word, (keywordFrequency.get(word) || 0) + 1);
    if (!keywordPositions.has(word)) {
      keywordPositions.set(word, []);
    }
    keywordPositions.get(word)!.push(index);
  });
  
  // 대상 키워드가 없으면 상위 빈도 키워드 자동 추출
  if (targetKeywords.length === 0) {
    const sortedKeywords = Array.from(keywordFrequency.entries())
      .filter(([word]) => word.length > 1 && !isStopWord(word))
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([word]) => word);
    
    targetKeywords = sortedKeywords;
  }
  
  return targetKeywords.map(keyword => {
    const frequency = keywordFrequency.get(keyword.toLowerCase()) || 0;
    const density = totalWords > 0 ? (frequency / totalWords) * 100 : 0;
    const positions = keywordPositions.get(keyword.toLowerCase()) || [];
    
    // 키워드 밀도 최적화 기준 (1-3% 권장)
    const isOptimal = density >= 1 && density <= 3;
    
    let recommendation = '';
    if (density < 1) {
      recommendation = '키워드 사용 빈도를 늘려주세요 (목표: 1-3%)';
    } else if (density > 3) {
      recommendation = '키워드 사용을 줄여주세요. 과도한 사용은 검색엔진에 불리합니다';
    } else {
      recommendation = '적절한 키워드 밀도입니다';
    }
    
    return {
      keyword,
      frequency,
      density: Math.round(density * 100) / 100,
      positions,
      isOptimal,
      recommendation
    };
  });
}

/**
 * 제목 최적화 분석
 */
export function analyzeTitleSEO(title: string, targetKeyword?: string): {
  length: number;
  isOptimal: boolean;
  hasKeyword: boolean;
  recommendation: string;
} {
  const length = title.length;
  const hasKeyword = targetKeyword ? title.toLowerCase().includes(targetKeyword.toLowerCase()) : false;
  
  // 네이버 블로그 제목 최적 길이: 20-40자
  const isOptimal = length >= 20 && length <= 40;
  
  let recommendation = '';
  if (length < 20) {
    recommendation = '제목이 너무 짧습니다. 20-40자 사이로 늘려주세요';
  } else if (length > 40) {
    recommendation = '제목이 너무 깁니다. 40자 이하로 줄여주세요';
  } else if (!hasKeyword && targetKeyword) {
    recommendation = `타겟 키워드 '${targetKeyword}'를 제목에 포함해주세요`;
  } else {
    recommendation = '좋은 제목입니다';
  }
  
  return {
    length,
    isOptimal: isOptimal && (targetKeyword ? hasKeyword : true),
    hasKeyword,
    recommendation
  };
}

/**
 * 메타 설명 최적화 분석
 */
export function analyzeMetaDescription(description: string, targetKeyword?: string): {
  length: number;
  isOptimal: boolean;
  hasKeyword: boolean;
  recommendation: string;
} {
  const length = description.length;
  const hasKeyword = targetKeyword ? description.toLowerCase().includes(targetKeyword.toLowerCase()) : false;
  
  // 네이버 검색 결과 최적 길이: 140-160자
  const isOptimal = length >= 140 && length <= 160;
  
  let recommendation = '';
  if (length < 140) {
    recommendation = '메타 설명이 너무 짧습니다. 140-160자 사이로 늘려주세요';
  } else if (length > 160) {
    recommendation = '메타 설명이 너무 깁니다. 160자 이하로 줄여주세요';
  } else if (!hasKeyword && targetKeyword) {
    recommendation = `타겟 키워드 '${targetKeyword}'를 메타 설명에 포함해주세요`;
  } else {
    recommendation = '좋은 메타 설명입니다';
  }
  
  return {
    length,
    isOptimal: isOptimal && (targetKeyword ? hasKeyword : true),
    hasKeyword,
    recommendation
  };
}

/**
 * 헤딩 구조 분석
 */
export function analyzeHeadingStructure(content: string): {
  h1Count: number;
  h2Count: number;
  h3Count: number;
  isOptimal: boolean;
  recommendation: string;
} {
  const root = parse(content);
  const h1Count = root.querySelectorAll('h1').length;
  const h2Count = root.querySelectorAll('h2').length;
  const h3Count = root.querySelectorAll('h3').length;
  
  const isOptimal = h1Count === 1 && h2Count >= 2 && h3Count >= 1;
  
  let recommendation = '';
  if (h1Count === 0) {
    recommendation = 'H1 태그가 없습니다. 메인 제목을 H1으로 설정해주세요';
  } else if (h1Count > 1) {
    recommendation = 'H1 태그는 하나만 사용해야 합니다';
  } else if (h2Count < 2) {
    recommendation = 'H2 태그를 2개 이상 사용하여 콘텐츠를 구조화해주세요';
  } else if (h3Count === 0) {
    recommendation = 'H3 태그를 사용하여 세부 구조를 만들어주세요';
  } else {
    recommendation = '좋은 헤딩 구조입니다';
  }
  
  return {
    h1Count,
    h2Count,
    h3Count,
    isOptimal,
    recommendation
  };
}

/**
 * 콘텐츠 가독성 분석
 */
export function analyzeContentReadability(content: string): {
  wordCount: number;
  readability: number;
  avgSentenceLength: number;
  isOptimal: boolean;
  recommendation: string;
} {
  const text = content.replace(/<[^>]*>/g, ''); // HTML 태그 제거
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const words = text.match(/[\w가-힣]+/g) || [];
  
  const wordCount = words.length;
  const sentenceCount = sentences.length;
  const avgSentenceLength = sentenceCount > 0 ? wordCount / sentenceCount : 0;
  
  // 가독성 점수 계산 (Flesch Reading Ease 변형)
  let readability = 100;
  if (avgSentenceLength > 25) readability -= 10;
  if (avgSentenceLength > 30) readability -= 15;
  if (avgSentenceLength > 35) readability -= 20;
  
  const isOptimal = wordCount >= 1000 && avgSentenceLength <= 25 && readability >= 70;
  
  let recommendation = '';
  if (wordCount < 1000) {
    recommendation = '콘텐츠가 너무 짧습니다. 1000자 이상으로 늘려주세요';
  } else if (avgSentenceLength > 25) {
    recommendation = '문장이 너무 깁니다. 한 문장당 25단어 이하로 줄여주세요';
  } else if (readability < 70) {
    recommendation = '가독성을 높이기 위해 문장을 간단히 해주세요';
  } else {
    recommendation = '좋은 가독성입니다';
  }
  
  return {
    wordCount,
    readability: Math.round(readability),
    avgSentenceLength: Math.round(avgSentenceLength * 10) / 10,
    isOptimal,
    recommendation
  };
}

/**
 * 종합 SEO 분석
 */
export function analyzeSEO(
  title: string,
  content: string,
  metaDescription: string,
  targetKeywords: string[] = []
): SEOAnalysis {
  const primaryKeyword = targetKeywords[0];
  
  const keywords = analyzeKeywords(content, targetKeywords);
  const titleAnalysis = analyzeTitleSEO(title, primaryKeyword);
  const metaDescAnalysis = analyzeMetaDescription(metaDescription, primaryKeyword);
  const headingStructure = analyzeHeadingStructure(content);
  const contentAnalysis = analyzeContentReadability(content);
  
  // 전체 SEO 점수 계산
  let score = 0;
  if (titleAnalysis.isOptimal) score += 25;
  if (metaDescAnalysis.isOptimal) score += 20;
  if (headingStructure.isOptimal) score += 20;
  if (contentAnalysis.isOptimal) score += 20;
  if (keywords.some(k => k.isOptimal)) score += 15;
  
  // 추천사항 생성
  const recommendations: string[] = [];
  if (!titleAnalysis.isOptimal) recommendations.push(titleAnalysis.recommendation);
  if (!metaDescAnalysis.isOptimal) recommendations.push(metaDescAnalysis.recommendation);
  if (!headingStructure.isOptimal) recommendations.push(headingStructure.recommendation);
  if (!contentAnalysis.isOptimal) recommendations.push(contentAnalysis.recommendation);
  
  keywords.forEach(keyword => {
    if (!keyword.isOptimal) {
      recommendations.push(`${keyword.keyword}: ${keyword.recommendation}`);
    }
  });
  
  return {
    score,
    keywords,
    titleAnalysis,
    metaDescription: metaDescAnalysis,
    headingStructure,
    contentAnalysis,
    recommendations
  };
}

/**
 * 네이버 블로그 최적화 분석
 */
export function analyzeNaverBlogSEO(
  title: string,
  content: string,
  tags: string[] = []
): NaverBlogOptimization {
  const text = content.replace(/<[^>]*>/g, '');
  
  // 네이버 트렌드 키워드 (예시 - 실제로는 네이버 API 연동 필요)
  const naverKeywords = extractNaverKeywords(text);
  const trendingTopics = generateTrendingTopics(title, content);
  const relatedSearches = generateRelatedSearches(title);
  const naverSEOTips = generateNaverSEOTips(title, content);
  
  // 네이버 블로그 최적화된 제목 생성
  const optimizedTitle = optimizeTitleForNaver(title, naverKeywords[0]);
  
  // 네이버 블로그 최적화된 설명 생성
  const optimizedDescription = optimizeDescriptionForNaver(content, naverKeywords);
  
  // 해시태그 생성
  const hashtags = generateHashtags(title, content, tags);
  
  return {
    naverKeywords,
    trendingTopics,
    relatedSearches,
    naverSEOTips,
    optimizedTitle,
    optimizedDescription,
    hashtags
  };
}

/**
 * 네이버 키워드 추출
 */
function extractNaverKeywords(text: string): string[] {
  const words = text.match(/[\w가-힣]+/g) || [];
  const frequency = new Map<string, number>();
  
  words.forEach(word => {
    if (word.length > 1 && !isStopWord(word)) {
      frequency.set(word, (frequency.get(word) || 0) + 1);
    }
  });
  
  return Array.from(frequency.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([word]) => word);
}

/**
 * 트렌딩 주제 생성
 */
function generateTrendingTopics(title: string, content: string): string[] {
  const topics = [
    '최신 트렌드',
    '인기 키워드',
    '주목받는 주제',
    '화제의 이슈',
    '실시간 검색어'
  ];
  
  return topics.slice(0, 3);
}

/**
 * 연관 검색어 생성
 */
function generateRelatedSearches(title: string): string[] {
  const baseKeywords = title.split(' ').filter(word => word.length > 1);
  const relatedTerms = [
    '방법',
    '추천',
    '후기',
    '비교',
    '장단점',
    '가격',
    '순위',
    '정보',
    '팁',
    '가이드'
  ];
  
  return baseKeywords.slice(0, 3).flatMap(keyword => 
    relatedTerms.slice(0, 3).map(term => `${keyword} ${term}`)
  );
}

/**
 * 네이버 SEO 팁 생성
 */
function generateNaverSEOTips(title: string, content: string): string[] {
  return [
    '키워드를 제목 앞부분에 배치하세요',
    '콘텐츠 길이를 1000자 이상으로 유지하세요',
    '이미지에 alt 태그를 추가하세요',
    '내부 링크를 3개 이상 사용하세요',
    '관련 해시태그를 5-10개 사용하세요',
    '정기적인 콘텐츠 업데이트를 하세요',
    '독자 참여를 유도하는 질문을 포함하세요',
    '네이버 블로그 카테고리를 정확히 설정하세요'
  ];
}

/**
 * 네이버 블로그 최적화 제목 생성
 */
function optimizeTitleForNaver(title: string, primaryKeyword?: string): string {
  if (!primaryKeyword) return title;
  
  const templates = [
    `${primaryKeyword} 완벽 가이드 | ${title}`,
    `${title} - ${primaryKeyword} 전문가 추천`,
    `${primaryKeyword} 알아보기 | ${title}`,
    `${title} 📝 ${primaryKeyword} 정리`,
    `${primaryKeyword} 후기 | ${title}`
  ];
  
  return templates[Math.floor(Math.random() * templates.length)];
}

/**
 * 네이버 블로그 최적화 설명 생성
 */
function optimizeDescriptionForNaver(content: string, keywords: string[]): string {
  const text = content.replace(/<[^>]*>/g, '').substring(0, 200);
  const mainKeyword = keywords[0];
  
  if (mainKeyword) {
    return `${mainKeyword}에 대한 자세한 정보를 확인하세요. ${text}... 더 많은 정보는 본문에서 확인할 수 있습니다.`;
  }
  
  return `${text}... 자세한 내용은 본문을 참조하세요.`;
}

/**
 * 해시태그 생성
 */
function generateHashtags(title: string, content: string, existingTags: string[]): string[] {
  const text = `${title} ${content}`.replace(/<[^>]*>/g, '');
  const words = text.match(/[\w가-힣]+/g) || [];
  const frequency = new Map<string, number>();
  
  words.forEach(word => {
    if (word.length > 1 && !isStopWord(word)) {
      frequency.set(word, (frequency.get(word) || 0) + 1);
    }
  });
  
  const generatedTags = Array.from(frequency.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([word]) => `#${word}`);
  
  const existingHashtags = existingTags.map(tag => `#${tag}`);
  
  return [...new Set([...existingHashtags, ...generatedTags])].slice(0, 10);
}

/**
 * 불용어 체크
 */
function isStopWord(word: string): boolean {
  const stopWords = [
    '이', '그', '저', '것', '수', '때', '곳', '사람', '년', '개', '등',
    '들', '및', '또는', '그리고', '하지만', '그러나', '또한', '따라서',
    '그런데', '그래서', '즉', '다시', '또', '매우', '정말', '아주', '조금',
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'from', 'up', 'about', 'into', 'through', 'during'
  ];
  
  return stopWords.includes(word.toLowerCase());
}

/**
 * 메타 태그 생성
 */
export function generateMetaTags(
  title: string,
  description: string,
  keywords: string[],
  imageUrl?: string
): string {
  const metaTags = [
    `<title>${title}</title>`,
    `<meta name="description" content="${description}">`,
    `<meta name="keywords" content="${keywords.join(', ')}">`,
    `<meta property="og:title" content="${title}">`,
    `<meta property="og:description" content="${description}">`,
    `<meta property="og:type" content="article">`,
    `<meta name="twitter:card" content="summary_large_image">`,
    `<meta name="twitter:title" content="${title}">`,
    `<meta name="twitter:description" content="${description}">`,
  ];
  
  if (imageUrl) {
    metaTags.push(`<meta property="og:image" content="${imageUrl}">`);
    metaTags.push(`<meta name="twitter:image" content="${imageUrl}">`);
  }
  
  return metaTags.join('\n');
}

/**
 * 구조화된 데이터 생성 (JSON-LD)
 */
export function generateStructuredData(
  title: string,
  description: string,
  author: string,
  datePublished: string,
  imageUrl?: string
): string {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": title,
    "description": description,
    "author": {
      "@type": "Person",
      "name": author
    },
    "datePublished": datePublished,
    "dateModified": datePublished,
    "publisher": {
      "@type": "Organization",
      "name": "BlogCraft",
      "logo": {
        "@type": "ImageObject",
        "url": "https://blogcraft.com/logo.png"
      }
    },
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": "https://blogcraft.com/"
    }
  };
  
  if (imageUrl) {
    (structuredData as any).image = {
      "@type": "ImageObject",
      "url": imageUrl
    };
  }
  
  return `<script type="application/ld+json">${JSON.stringify(structuredData, null, 2)}</script>`;
} 