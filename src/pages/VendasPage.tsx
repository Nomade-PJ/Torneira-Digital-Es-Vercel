import React, { useState, useEffect, useCallback } from "react"
import { Search, Plus, ShoppingCart, Trash2, Minus, X, CreditCard, Check, Users, Table, Clock, Receipt, MoreHorizontal, Edit, Save } from "lucide-react"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card"
import { Badge } from "../components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../components/ui/dropdown-menu"
import { Label } from "../components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select"
import { Textarea } from "../components/ui/textarea"
import { Separator } from "../components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs"
import { supabase } from "../lib/supabase"
import { useAuthContext } from "../components/providers/auth-provider"
import { useToast } from "../components/ui/use-toast"
import { thermalPrinter, type DadosImpressao, type ItemImpressao } from "../lib/thermal-printer"

// 🔧 Interfaces (copiadas exatamente)
interface Produto {
  id: string
  nome: string
  marca: string
  categoria: string
  preco_venda: number
  estoque_atual: number
  codigo_barras?: string
}

interface Cliente {
  id: string
  nome: string
  email?: string
  telefone?: string
  cpf_cnpj?: string
}

interface CarrinhoItem {
  produto: Produto
  quantidade: number
  observacoes?: string
}

interface Mesa {
  id: string
  numero_mesa: number
  nome_mesa?: string
  capacidade_pessoas: number
  status: 'livre' | 'ocupada' | 'reservada' | 'manutencao'
  observacoes?: string
  ativo: boolean
}

interface ItemComanda {
  id: string
  comanda_id: string
  produto_id: string
  quantidade: number
  preco_unitario: number
  desconto_item: number
  subtotal: number
  observacoes?: string
  data_pedido: string
  produto: Produto
}

interface Comanda {
  id: string
  numero_comanda: string
  mesa_id: string
  cliente_nome?: string
  cliente_telefone?: string
  data_abertura: string
  data_fechamento?: string
  subtotal: number
  desconto: number
  total: number
  forma_pagamento?: string
  status: 'aberta' | 'fechada' | 'cancelada'
  observacoes?: string
}

interface ComandaCompleta extends Comanda {
  mesa: Mesa
  itens: ItemComanda[]
}

export default function VendasPageSimple() {
  const [activeTab, setActiveTab] = useState("vendas")
  const [searchTerm, setSearchTerm] = useState("")
  const [isFinalizarDialogOpen, setIsFinalizarDialogOpen] = useState(false)
  const [isMesaDialogOpen, setIsMesaDialogOpen] = useState(false)
  const [isComandaDialogOpen, setIsComandaDialogOpen] = useState(false)
  const [isQuantidadeDialogOpen, setIsQuantidadeDialogOpen] = useState(false)
  const [isDetalhesComandaOpen, setIsDetalhesComandaOpen] = useState(false)
  const [isAdicionarItemComandaOpen, setIsAdicionarItemComandaOpen] = useState(false)
  const [isEditarMesaOpen, setIsEditarMesaOpen] = useState(false)
  const [produtoSelecionado, setProdutoSelecionado] = useState<Produto | null>(null)
  const [quantidadeSelecionada, setQuantidadeSelecionada] = useState(1)
  const [comandaSelecionada, setComandaSelecionada] = useState<ComandaCompleta | null>(null)
  const [mesaParaEditar, setMesaParaEditar] = useState<Mesa | null>(null)
  const [clienteSelecionado, setClienteSelecionado] = useState<Cliente | null>(null)
  const [formaPagamento, setFormaPagamento] = useState("dinheiro")
  const [formaPagamentoComanda, setFormaPagamentoComanda] = useState("dinheiro")
  
  // Garantir que a forma de pagamento seja inicializada corretamente
  React.useEffect(() => {
    if (!formaPagamentoComanda) {
      setFormaPagamentoComanda("dinheiro")
    }
  }, [formaPagamentoComanda])
  const [descontoVendaDireta, setDescontoVendaDireta] = useState(0)
  const [descontoComanda, setDescontoComanda] = useState(0)
  const [observacoes, setObservacoes] = useState("")
  
  // Estados principais
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [carrinho, setCarrinho] = useState<CarrinhoItem[]>([])
  const [loading, setLoading] = useState(true)
  const [finalizandoVenda, setFinalizandoVenda] = useState(false)
  
  // Estados para mesas e comandas
  const [mesas, setMesas] = useState<Mesa[]>([])
  const [comandas, setComandas] = useState<ComandaCompleta[]>([])
  const [mesaSelecionada, setMesaSelecionada] = useState<Mesa | null>(null)
  
  // Estados para formulários de mesa
  const [numeroMesa, setNumeroMesa] = useState("")
  const [nomeMesa, setNomeMesa] = useState("")
  const [capacidadeMesa, setCapacidadeMesa] = useState(4)
  const [clienteNomeComanda, setClienteNomeComanda] = useState("")
  const [numeroMesaEditar, setNumeroMesaEditar] = useState("")
  const [nomeMesaEditar, setNomeMesaEditar] = useState("")
  const [capacidadeMesaEditar, setCapacidadeMesaEditar] = useState(4)
  const [clienteTelefoneComanda, setClienteTelefoneComanda] = useState("")
  const [numeroComandaCustom, setNumeroComandaCustom] = useState("")
  
  const [estatisticas, setEstatisticas] = useState({
    vendasHoje: 0,
    receitaHoje: 0,
    totalVendas: 0,
    receitaTotal: 0,
  })
  
  const { user } = useAuthContext()
  const { toast } = useToast()
  
  // Função para gerar número da comanda
  const gerarNumeroComanda = () => {
    const agora = new Date()
    const timestamp = agora.getTime().toString().slice(-6)
    const numeroComanda = `CMD${timestamp}`
    // Atualizar o estado automaticamente
    setNumeroComandaCustom(numeroComanda)
    return numeroComanda
  }



  // Carregar dados diretamente - SEM CACHE
  const carregarDados = useCallback(async () => {
    if (!user?.id) return

    try {
      // Buscar tudo em paralelo
      const [produtosRes, , vendasRes, mesasRes, comandasRes] = await Promise.all([
        supabase
          .from("produtos")
          .select("id, nome, marca, categoria, preco_venda, estoque_atual, codigo_barras")
          .eq("usuario_id", user.id)
          .eq("ativo", true)
          .order("nome"),
          
        null, // placeholder para clientes removidos
          
        supabase
          .from("vendas")
          .select("total, data_venda")
          .eq("usuario_id", user.id),
          
        supabase
          .from("mesas")
          .select("*")
          .eq("usuario_id", user.id)
          .eq("ativo", true)
          .order("numero_mesa"),
          
        supabase
          .from("comandas")
          .select(`
            *,
            mesa:mesas(*),
            itens:itens_comanda(
              *,
              produto:produtos(*)
            )
          `)
          .eq("usuario_id", user.id)
          .order("data_abertura", { ascending: false })
      ])

      if (produtosRes.error) throw produtosRes.error
      if (vendasRes.error) throw vendasRes.error
      if (mesasRes.error) throw mesasRes.error
      if (comandasRes.error) throw comandasRes.error

      setProdutos(produtosRes.data || [])
      setMesas(mesasRes.data || [])
      setComandas(comandasRes.data as ComandaCompleta[] || [])

      // Calcular estatísticas 
      const vendas = vendasRes.data || []
      const hoje = new Date().toDateString()
      const vendasHoje = vendas.filter(v => new Date(v.data_venda).toDateString() === hoje)
      const receitaHoje = vendasHoje.reduce((sum, v) => sum + v.total, 0)
      const receitaTotal = vendas.reduce((sum, v) => sum + v.total, 0)

      setEstatisticas({
        vendasHoje: vendasHoje.length,
        receitaHoje,
        totalVendas: vendas.length,
        receitaTotal,
      })

    } catch (error) {
      console.error("Erro ao carregar dados:", error)
      toast({
        title: "Erro",
        description: "Erro ao carregar dados",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [user?.id, toast])

  useEffect(() => {
    carregarDados()
  }, [carregarDados])

  // Funções do carrinho
  const adicionarAoCarrinho = (produto: Produto, quantidade: number) => {
    setCarrinho(prev => {
      const existingItem = prev.find(item => item.produto.id === produto.id)
      if (existingItem) {
        return prev.map(item =>
          item.produto.id === produto.id
            ? { ...item, quantidade: item.quantidade + quantidade }
            : item
        )
      }
      return [...prev, { produto, quantidade }]
    })
    
    toast({
      title: "Produto adicionado",
      description: `${produto.nome} foi adicionado ao carrinho`,
    })
  }

  const removerDoCarrinho = (produtoId: string) => {
    setCarrinho(prev => prev.filter(item => item.produto.id !== produtoId))
  }

  const atualizarQuantidadeCarrinho = (produtoId: string, novaQuantidade: number) => {
    if (novaQuantidade <= 0) {
      removerDoCarrinho(produtoId)
      return
    }
    
    setCarrinho(prev =>
      prev.map(item =>
        item.produto.id === produtoId
          ? { ...item, quantidade: novaQuantidade }
          : item
      )
    )
  }

  const limparCarrinho = () => {
    setCarrinho([])
    setClienteSelecionado(null)
    setDescontoVendaDireta(0)
    setObservacoes("")
  }

  // Cálculos do carrinho
  const subtotalCarrinho = carrinho.reduce(
    (total, item) => total + (item.produto.preco_venda * item.quantidade), 
    0
  )
  const totalCarrinho = subtotalCarrinho - descontoVendaDireta

  // Função para finalizar venda
  const finalizarVenda = async () => {
    if (carrinho.length === 0) {
      toast({
        title: "Carrinho vazio",
        description: "Adicione produtos ao carrinho antes de finalizar",
        variant: "destructive",
      })
      return
    }

    try {
      setFinalizandoVenda(true)
      
      toast({
        title: "🔄 Processando venda",
        description: "Finalizando venda...",
      })
      // Gerar número da venda
      const numeroVenda = `VEN${Date.now().toString().slice(-6)}`
      
      // Inserir venda
      const { data: venda, error: vendaError } = await supabase
        .from("vendas")
        .insert({
          usuario_id: user!.id,
          cliente_id: clienteSelecionado?.id || null,
          numero_venda: numeroVenda,
          subtotal: subtotalCarrinho,
          desconto: descontoVendaDireta,
          total: totalCarrinho,
          forma_pagamento: formaPagamento,
          status: "finalizada",
          observacoes: observacoes || null,
          vendedor: user?.user_metadata?.nome || "Sistema"
        })
        .select()
        .single()

      if (vendaError) throw vendaError

      // Inserir itens da venda
      const itensVenda = carrinho.map(item => ({
        venda_id: venda.id,
        produto_id: item.produto.id,
        quantidade: item.quantidade,
        preco_unitario: item.produto.preco_venda,
        desconto_item: 0,
      }))

      const { error: itensError } = await supabase
        .from("itens_venda")
        .insert(itensVenda)

      if (itensError) throw itensError

      // Atualizar estoque e movimentações em lote (mais rápido)
      const updatePromises = carrinho.map(async (item) => {
        // Buscar estoque atual do produto antes de atualizar
        const { data: produtoAtual, error: produtoError } = await supabase
          .from("produtos")
          .select("estoque_atual")
          .eq("id", item.produto.id)
          .single()

        if (produtoError) throw produtoError

        // Calcular novo estoque (não pode ser negativo)
        const novoEstoque = Math.max(0, produtoAtual.estoque_atual - item.quantidade)

        // Atualizar estoque
        const estoquePromise = supabase
          .from("produtos")
          .update({
            estoque_atual: novoEstoque
          })
          .eq("id", item.produto.id)

        // Registrar movimentação
        const movimentacaoPromise = supabase
          .from("movimentacoes")
          .insert({
            usuario_id: user!.id,
            produto_id: item.produto.id,
            tipo: "saida",
            motivo: "venda",
            quantidade: item.quantidade,
            preco_unitario: item.produto.preco_venda,
            responsavel: user?.user_metadata?.nome || "Sistema",
            observacao: `Venda ${numeroVenda}`,
            data_movimentacao: new Date().toISOString(),
            status: "concluida",
            valor_total: item.produto.preco_venda * item.quantidade
          })

        return Promise.all([estoquePromise, movimentacaoPromise])
      })

      // Executar todas as operações em paralelo
      await Promise.all(updatePromises)

      // Imprimir recibo automaticamente
      try {
        const itensImpressao: ItemImpressao[] = carrinho.map(item => ({
          nome: item.produto.nome,
          quantidade: item.quantidade,
          preco: item.produto.preco_venda,
          total: item.quantidade * item.produto.preco_venda,
          observacoes: item.observacoes
        }))

        const dadosImpressao: DadosImpressao = {
          tipo: 'venda_direta',
          numeroVenda: numeroVenda,
          nomeEstabelecimento: user?.user_metadata?.nome_estabelecimento || "Torneira Digital",
          itens: itensImpressao,
          subtotal: subtotalCarrinho,
          desconto: descontoVendaDireta,
          total: totalCarrinho,
          formaPagamento: formaPagamento,
          dataHora: new Date(),
          observacoes: observacoes
        }

        await thermalPrinter.imprimirNota(dadosImpressao)
        
        toast({
          title: "🖨️ Nota impressa",
          description: "Recibo enviado para impressora térmica",
        })
      } catch (printError) {
        console.warn("Erro na impressão:", printError)
        toast({
          title: "⚠️ Aviso",
          description: "Venda finalizada, mas houve erro na impressão",
          variant: "destructive",
        })
      }

      toast({
        title: "✅ Venda finalizada",
        description: `Venda ${numeroVenda} realizada com sucesso!`,
      })

      // Limpar estados
      limparCarrinho()
      setIsFinalizarDialogOpen(false)
      
      // Recarregar dados
      carregarDados()

    } catch (error) {
      console.error("Erro ao finalizar venda:", error)
      toast({
        title: "❌ Erro",
        description: "Erro ao finalizar venda",
        variant: "destructive",
      })
    } finally {
      setFinalizandoVenda(false)
    }
  }

  // Função para criar mesa
  const criarMesa = async () => {
    if (!numeroMesa) {
      toast({
        title: "Erro",
        description: "Número da mesa é obrigatório",
        variant: "destructive",
      })
      return
    }

    try {
      const { error } = await supabase
        .from("mesas")
        .insert({
          usuario_id: user!.id,
          numero_mesa: parseInt(numeroMesa),
          nome_mesa: nomeMesa || null,
          capacidade_pessoas: capacidadeMesa,
          status: "livre",
          ativo: true
        })

      if (error) throw error

      toast({
        title: "Mesa criada",
        description: `Mesa ${numeroMesa} criada com sucesso!`,
      })

      // Limpar formulário
      setNumeroMesa("")
      setNomeMesa("")
      setCapacidadeMesa(4)
      setIsMesaDialogOpen(false)
      
      // Recarregar dados
      carregarDados()

    } catch (error: any) {
      console.error("Erro ao criar mesa:", error)
      toast({
        title: "Erro",
        description: error.message || "Erro ao criar mesa",
        variant: "destructive",
      })
    }
  }

  // Função para editar mesa
  const editarMesa = async () => {
    if (!mesaParaEditar || !numeroMesaEditar) {
      toast({
        title: "❌ Erro",
        description: "Número da mesa é obrigatório",
        variant: "destructive",
      })
      return
    }

    try {
      const { error } = await supabase
        .from("mesas")
        .update({
          numero_mesa: parseInt(numeroMesaEditar),
          nome_mesa: nomeMesaEditar || null,
          capacidade_pessoas: capacidadeMesaEditar
        })
        .eq("id", mesaParaEditar.id)

      if (error) throw error

      toast({
        title: "✅ Mesa atualizada",
        description: `Mesa ${numeroMesaEditar} atualizada com sucesso!`,
      })

      // Limpar formulário
      setMesaParaEditar(null)
      setNumeroMesaEditar("")
      setNomeMesaEditar("")
      setCapacidadeMesaEditar(4)
      setIsEditarMesaOpen(false)
      
      // Recarregar dados
      carregarDados()

    } catch (error: any) {
      console.error("Erro ao editar mesa:", error)
      toast({
        title: "❌ Erro",
        description: error.message || "Erro ao editar mesa",
        variant: "destructive",
      })
    }
  }

  // Função para excluir mesa
  const excluirMesa = async (mesa: Mesa) => {
    try {
      // Verificar se a mesa tem comandas ativas
      const { data: comandasAtivas, error: comandasError } = await supabase
        .from("comandas")
        .select("id")
        .eq("mesa_id", mesa.id)
        .eq("status", "aberta")

      if (comandasError) throw comandasError

      if (comandasAtivas && comandasAtivas.length > 0) {
        toast({
          title: "❌ Não é possível excluir",
          description: "Mesa possui comandas ativas",
          variant: "destructive",
        })
        return
      }

      const { error } = await supabase
        .from("mesas")
        .delete()
        .eq("id", mesa.id)

      if (error) throw error

      toast({
        title: "✅ Mesa excluída",
        description: `Mesa ${mesa.numero_mesa} excluída com sucesso!`,
      })
      
      // Recarregar dados
      carregarDados()

    } catch (error: any) {
      console.error("Erro ao excluir mesa:", error)
      toast({
        title: "❌ Erro",
        description: error.message || "Erro ao excluir mesa",
        variant: "destructive",
      })
    }
  }

  // Função para abrir comanda
  const abrirComanda = async () => {
    if (!mesaSelecionada) {
      toast({
        title: "Erro",
        description: "Selecione uma mesa",
        variant: "destructive",
      })
      return
    }

    try {
      const numeroComanda = numeroComandaCustom || gerarNumeroComanda()

      const { error } = await supabase
        .from("comandas")
        .insert({
          usuario_id: user!.id,
          mesa_id: mesaSelecionada.id,
          numero_comanda: numeroComanda,
          cliente_nome: clienteNomeComanda || null,
          cliente_telefone: clienteTelefoneComanda || null,
          status: "aberta",
          subtotal: 0,
          desconto: 0,
          total: 0
        })

      if (error) throw error

      // Atualizar status da mesa
      await supabase
        .from("mesas")
        .update({ status: "ocupada" })
        .eq("id", mesaSelecionada.id)

      toast({
        title: "Comanda aberta",
        description: `Comanda ${numeroComanda} aberta para mesa ${mesaSelecionada.numero_mesa}`,
      })

      // Limpar formulário
      setClienteNomeComanda("")
      setClienteTelefoneComanda("")
      setNumeroComandaCustom("")
      setMesaSelecionada(null)
      setIsComandaDialogOpen(false)
      
      // Recarregar dados
      carregarDados()

    } catch (error: any) {
      console.error("Erro ao abrir comanda:", error)
      toast({
        title: "Erro",
        description: error.message || "Erro ao abrir comanda",
        variant: "destructive",
      })
    }
  }

  // Função para adicionar item à comanda
  const adicionarItemComanda = async () => {
    if (!comandaSelecionada || !produtoSelecionado) return

    try {
      // Calcular valores antes da inserção
      const subtotalItem = produtoSelecionado.preco_venda * quantidadeSelecionada
      const novoSubtotal = comandaSelecionada.subtotal + subtotalItem
      const novoTotal = novoSubtotal - comandaSelecionada.desconto

      // Inserir item na comanda (subtotal é calculado automaticamente pelo banco)
      const { data: novoItem, error: itemError } = await supabase
        .from("itens_comanda")
        .insert({
          comanda_id: comandaSelecionada.id,
          produto_id: produtoSelecionado.id,
          quantidade: quantidadeSelecionada,
          preco_unitario: produtoSelecionado.preco_venda,
          desconto_item: 0,
          observacoes: null
        })
        .select(`
          *,
          produto:produtos(*)
        `)
        .single()

      if (itemError) throw itemError

      // Atualizar totais da comanda no banco
      const { error: comandaError } = await supabase
        .from("comandas")
        .update({
          subtotal: novoSubtotal,
          total: novoTotal
        })
        .eq("id", comandaSelecionada.id)

      if (comandaError) throw comandaError

      // Atualizar estado local imediatamente (sem esperar recarregar)
      setComandas(prev => prev.map(cmd => 
        cmd.id === comandaSelecionada.id 
          ? {
              ...cmd,
              subtotal: novoSubtotal,
              total: novoTotal,
              itens: [...(cmd.itens || []), {
                ...novoItem,
                produto: produtoSelecionado
              }]
            }
          : cmd
      ))

      // Atualizar comanda selecionada
      setComandaSelecionada(prev => prev ? {
        ...prev,
        subtotal: novoSubtotal,
        total: novoTotal,
        itens: [...(prev.itens || []), {
          ...novoItem,
          produto: produtoSelecionado
        }]
      } : null)

      toast({
        title: "✅ Item adicionado",
        description: `${produtoSelecionado.nome} adicionado à comanda`,
      })

      // Limpar formulário
      setProdutoSelecionado(null)
      setQuantidadeSelecionada(1)
      setIsAdicionarItemComandaOpen(false)

    } catch (error: any) {
      console.error("Erro ao adicionar item:", error)
      toast({
        title: "❌ Erro",
        description: error.message || "Erro ao adicionar item à comanda",
        variant: "destructive",
      })
    }
  }

  // Função para fechar comanda
  const fecharComanda = async (comanda: ComandaCompleta, formaPagamentoComanda: string) => {
    try {
      // Atualizar status da comanda com desconto aplicado
      const { error: comandaError } = await supabase
        .from("comandas")
        .update({
          status: "fechada",
          data_fechamento: new Date().toISOString(),
          forma_pagamento: formaPagamentoComanda,
          desconto: comanda.desconto,
          total: comanda.total
        })
        .eq("id", comanda.id)

      if (comandaError) throw comandaError

      // Liberar mesa
      const { error: mesaError } = await supabase
        .from("mesas")
        .update({ status: "livre" })
        .eq("id", comanda.mesa_id)

      if (mesaError) throw mesaError

      // Atualizar estoque dos produtos
      for (const item of comanda.itens) {
        // Buscar estoque atual do produto antes de atualizar
        const { data: produtoAtual, error: produtoError } = await supabase
          .from("produtos")
          .select("estoque_atual")
          .eq("id", item.produto_id)
          .single()

        if (produtoError) throw produtoError

        // Calcular novo estoque (não pode ser negativo)
        const novoEstoque = Math.max(0, produtoAtual.estoque_atual - item.quantidade)

        const { error: estoqueError } = await supabase
          .from("produtos")
          .update({
            estoque_atual: novoEstoque
          })
          .eq("id", item.produto_id)

        if (estoqueError) throw estoqueError

        // Registrar movimentação
        await supabase
          .from("movimentacoes")
          .insert({
            usuario_id: user!.id,
            produto_id: item.produto_id,
            tipo: "saida",
            motivo: "venda",
            quantidade: item.quantidade,
            preco_unitario: item.preco_unitario,
            responsavel: user?.user_metadata?.nome || "Sistema",
            observacao: `Comanda ${comanda.numero_comanda}`,
            data_movimentacao: new Date().toISOString()
          })
      }

      // Imprimir nota da comanda automaticamente
      try {
        const itensImpressao: ItemImpressao[] = comanda.itens.map(item => ({
          nome: item.produto.nome,
          quantidade: item.quantidade,
          preco: item.preco_unitario,
          total: item.subtotal,
          observacoes: item.observacoes
        }))

        const dadosImpressao: DadosImpressao = {
          tipo: 'comanda',
          numeroComanda: comanda.numero_comanda,
          numeroMesa: comanda.mesa.numero_mesa,
          nomeCliente: comanda.cliente_nome,
          telefoneCliente: comanda.cliente_telefone,
          nomeEstabelecimento: user?.user_metadata?.nome_estabelecimento || "Torneira Digital",
          itens: itensImpressao,
          subtotal: comanda.subtotal,
          desconto: comanda.desconto,
          total: comanda.total,
          formaPagamento: formaPagamentoComanda,
          dataHora: new Date()
        }

        await thermalPrinter.imprimirNota(dadosImpressao)
        
        toast({
          title: "✅ Comanda fechada",
          description: `Comanda ${comanda.numero_comanda} fechada e nota impressa!`,
        })
      } catch (printError) {
        console.warn("Erro na impressão da comanda:", printError)
        toast({
          title: "✅ Comanda fechada",
          description: `Comanda ${comanda.numero_comanda} fechada com sucesso!`,
        })
        toast({
          title: "⚠️ Aviso",
          description: "Houve erro na impressão da nota",
          variant: "destructive",
        })
      }

      setIsDetalhesComandaOpen(false)
      setComandaSelecionada(null)
      
      // Recarregar dados
      carregarDados()

    } catch (error: any) {
      console.error("Erro ao fechar comanda:", error)
      toast({
        title: "Erro",
        description: error.message || "Erro ao fechar comanda",
        variant: "destructive",
      })
    }
  }

  const produtosFiltrados = produtos.filter(produto =>
    produto.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    produto.marca.toLowerCase().includes(searchTerm.toLowerCase()) ||
    produto.categoria.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-slate-400">Carregando dados...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-full overflow-hidden">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-amber-400 to-yellow-500 bg-clip-text text-transparent">
            PDV - Ponto de Venda
          </h1>
          <p className="text-muted-foreground mt-1">Sistema de vendas integrado com estoque</p>
        </div>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-amber-500/20 bg-gradient-to-br from-slate-900 to-slate-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">Vendas Hoje</CardTitle>
            <ShoppingCart className="h-4 w-4 text-amber-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-400">{estatisticas.vendasHoje}</div>
            <p className="text-xs text-muted-foreground">vendas realizadas hoje</p>
          </CardContent>
        </Card>

        <Card className="border-green-500/20 bg-gradient-to-br from-slate-900 to-slate-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">Receita Hoje</CardTitle>
            <CreditCard className="h-4 w-4 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-400">
              R$ {estatisticas.receitaHoje.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">faturamento do dia</p>
          </CardContent>
        </Card>

        <Card className="border-blue-500/20 bg-gradient-to-br from-slate-900 to-slate-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">Total Vendas</CardTitle>
            <Receipt className="h-4 w-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-400">{estatisticas.totalVendas}</div>
            <p className="text-xs text-muted-foreground">vendas realizadas</p>
          </CardContent>
        </Card>

        <Card className="border-purple-500/20 bg-gradient-to-br from-slate-900 to-slate-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">Receita Total</CardTitle>
            <CreditCard className="h-4 w-4 text-purple-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-400">
              R$ {estatisticas.receitaTotal.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">faturamento total</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-gradient-to-r from-slate-800/80 to-slate-700/60 border border-amber-500/30 rounded-xl shadow-lg">
          <TabsTrigger 
            value="vendas" 
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-500/30 data-[state=active]:to-yellow-500/20 data-[state=active]:text-amber-400 data-[state=active]:shadow-lg data-[state=active]:border data-[state=active]:border-amber-500/40 text-slate-300 hover:text-amber-300 transition-all duration-200 rounded-lg font-semibold"
          >
            <ShoppingCart className="w-4 h-4 mr-2" />
            🛒 Venda Direta
          </TabsTrigger>
          <TabsTrigger 
            value="mesas" 
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-500/30 data-[state=active]:to-yellow-500/20 data-[state=active]:text-amber-400 data-[state=active]:shadow-lg data-[state=active]:border data-[state=active]:border-amber-500/40 text-slate-300 hover:text-amber-300 transition-all duration-200 rounded-lg font-semibold"
          >
            <Table className="w-4 h-4 mr-2" />
            🪑 Mesas
          </TabsTrigger>
          <TabsTrigger 
            value="comandas" 
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-500/30 data-[state=active]:to-yellow-500/20 data-[state=active]:text-amber-400 data-[state=active]:shadow-lg data-[state=active]:border data-[state=active]:border-amber-500/40 text-slate-300 hover:text-amber-300 transition-all duration-200 rounded-lg font-semibold"
          >
            <Clock className="w-4 h-4 mr-2" />
            ⏰ Comandas
          </TabsTrigger>
        </TabsList>

        {/* Venda Direta */}
        <TabsContent value="vendas" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Produtos */}
            <div className="lg:col-span-2 space-y-4">
              <Card className="border-amber-500/30 bg-gradient-to-br from-slate-900/90 to-slate-800/90 backdrop-blur-sm shadow-xl">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-amber-500/20">
                      <ShoppingCart className="h-5 w-5 text-amber-400" />
                    </div>
                    <div>
                      <CardTitle className="text-xl font-bold text-slate-100">Produtos</CardTitle>
                      <CardDescription className="text-slate-400">Selecione os produtos para adicionar à venda</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="relative">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-amber-400/70" />
                      <Input
                        placeholder="🔍 Buscar produtos por nome, marca ou categoria..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-12 h-14 bg-gradient-to-r from-slate-800/80 to-slate-700/60 border-2 border-slate-600/30 focus:border-amber-500/60 focus:ring-4 focus:ring-amber-500/10 text-slate-100 placeholder:text-slate-400 font-medium rounded-xl shadow-lg transition-all duration-200 hover:shadow-xl"
                      />
                    </div>

                    {produtosFiltrados.length > 0 ? (
                      <div className="space-y-3 max-h-96 overflow-y-auto pr-2 scrollbar-thin scrollbar-track-slate-800 scrollbar-thumb-slate-600">
                        {produtosFiltrados.map((produto) => (
                          <div
                            key={produto.id}
                            className="group relative flex items-center justify-between p-4 border border-slate-600/50 rounded-xl bg-gradient-to-r from-slate-800/60 to-slate-700/40 hover:from-slate-700/80 hover:to-slate-600/60 transition-all duration-200 cursor-pointer min-h-[90px] shadow-lg hover:shadow-xl hover:border-amber-500/30"
                            onClick={() => adicionarAoCarrinho(produto, 1)}
                          >
                            <div className="flex-1">
                              <h3 className="font-bold text-lg text-slate-100 group-hover:text-amber-100 transition-colors">{produto.nome}</h3>
                              <div className="flex items-center gap-2 mt-2">
                                <span className="text-sm font-medium text-slate-300">{produto.marca}</span>
                                <span className="text-slate-500">•</span>
                                <Badge variant="outline" className="border-amber-500/60 text-amber-300 text-xs font-semibold bg-amber-500/10">
                                  {produto.categoria}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-6 mt-2">
                                <span className="text-lg font-bold text-green-400">
                                  R$ {produto.preco_venda.toFixed(2)}
                                </span>
                                <span className="text-sm text-slate-400 font-medium">
                                  Estoque: <span className="text-slate-300 font-semibold">{produto.estoque_atual}</span>
                                </span>
                              </div>
                            </div>
                            <Button
                              variant="outline"
                              size="icon"
                              className="ml-4 h-10 w-10 border-2 border-amber-500/60 text-amber-400 hover:bg-amber-500/20 hover:border-amber-400 transition-all duration-200 shadow-lg hover:shadow-amber-500/20"
                              onClick={(e) => {
                                e.stopPropagation()
                                adicionarAoCarrinho(produto, 1)
                              }}
                            >
                              <Plus className="h-5 w-5" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <div className="p-4 rounded-full bg-slate-700/50 w-fit mx-auto mb-4">
                          <Search className="w-8 h-8 text-slate-500" />
                        </div>
                        <p className="text-slate-300 font-semibold">Nenhum produto encontrado</p>
                        <p className="text-sm text-slate-500 mt-1">Tente ajustar sua busca</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Carrinho */}
            <div className="space-y-4">
              <Card className="border-green-500/30 bg-gradient-to-br from-slate-900/90 to-slate-800/90 backdrop-blur-sm shadow-xl">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-green-500/20">
                        <ShoppingCart className="h-5 w-5 text-green-400" />
                      </div>
                      <div>
                        <CardTitle className="text-xl font-bold text-slate-100">Carrinho</CardTitle>
                        <CardDescription className="text-slate-400">
                          {carrinho.length} {carrinho.length === 1 ? 'item' : 'itens'}
                        </CardDescription>
                      </div>
                    </div>
                    {carrinho.length > 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={limparCarrinho}
                        className="border-red-500/60 text-red-400 hover:bg-red-500/20 hover:border-red-400 transition-all duration-200"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {carrinho.length > 0 ? (
                    <div className="space-y-4">
                      <div className="space-y-3 max-h-64 overflow-y-auto pr-2 scrollbar-thin scrollbar-track-slate-800 scrollbar-thumb-slate-600">
                        {carrinho.map((item) => (
                          <div key={item.produto.id} className="flex items-center justify-between p-3 border border-slate-600/50 rounded-lg bg-slate-800/40 hover:bg-slate-700/50 transition-all duration-200">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold text-slate-100 truncate">{item.produto.nome}</p>
                              <p className="text-xs text-slate-400 font-medium">R$ {item.produto.preco_venda.toFixed(2)} × {item.quantidade}</p>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-7 w-7 border-slate-500/60 text-slate-300 hover:bg-slate-600/50 transition-all duration-200"
                                onClick={() => atualizarQuantidadeCarrinho(item.produto.id, item.quantidade - 1)}
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              <span className="text-sm font-bold w-8 text-center text-slate-100">{item.quantidade}</span>
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-7 w-7 border-slate-500/60 text-slate-300 hover:bg-slate-600/50 transition-all duration-200"
                                onClick={() => atualizarQuantidadeCarrinho(item.produto.id, item.quantidade + 1)}
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-7 w-7 border-red-500/60 text-red-400 hover:bg-red-500/20 hover:border-red-400 transition-all duration-200"
                                onClick={() => removerDoCarrinho(item.produto.id)}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>

                      <Separator className="bg-slate-600/50" />

                      <div className="space-y-3 bg-slate-800/50 p-4 rounded-lg">
                        <div className="flex justify-between text-sm font-medium">
                          <span className="text-slate-300">Subtotal:</span>
                          <span className="text-slate-100">R$ {subtotalCarrinho.toFixed(2)}</span>
                        </div>
                        {descontoVendaDireta > 0 && (
                          <div className="flex justify-between text-sm font-medium text-red-400">
                            <span>Desconto:</span>
                            <span>- R$ {descontoVendaDireta.toFixed(2)}</span>
                          </div>
                        )}
                        <Separator className="bg-slate-600/50" />
                        <div className="flex justify-between text-xl font-bold">
                          <span className="text-slate-100">Total:</span>
                          <span className="text-green-400">R$ {totalCarrinho.toFixed(2)}</span>
                        </div>
                      </div>

                      <Button
                        className="w-full h-12 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 font-bold text-lg shadow-lg hover:shadow-green-500/20 transition-all duration-200"
                        onClick={() => setIsFinalizarDialogOpen(true)}
                      >
                        <Check className="w-5 h-5 mr-2" />
                        Finalizar Venda
                      </Button>

                      <Button
                        variant="outline"
                        className="w-full border-slate-500/60 text-slate-300 hover:bg-slate-700/50 font-medium transition-all duration-200"
                        onClick={limparCarrinho}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Limpar Carrinho
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <div className="p-4 rounded-full bg-slate-700/50 w-fit mx-auto mb-4">
                        <ShoppingCart className="w-10 h-10 text-slate-500" />
                      </div>
                      <p className="text-slate-300 font-semibold">Nenhum item no carrinho</p>
                      <p className="text-sm text-slate-500 mt-1">Adicione produtos ao carrinho<br/>para iniciar uma venda</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Mesas */}
        <TabsContent value="mesas" className="space-y-6">
          <Card className="border-amber-500/30 bg-gradient-to-br from-slate-900/90 to-slate-800/90 backdrop-blur-sm shadow-xl">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-amber-500/20">
                    <Table className="h-5 w-5 text-amber-400" />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-bold text-slate-100">Gerenciamento de Mesas</CardTitle>
                    <CardDescription className="text-slate-400">Organize as mesas do seu estabelecimento</CardDescription>
                  </div>
                </div>
                <Dialog open={isMesaDialogOpen} onOpenChange={setIsMesaDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-slate-900 shadow-lg hover:shadow-amber-500/20 transition-all duration-200">
                      <Plus className="w-4 h-4 mr-2" />
                      Nova Mesa
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-slate-900/95 backdrop-blur-sm border-amber-500/20">
                    <DialogHeader>
                      <DialogTitle className="text-amber-400">Criar Nova Mesa</DialogTitle>
                      <DialogDescription>Preencha os dados da nova mesa</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="numero-mesa">Número da Mesa *</Label>
                        <Input
                          id="numero-mesa"
                          type="number"
                          value={numeroMesa}
                          onChange={(e) => setNumeroMesa(e.target.value)}
                          className="bg-slate-800/50 border-slate-700"
                          placeholder="Ex: 1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="nome-mesa">Nome da Mesa (opcional)</Label>
                        <Input
                          id="nome-mesa"
                          value={nomeMesa}
                          onChange={(e) => setNomeMesa(e.target.value)}
                          className="bg-slate-800/50 border-slate-700"
                          placeholder="Ex: Mesa VIP"
                        />
                      </div>
                      <div>
                        <Label htmlFor="capacidade">Capacidade (pessoas)</Label>
                        <Input
                          id="capacidade"
                          type="number"
                          value={capacidadeMesa}
                          onChange={(e) => setCapacidadeMesa(parseInt(e.target.value) || 4)}
                          className="bg-slate-800/50 border-slate-700"
                          min="1"
                          max="20"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsMesaDialogOpen(false)}>
                        Cancelar
                      </Button>
                      <Button 
                        onClick={criarMesa}
                        className="bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-slate-900"
                      >
                        Criar Mesa
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {mesas.map((mesa) => (
                  <Card
                    key={mesa.id}
                    className={`border-2 transition-all duration-200 cursor-pointer shadow-lg hover:shadow-xl ${
                      mesa.status === 'livre' 
                        ? 'border-green-500/60 bg-gradient-to-br from-green-500/10 to-green-600/5 hover:from-green-500/20 hover:to-green-600/10'
                        : mesa.status === 'ocupada'
                        ? 'border-red-500/60 bg-gradient-to-br from-red-500/10 to-red-600/5 hover:from-red-500/20 hover:to-red-600/10'
                        : mesa.status === 'reservada'
                        ? 'border-yellow-500/60 bg-gradient-to-br from-yellow-500/10 to-yellow-600/5 hover:from-yellow-500/20 hover:to-yellow-600/10'
                        : 'border-slate-500/60 bg-gradient-to-br from-slate-500/10 to-slate-600/5 hover:from-slate-500/20 hover:to-slate-600/10'
                    }`}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">Mesa {mesa.numero_mesa}</CardTitle>
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant="outline" 
                            className={
                              mesa.status === 'livre' 
                                ? 'border-green-500/50 text-green-400'
                                : mesa.status === 'ocupada'
                                ? 'border-red-500/50 text-red-400'
                                : mesa.status === 'reservada'
                                ? 'border-yellow-500/50 text-yellow-400'
                                : 'border-slate-500/50 text-slate-400'
                            }
                          >
                            {mesa.status === 'livre' && 'Livre'}
                            {mesa.status === 'ocupada' && 'Ocupada'}
                            {mesa.status === 'reservada' && 'Reservada'}
                            {mesa.status === 'manutencao' && 'Manutenção'}
                          </Badge>
                          
                          {/* Botão de Ações no Header */}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0 text-amber-400 hover:bg-amber-500/10"
                              >
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-slate-800/95 backdrop-blur-sm border-slate-600/50 z-[99999]">
                              <DropdownMenuItem 
                                onClick={() => {
                                  setMesaParaEditar(mesa)
                                  setNumeroMesaEditar(mesa.numero_mesa.toString())
                                  setNomeMesaEditar(mesa.nome_mesa || "")
                                  setCapacidadeMesaEditar(mesa.capacidade_pessoas)
                                  setIsEditarMesaOpen(true)
                                }}
                                className="text-slate-200 focus:bg-blue-500/20 focus:text-blue-400 cursor-pointer"
                              >
                                <Edit className="w-4 h-4 mr-2" />
                                ✏️ Editar Mesa
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => excluirMesa(mesa)}
                                className="text-red-400 focus:bg-red-500/20 focus:text-red-300 cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                🗑️ Excluir Mesa
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                      {mesa.nome_mesa && (
                        <CardDescription>{mesa.nome_mesa}</CardDescription>
                      )}
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Capacidade:</span>
                          <span className="text-slate-200">{mesa.capacidade_pessoas} pessoas</span>
                        </div>
                        {mesa.observacoes && (
                          <p className="text-xs text-muted-foreground">{mesa.observacoes}</p>
                        )}
                        {mesa.status === 'livre' && (
                          <div className="flex gap-2 mt-3">
                            <Button
                              size="sm"
                              className="w-full bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 font-semibold"
                              onClick={() => {
                                setMesaSelecionada(mesa)
                                // Gerar número automaticamente ao abrir o modal
                                gerarNumeroComanda()
                                setIsComandaDialogOpen(true)
                              }}
                            >
                              <Users className="w-4 h-4 mr-2" />
                              Abrir Comanda
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {mesas.length === 0 && (
                  <div className="col-span-full text-center py-12">
                    <div className="p-4 rounded-full bg-slate-700/50 w-fit mx-auto mb-4">
                      <Table className="w-10 h-10 text-slate-500" />
                    </div>
                    <p className="text-slate-300 font-semibold">Nenhuma mesa cadastrada</p>
                    <p className="text-sm text-slate-500 mt-1 mb-4">Crie sua primeira mesa para começar</p>
                    <Button
                      onClick={() => setIsMesaDialogOpen(true)}
                      className="bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-slate-900 shadow-lg hover:shadow-amber-500/20 transition-all duration-200"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Criar Primeira Mesa
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Comandas */}
        <TabsContent value="comandas" className="space-y-6">
          <Card className="border-amber-500/30 bg-gradient-to-br from-slate-900/90 to-slate-800/90 backdrop-blur-sm shadow-xl">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-500/20">
                  <Clock className="h-5 w-5 text-amber-400" />
                </div>
                <div>
                  <CardTitle className="text-xl font-bold text-slate-100">Comandas Ativas</CardTitle>
                  <CardDescription className="text-slate-400">Gerencie as comandas abertas</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {comandas.filter(c => c.status === 'aberta').map((comanda) => (
                  <Card key={comanda.id} className="border-amber-500/30 bg-gradient-to-br from-slate-800/60 to-slate-700/40 hover:from-slate-700/80 hover:to-slate-600/60 transition-all duration-200 shadow-lg hover:shadow-xl">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">Comanda {comanda.numero_comanda}</CardTitle>
                        <Badge variant="outline" className="border-amber-500/50 text-amber-400">
                          {comanda.status}
                        </Badge>
                      </div>
                      <CardDescription>
                        Mesa {comanda.mesa.numero_mesa}
                        {comanda.cliente_nome && ` - ${comanda.cliente_nome}`}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Abertura:</span>
                          <span className="text-slate-200">
                            {new Date(comanda.data_abertura).toLocaleString('pt-BR')}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Itens:</span>
                          <span className="text-slate-200">{comanda.itens.length}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Total:</span>
                          <span className="text-green-400 font-semibold">R$ {comanda.total.toFixed(2)}</span>
                        </div>
                        <div className="flex space-x-2 mt-4">
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1 border-amber-500/50 text-amber-400 hover:bg-amber-500/10"
                            onClick={() => {
                              setComandaSelecionada(comanda)
                              setDescontoComanda(comanda.desconto || 0)
                              setFormaPagamentoComanda("dinheiro")
                              setIsDetalhesComandaOpen(true)
                            }}
                          >
                            Ver Detalhes
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                
                {comandas.filter(c => c.status === 'aberta').length === 0 && (
                  <div className="col-span-full text-center py-12">
                    <div className="p-4 rounded-full bg-slate-700/50 w-fit mx-auto mb-4">
                      <Clock className="w-10 h-10 text-slate-500" />
                    </div>
                    <p className="text-slate-300 font-semibold">Nenhuma comanda ativa</p>
                    <p className="text-sm text-slate-500 mt-1">As comandas abertas aparecerão aqui</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog de Quantidade */}
      <Dialog open={isQuantidadeDialogOpen} onOpenChange={setIsQuantidadeDialogOpen}>
        <DialogContent className="bg-slate-900/95 backdrop-blur-sm border-amber-500/20">
          <DialogHeader>
            <DialogTitle className="text-amber-400">Adicionar ao Carrinho</DialogTitle>
            <DialogDescription>
              {produtoSelecionado?.nome} - R$ {produtoSelecionado?.preco_venda.toFixed(2)}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="quantidade">Quantidade</Label>
              <div className="flex items-center space-x-2 mt-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setQuantidadeSelecionada(Math.max(1, quantidadeSelecionada - 1))}
                  className="border-slate-600"
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <Input
                  id="quantidade"
                  type="number"
                  value={quantidadeSelecionada}
                  onChange={(e) => setQuantidadeSelecionada(Math.max(1, parseInt(e.target.value) || 1))}
                  className="text-center bg-slate-800/50 border-slate-700"
                  min="1"
                  max={produtoSelecionado?.estoque_atual || 1}
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setQuantidadeSelecionada(quantidadeSelecionada + 1)}
                  className="border-slate-600"
                  disabled={quantidadeSelecionada >= (produtoSelecionado?.estoque_atual || 0)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Estoque disponível: {produtoSelecionado?.estoque_atual}
              </p>
            </div>
            <div className="text-sm">
              <p>Total: R$ {((produtoSelecionado?.preco_venda || 0) * quantidadeSelecionada).toFixed(2)}</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsQuantidadeDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={() => {
                if (produtoSelecionado) {
                  adicionarAoCarrinho(produtoSelecionado, quantidadeSelecionada)
                  setIsQuantidadeDialogOpen(false)
                  setProdutoSelecionado(null)
                  setQuantidadeSelecionada(1)
                }
              }}
              className="bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-slate-900"
            >
              <Plus className="w-4 h-4 mr-2" />
              Adicionar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Finalizar Venda */}
      <Dialog open={isFinalizarDialogOpen} onOpenChange={setIsFinalizarDialogOpen}>
        <DialogContent className="bg-slate-900/98 backdrop-blur-md border-green-500/30 max-w-lg shadow-2xl">
          <DialogHeader className="pb-4">
            <DialogTitle className="text-green-400 text-xl font-bold">💰 Finalizar Venda</DialogTitle>
            <DialogDescription className="text-slate-300">Configure os detalhes finais da venda</DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            {/* Forma de Pagamento */}
            <div className="space-y-3">
              <Label htmlFor="forma-pagamento" className="text-slate-300 font-medium">💳 Forma de Pagamento</Label>
              <Select value={formaPagamento} onValueChange={setFormaPagamento}>
                <SelectTrigger className="h-12 bg-slate-800/90 border-slate-600/50 focus:border-green-500/50 focus:ring-green-500/20 text-slate-100 font-medium">
                  <CreditCard className="w-4 h-4 mr-2 text-green-400" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800/95 backdrop-blur-sm border-slate-600/50 z-[99999]">
                  <SelectItem value="dinheiro" className="text-slate-100 focus:bg-green-500/20 focus:text-green-400">
                    💵 Dinheiro
                  </SelectItem>
                  <SelectItem value="pix" className="text-slate-100 focus:bg-green-500/20 focus:text-green-400">
                    📱 PIX
                  </SelectItem>
                  <SelectItem value="cartao_debito" className="text-slate-100 focus:bg-green-500/20 focus:text-green-400">
                    💳 Cartão de Débito
                  </SelectItem>
                  <SelectItem value="cartao_credito" className="text-slate-100 focus:bg-green-500/20 focus:text-green-400">
                    💳 Cartão de Crédito
                  </SelectItem>
                  <SelectItem value="transferencia" className="text-slate-100 focus:bg-green-500/20 focus:text-green-400">
                    🏦 Transferência
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Desconto */}
            <div className="space-y-3">
              <Label htmlFor="desconto" className="text-slate-300 font-medium">💰 Desconto (R$)</Label>
              <Input
                id="desconto"
                type="number"
                step="0.01"
                min="0"
                value={descontoVendaDireta}
                onChange={(e) => setDescontoVendaDireta(Math.max(0, parseFloat(e.target.value) || 0))}
                className="h-12 bg-slate-800/90 border-slate-600/50 focus:border-green-500/50 focus:ring-green-500/20 text-slate-100 font-medium"
                placeholder="0.00"
              />
            </div>

            {/* Observações */}
            <div className="space-y-3">
              <Label htmlFor="observacoes-venda" className="text-slate-300 font-medium">📝 Observações</Label>
              <Textarea
                id="observacoes-venda"
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                className="bg-slate-800/90 border-slate-600/50 focus:border-green-500/50 focus:ring-green-500/20 text-slate-100 font-medium min-h-[80px]"
                placeholder="Observações da venda..."
                rows={3}
              />
            </div>

            {/* Resumo da Venda */}
            <div className="p-4 bg-gradient-to-r from-slate-800/90 to-slate-700/80 rounded-xl border border-slate-600/50 shadow-inner">
              <h3 className="font-semibold text-slate-200 mb-3">📊 Resumo da Venda</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-300 font-medium">Subtotal:</span>
                  <span className="text-slate-100 font-semibold">R$ {subtotalCarrinho.toFixed(2)}</span>
                </div>
                {descontoVendaDireta > 0 && (
                  <div className="flex justify-between text-sm text-red-400">
                    <span className="font-medium">Desconto:</span>
                    <span className="font-semibold">- R$ {descontoVendaDireta.toFixed(2)}</span>
                  </div>
                )}
                <Separator className="bg-slate-600/50" />
                <div className="flex justify-between text-xl font-bold">
                  <span className="text-slate-100">💵 Total:</span>
                  <span className="text-green-400">R$ {totalCarrinho.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter className="gap-3 pt-4">
            <Button 
              variant="outline" 
              onClick={() => setIsFinalizarDialogOpen(false)}
              className="flex-1 h-12 border-slate-600/50 text-slate-300 hover:bg-slate-700/50 font-medium"
            >
              ❌ Cancelar
            </Button>
            <Button 
              onClick={finalizarVenda} 
              disabled={finalizandoVenda}
              className="flex-1 h-12 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:opacity-70 disabled:cursor-not-allowed text-white font-bold shadow-lg transition-all duration-200 hover:shadow-xl"
            >
              {finalizandoVenda ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  🔄 Processando...
                </>
              ) : (
                <>
                  <Check className="w-5 h-5 mr-2" />
                  ✅ Confirmar Venda
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Abrir Comanda */}
      <Dialog open={isComandaDialogOpen} onOpenChange={setIsComandaDialogOpen}>
        <DialogContent className="bg-slate-900/95 backdrop-blur-sm border-amber-500/20">
          <DialogHeader>
            <DialogTitle className="text-amber-400">Abrir Comanda</DialogTitle>
            <DialogDescription>
              {mesaSelecionada && `Mesa ${mesaSelecionada.numero_mesa}`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="cliente-nome">Nome do Cliente (opcional)</Label>
              <Input
                id="cliente-nome"
                value={clienteNomeComanda}
                onChange={(e) => setClienteNomeComanda(e.target.value)}
                className="bg-slate-800/50 border-slate-700"
                placeholder="Nome do cliente"
              />
            </div>
            <div>
              <Label htmlFor="cliente-telefone">Telefone (opcional)</Label>
              <Input
                id="cliente-telefone"
                value={clienteTelefoneComanda}
                onChange={(e) => setClienteTelefoneComanda(e.target.value)}
                className="bg-slate-800/50 border-slate-700"
                placeholder="(11) 99999-9999"
              />
            </div>
            <div>
              <Label htmlFor="numero-comanda">Número da Comanda</Label>
              <Input
                id="numero-comanda"
                value={numeroComandaCustom}
                readOnly
                className="bg-slate-800/50 border-slate-700 text-amber-400 font-semibold cursor-not-allowed"
                placeholder="Gerado automaticamente"
              />
              <p className="text-xs text-slate-400 mt-1">✨ Número gerado automaticamente</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsComandaDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={abrirComanda}
              className="bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-slate-900"
            >
              Abrir Comanda
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Editar Mesa */}
      <Dialog open={isEditarMesaOpen} onOpenChange={setIsEditarMesaOpen}>
        <DialogContent className="bg-slate-900/95 backdrop-blur-sm border-amber-500/20">
          <DialogHeader>
            <DialogTitle className="text-amber-400">✏️ Editar Mesa</DialogTitle>
            <DialogDescription>Atualize as informações da mesa</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="numero-mesa-editar" className="text-slate-300 font-medium">Número da Mesa *</Label>
              <Input
                id="numero-mesa-editar"
                type="number"
                value={numeroMesaEditar}
                onChange={(e) => setNumeroMesaEditar(e.target.value)}
                className="mt-2 h-12 bg-slate-800/60 border-slate-600/50 focus:border-amber-500/50 focus:ring-amber-500/20 text-slate-100 font-medium"
                placeholder="Ex: 1"
              />
            </div>
            <div>
              <Label htmlFor="nome-mesa-editar" className="text-slate-300 font-medium">Nome da Mesa (opcional)</Label>
              <Input
                id="nome-mesa-editar"
                value={nomeMesaEditar}
                onChange={(e) => setNomeMesaEditar(e.target.value)}
                className="mt-2 h-12 bg-slate-800/60 border-slate-600/50 focus:border-amber-500/50 focus:ring-amber-500/20 text-slate-100 font-medium"
                placeholder="Ex: Mesa VIP"
              />
            </div>
            <div>
              <Label htmlFor="capacidade-editar" className="text-slate-300 font-medium">Capacidade (pessoas)</Label>
              <Input
                id="capacidade-editar"
                type="number"
                value={capacidadeMesaEditar}
                onChange={(e) => setCapacidadeMesaEditar(parseInt(e.target.value) || 4)}
                className="mt-2 h-12 bg-slate-800/60 border-slate-600/50 focus:border-amber-500/50 focus:ring-amber-500/20 text-slate-100 font-medium"
                min="1"
                max="20"
              />
            </div>
          </div>
          <DialogFooter className="gap-3">
            <Button variant="outline" onClick={() => setIsEditarMesaOpen(false)}>
              ❌ Cancelar
            </Button>
            <Button 
              onClick={editarMesa}
              className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-bold h-12 px-6 shadow-lg transition-all duration-200 hover:shadow-xl"
            >
              <Save className="w-4 h-4 mr-2" />
              💾 Salvar Alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Detalhes da Comanda */}
      <Dialog open={isDetalhesComandaOpen} onOpenChange={setIsDetalhesComandaOpen}>
        <DialogContent className="bg-slate-900/98 backdrop-blur-md border-amber-500/30 max-w-4xl max-h-[95vh] overflow-y-auto shadow-2xl">
          <DialogHeader className="pb-6">
            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-amber-400 to-yellow-500 bg-clip-text text-transparent">
              📋 Detalhes da Comanda {comandaSelecionada?.numero_comanda}
            </DialogTitle>
            <DialogDescription className="text-slate-300 text-base">
              Mesa {comandaSelecionada?.mesa.numero_mesa}
              {comandaSelecionada?.cliente_nome && ` - ${comandaSelecionada.cliente_nome}`}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Forma de Pagamento - Movida para o topo */}
            <div className="p-4 bg-gradient-to-r from-amber-600/20 to-yellow-600/20 rounded-xl border border-amber-500/30">
              <h3 className="text-lg font-semibold text-amber-400 mb-3">💳 Forma de Pagamento</h3>
              <Select 
                value={formaPagamentoComanda} 
                onValueChange={setFormaPagamentoComanda}
              >
                <SelectTrigger className="w-full h-12 bg-slate-800/60 border-slate-600/50 focus:border-amber-500/50 focus:ring-amber-500/20 text-slate-100 font-medium">
                  <CreditCard className="w-4 h-4 mr-2 text-amber-400" />
                  <SelectValue placeholder="Selecione a forma de pagamento" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800/95 backdrop-blur-sm border-slate-600/50 z-[99999]">
                  <SelectItem 
                    value="dinheiro" 
                    className="text-slate-100 focus:bg-amber-500/20 focus:text-amber-400 cursor-pointer"
                  >
                    💵 Dinheiro
                  </SelectItem>
                  <SelectItem 
                    value="pix" 
                    className="text-slate-100 focus:bg-amber-500/20 focus:text-amber-400 cursor-pointer"
                  >
                    📱 PIX
                  </SelectItem>
                  <SelectItem 
                    value="cartao_debito" 
                    className="text-slate-100 focus:bg-amber-500/20 focus:text-amber-400 cursor-pointer"
                  >
                    💳 Cartão de Débito
                  </SelectItem>
                  <SelectItem 
                    value="cartao_credito" 
                    className="text-slate-100 focus:bg-amber-500/20 focus:text-amber-400 cursor-pointer"
                  >
                    💳 Cartão de Crédito
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Informações da Comanda */}
            <div className="grid grid-cols-2 gap-4 p-4 bg-slate-800/50 rounded-xl border border-slate-600/50">
              <div>
                <p className="text-sm text-slate-400 font-medium">📅 Abertura:</p>
                <p className="font-semibold text-slate-200 mt-1">
                  {comandaSelecionada && new Date(comandaSelecionada.data_abertura).toLocaleString('pt-BR')}
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-400 font-medium">🔄 Status:</p>
                <Badge variant="outline" className="border-amber-500/50 text-amber-400 mt-1">
                  {comandaSelecionada?.status}
                </Badge>
              </div>
            </div>

            {/* Lista de Itens */}
            <div className="p-4 bg-gradient-to-r from-slate-800/60 to-slate-700/40 rounded-xl border border-slate-600/50">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-blue-400">📦 Itens da Comanda</h3>
                <Button
                  size="sm"
                  onClick={() => setIsAdicionarItemComandaOpen(true)}
                  className="bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-700 hover:to-yellow-700 text-white font-semibold px-4 py-2 rounded-lg shadow-lg transition-all duration-200"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar Item
                </Button>
              </div>
              
              {comandaSelecionada?.itens && comandaSelecionada.itens.length > 0 ? (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {comandaSelecionada.itens.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-3 border border-slate-600/50 rounded-lg bg-slate-800/40">
                      <div className="flex-1">
                        <p className="font-medium text-slate-200">{item.produto.nome}</p>
                        <p className="text-sm text-slate-400">
                          R$ {item.preco_unitario.toFixed(2)} × {item.quantidade}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-green-400">
                          R$ {item.subtotal.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 border border-slate-600/50 rounded-lg bg-slate-800/20">
                  <p className="text-slate-400">Nenhum item na comanda</p>
                  <p className="text-sm text-slate-500">Adicione produtos para começar</p>
                </div>
              )}
            </div>

            {/* Desconto */}
            <div className="p-4 bg-gradient-to-r from-red-600/20 to-pink-600/20 rounded-xl border border-red-500/30">
              <Label htmlFor="desconto-comanda" className="text-lg font-semibold text-red-400 mb-3 block">
                💰 Desconto (R$)
              </Label>
              <Input
                id="desconto-comanda"
                type="number"
                step="0.01"
                min="0"
                value={descontoComanda}
                onChange={(e) => {
                  const novoDesconto = parseFloat(e.target.value) || 0
                  setDescontoComanda(novoDesconto)
                  // Atualizar comanda selecionada com novo desconto
                  if (comandaSelecionada) {
                    const novoTotal = comandaSelecionada.subtotal - novoDesconto
                    setComandaSelecionada({
                      ...comandaSelecionada,
                      desconto: novoDesconto,
                      total: Math.max(0, novoTotal)
                    })
                  }
                }}
                className="h-12 bg-slate-800/60 border-slate-600/50 focus:border-red-500/50 focus:ring-red-500/20 text-slate-100 font-medium"
                placeholder="0.00"
              />
            </div>

            {/* Totais */}
            <div className="p-6 bg-gradient-to-r from-green-600/20 to-emerald-600/20 rounded-xl border border-green-500/30">
              <h3 className="text-lg font-semibold text-green-400 mb-4">💰 Resumo Financeiro</h3>
              <div className="space-y-3">
                <div className="flex justify-between text-base">
                  <span className="text-slate-300 font-medium">📊 Subtotal:</span>
                  <span className="text-slate-100 font-semibold">R$ {comandaSelecionada?.subtotal.toFixed(2) || '0.00'}</span>
                </div>
                {comandaSelecionada && descontoComanda > 0 && (
                  <div className="flex justify-between text-base text-red-400">
                    <span className="font-medium">💸 Desconto:</span>
                    <span className="font-semibold">- R$ {descontoComanda.toFixed(2)}</span>
                  </div>
                )}
                <Separator className="bg-slate-600/50" />
                <div className="flex justify-between text-2xl font-bold">
                  <span className="text-green-400">💵 Total:</span>
                  <span className="text-green-400">R$ {((comandaSelecionada?.subtotal || 0) - descontoComanda).toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-4 pt-6 sticky bottom-0 bg-slate-900/98 backdrop-blur-md border-t border-slate-700/50">
            
            {/* Botões de Ação */}
            <div className="flex gap-4 w-full">
              <Button 
                variant="outline" 
                className="flex-1 h-14 border-slate-600/50 text-slate-300 hover:bg-slate-700/50 font-semibold text-base rounded-xl" 
                onClick={() => {
                  setIsDetalhesComandaOpen(false)
                  setDescontoComanda(0)
                }}
              >
                <X className="w-5 h-5 mr-2" />
                ❌ Cancelar
              </Button>
              <Button
                onClick={() => {
                  if (comandaSelecionada) {
                    // Aplicar desconto antes de fechar
                    const totalComDesconto = comandaSelecionada.subtotal - descontoComanda
                    const comandaAtualizada = {
                      ...comandaSelecionada,
                      desconto: descontoComanda,
                      total: Math.max(0, totalComDesconto)
                    }
                    fecharComanda(comandaAtualizada, formaPagamentoComanda)
                  }
                }}
                className="flex-1 h-14 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold text-base shadow-lg transition-all duration-200 hover:shadow-xl rounded-xl"
                disabled={!comandaSelecionada || !comandaSelecionada.itens || comandaSelecionada.itens.length === 0}
              >
                <Check className="w-5 h-5 mr-2" />
                ✅ Fechar Comanda
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Adicionar Item à Comanda */}
      <Dialog open={isAdicionarItemComandaOpen} onOpenChange={setIsAdicionarItemComandaOpen}>
        <DialogContent className="bg-slate-900/95 backdrop-blur-sm border-amber-500/20 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-amber-400">Adicionar Item à Comanda</DialogTitle>
            <DialogDescription>
              Comanda {comandaSelecionada?.numero_comanda} - Mesa {comandaSelecionada?.mesa.numero_mesa}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Busca de Produtos */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Buscar produtos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-slate-800/50 border-slate-700"
              />
            </div>

            {/* Lista de Produtos */}
            {produtoSelecionado ? (
              <div className="p-4 border border-amber-500/50 rounded-lg bg-amber-500/10">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-slate-200">{produtoSelecionado.nome}</h3>
                    <p className="text-sm text-slate-400">{produtoSelecionado.marca} - R$ {produtoSelecionado.preco_venda.toFixed(2)}</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setProdutoSelecionado(null)}
                    className="border-red-500/50 text-red-400"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                
                <div className="mt-4">
                  <Label>Quantidade</Label>
                  <div className="flex items-center space-x-2 mt-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setQuantidadeSelecionada(Math.max(1, quantidadeSelecionada - 1))}
                      className="border-slate-600"
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <Input
                      type="number"
                      value={quantidadeSelecionada}
                      onChange={(e) => setQuantidadeSelecionada(Math.max(1, parseInt(e.target.value) || 1))}
                      className="text-center bg-slate-800/50 border-slate-700 w-20"
                      min="1"
                      max={produtoSelecionado.estoque_atual}
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setQuantidadeSelecionada(quantidadeSelecionada + 1)}
                      className="border-slate-600"
                      disabled={quantidadeSelecionada >= produtoSelecionado.estoque_atual}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Estoque: {produtoSelecionado.estoque_atual} | Total: R$ {(produtoSelecionado.preco_venda * quantidadeSelecionada).toFixed(2)}
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {produtosFiltrados.map((produto) => (
                  <div
                    key={produto.id}
                    className="flex items-center justify-between p-3 border border-slate-600/50 rounded-lg bg-slate-800/30 hover:bg-slate-800/50 transition-colors cursor-pointer"
                    onClick={() => setProdutoSelecionado(produto)}
                  >
                    <div>
                      <h3 className="font-medium text-slate-200">{produto.nome}</h3>
                      <p className="text-sm text-slate-400">{produto.marca} - {produto.categoria}</p>
                      <p className="text-sm text-green-400">R$ {produto.preco_venda.toFixed(2)} | Estoque: {produto.estoque_atual}</p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-amber-500/50 text-amber-400"
                    >
                      Selecionar
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsAdicionarItemComandaOpen(false)
              setProdutoSelecionado(null)
              setQuantidadeSelecionada(1)
            }}>
              Cancelar
            </Button>
            <Button
              onClick={adicionarItemComanda}
              disabled={!produtoSelecionado}
              className="bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-slate-900"
            >
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Item
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
