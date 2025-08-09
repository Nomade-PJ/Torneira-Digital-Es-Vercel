"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { useAuthContext } from "@/components/providers/auth-provider"
import { useToast } from "@/hooks/use-toast"
import type { Database } from "@/types/database"

type Venda = Database["public"]["Tables"]["vendas"]["Row"] & {
  clientes?: {
    nome: string
    cpf_cnpj?: string
    telefone?: string
  }
  itens_venda?: Array<{
    id: string
    quantidade: number
    preco_unitario: number
    desconto_item: number
    subtotal: number
    produtos: {
      nome: string
      marca?: string
      categoria: string
    }
  }>
}

type NovaVenda = Database["public"]["Tables"]["vendas"]["Insert"]
type AtualizarVenda = Database["public"]["Tables"]["vendas"]["Update"]

type ItemVenda = Database["public"]["Tables"]["itens_venda"]["Row"]
type NovoItemVenda = Database["public"]["Tables"]["itens_venda"]["Insert"]

interface CarrinhoItem {
  produto_id: string
  nome: string
  marca?: string | null
  categoria: string
  preco_venda: number
  estoque_atual: number
  quantidade: number
  desconto_item: number
}

export function useVendas() {
  const [vendas, setVendas] = useState<Venda[]>([])
  const [vendaAtual, setVendaAtual] = useState<Venda | null>(null)
  const [carrinho, setCarrinho] = useState<CarrinhoItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuthContext()
  const { toast } = useToast()

  // Buscar vendas do usuário
  const fetchVendas = async () => {
    if (!user) return

    try {
      setLoading(true)
      setError(null)
      
      const { data, error } = await supabase
        .from("vendas")
        .select(`
          *,
          clientes (
            nome,
            cpf_cnpj,
            telefone
          ),
          itens_venda (
            id,
            quantidade,
            preco_unitario,
            desconto_item,
            subtotal,
            produtos (
              nome,
              marca,
              categoria
            )
          )
        `)
        .eq("usuario_id", user.id)
        .order("data_venda", { ascending: false })
        .limit(100) // Limitar para performance

      if (error) throw error
      setVendas(data || [])
    } catch (error: any) {
      console.error("Erro ao buscar vendas:", error)
      setError(error.message)
      toast({
        title: "Erro",
        description: "Erro ao carregar vendas",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Criar nova venda
  const criarVenda = async (cliente_id?: string) => {
    if (!user) throw new Error("Usuário não autenticado")

    try {
      // Verificar se já existe uma venda aberta
      const { data: vendaAberta } = await supabase
        .from("vendas")
        .select("id, numero_venda")
        .eq("usuario_id", user.id)
        .eq("status", "aberta")
        .order("created_at", { ascending: false })
        .limit(1)
        .single()

      if (vendaAberta) {
        // Se já existe venda aberta, usar ela
        setVendaAtual(vendaAberta as Venda)
        toast({
          title: "Venda retomada",
          description: `Continuando venda: ${vendaAberta.numero_venda}`,
        })
        return vendaAberta as Venda
      }

      // Criar nova venda
      const novaVenda: Omit<NovaVenda, "id" | "created_at" | "updated_at" | "numero_venda"> = {
        usuario_id: user.id,
        cliente_id: cliente_id || null,
        total_produtos: 0,
        desconto: 0,
        valor_final: 0,
        forma_pagamento: "dinheiro",
        status: "aberta",
      }

      const { data, error } = await supabase
        .from("vendas")
        .insert(novaVenda)
        .select()
        .single()

      if (error) {
        console.error("❌ Erro detalhado ao criar venda:", error)
        
        // Tratar erro de chave duplicada
        if (error.message?.includes("duplicate key value") || error.message?.includes("vendas_numero_venda_key")) {
          // Tentar novamente após pequeno delay
          await new Promise(resolve => setTimeout(resolve, 500))
          
          const { data: retryData, error: retryError } = await supabase
            .from("vendas")
            .insert(novaVenda)
            .select()
            .single()
            
          if (retryError) throw retryError
          
          setVendaAtual(retryData)
          setCarrinho([])
          
          toast({
            title: "Sucesso",
            description: `Nova venda criada: ${retryData.numero_venda}`,
          })
          
          return retryData
        }
        
        throw error
      }
      
      setVendaAtual(data)
      setCarrinho([])
      
      toast({
        title: "Sucesso",
        description: `Nova venda criada: ${data.numero_venda}`,
      })

      return data
    } catch (error: any) {
      console.error("❌ Erro ao criar venda:", error)
      
      let errorMessage = "Erro ao criar nova venda"
      if (error.message?.includes("duplicate key")) {
        errorMessage = "Erro de numeração. Tente novamente em alguns segundos."
      } else if (error.message?.includes("not found")) {
        errorMessage = "Venda não encontrada"
      }
      
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      })
      throw error
    }
  }

  // Adicionar item ao carrinho
  const adicionarItemCarrinho = (produto: {
    id: string
    nome: string
    marca?: string | null
    categoria: string
    preco_venda: number
    estoque_atual: number
  }, quantidade: number = 1) => {
    setCarrinho(prev => {
      const itemExistente = prev.find(item => item.produto_id === produto.id)
      
      if (itemExistente) {
        // Atualizar quantidade do item existente
        return prev.map(item => 
          item.produto_id === produto.id 
            ? { 
                ...item, 
                quantidade: Math.min(item.quantidade + quantidade, produto.estoque_atual)
              }
            : item
        )
      } else {
        // Adicionar novo item
        return [...prev, {
          produto_id: produto.id,
          nome: produto.nome,
          marca: produto.marca,
          categoria: produto.categoria,
          preco_venda: produto.preco_venda,
          estoque_atual: produto.estoque_atual,
          quantidade: Math.min(quantidade, produto.estoque_atual),
          desconto_item: 0,
        }]
      }
    })
  }

  // Remover item do carrinho
  const removerItemCarrinho = (produto_id: string) => {
    setCarrinho(prev => prev.filter(item => item.produto_id !== produto_id))
  }

  // Atualizar quantidade no carrinho
  const atualizarQuantidadeCarrinho = (produto_id: string, quantidade: number) => {
    setCarrinho(prev => 
      prev.map(item => 
        item.produto_id === produto_id 
          ? { ...item, quantidade: Math.max(0, Math.min(quantidade, item.estoque_atual)) }
          : item
      ).filter(item => item.quantidade > 0)
    )
  }

  // Aplicar desconto em item
  const aplicarDescontoItem = (produto_id: string, desconto: number) => {
    setCarrinho(prev => 
      prev.map(item => 
        item.produto_id === produto_id 
          ? { ...item, desconto_item: Math.max(0, desconto) }
          : item
      )
    )
  }

  // Limpar carrinho
  const limparCarrinho = () => {
    setCarrinho([])
  }

  // Finalizar venda
  const finalizarVenda = async (
    venda_id: string,
    forma_pagamento: string,
    desconto_total: number = 0,
    observacoes?: string
  ) => {
    if (!user || carrinho.length === 0) throw new Error("Carrinho vazio")

    try {
      // 1. Adicionar itens à venda
      const itensVenda = carrinho.map(item => ({
        venda_id,
        produto_id: item.produto_id,
        quantidade: item.quantidade,
        preco_unitario: item.preco_venda,
        desconto_item: item.desconto_item,
      }))

      const { error: itensError } = await supabase
        .from("itens_venda")
        .insert(itensVenda)

      if (itensError) throw itensError

      // 2. Atualizar venda com forma de pagamento e desconto
      const { data: vendaFinalizada, error: vendaError } = await supabase
        .from("vendas")
        .update({
          forma_pagamento,
          desconto: desconto_total,
          observacoes,
          status: "finalizada",
        })
        .eq("id", venda_id)
        .eq("usuario_id", user.id)
        .select()
        .single()

      if (vendaError) throw vendaError

      // 3. Limpar estado
      setVendaAtual(null)
      setCarrinho([])
      
      // 4. Atualizar lista de vendas
      await fetchVendas()

      toast({
        title: "Sucesso",
        description: `Venda ${vendaFinalizada.numero_venda} finalizada com sucesso!`,
      })

      return vendaFinalizada
    } catch (error: any) {
      console.error("Erro ao finalizar venda:", error)
      toast({
        title: "Erro",
        description: "Erro ao finalizar venda",
        variant: "destructive",
      })
      throw error
    }
  }

  // Cancelar venda
  const cancelarVenda = async (venda_id: string) => {
    if (!user) throw new Error("Usuário não autenticado")

    try {
      const { error } = await supabase
        .from("vendas")
        .update({ status: "cancelada" })
        .eq("id", venda_id)
        .eq("usuario_id", user.id)

      if (error) throw error

      // Limpar estado se for a venda atual
      if (vendaAtual?.id === venda_id) {
        setVendaAtual(null)
        setCarrinho([])
      }

      await fetchVendas()

      toast({
        title: "Sucesso",
        description: "Venda cancelada com sucesso",
      })
    } catch (error: any) {
      console.error("Erro ao cancelar venda:", error)
      toast({
        title: "Erro",
        description: "Erro ao cancelar venda",
        variant: "destructive",
      })
      throw error
    }
  }

  // Calcular totais do carrinho
  const totaisCarrinho = {
    subtotal: carrinho.reduce((total, item) => 
      total + (item.quantidade * item.preco_venda), 0
    ),
    desconto: carrinho.reduce((total, item) => 
      total + item.desconto_item, 0
    ),
    total: carrinho.reduce((total, item) => 
      total + (item.quantidade * item.preco_venda) - item.desconto_item, 0
    ),
    itens: carrinho.length,
    quantidadeTotal: carrinho.reduce((total, item) => total + item.quantidade, 0),
  }

  // Estatísticas das vendas
  const estatisticas = {
    totalVendas: vendas.length,
    vendasFinalizadas: vendas.filter(v => v.status === "finalizada").length,
    vendasCanceladas: vendas.filter(v => v.status === "cancelada").length,
    receitaTotal: vendas
      .filter(v => v.status === "finalizada")
      .reduce((total, venda) => total + venda.valor_final, 0),
    vendasHoje: vendas.filter(v => {
      const hoje = new Date().toDateString()
      const dataVenda = new Date(v.data_venda).toDateString()
      return dataVenda === hoje && v.status === "finalizada"
    }).length,
    receitaHoje: vendas
      .filter(v => {
        const hoje = new Date().toDateString()
        const dataVenda = new Date(v.data_venda).toDateString()
        return dataVenda === hoje && v.status === "finalizada"
      })
      .reduce((total, venda) => total + venda.valor_final, 0),
  }

  useEffect(() => {
    fetchVendas()
  }, [user])

  return {
    vendas,
    vendaAtual,
    carrinho,
    loading,
    error,
    estatisticas,
    totaisCarrinho,
    criarVenda,
    adicionarItemCarrinho,
    removerItemCarrinho,
    atualizarQuantidadeCarrinho,
    aplicarDescontoItem,
    limparCarrinho,
    finalizarVenda,
    cancelarVenda,
    refetch: fetchVendas,
  }
}
