// API 호출 공통 유틸리티 (성능 최적화)
import { tokenStorage } from './auth';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// 요청 캐시 (메모리 기반)
const requestCache = new Map<string, { data: any; timestamp: number; ttl: number }>();
const pendingRequests = new Map<string, Promise<any>>();

/**
 * 캐시 키 생성
 */
const getCacheKey = (url: string, options: RequestInit = {}) => {
  const method = options.method || 'GET';
  const body = options.body ? JSON.stringify(options.body) : '';
  return `${method}:${url}:${body}`;
};

/**
 * 캐시에서 데이터 조회
 */
const getCachedData = (key: string) => {
  const cached = requestCache.get(key);
  if (cached && Date.now() - cached.timestamp < cached.ttl) {
    return cached.data;
  }
  requestCache.delete(key);
  return null;
};

/**
 * 캐시에 데이터 저장
 */
const setCachedData = (key: string, data: any, ttl: number = 5 * 60 * 1000) => {
  requestCache.set(key, { data, timestamp: Date.now(), ttl });
};

/**
 * 캐시 정리 (메모리 누수 방지)
 */
const cleanupCache = () => {
  const now = Date.now();
  for (const [key, { timestamp, ttl }] of requestCache.entries()) {
    if (now - timestamp > ttl) {
      requestCache.delete(key);
    }
  }
};

// 5분마다 캐시 정리
setInterval(cleanupCache, 5 * 60 * 1000);

/**
 * API 호출을 위한 공통 함수 (최적화된 버전)
 */
export const apiCall = async (
  endpoint: string,
  options: RequestInit = {},
  cacheOptions: { ttl?: number; useCache?: boolean } = {}
): Promise<any> => {
  const { ttl = 5 * 60 * 1000, useCache = true } = cacheOptions;
  const token = tokenStorage.get();
  
  const url = endpoint.startsWith('/') ? `${API_BASE_URL}${endpoint}` : `${API_BASE_URL}/${endpoint}`;
  
  // 캐시 키 생성
  const cacheKey = getCacheKey(url, options);
  
  // GET 요청이고 캐시 사용 시 캐시 확인
  if (useCache && (!options.method || options.method === 'GET')) {
    const cachedData = getCachedData(cacheKey);
    if (cachedData) {
      console.log(`🗄️ 캐시에서 반환: ${endpoint}`);
      return cachedData;
    }
  }

  // 동일한 요청이 진행 중이면 대기
  if (pendingRequests.has(cacheKey)) {
    console.log(`⏳ 중복 요청 대기: ${endpoint}`);
    return pendingRequests.get(cacheKey);
  }

  const defaultHeaders: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  };

  // 타임아웃 설정 (콘텐츠 생성은 90초, 나머지는 30초)
  const timeoutMs = endpoint.includes('/content/generate') ? 90000 : 30000;
  
  const config: RequestInit = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
    signal: AbortSignal.timeout(timeoutMs)
  };

  const requestPromise = (async () => {
    try {
      console.log(`🔄 API 호출 시작: ${endpoint}`, { 
        method: options.method || 'GET', 
        timeoutMs,
        cached: useCache 
      });
      
      const response = await fetch(url, config);
      
      console.log(`✅ API 응답 받음: ${endpoint}`, { 
        status: response.status, 
        ok: response.ok,
        size: response.headers.get('content-length') || 'unknown'
      });
      
      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch {
          errorData = { error: `HTTP ${response.status}: ${response.statusText}` };
        }
        
        console.error(`❌ API 에러: ${endpoint}`, errorData);
        
        // 토큰 만료 또는 인증 실패 시 자동 로그아웃
        if (response.status === 401 && errorData.error === 'Invalid token') {
          console.warn('🔐 토큰 만료, 로그아웃 처리');
          tokenStorage.remove();
          window.location.href = '/auth/login';
          return;
        }
        
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      // 성공적인 GET 요청 결과 캐시
      if (useCache && (!options.method || options.method === 'GET')) {
        setCachedData(cacheKey, result, ttl);
      }
      
      console.log(`🎉 API 성공: ${endpoint}`, { 
        dataKeys: Object.keys(result),
        cached: useCache && (!options.method || options.method === 'GET')
      });
      
      return result;
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'TimeoutError' || error.name === 'AbortError') {
          console.error(`⏰ API 타임아웃: ${endpoint}`, { timeoutMs });
          throw new Error(`요청 시간이 초과되었습니다 (${timeoutMs/1000}초). 잠시 후 다시 시도해주세요.`);
        }
        console.error(`🚨 API 호출 오류: ${endpoint}`, error);
      }
      throw error;
    } finally {
      // 진행 중인 요청에서 제거
      pendingRequests.delete(cacheKey);
    }
  })();

  // 진행 중인 요청에 추가
  pendingRequests.set(cacheKey, requestPromise);

  return requestPromise;
};

// 편의 함수들 (최적화된 버전)
export const apiGet = (endpoint: string, cacheOptions?: { ttl?: number; useCache?: boolean }) => 
  apiCall(endpoint, { method: 'GET' }, cacheOptions);

export const apiPost = (endpoint: string, data?: any, cacheOptions?: { ttl?: number; useCache?: boolean }) => 
  apiCall(endpoint, { 
    method: 'POST', 
    body: data ? JSON.stringify(data) : undefined 
  }, { ...cacheOptions, useCache: false });

export const apiPut = (endpoint: string, data?: any) => 
  apiCall(endpoint, { 
    method: 'PUT', 
    body: data ? JSON.stringify(data) : undefined 
  }, { useCache: false });

export const apiDelete = (endpoint: string) => 
  apiCall(endpoint, { method: 'DELETE' }, { useCache: false });

export const apiPatch = (endpoint: string, data?: any) => 
  apiCall(endpoint, { 
    method: 'PATCH', 
    body: data ? JSON.stringify(data) : undefined 
  }, { useCache: false });

/**
 * 파일 업로드를 위한 최적화된 함수
 */
export const apiUpload = async (
  endpoint: string,
  formData: FormData,
  onProgress?: (progress: number) => void
): Promise<any> => {
  const token = tokenStorage.get();
  const url = endpoint.startsWith('/') ? `${API_BASE_URL}${endpoint}` : `${API_BASE_URL}/${endpoint}`;

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    // 프로그레스 이벤트
    if (onProgress) {
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const progress = (e.loaded / e.total) * 100;
          onProgress(progress);
        }
      });
    }

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const result = JSON.parse(xhr.responseText);
          resolve(result);
        } catch (error) {
          resolve(xhr.responseText);
        }
      } else {
        reject(new Error(`Upload failed: ${xhr.status} ${xhr.statusText}`));
      }
    });

    xhr.addEventListener('error', () => {
      reject(new Error('Upload failed'));
    });

    xhr.addEventListener('timeout', () => {
      reject(new Error('Upload timeout'));
    });

    xhr.open('POST', url);
    xhr.timeout = 5 * 60 * 1000; // 5분 타임아웃
    
    if (token) {
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    }

    xhr.send(formData);
  });
};

/**
 * 캐시 무효화
 */
export const invalidateCache = (pattern?: string) => {
  if (pattern) {
    for (const key of requestCache.keys()) {
      if (key.includes(pattern)) {
        requestCache.delete(key);
      }
    }
  } else {
    requestCache.clear();
  }
  console.log(`🗑️ 캐시 무효화: ${pattern || 'all'}`);
};

/**
 * 프리로드 함수 (자주 사용되는 데이터 미리 로드)
 */
export const preloadData = async (endpoints: string[]) => {
  const promises = endpoints.map(endpoint => 
    apiGet(endpoint, { ttl: 10 * 60 * 1000 }).catch(console.error)
  );
  await Promise.allSettled(promises);
  console.log('🔄 데이터 프리로드 완료:', endpoints);
};

// 자주 사용되는 데이터 프리로드
export const preloadCommonData = () => {
  preloadData([
    '/api/upload',
    '/api/guidelines',
    '/api/content/stats'
  ]);
}; 