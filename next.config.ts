import type { NextConfig } from "next";

// Bundle analyzer
const withBundleAnalyzer = process.env.ANALYZE === 'true' 
  ? (config: NextConfig) => {
      try {
        // Dynamic import to avoid top-level await issues
        const bundleAnalyzer = require('@next/bundle-analyzer')({
          enabled: process.env.ANALYZE === 'true',
        });
        return bundleAnalyzer(config);
      } catch (error) {
        console.warn('Bundle analyzer not available:', error);
        return config;
      }
    }
  : (config: NextConfig) => config;

const nextConfig: NextConfig = {
  // Production optimizations
  poweredByHeader: false,
  generateEtags: false,
  compress: true,
  
  // Generate stable build ID to prevent action ID mismatches
  generateBuildId: async () => {
    return process.env.VERCEL_GIT_COMMIT_SHA || process.env.CUSTOM_BUILD_ID || 'development-build';
  },
  
  // Image optimization
  images: {
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 31536000, // 1 year
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
    ],
  },
  
  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
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
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
          },
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://api.groq.com https://openrouter.ai https://api-inference.huggingface.co https://www.googleapis.com https://en.wikipedia.org https://satsuite.collegeboard.org https://www.khanacademy.org https://api.vercel.com https://*.sentry.io; frame-src 'self' https://accounts.google.com https://github.com; frame-ancestors 'none'; object-src 'none'; base-uri 'self'; form-action 'self';",
          },
        ],
      },
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
          {
            key: 'Expires',
            value: '0',
          },
        ],
      },
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
  
  // Environment variables validation
  env: {
    CUSTOM_BUILD_ID: process.env.VERCEL_GIT_COMMIT_SHA || 'local',
  },

  // Server external packages - avoid including client component packages
  serverExternalPackages: ['@prisma/client'],
  
  // Experimental features for performance
  experimental: {
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons', '@/components', '@/lib', '@/app'],
    serverActions: {
      bodySizeLimit: '2mb',
      allowedOrigins: ['localhost:3001', 'localhost:3000'],
    },
  },
};

export default withBundleAnalyzer(nextConfig);
