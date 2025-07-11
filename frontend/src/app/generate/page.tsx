'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { ArrowRight, BookOpen, Brain, CheckCircle, Clock, Copy, Eye, EyeOff, FileText, RefreshCw, Settings, Sparkles, Stars, Target, TrendingUp, Wand2, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { apiGet, apiPost } from '@/lib/api';
import { showError, showSuccess } from '@/lib/notifications';

interface SourceData {
  id: string;
  filename: string;
  fileType: string;
  extractedText: string;
  metadata: {
    wordCount?: number;
    charCount?: number;
  };
}

interface ContentGuideline {
  id: string;
  name: string;
  type: string;
}

interface GeneratedContent {
  id: string;
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

// 메모이제이션된 컴포넌트들
const SourceDataSelector = React.memo(({ 
  sourceData, 
  selectedId, 
  onSelect 
}: {
  sourceData: SourceData[];
  selectedId: string;
  onSelect: (id: string) => void;
}) => (
  <div className="space-y-2">
    <Label htmlFor="sourceData">소스 파일 선택</Label>
    <Select value={selectedId} onValueChange={onSelect}>
      <SelectTrigger>
        <SelectValue placeholder="업로드된 파일을 선택하세요" />
      </SelectTrigger>
      <SelectContent>
        {sourceData.map((item) => (
          <SelectItem key={item.id} value={item.id}>
            📄 {item.filename} ({item.fileType.toUpperCase()})
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  </div>
));

const GuidelineSelector = React.memo(({ 
  guidelines, 
  selectedId, 
  onSelect 
}: {
  guidelines: ContentGuideline[];
  selectedId: string;
  onSelect: (id: string) => void;
}) => (
  <div className="space-y-2">
    <Label htmlFor="guideline">가이드라인 선택</Label>
    <Select value={selectedId} onValueChange={onSelect}>
      <SelectTrigger>
        <SelectValue placeholder="콘텐츠 가이드라인을 선택하세요" />
      </SelectTrigger>
      <SelectContent>
        {guidelines.map((guideline) => (
          <SelectItem key={guideline.id} value={guideline.id}>
            🎯 {guideline.name} ({guideline.type})
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  </div>
));

const GenerationProgress = React.memo(({ 
  progress, 
  loading 
}: {
  progress: number;
  loading: boolean;
}) => {
  if (!loading) return null;
  
  return (
    <div className="w-full space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">콘텐츠 생성 중...</span>
        <span className="text-sm text-gray-500">{Math.round(progress)}%</span>
      </div>
      <Progress value={progress} className="w-full" />
      <div className="text-xs text-gray-500 text-center">
        {progress < 30 && '📄 파일 분석 중...'}
        {progress >= 30 && progress < 60 && '🧠 AI 분석 중...'}
        {progress >= 60 && progress < 90 && '✍️ 콘텐츠 생성 중...'}
        {progress >= 90 && '🎨 최종 검토 중...'}
      </div>
    </div>
  );
});

const ContentPreview = React.memo(({ 
  content, 
  onCopy 
}: {
  content: GeneratedContent;
  onCopy: (text: string) => void;
}) => (
  <div className="space-y-6">
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold">제목</h3>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => onCopy(content.title)}
        >
          <Copy className="w-4 h-4 mr-2" />
          복사
        </Button>
      </div>
      <div className="p-4 bg-gray-50 rounded-lg">
        <p className="font-medium">{content.title}</p>
      </div>
    </div>

    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold">요약</h3>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => onCopy(content.summary)}
        >
          <Copy className="w-4 h-4 mr-2" />
          복사
        </Button>
      </div>
      <div className="p-4 bg-gray-50 rounded-lg">
        <p className="text-sm text-gray-700">{content.summary}</p>
      </div>
    </div>

    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold">본문</h3>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => onCopy(content.content)}
        >
          <Copy className="w-4 h-4 mr-2" />
          복사
        </Button>
      </div>
      <div className="p-4 bg-gray-50 rounded-lg max-h-96 overflow-y-auto">
        <div className="whitespace-pre-wrap text-sm">{content.content}</div>
      </div>
    </div>

    <div>
      <h3 className="text-lg font-semibold mb-3">태그</h3>
      <div className="flex flex-wrap gap-2">
        {content.tags.map((tag, index) => (
          <Badge key={index} variant="secondary">#{tag}</Badge>
        ))}
      </div>
    </div>

    <div>
      <h3 className="text-lg font-semibold mb-3">통계</h3>
      <div className="grid grid-cols-3 gap-4">
        <div className="text-center p-3 bg-blue-50 rounded-lg">
          <div className="text-2xl font-bold text-blue-600">{content.metadata.wordCount}</div>
          <div className="text-sm text-gray-600">단어</div>
        </div>
        <div className="text-center p-3 bg-green-50 rounded-lg">
          <div className="text-2xl font-bold text-green-600">{content.metadata.charCount}</div>
          <div className="text-sm text-gray-600">글자</div>
        </div>
        <div className="text-center p-3 bg-purple-50 rounded-lg">
          <div className="text-2xl font-bold text-purple-600">{content.metadata.readingTime}분</div>
          <div className="text-sm text-gray-600">읽기시간</div>
        </div>
      </div>
    </div>
  </div>
));

export default function GeneratePage() {
  const [sourceData, setSourceData] = useState<SourceData[]>([]);
  const [guidelines, setGuidelines] = useState<ContentGuideline[]>([]);
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null);
  const [loading, setLoading] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);

  // 폼 데이터
  const [formData, setFormData] = useState({
    sourceDataId: '',
    guidelineId: '',
    additionalPrompt: '',
    contentType: 'blog',
    targetLength: 800,
  });

  // 재생성 요청
  const [regenerateRequest, setRegenerateRequest] = useState('');

  // 메모이제이션된 선택된 소스 데이터
  const selectedSource = useMemo(() => 
    sourceData.find(item => item.id === formData.sourceDataId),
    [sourceData, formData.sourceDataId]
  );

  // 메모이제이션된 폼 유효성 검사
  const isFormValid = useMemo(() => 
    formData.sourceDataId && formData.guidelineId,
    [formData.sourceDataId, formData.guidelineId]
  );

  // 소스 데이터 조회 (메모이제이션)
  const fetchSourceData = useCallback(async () => {
    try {
      const data = await apiGet('/api/upload');
      setSourceData(data.data.items || []);
    } catch (error) {
      showError('소스 데이터를 불러오는데 실패했습니다.');
    }
  }, []);

  // 가이드라인 조회 (메모이제이션)
  const fetchGuidelines = useCallback(async () => {
    try {
      const data = await apiGet('/api/guidelines');
      setGuidelines(data.data || []);
    } catch (error) {
      showError('가이드라인을 불러오는데 실패했습니다.');
    }
  }, []);

  // 콘텐츠 생성 (메모이제이션)
  const generateContent = useCallback(async () => {
    if (!isFormValid) {
      showError('소스 파일과 가이드라인을 선택해주세요.');
      return;
    }

    console.log('🚀 콘텐츠 생성 시작', { formData });
    
    setLoading(true);
    setGenerationProgress(0);

    // 프로그레스 시뮬레이션 개선
    let progressValue = 0;
    const progressInterval = setInterval(() => {
      setGenerationProgress(prev => {
        progressValue = prev + Math.random() * 3 + 1; // 1-4% 증가
        if (progressValue >= 95) {
          progressValue = 95; // 95%에서 멈춤
        }
        return Math.min(progressValue, 95);
      });
    }, 500); // 더 부드러운 애니메이션

    try {
      console.log('📡 API 호출 중: /api/content/generate');
      
      setGenerationProgress(90);
      
      const data = await apiPost('/api/content/generate', formData);
      
      console.log('✅ 콘텐츠 생성 완료', { data });
      
      if (data.success && data.data) {
        setGeneratedContent(data.data);
        setGenerationProgress(100);
        setShowPreview(true);
        showSuccess('콘텐츠가 성공적으로 생성되었습니다!');
      } else {
        throw new Error(data.error || '콘텐츠 생성에 실패했습니다.');
      }
    } catch (error) {
      console.error('❌ 콘텐츠 생성 실패:', error);
      
      setGenerationProgress(0);
      
      const errorMessage = error instanceof Error ? error.message : '콘텐츠 생성 중 오류가 발생했습니다.';
      
      if (errorMessage.includes('요청 시간이 초과')) {
        showError('⏰ 콘텐츠 생성 시간이 오래 걸리고 있습니다. OpenAI 서버가 바쁠 수 있으니 잠시 후 다시 시도해주세요.');
      } else if (errorMessage.includes('401') || errorMessage.includes('인증')) {
        showError('🔐 로그인이 필요합니다. 다시 로그인해주세요.');
      } else if (errorMessage.includes('404')) {
        showError('📂 선택한 파일이나 가이드라인을 찾을 수 없습니다. 다시 선택해주세요.');
      } else {
        showError(`🚨 ${errorMessage}`);
      }
    } finally {
      setLoading(false);
      clearInterval(progressInterval);
    }
  }, [formData, isFormValid]);

  // 콘텐츠 재생성 (메모이제이션)
  const regenerateContent = useCallback(async () => {
    if (!generatedContent || !regenerateRequest.trim()) {
      showError('재생성 요청사항을 입력해주세요.');
      return;
    }

    setRegenerating(true);

    try {
      const data = await apiPost('/api/content/regenerate', {
        contentId: generatedContent.id,
        modificationRequest: regenerateRequest,
      });
      setGeneratedContent(data.data);
      setRegenerateRequest('');
      showSuccess('콘텐츠가 성공적으로 재생성되었습니다!');
    } catch (error) {
      showError(error instanceof Error ? error.message : '콘텐츠 재생성 중 오류가 발생했습니다.');
    } finally {
      setRegenerating(false);
    }
  }, [generatedContent, regenerateRequest]);

  // 클립보드 복사 (메모이제이션)
  const copyToClipboard = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      showSuccess('클립보드에 복사되었습니다.');
    } catch (error) {
      showError('복사에 실패했습니다.');
    }
  }, []);

  // 폼 데이터 업데이트 핸들러 (메모이제이션)
  const updateFormData = useCallback((field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  // 데이터 로드 (한 번만 실행)
  useEffect(() => {
    Promise.all([fetchSourceData(), fetchGuidelines()]);
  }, [fetchSourceData, fetchGuidelines]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      {/* Background elements - 가벼운 버전 */}
      <div className="fixed top-20 left-20 w-72 h-72 bg-gradient-to-r from-blue-300/10 to-purple-300/10 rounded-full blur-3xl"></div>
      
      <div className="container mx-auto px-4 py-8 relative z-10">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            <Brain className="w-10 h-10 inline-block mr-3 text-blue-600" />
            AI 콘텐츠 생성
          </h1>
          <p className="text-xl text-gray-600">업로드한 소스를 바탕으로 고품질 블로그 콘텐츠를 생성하세요</p>
        </div>

        <div className="max-w-6xl mx-auto">
          <Tabs defaultValue="generate" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8">
              <TabsTrigger value="generate" className="flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                콘텐츠 생성
              </TabsTrigger>
              <TabsTrigger value="preview" className="flex items-center gap-2" disabled={!generatedContent}>
                <Eye className="w-4 h-4" />
                미리보기
              </TabsTrigger>
            </TabsList>

            <TabsContent value="generate" className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                {/* 소스 선택 */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      소스 파일 선택
                    </CardTitle>
                    <CardDescription>
                      업로드된 파일 중 콘텐츠 생성에 사용할 소스를 선택하세요
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <SourceDataSelector
                      sourceData={sourceData}
                      selectedId={formData.sourceDataId}
                      onSelect={(id) => updateFormData('sourceDataId', id)}
                    />
                    
                    {selectedSource && (
                      <div className="p-3 bg-blue-50 rounded-lg">
                        <p className="text-sm font-medium">선택된 파일</p>
                        <p className="text-xs text-gray-600 mt-1">
                          {selectedSource.filename} • 
                          {selectedSource.metadata.wordCount} 단어 • 
                          {selectedSource.metadata.charCount} 글자
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* 가이드라인 선택 */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="w-5 h-5" />
                      가이드라인 선택
                    </CardTitle>
                    <CardDescription>
                      콘텐츠 생성에 적용할 가이드라인을 선택하세요
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <GuidelineSelector
                      guidelines={guidelines}
                      selectedId={formData.guidelineId}
                      onSelect={(id) => updateFormData('guidelineId', id)}
                    />
                  </CardContent>
                </Card>
              </div>

              {/* 추가 옵션 */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="w-5 h-5" />
                    추가 옵션
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="contentType">콘텐츠 타입</Label>
                    <Select 
                      value={formData.contentType} 
                      onValueChange={(value) => updateFormData('contentType', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="blog">블로그 포스트</SelectItem>
                        <SelectItem value="article">아티클</SelectItem>
                        <SelectItem value="news">뉴스</SelectItem>
                        <SelectItem value="review">리뷰</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="targetLength">목표 길이 (단어)</Label>
                    <Input
                      type="number"
                      value={formData.targetLength}
                      onChange={(e) => updateFormData('targetLength', parseInt(e.target.value))}
                      min="200"
                      max="3000"
                      step="100"
                    />
                  </div>

                  <div className="md:col-span-2 space-y-2">
                    <Label htmlFor="additionalPrompt">추가 지시사항 (선택사항)</Label>
                    <Textarea
                      placeholder="예: SEO 최적화를 중점적으로, 초보자도 이해하기 쉽게 작성해주세요"
                      value={formData.additionalPrompt}
                      onChange={(e) => updateFormData('additionalPrompt', e.target.value)}
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* 생성 버튼 */}
              <div className="text-center space-y-4">
                <GenerationProgress progress={generationProgress} loading={loading} />
                
                <Button
                  onClick={generateContent}
                  disabled={loading || !isFormValid}
                  size="lg"
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      생성 중...
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-5 h-5 mr-2" />
                      콘텐츠 생성하기
                    </>
                  )}
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="preview">
              {generatedContent ? (
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        생성 완료
                      </CardTitle>
                      <CardDescription>
                        콘텐츠가 성공적으로 생성되었습니다. 아래에서 확인하고 필요시 수정 요청하세요.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ContentPreview 
                        content={generatedContent} 
                        onCopy={copyToClipboard}
                      />
                    </CardContent>
                  </Card>

                  {/* 재생성 옵션 */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <RefreshCw className="w-5 h-5" />
                        콘텐츠 재생성
                      </CardTitle>
                      <CardDescription>
                        콘텐츠 수정이 필요하다면 구체적인 요청사항을 입력하세요
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <Textarea
                        placeholder="예: 제목을 더 매력적으로 바꿔주세요, 본문을 더 짧게 줄여주세요"
                        value={regenerateRequest}
                        onChange={(e) => setRegenerateRequest(e.target.value)}
                        rows={3}
                      />
                      <Button
                        onClick={regenerateContent}
                        disabled={regenerating || !regenerateRequest.trim()}
                        className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
                      >
                        {regenerating ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            재생성 중...
                          </>
                        ) : (
                          <>
                            <RefreshCw className="w-4 h-4 mr-2" />
                            재생성하기
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="text-gray-400 mb-4">
                    <FileText className="w-16 h-16 mx-auto" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    생성된 콘텐츠가 없습니다
                  </h3>
                  <p className="text-gray-500">
                    먼저 콘텐츠를 생성해주세요
                  </p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
} 