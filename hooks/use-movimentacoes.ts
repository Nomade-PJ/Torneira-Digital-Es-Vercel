"use client"

import { useState, useEffect, useCallback } from "react"
import { useAuthContext } from "@/components/providers/auth-provider"
import { useToast } from "@/hooks/use-toast"
import { SimpleMovimentacao } from "@/lib/supabase-client"
import { dbHelpers } from "@/lib/supabase-helpers"

// Cache local para movimentações
const movimentacoesCache = new Map<string, {
  data: SimpleMovimentacao[],
  timestamp: number,
  expiryTime: number
}>()

type Movimentacao = SimpleMovimentacao
type NovaMovimentacao = Omit<SimpleMovimentacao, "id" | "created_at" | "updated_at" | "produtos">
type AtualizarMovimentacao = Partial<Omit<SimpleMovimentacao, "id" | "created_at" | "updated_at" | "produtos">>

export function useMovimentacoes() {
  const [movimentacoes, setMovimentacoes] = useState<Movimentacao[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuthContext()
  const { toast } = useToast()

  // Buscar movimentações do usuário com cache
  const fetchMovimentacoes = useCallback(async (forceReload = false) => {
    if (!user) return

    const cacheKey = `movimentacoes_${user.id}`
    const now = Date.now()
    
    // Verificar cache primeiro (válido por 3 minutos)
    if (!forceReload && movimentacoesCache.has(cacheKey)) {
      const cached = movimentacoesCache.get(cacheKey)!
      if (now < cached.expiryTime) {
        setMovimentacoes(cached.data)
        return
      }
    }

    try {
      // Query otimizada - apenas últimos 50 registros
      const { data, error } = await dbHelpers.movimentacoes.select(user.id, 50)

      if (error) throw error
      
      const movimentacoes = (data || []) as unknown as Movimentacao[]
      setMovimentacoes(movimentacoes)
      
      // Atualizar cache (válido por 3 minutos)
      movimentacoesCache.set(cacheKey, {
        data: movimentacoes,
        timestamp: now,
        expiryTime: now + (3 * 60 * 1000)
      })
      
    } catch (error: any) {
      console.error("Erro ao buscar movimentações:", error)
      setError(error.message)
      toast({
        title: "Erro",
        description: "Erro ao carregar movimentações",
        variant: "destructive",
      })
    }
  }, [user, toast])

  // Criar movimentação
  const criarMovimentacao = async (movimentacao: Omit<NovaMovimentacao, "id" | "usuario_id" | "valor_total" | "created_at" | "updated_at">) => {
    if (!user) throw new Error("Usuário não autenticado")

    try {
      // Iniciar transação - criar movimentação
      const movimentacaoData = {
        ...movimentacao,
        usuario_id: user.id,
      }
      const { data: novaMovimentacao, error: errorMovimentacao } = await dbHelpers.movimentacoes.insert(movimentacaoData)

      if (errorMovimentacao) throw errorMovimentacao

      // Atualizar estoque do produto
      const { data: produto, error: errorProduto } = await dbHelpers.produtos.getStock(movimentacao.produto_id)

      if (errorProduto) throw errorProduto

      const produtoData = produto as any
      const novoEstoque = movimentacao.tipo === "entrada" 
        ? produtoData.estoque_atual + movimentacao.quantidade
        : produtoData.estoque_atual - movimentacao.quantidade

      // Verificar se há estoque suficiente para saída
      if (movimentacao.tipo === "saida" && novoEstoque < 0) {
        throw new Error("Estoque insuficiente para esta operação")
      }

      const { error: errorAtualizacao } = await dbHelpers.produtos.updateStock(movimentacao.produto_id, novoEstoque)

      if (errorAtualizacao) throw errorAtualizacao

      // Atualizar lista local
      setMovimentacoes(prev => [novaMovimentacao as unknown as Movimentacao, ...prev])
      
      toast({
        title: "Sucesso",
        description: `Movimentação de ${movimentacao.tipo} registrada com sucesso`,
      })

      return novaMovimentacao
    } catch (error: any) {
      console.error("Erro ao criar movimentação:", error)
      toast({
        title: "Erro",
        description: error.message || "Erro ao registrar movimentação",
        variant: "destructive",
      })
      throw error
    }
  }

  // Atualizar movimentação
  const atualizarMovimentacao = async (id: string, atualizacoes: AtualizarMovimentacao) => {
    if (!user) throw new Error("Usuário não autenticado")

    try {
      const { data, error } = await dbHelpers.movimentacoes.update(id, user.id, atualizacoes)

      if (error) throw error

      // Atualizar lista local
      setMovimentacoes(prev => 
        prev.map(mov => mov.id === id ? data as unknown as Movimentacao : mov)
      )

      toast({
        title: "Sucesso",
        description: "Movimentação atualizada com sucesso",
      })

      return data
    } catch (error: any) {
      console.error("Erro ao atualizar movimentação:", error)
      toast({
        title: "Erro",
        description: "Erro ao atualizar movimentação",
        variant: "destructive",
      })
      throw error
    }
  }

  // Cancelar movimentação
  const cancelarMovimentacao = async (id: string) => {
    if (!user) throw new Error("Usuário não autenticado")

    try {
      // Buscar a movimentação original
      const { data: movimentacao, error: errorBusca } = await dbHelpers.movimentacoes.findById(id, user.id)

      if (errorBusca) throw errorBusca

      const movimentacaoData = movimentacao as any

      // Reverter o estoque
      const { data: produto, error: errorProduto } = await dbHelpers.produtos.getStock(movimentacaoData.produto_id)

      if (errorProduto) throw errorProduto

      const produtoData = produto as any
      const estoqueRevertido = movimentacaoData.tipo === "entrada"
        ? produtoData.estoque_atual - movimentacaoData.quantidade
        : produtoData.estoque_atual + movimentacaoData.quantidade

      const { error: errorEstoque } = await dbHelpers.produtos.updateStock(movimentacaoData.produto_id, estoqueRevertido)

      if (errorEstoque) throw errorEstoque

      // Marcar como cancelada
      const { error: errorCancelamento } = await dbHelpers.movimentacoes.update(id, user.id, { status: "cancelada" })

      if (errorCancelamento) throw errorCancelamento

      // Atualizar lista local
      setMovimentacoes(prev => 
        prev.map(mov => mov.id === id ? { ...mov, status: "cancelada" } : mov)
      )

      toast({
        title: "Sucesso",
        description: "Movimentação cancelada e estoque revertido",
      })

    } catch (error: any) {
      console.error("Erro ao cancelar movimentação:", error)
      toast({
        title: "Erro",
        description: "Erro ao cancelar movimentação",
        variant: "destructive",
      })
      throw error
    }
  }

  // Estatísticas das movimentações
  const estatisticas = {
    totalMovimentacoes: movimentacoes.length,
    totalEntradas: movimentacoes.filter(m => m.tipo === "entrada" && m.status === "concluida").length,
    totalSaidas: movimentacoes.filter(m => m.tipo === "saida" && m.status === "concluida").length,
    valorTotalEntradas: movimentacoes
      .filter(m => m.tipo === "entrada" && m.status === "concluida")
      .reduce((total, mov) => total + (mov.preco_unitario * mov.quantidade), 0),
    valorTotalSaidas: movimentacoes
      .filter(m => m.tipo === "saida" && m.status === "concluida")
      .reduce((total, mov) => total + (mov.preco_unitario * mov.quantidade), 0),
    movimentacoesHoje: movimentacoes.filter(m => {
      const hoje = new Date().toDateString()
      const dataMovimentacao = new Date(m.data_movimentacao).toDateString()
      return dataMovimentacao === hoje
    }).length,
    movimentacoesSemana: movimentacoes.filter(m => {
      const umaSemanaAtras = new Date()
      umaSemanaAtras.setDate(umaSemanaAtras.getDate() - 7)
      return new Date(m.data_movimentacao) >= umaSemanaAtras
    }).length
  }

  useEffect(() => {
    fetchMovimentacoes()
  }, [user])

  return {
    movimentacoes,
    loading,
    error,
    estatisticas,
    criarMovimentacao,
    atualizarMovimentacao,
    cancelarMovimentacao,
    refetch: fetchMovimentacoes,
  }
}