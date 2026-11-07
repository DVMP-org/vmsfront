/** @type {import('next').NextConfig} */
module.exports = {
  reactStrictMode: true,
  trailingSlash: true,
  transpilePackages: ["@vms/ui"],
  assetPrefix: process.env.NEXT_PUBLIC_ASSET_PREFIX,
};
