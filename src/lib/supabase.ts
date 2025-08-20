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
    storageKey: 'torneira-digital-auth',
    debug: false // Desabilitar logs verbosos completamente
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
  },
  // Desabilitar logs do GoTrueClient
  db: {
    schema: 'public'
  }
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, supabaseOptions)

// Configuração para reduzir logs verbosos do Supabase
if (typeof window !== 'undefined') {
  // Interceptar apenas logs específicos do Supabase
  const originalLog = console.log
  console.log = (...args: any[]) => {
    const message = args.join(' ')
    // Filtrar logs do GoTrueClient
    if (message.includes('GoTrueClient') || 
        message.includes('#_acquireLock') || 
        message.includes('#_useSession') ||
        message.includes('#__loadSession') ||
        message.includes('#_autoRefreshTokenTick') ||
        message.includes('#_recoverAndRefresh') ||
        message.includes('#onAuthStateChange') ||
        message.includes('#_onVisibilityChanged') ||
        message.includes('#_stopAutoRefresh') ||
        message.includes('#_startAutoRefresh')) {
      return // Silenciar estes logs
    }
    originalLog.apply(console, args)
  }
}


