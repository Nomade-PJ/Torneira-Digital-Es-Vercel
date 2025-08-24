// Cliente Supabase centralizado (singleton)
import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://gkwdspvvpucuoeupxnny.supabase.co'
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdrd2RzcHZ2cHVjdW9ldXB4bm55Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQzMjczMzEsImV4cCI6MjA2OTkwMzMzMX0.QyiBYqQIlegSfv8UKVR3gQRchaR_C23_6M78RNLumzk'

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