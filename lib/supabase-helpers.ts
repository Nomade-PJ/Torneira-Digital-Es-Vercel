import { supabase } from "@/lib/supabase"

// Helper functions que contornam os problemas de tipagem do Supabase
// Usa 'any' estratégico para evitar conflitos de tipo

export const dbHelpers = {
  // Produtos
  produtos: {
    async select(userId: string, limit = 100) {
      const { data, error } = await (supabase as any)
        .from("produtos")
        .select("*")
        .eq("usuario_id", userId)
        .eq("ativo", true)
        .order("created_at", { ascending: false })
        .limit(limit)
      
      return { data: data as any[], error }
    },

    async insert(produto: any) {
      const { data, error } = await (supabase as any)
        .from("produtos")
        .insert(produto)
        .select()
        .single()
      
      return { data: data as any, error }
    },

    async update(id: string, updates: any) {
      const { data, error } = await (supabase as any)
        .from("produtos")
        .update(updates)
        .eq("id", id)
        .eq("usuario_id", updates.usuario_id || id)
        .select()
        .single()
      
      return { data: data as any, error }
    },

    async findById(id: string, userId: string) {
      const { data, error } = await (supabase as any)
        .from("produtos")
        .select("*")
        .eq("id", id)
        .eq("usuario_id", userId)
        .single()
      
      return { data: data as any, error }
    },

    async deactivate(id: string, userId: string) {
      const { error } = await (supabase as any)
        .from("produtos")
        .update({ ativo: false })
        .eq("id", id)
        .eq("usuario_id", userId)
      
      return { error }
    },

    async updateStock(id: string, newStock: number) {
      const { error } = await (supabase as any)
        .from("produtos")
        .update({ estoque_atual: newStock })
        .eq("id", id)
      
      return { error }
    },

    async getStock(id: string) {
      const { data, error } = await (supabase as any)
        .from("produtos")
        .select("estoque_atual")
        .eq("id", id)
        .single()
      
      return { data: data as any, error }
    }
  },

  // Movimentações
  movimentacoes: {
    async select(userId: string, limit = 50) {
      const { data, error } = await (supabase as any)
        .from("movimentacoes")
        .select(`
          *,
          produtos (
            nome, marca, categoria, ativo
          )
        `)
        .eq("usuario_id", userId)
        .order("data_movimentacao" as any, { ascending: false })
        .limit(limit)
      
      return { data: data as any[], error }
    },

    async insert(movimentacao: any) {
      const { data, error } = await (supabase as any)
        .from("movimentacoes")
        .insert(movimentacao)
        .select(`
          *,
          produtos (
            nome,
            marca,
            categoria,
            ativo
          )
        `)
        .single()
      
      return { data: data as any, error }
    },

    async update(id: string, userId: string, updates: any) {
      const { data, error } = await (supabase as any)
        .from("movimentacoes")
        .update(updates)
        .eq("id", id)
        .eq("usuario_id", userId)
        .select(`
          *,
          produtos (
            nome,
            marca,
            categoria,
            ativo
          )
        `)
        .single()
      
      return { data: data as any, error }
    },

    async findById(id: string, userId: string) {
      const { data, error } = await (supabase as any)
        .from("movimentacoes")
        .select("*")
        .eq("id", id)
        .eq("usuario_id", userId)
        .single()
      
      return { data: data as any, error }
    }
  },

  // Usuários
  usuarios: {
    async findById(id: string) {
      const { data, error } = await (supabase as any)
        .from("usuarios")
        .select("id")
        .eq("id", id)
        .maybeSingle()
      
      return { data: data as any, error }
    },

    async insert(user: any) {
      const { error } = await (supabase as any)
        .from("usuarios")
        .insert(user)
      
      return { error }
    }
  }
}
