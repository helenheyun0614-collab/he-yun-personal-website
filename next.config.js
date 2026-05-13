/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { dev }) => {
    if (dev) {
      config.watchOptions = {
        poll: 2500,
        aggregateTimeout: 800,
        ignored: ['**/node_modules/**', '**/.git/**'],
      }
    }
    return config
  },
  images: {
    domains: [
      'img.youtube.com',
      'i.ytimg.com',
      'maas-log-prod.cn-wlcb.ufileos.com'
    ],
    unoptimized: false,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'maas-log-prod.cn-wlcb.ufileos.com',
        pathname: '/anthropic/**',
      },
    ],
  },
}

module.exports = nextConfig