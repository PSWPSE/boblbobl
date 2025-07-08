// 로컬 스토리지에서 토큰 관리
export const tokenStorage = {
  get: (): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('token');
  },
  
  set: (token: string): void => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('token', token);
  },
  
  remove: (): void => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('token');
  }
};

// 사용자 정보 관리
export const userStorage = {
  get: (): any | null => {
    if (typeof window === 'undefined') return null;
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },
  
  set: (user: any): void => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('user', JSON.stringify(user));
  },
  
  remove: (): void => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('user');
  }
};

// API 요청 헤더 생성
export const getAuthHeaders = (): Record<string, string> => {
  const token = tokenStorage.get();
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` })
  };
};

// 로그아웃 함수
export const logout = (): void => {
  tokenStorage.remove();
  userStorage.remove();
  window.location.href = '/';
};

// 토큰 유효성 검사
export const isTokenValid = (token: string): boolean => {
  if (!token) return false;
  
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const currentTime = Date.now() / 1000;
    return payload.exp > currentTime;
  } catch {
    return false;
  }
};

// 인증 상태 확인
export const isAuthenticated = (): boolean => {
  const token = tokenStorage.get();
  return token ? isTokenValid(token) : false;
}; 