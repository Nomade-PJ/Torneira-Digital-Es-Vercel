"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { useAuthContext } from "@/components/providers/auth-provider"
import { useToast } from "@/hooks/use-toast"

interface UserProfile {
  id: string
  email: string
  nome_completo: string | null
  nome_estabelecimento: string
  cnpj_cpf: string
  telefone: string | null
  avatar_url: string | null
  role: string
  created_at: string
  updated_at: string
}

export function useUserProfile() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuthContext()
  const { toast } = useToast()

  // Buscar perfil do usuário
  const fetchProfile = async () => {
    if (!user) {
      setProfile(null)
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const { data, error: fetchError } = await supabase
        .from("usuarios")
        .select("*")
        .eq("id", user.id)
        .single()

      if (fetchError) {
        // Se o usuário não existe na tabela usuarios, criar automaticamente
        if (fetchError.code === "PGRST116") {
          console.log("Usuário não encontrado na tabela usuarios, criando...")
          await createUserProfile()
          return
        }
        throw fetchError
      }

      setProfile(data)
    } catch (error: any) {
      console.error("Erro ao buscar perfil:", error)
      setError(error.message)
      toast({
        title: "Erro",
        description: "Erro ao carregar perfil do usuário",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Criar perfil do usuário automaticamente
  const createUserProfile = async () => {
    if (!user) return

    try {
      const profileData = {
        id: user.id,
        email: user.email || "",
        nome_completo: user.user_metadata?.nome_completo || user.email?.split("@")[0] || "Usuário",
        nome_estabelecimento: user.user_metadata?.nome_estabelecimento || "Meu Estabelecimento",
        cnpj_cpf: user.user_metadata?.cnpj_cpf || "",
        telefone: user.user_metadata?.telefone || null,
      }

      const { data, error } = await supabase
        .from("usuarios")
        .insert(profileData)
        .select()
        .single()

      if (error) throw error

      setProfile(data)
      console.log("✅ Perfil criado automaticamente:", data.email)
      
      toast({
        title: "Perfil criado",
        description: "Bem-vindo ao Torneira Digital!",
      })
    } catch (error: any) {
      console.error("Erro ao criar perfil:", error)
      setError(error.message)
      toast({
        title: "Erro",
        description: "Erro ao criar perfil do usuário",
        variant: "destructive",
      })
    }
  }

  // Atualizar perfil
  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user || !profile) return

    try {
      const { data, error } = await supabase
        .from("usuarios")
        .update(updates)
        .eq("id", user.id)
        .select()
        .single()

      if (error) throw error

      setProfile(data)
      toast({
        title: "Sucesso",
        description: "Perfil atualizado com sucesso",
      })

      return data
    } catch (error: any) {
      console.error("Erro ao atualizar perfil:", error)
      toast({
        title: "Erro",
        description: "Erro ao atualizar perfil",
        variant: "destructive",
      })
      throw error
    }
  }

  // Verificar se usuário tem dados necessários
  const isProfileComplete = () => {
    if (!profile) return false
    return !!(
      profile.nome_estabelecimento &&
      profile.cnpj_cpf &&
      profile.email
    )
  }

  // Estatísticas do usuário
  const getProfileStats = () => {
    if (!profile) return null

    return {
      memberSince: new Date(profile.created_at).toLocaleDateString("pt-BR"),
      role: profile.role || "admin",
      hasCompletedProfile: isProfileComplete(),
      establishmentName: profile.nome_estabelecimento,
      email: profile.email,
    }
  }

  useEffect(() => {
    fetchProfile()
  }, [user])

  return {
    profile,
    loading,
    error,
    updateProfile,
    isProfileComplete,
    getProfileStats,
    refetch: fetchProfile,
  }
}
