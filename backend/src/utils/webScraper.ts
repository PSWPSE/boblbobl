import axios from 'axios';
import * as cheerio from 'cheerio';

export interface ScrapedContent {
  title: string;
  content: string;
  summary: string;
  url: string;
  publishedAt?: string;
  author?: string;
  imageUrl?: string;
  metadata: {
    wordCount: number;
    charCount: number;
    extractedAt: string;
    source: string;
  };
}

/**
 * 네이버 뉴스 스크래핑
 */
async function scrapeNaverNews(url: string): Promise<ScrapedContent> {
  console.log('📰 네이버 뉴스 스크래핑 시작:', url);
  
  const response = await axios.get(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    },
    timeout: 10000
  });
  
  const $ = cheerio.load(response.data);
  
  // 제목 추출
  const title = $('#title_area h2, #ct h3, .media_end_head_headline h2, .end_tit').first().text().trim() || 
                $('h1, h2').first().text().trim() ||
                $('title').text().replace(' : 네이버 뉴스', '').trim();
  
  // 본문 추출 (여러 선택자 시도)
  let content = '';
  const contentSelectors = [
    '#dic_area, #articleBodyContents, .go_trans, ._article_content',
    '.news_end .end_body_wrp, .news_end_body_wrp',
    '.article_body, .article_content',
    '#content, .content, .article-content'
  ];
  
  for (const selector of contentSelectors) {
    const contentElement = $(selector);
    if (contentElement.length && contentElement.text().trim()) {
      content = contentElement.text().trim();
      break;
    }
  }
  
  // 스크립트, 광고 등 제거
  content = content
    .replace(/\s+/g, ' ')
    .replace(/\n+/g, '\n')
    .replace(/네이버뉴스.*?구독/g, '')
    .replace(/기자\s*=.*?$/gm, '')
    .replace(/\[.*?\]/g, '')
    .replace(/\(.*?기자\)/g, '')
    .trim();
  
  // 발행일 추출
  const publishedAt = $('.media_end_head_info_datestamp, .author, .date, time').first().text().trim() ||
                     $('[data-publish-time]').attr('data-publish-time') ||
                     '';
  
  // 기자명 추출
  const author = $('.media_end_head_journalist, .reporter, .author_name').first().text().trim() ||
                 content.match(/(\w+)\s*기자/)?.[1] || '';
  
  // 이미지 추출
  const imageUrl = $('#img1, .end_photo img, .article img').first().attr('src') || '';
  
  // 요약 생성 (첫 2-3문장)
  const sentences = content.split(/[.!?]/).filter(s => s.trim().length > 10);
  const summary = sentences.slice(0, 3).join('. ').trim() + (sentences.length > 3 ? '.' : '');
  
  return {
    title,
    content,
    summary,
    url,
    publishedAt,
    author,
    imageUrl,
    metadata: {
      wordCount: content.split(/\s+/).length,
      charCount: content.length,
      extractedAt: new Date().toISOString(),
      source: 'naver_news'
    }
  };
}

/**
 * 일반 뉴스 사이트 스크래핑
 */
async function scrapeGenericNews(url: string): Promise<ScrapedContent> {
  console.log('🌐 일반 뉴스 사이트 스크래핑 시작:', url);
  
  const response = await axios.get(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    },
    timeout: 10000
  });
  
  const $ = cheerio.load(response.data);
  
  // 제목 추출 (다양한 선택자 시도)
  const title = $('h1').first().text().trim() ||
                $('h2').first().text().trim() ||
                $('.headline, .title, .article-title, .news-title').first().text().trim() ||
                $('title').text().trim();
  
  // 본문 추출
  let content = '';
  const contentSelectors = [
    'article, .article, .article-content, .news-content',
    '.content, .post-content, .entry-content',
    '.article-body, .news-body, .post-body',
    'main, .main-content, #main-content',
    '.text, .article-text, .news-text'
  ];
  
  for (const selector of contentSelectors) {
    const contentElement = $(selector);
    if (contentElement.length) {
      // 불필요한 요소 제거
      contentElement.find('script, style, nav, header, footer, .ad, .advertisement, .social, .share').remove();
      
      const textContent = contentElement.text().trim();
      if (textContent.length > content.length) {
        content = textContent;
      }
    }
  }
  
  // 텍스트 정리
  content = content
    .replace(/\s+/g, ' ')
    .replace(/\n+/g, '\n')
    .trim();
  
  // 발행일 추출
  const publishedAt = $('time, .date, .published, [datetime]').first().text().trim() ||
                     $('[datetime]').attr('datetime') || '';
  
  // 기자명/작성자 추출
  const author = $('.author, .byline, .writer').first().text().trim() ||
                 $('[rel="author"]').text().trim() || '';
  
  // 이미지 추출
  const imageUrl = $('article img, .article img, .content img').first().attr('src') || '';
  
  // 요약 생성
  const sentences = content.split(/[.!?]/).filter(s => s.trim().length > 10);
  const summary = sentences.slice(0, 3).join('. ').trim() + (sentences.length > 3 ? '.' : '');
  
  return {
    title,
    content,
    summary,
    url,
    publishedAt,
    author,
    imageUrl,
    metadata: {
      wordCount: content.split(/\s+/).length,
      charCount: content.length,
      extractedAt: new Date().toISOString(),
      source: 'generic'
    }
  };
}

/**
 * URL에서 뉴스 콘텐츠 자동 추출
 */
export async function extractContentFromUrl(url: string): Promise<ScrapedContent> {
  console.log('🔗 URL 콘텐츠 추출 시작:', url);
  
  try {
    // URL 검증
    const urlObj = new URL(url);
    console.log('✅ URL 유효성 검증 완료:', urlObj.hostname);
    
    // 네이버 뉴스인지 확인
    if (urlObj.hostname.includes('news.naver.com') || urlObj.hostname.includes('n.news.naver.com')) {
      return await scrapeNaverNews(url);
    }
    
    // 주요 언론사별 처리
    if (urlObj.hostname.includes('chosun.com') || 
        urlObj.hostname.includes('joongang.co.kr') ||
        urlObj.hostname.includes('dong-a.com') ||
        urlObj.hostname.includes('hani.co.kr') ||
        urlObj.hostname.includes('khan.co.kr') ||
        urlObj.hostname.includes('ytn.co.kr')) {
      return await scrapeGenericNews(url);
    }
    
    // 기타 사이트는 일반 스크래핑
    return await scrapeGenericNews(url);
    
  } catch (error) {
    console.error('❌ URL 콘텐츠 추출 실패:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('timeout')) {
        throw new Error('웹페이지 응답 시간이 초과되었습니다. 다른 URL을 시도해보세요.');
      } else if (error.message.includes('Network Error') || error.message.includes('ENOTFOUND')) {
        throw new Error('웹페이지에 접근할 수 없습니다. URL을 확인해주세요.');
      } else if (error.message.includes('Invalid URL')) {
        throw new Error('올바른 URL 형식이 아닙니다.');
      }
    }
    
    throw new Error('웹페이지에서 콘텐츠를 추출할 수 없습니다.');
  }
}

/**
 * 추출된 콘텐츠 품질 검증
 */
export function validateExtractedContent(content: ScrapedContent): boolean {
  // 최소 조건 확인
  if (!content.title || content.title.length < 5) {
    console.warn('⚠️ 제목이 너무 짧거나 없음');
    return false;
  }
  
  if (!content.content || content.content.length < 100) {
    console.warn('⚠️ 본문이 너무 짧거나 없음');
    return false;
  }
  
  // 의미 있는 콘텐츠인지 확인
  const meaningfulWords = content.content.split(/\s+/).filter(word => 
    word.length > 2 && 
    !['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'].includes(word.toLowerCase())
  ).length;
  
  if (meaningfulWords < 20) {
    console.warn('⚠️ 의미 있는 단어가 부족함');
    return false;
  }
  
  return true;
}

/**
 * 테스트용 함수
 */
export async function testUrlExtraction(): Promise<void> {
  const testUrls = [
    'https://news.naver.com/main/read.naver?mode=LSD&mid=sec&sid1=001&oid=001&aid=0014950858',
    'https://www.chosun.com/national/2024/01/01/test/',
    'https://www.joongang.co.kr/article/test'
  ];
  
  for (const url of testUrls) {
    try {
      console.log(`\n🧪 테스트 URL: ${url}`);
      const result = await extractContentFromUrl(url);
      console.log(`✅ 성공:`, {
        title: result.title.substring(0, 50) + '...',
        contentLength: result.content.length,
        source: result.metadata.source
      });
    } catch (error) {
      console.log(`❌ 실패: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
} 