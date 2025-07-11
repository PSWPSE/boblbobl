'use client';

import React, { useEffect, useState } from 'react';
import { Calendar, Copy, Edit2, FileText, Filter, History, Search, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

import { apiDelete, apiGet } from '@/lib/api';
import { showError, showSuccess } from '@/lib/notifications';

interface GeneratedContent {
  id: string;
  title: string;
  content: string;
  summary: string;
  tags: string[];
  status: 'draft' | 'published' | 'archived';
  createdAt: string;
  updatedAt: string;
  metadata: {
    wordCount: number;
    charCount: number;
    readingTime: number;
  };
  sourceData: {
    filename: string;
    fileType: string;
  };
  guideline: {
    name: string;
    type: string;
  };
}

interface ContentStats {
  totalContents: number;
  draftContents: number;
  publishedContents: number;
  recentContents: number;
}

export default function HistoryPage() {
  const [contents, setContents] = useState<GeneratedContent[]>([]);
  const [stats, setStats] = useState<ContentStats | null>(null);
  const [loading, setLoading] = useState(true);

  const [filters, setFilters] = useState({
    search: '',
    status: '',
    page: 1,
    limit: 10
  });

  // 콘텐츠 목록 조회
  const fetchContents = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page: filters.page.toString(),
        limit: filters.limit.toString(),
        ...(filters.search && { search: filters.search }),
        ...(filters.status && { status: filters.status })
      });

      const data = await apiGet(`/api/content?${queryParams}`);
      setContents(data.data || []);
    } catch (error) {
      showError('콘텐츠 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 통계 조회
  const fetchStats = async () => {
    try {
      const data = await apiGet('/api/content/stats');
      setStats(data.data);
    } catch (error) {
      showError('통계를 불러오는데 실패했습니다.');
    }
  };

  // 콘텐츠 삭제
  const deleteContent = async (id: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;

    try {
      await apiDelete(`/api/content/${id}`);
      showSuccess('콘텐츠가 삭제되었습니다.');
      fetchContents();
      fetchStats();
    } catch (error) {
      showError('콘텐츠 삭제에 실패했습니다.');
    }
  };

  // 클립보드 복사
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      showSuccess('클립보드에 복사되었습니다.');
    } catch (error) {
      showError('복사에 실패했습니다.');
    }
  };

  // 상태별 배지 색상
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'published':
        return <Badge className="bg-green-100 text-green-800">게시됨</Badge>;
      case 'draft':
        return <Badge variant="secondary">초안</Badge>;
      case 'archived':
        return <Badge variant="outline">보관됨</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  // 날짜 포맷팅
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // 검색 핸들러
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setFilters(prev => ({ ...prev, page: 1 }));
    fetchContents();
  };

  // 초기 데이터 로드
  useEffect(() => {
    fetchContents();
    fetchStats();
  }, [filters.page, filters.status]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">생성 기록</h1>
        <p className="text-gray-600 mt-2">
          AI로 생성한 모든 콘텐츠를 관리하고 다시 사용할 수 있습니다.
        </p>
      </div>

      {/* 통계 카드 */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <FileText className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">전체 콘텐츠</p>
                  <p className="text-2xl font-bold">{stats.totalContents}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <Edit2 className="h-8 w-8 text-yellow-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">초안</p>
                  <p className="text-2xl font-bold">{stats.draftContents}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <Calendar className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">게시됨</p>
                  <p className="text-2xl font-bold">{stats.publishedContents}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <History className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">최근 7일</p>
                  <p className="text-2xl font-bold">{stats.recentContents}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 필터 및 검색 */}
      <Card className="mb-8">
        <CardContent className="pt-6">
          <form onSubmit={handleSearch} className="flex gap-4 items-end">
            <div className="flex-1">
              <Label htmlFor="search">검색</Label>
              <div className="relative mt-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  id="search"
                  placeholder="제목이나 내용으로 검색..."
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="w-48">
              <Label htmlFor="status">상태</Label>
              <Select
                value={filters.status}
                onValueChange={(value) => setFilters(prev => ({ ...prev, status: value, page: 1 }))}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="모든 상태" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">모든 상태</SelectItem>
                  <SelectItem value="draft">초안</SelectItem>
                  <SelectItem value="published">게시됨</SelectItem>
                  <SelectItem value="archived">보관됨</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button type="submit" disabled={loading}>
              <Filter className="h-4 w-4 mr-2" />
              필터 적용
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* 콘텐츠 목록 */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-8">
            <div className="text-gray-500">로딩 중...</div>
          </div>
        ) : contents.length === 0 ? (
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <div className="text-center">
                <History className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p className="text-gray-600">생성된 콘텐츠가 없습니다.</p>
                <p className="text-sm text-gray-500 mt-2">
                  AI 콘텐츠 생성 페이지에서 새로운 콘텐츠를 만들어보세요.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          contents.map((content) => (
            <Card key={content.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold mb-2">{content.title}</h3>
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                      {content.summary}
                    </p>
                    
                    <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
                      <span>{content.metadata.wordCount}단어</span>
                      <span>{content.metadata.readingTime}분 읽기</span>
                      <span>소스: {content.sourceData.filename}</span>
                      <span>가이드라인: {content.guideline.name}</span>
                    </div>
                    
                    <div className="flex items-center space-x-2 mb-3">
                      {getStatusBadge(content.status)}
                      <Badge variant="outline">{content.sourceData.fileType.toUpperCase()}</Badge>
                      {content.tags.slice(0, 3).map((tag, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                    
                    <p className="text-xs text-gray-400">
                      생성: {formatDate(content.createdAt)}
                      {content.updatedAt !== content.createdAt && (
                        <> · 수정: {formatDate(content.updatedAt)}</>
                      )}
                    </p>
                  </div>
                  
                  <div className="flex space-x-2 ml-4">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <FileText className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>{content.title}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label>요약</Label>
                            <div className="mt-1 p-3 bg-gray-50 rounded text-sm">
                              {content.summary}
                            </div>
                          </div>
                          <div>
                            <Label>본문</Label>
                            <div className="mt-1 p-4 bg-gray-50 rounded max-h-96 overflow-y-auto">
                              <pre className="whitespace-pre-wrap text-sm">
                                {content.content}
                              </pre>
                            </div>
                          </div>
                          <div>
                            <Label>태그</Label>
                            <div className="mt-1 flex flex-wrap gap-2">
                              {content.tags.map((tag, index) => (
                                <Badge key={index} variant="secondary">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(content.content)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteContent(content.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
} 