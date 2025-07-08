/** @type {import('next').NextConfig} */
const nextConfig = {
  // 배포 최적화 설정
  compress: true,
  poweredByHeader: false,
  
  // 이미지 최적화
  images: {
    domains: ['res.cloudinary.com'], // Cloudinary 이미지 허용
    formats: ['image/webp', 'image/avif'],
  },
  
  // 환경 변수 설정
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
  
  // 실험적 기능 (필요에 따라 사용)
  experimental: {
    optimizeCss: true,
    optimizeServerReact: true,
  },
  
  // 빌드 최적화
  swcMinify: true,
  
  // 보안 헤더 설정
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
    ];
  },
  
  // API 라우트 설정
  async rewrites() {
    return [
      {
        source: '/api/v1/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL}/api/:path*`,
      },
    ];
  },
};

module.exports = nextConfig; 