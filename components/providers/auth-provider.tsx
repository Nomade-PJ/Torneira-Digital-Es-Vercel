"use client"

import { createContext, useContext, type ReactNode, useState, useEffect } from "react"
import { authService } from "@/lib/auth"
import { supabase } from "@/lib/supabase"
import { sessionManager } from "@/lib/session-cache"
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
    // Verificar sessão inicial com cache ultra-rápido
    const initializeAuth = async () => {
      try {
        // 1. Verificar cache primeiro (instantâneo)
        const cached = sessionManager.getSession()
        if (cached) {
          setSession(cached.session)
          setUser(cached.user)
          setLoading(false)
          return
        }

        // 2. Se não há cache, buscar do Supabase
        const { data: { session } } = await supabase.auth.getSession()
        
        if (session?.user) {
          // Salvar no cache para próximas vezes
          sessionManager.setSession(session.user, session)
          setSession(session)
          setUser(session.user)
        } else {
          sessionManager.clearSession()
          setSession(null)
          setUser(null)
        }
      } catch (error) {
        sessionManager.clearSession()
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
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      // Se um usuário fez login, garantir que existe na tabela usuarios
      if (event === 'SIGNED_IN' && session?.user) {
        try {
          // Verificar se o usuário existe na tabela usuarios
          const { data: usuario } = await supabase
            .from("usuarios")
            .select("id")
            .eq("id", session.user.id)
            .single()

          // Se não existir, criar o usuário
          if (!usuario) {
            await supabase.from("usuarios").insert({
              id: session.user.id,
              nome: session.user.user_metadata?.nome_estabelecimento || session.user.user_metadata?.nome || 'Usuário',
              email: session.user.email || '',
              nome_estabelecimento: session.user.user_metadata?.nome_estabelecimento || 'Estabelecimento',
              cnpj_cpf: session.user.user_metadata?.cnpj_cpf || '',
              telefone: session.user.user_metadata?.telefone || null
            })
          }
        } catch (error) {
          // Silencioso - não interromper fluxo
          console.warn("Erro ao criar perfil do usuário:", error)
        }
      }
      
      // Atualizar cache quando há mudanças
      if (session?.user) {
        sessionManager.setSession(session.user, session)
      } else {
        sessionManager.clearSession()
      }
      
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const auth = {
    user,
    session,
    loading,
    signIn: authService.signIn,
    signUp: authService.signUp,
    signOut: authService.signOut,
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
