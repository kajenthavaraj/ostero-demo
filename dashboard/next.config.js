/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
  // Configure for App Engine deployment
  output: 'standalone',
  // Disable image optimization for App Engine
  images: {
    unoptimized: true,
  },
  // Ensure trailing slash consistency
  trailingSlash: false,
}

module.exports = nextConfig