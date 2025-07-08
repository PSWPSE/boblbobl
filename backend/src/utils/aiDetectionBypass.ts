import * as natural from 'natural';
import nlp from 'compromise';

export interface AIDetectionBypassOptions {
  humanizationLevel: 'low' | 'medium' | 'high';
  writingStyle: 'formal' | 'casual' | 'conversational' | 'professional';
  targetLanguage: 'ko' | 'en';
  preserveKeywords: string[];
  addPersonalTouch: boolean;
  varyParagraphLength: boolean;
  insertNaturalTransitions: boolean;
}

export interface AIDetectionBypassResult {
  originalText: string;
  humanizedText: string;
  changes: {
    type: string;
    original: string;
    modified: string;
    reason: string;
  }[];
  humanizationScore: number;
  detectionRisk: 'low' | 'medium' | 'high';
  recommendations: string[];
}

/**
 * AI 탐지 우회 메인 함수
 */
export async function bypassAIDetection(
  text: string,
  options: AIDetectionBypassOptions
): Promise<AIDetectionBypassResult> {
  const changes: any[] = [];
  let humanizedText = text;
  
  // 1. 문장 구조 다양화
  humanizedText = await varyentenceStructure(humanizedText, options, changes);
  
  // 2. 어휘 다양화
  humanizedText = await diversifyVocabulary(humanizedText, options, changes);
  
  // 3. 문체 개선
  humanizedText = await improveWritingStyle(humanizedText, options, changes);
  
  // 4. 자연스러운 전환 추가
  if (options.insertNaturalTransitions) {
    humanizedText = await addNaturalTransitions(humanizedText, options, changes);
  }
  
  // 5. 개인적 터치 추가
  if (options.addPersonalTouch) {
    humanizedText = await addPersonalElements(humanizedText, options, changes);
  }
  
  // 6. 단락 길이 조정
  if (options.varyParagraphLength) {
    humanizedText = await varyParagraphLength(humanizedText, options, changes);
  }
  
  // 7. 한국어 특화 자연화
  if (options.targetLanguage === 'ko') {
    humanizedText = await koreanSpecificHumanization(humanizedText, options, changes);
  }
  
  // 8. 키워드 보존 확인
  humanizedText = await preserveKeywords(humanizedText, options.preserveKeywords, changes);
  
  // 9. 인간화 점수 계산
  const humanizationScore = calculateHumanizationScore(text, humanizedText, changes);
  
  // 10. 탐지 위험도 평가
  const detectionRisk = assessDetectionRisk(humanizedText, humanizationScore);
  
  // 11. 개선 제안 생성
  const recommendations = generateRecommendations(text, humanizedText, changes, detectionRisk);
  
  return {
    originalText: text,
    humanizedText,
    changes,
    humanizationScore,
    detectionRisk,
    recommendations
  };
}

/**
 * 문장 구조 다양화
 */
async function varyentenceStructure(
  text: string,
  options: AIDetectionBypassOptions,
  changes: any[]
): Promise<string> {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim());
  const processedSentences = [];
  
  for (let i = 0; i < sentences.length; i++) {
    let sentence = sentences[i].trim();
    const original = sentence;
    
    // 수동태 <-> 능동태 변환
    if (Math.random() < 0.3) {
      sentence = await convertVoice(sentence, options.targetLanguage);
    }
    
    // 문장 순서 조정
    if (Math.random() < 0.4) {
      sentence = await reorderSentenceComponents(sentence, options.targetLanguage);
    }
    
    // 복문 분리 또는 결합
    if (Math.random() < 0.3) {
      sentence = await adjustSentenceComplexity(sentence, options.targetLanguage);
    }
    
    if (sentence !== original) {
      changes.push({
        type: 'sentence_structure',
        original,
        modified: sentence,
        reason: '문장 구조 다양화로 자연스러움 향상'
      });
    }
    
    processedSentences.push(sentence);
  }
  
  return processedSentences.join('. ') + '.';
}

/**
 * 어휘 다양화
 */
async function diversifyVocabulary(
  text: string,
  options: AIDetectionBypassOptions,
  changes: any[]
): Promise<string> {
  let processedText = text;
  
  // 동의어 치환
  const synonymMap = getSynonymMap(options.targetLanguage);
  
  for (const [word, synonyms] of Object.entries(synonymMap)) {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    const matches = processedText.match(regex);
    
    if (matches && matches.length > 1) {
      // 같은 단어가 여러 번 사용된 경우 일부를 동의어로 교체
      let replacementCount = 0;
      processedText = processedText.replace(regex, (match) => {
        if (replacementCount < Math.floor(matches.length / 2) && Math.random() < 0.6) {
          replacementCount++;
          const synonym = synonyms[Math.floor(Math.random() * synonyms.length)];
          
          changes.push({
            type: 'vocabulary_diversification',
            original: match,
            modified: synonym,
            reason: '어휘 다양화로 반복 줄이기'
          });
          
          return synonym;
        }
        return match;
      });
    }
  }
  
  return processedText;
}

/**
 * 문체 개선
 */
async function improveWritingStyle(
  text: string,
  options: AIDetectionBypassOptions,
  changes: any[]
): Promise<string> {
  let processedText = text;
  
  switch (options.writingStyle) {
    case 'conversational':
      processedText = await makeConversational(processedText, options.targetLanguage, changes);
      break;
    case 'casual':
      processedText = await makeCasual(processedText, options.targetLanguage, changes);
      break;
    case 'formal':
      processedText = await makeFormal(processedText, options.targetLanguage, changes);
      break;
    case 'professional':
      processedText = await makeProfessional(processedText, options.targetLanguage, changes);
      break;
  }
  
  return processedText;
}

/**
 * 자연스러운 전환 추가
 */
async function addNaturalTransitions(
  text: string,
  options: AIDetectionBypassOptions,
  changes: any[]
): Promise<string> {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim());
  const transitions = getNaturalTransitions(options.targetLanguage);
  
  const processedSentences = [];
  
  for (let i = 0; i < sentences.length; i++) {
    let sentence = sentences[i].trim();
    
    // 문장 사이에 자연스러운 전환구 추가
    if (i > 0 && Math.random() < 0.3) {
      const transition = transitions[Math.floor(Math.random() * transitions.length)];
      sentence = `${transition} ${sentence}`;
      
      changes.push({
        type: 'natural_transition',
        original: sentences[i].trim(),
        modified: sentence,
        reason: '자연스러운 전환으로 흐름 개선'
      });
    }
    
    processedSentences.push(sentence);
  }
  
  return processedSentences.join('. ') + '.';
}

/**
 * 개인적 터치 추가
 */
async function addPersonalElements(
  text: string,
  options: AIDetectionBypassOptions,
  changes: any[]
): Promise<string> {
  const personalElements = getPersonalElements(options.targetLanguage);
  let processedText = text;
  
  // 개인적 의견이나 경험을 나타내는 표현 추가
  const sentences = text.split(/[.!?]+/).filter(s => s.trim());
  
  for (let i = 0; i < sentences.length; i++) {
    if (Math.random() < 0.2) {
      const element = personalElements[Math.floor(Math.random() * personalElements.length)];
      const modified = `${element} ${sentences[i].trim()}`;
      
      processedText = processedText.replace(sentences[i].trim(), modified);
      
      changes.push({
        type: 'personal_touch',
        original: sentences[i].trim(),
        modified,
        reason: '개인적 터치로 인간적 요소 추가'
      });
    }
  }
  
  return processedText;
}

/**
 * 단락 길이 조정
 */
async function varyParagraphLength(
  text: string,
  options: AIDetectionBypassOptions,
  changes: any[]
): Promise<string> {
  const paragraphs = text.split('\n\n');
  const processedParagraphs = [];
  
  for (const paragraph of paragraphs) {
    const sentences = paragraph.split(/[.!?]+/).filter(s => s.trim());
    
    if (sentences.length > 4) {
      // 긴 단락을 둘로 나누기
      const splitPoint = Math.floor(sentences.length / 2);
      const firstPart = sentences.slice(0, splitPoint).join('. ') + '.';
      const secondPart = sentences.slice(splitPoint).join('. ') + '.';
      
      processedParagraphs.push(firstPart);
      processedParagraphs.push(secondPart);
      
      changes.push({
        type: 'paragraph_split',
        original: paragraph,
        modified: `${firstPart}\n\n${secondPart}`,
        reason: '단락 길이 조정으로 가독성 향상'
      });
    } else if (sentences.length === 1 && Math.random() < 0.3) {
      // 짧은 단락을 다음 단락과 합치기 (다음 단락이 있을 경우)
      processedParagraphs.push(paragraph);
    } else {
      processedParagraphs.push(paragraph);
    }
  }
  
  return processedParagraphs.join('\n\n');
}

/**
 * 한국어 특화 자연화
 */
async function koreanSpecificHumanization(
  text: string,
  options: AIDetectionBypassOptions,
  changes: any[]
): Promise<string> {
  let processedText = text;
  
  // 한국어 특화 표현 변환
  const koreanExpressions = getKoreanExpressions();
  
  for (const [formal, casual] of Object.entries(koreanExpressions)) {
    if (options.writingStyle === 'casual' || options.writingStyle === 'conversational') {
      const regex = new RegExp(formal, 'g');
      if (processedText.match(regex)) {
        processedText = processedText.replace(regex, casual);
        changes.push({
          type: 'korean_expression',
          original: formal,
          modified: casual,
          reason: '한국어 특화 자연스러운 표현으로 변환'
        });
      }
    }
  }
  
  // 조사 및 어미 다양화
  processedText = await diversifyKoreanParticles(processedText, changes);
  
  return processedText;
}

/**
 * 키워드 보존
 */
async function preserveKeywords(
  text: string,
  keywords: string[],
  changes: any[]
): Promise<string> {
  let processedText = text;
  
  for (const keyword of keywords) {
    const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
    const matches = processedText.match(regex);
    
    if (!matches || matches.length === 0) {
      // 키워드가 사라진 경우 복원
      const sentences = processedText.split(/[.!?]+/);
      const targetSentence = sentences[Math.floor(Math.random() * sentences.length)];
      const modifiedSentence = `${targetSentence.trim()} ${keyword}`;
      
      processedText = processedText.replace(targetSentence, modifiedSentence);
      
      changes.push({
        type: 'keyword_preservation',
        original: targetSentence,
        modified: modifiedSentence,
        reason: `중요 키워드 '${keyword}' 보존`
      });
    }
  }
  
  return processedText;
}

/**
 * 인간화 점수 계산
 */
function calculateHumanizationScore(
  originalText: string,
  humanizedText: string,
  changes: any[]
): number {
  let score = 0;
  
  // 변화의 수와 종류에 따른 점수
  const changeTypes = new Set(changes.map(c => c.type));
  score += changeTypes.size * 10;
  
  // 텍스트 길이 차이 (적절한 확장)
  const lengthDiff = humanizedText.length - originalText.length;
  score += Math.min(lengthDiff / originalText.length * 50, 20);
  
  // 문장 구조 변화
  const structureChanges = changes.filter(c => c.type === 'sentence_structure').length;
  score += Math.min(structureChanges * 5, 20);
  
  // 어휘 다양성
  const vocabularyChanges = changes.filter(c => c.type === 'vocabulary_diversification').length;
  score += Math.min(vocabularyChanges * 3, 15);
  
  // 개인적 터치
  const personalChanges = changes.filter(c => c.type === 'personal_touch').length;
  score += Math.min(personalChanges * 8, 25);
  
  return Math.min(score, 100);
}

/**
 * 탐지 위험도 평가
 */
function assessDetectionRisk(text: string, humanizationScore: number): 'low' | 'medium' | 'high' {
  if (humanizationScore >= 80) return 'low';
  if (humanizationScore >= 60) return 'medium';
  return 'high';
}

/**
 * 개선 제안 생성
 */
function generateRecommendations(
  originalText: string,
  humanizedText: string,
  changes: any[],
  detectionRisk: 'low' | 'medium' | 'high'
): string[] {
  const recommendations = [];
  
  if (detectionRisk === 'high') {
    recommendations.push('더 많은 문장 구조 변화가 필요합니다');
    recommendations.push('개인적 의견이나 경험을 추가해보세요');
  }
  
  if (detectionRisk === 'medium') {
    recommendations.push('어휘를 더 다양화해보세요');
    recommendations.push('자연스러운 전환구를 추가해보세요');
  }
  
  if (changes.length < 5) {
    recommendations.push('더 많은 변화를 통해 자연스러움을 높여보세요');
  }
  
  const structureChanges = changes.filter(c => c.type === 'sentence_structure').length;
  if (structureChanges < 2) {
    recommendations.push('문장 구조를 더 다양화해보세요');
  }
  
  const personalChanges = changes.filter(c => c.type === 'personal_touch').length;
  if (personalChanges === 0) {
    recommendations.push('개인적 경험이나 의견을 추가해보세요');
  }
  
  return recommendations;
}

// 헬퍼 함수들
function getSynonymMap(language: 'ko' | 'en'): { [key: string]: string[] } {
  if (language === 'ko') {
    return {
      '중요한': ['핵심적인', '주요한', '필수적인', '중대한'],
      '방법': ['방식', '수단', '기법', '접근법'],
      '문제': ['이슈', '사안', '과제', '쟁점'],
      '해결': ['처리', '극복', '개선', '완화'],
      '효과': ['결과', '성과', '영향', '효능'],
      '사용': ['이용', '활용', '적용', '운용'],
      '개발': ['구축', '제작', '창조', '형성'],
      '관리': ['운영', '통제', '조절', '감독'],
      '분석': ['검토', '조사', '연구', '평가'],
      '시스템': ['체계', '구조', '기구', '체제']
    };
  } else {
    return {
      'important': ['crucial', 'essential', 'vital', 'significant'],
      'method': ['approach', 'technique', 'way', 'procedure'],
      'problem': ['issue', 'challenge', 'difficulty', 'concern'],
      'solution': ['answer', 'resolution', 'fix', 'remedy'],
      'effect': ['impact', 'result', 'outcome', 'consequence'],
      'use': ['utilize', 'employ', 'apply', 'implement'],
      'create': ['develop', 'build', 'generate', 'produce'],
      'manage': ['handle', 'control', 'oversee', 'supervise'],
      'analyze': ['examine', 'study', 'review', 'assess'],
      'system': ['framework', 'structure', 'mechanism', 'setup']
    };
  }
}

function getNaturalTransitions(language: 'ko' | 'en'): string[] {
  if (language === 'ko') {
    return [
      '그런데', '그러나', '하지만', '또한', '게다가', '더욱이',
      '예를 들어', '즉', '다시 말해', '특히', '실제로', '사실상',
      '그 결과', '따라서', '그래서', '이러한 이유로', '이처럼',
      '한편', '반면에', '이와 달리', '이에 비해', '그럼에도 불구하고'
    ];
  } else {
    return [
      'However', 'Moreover', 'Furthermore', 'Additionally', 'Nevertheless',
      'For instance', 'In fact', 'Actually', 'Specifically', 'Particularly',
      'As a result', 'Therefore', 'Consequently', 'Thus', 'Hence',
      'Meanwhile', 'On the other hand', 'In contrast', 'Conversely', 'Despite this'
    ];
  }
}

function getPersonalElements(language: 'ko' | 'en'): string[] {
  if (language === 'ko') {
    return [
      '개인적으로', '제 경험상', '저는 생각하기로는', '제가 보기에는',
      '경험해보니', '실제로 해보면', '제 의견으로는', '개인적 경험에 따르면',
      '솔직히 말하면', '제가 느끼기로는', '실제 사용해보니', '경험상',
      '제 생각에는', '개인적 견해로는', '실제로 겪어보니', '제 관점에서는'
    ];
  } else {
    return [
      'Personally', 'In my experience', 'I believe', 'From my perspective',
      'Having tried this', 'In practice', 'My opinion is', 'Based on my experience',
      'Honestly', 'I feel that', 'When I tried it', 'From experience',
      'I think', 'My view is', 'Having gone through this', 'From my standpoint'
    ];
  }
}

function getKoreanExpressions(): { [key: string]: string } {
  return {
    '합니다': '해요',
    '입니다': '이에요',
    '됩니다': '되죠',
    '있습니다': '있어요',
    '없습니다': '없어요',
    '좋습니다': '좋아요',
    '나쁩니다': '안 좋아요',
    '필요합니다': '필요해요',
    '가능합니다': '가능해요',
    '어렵습니다': '어려워요'
  };
}

// 추가 헬퍼 함수들 (구현 간소화)
async function convertVoice(sentence: string, language: 'ko' | 'en'): Promise<string> {
  // 간단한 수동태/능동태 변환 로직
  return sentence;
}

async function reorderSentenceComponents(sentence: string, language: 'ko' | 'en'): Promise<string> {
  // 문장 구성 요소 순서 변경 로직
  return sentence;
}

async function adjustSentenceComplexity(sentence: string, language: 'ko' | 'en'): Promise<string> {
  // 문장 복잡도 조정 로직
  return sentence;
}

async function makeConversational(text: string, language: 'ko' | 'en', changes: any[]): Promise<string> {
  // 대화체 변환 로직
  return text;
}

async function makeCasual(text: string, language: 'ko' | 'en', changes: any[]): Promise<string> {
  // 캐주얼 톤 변환 로직
  return text;
}

async function makeFormal(text: string, language: 'ko' | 'en', changes: any[]): Promise<string> {
  // 공식적 톤 변환 로직
  return text;
}

async function makeProfessional(text: string, language: 'ko' | 'en', changes: any[]): Promise<string> {
  // 전문적 톤 변환 로직
  return text;
}

async function diversifyKoreanParticles(text: string, changes: any[]): Promise<string> {
  // 한국어 조사 다양화 로직
  return text;
} 