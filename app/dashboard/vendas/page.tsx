"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Search,
  Plus,
  Minus,
  ShoppingCart,
  CreditCard,
  Trash2,
  User,
  Package,
  DollarSign,
  TrendingUp,
  Receipt,
  X,
} from "lucide-react"
import { useVendas } from "@/hooks/use-vendas"
import { useClientes } from "@/hooks/use-clientes"
import { useProdutos } from "@/hooks/use-produtos"
import { LoadingSpinner } from "@/components/loading-spinner"
import { BarcodeScanner } from "@/components/barcode-scanner"
import { useToast } from "@/hooks/use-toast"

export default function VendasPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [isClienteDialogOpen, setIsClienteDialogOpen] = useState(false)
  const [isFinalizarDialogOpen, setIsFinalizarDialogOpen] = useState(false)
  const [isCancelarDialogOpen, setIsCancelarDialogOpen] = useState(false)
  const [clienteSelecionado, setClienteSelecionado] = useState<any>(null)
  const [formaPagamento, setFormaPagamento] = useState("dinheiro")
  const [descontoTotal, setDescontoTotal] = useState(0)
  const [observacoes, setObservacoes] = useState("")

  const {
    vendaAtual,
    carrinho,
    loading: loadingVendas,
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
  } = useVendas()

  const { clientes, buscarClientes } = useClientes()
  const { produtos, loading: loadingProdutos, buscarPorCodigoBarras } = useProdutos()
  const { toast } = useToast()

  // Filtrar produtos para pesquisa
  const produtosFiltrados = produtos.filter(produto =>
    produto.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    produto.marca?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    produto.categoria.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Função para lidar com código de barras escaneado
  const handleBarcodeScanned = async (barcode: string) => {
    try {
      const produto = await buscarPorCodigoBarras(barcode)
      
      if (produto) {
        // Verificar se há venda ativa
        if (!vendaAtual) {
          await iniciarNovaVenda()
        }
        
        // Adicionar produto ao carrinho
        await adicionarItemCarrinho(produto)
        
        toast({
          title: "Produto adicionado!",
          description: `${produto.nome} foi adicionado ao carrinho`,
        })
      } else {
        toast({
          title: "Produto não encontrado",
          description: `Nenhum produto encontrado com o código de barras: ${barcode}`,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Erro ao processar código de barras:", error)
      toast({
        title: "Erro",
        description: "Erro ao processar código de barras",
        variant: "destructive",
      })
    }
  }

  // Iniciar nova venda
  const iniciarNovaVenda = async () => {
    try {
      await criarVenda(clienteSelecionado?.id)
    } catch (error) {
      console.error("Erro ao iniciar venda:", error)
    }
  }

  // Finalizar venda atual
  const handleFinalizarVenda = async () => {
    if (!vendaAtual) return

    try {
      await finalizarVenda(
        vendaAtual.id,
        formaPagamento,
        descontoTotal,
        observacoes
      )
      setIsFinalizarDialogOpen(false)
      setDescontoTotal(0)
      setObservacoes("")
      setClienteSelecionado(null)
    } catch (error) {
      console.error("Erro ao finalizar venda:", error)
    }
  }

  // Cancelar venda atual
  const handleCancelarVenda = async () => {
    if (!vendaAtual) return

    try {
      await cancelarVenda(vendaAtual.id)
      setIsCancelarDialogOpen(false)
      setClienteSelecionado(null)
    } catch (error) {
      console.error("Erro ao cancelar venda:", error)
    }
  }

  // Calcular total final com desconto
  const totalFinal = totaisCarrinho.total - descontoTotal

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
        <div className="flex gap-2">
          {!vendaAtual ? (
            <Button
              className="bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-slate-900 font-semibold"
              onClick={iniciarNovaVenda}
            >
              <Plus className="w-4 h-4 mr-2" />
              Nova Venda
            </Button>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={() => setIsCancelarDialogOpen(true)}
                disabled={carrinho.length === 0}
              >
                <X className="w-4 h-4 mr-2" />
                Cancelar
              </Button>
              <Button
                className="bg-green-600 hover:bg-green-700 text-white"
                onClick={() => setIsFinalizarDialogOpen(true)}
                disabled={carrinho.length === 0}
              >
                <Receipt className="w-4 h-4 mr-2" />
                Finalizar Venda
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 md:gap-4">
        <Card className="border-amber-500/20 bg-gradient-to-br from-slate-900 to-slate-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">Vendas Hoje</CardTitle>
            <TrendingUp className="h-4 w-4 text-amber-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-400">{estatisticas.vendasHoje}</div>
            <p className="text-xs text-muted-foreground">vendas realizadas</p>
          </CardContent>
        </Card>

        <Card className="border-green-500/20 bg-gradient-to-br from-slate-900 to-slate-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">Receita Hoje</CardTitle>
            <DollarSign className="h-4 w-4 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-400">
              R$ {estatisticas.receitaHoje.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
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
            <p className="text-xs text-muted-foreground">vendas registradas</p>
          </CardContent>
        </Card>

        <Card className="border-purple-500/20 bg-gradient-to-br from-slate-900 to-slate-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">Receita Total</CardTitle>
            <CreditCard className="h-4 w-4 text-purple-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-400">
              R$ {estatisticas.receitaTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground">faturamento total</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
        {/* Lista de Produtos */}
        <div className="lg:col-span-2">
          <Card className="border-amber-500/20">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Package className="w-5 h-5 text-amber-400" />
                <span>Produtos</span>
              </CardTitle>
              <CardDescription>Selecione os produtos para adicionar à venda</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Busca */}
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar produtos..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-slate-800/50 border-slate-700"
                  />
                </div>

                {/* Scanner de Código de Barras */}
                <div className="border border-slate-700 rounded-lg p-3 bg-slate-800/30">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-slate-300">Código de Barras</span>
                    <Badge variant="outline" className="text-xs">
                      Leitor Automático
                    </Badge>
                  </div>
                  <BarcodeScanner
                    onScan={handleBarcodeScanned}
                    placeholder="Escaneie ou digite o código de barras"
                    className="w-full"
                  />
                </div>

                {/* Lista de Produtos */}
                <div className="max-h-64 md:max-h-96 overflow-y-auto space-y-2">
                  {/* Loading removido - carregamento instantâneo */}
                  {produtosFiltrados.length === 0 ? (
                    <div className="text-center text-slate-400 py-8">
                      Nenhum produto encontrado
                    </div>
                  ) : (
                    produtosFiltrados.map((produto) => (
                      <div
                        key={produto.id}
                        className="flex items-center justify-between p-3 border border-slate-700 rounded-lg hover:bg-slate-800/30 transition-colors"
                      >
                        <div className="flex-1">
                          <div className="font-medium text-slate-200">
                            {produto.nome}
                            {produto.marca && (
                              <span className="text-slate-400 ml-2">- {produto.marca}</span>
                            )}
                          </div>
                          <div className="text-sm text-slate-400">
                            Estoque: {produto.estoque_atual} | R$ {produto.preco_venda.toFixed(2)}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline" className="text-xs">
                            {produto.categoria}
                          </Badge>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => adicionarItemCarrinho(produto)}
                            disabled={produto.estoque_atual === 0 || !vendaAtual}
                            className="border-amber-500/50 text-amber-400 hover:bg-amber-500/10"
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Carrinho de Vendas */}
        <div>
          <Card className="border-green-500/20">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <ShoppingCart className="w-5 h-5 text-green-400" />
                  <span>Carrinho</span>
                </div>
                {vendaAtual && (
                  <Badge variant="outline" className="text-green-400 border-green-500/50">
                    {vendaAtual.numero_venda}
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                {carrinho.length} {carrinho.length === 1 ? "item" : "itens"} no carrinho
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Cliente */}
                {vendaAtual && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Cliente</Label>
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => setIsClienteDialogOpen(true)}
                    >
                      <User className="w-4 h-4 mr-2" />
                      {clienteSelecionado ? clienteSelecionado.nome : "Consumidor Final"}
                    </Button>
                  </div>
                )}

                <Separator />

                {/* Itens do Carrinho */}
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {carrinho.length === 0 ? (
                    <div className="text-center text-slate-400 py-8">
                      {!vendaAtual ? "Inicie uma nova venda" : "Carrinho vazio"}
                    </div>
                  ) : (
                    carrinho.map((item) => (
                      <div
                        key={item.produto_id}
                        className="flex flex-col space-y-2 p-3 border border-slate-700 rounded-lg"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm text-slate-200 truncate">
                              {item.nome}
                            </div>
                            <div className="text-xs text-slate-400">
                              R$ {item.preco_venda.toFixed(2)} cada
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => removerItemCarrinho(item.produto_id)}
                            className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                atualizarQuantidadeCarrinho(item.produto_id, item.quantidade - 1)
                              }
                              disabled={item.quantidade <= 1}
                            >
                              <Minus className="w-3 h-3" />
                            </Button>
                            <span className="text-sm font-medium w-8 text-center">
                              {item.quantidade}
                            </span>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                atualizarQuantidadeCarrinho(item.produto_id, item.quantidade + 1)
                              }
                              disabled={item.quantidade >= item.estoque_atual}
                            >
                              <Plus className="w-3 h-3" />
                            </Button>
                          </div>
                          <div className="text-sm font-medium text-green-400">
                            R$ {((item.quantidade * item.preco_venda) - item.desconto_item).toFixed(2)}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Totais */}
                {carrinho.length > 0 && (
                  <>
                    <Separator />
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">Subtotal:</span>
                        <span>R$ {totaisCarrinho.subtotal.toFixed(2)}</span>
                      </div>
                      {totaisCarrinho.desconto > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-400">Desconto:</span>
                          <span className="text-red-400">-R$ {totaisCarrinho.desconto.toFixed(2)}</span>
                        </div>
                      )}
                      <Separator />
                      <div className="flex justify-between text-lg font-bold">
                        <span>Total:</span>
                        <span className="text-green-400">
                          R$ {totaisCarrinho.total.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Dialog de Cliente */}
      <Dialog open={isClienteDialogOpen} onOpenChange={setIsClienteDialogOpen}>
        <DialogContent className="max-w-md bg-slate-900/95 backdrop-blur-sm border-amber-500/20">
          <DialogHeader>
            <DialogTitle className="text-amber-400">Selecionar Cliente</DialogTitle>
            <DialogDescription>Escolha um cliente para a venda ou continue como consumidor final</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => {
                setClienteSelecionado(null)
                setIsClienteDialogOpen(false)
              }}
            >
              <User className="w-4 h-4 mr-2" />
              Consumidor Final
            </Button>
            <Separator />
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {clientes.map((cliente) => (
                <Button
                  key={cliente.id}
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => {
                    setClienteSelecionado(cliente)
                    setIsClienteDialogOpen(false)
                  }}
                >
                  <div className="text-left">
                    <div className="font-medium">{cliente.nome}</div>
                    <div className="text-xs text-slate-400">
                      {cliente.cpf_cnpj} {cliente.telefone && `• ${cliente.telefone}`}
                    </div>
                  </div>
                </Button>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog de Finalizar Venda */}
      <Dialog open={isFinalizarDialogOpen} onOpenChange={setIsFinalizarDialogOpen}>
        <DialogContent className="max-w-md bg-slate-900/95 backdrop-blur-sm border-green-500/20">
          <DialogHeader>
            <DialogTitle className="text-green-400">Finalizar Venda</DialogTitle>
            <DialogDescription>Configure os detalhes finais da venda</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Forma de Pagamento</Label>
              <Select value={formaPagamento} onValueChange={setFormaPagamento}>
                <SelectTrigger className="bg-slate-800/50 border-slate-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dinheiro">Dinheiro</SelectItem>
                  <SelectItem value="pix">PIX</SelectItem>
                  <SelectItem value="cartao_debito">Cartão de Débito</SelectItem>
                  <SelectItem value="cartao_credito">Cartão de Crédito</SelectItem>
                  <SelectItem value="transferencia">Transferência</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Desconto Total (R$)</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={descontoTotal}
                onChange={(e) => setDescontoTotal(Number(e.target.value) || 0)}
                className="bg-slate-800/50 border-slate-700"
              />
            </div>

            <div className="space-y-2">
              <Label>Observações</Label>
              <Textarea
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                placeholder="Observações sobre a venda..."
                className="bg-slate-800/50 border-slate-700"
                rows={3}
              />
            </div>

            <Separator />

            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>R$ {totaisCarrinho.total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Desconto:</span>
                <span className="text-red-400">-R$ {descontoTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold">
                <span>Total Final:</span>
                <span className="text-green-400">R$ {totalFinal.toFixed(2)}</span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsFinalizarDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              className="bg-green-600 hover:bg-green-700 text-white"
              onClick={handleFinalizarVenda}
            >
              Confirmar Venda
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Cancelar Venda */}
      <AlertDialog open={isCancelarDialogOpen} onOpenChange={setIsCancelarDialogOpen}>
        <AlertDialogContent className="bg-slate-900/95 backdrop-blur-sm border-red-500/20">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-400">Cancelar Venda</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja cancelar esta venda? Todos os itens do carrinho serão perdidos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Voltar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={handleCancelarVenda}
            >
              Cancelar Venda
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
