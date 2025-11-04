// File: next.config.ts
import type { NextConfig } from "next";
import bundleAnalyzer from '@next/bundle-analyzer';

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

const nextConfig: NextConfig = {
  // Configure experimental features
  experimental: {
    optimizeCss: false,
    // Disable nextScriptWorkers to prevent Partytown requirement
    nextScriptWorkers: false,
    // Configure server actions
    serverActions: {
      bodySizeLimit: '2mb',
    }
  },
  
  // Add webpack configuration
  webpack: (config) => {
    // Ensure consistent action ID generation
    config.optimization.moduleIds = 'deterministic';
    return config;
  },
  
  // Add headers for security
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
        ],
      },
    ];
  },
};

export default withBundleAnalyzer(nextConfig);