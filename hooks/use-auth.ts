"use client"

import { useEffect, useState } from "react"
import type { User, Session } from "@supabase/supabase-js"
import { supabase } from "@/lib/supabase"
import { authService } from "@/lib/auth"
import { dbHelpers } from "@/lib/supabase-helpers"
import { sessionManager } from "@/lib/session-cache"

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
          const { data: usuario, error } = await dbHelpers.usuarios.findById(session.user.id)

          // Se não existir, criar o usuário com mais dados
          if (!usuario) {
            await dbHelpers.usuarios.insert({
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
        }
      }
      
      // Se um usuário se registrou mas não confirmou email, tentar confirmar automaticamente
      if (event === 'SIGNED_IN' && session?.user && !session.user.email_confirmed_at) {
        try {
          // Aguardar um pouco e tentar confirmar
          setTimeout(async () => {
            await supabase.auth.getSession()
          }, 2000)
        } catch (error) {
          // Silencioso
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
