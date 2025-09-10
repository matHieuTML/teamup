import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    typedRoutes: true,
  },
  images: {
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
        port: '',
        pathname: '/v0/b/**',
      },
    ],
  },
  compress: true,
  eslint: {
    // Permettre le build même avec des erreurs ESLint (pour le développement)
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Permettre le build même avec des erreurs TypeScript (pour le développement)
    ignoreBuildErrors: false,
  },
};

export default nextConfig;
