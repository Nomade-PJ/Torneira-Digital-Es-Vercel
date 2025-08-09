"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Search,
  Plus,
  Filter,
  Activity,
  Package,
  ShoppingCart,
  User,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  ArrowUpCircle,
  ArrowDownCircle,
  X,
} from "lucide-react"
import { useMovimentacoes } from "@/hooks/use-movimentacoes"
import { useProdutos } from "@/hooks/use-produtos"
import { LoadingSpinner } from "@/components/loading-spinner"
import { BarcodeScanner } from "@/components/barcode-scanner"
import { useToast } from "@/hooks/use-toast"

const motivosEntrada = [
  { value: "compra", label: "Compra", icon: ShoppingCart, color: "text-green-400" },
  { value: "devolucao", label: "Devolução", icon: Package, color: "text-blue-400" },
  { value: "transferencia", label: "Transferência", icon: ArrowUpCircle, color: "text-purple-400" },
]

const motivosSaida = [
  { value: "venda", label: "Venda", icon: ShoppingCart, color: "text-green-400" },
  { value: "degustacao", label: "Degustação", icon: User, color: "text-blue-400" },
  { value: "quebra", label: "Quebra/Perda", icon: AlertCircle, color: "text-red-400" },
  { value: "transferencia", label: "Transferência", icon: ArrowDownCircle, color: "text-yellow-400" },
]

export default function FluxoPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [filterTipo, setFilterTipo] = useState("all")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [tipoMovimentacao, setTipoMovimentacao] = useState("entrada")
  
  // Estados do formulário
  const [formData, setFormData] = useState({
    produtoId: "",
    quantidade: "",
    motivo: "",
    responsavel: "",
    fornecedor: "",
    preco: "",
    observacao: "",
  })

  const { movimentacoes, loading, estatisticas, criarMovimentacao } = useMovimentacoes()
  const { produtos, buscarPorCodigoBarras } = useProdutos()
  const { toast } = useToast()

  // Função para lidar com código de barras escaneado
  const handleBarcodeScanned = async (barcode: string) => {
    try {
      const produto = await buscarPorCodigoBarras(barcode)
      
      if (produto) {
        // Preencher automaticamente o produto no formulário
        setFormData({
          ...formData,
          produtoId: produto.id,
          preco: tipoMovimentacao === "entrada" 
            ? produto.preco_compra.toString() 
            : produto.preco_venda.toString()
        })
        
        toast({
          title: "Produto encontrado!",
          description: `${produto.nome} foi selecionado automaticamente`,
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

  const filteredMovimentacoes = movimentacoes.filter((mov) => {
    const nomeProduto = mov.produtos?.nome || ""
    const matchesSearch =
      nomeProduto.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mov.responsavel?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mov.motivo.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesTipo = filterTipo === "all" || mov.tipo === filterTipo
    return matchesSearch && matchesTipo
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "concluida":
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">Concluída</Badge>
      case "pendente":
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-xs">Pendente</Badge>
      case "cancelada":
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-xs">Cancelada</Badge>
      default:
        return (
          <Badge variant="secondary" className="text-xs">
            Desconhecido
          </Badge>
        )
    }
  }

  const getTipoIcon = (tipo: string) => {
    return tipo === "entrada" ? (
      <ArrowUpCircle className="w-4 h-4 text-green-400" />
    ) : (
      <ArrowDownCircle className="w-4 h-4 text-red-400" />
    )
  }

  const getMotivoIcon = (motivo: string, tipo: string) => {
    const motivos = tipo === "entrada" ? motivosEntrada : motivosSaida
    const motivoObj = motivos.find((m) => m.value === motivo.toLowerCase())
    if (motivoObj) {
      const Icon = motivoObj.icon
      return <Icon className={`w-4 h-4 ${motivoObj.color}`} />
    }
    return <Package className="w-4 h-4 text-slate-400" />
  }

  // Funções do formulário
  const resetForm = () => {
    setFormData({
      produtoId: "",
      quantidade: "",
      motivo: "",
      responsavel: "",
      fornecedor: "",
      preco: "",
      observacao: "",
    })
  }

  const handleSubmit = async () => {
    try {
      if (!formData.produtoId || !formData.quantidade || !formData.motivo || !formData.responsavel) {
        return
      }

      const movimentacaoData = {
        produto_id: formData.produtoId,
        tipo: tipoMovimentacao as "entrada" | "saida",
        quantidade: parseInt(formData.quantidade),
        motivo: formData.motivo,
        responsavel: formData.responsavel,
        preco_unitario: parseFloat(formData.preco) || 0,
        fornecedor: tipoMovimentacao === "entrada" ? formData.fornecedor : null,
        observacao: formData.observacao || null,
      }

      await criarMovimentacao(movimentacaoData)
      setIsDialogOpen(false)
      resetForm()
    } catch (error) {
      console.error("Erro ao criar movimentação:", error)
    }
  }

  const totalMovimentacoes = estatisticas.totalMovimentacoes
  const totalEntradas = estatisticas.totalEntradas
  const totalSaidas = estatisticas.totalSaidas
  const valorTotalEntradas = estatisticas.valorTotalEntradas
  const valorTotalSaidas = estatisticas.valorTotalSaidas

  return (
    <div className="space-y-4 md:space-y-6 w-full max-w-full overflow-hidden">
      {/* Header */}
      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-amber-400 to-yellow-500 bg-clip-text text-transparent">
            Fluxo de Produtos
          </h1>
          <p className="text-muted-foreground mt-1 text-sm md:text-base">
            Controle completo de entradas e saídas do estoque
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="w-full md:w-auto bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-slate-900 font-semibold">
              <Plus className="w-4 h-4 mr-2" />
              Nova Movimentação
            </Button>
          </DialogTrigger>
          <DialogContent className="w-[95vw] max-w-2xl mx-auto bg-slate-900/95 backdrop-blur-sm border-amber-500/20">
            <DialogHeader>
              <DialogTitle className="text-lg md:text-xl bg-gradient-to-r from-amber-400 to-yellow-500 bg-clip-text text-transparent">
                Registrar Nova Movimentação
              </DialogTitle>
              <DialogDescription className="text-sm md:text-base">
                Registre uma entrada ou saída de produtos no estoque
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {/* Tipo de Movimentação */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Tipo de Movimentação</Label>
                <Tabs value={tipoMovimentacao} onValueChange={(novoTipo) => {
                  setTipoMovimentacao(novoTipo)
                  // Atualizar preço baseado no novo tipo se já houver produto selecionado
                  if (formData.produtoId) {
                    const produtoSelecionado = produtos.find(p => p.id === formData.produtoId)
                    if (produtoSelecionado) {
                      setFormData(prev => ({
                        ...prev,
                        preco: novoTipo === "entrada" 
                          ? produtoSelecionado.preco_compra.toString() 
                          : produtoSelecionado.preco_venda.toString()
                      }))
                    }
                  }
                }} className="w-full">
                  <TabsList className="grid w-full grid-cols-2 bg-slate-800/50">
                    <TabsTrigger
                      value="entrada"
                      className="data-[state=active]:bg-green-500/20 data-[state=active]:text-green-400"
                    >
                      <ArrowUpCircle className="w-4 h-4 mr-2" />
                      Entrada
                    </TabsTrigger>
                    <TabsTrigger
                      value="saida"
                      className="data-[state=active]:bg-red-500/20 data-[state=active]:text-red-400"
                    >
                      <ArrowDownCircle className="w-4 h-4 mr-2" />
                      Saída
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="produto" className="text-sm font-medium">
                    Produto
                  </Label>
                  <Select value={formData.produtoId} onValueChange={(value) => {
                    const produtoSelecionado = produtos.find(p => p.id === value)
                    setFormData({
                      ...formData, 
                      produtoId: value,
                      preco: produtoSelecionado 
                        ? (tipoMovimentacao === "entrada" 
                            ? produtoSelecionado.preco_compra.toString() 
                            : produtoSelecionado.preco_venda.toString()
                          )
                        : ""
                    })
                  }}>
                    <SelectTrigger className="bg-slate-800/50 border-slate-700">
                      <SelectValue placeholder="Selecione o produto" />
                    </SelectTrigger>
                    <SelectContent>
                      {produtos.length === 0 ? (
                        <div className="p-2 text-sm text-slate-400">Nenhum produto encontrado</div>
                      ) : (
                        produtos.map((produto) => (
                          <SelectItem key={produto.id} value={produto.id}>
                            {produto.nome.trim()} {produto.marca ? `- ${produto.marca}` : ""} {produto.volume ? `(${produto.volume})` : ""}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  
                  {/* Scanner de Código de Barras */}
                  <div className="mt-2">
                    <div className="border border-slate-700 rounded-lg p-3 bg-slate-800/30">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-slate-300">Código de Barras</span>
                        <Badge variant="outline" className="text-xs">
                          Busca Rápida
                        </Badge>
                      </div>
                      <BarcodeScanner
                        onScan={handleBarcodeScanned}
                        placeholder="Escaneie ou digite o código"
                        className="w-full"
                      />
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="quantidade" className="text-sm font-medium">
                    Quantidade
                  </Label>
                  <Input 
                    id="quantidade" 
                    type="number" 
                    placeholder="0" 
                    value={formData.quantidade}
                    onChange={(e) => setFormData({...formData, quantidade: e.target.value})}
                    className="bg-slate-800/50 border-slate-700" 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="motivo" className="text-sm font-medium">
                    Motivo
                  </Label>
                  <Select value={formData.motivo} onValueChange={(value) => setFormData({...formData, motivo: value})}>
                    <SelectTrigger className="bg-slate-800/50 border-slate-700">
                      <SelectValue placeholder="Selecione o motivo" />
                    </SelectTrigger>
                    <SelectContent>
                      {(tipoMovimentacao === "entrada" ? motivosEntrada : motivosSaida).map((motivo) => (
                        <SelectItem key={motivo.value} value={motivo.value}>
                          <div className="flex items-center space-x-2">
                            <motivo.icon className={`w-4 h-4 ${motivo.color}`} />
                            <span>{motivo.label}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="responsavel" className="text-sm font-medium">
                    Responsável
                  </Label>
                  <Input
                    id="responsavel"
                    placeholder="Nome do responsável"
                    value={formData.responsavel}
                    onChange={(e) => setFormData({...formData, responsavel: e.target.value})}
                    className="bg-slate-800/50 border-slate-700"
                  />
                </div>
                {tipoMovimentacao === "entrada" && (
                  <div className="space-y-2">
                    <Label htmlFor="fornecedor" className="text-sm font-medium">
                      Fornecedor
                    </Label>
                    <Input
                      id="fornecedor"
                      placeholder="Nome do fornecedor"
                      value={formData.fornecedor}
                      onChange={(e) => setFormData({...formData, fornecedor: e.target.value})}
                      className="bg-slate-800/50 border-slate-700"
                    />
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="preco" className="text-sm font-medium">
                    {tipoMovimentacao === "entrada" ? "Preço de Compra (R$)" : "Preço de Venda (R$)"}
                  </Label>
                  <Input
                    id="preco"
                    type="number"
                    step="0.01"
                    placeholder="0,00"
                    value={formData.preco}
                    onChange={(e) => setFormData({...formData, preco: e.target.value})}
                    className="bg-slate-800/50 border-slate-700"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="observacao" className="text-sm font-medium">
                    Observação
                  </Label>
                  <Textarea
                    id="observacao"
                    placeholder="Observações sobre a movimentação..."
                    value={formData.observacao}
                    onChange={(e) => setFormData({...formData, observacao: e.target.value})}
                    className="bg-slate-800/50 border-slate-700 resize-none"
                    rows={3}
                  />
                </div>
              </div>
            </div>
            <DialogFooter className="flex flex-col-reverse md:flex-row gap-2">
              <Button variant="outline" onClick={() => { setIsDialogOpen(false); resetForm(); }} className="w-full md:w-auto">
                Cancelar
              </Button>
              <Button
                className="w-full md:w-auto bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-900"
                onClick={handleSubmit}
                disabled={!formData.produtoId || !formData.quantidade || !formData.motivo || !formData.responsavel}
              >
                Registrar Movimentação
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 md:gap-4">
        <Card className="border-amber-500/20 bg-gradient-to-br from-slate-900 to-slate-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs md:text-sm font-medium text-slate-300">Total</CardTitle>
            <Activity className="h-4 w-4 text-amber-400" />
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-xl lg:text-2xl font-bold text-amber-400">{totalMovimentacoes}</div>
            <p className="text-xs text-muted-foreground">Movimentações</p>
          </CardContent>
        </Card>

        <Card className="border-green-500/20 bg-gradient-to-br from-slate-900 to-slate-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs md:text-sm font-medium text-slate-300">Entradas</CardTitle>
            <ArrowUpCircle className="h-4 w-4 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-xl lg:text-2xl font-bold text-green-400">{totalEntradas}</div>
            <p className="text-xs text-muted-foreground">Este mês</p>
          </CardContent>
        </Card>

        <Card className="border-red-500/20 bg-gradient-to-br from-slate-900 to-slate-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs md:text-sm font-medium text-slate-300">Saídas</CardTitle>
            <ArrowDownCircle className="h-4 w-4 text-red-400" />
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-xl lg:text-2xl font-bold text-red-400">{totalSaidas}</div>
            <p className="text-xs text-muted-foreground">Este mês</p>
          </CardContent>
        </Card>

        <Card className="border-blue-500/20 bg-gradient-to-br from-slate-900 to-slate-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs md:text-sm font-medium text-slate-300">Investido</CardTitle>
            <TrendingDown className="h-4 w-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-lg md:text-xl font-bold text-blue-400">
              R$ {valorTotalEntradas.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground">Entradas</p>
          </CardContent>
        </Card>

        <Card className="border-purple-500/20 bg-gradient-to-br from-slate-900 to-slate-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs md:text-sm font-medium text-slate-300">Receita</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-400" />
          </CardHeader>
          <CardContent>
            <div className="text-lg md:text-xl font-bold text-purple-400">
              R$ {valorTotalSaidas.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground">Saídas</p>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Movimentações */}
      <Card className="border-amber-500/20">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Activity className="w-5 h-5 text-amber-400" />
            <span>Histórico de Movimentações</span>
          </CardTitle>
          <CardDescription>Lista completa de todas as entradas e saídas registradas</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col space-y-4 md:flex-row md:space-y-0 md:space-x-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar movimentações..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-slate-800/50 border-slate-700"
              />
            </div>
            <Select value={filterTipo} onValueChange={setFilterTipo}>
              <SelectTrigger className="w-full md:w-48 bg-slate-800/50 border-slate-700">
                <Filter className="w-4 h-4 mr-2 text-amber-400" />
                <SelectValue placeholder="Filtrar por tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Tipos</SelectItem>
                <SelectItem value="entrada">Entradas</SelectItem>
                <SelectItem value="saida">Saídas</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Loading removido - carregamento instantâneo */}
          {filteredMovimentacoes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Activity className="w-12 h-12 text-slate-600 mb-4" />
              <h3 className="text-lg font-medium text-slate-400 mb-2">Nenhuma movimentação encontrada</h3>
              <p className="text-sm text-slate-500 mb-4">
                {movimentacoes.length === 0
                  ? "Comece registrando suas primeiras movimentações"
                  : "Tente ajustar os filtros de busca"}
              </p>
              <Button
                onClick={() => setIsDialogOpen(true)}
                className="bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-slate-900"
              >
                <Plus className="w-4 h-4 mr-2" />
                Primeira Movimentação
              </Button>
            </div>
          ) : (
            <>
              {/* Mobile View - Cards */}
              <div className="block md:hidden space-y-3">
                {filteredMovimentacoes.map((mov) => (
                  <Card key={mov.id} className="border-slate-700 bg-slate-800/30">
                    <CardContent className="p-3">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-1">
                            {getTipoIcon(mov.tipo)}
                            <h3 className="font-semibold text-sm text-slate-200 truncate">
                              {mov.produtos?.nome} {mov.produtos?.marca ? `- ${mov.produtos.marca}` : ""}
                            </h3>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {new Date(mov.data_movimentacao).toLocaleDateString("pt-BR")}
                          </p>
                        </div>
                        <div className="ml-2 flex-shrink-0">{getStatusBadge(mov.status)}</div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-muted-foreground">Quantidade:</span>
                          <div className="font-semibold text-slate-200">{mov.quantidade}</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Motivo:</span>
                          <div className="flex items-center space-x-1 mt-1">
                            {getMotivoIcon(mov.motivo, mov.tipo)}
                            <span className="text-slate-200 text-xs truncate capitalize">{mov.motivo}</span>
                          </div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Responsável:</span>
                          <div className="font-semibold text-slate-200 text-xs truncate">{mov.responsavel}</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Total:</span>
                          <div
                            className={`font-semibold text-xs ${mov.tipo === "entrada" ? "text-blue-400" : "text-green-400"}`}
                          >
                            {(mov.preco_unitario * mov.quantidade) > 0 ? `R$ ${(mov.preco_unitario * mov.quantidade).toFixed(2)}` : "-"}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

          {/* Desktop View - Tabela */}
          <div className="hidden md:block">
            <div className="rounded-md border border-slate-700 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[600px]">
                  <thead>
                    <tr className="border-b border-slate-700 bg-slate-800/50">
                      <th className="text-left p-1 sm:p-2 lg:p-3 text-amber-400 text-xs lg:text-sm font-medium">
                        Data
                      </th>
                      <th className="text-left p-1 sm:p-2 lg:p-3 text-amber-400 text-xs lg:text-sm font-medium">
                        Produto
                      </th>
                      <th className="text-center p-1 sm:p-2 lg:p-3 text-amber-400 text-xs lg:text-sm font-medium">
                        Tipo
                      </th>
                      <th className="text-center p-1 sm:p-2 lg:p-3 text-amber-400 text-xs lg:text-sm font-medium">
                        Qtd
                      </th>
                      <th className="text-left p-1 sm:p-2 lg:p-3 text-amber-400 text-xs lg:text-sm font-medium">
                        Motivo
                      </th>
                      <th className="text-left p-1 sm:p-2 lg:p-3 text-amber-400 text-xs lg:text-sm font-medium hidden xl:table-cell">
                        Responsável
                      </th>
                      <th className="text-right p-1 sm:p-2 lg:p-3 text-amber-400 text-xs lg:text-sm font-medium">
                        Total
                      </th>
                      <th className="text-center p-1 sm:p-2 lg:p-3 text-amber-400 text-xs lg:text-sm font-medium">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredMovimentacoes.map((mov) => (
                      <tr key={mov.id} className="border-b border-slate-700 hover:bg-slate-800/30">
                        <td className="p-1 sm:p-2 lg:p-3 font-mono text-xs">
                          {new Date(mov.data_movimentacao).toLocaleDateString("pt-BR")}
                        </td>
                        <td className="p-1 sm:p-2 lg:p-3">
                          <div className="font-medium text-xs lg:text-sm text-slate-200 max-w-[150px] lg:max-w-none truncate">
                            {mov.produtos?.nome} {mov.produtos?.marca ? `- ${mov.produtos.marca}` : ""}
                            {(mov.produtos as any)?.ativo === false && (
                              <span className="ml-2 text-xs text-red-400 font-normal">(inativo)</span>
                            )}
                          </div>
                        </td>
                        <td className="p-1 sm:p-2 lg:p-3 text-center">
                          <div className="flex items-center justify-center space-x-1">
                            {getTipoIcon(mov.tipo)}
                            <span
                              className={`text-xs font-medium ${mov.tipo === "entrada" ? "text-green-400" : "text-red-400"} hidden lg:inline`}
                            >
                              {mov.tipo === "entrada" ? "Entrada" : "Saída"}
                            </span>
                          </div>
                        </td>
                        <td className="p-1 sm:p-2 lg:p-3 text-center">
                          <Badge variant="outline" className="border-amber-500/50 text-amber-400 text-xs">
                            {mov.quantidade}
                          </Badge>
                        </td>
                        <td className="p-1 sm:p-2 lg:p-3">
                          <div className="flex items-center space-x-1 lg:space-x-2">
                            {getMotivoIcon(mov.motivo, mov.tipo)}
                            <span className="text-xs lg:text-sm max-w-[80px] lg:max-w-none truncate capitalize">{mov.motivo}</span>
                          </div>
                        </td>
                        <td className="p-1 sm:p-2 lg:p-3 text-xs text-muted-foreground hidden xl:table-cell">
                          <div className="max-w-[120px] truncate">{mov.responsavel}</div>
                        </td>
                        <td className="p-1 sm:p-2 lg:p-3 text-right font-mono font-semibold text-xs lg:text-sm">
                          <span className={mov.tipo === "entrada" ? "text-blue-400" : "text-green-400"}>
                            {(mov.preco_unitario * mov.quantidade) > 0 ? `R$ ${(mov.preco_unitario * mov.quantidade).toFixed(2)}` : "-"}
                          </span>
                        </td>
                        <td className="p-1 sm:p-2 lg:p-3 text-center">{getStatusBadge(mov.status)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
              </>
            )}
        </CardContent>
      </Card>
    </div>
  )
}
