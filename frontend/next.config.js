/** @type {import('next').NextConfig} */
const nextConfig = {
  // ⚡ 프로덕션 최적화 설정
  reactStrictMode: true,
  
  // 🚀 실험적 기능 (유효한 것만)
  experimental: {
    // 메모리 기반 워커로 속도 극대화
    memoryBasedWorkersCount: true,
    // 패키지 임포트 최적화
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
  },

  // 📦 웹팩 최적화
  webpack: (config, { dev, isServer }) => {
    if (!dev) {
      // 프로덕션 최적화
      config.optimization = {
        ...config.optimization,
        moduleIds: 'deterministic',
        chunkIds: 'deterministic',
      };
    }

    return config;
  },

  // 🖼️ 이미지 최적화
  images: {
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 768, 1024, 1280, 1600],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
    minimumCacheTTL: 60,
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },

  // 🎯 타입스크립트 설정
  typescript: {
    ignoreBuildErrors: process.env.NODE_ENV === 'development',
  },

  // 📝 ESLint 설정
  eslint: {
    ignoreDuringBuilds: process.env.NODE_ENV === 'development',
  },

  // 🔄 프로덕션 설정
  compress: true,
  poweredByHeader: false,
  generateEtags: true,

  // 📁 출력 설정
  distDir: '.next',
  cleanDistDir: true,

  // 📊 환경변수
  env: {
    NEXT_PUBLIC_API_URL: process.env.NODE_ENV === 'production' 
      ? 'https://boblbobl-production.up.railway.app'
      : 'http://localhost:8080',
  },

  // 🔗 리다이렉트
  async redirects() {
    return [];
  },

  // 📄 보안 헤더
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
        ],
      },
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { 
            key: 'Strict-Transport-Security', 
            value: 'max-age=31536000; includeSubDomains; preload' 
          },
        ],
      },
    ];
  },

  // 🚀 성능 최적화
  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 2,
  },
};

module.exports = nextConfig; 