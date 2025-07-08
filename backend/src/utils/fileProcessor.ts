import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';
import cheerio from 'cheerio';
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
 * 뉴스 기사 크롤링
 */
export async function extractTextFromURL(url: string): Promise<ProcessedFileResult> {
  try {
    // URL 유효성 검사
    const urlRegex = /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/;
    if (!urlRegex.test(url)) {
      throw new Error('유효하지 않은 URL입니다.');
    }

    // HTTP 요청으로 HTML 가져오기
    const response = await axios.get(url, {
      timeout: 10000, // 10초 타임아웃
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    const html = response.data;
    const $ = cheerio.load(html);

    // 불필요한 요소 제거
    $('script, style, nav, header, footer, aside, .ad, .advertisement, .popup').remove();

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
      '.news-content',
      '.post-content',
      '.content',
      '.entry-content',
      'main',
      '.main-content'
    ];

    for (const selector of contentSelectors) {
      const element = $(selector);
      if (element.length && element.text().trim().length > 100) {
        content = element.text().trim();
        break;
      }
    }

    // 적절한 본문을 찾지 못한 경우 body에서 추출
    if (!content) {
      content = $('body').text().trim();
    }

    // 텍스트 정리
    const extractedText = `제목: ${title}\n\n${content}`
      .replace(/\s+/g, ' ') // 여러 공백을 하나로
      .replace(/\n\s+/g, '\n') // 줄바꿈 후 공백 제거
      .trim();

    const wordCount = extractedText.split(/\s+/).filter(word => word.length > 0).length;

    return {
      extractedText,
      metadata: {
        originalName: title || url,
        url,
        title,
        wordCount,
        charCount: extractedText.length,
        language: 'ko',
        extractedAt: new Date().toISOString()
      }
    };
  } catch (error) {
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