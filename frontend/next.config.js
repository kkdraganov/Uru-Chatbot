/** @type {import('next').NextConfig} */

// DEBUG: Log environment variables during Next.js config load (next.config.js:env_setup)
console.log('[NEXT_CONFIG] NEXT_PUBLIC_API_URL from env:', process.env.NEXT_PUBLIC_API_URL);
console.log('[NEXT_CONFIG] INSTANCE from env:', process.env.INSTANCE);
console.log('[NEXT_CONFIG] NODE_ENV from env:', process.env.NODE_ENV);

// Determine API URL
const apiUrl = process.env.NEXT_PUBLIC_API_URL ||
  (process.env.INSTANCE && process.env.INSTANCE !== 'dev'
    ? `https://api.${process.env.INSTANCE}.uruenterprises.com/api`
    : 'http://localhost:8000/api');

// DEBUG: Log final API URL (next.config.js:api_url_final)
console.log('[NEXT_CONFIG] Final API URL:', apiUrl);

const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  env: {
    NEXT_PUBLIC_API_URL: apiUrl,
  },
  images: {
    domains: (() => {
      const baseDomains = ['localhost'];
      const instanceDomains = process.env.INSTANCE ? [
        `${process.env.INSTANCE}.uruenterprises.com`,
        `api.${process.env.INSTANCE}.uruenterprises.com`
      ] : [
        'dynamosoftware.dev.uruenterprises.com',
        'api.dynamosoftware.dev.uruenterprises.com'
      ];
      const allDomains = [...baseDomains, ...instanceDomains];
      // DEBUG: Log image domains configuration (next.config.js:image_domains)
      console.log('[NEXT_CONFIG] Image domains configured:', allDomains);
      return allDomains;
    })(),
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
