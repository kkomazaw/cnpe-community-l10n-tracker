const createNextIntlPlugin = require('next-intl/plugin');

const withNextIntl = createNextIntlPlugin('./src/i18n.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Vercel デプロイ時は output: 'standalone' は不要
  // Docker ビルド時のみ使用する場合は環境変数で切り替え可能
  ...(process.env.DOCKER_BUILD === 'true' && { output: 'standalone' }),
  eslint: {
    ignoreDuringBuilds: false,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
};

module.exports = withNextIntl(nextConfig);
