'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Edit2, FileText, Plus, Target, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';

import { apiDelete, apiGet, apiPost, apiPut } from '@/lib/api';
import { showError, showSuccess } from '@/lib/notifications';
import { useAuthStore } from '@/lib/auth';

interface GuidelineKeywords {
  tone: string[];
  structure: string[];
  readability: string[];
  seo: string[];
  engagement: string[];
  format: string[];
}

interface ContentGuideline {
  id: string;
  name: string;
  keywords?: GuidelineKeywords;
  memo?: string;
  type: 'keywords' | 'memo';
  createdAt: string;
  _count: {
    generatedContent: number;
  };
}

interface KeywordOptions {
  tone: string[];
  structure: string[];
  readability: string[];
  seo: string[];
  engagement: string[];
  format: string[];
}

export default function GuidelinesPage() {
  const router = useRouter();
  const { user, isAuthenticated, isInitialized } = useAuthStore();
  const [guidelines, setGuidelines] = useState<ContentGuideline[]>([]);
  const [keywordOptions, setKeywordOptions] = useState<KeywordOptions | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingGuideline, setEditingGuideline] = useState<ContentGuideline | null>(null);
  // 폼 상태
  const [formData, setFormData] = useState({
    name: '',
    type: 'keywords' as 'keywords' | 'memo',
    memo: '',
    keywords: {
      tone: [] as string[],
      structure: [] as string[],
      readability: [] as string[],
      seo: [] as string[],
      engagement: [] as string[],
      format: [] as string[],
    },
  });

  // 가이드라인 목록 조회
  const fetchGuidelines = async () => {
    try {
      const data = await apiGet('/api/guidelines');
      setGuidelines(data.data);
      return data;
    } catch (error) {
      console.error('가이드라인 목록 조회 실패:', error);
      const errorMessage = '가이드라인을 불러오는데 실패했습니다: ' + (error as Error).message;
      setError(errorMessage);
      
      // 401 에러 시 로그아웃 처리
      if ((error as Error).message.includes('401')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        router.push('/auth/login');
        return;
      }
      
      showError('가이드라인을 불러오는데 실패했습니다.');
      throw error;
    }
  };

  // 키워드 옵션 조회
  const fetchKeywordOptions = async () => {
    try {
      const data = await apiGet('/api/guidelines/keywords');
      setKeywordOptions(data.data);
      return data;
    } catch (error) {
      console.error('키워드 옵션 조회 실패:', error);
      const errorMessage = '키워드 옵션을 불러오는데 실패했습니다: ' + (error as Error).message;
      setError(errorMessage);
      showError('키워드 옵션을 불러오는데 실패했습니다.');
      throw error;
    }
  };

  // 초기 데이터 로드
  const loadInitialData = async () => {
    setLoading(true);
    setError(null);
    
    // 인증 상태가 초기화되지 않았으면 대기
    if (!isInitialized) {
      setLoading(false);
      return;
    }
    
    // 로그인되지 않은 경우 리다이렉트
    if (!isAuthenticated) {
      setLoading(false);
      router.push('/auth/login');
      return;
    }

    try {
      await Promise.all([
        fetchGuidelines(),
        fetchKeywordOptions()
      ]);
    } catch (error) {
      console.error('초기 데이터 로드 실패:', error);
      // 개별 에러 처리는 각 함수에서 처리됨
    } finally {
      setLoading(false);
    }
  };

  // 초기화 완료 후 데이터 로드
  useEffect(() => {
    if (isInitialized) {
      loadInitialData();
    }
  }, [isInitialized, isAuthenticated]);

  // 재시도 함수
  const handleRetry = () => {
    loadInitialData();
  };

  // 폼 초기화
  const resetForm = () => {
    setFormData({
      name: '',
      type: 'keywords',
      memo: '',
      keywords: {
        tone: [],
        structure: [],
        readability: [],
        seo: [],
        engagement: [],
        format: [],
      },
    });
    setEditingGuideline(null);
  };

  // 가이드라인 생성/수정
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingGuideline) {
        await apiPut(`/api/guidelines/${editingGuideline.id}`, formData);
        showSuccess('가이드라인이 수정되었습니다.');
      } else {
        await apiPost('/api/guidelines', formData);
        showSuccess('가이드라인이 생성되었습니다.');
      }

      fetchGuidelines();
      resetForm();
      setIsCreateDialogOpen(false);
    } catch (error) {
      showError('가이드라인 저장에 실패했습니다.');
    }
  };

  // 가이드라인 삭제
  const handleDelete = async (id: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;

    try {
      await apiDelete(`/api/guidelines/${id}`);
      showSuccess('가이드라인이 삭제되었습니다.');
      fetchGuidelines();
    } catch (error) {
      showError('가이드라인 삭제에 실패했습니다.');
    }
  };

  // 수정 폼 설정
  const handleEdit = (guideline: ContentGuideline) => {
    setEditingGuideline(guideline);
    setFormData({
      name: guideline.name,
      type: guideline.type,
      memo: guideline.memo || '',
      keywords: guideline.keywords || {
        tone: [],
        structure: [],
        readability: [],
        seo: [],
        engagement: [],
        format: [],
      },
    });
    setIsCreateDialogOpen(true);
  };

  // 키워드 체크박스 핸들러
  const handleKeywordChange = (category: keyof GuidelineKeywords, value: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      keywords: {
        ...prev.keywords,
        [category]: checked 
          ? [...prev.keywords[category], value]
          : prev.keywords[category].filter(item => item !== value)
      }
    }));
  };

  // 로그인되지 않은 상태
  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">로그인이 필요합니다</h1>
          <p className="text-gray-600 mb-4">가이드라인을 관리하려면 로그인해주세요.</p>
          <Button onClick={() => router.push('/auth/login')}>로그인하기</Button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>로딩 중...</p>
          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600">{error}</p>
              <Button 
                onClick={handleRetry} 
                className="mt-2"
                variant="outline"
              >
                다시 시도
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">가이드라인 관리</h1>
          <p className="text-gray-600 mt-2">콘텐츠 생성을 위한 가이드라인을 관리하세요.</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="btn-gradient" onClick={() => { resetForm(); setIsCreateDialogOpen(true); }}>
              <Plus className="mr-2 h-4 w-4" />
              새 가이드라인
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingGuideline ? '가이드라인 수정' : '새 가이드라인 생성'}
              </DialogTitle>
              <DialogDescription>
                콘텐츠 생성에 사용할 가이드라인을 {editingGuideline ? '수정' : '생성'}하세요.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">가이드라인 이름</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="가이드라인 이름을 입력하세요"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">가이드라인 유형</Label>
                <Select 
                  value={formData.type} 
                  onValueChange={(value: 'keywords' | 'memo') => setFormData(prev => ({ ...prev, type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="유형을 선택하세요" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="keywords">키워드 기반</SelectItem>
                    <SelectItem value="memo">메모 기반</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.type === 'memo' ? (
                <div className="space-y-2">
                  <Label htmlFor="memo">가이드라인 메모</Label>
                  <Textarea
                    id="memo"
                    value={formData.memo}
                    onChange={(e) => setFormData(prev => ({ ...prev, memo: e.target.value }))}
                    placeholder="자유롭게 가이드라인을 작성하세요"
                    rows={6}
                    required
                  />
                </div>
              ) : (
                keywordOptions && (
                  <div className="space-y-6">
                    <div className="text-sm text-gray-600">
                      각 카테고리에서 원하는 키워드를 선택하세요
                    </div>
                    {Object.entries(keywordOptions).map(([category, options]) => (
                      <div key={category} className="space-y-3">
                        <Label className="text-sm font-medium capitalize">
                          {category === 'tone' && '톤 & 스타일'}
                          {category === 'structure' && '구조'}
                          {category === 'readability' && '가독성'}
                          {category === 'seo' && 'SEO'}
                          {category === 'engagement' && '참여도'}
                          {category === 'format' && '형식'}
                        </Label>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                          {options.map((option) => (
                            <div key={option} className="flex items-center space-x-2">
                              <Checkbox
                                id={`${category}-${option}`}
                                checked={formData.keywords[category as keyof GuidelineKeywords].includes(option)}
                                onCheckedChange={(checked) => 
                                  handleKeywordChange(category as keyof GuidelineKeywords, option, checked as boolean)
                                }
                              />
                              <Label 
                                htmlFor={`${category}-${option}`} 
                                className="text-sm cursor-pointer"
                              >
                                {option}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )
              )}

              <div className="flex justify-end space-x-3">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsCreateDialogOpen(false)}
                >
                  취소
                </Button>
                <Button type="submit" className="btn-gradient">
                  {editingGuideline ? '수정' : '생성'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {guidelines.map((guideline) => (
          <Card key={guideline.id} className="modern-card group hover:shadow-lg transition-all duration-200">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{guideline.name}</CardTitle>
                  <div className="flex items-center space-x-2 mt-2">
                    <Badge variant="secondary" className="text-xs">
                      {guideline.type === 'keywords' ? '키워드' : '메모'}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {guideline._count?.generatedContent || 0}개 콘텐츠
                    </Badge>
                  </div>
                </div>
                <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(guideline)}
                    className="h-8 w-8 p-0"
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(guideline.id)}
                    className="h-8 w-8 p-0 text-red-500 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              {guideline.type === 'memo' ? (
                <p className="text-sm text-gray-600 line-clamp-3">
                  {guideline.memo}
                </p>
              ) : (
                <div className="space-y-2">
                  {guideline.keywords && Object.entries(guideline.keywords).map(([category, items]) => (
                    items.length > 0 && (
                      <div key={category} className="flex flex-wrap gap-1">
                        {items.slice(0, 3).map((item, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {item}
                          </Badge>
                        ))}
                        {items.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{items.length - 3}
                          </Badge>
                        )}
                      </div>
                    )
                  ))}
                </div>
              )}
              <div className="mt-3 text-xs text-gray-500">
                {new Date(guideline.createdAt).toLocaleDateString()}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {guidelines.length === 0 && (
        <div className="text-center py-12">
          <div className="max-w-md mx-auto">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Target className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              아직 가이드라인이 없습니다
            </h3>
            <p className="text-gray-600 mb-6">
              첫 번째 가이드라인을 생성하여 AI 콘텐츠 생성을 시작하세요.
            </p>
            <Button 
              onClick={() => { resetForm(); setIsCreateDialogOpen(true); }}
              className="btn-gradient"
            >
              <Plus className="mr-2 h-4 w-4" />
              첫 가이드라인 생성
            </Button>
          </div>
        </div>
      )}
    </div>
  );
} 