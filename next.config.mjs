/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configurações otimizadas para Vercel
  eslint: {
    ignoreDuringBuilds: false, // Habilitar ESLint na build
  },
  typescript: {
    ignoreBuildErrors: false, // Habilitado após correções
  },
  images: {
    unoptimized: false, // Habilitar otimização de imagens
    domains: [], // Adicionar domínios se necessário
  },
  devIndicators: {
    position: 'bottom-right',
  },
  // Otimizações para performance ultra-agressiva
  compress: true,
  poweredByHeader: false,
  swcMinify: true,
  
  // Configurações experimentais para máxima performance
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['@supabase/supabase-js', 'lucide-react'],
    turbo: {
      rules: {
        '*.svg': {
          loaders: ['@svgr/webpack'],
          as: '*.js',
        },
      },
    },
  },
  // Headers de segurança
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ]
  },
}

export default nextConfig
