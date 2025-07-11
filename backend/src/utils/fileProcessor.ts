import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';
import * as cheerio from 'cheerio';
import axios from 'axios';

export interface ProcessedFileResult {
  extractedText: string;
  metadata: {
    originalName?: string;
    fileSize?: number;
    pageCount?: number;
    wordCount?: number;
    charCount?: number;
    language?: string;
    [key: string]: any;
  };
}

/**
 * PDF 파일 텍스트 추출
 */
export async function extractTextFromPDF(buffer: Buffer, originalName?: string): Promise<ProcessedFileResult> {
  try {
    const data = await pdfParse(buffer);
    
    const extractedText = data.text;
    const wordCount = extractedText.split(/\s+/).filter(word => word.length > 0).length;
    
    return {
      extractedText,
      metadata: {
        originalName,
        fileSize: buffer.length,
        pageCount: data.numpages,
        wordCount,
        charCount: extractedText.length,
        language: 'ko', // 기본값, 실제로는 언어 감지 라이브러리 사용 가능
      }
    };
  } catch (error) {
    throw new Error(`PDF 파일 처리 중 오류가 발생했습니다: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Word 문서 텍스트 추출
 */
export async function extractTextFromWord(buffer: Buffer, originalName?: string): Promise<ProcessedFileResult> {
  try {
    const result = await mammoth.extractRawText({ buffer });
    
    const extractedText = result.value;
    const wordCount = extractedText.split(/\s+/).filter(word => word.length > 0).length;
    
    return {
      extractedText,
      metadata: {
        originalName,
        fileSize: buffer.length,
        wordCount,
        charCount: extractedText.length,
        language: 'ko',
        warnings: result.messages // mammoth에서 제공하는 경고 메시지
      }
    };
  } catch (error) {
    throw new Error(`Word 문서 처리 중 오류가 발생했습니다: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * 텍스트 파일 처리
 */
export async function extractTextFromPlainText(buffer: Buffer, originalName?: string): Promise<ProcessedFileResult> {
  try {
    const extractedText = buffer.toString('utf-8');
    const wordCount = extractedText.split(/\s+/).filter(word => word.length > 0).length;
    
    return {
      extractedText,
      metadata: {
        originalName,
        fileSize: buffer.length,
        wordCount,
        charCount: extractedText.length,
        language: 'ko',
        encoding: 'utf-8'
      }
    };
  } catch (error) {
    throw new Error(`텍스트 파일 처리 중 오류가 발생했습니다: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * 핀포인트뉴스 전용 추출기 (개선된 버전)
 */
function extractFromPinpointNews($: cheerio.CheerioAPI): { title: string; content: string } {
  console.log('🔍 핀포인트뉴스 HTML 구조 분석 중...');
  
  // 제목 추출
  let title = '';
  
  // 여러 제목 선택자 시도
  const titleSelectors = [
    'h3', 'h2', 'h1', 
    '.article-title', '.news-title', '.view-title',
    '.title', '.headline'
  ];
  
  for (const selector of titleSelectors) {
    const titleElement = $(selector).first();
    if (titleElement.length && titleElement.text().trim().length > 10) {
      title = titleElement.text().trim();
      console.log(`📰 제목 발견 (${selector}): ${title.substring(0, 50)}...`);
      break;
    }
  }
  
  // 제목이 없으면 페이지 타이틀에서 추출
  if (!title) {
    title = $('title').text().replace(/\s*-\s*핀포인트뉴스.*/, '').trim();
    console.log(`📰 페이지 타이틀에서 제목 추출: ${title.substring(0, 50)}...`);
  }
  
  // 본문 추출
  let content = '';
  
  console.log('📄 본문 영역 탐색 중...');
  
  // 핀포인트뉴스 특화 본문 선택자들
  const contentSelectors = [
    // 일반적인 기사 본문 선택자들
    '.article-content',
    '.news-content', 
    '.view-content',
    '.content-body',
    '.article-body',
    '.news-body',
    '.view-body',
    '.post-content',
    '.entry-content',
    '.story-content',
    '.text-content',
    // ID 기반 선택자들
    '#article-content',
    '#news-content',
    '#view-content',
    '#content-body',
    // 더 구체적인 선택자들
    '.article .content',
    '.news .content',
    '.view .content',
    'article .content',
    'main .content',
    '.main-content .content',
    // 핀포인트뉴스 특화 선택자들 (추정)
    '.view_con',
    '.article_view',
    '.content_view',
    '.news_view',
    '.article-text',
    '.news-text'
  ];
  
  // 각 선택자로 본문 추출 시도
  for (const selector of contentSelectors) {
    const contentElement = $(selector);
    if (contentElement.length > 0) {
      // 불필요한 요소들 제거
      contentElement.find(`
        script, style, nav, header, footer, aside,
        .ad, .advertisement, .banner, .popup, .modal,
        .share, .sns, .social, .related, .comment,
        .sidebar, .navigation, .menu, .breadcrumb,
        .pagination, .tags, .category, .meta,
        .author, .date, .time, .source
      `).remove();
      
      const textContent = contentElement.text().trim();
      if (textContent.length > 100) {
        content = textContent;
        console.log(`📝 본문 발견 (${selector}): ${textContent.length}자`);
        break;
      }
    }
  }
  
  // 본문을 찾지 못한 경우 더 광범위한 추출
  if (!content || content.length < 200) {
    console.log('📄 광범위한 본문 추출 시도...');
    
    // 모든 단락 요소에서 텍스트 추출
    const paragraphs: string[] = [];
    $('p').each((i, elem) => {
      const text = $(elem).text().trim();
      if (text.length > 20 && !text.includes('기사제보') && !text.includes('광고문의')) {
        paragraphs.push(text);
      }
    });
    
    if (paragraphs.length > 0) {
      content = paragraphs.join('\n\n');
      console.log(`📝 단락 기반 본문 추출: ${paragraphs.length}개 단락, ${content.length}자`);
    }
  }
  
  // 여전히 본문이 부족한 경우 div 요소에서 추출
  if (!content || content.length < 200) {
    console.log('📄 div 요소에서 본문 추출 시도...');
    
    const divContents: string[] = [];
    $('div').each((i, elem) => {
      const text = $(elem).text().trim();
      // 의미있는 텍스트만 추출 (길이 조건 및 키워드 필터링)
      if (text.length > 50 && text.length < 2000 && 
          !text.includes('핀포인트뉴스') && 
          !text.includes('전체메뉴') && 
          !text.includes('기사검색') &&
          !text.includes('로그인') &&
          !text.includes('회원가입')) {
        divContents.push(text);
      }
    });
    
    if (divContents.length > 0) {
      // 가장 긴 텍스트 선택
      content = divContents.reduce((longest, current) => 
        current.length > longest.length ? current : longest
      );
      console.log(`📝 div 기반 본문 추출: ${content.length}자`);
    }
  }
  
  // 마지막 수단: body 전체에서 추출
  if (!content || content.length < 100) {
    console.log('📄 body 전체에서 본문 추출...');
    
    // 불필요한 요소들 제거
    $(`
      script, style, nav, header, footer, aside,
      .navigation, .menu, .sidebar, .ad, .advertisement,
      .share, .sns, .related, .comment, .popup, .modal,
      .breadcrumb, .pagination, .tags, .category,
      .login, .register, .search, .sitemap
    `).remove();
    
    content = $('body').text().trim();
    console.log(`📝 body 전체에서 본문 추출: ${content.length}자`);
  }
  
  console.log(`✅ 최종 추출 결과 - 제목: ${title.length}자, 본문: ${content.length}자`);
  
  return { title, content };
}

/**
 * 일반 뉴스 사이트 추출기
 */
function extractFromGenericNews($: cheerio.CheerioAPI): { title: string; content: string } {
  // 제목 추출
  let title = $('h1').first().text().trim();
  if (!title) {
    title = $('title').text().trim();
  }
  
  // 본문 추출 시도 (다양한 선택자 사용)
  let content = '';
  const contentSelectors = [
    'article',
    '.article-content',
    '.article-body',
    '.news-content',
    '.news-body',
    '.post-content',
    '.post-body',
    '.content',
    '.entry-content',
    '.story-body',
    '.article-text',
    'main',
    '.main-content'
  ];

  for (const selector of contentSelectors) {
    const element = $(selector);
    if (element.length && element.text().trim().length > 100) {
      // 불필요한 요소들 제거
      element.find('script, style, .ad, .advertisement, .share, .sns, .related, .comment').remove();
      content = element.text().trim();
      break;
    }
  }

  // 적절한 본문을 찾지 못한 경우 body에서 추출
  if (!content || content.length < 100) {
    // 불필요한 요소들 제거
    $('script, style, nav, header, footer, aside, .navigation, .menu, .sidebar, .ad, .advertisement, .popup').remove();
    content = $('body').text().trim();
  }
  
  return { title, content };
}

/**
 * 뉴스 기사 크롤링 (개선된 버전)
 */
export async function extractTextFromURL(url: string): Promise<ProcessedFileResult> {
  try {
    // URL 유효성 검사
    const urlRegex = /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/;
    if (!urlRegex.test(url)) {
      throw new Error('유효하지 않은 URL입니다.');
    }

    console.log(`📡 URL 추출 시작: ${url}`);

    // HTTP 요청으로 HTML 가져오기
    const response = await axios.get(url, {
      timeout: 15000, // 15초 타임아웃
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8',
        'Accept-Encoding': 'gzip, deflate',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1'
      }
    });

    const html = response.data;
    const $ = cheerio.load(html);
    
    console.log(`📄 HTML 로드 완료, 길이: ${html.length}`);

    let title = '';
    let content = '';

    // 사이트별 맞춤형 추출
    if (url.includes('pinpointnews.co.kr')) {
      const result = extractFromPinpointNews($);
      title = result.title;
      content = result.content;
      console.log(`📰 핀포인트뉴스 전용 추출기 사용`);
    } else {
      const result = extractFromGenericNews($);
      title = result.title;
      content = result.content;
      console.log(`📰 일반 뉴스 추출기 사용`);
    }

    // 텍스트 정리 및 포맷팅
    const cleanText = (text: string) => {
      return text
        .replace(/\s+/g, ' ')           // 여러 공백을 하나로
        .replace(/\n\s+/g, '\n')       // 줄바꿈 후 공백 제거
        .replace(/\n{3,}/g, '\n\n')    // 3개 이상의 줄바꿈을 2개로
        .replace(/^\s+|\s+$/g, '')     // 앞뒤 공백 제거
        .trim();
    };

    title = cleanText(title);
    content = cleanText(content);

    // 최종 추출된 텍스트 구성
    const extractedText = title ? `제목: ${title}\n\n${content}` : content;
    
    const wordCount = extractedText.split(/\s+/).filter(word => word.length > 0).length;
    
    console.log(`✅ 추출 완료 - 제목: ${title.substring(0, 50)}..., 본문 길이: ${content.length}`);

    return {
      extractedText,
      metadata: {
        originalName: title || url,
        url,
        title,
        wordCount,
        charCount: extractedText.length,
        language: 'ko',
        extractedAt: new Date().toISOString(),
        contentLength: content.length
      }
    };
  } catch (error) {
    console.error(`❌ URL 추출 오류: ${error instanceof Error ? error.message : 'Unknown error'}`);
    throw new Error(`URL 처리 중 오류가 발생했습니다: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * 파일 타입에 따른 텍스트 추출
 */
export async function processFile(
  buffer: Buffer, 
  mimetype: string, 
  originalName?: string
): Promise<ProcessedFileResult> {
  const fileExtension = originalName?.split('.').pop()?.toLowerCase();
  
  switch (true) {
    case mimetype === 'application/pdf' || fileExtension === 'pdf':
      return extractTextFromPDF(buffer, originalName);
      
    case mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || fileExtension === 'docx':
    case mimetype === 'application/msword' || fileExtension === 'doc':
      return extractTextFromWord(buffer, originalName);
      
    case mimetype === 'text/plain' || fileExtension === 'txt':
      return extractTextFromPlainText(buffer, originalName);
      
    default:
      throw new Error('지원하지 않는 파일 형식입니다. PDF, DOC, DOCX, TXT 파일만 지원합니다.');
  }
}

/**
 * 텍스트 품질 검증
 */
export function validateExtractedText(text: string): {
  isValid: boolean;
  issues: string[];
} {
  const issues: string[] = [];
  
  // 최소 길이 검증
  if (text.length < 50) {
    issues.push('추출된 텍스트가 너무 짧습니다 (최소 50자 필요)');
  }
  
  // 최대 길이 검증
  if (text.length > 50000) {
    issues.push('추출된 텍스트가 너무 깁니다 (최대 50,000자)');
  }
  
  // 의미있는 내용 검증
  const wordCount = text.split(/\s+/).filter(word => word.length > 0).length;
  if (wordCount < 10) {
    issues.push('추출된 텍스트에 충분한 단어가 없습니다');
  }
  
  // 특수문자 비율 검증
  const specialCharCount = (text.match(/[^가-힣a-zA-Z0-9\s]/g) || []).length;
  const specialCharRatio = specialCharCount / text.length;
  if (specialCharRatio > 0.3) {
    issues.push('특수문자 비율이 너무 높습니다');
  }
  
  return {
    isValid: issues.length === 0,
    issues
  };
} 