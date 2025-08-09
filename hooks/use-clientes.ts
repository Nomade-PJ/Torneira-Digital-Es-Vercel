"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { useAuthContext } from "@/components/providers/auth-provider"
import { useToast } from "@/hooks/use-toast"
import type { Database } from "@/types/database"

type Cliente = Database["public"]["Tables"]["clientes"]["Row"]
type NovoCliente = Database["public"]["Tables"]["clientes"]["Insert"]
type AtualizarCliente = Database["public"]["Tables"]["clientes"]["Update"]

export function useClientes() {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuthContext()
  const { toast } = useToast()

  // Buscar clientes do usuário
  const fetchClientes = async () => {
    if (!user) return

    try {
      setLoading(true)
      setError(null)
      
      const { data, error } = await supabase
        .from("clientes")
        .select("*")
        .eq("usuario_id", user.id)
        .eq("ativo", true)
        .order("nome", { ascending: true })

      if (error) throw error
      setClientes(data || [])
    } catch (error: any) {
      console.error("Erro ao buscar clientes:", error)
      setError(error.message)
      toast({
        title: "Erro",
        description: "Erro ao carregar clientes",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Criar cliente
  const criarCliente = async (cliente: Omit<NovoCliente, "id" | "usuario_id" | "created_at" | "updated_at">) => {
    if (!user) throw new Error("Usuário não autenticado")

    try {
      const { data, error } = await supabase
        .from("clientes")
        .insert({
          ...cliente,
          usuario_id: user.id,
        })
        .select()
        .single()

      if (error) throw error
      
      // Atualizar lista local
      setClientes(prev => [data, ...prev])
      
      toast({
        title: "Sucesso",
        description: "Cliente criado com sucesso",
      })

      return data
    } catch (error: any) {
      console.error("Erro ao criar cliente:", error)
      toast({
        title: "Erro",
        description: "Erro ao criar cliente",
        variant: "destructive",
      })
      throw error
    }
  }

  // Atualizar cliente
  const atualizarCliente = async (id: string, atualizacoes: AtualizarCliente) => {
    if (!user) throw new Error("Usuário não autenticado")

    try {
      const { data, error } = await supabase
        .from("clientes")
        .update(atualizacoes)
        .eq("id", id)
        .eq("usuario_id", user.id)
        .select()
        .single()

      if (error) throw error
      
      // Atualizar lista local
      setClientes(prev => 
        prev.map(cliente => cliente.id === id ? data : cliente)
      )
      
      toast({
        title: "Sucesso",
        description: "Cliente atualizado com sucesso",
      })

      return data
    } catch (error: any) {
      console.error("Erro ao atualizar cliente:", error)
      toast({
        title: "Erro",
        description: "Erro ao atualizar cliente",
        variant: "destructive",
      })
      throw error
    }
  }

  // Desativar cliente (soft delete)
  const desativarCliente = async (id: string) => {
    if (!user) throw new Error("Usuário não autenticado")

    try {
      const { error } = await supabase
        .from("clientes")
        .update({ ativo: false })
        .eq("id", id)
        .eq("usuario_id", user.id)

      if (error) throw error
      
      // Remover da lista local
      setClientes(prev => prev.filter(cliente => cliente.id !== id))
      
      toast({
        title: "Sucesso",
        description: "Cliente removido com sucesso",
      })
    } catch (error: any) {
      console.error("Erro ao desativar cliente:", error)
      toast({
        title: "Erro",
        description: "Erro ao remover cliente",
        variant: "destructive",
      })
      throw error
    }
  }

  // Buscar cliente por ID
  const buscarClientePorId = async (id: string): Promise<Cliente | null> => {
    if (!user) return null

    try {
      const { data, error } = await supabase
        .from("clientes")
        .select("*")
        .eq("id", id)
        .eq("usuario_id", user.id)
        .single()

      if (error) throw error
      return data
    } catch (error: any) {
      console.error("Erro ao buscar cliente:", error)
      return null
    }
  }

  // Buscar clientes por termo
  const buscarClientes = async (termo: string): Promise<Cliente[]> => {
    if (!user || !termo) return []

    try {
      const { data, error } = await supabase
        .from("clientes")
        .select("*")
        .eq("usuario_id", user.id)
        .eq("ativo", true)
        .or(`nome.ilike.%${termo}%, cpf_cnpj.ilike.%${termo}%, telefone.ilike.%${termo}%`)
        .order("nome", { ascending: true })
        .limit(10)

      if (error) throw error
      return data || []
    } catch (error: any) {
      console.error("Erro ao buscar clientes:", error)
      return []
    }
  }

  // Estatísticas dos clientes
  const estatisticas = {
    total: clientes.length,
    pessoaFisica: clientes.filter(c => c.tipo === "pessoa_fisica").length,
    pessoaJuridica: clientes.filter(c => c.tipo === "pessoa_juridica").length,
    consumidorFinal: clientes.filter(c => c.tipo === "consumidor_final").length,
    novosEsseMes: clientes.filter(c => {
      const agora = new Date()
      const clienteData = new Date(c.created_at)
      return clienteData.getMonth() === agora.getMonth() && 
             clienteData.getFullYear() === agora.getFullYear()
    }).length,
  }

  useEffect(() => {
    fetchClientes()
  }, [user?.id])

  return {
    clientes,
    loading,
    error,
    estatisticas,
    criarCliente,
    atualizarCliente,
    desativarCliente,
    buscarClientePorId,
    buscarClientes,
    refetch: fetchClientes,
  }
}
