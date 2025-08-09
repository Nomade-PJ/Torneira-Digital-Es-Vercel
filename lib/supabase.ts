import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Configurações ultra-otimizadas para produção (Vercel)
const supabaseOptions = {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false, // Desabilitar para evitar problemas na Vercel
    flowType: 'implicit' as const, // Usar implicit flow para melhor compatibilidade
    debug: false, // Desabilitar debug em produção para performance
    storage: typeof window !== 'undefined' ? {
      getItem: (key: string) => {
        try {
          return window.localStorage.getItem(key)
        } catch {
          return null
        }
      },
      setItem: (key: string, value: string) => {
        try {
          window.localStorage.setItem(key, value)
        } catch {
          // Falha silenciosa se localStorage não disponível
        }
      },
      removeItem: (key: string) => {
        try {
          window.localStorage.removeItem(key)
        } catch {
          // Falha silenciosa se localStorage não disponível
        }
      }
    } : undefined,
    storageKey: `sb-${supabaseUrl.split('//')[1]?.split('.')[0] || 'default'}-auth-token`,
  },
  db: {
    schema: 'public',
  },
  global: {
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache', // Evitar cache desnecessário
      'Pragma': 'no-cache'
    },
    // Timeout otimizado para produção
    fetch: (input: RequestInfo | URL, init?: RequestInit) => {
      return fetch(input, {
        ...init,
        // Timeout de 5 segundos para evitar travamentos
        signal: AbortSignal.timeout(5000)
      })
    }
  },
  // Configurações otimizadas para Vercel
  realtime: {
    params: {
      eventsPerSecond: 3 // Ainda mais reduzido para performance
    }
  }
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, supabaseOptions)

// Cliente para uso no servidor
export const createServerClient = () => {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
}
