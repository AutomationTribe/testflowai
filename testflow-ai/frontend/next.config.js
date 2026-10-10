const { buildSecurityHeaders } = require('./security-headers');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: buildSecurityHeaders({
          isDev: process.env.NODE_ENV !== 'production',
          // Same variable (and default) the API client uses; it is baked in at build time.
          apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4000',
        }),
      },
    ];
  },
};

module.exports = nextConfig;
