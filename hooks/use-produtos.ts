"use client"

import { useState, useEffect, useCallback } from "react"
import { useAuthContext } from "@/components/providers/auth-provider"
import { SimpleProduto } from "@/lib/supabase-client"
import { dbHelpers } from "@/lib/supabase-helpers"

// Cache local para produtos
const produtosCache = new Map<string, {
  data: SimpleProduto[],
  timestamp: number,
  expiryTime: number
}>()

type Produto = SimpleProduto
type NovoProduto = Omit<SimpleProduto, "id" | "created_at" | "updated_at">
type AtualizarProduto = Partial<Omit<SimpleProduto, "id" | "created_at" | "updated_at">>

export function useProdutos() {
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [loading, setLoading] = useState(false) // Loading removido completamente
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuthContext()

  // Buscar produtos do usuário com cache inteligente
  const fetchProdutos = useCallback(async (forceReload = false) => {
    if (!user) return

    const cacheKey = `produtos_${user.id}`
    const now = Date.now()
    
    // Verificar cache primeiro (válido por 5 minutos)
    if (!forceReload && produtosCache.has(cacheKey)) {
      const cached = produtosCache.get(cacheKey)!
      if (now < cached.expiryTime) {
        setProdutos(cached.data)
        setError(null)
        return
      }
    }

    try {
      // Query otimizada com índices
      const { data, error } = await dbHelpers.produtos.select(user.id, 100)

      if (error) throw error
      
      const produtos = (data || []) as unknown as Produto[]
      setProdutos(produtos)
      setError(null)
      
      // Atualizar cache (válido por 5 minutos)
      produtosCache.set(cacheKey, {
        data: produtos,
        timestamp: now,
        expiryTime: now + (5 * 60 * 1000)
      })
      
    } catch (error: any) {
      console.error("Erro ao buscar produtos:", error)
      setError(error.message)
    }
  }, [user])

  // Criar produto
  const criarProduto = async (produto: Partial<NovoProduto>) => {
    if (!user) throw new Error("Usuário não autenticado")

    try {
      // Preparar dados para inserção - limpar campos vazios ou inválidos
      const dadosLimpos: any = {
        ...produto,
        usuario_id: user.id,
      }

      // Se data_validade for string vazia, remover do objeto
      if (dadosLimpos.data_validade === "" || dadosLimpos.data_validade === null) {
        delete dadosLimpos.data_validade
      }

      // Garantir que campos numéricos sejam válidos
      if (dadosLimpos.estoque_atual === null || dadosLimpos.estoque_atual === undefined) {
        dadosLimpos.estoque_atual = 0
      }
      if (dadosLimpos.estoque_minimo === null || dadosLimpos.estoque_minimo === undefined) {
        dadosLimpos.estoque_minimo = 10
      }
      if (dadosLimpos.preco_compra === null || dadosLimpos.preco_compra === undefined) {
        dadosLimpos.preco_compra = 0
      }
      if (dadosLimpos.preco_venda === null || dadosLimpos.preco_venda === undefined) {
        dadosLimpos.preco_venda = 0
      }

      const { data, error } = await dbHelpers.produtos.insert(dadosLimpos)

      if (error) throw error

      // Invalidar cache
      const cacheKey = `produtos_${user.id}`
      produtosCache.delete(cacheKey)

      // Atualizar lista local
      setProdutos(prev => [data as unknown as Produto, ...prev])
      
      return data
    } catch (error: any) {
      console.error("Erro ao criar produto:", error)
      throw error
    }
  }

  // Atualizar produto
  const atualizarProduto = async (id: string, atualizacoes: AtualizarProduto) => {
    if (!user) throw new Error("Usuário não autenticado")

    try {
      const updateData = { ...atualizacoes, usuario_id: user.id }
      const { data, error } = await dbHelpers.produtos.update(id, updateData)

      if (error) throw error

      // Invalidar cache
      const cacheKey = `produtos_${user.id}`
      produtosCache.delete(cacheKey)

      // Atualizar lista local
      setProdutos(prev =>
        prev.map(produto => produto.id === id ? data as unknown as Produto : produto)
      )

      return data
    } catch (error: any) {
      console.error("Erro ao atualizar produto:", error)
      throw error
    }
  }

  // Deletar produto (marcar como inativo)
  const deletarProduto = async (id: string) => {
    if (!user) throw new Error("Usuário não autenticado")

    try {
      const { error } = await dbHelpers.produtos.deactivate(id, user.id)

      if (error) throw error

      // Remover da lista local
      setProdutos(prev => prev.filter(produto => produto.id !== id))
    } catch (error: any) {
      console.error("Erro ao deletar produto:", error)
      throw error
    }
  }

  // Buscar produto por ID
  const buscarProduto = async (id: string) => {
    if (!user) return null

    try {
      const { data, error } = await dbHelpers.produtos.findById(id, user.id)

      if (error) throw error
      return data as unknown as Produto
    } catch (error: any) {
      console.error("Erro ao buscar produto:", error)
      return null
    }
  }

  // Função para buscar produto por código de barras
  const buscarPorCodigoBarras = async (codigoBarras: string) => {
    try {
      const { data, error } = await supabase
        .from("produtos")
        .select("*")
        .eq("usuario_id", user.id)
        .eq("codigo_barras", codigoBarras)
        .eq("ativo", true)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          // Produto não encontrado
          return null
        }
        throw error
      }
      return data as unknown as Produto
    } catch (error: any) {
      console.error("Erro ao buscar produto por código de barras:", error)
      return null
    }
  }

  // Estatísticas dos produtos
  const estatisticas = {
    total: produtos.length,
    criticos: produtos.filter(p => p.estoque_atual <= (p.estoque_minimo * 0.5)).length,
    baixos: produtos.filter(p => 
      p.estoque_atual > (p.estoque_minimo * 0.5) && 
      p.estoque_atual <= p.estoque_minimo
    ).length,
    valorTotal: produtos.reduce((total, produto) => 
      total + (produto.estoque_atual * produto.preco_compra), 0
    )
  }

  useEffect(() => {
    fetchProdutos()
  }, [user])

  return {
    produtos,
    loading,
    error,
    estatisticas,
    criarProduto,
    atualizarProduto,
    deletarProduto,
    buscarProduto,
    buscarPorCodigoBarras,
    refetch: fetchProdutos,
  }
}