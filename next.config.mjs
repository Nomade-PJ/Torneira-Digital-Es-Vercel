/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configurações otimizadas para Vercel
  eslint: {
    ignoreDuringBuilds: false, // Habilitar ESLint na build
  },
  typescript: {
    ignoreBuildErrors: false, // Manter rigoroso para qualidade
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
  
  // Configurações experimentais para máxima performance
  experimental: {
    // optimizeCss: true, // Desabilitado temporariamente - causa erro com critters
    optimizePackageImports: ['lucide-react'],
  },
  
  // Configuração correta para pacotes externos
  serverExternalPackages: ['@supabase/supabase-js'],

  // Configurações de performance para Vercel
  async rewrites() {
    return []
  },

  // Otimizações para Edge Runtime
  output: 'standalone',
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
