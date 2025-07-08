'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuthStore } from '@/lib/auth';
import { Badge } from '@/components/ui/badge';
import { ImageIcon, Download, Eye, Trash2, Plus, Sparkles, Wand2 } from 'lucide-react';

interface ThumbnailOption {
  value: string;
  label: string;
  description: string;
}

interface ThumbnailOptions {
  styles: ThumbnailOption[];
  aspectRatios: ThumbnailOption[];
  templates: ThumbnailOption[];
}

interface ThumbnailData {
  id: string;
  title: string;
  type: string;
  originalUrl: string;
  optimizedUrl: string;
  thumbnailUrl: string;
  prompt: string;
  style: string;
  metadata: any;
  createdAt: string;
  tags: string[];
}

export default function ThumbnailPage() {
  const { user, token } = useAuthStore();
  const router = useRouter();
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [thumbnailOptions, setThumbnailOptions] = useState<ThumbnailOptions | null>(null);
  const [userThumbnails, setUserThumbnails] = useState<ThumbnailData[]>([]);
  const [selectedThumbnail, setSelectedThumbnail] = useState<ThumbnailData | null>(null);
  const [activeTab, setActiveTab] = useState<'generate' | 'history'>('generate');
  const [generationType, setGenerationType] = useState<'basic' | 'with-text' | 'templated'>('basic');
  
  // 폼 상태
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    tags: '',
    style: 'modern',
    aspectRatio: '16:9',
    language: 'ko',
    template: 'tech',
    overlayText: {
      title: '',
      subtitle: '',
      backgroundColor: 'rgba(0,0,0,0.6)',
      textColor: '#ffffff'
    }
  });

  useEffect(() => {
    if (!user) {
      router.push('/auth/login');
      return;
    }

    fetchThumbnailOptions();
    fetchUserThumbnails();
  }, [user, router]);

  const fetchThumbnailOptions = async () => {
    try {
      const response = await fetch('/api/thumbnail/options');
      const data = await response.json();
      
      if (data.success) {
        setThumbnailOptions(data.data);
      }
    } catch (error) {
      console.error('썸네일 옵션 로드 실패:', error);
    }
  };

  const fetchUserThumbnails = async () => {
    try {
      const response = await fetch('/api/thumbnail/my-thumbnails', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      
      if (data.success) {
        setUserThumbnails(data.data.thumbnails);
      }
    } catch (error) {
      console.error('썸네일 목록 로드 실패:', error);
    }
  };

  const handleGenerateThumbnail = async () => {
    if (!formData.title || !formData.content) {
      alert('제목과 내용을 입력해주세요.');
      return;
    }

    setIsGenerating(true);
    try {
      const tagsArray = formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag);
      
      let endpoint = '/api/thumbnail/generate';
      let requestBody: any = {
        title: formData.title,
        content: formData.content,
        tags: tagsArray,
        style: formData.style,
        aspectRatio: formData.aspectRatio,
        language: formData.language
      };

      if (generationType === 'with-text') {
        endpoint = '/api/thumbnail/generate/with-text';
        requestBody.overlayText = formData.overlayText;
      } else if (generationType === 'templated') {
        endpoint = '/api/thumbnail/generate/templated';
        requestBody.template = formData.template;
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(requestBody)
      });

      const data = await response.json();
      
      if (data.success) {
        setSelectedThumbnail(data.data);
        fetchUserThumbnails();
        setActiveTab('history');
      } else {
        alert(`썸네일 생성 실패: ${data.error}`);
      }
    } catch (error) {
      console.error('썸네일 생성 오류:', error);
      alert('썸네일 생성 중 오류가 발생했습니다.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDeleteThumbnail = async (thumbnailId: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;

    try {
      const response = await fetch(`/api/thumbnail/${thumbnailId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      
      if (data.success) {
        fetchUserThumbnails();
        if (selectedThumbnail?.id === thumbnailId) {
          setSelectedThumbnail(null);
        }
      } else {
        alert(`삭제 실패: ${data.error}`);
      }
    } catch (error) {
      console.error('삭제 오류:', error);
      alert('삭제 중 오류가 발생했습니다.');
    }
  };

  const handleDownloadImage = (imageUrl: string, filename: string) => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = filename;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🖼️ AI 썸네일 생성
          </h1>
          <p className="text-gray-600">
            AI를 활용해 블로그 콘텐츠에 최적화된 썸네일 이미지를 생성하세요
          </p>
        </div>

        <div className="flex gap-4 mb-6">
          <Button
            variant={activeTab === 'generate' ? 'default' : 'outline'}
            onClick={() => setActiveTab('generate')}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            썸네일 생성
          </Button>
          <Button
            variant={activeTab === 'history' ? 'default' : 'outline'}
            onClick={() => setActiveTab('history')}
            className="flex items-center gap-2"
          >
            <ImageIcon className="h-4 w-4" />
            생성 기록
          </Button>
        </div>

        {activeTab === 'generate' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5" />
                    썸네일 생성 설정
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* 생성 타입 선택 */}
                  <div className="space-y-2">
                    <Label>생성 타입</Label>
                    <div className="flex gap-2">
                      <Button
                        variant={generationType === 'basic' ? 'default' : 'outline'}
                        onClick={() => setGenerationType('basic')}
                        size="sm"
                      >
                        기본 생성
                      </Button>
                      <Button
                        variant={generationType === 'with-text' ? 'default' : 'outline'}
                        onClick={() => setGenerationType('with-text')}
                        size="sm"
                      >
                        텍스트 오버레이
                      </Button>
                      <Button
                        variant={generationType === 'templated' ? 'default' : 'outline'}
                        onClick={() => setGenerationType('templated')}
                        size="sm"
                      >
                        템플릿 기반
                      </Button>
                    </div>
                  </div>

                  {/* 기본 정보 */}
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="title">제목</Label>
                      <Input
                        id="title"
                        value={formData.title}
                        onChange={(e) => setFormData({...formData, title: e.target.value})}
                        placeholder="블로그 포스트 제목을 입력하세요"
                      />
                    </div>

                    <div>
                      <Label htmlFor="content">내용</Label>
                      <Textarea
                        id="content"
                        value={formData.content}
                        onChange={(e) => setFormData({...formData, content: e.target.value})}
                        placeholder="블로그 포스트 내용을 입력하세요"
                        rows={4}
                      />
                    </div>

                    <div>
                      <Label htmlFor="tags">태그 (쉼표로 구분)</Label>
                      <Input
                        id="tags"
                        value={formData.tags}
                        onChange={(e) => setFormData({...formData, tags: e.target.value})}
                        placeholder="예: 프로그래밍, 개발, 웹개발"
                      />
                    </div>
                  </div>

                  {/* 스타일 및 비율 설정 */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="style">스타일</Label>
                      <Select value={formData.style} onValueChange={(value) => setFormData({...formData, style: value})}>
                        <SelectTrigger>
                          <SelectValue placeholder="스타일 선택" />
                        </SelectTrigger>
                        <SelectContent>
                          {thumbnailOptions?.styles.map((style) => (
                            <SelectItem key={style.value} value={style.value}>
                              {style.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="aspectRatio">비율</Label>
                      <Select value={formData.aspectRatio} onValueChange={(value) => setFormData({...formData, aspectRatio: value})}>
                        <SelectTrigger>
                          <SelectValue placeholder="비율 선택" />
                        </SelectTrigger>
                        <SelectContent>
                          {thumbnailOptions?.aspectRatios.map((ratio) => (
                            <SelectItem key={ratio.value} value={ratio.value}>
                              {ratio.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* 템플릿 선택 (템플릿 기반일 때만) */}
                  {generationType === 'templated' && (
                    <div>
                      <Label htmlFor="template">템플릿</Label>
                      <Select value={formData.template} onValueChange={(value) => setFormData({...formData, template: value})}>
                        <SelectTrigger>
                          <SelectValue placeholder="템플릿 선택" />
                        </SelectTrigger>
                        <SelectContent>
                          {thumbnailOptions?.templates.map((template) => (
                            <SelectItem key={template.value} value={template.value}>
                              {template.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* 텍스트 오버레이 설정 (텍스트 오버레이일 때만) */}
                  {generationType === 'with-text' && (
                    <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                      <h3 className="font-medium">텍스트 오버레이 설정</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="overlayTitle">오버레이 제목</Label>
                          <Input
                            id="overlayTitle"
                            value={formData.overlayText.title}
                            onChange={(e) => setFormData({
                              ...formData,
                              overlayText: {...formData.overlayText, title: e.target.value}
                            })}
                            placeholder="이미지에 표시될 제목"
                          />
                        </div>
                        <div>
                          <Label htmlFor="overlaySubtitle">오버레이 부제목</Label>
                          <Input
                            id="overlaySubtitle"
                            value={formData.overlayText.subtitle}
                            onChange={(e) => setFormData({
                              ...formData,
                              overlayText: {...formData.overlayText, subtitle: e.target.value}
                            })}
                            placeholder="이미지에 표시될 부제목 (선택사항)"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  <Button
                    onClick={handleGenerateThumbnail}
                    disabled={isGenerating}
                    className="w-full"
                    size="lg"
                  >
                    {isGenerating ? (
                      <>
                        <Wand2 className="h-4 w-4 mr-2 animate-spin" />
                        생성 중...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 mr-2" />
                        썸네일 생성
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </div>

            <div>
              <Card>
                <CardHeader>
                  <CardTitle>스타일 가이드</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {thumbnailOptions?.styles.map((style) => (
                      <div key={style.value} className="border-l-4 border-blue-500 pl-4">
                        <h4 className="font-medium">{style.label}</h4>
                        <p className="text-sm text-gray-600">{style.description}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div>
            <Card>
              <CardHeader>
                <CardTitle>생성된 썸네일</CardTitle>
              </CardHeader>
              <CardContent>
                {userThumbnails.length === 0 ? (
                  <div className="text-center py-8">
                    <ImageIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">아직 생성된 썸네일이 없습니다.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {userThumbnails.map((thumbnail) => (
                      <div key={thumbnail.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="aspect-video bg-gray-100 rounded-lg mb-3 overflow-hidden">
                          <img
                            src={thumbnail.thumbnailUrl}
                            alt={thumbnail.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <h3 className="font-medium text-sm mb-2 line-clamp-2">{thumbnail.title}</h3>
                        <div className="flex flex-wrap gap-1 mb-3">
                          {thumbnail.tags.map((tag, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                        <div className="flex justify-between items-center">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedThumbnail(thumbnail)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            보기
                          </Button>
                          <div className="flex gap-1">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDownloadImage(
                                thumbnail.optimizedUrl,
                                `${thumbnail.title}.jpg`
                              )}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteThumbnail(thumbnail.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* 썸네일 상세 모달 */}
        {selectedThumbnail && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setSelectedThumbnail(null)}>
            <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">썸네일 상세</h2>
                <Button variant="outline" onClick={() => setSelectedThumbnail(null)}>
                  닫기
                </Button>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <img
                    src={selectedThumbnail.optimizedUrl}
                    alt={selectedThumbnail.title}
                    className="w-full rounded-lg"
                  />
                </div>
                
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">제목</h3>
                    <p className="text-gray-600">{selectedThumbnail.title}</p>
                  </div>
                  
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">스타일</h3>
                    <p className="text-gray-600">{selectedThumbnail.style}</p>
                  </div>
                  
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">생성 프롬프트</h3>
                    <p className="text-gray-600 text-sm">{selectedThumbnail.prompt}</p>
                  </div>
                  
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">태그</h3>
                    <div className="flex flex-wrap gap-1">
                      {selectedThumbnail.tags.map((tag, index) => (
                        <Badge key={index} variant="secondary">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleDownloadImage(
                        selectedThumbnail.optimizedUrl,
                        `${selectedThumbnail.title}.jpg`
                      )}
                      className="flex items-center gap-2"
                    >
                      <Download className="h-4 w-4" />
                      다운로드
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleDeleteThumbnail(selectedThumbnail.id)}
                      className="flex items-center gap-2"
                    >
                      <Trash2 className="h-4 w-4" />
                      삭제
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 