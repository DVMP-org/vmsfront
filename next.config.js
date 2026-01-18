/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  images: {
    domains: ['localhost', "storage.googleapis.com", "api.vmscore.test", "vmscore.vercel.app"],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'api.vmscore.test',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'vmscore.vercel.app',
        port: '',
        pathname: '/**',
      },
    ],
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // ⛔️ Skips eslint errors at build time
  eslint: {
    ignoreDuringBuilds: true,
  },

  // Allow dev origins for cross-origin requests in development
  allowedDevOrigins: [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://192.168.100.20:3000',
    'http://192.168.100.20',
    "dashboard.vmscore.test"
  ],
  async rewrites() {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL
    return [
      {
        source: '/api/:path*',
        destination: `${apiUrl}/api/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;



// Injected content via Sentry wizard below

// const { withSentryConfig } = require("@sentry/nextjs");
// module.exports = withSentryConfig(module.exports, {
//   org: "vmscore",
//   project: "javascript-nextjs",
//   silent: !process.env.CI,
//   widenClientFileUpload: true,
//   webpack: {
//     automaticVercelMonitors: true,
//     treeshake: {
//       removeDebugLogging: true,
//     },
//   },
// });

