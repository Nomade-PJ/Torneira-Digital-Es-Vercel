

import { createContext, useContext, type ReactNode, useState, useEffect } from "react"
import { authService } from "../../lib/auth"
import { supabase } from "../../lib/supabase"
import type { User, Session } from "@supabase/supabase-js"

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signIn: (credentials: { email: string; password: string }) => Promise<any>
  signUp: (credentials: { 
    email: string; 
    password: string; 
    nomeEstabelecimento: string; 
    cnpjCpf: string; 
    telefone?: string;
    planoId?: string;
  }) => Promise<any>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Verificar sessão inicial simplificado
    const initializeAuth = async () => {
      try {

        
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Erro ao obter sessão:', error)
        }
        
        if (session?.user) {

          setSession(session)
          setUser(session.user)
        } else {

          setSession(null)
          setUser(null)
        }
      } catch (error) {
        console.error('Erro na inicialização:', error)
        setSession(null)
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    initializeAuth()

    // Escutar mudanças de autenticação
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      // console.log('Auth event:', event, 'Session:', !!session) // Desabilitado para produção
      
      if (event === 'SIGNED_OUT') {
        // Garantir limpeza completa no logout
        setSession(null)
        setUser(null)
      } else if (event === 'SIGNED_IN' && session) {
        setSession(session)
        setUser(session.user)
      } else if (event === 'TOKEN_REFRESHED' && session) {
        setSession(session)
        setUser(session.user)
      } else {
        // Para outros eventos, usar a sessão recebida
        setSession(session)
        setUser(session?.user ?? null)
      }
      
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  // Função de logout melhorada
  const handleSignOut = async () => {
    try {
      console.log('Iniciando logout...')
      
      // Limpar estado local primeiro
      setUser(null)
      setSession(null)
      
      // Tentar fazer logout no Supabase com scope global
      const { error } = await supabase.auth.signOut({ scope: 'global' })
      
      if (error) {
        console.warn('Aviso no logout:', error.message)
      } else {
        console.log('Logout no Supabase realizado com sucesso')
      }
      
      // Limpar cache local de forma mais agressiva
      if (typeof window !== 'undefined') {
        // Limpar chaves específicas do Supabase
        const keysToRemove = [
          'torneira-digital-auth.token',
          'torneira-digital-auth.refresh-token', 
          'torneira-digital-auth.expires-at',
          'torneira-digital-auth.user',
          'torneira-digital-auth.session'
        ]
        
        // Limpar chaves conhecidas
        keysToRemove.forEach(key => {
          localStorage.removeItem(key)
          sessionStorage.removeItem(key)
        })
        
        // Limpar todas as chaves que começam com 'sb-' ou contém 'supabase'
        Object.keys(localStorage).forEach(key => {
          if (key.startsWith('sb-') || key.includes('supabase') || key.includes('torneira')) {
            localStorage.removeItem(key)
          }
        })
        
        Object.keys(sessionStorage).forEach(key => {
          if (key.startsWith('sb-') || key.includes('supabase') || key.includes('torneira')) {
            sessionStorage.removeItem(key)
          }
        })
        
        console.log('Cache local limpo')
      }
      
    } catch (error) {
      console.warn('Erro no logout (não crítico):', error)
      // Mesmo com erro, limpar estado local
      setUser(null)
      setSession(null)
    }
  }

  const auth = {
    user,
    session,
    loading,
    signIn: authService.signIn,
    signUp: authService.signUp,
    signOut: handleSignOut,
    resetPassword: authService.resetPassword,
  }

  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>
}

export function useAuthContext() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuthContext must be used within an AuthProvider")
  }
  return context
}
