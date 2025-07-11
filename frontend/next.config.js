/** @type {import('next').NextConfig} */
const nextConfig = {
  // 🚀 개발 모드 극단적 최적화
  reactStrictMode: false, // 개발 시 이중 렌더링 방지
  
  // ⚡ Turbopack 완전 최적화
  experimental: {
    // 메모리 기반 워커로 속도 극대화
    memoryBasedWorkersCount: true,
    // CSS 최적화 비활성화 (개발용)
    optimizeCss: false,
    // 빠른 새로고침 최적화
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
    // 서버 컴포넌트 최적화
    serverComponentsExternalPackages: [],
    // 번들 분석 최적화
    bundlePagesRouterDependencies: true,
  },

  // 🔧 개발 서버 최적화
  onDemandEntries: {
    // 페이지를 메모리에 더 오래 유지
    maxInactiveAge: 60 * 1000, // 1분
    pagesBufferLength: 8, // 더 많은 페이지 캐시
  },

  // 📦 웹팩 최적화 (개발용)
  webpack: (config, { dev, isServer, webpack }) => {
    if (dev) {
      // 개발 모드 극단적 최적화
      config.optimization = {
        ...config.optimization,
        removeAvailableModules: false,
        removeEmptyChunks: false,
        splitChunks: false,
        minimize: false,
      };

      // 빠른 빌드를 위한 캐시 설정
      config.cache = {
        type: 'filesystem',
        allowCollectingMemory: true,
        compression: false, // 압축 비활성화로 속도 향상
        buildDependencies: {
          config: [__filename],
        },
      };

      // 모듈 해상도 최적화
      config.resolve.alias = {
        ...config.resolve.alias,
        // React 중복 방지
        'react': require.resolve('react'),
        'react-dom': require.resolve('react-dom'),
      };

      // 개발용 플러그인 최적화
      config.plugins.push(
        new webpack.DefinePlugin({
          __DEV__: true,
        })
      );
    }

    return config;
  },

  // 🖼️ 이미지 최적화 (개발용 간소화)
  images: {
    formats: ['image/webp'],
    deviceSizes: [640, 768, 1024],
    imageSizes: [16, 32, 48, 64, 96],
    minimumCacheTTL: 60,
    dangerouslyAllowSVG: true,
  },

  // 🎯 타입스크립트 최적화
  typescript: {
    ignoreBuildErrors: true, // 개발 시 빠른 빌드
  },

  // 📝 ESLint 최적화  
  eslint: {
    ignoreDuringBuilds: true, // 개발 시 빠른 빌드
  },

  // 🔄 개발 설정
  compress: false, // gzip 압축 비활성화
  poweredByHeader: false,
  generateEtags: false,

  // 📁 출력 최적화
  distDir: '.next',
  cleanDistDir: true,

  // 🌐 국제화 비활성화 (필요시)
  i18n: undefined,

  // 📊 환경변수 최적화
  env: {
    FAST_REFRESH: 'true',
  },

  // 🔗 리다이렉트 최적화
  async redirects() {
    return [];
  },

  // 📄 헤더 최적화
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
        ],
      },
    ];
  },
};

module.exports = nextConfig; 