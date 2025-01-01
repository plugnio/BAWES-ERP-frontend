/** @type {import('next').NextConfig} */
const nextConfig = {
  // Add essential Next.js configurations here
  reactStrictMode: true,
  poweredByHeader: false,
  typescript: {
    // This will not ignore during development, but will ignore during builds
    ignoreBuildErrors: process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'test'
  },
  eslint: {
    // Only ignore during test builds
    ignoreDuringBuilds: process.env.NODE_ENV === 'test'
  }
}

module.exports = nextConfig 