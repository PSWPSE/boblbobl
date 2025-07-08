'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, FileText, Target } from 'lucide-react';
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
import { toast } from 'sonner';

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
  const [guidelines, setGuidelines] = useState<ContentGuideline[]>([]);
  const [keywordOptions, setKeywordOptions] = useState<KeywordOptions | null>(null);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingGuideline, setEditingGuideline] = useState<ContentGuideline | null>(null);
  // toast는 import로 가져온 함수입니다

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
              const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/guidelines`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('가이드라인을 불러오는데 실패했습니다.');
      }

      const data = await response.json();
      setGuidelines(data.data);
    } catch (error) {
      toast.error('가이드라인을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 키워드 옵션 조회
  const fetchKeywordOptions = async () => {
    try {
              const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/guidelines/keywords`);
      const data = await response.json();
      setKeywordOptions(data.data);
    } catch (error) {
      console.error('키워드 옵션 조회 실패:', error);
    }
  };

  useEffect(() => {
    fetchGuidelines();
    fetchKeywordOptions();
  }, []);

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
              const url = editingGuideline 
          ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/guidelines/${editingGuideline.id}`
          : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/guidelines`;
      
      const method = editingGuideline ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('가이드라인 저장에 실패했습니다.');
      }

      toast.success(editingGuideline 
        ? '가이드라인이 수정되었습니다.'
        : '가이드라인이 생성되었습니다.');

      fetchGuidelines();
      resetForm();
      setIsCreateDialogOpen(false);
    } catch (error) {
      toast.error('가이드라인 저장에 실패했습니다.');
    }
  };

  // 가이드라인 삭제
  const handleDelete = async (id: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;

    try {
              const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/guidelines/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('가이드라인 삭제에 실패했습니다.');
      }

      toast.success('가이드라인이 삭제되었습니다.');

      fetchGuidelines();
    } catch (error) {
      toast.error('가이드라인 삭제에 실패했습니다.');
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

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">로딩 중...</div>
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
            <Button onClick={resetForm}>
              <Plus className="mr-2 h-4 w-4" />
              새 가이드라인
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingGuideline ? '가이드라인 수정' : '새 가이드라인 생성'}
              </DialogTitle>
              <DialogDescription>
                콘텐츠 생성에 사용할 가이드라인을 설정하세요.
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">가이드라인 이름</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="가이드라인 이름을 입력하세요"
                  required
                />
              </div>

              <div>
                <Label htmlFor="type">가이드라인 타입</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value: 'keywords' | 'memo') => 
                    setFormData(prev => ({ ...prev, type: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="keywords">키워드 선택</SelectItem>
                    <SelectItem value="memo">직접 메모</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.type === 'memo' ? (
                <div>
                  <Label htmlFor="memo">메모</Label>
                  <Textarea
                    id="memo"
                    value={formData.memo}
                    onChange={(e) => setFormData(prev => ({ ...prev, memo: e.target.value }))}
                    placeholder="가이드라인 메모를 입력하세요"
                    rows={6}
                    required
                  />
                </div>
              ) : (
                keywordOptions && (
                  <div className="space-y-4">
                    {Object.entries(keywordOptions).map(([category, options]) => (
                      <div key={category}>
                        <Label className="text-sm font-medium capitalize">
                          {category === 'tone' && '어조'}
                          {category === 'structure' && '구조'}
                          {category === 'readability' && '가독성'}
                          {category === 'seo' && 'SEO'}
                          {category === 'engagement' && '참여도'}
                          {category === 'format' && '형식'}
                        </Label>
                        <div className="grid grid-cols-2 gap-2 mt-2">
                          {options.map((option: string) => (
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
                                className="text-sm font-normal cursor-pointer"
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

              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateDialogOpen(false)}
                >
                  취소
                </Button>
                <Button type="submit">
                  {editingGuideline ? '수정' : '생성'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {guidelines.map((guideline) => (
          <Card key={guideline.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{guideline.name}</CardTitle>
                  <CardDescription className="mt-1">
                    {new Date(guideline.createdAt).toLocaleDateString()}
                  </CardDescription>
                </div>
                <div className="flex space-x-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(guideline)}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(guideline.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <div className="flex items-center space-x-2 mt-2">
                <Badge variant={guideline.type === 'keywords' ? 'default' : 'secondary'}>
                  {guideline.type === 'keywords' ? (
                    <><Target className="w-3 h-3 mr-1" /> 키워드</>
                  ) : (
                    <><FileText className="w-3 h-3 mr-1" /> 메모</>
                  )}
                </Badge>
                <Badge variant="outline">
                  {guideline._count.generatedContent}개 콘텐츠
                </Badge>
              </div>
            </CardHeader>
            
            <CardContent>
              {guideline.type === 'keywords' && guideline.keywords && (
                <div className="space-y-2">
                  {Object.entries(guideline.keywords).map(([category, values]) => (
                    values.length > 0 && (
                      <div key={category} className="text-sm">
                        <span className="font-medium capitalize">
                          {category === 'tone' && '어조: '}
                          {category === 'structure' && '구조: '}
                          {category === 'readability' && '가독성: '}
                          {category === 'seo' && 'SEO: '}
                          {category === 'engagement' && '참여도: '}
                          {category === 'format' && '형식: '}
                        </span>
                        <span className="text-gray-600">
                          {values.join(', ')}
                        </span>
                      </div>
                    )
                  ))}
                </div>
              )}
              
              {guideline.type === 'memo' && guideline.memo && (
                <p className="text-sm text-gray-600 line-clamp-3">
                  {guideline.memo}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {guidelines.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-500 mb-4">
            <Target className="h-16 w-16 mx-auto mb-4 opacity-50" />
            <p className="text-xl">아직 가이드라인이 없습니다.</p>
            <p className="text-sm mt-2">새 가이드라인을 생성해보세요.</p>
          </div>
        </div>
      )}
    </div>
  );
} 