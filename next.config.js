/** @type {import('next').NextConfig} */
const localBaseDomain = process.env.NEXT_PUBLIC_BASE_DOMAIN || "localhost";
const nextConfig = {
  reactStrictMode: true,
  trailingSlash: true,
  output: "standalone",
  transpilePackages: ["@vms/api-client", "@vms/ui"],
  images: {
    domains: ['localhost', "storage.googleapis.com", "vmscore.to", "vmscore.vercel.app"],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'vmscore.to',
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
  // Allow dev origins for cross-origin requests in development (hostnames only, no protocol or port)
  allowedDevOrigins: [
    'localhost',
    '127.0.0.1',
    '192.168.100.20',
    '*.localhost',
    localBaseDomain,
    `*.${localBaseDomain}`,
    "vmsfront.to",
    "dashboard.vmscore.to",
  ],
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      'date-fns',
      'recharts',
      'framer-motion',
      '@fortawesome/fontawesome-free',
    ],
  },
  async rewrites() {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://vmscore.to'
    return [
      {
        source: '/api/:path*',
        destination: `${apiUrl}/api/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
