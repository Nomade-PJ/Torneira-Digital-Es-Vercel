// Cliente Supabase centralizado (singleton)
import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Configuração via variáveis de ambiente
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Validação das variáveis obrigatórias
if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    '❌ Configuração incompleta do Supabase!\n' +
    'Verifique se as variáveis VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY estão configuradas no arquivo .env\n' +
    'Consulte env.example para mais informações.'
  )
}

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