import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// 🚀 Configuração simples e poderosa do Vite
export default defineConfig({
  plugins: [react()],
  
  // 🔧 Resolver aliases para imports limpos
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  
  // 🔧 Configurações de servidor para desenvolvimento
  server: {
    port: 3000,
    open: true,
    host: true
  },
  
  // 🔧 Configurações de build otimizadas
  build: {
    outDir: 'dist',
    sourcemap: true,
    minify: 'esbuild',
    target: 'esnext',
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'supabase-vendor': ['@supabase/supabase-js'],
          'ui-vendor': ['lucide-react', '@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu']
        }
      }
    }
  },
  
  // 🔧 Variáveis de ambiente
  define: {
    __DEV__: JSON.stringify(process.env.NODE_ENV === 'development')
  },
  
  // 🔐 Configuração de env vars para desenvolvimento (remover em produção)
  envPrefix: ['VITE_'],
})
