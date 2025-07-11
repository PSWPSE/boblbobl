'use client';

import React, { useEffect, useState } from 'react';
import { Calendar, Copy, Edit2, FileText, Filter, History, Search, Trash2, MessageSquare, Link as LinkIcon, Wand2, Target, Download, BarChart3, Clock, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useAuthStore } from '@/lib/auth';
import { apiDelete, apiGet } from '@/lib/api';
import { showError, showSuccess } from '@/lib/notifications';
import Link from 'next/link';

interface GeneratedContent {
  id: string;
  title: string;
  content: string;
  summary: string;
  tags: string[];
  status: 'draft' | 'published' | 'archived';
  contentType: string;
  createdAt: string;
  updatedAt: string;
  metadata: {
    wordCount: number;
    charCount: number;
    readingTime: number;
    generationType?: 'topic' | 'news' | 'url';
    style?: string;
    length?: string;
    sourceUrl?: string;
    originalTitle?: string;
    model?: string;
    generatedAt?: string;
  };
}

interface ContentStats {
  totalContents: number;
  byType: {
    topic: number;
    news: number;
    url: number;
  };
  byStyle: {
    [key: string]: number;
  };
  recentWeek: number;
  averageScore?: number;
}

export default function HistoryPage() {
  const { user, isAuthenticated } = useAuthStore();
  const [contents, setContents] = useState<GeneratedContent[]>([]);
  const [stats, setStats] = useState<ContentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedContent, setSelectedContent] = useState<GeneratedContent | null>(null);

  const [filters, setFilters] = useState({
    search: '',
    type: '',
    style: '',
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });

  // 콘텐츠 목록 조회
  const fetchContents = async () => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
        ...(filters.search && { search: filters.search }),
        ...(filters.type && { type: filters.type }),
        ...(filters.style && { style: filters.style })
      });

      const data = await apiGet(`/api/content?${queryParams}`);
      setContents(data.data || []);
    } catch (error) {
      console.error('콘텐츠 목록 조회 오류:', error);
      showError('콘텐츠 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 통계 조회 
  const fetchStats = async () => {
    if (!isAuthenticated) return;

    try {
      const data = await apiGet('/api/content/stats');
      setStats(data.data);
    } catch (error) {
      console.error('통계 조회 오류:', error);
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

  // 전체 콘텐츠 복사
  const copyFullContent = (content: GeneratedContent) => {
    const fullText = `${content.title}\n\n${content.content}\n\n${content.tags.map(tag => `#${tag}`).join(' ')}`;
    copyToClipboard(fullText);
  };

  // 생성 타입별 아이콘
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'topic':
        return <MessageSquare className="w-4 h-4" />;
      case 'news':
        return <FileText className="w-4 h-4" />;
      case 'url':
        return <LinkIcon className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  // 생성 타입별 라벨
  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'topic':
        return '주제 입력';
      case 'news':
        return '뉴스 변환';
      case 'url':
        return 'URL 자동';
      default:
        return '기타';
    }
  };

  // 날짜 포맷팅
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return '오늘 ' + date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      return '어제 ' + date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays < 7) {
      return `${diffDays}일 전`;
    } else {
      return date.toLocaleDateString('ko-KR', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };

  // 검색 핸들러
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchContents();
  };

  // 초기 데이터 로드
  useEffect(() => {
    if (isAuthenticated) {
      fetchContents();
      fetchStats();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchContents();
    }
  }, [filters.type, filters.style, filters.sortBy, filters.sortOrder]);

  // 로그인하지 않은 경우
  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-16">
          <History className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">로그인이 필요합니다</h2>
          <p className="text-gray-600 mb-6">
            생성된 콘텐츠 히스토리를 확인하려면 로그인해주세요.
          </p>
          <Link href="/auth/login">
            <Button size="lg">
              로그인하기
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* 헤더 */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">콘텐츠 히스토리</h1>
            <p className="text-gray-600 mt-2">
              AI로 생성한 모든 콘텐츠를 관리하고 다시 사용할 수 있습니다.
            </p>
          </div>
          <Link href="/generate">
            <Button size="lg" className="bg-gradient-to-r from-green-500 to-blue-600">
              <Wand2 className="w-5 h-5 mr-2" />
              새 콘텐츠 생성
            </Button>
          </Link>
        </div>
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
                <MessageSquare className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">주제 기반</p>
                  <p className="text-2xl font-bold">{stats.byType.topic || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <LinkIcon className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">URL 추출</p>
                  <p className="text-2xl font-bold">{stats.byType.url || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <Clock className="h-8 w-8 text-orange-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">최근 일주일</p>
                  <p className="text-2xl font-bold">{stats.recentWeek || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 필터 및 검색 */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Input
                type="text"
                placeholder="제목이나 내용으로 검색..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              />
            </div>
            
            <div className="flex gap-2">
              <Select value={filters.type} onValueChange={(value) => setFilters(prev => ({ ...prev, type: value }))}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="타입" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">전체</SelectItem>
                  <SelectItem value="topic">주제 입력</SelectItem>
                  <SelectItem value="news">뉴스 변환</SelectItem>
                  <SelectItem value="url">URL 추출</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filters.style} onValueChange={(value) => setFilters(prev => ({ ...prev, style: value }))}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="스타일" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">전체</SelectItem>
                  <SelectItem value="친근한">친근한</SelectItem>
                  <SelectItem value="전문적인">전문적인</SelectItem>
                  <SelectItem value="유머러스한">유머러스한</SelectItem>
                  <SelectItem value="감성적인">감성적인</SelectItem>
                </SelectContent>
              </Select>

              <Select value={`${filters.sortBy}-${filters.sortOrder}`} onValueChange={(value) => {
                const [sortBy, sortOrder] = value.split('-');
                setFilters(prev => ({ ...prev, sortBy, sortOrder }));
              }}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="정렬" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="createdAt-desc">최신순</SelectItem>
                  <SelectItem value="createdAt-asc">오래된순</SelectItem>
                  <SelectItem value="title-asc">제목순</SelectItem>
                  <SelectItem value="wordCount-desc">길이순</SelectItem>
                </SelectContent>
              </Select>

              <Button type="submit">
                <Search className="w-4 h-4" />
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* 콘텐츠 목록 */}
      {loading ? (
        <div className="text-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">콘텐츠를 불러오는 중...</p>
        </div>
      ) : contents.length === 0 ? (
        <div className="text-center py-16">
          <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">아직 생성된 콘텐츠가 없습니다</h2>
          <p className="text-gray-600 mb-6">
            AI로 첫 번째 블로그 콘텐츠를 생성해보세요!
          </p>
          <Link href="/generate">
            <Button size="lg">
              <Wand2 className="w-5 h-5 mr-2" />
              콘텐츠 생성하기
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {contents.map((content) => (
            <Card key={content.id} className="hover:shadow-lg transition-shadow duration-200">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {getTypeIcon(content.metadata.generationType || 'topic')}
                      <Badge variant="outline" className="text-xs">
                        {getTypeLabel(content.metadata.generationType || 'topic')}
                      </Badge>
                      {content.metadata.style && (
                        <Badge variant="secondary" className="text-xs">
                          {content.metadata.style}
                        </Badge>
                      )}
                    </div>
                    <CardTitle className="text-lg leading-tight hover:text-blue-600 cursor-pointer" 
                              onClick={() => setSelectedContent(content)}>
                      {content.title}
                    </CardTitle>
                    <CardDescription className="text-sm text-gray-600 mt-1">
                      {content.summary}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                  <div className="flex items-center gap-4">
                    <span>{content.metadata.wordCount || 0}단어</span>
                    <span>{content.metadata.readingTime || 1}분 읽기</span>
                    <span>{formatDate(content.createdAt)}</span>
                  </div>
                  {content.metadata.sourceUrl && (
                    <LinkIcon className="w-4 h-4 text-blue-500" title="URL에서 추출됨" />
                  )}
                </div>

                <div className="flex flex-wrap gap-1 mb-4">
                  {content.tags.slice(0, 4).map((tag, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      #{tag}
                    </Badge>
                  ))}
                  {content.tags.length > 4 && (
                    <Badge variant="outline" className="text-xs">
                      +{content.tags.length - 4}
                    </Badge>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => copyFullContent(content)}>
                    <Copy className="w-4 h-4 mr-1" />
                    복사
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setSelectedContent(content)}>
                    <FileText className="w-4 h-4 mr-1" />
                    보기
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => deleteContent(content.id)}>
                    <Trash2 className="w-4 h-4 mr-1" />
                    삭제
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* 콘텐츠 상세보기 모달 */}
      {selectedContent && (
        <Dialog open={!!selectedContent} onOpenChange={() => setSelectedContent(null)}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <div className="flex items-center gap-2 mb-2">
                {getTypeIcon(selectedContent.metadata.generationType || 'topic')}
                <Badge variant="outline">
                  {getTypeLabel(selectedContent.metadata.generationType || 'topic')}
                </Badge>
                {selectedContent.metadata.style && (
                  <Badge variant="secondary">
                    {selectedContent.metadata.style}
                  </Badge>
                )}
              </div>
              <DialogTitle className="text-xl">{selectedContent.title}</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* 메타데이터 */}
              <div className="grid grid-cols-4 gap-4 text-center bg-gray-50 rounded-lg p-4">
                <div>
                  <div className="font-semibold text-gray-900">{selectedContent.metadata.wordCount || 0}</div>
                  <div className="text-sm text-gray-600">단어</div>
                </div>
                <div>
                  <div className="font-semibold text-gray-900">{selectedContent.metadata.charCount || 0}</div>
                  <div className="text-sm text-gray-600">글자</div>
                </div>
                <div>
                  <div className="font-semibold text-gray-900">{selectedContent.metadata.readingTime || 1}분</div>
                  <div className="text-sm text-gray-600">읽기 시간</div>
                </div>
                <div>
                  <div className="font-semibold text-gray-900">{formatDate(selectedContent.createdAt)}</div>
                  <div className="text-sm text-gray-600">생성일</div>
                </div>
              </div>

              {/* 요약 */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">📋 요약</h3>
                <p className="text-gray-700 bg-blue-50 p-3 rounded-lg">{selectedContent.summary}</p>
              </div>

              {/* 본문 */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">📄 본문</h3>
                <div className="bg-gray-50 p-4 rounded-lg max-h-64 overflow-y-auto">
                  <div className="whitespace-pre-wrap text-gray-700">{selectedContent.content}</div>
                </div>
              </div>

              {/* 태그 */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">🏷️ 태그</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedContent.tags.map((tag, index) => (
                    <Badge key={index} variant="secondary">
                      #{tag}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* 원본 정보 */}
              {selectedContent.metadata.sourceUrl && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">🔗 원본 정보</h3>
                  <div className="bg-yellow-50 p-3 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">원본 제목: {selectedContent.metadata.originalTitle}</p>
                    <a href={selectedContent.metadata.sourceUrl} 
                       target="_blank" 
                       rel="noopener noreferrer"
                       className="text-blue-600 hover:underline text-sm">
                      {selectedContent.metadata.sourceUrl}
                    </a>
                  </div>
                </div>
              )}

              {/* 액션 버튼 */}
              <div className="flex gap-3 pt-4 border-t">
                <Button onClick={() => copyFullContent(selectedContent)} className="flex-1">
                  <Copy className="w-4 h-4 mr-2" />
                  전체 복사
                </Button>
                <Button variant="outline" onClick={() => copyToClipboard(selectedContent.title)} className="flex-1">
                  <Copy className="w-4 h-4 mr-2" />
                  제목만 복사
                </Button>
                <Button variant="outline" onClick={() => copyToClipboard(selectedContent.content)} className="flex-1">
                  <Copy className="w-4 h-4 mr-2" />
                  본문만 복사
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
} 