'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAuthStore } from '@/lib/auth';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Bot, 
  Shield, 
  FileText, 
  Eye, 
  Zap, 
  CheckCircle,
  AlertTriangle,
  XCircle,
  Copy,
  Download,
  Trash2,
  RefreshCw,
  User,
  MessageSquare,
  BookOpen,
  TrendingUp,
  Users,
  BarChart3,
  Clock,
  Settings,
  Info,
  Lightbulb,
  Target,
  Wand2
} from 'lucide-react';

interface AIBypassResult {
  id?: string;
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

interface AIBypassHistory {
  id: string;
  title: string;
  humanizationScore: number;
  detectionRisk: 'low' | 'medium' | 'high';
  changesCount: number;
  createdAt: string;
  tags: string[];
}

interface RiskAssessment {
  overallRisk: 'low' | 'medium' | 'high';
  riskFactors: {
    repetitivePatterns: number;
    formalLanguage: number;
    lackOfPersonalTouch: number;
    uniformSentenceLength: number;
    technicalTerms: number;
  };
  recommendations: string[];
}

export default function AIBypassPage() {
  const { user, token } = useAuthStore();
  const router = useRouter();
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState<'bypass' | 'humanize' | 'style' | 'risk' | 'history'>('bypass');
  const [result, setResult] = useState<AIBypassResult | null>(null);
  const [riskAssessment, setRiskAssessment] = useState<RiskAssessment | null>(null);
  const [history, setHistory] = useState<AIBypassHistory[]>([]);
  const [selectedHistory, setSelectedHistory] = useState<any>(null);
  
  // 폼 상태
  const [formData, setFormData] = useState({
    text: '',
    humanizationLevel: 'medium',
    writingStyle: 'casual',
    targetLanguage: 'ko',
    preserveKeywords: '',
    addPersonalTouch: true,
    varyParagraphLength: true,
    insertNaturalTransitions: true,
    fromStyle: 'formal',
    toStyle: 'casual'
  });

  useEffect(() => {
    if (!user) {
      router.push('/auth/login');
      return;
    }

    if (activeTab === 'history') {
      fetchHistory();
    }
  }, [user, router, activeTab]);

  const fetchHistory = async () => {
    try {
      const response = await fetch('/api/ai-bypass/history', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      
      if (data.success) {
        setHistory(data.data.history);
      }
    } catch (error) {
      console.error('AI 우회 기록 로드 실패:', error);
    }
  };

  const handleAIBypass = async () => {
    if (!formData.text) {
      alert('처리할 텍스트를 입력해주세요.');
      return;
    }

    setIsProcessing(true);
    try {
      const keywordsArray = formData.preserveKeywords
        .split(',')
        .map(keyword => keyword.trim())
        .filter(keyword => keyword);

      const response = await fetch('/api/ai-bypass/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          text: formData.text,
          humanizationLevel: formData.humanizationLevel,
          writingStyle: formData.writingStyle,
          targetLanguage: formData.targetLanguage,
          preserveKeywords: keywordsArray,
          addPersonalTouch: formData.addPersonalTouch,
          varyParagraphLength: formData.varyParagraphLength,
          insertNaturalTransitions: formData.insertNaturalTransitions
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setResult(data.data);
        fetchHistory();
      } else {
        alert(`AI 탐지 우회 처리 실패: ${data.error}`);
      }
    } catch (error) {
      console.error('AI 우회 처리 오류:', error);
      alert('AI 탐지 우회 처리 중 오류가 발생했습니다.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleHumanize = async () => {
    if (!formData.text) {
      alert('자연화할 텍스트를 입력해주세요.');
      return;
    }

    setIsProcessing(true);
    try {
      const response = await fetch('/api/ai-bypass/humanize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          text: formData.text,
          level: formData.humanizationLevel
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setResult({
          originalText: data.data.originalText,
          humanizedText: data.data.humanizedText,
          changes: [],
          humanizationScore: data.data.humanizationScore,
          detectionRisk: data.data.detectionRisk,
          recommendations: []
        });
      } else {
        alert(`텍스트 자연화 실패: ${data.error}`);
      }
    } catch (error) {
      console.error('텍스트 자연화 오류:', error);
      alert('텍스트 자연화 중 오류가 발생했습니다.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleStyleConversion = async () => {
    if (!formData.text) {
      alert('변환할 텍스트를 입력해주세요.');
      return;
    }

    setIsProcessing(true);
    try {
      const response = await fetch('/api/ai-bypass/convert-style', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          text: formData.text,
          fromStyle: formData.fromStyle,
          toStyle: formData.toStyle
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setResult({
          originalText: data.data.originalText,
          humanizedText: data.data.convertedText,
          changes: data.data.changes,
          humanizationScore: 75,
          detectionRisk: 'medium',
          recommendations: []
        });
      } else {
        alert(`문체 변환 실패: ${data.error}`);
      }
    } catch (error) {
      console.error('문체 변환 오류:', error);
      alert('문체 변환 중 오류가 발생했습니다.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRiskAssessment = async () => {
    if (!formData.text) {
      alert('평가할 텍스트를 입력해주세요.');
      return;
    }

    setIsProcessing(true);
    try {
      const response = await fetch('/api/ai-bypass/assess-risk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          text: formData.text
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setRiskAssessment(data.data);
      } else {
        alert(`위험도 평가 실패: ${data.error}`);
      }
    } catch (error) {
      console.error('위험도 평가 오류:', error);
      alert('위험도 평가 중 오류가 발생했습니다.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleViewHistory = async (historyId: string) => {
    try {
      const response = await fetch(`/api/ai-bypass/${historyId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      
      if (data.success) {
        setSelectedHistory(data.data);
      } else {
        alert(`기록 조회 실패: ${data.error}`);
      }
    } catch (error) {
      console.error('기록 조회 오류:', error);
      alert('기록 조회 중 오류가 발생했습니다.');
    }
  };

  const handleDeleteHistory = async (historyId: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;

    try {
      const response = await fetch(`/api/ai-bypass/${historyId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      
      if (data.success) {
        fetchHistory();
        if (selectedHistory?.id === historyId) {
          setSelectedHistory(null);
        }
      } else {
        alert(`삭제 실패: ${data.error}`);
      }
    } catch (error) {
      console.error('삭제 오류:', error);
      alert('삭제 중 오류가 발생했습니다.');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('클립보드에 복사되었습니다.');
  };

  const getRiskColor = (risk: 'low' | 'medium' | 'high') => {
    switch (risk) {
      case 'low': return 'text-green-600';
      case 'medium': return 'text-yellow-600';
      case 'high': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getRiskIcon = (risk: 'low' | 'medium' | 'high') => {
    switch (risk) {
      case 'low': return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'medium': return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      case 'high': return <XCircle className="h-5 w-5 text-red-600" />;
      default: return null;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🤖 AI 탐지 우회 시스템
          </h1>
          <p className="text-gray-600">
            AI가 생성한 콘텐츠를 자연스럽게 만들어 AI 탐지 도구를 우회하세요
          </p>
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          <Button
            variant={activeTab === 'bypass' ? 'default' : 'outline'}
            onClick={() => setActiveTab('bypass')}
            className="flex items-center gap-2"
          >
            <Shield className="h-4 w-4" />
            AI 탐지 우회
          </Button>
          <Button
            variant={activeTab === 'humanize' ? 'default' : 'outline'}
            onClick={() => setActiveTab('humanize')}
            className="flex items-center gap-2"
          >
            <User className="h-4 w-4" />
            텍스트 자연화
          </Button>
          <Button
            variant={activeTab === 'style' ? 'default' : 'outline'}
            onClick={() => setActiveTab('style')}
            className="flex items-center gap-2"
          >
            <MessageSquare className="h-4 w-4" />
            문체 변환
          </Button>
          <Button
            variant={activeTab === 'risk' ? 'default' : 'outline'}
            onClick={() => setActiveTab('risk')}
            className="flex items-center gap-2"
          >
            <Target className="h-4 w-4" />
            위험도 평가
          </Button>
          <Button
            variant={activeTab === 'history' ? 'default' : 'outline'}
            onClick={() => setActiveTab('history')}
            className="flex items-center gap-2"
          >
            <Clock className="h-4 w-4" />
            처리 기록
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 입력 폼 */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  텍스트 입력
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="text">처리할 텍스트</Label>
                  <Textarea
                    id="text"
                    value={formData.text}
                    onChange={(e) => setFormData({...formData, text: e.target.value})}
                    placeholder="AI가 생성한 텍스트를 입력하세요"
                    rows={10}
                  />
                </div>

                {(activeTab === 'bypass' || activeTab === 'humanize') && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="humanizationLevel">자연화 레벨</Label>
                      <Select value={formData.humanizationLevel} onValueChange={(value) => setFormData({...formData, humanizationLevel: value})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">낮음</SelectItem>
                          <SelectItem value="medium">중간</SelectItem>
                          <SelectItem value="high">높음</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="writingStyle">문체 스타일</Label>
                      <Select value={formData.writingStyle} onValueChange={(value) => setFormData({...formData, writingStyle: value})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="formal">정식적</SelectItem>
                          <SelectItem value="casual">캐주얼</SelectItem>
                          <SelectItem value="conversational">대화형</SelectItem>
                          <SelectItem value="professional">전문적</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}

                {activeTab === 'style' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="fromStyle">원본 문체</Label>
                      <Select value={formData.fromStyle} onValueChange={(value) => setFormData({...formData, fromStyle: value})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="formal">정식적</SelectItem>
                          <SelectItem value="casual">캐주얼</SelectItem>
                          <SelectItem value="conversational">대화형</SelectItem>
                          <SelectItem value="professional">전문적</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="toStyle">변환할 문체</Label>
                      <Select value={formData.toStyle} onValueChange={(value) => setFormData({...formData, toStyle: value})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="formal">정식적</SelectItem>
                          <SelectItem value="casual">캐주얼</SelectItem>
                          <SelectItem value="conversational">대화형</SelectItem>
                          <SelectItem value="professional">전문적</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}

                {activeTab === 'bypass' && (
                  <>
                    <div>
                      <Label htmlFor="preserveKeywords">보존할 키워드 (쉼표로 구분)</Label>
                      <Input
                        id="preserveKeywords"
                        value={formData.preserveKeywords}
                        onChange={(e) => setFormData({...formData, preserveKeywords: e.target.value})}
                        placeholder="중요한 키워드들을 입력하세요"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="personalTouch">개인적 터치</Label>
                        <Switch 
                          checked={formData.addPersonalTouch}
                          onCheckedChange={(checked) => setFormData({...formData, addPersonalTouch: checked})}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <Label htmlFor="varyParagraph">단락 길이 조정</Label>
                        <Switch 
                          checked={formData.varyParagraphLength}
                          onCheckedChange={(checked) => setFormData({...formData, varyParagraphLength: checked})}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <Label htmlFor="naturalTransitions">자연스러운 전환</Label>
                        <Switch 
                          checked={formData.insertNaturalTransitions}
                          onCheckedChange={(checked) => setFormData({...formData, insertNaturalTransitions: checked})}
                        />
                      </div>
                    </div>
                  </>
                )}

                <div className="flex gap-2 pt-4">
                  {activeTab === 'bypass' && (
                    <Button
                      onClick={handleAIBypass}
                      disabled={isProcessing}
                      className="flex items-center gap-2"
                    >
                      {isProcessing ? (
                        <>
                          <RefreshCw className="h-4 w-4 animate-spin" />
                          처리 중...
                        </>
                      ) : (
                        <>
                          <Shield className="h-4 w-4" />
                          AI 탐지 우회
                        </>
                      )}
                    </Button>
                  )}

                  {activeTab === 'humanize' && (
                    <Button
                      onClick={handleHumanize}
                      disabled={isProcessing}
                      className="flex items-center gap-2"
                    >
                      {isProcessing ? (
                        <>
                          <RefreshCw className="h-4 w-4 animate-spin" />
                          처리 중...
                        </>
                      ) : (
                        <>
                          <User className="h-4 w-4" />
                          텍스트 자연화
                        </>
                      )}
                    </Button>
                  )}

                  {activeTab === 'style' && (
                    <Button
                      onClick={handleStyleConversion}
                      disabled={isProcessing}
                      className="flex items-center gap-2"
                    >
                      {isProcessing ? (
                        <>
                          <RefreshCw className="h-4 w-4 animate-spin" />
                          변환 중...
                        </>
                      ) : (
                        <>
                          <Wand2 className="h-4 w-4" />
                          문체 변환
                        </>
                      )}
                    </Button>
                  )}

                  {activeTab === 'risk' && (
                    <Button
                      onClick={handleRiskAssessment}
                      disabled={isProcessing}
                      className="flex items-center gap-2"
                    >
                      {isProcessing ? (
                        <>
                          <RefreshCw className="h-4 w-4 animate-spin" />
                          평가 중...
                        </>
                      ) : (
                        <>
                          <Target className="h-4 w-4" />
                          위험도 평가
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 사이드바 */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>기능 가이드</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="border-l-4 border-blue-500 pl-4">
                    <h4 className="font-medium flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      AI 탐지 우회
                    </h4>
                    <p className="text-sm text-gray-600">
                      종합적인 AI 탐지 우회 처리로 자연스러운 텍스트 생성
                    </p>
                  </div>
                  
                  <div className="border-l-4 border-green-500 pl-4">
                    <h4 className="font-medium flex items-center gap-2">
                      <User className="h-4 w-4" />
                      텍스트 자연화
                    </h4>
                    <p className="text-sm text-gray-600">
                      빠른 자연화 처리로 기계적인 표현을 인간적으로 변환
                    </p>
                  </div>
                  
                  <div className="border-l-4 border-purple-500 pl-4">
                    <h4 className="font-medium flex items-center gap-2">
                      <MessageSquare className="h-4 w-4" />
                      문체 변환
                    </h4>
                    <p className="text-sm text-gray-600">
                      원하는 문체로 텍스트 스타일을 변환
                    </p>
                  </div>

                  <div className="border-l-4 border-orange-500 pl-4">
                    <h4 className="font-medium flex items-center gap-2">
                      <Target className="h-4 w-4" />
                      위험도 평가
                    </h4>
                    <p className="text-sm text-gray-600">
                      AI 탐지 위험도 분석 및 개선 제안
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* 처리 결과 표시 */}
        {result && (
          <div className="mt-8 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bot className="h-5 w-5" />
                  처리 결과
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      {getRiskIcon(result.detectionRisk)}
                      <span className={`text-xl font-bold ${getRiskColor(result.detectionRisk)}`}>
                        {result.detectionRisk.toUpperCase()}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600">탐지 위험도</div>
                  </div>
                  
                  <div className="text-center">
                    <div className={`text-3xl font-bold ${getScoreColor(result.humanizationScore)}`}>
                      {result.humanizationScore}
                    </div>
                    <div className="text-sm text-gray-600">자연화 점수</div>
                    <Progress value={result.humanizationScore} className="mt-2" />
                  </div>
                  
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600">
                      {result.changes.length}
                    </div>
                    <div className="text-sm text-gray-600">변경사항</div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-medium mb-2">원본 텍스트</h3>
                    <div className="bg-gray-50 p-4 rounded border max-h-64 overflow-y-auto">
                      <pre className="whitespace-pre-wrap text-sm">{result.originalText}</pre>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-medium mb-2">처리된 텍스트</h3>
                    <div className="bg-green-50 p-4 rounded border max-h-64 overflow-y-auto">
                      <pre className="whitespace-pre-wrap text-sm">{result.humanizedText}</pre>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(result.humanizedText)}
                      className="mt-2"
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      복사
                    </Button>
                  </div>
                </div>

                {result.changes.length > 0 && (
                  <div className="mt-6">
                    <h3 className="font-medium mb-3">변경사항 상세</h3>
                    <div className="space-y-3 max-h-64 overflow-y-auto">
                      {result.changes.map((change, index) => (
                        <div key={index} className="border rounded p-3 bg-gray-50">
                          <div className="flex items-start gap-2 mb-2">
                            <Badge variant="outline" className="text-xs">
                              {change.type}
                            </Badge>
                            <span className="text-sm text-gray-600">{change.reason}</span>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                            <div>
                              <span className="font-medium text-red-600">변경 전:</span>
                              <div className="bg-red-50 p-2 rounded mt-1">{change.original}</div>
                            </div>
                            <div>
                              <span className="font-medium text-green-600">변경 후:</span>
                              <div className="bg-green-50 p-2 rounded mt-1">{change.modified}</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {result.recommendations.length > 0 && (
                  <div className="mt-6">
                    <h3 className="font-medium mb-3">개선 제안</h3>
                    <div className="space-y-2">
                      {result.recommendations.map((recommendation, index) => (
                        <div key={index} className="flex items-start gap-2 p-2 bg-blue-50 rounded">
                          <Lightbulb className="h-4 w-4 text-blue-600 mt-0.5" />
                          <span className="text-sm">{recommendation}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* 위험도 평가 결과 */}
        {riskAssessment && activeTab === 'risk' && (
          <div className="mt-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  AI 탐지 위험도 평가
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center mb-6">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    {getRiskIcon(riskAssessment.overallRisk)}
                    <span className={`text-2xl font-bold ${getRiskColor(riskAssessment.overallRisk)}`}>
                      {riskAssessment.overallRisk.toUpperCase()} 위험
                    </span>
                  </div>
                  <p className="text-gray-600">종합 AI 탐지 위험도</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-medium mb-3">위험 요소 분석</h3>
                    <div className="space-y-3">
                      {Object.entries(riskAssessment.riskFactors).map(([factor, score]) => (
                        <div key={factor} className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span className="capitalize">{factor.replace(/([A-Z])/g, ' $1').trim()}</span>
                            <span>{Math.round(score * 100)}%</span>
                          </div>
                          <Progress value={score * 100} className="h-2" />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="font-medium mb-3">개선 제안</h3>
                    <div className="space-y-2">
                      {riskAssessment.recommendations.map((recommendation, index) => (
                        <div key={index} className="flex items-start gap-2 p-2 bg-yellow-50 rounded">
                          <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
                          <span className="text-sm">{recommendation}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* 처리 기록 */}
        {activeTab === 'history' && (
          <div className="mt-8">
            <Card>
              <CardHeader>
                <CardTitle>AI 탐지 우회 처리 기록</CardTitle>
              </CardHeader>
              <CardContent>
                {history.length === 0 ? (
                  <div className="text-center py-8">
                    <Clock className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">아직 처리 기록이 없습니다.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {history.map((item) => (
                      <div key={item.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-medium">{item.title}</h3>
                          <div className="flex items-center gap-2">
                            {getRiskIcon(item.detectionRisk)}
                            <span className={`text-sm font-medium ${getRiskColor(item.detectionRisk)}`}>
                              {item.detectionRisk}
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4 mb-3">
                          <span className="text-sm text-gray-600">
                            자연화 점수: <span className={`font-medium ${getScoreColor(item.humanizationScore)}`}>
                              {item.humanizationScore}점
                            </span>
                          </span>
                          <span className="text-sm text-gray-600">
                            변경사항: {item.changesCount}개
                          </span>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-500">
                            {new Date(item.createdAt).toLocaleString()}
                          </span>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewHistory(item.id)}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              보기
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteHistory(item.id)}
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

        {/* 상세 기록 모달 */}
        {selectedHistory && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setSelectedHistory(null)}>
            <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">처리 결과 상세</h2>
                <Button variant="outline" onClick={() => setSelectedHistory(null)}>
                  닫기
                </Button>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-medium mb-2">원본 텍스트</h3>
                    <div className="bg-gray-50 p-3 rounded max-h-40 overflow-y-auto">
                      <pre className="text-sm whitespace-pre-wrap">{selectedHistory.originalText}</pre>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-medium mb-2">처리된 텍스트</h3>
                    <div className="bg-green-50 p-3 rounded max-h-40 overflow-y-auto">
                      <pre className="text-sm whitespace-pre-wrap">{selectedHistory.humanizedText}</pre>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(selectedHistory.humanizedText)}
                      className="mt-2"
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      복사
                    </Button>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    {getRiskIcon(selectedHistory.detectionRisk)}
                    <span className={`font-medium ${getRiskColor(selectedHistory.detectionRisk)}`}>
                      {selectedHistory.detectionRisk.toUpperCase()} 위험
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">자연화 점수:</span>
                    <span className={`font-medium ${getScoreColor(selectedHistory.humanizationScore)}`}>
                      {selectedHistory.humanizationScore}점
                    </span>
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