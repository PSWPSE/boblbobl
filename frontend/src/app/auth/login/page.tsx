'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthStore } from '@/lib/auth';
import { apiPost } from '@/lib/api';
import { showError, showSuccess } from '@/lib/notifications';
import { AlertCircle, ArrowRight, Brain, Eye, EyeOff, Lock, Mail, Sparkles } from 'lucide-react';

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, user } = useAuthStore();
  
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // 사용자가 이미 로그인되어 있으면 홈으로 리다이렉트
    if (user) {
      router.push('/');
      return;
    }

    // URL 파라미터에서 오류 메시지 확인
    const errorParam = searchParams.get('error');
    if (errorParam) {
      setError(decodeURIComponent(errorParam));
    }
  }, [user, router, searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const data = await apiPost('/api/auth/login', formData);

      if (data.success) {
        login(data.data.token, data.data.user);
        showSuccess('로그인이 완료되었습니다!');
        router.push('/');
      } else {
        showError(data.error || '로그인에 실패했습니다.');
      }
    } catch (error) {
      showError(error instanceof Error ? error.message : '로그인 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  // 소셜 로그인 핸들러
  const handleSocialLogin = (provider: 'google' | 'twitter') => {
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    window.location.href = `${API_BASE_URL}/api/auth/${provider}`;
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center">
      {/* Background */}
      <div className="fixed inset-0 gradient-hero opacity-90"></div>
      <div className="fixed inset-0 bg-gradient-to-br from-blue-50/30 to-purple-50/30"></div>
      
      {/* Floating elements */}
      <div className="fixed top-10 left-10 w-64 h-64 bg-gradient-to-r from-blue-400/20 to-purple-400/20 rounded-full blur-3xl animate-float"></div>
      <div className="fixed bottom-10 right-10 w-80 h-80 bg-gradient-to-r from-purple-400/20 to-pink-400/20 rounded-full blur-3xl animate-float" style={{animationDelay: '2s'}}></div>
      
      <div className="relative z-10 w-full max-w-md px-4">
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
                  BlogCraft에 로그인
                </CardTitle>
                <CardDescription className="text-lg text-gray-600 mt-2">
                  계정에 로그인하여 AI 블로그 콘텐츠를 생성하세요
                </CardDescription>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {error && (
                <div className="p-4 text-sm text-red-800 bg-red-50 border border-red-200 rounded-xl flex items-center animate-slide-up">
                  <AlertCircle className="h-5 w-5 mr-3 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                    이메일
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
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
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="••••••••"
                      className="pl-10 pr-10 input-modern"
                      required
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

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full btn-gradient text-lg py-3 shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      로그인 중...
                    </div>
                  ) : (
                    <div className="flex items-center justify-center">
                      <Brain className="mr-2 h-5 w-5" />
                      로그인
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

              <div className="space-y-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleSocialLogin('google')}
                  className="w-full bg-white/50 border-gray-200 text-gray-700 hover:bg-white/70 transition-all duration-300"
                >
                  <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 10.25v4.25h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09 0-.78-.07-1.53-.2-2.25H12z"/>
                    <path fill="#FBBC04" d="M10.64 5.07c.95-.36 1.96-.58 3.16-.58 1.7 0 3.1.59 4.19 1.59l3.13-3.13C19.15 1.19 15.85 0 12 0 7.31 0 3.25 2.69 1.36 6.55l3.69 2.87c.87-2.6 3.3-4.5 6.05-4.5z"/>
                    <path fill="#EA4335" d="M5.05 9.42c-.22-.65-.35-1.35-.35-2.07s.13-1.42.35-2.07L1.36 6.55C.49 8.23 0 10.06 0 12s.49 3.77 1.36 5.45l3.69-2.87c-.22-.65-.35-1.35-.35-2.07z"/>
                  </svg>
                  Google로 로그인
                </Button>
              </div>

              <div className="text-center">
                <p className="text-sm text-gray-600">
                  계정이 없으신가요?{' '}
                  <Link href="/auth/register" className="text-blue-600 hover:text-blue-800 font-medium transition-colors">
                    회원가입
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>
          
          <div className="mt-8 text-center text-sm text-gray-500">
            <p>
              AI 기반 블로그 콘텐츠 생성 플랫폼 <Sparkles className="inline h-4 w-4" />
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">로딩 중...</p>
        </div>
      </div>
    }>
      <LoginPageContent />
    </Suspense>
  );
} 