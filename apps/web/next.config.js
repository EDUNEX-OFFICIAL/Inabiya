/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@inabiya/types', '@inabiya/validation'],
};

module.exports = nextConfig;
