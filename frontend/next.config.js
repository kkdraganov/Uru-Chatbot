/** @type {import('next').NextConfig} */

// DEBUG: Log environment variables during Next.js config load (next.config.js:env_setup)
console.log(
  '[NEXT_CONFIG] NEXT_PUBLIC_API_URL from env:',
  process.env.NEXT_PUBLIC_API_URL,
);
console.log('[NEXT_CONFIG] INSTANCE from env:', process.env.INSTANCE);
console.log('[NEXT_CONFIG] ENVIRONMENT from env:', process.env.ENVIRONMENT);

// Determine API URL with better fallback logic
let apiUrl = process.env.NEXT_PUBLIC_API_URL;

// If NEXT_PUBLIC_API_URL is not set or empty, construct it
if (!apiUrl || apiUrl.trim() === '') {
  const instance = process.env.INSTANCE;
  const environment = process.env.ENVIRONMENT;
  if (environment && environment == 'production' && instance) {
    // Production: use instance-based URL
    apiUrl = `https://api.${instance}.uruenterprises.com/api`;
  } else {
    // Development: use localhost
    apiUrl = 'http://localhost:8000/api';
  }
}

// DEBUG: Log final API URL (next.config.js:api_url_final)
console.log('[NEXT_CONFIG] Final API URL:', apiUrl);

const nextConfig = {
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_API_URL: apiUrl,
  },
  images: {
    domains: (() => {
      const environment = process.env.ENVIRONMENT;
      const instance = process.env.INSTANCE;

      // Always include localhost for development
      const baseDomains = ['localhost', '127.0.0.1'];
      let instanceDomains = [];

      // Only add production domains if we're actually in production
      if (environment === 'production' && instance && instance !== 'dev') {
        instanceDomains = [
          `${instance}.uruenterprises.com`,
          `api.${instance}.uruenterprises.com`,
        ];
      }
      // For development, don't add the production domains since they're not used
      // This prevents unnecessary domain allowlisting

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
    ];
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
  },
};

module.exports = nextConfig;
