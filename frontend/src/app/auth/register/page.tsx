'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, Brain, Eye, EyeOff, Lock, Mail, Shield, Sparkles, User, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuthStore } from '@/lib/auth';
import { apiPost } from '@/lib/api';
import { showError, showSuccess } from '@/lib/notifications';

export default function RegisterPage() {
  const router = useRouter();
  const { login } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 유효성 검사
    if (!formData.name || !formData.email || !formData.password || !formData.confirmPassword) {
      showError('모든 필드를 입력해주세요.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      showError('비밀번호가 일치하지 않습니다.');
      return;
    }

    if (formData.password.length < 6) {
      showError('비밀번호는 최소 6자 이상이어야 합니다.');
      return;
    }

    if (!agreedToTerms) {
      showError('서비스 약관에 동의해주세요.');
      return;
    }

    setLoading(true);

    try {
      const data = await apiPost('/api/auth/register', {
        name: formData.name,
        email: formData.email,
        password: formData.password
      });
      
      // Zustand store를 사용하여 토큰과 사용자 정보 저장
      login(data.data.token, data.data.user);
      
      showSuccess('회원가입이 완료되었습니다!');
      router.push('/');
      
    } catch (error) {
      showError(error instanceof Error ? error.message : '회원가입 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center py-12">
      {/* Background */}
      <div className="fixed inset-0 gradient-hero opacity-90"></div>
      <div className="fixed inset-0 bg-gradient-to-br from-blue-50/30 to-purple-50/30"></div>
      
      {/* Floating elements */}
      <div className="fixed top-10 right-10 w-64 h-64 bg-gradient-to-r from-purple-400/20 to-pink-400/20 rounded-full blur-3xl animate-float"></div>
      <div className="fixed bottom-10 left-10 w-80 h-80 bg-gradient-to-r from-blue-400/20 to-cyan-400/20 rounded-full blur-3xl animate-float" style={{animationDelay: '2s'}}></div>
      
      <div className="relative z-10 w-full max-w-lg px-4">
        <div className="animate-fade-in">
          <Card className="modern-card backdrop-blur-xl bg-white/90 border-white/20 shadow-2xl">
            <CardHeader className="text-center space-y-6">
              <div className="flex justify-center">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl blur opacity-75"></div>
                  <div className="relative bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4 rounded-2xl">
                    <Brain className="h-10 w-10" />
                  </div>
                </div>
              </div>
              <div>
                <CardTitle className="text-3xl font-bold gradient-text">
                  BlogCraft 회원가입
                </CardTitle>
                <CardDescription className="text-lg text-gray-600 mt-2">
                  AI 블로그 콘텐츠 생성 서비스 시작하기
                </CardDescription>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {/* Benefits */}
              <div className="grid grid-cols-3 gap-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-100">
                <div className="text-center">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-2">
                    <Sparkles className="h-5 w-5 text-white" />
                  </div>
                  <p className="text-xs text-gray-600">무료 체험</p>
                </div>
                <div className="text-center">
                  <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-2">
                    <Shield className="h-5 w-5 text-white" />
                  </div>
                  <p className="text-xs text-gray-600">AI 우회</p>
                </div>
                <div className="text-center">
                  <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-2">
                    <Zap className="h-5 w-5 text-white" />
                  </div>
                  <p className="text-xs text-gray-600">빠른 생성</p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-medium text-gray-700">
                    이름
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input
                      id="name"
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="홍길동"
                      className="pl-10 input-modern"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                    이메일
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="your@email.com"
                      className="pl-10 input-modern"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                    비밀번호
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                      placeholder="최소 6자 이상"
                      className="pl-10 pr-10 input-modern"
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
                    비밀번호 확인
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      placeholder="비밀번호를 다시 입력하세요"
                      className="pl-10 pr-10 input-modern"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-4 bg-gray-50 rounded-xl">
                  <Checkbox
                    id="terms"
                    checked={agreedToTerms}
                    onCheckedChange={(checked) => setAgreedToTerms(checked as boolean)}
                    className="mt-1"
                  />
                  <Label htmlFor="terms" className="text-sm text-gray-600 leading-relaxed cursor-pointer">
                    <Link href="/terms" className="text-blue-600 hover:text-blue-800 underline">
                      서비스 약관
                    </Link>
                    {' '}및{' '}
                    <Link href="/privacy" className="text-blue-600 hover:text-blue-800 underline">
                      개인정보 처리방침
                    </Link>
                    에 동의합니다.
                  </Label>
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full btn-gradient text-lg py-3 shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      계정 생성 중...
                    </div>
                  ) : (
                    <div className="flex items-center justify-center">
                      <Sparkles className="mr-2 h-5 w-5" />
                      계정 만들기
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </div>
                  )}
                </Button>
              </form>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-gray-500">또는</span>
                </div>
              </div>

              <div className="space-y-3">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full bg-white/50 border-gray-200 text-gray-700 hover:bg-white/70 transition-all duration-300"
                >
                  <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Google로 회원가입
                </Button>
                
                <Button
                  type="button"
                  variant="outline"
                  className="w-full bg-white/50 border-gray-200 text-gray-700 hover:bg-white/70 transition-all duration-300"
                >
                  <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
                    <path fill="#03C75A" d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm-1.5 16.5h-3v-9h3v9zm6 0h-3v-4.5c0-1.5-.75-2.25-2.25-2.25S9 10.5 9 12v4.5H6v-9h3v1.5c.75-1.125 2.25-1.875 3.75-1.875 2.25 0 3.75 1.5 3.75 4.125V16.5z"/>
                  </svg>
                  네이버로 회원가입
                </Button>
              </div>

              <div className="text-center space-y-4">
                <p className="text-sm text-gray-600">
                  이미 계정이 있으신가요?
                </p>
                <Link href="/auth/login">
                  <Button variant="outline" className="w-full bg-gradient-to-r from-gray-50 to-gray-100 border-gray-200 text-gray-700 hover:bg-gradient-to-r hover:from-gray-100 hover:to-gray-200 transition-all duration-300">
                    <User className="mr-2 h-4 w-4" />
                    로그인하기
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 