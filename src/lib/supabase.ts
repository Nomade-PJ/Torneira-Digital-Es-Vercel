import { createClient } from "@supabase/supabase-js"

// Configuração das variáveis de ambiente (sem fallback - totalmente seguro)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY



// Validação rigorosa das variáveis de ambiente
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    '❌ VARIÁVEIS DE AMBIENTE DO SUPABASE OBRIGATÓRIAS!\n\n' +
    '🔧 Configure estas variáveis:\n' +
    '   VITE_SUPABASE_URL=sua-url-do-projeto\n' +
    '   VITE_SUPABASE_ANON_KEY=sua-chave-publica\n\n' +
    '📂 Onde configurar:\n' +
    '   • Desenvolvimento: arquivo .env.local\n' +
    '   • Produção: dashboard da Vercel\n' +
    '   • CI/CD: secrets do repositório\n\n' +
    '📋 Consulte: env.example para modelo'
  )
}

// Configuração otimizada para produção
const supabaseOptions = {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    flowType: 'implicit' as const,
    storageKey: 'torneira-digital-auth'
  },
  global: {
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'x-application': 'torneira-digital'
    }
  },
  realtime: {
    // Reduzir overhead do realtime se não usado
    params: {
      eventsPerSecond: 10
    }
  }
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, supabaseOptions)


