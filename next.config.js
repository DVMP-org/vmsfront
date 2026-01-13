/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  images: {
    domains: ['localhost', "storage.googleapis.com"],
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

