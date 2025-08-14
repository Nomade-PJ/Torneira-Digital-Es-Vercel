"use client"

import { useState, useEffect, useCallback } from "react"
import { Search, Plus, ShoppingCart, Trash2, Minus, X, UserPlus, CreditCard, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { supabase } from "@/lib/supabase"
import { useAuthContext } from "@/components/providers/auth-provider"
import { useToast } from "@/components/ui/use-toast"

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
}

interface VendaAtual {
  id: string
  cliente_id?: string
  itens: CarrinhoItem[]
  total: number
  desconto: number
  observacoes?: string
}

export default function VendasPageSimple() {
  const [searchTerm, setSearchTerm] = useState("")
  const [isClienteDialogOpen, setIsClienteDialogOpen] = useState(false)
  const [isFinalizarDialogOpen, setIsFinalizarDialogOpen] = useState(false)
  const [clienteSelecionado, setClienteSelecionado] = useState<Cliente | null>(null)
  const [formaPagamento, setFormaPagamento] = useState("dinheiro")
  const [descontoTotal, setDescontoTotal] = useState(0)
  const [observacoes, setObservacoes] = useState("")
  
  // Estados principais
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [carrinho, setCarrinho] = useState<CarrinhoItem[]>([])
  const [loading, setLoading] = useState(true)
  const [estatisticas, setEstatisticas] = useState({
    vendasHoje: 0,
    receitaHoje: 0,
    totalVendas: 0,
    receitaTotal: 0,
  })

  const { user } = useAuthContext()
  const { toast } = useToast()

  // Carregar dados diretamente - SEM CACHE
  const carregarDados = useCallback(async () => {
    if (!user?.id) return

    try {
      console.log('🔄 Carregando dados...', new Date().toISOString())
      
      // Buscar tudo em paralelo
      const [produtosRes, clientesRes, vendasRes] = await Promise.all([
        supabase
          .from("produtos")
          .select("id, nome, marca, categoria, preco_venda, estoque_atual, codigo_barras")
          .eq("usuario_id", user.id)
          .eq("ativo", true)
          .order("nome"),
          
        supabase
          .from("clientes")
          .select("id, nome, email, telefone, cpf_cnpj")
          .eq("usuario_id", user.id)
          .eq("ativo", true)
          .order("nome"),
          
        supabase
          .from("vendas")
          .select("total, data_venda")
          .eq("usuario_id", user.id)
      ])

      if (produtosRes.error) throw produtosRes.error
      if (clientesRes.error) throw clientesRes.error
      if (vendasRes.error) throw vendasRes.error

      console.log('✅ Dados carregados:', {
        produtos: produtosRes.data?.length,
        clientes: clientesRes.data?.length,
        vendas: vendasRes.data?.length
      })

      setProdutos(produtosRes.data || [])
      setClientes(clientesRes.data || [])
      
      // Calcular estatísticas
      const vendas = vendasRes.data || []
      const hoje = new Date().toISOString().split('T')[0]
      const vendasHoje = vendas.filter(v => v.data_venda?.startsWith(hoje))
      
             setEstatisticas({
         vendasHoje: vendasHoje.length,
         receitaHoje: vendasHoje.reduce((sum, v) => sum + (v.total || 0), 0),
         totalVendas: vendas.length,
         receitaTotal: vendas.reduce((sum, v) => sum + (v.total || 0), 0)
       })

    } catch (error) {
      console.error("❌ Erro ao carregar dados:", error)
      toast({
        title: "Erro",
        description: "Erro ao carregar dados. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [user?.id, toast])

  // Carregar dados quando usuário logar
  useEffect(() => {
    if (user?.id) {
      carregarDados()
    }
  }, [user?.id, carregarDados])

  // Produtos filtrados
  const produtosFiltrados = produtos.filter(produto =>
    produto.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    produto.marca.toLowerCase().includes(searchTerm.toLowerCase()) ||
    produto.categoria.toLowerCase().includes(searchTerm.toLowerCase()) ||
    produto.codigo_barras?.includes(searchTerm)
  )

  // Funções do carrinho
  const adicionarAoCarrinho = (produto: Produto) => {
    if (produto.estoque_atual <= 0) {
      toast({
        title: "Produto sem estoque",
        description: `${produto.nome} não tem estoque disponível.`,
        variant: "destructive",
      })
      return
    }

    setCarrinho(prev => {
      const itemExistente = prev.find(item => item.produto.id === produto.id)
      
      if (itemExistente) {
        if (itemExistente.quantidade >= produto.estoque_atual) {
          toast({
            title: "Estoque insuficiente",
            description: `Apenas ${produto.estoque_atual} unidades disponíveis.`,
            variant: "destructive",
          })
          return prev
        }
        
        return prev.map(item =>
          item.produto.id === produto.id
            ? { ...item, quantidade: item.quantidade + 1 }
            : item
        )
      }
      
      return [...prev, { produto, quantidade: 1 }]
    })
  }

  const removerDoCarrinho = (produtoId: string) => {
    setCarrinho(prev => prev.filter(item => item.produto.id !== produtoId))
  }

  const atualizarQuantidade = (produtoId: string, novaQuantidade: number) => {
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

  // Cálculos
  const subtotal = carrinho.reduce((sum, item) => sum + (item.produto.preco_venda * item.quantidade), 0)
  const total = subtotal - descontoTotal

  // Finalizar venda
  const finalizarVenda = async () => {
    if (carrinho.length === 0) return

    try {
      setLoading(true)

             // Criar venda
       const { data: venda, error: vendaError } = await supabase
         .from("vendas")
         .insert({
           usuario_id: user?.id,
           cliente_id: clienteSelecionado?.id,
           subtotal,
           desconto: descontoTotal,
           total: total,
           forma_pagamento: formaPagamento,
           observacoes,
           data_venda: new Date().toISOString()
         })
        .select()
        .single()

      if (vendaError) throw vendaError

      // Criar itens da venda
      const itensVenda = carrinho.map(item => ({
        venda_id: venda.id,
        produto_id: item.produto.id,
        quantidade: item.quantidade,
        preco_unitario: item.produto.preco_venda,
        subtotal: item.produto.preco_venda * item.quantidade
      }))

      const { error: itensError } = await supabase
        .from("itens_venda")
        .insert(itensVenda)

      if (itensError) throw itensError

      // Atualizar estoque
      for (const item of carrinho) {
        const { error: estoqueError } = await supabase
          .from("produtos")
          .update({ 
            estoque_atual: item.produto.estoque_atual - item.quantidade 
          })
          .eq("id", item.produto.id)

        if (estoqueError) throw estoqueError
      }

      toast({
        title: "Venda finalizada!",
        description: `Venda no valor de R$ ${total.toFixed(2)} realizada com sucesso.`,
      })

      // Limpar carrinho e fechar modal
      setCarrinho([])
      setDescontoTotal(0)
      setObservacoes("")
      setClienteSelecionado(null)
      setIsFinalizarDialogOpen(false)

      // Recarregar dados
      carregarDados()

    } catch (error) {
      console.error("Erro ao finalizar venda:", error)
      toast({
        title: "Erro",
        description: "Erro ao finalizar venda. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500 mx-auto mb-4"></div>
          <p className="text-slate-400">Carregando dados...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-amber-400 to-yellow-500 bg-clip-text text-transparent">
            PDV - Ponto de Venda
          </h1>
          <p className="text-slate-400">Sistema de vendas integrado com estoque</p>
        </div>
        <div className="flex items-center gap-4">
          {carrinho.length > 0 && (
            <Badge variant="secondary" className="px-3 py-1">
              {carrinho.length} {carrinho.length === 1 ? 'item' : 'itens'} no carrinho
            </Badge>
          )}
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Vendas Hoje</CardDescription>
            <CardTitle className="text-2xl text-amber-500">{estatisticas.vendasHoje}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Receita Hoje</CardDescription>
            <CardTitle className="text-2xl text-green-500">
              R$ {estatisticas.receitaHoje.toFixed(2)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Vendas</CardDescription>
            <CardTitle className="text-2xl text-blue-500">{estatisticas.totalVendas}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Receita Total</CardDescription>
            <CardTitle className="text-2xl text-purple-500">
              R$ {estatisticas.receitaTotal.toFixed(2)}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Produtos */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Produtos
              </CardTitle>
              <CardDescription>Selecione os produtos para adicionar à venda</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Busca */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                <Input
                  placeholder="Buscar produtos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Lista de produtos */}
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {produtosFiltrados.length === 0 ? (
                  <p className="text-center text-slate-400 py-8">
                    {produtos.length === 0 ? 'Nenhum produto cadastrado' : 'Nenhum produto encontrado'}
                  </p>
                ) : (
                  produtosFiltrados.map((produto) => (
                    <div
                      key={produto.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800"
                    >
                      <div className="flex-1">
                        <h3 className="font-medium">{produto.nome}</h3>
                        <p className="text-sm text-slate-500">{produto.marca} • {produto.categoria}</p>
                        <p className="text-sm font-medium text-green-600">
                          R$ {produto.preco_venda.toFixed(2)} • Estoque: {produto.estoque_atual}
                        </p>
                      </div>
                      <Button
                        onClick={() => adicionarAoCarrinho(produto)}
                        disabled={produto.estoque_atual <= 0}
                        variant="outline"
                        size="sm"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Carrinho */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Carrinho
              </CardTitle>
              <CardDescription>
                {carrinho.length === 0 ? 'Nenhum item no carrinho' : `${carrinho.length} itens`}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {carrinho.length === 0 ? (
                <p className="text-center text-slate-400 py-8">
                  Adicione produtos ao carrinho para iniciar uma venda
                </p>
              ) : (
                <>
                  {/* Itens do carrinho */}
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {carrinho.map((item) => (
                      <div key={item.produto.id} className="flex items-center gap-2 p-2 border rounded">
                        <div className="flex-1">
                          <p className="font-medium text-sm">{item.produto.nome}</p>
                          <p className="text-xs text-slate-500">
                            R$ {item.produto.preco_venda.toFixed(2)} x {item.quantidade}
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => atualizarQuantidade(item.produto.id, item.quantidade - 1)}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="px-2 text-sm">{item.quantidade}</span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => atualizarQuantidade(item.produto.id, item.quantidade + 1)}
                            disabled={item.quantidade >= item.produto.estoque_atual}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => removerDoCarrinho(item.produto.id)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <Separator />

                  {/* Totais */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Subtotal:</span>
                      <span>R$ {subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Desconto:</span>
                      <span>R$ {descontoTotal.toFixed(2)}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total:</span>
                      <span className="text-green-600">R$ {total.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Botões */}
                  <div className="space-y-2">
                    <Dialog open={isFinalizarDialogOpen} onOpenChange={setIsFinalizarDialogOpen}>
                      <DialogTrigger asChild>
                        <Button className="w-full" disabled={carrinho.length === 0}>
                          <Check className="mr-2 h-4 w-4" />
                          Finalizar Venda
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Finalizar Venda</DialogTitle>
                          <DialogDescription>
                            Confirme os detalhes da venda antes de finalizar.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="forma-pagamento">Forma de Pagamento</Label>
                            <Select value={formaPagamento} onValueChange={setFormaPagamento}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="dinheiro">Dinheiro</SelectItem>
                                <SelectItem value="cartao_credito">Cartão de Crédito</SelectItem>
                                <SelectItem value="cartao_debito">Cartão de Débito</SelectItem>
                                <SelectItem value="pix">PIX</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label htmlFor="desconto">Desconto (R$)</Label>
                            <Input
                              id="desconto"
                              type="number"
                              value={descontoTotal}
                              onChange={(e) => setDescontoTotal(Number(e.target.value))}
                              min="0"
                              max={subtotal}
                              step="0.01"
                            />
                          </div>
                          <div>
                            <Label htmlFor="observacoes">Observações</Label>
                            <Textarea
                              id="observacoes"
                              value={observacoes}
                              onChange={(e) => setObservacoes(e.target.value)}
                              placeholder="Observações sobre a venda..."
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setIsFinalizarDialogOpen(false)}>
                            Cancelar
                          </Button>
                          <Button onClick={finalizarVenda} disabled={loading}>
                            {loading ? "Finalizando..." : "Confirmar Venda"}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                    
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => setCarrinho([])}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Limpar Carrinho
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
