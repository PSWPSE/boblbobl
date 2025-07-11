'use client';

import React, { useEffect, useState, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { ArrowLeft, ArrowRight, BookOpen, Brain, CheckCircle, Clock, Copy, Download, FileText, Link as LinkIcon, MessageSquare, RefreshCw, Settings, Sparkles, Stars, Target, Wand2, Zap, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { apiPost } from '@/lib/api';
import { showError, showSuccess } from '@/lib/notifications';
import Link from 'next/link';

interface GeneratedContent {
  title: string;
  content: string;
  summary: string;
  tags: string[];
  metadata: {
    wordCount: number;
    charCount: number;
    readingTime: number;
  };
}

function GeneratePageContent() {
  const searchParams = useSearchParams();
  const [step, setStep] = useState(1);
  const [generationType, setGenerationType] = useState<string>('topic');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null);

  // 입력 데이터
  const [topicInput, setTopicInput] = useState('');
  const [newsText, setNewsText] = useState('');
  const [newsUrl, setNewsUrl] = useState('');
  const [style, setStyle] = useState('친근한');
  const [length, setLength] = useState('중간');

  // 부분 편집 관련 상태
  const [editingPart, setEditingPart] = useState<string | null>(null);
  const [editInstruction, setEditInstruction] = useState('');
  const [editStyle, setEditStyle] = useState('친근한');
  const [partRegenerating, setPartRegenerating] = useState(false);

  // 품질 분석 관련 상태
  const [contentAnalysis, setContentAnalysis] = useState<{
    score: number;
    analysis: {
      wordCount: number;
      sentences: number;
      paragraphs: number;
      readingTime: number;
    };
    suggestions: {
      title: string;
      description: string;
      action: string;
      priority: 'high' | 'medium' | 'low';
    }[];
  } | null>(null);


  useEffect(() => {
    const type = searchParams.get('type');
    if (type && ['topic', 'news', 'url'].includes(type)) {
      setGenerationType(type);
    }
  }, [searchParams]);

  const handleGenerate = useCallback(async () => {
    setLoading(true);
    setProgress(0);

    try {
      // 입력 검증
      let inputData = '';
      if (generationType === 'topic') {
        if (!topicInput.trim()) {
          showError('주제를 입력해주세요.');
          return;
        }
        inputData = topicInput;
      } else if (generationType === 'news') {
        if (!newsText.trim()) {
          showError('뉴스 기사 텍스트를 입력해주세요.');
          return;
        }
        inputData = newsText;
      } else if (generationType === 'url') {
        if (!newsUrl.trim()) {
          showError('뉴스 URL을 입력해주세요.');
          return;
        }
        inputData = newsUrl;
      }

      // 진행률 업데이트
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const response = await apiPost('/api/content/generate/simple', {
        type: generationType,
        input: inputData,
        style,
        length
      });

      clearInterval(progressInterval);
      setProgress(100);

      if (response.success) {
        setGeneratedContent(response.data);
        setStep(3);
        showSuccess('콘텐츠 생성이 완료되었습니다!');
      } else {
        throw new Error(response.error || '콘텐츠 생성에 실패했습니다.');
      }
    } catch (error) {
      console.error('Generation error:', error);
      showError(error instanceof Error ? error.message : '콘텐츠 생성 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }, [generationType, topicInput, newsText, newsUrl, style, length]);

  const handleCopy = useCallback((text: string) => {
    navigator.clipboard.writeText(text);
    showSuccess('클립보드에 복사되었습니다!');
  }, []);

  const handleDownload = useCallback(() => {
    if (!generatedContent) return;

    const content = `# ${generatedContent.title}

## 요약
${generatedContent.summary}

## 본문
${generatedContent.content}

## 태그
${generatedContent.tags.map(tag => `#${tag}`).join(' ')}

---
생성일: ${new Date().toLocaleDateString()}
단어 수: ${generatedContent.metadata.wordCount}개
예상 읽기 시간: ${generatedContent.metadata.readingTime}분
`;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${generatedContent.title}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showSuccess('파일이 다운로드되었습니다!');
  }, [generatedContent]);

  const resetGeneration = useCallback(() => {
    setStep(1);
    setGeneratedContent(null);
    setTopicInput('');
    setNewsText('');
    setNewsUrl('');
    setProgress(0);
  }, []);

  const getTypeInfo = (type: string) => {
    switch (type) {
      case 'topic':
        return {
          icon: MessageSquare,
          title: '주제 입력으로 생성',
          description: '관심 주제만 입력하면 AI가 자동으로 블로그 글을 작성합니다',
          color: 'from-green-500 to-emerald-600'
        };
      case 'news':
        return {
          icon: FileText,
          title: '뉴스 기사로 변환',
          description: '뉴스 텍스트를 자연스러운 블로그 글로 재구성합니다',
          color: 'from-blue-500 to-cyan-600'
        };
      case 'url':
        return {
          icon: LinkIcon,
          title: '뉴스 링크로 자동 생성',
          description: '뉴스 링크를 입력하면 자동으로 콘텐츠를 추출하고 생성합니다',
          color: 'from-purple-500 to-pink-600'
        };
      default:
        return {
          icon: MessageSquare,
          title: '콘텐츠 생성',
          description: '',
          color: 'from-gray-500 to-gray-600'
        };
    }
  };

  const typeInfo = getTypeInfo(generationType);

  const handlePartRegenerate = useCallback((part: string) => {
    setEditingPart(part);
    setEditInstruction('');
    setEditStyle('친근한'); // 기본 스타일로 초기화
    setPartRegenerating(false);
  }, []);

  const handlePartRegenerateSubmit = useCallback(async () => {
    if (!generatedContent || !editingPart) return;

    setPartRegenerating(true);
    setProgress(0); // 진행률 초기화

    try {
      const response = await apiPost('/api/content/generate/simple', {
        type: generationType,
        input: generatedContent[editingPart as keyof GeneratedContent], // 현재 편집 중인 부분의 내용
        style: editStyle, // 수정 스타일
        length: length, // 길이는 기존 설정 유지
        editInstruction: editInstruction, // 수정 요청사항
        originalContent: generatedContent // 원본 콘텐츠
      });

      if (response.success) {
        setGeneratedContent(response.data);
        setStep(3); // 생성 완료 단계로 이동
        showSuccess(`"${editingPart}" 부분이 수정되었습니다!`);
        setEditingPart(null); // 편집 모드 종료
      } else {
        throw new Error(response.error || '부분 생성에 실패했습니다.');
      }
    } catch (error) {
      console.error('Part generation error:', error);
      showError(error instanceof Error ? error.message : '부분 생성 중 오류가 발생했습니다.');
    } finally {
      setPartRegenerating(false);
    }
  }, [generationType, generatedContent, editingPart, editStyle, length, editInstruction]);

  const handleContentAnalysis = useCallback(async () => {
    if (!generatedContent) return;

    setLoading(true); // 진행률 업데이트를 위해 로딩 상태 사용
    setProgress(0);

    try {
      const response = await apiPost('/api/content/analyze', {
        content: generatedContent.content
      });

      if (response.success) {
        setContentAnalysis(response.data);
        showSuccess('콘텐츠 품질 분석이 완료되었습니다!');
      } else {
        throw new Error(response.error || '콘텐츠 품질 분석에 실패했습니다.');
      }
    } catch (error) {
      console.error('Content analysis error:', error);
      showError(error instanceof Error ? error.message : '콘텐츠 품질 분석 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }, [generatedContent]);


  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Link href="/">
              <Button variant="outline" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                홈으로
              </Button>
            </Link>
            <div className="flex items-center space-x-3">
              <div className={`w-12 h-12 bg-gradient-to-r ${typeInfo.color} rounded-full flex items-center justify-center`}>
                <typeInfo.icon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{typeInfo.title}</h1>
                <p className="text-gray-600">{typeInfo.description}</p>
              </div>
            </div>
          </div>
          
          {/* Progress Steps */}
          <div className="flex items-center space-x-2">
            {[1, 2, 3].map((stepNumber) => (
              <div key={stepNumber} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step >= stepNumber 
                    ? `bg-gradient-to-r ${typeInfo.color} text-white` 
                    : 'bg-gray-200 text-gray-500'
                }`}>
                  {stepNumber}
                </div>
                {stepNumber < 3 && (
                  <div className={`w-8 h-0.5 mx-2 ${
                    step > stepNumber ? `bg-gradient-to-r ${typeInfo.color}` : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="max-w-4xl mx-auto">
          {step === 1 && (
            <Card className="border-0 shadow-lg">
              <CardHeader className="text-center">
                <CardTitle className="text-xl">
                  {generationType === 'topic' && '1단계: 주제 입력'}
                  {generationType === 'news' && '1단계: 뉴스 기사 입력'}
                  {generationType === 'url' && '1단계: 뉴스 URL 입력'}
                </CardTitle>
                <CardDescription>
                  {generationType === 'topic' && '어떤 주제로 블로그 글을 작성하고 싶으신가요?'}
                  {generationType === 'news' && '변환하고 싶은 뉴스 기사 텍스트를 입력해주세요'}
                  {generationType === 'url' && '콘텐츠를 생성할 뉴스 기사의 URL을 입력해주세요'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {generationType === 'topic' && (
                  <div className="space-y-2">
                    <Label htmlFor="topic">주제</Label>
                    <Input
                      id="topic"
                      placeholder="예: 서울 맛집 추천, 겨울 여행지, 취미 생활 등"
                      value={topicInput}
                      onChange={(e) => setTopicInput(e.target.value)}
                      className="text-lg p-4"
                    />
                    <p className="text-sm text-gray-500">
                      구체적인 주제일수록 더 좋은 결과를 얻을 수 있어요
                    </p>
                  </div>
                )}

                {generationType === 'news' && (
                  <div className="space-y-2">
                    <Label htmlFor="newsText">뉴스 기사 텍스트</Label>
                    <Textarea
                      id="newsText"
                      placeholder="뉴스 기사의 전체 텍스트를 여기에 붙여넣어 주세요..."
                      value={newsText}
                      onChange={(e) => setNewsText(e.target.value)}
                      className="min-h-[200px] text-base"
                    />
                    <p className="text-sm text-gray-500">
                      기사 전체를 복사해서 붙여넣으면 더 정확한 변환이 가능해요
                    </p>
                  </div>
                )}

                {generationType === 'url' && (
                  <div className="space-y-2">
                    <Label htmlFor="newsUrl">뉴스 기사 URL</Label>
                    <Input
                      id="newsUrl"
                      placeholder="https://news.naver.com/article/..."
                      value={newsUrl}
                      onChange={(e) => setNewsUrl(e.target.value)}
                      className="text-lg p-4"
                    />
                    <p className="text-sm text-gray-500">
                      네이버 뉴스, 조선일보, 중앙일보 등 주요 언론사 링크를 지원해요
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>글 스타일</Label>
                    <Select value={style} onValueChange={setStyle}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="친근한">친근하고 캐주얼한</SelectItem>
                        <SelectItem value="전문적인">전문적이고 신뢰할 수 있는</SelectItem>
                        <SelectItem value="유머러스한">재미있고 유머러스한</SelectItem>
                        <SelectItem value="감성적인">감성적이고 따뜻한</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>글 길이</Label>
                    <Select value={length} onValueChange={setLength}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="짧은">짧은 글 (300-500자)</SelectItem>
                        <SelectItem value="중간">중간 글 (500-1000자)</SelectItem>
                        <SelectItem value="긴">긴 글 (1000-2000자)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex justify-center pt-4">
                  <Button 
                    onClick={() => setStep(2)} 
                    size="lg"
                    className={`bg-gradient-to-r ${typeInfo.color} text-lg px-8 py-3`}
                    disabled={
                      (generationType === 'topic' && !topicInput.trim()) ||
                      (generationType === 'news' && !newsText.trim()) ||
                      (generationType === 'url' && !newsUrl.trim())
                    }
                  >
                    다음 단계
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {step === 2 && (
            <Card className="border-0 shadow-lg">
              <CardHeader className="text-center">
                <CardTitle className="text-xl">2단계: 콘텐츠 생성</CardTitle>
                <CardDescription>AI가 고품질 블로그 콘텐츠를 생성하고 있습니다</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {!loading ? (
                  <div className="text-center space-y-6">
                    <div className={`w-24 h-24 mx-auto bg-gradient-to-r ${typeInfo.color} rounded-full flex items-center justify-center`}>
                      <Wand2 className="h-12 w-12 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold mb-2">준비 완료!</h3>
                      <p className="text-gray-600 mb-6">
                        {generationType === 'topic' && `"${topicInput}" 주제로 블로그 글을 생성합니다`}
                        {generationType === 'news' && '뉴스 기사를 블로그 글로 변환합니다'}
                        {generationType === 'url' && 'URL에서 콘텐츠를 추출하여 블로그 글을 생성합니다'}
                      </p>
                      <div className="space-y-2 text-sm text-gray-500">
                        <p>• 스타일: {style}</p>
                        <p>• 길이: {length}</p>
                        <p>• 예상 소요 시간: 30-60초</p>
                      </div>
                    </div>
                    <Button 
                      onClick={handleGenerate}
                      size="lg"
                      className={`bg-gradient-to-r ${typeInfo.color} text-lg px-8 py-3`}
                    >
                      <Sparkles className="w-5 h-5 mr-2" />
                      AI 콘텐츠 생성 시작
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="text-center">
                      <div className={`w-16 h-16 mx-auto mb-4 bg-gradient-to-r ${typeInfo.color} rounded-full flex items-center justify-center animate-pulse`}>
                        <Brain className="h-8 w-8 text-white" />
                      </div>
                      <h3 className="text-lg font-semibold mb-2">AI 콘텐츠 생성 중...</h3>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">진행률</span>
                        <span className="text-sm text-gray-500">{Math.round(progress)}%</span>
                      </div>
                      <Progress value={progress} className="w-full" />
                      <div className="text-center text-sm text-gray-500">
                        {progress < 30 && '📊 입력 데이터 분석 중...'}
                        {progress >= 30 && progress < 60 && '🧠 AI 콘텐츠 구조화 중...'}
                        {progress >= 60 && progress < 90 && '✍️ 블로그 글 작성 중...'}
                        {progress >= 90 && '🎨 최종 검토 및 완성 중...'}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {step === 3 && generatedContent && (
            <Card className="border-0 shadow-lg">
              <CardHeader className="text-center">
                <CardTitle className="text-xl flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-500 mr-2" />
                  3단계: 생성 완료
                </CardTitle>
                <CardDescription>AI가 생성한 블로그 콘텐츠를 확인하고 활용해보세요</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* 제목 */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">📝 제목</h3>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => handlePartRegenerate('title')}>
                        <RefreshCw className="w-4 h-4 mr-2" />
                        수정
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleCopy(generatedContent.title)}>
                        <Copy className="w-4 h-4 mr-2" />
                        복사
                      </Button>
                    </div>
                  </div>
                  <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border">
                    <p className="font-medium text-lg text-gray-900">{generatedContent.title}</p>
                  </div>
                </div>

                {/* 요약 */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">📋 요약</h3>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => handlePartRegenerate('summary')}>
                        <RefreshCw className="w-4 h-4 mr-2" />
                        수정
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleCopy(generatedContent.summary)}>
                        <Copy className="w-4 h-4 mr-2" />
                        복사
                      </Button>
                    </div>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg border">
                    <p className="text-gray-700 leading-relaxed">{generatedContent.summary}</p>
                  </div>
                </div>

                {/* 본문 */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">📄 본문</h3>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => handlePartRegenerate('content')}>
                        <RefreshCw className="w-4 h-4 mr-2" />
                        수정
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleCopy(generatedContent.content)}>
                        <Copy className="w-4 h-4 mr-2" />
                        복사
                      </Button>
                    </div>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg border max-h-80 overflow-y-auto">
                    <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">{generatedContent.content}</div>
                  </div>
                </div>

                {/* 태그 */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">🏷️ 태그</h3>
                    <Button variant="outline" size="sm" onClick={() => handlePartRegenerate('tags')}>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      수정
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {generatedContent.tags.map((tag, index) => (
                      <Badge key={index} variant="secondary" className="text-sm">
                        #{tag}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* 통계 */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{generatedContent.metadata.wordCount}</div>
                    <div className="text-sm text-gray-600">단어</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{generatedContent.metadata.charCount}</div>
                    <div className="text-sm text-gray-600">글자</div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">{generatedContent.metadata.readingTime}</div>
                    <div className="text-sm text-gray-600">분 읽기</div>
                  </div>
                </div>

                {/* 액션 버튼 */}
                <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t">
                  <Button 
                    onClick={handleContentAnalysis}
                    size="lg"
                    variant="outline"
                    className="flex-1 border-2 border-blue-300 hover:border-blue-400 transition-all duration-300"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mr-2"></div>
                        분석 중...
                      </>
                    ) : (
                      <>
                        <Target className="w-5 h-5 mr-2" />
                        품질 분석
                      </>
                    )}
                  </Button>
                  <Button 
                    onClick={handleDownload}
                    size="lg"
                    className={`flex-1 bg-gradient-to-r ${typeInfo.color}`}
                  >
                    <Download className="w-5 h-5 mr-2" />
                    텍스트 파일로 다운로드
                  </Button>
                  <Button 
                    onClick={() => handleCopy(`${generatedContent.title}\n\n${generatedContent.content}\n\n${generatedContent.tags.map(tag => `#${tag}`).join(' ')}`)}
                    variant="outline"
                    size="lg"
                    className="flex-1"
                  >
                    <Copy className="w-5 h-5 mr-2" />
                    전체 복사
                  </Button>
                  <Button 
                    onClick={resetGeneration}
                    variant="outline"
                    size="lg"
                    className="flex-1"
                  >
                    <RefreshCw className="w-5 h-5 mr-2" />
                    새로 생성
                  </Button>
                </div>

                {/* 품질 분석 */}
                {contentAnalysis && (
                  <div className="space-y-3 border-t pt-6">
                    <h3 className="text-lg font-semibold">📊 콘텐츠 품질 분석</h3>
                    <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-sm font-medium">품질 점수</span>
                        <span className={`text-lg font-bold ${
                          contentAnalysis.score >= 80 ? 'text-green-600' :
                          contentAnalysis.score >= 60 ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          {Math.round(contentAnalysis.score)}/100
                        </span>
                      </div>
                      <div className={`w-full h-2 rounded-full ${
                        contentAnalysis.score >= 80 ? 'bg-green-200' :
                        contentAnalysis.score >= 60 ? 'bg-yellow-200' : 'bg-red-200'
                      } mb-4`}>
                        <div 
                          className={`h-2 rounded-full transition-all duration-300 ${
                            contentAnalysis.score >= 80 ? 'bg-green-500' :
                            contentAnalysis.score >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{width: `${contentAnalysis.score}%`}}
                        />
                      </div>
                      
                      <div className="grid grid-cols-4 gap-4 text-center text-sm mb-4">
                        <div>
                          <div className="font-semibold text-gray-900">{contentAnalysis.analysis.wordCount}</div>
                          <div className="text-gray-600">단어</div>
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900">{contentAnalysis.analysis.sentences}</div>
                          <div className="text-gray-600">문장</div>
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900">{contentAnalysis.analysis.paragraphs}</div>
                          <div className="text-gray-600">단락</div>
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900">{contentAnalysis.analysis.readingTime}분</div>
                          <div className="text-gray-600">읽기 시간</div>
                        </div>
                      </div>

                      {contentAnalysis.suggestions.length > 0 && (
                        <div className="border-t pt-4">
                          <h4 className="font-semibold text-gray-900 mb-2">💡 개선 제안</h4>
                          <div className="space-y-2">
                            {contentAnalysis.suggestions.map((suggestion, index) => (
                              <div key={index} className={`p-3 rounded-lg border ${
                                suggestion.priority === 'high' ? 'bg-red-50 border-red-200' :
                                suggestion.priority === 'medium' ? 'bg-yellow-50 border-yellow-200' :
                                'bg-blue-50 border-blue-200'
                              }`}>
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <div className="font-medium text-sm">{suggestion.title}</div>
                                    <div className="text-xs text-gray-600 mt-1">{suggestion.description}</div>
                                    <div className="text-xs text-gray-700 mt-2 italic">💪 {suggestion.action}</div>
                                  </div>
                                  <Badge variant="outline" className={`ml-2 text-xs ${
                                    suggestion.priority === 'high' ? 'border-red-300 text-red-700' :
                                    suggestion.priority === 'medium' ? 'border-yellow-300 text-yellow-700' :
                                    'border-blue-300 text-blue-700'
                                  }`}>
                                    {suggestion.priority}
                                  </Badge>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 부분 편집 모달 */}
                {editingPart && (
                  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold">
                          {editingPart === 'title' && '📝 제목 수정'}
                          {editingPart === 'summary' && '📋 요약 수정'}
                          {editingPart === 'content' && '📄 본문 수정'}
                          {editingPart === 'tags' && '🏷️ 태그 수정'}
                        </h3>
                        <Button variant="outline" size="sm" onClick={() => setEditingPart(null)}>
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                      
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="editInstruction">수정 요청사항</Label>
                          <Textarea
                            id="editInstruction"
                            placeholder={
                              editingPart === 'title' ? '예: 더 매력적이고 클릭하고 싶은 제목으로 만들어주세요' :
                              editingPart === 'summary' ? '예: 핵심 내용을 더 간결하게 요약해주세요' :
                              editingPart === 'content' ? '예: 더 자세한 설명과 예시를 추가해주세요' :
                              '예: 더 구체적이고 검색에 유리한 태그로 만들어주세요'
                            }
                            value={editInstruction}
                            onChange={(e) => setEditInstruction(e.target.value)}
                            className="min-h-[100px]"
                          />
                        </div>
                        
                        <div>
                          <Label>수정 스타일</Label>
                          <Select value={editStyle} onValueChange={setEditStyle}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="친근한">친근하고 캐주얼한</SelectItem>
                              <SelectItem value="전문적인">전문적이고 신뢰할 수 있는</SelectItem>
                              <SelectItem value="유머러스한">재미있고 유머러스한</SelectItem>
                              <SelectItem value="감성적인">감성적이고 따뜻한</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="flex gap-3 pt-4">
                          <Button 
                            onClick={handlePartRegenerateSubmit}
                            disabled={!editInstruction.trim() || partRegenerating}
                            className="flex-1"
                          >
                            {partRegenerating ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                생성 중...
                              </>
                            ) : (
                              <>
                                <Wand2 className="w-4 h-4 mr-2" />
                                수정 생성
                              </>
                            )}
                          </Button>
                          <Button variant="outline" onClick={() => setEditingPart(null)}>
                            취소
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

export default function GeneratePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">로딩 중...</p>
        </div>
      </div>
    }>
      <GeneratePageContent />
    </Suspense>
  );
} 