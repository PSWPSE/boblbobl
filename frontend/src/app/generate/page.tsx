'use client';

import React, { useState, useEffect } from 'react';
import { Wand2, FileText, Target, Send, RefreshCw, Copy, Download, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';

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
  type: 'keywords' | 'memo';
  keywords?: any;
  memo?: string;
}

interface GeneratedContent {
  id: string;
  title: string;
  content: string;
  summary: string;
  tags: string[];
  status: string;
  createdAt: string;
  metadata: {
    wordCount: number;
    charCount: number;
    readingTime: number;
  };
}

export default function GeneratePage() {
  const [sourceData, setSourceData] = useState<SourceData[]>([]);
  const [guidelines, setGuidelines] = useState<ContentGuideline[]>([]);
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null);
  const [loading, setLoading] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

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

  // 데이터 로드
  useEffect(() => {
    fetchSourceData();
    fetchGuidelines();
  }, []);

  // 소스 데이터 조회
  const fetchSourceData = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/upload`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('소스 데이터를 불러오는데 실패했습니다.');
      }

      const data = await response.json();
      setSourceData(data.data.items || []);
    } catch (error) {
      toast.error('소스 데이터를 불러오는데 실패했습니다.');
    }
  };

  // 가이드라인 조회
  const fetchGuidelines = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/guidelines`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('가이드라인을 불러오는데 실패했습니다.');
      }

      const data = await response.json();
      setGuidelines(data.data || []);
    } catch (error) {
      toast.error('가이드라인을 불러오는데 실패했습니다.');
    }
  };

  // 콘텐츠 생성
  const generateContent = async () => {
    if (!formData.sourceDataId || !formData.guidelineId) {
      toast.error('소스 파일과 가이드라인을 선택해주세요.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/content/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '콘텐츠 생성에 실패했습니다.');
      }

      const data = await response.json();
      setGeneratedContent(data.data);
      toast.success('콘텐츠가 성공적으로 생성되었습니다!');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '콘텐츠 생성 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 콘텐츠 재생성
  const regenerateContent = async () => {
    if (!generatedContent || !regenerateRequest.trim()) {
      toast.error('재생성 요청사항을 입력해주세요.');
      return;
    }

    setRegenerating(true);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/content/regenerate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          contentId: generatedContent.id,
          modificationRequest: regenerateRequest,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '콘텐츠 재생성에 실패했습니다.');
      }

      const data = await response.json();
      setGeneratedContent(data.data);
      setRegenerateRequest('');
      toast.success('콘텐츠가 성공적으로 재생성되었습니다!');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '콘텐츠 재생성 중 오류가 발생했습니다.');
    } finally {
      setRegenerating(false);
    }
  };

  // 클립보드 복사
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('클립보드에 복사되었습니다.');
    } catch (error) {
      toast.error('복사에 실패했습니다.');
    }
  };

  // 선택된 소스 데이터
  const selectedSource = sourceData.find(item => item.id === formData.sourceDataId);
  const selectedGuideline = guidelines.find(item => item.id === formData.guidelineId);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">AI 콘텐츠 생성</h1>
        <p className="text-gray-600 mt-2">
          업로드한 파일과 가이드라인을 기반으로 AI 블로그 콘텐츠를 생성합니다.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 설정 패널 */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Wand2 className="mr-2 h-5 w-5" />
                콘텐츠 생성 설정
              </CardTitle>
              <CardDescription>
                소스 파일과 가이드라인을 선택하여 AI 콘텐츠를 생성하세요.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* 소스 파일 선택 */}
              <div>
                <Label htmlFor="sourceData">소스 파일 선택</Label>
                <Select
                  value={formData.sourceDataId}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, sourceDataId: value }))}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="소스 파일을 선택하세요" />
                  </SelectTrigger>
                  <SelectContent>
                    {sourceData.map((item) => (
                      <SelectItem key={item.id} value={item.id}>
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline">{item.fileType.toUpperCase()}</Badge>
                          <span>{item.filename}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedSource && (
                  <div className="mt-2 p-3 bg-gray-50 rounded text-sm">
                    <p><strong>파일명:</strong> {selectedSource.filename}</p>
                    <p><strong>텍스트 길이:</strong> {selectedSource.metadata.charCount}자</p>
                  </div>
                )}
              </div>

              {/* 가이드라인 선택 */}
              <div>
                <Label htmlFor="guideline">가이드라인 선택</Label>
                <Select
                  value={formData.guidelineId}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, guidelineId: value }))}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="가이드라인을 선택하세요" />
                  </SelectTrigger>
                  <SelectContent>
                    {guidelines.map((item) => (
                      <SelectItem key={item.id} value={item.id}>
                        <div className="flex items-center space-x-2">
                          <Badge variant={item.type === 'keywords' ? 'default' : 'secondary'}>
                            {item.type === 'keywords' ? '키워드' : '메모'}
                          </Badge>
                          <span>{item.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* 콘텐츠 타입 */}
              <div>
                <Label htmlFor="contentType">콘텐츠 타입</Label>
                <Select
                  value={formData.contentType}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, contentType: value }))}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="blog">블로그 포스트</SelectItem>
                    <SelectItem value="news">뉴스 기사</SelectItem>
                    <SelectItem value="review">리뷰</SelectItem>
                    <SelectItem value="tutorial">튜토리얼</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* 목표 길이 */}
              <div>
                <Label htmlFor="targetLength">목표 길이 (글자수)</Label>
                <Input
                  id="targetLength"
                  type="number"
                  value={formData.targetLength}
                  onChange={(e) => setFormData(prev => ({ ...prev, targetLength: parseInt(e.target.value) || 800 }))}
                  className="mt-1"
                  min="300"
                  max="3000"
                />
              </div>

              {/* 추가 프롬프트 */}
              <div>
                <Label htmlFor="additionalPrompt">추가 요구사항 (선택)</Label>
                <Textarea
                  id="additionalPrompt"
                  value={formData.additionalPrompt}
                  onChange={(e) => setFormData(prev => ({ ...prev, additionalPrompt: e.target.value }))}
                  placeholder="특별한 요구사항이나 스타일을 입력하세요..."
                  className="mt-1"
                  rows={3}
                />
              </div>

              {/* 생성 버튼 */}
              <Button
                onClick={generateContent}
                disabled={loading || !formData.sourceDataId || !formData.guidelineId}
                className="w-full"
              >
                {loading ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    생성 중...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    콘텐츠 생성
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* 결과 패널 */}
        <div className="space-y-6">
          {generatedContent ? (
            <Card>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center">
                      <FileText className="mr-2 h-5 w-5" />
                      생성된 콘텐츠
                    </CardTitle>
                    <CardDescription>
                      {generatedContent.metadata.wordCount}단어 · {generatedContent.metadata.readingTime}분 읽기
                    </CardDescription>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowPreview(!showPreview)}
                    >
                      {showPreview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(generatedContent.content)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="content" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="content">본문</TabsTrigger>
                    <TabsTrigger value="summary">요약</TabsTrigger>
                    <TabsTrigger value="tags">태그</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="content" className="mt-4">
                    <div className="space-y-4">
                      <div>
                        <Label>제목</Label>
                        <div className="mt-1 p-3 bg-gray-50 rounded font-medium">
                          {generatedContent.title}
                        </div>
                      </div>
                      
                      <div>
                        <Label>본문</Label>
                        <div className="mt-1 p-4 bg-gray-50 rounded max-h-96 overflow-y-auto">
                          {showPreview ? (
                            <div dangerouslySetInnerHTML={{ __html: generatedContent.content }} />
                          ) : (
                            <pre className="whitespace-pre-wrap text-sm">
                              {generatedContent.content}
                            </pre>
                          )}
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="summary" className="mt-4">
                    <div className="p-4 bg-gray-50 rounded">
                      <p className="text-sm">{generatedContent.summary}</p>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="tags" className="mt-4">
                    <div className="flex flex-wrap gap-2">
                      {generatedContent.tags.map((tag, index) => (
                        <Badge key={index} variant="secondary">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </TabsContent>
                </Tabs>

                {/* 재생성 섹션 */}
                <div className="mt-6 pt-6 border-t">
                  <Label htmlFor="regenerateRequest">콘텐츠 수정 요청</Label>
                  <div className="flex space-x-2 mt-2">
                    <Textarea
                      id="regenerateRequest"
                      value={regenerateRequest}
                      onChange={(e) => setRegenerateRequest(e.target.value)}
                      placeholder="수정하고 싶은 내용을 입력하세요... (예: 더 친근한 톤으로 변경, 길이를 줄여주세요)"
                      className="flex-1"
                      rows={2}
                    />
                    <Button
                      onClick={regenerateContent}
                      disabled={regenerating || !regenerateRequest.trim()}
                    >
                      {regenerating ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      ) : (
                        <RefreshCw className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <div className="text-center">
                  <Wand2 className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-gray-600">콘텐츠를 생성하려면 설정을 완료하고 생성 버튼을 클릭하세요.</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
} 