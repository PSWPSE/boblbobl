'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAuthStore } from '@/lib/auth';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  AlertTriangle, 
  BarChart3,
  CheckCircle,
  Copy,
  Eye,
  Globe,
  Lightbulb,
  Search,
  Target,
  Trash2,
  TrendingUp
} from 'lucide-react';
import { apiDelete, apiGet, apiPost } from '@/lib/api';
import { showError, showSuccess } from '@/lib/notifications';

interface KeywordAnalysis {
  keyword: string;
  frequency: number;
  density: number;
  positions: number[];
  isOptimal: boolean;
  recommendation: string;
}

interface SEOAnalysis {
  score: number;
  keywords: KeywordAnalysis[];
  titleAnalysis: {
    length: number;
    isOptimal: boolean;
    hasKeyword: boolean;
    recommendation: string;
  };
  metaDescription: {
    length: number;
    isOptimal: boolean;
    hasKeyword: boolean;
    recommendation: string;
  };
  headingStructure: {
    h1Count: number;
    h2Count: number;
    h3Count: number;
    isOptimal: boolean;
    recommendation: string;
  };
  contentAnalysis: {
    wordCount: number;
    readability: number;
    avgSentenceLength: number;
    isOptimal: boolean;
    recommendation: string;
  };
  recommendations: string[];
}

interface NaverBlogOptimization {
  naverKeywords: string[];
  trendingTopics: string[];
  relatedSearches: string[];
  naverSEOTips: string[];
  optimizedTitle: string;
  optimizedDescription: string;
  hashtags: string[];
}

interface SEOAnalysisData {
  id: string;
  title: string;
  originalTitle: string;
  seoScore: number;
  keywordCount: number;
  createdAt: string;
  tags: string[];
}

export default function SEOPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeTab, setActiveTab] = useState<'analyze' | 'naver' | 'history'>('analyze');
  const [analysisResult, setAnalysisResult] = useState<{
    seoAnalysis: SEOAnalysis;
    naverOptimization: NaverBlogOptimization;
    metaTags: string;
    structuredData: string;
  } | null>(null);
  
  const [userAnalyses, setUserAnalyses] = useState<SEOAnalysisData[]>([]);
  const [selectedAnalysis, setSelectedAnalysis] = useState<any>(null);
  
  // 폼 상태
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    metaDescription: '',
    targetKeywords: '',
    tags: ''
  });

  useEffect(() => {
    if (!user) {
      router.push('/auth/login');
      return;
    }

    fetchUserAnalyses();
  }, [user, router]);

  const fetchUserAnalyses = async () => {
    try {
      const data = await apiGet('/api/seo/my-analyses');
      if (data.success) {
        setUserAnalyses(data.data.analyses);
      }
    } catch (error) {
      showError('SEO 분석 기록을 불러오는데 실패했습니다.');
    }
  };

  const handleSEOAnalysis = async () => {
    if (!formData.title || !formData.content) {
      showError('제목과 내용을 입력해주세요.');
      return;
    }

    setIsAnalyzing(true);
    try {
      const keywordsArray = formData.targetKeywords
        .split(',')
        .map(keyword => keyword.trim())
        .filter(keyword => keyword);

      const data = await apiPost('/api/seo/analyze', {
        title: formData.title,
        content: formData.content,
        metaDescription: formData.metaDescription,
        targetKeywords: keywordsArray
      });
      
      if (data.success) {
        setAnalysisResult(data.data);
        fetchUserAnalyses();
        setActiveTab('analyze');
        showSuccess('SEO 분석이 완료되었습니다.');
      } else {
        showError(`SEO 분석 실패: ${data.error}`);
      }
    } catch (error) {
      showError('SEO 분석 중 오류가 발생했습니다.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleNaverOptimization = async () => {
    if (!formData.title || !formData.content) {
      showError('제목과 내용을 입력해주세요.');
      return;
    }

    setIsAnalyzing(true);
    try {
      const tagsArray = formData.tags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag);

      const data = await apiPost('/api/seo/naver-optimization', {
        title: formData.title,
        content: formData.content,
        tags: tagsArray
      });
      
      if (data.success) {
        setAnalysisResult(prevResult => ({
          ...prevResult!,
          naverOptimization: data.data
        }));
        setActiveTab('naver');
        showSuccess('네이버 최적화 분석이 완료되었습니다.');
      } else {
        showError(`네이버 최적화 분석 실패: ${data.error}`);
      }
    } catch (error) {
      showError('네이버 최적화 분석 중 오류가 발생했습니다.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleDeleteAnalysis = async (analysisId: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;

    try {
      const data = await apiDelete(`/api/seo/${analysisId}`);
      
      if (data.success) {
        fetchUserAnalyses();
        if (selectedAnalysis?.id === analysisId) {
          setSelectedAnalysis(null);
        }
        showSuccess('분석이 삭제되었습니다.');
      } else {
        showError(`삭제 실패: ${data.error}`);
      }
    } catch (error) {
      showError('삭제 중 오류가 발생했습니다.');
    }
  };

  const handleViewAnalysis = async (analysisId: string) => {
    try {
      const data = await apiGet(`/api/seo/${analysisId}`);
      
      if (data.success) {
        setSelectedAnalysis(data.data);
      } else {
        showError(`분석 조회 실패: ${data.error}`);
      }
    } catch (error) {
      showError('분석 조회 중 오류가 발생했습니다.');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    showSuccess('클립보드에 복사되었습니다.');
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return '우수';
    if (score >= 60) return '보통';
    return '개선 필요';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🔍 SEO 분석 및 최적화
          </h1>
          <p className="text-gray-600">
            콘텐츠를 분석하고 검색 엔진 최적화 및 네이버 블로그 최적화 제안을 받아보세요
          </p>
        </div>

        <div className="flex gap-4 mb-6">
          <Button
            variant={activeTab === 'analyze' ? 'default' : 'outline'}
            onClick={() => setActiveTab('analyze')}
            className="flex items-center gap-2"
          >
            <Search className="h-4 w-4" />
            SEO 분석
          </Button>
          <Button
            variant={activeTab === 'naver' ? 'default' : 'outline'}
            onClick={() => setActiveTab('naver')}
            className="flex items-center gap-2"
          >
            <Globe className="h-4 w-4" />
            네이버 최적화
          </Button>
          <Button
            variant={activeTab === 'history' ? 'default' : 'outline'}
            onClick={() => setActiveTab('history')}
            className="flex items-center gap-2"
          >
            <BarChart3 className="h-4 w-4" />
            분석 기록
          </Button>
        </div>

        {(activeTab === 'analyze' || activeTab === 'naver') && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    콘텐츠 입력
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
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
                      rows={8}
                    />
                  </div>

                  <div>
                    <Label htmlFor="metaDescription">메타 설명 (선택사항)</Label>
                    <Textarea
                      id="metaDescription"
                      value={formData.metaDescription}
                      onChange={(e) => setFormData({...formData, metaDescription: e.target.value})}
                      placeholder="검색 결과에 표시될 설명을 입력하세요"
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label htmlFor="targetKeywords">타겟 키워드 (쉼표로 구분)</Label>
                    <Input
                      id="targetKeywords"
                      value={formData.targetKeywords}
                      onChange={(e) => setFormData({...formData, targetKeywords: e.target.value})}
                      placeholder="예: 블로그, 마케팅, SEO"
                    />
                  </div>

                  {activeTab === 'naver' && (
                    <div>
                      <Label htmlFor="tags">태그 (쉼표로 구분)</Label>
                      <Input
                        id="tags"
                        value={formData.tags}
                        onChange={(e) => setFormData({...formData, tags: e.target.value})}
                        placeholder="예: 네이버블로그, 마케팅, 팁"
                      />
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button
                      onClick={handleSEOAnalysis}
                      disabled={isAnalyzing}
                      className="flex items-center gap-2"
                    >
                      {isAnalyzing ? (
                        <>
                          <Search className="h-4 w-4 animate-spin" />
                          분석 중...
                        </>
                      ) : (
                        <>
                          <Search className="h-4 w-4" />
                          SEO 분석
                        </>
                      )}
                    </Button>
                    
                    <Button
                      variant="outline"
                      onClick={handleNaverOptimization}
                      disabled={isAnalyzing}
                      className="flex items-center gap-2"
                    >
                      <Globe className="h-4 w-4" />
                      네이버 최적화
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div>
              <Card>
                <CardHeader>
                  <CardTitle>분석 가이드</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="border-l-4 border-blue-500 pl-4">
                      <h4 className="font-medium">SEO 분석</h4>
                      <p className="text-sm text-gray-600">
                        제목, 키워드, 가독성, 헤딩 구조 등을 종합적으로 분석합니다
                      </p>
                    </div>
                    
                    <div className="border-l-4 border-green-500 pl-4">
                      <h4 className="font-medium">네이버 최적화</h4>
                      <p className="text-sm text-gray-600">
                        네이버 블로그 플랫폼에 특화된 최적화 제안을 제공합니다
                      </p>
                    </div>
                    
                    <div className="border-l-4 border-purple-500 pl-4">
                      <h4 className="font-medium">키워드 분석</h4>
                      <p className="text-sm text-gray-600">
                        키워드 밀도와 분포를 분석하여 최적화 방향을 제시합니다
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* 분석 결과 표시 */}
        {analysisResult && activeTab === 'analyze' && (
          <div className="mt-8 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  SEO 분석 결과
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  <div className="text-center">
                    <div className={`text-3xl font-bold ${getScoreColor(analysisResult.seoAnalysis.score)}`}>
                      {analysisResult.seoAnalysis.score}
                    </div>
                    <div className="text-sm text-gray-600">SEO 점수</div>
                    <div className="text-xs text-gray-500">{getScoreLabel(analysisResult.seoAnalysis.score)}</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600">
                      {analysisResult.seoAnalysis.contentAnalysis.wordCount}
                    </div>
                    <div className="text-sm text-gray-600">단어 수</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600">
                      {analysisResult.seoAnalysis.contentAnalysis.readability}
                    </div>
                    <div className="text-sm text-gray-600">가독성</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-3xl font-bold text-purple-600">
                      {analysisResult.seoAnalysis.keywords.length}
                    </div>
                    <div className="text-sm text-gray-600">키워드</div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-medium mb-3">키워드 분석</h3>
                    <div className="space-y-2">
                      {analysisResult.seoAnalysis.keywords.map((keyword, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <span className="font-medium">{keyword.keyword}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-600">{keyword.density}%</span>
                            {keyword.isOptimal ? (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : (
                              <AlertTriangle className="h-4 w-4 text-yellow-500" />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="font-medium mb-3">개선 제안</h3>
                    <div className="space-y-2">
                      {analysisResult.seoAnalysis.recommendations.map((rec, index) => (
                        <div key={index} className="flex items-start gap-2 p-2 bg-yellow-50 rounded">
                          <Lightbulb className="h-4 w-4 text-yellow-600 mt-0.5" />
                          <span className="text-sm">{rec}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-medium mb-2">메타 태그</h3>
                    <div className="bg-gray-100 p-3 rounded text-sm font-mono">
                      <pre className="whitespace-pre-wrap">{analysisResult.metaTags}</pre>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(analysisResult.metaTags)}
                      className="mt-2"
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      복사
                    </Button>
                  </div>

                  <div>
                    <h3 className="font-medium mb-2">구조화된 데이터</h3>
                    <div className="bg-gray-100 p-3 rounded text-sm font-mono max-h-40 overflow-y-auto">
                      <pre className="whitespace-pre-wrap">{analysisResult.structuredData}</pre>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(analysisResult.structuredData)}
                      className="mt-2"
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      복사
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* 네이버 최적화 결과 표시 */}
        {analysisResult?.naverOptimization && activeTab === 'naver' && (
          <div className="mt-8 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  네이버 블로그 최적화 결과
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-medium mb-3">최적화된 제목</h3>
                    <div className="p-3 bg-blue-50 rounded">
                      <p className="text-sm">{analysisResult.naverOptimization.optimizedTitle}</p>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-medium mb-3">최적화된 설명</h3>
                    <div className="p-3 bg-green-50 rounded">
                      <p className="text-sm">{analysisResult.naverOptimization.optimizedDescription}</p>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-medium mb-3">추천 키워드</h3>
                    <div className="flex flex-wrap gap-2">
                      {analysisResult.naverOptimization.naverKeywords.map((keyword, index) => (
                        <Badge key={index} variant="secondary">
                          {keyword}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="font-medium mb-3">해시태그</h3>
                    <div className="flex flex-wrap gap-2">
                      {analysisResult.naverOptimization.hashtags.map((hashtag, index) => (
                        <Badge key={index} variant="outline">
                          {hashtag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-6">
                  <h3 className="font-medium mb-3">네이버 SEO 팁</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {analysisResult.naverOptimization.naverSEOTips.map((tip, index) => (
                      <div key={index} className="flex items-start gap-2 p-3 bg-gray-50 rounded">
                        <TrendingUp className="h-4 w-4 text-green-600 mt-0.5" />
                        <span className="text-sm">{tip}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* 분석 기록 */}
        {activeTab === 'history' && (
          <div>
            <Card>
              <CardHeader>
                <CardTitle>SEO 분석 기록</CardTitle>
              </CardHeader>
              <CardContent>
                {userAnalyses.length === 0 ? (
                  <div className="text-center py-8">
                    <BarChart3 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">아직 분석 기록이 없습니다.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {userAnalyses.map((analysis) => (
                      <div key={analysis.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-medium">{analysis.originalTitle}</h3>
                          <div className="flex items-center gap-2">
                            <span className={`text-sm font-medium ${getScoreColor(analysis.seoScore)}`}>
                              {analysis.seoScore}점
                            </span>
                            <Badge variant="secondary">{analysis.keywordCount}개 키워드</Badge>
                          </div>
                        </div>
                        
                        <div className="flex flex-wrap gap-1 mb-3">
                          {analysis.tags.map((tag, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-500">
                            {new Date(analysis.createdAt).toLocaleDateString()}
                          </span>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewAnalysis(analysis.id)}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              보기
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteAnalysis(analysis.id)}
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

        {/* 분석 상세 모달 */}
        {selectedAnalysis && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setSelectedAnalysis(null)}>
            <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">SEO 분석 상세</h2>
                <Button variant="outline" onClick={() => setSelectedAnalysis(null)}>
                  닫기
                </Button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium mb-2">분석 제목</h3>
                  <p className="text-gray-600">{selectedAnalysis.originalTitle}</p>
                </div>
                
                <div>
                  <h3 className="font-medium mb-2">SEO 점수</h3>
                  <div className={`text-2xl font-bold ${getScoreColor(selectedAnalysis.seoAnalysis.score)}`}>
                    {selectedAnalysis.seoAnalysis.score}점
                  </div>
                  <Progress value={selectedAnalysis.seoAnalysis.score} className="mt-2" />
                </div>
                
                <div>
                  <h3 className="font-medium mb-2">메타 태그</h3>
                  <div className="bg-gray-100 p-3 rounded text-sm font-mono">
                    <pre className="whitespace-pre-wrap">{selectedAnalysis.metaTags}</pre>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(selectedAnalysis.metaTags)}
                    className="mt-2"
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    복사
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 