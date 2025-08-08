import { supabase } from "@/lib/supabase"

// Helper functions que contornam os problemas de tipagem do Supabase
// Usa 'any' estratégico para evitar conflitos de tipo

export const dbHelpers = {
  // Produtos
  produtos: {
    async select(userId: string, limit = 100) {
      const { data, error } = await supabase
        .from("produtos")
        .select("*")
        .eq("usuario_id" as any, userId)
        .eq("ativo" as any, true)
        .order("created_at" as any, { ascending: false })
        .limit(limit)
      
      return { data: data as any[], error }
    },

    async insert(produto: any) {
      const { data, error } = await supabase
        .from("produtos")
        .insert(produto)
        .select()
        .single()
      
      return { data: data as any, error }
    },

    async update(id: string, updates: any) {
      const { data, error } = await supabase
        .from("produtos")
        .update(updates)
        .eq("id" as any, id)
        .eq("usuario_id" as any, updates.usuario_id || id)
        .select()
        .single()
      
      return { data: data as any, error }
    },

    async findById(id: string, userId: string) {
      const { data, error } = await supabase
        .from("produtos")
        .select("*")
        .eq("id" as any, id)
        .eq("usuario_id" as any, userId)
        .single()
      
      return { data: data as any, error }
    },

    async deactivate(id: string, userId: string) {
      const { error } = await supabase
        .from("produtos")
        .update({ ativo: false } as any)
        .eq("id" as any, id)
        .eq("usuario_id" as any, userId)
      
      return { error }
    },

    async updateStock(id: string, newStock: number) {
      const { error } = await supabase
        .from("produtos")
        .update({ estoque_atual: newStock } as any)
        .eq("id" as any, id)
      
      return { error }
    },

    async getStock(id: string) {
      const { data, error } = await supabase
        .from("produtos")
        .select("estoque_atual")
        .eq("id" as any, id)
        .single()
      
      return { data: data as any, error }
    }
  },

  // Movimentações
  movimentacoes: {
    async select(userId: string, limit = 50) {
      const { data, error } = await supabase
        .from("movimentacoes")
        .select(`
          *,
          produtos (
            nome, marca, categoria, ativo
          )
        `)
        .eq("usuario_id" as any, userId)
        .order("data_movimentacao" as any, { ascending: false })
        .limit(limit)
      
      return { data: data as any[], error }
    },

    async insert(movimentacao: any) {
      const { data, error } = await supabase
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
      const { data, error } = await supabase
        .from("movimentacoes")
        .update(updates)
        .eq("id" as any, id)
        .eq("usuario_id" as any, userId)
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
      const { data, error } = await supabase
        .from("movimentacoes")
        .select("*")
        .eq("id" as any, id)
        .eq("usuario_id" as any, userId)
        .single()
      
      return { data: data as any, error }
    }
  },

  // Usuários
  usuarios: {
    async findById(id: string) {
      const { data, error } = await supabase
        .from("usuarios")
        .select("id")
        .eq("id" as any, id)
        .maybeSingle()
      
      return { data: data as any, error }
    },

    async insert(user: any) {
      const { error } = await supabase
        .from("usuarios")
        .insert(user)
      
      return { error }
    }
  }
}
