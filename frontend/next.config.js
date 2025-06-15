/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL ||
      (process.env.INSTANCE && process.env.INSTANCE !== 'dev'
        ? `https://api.${process.env.INSTANCE}.uruenterprises.com/api`
        : 'http://localhost:8000/api'),
  },
  images: {
    domains: [
      'localhost',
      // Dynamic domains based on environment
      ...(process.env.INSTANCE ? [
        `${process.env.INSTANCE}.uruenterprises.com`,
        `api.${process.env.INSTANCE}.uruenterprises.com`
      ] : [
        'dynamosoftware.dev.uruenterprises.com',
        'api.dynamosoftware.dev.uruenterprises.com'
      ])
    ],
  },
  // Add security headers
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
    ]
  },
  // Handle crypto-js module
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        crypto: require.resolve('crypto-browserify'),
        stream: require.resolve('stream-browserify'),
        buffer: require.resolve('buffer/'),
      };
    }
    return config;
  }
}

module.exports = nextConfig
