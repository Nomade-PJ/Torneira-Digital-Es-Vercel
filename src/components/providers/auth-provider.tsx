

import { createContext, useContext, type ReactNode, useState, useEffect } from "react"
import { authService } from "../../lib/auth"
import { supabase } from "../../lib/supabase"
import type { User, Session } from "@supabase/supabase-js"

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signIn: (credentials: { email: string; password: string }) => Promise<any>
  signUp: (credentials: any) => Promise<any>
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
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  // Função de logout melhorada
  const handleSignOut = async () => {
    try {
      // Limpar estado local primeiro
      setUser(null)
      setSession(null)
      
      // Tentar fazer logout no Supabase
      const { error } = await supabase.auth.signOut()
      
      // Se houver erro, apenas log mas não falhe
      if (error) {
        console.warn('Aviso no logout:', error.message)
      }
      
      // Limpar cache local
      if (typeof window !== 'undefined') {
        // Limpar localStorage relacionado ao Supabase
        Object.keys(localStorage).forEach(key => {
          if (key.startsWith('sb-')) {
            localStorage.removeItem(key)
          }
        })
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
