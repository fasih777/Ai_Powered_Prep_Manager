/** @type {import('next').NextConfig} */
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000';

const nextConfig = {
  images: {
    domains: ['localhost'],
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
  },
  output: 'standalone',

  /**
   * Proxy /api/v1/* → FastAPI backend /v1/*
   * This avoids CORS in dev and allows the frontend to call
   * /api/v1/prep-review without knowing the backend port.
   */
  async rewrites() {
    return [
      // System / health aliases expected by page.tsx
      {
        source: '/api/v1/system/status',
        destination: `${BACKEND_URL}/v1/system/status`,
      },
      // Sync evaluation alias
      {
        source: '/api/v1/prep-review/evaluate-sync',
        destination: `${BACKEND_URL}/v1/prep-review/evaluate-sync`,
      },
      // Async enqueue alias
      {
        source: '/api/v1/prep-review/async',
        destination: `${BACKEND_URL}/v1/prep-review/async`,
      },
      // Wildcard – catch all remaining /api/v1/* routes
      {
        source: '/api/v1/:path*',
        destination: `${BACKEND_URL}/v1/:path*`,
      },
      // Also proxy raw /health for the healthCheck() helper
      {
        source: '/api/health',
        destination: `${BACKEND_URL}/health`,
      },
    ];
  },
};

module.exports = nextConfig;
