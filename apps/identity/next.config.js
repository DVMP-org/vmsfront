/** @type {import('next').NextConfig} */
const localBaseDomain = process.env.NEXT_PUBLIC_BASE_DOMAIN || "localhost";

module.exports = {
  reactStrictMode: true,
  trailingSlash: true,
  transpilePackages: ["@vms/ui"],
  assetPrefix: process.env.NEXT_PUBLIC_ASSET_PREFIX,
  allowedDevOrigins: [
    'localhost',
    '127.0.0.1',
    '192.168.100.20',
    '*.localhost',
    'context-acceptance.localhost',
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
};
