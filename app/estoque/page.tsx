"use client"

import { useState, useEffect, useCallback } from "react"
import { supabase } from "@/lib/supabase"
import { useAuthContext } from "@/components/providers/auth-provider"
import { ProdutoModal } from "@/components/produto-modal"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
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
  Filter,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  Package,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
} from "lucide-react"

import { BarcodeScanner } from "@/components/barcode-scanner"
import { useToast } from "@/components/ui/use-toast"

interface Produto {
  id: string
  nome: string
  marca?: string | null
  volume?: string | null
  categoria: string
  estoque_atual: number
  estoque_minimo: number
  preco_compra: number
  preco_venda: number
  codigo_barras?: string
  data_validade?: string
  fornecedor?: string
  ativo: boolean
}

export default function EstoquePage() {
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [filterCategory, setFilterCategory] = useState("all")
  const [selectedProduct, setSelectedProduct] = useState<Produto | null>(null)
  const [editingProduct, setEditingProduct] = useState<Produto | null>(null)
  const [deletingProduct, setDeletingProduct] = useState<Produto | null>(null)
  
  const { user } = useAuthContext()
  const { toast } = useToast()

  // Funções diretas do Supabase
  const carregarProdutos = useCallback(async () => {
    if (!user?.id) return
    
    console.log('🔄 Carregando produtos...', new Date().toISOString())
    try {
      const { data, error } = await supabase
        .from("produtos")
        .select("*")
        .eq("usuario_id", user.id)
        .eq("ativo", true)
        .order("nome")
      
      if (error) throw error
      setProdutos(data || [])
    } catch (error) {
      console.error("Erro ao carregar produtos:", error)
      toast({
        title: "Erro",
        description: "Erro ao carregar produtos",
        variant: "destructive",
      })
    }
  }, [user?.id, toast])

  const buscarPorCodigoBarras = async (codigoBarras: string) => {
    if (!user?.id) return null

    try {
      const { data, error } = await supabase
        .from("produtos")
        .select("*")
        .eq("usuario_id", user.id)
        .eq("codigo_barras", codigoBarras)
        .eq("ativo", true)
        .single()

      if (error) {
        if (error.code === 'PGRST116') return null
        throw error
      }
      
      return data
    } catch (error) {
      console.error("Erro ao buscar produto por código de barras:", error)
      return null
    }
  }

  const criarProduto = async (produto: any) => {
    if (!user?.id) return

    try {
      const dadosLimpos = {
        ...produto,
        usuario_id: user.id,
        ativo: true,
      }

      // Limpar campos vazios
      if (!dadosLimpos.data_validade) delete dadosLimpos.data_validade
      if (!dadosLimpos.marca) dadosLimpos.marca = null
      if (!dadosLimpos.volume) dadosLimpos.volume = null
      if (!dadosLimpos.fornecedor) dadosLimpos.fornecedor = null

      const { data, error } = await supabase
        .from("produtos")
        .insert(dadosLimpos)
        .select()
        .single()

      if (error) throw error

      setProdutos(prev => [data, ...prev])
      
      toast({
        title: "Sucesso",
        description: "Produto criado com sucesso",
      })

      return data
    } catch (error) {
      console.error("Erro ao criar produto:", error)
      toast({
        title: "Erro",
        description: "Erro ao criar produto",
        variant: "destructive",
      })
      throw error
    }
  }

  const atualizarProduto = async (id: string, atualizacoes: any) => {
    if (!user?.id) return

    try {
      const { data, error } = await supabase
        .from("produtos")
        .update(atualizacoes)
        .eq("id", id)
        .eq("usuario_id", user.id)
        .select()
        .single()

      if (error) throw error

      setProdutos(prev =>
        prev.map(produto => produto.id === id ? data : produto)
      )

      toast({
        title: "Sucesso",
        description: "Produto atualizado com sucesso",
      })

      return data
    } catch (error) {
      console.error("Erro ao atualizar produto:", error)
      toast({
        title: "Erro",
        description: "Erro ao atualizar produto",
        variant: "destructive",
      })
      throw error
    }
  }

  const deletarProduto = async (id: string) => {
    if (!user?.id) return

    try {
      const { error } = await supabase
        .from("produtos")
        .update({ ativo: false })
        .eq("id", id)
        .eq("usuario_id", user.id)

      if (error) throw error

      setProdutos(prev => prev.filter(produto => produto.id !== id))
      
      toast({
        title: "Sucesso",
        description: "Produto removido com sucesso",
      })
    } catch (error) {
      console.error("Erro ao deletar produto:", error)
      toast({
        title: "Erro",
        description: "Erro ao deletar produto",
        variant: "destructive",
      })
      throw error
    }
  }

  // Carregar produtos na inicialização
  useEffect(() => {
    if (user?.id) {
      carregarProdutos()
    }
  }, [user?.id, carregarProdutos])

  // Função para lidar com código de barras escaneado
  const handleBarcodeScanned = async (barcode: string) => {
    try {
      const produto = await buscarPorCodigoBarras(barcode)
      
      if (produto) {
        // Atualizar o termo de busca para mostrar o produto encontrado
        setSearchTerm(produto.nome)
        
        // Mostrar detalhes do produto
        setSelectedProduct(produto)
        setIsViewDialogOpen(true)
        
        toast({
          title: "Produto encontrado!",
          description: `${produto.nome} foi localizado no estoque`,
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
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)

  const filteredProducts = produtos.filter((produto) => {
    const matchesSearch =
      produto.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (produto.marca?.toLowerCase() || "").includes(searchTerm.toLowerCase())
    const matchesCategory = filterCategory === "all" || produto.categoria === filterCategory
    return matchesSearch && matchesCategory
  })

  const getStatusBadge = (estoque: number, estoqueMin: number) => {
    if (estoque < estoqueMin * 0.5) {
      return (
        <Badge variant="destructive" className="bg-red-500/20 text-red-400 text-xs">
          Crítico
        </Badge>
      )
    } else if (estoque < estoqueMin) {
      return (
        <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-400 text-xs">
          Baixo
        </Badge>
      )
    } else {
      return (
        <Badge variant="secondary" className="bg-green-500/20 text-green-400 text-xs">
          Normal
        </Badge>
      )
    }
  }

  const handleView = (produto: any) => {
    setSelectedProduct(produto)
    setIsViewDialogOpen(true)
  }

  const handleEdit = (produto: any) => {
    setEditingProduct({ ...produto })
    setIsEditDialogOpen(true)
  }

  const handleDelete = (produto: any) => {
    setDeletingProduct(produto)
    setIsDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (deletingProduct) {
      try {
        await deletarProduto(deletingProduct.id)
        setIsDeleteDialogOpen(false)
        setDeletingProduct(null)
      } catch (error) {
        console.error("Erro ao excluir produto:", error)
      }
    }
  }

  const handleSaveEdit = async () => {
    if (editingProduct) {
      try {
        // Garantir que os valores numéricos estão corretos
        const produtoAtualizado = {
          ...editingProduct,
          estoque_atual: typeof editingProduct.estoque_atual === 'string' ? parseInt(editingProduct.estoque_atual) || 0 : editingProduct.estoque_atual,
          estoque_minimo: typeof editingProduct.estoque_minimo === 'string' ? parseInt(editingProduct.estoque_minimo) || 0 : editingProduct.estoque_minimo,
          preco_compra: typeof editingProduct.preco_compra === 'string' ? parseFloat(editingProduct.preco_compra) || 0 : editingProduct.preco_compra,
          preco_venda: typeof editingProduct.preco_venda === 'string' ? parseFloat(editingProduct.preco_venda) || 0 : editingProduct.preco_venda,
        }
        
        await atualizarProduto(editingProduct.id, produtoAtualizado)
        setIsEditDialogOpen(false)
        setEditingProduct(null)
      } catch (error) {
        console.error("Erro ao salvar produto:", error)
      }
    }
  }

  const totalProdutos = produtos.length
  const produtosCriticos = produtos.filter((p) => p.estoque_atual < p.estoque_minimo * 0.5).length
  const produtosBaixos = produtos.filter(
    (p) => p.estoque_atual < p.estoque_minimo && p.estoque_atual >= p.estoque_minimo * 0.5,
  ).length
  const valorTotalEstoque = produtos.reduce((total, produto) => total + produto.estoque_atual * produto.preco_compra, 0)

  return (
    <div className="space-y-6 max-w-full overflow-hidden">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-amber-400 to-yellow-500 bg-clip-text text-transparent">
            Estoque
          </h1>
          <p className="text-muted-foreground mt-1">Gerencie todos os produtos do seu estabelecimento</p>
        </div>
        <Button
          className="bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-slate-900 font-semibold"
          onClick={() => setIsAddDialogOpen(true)}
        >
          <Plus className="w-4 h-4 mr-2" />
          Novo Produto
        </Button>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-amber-500/20 bg-gradient-to-br from-slate-900 to-slate-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">Total de Produtos</CardTitle>
            <Package className="h-4 w-4 text-amber-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-400">{totalProdutos}</div>
            <p className="text-xs text-muted-foreground">Produtos cadastrados</p>
          </CardContent>
        </Card>

        <Card className="border-red-500/20 bg-gradient-to-br from-slate-900 to-slate-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">Estoque Crítico</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-400">{produtosCriticos}</div>
            <p className="text-xs text-muted-foreground">Produtos em falta</p>
          </CardContent>
        </Card>

        <Card className="border-yellow-500/20 bg-gradient-to-br from-slate-900 to-slate-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">Estoque Baixo</CardTitle>
            <TrendingDown className="h-4 w-4 text-yellow-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-400">{produtosBaixos}</div>
            <p className="text-xs text-muted-foreground">Produtos para repor</p>
          </CardContent>
        </Card>

        <Card className="border-green-500/20 bg-gradient-to-br from-slate-900 to-slate-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">Valor Total</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-400">
              R$ {valorTotalEstoque.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground">Valor do estoque</p>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Produtos */}
      <Card className="border-amber-500/20">
        <CardHeader>
          <CardTitle>Produtos em Dashtoque</CardTitle>
          <CardDescription>Lista completa de todos os produtos cadastrados</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar produtos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-slate-800/50 border-slate-700"
              />
            </div>

            {/* Scanner de Código de Barras */}
            <div className="w-full md:w-auto">
              <div className="border border-slate-700 rounded-lg p-3 bg-slate-800/30">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-slate-300">Scanner</span>
                  <Badge variant="outline" className="text-xs">
                    Busca Rápida
                  </Badge>
                </div>
                <BarcodeScanner
                  onScan={handleBarcodeScanned}
                  placeholder="Escaneie código de barras"
                  className="w-full"
                />
              </div>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="border-amber-500/50 text-amber-400 hover:bg-amber-500/10 bg-transparent"
                >
                  <Filter className="w-4 h-4 mr-2" />
                  Filtrar por Categoria
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setFilterCategory("all")}>Todas as Categorias</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterCategory("Cerveja")}>Cerveja</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterCategory("Refrigerante")}>Refrigerante</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterCategory("Vinho")}>Vinho</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Lista Responsiva - Cards em Mobile, Tabela em Desktop */}
          <div className="space-y-4">
            {/* Mobile View - Cards */}
            <div className="block md:hidden space-y-4">
              {filteredProducts.map((produto) => (
                <Card key={produto.id} className="border-slate-700 bg-slate-800/30">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-sm text-slate-200 mb-1">{produto.nome}</h3>
                        <p className="text-xs text-muted-foreground">
                          {produto.marca} - {produto.volume}
                        </p>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleView(produto)}>
                            <Eye className="w-4 h-4 mr-2" />
                            Visualizar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEdit(produto)}>
                            <Edit className="w-4 h-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-red-400" onClick={() => handleDelete(produto)}>
                            <Trash2 className="w-4 h-4 mr-2" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-muted-foreground">Categoria:</span>
                        <div className="mt-1">
                          <Badge variant="outline" className="border-amber-500/50 text-amber-400 text-xs">
                            {produto.categoria}
                          </Badge>
                        </div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Status:</span>
                        <div className="mt-1">
                          {getStatusBadge(produto.estoque_atual, produto.estoque_minimo)}
                        </div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Estoque:</span>
                        <div className="font-semibold text-slate-200">
                          {produto.estoque_atual}{" "}
                          <span className="text-xs text-muted-foreground">(Mín: {produto.estoque_minimo})</span>
                        </div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Preço Venda:</span>
                        <div className="font-semibold text-green-400">R$ {produto.preco_venda.toFixed(2)}</div>
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
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-700 bg-slate-800/50">
                        <th className="text-left p-3 text-amber-400 text-sm font-medium">Produto</th>
                        <th className="text-left p-3 text-amber-400 text-sm font-medium">Categoria</th>
                        <th className="text-center p-3 text-amber-400 text-sm font-medium">Estoque</th>
                        <th className="text-center p-3 text-amber-400 text-sm font-medium">Status</th>
                        <th className="text-right p-3 text-amber-400 text-sm font-medium">Preço Compra</th>
                        <th className="text-right p-3 text-amber-400 text-sm font-medium">Preço Venda</th>
                        <th className="text-left p-3 text-amber-400 text-sm font-medium hidden lg:table-cell">
                          Fornecedor
                        </th>
                        <th className="text-center p-3 text-amber-400 text-sm font-medium">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredProducts.map((produto) => (
                        <tr key={produto.id} className="border-b border-slate-700 hover:bg-slate-800/30">
                          <td className="p-3">
                            <div>
                              <div className="font-medium text-sm text-slate-200">{produto.nome}</div>
                              <div className="text-xs text-muted-foreground">
                                {produto.marca} - {produto.volume}
                              </div>
                            </div>
                          </td>
                          <td className="p-3">
                            <Badge variant="outline" className="border-amber-500/50 text-amber-400 text-xs">
                              {produto.categoria}
                            </Badge>
                          </td>
                          <td className="p-3 text-center">
                            <div>
                              <div className="font-medium text-sm">{produto.estoque_atual}</div>
                              <div className="text-xs text-muted-foreground">Mín: {produto.estoque_minimo}</div>
                            </div>
                          </td>
                          <td className="p-3 text-center">
                            {getStatusBadge(produto.estoque_atual, produto.estoque_minimo)}
                          </td>
                          <td className="p-3 text-right font-mono text-sm">R$ {produto.preco_compra.toFixed(2)}</td>
                          <td className="p-3 text-right font-mono text-sm">R$ {produto.preco_venda.toFixed(2)}</td>
                          <td className="p-3 text-xs text-muted-foreground hidden lg:table-cell">
                            {produto.fornecedor}
                          </td>
                          <td className="p-3 text-center">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                  <MoreHorizontal className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleView(produto)}>
                                  <Eye className="w-4 h-4 mr-2" />
                                  Visualizar
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleEdit(produto)}>
                                  <Edit className="w-4 h-4 mr-2" />
                                  Editar
                                </DropdownMenuItem>
                                <DropdownMenuItem className="text-red-400" onClick={() => handleDelete(produto)}>
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Excluir
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dialog de Visualização */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl bg-slate-900/95 backdrop-blur-sm border-amber-500/20">
          <DialogHeader>
            <DialogTitle className="text-xl bg-gradient-to-r from-amber-400 to-yellow-500 bg-clip-text text-transparent">
              Detalhes do Produto
            </DialogTitle>
            <DialogDescription>Informações completas do produto selecionado</DialogDescription>
          </DialogHeader>
          {selectedProduct && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-slate-300">Nome do Produto</Label>
                  <p className="text-slate-200 font-semibold">{selectedProduct?.nome}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-slate-300">Marca</Label>
                  <p className="text-slate-200">{selectedProduct?.marca}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-slate-300">Volume</Label>
                  <p className="text-slate-200">{selectedProduct?.volume}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-slate-300">Categoria</Label>
                  <Badge variant="outline" className="border-amber-500/50 text-amber-400">
                    {selectedProduct?.categoria}
                  </Badge>
                </div>
                <div>
                  <Label className="text-sm font-medium text-slate-300">Código de Barras</Label>
                  <p className="text-slate-200 font-mono">{selectedProduct?.codigo_barras}</p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-slate-300">Estoque Atual</Label>
                  <p className="text-slate-200 font-semibold text-lg">{selectedProduct?.estoque_atual} unidades</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-slate-300">Estoque Mínimo</Label>
                  <p className="text-slate-200">{selectedProduct?.estoque_minimo} unidades</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-slate-300">Status</Label>
                  <div className="mt-1">
                    {getStatusBadge(selectedProduct?.estoque_atual || 0, selectedProduct?.estoque_minimo || 0)}
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-slate-300">Preço de Compra</Label>
                  <p className="text-blue-400 font-semibold">R$ {selectedProduct?.preco_compra?.toFixed(2)}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-slate-300">Preço de Venda</Label>
                  <p className="text-green-400 font-semibold">R$ {selectedProduct?.preco_venda?.toFixed(2)}</p>
                </div>
              </div>
              <div className="md:col-span-2 space-y-4">
                <div>
                  <Label className="text-sm font-medium text-slate-300">Data de Validade</Label>
                  <p className="text-slate-200">{selectedProduct?.data_validade ? new Date(selectedProduct.data_validade).toLocaleDateString("pt-BR") : "-"}</p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Edição */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl bg-slate-900/95 backdrop-blur-sm border-amber-500/20">
          <DialogHeader>
            <DialogTitle className="text-xl bg-gradient-to-r from-amber-400 to-yellow-500 bg-clip-text text-transparent">
              Editar Produto
            </DialogTitle>
            <DialogDescription>Altere as informações do produto</DialogDescription>
          </DialogHeader>
          {editingProduct && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-nome">Nome do Produto</Label>
                <Input
                  id="edit-nome"
                  value={editingProduct?.nome || ""}
                  onChange={(e) => setEditingProduct({ ...editingProduct, nome: e.target.value })}
                  className="bg-slate-800/50 border-slate-700"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-marca">Marca</Label>
                <Input
                  id="edit-marca"
                  value={editingProduct?.marca || ""}
                  onChange={(e) => setEditingProduct({ ...editingProduct, marca: e.target.value })}
                  className="bg-slate-800/50 border-slate-700"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-volume">Volume</Label>
                <Input
                  id="edit-volume"
                  value={editingProduct?.volume || ""}
                  onChange={(e) => setEditingProduct({ ...editingProduct, volume: e.target.value })}
                  className="bg-slate-800/50 border-slate-700"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-categoria">Categoria</Label>
                <Select
                  value={editingProduct?.categoria || ""}
                  onValueChange={(value) => setEditingProduct({ ...editingProduct, categoria: value })}
                >
                  <SelectTrigger className="bg-slate-800/50 border-slate-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Cerveja">Cerveja</SelectItem>
                    <SelectItem value="Refrigerante">Refrigerante</SelectItem>
                    <SelectItem value="Vinho">Vinho</SelectItem>
                    <SelectItem value="Destilado">Destilado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-estoque">Estoque Atual</Label>
                <Input
                  id="edit-estoque"
                  type="number"
                  min="0"
                  value={editingProduct?.estoque_atual === 0 ? "" : editingProduct?.estoque_atual || ""}
                  onChange={(e) => {
                    const value = e.target.value === "" ? 0 : parseInt(e.target.value) || 0
                    setEditingProduct({ ...editingProduct, estoque_atual: value })
                  }}
                  className="bg-slate-800/50 border-slate-700"
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-estoqueMin">Estoque Mínimo</Label>
                <Input
                  id="edit-estoqueMin"
                  type="number"
                  min="0"
                  value={editingProduct?.estoque_minimo === 0 ? "" : editingProduct?.estoque_minimo || ""}
                  onChange={(e) => {
                    const value = e.target.value === "" ? 0 : parseInt(e.target.value) || 0
                    setEditingProduct({ ...editingProduct, estoque_minimo: value })
                  }}
                  className="bg-slate-800/50 border-slate-700"
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-precoCompra">Preço de Compra</Label>
                <Input
                  id="edit-precoCompra"
                  type="number"
                  step="0.01"
                  min="0"
                  value={editingProduct?.preco_compra === 0 ? "" : editingProduct?.preco_compra || ""}
                  onChange={(e) => {
                    const value = e.target.value === "" ? 0 : parseFloat(e.target.value) || 0
                    setEditingProduct({ ...editingProduct, preco_compra: value })
                  }}
                  className="bg-slate-800/50 border-slate-700"
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-precoVenda">Preço de Venda</Label>
                <Input
                  id="edit-precoVenda"
                  type="number"
                  step="0.01"
                  min="0"
                  value={editingProduct?.preco_venda === 0 ? "" : editingProduct?.preco_venda || ""}
                  onChange={(e) => {
                    const value = e.target.value === "" ? 0 : parseFloat(e.target.value) || 0
                    setEditingProduct({ ...editingProduct, preco_venda: value })
                  }}
                  className="bg-slate-800/50 border-slate-700"
                  placeholder="0.00"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button className="bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-900" onClick={handleSaveEdit}>
              Salvar Alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Confirmação de Exclusão */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="bg-slate-900/95 backdrop-blur-sm border-red-500/20">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-400">Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o produto &quot;{deletingProduct?.nome}&quot;? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700 text-white" onClick={confirmDelete}>
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modal de Produto */}
      <ProdutoModal
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onSave={criarProduto}
      />
    </div>
  )
}