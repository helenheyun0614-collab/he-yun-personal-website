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
}

module.exports = nextConfig
