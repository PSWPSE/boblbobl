'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore, tokenStorage } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Brain, User, LogOut, Settings } from 'lucide-react';

// 메모이제이션된 네비게이션 링크 컴포넌트
const NavLink = ({ href, children, className = '' }: { 
  href: string; 
  children: React.ReactNode; 
  className?: string;
}) => (
  <Link 
    href={href} 
    className={`px-3 py-2 rounded-md text-sm font-medium transition-fast hover:bg-gray-100 dark:hover:bg-gray-800 ${className}`}
  >
    {children}
  </Link>
);

// 메모이제이션된 사용자 메뉴 컴포넌트
const UserMenu = ({ user, onLogout }: { user: any; onLogout: () => void }) => (
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button variant="ghost" className="relative h-8 w-8 rounded-full">
        <User className="h-4 w-4" />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent className="w-56" align="end" forceMount>
      <div className="flex items-center justify-start gap-2 p-2">
        <div className="flex flex-col space-y-1 leading-none">
          <p className="font-medium">{user.name}</p>
          <p className="text-xs text-muted-foreground">{user.email}</p>
        </div>
      </div>
      <DropdownMenuItem asChild>
        <Link href="/settings" className="flex items-center">
          <Settings className="mr-2 h-4 w-4" />
          <span>설정</span>
        </Link>
      </DropdownMenuItem>
      <DropdownMenuItem onClick={onLogout} className="flex items-center">
        <LogOut className="mr-2 h-4 w-4" />
        <span>로그아웃</span>
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
);

// 메모이제이션된 로그인 버튼 컴포넌트
const LoginButton = ({ onClick }: { onClick: () => void }) => (
  <Button onClick={onClick} className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
    로그인
  </Button>
);

// 메모이제이션된 디버그 정보 컴포넌트
const DebugInfo = ({ tokenInfo }: { tokenInfo: any }) => {
  if (!tokenInfo) return null;
  
  return (
    <div className="fixed top-16 right-4 z-50 bg-black/80 text-white p-4 rounded-lg text-xs font-mono max-w-xs">
      <h4 className="font-bold mb-2">🔍 Debug Info</h4>
      {tokenInfo.hasToken ? (
        <div>
          <p>✅ 토큰 존재</p>
          <p>👤 ID: {tokenInfo.userId}</p>
          <p>📧 Email: {tokenInfo.email}</p>
          <p>⏰ 만료: {new Date(tokenInfo.exp * 1000).toLocaleString()}</p>
          <p className={tokenInfo.isExpired ? 'text-red-400' : 'text-green-400'}>
            {tokenInfo.isExpired ? '❌ 만료됨' : '✅ 유효함'}
          </p>
        </div>
      ) : (
        <p>❌ 토큰 없음</p>
      )}
    </div>
  );
};

export default function Navigation() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, logout, checkAuth } = useAuthStore();
  const [debugMode, setDebugMode] = useState(false);
  const [tokenInfo, setTokenInfo] = useState<any>(null);
  const [mounted, setMounted] = useState(false);

  // 메모이제이션된 로그아웃 핸들러
  const handleLogout = useCallback(() => {
    logout();
    router.push('/');
  }, [logout, router]);

  // 메모이제이션된 토큰 정리 핸들러
  const clearTokensAndRelogin = useCallback(() => {
    tokenStorage.remove();
    localStorage.removeItem('user');
    router.push('/auth/login');
  }, [router]);

  // 메모이제이션된 디버그 토글 핸들러
  const handleDebugToggle = useCallback(() => {
    setDebugMode(!debugMode);
  }, [debugMode]);

  // 메모이제이션된 로그인 클릭 핸들러
  const handleLoginClick = useCallback(() => {
    router.push('/auth/login');
  }, [router]);

  // 메모이제이션된 네비게이션 링크들
  const navLinks = useMemo(() => [
    { href: '/', label: '홈' },
    { href: '/upload', label: '업로드' },
    { href: '/generate', label: '생성' },
    { href: '/history', label: '기록' },
    { href: '/guidelines', label: '가이드라인' },
    { href: '/seo', label: 'SEO' },
    { href: '/thumbnails', label: '썸네일' },
    { href: '/ai-bypass', label: 'AI 우회' },
  ], []);

  // 초기 마운트 및 인증 확인
  useEffect(() => {
    setMounted(true);
    checkAuth();
  }, [checkAuth]);

  // 디버그 모드 토큰 정보 업데이트
  useEffect(() => {
    if (debugMode && mounted) {
      const token = tokenStorage.get();
      if (token) {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          setTokenInfo({
            hasToken: true,
            userId: payload.userId,
            email: payload.email,
            exp: payload.exp,
            isExpired: payload.exp < Date.now() / 1000
          });
        } catch (error) {
          setTokenInfo({ hasToken: false, error: 'Invalid token format' });
        }
      } else {
        setTokenInfo({ hasToken: false });
      }
    }
  }, [debugMode, mounted]);

  // 마운트되지 않은 경우 로딩 표시
  if (!mounted) {
    return (
      <nav className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/" className="flex items-center space-x-2">
                <Brain className="h-8 w-8 text-blue-600" />
                <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  BlogCraft
                </span>
              </Link>
            </div>
            <div className="animate-pulse h-8 w-20 bg-gray-200 rounded"></div>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <>
      <nav className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50 sticky top-0 z-50 hw-accel">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* 로고 */}
            <div className="flex items-center">
              <Link href="/" className="flex items-center space-x-2 transition-fast hover:opacity-80">
                <Brain className="h-8 w-8 text-blue-600" />
                <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  BlogCraft
                </span>
              </Link>
            </div>

            {/* 메인 네비게이션 */}
            {isAuthenticated && (
              <div className="hidden md:flex items-center space-x-4">
                {navLinks.map((link) => (
                  <NavLink key={link.href} href={link.href}>
                    {link.label}
                  </NavLink>
                ))}
              </div>
            )}

            {/* 사용자 메뉴 */}
            <div className="flex items-center space-x-4">
              {isLoading ? (
                <div className="animate-pulse h-8 w-20 bg-gray-200 rounded"></div>
              ) : isAuthenticated && user ? (
                <UserMenu user={user} onLogout={handleLogout} />
              ) : (
                <LoginButton onClick={handleLoginClick} />
              )}

              {/* 디버그 토글 (개발 모드에서만) */}
              {process.env.NODE_ENV === 'development' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDebugToggle}
                  className="text-xs"
                >
                  {debugMode ? '🔍 ON' : '🔍 OFF'}
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* 모바일 네비게이션 */}
        {isAuthenticated && (
          <div className="md:hidden border-t border-gray-200/50 bg-white/90 backdrop-blur-sm">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {navLinks.map((link) => (
                <NavLink key={link.href} href={link.href} className="block">
                  {link.label}
                </NavLink>
              ))}
            </div>
          </div>
        )}

        {/* 인증 오류 및 토큰 관리 */}
        {isAuthenticated && user && debugMode && (
          <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-yellow-800">
                  🔐 인증 상태: {user.name} ({user.email})
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={clearTokensAndRelogin}
                className="text-xs"
              >
                토큰 초기화
              </Button>
            </div>
          </div>
        )}
      </nav>

      {/* 디버그 정보 */}
      <DebugInfo tokenInfo={debugMode ? tokenInfo : null} />
    </>
  );
} 