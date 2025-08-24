// Cliente Supabase centralizado (singleton)
import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Configuração robusta para ambiente de produção e desenvolvimento
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://gkwdspvvpucuoeupxnny.supabase.co'
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdrd2RzcHZ2cHVjdW9ldXB4bm55Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjI3OTQwOTEsImV4cCI6MjAzODM3MDA5MX0.i_4nWkN7XF7Atr7ORm25xaGZ1E6KZH6o-Ou7p8bVKzo'

// Debug das variáveis apenas em desenvolvimento
if (import.meta.env.DEV) {
  console.log('🔧 Supabase Config:', {
    url: supabaseUrl,
    keyExists: !!supabaseKey,
    keyLength: supabaseKey?.length,
    isProduction: import.meta.env.PROD
  })
}

// Cliente único compartilhado
let supabaseInstance: SupabaseClient | null = null

export const getSupabaseClient = (): SupabaseClient => {
  if (!supabaseInstance) {
    supabaseInstance = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: true, // HABILITADO: manter sessão após reload
        autoRefreshToken: true, // HABILITADO: atualizar token automaticamente
        detectSessionInUrl: true, // HABILITADO: detectar sessão na URL
        storage: typeof window !== 'undefined' ? window.localStorage : undefined,
        storageKey: 'torneira-digital-auth-token', // Chave personalizada
        flowType: 'pkce' // Mais seguro para SPAs
      }
    })
  }
  return supabaseInstance
}

// Export default para compatibilidade
export const supabase = getSupabaseClient()
export default supabase