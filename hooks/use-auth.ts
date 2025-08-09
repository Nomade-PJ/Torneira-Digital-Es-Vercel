"use client"

import { useEffect, useState } from "react"
import type { User, Session } from "@supabase/supabase-js"
import { supabase } from "@/lib/supabase"
import { authService } from "@/lib/auth"
import { dbHelpers } from "@/lib/supabase-helpers"

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Obter sessão inicial de forma otimizada
    const getInitialSession = async () => {
      try {
        const session = await authService.getCurrentSession()
        setSession(session)
        setUser(session?.user ?? null)
      } catch (error) {
        console.warn("Erro ao obter sessão:", error)
        setSession(null)
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    // Verificar sessão inicial de forma mais robusta
    const initializeAuth = async () => {
      try {
        // Verificar se há sessão no localStorage primeiro
        if (typeof window !== 'undefined') {
          const keys = Object.keys(localStorage).filter(key => 
            key.includes('supabase.auth.token') || key.includes('sb-') && key.includes('auth-token')
          )
          
          if (keys.length === 0) {
            // Se não há tokens, usuário não está logado
            setLoading(false)
            setUser(null)
            setSession(null)
            return
          }
        }
        
        // Se há tokens, verificar sessão no servidor
        await getInitialSession()
      } catch (error) {
        console.warn("Erro ao inicializar auth:", error)
        setLoading(false)
        setUser(null)
        setSession(null)
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
          const { data: usuario, error } = await dbHelpers.usuarios.findById(session.user.id)

          // Se não existir, criar o usuário com mais dados
          if (!usuario) {
            console.log("🔄 Criando perfil automático no login...")
            const { error: insertError } = await dbHelpers.usuarios.insert({
              id: session.user.id,
              nome: session.user.user_metadata?.nome_estabelecimento || session.user.user_metadata?.nome || 'Usuário',
              email: session.user.email || '',
              nome_estabelecimento: session.user.user_metadata?.nome_estabelecimento || 'Estabelecimento',
              cnpj_cpf: session.user.user_metadata?.cnpj_cpf || '',
              telefone: session.user.user_metadata?.telefone || null
            })
            
            if (insertError) {
              console.warn("⚠️ Erro ao criar perfil automático:", insertError)
            } else {
              console.log("✅ Perfil criado automaticamente no login")
            }
          }
        } catch (error) {
          // Silencioso - não interromper fluxo
        }
      }
      
      // Se um usuário se registrou mas não confirmou email, tentar confirmar automaticamente
      if (event === 'SIGNED_IN' && session?.user && !session.user.email_confirmed_at) {
        console.log("🔄 Tentando confirmar email automaticamente...")
        
        try {
          // Aguardar um pouco e tentar confirmar
          setTimeout(async () => {
            const { data: currentSession } = await supabase.auth.getSession()
            if (currentSession.session?.user && !currentSession.session.user.email_confirmed_at) {
              console.log("⚠️ Email ainda não confirmado, mas permitindo acesso...")
            }
          }, 2000)
        } catch (error) {
          console.warn("Erro ao verificar confirmação:", error)
        }
      }
      
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  return {
    user,
    session,
    loading,
    signIn: authService.signIn,
    signUp: authService.signUp,
    signOut: authService.signOut,
    resetPassword: authService.resetPassword,
  }
}
